/* Ashvale — browser verification.
 *
 * Opens index.html straight off the filesystem (the same way a player would),
 * drives it with real key presses, and screenshots each beat. Any console
 * error, page exception or failed assertion fails the run.
 *
 * Uses the Chromium already on the machine — never downloads one.
 *
 * Run: node tools/verify.js [outputDir]
 */
'use strict';

var path = require('path');
var fs = require('fs');
var { execSync } = require('child_process');

/* Playwright is installed globally here, so resolve it from the global root. */
function loadPlaywright() {
  try { return require('playwright'); } catch (e) { /* keep looking */ }
  var root;
  try { root = execSync('npm root -g', { encoding: 'utf8' }).trim(); } catch (e) { root = null; }
  if (root) {
    try { return require(path.join(root, 'playwright')); } catch (e) { /* fall through */ }
  }
  throw new Error('playwright not found — install it or run from a machine that has it');
}

var ROOT = path.join(__dirname, '..');
var OUT = process.argv[2] || path.join(ROOT, '.verify');
var PAGE = 'file://' + path.join(ROOT, 'index.html');

var failures = [];
var steps = [];

function check(name, ok, detail) {
  steps.push({ name: name, ok: ok, detail: detail });
  if (!ok) failures.push(name + (detail ? ' — ' + detail : ''));
}

