/* Ashvale — graphics core.
 * Palette, sprite decoding, and the drawing helpers everything else leans on.
 * Sprites live in source as palette-indexed character rows (see data/sprites.js);
 * this module bakes them into offscreen canvases once at boot. */
(function (AV) {
  'use strict';

  var TILE = 16;
  var COLS = 16, ROWS = 11;              // playfield in tiles
  var PLAY_W = COLS * TILE;              // 256
  var PLAY_H = ROWS * TILE;              // 176
  var HUD_H = 64;
  var VIEW_W = PLAY_W;                   // 256
  var VIEW_H = HUD_H + PLAY_H;           // 240

  /* The whole game draws from this one ashen-fantasy ramp. Keys are the
   * characters used in sprite rows; '.' is always transparent. */
  var COLORS = {
    '.': null,
    '0': '#0b0910', // void black
    '1': '#171326', // night
    '2': '#2b2b3d', // slate
    '3': '#44445c', // stone
    '4': '#6d6b7d', // ash
    '5': '#9a9486', // dust
    '6': '#c4bda9', // bone
    '7': '#efe9d6', // paper
    '8': '#fdfbf2', // white
    '9': '#b1352f', // blood
    'a': '#e05a4e', // rose
    'b': '#ff7a2f', // ember
    'c': '#ffb347', // flame
    'd': '#f2c14e', // gold
    'e': '#8a5a24', // bark
    'f': '#c9a26b', // sand
    'g': '#7a5a3a', // dirt
    'h': '#274d24', // pine
    'i': '#3f6b3a', // moss
    'j': '#5d9948', // leaf
    'k': '#7bbf5a', // grass
    'l': '#14304f', // abyss
    'm': '#1e4a75', // deep
    'n': '#2f6f9e', // water
    'o': '#6fb3d9', // shallow
    'p': '#3b2145', // plum
    'q': '#5d3670', // wine
    'r': '#8a56a6', // violet
    's': '#b98fd0', // orchid
    't': '#5c2f1c', // rust
    'u': '#2f6b63', // verdigris
    'v': '#49a08f'  // patina
  };

  var Gfx = {
    TILE: TILE, COLS: COLS, ROWS: ROWS,
    PLAY_W: PLAY_W, PLAY_H: PLAY_H, HUD_H: HUD_H,
    VIEW_W: VIEW_W, VIEW_H: VIEW_H,
    COLORS: COLORS,
    canvas: null,
    ctx: null,
    scale: 3,
    cache: {}
  };

  /* --- sprite baking ------------------------------------------------- */

  function surface(w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    return { canvas: c, ctx: x, w: w, h: h };
  }
  Gfx.surface = surface;

  /* rows: array of equal-length strings of palette keys.
   * swap: optional {fromKey: toKey} recolour applied while baking. */
  function bake(rows, swap) {
    var h = rows.length, w = rows[0].length;
    var s = surface(w, h);
    var img = s.ctx.createImageData(w, h);
    var d = img.data;
    for (var y = 0; y < h; y++) {
      var row = rows[y];
      for (var x = 0; x < w; x++) {
        var key = row.charAt(x);
        if (swap && swap[key]) key = swap[key];
        var hex = COLORS[key];
        if (!hex) continue;
        var i = (y * w + x) * 4;
        d[i]     = parseInt(hex.substr(1, 2), 16);
        d[i + 1] = parseInt(hex.substr(3, 2), 16);
        d[i + 2] = parseInt(hex.substr(5, 2), 16);
        d[i + 3] = 255;
      }
    }
    s.ctx.putImageData(img, 0, 0);
    return s.canvas;
  }
  Gfx.bake = bake;

  /* Bakes once and remembers. Key must be unique per (sprite, recolour). */
  Gfx.sprite = function (key, rows, swap) {
    var hit = Gfx.cache[key];
    if (!hit) { hit = Gfx.cache[key] = bake(rows, swap); }
    return hit;
  };

  /* Horizontal / vertical mirror of an already-baked canvas. */
  Gfx.flip = function (key, src, fx, fy) {
    var hit = Gfx.cache[key];
    if (hit) return hit;
    var s = surface(src.width, src.height);
    s.ctx.save();
    s.ctx.translate(fx ? src.width : 0, fy ? src.height : 0);
    s.ctx.scale(fx ? -1 : 1, fy ? -1 : 1);
    s.ctx.drawImage(src, 0, 0);
    s.ctx.restore();
    Gfx.cache[key] = s.canvas;
    return s.canvas;
  };

  /* Quarter-turn rotation, used for doors and a few directional props. */
  Gfx.rotate = function (key, src, turns) {
    var hit = Gfx.cache[key];
    if (hit) return hit;
    var odd = turns % 2 !== 0;
    var w = odd ? src.height : src.width;
    var h = odd ? src.width : src.height;
    var s = surface(w, h);
    s.ctx.save();
    s.ctx.translate(w / 2, h / 2);
    s.ctx.rotate(turns * Math.PI / 2);
    s.ctx.drawImage(src, -src.width / 2, -src.height / 2);
    s.ctx.restore();
    Gfx.cache[key] = s.canvas;
    return s.canvas;
  };

  /* --- screen setup --------------------------------------------------- */

  Gfx.attach = function (canvas) {
    Gfx.canvas = canvas;
    canvas.width = VIEW_W;
    canvas.height = VIEW_H;
    Gfx.ctx = canvas.getContext('2d');
    Gfx.ctx.imageSmoothingEnabled = false;
    Gfx.resize();
    window.addEventListener('resize', Gfx.resize);
  };

  /* Integer upscale so pixels stay square and crisp. */
  Gfx.resize = function () {
    if (!Gfx.canvas) return;
    var pad = 16;
    var sx = (window.innerWidth - pad) / VIEW_W;
    var sy = (window.innerHeight - pad) / VIEW_H;
    var s = Math.floor(Math.min(sx, sy));
    if (s < 1) s = 1;
    if (s > 6) s = 6;
    Gfx.scale = s;
    Gfx.canvas.style.width = (VIEW_W * s) + 'px';
    Gfx.canvas.style.height = (VIEW_H * s) + 'px';
  };

  /* --- drawing -------------------------------------------------------- */

  Gfx.clear = function (color) {
    var c = Gfx.ctx;
    c.fillStyle = color || COLORS['0'];
    c.fillRect(0, 0, VIEW_W, VIEW_H);
  };

  Gfx.rect = function (x, y, w, h, color) {
    var c = Gfx.ctx;
    c.fillStyle = color;
    c.fillRect(x | 0, y | 0, w | 0, h | 0);
  };

  Gfx.frame = function (x, y, w, h, color) {
    Gfx.rect(x, y, w, 1, color);
    Gfx.rect(x, y + h - 1, w, 1, color);
    Gfx.rect(x, y, 1, h, color);
    Gfx.rect(x + w - 1, y, 1, h, color);
  };

  Gfx.draw = function (img, x, y) {
    if (img) Gfx.ctx.drawImage(img, x | 0, y | 0);
  };

  /* Silhouette of a sprite in a flat colour — damage flashes, boss tells,
   * and the Ashen King's blink phase all use this. */
  Gfx.tint = function (img, x, y, color, alpha) {
    var key = '#tint' + img.width + 'x' + img.height;
    var s = Gfx.cache[key];
    if (!s) { s = Gfx.cache[key] = surface(img.width, img.height); }
    s.ctx.clearRect(0, 0, s.w, s.h);
    s.ctx.globalCompositeOperation = 'source-over';
    s.ctx.drawImage(img, 0, 0);
    s.ctx.globalCompositeOperation = 'source-in';
    s.ctx.fillStyle = color;
    s.ctx.fillRect(0, 0, s.w, s.h);
    s.ctx.globalCompositeOperation = 'source-over';
    var c = Gfx.ctx;
    if (alpha !== undefined) { c.save(); c.globalAlpha = alpha; }
    c.drawImage(s.canvas, x | 0, y | 0);
    if (alpha !== undefined) c.restore();
  };

  Gfx.ghost = function (img, x, y, alpha) {
    var c = Gfx.ctx;
    c.save();
    c.globalAlpha = alpha;
    c.drawImage(img, x | 0, y | 0);
    c.restore();
  };

  return (AV.Gfx = Gfx);
})(window.AV = window.AV || {});
