/* Ashvale — the things in the dark.
 * One Foe object with a named behaviour per type. Behaviours are deliberately
 * simple and readable: the interest comes from how they combine in a room, not
 * from any one of them being clever. */
(function (AV) {
  'use strict';

  var T = 16;
  var DIRS = ['n', 's', 'e', 'w'];
  var VEC = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };

  /* hp is in half-embers of damage the Ember Blade deals (1 = one blade hit). */
  var TYPES = {
    grubling: {
      art: 'foe.grubling', w: 12, h: 12, hp: 2, dmg: 2, speed: 0.55,
      ai: 'walker', shoot: { type: 'pellet', rate: 130, range: 999 }
    },
    bristler: {
      art: 'foe.bristler', w: 12, h: 14, hp: 4, dmg: 4, speed: 0.62,
      ai: 'walker', shoot: { type: 'thorn', rate: 150 }, mirror: true
    },
    skitter: {
      art: 'foe.skitter', w: 12, h: 12, hp: 2, dmg: 2, speed: 1.5,
      ai: 'hopper'
    },
    burrower: {
      art: 'foe.burrower', w: 12, h: 10, hp: 2, dmg: 2, speed: 0.9,
      ai: 'burrower'
    },
    nightwing: {
      art: 'foe.nightwing', w: 12, h: 8, hp: 1, dmg: 2, speed: 1.1,
      ai: 'flier', ghost: true
    },
    bonepike: {
      art: 'foe.bonepike', w: 12, h: 14, hp: 3, dmg: 4, speed: 0.7,
      ai: 'walker', mirror: true
    },
    ooze: {
      art: 'foe.ooze', w: 10, h: 10, hp: 2, dmg: 2, speed: 0.4,
      ai: 'creeper', splits: 'oozeSmall'
    },
    oozeSmall: {
      art: 'foe.oozeSmall', w: 6, h: 6, hp: 1, dmg: 2, speed: 0.7,
      ai: 'creeper'
    },
    hexwright: {
      art: 'foe.hexwright', w: 10, h: 14, hp: 4, dmg: 4, speed: 0,
      ai: 'blinker', shoot: { type: 'bolt', rate: 90 }
    },
    ironward: {
      art: 'foe.ironward', w: 12, h: 14, hp: 8, dmg: 4, speed: 0.7,
      ai: 'walker', armoured: true, mirror: true
    },
    thornmaw: {
      art: 'foe.thornmaw', w: 12, h: 12, hp: 4, dmg: 4, speed: 1.3,
      ai: 'hopper', splits: 'thornmawSmall'
    },
    thornmawSmall: {
      art: 'foe.thornmawSmall', w: 8, h: 8, hp: 2, dmg: 2, speed: 1.5,
      ai: 'hopper'
    },
    wisp: {
      art: 'foe.wisp', w: 8, h: 8, hp: 3, dmg: 4, speed: 0.75,
      ai: 'chaser', ghost: true, shoot: { type: 'flame', rate: 170, range: 90 }
    },
    gorger: {
      art: 'foe.gorger', w: 10, h: 12, hp: 5, dmg: 2, speed: 0.35,
      ai: 'creeper', grabs: true
    },
    wallcrawler: {
      art: 'foe.wallcrawler', w: 12, h: 8, hp: 3, dmg: 0, speed: 1.0,
      ai: 'crawler', ghost: true, sends: true
    }
  };

  function Foe(type, x, y) {
    var s = TYPES[type];
    this.kind = 'foe';
    this.type = type;
    this.spec = s;
    this.w = s.w; this.h = s.h;
    this.x = x; this.y = y;
    this.hp = s.hp;
    this.dir = DIRS[(Math.random() * 4) | 0];
    this.tick = (Math.random() * 60) | 0;
    this.cool = 40 + ((Math.random() * 60) | 0);
    this.dead = false;
    this.hitFlash = 0;
    this.stun = 0;
    this.knock = 0; this.kx = 0; this.ky = 0;
    this.state = 0;
    this.timer = 0;
    this.hidden = false;
    this.spawnGuard = 24;   // a moment of grace before it can hurt you
  }

  Foe.prototype.cx = function () { return this.x + this.w / 2; };
  Foe.prototype.cy = function () { return this.y + this.h / 2; };

  Foe.prototype.canHurt = function () {
    return !this.hidden && this.spawnGuard <= 0 && this.spec.dmg > 0;
  };

  /* Tries to move; returns false when the wall said no. */
  Foe.prototype.step = function (dx, dy) {
    var ghost = this.spec.ghost;
    var nx = this.x + dx, ny = this.y + dy;
    if (!ghost && AV.World.boxSolid(nx, this.y, this.w, this.h)) nx = this.x;
    if (!ghost && AV.World.boxSolid(this.x, ny, this.w, this.h)) ny = this.y;
    /* Nothing walks off the screen. */
    var bx = Math.max(0, Math.min(AV.World.PW - this.w, nx));
    var by = Math.max(0, Math.min(AV.World.PH - this.h, ny));
    var moved = (bx !== this.x || by !== this.y);
    this.x = bx; this.y = by;
    return moved && (nx === bx) && (ny === by);
  };

  Foe.prototype.faceToward = function (p) {
    var dx = p.cx() - this.cx(), dy = p.cy() - this.cy();
    this.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : (dy > 0 ? 's' : 'n');
  };

  Foe.prototype.fire = function (play) {
    var s = this.spec.shoot;
    if (!s || this.hidden) return;
    if (--this.cool > 0) return;
    this.cool = s.rate + ((Math.random() * 60) | 0);
    var p = play.player;
    if (!p) return;
    var dx = p.cx() - this.cx(), dy = p.cy() - this.cy();
    if (s.range && Math.sqrt(dx * dx + dy * dy) > s.range) return;
    if (s.type === 'pellet' || s.type === 'thorn') {
      /* These fire along the way they face, like the originals. */
      var v = VEC[this.dir];
      play.add(AV.Shots.make(s.type, this.cx(), this.cy(), v[0], v[1]));
    } else {
      play.add(AV.Shots.make(s.type, this.cx(), this.cy(), dx, dy));
    }
  };

  /* --- behaviours -------------------------------------------------------- */

  var AI = {
    /* Straight lines, turning at walls and now and then out of sheer whim. */
    walker: function (f, play) {
      var v = VEC[f.dir];
      var sp = f.spec.speed;
      if (!f.step(v[0] * sp, v[1] * sp) || (f.tick % 90 === 0 && Math.random() < 0.4)) {
        f.dir = DIRS[(Math.random() * 4) | 0];
      }
      f.fire(play);
    },

    /* Waits, then leaps in an arc. */
    hopper: function (f, play) {
      if (f.state === 0) {
        f.timer--;
        if (f.timer <= 0) {
          f.state = 1;
          f.timer = 26;
          var p = play.player;
          var ang = Math.random() * Math.PI * 2;
          var dx = Math.cos(ang), dy = Math.sin(ang);
          if (p && Math.random() < 0.55) {
            dx = p.cx() - f.cx(); dy = p.cy() - f.cy();
            var l = Math.sqrt(dx * dx + dy * dy) || 1;
            dx /= l; dy /= l;
          }
          f.hx = dx * f.spec.speed; f.hy = dy * f.spec.speed;
        }
      } else {
        f.timer--;
        if (!f.step(f.hx, f.hy)) { f.hx = -f.hx; f.hy = -f.hy; }
        if (f.timer <= 0) { f.state = 0; f.timer = 24 + ((Math.random() * 30) | 0); }
      }
    },

    /* Under the sand, then up behind you. */
    burrower: function (f, play) {
      f.timer--;
      if (f.state === 0) {           // submerged, travelling
        f.hidden = true;
        var p = play.player;
        if (p) {
          var dx = p.cx() - f.cx(), dy = p.cy() - f.cy();
          var l = Math.sqrt(dx * dx + dy * dy) || 1;
          f.step(dx / l * f.spec.speed, dy / l * f.spec.speed);
        }
        if (f.timer <= 0) { f.state = 1; f.timer = 110; f.hidden = false; }
      } else {                        // surfaced, dangerous
        if (f.timer <= 0) { f.state = 0; f.timer = 90; }
      }
    },

    /* Erratic flight; walls mean nothing to it. */
    flier: function (f, play) {
      if (f.tick % 24 === 0) {
        var a = Math.random() * Math.PI * 2;
        f.fx = Math.cos(a) * f.spec.speed;
        f.fy = Math.sin(a) * f.spec.speed;
      }
      var nx = f.x + (f.fx || 0), ny = f.y + (f.fy || 0);
      if (nx < 0 || nx + f.w > AV.World.PW) { f.fx = -(f.fx || 0); nx = f.x; }
      if (ny < 0 || ny + f.h > AV.World.PH) { f.fy = -(f.fy || 0); ny = f.y; }
      f.x = nx; f.y = ny;
    },

    /* Slow and direct. Nothing else to it, which is the point. */
    creeper: function (f, play) {
      var p = play.player;
      if (!p) return;
      var dx = p.cx() - f.cx(), dy = p.cy() - f.cy();
      var l = Math.sqrt(dx * dx + dy * dy) || 1;
      var sp = f.spec.speed;
      if (!f.step(dx / l * sp, dy / l * sp)) {
        /* slide along whichever axis is still free */
        if (!f.step(dx / l * sp, 0)) f.step(0, dy / l * sp);
      }
      f.faceToward(p);
    },

    /* Like a creeper, but drifts through walls. */
    chaser: function (f, play) {
      var p = play.player;
      if (!p) return;
      var dx = p.cx() - f.cx(), dy = p.cy() - f.cy();
      var l = Math.sqrt(dx * dx + dy * dy) || 1;
      f.x += dx / l * f.spec.speed;
      f.y += dy / l * f.spec.speed;
      f.fire(play);
    },

    /* Fades out, reappears somewhere else, throws a bolt. */
    blinker: function (f, play) {
      f.timer--;
      if (f.state === 0) {            // present
        f.hidden = false;
        f.fire(play);
        if (f.timer <= 0) { f.state = 1; f.timer = 22; }
      } else if (f.state === 1) {     // fading
        if (f.timer <= 0) {
          f.state = 2; f.timer = 30; f.hidden = true;
          var spots = AV.World.freeTiles(play.player ? play.player.cx() : 0,
                                         play.player ? play.player.cy() : 0, 40);
          if (spots.length) {
            var s = spots[(Math.random() * spots.length) | 0];
            f.x = s.x + (T - f.w) / 2; f.y = s.y + (T - f.h) / 2;
          }
        }
      } else {                        // gone
        if (f.timer <= 0) { f.state = 0; f.timer = 120; f.hidden = false; f.cool = 30; }
      }
      if (play.player) f.faceToward(play.player);
    },

    /* Drops off a wall, sweeps across, and puts you back at the door. */
    crawler: function (f, play) {
      var v = VEC[f.dir];
      f.x += v[0] * f.spec.speed;
      f.y += v[1] * f.spec.speed;
      if (f.x < -20 || f.x > AV.World.PW + 20 || f.y < -20 || f.y > AV.World.PH + 20) {
        /* re-enter from another wall */
        f.dir = DIRS[(Math.random() * 4) | 0];
        if (f.dir === 'e') { f.x = -16; f.y = Math.random() * (AV.World.PH - f.h); }
        if (f.dir === 'w') { f.x = AV.World.PW; f.y = Math.random() * (AV.World.PH - f.h); }
        if (f.dir === 's') { f.y = -16; f.x = Math.random() * (AV.World.PW - f.w); }
        if (f.dir === 'n') { f.y = AV.World.PH; f.x = Math.random() * (AV.World.PW - f.w); }
      }
    }
  };

  /* --- lifecycle ---------------------------------------------------------- */

  Foe.prototype.update = function (play) {
    this.tick++;
    if (this.spawnGuard > 0) this.spawnGuard--;
    if (this.hitFlash > 0) this.hitFlash--;

    if (this.knock > 0) {
      this.knock--;
      this.step(this.kx, this.ky);
      this.kx *= 0.86; this.ky *= 0.86;
      return;
    }
    if (this.stun > 0) { this.stun--; return; }

    var ai = AI[this.spec.ai];
    if (ai) ai(this, play);
  };

  /* dirx/diry point from the attacker toward this foe. */
  Foe.prototype.hurt = function (amount, dirx, diry, play, how) {
    if (this.hidden && how !== 'blast') return 'miss';
    if (this.spawnGuard > 6) return 'miss';

    if (this.spec.armoured && how === 'blade') {
      /* An Ironward's plate turns anything struck against its face. */
      var from = Math.abs(dirx) > Math.abs(diry) ? (dirx > 0 ? 'w' : 'e')
                                                 : (diry > 0 ? 'n' : 's');
      if (from === this.dir) {
        AV.Audio.play('block');
        this.knock = 6; this.kx = dirx * 1.2; this.ky = diry * 1.2;
        return 'blocked';
      }
    }

    if (amount <= 0) {          // the Ricochet Stone only rattles them
      this.stun = 90;
      AV.Audio.play('stone');
      return 'stunned';
    }

    this.hp -= amount;
    this.hitFlash = 8;
    this.knock = 10;
    this.kx = dirx * 2.2; this.ky = diry * 2.2;

    if (this.hp <= 0) { this.die(play); return 'killed'; }
    AV.Audio.play('hitEnemy');
    return 'hit';
  };

  Foe.prototype.die = function (play) {
    this.dead = true;
    AV.Audio.play('kill');
    play.fx(AV.Effects.make('poof', this.cx(), this.cy()));

    /* Oozes and thornmaws come apart rather than falling over. */
    var into = this.spec.splits;
    if (into) {
      for (var i = 0; i < 2; i++) {
        var f = Foes.make(into,
          this.cx() - 4 + (i === 0 ? -6 : 6),
          this.cy() - 4);
        f.spawnGuard = 20;
        play.add(f);
      }
      return;
    }
    if (play.onFoeKilled) play.onFoeKilled(this);
  };

  Foe.prototype.draw = function (ox, oy) {
    if (this.hidden && this.spec.ai === 'blinker') {
      if (this.state === 2) return;
    }
    if (this.hidden && this.spec.ai === 'burrower') {
      /* just a disturbance in the sand */
      var img0 = AV.Art.get('fx.ripple', ((this.tick / 8) | 0) % 2);
      AV.Gfx.tint(img0, ox + this.cx() - 4, oy + this.cy() - 2, AV.Gfx.COLORS['g']);
      return;
    }

    var frames = AV.Art.frames(this.spec.art);
    var f = ((this.tick / 10) | 0) % frames;
    var img = (this.spec.mirror && this.dir === 'e')
      ? AV.Art.mirror(this.spec.art, f)
      : AV.Art.get(this.spec.art, f);
    if (!img) return;

    var dx = ox + this.cx() - img.width / 2;
    var dy = oy + this.y + this.h - img.height;

    if (this.stun > 0 && (this.tick % 8) < 4) {
      AV.Gfx.tint(img, dx, dy, AV.Gfx.COLORS['o']);
      return;
    }
    if (this.hitFlash > 0 && (this.hitFlash % 4) < 2) {
      AV.Gfx.tint(img, dx, dy, AV.Gfx.COLORS['8']);
      return;
    }
    AV.Gfx.draw(img, dx, dy);
  };

  var Foes = {
    TYPES: TYPES,
    make: function (type, x, y) { return new Foe(type, x, y); },

    /* Places a screen's roster on free tiles well away from the player. */
    populate: function (list, play, avoidX, avoidY) {
      if (!list) return [];
      var spots = AV.World.freeTiles(avoidX, avoidY, 56);
      var out = [];
      for (var i = 0; i < list.length; i++) {
        var type = list[i][0], n = list[i][1];
        for (var k = 0; k < n; k++) {
          if (!spots.length) break;
          var idx = (Math.random() * spots.length) | 0;
          var s = spots.splice(idx, 1)[0];
          var spec = TYPES[type];
          out.push(new Foe(type, s.x + (T - spec.w) / 2, s.y + (T - spec.h) / 2));
        }
      }
      return out;
    }
  };

  AV.Foes = Foes;
})(window.AV = window.AV || {});
