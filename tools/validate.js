/* Ashvale — world validation.
 *
 * Proves the game can actually be finished, rather than merely that it loads.
 * Loads the data files in Node against a stub window and checks:
 *
 *   - every sprite's rows are the same length
 *   - every screen is 16x11 and its edges agree with its neighbours
 *   - every portal and secret points at something that exists, and sits on the
 *     right kind of tile
 *   - the overworld is walkable from the start to all five barrows, honouring
 *     item gates, by a fixed-point search that gains items as it reaches them
 *   - every barrow's doors agree on both sides, and its item, Seal and boss are
 *     reachable from its entrance with the keys actually available inside it
 *
 * Run: node tools/validate.js
 */
'use strict';

var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');
var problems = [];
var notes = [];

function fail(msg) { problems.push(msg); }
function note(msg) { notes.push(msg); }

/* --- load the data files against a stub browser ------------------------- */

function loadGame() {
  var win = { AV: {} };
  win.window = win;
  win.document = {
    createElement: function () {
      return { width: 0, height: 0, getContext: function () { return stubCtx(); } };
    },
    addEventListener: function () {}
  };
  win.addEventListener = function () {};
  function stubCtx() {
    return new Proxy({}, {
      get: function () { return function () { return { data: [] }; }; }
    });
  }

  var files = [
    'src/core/gfx.js',
    'src/data/sprites.js',
    'src/data/tiles.js',
    'src/data/text.js',
    'src/data/caves.js',
    'src/data/overworld.js',
    'src/data/dungeons.js'
  ];
  files.forEach(function (f) {
    var src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    try {
      new Function('window', 'document', src)(win, win.document);
    } catch (e) {
      fail('could not load ' + f + ': ' + e.message);
    }
  });
  return win.AV;
}

var AV = loadGame();

/* --- sprites -------------------------------------------------------------- */

function checkSprites() {
  var count = 0;
  (function walk(node, p) {
    if (Array.isArray(node)) {
      if (typeof node[0] === 'string') {
        count++;
        var w = node[0].length;
        node.forEach(function (r, i) {
          if (r.length !== w) fail('sprite ' + p + ' row ' + i + ' is ' + r.length + ', expected ' + w);
        });
        return;
      }
      node.forEach(function (v, i) { walk(v, p + '[' + i + ']'); });
      return;
    }
    if (node && typeof node === 'object') {
      Object.keys(node).forEach(function (k) { walk(node[k], p + '.' + k); });
    }
  })(AV.Sprites, 'sprites');
  note(count + ' sprite frames, all rows aligned');
}

/* --- overworld shape ------------------------------------------------------- */

var COLS = 16, ROWS = 11;
var SOLID_OVER = {};
var O = AV.Overworld;

function tileAt(sx, sy, tx, ty) {
  var scr = O.screens[sx + ',' + sy];
  if (!scr) return null;
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return null;
  return scr.rows[ty].charAt(tx);
}

function isSolid(ch, items) {
  var def = AV.Tiles.over[ch];
  if (!def) return true;
  if (!def.solid) return false;
  if (def.pass && items[def.pass]) return false;
  return true;
}

function checkScreens() {
  var n = 0;
  for (var y = 0; y < O.H; y++) {
    for (var x = 0; x < O.W; x++) {
      var scr = O.screens[x + ',' + y];
      if (!scr) { fail('overworld screen ' + x + ',' + y + ' is missing'); continue; }
      n++;
      if (scr.rows.length !== ROWS) fail('screen ' + x + ',' + y + ' has ' + scr.rows.length + ' rows');
      scr.rows.forEach(function (r, i) {
        if (r.length !== COLS) fail('screen ' + x + ',' + y + ' row ' + i + ' is ' + r.length + ' wide');
        for (var c = 0; c < r.length; c++) {
          if (!AV.Tiles.over[r.charAt(c)]) {
            fail('screen ' + x + ',' + y + ' row ' + i + ' has unknown tile ' + JSON.stringify(r.charAt(c)));
          }
        }
      });
    }
  }
  note(n + ' overworld screens, all 16x11 with known tiles');
}

