/* ============================================================
   游戏 1 · 看词选义
   ============================================================ */
window.EWG = window.EWG || {};
(function (EWG) {
  "use strict";
  EWG.GAMES = EWG.GAMES || [];
  EWG.games = EWG.games || {};

  var def = {
    id: "quiz-meaning",
    name: "看词选义",
    icon: "🔍",
    color: "#4CC9F0",
    soft: "#E8F6FF",
    desc: "看英文单词，四选一挑出正确的中文意思",
    needsSpeech: false,

    create: function (ctx) {
      var items = ctx.items.slice();
      var idx = 0;
      var locked = false;
      var timer = EWG.kit.timers();
      var unbind = null;
      var root = document.createElement("div");
      root.style.display = "flex";
      root.style.flexDirection = "column";
      root.style.flex = "1";
      ctx.container.appendChild(root);

      function render() {
        if (idx >= items.length) { ctx.finish(); return; }
        locked = false;
        var w = items[idx];
        var opts = EWG.kit.options(w, "cn", 4);

        root.innerHTML = `
          <div class="q-center">
            <div class="q-prompt-label">这个词是什么意思？</div>
            <div class="q-word ${w.en.length > 12 ? "sm" : ""}">${EWG.ui.esc(w.en)}
              <span class="pos">${EWG.ui.esc(w.pos)}</span>
            </div>
            <div class="q-hint">${EWG.ui.esc(w.unitName)} · ${EWG.ui.esc(w.themeName)}</div>
            <div style="margin-top:14px">${EWG.ui.speakBtn(w.en)}</div>
          </div>
          <div class="options" id="qOptions">
            ${opts.map(function (o, i) {
              return `<button class="opt" type="button" data-i="${i}">
                <span class="key">${i + 1}</span>
                <span class="grow">${EWG.ui.esc(o.text)}</span>
                <span class="mark"></span>
              </button>`;
            }).join("")}
          </div>`;
        ctx.setProgress(idx, items.length);
        ctx.clearFeedback("选一个你觉得对的意思吧～");

        var btns = root.querySelectorAll(".opt");
        for (var i = 0; i < btns.length; i++) {
          (function (btn, i) {
            btn.addEventListener("click", function () { choose(i, opts, btns); });
          })(btns[i], i);
        }

        if (unbind) unbind();
        unbind = EWG.kit.onKey(function (e) {
          var n = parseInt(e.key, 10);
          if (n >= 1 && n <= btns.length && !locked) choose(n - 1, opts, btns);
          if (e.key === "Enter" && locked) { timer.clearAll(); next(); }
        });
      }

      function choose(i, opts, btns) {
        if (locked) return;
        locked = true;
        var w = items[idx];
        var correct = opts[i].right;

        for (var k = 0; k < btns.length; k++) {
          btns[k].disabled = true;
          if (opts[k].right) {
            btns[k].classList.add("correct");
            btns[k].querySelector(".mark").textContent = "✓";
          } else if (k === i) {
            btns[k].classList.add("wrong");
            btns[k].querySelector(".mark").textContent = "✕";
          } else {
            btns[k].classList.add("dim");
          }
        }

        ctx.onAnswer(w, correct, EWG.ui.$(".opt[data-i='" + i + "']", root));
        timer.set(next, correct ? 1150 : 1900);
      }

      function next() {
        idx++;
        render();
      }

      render();

      return {
        destroy: function () {
          timer.clearAll();
          if (unbind) unbind();
        }
      };
    }
  };

  EWG.games[def.id] = def;
  EWG.GAMES.push(def);
})(window.EWG);
