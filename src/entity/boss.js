/* Ashvale — the five that guard the shards.
 * Each boss is the same object with a different brain. They are drawn at double
 * scale, which is why their art is authored small.
 *
 * Every one of them has a rule you have to work out: Coilfang has none and is
 * the teacher, the Twin Maws only ever bleed from the inside, the Hollow Choir
 * opens its eye for exactly one thing, the Gravewyrm has to be taken apart, and
 * Morvane stops being solid halfway through. */
(function (AV) {
  'use strict';

  var T = 16;
  var SCALE = 2;

  function drawBig(img, x, y) {
    if (!img) return;
    AV.Gfx.ctx.drawImage(img, x | 0, y | 0, img.width * SCALE, img.height * SCALE);
  }

  function tintBig(img, x, y, color, alpha) {
    if (!img) return;
    var key = '#bosstint' + img.width + 'x' + img.height;
    var s = AV.Gfx.cache[key];
    if (!s) { s = AV.Gfx.cache[key] = AV.Gfx.surface(img.width, img.height); }
    s.ctx.clearRect(0, 0, s.w, s.h);
    s.ctx.globalCompositeOperation = 'source-over';
    s.ctx.drawImage(img, 0, 0);
    s.ctx.globalCompositeOperation = 'source-in';
    s.ctx.fillStyle = color;
    s.ctx.fillRect(0, 0, s.w, s.h);
    s.ctx.globalCompositeOperation = 'source-over';
    var c = AV.Gfx.ctx;
    if (alpha !== undefined) { c.save(); c.globalAlpha = alpha; }
    c.drawImage(s.canvas, x | 0, y | 0, s.w * SCALE, s.h * SCALE);
    if (alpha !== undefined) c.restore();
  }

  var SPECS = {
    coilfang: {
      art: 'boss.coilfang', w: 40, h: 36, hp: 16, dmg: 4,
      title: 'COILFANG',
      spawn: { x: 108, y: 40 }
    },
    twinmaws: {
      art: 'boss.twinmaws', w: 40, h: 36, hp: 12, dmg: 4,
      title: 'THE TWIN MAWS',
      spawn: { x: 108, y: 44 },
      only: 'blast'
    },
    hollowchoir: {
      art: 'boss.hollowchoir', w: 40, h: 36, hp: 12, dmg: 4,
      title: 'THE HOLLOW CHOIR',
      spawn: { x: 108, y: 40 },
      only: 'arrow'
    },
    gravewyrm: {
      art: 'boss.gravewyrm', w: 40, h: 24, hp: 14, dmg: 4,
      title: 'GRAVEWYRM',
      spawn: { x: 108, y: 40 }
    },
    morvane: {
      art: 'boss.morvane', w: 32, h: 32, hp: 24, dmg: 6,
      title: 'MORVANE, THE ASHEN KING',
      spawn: { x: 112, y: 44 }
    }
  };

  function Boss(name, play) {
    var s = SPECS[name];
    this.kind = 'boss';
    this.name = name;
    this.spec = s;
    this.title = s.title;
    this.w = s.w; this.h = s.h;
    this.x = s.spawn.x; this.y = s.spawn.y;
    this.hp = s.hp; this.maxHp = s.hp;
    this.dmg = s.dmg;
    this.dead = false;
    this.tick = 0;
    this.hitFlash = 0;
    this.knock = 0; this.kx = 0; this.ky = 0;
    this.phase = 0;
    this.timer = 90;
    this.state = 0;
    this.vx = 0.7; this.vy = 0;
    this.open = false;        // maw / eye open
    this.vulnerable = true;
    this.spawnGuard = 40;
    this.parts = [];
    this.dying = 0;
    this.play = play;
    if (BRAIN[name].init) BRAIN[name].init(this, play);
  }

  Boss.prototype.cx = function () { return this.x + this.w / 2; };
  Boss.prototype.cy = function () { return this.y + this.h / 2; };
  Boss.prototype.canHurt = function () { return this.spawnGuard <= 0 && this.dying === 0; };

  Boss.prototype.drift = function (dx, dy) {
    var nx = this.x + dx, ny = this.y + dy;
    var pad = 2 * T;
    if (nx < pad) { nx = pad; this.vx = Math.abs(this.vx); }
    if (nx + this.w > AV.World.PW - pad) { nx = AV.World.PW - pad - this.w; this.vx = -Math.abs(this.vx); }
    if (ny < pad) { ny = pad; this.vy = Math.abs(this.vy); }
    if (ny + this.h > AV.World.PH - pad) { ny = AV.World.PH - pad - this.h; this.vy = -Math.abs(this.vy); }
    this.x = nx; this.y = ny;
  };

  Boss.prototype.shootAt = function (play, type, spread) {
    var p = play.player;
    if (!p) return;
    var dx = p.cx() - this.cx(), dy = p.cy() - this.cy();
    var a = Math.atan2(dy, dx);
    var n = spread || 1;
    for (var i = 0; i < n; i++) {
      var off = (i - (n - 1) / 2) * 0.32;
      play.add(AV.Shots.make(type, this.cx(), this.cy() + 6,
        Math.cos(a + off), Math.sin(a + off)));
    }
  };

  /* --- brains -------------------------------------------------------------- */

  var BRAIN = {

    /* Paces the room and spits a fan of bolts. Nothing hidden — it is here to
     * teach you that bosses take more than two hits. */
    coilfang: function (b, play) {
      b.drift(b.vx, Math.sin(b.tick / 50) * 0.5);
      if (--b.timer <= 0) {
        b.timer = 84;
        b.open = true;
        AV.Audio.play('bossHurt');
        b.shootAt(play, 'bolt', 3);
      }
      if (b.timer < 70) b.open = false;
      if (b.tick % 210 === 0) b.vx = -b.vx;
    },

    /* Armour-plated. A blade rings off it. It only ever swallows what it is
     * given, so the answer is to give it blastroot while a maw is open. */
    twinmaws: function (b, play) {
      b.drift(b.vx * 0.8, 0);
      b.timer--;
      if (b.state === 0) {
        b.open = false;
        if (b.timer <= 0) { b.state = 1; b.timer = 90; b.open = true; }
      } else {
        b.open = true;
        if (b.timer % 30 === 0) b.shootAt(play, 'flame', 1);
        if (b.timer <= 0) { b.state = 0; b.timer = 80; b.open = false; }
      }
      if (b.tick % 160 === 0) b.vx = -b.vx;
    },

    /* Floats a slow figure and keeps its eye shut. The eye opens on a beat, and
     * only a quarrel finds anything behind it. */
    hollowchoir: function (b, play) {
      b.x = 108 + Math.sin(b.tick / 64) * 62;
      b.y = 40 + Math.sin(b.tick / 37) * 22;
      b.timer--;
      if (b.state === 0) {
        b.open = false;
        if (b.timer <= 0) { b.state = 1; b.timer = 96; b.open = true; AV.Audio.play('bossHurt'); }
      } else {
        b.open = true;
        if (b.timer % 34 === 0) b.shootAt(play, 'bolt', 2);
        if (b.timer <= 0) { b.state = 0; b.timer = 70; }
      }
      /* keeps a little choir of wisps around it */
      if (b.tick % 260 === 0 && play.player) {
        var spots = AV.World.freeTiles(play.player.cx(), play.player.cy(), 44);
        if (spots.length) {
          var s = spots[(Math.random() * spots.length) | 0];
          play.add(AV.Foes.make('wisp', s.x + 4, s.y + 4));
        }
      }
    },

    /* The body barely moves. It keeps sending heads out on long necks, and
     * will not die while any of them is still flying. */
    gravewyrm: {
      init: function (b, play) {
        b.heads = [];
        for (var i = 0; i < 3; i++) {
          b.heads.push({
            alive: true, hp: 4, x: b.cx() - 8, y: b.cy(),
            w: 16, h: 16, out: 0, ang: (i / 3) * Math.PI * 2,
            state: 0, timer: 60 + i * 50, flash: 0
          });
        }
      },
      tickFn: function (b, play) {
        b.x = 108 + Math.sin(b.tick / 90) * 30;
        var p = play.player;
        var alive = 0;
        for (var i = 0; i < b.heads.length; i++) {
          var hd = b.heads[i];
          if (!hd.alive) continue;
          alive++;
          hd.timer--;
          if (hd.state === 0) {
            /* coiled against the body */
            hd.ang += 0.02;
            hd.x = b.cx() - 8 + Math.cos(hd.ang) * 26;
            hd.y = b.cy() - 8 + Math.sin(hd.ang) * 16;
            if (hd.timer <= 0) { hd.state = 1; hd.timer = 130; }
          } else {
            /* out hunting */
            if (p) {
              var dx = p.cx() - (hd.x + 8), dy = p.cy() - (hd.y + 8);
              var l = Math.sqrt(dx * dx + dy * dy) || 1;
              hd.x += dx / l * 1.25; hd.y += dy / l * 1.25;
            }
            if (hd.timer <= 0) { hd.state = 0; hd.timer = 110; }
          }
          if (hd.flash > 0) hd.flash--;
        }
        b.vulnerable = (alive === 0);
        b.headsAlive = alive;
        if (alive > 0 && b.tick % 150 === 0) b.shootAt(play, 'rock', 2);
      }
    },

    /* Two shapes. The first is heavy and comes at you. The second is barely
     * there at all, and only the reforged Sigil gives it edges to cut. */
    morvane: function (b, play) {
      var p = play.player;
      if (b.phase === 0) {
        if (b.hp <= b.maxHp / 2) {
          b.phase = 1; b.timer = 40; b.state = 0;
          AV.Audio.play('bossDie');
          play.shake(28);
          play.say('HE STOPS BEING SOLID.', 150);
          return;
        }
        b.timer--;
        if (b.state === 0) {          // stalk
          if (p) {
            var dx = p.cx() - b.cx(), dy = p.cy() - b.cy();
            var l = Math.sqrt(dx * dx + dy * dy) || 1;
            b.drift(dx / l * 0.55, dy / l * 0.55);
          }
          if (b.timer <= 0) { b.state = 1; b.timer = 46; }
        } else {                       // hurl
          if (b.timer === 44) { b.shootAt(play, 'rock', 3); AV.Audio.play('bossHurt'); }
          if (b.timer <= 0) { b.state = 0; b.timer = 120; }
        }
      } else {
        /* blink phase: solid only in flashes */
        b.timer--;
        if (b.timer <= 0) {
          b.state = b.state === 0 ? 1 : 0;
          b.timer = b.state === 0 ? 70 : 46;
          if (b.state === 0) {
            var spots = AV.World.freeTiles(p ? p.cx() : 0, p ? p.cy() : 0, 52);
            if (spots.length) {
              var s = spots[(Math.random() * spots.length) | 0];
              b.x = Math.max(32, Math.min(AV.World.PW - 32 - b.w, s.x - 8));
              b.y = Math.max(32, Math.min(AV.World.PH - 32 - b.h, s.y - 8));
            }
            b.shootAt(play, 'bolt', 4);
            AV.Audio.play('bossHurt');
          }
        }
        b.solid = (b.state === 0);
        if (b.solid && p) {
          var mx = p.cx() - b.cx(), my = p.cy() - b.cy();
          var ml = Math.sqrt(mx * mx + my * my) || 1;
          b.drift(mx / ml * 0.85, my / ml * 0.85);
        }
      }
    }
  };

  /* --- shared lifecycle --------------------------------------------------------- */

  Boss.prototype.update = function (play) {
    this.tick++;
    if (this.spawnGuard > 0) this.spawnGuard--;
    if (this.hitFlash > 0) this.hitFlash--;

    if (this.dying > 0) {
      this.dying++;
      if (this.dying % 6 === 0) {
        play.fx(AV.Effects.make('boom',
          this.cx() + (Math.random() * this.w - this.w / 2),
          this.cy() + (Math.random() * this.h - this.h / 2)));
        play.shake(6);
      }
      if (this.dying > 78) {
        this.dead = true;
        AV.Game.bossDown(this);
      }
      return;
    }

    if (this.knock > 0) {
      this.knock--;
      this.x += this.kx; this.y += this.ky;
      this.kx *= 0.8; this.ky *= 0.8;
      return;
    }

    var brain = BRAIN[this.name];
    if (typeof brain === 'function') brain(this, play);
    else if (brain.tickFn) brain.tickFn(this, play);

    /* the Gravewyrm's heads bite on their own */
    if (this.heads) {
      var p = play.player;
      for (var i = 0; i < this.heads.length; i++) {
        var hd = this.heads[i];
        if (!hd.alive || !p || p.invuln > 0) continue;
        if (p.x < hd.x + hd.w && p.x + p.w > hd.x &&
            p.y < hd.y + hd.h && p.y + p.h > hd.y) {
          p.takeDamage(4, hd.x + 8, hd.y + 8, play);
        }
      }
    }
  };

  /* Returns 'hit' | 'blocked' | 'killed' | 'miss'. `box` is the shape that
   * actually landed the blow, which is how a Gravewyrm head can be singled out
   * from the body behind it. */
  Boss.prototype.hurt = function (amount, dirx, diry, play, how, box) {
    if (this.dying > 0 || this.spawnGuard > 6) return 'miss';
    if (amount <= 0) return 'miss';          // the stone does not move them

    /* A head takes the blow before the body does. */
    if (this.heads && box) {
      for (var i = 0; i < this.heads.length; i++) {
        var hd = this.heads[i];
        if (!hd.alive || !boxHit(box, hd)) continue;
        hd.hp -= amount; hd.flash = 8;
        AV.Audio.play('hitEnemy');
        if (hd.hp <= 0) {
          hd.alive = false;
          play.fx(AV.Effects.make('poof', hd.x + 8, hd.y + 8));
          AV.Audio.play('kill');
        }
        return 'hit';
      }
    }

    var only = this.spec.only;
    if (only === 'blast' && how !== 'blast') { clang(this); return 'blocked'; }
    if (only === 'blast' && how === 'blast' && !this.open) { clang(this); return 'blocked'; }
    if (only === 'arrow' && how !== 'arrow') { clang(this); return 'blocked'; }
    if (only === 'arrow' && !this.open) { clang(this); return 'blocked'; }
    if (this.name === 'gravewyrm' && !this.vulnerable) { clang(this); return 'blocked'; }
    if (this.name === 'morvane' && this.phase === 1) {
      if (AV.Game.save.shards < 5) {
        clang(this);
        if (!play.banner) play.say('THE SIGIL IS NOT WHOLE. HE IS NOT THERE.', 150);
        return 'blocked';
      }
      if (!this.solid) { return 'miss'; }
    }

    this.hp -= amount;
    this.hitFlash = 10;
    this.knock = 8;
    this.kx = dirx * 1.6; this.ky = diry * 1.6;
    AV.Audio.play('bossHurt');
    if (this.hp <= 0) {
      this.dying = 1;
      AV.Audio.play('bossDie');
      AV.Audio.stopMusic();
      play.shake(30);
      return 'killed';
    }
    return 'hit';
  };

  function clang(b) {
    AV.Audio.play('block');
    b.hitFlash = 4;
  }

  function boxHit(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  /* --- drawing -------------------------------------------------------------------- */

  Boss.prototype.draw = function (ox, oy) {
    var frames = AV.Art.frames(this.spec.art);
    var f;
    if (this.spec.only) f = this.open ? 1 : 0;
    else f = ((this.tick / 14) | 0) % frames;
    if (this.name === 'morvane') f = this.phase === 1 ? 1 : (((this.tick / 12) | 0) % 2);

    var img = AV.Art.get(this.spec.art, f % frames);
    var dx = ox + this.x, dy = oy + this.y;

    /* the wyrm's heads, on their necks */
    if (this.heads) {
      var ctx = AV.Gfx.ctx;
      for (var i = 0; i < this.heads.length; i++) {
        var hd = this.heads[i];
        if (!hd.alive) continue;
        ctx.strokeStyle = AV.Gfx.COLORS['6'];
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ox + this.cx(), oy + this.cy());
        ctx.lineTo(ox + hd.x + 8, oy + hd.y + 8);
        ctx.stroke();
      }
    }

    if (this.name === 'morvane' && this.phase === 1 && !this.solid) {
      tintBig(img, dx, dy, AV.Gfx.COLORS['r'], 0.22);
    } else if (this.dying > 0 && (this.dying % 6) < 3) {
      tintBig(img, dx, dy, AV.Gfx.COLORS['8']);
    } else if (this.hitFlash > 0 && (this.hitFlash % 4) < 2) {
      tintBig(img, dx, dy, AV.Gfx.COLORS['8']);
    } else {
      drawBig(img, dx, dy);
    }

    if (this.heads) {
      var head0 = AV.Art.get('boss.wyrmhead', ((this.tick / 12) | 0) % 2);
      for (var j = 0; j < this.heads.length; j++) {
        var h2 = this.heads[j];
        if (!h2.alive) continue;
        if (h2.flash > 0 && (h2.flash % 4) < 2) tintBig(head0, ox + h2.x, oy + h2.y, AV.Gfx.COLORS['8']);
        else drawBig(head0, ox + h2.x, oy + h2.y);
      }
    }
  };

  var Bosses = {
    SPECS: SPECS,
    make: function (name, play) { return new Boss(name, play); }
  };

  AV.Bosses = Bosses;
})(window.AV = window.AV || {});
