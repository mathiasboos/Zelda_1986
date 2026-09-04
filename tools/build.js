/* Ashvale — single-file build.
 *
 * Concatenates the stylesheet and every source into one self-contained HTML
 * file. This is only for handing the game to somewhere that can host a single
 * page; the repository itself runs from index.html with nothing built.
 *
 * The output deliberately omits <!doctype>, <html>, <head> and <body>: browsers
 * infer them, and hosts that wrap page content expect them absent.
 *
 * Run: node tools/build.js [outputPath]
 */
'use strict';

var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');
var OUT = process.argv[2] || path.join(ROOT, 'dist', 'ashvale.html');

function read(p) { return fs.readFileSync(path.join(ROOT, p), 'utf8'); }

/* Read the load order out of index.html rather than repeating it here — one
 * list to keep right instead of two that can drift apart. */
function sourceOrder() {
  var html = read('index.html');
  var out = [];
  var re = /<script src="([^"]+)"><\/script>/g;
  var m;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}

var sources = sourceOrder();
if (!sources.length) {
  console.error('no <script src> tags found in index.html — nothing to build');
  process.exit(1);
}

var missing = sources.filter(function (s) { return !fs.existsSync(path.join(ROOT, s)); });
if (missing.length) {
  console.error('index.html references files that do not exist: ' + missing.join(', '));
  process.exit(1);
}

var parts = [];
parts.push('<title>Ashvale — The Sundered Sigil</title>');
parts.push('<style>');
parts.push(read('style.css').trim());
parts.push('</style>');
parts.push('');
parts.push('<main id="stage">');
parts.push('  <canvas id="screen" width="256" height="240" tabindex="0"');
parts.push('          aria-label="Ashvale: The Sundered Sigil — game screen"></canvas>');
parts.push('  <div id="boot">LIGHTING THE LANTERN…</div>');
parts.push('  <p id="keys">');
parts.push('    <b>MOVE</b> arrows / WASD &nbsp;·&nbsp;');
parts.push('    <b>BLADE</b> Z &nbsp;·&nbsp;');
parts.push('    <b>ITEM</b> X &nbsp;·&nbsp;');
parts.push('    <b>SUBSCREEN</b> Enter &nbsp;·&nbsp;');
parts.push('    <b>SOUND</b> Tab');
parts.push('  </p>');
parts.push('</main>');
parts.push('');

sources.forEach(function (src) {
  parts.push('<!-- ' + src + ' -->');
  parts.push('<script>');
  /* A literal </script> inside a string would end the block early. Nothing here
   * contains one, but split it anyway so that stays true if something does. */
  parts.push(read(src).replace(/<\/script>/gi, '<\\/script>').trimEnd());
  parts.push('</script>');
  parts.push('');
});

var html = parts.join('\n') + '\n';

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);

var kb = (Buffer.byteLength(html) / 1024).toFixed(1);
console.log('built ' + path.relative(ROOT, OUT) + '  (' + sources.length + ' sources, ' + kb + ' KB)');
if (Buffer.byteLength(html) > 16 * 1024 * 1024) {
  console.error('output exceeds the 16MB single-page limit');
  process.exit(1);
}
