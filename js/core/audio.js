/* ============================================================
   audio.js · 发音与音效
   ------------------------------------------------------------
   发音双通道：
     ① 本地音频包 audio/<id>.wav（tools/build-audio.js 预生成）
        —— 主通道，任何手机/微信内核都能播
     ② 系统语音合成 speechSynthesis
        —— 兜底，必须在用户手势的同一调用栈内同步调用
   两条都不可用时返回 false，由调用方给出孩子能懂的提示。
   ============================================================ */
window.EWG = window.EWG || {};
(function (EWG) {
  "use strict";

  var synth = window.speechSynthesis || null;
  var voice = null;
  var voices = [];
  var ctx = null;

  var ttsState = "unknown";        // unknown | ok | fail
  var lastMode = "none";           // audio | tts | none
  var watchTimer = null;

  var cache = {};                  // id -> HTMLAudioElement
  var missing = {};                // id -> true（文件缺失/播放失败）
  var text2id = null;

  function clampRate(v) {
    var r = Number(v);
    if (!isFinite(r)) r = 0.9;
    return Math.min(1.4, Math.max(0.5, r));
  }

  function rate() {
    var r = EWG.store && EWG.store.data ? EWG.store.data.rate : 0.9;
    return clampRate(r);
  }

  function map() { return EWG.AUDIO_MAP || {}; }

  function buildTextIndex() {
    if (text2id) return text2id;
    text2id = {};
    var bank = EWG.WORD_BANK || [];
    for (var i = 0; i < bank.length; i++) {
      text2id[bank[i].en] = bank[i].id;
      text2id[String(bank[i].en).toLowerCase()] = bank[i].id;
    }
    return text2id;
  }

  function resolveId(t) {
    if (t && typeof t === "object") return t.id || null;
    if (typeof t !== "string") return null;
    var idx = buildTextIndex();
    return idx[t] || idx[t.toLowerCase()] || null;
  }

  function textOf(t) {
    if (t && typeof t === "object") return t.en || "";
    return String(t || "");
  }

  /* ---------------- 本地音频 ---------------- */
  function audioUrl(id) {
    var m = map();
    return (!missing[id] && m[id]) ? m[id] : "";
  }

  function elFor(id) {
    if (cache[id]) return cache[id];
    var el = new Audio();
    el.preload = "auto";
    el.src = audioUrl(id);
    cache[id] = el;
    return el;
  }

  function applyRate(el) {
    var r = rate();
    try { el.playbackRate = r; } catch (e) { /* noop */ }
    // 变速不变调（Chrome/Safari 默认 true，老内核逐个兜底）
    try { el.preservesPitch = true; el.mozPreservesPitch = true; el.webkitPreservesPitch = true; } catch (e) { /* noop */ }
  }

  function playLocal(id, fallbackText) {
    var url = audioUrl(id);
    if (!url) return false;
    var el = elFor(id);

    el.onended = null;
    el.onerror = function () {
      missing[id] = true;
      if (fallbackText) ttsSpeak(fallbackText);
    };

    applyRate(el);
    try { el.currentTime = 0; } catch (e) { /* noop */ }

    var p = null;
    try { p = el.play(); } catch (e) { p = null; }
    if (p && typeof p.catch === "function") {
      p.catch(function (err) {
        var name = err && err.name;
        // 自动播放被拦截（还没点过页面）：文件本身没问题，等用户点喇叭再播
        if (name === "NotAllowedError") return;
        // 其他原因（解码失败 / 文件缺失）：标记缺失并退回系统语音
        missing[id] = true;
        lastMode = "none";
        if (fallbackText) ttsSpeak(fallbackText);
      });
    }
    lastMode = "audio";
    return true;
  }

  function stopLocal() {
    for (var k in cache) {
      if (!Object.prototype.hasOwnProperty.call(cache, k)) continue;
      try { cache[k].pause(); cache[k].currentTime = 0; } catch (e) { /* noop */ }
    }
  }

  /** 预热若干词条的音频，减少第一次点喇叭的等待 */
  function preload(list) {
    var m = map();
    (list || []).forEach(function (w) {
      var id = typeof w === "string" ? w : (w && w.id);
      if (!id || !m[id] || cache[id] || missing[id]) return;
      var el = elFor(id);
      try { el.load(); } catch (e) { /* noop */ }
    });
  }

  /* ---------------- 系统语音 ---------------- */
  function pickVoice() {
    if (!synth) return null;
    try { voices = synth.getVoices() || []; } catch (e) { voices = []; }
    var en = voices.filter(function (v) { return /^en([-_]|$)/i.test(v.lang || ""); });
    if (!en.length) { voice = null; return null; }
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

  var lastPick = 0;
  function pickVoiceIfNeeded() {
    if (voice) return;
    var now = Date.now();
    if (now - lastPick < 800) return;
    lastPick = now;
    pickVoice();
  }

  function setTtsState(s) {
    if (ttsState === s) return;
    ttsState = s;
    if (watchTimer) { clearTimeout(watchTimer); watchTimer = null; }
    if (typeof onStateChange === "function") onStateChange(s);
  }

  var onStateChange = null;

  function ttsSpeak(text) {
    if (!synth || !text) { lastMode = "none"; return false; }
    pickVoiceIfNeeded();
    try { synth.cancel(); } catch (e) { /* noop */ }

    var u = new SpeechSynthesisUtterance(String(text));
    u.lang = (voice && voice.lang) || "en-US";
    if (voice) u.voice = voice;
    u.rate = rate();
    u.pitch = 1.06;
    u.volume = 1;

    u.onstart = function () { setTtsState("ok"); };
    u.onerror = function () { setTtsState("fail"); };

    // 关键：同步调用，不能再包 setTimeout，否则移动端会丢掉用户手势
    try {
      synth.speak(u);
    } catch (e) {
      setTtsState("fail");
      lastMode = "none";
      return false;
    }

    if (watchTimer) clearTimeout(watchTimer);
    watchTimer = setTimeout(function () {
      // 1.2 秒还没开始出声，基本可以判定这台设备读不出来
      if (ttsState !== "ok") setTtsState("fail");
    }, 1200);

    lastMode = "tts";
    return true;
  }

  /* ---------------- 对外接口 ---------------- */
  function speak(target) {
    var id = resolveId(target);
    var text = textOf(target).replace(/\.{3,}/g, " , ").replace(/\bsb\b\.?/gi, "somebody").replace(/\bsth\b\.?/gi, "something");

    if (id && playLocal(id, text)) return true;
    if (ttsState === "fail") { lastMode = "none"; return false; }
    return ttsSpeak(text);
  }

  function stop() {
    stopLocal();
    if (synth) { try { synth.cancel(); } catch (e) { /* noop */ } }
    lastMode = "none";
  }

  /** 现在能不能出声：有本地音频包，或系统语音还没被判定失败 */
  function canSpeak() {
    if (Object.keys(map()).length > 0) return true;
    if (!synth) return false;
    return ttsState !== "fail";
  }

  function hasVoice() { return canSpeak(); }   // 兼容旧调用点

  function hasAudioPack() { return Object.keys(map()).length > 0; }

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

  /** 首次用户手势时调用：解锁 AudioContext，并探测一次系统语音 */
  function unlock() {
    var c = ac();
    if (c && c.state === "suspended") { try { c.resume(); } catch (e) { /* noop */ } }
    if (synth && ttsState === "unknown" && !hasAudioPack()) {
      // 没有音频包时，用一次极短的静音朗读来探测
      try {
        var u = new SpeechSynthesisUtterance(" ");
        u.volume = 0;
        u.onstart = function () { setTtsState("ok"); };
        u.onerror = function () { setTtsState("fail"); };
        synth.speak(u);
      } catch (e) { /* noop */ }
    }
  }

  /* 首次加载时尽力加载语音列表（Chrome 需等 voiceschanged） */
  if (synth) {
    pickVoice();
    if (typeof synth.addEventListener === "function") {
      synth.addEventListener("voiceschanged", pickVoice);
    } else {
      synth.onvoiceschanged = pickVoice;
    }
    setTimeout(pickVoice, 260);
    setTimeout(pickVoice, 1200);
  }

  EWG.audio = {
    speak: speak,
    stop: stop,
    canSpeak: canSpeak,
    hasVoice: hasVoice,
    hasAudioPack: hasAudioPack,
    state: function () { return ttsState; },
    mode: function () { return lastMode; },
    preload: preload,
    sfx: sfx,
    unlock: unlock,
    onStateChange: function (fn) { onStateChange = fn; },
    voiceName: function () { return voice ? voice.name + " (" + voice.lang + ")" : "系统默认"; }
  };
})(window.EWG);
