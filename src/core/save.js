/* Ashvale — saved tales.
 * Three slots in localStorage. The schema is versioned; anything written by an
 * older build is discarded rather than half-loaded, which is the honest thing
 * to do with a format that is still moving. Storage can throw outright (private
 * windows, blocked site data), so every read and write is guarded and the game
 * simply runs unsaved when it has to. */
(function (AV) {
  'use strict';

  var VERSION = 1;
  var KEY = 'ashvale.tale.';
  var SLOTS = 3;

  function blank() {
    return {
      v: VERSION,
      created: Date.now(),
      /* vitals */
      hearts: 6,           // in half-embers: 6 = three full
      maxHearts: 6,
      glimmers: 0,
      keys: 0,
      bombs: 0,
      quarrels: 0,
      potions: 0,
      /* kit */
      items: {
        blade: false, brand: false,
        shield: true, shieldWard: false,
        bombs: false, bow: false, stone: false, torch: false,
        raft: false, vine: false, ring: false, horn: false
      },
      slotItem: 'bombs',   // which item the ITEM button uses
      shards: 0,
      /* per-barrow progress */
      barrows: {},
      /* the world's memory: burned brush, blasted rock, emptied caches */
      secrets: {},
      taken: {},
      tiles: {},
      cleared: {},
      visited: {},
      /* where we are */
      area: 'over', id: null, sx: 1, sy: 3, px: 116, py: 96, face: 'down',
      /* bookkeeping */
      deaths: 0,
      frames: 0,
      done: false
    };
  }

  function barrowState() {
    return { map: false, compass: false, seal: false, boss: false, shard: false, doors: {} };
  }

  var Save = {
    VERSION: VERSION,
    SLOTS: SLOTS,
    blank: blank,
    barrowState: barrowState,
    slot: 0,

    /* Reads a slot, returning null for empty, unreadable or stale data. */
    read: function (n) {
      var raw;
      try { raw = window.localStorage.getItem(KEY + n); } catch (e) { return null; }
      if (!raw) return null;
      var data;
      try { data = JSON.parse(raw); } catch (e) { return null; }
      if (!data || data.v !== VERSION) return null;
      return data;
    },

    write: function (n, data) {
      try {
        window.localStorage.setItem(KEY + n, JSON.stringify(data));
        return true;
      } catch (e) {
        return false;   // out of quota, or storage denied — keep playing
      }
    },

    erase: function (n) {
      try { window.localStorage.removeItem(KEY + n); } catch (e) { /* nothing to do */ }
    },

    list: function () {
      var out = [];
      for (var i = 0; i < SLOTS; i++) out.push(Save.read(i));
      return out;
    },

    /* A one-line summary for the file-select screen. */
    describe: function (data) {
      if (!data) return null;
      return {
        hearts: Math.ceil(data.maxHearts / 2),
        shards: data.shards,
        deaths: data.deaths,
        done: !!data.done,
        minutes: Math.floor(data.frames / 3600)
      };
    }
  };

  AV.Save = Save;
})(window.AV = window.AV || {});
