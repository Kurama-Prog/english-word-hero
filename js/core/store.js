/* ============================================================
   store.js · 本地存档（localStorage + 内存降级）
   ============================================================ */
window.EWG = window.EWG || {};
(function (EWG) {
  "use strict";

  var KEY = "ewg.data.v1";
  var SCHEMA = 1;

  function blank() {
    return {
      schemaVersion: SCHEMA,
      stats: {},      // wordId -> {stars, correct, wrong, streak, lastSeen, nextReview}
      starTotal: 0,   // 累计获得星星
      days: {},       // 'YYYY-MM-DD' -> {q:答题数, c:答对数, sec:学习秒数}
      goal: 20,       // 每日目标题数
      sound: true,
      rate: 0.9,
      bests: {},      // gameId -> {score, acc, at}
      createdAt: Date.now()
    };
  }

  var data = blank();
  var persistent = true;
  var dirty = false;

  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function dayKey(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return;
      var obj = JSON.parse(raw);
      if (!obj || typeof obj !== "object") return;
      var base = blank();
      for (var k in base) {
        if (Object.prototype.hasOwnProperty.call(base, k)) {
          base[k] = (obj[k] === undefined || obj[k] === null) ? base[k] : obj[k];
        }
      }
      if (typeof base.stats !== "object") base.stats = {};
      if (typeof base.days !== "object") base.days = {};
      if (typeof base.bests !== "object") base.bests = {};
      base.schemaVersion = SCHEMA;
      data = base;
    } catch (e) {
      persistent = false;
    }
  }

  function save(force) {
    if (!persistent) { dirty = false; return false; }
    if (!dirty && !force) return true;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
      dirty = false;
      return true;
    } catch (e) {
      persistent = false;
      return false;
    }
  }

  function touch() { dirty = true; }

  /* ---------- 每日数据 ---------- */
  function day(k) {
    k = k || dayKey();
    if (!data.days[k]) data.days[k] = { q: 0, c: 0, sec: 0 };
    return data.days[k];
  }

  function addAnswer(correct) {
    var d = day();
    d.q += 1;
    if (correct) d.c += 1;
    touch();
  }

  function addTime(sec) {
    if (!sec || sec < 0) return;
    day().sec += Math.round(sec);
    touch();
  }

  function addStars(n) {
    if (!n) return;
    data.starTotal += n;
    if (data.starTotal < 0) data.starTotal = 0;
    touch();
  }

  /* ---------- 连续打卡 ---------- */
  function streak() {
    var count = 0;
    var d = new Date();
    var key = dayKey(d);
    if (!(data.days[key] && data.days[key].q > 0)) {
      d.setDate(d.getDate() - 1);
      key = dayKey(d);
      if (!(data.days[key] && data.days[key].q > 0)) return 0;
    }
    while (data.days[dayKey(d)] && data.days[dayKey(d)].q > 0) {
      count++;
      d.setDate(d.getDate() - 1);
      if (count > 400) break;
    }
    return count;
  }

  var WEEK_LABEL = ["日", "一", "二", "三", "四", "五", "六"];

  function week() {
    var out = [];
    for (var i = 6; i >= 0; i--) {
      var d = new Date();
      d.setDate(d.getDate() - i);
      var k = dayKey(d);
      var rec = data.days[k] || { q: 0, c: 0, sec: 0 };
      out.push({
        key: k,
        label: i === 0 ? "今天" : "周" + WEEK_LABEL[d.getDay()],
        q: rec.q || 0,
        sec: rec.sec || 0,
        isToday: i === 0
      });
    }
    return out;
  }

  function reset() {
    data = blank();
    touch();
    save(true);
  }

  EWG.store = {
    load: load,
    save: save,
    touch: touch,
    dayKey: dayKey,
    today: function () { return day(); },
    addAnswer: addAnswer,
    addTime: addTime,
    addStars: addStars,
    streak: streak,
    week: week,
    reset: reset,
    isPersistent: function () { return persistent; },
    get data() { return data; }
  };
})(window.EWG);