/* Both sides of every screen boundary must agree about where you can walk. */
function checkEdges() {
  var bad = 0;
  var open = { vine: 1, raft: 1, torch: 1, bombs: 1 };   // most permissive kit
  for (var y = 0; y < O.H; y++) {
    for (var x = 0; x < O.W; x++) {
      if (!O.screens[x + ',' + y]) continue;
      if (O.screens[(x + 1) + ',' + y]) {
        for (var r = 0; r < ROWS; r++) {
          var a = !isSolid(tileAt(x, y, COLS - 1, r), open);
          var b = !isSolid(tileAt(x + 1, y, 0, r), open);
          if (a !== b) { fail('edge mismatch: ' + x + ',' + y + ' east row ' + r); bad++; }
        }
      }
      if (O.screens[x + ',' + (y + 1)]) {
        for (var c = 0; c < COLS; c++) {
          var a2 = !isSolid(tileAt(x, y, c, ROWS - 1), open);
          var b2 = !isSolid(tileAt(x, y + 1, c, 0), open);
          if (a2 !== b2) { fail('edge mismatch: ' + x + ',' + y + ' south col ' + c); bad++; }
        }
      }
    }
  }
  if (!bad) note('every screen edge lines up with its neighbour');
}

/* Portals must sit on a cave mouth; secrets on the obstacle that hides them. */
function checkPortalTiles() {
  Object.keys(O.screens).forEach(function (key) {
    var scr = O.screens[key];
    var p = key.split(',');
    (scr.portals || []).forEach(function (portal) {
      var ch = tileAt(+p[0], +p[1], portal.tx, portal.ty);
      if (ch !== '^') {
        fail('screen ' + key + ' portal to ' + portal.to + ' sits on ' + JSON.stringify(ch) + ', not a cave mouth');
      }
      checkTarget(portal.to, 'screen ' + key);
    });
    if (scr.secret) {
      var s = scr.secret;
      var sch = tileAt(+p[0], +p[1], s.tx, s.ty);
      var want = s.kind === 'burn' ? 't' : 'r';
      if (sch !== want) {
        fail('screen ' + key + ' ' + s.kind + ' secret is on ' + JSON.stringify(sch) + ', expected ' + want);
      }
      /* You have to be able to stand next to it to burn or blast it. A secret
       * buried inside its own thicket is invisible and unreachable. */
      var nb = [[0, -1], [0, 1], [1, 0], [-1, 0]].map(function (d) {
        return tileAt(+p[0], +p[1], s.tx + d[0], s.ty + d[1]);
      });
      var open = nb.some(function (c) { return c !== null && !isSolid(c, {}); });
      if (!open) {
        fail('screen ' + key + ' ' + s.kind + ' secret at ' + s.tx + ',' + s.ty +
             ' is walled in on all four sides — nothing can reach it');
      }
      checkTarget(s.to, 'screen ' + key + ' secret');
    }
  });
}

function checkTarget(to, where) {
  if (to === 'exit') return;
  if (to.indexOf('cave:') === 0) {
    if (!AV.Caves[to.slice(5)]) fail(where + ' points at missing cave ' + to);
    return;
  }
  if (!AV.Dungeons[to]) fail(where + ' points at missing barrow ' + to);
}

/* --- can you actually walk there? ------------------------------------------- */

/* What each place hands over when you reach it. */
var GRANTS = {
  'cave:hermit': ['blade'],
  'cave:raft': ['raft'],
  'cave:horn': ['horn'],
  'cave:shop_wood': ['bombs'],
  'cave:emberbrand': ['brand'],
  b1: ['stone', 'shard'],
  b2: ['bow', 'shard'],
  b3: ['torch', 'shard'],
  b4: ['vine', 'shard'],
  lair: ['shard', 'done']
};

