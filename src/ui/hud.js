/* Ashvale — the panel above the world.
 * Sixty-four pixels holding a map of where you are, what you are carrying, and
 * how much of you is left. */
(function (AV) {
  'use strict';

  var C = AV.Gfx.COLORS;
  var HUD_H = 64;

  var UI = {};

  function panel(x, y, w, h) {
    AV.Gfx.rect(x, y, w, h, C['1']);
    AV.Gfx.frame(x, y, w, h, C['3']);
  }

  /* --- minimap --------------------------------------------------------- */

  function drawOverMap(x, y) {
    var cw = 8, ch = 7;
    var W = AV.Overworld.W, H = AV.Overworld.H;
    var s = AV.Game.save;
    panel(x - 2, y - 2, W * cw + 4, H * ch + 4);
    for (var ry = 0; ry < H; ry++) {
      for (var rx = 0; rx < W; rx++) {
        var key = rx + ',' + ry;
        var seen = s.visited[key];
        var col = seen ? C['4'] : C['2'];
        AV.Gfx.rect(x + rx * cw, y + ry * ch, cw - 1, ch - 1, col);
      }
    }
    if (AV.World.kind === 'over') {
      var bx = x + AV.World.sx * cw, by = y + AV.World.sy * ch;
      /* blink so it reads at a glance */
      if ((AV.Play.tick % 40) < 26) {
        AV.Gfx.rect(bx, by, cw - 1, ch - 1, C['c']);
      }
    }
  }

  function drawBarrowMap(x, y) {
    var dgn = AV.Dungeons[AV.World.id];
    var b = AV.World.barrow();
    var cw = 7, ch = 6;
    /* find the extent of this barrow so it fits the panel */
    var keys = Object.keys(dgn.rooms);
    var minC = 99, minR = 99, maxC = -1, maxR = -1;
    keys.forEach(function (k) {
      var p = k.split(',');
      minC = Math.min(minC, +p[0]); maxC = Math.max(maxC, +p[0]);
      minR = Math.min(minR, +p[1]); maxR = Math.max(maxR, +p[1]);
    });
    var w = (maxC - minC + 1) * cw, h = (maxR - minR + 1) * ch;
    panel(x - 2, y - 2, Math.max(w, 20) + 4, Math.max(h, 20) + 4);
    keys.forEach(function (k) {
      var p = k.split(',');
      var rx = (+p[0] - minC) * cw + x, ry = (+p[1] - minR) * ch + y;
      var here = (+p[0] === AV.World.sx && +p[1] === AV.World.sy);
      if (!b.map && !here && !AV.Game.save.cleared[AV.World.id + ':' + k]) return;
      AV.Gfx.rect(rx, ry, cw - 1, ch - 1, here ? C['c'] : C['4']);
      /* with the compass, the shard's room is marked */
      if (b.compass && dgn.rooms[k].boss && !here) {
        AV.Gfx.rect(rx + 2, ry + 1, cw - 5, ch - 3, C['a']);
      }
    });
  }

  /* --- counters --------------------------------------------------------- */

  function counter(art, value, x, y) {
    var img = AV.Art.get(art);
    if (img) AV.Gfx.draw(img, x, y + (8 - img.height) / 2);
    AV.Font.draw(pad(value, 3), x + 11, y + 1, C['7']);
  }

  function pad(n, w) {
    var s = '' + n;
    while (s.length < w) s = '0' + s;
    return s;
  }

  /* --- hearts ----------------------------------------------------------- */

  function drawHearts(x, y) {
    var s = AV.Game.save;
    var full = s.maxHearts / 2;
    for (var i = 0; i < full; i++) {
      var col = i % 8, row = (i / 8) | 0;
      var hx = x + col * 9, hy = y + row * 9;
      var have = s.hearts - i * 2;
      var art = have >= 2 ? 'item.heart' : have === 1 ? 'item.heartHalf' : 'item.heartEmpty';
      AV.Gfx.draw(AV.Art.get(art), hx, hy);
    }
  }

  /* --- item slots -------------------------------------------------------- */

  function slot(x, y, art, label) {
    AV.Gfx.rect(x, y, 20, 20, C['0']);
    AV.Gfx.frame(x, y, 20, 20, C['4']);
    if (art) {
      var img = AV.Art.get(art);
      if (img) AV.Gfx.draw(img, x + (20 - img.width) / 2, y + (20 - img.height) / 2);
    }
    AV.Font.draw(label, x + 6, y + 21, C['5']);
  }

  UI.drawHud = function () {
    var s = AV.Game.save;
    AV.Gfx.rect(0, 0, AV.Gfx.VIEW_W, HUD_H, C['0']);

    /* where you are */
    if (AV.World.kind === 'dgn') drawBarrowMap(6, 12);
    else drawOverMap(6, 12);

    /* place name */
    var title;
    if (AV.World.kind === 'dgn') title = 'BARROW ' + AV.Dungeons[AV.World.id].numeral;
    else if (AV.World.kind === 'cave') title = 'BELOW';
    else title = (AV.World.data && AV.World.data.region) || 'ASHVALE';
    AV.Font.draw(title, 6, 3, C['5']);

    /* what you are carrying */
    var cx = 62;
    counter('item.glimmer', s.glimmers, cx, 14);
    counter('item.key', s.keys, cx, 26);
    counter('item.bomb', s.bombs, cx, 38);
    if (s.items.bow) counter('shot.arrow', s.quarrels, cx, 50);

    /* shards, once you have any */
    if (s.shards > 0) {
      for (var i = 0; i < s.shards; i++) {
        AV.Gfx.draw(AV.Art.get('item.shard'), 108 + i * 9, 50);
      }
    }

    /* the two buttons */
    slot(112, 8, s.items.brand ? 'blade.brand' : s.items.blade ? 'blade.ember' : null, 'Z');
    var slotted = s.slotItem;
    var owns = (slotted === 'potion') ? s.potions > 0 : !!s.items[slotted];
    slot(136, 8, owns ? AV.Play.PRIZE_ART[slotted] : null, 'X');
    if (slotted === 'bombs' && owns) AV.Font.draw('' + s.bombs, 152, 24, C['7']);

    /* how much of you is left */
    AV.Font.draw('EMBERS', 166, 8, C['a']);
    drawHearts(166, 18);

    AV.Gfx.rect(0, HUD_H - 2, AV.Gfx.VIEW_W, 2, C['3']);
  };

  /* --- overlays ---------------------------------------------------------- */

  /* A line of text across the bottom of the playfield. */
  UI.banner = function (text, ox, oy) {
    var lines = AV.Font.wrap(text, 38);
    var h = lines.length * 9 + 8;
    var y = oy + AV.World.PH - h - 4;
    AV.Gfx.rect(ox + 6, y, AV.World.PW - 12, h, 'rgba(6,5,12,0.88)');
    AV.Gfx.frame(ox + 6, y, AV.World.PW - 12, h, C['4']);
    for (var i = 0; i < lines.length; i++) {
      AV.Font.center(lines[i], ox + AV.World.PW / 2, y + 5 + i * 9, C['7']);
    }
  };

  UI.bossBar = function (boss, ox, oy) {
    var w = 108, cx = ox + AV.World.PW / 2, x = cx - w / 2, y = oy + 5;
    /* A backing plate, or the name is unreadable against the wall behind it. */
    var nameW = AV.Font.width(boss.title) + 8;
    var plateW = Math.max(w + 6, nameW);
    AV.Gfx.rect(cx - plateW / 2, y - 3, plateW, 21, 'rgba(6,5,12,0.82)');
    AV.Gfx.frame(cx - plateW / 2, y - 3, plateW, 21, C['3']);
    AV.Gfx.rect(x, y, w, 6, C['1']);
    AV.Gfx.frame(x, y, w, 6, C['3']);
    var frac = Math.max(0, boss.hp / boss.maxHp);
    AV.Gfx.rect(x + 1, y + 1, ((w - 2) * frac) | 0, 4, frac > 0.35 ? C['9'] : C['b']);
    AV.Font.center(boss.title, cx, y + 9, C['6']);
  };

  /* A framed box of text, used by every talking cave. */
  UI.box = function (lines, x, y, w, colour) {
    var h = lines.length * 9 + 10;
    AV.Gfx.rect(x, y, w, h, C['0']);
    AV.Gfx.frame(x, y, w, h, colour || C['4']);
    AV.Gfx.frame(x + 1, y + 1, w - 2, h - 2, C['1']);
    for (var i = 0; i < lines.length; i++) {
      AV.Font.center(lines[i], x + w / 2, y + 6 + i * 9, C['7']);
    }
    return h;
  };

  AV.UI = UI;
})(window.AV = window.AV || {});
