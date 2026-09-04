/* Ashvale — everything that is not the world.
 * Title, file select, the opening crawl, the subscreen, the item-held-aloft
 * moment, death, and the ending. Each is a small object with update() and
 * draw(); the loop hands control to whichever matches the current mode. */
(function (AV) {
  'use strict';

  var C = AV.Gfx.COLORS;
  var W = AV.Gfx.VIEW_W, H = AV.Gfx.VIEW_H;

  var M = {};

  function fill(col) { AV.Gfx.rect(0, 0, W, H, col || C['0']); }

  /* A ridge of hills, drawn from a sine so it is the same every load. */
  function hills(y, colour, seed, amp) {
    for (var x = 0; x < W; x++) {
      var n = Math.sin((x + seed) / 17) * amp + Math.sin((x + seed) / 7) * (amp / 3);
      AV.Gfx.rect(x, y + n, 1, H - (y + n), colour);
    }
  }

  function hex(c) {
    return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16)];
  }

  /* Vertical wash between two colours, a row at a time. */
  function gradient(y0, y1, top, bottom) {
    var a = hex(top), b = hex(bottom);
    for (var y = y0; y < y1; y++) {
      var t = (y - y0) / Math.max(1, y1 - y0 - 1);
      var r = Math.round(a[0] + (b[0] - a[0]) * t);
      var g = Math.round(a[1] + (b[1] - a[1]) * t);
      var bl = Math.round(a[2] + (b[2] - a[2]) * t);
      AV.Gfx.rect(0, y, W, 1, 'rgb(' + r + ',' + g + ',' + bl + ')');
    }
  }

  /* ============================ TITLE ============================ */

  M.title = {
    t: 0,
    enter: function () { this.t = 0; AV.Audio.music('title'); },
    update: function () {
      this.t++;
      if (this.t > 10 && AV.Input.anyPressed()) {
        AV.Audio.play('confirm');
        AV.Game.setMode('file');
      }
    },
    draw: function () {
      /* a sky that actually gets lighter toward the horizon */
      gradient(0, 150, C['0'], C['p']);
      gradient(150, H, C['p'], C['1']);

      /* the last few stars the grey has not taken */
      for (var i = 0; i < 40; i++) {
        var sx = (i * 97 + 13) % W;
        var sy = (i * 41 + 7) % 96;
        var tw = (this.t / 12 + i * 3) % 20;
        if (tw < 13) AV.Gfx.rect(sx, sy, 1, 1, tw < 6 ? C['3'] : C['4']);
      }

      hills(150, C['2'], 0, 15);
      hills(172, C['1'], 60, 11);
      hills(196, C['0'], 130, 8);

      /* the lantern, and the one person still carrying one */
      var bob = Math.sin(this.t / 30) * 2;
      AV.Gfx.draw(AV.Art.get('item.torch'), 198, 186 + bob);
      AV.Gfx.draw(AV.Art.get('fx.fire', ((this.t / 8) | 0) % 2), 199, 179 + bob);
      AV.Gfx.draw(AV.Art.mirror('kaelen.side', ((this.t / 26) | 0) % 2), 44, 184);

      /* the name of the place, at a size worth reading */
      AV.Font.bigCenter(AV.Text.title, W / 2 + 2, 36 + 2, C['t'], 3);
      AV.Font.bigCenter(AV.Text.title, W / 2, 36, C['d'], 3);
      AV.Font.centerShadow(AV.Text.subtitle, W / 2, 64, C['6'], C['0']);
      AV.Gfx.rect(W / 2 - 62, 78, 124, 1, C['3']);

      if ((this.t % 64) < 42) {
        AV.Font.centerShadow('PRESS ANY KEY', W / 2, 112, C['7'], C['0']);
      }
      AV.Font.center('AN ORIGINAL ADVENTURE IN THE OLD STYLE', W / 2, 226, C['3']);
    }
  };

  /* ============================ FILE SELECT ============================ */

  M.file = {
    sel: 0, t: 0, files: null, confirmErase: false,
    enter: function () {
      this.t = 0; this.sel = 0; this.confirmErase = false;
      this.files = AV.Save.list();
    },
    update: function () {
      this.t++;
      if (AV.Input.pressed('down')) { this.sel = (this.sel + 1) % 4; AV.Audio.play('select'); }
      if (AV.Input.pressed('up')) { this.sel = (this.sel + 3) % 4; AV.Audio.play('select'); }
      if (AV.Input.pressed('sword') || AV.Input.pressed('pause')) {
        if (this.sel === 3) {                  // erase
          this.confirmErase = !this.confirmErase;
          AV.Audio.play('select');
          return;
        }
        if (this.confirmErase) {
          AV.Save.erase(this.sel);
          this.files = AV.Save.list();
          this.confirmErase = false;
          AV.Audio.play('deny');
          return;
        }
        AV.Audio.play('confirm');
        AV.Game.begin(this.sel, this.files[this.sel]);
      }
    },
    draw: function () {
      fill(C['1']);
      AV.Font.center(AV.Text.title + ' - ' + AV.Text.subtitle, W / 2, 16, C['d']);
      AV.Font.center(AV.Text.slots, W / 2, 34, C['6']);

      for (var i = 0; i < 3; i++) {
        var y = 56 + i * 34;
        var on = this.sel === i;
        AV.Gfx.rect(36, y, 184, 28, on ? C['2'] : C['1']);
        AV.Gfx.frame(36, y, 184, 28, on ? C['c'] : C['3']);
        var d = AV.Save.describe(this.files[i]);
        if (!d) {
          AV.Font.draw(AV.Text.newFile, 48, y + 10, on ? C['7'] : C['5']);
        } else {
          AV.Font.draw('TALE ' + (i + 1), 46, y + 5, on ? C['7'] : C['5']);
          for (var k = 0; k < Math.min(d.hearts, 8); k++) {
            AV.Gfx.draw(AV.Art.get('item.heart'), 46 + k * 9, y + 15);
          }
          for (var sdx = 0; sdx < d.shards; sdx++) {
            AV.Gfx.draw(AV.Art.get('item.shard'), 124 + sdx * 9, y + 14);
          }
          AV.Font.draw(d.minutes + 'M', 178, y + 5, C['4']);
          AV.Font.draw(d.deaths + ' LOST', 172, y + 16, C['4']);
          if (d.done) AV.Font.draw('DONE', 100, y + 5, C['c']);
        }
        if (on) AV.Font.draw('>', 26, y + 10, C['c']);
      }

      var ey = 158;
      AV.Font.center(this.confirmErase ? 'ERASE: PICK A TALE TO BURN' : 'ERASE A TALE',
        W / 2, ey, this.sel === 3 ? C['a'] : C['4']);
      if (this.sel === 3) AV.Font.draw('>', 26, ey, C['a']);

      for (var c = 0; c < AV.Text.controls.length; c++) {
        AV.Font.center(AV.Text.controls[c], W / 2, 178 + c * 10, C['3']);
      }
    }
  };

  /* ============================ OPENING CRAWL ============================ */

  M.crawl = {
    t: 0,
    enter: function () { this.t = 0; AV.Audio.music('title'); },
    update: function () {
      this.t++;
      var done = this.t > AV.Text.crawl.length * 26 + 200;
      if (done || AV.Input.pressed('sword') || AV.Input.pressed('pause')) {
        AV.Game.startPlay();
      }
    },
    draw: function () {
      fill(C['0']);
      var shown = Math.min(AV.Text.crawl.length, (this.t / 26) | 0);
      var top = 40;
      for (var i = 0; i < shown; i++) {
        var age = this.t - i * 26;
        var a = Math.min(1, age / 20);
        var col = a < 1 ? C['5'] : C['7'];
        AV.Font.center(AV.Text.crawl[i], W / 2, top + i * 12, col);
      }
      if ((this.t % 60) < 38 && this.t > 60) {
        AV.Font.center('PRESS Z', W / 2, 220, C['4']);
      }
    }
  };

  /* ============================ ITEM HELD ALOFT ============================ */

  M.get = {
    t: 0, item: null, lines: null,
    enter: function (payload) {
      this.t = 0;
      this.item = payload.item;
      this.lines = payload.lines;
      AV.Audio.play(payload.fanfare === false ? 'pickup' : 'fanfare');
    },
    update: function () {
      this.t++;
      if (this.t > 40 && (AV.Input.pressed('sword') || AV.Input.pressed('pause') ||
                          AV.Input.pressed('item'))) {
        AV.Game.setMode('play');
      }
      if (this.t > 400) AV.Game.setMode('play');
    },
    draw: function () {
      /* the world stays behind it, dimmed */
      AV.Game.drawWorld();
      AV.Gfx.rect(0, AV.Gfx.HUD_H, W, AV.World.PH, 'rgba(6,5,12,0.72)');

      var oy = AV.Gfx.HUD_H;
      var art = AV.Play.PRIZE_ART[this.item];
      var img = art ? AV.Art.get(art) : null;
      var lift = Math.min(16, this.t) ;
      /* Kaelen holding it up */
      AV.Gfx.draw(AV.Art.get('kaelen.up', 0), W / 2 - 8, oy + 82);
      if (img) {
        AV.Gfx.draw(img, W / 2 - img.width / 2, oy + 74 - lift);
        if ((this.t % 16) < 8) {
          AV.Gfx.draw(AV.Art.get('fx.sparkle', 0), W / 2 + 10, oy + 70 - lift);
          AV.Gfx.draw(AV.Art.get('fx.sparkle', 1), W / 2 - 14, oy + 78 - lift);
        }
      }
      if (this.t > 14) {
        AV.UI.box(this.lines, 16, oy + 116, W - 32, C['d']);
      }
    }
  };

  /* ============================ SUBSCREEN ============================ */

  var SLOTTABLE = ['bombs', 'bow', 'stone', 'torch', 'horn', 'potion'];

  M.subscreen = {
    t: 0, sel: 0,
    enter: function () {
      this.t = 0;
      var s = AV.Game.save;
      var owned = this.owned();
      this.sel = Math.max(0, owned.indexOf(s.slotItem));
    },
    owned: function () {
      var s = AV.Game.save;
      var out = [];
      for (var i = 0; i < SLOTTABLE.length; i++) {
        var k = SLOTTABLE[i];
        if (k === 'potion') { if (s.potions > 0) out.push(k); }
        else if (s.items[k]) out.push(k);
      }
      return out;
    },
    update: function () {
      this.t++;
      var owned = this.owned();
      if (owned.length) {
        if (AV.Input.pressed('right')) { this.sel = (this.sel + 1) % owned.length; AV.Audio.play('select'); }
        if (AV.Input.pressed('left')) { this.sel = (this.sel + owned.length - 1) % owned.length; AV.Audio.play('select'); }
        AV.Game.save.slotItem = owned[this.sel];
      }
      if (AV.Input.pressed('pause')) {
        AV.Audio.play('select');
        AV.Game.setMode('play');
      }
    },
    draw: function () {
      var s = AV.Game.save;
      AV.UI.drawHud();
      var oy = AV.Gfx.HUD_H;
      AV.Gfx.rect(0, oy, W, AV.World.PH, C['1']);

      AV.Font.center('WHAT YOU CARRY', W / 2, oy + 6, C['6']);

      /* the item bound to X */
      var owned = this.owned();
      for (var i = 0; i < owned.length; i++) {
        var x = 20 + i * 34, y = oy + 22;
        var on = (i === this.sel);
        AV.Gfx.rect(x, y, 28, 28, on ? C['2'] : C['0']);
        AV.Gfx.frame(x, y, 28, 28, on ? C['c'] : C['3']);
        var img = AV.Art.get(AV.Play.PRIZE_ART[owned[i]]);
        if (img) AV.Gfx.draw(img, x + (28 - img.width) / 2, y + (28 - img.height) / 2);
      }
      if (owned.length) {
        AV.Font.center(AV.Text.items[owned[this.sel]] || '', W / 2, oy + 56, C['7']);
      } else {
        AV.Font.center('NOTHING YET', W / 2, oy + 34, C['4']);
      }

      /* everything else, listed */
      var lines = [];
      lines.push(['BLADE', s.items.brand ? AV.Text.items.brand : s.items.blade ? AV.Text.items.blade : '-']);
      lines.push(['SHIELD', s.items.shieldWard ? AV.Text.items.shieldWard : AV.Text.items.shield]);
      lines.push(['RAFT', s.items.raft ? 'CARRIED' : '-']);
      lines.push(['VINE', s.items.vine ? 'CARRIED' : '-']);
      lines.push(['RING', s.items.ring ? 'WORN' : '-']);
      lines.push(['SHARDS', s.shards + ' OF 5']);
      for (var k = 0; k < lines.length; k++) {
        var ly = oy + 74 + k * 11;
        AV.Font.draw(lines[k][0], 26, ly, C['5']);
        AV.Font.draw(lines[k][1], 96, ly, C['7']);
      }

      if (AV.World.kind === 'dgn') {
        var b = AV.World.barrow();
        AV.Font.draw('MAP', 26, oy + 142, b.map ? C['7'] : C['3']);
        AV.Font.draw('COMPASS', 60, oy + 142, b.compass ? C['7'] : C['3']);
        AV.Font.draw('SEAL', 122, oy + 142, b.seal ? C['7'] : C['3']);
      }
      AV.Font.center('ENTER TO CLOSE', W / 2, oy + 158, C['3']);
    }
  };

  /* ============================ DEATH ============================ */

  M.dead = {
    t: 0, sel: 0,
    enter: function () {
      this.t = 0; this.sel = 0;
      AV.Audio.stopMusic();
      AV.Game.save.deaths++;
      AV.Game.persist();
    },
    update: function () {
      this.t++;
      if (this.t < 110) return;
      if (AV.Input.pressed('down') || AV.Input.pressed('up')) {
        this.sel = 1 - this.sel; AV.Audio.play('select');
      }
      if (AV.Input.pressed('sword') || AV.Input.pressed('pause')) {
        AV.Audio.play('confirm');
        if (this.sel === 0) AV.Game.revive();
        else { AV.Game.persist(); AV.Game.setMode('title'); }
      }
    },
    draw: function () {
      AV.Game.drawWorld();
      var fade = Math.min(0.86, this.t / 70);
      AV.Gfx.rect(0, 0, W, H, 'rgba(6,3,8,' + fade + ')');
      if (this.t > 40) AV.Font.center(AV.Text.gameOver, W / 2, 86, C['a']);
      if (this.t > 110) {
        for (var i = 0; i < 2; i++) {
          var on = this.sel === i;
          AV.Font.center(AV.Text.continueOpts[i], W / 2, 124 + i * 14, on ? C['7'] : C['4']);
          if (on) AV.Font.draw('>', 60, 124 + i * 14, C['c']);
        }
      }
    }
  };

  /* ============================ ENDING ============================ */

  M.ending = {
    t: 0,
    enter: function () { this.t = 0; AV.Audio.music('ending'); },
    update: function () {
      this.t++;
      if (this.t > AV.Text.ending.length * 30 + 700 &&
          (AV.Input.pressed('sword') || AV.Input.pressed('pause'))) {
        AV.Game.setMode('title');
      }
    },
    draw: function () {
      fill(C['0']);
      /* the grey thinning */
      var lift = Math.min(1, this.t / 400);
      for (var y = 0; y < H; y++) {
        var v = y / H;
        AV.Gfx.rect(0, y, W, 1, v > 1 - lift ? C['1'] : C['0']);
      }
      var glow = Math.min(1, this.t / 300);
      var r = 10 + glow * 26;
      AV.Gfx.ctx.save();
      AV.Gfx.ctx.globalAlpha = glow * 0.85;
      AV.Gfx.ctx.fillStyle = C['c'];
      AV.Gfx.ctx.beginPath();
      AV.Gfx.ctx.arc(W / 2, 42, r, 0, Math.PI * 2);
      AV.Gfx.ctx.fill();
      AV.Gfx.ctx.restore();
      var sig = AV.Art.get('item.sigil');
      if (sig) AV.Gfx.draw(sig, W / 2 - sig.width / 2, 42 - sig.height / 2);

      var shown = Math.min(AV.Text.ending.length, ((this.t - 120) / 30) | 0);
      for (var i = 0; i < shown; i++) {
        AV.Font.center(AV.Text.ending[i], W / 2, 84 + i * 11, C['7']);
      }
      if (this.t > AV.Text.ending.length * 30 + 260) {
        AV.Font.center(AV.Text.theEnd, W / 2, 214, C['d']);
      }
    }
  };

  AV.Menus = M;
})(window.AV = window.AV || {});
