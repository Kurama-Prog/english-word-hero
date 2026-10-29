/* ============================================================
   游戏 5 · 打地鼠抢答（限时敲中正确答案）
   ============================================================ */
window.EWG = window.EWG || {};
(function (EWG) {
  "use strict";
  EWG.GAMES = EWG.GAMES || [];
  EWG.games = EWG.games || {};

  var HOLES = 9;
  var PER_Q = 9000;
  var MOJI = ["🐹", "🐭", "🦔", "🐿️", "🐰", "🐻"];

  var def = {
    id: "whack",
    name: "打地鼠抢答",
    icon: "🔨",
    color: "#FFB020",
    soft: "#FFF3DC",
    desc: "9 秒内敲中举着正确答案的小地鼠",
    needsSpeech: false,

    create: function (ctx) {
      var items = ctx.items.slice(0, 8);
      var idx = 0;
      var settled = false;
      var tick = null;
      var timer = EWG.kit.timers();
      var unbind = null;

      var root = document.createElement("div");
      root.style.display = "flex";
      root.style.flexDirection = "column";
      root.style.flex = "1";
      ctx.container.appendChild(root);

      function render() {
        if (idx >= items.length) { ctx.finish(); return; }
        settled = false;
        var w = items[idx];
        // 交替题型：英文找中文 / 中文找英文
        var askCn = idx % 2 === 0;
        var field = askCn ? "cn" : "en";
        var opts = EWG.kit.options(w, field, 4);

        var holeIdx = EWG.kit.sample([0, 1, 2, 3, 4, 5, 6, 7, 8], 4);
        var holes = [];
        for (var h = 0; h < HOLES; h++) {
          holes.push(`<div class="hole empty" data-h="${h}"></div>`);
        }

        root.innerHTML = `
          <div class="whack-prompt">
            <div class="wp-label">${askCn ? "敲中「" + EWG.ui.esc(w.en) + "」的意思" : "敲中这个中文的英文"}</div>
            <div class="wp-word ${askCn ? "" : "sm"}">${askCn ? EWG.ui.esc(w.en) : EWG.ui.esc(w.cn)}</div>
            <div class="q-hint">${askCn ? "哪只地鼠举着正确的中文？" : "哪只地鼠举着正确的英文？" }</div>
          </div>
          <div class="timer-bar" id="timerBar"><i id="timerFill"></i></div>
          <div class="holes" id="holes">${holes.join("")}</div>`;

        var holeEls = root.querySelectorAll(".hole");
        opts.forEach(function (o, i) {
          var hole = holeEls[holeIdx[i]];
          if (!hole) return;
          hole.classList.remove("empty");
          var moji = MOJI[Math.floor(Math.random() * MOJI.length)];
          hole.innerHTML = `<button class="mole" type="button" data-ok="${o.right ? 1 : 0}"
              style="animation-delay:${i * 60}ms">
              <span class="moji">${moji}</span>
              <span class="mtext">${EWG.ui.esc(o.text)}</span>
            </button>`;
        });

        ctx.setProgress(idx, items.length);
        ctx.clearFeedback("9 秒内敲中举着正确答案的小地鼠！");
        startTimer(w);

        root.querySelector("#holes").addEventListener("click", function (e) {
          var mole = e.target.closest(".mole");
          if (!mole || settled) return;
          var ok = mole.getAttribute("data-ok") === "1";
          hit(mole, ok, w);
        });
      }

      function startTimer(w) {
        stopTimer();
        var fill = document.getElementById("timerFill");
        var bar = document.getElementById("timerBar");
        var startedAt = Date.now();
        tick = setInterval(function () {
          var left = PER_Q - (Date.now() - startedAt);
          var pct = Math.max(0, (left / PER_Q) * 100);
          if (fill) fill.style.width = pct + "%";
          if (bar) bar.classList.toggle("warn", pct < 35);
          if (left <= 0) {
            stopTimer();
            if (!settled) timeUp(w);
          }
        }, 110);
      }

      function stopTimer() {
        if (tick) { clearInterval(tick); tick = null; }
      }

      function hit(mole, ok, w) {
        settled = true;
        stopTimer();
        var moles = root.querySelectorAll(".mole");
        for (var i = 0; i < moles.length; i++) moles[i].style.pointerEvents = "none";

        if (ok) {
          mole.classList.add("hit");
          ctx.onAnswer(w, true, mole, null, null);
          timer.set(next, 720);
        } else {
          mole.classList.add("bad");
          timer.set(function () { mole.classList.add("gone"); }, 380);
          revealCorrect();
          ctx.onAnswer(w, false, null, null, "哎呀，敲错啦～记住它的意思是「" + w.cn + "」");
          timer.set(next, 1700);
        }
      }

      function timeUp(w) {
        settled = true;
        revealCorrect();
        ctx.onAnswer(w, false, null, null, "时间到啦，再快一点点～");
        timer.set(next, 1700);
      }

      function revealCorrect() {
        var moles = root.querySelectorAll(".mole");
        for (var i = 0; i < moles.length; i++) {
          if (moles[i].getAttribute("data-ok") === "1") moles[i].classList.add("reveal");
        }
      }

      function next() {
        idx++;
        render();
      }

      render();

      return {
        destroy: function () {
          stopTimer();
          timer.clearAll();
          if (unbind) unbind();
        }
      };
    }
  };

  EWG.games[def.id] = def;
  EWG.GAMES.push(def);
})(window.EWG);
