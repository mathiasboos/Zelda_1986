/* Ashvale — the overworld.
 * Thirty screens across five regions. Each screen is 16x11 tiles; screen edges
 * are stamped from the connection map so a passage always has a partner on the
 * far side (tools/validate.js re-checks this). Enemies are listed by type and
 * count and placed on free tiles at spawn time, so a screen is never identical
 * twice. */
(function (AV) {
  'use strict';

  AV.Overworld = {
    W: 6, H: 5,
    start: { sx: 1, sy: 3, tx: 7, ty: 6 },
    screens: {
      '0,0': {
        theme: 'crag',
        region: 'Ashen Crags',
        rows: [
          'MMMMMMMMMMMMMMMM',
          'MMMM........MMMM',
          'MMM..........MMM',
          'MM....RR.....M.M',
          'M.....RR.......,',
          'M..............,',
          'M.....RR.......,',
          'MM....RR.....M.M',
          'MMM..........MMM',
          'MMMM........MMMM',
          'MMMMMMMMMMMMMMMM'
        ],
        foes: [['skitter', 3]]
      },
      '1,0': {
        theme: 'crag',
        region: 'Ashen Crags',
        rows: [
          'MMMMMMMMMMMMMMMM',
          'MMM....MM....MMM',
          'MM...........,MM',
          'M....RrR.......M',
          ',....R,R.......,',
          ',..............,',
          ',.....,........,',
          'MM....,,.....,MM',
          'MMM..........MMM',
          'MMMM..,,,...MMMM',
          'MMMMMMM,,MMMMMMM'
        ],
        foes: [['skitter', 2], ['grubling', 2]],
        secret: { kind: 'bomb', tx: 6, ty: 3, to: 'cave:vessel_crag' }
      },
      '2,0': {
        theme: 'crag',
        region: 'Ashen Crags',
        rows: [
          'MMMMMMMMMMMMMMMM',
          'MMM..MMMM....MMM',
          'MM....,,......MM',
          'M...ttt,,......M',
          ',...t,,,,......,',
          ',......,,......,',
          ',...t,,,,......,',
          'MM..ttt,,.....MM',
          'MMM....,,....MMM',
          'MMMM...,,...MMMM',
          'MMMMMMM,,MMMMMMM'
        ],
        foes: [['grubling', 3]],
        secret: { kind: 'burn', tx: 4, ty: 3, to: 'cave:wager' }
      },
      '3,0': {
        theme: 'crag',
        region: 'Ashen Crags',
        rows: [
          'MMMMMMMMMMMMMMMM',
          'MMMMM.MMMMM.MMMM',
          'MMMM..,,,,..MMMM',
          'MMM...,^,,...MMM',
          ',,....,,,,....,,',
          ',......,,......,',
          ',,....,,,,....,,',
          'MMM..RR,,RR..MMM',
          'MMMM.,,,,,,.MMMM',
          'MMMM...,,...MMMM',
          'MMMMMMM,,MMMMMMM'
        ],
        foes: [['bristler', 3], ['hexwright', 1]],
        portals: [{ tx: 7, ty: 3, to: 'b4', sealed: 'horn' }]
      },
      '4,0': {
        theme: 'crag',
        region: 'Ashen Crags',
        rows: [
          'MMMMMMMMMMMMMMMM',
          'MMMMM......MMMMM',
          'MMMM........MMMM',
          'MMM....^.....MMM',
          ',,............MM',
          ',..............M',
          ',,............MM',
          'MMM.........MMMM',
          'MMMM........MMMM',
          'MMMMM..,,..MMMMM',
          'MMMMMMMMMMMMMMMM'
        ],
        foes: [['ironward', 2]],
        portals: [{ tx: 7, ty: 3, to: 'cave:emberbrand' }]
      },
      '5,0': {
        theme: 'downs',
        region: 'Barrowdowns',
        rows: [
          'MMMMMMMMMMMMMMMM',
          'MMM..........MMM',
          'MM....RR......MM',
          'M.....Rr......MM',
          'M.....RR.......M',
          'M..............M',
          'M.....RR.......M',
          'MM...RRRR.....MM',
          'MMM..........MMM',
          'MMMM...,,...MMMM',
          'MMMMMMM..MMMMMMM'
        ],
        foes: [['nightwing', 3]],
        secret: { kind: 'bomb', tx: 7, ty: 3, to: 'cave:vessel_downs' }
      },
      '0,1': {
        theme: 'mire',
        region: 'The Mire',
        rows: [
          'TTTTTTTTTTTTTTTT',
          'TTTTWWWWWWWTTTTT',
          'TTTWWWWWWWWWTTTT',
          'TTWWW....WWWWTTT',
          'TTWWW.^..WWWWTTT',
          'TTWWW..D.WWWWTTT',
          'TTWWWWWWWWWWWTTT',
          'TTTWWWWWWWWWTTTT',
          'TTTTWWWWWWWTTTTT',
          'TTTTT..D...TTTTT',
          'TTTTTTT..TTTTTTT'
        ],
        foes: [['ooze', 2]],
        portals: [{ tx: 6, ty: 4, to: 'b3' }]
      },
      '1,1': {
        theme: 'mire',
        region: 'The Mire',
        rows: [
          'TTTTTTT..TTTTTTT',
          'TTT..........TTT',
          'TT...WWWWW....TT',
          'T...WWWWWWW...TT',
          'T...WWWWWWW.....',
          'T..WWWWWWWWW....',
          'T...WWWWWWW.....',
          'TT...WWWWW....TT',
          'TTT..."".....TTT',
          'TTTT..,,....TTTT',
          'TTTTTTT..TTTTTTT'
        ],
        foes: [['ooze', 3]]
      },
      '2,1': {
        theme: 'crag',
        region: 'Ashen Crags',
        rows: [
          'MMMMMMM,,MMMMMMM',
          'MMM...,,.....MMM',
          'MM....,,......MM',
          'M..ttt,,tt.....M',
          ',..ttt,,.t.....,',
          ',..ttt,,.......,',
          ',.....,,.......,',
          'MM....,,......MM',
          'MMM...,,.....MMM',
          'MMMM..,,....MMMM',
          'MMMMMMM,,MMMMMMM'
        ],
        foes: [['grubling', 3]],
        secret: { kind: 'burn', tx: 4, ty: 3, to: 'cave:horn' }
      },
      '3,1': {
        theme: 'crag',
        region: 'Ashen Crags',
        rows: [
          'MMMMMMM,,MMMMMMM',
          'MMM...,,.....MMM',
          'MM....,,......MM',
          'M.RR..,,..RR...M',
          ',.,^..,,..RR...,',
          ',.....,,.......,',
          ',.,R..,,..RR...,',
          'MM.RR.,,..RR..MM',
          'MMM...,,.....MMM',
          'MMMM..,,....MMMM',
          'MMMMMMM,,MMMMMMM'
        ],
        foes: [['bristler', 2], ['skitter', 2]],
        portals: [{ tx: 3, ty: 4, to: 'cave:hint_crag' }]
      },
      '4,1': {
        theme: 'downs',
        region: 'Barrowdowns',
        rows: [
          'MMMMMMMMMMMMMMMM',
          'MMMM..,,....MMMM',
          'MMM...,,.....MMM',
          'MM..XX,,XX....MM',
          '......,,........',
          '......,,........',
          '....XX,,XX......',
          'MM....,,......MM',
          'MMM...,,.....MMM',
          'MMMM..,,....MMMM',
          'MMMMMMM..MMMMMMM'
        ],
        foes: [['hexwright', 2], ['nightwing', 2]]
      },
      '5,1': {
        theme: 'downs',
        region: 'Barrowdowns',
        rows: [
          'MMMMMMM..MMMMMMM',
          'MMMMMMMGGMMMMMMM',
          'MMMMGGGGGGGGMMMM',
          'MMGGGGGGGGGGGGMM',
          '.GGGGGG^GGGGGGGM',
          '..GGGGGGGGGGGGMM',
          '...GGGGGGGGGGMMM',
          'MMMM..GG....MMMM',
          'MMM...,,.....MMM',
          'MMMM..,,....MMMM',
          'MMMMMMM..MMMMMMM'
        ],
        foes: [],
        portals: [{ tx: 7, ty: 4, to: 'lair', sealed: 'shards' }]
      },
      '0,2': {
        theme: 'mire',
        region: 'The Mire',
        rows: [
          'TTTTTTT..TTTTTTT',
          'TTTT..,,....TTTT',
          'TTT...,,.....TTT',
          'TT....,,......TT',
          'T.....,,........',
          'T.....,,........',
          'TT..""",,"".....',
          'TT..WWWWWWW...TT',
          'TTT.WWWWWWW..TTT',
          'TTTT..,,....TTTT',
          'TTTTTTT..TTTTTTT'
        ],
        foes: [['grubling', 2], ['ooze', 2]]
      },
      '1,2': {
        theme: 'mire',
        region: 'The Mire',
        rows: [
          'TTTTTTT..TTTTTTT',
          'TTTT..,,....TTTT',
          'TTT...,,.....TTT',
          'TT.rR.,,..TT..TT',
          '...RR.,,..TT....',
          '......,,........',
          '......,,..TT....',
          'TT..""",,""...TT',
          'TTT...,,.....TTT',
          'TTTT..,,....TTTT',
          'TTTTTTT..TTTTTTT'
        ],
        foes: [['grubling', 3]],
        secret: { kind: 'bomb', tx: 3, ty: 3, to: 'cave:vessel_mire' }
      },
      '2,2': {
        theme: 'wood',
        region: 'Emberwood',
        rows: [
          'TTTTTTT..TTTTTTT',
          'TTTT..,,....TTTT',
          'TTT...,,.....TTT',
          'TT.TT.,,.TT...TT',
          '...TT.,,.TT.....',
          '......,,........',
          '...TT.,,.TT.....',
          'TT.TT.,,.TT...TT',
          'TTT...,,.....TTT',
          'TTTT..,,....TTTT',
          'TTTTTTT..TTTTTTT'
        ],
        foes: [['grubling', 2], ['skitter', 2]]
      },
      '3,2': {
        theme: 'downs',
        region: 'Barrowdowns',
        rows: [
          'MMMMMMM..MMMMMMM',
          'MMMM..,,....MMMM',
          'MMM...,,.....MMM',
          'MM.ttt,,......MM',
          '...ttt,,........',
          '...ttt,,........',
          '......,,.XX.....',
          'MM....,,.XX...MM',
          'MMM...,,.....MMM',
          'MMMM..,,....MMMM',
          'MMMMMMM..MMMMMMM'
        ],
        foes: [['hexwright', 1], ['bristler', 2]],
        secret: { kind: 'burn', tx: 4, ty: 3, to: 'cave:vessel_dwn2' }
      },
      '4,2': {
        theme: 'downs',
        region: 'Barrowdowns',
        rows: [
          'MMMMMMM..MMMMMMM',
          'MMMM..,,....MMMM',
          'MMM...,,.....MMM',
          'MM..XX,,......MM',
          '......,^,.......',
          '......,,,.......',
          '......,,..XX....',
          'MM....,,..XX..MM',
          'MMM...,,.....MMM',
          'MMMM..,,....MMMM',
          'MMMMMMM..MMMMMMM'
        ],
        foes: [['bristler', 3]],
        portals: [{ tx: 7, ty: 4, to: 'cave:shop_downs' }]
      },
      '5,2': {
        theme: 'downs',
        region: 'Barrowdowns',
        rows: [
          'MMMMMMM..MMMMMMM',
          'MMMM..,,....MMMM',
          'MMM...,,.....MMM',
          'MM..GG,,GG....MM',
          '...GG.,,.GG....M',
          '......,,.......M',
          '....GG,,GG....MM',
          'MM.GG.,,.GG...MM',
          'MMM...,,.....MMM',
          'MMMM..,,....MMMM',
          'MMMMMMM..MMMMMMM'
        ],
        foes: [['nightwing', 3], ['hexwright', 1]]
      },
      '0,3': {
        theme: 'wood',
        region: 'Emberwood',
        rows: [
          'TTTTTTT..TTTTTTT',
          'TTTT..,,....TTTT',
          'TTT...,,.....TTT',
          'TT.ttt,,......TT',
          'T..ttt,,........',
          'T..ttt,,........',
          'TT....,,..TT....',
          'TT..TT,,..TT..TT',
          'TTT...,,.....TTT',
          'TTTT..,,....TTTT',
          'TTTTTTT..TTTTTTT'
        ],
        foes: [['grubling', 2]],
        secret: { kind: 'burn', tx: 4, ty: 3, to: 'cave:vessel_wood' }
      },
      '1,3': {
        theme: 'wood',
        region: 'Emberwood',
        rows: [
          'TTTTTTT..TTTTTTT',
          'TTTT..,,....TTTT',
          'TTT...,,.....TTT',
          'TT.TT.,,.TT...TT',
          '......,^,.......',
          '......,,,.......',
          '...TT.,,.TT.....',
          'TT.TT.,,.TT...TT',
          'TTT...,,.....TTT',
          'TTTT..,,....TTTT',
          'TTTTTTT..TTTTTTT'
        ],
        foes: [],
        portals: [{ tx: 7, ty: 4, to: 'cave:hermit' }]
      },
      '2,3': {
        theme: 'wood',
        region: 'Emberwood',
        rows: [
          'TTTTTTT..TTTTTTT',
          'TTTT..,,....TTTT',
          'TTT...,,.....TTT',
          'TT..T.,,.T....TT',
          '......,,........',
          '...T..,^,..T....',
          '......,,,.......',
          'TT..T.,,.T....TT',
          'TTT...,,.....TTT',
          'TTTT..,,....TTTT',
          'TTTTTTT..TTTTTTT'
        ],
        foes: [['grubling', 2]],
        portals: [{ tx: 7, ty: 5, to: 'cave:hint_wood' }]
      },
      '3,3': {
        theme: 'salt',
        region: 'Saltflats',
        rows: [
          'RRRRRRR,,RRRRRRR',
          'R,,,..,,....,,,R',
          'R,,...,,.....,,R',
          'R,.RR.,,.RR...,R',
          ',.....,,.......,',
          ',.....,,.......,',
          ',,.RR.,,.RR...,,',
          'R,....,,......,R',
          'R,,...,,.....,,R',
          'R,,,..,,....,,,R',
          'RRRRRRR,,RRRRRRR'
        ],
        foes: [['burrower', 2], ['grubling', 2]]
      },
      '4,3': {
        theme: 'salt',
        region: 'Saltflats',
        rows: [
          'RRRRRRR,,RRRRRRR',
          'R,,,..,,....,,,R',
          'R,,...,,.....,,R',
          'R,.RRR,,......,R',
          ',..Rr.,,.......,',
          ',..RRR,,.......,',
          ',,....,,..RR..,,',
          'R,....,,..RR..,R',
          'R,,...,,.....,,R',
          'R,,,..,,....,,,R',
          'RRRRRRR,,RRRRRRR'
        ],
        foes: [['skitter', 3]],
        secret: { kind: 'bomb', tx: 4, ty: 4, to: 'cave:raft' }
      },
      '5,3': {
        theme: 'salt',
        region: 'Saltflats',
        rows: [
          'RRRRRRR,,RRRRRRR',
          'R,,,..,,....,,,R',
          'R,,...,,.....,,R',
          'R,....,,..RR..,R',
          ',.....,^,.RR...R',
          ',.....,,,......R',
          ',,.RR.,,......,R',
          'R,.RR.,,......,R',
          'R,,...,,.....,,R',
          'R,,,..,,....,,,R',
          'RRRRRRR,,RRRRRRR'
        ],
        foes: [['bristler', 2]],
        portals: [{ tx: 7, ty: 4, to: 'cave:hint_salt' }]
      },
      '0,4': {
        theme: 'wood',
        region: 'Emberwood',
        rows: [
          'TTTTTTT..TTTTTTT',
          'TTTT..,,....TTTT',
          'TTT...,,.....TTT',
          'TT.TTT,,TTT...TT',
          'T..TT.,^,TT.....',
          'T.....,,,.......',
          'TT.TT.,,.TT.....',
          'TT.TTT,,TTT...TT',
          'TTT...,,.....TTT',
          'TTTTTTTTTTTTTTTT',
          'TTTTTTTTTTTTTTTT'
        ],
        foes: [['grubling', 2], ['skitter', 1]],
        portals: [{ tx: 7, ty: 4, to: 'b1' }]
      },
      '1,4': {
        theme: 'wood',
        region: 'Emberwood',
        rows: [
          'TTTTTTT..TTTTTTT',
          'TTTT..,,....TTTT',
          'TTT...,,.....TTT',
          'TT....,,......TT',
          '......,,........',
          '...TT.,,.TT.....',
          '...TT.,,.TT.....',
          'TT....,,......TT',
          'TTT...,,.....TTT',
          'TTTTTTTTTTTTTTTT',
          'TTTTTTTTTTTTTTTT'
        ],
        foes: [['grubling', 3]]
      },
      '2,4': {
        theme: 'salt',
        region: 'Saltflats',
        rows: [
          'RRRRRRR,,RRRRRRR',
          'R,,,..,,....,,,R',
          'R,,...,,.....,,R',
          'R,..RR,,RR....,R',
          ',.....,^,......,',
          ',.....,,,......,',
          ',,..RR,,RR....,,',
          'R,....,,......,R',
          'R,,...,,.....,,R',
          'RRRRRRRRRRRRRRRR',
          'RRRRRRRRRRRRRRRR'
        ],
        foes: [['burrower', 2]],
        portals: [{ tx: 7, ty: 4, to: 'cave:shop_wood' }]
      },
      '3,4': {
        theme: 'salt',
        region: 'Saltflats',
        rows: [
          'RRRRRRR,,RRRRRRR',
          'R,,,..,,....,,,R',
          'R,,...,,.....,,R',
          'R,.RR.,,.RR...,R',
          ',.....,,.......,',
          ',..RR.,,.RR....,',
          ',,....,,......,,',
          'R,.RR.,,.RR...,R',
          'R,,...,,.....,,R',
          'RRRRRRRRRRRRRRRR',
          'RRRRRRRRRRRRRRRR'
        ],
        foes: [['burrower', 3]]
      },
      '4,4': {
        theme: 'salt',
        region: 'Saltflats',
        rows: [
          'RRRRRRR,,RRRRRRR',
          'R,,,..,,....,,,R',
          'R,,...,,.....,,R',
          'R,....,,......,R',
          ',..RR.,,.RRR...,',
          ',..RR.,,.RRR...,',
          ',,....,,......,,',
          'R,..RRR,RRR...,R',
          'R,,...,,.....,,R',
          'RRRRRRRRRRRRRRRR',
          'RRRRRRRRRRRRRRRR'
        ],
        foes: [['burrower', 2], ['skitter', 2]]
      },
      '5,4': {
        theme: 'salt',
        region: 'Saltflats',
        rows: [
          'RRRRRRR,,RRRRRRR',
          'R,,,..,,....,,,R',
          'R,,...,,.....,,R',
          'R,..RRRRRR....,R',
          ',...RRrRRR.....R',
          ',...RR,RRR....,R',
          ',,..RR,,RR....,R',
          'R,....,,......,R',
          'R,,...,,.....,,R',
          'RRRRRRRRRRRRRRRR',
          'RRRRRRRRRRRRRRRR'
        ],
        foes: [['bristler', 2]],
        secret: { kind: 'bomb', tx: 6, ty: 4, to: 'b2' }
      }
    }
  };
})(window.AV = window.AV || {});
