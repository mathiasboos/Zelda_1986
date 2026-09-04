/* Ashvale — input.
 * Keyboard and gamepad collapse into one set of named actions.
 *
 * The important detail is that a key pressed and released *between* two
 * simulation steps still registers. The browser fires events whenever it likes;
 * the game only looks 60 times a second. Without latching the keydown, a quick
 * tap lands entirely in the gap and is never seen — menus miss it, and so does
 * a hurried sword swing. So a press is remembered until the next step reads it. */
(function (AV) {
  'use strict';

  var ACTIONS = ['up', 'down', 'left', 'right', 'sword', 'item', 'pause', 'select'];

  var KEYS = {
    'ArrowUp': 'up', 'KeyW': 'up',
    'ArrowDown': 'down', 'KeyS': 'down',
    'ArrowLeft': 'left', 'KeyA': 'left',
    'ArrowRight': 'right', 'KeyD': 'right',
    'KeyZ': 'sword', 'KeyJ': 'sword', 'Space': 'sword',
    'KeyX': 'item', 'KeyK': 'item', 'ShiftLeft': 'item', 'ShiftRight': 'item',
    'Enter': 'pause', 'Escape': 'pause',
    'Tab': 'select'
  };

  /* Standard-gamepad button indices -> actions. */
  var PADS = {
    12: 'up', 13: 'down', 14: 'left', 15: 'right',
    0: 'sword', 2: 'sword',
    1: 'item', 3: 'item',
    9: 'pause', 8: 'select'
  };

  var down = {};    // physically held right now
  var hit = {};     // went down since the last step, even if already released
  var now = {};     // what this step sees
  var last = {};    // what the previous step saw
  var buffer = {};  // frames of grace for an early press

  var i;
  for (i = 0; i < ACTIONS.length; i++) {
    down[ACTIONS[i]] = false; hit[ACTIONS[i]] = false;
    now[ACTIONS[i]] = false; last[ACTIONS[i]] = false;
    buffer[ACTIONS[i]] = 0;
  }

  var Input = { ACTIONS: ACTIONS };

  Input.attach = function (target) {
    target.addEventListener('keydown', function (e) {
      var a = KEYS[e.code];
      if (!a) return;
      /* Arrows, space and tab would otherwise scroll or move focus. */
      e.preventDefault();
      if (!down[a]) hit[a] = true;
      down[a] = true;
    });
    target.addEventListener('keyup', function (e) {
      var a = KEYS[e.code];
      if (!a) return;
      e.preventDefault();
      down[a] = false;
    });
    /* Losing focus mid-hold would leave Kaelen walking forever. */
    window.addEventListener('blur', Input.releaseAll);
  };

  Input.releaseAll = function () {
    for (var i = 0; i < ACTIONS.length; i++) { down[ACTIONS[i]] = false; }
  };

  function pollPads(into) {
    if (!navigator.getGamepads) return;
    var pads;
    try { pads = navigator.getGamepads(); } catch (e) { return; }
    if (!pads) return;
    for (var p = 0; p < pads.length; p++) {
      var pad = pads[p];
      if (!pad) continue;
      for (var b in PADS) {
        var btn = pad.buttons[b];
        if (btn && btn.pressed) into[PADS[b]] = true;
      }
      var ax = pad.axes[0] || 0, ay = pad.axes[1] || 0;
      if (ax < -0.4) into.left = true;
      if (ax > 0.4) into.right = true;
      if (ay < -0.4) into.up = true;
      if (ay > 0.4) into.down = true;
    }
  }

  /* Called once per simulation step, before anything reads input. */
  Input.step = function () {
    var pad = {};
    pollPads(pad);
    for (var i = 0; i < ACTIONS.length; i++) {
      var a = ACTIONS[i];
      last[a] = now[a];
      /* A tap that came and went still counts for exactly one step. */
      now[a] = !!(down[a] || pad[a] || hit[a]);
      hit[a] = false;
      if (now[a] && !last[a]) buffer[a] = 6;
      else if (buffer[a] > 0) buffer[a]--;
    }
  };

  Input.held = function (a) { return !!now[a]; };
  Input.pressed = function (a) { return !!now[a] && !last[a]; };

  /* True if the action was pressed within the last few frames, and spends it —
   * so an attack queued during hitstun still comes out. */
  Input.consume = function (a) {
    if (buffer[a] > 0) { buffer[a] = 0; return true; }
    return false;
  };

  Input.clearBuffers = function () {
    for (var i = 0; i < ACTIONS.length; i++) buffer[ACTIONS[i]] = 0;
  };

  Input.anyPressed = function () {
    for (var i = 0; i < ACTIONS.length; i++) {
      if (Input.pressed(ACTIONS[i])) return true;
    }
    return false;
  };

  /* -1/0/+1 on each axis. */
  Input.axis = function () {
    return {
      x: (Input.held('right') ? 1 : 0) - (Input.held('left') ? 1 : 0),
      y: (Input.held('down') ? 1 : 0) - (Input.held('up') ? 1 : 0)
    };
  };

  AV.Input = Input;
})(window.AV = window.AV || {});
