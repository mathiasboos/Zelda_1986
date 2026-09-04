/* Ashvale — things in flight, and the small visual noise around them.
 * Shots carry a `side`: 'foe' shots hurt Kaelen and can be turned by a shield
 * held toward them; 'hero' shots hurt everything else. */
(function (AV) {
  'use strict';

  var T = 16;

  var SPEC = {
    pellet: { art: 'shot.pellet', w: 4, h: 4, speed: 1.6, side: 'foe', dmg: 2 },
    thorn:  { art: 'shot.thorn',  w: 4, h: 4, speed: 1.9, side: 'foe', dmg: 2, spin: true },
    bolt:   { art: 'shot.bolt',   w: 4, h: 4, speed: 1.5, side: 'foe', dmg: 4, pierce: true },
    flame:  { art: 'shot.flame',  w: 5, h: 5, speed: 1.2, side: 'foe', dmg: 2, home: 0.02 },
    rock:   { art: 'shot.rock',   w: 4, h: 4, speed: 2.2, side: 'foe', dmg: 3 },
    arrow:  { art: 'shot.arrow',  w: 8, h: 3, speed: 3.4, side: 'hero', dmg: 4, rotate: true },
    beam:   { art: 'shot.beam',   w: 6, h: 6, speed: 3.6, side: 'hero', dmg: 3, burst: true }
  };

  function Shot(type, x, y, dx, dy, opts) {
    var s = SPEC[type];
    opts = opts || {};
    this.kind = 'shot';
    this.type = type;
    this.spec = s;
    this.side = opts.side || s.side;
    this.dmg = opts.dmg || s.dmg;
    this.w = s.w; this.h = s.h;
    this.x = x - s.w / 2; this.y = y - s.h / 2;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var sp = opts.speed || s.speed;
    this.vx = dx / len * sp; this.vy = dy / len * sp;
    this.life = opts.life || 240;
    this.dead = false;
    this.tick = 0;
    this.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : (dy > 0 ? 's' : 'n');
  }

  Shot.prototype.update = function (play) {
    var s = this.spec;
    this.tick++;
    if (s.home && play.player) {
      /* Cinder Wisps' flames drift toward Kaelen instead of flying straight. */
      var px = play.player.cx() - (this.x + this.w / 2);
      var py = play.player.cy() - (this.y + this.h / 2);
      var l = Math.sqrt(px * px + py * py) || 1;
      this.vx += px / l * s.home; this.vy += py / l * s.home;
      var sp = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      var max = s.speed * 1.4;
      if (sp > max) { this.vx = this.vx / sp * max; this.vy = this.vy / sp * max; }
    }
    this.x += this.vx; this.y += this.vy;
    if (--this.life <= 0) { this.dead = true; return; }
    if (AV.World.boxOutside(this.x, this.y, this.w, this.h)) { this.dead = true; return; }
    if (!s.pierce && AV.World.boxSolid(this.x, this.y, this.w, this.h)) {
      this.burst(play);
      this.dead = true;
    }
  };

  Shot.prototype.burst = function (play) {
    if (this.spec.burst) {
      play.fx(AV.Effects.make('spark', this.x + this.w / 2, this.y + this.h / 2));
    }
  };

  Shot.prototype.cx = function () { return this.x + this.w / 2; };
  Shot.prototype.cy = function () { return this.y + this.h / 2; };

  Shot.prototype.draw = function (ox, oy) {
    var img;
    if (this.spec.rotate) {
      var turns = { e: 0, s: 1, w: 2, n: 3 }[this.dir];
      img = turns ? AV.Art.rot(this.spec.art, turns) : AV.Art.get(this.spec.art);
    } else if (this.spec.spin) {
      img = AV.Art.rot(this.spec.art, ((this.tick / 4) | 0) % 4);
    } else {
      img = AV.Art.get(this.spec.art);
    }
    AV.Gfx.draw(img, ox + this.x, oy + this.y);
  };

  /* --- the Ricochet Stone -----------------------------------------------
   * Flies out, slows, turns round and chases Kaelen home, stunning what it
   * touches and sweeping up anything loose on the way. */

  function Stone(player, dx, dy, reach) {
    this.kind = 'stone';
    this.owner = player;
    this.w = 8; this.h = 8;
    this.x = player.cx() - 4; this.y = player.cy() - 4;
    var l = Math.sqrt(dx * dx + dy * dy) || 1;
    this.vx = dx / l * 3.2; this.vy = dy / l * 3.2;
    this.out = true;
    this.reach = reach || 88;
    this.travelled = 0;
    this.tick = 0;
    this.dead = false;
    this.side = 'hero';
    this.dmg = 0;          // stuns rather than wounds
  }

  Stone.prototype.update = function (play) {
    this.tick++;
    if (this.out) {
      this.x += this.vx; this.y += this.vy;
      this.travelled += Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      var hitWall = AV.World.boxSolid(this.x, this.y, this.w, this.h) ||
                    AV.World.boxOutside(this.x, this.y, this.w, this.h);
      if (this.travelled >= this.reach || hitWall) {
        this.out = false;
        AV.Audio.play('stone');
      }
    } else {
      var px = this.owner.cx() - this.cx();
      var py = this.owner.cy() - this.cy();
      var l = Math.sqrt(px * px + py * py) || 1;
      if (l < 8) { this.dead = true; return; }
      var sp = 3.6;
      this.x += px / l * sp; this.y += py / l * sp;
    }
  };

  Stone.prototype.cx = function () { return this.x + this.w / 2; };
  Stone.prototype.cy = function () { return this.y + this.h / 2; };

  Stone.prototype.draw = function (ox, oy) {
    var img = AV.Art.rot('item.stone', ((this.tick / 3) | 0) % 4);
    AV.Gfx.draw(img, ox + this.x - 4, oy + this.y - 4);
  };

  /* --- blastroot -------------------------------------------------------- */

  function Bomb(x, y) {
    this.kind = 'bomb';
    this.x = x - 4; this.y = y - 4;
    this.w = 8; this.h = 8;
    this.fuse = 96;
    this.dead = false;
    this.blast = 0;
  }

  Bomb.prototype.cx = function () { return this.x + this.w / 2; };
  Bomb.prototype.cy = function () { return this.y + this.h / 2; };

  Bomb.prototype.update = function (play) {
    if (this.blast > 0) {
      this.blast++;
      if (this.blast === 2) play.detonate(this);
      if (this.blast > 26) this.dead = true;
      return;
    }
    if (--this.fuse <= 0) {
      this.blast = 1;
      AV.Audio.play('bomb');
      play.shake(10);
      return;
    }
    if (this.fuse % 16 === 0) AV.Audio.play('fuse');
  };

  Bomb.prototype.draw = function (ox, oy) {
    if (this.blast > 0) {
      var f = Math.min(3, (this.blast / 7) | 0);
      var img = AV.Art.get('fx.boom', f);
      /* three overlapping puffs, the way the original spreads its blast */
      AV.Gfx.draw(img, ox + this.cx() - 6, oy + this.cy() - 6);
      AV.Gfx.draw(img, ox + this.cx() - 6 - 10, oy + this.cy() - 6);
      AV.Gfx.draw(img, ox + this.cx() - 6 + 10, oy + this.cy() - 6);
      AV.Gfx.draw(img, ox + this.cx() - 6, oy + this.cy() - 6 - 10);
      AV.Gfx.draw(img, ox + this.cx() - 6, oy + this.cy() - 6 + 10);
      return;
    }
    /* blink faster as the fuse runs down */
    var period = this.fuse < 24 ? 4 : 8;
    if ((this.fuse % period) < period / 2) {
      AV.Gfx.draw(AV.Art.get('item.bomb'), ox + this.x, oy + this.y);
    } else {
      AV.Gfx.tint(AV.Art.get('item.bomb'), ox + this.x, oy + this.y, AV.Gfx.COLORS['7']);
    }
  };

  /* --- short-lived visuals ---------------------------------------------- */

  var Effects = {};

  var FX = {
    poof:    { art: 'fx.poof', hold: 5, w: 8, h: 8 },
    boom:    { art: 'fx.boom', hold: 6, w: 12, h: 12 },
    spark:   { art: 'fx.sparkle', hold: 5, w: 5, h: 5, loop: 2 },
    fire:    { art: 'fx.fire', hold: 6, w: 5, h: 5, loop: 6 },
    ripple:  { art: 'fx.ripple', hold: 8, w: 8, h: 4, loop: 3 }
  };

  Effects.make = function (type, x, y) {
    var f = FX[type];
    var frames = AV.Art.frames(f.art);
    return {
      kind: 'fx',
      type: type,
      x: x - f.w / 2, y: y - f.h / 2,
      t: 0,
      dead: false,
      total: f.hold * frames * (f.loop || 1),
      update: function () {
        if (++this.t >= this.total) this.dead = true;
      },
      draw: function (ox, oy) {
        var i = ((this.t / f.hold) | 0) % frames;
        AV.Gfx.draw(AV.Art.get(f.art, i), ox + this.x, oy + this.y);
      }
    };
  };

  /* A flame that sits on a tile until it burns out — the Firebrand Torch. */
  Effects.flame = function (tx, ty, onBurn) {
    return {
      kind: 'flame',
      tx: tx, ty: ty,
      x: tx * T + 5, y: ty * T + 5,
      w: 6, h: 6,
      t: 0,
      dead: false,
      fired: false,
      update: function (play) {
        this.t++;
        if (!this.fired && this.t > 12) {
          this.fired = true;
          if (onBurn) onBurn(tx, ty);
        }
        if (this.t > 110) this.dead = true;
      },
      cx: function () { return this.x + 3; },
      cy: function () { return this.y + 3; },
      draw: function (ox, oy) {
        var i = ((this.t / 5) | 0) % 2;
        var wob = Math.sin(this.t / 4) * 1.5;
        AV.Gfx.draw(AV.Art.get('fx.fire', i), ox + tx * T + 5 + wob, oy + ty * T + 4);
      }
    };
  };

  AV.Shots = {
    SPEC: SPEC,
    make: function (type, x, y, dx, dy, opts) { return new Shot(type, x, y, dx, dy, opts); },
    stone: function (player, dx, dy, reach) { return new Stone(player, dx, dy, reach); },
    bomb: function (x, y) { return new Bomb(x, y); }
  };
  AV.Effects = Effects;
})(window.AV = window.AV || {});
