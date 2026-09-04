/* Ashvale — all the words.
 * Title cards, the opening crawl, item names and the ending. Kept in one place
 * so the writing can be read and revised without digging through game code. */
(function (AV) {
  'use strict';

  AV.Text = {
    title: 'ASHVALE',
    subtitle: 'THE SUNDERED SIGIL',

    /* Shown once on a new file, and any time the player asks for it. */
    crawl: [
      'ASHVALE WAS LIT BY THE SIGIL OF DAWN',
      'UNTIL MORVANE, THE ASHEN KING,',
      'BROKE IT AND LET THE GREY IN.',
      '',
      'THE SEER VELLAMOR SCATTERED',
      'THE FIVE SHARDS INTO THE OLD BARROWS',
      'BEFORE HE TOOK HER, SO THAT HE',
      'COULD NEVER HOLD THE SIGIL WHOLE.',
      '',
      'YOU ARE KAELEN, A LANTERN-BEARER.',
      'WALK THE BARROWS. GATHER THE SHARDS.',
      'PUT OUT THE ASHEN KING.'
    ],

    /* Item display names, used by the HUD, the subscreen and pickup banners. */
    items: {
      blade:      'EMBER BLADE',
      brand:      'EMBERBRAND',
      shield:     'OAKENSHIELD',
      shieldWard: 'WARDED SHIELD',
      bombs:      'BLASTROOT',
      bow:        'THORNBOW',
      quarrels:   'QUARRELS',
      stone:      'RICOCHET STONE',
      torch:      'FIREBRAND TORCH',
      raft:       'REED RAFT',
      vine:       'GRAPPLE VINE',
      ring:       'CINDER RING',
      potion:     'ROOT DRAUGHT',
      horn:       'WINDCALLER HORN',
      key:        'BARROW KEY',
      seal:       'BARROW SEAL',
      map:        'BARROW MAP',
      compass:    'COMPASS',
      vessel:     'EMBER VESSEL',
      shard:      'SIGIL SHARD',
      heart:      'AN EMBER',
      glimmer:    'GLIMMER'
    },

    /* One line of flavour when an item is first taken. */
    got: {
      blade:      'THE EMBER BLADE. IT IS WARM.',
      brand:      'THE EMBERBRAND. IT CUTS FURTHER.',
      shieldWard: 'THE WARDED SHIELD TURNS MORE THAN ARROWS.',
      bombs:      'BLASTROOT. IT WANTS A CRACKED WALL.',
      bow:        'THE THORNBOW. QUARRELS COST GLIMMERS.',
      stone:      'THE RICOCHET STONE. IT COMES BACK.',
      torch:      'THE FIREBRAND TORCH. BRUSH BURNS.',
      raft:       'THE REED RAFT. FIND A DOCK.',
      vine:       'THE GRAPPLE VINE. CHASMS ARE ROADS NOW.',
      ring:       'THE CINDER RING. THE GREY BITES LESS.',
      horn:       'THE WINDCALLER HORN. SOUND IT SOMEWHERE SHUT.',
      vessel:     'AN EMBER VESSEL. YOU CAN HOLD MORE.',
      map:        'THE BARROW MAP.',
      compass:    'THE COMPASS. IT LEANS TOWARD THE SHARD.',
      seal:       'THE BARROW SEAL. ONE DOOR ANSWERS TO IT.'
    },

    /* Barrow completion. */
    shardGot: [
      'A SHARD OF THE SIGIL OF DAWN.',
      'IT IS COLD, AND IT IS LIGHT.'
    ],

    sealedHorn:  'THE STONE IS SHUT. SOMETHING SHOULD BE SOUNDED HERE.',
    sealedShards: 'THE DOOR READS YOU AND FINDS YOU SHORT. FIVE SHARDS, OR NONE.',
    sealedDoor:  'THIS DOOR ANSWERS ONLY TO THE BARROW SEAL.',
    lockedDoor:  'LOCKED. A BARROW KEY WOULD DO IT.',
    needVine:    'THE CHASM IS TOO WIDE TO STEP.',
    needRaft:    'DEEP WATER. YOU WOULD NEED SOMETHING THAT FLOATS.',

    /* Endgame. */
    reforge: [
      'THE FIVE SHARDS FIND EACH OTHER',
      'AND THE SIGIL OF DAWN IS WHOLE.'
    ],
    ending: [
      'MORVANE GOES OUT LIKE A WICK.',
      '',
      'THE GREY THINS OVER THE CRAGS,',
      'THEN OVER THE MIRE, THEN THE WOOD.',
      '',
      'VELLAMOR WALKS UP OUT OF THE DARK',
      'AND DOES NOT SAY THANK YOU.',
      'SHE SAYS: LOOK AT THE LIGHT ON IT.',
      '',
      'AND KAELEN PUTS THE LANTERN DOWN,',
      'BECAUSE FOR ONCE IT IS NOT NEEDED.'
    ],
    theEnd: 'THE GREY IS OVER',

    gameOver: 'THE LANTERN GOES OUT',
    continueOpts: ['CONTINUE', 'SAVE AND QUIT'],

    /* Shown on the file-select screen. */
    slots: 'CHOOSE A TALE',
    newFile: 'NEW TALE',
    controls: [
      'MOVE      ARROWS / WASD',
      'BLADE     Z / J / SPACE',
      'ITEM      X / K / SHIFT',
      'SUBSCREEN ENTER',
      'MUTE      TAB'
    ]
  };
})(window.AV = window.AV || {});
