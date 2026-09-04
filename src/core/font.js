/* Ashvale — bitmap font.
 * A 5x7 face drawn by hand, cell-spaced to 6x8. Rendered once per colour and
 * cached, so text costs no more than blitting sprites. */
(function (AV) {
  'use strict';

  var W = 5, H = 7, ADV = 6, LINE = 9;

  /* Each glyph is 7 rows of 5 columns. '#' inks a pixel. */
  var G = {
    'A': ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    'B': ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
    'C': ['.####', '#....', '#....', '#....', '#....', '#....', '.####'],
    'D': ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
    'E': ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
    'F': ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
    'G': ['.####', '#....', '#....', '#..##', '#...#', '#...#', '.####'],
    'H': ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    'I': ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
    'J': ['####.', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
    'K': ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
    'L': ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
    'M': ['#...#', '##.##', '#.#.#', '#...#', '#...#', '#...#', '#...#'],
    'N': ['#...#', '##..#', '##..#', '#.#.#', '#..##', '#..##', '#...#'],
    'O': ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    'P': ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
    'Q': ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
    'R': ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
    'S': ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
    'T': ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
    'U': ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    'V': ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
    'W': ['#...#', '#...#', '#...#', '#...#', '#.#.#', '##.##', '#...#'],
    'X': ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
    'Y': ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
    'Z': ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
    '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
    '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
    '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
    '3': ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
    '4': ['#..#.', '#..#.', '#..#.', '#####', '...#.', '...#.', '...#.'],
    '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
    '6': ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
    '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
    '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
    '9': ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
    ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
    '.': ['.....', '.....', '.....', '.....', '.....', '.##..', '.##..'],
    ',': ['.....', '.....', '.....', '.....', '.##..', '.##..', '.#...'],
    "'": ['..#..', '..#..', '.....', '.....', '.....', '.....', '.....'],
    '"': ['.#.#.', '.#.#.', '.....', '.....', '.....', '.....', '.....'],
    '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
    '?': ['.###.', '#...#', '....#', '..##.', '..#..', '.....', '..#..'],
    '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
    '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
    ':': ['.....', '.##..', '.##..', '.....', '.##..', '.##..', '.....'],
    ';': ['.....', '.##..', '.##..', '.....', '.##..', '.#...', '#....'],
    '/': ['....#', '....#', '...#.', '..#..', '.#...', '#....', '#....'],
    '(': ['..##.', '.#...', '#....', '#....', '#....', '.#...', '..##.'],
    ')': ['.##..', '...#.', '....#', '....#', '....#', '...#.', '.##..'],
    '<': ['...#.', '..#..', '.#...', '#....', '.#...', '..#..', '...#.'],
    '>': ['.#...', '..#..', '...#.', '....#', '...#.', '..#..', '.#...'],
    '*': ['.....', '#.#.#', '.###.', '#####', '.###.', '#.#.#', '.....'],
    '%': ['##..#', '##.#.', '..#..', '.#...', '#..##', '#..##', '.....'],
    '=': ['.....', '.....', '#####', '.....', '#####', '.....', '.....'],
    '#': ['.#.#.', '#####', '.#.#.', '.#.#.', '#####', '.#.#.', '.....'],
    '~': ['.....', '.....', '.##.#', '#..#.', '.....', '.....', '.....'],
    '^': ['..#..', '.#.#.', '#...#', '.....', '.....', '.....', '.....']
  };

  var Font = { W: W, H: H, ADV: ADV, LINE: LINE, glyphs: G };

  /* One baked sheet per colour, laid out in the order of `order`. */
  var sheets = {};
  var order = [];
  for (var k in G) { if (G.hasOwnProperty(k)) order.push(k); }
  var index = {};
  for (var i = 0; i < order.length; i++) index[order[i]] = i;

  function sheetFor(color) {
    var s = sheets[color];
    if (s) return s;
    var surf = AV.Gfx.surface(order.length * W, H);
    var img = surf.ctx.createImageData(surf.w, surf.h);
    var d = img.data;
    var r = parseInt(color.substr(1, 2), 16);
    var g = parseInt(color.substr(3, 2), 16);
    var b = parseInt(color.substr(5, 2), 16);
    for (var n = 0; n < order.length; n++) {
      var rows = G[order[n]];
      for (var y = 0; y < H; y++) {
        for (var x = 0; x < W; x++) {
          if (rows[y].charAt(x) !== '#') continue;
          var p = (y * surf.w + n * W + x) * 4;
          d[p] = r; d[p + 1] = g; d[p + 2] = b; d[p + 3] = 255;
        }
      }
    }
    surf.ctx.putImageData(img, 0, 0);
    sheets[color] = surf.canvas;
    return surf.canvas;
  }

  Font.width = function (text) {
    return text.length > 0 ? text.length * ADV - 1 : 0;
  };

  Font.draw = function (text, x, y, color) {
    var sheet = sheetFor(color || AV.Gfx.COLORS['7']);
    var ctx = AV.Gfx.ctx;
    text = String(text).toUpperCase();
    var cx = x | 0;
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      var n = index[ch];
      if (n === undefined) { cx += ADV; continue; }
      if (ch !== ' ') ctx.drawImage(sheet, n * W, 0, W, H, cx, y | 0, W, H);
      cx += ADV;
    }
    return cx;
  };

  /* Same face, drawn at an integer multiple — the title needs to be bigger than
   * five pixels tall, and scaling the sheet keeps it on the same grid. */
  Font.big = function (text, x, y, color, scale) {
    var sheet = sheetFor(color || AV.Gfx.COLORS['7']);
    var ctx = AV.Gfx.ctx;
    text = String(text).toUpperCase();
    var cx = x | 0;
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      var n = index[ch];
      if (n === undefined) { cx += ADV * scale; continue; }
      if (ch !== ' ') {
        ctx.drawImage(sheet, n * W, 0, W, H, cx, y | 0, W * scale, H * scale);
      }
      cx += ADV * scale;
    }
    return cx;
  };

  Font.bigWidth = function (text, scale) {
    return text.length > 0 ? text.length * ADV * scale - scale : 0;
  };

  Font.bigCenter = function (text, cx, y, color, scale) {
    text = String(text).toUpperCase();
    return Font.big(text, (cx - Font.bigWidth(text, scale) / 2) | 0, y, color, scale);
  };

  Font.center = function (text, cx, y, color) {
    return Font.draw(text, (cx - Font.width(String(text).toUpperCase()) / 2) | 0, y, color);
  };

  /* Draws with a one-pixel drop shadow — used for anything sitting on busy art. */
  Font.shadow = function (text, x, y, color, shade) {
    Font.draw(text, x + 1, y + 1, shade || AV.Gfx.COLORS['0']);
    return Font.draw(text, x, y, color);
  };

  Font.centerShadow = function (text, cx, y, color, shade) {
    var x = (cx - Font.width(String(text).toUpperCase()) / 2) | 0;
    return Font.shadow(text, x, y, color, shade);
  };

  /* Greedy word wrap to `cols` characters; returns an array of lines. */
  Font.wrap = function (text, cols) {
    var words = String(text).split(/\s+/);
    var lines = [], line = '';
    for (var i = 0; i < words.length; i++) {
      var next = line ? line + ' ' + words[i] : words[i];
      if (next.length > cols && line) { lines.push(line); line = words[i]; }
      else line = next;
    }
    if (line) lines.push(line);
    return lines;
  };

  return (AV.Font = Font);
})(window.AV = window.AV || {});
