/* Ashvale — things that fall out of things.
 * Drops follow a weighted table that leans on what the player is short of: a
 * player out of embers sees more of them, one out of blastroot sees more root.
 * Everything dropped blinks out after a while, so a room is never a pantry. */
(function (AV) {
  'use strict';

  var SPEC = {
    heart:      { art: 'item.heart',      w: 8, h: 7 },
    glimmer:    { art: 'item.glimmer',    w: 6, h: 6 },
    glimmerBig: { art: 'item.glimmerBig', w: 6, h: 8 },
    key:        { art: 'item.key',        w: 8, h: 8, keep: true },
    bomb:       { art: 'item.bomb',       w: 8, h: 8 },
    quarrels:   { art: 'shot.arrow',      w: 8, h: 3 },
    fairy:      { art: 'item.fairy',      w: 6, h: 6, drifts: true },
    potion:     { art: 'item.potion',     w: 8, h: 8, keep: true }
  };

  function Pickup(type, x, y) {
    var s = SPEC[type];
    this.kind = 'pickup';
    this.type = type;
    this.spec = s;
    this.w = s.w; this.h = s.h;
    this.x = x - s.w / 2; this.y = y - s.h / 2;
    this.t = 0;
    this.life = s.keep ? 100000 : 460;   // keys and draughts wait for you
    this.dead = false;
    this.vx = 0; this.vy = 0;
  }

  Pickup.prototype.cx = function () { return this.x + this.w / 2; };
  Pickup.prototype.cy = function () { return this.y + this.h / 2; };

  Pickup.prototype.update = function () {
    this.t++;
    if (this.spec.drifts) {
      /* Fairies wander, and are worth chasing. */
      if (this.t % 40 === 0) {
        var a = Math.random() * Math.PI * 2;
        this.vx = Math.cos(a) * 0.7; this.vy = Math.sin(a) * 0.7;
      }
      var nx = this.x + this.vx, ny = this.y + this.vy;
      if (!AV.World.boxOutside(nx, ny, this.w, this.h)) { this.x = nx; this.y = ny; }
      else { this.vx = -this.vx; this.vy = -this.vy; }
    }
    if (--this.life <= 0) this.dead = true;
  };

  Pickup.prototype.draw = function (ox, oy) {
    /* blink out the last couple of seconds */
    if (this.life < 120 && (this.t % 8) < 3) return;
    var y = this.y;
    if (this.spec.drifts) y += Math.sin(this.t / 6) * 1.5;
    AV.Gfx.draw(AV.Art.get(this.spec.art), ox + this.x, oy + y);
  };

  /* Weighted table. Weights shift toward whatever the player is running low on,
   * so a bad run tends to correct itself rather than spiral. */
  function table(save) {
    var t = [
      { type: null,         w: 26 },
      { type: 'heart',      w: save.hearts <= 4 ? 34 : 18 },
      { type: 'glimmer',    w: 22 },
      { type: 'glimmerBig', w: 7 }
    ];
    if (save.items.bombs) t.push({ type: 'bomb', w: save.bombs === 0 ? 16 : 8 });
    if (save.items.bow)   t.push({ type: 'quarrels', w: save.quarrels < 5 ? 12 : 5 });
    if (save.hearts <= 2) t.push({ type: 'fairy', w: 8 });
    return t;
  }

  var Pickups = {
    SPEC: SPEC,
    make: function (type, x, y) { return new Pickup(type, x, y); },

    /* Returns a pickup, or null when nothing falls. */
    roll: function (save, x, y) {
      var t = table(save);
      var total = 0, i;
      for (i = 0; i < t.length; i++) total += t[i].w;
      var r = Math.random() * total;
      for (i = 0; i < t.length; i++) {
        r -= t[i].w;
        if (r <= 0) return t[i].type ? new Pickup(t[i].type, x, y) : null;
      }
      return null;
    },

    /* How much each pickup is worth when Kaelen walks over it. */
    collect: function (p, save) {
      switch (p.type) {
        case 'heart':      save.hearts = Math.min(save.maxHearts, save.hearts + 2); return 'heart';
        case 'glimmer':    save.glimmers = Math.min(999, save.glimmers + 1); return 'pickup';
        case 'glimmerBig': save.glimmers = Math.min(999, save.glimmers + 5); return 'pickup';
        case 'key':        save.keys++; return 'key';
        case 'bomb':       save.bombs = Math.min(30, save.bombs + 4); return 'pickup';
        case 'quarrels':   save.quarrels = Math.min(60, save.quarrels + 5); return 'pickup';
        case 'potion':     save.potions = Math.min(4, save.potions + 1); return 'pickup';
        case 'fairy':      save.hearts = Math.min(save.maxHearts, save.hearts + 6); return 'heart';
      }
      return 'pickup';
    }
  };

  AV.Pickups = Pickups;
})(window.AV = window.AV || {});
