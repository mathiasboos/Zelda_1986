/* Ashvale — sprite art.
 * Every sprite is drawn here as palette-indexed character rows (keys are defined
 * in core/gfx.js; '.' is transparent). All art is original to this project.
 * Rows within a sprite must all be the same length — tools/validate.js checks. */
(function (AV) {
  'use strict';

  var S = {};

  /* ================= KAELEN ================= *
   * Hooded lantern-bearer. Pine/moss/leaf greens, sand skin, rust boots,
   * a gold lantern at his right hand with an ember in it. */

  S.kaelen = {
    down: [
      [
        '......hhhh......',
        '....hhiiiihh....',
        '...hiiiiiiiih...',
        '...hiiffffiih...',
        '...hifffffffh...',
        '...hif00f00fh...',
        '...hiffffffih...',
        '....hiffffih....',
        '....jjjjjjjj....',
        '...jjjjddjjjj...',
        '..fjjjjddjjjjd..',
        '..fjjjjjjjjjjb..',
        '..feeeeeeeeeef..',
        '...jjjjjjjjjj...',
        '....jjj..jjj....',
        '....ttt..ttt....'
      ],
      [
        '......hhhh......',
        '....hhiiiihh....',
        '...hiiiiiiiih...',
        '...hiiffffiih...',
        '...hifffffffh...',
        '...hif00f00fh...',
        '...hiffffffih...',
        '....hiffffih....',
        '....jjjjjjjj....',
        '...jjjjddjjjj...',
        '..fjjjjddjjjjd..',
        '..fjjjjjjjjjjb..',
        '..feeeeeeeeeef..',
        '...jjjjjjjjjj...',
        '...jjjj..jjj....',
        '...tttt..ttt....'
      ]
    ],
    up: [
      [
        '......hhhh......',
        '....hhiiiihh....',
        '...hiiiiiiiih...',
        '...hiiiiiiiih...',
        '...hiiiiiiiih...',
        '...hiiiiiiiih...',
        '...hiiiiiiiih...',
        '....hiiiiiih....',
        '....jjjjjjjj....',
        '...jjjjjjjjjj...',
        '..fjjjjjjjjjjd..',
        '..fjjjjjjjjjjb..',
        '..feeeeeeeeeef..',
        '...jjjjjjjjjj...',
        '....jjj..jjj....',
        '....ttt..ttt....'
      ],
      [
        '......hhhh......',
        '....hhiiiihh....',
        '...hiiiiiiiih...',
        '...hiiiiiiiih...',
        '...hiiiiiiiih...',
        '...hiiiiiiiih...',
        '...hiiiiiiiih...',
        '....hiiiiiih....',
        '....jjjjjjjj....',
        '...jjjjjjjjjj...',
        '..fjjjjjjjjjjd..',
        '..fjjjjjjjjjjb..',
        '..feeeeeeeeeef..',
        '...jjjjjjjjjj...',
        '...jjjj..jjj....',
        '...tttt..ttt....'
      ]
    ],
    /* Drawn facing left; the right-facing set is mirrored at bake time. */
    side: [
      [
        '.....hhhh.......',
        '...hhiiiihh.....',
        '..hiiiiiiiih....',
        '..hiifffffih....',
        '..hifffffffh....',
        '..hif00ffffh....',
        '..hifffffffh....',
        '...hiffffih.....',
        '...jjjjjjjj.....',
        '..jjjjjjjjjj....',
        '.fjjjjjjjjjjd...',
        '.fjjjjjjjjjjb...',
        '.feeeeeeeeeef...',
        '..jjjjjjjjjj....',
        '..jjjj..jjj.....',
        '..tttt..ttt.....'
      ],
      [
        '.....hhhh.......',
        '...hhiiiihh.....',
        '..hiiiiiiiih....',
        '..hiifffffih....',
        '..hifffffffh....',
        '..hif00ffffh....',
        '..hifffffffh....',
        '...hiffffih.....',
        '...jjjjjjjj.....',
        '..jjjjjjjjjj....',
        '.fjjjjjjjjjjd...',
        '.fjjjjjjjjjjb...',
        '.feeeeeeeeeef...',
        '..jjjjjjjjjj....',
        '...jjj..jjjj....',
        '...ttt..tttt....'
      ]
    ],
    /* Thrust poses: shoulders drop and the lead arm extends. */
    stabDown: [
      '......hhhh......',
      '....hhiiiihh....',
      '...hiiiiiiiih...',
      '...hiiffffiih...',
      '...hifffffffh...',
      '...hif00f00fh...',
      '...hiffffffih...',
      '....hiffffih....',
      '...jjjjjjjjjj...',
      '..jjjjjddjjjjj..',
      '..jjjjjddjjjjj..',
      '..feeeeeeeeeef..',
      '..fjjjjjjjjjjf..',
      '...jjjjjjjjjj...',
      '....jjj..jjj....',
      '....ttt..ttt....'
    ],
    stabUp: [
      '......hhhh......',
      '....hhiiiihh....',
      '...hiiiiiiiih...',
      '...hiiiiiiiih...',
      '...hiiiiiiiih...',
      '...hiiiiiiiih...',
      '...hiiiiiiiih...',
      '....hiiiiiih....',
      '...jjjjjjjjjj...',
      '..jjjjjjjjjjjj..',
      '..jjjjjjjjjjjj..',
      '..feeeeeeeeeef..',
      '..fjjjjjjjjjjf..',
      '...jjjjjjjjjj...',
      '....jjj..jjj....',
      '....ttt..ttt....'
    ],
    stabSide: [
      '.....hhhh.......',
      '...hhiiiihh.....',
      '..hiiiiiiiih....',
      '..hiifffffih....',
      '..hifffffffh....',
      '..hif00ffffh....',
      '..hifffffffh....',
      '...hiffffih.....',
      '..jjjjjjjjj.....',
      'ffjjjjjjjjjj....',
      'ffjjjjjjjjjj....',
      '.feeeeeeeeee....',
      '..jjjjjjjjjj....',
      '..jjjjjjjjj.....',
      '..jjj..jjjj.....',
      '..ttt..tttt.....'
    ]
  };

  /* ================= SWORDS ================= *
   * Drawn blade-up; the engine rotates for the other three facings. */

  S.blade = {
    ember: [
      '..66..',
      '..66..',
      '..66..',
      '..66..',
      '..66..',
      '..77..',
      '..66..',
      '..66..',
      '..66..',
      '.d66d.',
      'dddddd',
      '..ee..',
      '..ee..',
      '..be..'
    ],
    brand: [
      '..77..',
      '..87..',
      '..77..',
      '..87..',
      '..77..',
      '..88..',
      '..77..',
      '..87..',
      '..77..',
      'cdccdc',
      'cccccc',
      '..ee..',
      '..ee..',
      '..ce..'
    ]
  };

  /* ================= PROJECTILES ================= */

  S.shot = {
    pellet: [
      '.44.',
      '4554',
      '4554',
      '.44.'
    ],
    thorn: [
      '..6.',
      '.66.',
      '.e6.',
      'ee..'
    ],
    arrow: [
      '..d.....',
      '.dd66666',
      '..d.....'
    ],
    beam: [
      '..cc..',
      '.cbbc.',
      'cb77bc',
      'cb77bc',
      '.cbbc.',
      '..cc..'
    ],
    bolt: [
      '.ss.',
      'srrs',
      'srrs',
      '.ss.'
    ],
    flame: [
      '..c..',
      '.cbc.',
      'cb9bc',
      'cbbbc',
      '.ccc.'
    ],
    rock: [
      '.44.',
      '4334',
      '4334',
      '.44.'
    ],
    spark: [
      '.c.',
      'c7c',
      '.c.'
    ]
  };

  /* ================= PICKUPS & ITEMS ================= */

  S.item = {
    heart: [
      '.aa..aa.',
      'a99aa99a',
      'a9999999',
      'a9999999',
      '.a99999.',
      '..a999..',
      '...a9...',
      '........'
    ],
    heartHalf: [
      '.aa.....',
      'a99a....',
      'a999....',
      'a999....',
      '.a99....',
      '..a9....',
      '...a....',
      '........'
    ],
    heartEmpty: [
      '.33..33.',
      '3..33..3',
      '3......3',
      '3......3',
      '.3.....3',
      '..3...3.',
      '...3.3..',
      '....3...'
    ],
    vessel: [
      '..aaaa..',
      '.a9999a.',
      'a999999a',
      'a997799a',
      'a999999a',
      '.a9999a.',
      '..a99a..',
      '...aa...'
    ],
    glimmer: [
      '..dd..',
      '.dccd.',
      'dc77cd',
      'dc77cd',
      '.dccd.',
      '..dd..'
    ],
    glimmerBig: [
      '..dd..',
      '.dccd.',
      'dc88cd',
      'dc88cd',
      'dc77cd',
      '.dccd.',
      '..dd..',
      '..dd..'
    ],
    key: [
      '..ddd...',
      '.d...d..',
      '.d.d.d..',
      '.d...d..',
      '..ddd...',
      '...d....',
      '...dd...',
      '...d.d..'
    ],
    seal: [
      '.pppppp.',
      'pddddddp',
      'pdssssdp',
      'pds77sdp',
      'pds77sdp',
      'pdssssdp',
      'pddddddp',
      '.pppppp.'
    ],
    bomb: [
      '...ee...',
      '..e.c...',
      '.111....',
      '11111...',
      '1111111.',
      '1111111.',
      '.11111..',
      '..111...'
    ],
    bow: [
      '..ee....',
      '.e..e...',
      'e....e..',
      'e....e..',
      'e....e..',
      '.e..e...',
      '..ee....',
      '........'
    ],
    stone: [
      '..555...',
      '.55665..',
      '55666655',
      '55666655',
      '.55665..',
      '..555...',
      '........',
      '........'
    ],
    torch: [
      '...c....',
      '..cbc...',
      '..cbc...',
      '...b....',
      '...e....',
      '...e....',
      '...e....',
      '...e....'
    ],
    shield: [
      '.eeeeee.',
      'e666666e',
      'e6dddd6e',
      'e6d77d6e',
      'e6dddd6e',
      '.e6666e.',
      '..e66e..',
      '...ee...'
    ],
    shieldWard: [
      '.dddddd.',
      'd888888d',
      'd8rrrr8d',
      'd8r88r8d',
      'd8rrrr8d',
      '.d8888d.',
      '..d88d..',
      '...dd...'
    ],
    ring: [
      '..bbbb..',
      '.b....b.',
      'b..cc..b',
      'b.c77c.b',
      'b..cc..b',
      '.b....b.',
      '..bbbb..',
      '........'
    ],
    potion: [
      '...ee...',
      '...66...',
      '..6666..',
      '.6aaaa6.',
      '.6a99a6.',
      '.6aaaa6.',
      '.6aaaa6.',
      '..6666..'
    ],
    horn: [
      '.....dd.',
      '....dccd',
      '...dcc.d',
      '..dcc..d',
      '.dcc..dd',
      'dcc..dd.',
      'dc..dd..',
      'ddd.....'
    ],
    raft: [
      '........',
      'eeeeeeee',
      'e.e.e.e.',
      'eeeeeeee',
      'e.e.e.e.',
      'eeeeeeee',
      '........',
      '........'
    ],
    vine: [
      '..i.....',
      '.i.i....',
      'i...i...',
      '.i...i..',
      '..i...i.',
      '...i...i',
      '....i.i.',
      '.....i..'
    ],
    map: [
      '66666666',
      '6iiiiii6',
      '6i.ii.i6',
      '6i.ii.i6',
      '6iiii9i6',
      '6i.ii.i6',
      '6iiiiii6',
      '66666666'
    ],
    compass: [
      '..6666..',
      '.633336.',
      '63399336',
      '63399336',
      '63399336',
      '.633336.',
      '..6666..',
      '........'
    ],
    shard: [
      '...dd...',
      '..dccd..',
      '.dc88cd.',
      'dc8887cd',
      'dc8877cd',
      '.dc77cd.',
      '..dccd..',
      '...dd...'
    ],
    sigil: [
      '...dddd...',
      '..dccccd..',
      '.dc8888cd.',
      'dc887788cd',
      'dc877778cd',
      'dc877778cd',
      'dc887788cd',
      '.dc8888cd.',
      '..dccccd..',
      '...dddd...'
    ],
    fairy: [
      '..77..',
      '.7887.',
      '78ff87',
      '78ff87',
      '.7887.',
      '..77..'
    ]
  };


  /* ================= ENEMIES ================= *
   * Two frames apiece; the engine alternates them on a slow tick. Directional
   * enemies are drawn facing down/left and mirrored or swapped as needed. */

  S.foe = {
    /* Grubling — squat bulb that spits pellets. The Emberwood's nuisance. */
    grubling: [
      [
        '..tttttttt..',
        '.tttttttttt.',
        'tttttttttttt',
        'tt00tttt00tt',
        'tt00tttt00tt',
        'tttttttttttt',
        'ttttfffftttt',
        'tttffffffttt',
        'tttttttttttt',
        '.tttttttttt.',
        '.gg......gg.',
        'gg........gg'
      ],
      [
        '..tttttttt..',
        '.tttttttttt.',
        'tttttttttttt',
        'tt00tttt00tt',
        'tt00tttt00tt',
        'tttttttttttt',
        'ttttfffftttt',
        'tttffffffttt',
        'tttttttttttt',
        '.tttttttttt.',
        '..gg....gg..',
        '.gg......gg.'
      ]
    ],
    /* Bristler — tusked brute that lobs thorns. */
    bristler: [
      [
        '...pppppp...',
        '..pppppppp..',
        '.pp8pppp8pp.',
        '.pp8pppp8pp.',
        'pppppppppppp',
        'pp00pppp00pp',
        'pppppppppppp',
        'ppp666666ppp',
        'pp66666666pp',
        'ppp8pppp8ppp',
        '.pppppppppp.',
        '..pp....pp..',
        '.epp....ppe.',
        '.ee......ee.'
      ],
      [
        '...pppppp...',
        '..pppppppp..',
        '.pp8pppp8pp.',
        '.pp8pppp8pp.',
        'pppppppppppp',
        'pp00pppp00pp',
        'pppppppppppp',
        'ppp666666ppp',
        'pp66666666pp',
        'ppp8pppp8ppp',
        '.pppppppppp.',
        '..pp....pp..',
        '..pp....pp..',
        '.eee....eee.'
      ]
    ],
    /* Skitter — four-legged hopper, arcs across the screen. */
    skitter: [
      [
        '..99999999..',
        '.9999999999.',
        '99aa9999aa99',
        '99aa9999aa99',
        '999999999999',
        '99a999999a99',
        '.9999999999.',
        '..99999999..',
        '.9..9999..9.',
        '9....99....9',
        '9..........9',
        '............'
      ],
      [
        '............',
        '..99999999..',
        '.9999999999.',
        '99aa9999aa99',
        '99aa9999aa99',
        '999999999999',
        '99a999999a99',
        '.9999999999.',
        '..99999999..',
        '..9..99..9..',
        '.9........9.',
        '9..........9'
      ]
    ],
    /* Burrower — surfaces out of sand, tracks you, dives again. */
    burrower: [
      [
        '.....ff.....',
        '....ffff....',
        '...ffggff...',
        '..ffggggff..',
        '.ffgg00ggff.',
        'ffgggggggggf',
        'fggggggggggf',
        'gg........gg'
      ],
      [
        '.....ff.....',
        '....ffff....',
        '...ffggff...',
        '..ffggggff..',
        '.ffgg00ggff.',
        'ffgggggggggf',
        '.ffgggggggf.',
        '..gg....gg..'
      ]
    ],
    /* Nightwing — erratic flier, hangs still until you come close. */
    nightwing: [
      [
        'pp........pp',
        'ppp......ppp',
        '.ppp2222ppp.',
        '..pp229922..',
        '...p222222..',
        '....2p..p2..',
        '.....2222...',
        '......22....'
      ],
      [
        '............',
        '.pp......pp.',
        '..pp2222pp..',
        '..pp229922..',
        'ppp222222ppp',
        'pp..2p..p2..',
        '.....2222...',
        '......22....'
      ]
    ],
    /* Bonepike — barrow guard, walks a straight line and turns at walls. */
    bonepike: [
      [
        '...666666...',
        '..66666666..',
        '..66000066..',
        '..66666666..',
        '...6.66.6...',
        '..66666666..',
        '.6666666666.',
        '66.666666.66',
        '6..666666..6',
        '...666666...',
        '...66..66...',
        '...66..66...',
        '..666..666..',
        '..66....66..'
      ],
      [
        '...666666...',
        '..66666666..',
        '..66000066..',
        '..66666666..',
        '...6.66.6...',
        '..66666666..',
        '.6666666666.',
        '.6.666666.6.',
        '..66666666.6',
        '...666666...',
        '..66....66..',
        '..66....66..',
        '.666......66',
        '.66.......66'
      ]
    ],
    /* Ooze — splits into two lesser oozes the first time it is cut. */
    ooze: [
      [
        '..uuuuuu..',
        '.uuvvvvuu.',
        'uuvvvvvvuu',
        'uv00vv00vu',
        'uvvvvvvvvu',
        'uuvvvvvvuu',
        'uuuvvvvuuu',
        '.uuuuuuuu.',
        '..uuuuuu..',
        '...uuuu...'
      ],
      [
        '...uuuu...',
        '..uuuuuu..',
        '.uuvvvvuu.',
        'uv00vv00vu',
        'uvvvvvvvvu',
        'uuvvvvvvuu',
        'uuuvvvvuuu',
        'uuuuuuuuuu',
        '.uuuuuuuu.',
        '..uuuuuu..'
      ]
    ],
    oozeSmall: [
      [
        '.uuuu.',
        'uvvvvu',
        'u0vv0u',
        'uvvvvu',
        'uuuuuu',
        '.uuuu.'
      ],
      [
        '..uu..',
        '.uuuu.',
        'uv00vu',
        'uvvvvu',
        'uuuuuu',
        '.uuuu.'
      ]
    ],
    /* Hexwright — blinks in, throws a bolt, blinks out. */
    hexwright: [
      [
        '...rrrr...',
        '..rrrrrr..',
        '.rrrrrrrr.',
        '.rr0rr0rr.',
        '.rrrrrrrr.',
        '..rrrrrr..',
        '.rrssssrr.',
        'rrssssssrr',
        'rssssssssr',
        'rssssssssr',
        '.ssssssss.',
        '..ssssss..',
        '..s.ss.s..',
        '.ss....ss.'
      ],
      [
        '...rrrr...',
        '..rrrrrr..',
        '.rrrrrrrr.',
        '.rr8rr8rr.',
        '.rrrrrrrr.',
        '..rrrrrr..',
        'srrssssrrs',
        'srssssssrs',
        '.ssssssss.',
        '.ssssssss.',
        '.ssssssss.',
        '..ssssss..',
        '..s.ss.s..',
        '.ss....ss.'
      ]
    ],
    /* Ironward — armoured; the breastplate turns any blow struck from the front. */
    ironward: [
      [
        '..333333..',
        '.33333333.',
        '.33999933.',
        '.33333333.',
        '3.333333.3',
        '3333333333',
        '4333333334',
        '4433333344',
        '4443333444',
        '.443333444',
        '.44444444.',
        '..44..44..',
        '..33..33..',
        '.333..333.'
      ],
      [
        '..333333..',
        '.33333333.',
        '.33999933.',
        '.33333333.',
        '3.333333.3',
        '3333333333',
        '4333333334',
        '4433333344',
        '4443333444',
        '.44444444.',
        '.44444444.',
        '..444444..',
        '..333333..',
        '.33....33.'
      ]
    ],
    /* Thornmaw — hops, and halves into two smaller ones when cut. */
    thornmaw: [
      [
        '..h..hh..h..',
        '.hh.hhhh.hh.',
        '.hhhhhhhhhh.',
        'hhhiiiiiihhh',
        'hhi00ii00ihh',
        'hhiiiiiiiihh',
        'hhi666666ihh',
        'hhiiiiiiiihh',
        '.hhiiiiiihh.',
        '.hhhhhhhhhh.',
        '..hh....hh..',
        '..h......h..'
      ],
      [
        '..h..hh..h..',
        '.hh.hhhh.hh.',
        '.hhhhhhhhhh.',
        'hhhiiiiiihhh',
        'hhi00ii00ihh',
        'hhiiiiiiiihh',
        'hhii6666iihh',
        'hhiiiiiiiihh',
        '.hhiiiiiihh.',
        '.hhhhhhhhhh.',
        '.hh......hh.',
        'hh........hh'
      ]
    ],
    thornmawSmall: [
      [
        '.h.hh.h.',
        'hhhhhhhh',
        'hi0ii0ih',
        'hiiiiiih',
        'hi6666ih',
        'hhiiiihh',
        '.hhhhhh.',
        '..h..h..'
      ],
      [
        '.h.hh.h.',
        'hhhhhhhh',
        'hi0ii0ih',
        'hiiiiiih',
        'hii66iih',
        'hhiiiihh',
        '.hhhhhh.',
        '.h....h.'
      ]
    ],
    /* Cinder Wisp — homing flame; only the barrows are cold enough to hold them. */
    wisp: [
      [
        '...cc...',
        '..cbbc..',
        '.cb99bc.',
        'cb9007bc',
        'cb9007bc',
        '.cb99bc.',
        '..cbbc..',
        '...cc...'
      ],
      [
        '...bb...',
        '..bccb..',
        '.bc99cb.',
        'bc9887cb',
        'bc9887cb',
        '.bc99cb.',
        '..bccb..',
        '...bb...'
      ]
    ],
    /* Gorger — swallows you whole and digests your shield. */
    gorger: [
      [
        '..999999..',
        '.99999999.',
        '9999999999',
        '9911111199',
        '9910000199',
        '9911111199',
        '9999999999',
        '.99999999.',
        '.99999999.',
        '..999999..',
        '..999999..',
        '...9999...'
      ],
      [
        '...9999...',
        '..999999..',
        '.99999999.',
        '9911111199',
        '9910000199',
        '9911111199',
        '9999999999',
        '9999999999',
        '.99999999.',
        '.99999999.',
        '..999999..',
        '...9999...'
      ]
    ],
    /* Wallcrawler — comes out of the barrow wall and drags you back to the door. */
    wallcrawler: [
      [
        '.4..4..4..4.',
        '44..4..4..44',
        '444444444444',
        '455555555554',
        '455555555554',
        '444444444444',
        '.4444444444.',
        '..44444444..'
      ],
      [
        '4...4..4...4',
        '44.44..44.44',
        '444444444444',
        '455555555554',
        '455555555554',
        '444444444444',
        '.4444444444.',
        '...444444...'
      ]
    ]
  };


  /* ================= BOSSES ================= */

  S.boss = {
    /* Coilfang — horned serpent coiled in the first barrow. */
    coilfang: [
      [
        '.66..............66.',
        '.666............666.',
        '..666..........666..',
        '..6669999999999666..',
        '...99999999999999...',
        '..9999999999999999..',
        '.999999999999999999.',
        '.99dd9999999999dd99.',
        '.99dd9999999999dd99.',
        '.999999999999999999.',
        '.99999aaaaaa9999999.',
        '.9999aaaaaaaa999999.',
        '..9999999999999999..',
        '..6.6.6.6.6.6.6.6...',
        '...99999999999999...',
        '....999999999999....',
        '.....9999999999.....',
        '......99999999......'
      ],
      [
        '.66..............66.',
        '.666............666.',
        '..666..........666..',
        '..6669999999999666..',
        '...99999999999999...',
        '..9999999999999999..',
        '.999999999999999999.',
        '.998899999999998899.',
        '.998899999999998899.',
        '.999999999999999999.',
        '.99999aaaaaa9999999.',
        '.9999aaaaaaaa999999.',
        '..9999999999999999..',
        '..66666666666666....',
        '...11111111111111...',
        '...6.6.6.6.6.6.6....',
        '....999999999999....',
        '.....9999999999.....'
      ]
    ],
    /* The Twin Maws — armoured, and only ever hurt from the inside. */
    twinmaws: [
      [
        '...3333......3333...',
        '..333333....333333..',
        '.33333333..33333333.',
        '.33dd3333..3333dd33.',
        '.33dd3333..3333dd33.',
        '.33333333..33333333.',
        '.39999993..39999993.',
        '.33333333..33333333.',
        '..444444....444444..',
        '.4444444444444444444',
        '44444444444444444444',
        '43333333333333333334',
        '43333333333333333334',
        '44444444444444444444',
        '.44444444444444444..',
        '..33......33......3.',
        '..33......33......3.',
        '.333......333.....33'
      ],
      [
        '...3333......3333...',
        '..333333....333333..',
        '.33333333..33333333.',
        '.33883333..33338833.',
        '.33883333..33338833.',
        '.33333333..33333333.',
        '.39999993..39999993.',
        '.31111113..31111113.',
        '..999999....999999..',
        '.4444444444444444444',
        '44444444444444444444',
        '43333333333333333334',
        '43333333333333333334',
        '44444444444444444444',
        '..444444444444444...',
        '.33......33......33.',
        '.33......33......33.',
        '333......333.....333'
      ]
    ],
    /* The Hollow Choir — a mask that only opens its eye to answer an arrow. */
    hollowchoir: [
      [
        '......pppppppp......',
        '....pppppppppppp....',
        '...pppppppppppppp...',
        '..pppppppppppppppp..',
        '..pppp88pppp88pppp..',
        '..ppp8888pp8888ppp..',
        '..pppp88pppp88pppp..',
        '..pppppppppppppppp..',
        '..pppppppppppppppp..',
        '..pppprrrrrrrrpppp..',
        '..ppprr999999rrppp..',
        '..pppr99999999rppp..',
        '..pppr99999999rppp..',
        '..ppprr999999rrppp..',
        '..pppprrrrrrrrpppp..',
        '...pppppppppppppp...',
        '....pppppppppppp....',
        '......pppppppp......'
      ],
      [
        '......pppppppp......',
        '....pppppppppppp....',
        '...pppppppppppppp...',
        '..pppppppppppppppp..',
        '..pppp88pppp88pppp..',
        '..ppp8888pp8888ppp..',
        '..pppp88pppp88pppp..',
        '..pppppppppppppppp..',
        '..ppppssssssssppp p.',
        '..pppsssssssssspppp.',
        '..ppss8888888888sspp',
        '..pss888800008888ssp',
        '..pss888800008888ssp',
        '..ppss8888888888sspp',
        '..pppsssssssssspppp.',
        '...pppssssssssppp...',
        '....pppppppppppp....',
        '......pppppppp......'
      ]
    ],
    /* Gravewyrm — a body that keeps sending its heads out on long necks. */
    gravewyrm: [
      [
        '....666666666666....',
        '..6666666666666666..',
        '.666666666666666666.',
        '66666633333366666666',
        '66663333333333366666',
        '66633399999933366666',
        '66633399999933366666',
        '66663333333333366666',
        '.666666333333666666.',
        '..6666666666666666..',
        '....666666666666....',
        '.....6666..6666.....'
      ],
      [
        '....666666666666....',
        '..6666666666666666..',
        '.666666666666666666.',
        '66666633333366666666',
        '66663333333333366666',
        '66633311111133366666',
        '66633311111133366666',
        '66663333333333366666',
        '.666666333333666666.',
        '..6666666666666666..',
        '....666666666666....',
        '....6666....6666....'
      ]
    ],
    wyrmhead: [
      [
        '..6666..',
        '.666666.',
        '66dd6dd6',
        '66666666',
        '66999966',
        '.666666.',
        '.6.66.6.',
        '..6666..'
      ],
      [
        '..6666..',
        '.666666.',
        '66888886',
        '66666666',
        '69999996',
        '.666666.',
        '.6.66.6.',
        '..6666..'
      ]
    ],
    /* Morvane, the Ashen King. Phase one wears the crown; phase two barely
     * holds a shape at all. */
    morvane: [
      [
        '...d..dddd..d...',
        '...dddddddddd...',
        '....22222222....',
        '...2222222222...',
        '..222bb22bb222..',
        '..222bb22bb222..',
        '..222222222222..',
        '..222999999222..',
        '...2222222222...',
        '..1122222222111.',
        '.11112222221111.',
        '1111111111111111',
        '1111111111111111',
        '.11111111111111.',
        '..111......111..',
        '..222......222..'
      ],
      [
        '...d..dddd..d...',
        '...dddddddddd...',
        '....22222222....',
        '...2222222222...',
        '..222cc22cc222..',
        '..222cc22cc222..',
        '..222222222222..',
        '..222bbbbbb222..',
        '...2222222222...',
        '..1122222222111.',
        '.11112222221111.',
        '1111111111111111',
        '1111111111111111',
        '.11111111111111.',
        '.111........111.',
        '.222........222.'
      ]
    ]
  };

  /* ================= NPCs ================= */

  S.npc = {
    /* The Hermit of the Wick — keeps a fire going in the old caves. */
    hermit: [
      [
        '....6666....',
        '...666666...',
        '..66666666..',
        '..66000066..',
        '..66666666..',
        '..66666666..',
        '...666666...',
        '..44444444..',
        '.4444444444.',
        '.4444444444.',
        '.4444444444.',
        '..44444444..',
        '..44444444..',
        '...444444...'
      ]
    ],
    /* Barrowdown pedlars, hooded against the grey. */
    merchant: [
      [
        '....pppp....',
        '...pppppp...',
        '..pppppppp..',
        '..ppf00fpp..',
        '..ppffffpp..',
        '...pffffp...',
        '..qqqqqqqq..',
        '.qqqqqqqqqq.',
        '.qqdddddqqq.',
        '.qqqqqqqqqq.',
        '.qqqqqqqqqq.',
        '..qqqqqqqq..',
        '..qq....qq..',
        '..ee....ee..'
      ]
    ],
    /* Vellamor, the seer who scattered the shards. */
    vellamor: [
      [
        '...dddddd...',
        '..dd8888dd..',
        '.d88888888d.',
        '.d8ff00ff8d.',
        '.d88ffff88d.',
        '..d8ffff8d..',
        '..77777777..',
        '.7777777777.',
        '.777dddd777.',
        '.77d8888d77.',
        '.777dddd777.',
        '.7777777777.',
        '..77777777..',
        '...777777...'
      ]
    ]
  };

  /* ================= EFFECTS ================= */

  S.fx = {
    /* The little cloud everything leaves behind when it dies. */
    poof: [
      [
        '........',
        '...44...',
        '..4554..',
        '.455554.',
        '.455554.',
        '..4554..',
        '...44...',
        '........'
      ],
      [
        '..4..4..',
        '.4.55.4.',
        '4.5555.4',
        '.555555.',
        '.555555.',
        '4.5555.4',
        '.4.55.4.',
        '..4..4..'
      ],
      [
        '.4....4.',
        '4..55..4',
        '..5..5..',
        '.5....5.',
        '.5....5.',
        '..5..5..',
        '4..55..4',
        '.4....4.'
      ],
      [
        '4......4',
        '........',
        '..4..4..',
        '........',
        '........',
        '..4..4..',
        '........',
        '4......4'
      ]
    ],
    boom: [
      [
        '....cccc....',
        '..cccbbccc..',
        '.ccbb99bbcc.',
        '.cb999999bc.',
        '.cb999999bc.',
        '.ccbb99bbcc.',
        '..cccbbccc..',
        '....cccc....'
      ],
      [
        '.c.cccccc.c.',
        'c.cbbbbbbc.c',
        '.cb999999bc.',
        'cb99777799bc',
        'cb99777799bc',
        '.cb999999bc.',
        'c.cbbbbbbc.c',
        '.c.cccccc.c.'
      ],
      [
        'c..c....c..c',
        '.cc.cccc.cc.',
        'c.cbb99bbc.c',
        '..b9....9b..',
        '..b9....9b..',
        'c.cbb99bbc.c',
        '.cc.cccc.cc.',
        'c..c....c..c'
      ],
      [
        'c..........c',
        '..c......c..',
        '....c..c....',
        '............',
        '............',
        '....c..c....',
        '..c......c..',
        'c..........c'
      ]
    ],
    /* Rising flame, used by burning brush and the Firebrand Torch. */
    fire: [
      [
        '..c..',
        '.cbc.',
        'cb9bc',
        'cbbbc',
        '.ccc.'
      ],
      [
        '..b..',
        '.bcb.',
        'bc9cb',
        'bcccb',
        '.bbb.'
      ]
    ],
    sparkle: [
      [
        '..7..',
        '.787.',
        '78887',
        '.787.',
        '..7..'
      ],
      [
        '.....',
        '..7..',
        '.787.',
        '..7..',
        '.....'
      ]
    ],
    /* Water rings that mark where the raft may be launched. */
    ripple: [
      [
        '.oooooo.',
        'o......o',
        'o......o',
        '.oooooo.'
      ],
      [
        '..oooo..',
        '.o....o.',
        '.o....o.',
        '..oooo..'
      ]
    ]
  };

  AV.Sprites = S;
})(window.AV = window.AV || {});
