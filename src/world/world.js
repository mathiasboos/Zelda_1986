/* Ashvale — the world.
 * Owns whatever place Kaelen is standing in: an overworld screen, a barrow
 * room, or a cave. Builds the 16x11 tile grid for it, answers collision
 * questions, and remembers the permanent marks the player leaves — burnt brush,
 * blasted rock, doors forced open, caches emptied. */
(function (AV) {
  'use strict';

  var T = 16, COLS = 16, ROWS = 11;
  var PW = COLS * T, PH = ROWS * T;

  /* Barrow rooms are a 12x7 interior inside a two-tile wall. Doorways sit at
   * cols 7-8 north and south, and row 5 east and west. */
  var IN_X = 2, IN_Y = 2, IN_W = 12, IN_H = 7;
  var DOOR = {
    n: { tiles: [[7, 0], [8, 0], [7, 1], [8, 1]], x: 7 * T, y: 0, w: 2 * T, h: 2 * T },
    s: { tiles: [[7, 9], [8, 9], [7, 10], [8, 10]], x: 7 * T, y: 9 * T, w: 2 * T, h: 2 * T },
    e: { tiles: [[14, 5], [15, 5]], x: 14 * T, y: 5 * T, w: 2 * T, h: T },
    w: { tiles: [[0, 5], [1, 5]], x: 0, y: 5 * T, w: 2 * T, h: T }
  };
  var OPP = { n: 's', s: 'n', e: 'w', w: 'e' };
  var STEP = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };

  /* One room, used by every cave: a lit chamber with the way out at the foot. */
  var CAVE_ROWS = [
    '################',
    '################',
    '##............##',
    '##............##',
    '##............##',
    '##............##',
    '##............##',
    '##............##',
    '##......^.....##',
    '################',
    '################'
  ];

  var World = {
    T: T, COLS: COLS, ROWS: ROWS, PW: PW, PH: PH,
    DOOR: DOOR, OPP: OPP, STEP: STEP,

    kind: 'over',      // 'over' | 'dgn' | 'cave'
    id: null,          // barrow id, or cave id
    sx: 0, sy: 0,      // overworld screen, or barrow room col/row
    theme: 'wood',
    indoors: false,
    dark: false,
    data: null,        // the screen / room / cave definition
    grid: null,        // ROWS arrays of COLS characters
    portals: null      // resolved portals for this screen
  };

  function save() { return AV.Game.save; }

  /* --- keys into the save's memory ------------------------------------- */

  World.placeKey = function () {
    if (World.kind === 'over') return 'o' + World.sx + ',' + World.sy;
    if (World.kind === 'dgn') return World.id + ':' + World.sx + ',' + World.sy;
    return 'c' + World.id;
  };

  World.barrow = function (id) {
    var s = save();
    id = id || World.id;
    if (!s.barrows[id]) s.barrows[id] = AV.Save.barrowState();
    return s.barrows[id];
  };

  /* --- grid construction ------------------------------------------------ */

  function applyOverrides(grid) {
    var over = save().tiles[World.placeKey()];
    if (!over) return;
    for (var k in over) {
      if (!over.hasOwnProperty(k)) continue;
      var p = k.split(',');
      var tx = +p[0], ty = +p[1];
      if (grid[ty]) grid[ty][tx] = over[k];
    }
  }

  function rowsToGrid(rows) {
    var g = [];
    for (var y = 0; y < rows.length; y++) g.push(rows[y].split(''));
    return g;
  }

  /* True when a door should be standing open right now. */
  World.doorOpen = function (dgnId, roomKey, dir, room) {
    var kind = room.doors[dir];
    if (kind === 'none') return false;
    if (kind === 'open') return true;
    var b = World.barrow(dgnId);
    if (b.doors[roomKey + dir]) return true;
    if (kind === 'shut') return !!save().cleared[dgnId + ':' + roomKey];
    return false;   // lock / seal / bomb stay shut until forced
  };

  World.forceDoor = function (dir) {
    var b = World.barrow();
    var key = World.sx + ',' + World.sy;
    b.doors[key + dir] = true;
    /* Open it from the far side too, so it does not slam behind you. */
    var st = STEP[dir];
    var nk = (World.sx + st[0]) + ',' + (World.sy + st[1]);
    b.doors[nk + OPP[dir]] = true;
  };

  function buildRoomGrid(dgn, roomKey, room) {
    var g = [];
    var y, x;
    for (y = 0; y < ROWS; y++) {
      g.push([]);
      for (x = 0; x < COLS; x++) g[y].push('#');
    }
    var layout = AV.Layouts[room.layout] || AV.Layouts.empty;
    for (y = 0; y < IN_H; y++) {
      for (x = 0; x < IN_W; x++) g[IN_Y + y][IN_X + x] = layout[y].charAt(x);
    }
    for (var dir in DOOR) {
      if (room.doors[dir] === 'none') continue;
      if (!World.doorOpen(dgn, roomKey, dir, room)) continue;
      var t = DOOR[dir].tiles;
      for (var i = 0; i < t.length; i++) g[t[i][1]][t[i][0]] = '.';
    }
    /* The stairs out sit in the middle of the entrance room. */
    if (room.stairs) g[5][7] = '^';
    return g;
  }

  /* --- entering places -------------------------------------------------- */

  World.enterOver = function (sx, sy) {
    var scr = AV.Overworld.screens[sx + ',' + sy];
    World.kind = 'over'; World.id = null;
    World.sx = sx; World.sy = sy;
    World.data = scr;
    World.theme = scr.theme;
    World.indoors = false;
    World.dark = false;
    World.grid = rowsToGrid(scr.rows);
    applyOverrides(World.grid);
    World.portals = (scr.portals || []).slice();
    /* A secret already found leaves a permanent way in. */
    var sec = scr.secret;
    if (sec && save().secrets[World.placeKey()]) {
      World.portals.push({ tx: sec.tx, ty: sec.ty, to: sec.to });
    }
    return scr;
  };

  World.enterRoom = function (dgnId, col, row) {
    var dgn = AV.Dungeons[dgnId];
    var key = col + ',' + row;
    var room = dgn.rooms[key];
    World.kind = 'dgn'; World.id = dgnId;
    World.sx = col; World.sy = row;
    World.data = room;
    World.theme = dgn.theme;
    World.indoors = true;
    World.dark = !!room.dark && !save().items.torch;
    World.grid = buildRoomGrid(dgnId, key, room);
    applyOverrides(World.grid);
    World.portals = room.stairs ? [{ tx: 7, ty: 5, to: 'exit' }] : [];
    return room;
  };

  World.enterCave = function (caveId) {
    var cave = AV.Caves[caveId];
    World.kind = 'cave'; World.id = caveId;
    World.sx = 0; World.sy = 0;
    World.data = cave;
    World.theme = 'cave';
    World.indoors = true;
    World.dark = false;
    World.grid = rowsToGrid(CAVE_ROWS);
    World.portals = [{ tx: 8, ty: 8, to: 'exit' }];
    return cave;
  };

  /* --- tile access ------------------------------------------------------ */

  World.tile = function (tx, ty) {
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return World.indoors ? '#' : 'M';
    return World.grid[ty][tx];
  };

  /* Writes a tile and remembers it, so a burnt bush stays burnt. */
  World.setTile = function (tx, ty, ch, permanent) {
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return;
    World.grid[ty][tx] = ch;
    if (permanent === false) return;
    var s = save();
    var k = World.placeKey();
    if (!s.tiles[k]) s.tiles[k] = {};
    s.tiles[k][tx + ',' + ty] = ch;
  };

  World.has = function (item) {
    var s = save();
    return !!(s.items && s.items[item]);
  };

  World.solidTile = function (ch) {
    return AV.Tiles.isSolid(ch, World.indoors, World.has);
  };

  World.solidAt = function (px, py) {
    return World.solidTile(World.tile((px / T) | 0, (py / T) | 0));
  };

  /* Box against the tile grid. Corners are enough at these sizes: no box is
   * wider than a tile, so it can never straddle one without touching a corner. */
  World.boxSolid = function (x, y, w, h) {
    var x0 = x, x1 = x + w - 1, y0 = y, y1 = y + h - 1;
    return World.solidAt(x0, y0) || World.solidAt(x1, y0) ||
           World.solidAt(x0, y1) || World.solidAt(x1, y1);
  };

  World.boxOutside = function (x, y, w, h) {
    return x < 0 || y < 0 || x + w > PW || y + h > PH;
  };

  /* Tiles nothing is standing on — used to place enemies and dropped items. */
  World.freeTiles = function (avoidX, avoidY, minDist) {
    var out = [];
    var lo = World.indoors ? IN_X : 1;
    var hiX = World.indoors ? IN_X + IN_W : COLS - 1;
    var loY = World.indoors ? IN_Y : 1;
    var hiY = World.indoors ? IN_Y + IN_H : ROWS - 1;
    for (var ty = loY; ty < hiY; ty++) {
      for (var tx = lo; tx < hiX; tx++) {
        if (World.solidTile(World.grid[ty][tx])) continue;
        if (World.grid[ty][tx] === '^') continue;
        if (avoidX !== undefined) {
          var dx = tx * T + T / 2 - avoidX, dy = ty * T + T / 2 - avoidY;
          if (Math.sqrt(dx * dx + dy * dy) < (minDist || 48)) continue;
        }
        out.push({ tx: tx, ty: ty, x: tx * T, y: ty * T });
      }
    }
    return out;
  };

  /* --- doors ------------------------------------------------------------ */

  /* Which doorway, if any, the given box is pressed against in direction dir. */
  World.doorwayAt = function (x, y, w, h, dir) {
    if (World.kind !== 'dgn') return null;
    var d = DOOR[dir];
    var room = World.data;
    if (!room.doors || room.doors[dir] === 'none') return null;
    /* Overlap test against the doorway's mouth. */
    if (x + w <= d.x || x >= d.x + d.w) return null;
    if (y + h <= d.y || y >= d.y + d.h) return null;
    return room.doors[dir];
  };

  World.roomCleared = function () {
    return !!save().cleared[World.id + ':' + World.sx + ',' + World.sy];
  };

  World.markCleared = function () {
    save().cleared[World.id + ':' + World.sx + ',' + World.sy] = true;
  };

  /* --- portals and secrets ---------------------------------------------- */

  World.portalAt = function (tx, ty) {
    var p = World.portals;
    for (var i = 0; i < p.length; i++) {
      if (p[i].tx === tx && p[i].ty === ty) return p[i];
    }
    return null;
  };

  /* Called when brush burns or cracked rock blows open. Returns a portal if the
   * spot was hiding one. */
  World.revealAt = function (tx, ty, how) {
    var scr = World.data;
    var sec = scr && scr.secret;
    if (sec && sec.kind === how && sec.tx === tx && sec.ty === ty) {
      save().secrets[World.placeKey()] = true;
      World.setTile(tx, ty, '^');
      var p = { tx: tx, ty: ty, to: sec.to };
      World.portals.push(p);
      return p;
    }
    /* Not a secret — the obstacle just goes away. */
    var def = AV.Tiles.def(World.tile(tx, ty), World.indoors);
    var becomes = how === 'burn' ? def.burn : def.bomb;
    if (becomes) World.setTile(tx, ty, becomes);
    return null;
  };

  /* Blowing a wall open inside a barrow. */
  World.bombWall = function (dir) {
    if (World.kind !== 'dgn') return false;
    var room = World.data;
    if (!room.doors || room.doors[dir] !== 'bomb') return false;
    if (World.doorOpen(World.id, World.sx + ',' + World.sy, dir, room)) return false;
    World.forceDoor(dir);
    World.grid = buildRoomGrid(World.id, World.sx + ',' + World.sy, room);
    applyOverrides(World.grid);
    return true;
  };

  World.rebuild = function () {
    if (World.kind === 'dgn') {
      World.grid = buildRoomGrid(World.id, World.sx + ',' + World.sy, World.data);
      applyOverrides(World.grid);
    }
  };

  /* --- drawing ----------------------------------------------------------- */

  /* Draws the tile grid at an offset (the scroll transition slides two of
   * these past each other). */
  World.drawGrid = function (grid, theme, indoors, ox, oy, sx, sy) {
    var g = AV.Gfx;
    for (var ty = 0; ty < ROWS; ty++) {
      for (var tx = 0; tx < COLS; tx++) {
        var ch = grid[ty][tx];
        var img = AV.Tiles.image(ch, theme, indoors, sx * COLS + tx, sy * ROWS + ty);
        g.draw(img, ox + tx * T, oy + ty * T);
      }
    }
  };

  World.draw = function (ox, oy) {
    World.drawGrid(World.grid, World.theme, World.indoors, ox, oy, World.sx, World.sy);
    if (World.kind === 'dgn') World.drawDoors(ox, oy);
  };

  /* Closed doors are painted over the wall so the player can read a room at a
   * glance: bars for a room-lock, a keyhole for a Barrow Key, a sigil for the
   * Seal. Bombable walls are painted as nothing at all. */
  World.drawDoors = function (ox, oy) {
    var room = World.data;
    var g = AV.Gfx, C = g.COLORS;
    var key = World.sx + ',' + World.sy;
    for (var dir in DOOR) {
      var kind = room.doors[dir];
      if (kind === 'none' || kind === 'bomb') continue;
      if (World.doorOpen(World.id, key, dir, room)) {
        drawFrame(ox, oy, dir);
        continue;
      }
      if (kind === 'open') continue;
      var d = DOOR[dir];
      var x = ox + d.x, y = oy + d.y, w = d.w, h = d.h;
      g.rect(x, y, w, h, C['2']);
      g.frame(x, y, w, h, C['0']);
      if (kind === 'shut') {
        /* bars */
        var vertical = (dir === 'n' || dir === 's');
        var n = vertical ? 4 : 3;
        for (var i = 1; i <= n; i++) {
          if (vertical) g.rect(x + i * (w / (n + 1)) | 0, y + 2, 2, h - 4, C['4']);
          else g.rect(x + 2, (y + i * (h / (n + 1))) | 0, w - 4, 2, C['4']);
        }
      } else if (kind === 'lock') {
        g.rect(x + w / 2 - 3, y + h / 2 - 4, 6, 8, C['d']);
        g.rect(x + w / 2 - 1, y + h / 2 - 2, 2, 5, C['0']);
      } else if (kind === 'seal') {
        g.rect(x + w / 2 - 5, y + h / 2 - 5, 10, 10, C['q']);
        g.rect(x + w / 2 - 3, y + h / 2 - 3, 6, 6, C['s']);
        g.rect(x + w / 2 - 1, y + h / 2 - 1, 2, 2, C['8']);
      }
    }

    function drawFrame(ox, oy, dir) {
      var d = DOOR[dir], C = AV.Gfx.COLORS;
      var x = ox + d.x, y = oy + d.y;
      if (dir === 'n' || dir === 's') {
        AV.Gfx.rect(x - 2, y, 2, d.h, C['0']);
        AV.Gfx.rect(x + d.w, y, 2, d.h, C['0']);
      } else {
        AV.Gfx.rect(x, y - 2, d.w, 2, C['0']);
        AV.Gfx.rect(x, y + d.h, d.w, 2, C['0']);
      }
    }
  };

  AV.World = World;
})(window.AV = window.AV || {});