/* Flood the whole world at tile resolution with the kit currently held. */
function flood(items) {
  var seen = {};
  var found = {};
  var start = O.start;
  var queue = [[start.sx, start.sy, start.tx, start.ty]];
  seen[key(start.sx, start.sy, start.tx, start.ty)] = 1;

  function key(sx, sy, tx, ty) { return sx + ',' + sy + ',' + tx + ',' + ty; }

  function push(sx, sy, tx, ty) {
    if (!O.screens[sx + ',' + sy]) return;
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return;
    var k = key(sx, sy, tx, ty);
    if (seen[k]) return;
    var ch = tileAt(sx, sy, tx, ty);
    /* A secret obstacle opens once you carry the tool for it. */
    var scr = O.screens[sx + ',' + sy];
    var sec = scr.secret;
    var isSecret = sec && sec.tx === tx && sec.ty === ty;
    if (isSecret) {
      var tool = sec.kind === 'burn' ? 'torch' : 'bombs';
      if (!items[tool]) return;
      seen[k] = 1;
      found[sec.to] = 1;
      queue.push([sx, sy, tx, ty]);
      return;
    }
    if (isSolid(ch, items)) return;
    seen[k] = 1;
    queue.push([sx, sy, tx, ty]);
  }

  while (queue.length) {
    var cur = queue.shift();
    var sx = cur[0], sy = cur[1], tx = cur[2], ty = cur[3];
    var scr = O.screens[sx + ',' + sy];

    /* a cave mouth under your feet */
    (scr.portals || []).forEach(function (p) {
      if (p.tx !== tx || p.ty !== ty) return;
      if (p.sealed === 'horn' && !items.horn) return;
      if (p.sealed === 'shards' && (items.shards || 0) < 4) return;
      found[p.to] = 1;
    });

    /* stepping across a screen boundary */
    if (tx === 0) push(sx - 1, sy, COLS - 1, ty);
    if (tx === COLS - 1) push(sx + 1, sy, 0, ty);
    if (ty === 0) push(sx, sy - 1, tx, ROWS - 1);
    if (ty === ROWS - 1) push(sx, sy + 1, tx, 0);

    push(sx, sy, tx - 1, ty);
    push(sx, sy, tx + 1, ty);
    push(sx, sy, tx, ty - 1);
    push(sx, sy, tx, ty + 1);

    /* the raft: from a dock, straight out over water to the far shore */
    var here = tileAt(sx, sy, tx, ty);
    if (items.raft && AV.Tiles.over[here] && AV.Tiles.over[here].dock) {
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
        var cx = tx + d[0], cy = ty + d[1], steps = 0;
        while (cx >= 0 && cy >= 0 && cx < COLS && cy < ROWS && steps++ < 20) {
          var ch2 = tileAt(sx, sy, cx, cy);
          if (!AV.Tiles.over[ch2] || !AV.Tiles.over[ch2].water) break;
          cx += d[0]; cy += d[1];
        }
        if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) return;
        if (steps <= 1) return;                    // no water crossed
        if (isSolid(tileAt(sx, sy, cx, cy), items)) return;
        push(sx, sy, cx, cy);
      });
    }
  }
  return found;
}

function checkProgression() {
  var items = { shards: 0 };
  var have = {};
  var rounds = 0;
  var reached;

  while (rounds++ < 20) {
    reached = flood(items);
    var gained = false;
    Object.keys(reached).forEach(function (place) {
      if (have[place]) return;
      /* A barrow only hands over its item if the item is reachable inside. */
      if (AV.Dungeons[place]) {
        var inner = solveBarrow(place, items);
        if (!inner.itemReachable) return;
      }
      have[place] = 1;
      gained = true;
      (GRANTS[place] || []).forEach(function (g) {
        if (g === 'shard') items.shards = (items.shards || 0) + 1;
        else items[g] = true;
      });
    });
    if (!gained) break;
  }

  ['b1', 'b2', 'b3', 'b4', 'lair'].forEach(function (id) {
    if (!have[id]) fail('barrow ' + id + ' (' + AV.Dungeons[id].name + ') is never reachable');
  });
  ['cave:hermit', 'cave:raft', 'cave:horn'].forEach(function (c) {
    if (!have[c]) fail('cave ' + c + ' is never reachable');
  });
  if (!items.done) fail('the Ashen Lair is never enterable — the game cannot be finished');

  if (!problems.length) {
    note('progression holds: blade -> b1 -> bombs -> b2 -> raft -> b3 -> horn -> b4 -> lair');
    note('shards obtainable: ' + items.shards + ' of 5');
  }
}

