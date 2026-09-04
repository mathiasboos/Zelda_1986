/* Ashvale — caves.
 * Single-room interiors reached from the overworld: the Hermit's fires, two
 * pedlars, and the holes where the good things are buried. Each is one screen
 * with a way back out at the bottom. */
(function (AV) {
  'use strict';

  var C = {

    /* --- the opening beat: where Kaelen is given the blade --- */
    hermit: {
      npc: 'hermit', fire: true,
      lines: [
        'THE GREY TOOK THE SIGIL OF DAWN,',
        'AND VELLAMOR SCATTERED ITS SHARDS',
        'SO MORVANE COULD NOT HOLD IT WHOLE.',
        'FIVE BARROWS. FIVE SHARDS.',
        'TAKE THIS AND GO, LANTERN-BEARER.'
      ],
      give: 'blade',
      giveLine: 'YOU TAKE UP THE EMBER BLADE.'
    },

    hint_wood: {
      npc: 'hermit', fire: true,
      lines: [
        'THE ROOTS BELOW THE OLD OAKS',
        'HAVE PUSHED A DOOR OPEN.',
        'GO WEST AND DOWN.'
      ]
    },
    hint_crag: {
      npc: 'hermit', fire: true,
      lines: [
        'THE VAULT IN THE CRAGS HAS NO DOOR',
        'A BLADE CAN OPEN.',
        'IT ANSWERS ONLY TO A HORN,',
        'AND THE HORN LIES BEHIND BURNT BRUSH.'
      ]
    },
    hint_salt: {
      npc: 'hermit', fire: true,
      lines: [
        'SOME ROCK IS SOUNDER THAN OTHER ROCK.',
        'LOOK FOR THE ONE THAT IS CRACKED,',
        'AND BRING SOMETHING LOUD.'
      ]
    },

    /* --- pedlars --- */
    shop_wood: {
      npc: 'merchant', fire: true,
      lines: ['TAKE WHAT YOU CAN PAY FOR.'],
      shop: [
        { item: 'bombs', cost: 20, label: 'BLASTROOT' },
        { item: 'potion', cost: 40, label: 'ROOT DRAUGHT' },
        { item: 'heart', cost: 10, label: 'AN EMBER' }
      ]
    },
    shop_downs: {
      npc: 'merchant', fire: true,
      lines: ['THE GREY HAS BEEN GOOD FOR TRADE.'],
      shop: [
        { item: 'shieldWard', cost: 90, label: 'WARDED SHIELD' },
        { item: 'ring', cost: 120, label: 'CINDER RING' },
        { item: 'quarrels', cost: 25, label: 'QUARRELS' }
      ]
    },

    /* --- item caches --- */
    raft: {
      chest: true,
      lines: ['SOMEONE LEFT THIS LASHED AND READY.'],
      give: 'raft',
      giveLine: 'YOU TAKE THE REED RAFT.'
    },
    horn: {
      chest: true, fire: true,
      lines: ['IT IS COLD, AND IT STILL HUMS.'],
      give: 'horn',
      giveLine: 'YOU TAKE THE WINDCALLER HORN.'
    },
    emberbrand: {
      npc: 'hermit', fire: true,
      lines: [
        'YOU HAVE CARRIED ENOUGH FIRE',
        'TO BE WORTH A BETTER BLADE.'
      ],
      give: 'brand',
      giveLine: 'THE EMBERBRAND IS YOURS.',
      requireHearts: 10,
      denyLines: [
        'COME BACK WHEN YOU CAN HOLD MORE.',
        'TEN EMBERS, AT LEAST.'
      ]
    },

    /* --- heart containers --- */
    vessel_wood:  { chest: true, give: 'vessel', lines: ['A VESSEL, KEPT DRY UNDER THE ROOTS.'], giveLine: 'YOUR HEART GROWS.' },
    vessel_crag:  { chest: true, give: 'vessel', lines: ['A VESSEL, WALLED UP IN THE CRAG.'], giveLine: 'YOUR HEART GROWS.' },
    vessel_mire:  { chest: true, give: 'vessel', lines: ['A VESSEL, SILTED OVER.'], giveLine: 'YOUR HEART GROWS.' },
    vessel_downs: { chest: true, give: 'vessel', lines: ['A VESSEL, LEFT AS A GRAVE-GOOD.'], giveLine: 'YOUR HEART GROWS.' },
    vessel_dwn2:  { chest: true, give: 'vessel', lines: ['A VESSEL, BEHIND THE BURNT THORN.'], giveLine: 'YOUR HEART GROWS.' },

    /* --- the wager --- */
    wager: {
      npc: 'merchant', fire: true,
      lines: ['THREE ROADS. ONE PAYS.', 'TEN GLIMMERS TO WALK ONE.'],
      wager: true
    }
  };

  AV.Caves = C;
})(window.AV = window.AV || {});
