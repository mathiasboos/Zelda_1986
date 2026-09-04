/* Ashvale — tiles.
 * Tiles are painted procedurally rather than hand-authored: a seeded scatter
 * gives every patch of grass or stone its own speckle, so large areas read as
 * texture instead of a repeated stamp. Four variants per tile per theme are
 * baked at boot and chosen by a hash of the tile's position, which keeps the
 * world stable across redraws and saves.
 *
 * Overworld and barrow interiors use separate tables, so the same character can
 * mean grass in one and floor in the other. */
(function (AV) {
  'use strict';

  var C = AV.Gfx.COLORS;
  var T = 16;

  /* --- deterministic noise ------------------------------------------- */

  function hash(x, y, s) {
    var n = (x | 0) * 374761393 + (y | 0) * 668265263 + (s | 0) * 1274126177;
    n = (n ^ (n >> 13)) | 0;
    n = (n * 1274126177) | 0;
    return ((n ^ (n >> 16)) >>> 0) / 4294967296;
  }

  /* A tiny seeded generator for use inside a single tile's painter. */
  function rng(seed) {
    var s = (seed * 2654435761) >>> 0;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }

  /* --- palette themes -------------------------------------------------- */

  /* Each region recolours the same painters. Roles:
   *   g0 base ground, g1 lighter speckle, g2 darker speckle
   *   s0 solid body, s1 solid highlight, s2 solid shadow/outline
   *   ac accent (foliage, moss, trim) */
  var THEMES = {
    wood:  { g0: C['i'], g1: C['k'], g2: C['h'], s0: C['h'], s1: C['j'], s2: C['0'], ac: C['e'],
             p0: C['g'], p1: C['f'], p2: C['t'] },
    salt:  { g0: C['f'], g1: C['6'], g2: C['g'], s0: C['5'], s1: C['6'], s2: C['3'], ac: C['g'],
             p0: C['f'], p1: C['6'], p2: C['g'] },
    crag:  { g0: C['4'], g1: C['5'], g2: C['3'], s0: C['3'], s1: C['4'], s2: C['0'], ac: C['2'],
             p0: C['4'], p1: C['5'], p2: C['3'] },
    mire:  { g0: C['u'], g1: C['v'], g2: C['h'], s0: C['h'], s1: C['i'], s2: C['0'], ac: C['g'],
             p0: C['g'], p1: C['f'], p2: C['t'] },
    downs: { g0: C['p'], g1: C['q'], g2: C['1'], s0: C['2'], s1: C['3'], s2: C['0'], ac: C['r'],
             p0: C['3'], p1: C['4'], p2: C['2'] },

    /* The barrows: stone, not timber. barrow1 keeps a warm cast from the roots
     * pushing through it, without going the whole way to orange. */
    barrow1: { g0: C['3'], g1: C['4'], g2: C['2'], s0: C['g'], s1: C['f'], s2: C['0'], ac: C['t'] },
    barrow2: { g0: C['2'], g1: C['3'], g2: C['1'], s0: C['u'], s1: C['v'], s2: C['0'], ac: C['h'] },
    barrow3: { g0: C['3'], g1: C['5'], g2: C['2'], s0: C['5'], s1: C['6'], s2: C['0'], ac: C['4'] },
    barrow4: { g0: C['p'], g1: C['q'], g2: C['1'], s0: C['q'], s1: C['r'], s2: C['0'], ac: C['s'] },
    lair:    { g0: C['1'], g1: C['2'], g2: C['0'], s0: C['9'], s1: C['t'], s2: C['0'], ac: C['b'] },
    cave:    { g0: C['2'], g1: C['3'], g2: C['1'], s0: C['3'], s1: C['4'], s2: C['0'], ac: C['e'] }
  };

  /* --- painters -------------------------------------------------------- */
  /* Each takes (ctx, theme, rand) and paints one 16x16 tile at the origin. */

  function px(ctx, x, y, col) { ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1); }
  function box(ctx, x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); }

  var PAINT = {
    ground: function (ctx, th, r) {
      box(ctx, 0, 0, T, T, th.g0);
      var n = 6 + (r() * 5 | 0);
      for (var i = 0; i < n; i++) {
        px(ctx, r() * T | 0, r() * T | 0, r() < 0.55 ? th.g1 : th.g2);
      }
      /* a few two-pixel tufts to break up the noise */
      for (var j = 0; j < 3; j++) {
        var tx = r() * (T - 1) | 0, ty = r() * (T - 1) | 0;
        px(ctx, tx, ty, th.g1); px(ctx, tx, ty + 1, th.g1);
      }
    },

    sand: function (ctx, th, r) {
      var b = th.p0 || th.g0, l = th.p1 || th.g1, d = th.p2 || th.g2;
      box(ctx, 0, 0, T, T, b);
      for (var i = 0; i < 14; i++) px(ctx, r() * T | 0, r() * T | 0, r() < 0.5 ? l : d);
      /* faint drift lines, as if something has been walking here */
      for (var y = 2; y < T; y += 5) {
        var w = 3 + (r() * 6 | 0), x = r() * (T - w) | 0;
        box(ctx, x, y, w, 1, d);
      }
    },

    path: function (ctx, th, r) {
      box(ctx, 0, 0, T, T, th.g2);
      for (var i = 0; i < 14; i++) px(ctx, r() * T | 0, r() * T | 0, r() < 0.5 ? th.g0 : th.g1);
    },

    reeds: function (ctx, th, r) {
      PAINT.ground(ctx, th, r);
      for (var i = 0; i < 5; i++) {
        var x = 1 + (r() * (T - 2) | 0), h = 4 + (r() * 5 | 0), y = T - h - 1;
        box(ctx, x, y, 1, h, th.g1);
        px(ctx, x, y, th.ac);
      }
    },

    tree: function (ctx, th, r) {
      box(ctx, 0, 0, T, T, th.g0);
      /* trunk */
      box(ctx, 7, 10, 2, 6, th.ac);
      /* canopy: a rough blob, outlined */
      box(ctx, 3, 1, 10, 10, th.s0);
      box(ctx, 2, 3, 12, 6, th.s0);
      box(ctx, 4, 0, 8, 12, th.s0);
      for (var i = 0; i < 12; i++) {
        var x = 3 + (r() * 10 | 0), y = 1 + (r() * 9 | 0);
        px(ctx, x, y, r() < 0.6 ? th.s1 : th.s2);
      }
      /* bottom shadow so canopies read as above the ground */
      box(ctx, 4, 11, 8, 1, th.s2);
    },

    bush: function (ctx, th, r) {
      box(ctx, 0, 0, T, T, th.g0);
      box(ctx, 2, 4, 12, 9, th.s0);
      box(ctx, 3, 3, 10, 11, th.s0);
      box(ctx, 1, 6, 14, 5, th.s0);
      for (var i = 0; i < 14; i++) {
        px(ctx, 2 + (r() * 12 | 0), 4 + (r() * 9 | 0), r() < 0.6 ? th.s1 : th.s2);
      }
      box(ctx, 3, 13, 10, 1, th.s2);
    },

    rock: function (ctx, th, r, cracked) {
      box(ctx, 0, 0, T, T, th.g0);
      box(ctx, 1, 3, 14, 11, th.s0);
      box(ctx, 3, 1, 10, 14, th.s0);
      /* lit top-left facet, shaded bottom-right */
      box(ctx, 3, 2, 8, 3, th.s1);
      box(ctx, 2, 4, 4, 5, th.s1);
      box(ctx, 9, 9, 5, 4, th.s2);
      box(ctx, 5, 12, 8, 2, th.s2);
      for (var i = 0; i < 6; i++) px(ctx, 2 + (r() * 12 | 0), 2 + (r() * 12 | 0), th.s2);
      /* Bombable rock carries one hairline crack — findable, but you have to look. */
      if (cracked) {
        box(ctx, 8, 4, 1, 3, th.s2);
        box(ctx, 7, 7, 1, 2, th.s2);
        box(ctx, 8, 9, 1, 2, th.s2);
      }
    },
    rockCracked: function (ctx, th, r) { PAINT.rock(ctx, th, r, true); },

    mountain: function (ctx, th, r) {
      box(ctx, 0, 0, T, T, th.s0);
      /* jagged strata */
      for (var y = 0; y < T; y += 4) {
        for (var x = 0; x < T; x++) {
          if (((x + y) % 7) === 0) px(ctx, x, y, th.s2);
        }
        box(ctx, 0, y, T, 1, th.s2);
      }
      for (var i = 0; i < 10; i++) px(ctx, r() * T | 0, r() * T | 0, th.s1);
      box(ctx, 0, 0, T, 1, th.s1);
    },

    water: function (ctx, th, r) {
      box(ctx, 0, 0, T, T, C['m']);
      for (var y = 1; y < T; y += 4) {
        var x = (r() * 6 | 0);
        box(ctx, x, y, 5, 1, C['n']);
        box(ctx, x + 8, y + 2, 4, 1, C['n']);
      }
      for (var i = 0; i < 4; i++) px(ctx, r() * T | 0, r() * T | 0, C['o']);
    },

    chasm: function (ctx, th, r) {
      box(ctx, 0, 0, T, T, C['0']);
      box(ctx, 0, 0, T, 2, th.g2);
      box(ctx, 0, 0, 2, T, th.g2);
      for (var i = 0; i < 6; i++) px(ctx, 2 + (r() * 13 | 0), 2 + (r() * 13 | 0), C['1']);
    },

    bridge: function (ctx, th, r) {
      PAINT.water(ctx, th, r);
      box(ctx, 0, 3, T, 10, C['e']);
      box(ctx, 0, 3, T, 1, C['g']);
      box(ctx, 0, 12, T, 1, C['g']);
      for (var x = 1; x < T; x += 4) box(ctx, x, 4, 1, 8, C['g']);
    },

    dock: function (ctx, th, r) {
      PAINT.ground(ctx, th, r);
      box(ctx, 2, 6, 12, 7, C['e']);
      box(ctx, 2, 6, 12, 1, C['f']);
      for (var x = 3; x < 14; x += 3) box(ctx, x, 7, 1, 6, C['g']);
    },

    cave: function (ctx, th, r) {
      box(ctx, 0, 0, T, T, th.s0);
      for (var i = 0; i < 12; i++) px(ctx, r() * T | 0, r() * T | 0, th.s2);
      /* dark mouth */
      box(ctx, 3, 5, 10, 11, C['0']);
      box(ctx, 4, 3, 8, 3, C['0']);
      box(ctx, 5, 2, 6, 2, C['0']);
      box(ctx, 3, 5, 10, 1, th.s2);
    },

    stairs: function (ctx, th, r) {
      box(ctx, 0, 0, T, T, th.g0);
      box(ctx, 1, 1, 14, 14, C['0']);
      for (var i = 0; i < 4; i++) {
        box(ctx, 2 + i, 2 + i * 3, 12 - i * 2, 2, i % 2 ? th.s1 : th.g1);
      }
    },

    statue: function (ctx, th, r) {
      box(ctx, 0, 0, T, T, th.g0);
      box(ctx, 4, 2, 8, 13, th.s0);
      box(ctx, 3, 12, 10, 3, th.s0);
      box(ctx, 5, 3, 6, 4, th.s1);
      px(ctx, 6, 5, C['0']); px(ctx, 9, 5, C['0']);
      box(ctx, 5, 8, 6, 1, th.s2);
      box(ctx, 3, 14, 10, 1, th.s2);
    },

    /* --- barrow interiors --- */

    floor: function (ctx, th, r) {
      box(ctx, 0, 0, T, T, th.g0);
      /* Flagstones: a thin mortar seam on two sides, not a full band across
       * every tile — that read as stripes once a room was tiled with it. */
      box(ctx, 0, 0, T, 1, th.g2);
      box(ctx, 0, 0, 1, T, th.g2);
      px(ctx, 1, 1, th.g1);
      for (var i = 0; i < 6; i++) px(ctx, 2 + (r() * 13 | 0), 2 + (r() * 13 | 0), th.g2);
      for (var j = 0; j < 3; j++) px(ctx, 2 + (r() * 13 | 0), 2 + (r() * 13 | 0), th.g1);
    },

    wall: function (ctx, th, r) {
      box(ctx, 0, 0, T, T, th.s0);
      /* two courses of offset brick */
      box(ctx, 0, 0, T, 1, th.s2);
      box(ctx, 0, 7, T, 1, th.s2);
      box(ctx, 0, 15, T, 1, th.s2);
      box(ctx, 7, 1, 1, 6, th.s2);
      box(ctx, 3, 8, 1, 7, th.s2);
      box(ctx, 11, 8, 1, 7, th.s2);
      box(ctx, 0, 1, T, 1, th.s1);
      box(ctx, 0, 8, T, 1, th.s1);
      for (var i = 0; i < 5; i++) px(ctx, r() * T | 0, r() * T | 0, th.s1);
    },

    block: function (ctx, th, r) {
      box(ctx, 0, 0, T, T, th.s0);
      box(ctx, 1, 1, 14, 14, th.s1);
      box(ctx, 3, 3, 10, 10, th.s0);
      box(ctx, 0, 0, T, 1, th.s1);
      box(ctx, 0, T - 1, T, 1, th.s2);
      box(ctx, 0, 0, 1, T, th.s1);
      box(ctx, T - 1, 0, 1, T, th.s2);
      box(ctx, 4, 4, 8, 1, th.ac);
      box(ctx, 4, 11, 8, 1, th.ac);
    },

    pit: function (ctx, th, r) {
      box(ctx, 0, 0, T, T, C['0']);
      box(ctx, 0, 0, T, 3, th.g2);
      box(ctx, 0, 0, 3, T, th.g2);
      box(ctx, 0, 0, T, 1, th.g0);
    },

    brazier: function (ctx, th, r) {
      PAINT.floor(ctx, th, r);
      box(ctx, 5, 9, 6, 5, C['3']);
      box(ctx, 4, 13, 8, 2, C['2']);
      box(ctx, 6, 5, 4, 4, C['b']);
      box(ctx, 7, 3, 2, 3, C['c']);
      px(ctx, 7, 6, C['7']); px(ctx, 8, 6, C['7']);
    },

    rubble: function (ctx, th, r) {
      PAINT.floor(ctx, th, r);
      for (var i = 0; i < 9; i++) {
        var x = r() * (T - 2) | 0, y = r() * (T - 2) | 0;
        box(ctx, x, y, 2, 2, r() < 0.5 ? th.s0 : th.s1);
      }
    }
  };

  /* --- tile tables ------------------------------------------------------ */
  /* solid: blocks movement. pass: item id that makes it passable.
   * burn/bomb: what the tile becomes when torched or blown open. */

  var OVER = {
    '.': { paint: 'ground' },
    ',': { paint: 'sand' },
    ':': { paint: 'path' },
    '"': { paint: 'reeds' },
    '-': { paint: 'bridge' },
    'D': { paint: 'dock', dock: true },
    'T': { paint: 'tree', solid: true },
    't': { paint: 'bush', solid: true, burn: '.' },
    'R': { paint: 'rock', solid: true },
    'r': { paint: 'rockCracked', solid: true, bomb: '.' },
    'M': { paint: 'mountain', solid: true },
    'W': { paint: 'water', solid: true, water: true },
    'G': { paint: 'chasm', solid: true, pass: 'vine' },
    'X': { paint: 'statue', solid: true },
    '^': { paint: 'cave', portal: true },
    'v': { paint: 'stairs', portal: true }
  };

  var DGN = {
    '.': { paint: 'floor' },
    ',': { paint: 'rubble' },
    '#': { paint: 'wall', solid: true },
    'B': { paint: 'block', solid: true, push: true },
    'X': { paint: 'statue', solid: true },
    'f': { paint: 'brazier', solid: true, lit: true },
    '~': { paint: 'water', solid: true, water: true },
    'G': { paint: 'pit', solid: true, pass: 'vine' },
    '^': { paint: 'stairs', portal: true },
    'v': { paint: 'stairs', portal: true }
  };

  /* --- baking ----------------------------------------------------------- */

  var VARIANTS = 4;
  var baked = {};   // "theme|char" -> [canvas x4]

  function bakeTile(table, ch, themeName) {
    var def = table[ch];
    var th = THEMES[themeName] || THEMES.wood;
    var out = [];
    for (var v = 0; v < VARIANTS; v++) {
      var s = AV.Gfx.surface(T, T);
      var r = rng(ch.charCodeAt(0) * 977 + v * 7919 + themeName.length * 31);
      PAINT[def.paint](s.ctx, th, r);
      out.push(s.canvas);
    }
    return out;
  }

  var Tiles = {
    T: T,
    THEMES: THEMES,
    over: OVER,
    dgn: DGN,
    hash: hash,

    def: function (ch, indoors) {
      var t = (indoors ? DGN : OVER)[ch];
      return t || (indoors ? DGN['.'] : OVER['.']);
    },

    /* Painted image for one tile. tx/ty pick the variant so the world looks
     * the same every time it is drawn. */
    image: function (ch, themeName, indoors, tx, ty) {
      var key = themeName + '|' + (indoors ? 'd' : 'o') + '|' + ch;
      var set = baked[key];
      if (!set) {
        var table = indoors ? DGN : OVER;
        if (!table[ch]) ch = '.';
        set = baked[key] = bakeTile(table, ch, themeName);
      }
      var v = (hash(tx, ty, themeName.charCodeAt(0)) * VARIANTS) | 0;
      return set[v === VARIANTS ? VARIANTS - 1 : v];
    },

    isSolid: function (ch, indoors, has) {
      var d = Tiles.def(ch, indoors);
      if (!d.solid) return false;
      if (d.pass && has && has(d.pass)) return false;
      return true;
    },

    isWater: function (ch, indoors) { return !!Tiles.def(ch, indoors).water; }
  };

  AV.Tiles = Tiles;
})(window.AV = window.AV || {});
