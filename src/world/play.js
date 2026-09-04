/* Ashvale — the play state.
 * Owns the entity list for whatever screen or room is loaded, resolves every
 * collision in it, and raises the things the outer game loop has to react to:
 * a screen edge crossed, a portal stepped on, an item earned, Kaelen dead. */
(function (AV) {
  'use strict';

  var T = 16;

  var Play = {
    entities: [],
    player: null,
    shakeT: 0, shakeMag: 0,
    pending: null,      // a transition waiting for the loop to run it
    hadFoes: false,
    banner: null,
    tick: 0
  };

  function save() { return AV.Game.save; }

  Play.add = function (e) { Play.entities.push(e); return e; };
  Play.fx = function (e) { Play.entities.push(e); return e; };
  Play.shake = function (n) { Play.shakeT = n; Play.shakeMag = 2; };

  Play.say = function (text, frames) {
    Play.banner = { text: text, t: frames || 150 };
  };

  /* --- loading a place ---------------------------------------------------- */

  function placePlayer(px, py, face) {
    if (!Play.player) Play.player = new AV.Player(px, py, face);
    Play.player.x = px; Play.player.y = py;
    if (face) Play.player.dir = face;
    Play.player.knock = 0;
    Play.player.swing = 0;
    Play.player.riding = null;
    Play.player.grabbed = null;
    Play.player.stone = null;
  }

  function spawnFoes() {
    var d = AV.World.data;
    if (!d || !d.foes) return;
    if (AV.World.kind === 'dgn' && AV.World.roomCleared()) return;
    var p = Play.player;
    var list = AV.Foes.populate(d.foes, Play, p ? p.cx() : 0, p ? p.cy() : 0);
    for (var i = 0; i < list.length; i++) Play.add(list[i]);
    Play.hadFoes = list.length > 0;
  }

  function spawnBoss() {
    var d = AV.World.data;
    if (!d || !d.boss) return;
    var b = AV.World.barrow();
    if (b.boss) return;                       // already put down
    Play.add(AV.Bosses.make(d.boss, Play));
    Play.hadFoes = true;
    AV.Audio.music('boss');
  }

  /* Room prizes: the map, the compass, the Seal, the barrow's item. */
  function spawnPrizes() {
    var d = AV.World.data;
    if (!d) return;
    ['prize', 'prize2'].forEach(function (slot) {
      var item = d[slot];
      if (!item) return;
      var key = AV.World.placeKey() + ':' + slot;
      if (save().taken[key]) return;
      Play.add(makePrize(item, key,
        AV.World.PW / 2 - 4,
        AV.World.PH / 2 - 4));
    });
  }

  function makePrize(item, key, x, y) {
    return {
      kind: 'prize', item: item, takenKey: key,
      x: x, y: y, w: 10, h: 10, t: 0, dead: false,
      cx: function () { return this.x + this.w / 2; },
      cy: function () { return this.y + this.h / 2; },
      update: function () { this.t++; },
      draw: function (ox, oy) {
        var art = PRIZE_ART[item] || 'item.glimmer';
        var img = AV.Art.get(art);
        if (!img) return;
        var bob = Math.sin(this.t / 14) * 2;
        AV.Gfx.draw(img, ox + this.cx() - img.width / 2, oy + this.cy() - img.height / 2 + bob);
        if ((this.t % 40) < 6) {
          AV.Gfx.draw(AV.Art.get('fx.sparkle', 0),
            ox + this.cx() - 2 + 6, oy + this.cy() - 2 - 6);
        }
      }
    };
  }

  var PRIZE_ART = {
    map: 'item.map', compass: 'item.compass', seal: 'item.seal',
    stone: 'item.stone', bow: 'item.bow', torch: 'item.torch', vine: 'item.vine',
    key: 'item.key', vessel: 'item.vessel', shard: 'item.shard',
    blade: 'blade.ember', brand: 'blade.brand', raft: 'item.raft',
    horn: 'item.horn', ring: 'item.ring', shieldWard: 'item.shieldWard',
    bombs: 'item.bomb', potion: 'item.potion', quarrels: 'shot.arrow'
  };
  Play.PRIZE_ART = PRIZE_ART;
  Play.makePrize = makePrize;

  Play.clearEntities = function () {
    Play.entities.length = 0;
    Play.banner = null;
    Play.caveLines = null;
    /* You arrive standing on the very tile you came through. Portals stay inert
     * until you have stepped off, or nobody could ever leave a cave. */
    Play.portalLock = true;
  };

  Play.loadOver = function (sx, sy, px, py, face) {
    AV.World.enterOver(sx, sy);
    Play.clearEntities();
    placePlayer(px, py, face);
    spawnFoes();
    var s = save();
    s.area = 'over'; s.id = null; s.sx = sx; s.sy = sy;
    AV.Audio.music('field');
  };

  Play.loadRoom = function (dgnId, col, row, px, py, face) {
    AV.World.enterRoom(dgnId, col, row);
    Play.clearEntities();
    placePlayer(px, py, face);
    spawnFoes();
    spawnBoss();
    spawnPrizes();
    var s = save();
    s.area = 'dgn'; s.id = dgnId; s.sx = col; s.sy = row;
    if (!AV.World.data.boss || AV.World.barrow().boss) {
      AV.Audio.music(AV.Dungeons[dgnId].music);
    }
  };

  /* A person, or a thing, standing still in a cave. */
  function makeProp(art, x, y, frames) {
    return {
      kind: 'prop', x: x, y: y, w: 12, h: 14, t: 0, dead: false,
      cx: function () { return this.x + this.w / 2; },
      cy: function () { return this.y + this.h / 2; },
      update: function () { this.t++; },
      draw: function (ox, oy) {
        var f = frames ? ((this.t / 8) | 0) % frames : 0;
        var img = AV.Art.get(art, f);
        if (img) AV.Gfx.draw(img, ox + this.cx() - img.width / 2, oy + this.y + this.h - img.height);
      }
    };
  }

  /* Something on a pedlar's floor, with a price over it. */
  function makeStock(entry, x, y) {
    return {
      kind: 'stock', item: entry.item, cost: entry.cost, label: entry.label,
      x: x, y: y, w: 12, h: 12, t: 0, dead: false, cooldown: 0,
      cx: function () { return this.x + this.w / 2; },
      cy: function () { return this.y + this.h / 2; },
      update: function () { this.t++; if (this.cooldown > 0) this.cooldown--; },
      draw: function (ox, oy) {
        var img = AV.Art.get(PRIZE_ART[this.item] || 'item.glimmer');
        if (img) {
          AV.Gfx.draw(img, ox + this.cx() - img.width / 2,
                           oy + this.cy() - img.height / 2 + Math.sin(this.t / 18) * 1.5);
        }
        AV.Font.center('' + this.cost, ox + this.cx(), oy + this.y + 16, C_GOLD);
        /* The names are wider than the spacing between the goods, so only the
         * one Kaelen is standing at gets to say what it is. */
        var pl = Play.player;
        if (pl && Math.abs(pl.cx() - this.cx()) < 22) {
          AV.Font.center(this.label, ox + AV.World.PW / 2, oy + AV.World.PH - 22, C_DUST);
        }
      }
    };
  }

  /* The wager: pay to open one, and live with it. */
  function makePot(index, prize, x, y) {
    return {
      kind: 'pot', prize: prize, index: index,
      x: x, y: y, w: 12, h: 14, t: 0, dead: false,
      cx: function () { return this.x + this.w / 2; },
      cy: function () { return this.y + this.h / 2; },
      update: function () { this.t++; },
      draw: function (ox, oy) {
        var img = AV.Art.get('item.potion');
        if (img) AV.Gfx.draw(img, ox + this.cx() - img.width / 2, oy + this.cy() - img.height / 2);
        AV.Font.center('?', ox + this.cx(), oy + this.y - 12, C_GOLD);
      }
    };
  }

  var C_GOLD = AV.Gfx.COLORS['d'];
  var C_DUST = AV.Gfx.COLORS['5'];

  Play.loadCave = function (caveId) {
    var cave = AV.Caves[caveId];
    AV.World.enterCave(caveId);
    Play.clearEntities();
    /* standing on the stairs, facing in */
    placePlayer(8 * T + 2, 8 * T + 2, 'up');
    AV.Audio.stopMusic();

    Play.caveLines = cave.lines ? cave.lines.slice() : null;

    if (cave.npc) Play.add(makeProp('npc.' + cave.npc, 7 * T + 2, 3 * T, 1));
    if (cave.fire) {
      Play.add(makeProp('fx.fire', 3 * T + 4, 3 * T + 4, 2));
      Play.add(makeProp('fx.fire', 12 * T + 4, 3 * T + 4, 2));
    }

    /* a gift, once */
    if (cave.give) {
      var key = 'cave:' + caveId + ':give';
      if (!save().taken[key]) {
        if (cave.requireHearts && (save().maxHearts / 2) < cave.requireHearts) {
          Play.caveLines = cave.denyLines || ['NOT YET.'];
        } else {
          Play.add(makePrize(cave.give, key, 7 * T + 4, 5 * T + 4));
        }
      } else {
        Play.caveLines = ['THERE IS NOTHING LEFT HERE.'];
      }
    }

    /* a pedlar's stock */
    if (cave.shop) {
      var cols = [4, 7, 10];
      for (var i = 0; i < cave.shop.length && i < 3; i++) {
        Play.add(makeStock(cave.shop[i], cols[i] * T + 2, 5 * T + 2));
      }
    }

    /* the wager: one pot pays, one breaks even, one takes it */
    if (cave.wager) {
      var prizes = [50, 10, -10];
      for (var j = prizes.length - 1; j > 0; j--) {   // shuffle
        var k = (Math.random() * (j + 1)) | 0;
        var tmp = prizes[j]; prizes[j] = prizes[k]; prizes[k] = tmp;
      }
      var wcols = [4, 7, 10];
      for (var w = 0; w < 3; w++) {
        Play.add(makePot(w, prizes[w], wcols[w] * T + 2, 5 * T + 2));
      }
    }
  };

  /* --- item effects ------------------------------------------------------- */

  Play.lightFire = function (tx, ty) {
    Play.add(AV.Effects.flame(tx, ty, function (bx, by) {
      var ch = AV.World.tile(bx, by);
      var def = AV.Tiles.def(ch, AV.World.indoors);
      if (!def.burn) return;
      var portal = AV.World.revealAt(bx, by, 'burn');
      AV.Audio.play(portal ? 'secret' : 'flame');
      if (portal) Play.say('SOMETHING WAS UNDER THAT.', 120);
    }));
  };

  Play.soundHorn = function () {
    if (AV.World.kind !== 'over') { Play.say('NOTHING ANSWERS.', 90); return; }
    var ps = AV.World.data.portals || [];
    for (var i = 0; i < ps.length; i++) {
      if (ps[i].sealed !== 'horn') continue;
      var k = 'horn:' + AV.World.sx + ',' + AV.World.sy;
      if (save().secrets[k]) { Play.say('IT IS ALREADY OPEN.', 90); return; }
      save().secrets[k] = true;
      AV.Audio.play('secret');
      Play.shake(20);
      Play.say('THE STONE GRINDS BACK.', 140);
      return;
    }
    Play.say('NOTHING ANSWERS.', 90);
  };

  /* A bomb going off: everything close takes a blow, and cracked stone gives. */
  Play.detonate = function (bomb) {
    var R = 30;
    var i, e;
    var blastBox = { x: bomb.cx() - R, y: bomb.cy() - R, w: R * 2, h: R * 2 };
    for (i = 0; i < Play.entities.length; i++) {
      e = Play.entities[i];
      if (e.dead) continue;
      if (e.kind !== 'foe' && e.kind !== 'boss') continue;
      var dx = e.cx() - bomb.cx(), dy = e.cy() - bomb.cy();
      if (Math.sqrt(dx * dx + dy * dy) > R + 8) continue;
      var l = Math.sqrt(dx * dx + dy * dy) || 1;
      e.hurt(4, dx / l, dy / l, Play, 'blast', blastBox);
    }
    /* Kaelen is not immune to his own root. */
    var p = Play.player;
    if (p) {
      var pdx = p.cx() - bomb.cx(), pdy = p.cy() - bomb.cy();
      if (Math.sqrt(pdx * pdx + pdy * pdy) < R) p.takeDamage(2, bomb.cx(), bomb.cy(), Play);
    }
    /* cracked rock out in the world */
    var ctx0 = ((bomb.cx() - R) / T) | 0, ctx1 = ((bomb.cx() + R) / T) | 0;
    var cty0 = ((bomb.cy() - R) / T) | 0, cty1 = ((bomb.cy() + R) / T) | 0;
    var opened = false;
    for (var ty = cty0; ty <= cty1; ty++) {
      for (var tx = ctx0; tx <= ctx1; tx++) {
        var def = AV.Tiles.def(AV.World.tile(tx, ty), AV.World.indoors);
        if (!def.bomb) continue;
        var portal = AV.World.revealAt(tx, ty, 'bomb');
        opened = true;
        if (portal) Play.say('A WAY DOWN.', 120);
      }
    }
    /* hidden walls inside a barrow */
    if (AV.World.kind === 'dgn') {
      var near = { n: bomb.cy() < 3 * T, s: bomb.cy() > 8 * T,
                   w: bomb.cx() < 3 * T, e: bomb.cx() > 13 * T };
      for (var dir in near) {
        if (near[dir] && AV.World.bombWall(dir)) {
          opened = true;
          Play.say('THE WALL GIVES.', 120);
        }
      }
    }
    if (opened) AV.Audio.play('secret');
  };

  /* --- collisions ---------------------------------------------------------- */

  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  }
  Play.overlap = overlap;

  function resolveCollisions() {
    var p = Play.player;
    if (!p || p.dead) return;
    var i, e;
    var blade = p.bladeBox();

    for (i = 0; i < Play.entities.length; i++) {
      e = Play.entities[i];
      if (e.dead) continue;

      /* --- blade and hero shots against foes --- */
      if (e.kind === 'foe' || e.kind === 'boss') {
        if (blade && overlap(blade, e)) {
          var v = p.dirVec();
          e.hurt(p.bladeDamage(), v[0], v[1], Play, 'blade', blade);
        }
        /* the body of the thing against Kaelen */
        if (e.canHurt && e.canHurt() && overlap(p, e)) {
          if (e.spec && e.spec.grabs && !p.grabbed && p.invuln <= 0) {
            p.grabbed = e; p.mash = 0;
            AV.Audio.play('hurt');
            p.takeDamage(e.spec.dmg, e.cx(), e.cy(), Play);
          } else if (e.spec && e.spec.sends) {
            if (p.invuln <= 0) {
              AV.Audio.play('hurt');
              Play.sendToEntrance();
              return;
            }
          } else {
            p.takeDamage(e.spec ? e.spec.dmg : e.dmg || 2, e.cx(), e.cy(), Play);
          }
        }
        continue;
      }

      /* --- shots --- */
      if (e.kind === 'shot') {
        if (e.side === 'hero') {
          for (var j = 0; j < Play.entities.length; j++) {
            var f = Play.entities[j];
            if (f.dead || (f.kind !== 'foe' && f.kind !== 'boss')) continue;
            if (!overlap(e, f)) continue;
            var l = Math.sqrt(e.vx * e.vx + e.vy * e.vy) || 1;
            var res = f.hurt(e.dmg, e.vx / l, e.vy / l, Play, e.type, e);
            if (!e.spec.pierce && res !== 'miss') { e.burst(Play); e.dead = true; }
            break;
          }
        } else if (overlap(e, p)) {
          if (p.blocks(e)) {
            AV.Audio.play('block');
            e.dead = true;
          } else if (p.takeDamage(e.dmg, e.cx(), e.cy(), Play)) {
            e.dead = true;
          }
        }
        continue;
      }

      /* --- the stone stuns, and sweeps up loose pickups --- */
      if (e.kind === 'stone') {
        for (var k = 0; k < Play.entities.length; k++) {
          var t = Play.entities[k];
          if (t.dead) continue;
          if ((t.kind === 'foe' || t.kind === 'boss') && overlap(e, t)) {
            t.hurt(0, e.vx || 0, e.vy || 0, Play, 'stone');
            e.out = false;
          } else if (t.kind === 'pickup' && overlap(e, t)) {
            var sfx = AV.Pickups.collect(t, save());
            AV.Audio.play(sfx);
            t.dead = true;
          }
        }
        continue;
      }

      /* --- walking over loose pickups --- */
      if (e.kind === 'pickup' && overlap(p, e)) {
        var s2 = AV.Pickups.collect(e, save());
        AV.Audio.play(s2);
        e.dead = true;
        continue;
      }

      /* --- the big ones, held up over your head --- */
      if (e.kind === 'prize' && overlap(p, e)) {
        e.dead = true;
        save().taken[e.takenKey] = true;
        AV.Game.grant(e.item);
        continue;
      }

      /* --- paying a pedlar --- */
      if (e.kind === 'stock' && overlap(p, e) && e.cooldown <= 0) {
        var sv = save();
        if (sv.glimmers < e.cost) {
          e.cooldown = 60;
          AV.Audio.play('deny');
          Play.say('THAT IS ' + e.cost + ' GLIMMERS.', 90);
        } else {
          sv.glimmers -= e.cost;
          e.dead = true;
          AV.Game.grant(e.item, true);
        }
        continue;
      }

      /* --- the wager --- */
      if (e.kind === 'pot' && overlap(p, e)) {
        var sw = save();
        if (sw.glimmers < 10) {
          AV.Audio.play('deny');
          Play.say('TEN GLIMMERS TO WALK ONE.', 100);
          p.y += 6;
          continue;
        }
        sw.glimmers -= 10;
        var won = e.prize;
        sw.glimmers = Math.max(0, Math.min(999, sw.glimmers + won));
        AV.Audio.play(won > 0 ? 'fanfare' : 'deny');
        Play.say(won > 0 ? ('YOU TAKE ' + won + ' GLIMMERS.') : 'THAT ROAD PAID NOTHING.', 150);
        for (var q = Play.entities.length - 1; q >= 0; q--) {
          if (Play.entities[q].kind === 'pot') Play.entities[q].dead = true;
        }
        continue;
      }

      /* --- open flame burns whatever stands in it --- */
      if (e.kind === 'flame') {
        for (var m = 0; m < Play.entities.length; m++) {
          var g = Play.entities[m];
          if (g.dead || (g.kind !== 'foe' && g.kind !== 'boss')) continue;
          if (overlap(e, g) && e.t % 12 === 0) g.hurt(2, 0, 0, Play, 'fire');
        }
      }
    }
  }

  /* A Wallcrawler's grip: back to the door you came in by. */
  Play.sendToEntrance = function () {
    var p = Play.player;
    p.invuln = 60;
    p.x = AV.World.PW / 2 - p.w / 2;
    p.y = AV.World.PH - 2 * T;
    Play.shake(8);
    Play.say('SOMETHING PUT YOU BACK.', 110);
  };

  /* --- when a room falls quiet ---------------------------------------------- */

  Play.onFoeKilled = function (foe) {
    var drop = AV.Pickups.roll(save(), foe.cx(), foe.cy());
    if (drop) Play.add(drop);
  };

  function foesLeft() {
    for (var i = 0; i < Play.entities.length; i++) {
      var e = Play.entities[i];
      if (!e.dead && (e.kind === 'foe' || e.kind === 'boss')) return true;
    }
    return false;
  }

  function checkCleared() {
    if (AV.World.kind !== 'dgn') return;
    if (!Play.hadFoes || AV.World.roomCleared()) return;
    if (foesLeft()) return;
    AV.World.markCleared();
    Play.hadFoes = false;
    /* A room-lock lifts, and the door is audible from anywhere. */
    var room = AV.World.data;
    var any = false;
    for (var dir in room.doors) {
      if (room.doors[dir] === 'shut') any = true;
    }
    if (room.drop) {
      Play.add(AV.Pickups.make(room.drop, AV.World.PW / 2, AV.World.PH / 2));
    }
    if (any) { AV.Audio.play('door'); AV.World.rebuild(); }
  }

  /* --- doors, portals, edges -------------------------------------------------- */

  function tryDoors() {
    var p = Play.player;
    if (AV.World.kind !== 'dgn') return;
    var dirs = ['n', 's', 'e', 'w'];
    for (var i = 0; i < dirs.length; i++) {
      var dir = dirs[i];
      var kind = AV.World.doorwayAt(p.x, p.y, p.w, p.h, dir);
      if (!kind || kind === 'open' || kind === 'none') continue;
      if (AV.World.doorOpen(AV.World.id, AV.World.sx + ',' + AV.World.sy, dir, AV.World.data)) continue;
      /* Only when actually pushing into it. */
      var pressing = { n: 'up', s: 'down', e: 'right', w: 'left' }[dir];
      if (!AV.Input.held(pressing)) continue;

      var s = save();
      if (kind === 'lock') {
        if (s.keys > 0) {
          s.keys--;
          AV.World.forceDoor(dir);
          AV.World.rebuild();
          AV.Audio.play('door');
          p.frozen = 12;
        } else if (!Play.banner) {
          Play.say(AV.Text.lockedDoor, 100);
          AV.Audio.play('deny');
        }
      } else if (kind === 'seal') {
        if (AV.World.barrow().seal) {
          AV.World.forceDoor(dir);
          AV.World.rebuild();
          AV.Audio.play('secret');
          p.frozen = 16;
        } else if (!Play.banner) {
          Play.say(AV.Text.sealedDoor, 110);
          AV.Audio.play('deny');
        }
      }
    }
  }

  function tryPortal() {
    var p = Play.player;
    var tx = (p.cx() / T) | 0, ty = (p.cy() / T) | 0;
    var portal = AV.World.portalAt(tx, ty);
    if (Play.portalLock) {
      if (!portal) Play.portalLock = false;
      return;
    }
    if (!portal) return;
    /* Must be standing properly on it, not clipping a corner. */
    if (Math.abs(p.cx() - (tx * T + T / 2)) > 5) return;
    if (Math.abs(p.cy() - (ty * T + T / 2)) > 6) return;

    if (portal.sealed === 'horn' && !save().secrets['horn:' + AV.World.sx + ',' + AV.World.sy]) {
      if (!Play.banner) Play.say(AV.Text.sealedHorn, 130);
      return;
    }
    if (portal.sealed === 'shards' && save().shards < 4) {
      if (!Play.banner) Play.say(AV.Text.sealedShards, 150);
      return;
    }
    Play.pending = { type: 'portal', to: portal.to };
  }

  /* You leave a screen by standing flush against its edge and still pushing
   * that way — or by drifting into it on the raft. */
  function tryEdge() {
    var p = Play.player;
    var W = AV.World;
    var E = 0.5;
    var dir = null;
    if (p.x <= E && (AV.Input.held('left') || p.riding === 'w')) dir = 'w';
    else if (p.x + p.w >= W.PW - E && (AV.Input.held('right') || p.riding === 'e')) dir = 'e';
    else if (p.y <= E && (AV.Input.held('up') || p.riding === 'n')) dir = 'n';
    else if (p.y + p.h >= W.PH - E && (AV.Input.held('down') || p.riding === 's')) dir = 's';
    if (dir) Play.pending = { type: 'edge', dir: dir };
  }

  /* --- frame ------------------------------------------------------------------ */

  Play.update = function () {
    Play.tick++;
    if (Play.shakeT > 0) Play.shakeT--;
    if (Play.banner) { if (--Play.banner.t <= 0) Play.banner = null; }

    var p = Play.player;
    if (p) p.update(Play);

    for (var i = 0; i < Play.entities.length; i++) {
      var e = Play.entities[i];
      if (!e.dead && e.update) e.update(Play);
    }

    resolveCollisions();

    /* sweep the dead */
    for (var j = Play.entities.length - 1; j >= 0; j--) {
      if (Play.entities[j].dead) Play.entities.splice(j, 1);
    }

    checkCleared();

    if (p && !p.dead) {
      tryDoors();
      tryPortal();
      tryEdge();
    }
  };

  /* --- drawing ----------------------------------------------------------------- */

  Play.drawEntities = function (ox, oy) {
    /* Sort by foot position so things overlap the way a top-down scene should. */
    var list = Play.entities.slice();
    list.sort(function (a, b) { return (a.y + (a.h || 0)) - (b.y + (b.h || 0)); });
    var p = Play.player;
    var drawn = false;
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (!drawn && p && (e.y + (e.h || 0)) > (p.y + p.h)) { p.draw(ox, oy); drawn = true; }
      if (e.draw) e.draw(ox, oy);
    }
    if (!drawn && p) p.draw(ox, oy);
  };

  /* Without a torch a dark room is a small circle of lantern light. */
  Play.drawDark = function (ox, oy) {
    if (!AV.World.dark) return;
    var p = Play.player;
    var ctx = AV.Gfx.ctx;
    var cx = ox + (p ? p.cx() : AV.World.PW / 2);
    var cy = oy + (p ? p.cy() : AV.World.PH / 2);
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy, AV.World.PW, AV.World.PH);
    ctx.arc(cx, cy, 34, 0, Math.PI * 2, true);
    ctx.fillStyle = 'rgba(4,3,8,0.94)';
    ctx.fill('evenodd');
    ctx.restore();
    /* a soft edge just inside the circle */
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.rect(ox, oy, AV.World.PW, AV.World.PH);
    ctx.arc(cx, cy, 44, 0, Math.PI * 2, true);
    ctx.fillStyle = 'rgba(4,3,8,1)';
    ctx.fill('evenodd');
    ctx.restore();
  };

  Play.draw = function (ox, oy) {
    AV.World.draw(ox, oy);
    Play.drawEntities(ox, oy);
    Play.drawDark(ox, oy);
    if (Play.caveLines && !Play.banner) {
      AV.UI.box(Play.caveLines, ox + 8, oy + 6, AV.World.PW - 16);
    }
    if (Play.banner) {
      AV.UI.banner(Play.banner.text, ox, oy);
    }
  };

  Play.shakeOffset = function () {
    if (Play.shakeT <= 0) return { x: 0, y: 0 };
    var m = Play.shakeMag;
    return { x: ((Math.random() * 2 - 1) * m) | 0, y: ((Math.random() * 2 - 1) * m) | 0 };
  };

  AV.Play = Play;
})(window.AV = window.AV || {});