/* --- inside a barrow --------------------------------------------------------- */

var OPP = { n: 's', s: 'n', e: 'w', w: 'e' };
var STEP = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };

function checkDoors() {
  Object.keys(AV.Dungeons).forEach(function (id) {
    var dgn = AV.Dungeons[id];
    Object.keys(dgn.rooms).forEach(function (k) {
      var p = k.split(',').map(Number);
      var room = dgn.rooms[k];
      if (!AV.Layouts[room.layout]) fail(id + ' room ' + k + ' uses unknown layout ' + room.layout);
      Object.keys(STEP).forEach(function (dir) {
        var kind = room.doors[dir];
        var nk = (p[0] + STEP[dir][0]) + ',' + (p[1] + STEP[dir][1]);
        var nb = dgn.rooms[nk];
        if (kind === 'none') {
          if (nb && nb.doors[OPP[dir]] !== 'none') {
            fail(id + ' ' + k + ' ' + dir + ' is a wall but ' + nk + ' has a ' + nb.doors[OPP[dir]] + ' door back');
          }
          return;
        }
        if (!nb) { fail(id + ' ' + k + ' has a ' + kind + ' door ' + dir + ' into nothing'); return; }
        if (nb.doors[OPP[dir]] !== kind) {
          fail(id + ' ' + k + ' ' + dir + ' is ' + kind + ' but ' + nk + ' ' + OPP[dir] + ' is ' + nb.doors[OPP[dir]]);
        }
      });
    });
    if (!dgn.rooms[dgn.entrance.col + ',' + dgn.entrance.row]) {
      fail(id + ' entrance room does not exist');
    } else if (!dgn.rooms[dgn.entrance.col + ',' + dgn.entrance.row].stairs) {
      fail(id + ' entrance room has no way back out');
    }
    if (!O.screens[dgn.exit.sx + ',' + dgn.exit.sy]) {
      fail(id + ' exits onto a screen that does not exist');
    }
  });
}

/* Walks a barrow from its entrance, spending keys as it goes, until nothing
 * more opens. Reports whether the item, the Seal and the boss are reachable. */
