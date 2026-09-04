/* Ashvale — art lookup.
 * Resolves a dotted path into the sprite tables and bakes it on first use, so
 * the rest of the game asks for art by name and never touches raw pixel rows.
 * Mirrored and rotated variants are baked and cached the same way. */
(function (AV) {
  'use strict';

  function resolve(path) {
    var parts = path.split('.');
    var node = AV.Sprites;
    for (var i = 0; i < parts.length; i++) {
      node = node[parts[i]];
      if (!node) return null;
    }
    return node;
  }

  var Art = {};

  /* `frame` picks an animation frame when the entry holds several. */
  Art.rows = function (path, frame) {
    var node = resolve(path);
    if (!node) return null;
    if (typeof node[0] === 'string') return node;
    var f = frame || 0;
    return node[f % node.length];
  };

  Art.get = function (path, frame) {
    var rows = Art.rows(path, frame);
    if (!rows) return null;
    return AV.Gfx.sprite(path + '#' + (frame || 0), rows);
  };

  Art.frames = function (path) {
    var node = resolve(path);
    if (!node) return 0;
    return typeof node[0] === 'string' ? 1 : node.length;
  };

  Art.mirror = function (path, frame) {
    var src = Art.get(path, frame);
    if (!src) return null;
    return AV.Gfx.flip(path + '#' + (frame || 0) + '|mx', src, true, false);
  };

  Art.flipY = function (path, frame) {
    var src = Art.get(path, frame);
    if (!src) return null;
    return AV.Gfx.flip(path + '#' + (frame || 0) + '|my', src, false, true);
  };

  Art.rot = function (path, turns, frame) {
    var src = Art.get(path, frame);
    if (!src) return null;
    return AV.Gfx.rotate(path + '#' + (frame || 0) + '|r' + turns, src, turns);
  };

  /* Recoloured copy — one palette key swapped for another. Used for the lesser
   * oozes, ember-touched foes, and Morvane's second shape. */
  Art.swap = function (path, frame, from, to) {
    var rows = Art.rows(path, frame);
    if (!rows) return null;
    var map = {}; map[from] = to;
    return AV.Gfx.sprite(path + '#' + (frame || 0) + '|' + from + to, rows, map);
  };

  AV.Art = Art;
})(window.AV = window.AV || {});
