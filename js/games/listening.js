/* ============================================================
   游戏 2 · 听音辨词
   ============================================================ */
window.EWG = window.EWG || {};
(function (EWG) {
  "use strict";
  EWG.GAMES = EWG.GAMES || [];
  EWG.games = EWG.games || {};

  var def = {
    id: "listening",
    name: "听音辨词",
    icon: "🎧",
    color: "#7B61FF",
    soft: "#EFEBFF",
    desc: "听听电脑读的英文，把听到的单词选出来",
    needsSpeech: true,

    create: function (ctx) {
      var items = ctx.items.slice();
      var idx = 0;
      var locked = false;
      var timer = EWG.kit.timers();
      var unbind = null;
      var speechOk = true;
      var root = document.createElement("div");
      root.style.display = "flex";
      root.style.flexDirection = "column";
      root.style.flex = "1";
      ctx.container.appendChild(root);

      function render() {
        if (idx >= items.length) { ctx.finish(); return; }
        locked = false;
        speechOk = EWG.audio.hasVoice();
        var w = items[idx];
        var opts = EWG.kit.options(w, "en", 4);

        var prompt = speechOk
          ? `<div class="q-prompt-label">听一听，选出你听到的单词</div>
             <button class="big-speaker" type="button" id="qSpeaker" aria-label="播放发音">🔊</button>
             <div class="q-hint" id="qCn"></div>
             <button class="hint-chip" type="button" id="qHint">🐣 听不清？悄悄看一眼中文</button>`
          : `<div class="q-prompt-label">看中文，选出正确的英文</div>
             <div class="q-cn">${EWG.ui.esc(w.cn)}</div>
             <div class="q-hint">这台电脑暂时读不出声音，我们换一种方式来练～</div>`;

        root.innerHTML = `
          <div class="q-center">${prompt}</div>
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
        ctx.clearFeedback(speechOk ? "听清楚了吗？点喇叭可以再听一次" : "看中文，选出正确的英文吧～");

        var sp = document.getElementById("qSpeaker");
        if (sp) {
          sp.addEventListener("click", function (e) {
            e.stopPropagation();
            playWord(w);
          });
        }

        var hintBtn = document.getElementById("qHint");
        if (hintBtn) {
          hintBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            var box = document.getElementById("qCn");
            if (box) box.textContent = "它的意思是：" + w.cn;
            hintBtn.style.display = "none";
          });
        }

        var btns = root.querySelectorAll(".opt");
        for (var i = 0; i < btns.length; i++) {
          (function (btn, i) {
            btn.addEventListener("click", function () { choose(i, opts, btns); });
          })(btns[i], i);
        }

        if (speechOk) timer.set(function () { playWord(w); }, 380);

        if (unbind) unbind();
        unbind = EWG.kit.onKey(function (e) {
          var n = parseInt(e.key, 10);
          if (n >= 1 && n <= btns.length && !locked) choose(n - 1, opts, btns);
          if (e.key === " " && speechOk && !locked) { e.preventDefault(); playWord(w); }
          if (e.key === "Enter" && locked) { timer.clearAll(); next(); }
        });
      }

      function playWord(w) {
        EWG.audio.speak(w.en);
        var sp = document.getElementById("qSpeaker");
        if (sp) {
          sp.classList.add("playing");
          setTimeout(function () { sp.classList.remove("playing"); }, 1000);
        }
      }

      function choose(i, opts, btns) {
        if (locked) return;
        locked = true;
        var w = items[idx];
        var correct = opts[i].right;
        EWG.audio.stop();

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

        ctx.onAnswer(w, correct, btns[i], root);
        timer.set(next, correct ? 1150 : 2000);
      }

      function next() {
        idx++;
        render();
      }

      render();

      return {
        destroy: function () {
          timer.clearAll();
          EWG.audio.stop();
          if (unbind) unbind();
        }
      };
    }
  };

  EWG.games[def.id] = def;
  EWG.GAMES.push(def);
})(window.EWG);
