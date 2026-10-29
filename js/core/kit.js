/* ============================================================
   kit.js · 游戏公共小工具（洗牌、干扰项、键盘、计时）
   ============================================================ */
window.EWG = window.EWG || {};
(function (EWG) {
  "use strict";

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function sample(arr, n) { return shuffle(arr).slice(0, n); }

  /**
   * 生成干扰项：优先同单元、同类型，且字段值互不重复
   * @param {Object} word 正确答案词条
   * @param {String} field 'cn' | 'en'
   * @param {Number} n 需要的干扰项数量
   * @param {Array} exclude 额外排除的词（例如同一局已出现的正确答案）
   */
  function distractors(word, field, n, exclude) {
    var bank = EWG.WORD_BANK;
    var skip = {};
    skip[word.id] = 1;
    skip[word[field]] = 1;
    (exclude || []).forEach(function (w) { skip[w.id] = 1; skip[w[field]] = 1; });

    var pool = bank.filter(function (w) { return !skip[w.id] && !skip[w[field]]; });
    var near = shuffle(pool.filter(function (w) {
      return w.unit === word.unit && w.kind === word.kind;
    }));
    var mid = shuffle(pool.filter(function (w) {
      return (w.unit === word.unit || w.kind === word.kind) && near.indexOf(w) < 0;
    }));
    var far = shuffle(pool.filter(function (w) {
      return near.indexOf(w) < 0 && mid.indexOf(w) < 0;
    }));

    var out = [], used = {};
    used[word[field]] = 1;
    near.concat(mid, far).forEach(function (w) {
      if (out.length >= n) return;
      if (used[w[field]]) return;
      used[w[field]] = 1;
      out.push(w);
    });
    return out;
  }

  /** 组合成选项数组：{word, text, right} */
  function options(word, field, n) {
    var ds = distractors(word, field, (n || 4) - 1);
    var list = ds.map(function (w) { return { word: w, text: w[field], right: false }; });
    list.push({ word: word, text: word[field], right: true });
    return shuffle(list);
  }

  /** 键盘监听，返回解绑函数 */
  function onKey(handler) {
    var fn = function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      handler(e);
    };
    document.addEventListener("keydown", fn);
    return function () { document.removeEventListener("keydown", fn); };
  }

  /** 简单节流的时间累计器（秒），页面隐藏时暂停 */
  function stopwatch() {
    var started = Date.now();
    var acc = 0;
    var running = true;
    function onVis() {
      if (document.hidden) { if (running) { acc += (Date.now() - started) / 1000; running = false; } }
      else if (!running) { started = Date.now(); running = true; }
    }
    document.addEventListener("visibilitychange", onVis);
    return {
      stop: function () {
        if (running) { acc += (Date.now() - started) / 1000; running = false; }
        document.removeEventListener("visibilitychange", onVis);
        return Math.round(acc);
      },
      peek: function () {
        return Math.round(acc + (running ? (Date.now() - started) / 1000 : 0));
      }
    };
  }

  /** 一次性定时器集合，便于统一清理 */
  function timers() {
    var list = [];
    return {
      set: function (fn, ms) {
        var id = setTimeout(function () {
          var i = list.indexOf(id);
          if (i > -1) list.splice(i, 1);
          fn();
        }, ms);
        list.push(id);
        return id;
      },
      clearAll: function () {
        list.forEach(function (id) { clearTimeout(id); });
        list = [];
      }
    };
  }

  EWG.kit = {
    shuffle: shuffle,
    sample: sample,
    distractors: distractors,
    options: options,
    onKey: onKey,
    stopwatch: stopwatch,
    timers: timers
  };
})(window.EWG);
