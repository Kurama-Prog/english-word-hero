/* ============================================================
   pages/play.js · 关卡外壳（出题、计分、反馈、结算）
   ============================================================ */
window.EWG = window.EWG || {};
EWG.pages = EWG.pages || {};
(function (EWG) {
  "use strict";

  var PRAISE = ["太棒啦！", "真厉害！", "就是这个！", "记得真牢！", "漂亮！", "答对啦！"];
  var COMFORT = ["再想一想～", "没关系，记住它就好", "差一点点～", "这个容易记混，多看一眼"];

  var live = null;   // 当前局状态

  function pickWrong(w) {
    if (live.wrong.indexOf(w) < 0) live.wrong.push(w);
  }

  function updateCombo() {
    var badge = document.getElementById("comboBadge");
    if (!badge) return;
    if (live.combo >= 2) {
      badge.classList.add("on");
      badge.textContent = "🔥 " + live.combo + " 连击";
      if (live.combo >= 5) badge.classList.add("hot");
      badge.classList.remove("pop");
      void badge.offsetWidth;
      badge.classList.add("pop");
    } else {
      badge.classList.remove("on", "hot");
    }
  }

  function setFeedback(html, kind) {
    var el = document.getElementById("feedback");
    if (!el) return;
    el.className = "feedback " + kind;
    el.innerHTML = html;
  }

  function restartRound(gameId) {
    var route = EWG.router.parse();
    var keep = {};
    if (route.params.ids) keep.ids = route.params.ids;
    if (route.params.unit) keep.unit = route.params.unit;
    if (route.params.theme) keep.theme = route.params.theme;
    if (route.params.mode) keep.mode = route.params.mode;
    if (route.params.n) keep.n = route.params.n;
    var qs = Object.keys(keep).map(function (k) { return k + "=" + encodeURIComponent(keep[k]); }).join("&");
    EWG.router.go("#/play/" + gameId + (qs ? "?" + qs : ""));
  }

  function showResult() {
    var L = live;
    var total = L.correct + L.wrongCount;
    var acc = total ? Math.round((L.correct / total) * 100) : 0;
    var secs = L.watch ? L.watch.stop() : 0;
    if (L.watch) L.watch = null;
    EWG.store.addTime(secs);

    var score = L.correct * 10 + L.maxCombo * 2;
    var isBest = EWG.progress.setBest(L.game.id, score, acc);
    EWG.store.save();

    var starCount = acc >= 90 ? 3 : acc >= 70 ? 2 : 1;
    var starsRow = "";
    for (var i = 1; i <= 3; i++) {
      starsRow += `<span class="rs ${i <= starCount ? "on" : ""}" style="transition-delay:${i * 0.12}s">★</span>`;
    }

    var idx = EWG.GAMES.indexOf(L.game);
    var next = EWG.GAMES[(idx + 1) % EWG.GAMES.length] || L.game;

    var wrongHtml = "";
    if (L.wrong.length) {
      var qs = L.wrong.map(function (w) { return w.id; }).join(",");
      wrongHtml = `
        <div class="result-wrong">
          <h4>这几个再熟悉一下 💪</h4>
          <ul>
            ${L.wrong.map(function (w) {
              return `<li>${EWG.ui.esc(w.en)} <span class="rc">${EWG.ui.esc(w.cn)}</span>
                ${EWG.ui.speakBtn(w.en)}</li>`;
            }).join("")}
          </ul>
        </div>
        <button class="btn btn-block btn-green" type="button"
          data-go="#/play/${L.game.id}?ids=${qs}&n=${Math.min(8, L.wrong.length)}"
          style="margin-bottom:14px">🎯 马上再练这 ${L.wrong.length} 个词</button>`;
    }

    EWG.ui.modal(`
      <div class="result-card" data-lock>
        <div style="font-size:44px;line-height:1">${acc >= 90 ? "🏆" : acc >= 70 ? "🎉" : "🌱"}</div>
        <div class="result-title">${acc >= 90 ? "太厉害啦，通关！" : acc >= 70 ? "通关啦！" : "完成啦，继续加油！"}</div>
        <div class="result-star-row">${starsRow}</div>
        <div class="result-sub">
          这一关答对 <b style="color:var(--orange-deep)">${L.correct}</b> 题，
          收获 <b style="color:var(--orange-deep)">${L.gained}</b> 颗星星
          ${isBest ? " · 🎖️ 新纪录！" : ""}
        </div>

        <div class="result-badges">
          <div class="rbadge"><div class="rb-ico">🎯</div><b>${acc}%</b><small>正确率</small></div>
          <div class="rbadge"><div class="rb-ico">🔥</div><b>${L.maxCombo}</b><small>最高连击</small></div>
          <div class="rbadge"><div class="rb-ico">⏱️</div><b>${secs}s</b><small>用时</small></div>
        </div>

        ${wrongHtml}

        <button class="result-next" type="button" data-go="#/play/${next.id}${L.keepQs}">
          <span class="rn-ico">${next.icon}</span>
          <span>
            <b>下一关 · ${next.name}</b>
            <span>${next.desc}</span>
          </span>
          <span class="rn-go">→</span>
        </button>

        <div class="result-actions">
          <button class="btn btn-ghost" type="button" data-go="#/home">回首页</button>
          <button class="btn" type="button" id="resultAgain">再来一关</button>
        </div>
      </div>
    `);

    var again = document.getElementById("resultAgain");
    if (again) again.addEventListener("click", function () {
      EWG.ui.closeModal();
      restartRound(L.game.id);
    });

    if (acc >= 70) { EWG.ui.confetti(46); EWG.audio.sfx("win"); }
    else EWG.audio.sfx("correct");

    if (L.game.pair && L.game.pair === true) { /* 无额外处理 */ }
  }

  function endRound() {
    if (!live || live.ended) return;
    live.ended = true;
    if (live.instance && live.instance.destroy) {
      try { live.instance.destroy(); } catch (e) { /* noop */ }
      live.instance = null;
    }
    EWG.store.save();
    showResult();
  }

  EWG.pages.play = {
    render: function (view, route) {
      var gameId = route.sub || "quiz-meaning";
      var game = EWG.games[gameId] || EWG.games["quiz-meaning"];
      var params = route.params || {};

      /* ---- 组词池 ---- */
      var pool;
      if (params.ids) {
        pool = EWG.progress.byIds(params.ids.split(",").filter(Boolean));
      } else {
        pool = EWG.progress.pool({
          unit: params.unit,
          theme: params.theme,
          mode: params.mode
        });
      }
      if (!pool.length) pool = EWG.WORD_BANK.slice();

      if (gameId === "spelling") {
        var spellPool = pool.filter(function (w) { return w.spellable; });
        if (spellPool.length >= 3) pool = spellPool;
      }

      var want = parseInt(params.n, 10);
      if (!want || want < 1) {
        want = gameId === "memory" ? 6 : 8;
      }
      var needPairs = gameId === "match" ? 8 : 6;
      if (gameId === "match" || gameId === "memory") {
        want = Math.max(3, Math.min(needPairs, pool.length));
      }
      want = Math.min(want, pool.length);

      var items = EWG.progress.pick(pool, want);
      if (!items.length) {
        view.innerHTML = `<div class="card center"><div class="empty"><span class="ico">🗂️</span>
          还没有可以练习的单词，先去单词本看看吧～</div></div>`;
        return;
      }

      var keepQs = "";
      var keepKeys = ["unit", "theme", "mode", "n"];
      var kk = keepKeys.filter(function (k) { return params[k]; }).map(function (k) {
        return k + "=" + encodeURIComponent(params[k]);
      });
      if (params.ids) kk.push("ids=" + encodeURIComponent(params.ids));
      if (kk.length) keepQs = "?" + kk.join("&");

      live = {
        game: game,
        items: items,
        correct: 0,
        wrongCount: 0,
        wrong: [],
        combo: 0,
        maxCombo: 0,
        gained: 0,
        answered: 0,
        total: items.length,
        watch: EWG.kit.stopwatch(),
        instance: null,
        ended: false,
        keepQs: keepQs
      };

      view.innerHTML = `
        <div class="play-wrap">
          <div class="play-head fade-up">
            <span class="ph-ico" style="--accent-soft:${game.soft}">${game.icon}</span>
            <div class="ph-mid">
              <div class="row-between">
                <div>
                  <div class="ph-title">${game.name}</div>
                  <div class="ph-sub">${game.desc}</div>
                </div>
                <span class="combo-badge" id="comboBadge">🔥 2 连击</span>
              </div>
              <div class="play-progress" id="playBar"><i></i></div>
            </div>
            <span class="q-count" id="qCount">1/${items.length}</span>
            <button class="icon-btn" type="button" id="quitBtn" title="退出关卡（Esc）">✕</button>
          </div>

          <div class="stage" id="stage"></div>
          <div class="feedback idle" id="feedback">准备好了吗？开始吧！</div>
        </div>`;

      var stage = document.getElementById("stage");
      var bar = document.getElementById("playBar");
      var qCount = document.getElementById("qCount");

      var quit = document.getElementById("quitBtn");
      quit.addEventListener("click", function () {
        EWG.store.save();
        EWG.router.go("#/home");
      });

      var ctx = {
        container: stage,
        items: items,

        setProgress: function (done, total, text) {
          total = total || live.total;
          var pct = total ? Math.min(100, (done / total) * 100) : 0;
          if (bar) bar.querySelector("i").style.width = pct + "%";
          if (qCount) qCount.textContent = text || (Math.min(done + 1, total) + "/" + total);
        },

        clearFeedback: function (text) {
          setFeedback(text || "想好了就点答案吧～", "idle");
        },

        onAnswer: function (word, ok, el, scope, customBad) {
          live.answered++;
          if (ok) {
            live.correct++;
            live.combo++;
            live.gained++;
            if (live.combo > live.maxCombo) live.maxCombo = live.combo;
            EWG.store.addStars(1);
            EWG.progress.recordAnswer(word.id, true);
            EWG.audio.sfx(live.combo >= 3 ? "combo" : "correct");
            if (el) EWG.ui.burstAt(el, 10);
            setFeedback(`<span>${PRAISE[Math.floor(Math.random() * PRAISE.length)]}</span>
              <b>+1 ⭐</b>`, "good");
          } else {
            live.wrongCount++;
            live.combo = 0;
            EWG.progress.recordAnswer(word.id, false);
            pickWrong(word);
            EWG.audio.sfx("wrong");
            if (bar) {
              bar.classList.remove("flash");
              void bar.offsetWidth;
              bar.classList.add("flash");
            }
            if (scope) EWG.ui.shake(scope);
            var tip = customBad || COMFORT[Math.floor(Math.random() * COMFORT.length)];
            setFeedback(`<span>${tip}</span>
              <b>${EWG.ui.esc(word.en)} = ${EWG.ui.esc(word.cn)}</b>`, "bad");
          }
          EWG.store.addAnswer(ok);
          updateCombo();
          EWG.ui.refreshTopbar();
          EWG.store.save();
        },

        finish: function () { endRound(); }
      };

      try {
        live.instance = game.create(ctx);
      } catch (err) {
        if (window.console) console.error("[game]", err);
        stage.innerHTML = `<div class="stage-empty"><div style="font-size:40px">🛠️</div>
          <div>这一关出了点小问题，换一关试试吧～</div>
          <button class="btn" type="button" data-go="#/home">回首页</button></div>`;
      }
    },

    destroy: function () {
      if (live && live.instance && live.instance.destroy) {
        try { live.instance.destroy(); } catch (e) { /* noop */ }
      }
      if (live && live.watch) {
        var s = live.watch.stop();
        if (s > 0) EWG.store.addTime(s);
      }
      EWG.ui.closeModal();
      EWG.store.save();
      live = null;
    }
  };
})(window.EWG);