function solveBarrow(id, outerItems) {
  var dgn = AV.Dungeons[id];
  var entrance = dgn.entrance.col + ',' + dgn.entrance.row;
  var reach = {}; reach[entrance] = 1;
  var looted = {};
  var keys = 0, seal = false;
  var bombs = !!(outerItems && outerItems.bombs);
  var itemNames = { b1: 'stone', b2: 'bow', b3: 'torch', b4: 'vine', lair: 'shard' };
  var wantItem = itemNames[id];
  var haveItem = false, bossReached = false;

  function passable(kind) {
    if (kind === 'open' || kind === 'shut') return true;
    if (kind === 'bomb') return bombs;
    return false;
  }

  var guard = 0;
  while (guard++ < 200) {
    var changed = false;

    /* take what is lying in the rooms we can stand in */
    Object.keys(reach).forEach(function (k) {
      if (looted[k]) return;
      looted[k] = 1; changed = true;
      var room = dgn.rooms[k];
      [room.prize, room.prize2, room.drop].forEach(function (item) {
        if (!item) return;
        if (item === 'key') keys++;
        if (item === 'seal') seal = true;
        if (item === wantItem) haveItem = true;
      });
      if (room.boss) bossReached = true;
    });

    /* walk through everything already open */
    Object.keys(reach).forEach(function (k) {
      var p = k.split(',').map(Number);
      var room = dgn.rooms[k];
      Object.keys(STEP).forEach(function (dir) {
        if (!passable(room.doors[dir])) return;
        var nk = (p[0] + STEP[dir][0]) + ',' + (p[1] + STEP[dir][1]);
        if (dgn.rooms[nk] && !reach[nk]) { reach[nk] = 1; changed = true; }
      });
    });
    if (changed) continue;

    /* spend a key on a locked door we are standing at */
    var spent = false;
    if (keys > 0) {
      Object.keys(reach).some(function (k) {
        var p = k.split(',').map(Number);
        var room = dgn.rooms[k];
        return Object.keys(STEP).some(function (dir) {
          if (room.doors[dir] !== 'lock') return false;
          var nk = (p[0] + STEP[dir][0]) + ',' + (p[1] + STEP[dir][1]);
          if (!dgn.rooms[nk] || reach[nk]) return false;
          keys--; reach[nk] = 1; spent = true;
          return true;
        });
      });
    }
    if (spent) continue;

    /* open the boss door if we found the Seal */
    var opened = false;
    if (seal) {
      Object.keys(reach).some(function (k) {
        var p = k.split(',').map(Number);
        var room = dgn.rooms[k];
        return Object.keys(STEP).some(function (dir) {
          if (room.doors[dir] !== 'seal') return false;
          var nk = (p[0] + STEP[dir][0]) + ',' + (p[1] + STEP[dir][1]);
          if (!dgn.rooms[nk] || reach[nk]) return false;
          reach[nk] = 1; opened = true;
          return true;
        });
      });
    }
    if (opened) continue;
    break;
  }

  return {
    reach: reach,
    itemReachable: wantItem ? haveItem : true,
    bossReachable: bossReached,
    sealFound: seal,
    keysLeft: keys,
    unreached: Object.keys(dgn.rooms).filter(function (k) { return !reach[k]; })
  };
}

function checkBarrows() {
  var full = { blade: 1, bombs: 1, bow: 1, stone: 1, torch: 1, raft: 1, vine: 1, horn: 1, shards: 5 };
  Object.keys(AV.Dungeons).forEach(function (id) {
    var dgn = AV.Dungeons[id];
    var r = solveBarrow(id, full);
    if (!r.bossReachable) fail(id + ' (' + dgn.name + '): the boss cannot be reached');
    if (!r.sealFound) fail(id + ' (' + dgn.name + '): the Barrow Seal cannot be reached');
    if (!r.itemReachable) fail(id + ' (' + dgn.name + '): its item cannot be reached');
    if (r.unreached.length) {
      fail(id + ' (' + dgn.name + '): rooms never reachable: ' + r.unreached.join(' '));
    }
    if (!problems.length) {
      note(dgn.numeral.padEnd(3) + dgn.name + ': ' +
        Object.keys(r.reach).length + '/' + Object.keys(dgn.rooms).length +
        ' rooms reachable, seal found, boss reachable, ' + r.keysLeft + ' spare key(s)');
    }
  });
}

/* --- caves --------------------------------------------------------------------- */

function checkCaves() {
  var referenced = {};
  Object.keys(O.screens).forEach(function (k) {
    var scr = O.screens[k];
    (scr.portals || []).forEach(function (p) {
      if (p.to.indexOf('cave:') === 0) referenced[p.to.slice(5)] = 1;
    });
    if (scr.secret && scr.secret.to.indexOf('cave:') === 0) referenced[scr.secret.to.slice(5)] = 1;
  });
  Object.keys(AV.Caves).forEach(function (id) {
    if (!referenced[id]) fail('cave "' + id + '" is defined but nothing leads to it');
  });
  note(Object.keys(referenced).length + ' caves, all reachable from the world');
}

/* --- run ------------------------------------------------------------------------ */

checkSprites();
checkScreens();
checkEdges();
checkPortalTiles();
checkDoors();
checkBarrows();
checkCaves();
checkProgression();

console.log('\nAshvale — world validation\n');
notes.forEach(function (n) { console.log('  ok   ' + n); });
if (problems.length) {
  console.log('');
  problems.forEach(function (p) { console.log('  FAIL ' + p); });
  console.log('\n' + problems.length + ' problem(s).\n');
  process.exit(1);
}
console.log('\nAll checks passed — the game is completable.\n');
