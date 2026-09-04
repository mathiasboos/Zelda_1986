/* Ashvale — Kaelen.
 * Four-way movement with corner nudging so you don't snag on tile edges, a
 * forward blade thrust, a shield that turns what it faces, and one item bound
 * to the item button at a time. */
(function (AV) {
  'use strict';

  var T = 16;
  var SPEED = 1.35;
  var SWING = 15;          // frames a thrust lasts
  var SWING_HIT = [4, 11]; // frames the blade is actually out
  var INVULN = 44;

  var VEC = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };

  function Player(x, y, face) {
    this.kind = 'hero';
    this.w = 12; this.h = 12;
    this.x = x; this.y = y;
    this.dir = face || 'down';
    this.tick = 0;
    this.walk = 0;
    this.swing = 0;
    this.invuln = 0;
    this.knock = 0; this.kx = 0; this.ky = 0;
    this.dead = false;
    this.stone = null;       // the Ricochet Stone, while it is out
    this.riding = null;      // direction while on the raft
    this.rideWet = false;    // has the crossing actually reached water yet
    this.grabbed = null;     // a Gorger has hold of you
    this.mash = 0;
    this.frozen = 0;         // item pickups and doors pause you briefly
  }

  var FACE = { n: 'up', s: 'down', e: 'side', w: 'side' };

  Player.prototype.cx = function () { return this.x + this.w / 2; };
  Player.prototype.cy = function () { return this.y + this.h / 2; };
  Player.prototype.dirVec = function () { return VEC[this.dirKey()]; };

  Player.prototype.dirKey = function () {
    return { up: 'n', down: 's', left: 'w', right: 'e', n: 'n', s: 's', e: 'e', w: 'w' }[this.dir] || 's';
  };

  Player.prototype.save = function () { return AV.Game.save; };

  /* --- movement ---------------------------------------------------------- */

  /* Moves along one axis, nudging up to 3px sideways to clear a corner. This is
   * what stops a 12px hero from catching on 16px tiles.
   *
   * The playfield edge clamps rather than blocks, so Kaelen can come to rest
   * flush against it. Leaving the screen is then a matter of still pushing
   * outward once there (see tryEdge in world/play.js) — if the edge blocked him
   * a pixel short, he could never reach it and no screen would ever change. */
  Player.prototype.slide = function (dx, dy) {
    var nx = clamp(this.x + dx, 0, AV.World.PW - this.w);
    var ny = clamp(this.y + dy, 0, AV.World.PH - this.h);
    if (nx === this.x && ny === this.y) return false;
    if (!this.blocked(nx, ny)) { this.x = nx; this.y = ny; return true; }
    var probe = [1, -1, 2, -2, 3, -3];
    for (var i = 0; i < probe.length; i++) {
      var n = probe[i];
      if (dx !== 0) {
        var py = clamp(this.y + n, 0, AV.World.PH - this.h);
        if (!this.blocked(nx, py)) { this.x = nx; this.y = py; return true; }
      }
      if (dy !== 0) {
        var px = clamp(this.x + n, 0, AV.World.PW - this.w);
        if (!this.blocked(px, ny)) { this.y = ny; this.x = px; return true; }
      }
    }
    return false;
  };

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  Player.prototype.blocked = function (x, y) {
    return AV.World.boxSolid(x, y, this.w, this.h);
  };

  /* --- the blade ---------------------------------------------------------- */

  Player.prototype.bladeBox = function () {
    if (this.swing <= 0) return null;
    var f = SWING - this.swing;
    if (f < SWING_HIT[0] || f > SWING_HIT[1]) return null;
    var d = this.dirKey();
    var reach = this.save().items.brand ? 16 : 14;
    if (d === 'n') return { x: this.x + 1, y: this.y - reach, w: 10, h: reach };
    if (d === 's') return { x: this.x + 1, y: this.y + this.h, w: 10, h: reach };
    if (d === 'e') return { x: this.x + this.w, y: this.y + 1, w: reach, h: 10 };
    return { x: this.x - reach, y: this.y + 1, w: reach, h: 10 };
  };

  Player.prototype.bladeDamage = function () {
    return this.save().items.brand ? 4 : 2;
  };

  Player.prototype.startSwing = function (play) {
    var s = this.save();
    if (!s.items.blade) return;
    this.swing = SWING;
    AV.Audio.play('sword');
    /* At full embers the blade throws its heat down the room. */
    if (s.hearts >= s.maxHearts) {
      var v = this.dirVec();
      play.add(AV.Shots.make('beam', this.cx() + v[0] * 10, this.cy() + v[1] * 10, v[0], v[1],
                             { dmg: this.bladeDamage() }));
      AV.Audio.play('beam');
    }
  };

  /* --- items -------------------------------------------------------------- */

  Player.prototype.useItem = function (play) {
    var s = this.save();
    var item = s.slotItem;
    var v = this.dirVec();

    if (item === 'bombs') {
      if (!s.items.bombs || s.bombs <= 0) { AV.Audio.play('deny'); return; }
      s.bombs--;
      play.add(AV.Shots.bomb(this.cx() + v[0] * 14, this.cy() + v[1] * 14));
      return;
    }
    if (item === 'bow') {
      if (!s.items.bow) { AV.Audio.play('deny'); return; }
      if (s.quarrels <= 0) { AV.Audio.play('deny'); return; }
      s.quarrels--;
      play.add(AV.Shots.make('arrow', this.cx() + v[0] * 10, this.cy() + v[1] * 10, v[0], v[1]));
      AV.Audio.play('arrow');
      return;
    }
    if (item === 'stone') {
      if (!s.items.stone) { AV.Audio.play('deny'); return; }
      if (this.stone && !this.stone.dead) return;      // one at a time
      this.stone = AV.Shots.stone(this, v[0], v[1], 96);
      play.add(this.stone);
      AV.Audio.play('stone');
      return;
    }
    if (item === 'torch') {
      if (!s.items.torch) { AV.Audio.play('deny'); return; }
      var tx = ((this.cx() + v[0] * 20) / T) | 0;
      var ty = ((this.cy() + v[1] * 20) / T) | 0;
      play.lightFire(tx, ty);
      AV.Audio.play('flame');
      return;
    }
    if (item === 'horn') {
      if (!s.items.horn) { AV.Audio.play('deny'); return; }
      AV.Audio.play('horn');
      play.soundHorn();
      return;
    }
    if (item === 'potion') {
      if (s.potions <= 0) { AV.Audio.play('deny'); return; }
      s.potions--;
      s.hearts = s.maxHearts;
      AV.Audio.play('heart');
      return;
    }
    AV.Audio.play('deny');
  };

  /* --- shield -------------------------------------------------------------- */

  /* True when the shield turns this shot: it must be coming at the face, and a
   * plain Oakenshield cannot stop a Hexwright's bolt. */
  Player.prototype.blocks = function (shot) {
    if (this.swing > 0) return false;
    var s = this.save();
    if (!s.items.shield && !s.items.shieldWard) return false;
    if (shot.type === 'bolt' && !s.items.shieldWard) return false;
    if (shot.type === 'flame') return false;
    var d = this.dirKey();
    if (d === 'n' && shot.vy > 0) return true;
    if (d === 's' && shot.vy < 0) return true;
    if (d === 'e' && shot.vx < 0) return true;
    if (d === 'w' && shot.vx > 0) return true;
    return false;
  };

  /* --- damage --------------------------------------------------------------- */

  Player.prototype.takeDamage = function (amount, fromX, fromY, play) {
    if (this.invuln > 0 || this.dead) return false;
    var s = this.save();
    if (s.items.ring) amount = Math.max(1, Math.ceil(amount / 2));
    s.hearts -= amount;
    this.invuln = INVULN;
    var dx = this.cx() - fromX, dy = this.cy() - fromY;
    var l = Math.sqrt(dx * dx + dy * dy) || 1;
    this.knock = 12; this.kx = dx / l * 2.6; this.ky = dy / l * 2.6;
    this.swing = 0;
    if (s.hearts <= 0) {
      s.hearts = 0;
      this.dead = true;
      AV.Audio.play('die');
    } else {
      AV.Audio.play('hurt');
    }
    return true;
  };

  /* --- per-frame ------------------------------------------------------------ */

  Player.prototype.update = function (play) {
    this.tick++;
    if (this.invuln > 0) this.invuln--;
    if (this.frozen > 0) { this.frozen--; return; }

    /* A Gorger has swallowed you: mash any direction to get back out. */
    if (this.grabbed) {
      if (this.grabbed.dead) { this.grabbed = null; }
      else {
        this.x = this.grabbed.cx() - this.w / 2;
        this.y = this.grabbed.cy() - this.h / 2;
        if (AV.Input.pressed('left') || AV.Input.pressed('right') ||
            AV.Input.pressed('up') || AV.Input.pressed('down') || AV.Input.pressed('sword')) {
          this.mash++;
        }
        if (this.mash > 10) {
          this.grabbed.stun = 60;
          this.grabbed = null; this.mash = 0;
          this.invuln = 40;
        }
        return;
      }
    }

    /* On the raft you are a passenger until you reach the far side.
     *
     * You launch from a dock, which is dry — so the "have I landed?" test only
     * arms once you are actually over water. Without that, the raft lands on
     * the very tile it set out from and nobody ever crosses anything. */
    if (this.riding) {
      var rv = VEC[this.riding];
      this.x += rv[0] * 1.1; this.y += rv[1] * 1.1;
      var tx = (this.cx() / T) | 0, ty = (this.cy() / T) | 0;
      var wet = AV.Tiles.isWater(AV.World.tile(tx, ty), AV.World.indoors);
      if (wet) this.rideWet = true;
      var offEdge = this.x < 0 || this.y < 0 ||
                    this.x + this.w > AV.World.PW || this.y + this.h > AV.World.PH;
      if (offEdge) {
        this.riding = null;
      } else if (this.rideWet && !wet) {
        this.riding = null;
        this.x = tx * T + (T - this.w) / 2;
        this.y = ty * T + (T - this.h) / 2;
        AV.Audio.play('stairs');
      }
      if (this.tick % 14 === 0) play.fx(AV.Effects.make('ripple', this.cx(), this.cy() + 8));
      return;
    }

    if (this.knock > 0) {
      this.knock--;
      this.slide(this.kx, 0); this.slide(0, this.ky);
      this.kx *= 0.85; this.ky *= 0.85;
      return;
    }

    if (this.swing > 0) {
      this.swing--;
      return;                     // rooted for the length of the thrust
    }

    if (AV.Input.consume('sword')) { this.startSwing(play); return; }
    if (AV.Input.consume('item')) { this.useItem(play); return; }

    var ax = AV.Input.axis();
    if (ax.x || ax.y) {
      /* One axis at a time, the way the original moves. */
      if (ax.x && ax.y) {
        if (this.dir === 'left' || this.dir === 'right') ax.y = 0; else ax.x = 0;
      }
      if (ax.x > 0) this.dir = 'right';
      else if (ax.x < 0) this.dir = 'left';
      else if (ax.y > 0) this.dir = 'down';
      else if (ax.y < 0) this.dir = 'up';

      var moved = this.slide(ax.x * SPEED, ax.y * SPEED);
      if (moved) this.walk++;

      /* Stepping onto a dock and pressing on launches the raft. */
      if (this.save().items.raft && !this.riding) {
        var here = AV.World.tile((this.cx() / T) | 0, (this.cy() / T) | 0);
        if (AV.Tiles.def(here, AV.World.indoors).dock) {
          var d = this.dirKey(), v = VEC[d];
          var ax2 = ((this.cx() + v[0] * T) / T) | 0;
          var ay2 = ((this.cy() + v[1] * T) / T) | 0;
          if (AV.Tiles.isWater(AV.World.tile(ax2, ay2), AV.World.indoors)) {
            this.riding = d;
            this.rideWet = false;
            AV.Audio.play('stairs');
          }
        }
      }
    }
  };

  /* --- drawing ---------------------------------------------------------------- */

  Player.prototype.draw = function (ox, oy) {
    /* Flicker while the hit still hurts. */
    if (this.invuln > 0 && (this.tick % 6) < 3 && !this.dead) return;
    if (this.grabbed) return;      // you are inside it

    var s = this.save();
    var d = this.dirKey();
    var pose = FACE[d];
    var img;

    if (this.swing > 0) {
      var path = pose === 'up' ? 'kaelen.stabUp' : pose === 'down' ? 'kaelen.stabDown' : 'kaelen.stabSide';
      img = (d === 'e') ? AV.Art.mirror(path) : AV.Art.get(path);
    } else {
      var f = ((this.walk / 7) | 0) % 2;
      var path2 = 'kaelen.' + pose;
      img = (d === 'e') ? AV.Art.mirror(path2, f) : AV.Art.get(path2, f);
    }

    var dx = ox + this.cx() - 8;
    var dy = oy + this.y + this.h - 16 + 2;

    if (this.riding) {
      AV.Gfx.draw(AV.Art.get('item.raft'), dx + 4, dy + 12);
    }
    AV.Gfx.draw(img, dx, dy);

    /* the blade itself, out in front */
    if (this.swing > 0) {
      var fr = SWING - this.swing;
      if (fr >= 2 && fr <= SWING_HIT[1] + 1) {
        var art = s.items.brand ? 'blade.brand' : 'blade.ember';
        var out = Math.min(1, (fr - 1) / 4);
        var reach = (s.items.brand ? 16 : 14) * out;
        var bx, by, bimg;
        if (d === 'n') { bimg = AV.Art.get(art); bx = dx + 5; by = dy - reach + 2; }
        else if (d === 's') { bimg = AV.Art.rot(art, 2); bx = dx + 5; by = dy + 12 + reach - 14; }
        else if (d === 'e') { bimg = AV.Art.rot(art, 1); bx = dx + 12 + reach - 14; by = dy + 5; }
        else { bimg = AV.Art.rot(art, 3); bx = dx - reach + 2; by = dy + 5; }
        AV.Gfx.draw(bimg, bx, by);
      }
    }
  };

  AV.Player = Player;
})(window.AV = window.AV || {});
