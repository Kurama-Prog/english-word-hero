/* ============================================================
   游戏 6 · 记忆翻牌（中英文配对）
   ============================================================ */
window.EWG = window.EWG || {};
(function (EWG) {
  "use strict";
  EWG.GAMES = EWG.GAMES || [];
  EWG.games = EWG.games || {};

  var def = {
    id: "memory",
    name: "记忆翻牌",
    icon: "🃏",
    color: "#7B61FF",
    soft: "#EFEBFF",
    desc: "翻开卡片，凭记忆把英文和中文配成一对",
    needsSpeech: false,

    create: function (ctx) {
      var items = ctx.items.slice(0, 6);
      var pairs = items.length;
      var cards = [];
      items.forEach(function (w, i) {
        cards.push({ pid: i, word: w, type: "en", text: w.en });
        cards.push({ pid: i, word: w, type: "cn", text: w.cn });
      });
      cards = EWG.kit.shuffle(cards);

      var opened = [];
      var locked = false;
      var matched = 0;
      var moves = 0;
      var missed = {};
      var timer = EWG.kit.timers();

      var root = document.createElement("div");
      root.style.display = "flex";
      root.style.flexDirection = "column";
      root.style.flex = "1";
      ctx.container.appendChild(root);

      root.innerHTML = `
        <div class="match-head">
          <div>
            <div class="ph-title" style="font-size:16px">翻开两张卡，看看是不是一对</div>
            <div class="q-hint" style="text-align:left;margin-top:2px">英文卡和它的中文卡配成一对，全部配对就通关</div>
          </div>
          <span class="q-count" id="memLeft">剩 ${pairs} 对</span>
        </div>
        <div class="mem-grid" id="memGrid">
          ${cards.map(function (c, i) {
            return `<button class="mem-card" type="button" data-i="${i}" aria-label="卡片 ${i + 1}">
              <span class="mem-inner">
                <span class="mem-face mem-back">?</span>
                <span class="mem-face mem-front ${c.type}">${EWG.ui.esc(c.text)}</span>
              </span>
            </button>`;
          }).join("")}
        </div>`;

      var grid = document.getElementById("memGrid");
      var leftEl = document.getElementById("memLeft");

      ctx.setProgress(0, pairs, "0/" + pairs + " 对");
      ctx.clearFeedback("翻开两张卡，看看是不是一对～");

      grid.addEventListener("click", function (e) {
        var btn = e.target.closest(".mem-card");
        if (!btn || locked) return;
        var i = parseInt(btn.getAttribute("data-i"), 10);
        var card = cards[i];
        if (card.done || btn.classList.contains("flipped")) return;

        btn.classList.add("flipped");
        EWG.audio.sfx("pick");
        opened.push({ i: i, card: card, el: btn });

        if (opened.length < 2) return;

        var a = opened[0], b = opened[1];
        moves++;

        if (a.card.pid === b.card.pid) {
          a.card.done = b.card.done = true;
          matched++;
          a.el.classList.add("matched");
          b.el.classList.add("matched");
          leftEl.textContent = "剩 " + (pairs - matched) + " 对";
          ctx.setProgress(matched, pairs, matched + "/" + pairs + " 对");
          ctx.onAnswer(a.card.word, true, b.el, null, null);
          EWG.audio.speak(a.card.word.en);
          opened = [];
          if (matched >= pairs) {
            timer.set(function () { ctx.finish(); }, 650);
          }
          return;
        }

        // 没配对
        locked = true;
        var w = a.card.word;
        if (!missed[a.card.pid]) {
          missed[a.card.pid] = true;
          ctx.onAnswer(w, false, null, null, "翻错啦，再看一眼记住它的意思～");
        }
        a.el.classList.add("miss");
        b.el.classList.add("miss");

        timer.set(function () {
          [a, b].forEach(function (x) {
            x.el.classList.remove("flipped", "miss");
          });
          opened = [];
          locked = false;
        }, 820);
      });

      return {
        destroy: function () { timer.clearAll(); }
      };
    }
  };

  EWG.games[def.id] = def;
  EWG.GAMES.push(def);
})(window.EWG);