(async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  var { chromium } = loadPlaywright();

  var browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM || undefined,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--mute-audio', '--autoplay-policy=no-user-gesture-required']
  });
  var page = await browser.newPage({ viewport: { width: 900, height: 900 } });

  var consoleErrors = [];
  var pageErrors = [];
  page.on('console', function (m) {
    if (m.type() === 'error' || m.type() === 'warning') consoleErrors.push(m.type() + ': ' + m.text());
  });
  page.on('pageerror', function (e) { pageErrors.push(String(e && e.message || e)); });

  var shotN = 0;
  async function shot(name) {
    shotN++;
    var file = path.join(OUT, String(shotN).padStart(2, '0') + '-' + name + '.png');
    var el = await page.$('#screen');
    if (el) await el.screenshot({ path: file });
    else await page.screenshot({ path: file });
    return file;
  }
  async function key(k, times, gap) {
    times = times || 1;
    for (var i = 0; i < times; i++) {
      await page.keyboard.press(k);
      await page.waitForTimeout(gap || 40);
    }
  }
  async function hold(k, ms) {
    await page.keyboard.down(k);
    await page.waitForTimeout(ms);
    await page.keyboard.up(k);
  }
  function state() {
    return page.evaluate(function () {
      if (!window.AV || !window.AV.Game) return null;
      var g = window.AV.Game, w = window.AV.World, p = window.AV.Play;
      return {
        mode: g.mode,
        booted: g.booted,
        frames: g.frames,
        area: w.kind, id: w.id, sx: w.sx, sy: w.sy,
        hearts: g.save && g.save.hearts,
        maxHearts: g.save && g.save.maxHearts,
        shards: g.save && g.save.shards,
        entities: p.entities.length,
        px: p.player ? Math.round(p.player.x) : null,
        py: p.player ? Math.round(p.player.y) : null
      };
    });
  }

  await page.goto(PAGE, { waitUntil: 'load' });
  await page.waitForTimeout(700);
  await page.click('#screen');

  /* --- boot --- */
  var s = await state();
  check('game boots from file://', !!(s && s.booted), s ? 'mode=' + s.mode : 'window.AV missing');
  check('title screen is up', !!s && s.mode === 'title', s && s.mode);
  check('frames are advancing', !!s && s.frames > 10, s && ('frames=' + s.frames));
  await shot('title');

  /* --- title -> file select -> crawl -> play --- */
  await key('z'); await page.waitForTimeout(250);
  s = await state();
  check('file select opens', s.mode === 'file', s.mode);
  await shot('file-select');

  await key('z'); await page.waitForTimeout(300);
  s = await state();
  check('new tale starts the crawl', s.mode === 'crawl', s.mode);
  await page.waitForTimeout(900);
  await shot('crawl');

  await key('z'); await page.waitForTimeout(400);
  s = await state();
  check('play begins on the overworld', s.mode === 'play' && s.area === 'over', s.mode + '/' + s.area);
  check('starts in the Emberwood', s.sx === 1 && s.sy === 3, s.sx + ',' + s.sy);
  check('starts with three embers', s.hearts === 6 && s.maxHearts === 6, s.hearts + '/' + s.maxHearts);
  await shot('overworld-start');

  /* --- moving and fighting --- */
  var before = await state();
  await hold('ArrowLeft', 500);
  var after = await state();
  check('Kaelen moves', after.px !== before.px, 'x ' + before.px + ' -> ' + after.px);

  await page.evaluate(function () {
    /* the Hermit's cave is on this screen; take the blade so we can swing it */
    window.AV.Game.save.items.blade = true;
  });
  await key('z'); await page.waitForTimeout(120);
  await shot('blade-swing');

  /* --- a cave, with someone in it --- */
  await page.evaluate(function () { window.AV.Play.loadCave('hermit'); });
  await page.waitForTimeout(200);
  s = await state();
  check('caves load', s.area === 'cave', s.area);
  await shot('cave-hermit');

  await page.evaluate(function () { window.AV.Play.loadCave('shop_wood'); });
  await page.waitForTimeout(200);
  await shot('cave-shop');

  /* --- a barrow --- */
  await page.evaluate(function () {
    var g = window.AV.Game;
    g.save.items.blade = true; g.save.items.bombs = true; g.save.bombs = 8;
    g.save.items.bow = true; g.save.quarrels = 20;
    g.save.items.stone = true; g.save.items.torch = true;
    g.save.maxHearts = 12; g.save.hearts = 12;
    g.enterBarrow('b1', 3, 4, 118, 90, 'up');
    g.setMode('play');
  });
  await page.waitForTimeout(400);
  s = await state();
  check('barrow rooms load', s.area === 'dgn' && s.id === 'b1', s.area + '/' + s.id);
  check('the room has enemies in it', s.entities > 0, 'entities=' + s.entities);
  await shot('barrow-room');

  /* --- every boss draws and takes damage --- */
  var bosses = [['b1', 3, 1], ['b2', 3, 1], ['b3', 3, 1], ['b4', 3, 0], ['lair', 3, 1]];
  for (var i = 0; i < bosses.length; i++) {
    var b = bosses[i];
    await page.evaluate(function (b) {
      var g = window.AV.Game;
      g.save.shards = 5;
      g.save.barrows = {};
      g.enterBarrow(b[0], b[1], b[2], 118, 130, 'up');
      g.setMode('play');
    }, b);
    await page.waitForTimeout(500);
    var info = await page.evaluate(function () {
      var e = window.AV.Play.entities.filter(function (x) { return x.kind === 'boss'; })[0];
      return e ? { title: e.title, hp: e.hp, max: e.maxHp } : null;
    });
    check('boss spawns in ' + b[0], !!info, info ? info.title : 'no boss entity');
    await shot('boss-' + b[0]);
  }

  /* --- a dark room without the torch --- */
  await page.evaluate(function () {
    var g = window.AV.Game;
    g.save.items.torch = false;
    g.save.barrows = {};
    g.enterBarrow('b3', 3, 2, 118, 130, 'up');
    g.setMode('play');
  });
  await page.waitForTimeout(350);
  var dark = await page.evaluate(function () { return window.AV.World.dark; });
  check('dark rooms are dark without a torch', dark === true, 'dark=' + dark);
  await shot('barrow-dark');

  /* --- subscreen --- */
  await page.evaluate(function () {
    var g = window.AV.Game;
    g.save.items.torch = true;
    g.toOverworld(1, 3, 118, 100, 'down');
    g.setMode('play');
  });
  await page.waitForTimeout(200);
  await key('Enter'); await page.waitForTimeout(250);
  s = await state();
  check('subscreen opens', s.mode === 'subscreen', s.mode);
  await shot('subscreen');
  await key('Enter'); await page.waitForTimeout(200);
  s = await state();
  check('subscreen closes', s.mode === 'play', s.mode);

  /* --- screen scrolling --- */
  await page.evaluate(function () {
    window.AV.Game.toOverworld(1, 3, 240, 88, 'right');
    window.AV.Game.setMode('play');
  });
  await page.waitForTimeout(150);
  await hold('ArrowRight', 700);
  await page.waitForTimeout(700);
  s = await state();
  check('walking off a screen moves you to the next', s.sx === 2 && s.sy === 3, s.sx + ',' + s.sy);
  await shot('after-scroll');

  /* --- saving --- */
  var saved = await page.evaluate(function () {
    window.AV.Game.persist();
    var raw = window.localStorage.getItem('ashvale.tale.0');
    return raw ? JSON.parse(raw) : null;
  });
  check('progress is saved', !!saved && saved.v === 1, saved ? 'v=' + saved.v : 'nothing written');

  /* --- death and the ending --- */
  await page.evaluate(function () {
    var g = window.AV.Game;
    g.save.hearts = 0;
    window.AV.Play.player.dead = true;
  });
  await page.waitForTimeout(400);
  s = await state();
  check('death takes you to the game-over screen', s.mode === 'dead', s.mode);
  await page.waitForTimeout(1900);
  await shot('game-over');
  await key('z'); await page.waitForTimeout(400);
  s = await state();
  check('continue puts you back in play', s.mode === 'play', s.mode);

  await page.evaluate(function () { window.AV.Game.setMode('ending'); });
  await page.waitForTimeout(2600);
  await shot('ending');

  /* --- the mechanics that make it this game and not another one --- */

  async function scene(setup, arg) {
    await page.evaluate(setup, arg);
    await page.waitForTimeout(120);
  }

  /* the blade kills, and something falls out */
  await scene(function () {
    var g = window.AV.Game, P = window.AV.Play;
    g.toOverworld(1, 3, 112, 96, 'right');
    g.setMode('play');
    g.save.items.blade = true; g.save.maxHearts = 12; g.save.hearts = 12;
    P.entities.length = 0;
    var f = window.AV.Foes.make('grubling', 130, 96);
    f.spawnGuard = 0;
    P.add(f);
    P.player.x = 112; P.player.y = 96; P.player.dir = 'right'; P.player.invuln = 600;
  });
  await key('z');
  await page.waitForTimeout(400);
  var foesLeft = await page.evaluate(function () {
    return window.AV.Play.entities.filter(function (e) { return e.kind === 'foe'; }).length;
  });
  check('the blade kills what it hits', foesLeft === 0, foesLeft + ' still standing');
  await shot('combat-kill');

  /* walking over a glimmer picks it up */
  await scene(function () {
    var g = window.AV.Game, P = window.AV.Play;
    g.save.glimmers = 0;
    P.entities.length = 0;
    P.add(window.AV.Pickups.make('glimmer', P.player.cx(), P.player.cy()));
  });
  await page.waitForTimeout(200);
  var glim = await page.evaluate(function () { return window.AV.Game.save.glimmers; });
  check('pickups are collected', glim === 1, 'glimmers=' + glim);

  /* a foe that touches you costs embers */
  await scene(function () {
    var g = window.AV.Game, P = window.AV.Play;
    g.save.hearts = 12;
    P.entities.length = 0;
    P.player.invuln = 0;
    var f = window.AV.Foes.make('bristler', P.player.x, P.player.y);
    f.spawnGuard = 0;
    P.add(f);
  });
  await page.waitForTimeout(250);
  var hurt = await page.evaluate(function () { return window.AV.Game.save.hearts; });
  check('enemies hurt you', hurt < 12, 'hearts=' + hurt);

  /* the shield turns what it faces */
  await scene(function () {
    var g = window.AV.Game, P = window.AV.Play;
    g.save.hearts = 12; g.save.items.shield = true;
    P.entities.length = 0;
    P.player.invuln = 0; P.player.dir = 'right'; P.player.swing = 0;
    /* a pellet flying left, straight into the shield */
    P.add(window.AV.Shots.make('pellet', P.player.cx() + 6, P.player.cy(), -1, 0));
  });
  await page.waitForTimeout(300);
  var blocked = await page.evaluate(function () { return window.AV.Game.save.hearts; });
  check('the shield turns a shot it faces', blocked === 12, 'hearts=' + blocked);

  /* blastroot opens cracked rock */
  await scene(function () {
    var g = window.AV.Game, P = window.AV.Play;
    g.save.secrets = {}; g.save.tiles = {};
    g.toOverworld(4, 3, 100, 100, 'down');
    g.setMode('play');
    P.player.invuln = 600;
    var b = window.AV.Shots.bomb(4 * 16 + 8, 4 * 16 + 8);
    b.fuse = 6;
    P.add(b);
  });
  await page.waitForTimeout(700);
  var opened = await page.evaluate(function () {
    return {
      secret: !!window.AV.Game.save.secrets['o4,3'],
      tile: window.AV.World.tile(4, 4),
      portals: window.AV.World.portals.length
    };
  });
  check('blastroot opens cracked rock', opened.secret && opened.tile === '^',
        'tile=' + opened.tile + ' portals=' + opened.portals);
  await shot('secret-opened');

  /* the raft crosses to the island barrow */
  await scene(function () {
    var g = window.AV.Game;
    g.save.items.raft = true;
    g.toOverworld(0, 1, 7 * 16 + 2, 9 * 16 + 2, 'up');
    g.setMode('play');
    window.AV.Play.player.invuln = 600;
  });
  await hold('ArrowUp', 1400);
  await page.waitForTimeout(300);
  var raft = await page.evaluate(function () {
    var p = window.AV.Play.player;
    return { ty: Math.floor(p.cy() / 16), riding: p.riding, sx: window.AV.World.sx, sy: window.AV.World.sy };
  });
  check('the raft crosses to the island', raft.sy === 1 && raft.ty <= 5,
        'landed at row ' + raft.ty + ' on screen ' + raft.sx + ',' + raft.sy);
  await shot('raft-island');

  /* the horn opens the Crag Vault */
  await scene(function () {
    var g = window.AV.Game;
    g.save.secrets = {};
    g.save.items.horn = true;
    g.save.slotItem = 'horn';
    g.toOverworld(3, 0, 7 * 16 + 2, 6 * 16 + 2, 'up');
    g.setMode('play');
    window.AV.Play.player.invuln = 600;
  });
  await key('x');
  await page.waitForTimeout(400);
  var horn = await page.evaluate(function () { return !!window.AV.Game.save.secrets['horn:3,0']; });
  check('the horn unseals the Crag Vault', horn === true, 'sealed=' + !horn);

  /* a barrow key spends itself on a locked door */
  await scene(function () {
    var g = window.AV.Game;
    g.save.barrows = {};
    g.save.keys = 1;
    g.enterBarrow('b1', 3, 4, 13 * 16, 5 * 16 + 2, 'right');
    g.setMode('play');
    window.AV.Play.player.invuln = 600;
  });
  await hold('ArrowRight', 900);
  await page.waitForTimeout(300);
  var lock = await page.evaluate(function () {
    return { keys: window.AV.Game.save.keys, sx: window.AV.World.sx, sy: window.AV.World.sy };
  });
  check('a key opens a locked door', lock.keys === 0,
        'keys=' + lock.keys + ' room=' + lock.sx + ',' + lock.sy);
  await shot('locked-door');

  /* --- nothing went wrong along the way --- */
  check('no uncaught page errors', pageErrors.length === 0, pageErrors.slice(0, 4).join(' | '));
  check('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 4).join(' | '));

  await browser.close();

  console.log('\nAshvale — browser verification\n');
  steps.forEach(function (s) {
    console.log('  ' + (s.ok ? 'ok  ' : 'FAIL') + ' ' + s.name + (s.detail && !s.ok ? '  [' + s.detail + ']' : ''));
  });
  console.log('\n  screenshots in ' + OUT);
  if (failures.length) {
    console.log('\n' + failures.length + ' failure(s).\n');
    process.exit(1);
  }
  console.log('\nAll checks passed.\n');
})().catch(function (e) {
  console.error('verification crashed:', e);
  process.exit(1);
});
