/* Ashvale — the loop.
 * Boots the game, runs a fixed 60Hz step, and hands each frame to whichever
 * mode is current. Also owns the things that cut across everything: moving
 * between screens, granting an item, putting a boss down, saving, and dying. */
(function (AV) {
  'use strict';

  var STEP_MS = 1000 / 60;
  var SCROLL_FRAMES = 28;

  var Game = {
    mode: 'title',
    save: null,
    frames: 0,
    scroll: null,
    booted: false
  };

  /* --- modes ------------------------------------------------------------- */

  function menu() { return AV.Menus[Game.mode]; }

  Game.setMode = function (mode, payload) {
    Game.mode = mode;
    var m = AV.Menus[mode];
    if (m && m.enter) m.enter(payload);
    AV.Input.clearBuffers();
  };

  /* --- starting a tale ----------------------------------------------------- */

  Game.begin = function (slot, existing) {
    AV.Save.slot = slot;
    if (existing) {
      Game.save = existing;
      Game.resume();
    } else {
      Game.save = AV.Save.blank();
      Game.setMode('crawl');
    }
  };

  /* Puts the player back wherever the file left them. */
  Game.resume = function () {
    var s = Game.save;
    if (s.area === 'dgn' && AV.Dungeons[s.id]) {
      Game.enterBarrow(s.id, s.sx, s.sy, s.px, s.py);
    } else {
      Game.toOverworld(s.sx, s.sy, s.px, s.py, s.face);
    }
    Game.setMode('play');
  };

  Game.startPlay = function () {
    var st = AV.Overworld.start;
    Game.toOverworld(st.sx, st.sy, st.tx * 16 + 2, st.ty * 16 + 2, 'down');
    Game.setMode('play');
  };

  /* --- moving about --------------------------------------------------------- */

  Game.toOverworld = function (sx, sy, px, py, face) {
    AV.Play.loadOver(sx, sy, px, py, face);
    Game.save.visited[sx + ',' + sy] = 1;
    Game.save.px = px; Game.save.py = py;
    Game.save.face = face || Game.save.face;
    Game.persist();
  };

  Game.enterBarrow = function (id, col, row, px, py, face) {
    AV.Play.loadRoom(id, col, row, px, py, face);
    Game.save.px = px; Game.save.py = py;
    Game.persist();
  };

  /* Walking off the edge of a screen or out of a room. */
  function crossEdge(dir) {
    var p = AV.Play.player;
    var W = AV.World;
    var nx = W.sx + W.STEP[dir][0], ny = W.sy + W.STEP[dir][1];

    /* Where the player comes out on the far side. */
    var px = p.x, py = p.y;
    if (dir === 'e') px = 1;
    if (dir === 'w') px = W.PW - p.w - 1;
    if (dir === 's') py = 1;
    if (dir === 'n') py = W.PH - p.h - 1;

    if (W.kind === 'over') {
      if (nx < 0 || ny < 0 || nx >= AV.Overworld.W || ny >= AV.Overworld.H) {
        /* the edge of the world — step back */
        p.x = Math.max(0, Math.min(W.PW - p.w, p.x));
        p.y = Math.max(0, Math.min(W.PH - p.h, p.y));
        p.riding = null;
        return;
      }
      startScroll(dir, function () { Game.toOverworld(nx, ny, px, py); });
      return;
    }

    if (W.kind === 'dgn') {
      var dgn = AV.Dungeons[W.id];
      if (!dgn.rooms[nx + ',' + ny]) {
        p.x = Math.max(0, Math.min(W.PW - p.w, p.x));
        p.y = Math.max(0, Math.min(W.PH - p.h, p.y));
        return;
      }
      /* Through a doorway you always arrive in the mouth of the far door. */
      if (dir === 'e' || dir === 'w') py = 5 * 16 + 2;
      else px = 7 * 16 + 6;
      AV.Audio.play('door');
      startScroll(dir, function () { Game.enterBarrow(W.id, nx, ny, px, py); });
      return;
    }

    /* caves have no edges to leave by */
    p.x = Math.max(0, Math.min(W.PW - p.w, p.x));
    p.y = Math.max(0, Math.min(W.PH - p.h, p.y));
  }

  function startScroll(dir, load) {
    var W = AV.World;
    Game.scroll = {
      dir: dir, t: 0, dur: SCROLL_FRAMES,
      grid: W.grid, theme: W.theme, indoors: W.indoors,
      sx: W.sx, sy: W.sy, kind: W.kind, id: W.id, data: W.data
    };
    load();
    Game.setMode('scroll');
  }

  /* Stepping onto stairs, a cave mouth, or a barrow door. */
  function usePortal(to) {
    var s = Game.save;
    var W = AV.World;

    if (to === 'exit') {
      AV.Audio.play('stairs');
      if (W.kind === 'cave') {
        var r = s.ret || { sx: 1, sy: 3, tx: 7, ty: 6 };
        Game.toOverworld(r.sx, r.sy, r.tx * 16 + 2, r.ty * 16 + 8, 'down');
      } else if (W.kind === 'dgn') {
        var ex = AV.Dungeons[W.id].exit;
        Game.toOverworld(ex.sx, ex.sy, ex.tx * 16 + 2, ex.ty * 16 + 8, 'down');
      }
      Game.setMode('play');
      return;
    }

    if (to.indexOf('cave:') === 0) {
      var id = to.slice(5);
      s.ret = { sx: W.sx, sy: W.sy, tx: (AV.Play.player.cx() / 16) | 0, ty: (AV.Play.player.cy() / 16) | 0 };
      AV.Audio.play('stairs');
      AV.Play.loadCave(id);
      Game.persist();
      Game.setMode('play');
      return;
    }

    var dgn = AV.Dungeons[to];
    if (!dgn) return;
    AV.Audio.play('stairs');
    var e = dgn.entrance;
    Game.enterBarrow(to, e.col, e.row, 7 * 16 + 2, 5 * 16 + 6, 'down');
    AV.Play.say(dgn.name, 150);
    Game.setMode('play');
  }

  /* --- earning things --------------------------------------------------------- */

  Game.grant = function (item, quiet) {
    var s = Game.save;
    switch (item) {
      case 'blade': s.items.blade = true; break;
      case 'brand': s.items.brand = true; s.items.blade = true; break;
      case 'shieldWard': s.items.shieldWard = true; break;
      case 'bombs': s.items.bombs = true; s.bombs = Math.min(30, s.bombs + 8); s.slotItem = 'bombs'; break;
      case 'bow': s.items.bow = true; s.quarrels = Math.max(s.quarrels, 15); s.slotItem = 'bow'; break;
      case 'quarrels': s.quarrels = Math.min(60, s.quarrels + 15); break;
      case 'stone': s.items.stone = true; s.slotItem = 'stone'; break;
      case 'torch': s.items.torch = true; s.slotItem = 'torch'; break;
      case 'raft': s.items.raft = true; break;
      case 'vine': s.items.vine = true; break;
      case 'ring': s.items.ring = true; break;
      case 'horn': s.items.horn = true; s.slotItem = 'horn'; break;
      case 'potion': s.potions = Math.min(4, s.potions + 1); break;
      case 'key': s.keys++; break;
      case 'map': AV.World.barrow().map = true; break;
      case 'compass': AV.World.barrow().compass = true; break;
      case 'seal': AV.World.barrow().seal = true; break;
      case 'heart': s.hearts = Math.min(s.maxHearts, s.hearts + 2); break;
      case 'vessel':
        s.maxHearts = Math.min(32, s.maxHearts + 2);
        s.hearts = s.maxHearts;
        break;
      case 'shard':
        s.shards++;
        if (AV.World.kind === 'dgn') AV.World.barrow().shard = true;
        break;
    }

    /* Taking the torch lights the room you are standing in. */
    if (item === 'torch' && AV.World.dark) {
      AV.World.dark = false;
    }

    Game.persist();

    if (quiet) {
      AV.Audio.play('pickup');
      AV.Play.say(AV.Text.items[item] || '', 110);
      return;
    }

    var lines;
    if (item === 'shard') lines = AV.Text.shardGot.slice();
    else lines = [AV.Text.items[item] || '', AV.Text.got[item] || ''].filter(Boolean);
    Game.setMode('get', { item: item, lines: lines });
  };

  Game.bossDown = function (boss) {
    var W = AV.World;
    if (W.kind === 'dgn') {
      W.barrow().boss = true;
      W.markCleared();
    }
    Game.persist();

    var dgn = AV.Dungeons[W.id];
    if (dgn && dgn.final) {
      /* The Ashen King is the end of it. */
      Game.save.done = true;
      Game.persist();
      Game.setMode('ending');
      return;
    }

    AV.Audio.music(dgn ? dgn.music : 'field');
    /* what he was standing on */
    var vkey = W.placeKey() + ':vessel';
    if (!Game.save.taken[vkey]) {
      AV.Play.add(AV.Play.makePrize('vessel', vkey, AV.World.PW / 2 - 30, AV.World.PH / 2 - 4));
    }
    var skey = W.placeKey() + ':shard';
    if (!Game.save.taken[skey]) {
      AV.Play.add(AV.Play.makePrize('shard', skey, AV.World.PW / 2 + 20, AV.World.PH / 2 - 4));
    }
  };

  /* --- saving and dying --------------------------------------------------------- */

  Game.persist = function () {
    if (!Game.save) return;
    Game.save.frames = Game.frames;
    AV.Save.write(AV.Save.slot, Game.save);
  };

  Game.revive = function () {
    var s = Game.save;
    s.hearts = Math.min(s.maxHearts, 6);
    if (s.area === 'dgn' && AV.Dungeons[s.id]) {
      var e = AV.Dungeons[s.id].entrance;
      Game.enterBarrow(s.id, e.col, e.row, 7 * 16 + 2, 5 * 16 + 6, 'down');
    } else {
      var st = AV.Overworld.start;
      Game.toOverworld(st.sx, st.sy, st.tx * 16 + 2, st.ty * 16 + 2, 'down');
    }
    AV.Play.player.dead = false;
    AV.Play.player.invuln = 60;
    Game.setMode('play');
  };

  /* --- the frame ------------------------------------------------------------------ */

  function updatePlay() {
    if (AV.Input.pressed('pause')) {
      AV.Audio.play('select');
      Game.setMode('subscreen');
      return;
    }
    if (AV.Input.pressed('select')) {
      var m = AV.Audio.toggleMute();
      AV.Play.say(m ? 'SOUND OFF' : 'SOUND ON', 60);
    }

    AV.Play.update();

    if (AV.Play.player && AV.Play.player.dead) {
      Game.setMode('dead');
      return;
    }

    var pend = AV.Play.pending;
    if (pend) {
      AV.Play.pending = null;
      if (pend.type === 'edge') crossEdge(pend.dir);
      else if (pend.type === 'portal') usePortal(pend.to);
    }
  }

  function updateScroll() {
    var sc = Game.scroll;
    sc.t++;
    if (sc.t >= sc.dur) {
      Game.scroll = null;
      Game.setMode('play');
    }
  }

  function step() {
    Game.frames++;
    AV.Input.step();

    switch (Game.mode) {
      case 'play': updatePlay(); break;
      case 'scroll': updateScroll(); break;
      default:
        var m = menu();
        if (m && m.update) m.update();
    }
    AV.Audio.update();
  }

  /* --- drawing ----------------------------------------------------------------------- */

  /* The world plus the panel, with no menu over it. Menus reuse this to keep
   * the scene visible behind them. */
  Game.drawWorld = function () {
    var sh = AV.Play.shakeOffset();
    AV.UI.drawHud();
    AV.Play.draw(sh.x, AV.Gfx.HUD_H + sh.y);
    var boss = null;
    for (var i = 0; i < AV.Play.entities.length; i++) {
      if (AV.Play.entities[i].kind === 'boss') { boss = AV.Play.entities[i]; break; }
    }
    if (boss) AV.UI.bossBar(boss, sh.x, AV.Gfx.HUD_H + sh.y);
  };

  function drawScroll() {
    var sc = Game.scroll;
    var f = sc.t / sc.dur;
    var W = AV.World;
    var ox = 0, oy = 0, nx = 0, ny = 0;
    if (sc.dir === 'e') { ox = -f * W.PW; nx = W.PW + ox; }
    if (sc.dir === 'w') { ox = f * W.PW; nx = ox - W.PW; }
    if (sc.dir === 's') { oy = -f * W.PH; ny = W.PH + oy; }
    if (sc.dir === 'n') { oy = f * W.PH; ny = oy - W.PH; }

    AV.UI.drawHud();
    var hud = AV.Gfx.HUD_H;
    /* clip to the playfield so neither screen bleeds into the panel */
    var ctx = AV.Gfx.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, hud, W.PW, W.PH);
    ctx.clip();
    W.drawGrid(sc.grid, sc.theme, sc.indoors, ox, hud + oy, sc.sx, sc.sy);
    W.drawGrid(W.grid, W.theme, W.indoors, nx, hud + ny, W.sx, W.sy);
    if (AV.Play.player) AV.Play.player.draw(nx, hud + ny);
    ctx.restore();
  }

  function draw() {
    AV.Gfx.clear();
    switch (Game.mode) {
      case 'play':
        Game.drawWorld();
        break;
      case 'scroll':
        drawScroll();
        break;
      default:
        var m = menu();
        if (m && m.draw) m.draw();
    }
  }

  /* --- boot -------------------------------------------------------------------------- */

  var acc = 0, last = 0;

  function frame(now) {
    if (!last) last = now;
    var dt = now - last;
    last = now;
    /* Never simulate more than a few steps at once: a backgrounded tab should
     * resume, not fast-forward through everything it missed. */
    if (dt > 200) dt = STEP_MS;
    acc += dt;
    var guard = 0;
    while (acc >= STEP_MS && guard++ < 5) {
      step();
      acc -= STEP_MS;
    }
    draw();
    window.requestAnimationFrame(frame);
  }

  Game.boot = function () {
    if (Game.booted) return;
    Game.booted = true;

    var canvas = document.getElementById('screen');
    AV.Gfx.attach(canvas);
    AV.Input.attach(window);

    /* Browsers will not make a sound until the player touches something. */
    function wake() {
      AV.Audio.init();
      AV.Audio.resume();
      AV.Audio.restartPending();
    }
    window.addEventListener('keydown', wake, { once: true });
    window.addEventListener('pointerdown', wake, { once: true });
    canvas.addEventListener('pointerdown', function () { canvas.focus(); });

    Game.save = AV.Save.blank();     // a stand-in until a file is chosen
    Game.setMode('title');

    var boot = document.getElementById('boot');
    if (boot && boot.parentNode) boot.parentNode.removeChild(boot);

    window.requestAnimationFrame(frame);
  };

  AV.Game = Game;

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.setTimeout(Game.boot, 0);
  } else {
    window.addEventListener('DOMContentLoaded', Game.boot);
  }
})(window.AV = window.AV || {});
