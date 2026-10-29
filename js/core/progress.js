/* ============================================================
   progress.js · 熟练度引擎（星级 + 间隔复习 + 加权抽题）
   越不熟、越久没练、越常错的词，出现得越频繁。
   ============================================================ */
window.EWG = window.EWG || {};
(function (EWG) {
  "use strict";

  var DAY = 24 * 60 * 60 * 1000;
  var REVIEW_GAP = [0, 1, 2, 4, 7, 15];  // 按星级取复习间隔（天）
  var MASTER_STARS = 4;                   // 4 星及以上算「已掌握」

  function rec(id) {
    var s = EWG.store.data.stats;
    if (!s[id]) {
      s[id] = { stars: 0, correct: 0, wrong: 0, streak: 0, lastSeen: 0, nextReview: 0 };
    }
    var r = s[id];
    if (typeof r.stars !== "number") r.stars = 0;
    if (typeof r.correct !== "number") r.correct = 0;
    if (typeof r.wrong !== "number") r.wrong = 0;
    if (typeof r.streak !== "number") r.streak = 0;
    return r;
  }

  function starsOf(id) { return rec(id).stars; }

  function attempts(id) { var r = rec(id); return r.correct + r.wrong; }

  function isDue(id) {
    var r = rec(id);
    return r.nextReview > 0 && Date.now() >= r.nextReview;
  }

  function recordAnswer(id, correct) {
    var r = rec(id);
    var before = r.stars;
    if (correct) {
      r.correct += 1;
      r.streak += 1;
      r.stars = Math.min(5, r.stars + 1);
    } else {
      r.wrong += 1;
      r.streak = 0;
      r.stars = Math.max(0, r.stars - 1);
    }
    r.lastSeen = Date.now();
    var gap = REVIEW_GAP[r.stars] === undefined ? 1 : REVIEW_GAP[r.stars];
    r.nextReview = r.lastSeen + gap * DAY;
    EWG.store.touch();
    return { stars: r.stars, before: before, delta: r.stars - before };
  }

  /* ---------------- 抽题权重 ---------------- */
  function weightOf(w) {
    var r = rec(w.id);
    var weight = 1 + (5 - r.stars) * 1.6;              // 0 星最重，5 星最轻
    if (r.wrong > 0) weight += Math.min(6, r.wrong * 1.2) * (r.stars <= 2 ? 1 : 0.4);
    if (isDue(w.id)) weight += 3;
    if (r.correct + r.wrong === 0) weight += 2;         // 没碰过的也要照顾到
    if (r.streak >= 3) weight *= 0.55;                  // 连对多次，暂时降温
    return Math.max(0.6, weight);
  }

  /**
   * 加权不放回抽样（Efraimidis-Spirakis）
   * @param {Array} pool 候选词
   * @param {Number} n 需要的数量
   */
  function pick(pool, n) {
    var list = pool.slice();
    n = Math.min(n || 8, list.length);
    var scored = list.map(function (w) {
      var wgt = weightOf(w);
      return { w: w, k: Math.pow(Math.random(), 1 / wgt) };
    });
    scored.sort(function (a, b) { return b.k - a.k; });
    return scored.slice(0, n).map(function (o) { return o.w; });
  }

  /* ---------------- 组池 ---------------- */
  /**
   * @param {Object} opt {unit, theme, ids, mode}
   *   mode: all | new | weak | due | wrong
   */
  function pool(opt) {
    opt = opt || {};
    var bank = EWG.WORD_BANK;
    var list = bank.filter(function (w) {
      if (opt.unit && Number(opt.unit) !== w.unit) return false;
      if (opt.theme && opt.theme !== w.theme) return false;
      if (opt.spellable && !w.spellable) return false;
      if (opt.ids && opt.ids.length) return opt.ids.indexOf(w.id) > -1;
      return true;
    });

    var mode = opt.mode || "all";
    if (mode === "new") {
      list = list.filter(function (w) { return attempts(w.id) === 0; });
    } else if (mode === "weak" || mode === "wrong") {
      list = list.filter(function (w) { return rec(w.id).wrong > 0 && rec(w.id).stars <= 3; });
    } else if (mode === "due") {
      list = list.filter(function (w) { return isDue(w.id); });
    }
    return list;
  }

  /** 按 id 列表取词（保持顺序） */
  function byIds(ids) {
    return (ids || []).map(function (id) { return EWG.WORD_BY_ID[id]; }).filter(Boolean);
  }

  /* ---------------- 统计 ---------------- */
  function summary() {
    var bank = EWG.WORD_BANK;
    var total = bank.length;
    var mastered = 0, learning = 0, untouched = 0;
    var byUnit = EWG.UNITS.map(function (u) {
      return { unit: u.id, name: u.name, title: u.title, theme: u.theme, total: 0, mastered: 0, learning: 0, untouched: 0 };
    });

    bank.forEach(function (w) {
      var r = rec(w.id);
      var st = (r.correct + r.wrong === 0) ? "untouched" : (r.stars >= MASTER_STARS ? "mastered" : "learning");
      if (st === "mastered") mastered++;
      else if (st === "learning") learning++;
      else untouched++;

      var u = byUnit[w.unit - 1];
      if (u) {
        u.total++;
        u[st]++;
      }
    });

    return {
      total: total,
      mastered: mastered,
      learning: learning,
      untouched: untouched,
      percent: total ? Math.round((mastered / total) * 100) : 0,
      byUnit: byUnit
    };
  }

  /** 错词本：答错过的词，按「错得多 + 星级低」排序 */
  function wrongWords(limit) {
    var list = EWG.WORD_BANK.filter(function (w) { return rec(w.id).wrong > 0; });
    list.sort(function (a, b) {
      var ra = rec(a.id), rb = rec(b.id);
      if (rb.wrong !== ra.wrong) return rb.wrong - ra.wrong;
      if (ra.stars !== rb.stars) return ra.stars - rb.stars;
      return rb.lastSeen - ra.lastSeen;
    });
    return limit ? list.slice(0, limit) : list;
  }

  /** 待复习（到期的词） */
  function dueWords(limit) {
    var list = EWG.WORD_BANK.filter(function (w) { return isDue(w.id); });
    list.sort(function (a, b) { return rec(a.id).nextReview - rec(b.id).nextReview; });
    return limit ? list.slice(0, limit) : list;
  }

  function bestOf(gameId) { return EWG.store.data.bests[gameId] || null; }

  function setBest(gameId, score, acc) {
    var b = EWG.store.data.bests[gameId];
    if (!b || score > b.score) {
      EWG.store.data.bests[gameId] = { score: score, acc: acc || 0, at: Date.now() };
      EWG.store.touch();
      return true;
    }
    return false;
  }

  EWG.progress = {
    rec: rec,
    starsOf: starsOf,
    attempts: attempts,
    isDue: isDue,
    recordAnswer: recordAnswer,
    weightOf: weightOf,
    pick: pick,
    pool: pool,
    byIds: byIds,
    summary: summary,
    wrongWords: wrongWords,
    dueWords: dueWords,
    bestOf: bestOf,
    setBest: setBest,
    MASTER_STARS: MASTER_STARS
  };
})(window.EWG);
