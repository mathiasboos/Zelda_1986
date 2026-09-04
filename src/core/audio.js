/* Ashvale — audio.
 * A small chiptune synth over WebAudio: duty-cycle pulse waves for melody, a
 * triangle for bass, filtered noise for percussion. Every tune here is original.
 * Nothing sounds until the player touches a key, per browser autoplay rules. */
(function (AV) {
  'use strict';

  var Audio = { ready: false, muted: false, volume: 0.55 };

  var ctx = null, master = null, musicBus = null, sfxBus = null;
  var waves = {};
  var noiseBuf = null;

  var STEP = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

  function freqOf(name) {
    var m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
    if (!m) return 0;
    var semi = STEP[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    var n = semi + (parseInt(m[3], 10) - 4) * 12 - 9;
    return 440 * Math.pow(2, n / 12);
  }

  /* Band-limited pulse at a given duty, so 12.5% reads as thin and reedy the
   * way it should rather than aliasing into mush. */
  function pulseWave(duty) {
    var key = 'p' + duty;
    if (waves[key]) return waves[key];
    var N = 32;
    var real = new Float32Array(N), imag = new Float32Array(N);
    for (var n = 1; n < N; n++) {
      imag[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
    }
    waves[key] = ctx.createPeriodicWave(real, imag, { disableNormalization: false });
    return waves[key];
  }

  function noiseBuffer() {
    if (noiseBuf) return noiseBuf;
    var len = ctx.sampleRate * 0.5;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return noiseBuf;
  }

  Audio.init = function () {
    if (Audio.ready) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { ctx = new AC(); } catch (e) { return; }
    master = ctx.createGain();
    master.gain.value = Audio.muted ? 0 : Audio.volume;
    master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.75; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 1.0; sfxBus.connect(master);
    Audio.ready = true;
  };

  Audio.resume = function () {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  };

  Audio.setMuted = function (m) {
    Audio.muted = m;
    if (master) master.gain.value = m ? 0 : Audio.volume;
  };

  Audio.toggleMute = function () { Audio.setMuted(!Audio.muted); return Audio.muted; };

  /* --- one-shot voices ------------------------------------------------ */

  function blip(o) {
    if (!Audio.ready) return;
    var t0 = ctx.currentTime + (o.delay || 0);
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    if (o.duty) osc.setPeriodicWave(pulseWave(o.duty));
    else osc.type = o.wave || 'square';
    osc.frequency.setValueAtTime(o.from, t0);
    if (o.to && o.to !== o.from) {
      if (o.slide === 'exp') osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.to), t0 + o.dur);
      else osc.frequency.linearRampToValueAtTime(Math.max(1, o.to), t0 + o.dur);
    }
    var peak = (o.gain === undefined ? 0.3 : o.gain);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + (o.attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    osc.connect(g); g.connect(o.bus || sfxBus);
    osc.start(t0); osc.stop(t0 + o.dur + 0.02);
  }

  function noise(o) {
    if (!Audio.ready) return;
    var t0 = ctx.currentTime + (o.delay || 0);
    var src = ctx.createBufferSource();
    src.buffer = noiseBuffer();
    src.loop = true;
    var f = ctx.createBiquadFilter();
    f.type = o.filter || 'bandpass';
    f.frequency.setValueAtTime(o.from || 1200, t0);
    if (o.to) f.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t0 + o.dur);
    f.Q.value = o.q === undefined ? 1.0 : o.q;
    var g = ctx.createGain();
    var peak = (o.gain === undefined ? 0.25 : o.gain);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    src.connect(f); f.connect(g); g.connect(o.bus || sfxBus);
    src.start(t0); src.stop(t0 + o.dur + 0.02);
  }

  /* --- sound effects --------------------------------------------------- */

  var SFX = {
    sword:    function () { noise({ from: 3200, to: 900, dur: 0.11, gain: 0.20, q: 1.6 }); },
    beam:     function () { blip({ from: 900, to: 1700, dur: 0.16, duty: 0.25, gain: 0.16 }); },
    hitEnemy: function () { noise({ from: 1800, to: 300, dur: 0.09, gain: 0.24, q: 0.8 }); },
    kill:     function () { noise({ from: 2400, to: 160, dur: 0.22, gain: 0.26, q: 0.6 }); },
    hurt:     function () { blip({ from: 420, to: 90, dur: 0.28, wave: 'sawtooth', gain: 0.26, slide: 'exp' }); },
    block:    function () { blip({ from: 1500, to: 1500, dur: 0.05, duty: 0.125, gain: 0.16 });
                            noise({ from: 5000, to: 2000, dur: 0.06, gain: 0.12, q: 3 }); },
    pickup:   function () { blip({ from: 880, dur: 0.06, duty: 0.5, gain: 0.16 });
                            blip({ from: 1320, dur: 0.08, duty: 0.5, gain: 0.16, delay: 0.055 }); },
    heart:    function () { blip({ from: 660, dur: 0.05, duty: 0.5, gain: 0.15 });
                            blip({ from: 990, dur: 0.05, duty: 0.5, gain: 0.15, delay: 0.05 });
                            blip({ from: 1320, dur: 0.09, duty: 0.5, gain: 0.15, delay: 0.10 }); },
    key:      function () { blip({ from: 1500, dur: 0.05, duty: 0.25, gain: 0.15 });
                            blip({ from: 2000, dur: 0.10, duty: 0.25, gain: 0.15, delay: 0.05 }); },
    secret:   function () { var n = ['E5', 'G5', 'B5', 'E6'];
                            for (var i = 0; i < n.length; i++) {
                              blip({ from: freqOf(n[i]), dur: 0.13, duty: 0.5, gain: 0.15, delay: i * 0.075 });
                            } },
    fanfare:  function () { var n = ['C5', 'E5', 'G5', 'C6', 'G5', 'C6'];
                            var d = [0.11, 0.11, 0.11, 0.17, 0.09, 0.34], t = 0;
                            for (var i = 0; i < n.length; i++) {
                              blip({ from: freqOf(n[i]), dur: d[i], duty: 0.25, gain: 0.19, delay: t });
                              blip({ from: freqOf(n[i]) / 2, dur: d[i], wave: 'triangle', gain: 0.16, delay: t });
                              t += d[i];
                            } },
    door:     function () { noise({ from: 500, to: 160, dur: 0.24, gain: 0.20, filter: 'lowpass', q: 1 }); },
    stairs:   function () { blip({ from: 300, to: 800, dur: 0.20, duty: 0.5, gain: 0.14, slide: 'exp' }); },
    bomb:     function () { noise({ from: 900, to: 60, dur: 0.55, gain: 0.34, filter: 'lowpass', q: 1 });
                            blip({ from: 160, to: 30, dur: 0.4, wave: 'sawtooth', gain: 0.18, slide: 'exp' }); },
    fuse:     function () { noise({ from: 6000, to: 4000, dur: 0.08, gain: 0.06, q: 4 }); },
    arrow:    function () { noise({ from: 4200, to: 2600, dur: 0.07, gain: 0.13, q: 3 }); },
    stone:    function () { blip({ from: 1200, to: 700, dur: 0.09, duty: 0.125, gain: 0.13 }); },
    flame:    function () { noise({ from: 800, to: 2200, dur: 0.22, gain: 0.14, q: 0.7 }); },
    horn:     function () { var n = ['A4', 'C5', 'E5', 'A5', 'E5'], t = 0;
                            for (var i = 0; i < n.length; i++) {
                              blip({ from: freqOf(n[i]), dur: 0.2, duty: 0.5, gain: 0.17, delay: t }); t += 0.14;
                            } },
    text:     function () { blip({ from: 1400, dur: 0.018, duty: 0.5, gain: 0.05 }); },
    select:   function () { blip({ from: 700, dur: 0.04, duty: 0.5, gain: 0.12 }); },
    confirm:  function () { blip({ from: 700, dur: 0.05, duty: 0.5, gain: 0.14 });
                            blip({ from: 1050, dur: 0.09, duty: 0.5, gain: 0.14, delay: 0.05 }); },
    deny:     function () { blip({ from: 200, to: 140, dur: 0.14, wave: 'square', gain: 0.14 }); },
    lowHeart: function () { blip({ from: 1100, dur: 0.05, duty: 0.125, gain: 0.09 }); },
    bossHurt: function () { noise({ from: 900, to: 200, dur: 0.16, gain: 0.26, q: 0.7 });
                            blip({ from: 260, to: 110, dur: 0.2, wave: 'sawtooth', gain: 0.16, slide: 'exp' }); },
    bossDie:  function () { noise({ from: 2000, to: 60, dur: 1.1, gain: 0.3, filter: 'lowpass', q: 1 });
                            blip({ from: 300, to: 40, dur: 1.0, wave: 'sawtooth', gain: 0.2, slide: 'exp' }); },
    shard:    function () { var n = ['G5', 'B5', 'D6', 'G6', 'D6', 'G6'], t = 0;
                            for (var i = 0; i < n.length; i++) {
                              blip({ from: freqOf(n[i]), dur: 0.28, duty: 0.5, gain: 0.16, delay: t }); t += 0.16;
                            } },
    die:      function () { var n = ['G4', 'F4', 'D#4', 'C4', 'A3', 'G3'], t = 0;
                            for (var i = 0; i < n.length; i++) {
                              blip({ from: freqOf(n[i]), dur: 0.3, duty: 0.25, gain: 0.18, delay: t }); t += 0.2;
                            } }
  };

  Audio.play = function (name) {
    if (!Audio.ready || Audio.muted) return;
    var f = SFX[name];
    if (f) f();
  };

  /* --- music ----------------------------------------------------------- */

  /* Tracks are written as "NOTE:BEATS" tokens; '-' is a rest, '=' extends the
   * previous note. Beats are quarter notes at the song's tempo. */
  function parseTrack(str) {
    var out = [], toks = str.split(/\s+/);
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i];
      if (!t) continue;
      var bits = t.split(':');
      var dur = bits.length > 1 ? parseFloat(bits[1]) : 1;
      out.push({ name: bits[0], dur: dur });
    }
    return out;
  }

  var SONGS = {
    /* Stately and a little mournful — the land before you set out. */
    title: {
      tempo: 84,
      tracks: [
        { wave: 'pulse', duty: 0.5, gain: 0.13, oct: 0, seq:
          'D5:2 A4:1 D5:1 F5:2 E5:2 D5:1 C5:1 A4:2 -:2 ' +
          'C5:2 G4:1 C5:1 E5:2 D5:2 A4:3 -:1' },
        { wave: 'pulse', duty: 0.25, gain: 0.07, oct: 0, seq:
          'F4:2 F4:1 A4:1 A4:2 G4:2 F4:1 E4:1 E4:2 -:2 ' +
          'E4:2 E4:1 G4:1 G4:2 F4:2 E4:3 -:1' },
        { wave: 'triangle', gain: 0.16, oct: 0, seq:
          'D3:2 D3:2 F3:2 A3:2 G3:2 G3:2 A3:2 A3:2 ' +
          'C3:2 C3:2 E3:2 G3:2 F3:2 F3:2 A3:2 A3:2' }
      ]
    },
    /* Brisk walking theme for the overworld. */
    field: {
      tempo: 148,
      tracks: [
        { wave: 'pulse', duty: 0.5, gain: 0.115, seq:
          'D5:1 D5:.5 F5:.5 A5:1 G5:.5 F5:.5 E5:1 D5:.5 E5:.5 F5:2 ' +
          'C5:1 C5:.5 E5:.5 G5:1 F5:.5 E5:.5 D5:1 C5:.5 D5:.5 E5:2 ' +
          'F5:1 A5:1 G5:.5 F5:.5 E5:1 D5:1 F5:1 A5:.5 C6:.5 A5:2 ' +
          'G5:1 F5:.5 E5:.5 D5:1 A4:1 D5:2 -:2' },
        { wave: 'pulse', duty: 0.125, gain: 0.055, seq:
          'A4:1 A4:.5 D5:.5 F5:1 E5:.5 D5:.5 C5:1 A4:.5 C5:.5 D5:2 ' +
          'G4:1 G4:.5 C5:.5 E5:1 D5:.5 C5:.5 A4:1 G4:.5 A4:.5 C5:2 ' +
          'D5:1 F5:1 E5:.5 D5:.5 C5:1 A4:1 D5:1 F5:.5 A5:.5 F5:2 ' +
          'E5:1 D5:.5 C5:.5 A4:1 F4:1 A4:2 -:2' },
        { wave: 'triangle', gain: 0.15, seq:
          'D3:1 A3:1 D3:1 A3:1 F3:1 C4:1 F3:1 C4:1 ' +
          'C3:1 G3:1 C3:1 G3:1 A3:1 E4:1 A3:1 E4:1 ' +
          'D3:1 A3:1 D3:1 A3:1 F3:1 C4:1 F3:1 C4:1 ' +
          'G3:1 D4:1 A3:1 E4:1 D3:1 A3:1 D3:2' },
        { wave: 'noise', gain: 0.05, hat: true, seq:
          'x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 ' +
          'x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 ' +
          'x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 ' +
          'x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5' }
      ]
    },
    /* Underground: sparse, low, uneasy. */
    barrow: {
      tempo: 112,
      tracks: [
        { wave: 'pulse', duty: 0.125, gain: 0.09, seq:
          'E4:1 -:1 F4:1 -:1 E4:.5 F4:.5 G4:1 -:2 ' +
          'B3:1 -:1 C4:1 -:1 B3:.5 A3:.5 B3:1 -:2 ' +
          'E4:1 -:1 G4:1 -:1 A4:.5 G4:.5 F4:1 -:2 ' +
          'D4:1 -:1 C4:1 -:1 B3:2 -:2' },
        { wave: 'triangle', gain: 0.17, seq:
          'E2:2 E2:2 F2:2 F2:2 ' +
          'B2:2 B2:2 C3:2 C3:2 ' +
          'E2:2 E2:2 A2:2 A2:2 ' +
          'D3:2 D3:2 E2:4' },
        { wave: 'noise', gain: 0.045, hat: true, seq:
          '-:2 x:1 -:1 -:2 x:1 -:1 -:2 x:1 -:1 -:2 x:1 -:1 ' +
          '-:2 x:1 -:1 -:2 x:1 -:1 -:2 x:1 -:1 -:2 x:1 -:1' }
      ]
    },
    /* Boss: fast, hammering, no room to breathe. */
    boss: {
      tempo: 172,
      tracks: [
        { wave: 'pulse', duty: 0.5, gain: 0.115, seq:
          'D5:.5 D5:.5 D#5:.5 D5:.5 A4:1 D5:1 ' +
          'C5:.5 C5:.5 C#5:.5 C5:.5 G4:1 C5:1 ' +
          'D5:.5 F5:.5 A5:.5 F5:.5 D5:1 A4:1 ' +
          'A#4:.5 A4:.5 G4:.5 F4:.5 D4:2' },
        { wave: 'pulse', duty: 0.25, gain: 0.06, seq:
          'A4:.5 A4:.5 A#4:.5 A4:.5 F4:1 A4:1 ' +
          'G4:.5 G4:.5 G#4:.5 G4:.5 D#4:1 G4:1 ' +
          'A4:.5 D5:.5 F5:.5 D5:.5 A4:1 F4:1 ' +
          'F4:.5 D#4:.5 D4:.5 C4:.5 A3:2' },
        { wave: 'triangle', gain: 0.18, seq:
          'D2:.5 D2:.5 D2:.5 D2:.5 D2:.5 D2:.5 D2:.5 D2:.5 ' +
          'C2:.5 C2:.5 C2:.5 C2:.5 C2:.5 C2:.5 C2:.5 C2:.5 ' +
          'D2:.5 D2:.5 D2:.5 D2:.5 F2:.5 F2:.5 A2:.5 A2:.5 ' +
          'A#2:.5 A#2:.5 A2:.5 A2:.5 D2:1 D2:1' },
        { wave: 'noise', gain: 0.08, hat: true, seq:
          'x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 ' +
          'x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5 x:.5' }
      ]
    },
    /* The Ashen Lair: slow, wrong, mostly bass. */
    lair: {
      tempo: 96,
      tracks: [
        { wave: 'pulse', duty: 0.125, gain: 0.085, seq:
          'A4:1.5 A#4:.5 A4:1 E4:1 F4:2 E4:2 ' +
          'D4:1.5 D#4:.5 D4:1 A3:1 A#3:2 A3:2' },
        { wave: 'triangle', gain: 0.2, seq:
          'A2:1 A2:1 A#2:1 A2:1 F2:2 E2:2 ' +
          'D2:1 D2:1 D#2:1 D2:1 A#2:2 A2:2' },
        { wave: 'noise', gain: 0.05, hat: true, seq:
          '-:3 x:1 -:3 x:1 -:3 x:1 -:3 x:1' }
      ]
    },
    /* Victory. */
    ending: {
      tempo: 104,
      tracks: [
        { wave: 'pulse', duty: 0.5, gain: 0.13, seq:
          'G4:.5 A4:.5 B4:1 D5:1 B4:1 G5:2 D5:2 ' +
          'E5:1 D5:1 B4:1 D5:1 G5:2 -:2 ' +
          'D5:.5 E5:.5 G5:1 B5:1 G5:1 D6:2 B5:2 ' +
          'A5:1 G5:1 E5:1 D5:1 G5:4' },
        { wave: 'pulse', duty: 0.25, gain: 0.06, seq:
          'B3:.5 C4:.5 D4:1 G4:1 D4:1 B4:2 G4:2 ' +
          'C5:1 B4:1 G4:1 B4:1 D5:2 -:2 ' +
          'G4:.5 B4:.5 D5:1 G5:1 D5:1 B5:2 G5:2 ' +
          'E5:1 D5:1 B4:1 G4:1 B4:4' },
        { wave: 'triangle', gain: 0.17, seq:
          'G2:2 D3:2 E3:2 B2:2 C3:2 G3:2 D3:2 D3:2 ' +
          'G2:2 D3:2 E3:2 B2:2 C3:2 D3:2 G2:4' }
      ]
    }
  };

  var current = null, currentName = null;
  var LOOKAHEAD = 0.35;

  function startSong(name) {
    var song = SONGS[name];
    if (!song) { current = null; currentName = null; return; }
    var spb = 60 / song.tempo;
    var tracks = [];
    for (var i = 0; i < song.tracks.length; i++) {
      var t = song.tracks[i];
      tracks.push({ def: t, seq: parseTrack(t.seq), idx: 0, next: ctx.currentTime + 0.08 });
    }
    current = { song: song, spb: spb, tracks: tracks };
    currentName = name;
  }

  function scheduleNote(tr, spb) {
    var ev = tr.seq[tr.idx];
    var dur = ev.dur * spb;
    var def = tr.def;
    if (ev.name !== '-') {
      if (def.wave === 'noise') {
        noise({ from: 7000, to: 4000, dur: Math.min(0.05, dur * 0.6), gain: def.gain,
                q: 2.5, bus: musicBus, delay: tr.next - ctx.currentTime });
      } else {
        var f = freqOf(ev.name);
        if (f) {
          var t0 = tr.next;
          var osc = ctx.createOscillator();
          var g = ctx.createGain();
          if (def.wave === 'pulse') osc.setPeriodicWave(pulseWave(def.duty || 0.5));
          else osc.type = def.wave;
          osc.frequency.setValueAtTime(f, t0);
          /* Clip each note just short of its slot so repeats re-articulate. */
          var hold = Math.max(0.05, dur * 0.86);
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.linearRampToValueAtTime(def.gain, t0 + 0.012);
          g.gain.setValueAtTime(def.gain, t0 + hold * 0.6);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + hold);
          osc.connect(g); g.connect(musicBus);
          osc.start(t0); osc.stop(t0 + hold + 0.02);
        }
      }
    }
    tr.next += dur;
    tr.idx = (tr.idx + 1) % tr.seq.length;
  }

  /* Called every frame from the main loop. */
  Audio.update = function () {
    if (!Audio.ready || !current || Audio.muted) return;
    var horizon = ctx.currentTime + LOOKAHEAD;
    for (var i = 0; i < current.tracks.length; i++) {
      var tr = current.tracks[i];
      var guard = 0;
      while (tr.next < horizon && guard++ < 64) scheduleNote(tr, current.spb);
    }
  };

  Audio.music = function (name) {
    if (!Audio.ready) { currentName = name; return; }
    if (currentName === name) return;
    startSong(name);
  };

  Audio.stopMusic = function () { current = null; currentName = null; };

  Audio.currentMusic = function () { return currentName; };

  /* Called after init() so a track requested before the first gesture still starts. */
  Audio.restartPending = function () {
    if (Audio.ready && currentName && !current) startSong(currentName);
  };

  Audio.SONGS = SONGS;
  return (AV.Audio = Audio);
})(window.AV = window.AV || {});
