/* ============================================================
   audio.js · 发音（系统语音合成）与音效（WebAudio 实时合成）
   不依赖任何音频文件，完全离线可用。
   ============================================================ */
window.EWG = window.EWG || {};
(function (EWG) {
  "use strict";

  var synth = window.speechSynthesis || null;
  var voice = null;
  var voices = [];
  var ctx = null;

  function pickVoice() {
    if (!synth) return null;
    try { voices = synth.getVoices() || []; } catch (e) { voices = []; }
    var en = voices.filter(function (v) { return /^en([-_]|$)/i.test(v.lang || ""); });
    if (!en.length) { voice = null; return null; }
    // 优先美音，其次英音，再其次任意英文
    var prefer = [
      function (v) { return /en[-_]US/i.test(v.lang) && /female|samantha|zira|aria|jenny/i.test(v.name); },
      function (v) { return /en[-_]US/i.test(v.lang); },
      function (v) { return /en[-_]GB/i.test(v.lang) && /female|hazel|susan/i.test(v.name); },
      function (v) { return /en[-_]GB/i.test(v.lang); },
      function (v) { return true; }
    ];
    for (var i = 0; i < prefer.length; i++) {
      var found = en.filter(prefer[i])[0];
      if (found) { voice = found; return voice; }
    }
    voice = en[0];
    return voice;
  }

  if (synth) {
    pickVoice();
    // Chrome 需要等 voiceschanged，首次可能为空
    if (typeof synth.addEventListener === "function") {
      synth.addEventListener("voiceschanged", pickVoice);
    } else {
      synth.onvoiceschanged = pickVoice;
    }
    // 部分浏览器需要先“空读”一次才会加载语音
    setTimeout(pickVoice, 260);
    setTimeout(pickVoice, 1200);
  }

  function rate() {
    var r = EWG.store ? EWG.store.data.rate : 0.9;
    return Math.min(1.4, Math.max(0.5, Number(r) || 0.9));
  }

  function speak(text) {
    if (!synth || !text) return false;
    pickVoiceIfNeeded();
    try { synth.cancel(); } catch (e) { /* noop */ }
    try {
      var u = new SpeechSynthesisUtterance(String(text));
      u.lang = (voice && voice.lang) || "en-US";
      if (voice) u.voice = voice;
      u.rate = rate();
      u.pitch = 1.06;
      u.volume = 1;
      // Chrome 偶发首次不发音，稍作延迟更稳
      setTimeout(function () {
        try { synth.speak(u); } catch (e) { /* noop */ }
      }, 30);
      return true;
    } catch (e) {
      return false;
    }
  }

  var lastPick = 0;
  function pickVoiceIfNeeded() {
    if (voice) return;
    var now = Date.now();
    if (now - lastPick < 800) return;
    lastPick = now;
    pickVoice();
  }

  function hasVoice() {
    pickVoiceIfNeeded();
    return !!(voice || (voices && voices.length));
  }

  function stop() {
    if (!synth) return;
    try { synth.cancel(); } catch (e) { /* noop */ }
  }

  /* ---------------- 音效 ---------------- */
  function ac() {
    if (ctx) {
      if (ctx.state === "suspended") { try { ctx.resume(); } catch (e) { /* noop */ } }
      return ctx;
    }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { return null; }
    if (ctx.state === "suspended") { try { ctx.resume(); } catch (e) { /* noop */ } }
    return ctx;
  }

  function enabled() {
    return !(EWG.store && EWG.store.data && EWG.store.data.sound === false);
  }

  function tone(freq, at, dur, type, peak) {
    var c = ac();
    if (!c) return;
    var t0 = c.currentTime + at;
    var osc = c.createOscillator();
    var g = c.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak || 0.16, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  var SFX = {
    correct: function () { tone(784, 0, 0.12, "sine", 0.14); tone(1046, 0.07, 0.16, "sine", 0.12); },
    wrong: function () { tone(220, 0, 0.16, "triangle", 0.12); tone(175, 0.1, 0.2, "triangle", 0.1); },
    combo: function () { tone(1046, 0, 0.09, "sine", 0.1); tone(1318, 0.06, 0.12, "sine", 0.09); },
    pick: function () { tone(523, 0, 0.06, "sine", 0.07); },
    win: function () {
      var notes = [523, 659, 784, 1046];
      for (var i = 0; i < notes.length; i++) tone(notes[i], i * 0.11, 0.24, "sine", 0.13);
    },
    tick: function () { tone(880, 0, 0.05, "square", 0.05); }
  };

  function sfx(name) {
    if (!enabled()) return;
    var fn = SFX[name];
    if (fn) { try { fn(); } catch (e) { /* noop */ } }
  }

  function unlock() {
    var c = ac();
    if (c && c.state === "suspended") { try { c.resume(); } catch (e) { /* noop */ } }
  }

  EWG.audio = {
    speak: speak,
    stop: stop,
    hasVoice: hasVoice,
    sfx: sfx,
    unlock: unlock,
    voiceName: function () { return voice ? voice.name + " (" + voice.lang + ")" : "系统默认"; }
  };
})(window.EWG);
