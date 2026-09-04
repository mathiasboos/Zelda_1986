/* Ashvale — the barrows.
 * Five underground maps: four barrows holding a shard apiece, then the Ashen
 * Lair. Rooms sit on a sparse grid keyed 'col,row'; each room's interior is
 * 12x7 tiles and the surrounding wall and doorways are drawn by the renderer.
 *
 * Doors are declared on both sides and must agree — tools/validate.js checks
 * that, and also walks each barrow to prove there are enough keys to reach the
 * boss. Door kinds:
 *   open  always passable        shut  opens when the room is cleared
 *   lock  spends a Barrow Key    seal  needs that barrow's Seal (boss door)
 *   bomb  hidden until blasted   none  solid wall
 */
(function (AV) {
  'use strict';

  /* Shared room interiors, 12 wide by 7 tall. Barrows reuse these the way the
   * old builders reused their moulds. */
  var L = {
    empty: [
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............'
    ],
    pillars: [
      '............',
      '..##....##..',
      '..##....##..',
      '............',
      '..##....##..',
      '..##....##..',
      '............'
    ],
    cross: [
      '............',
      '.....##.....',
      '.....##.....',
      '.##########.',
      '.....##.....',
      '.....##.....',
      '............'
    ],
    ring: [
      '............',
      '..########..',
      '..#......#..',
      '..#......#..',
      '..#......#..',
      '..########..',
      '............'
    ],
    braziers: [
      '............',
      '.f........f.',
      '............',
      '............',
      '............',
      '.f........f.',
      '............'
    ],
    moat: [
      '............',
      '..~~~~~~~~..',
      '..~......~..',
      '..~......~..',
      '..~......~..',
      '..~~~~~~~~..',
      '............'
    ],
    channel: [
      '............',
      '...~~~~~~...',
      '............',
      '............',
      '............',
      '...~~~~~~...',
      '............'
    ],
    pits: [
      '............',
      '..GG....GG..',
      '..GG....GG..',
      '............',
      '..GG....GG..',
      '..GG....GG..',
      '............'
    ],
    span: [
      '............',
      '.GGGGGGGGGG.',
      '.GGGGGGGGGG.',
      '............',
      '.GGGGGGGGGG.',
      '.GGGGGGGGGG.',
      '............'
    ],
    blocks: [
      '............',
      '............',
      '...B..B.....',
      '............',
      '.....B..B...',
      '............',
      '............'
    ],
    statues: [
      '............',
      '.X........X.',
      '............',
      '.....##.....',
      '............',
      '.X........X.',
      '............'
    ],
    maze: [
      '............',
      '.####..####.',
      '.#........#.',
      '.#.######.#.',
      '.#........#.',
      '.####..####.',
      '............'
    ],
    aisle: [
      '............',
      '.##......##.',
      '.##......##.',
      '............',
      '.##......##.',
      '.##......##.',
      '............'
    ],
    rubble: [
      '............',
      '..,......,..',
      '.,,,....,,,.',
      '..,......,..',
      '.,,,....,,,.',
      '..,......,..',
      '............'
    ],
    arena: [
      '............',
      '.f........f.',
      '............',
      '............',
      '............',
      '.f........f.',
      '............'
    ],
    vault: [
      '............',
      '.##########.',
      '.#........#.',
      '.#........#.',
      '.#........#.',
      '.##.####.##.',
      '............'
    ]
  };

  /* d(n, s, e, w) — doors clockwise from north. '-' is a solid wall. */
  function d(n, s, e, w) {
    var m = { o: 'open', s: 'shut', l: 'lock', z: 'seal', b: 'bomb', '-': 'none' };
    return { n: m[n], s: m[s], e: m[e], w: m[w] };
  }

  var D = {};

  /* ===================== BARROW ONE — THE HOLLOW OF ROOTS =====================
   * Under the Emberwood. Roots have pushed the old stones apart. Teaches the
   * loop the other four barrows repeat: clear, find the key, find the Seal. */
  D.b1 = {
    name: 'The Hollow of Roots',
    numeral: 'I',
    theme: 'barrow1',
    music: 'barrow',
    entrance: { col: 3, row: 5 },
    exit: { sx: 0, sy: 4, tx: 7, ty: 5 },
    shard: 1,
    rooms: {
      '3,5': { layout: 'braziers', doors: d('o', '-', '-', '-'), stairs: true },
      '3,4': { layout: 'pillars',  doors: d('s', 'o', 'l', 'o'), foes: [['grubling', 3]] },
      '2,4': { layout: 'rubble',   doors: d('-', '-', 'o', '-'), foes: [['bonepike', 2]], drop: 'key' },
      '4,4': { layout: 'ring',     doors: d('-', '-', '-', 'l'), foes: [['ooze', 2]], prize: 'map' },
      '3,3': { layout: 'cross',    doors: d('o', 's', 'o', '-'), foes: [['nightwing', 3]] },
      '4,3': { layout: 'aisle',    doors: d('-', '-', '-', 'o'), foes: [['bonepike', 2]], prize: 'compass', prize2: 'seal' },
      '3,2': { layout: 'statues',  doors: d('z', 'o', '-', '-'), foes: [['ooze', 2]], prize: 'stone' },
      '3,1': { layout: 'arena',    doors: d('-', 'z', '-', '-'), boss: 'coilfang' }
    }
  };

  /* ===================== BARROW TWO — THE SALT CRYPT =====================
   * Sealed behind a cracked rock out on the Saltflats. Drier, meaner, and the
   * first place that asks you to keep track of two keys at once. */
  D.b2 = {
    name: 'The Salt Crypt',
    numeral: 'II',
    theme: 'barrow2',
    music: 'barrow',
    entrance: { col: 3, row: 6 },
    exit: { sx: 5, sy: 4, tx: 6, ty: 4 },
    shard: 2,
    rooms: {
      '3,6': { layout: 'braziers', doors: d('o', '-', '-', '-'), stairs: true },
      '3,5': { layout: 'pillars',  doors: d('l', 'o', 'o', 'o'), foes: [['bristler', 2], ['grubling', 2]] },
      '2,5': { layout: 'maze',     doors: d('o', '-', 'o', '-'), foes: [['bonepike', 3]], drop: 'key' },
      '2,4': { layout: 'rubble',   doors: d('-', 'o', 'o', '-'), foes: [['ooze', 3]], prize: 'map' },
      '4,5': { layout: 'aisle',    doors: d('o', '-', '-', 'o'), foes: [['skitter', 3]] },
      '4,4': { layout: 'ring',     doors: d('-', 'o', '-', 'b'), foes: [['bonepike', 2]], prize: 'compass', prize2: 'key' },
      '3,4': { layout: 'cross',    doors: d('o', 'l', 'b', 'o'), foes: [['gorger', 1], ['ooze', 2]] },
      '3,3': { layout: 'statues',  doors: d('s', 'o', '-', '-'), foes: [['bristler', 3]], prize: 'bow' },
      '3,2': { layout: 'moat',     doors: d('z', 's', 'l', '-'), foes: [['nightwing', 4]] },
      '4,2': { layout: 'vault',    doors: d('-', '-', '-', 'l'), foes: [['ironward', 1]], prize: 'seal' },
      '3,1': { layout: 'arena',    doors: d('-', 'z', '-', '-'), boss: 'twinmaws' }
    }
  };

  /* ===================== BARROW THREE — THE DROWNED BARROW =====================
   * On an island in the Mire, half under water. Holds the Firebrand Torch, and
   * the rooms past it are the first that are dark without one. */
  D.b3 = {
    name: 'The Drowned Barrow',
    numeral: 'III',
    theme: 'barrow3',
    music: 'barrow',
    entrance: { col: 3, row: 6 },
    exit: { sx: 0, sy: 1, tx: 6, ty: 5 },
    shard: 3,
    rooms: {
      '3,6': { layout: 'braziers', doors: d('o', '-', '-', '-'), stairs: true },
      '3,5': { layout: 'channel',  doors: d('o', 'o', 'o', 'o'), foes: [['ooze', 3]] },
      '2,5': { layout: 'moat',     doors: d('l', '-', 'o', '-'), foes: [['bonepike', 3]], drop: 'key' },
      '2,4': { layout: 'rubble',   doors: d('-', 'l', 'o', '-'), foes: [['ooze', 2]], prize: 'map' },
      '4,5': { layout: 'aisle',    doors: d('o', '-', '-', 'o'), foes: [['nightwing', 4]] },
      '4,4': { layout: 'ring',     doors: d('-', 'o', '-', 'o'), foes: [['gorger', 1]], prize: 'compass', prize2: 'key' },
      '3,4': { layout: 'moat',     doors: d('l', 'o', 'o', 'o'), foes: [['hexwright', 2]] },
      '3,3': { layout: 'channel',  doors: d('o', 'l', 'b', '-'), foes: [['ooze', 4]], prize: 'torch' },
      '4,3': { layout: 'vault',    doors: d('-', '-', '-', 'b'), foes: [['bonepike', 2]], prize: 'seal' },
      '3,2': { layout: 'pillars',  doors: d('z', 'o', '-', '-'), dark: true, foes: [['wisp', 3], ['nightwing', 2]] },
      '3,1': { layout: 'arena',    doors: d('-', 'z', '-', '-'), boss: 'hollowchoir' }
    }
  };

  /* ===================== BARROW FOUR — THE CRAG VAULT =====================
   * Cut into the Ashen Crags and shut until the Windcaller Horn sounds outside.
   * Pits, pushed blocks and armoured guards; the Grapple Vine is the way on. */
  D.b4 = {
    name: 'The Crag Vault',
    numeral: 'IV',
    theme: 'barrow4',
    music: 'barrow',
    entrance: { col: 3, row: 6 },
    exit: { sx: 3, sy: 0, tx: 7, ty: 4 },
    shard: 4,
    rooms: {
      '3,6': { layout: 'braziers', doors: d('o', '-', '-', '-'), stairs: true },
      '3,5': { layout: 'pits',     doors: d('s', 'o', 'o', 'o'), foes: [['ironward', 1], ['skitter', 3]] },
      '2,5': { layout: 'maze',     doors: d('o', '-', 'o', '-'), foes: [['thornmaw', 2]], drop: 'key' },
      '2,4': { layout: 'blocks',   doors: d('-', 'o', 'o', '-'), foes: [['bonepike', 3]], prize: 'map' },
      '4,5': { layout: 'aisle',    doors: d('o', '-', '-', 'o'), foes: [['hexwright', 2]] },
      '4,4': { layout: 'ring',     doors: d('-', 'o', '-', 'o'), foes: [['ironward', 1]], prize: 'compass', prize2: 'key' },
      '3,4': { layout: 'blocks',   doors: d('l', 's', 'o', 'o'), foes: [['thornmaw', 2], ['nightwing', 3]] },
      '3,3': { layout: 'pits',     doors: d('o', 'l', '-', 'b'), foes: [['ironward', 2]] },
      '2,3': { layout: 'vault',    doors: d('-', '-', 'b', '-'), foes: [['gorger', 1]], prize: 'seal' },
      '3,2': { layout: 'span',     doors: d('o', 'o', 'l', '-'), foes: [['wisp', 3]] },
      '4,2': { layout: 'vault',    doors: d('-', '-', '-', 'l'), foes: [['ironward', 1]], prize: 'vine' },
      '3,1': { layout: 'pillars',  doors: d('z', 'o', '-', '-'), dark: true, foes: [['wallcrawler', 2], ['wisp', 2]] },
      '3,0': { layout: 'arena',    doors: d('-', 'z', '-', '-'), boss: 'gravewyrm' }
    }
  };

  /* ===================== THE ASHEN LAIR =====================
   * Across the chasm in the Barrowdowns, and shut to anyone not carrying all
   * four shards. The fifth is inside, and so is Morvane. */
  D.lair = {
    name: 'The Ashen Lair',
    numeral: 'V',
    theme: 'lair',
    music: 'lair',
    entrance: { col: 3, row: 6 },
    exit: { sx: 5, sy: 1, tx: 7, ty: 5 },
    shard: 5,
    final: true,
    rooms: {
      '3,6': { layout: 'braziers', doors: d('o', '-', '-', '-'), stairs: true },
      '3,5': { layout: 'statues',  doors: d('o', 'o', 'o', 'o'), foes: [['ironward', 2]] },
      '2,5': { layout: 'maze',     doors: d('-', '-', 'o', '-'), foes: [['hexwright', 2], ['wisp', 2]] },
      '4,5': { layout: 'pits',     doors: d('-', '-', '-', 'o'), foes: [['thornmaw', 3]] },
      '3,4': { layout: 'span',     doors: d('l', 'o', 'o', '-'), foes: [['wallcrawler', 2], ['wisp', 3]] },
      '4,4': { layout: 'vault',    doors: d('-', '-', '-', 'o'), foes: [['ironward', 1], ['gorger', 1]], prize: 'key', prize2: 'seal' },
      '3,3': { layout: 'maze',     doors: d('o', 'l', '-', 'b'), foes: [['gorger', 2], ['hexwright', 2]] },
      '2,3': { layout: 'vault',    doors: d('-', '-', 'b', '-'), foes: [['ironward', 1]], prize: 'vessel' },
      '3,2': { layout: 'arena',    doors: d('z', 'o', '-', '-'), dark: true, foes: [['ironward', 2], ['hexwright', 2], ['wisp', 3]], prize: 'shard' },
      '3,1': { layout: 'arena',    doors: d('-', 'z', '-', '-'), boss: 'morvane' }
    }
  };

  AV.Dungeons = D;
  AV.Layouts = L;
})(window.AV = window.AV || {});
