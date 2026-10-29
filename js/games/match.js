/* ============================================================
   游戏 4 · 消消乐配对（英文卡 + 中文卡，两两消除）
   ============================================================ */
window.EWG = window.EWG || {};
(function (EWG) {
  "use strict";
  EWG.GAMES = EWG.GAMES || [];
  EWG.games = EWG.games || {};

  var def = {
    id: "match",
    name: "消消乐配对",
    icon: "🍬",
    color: "#4ADE80",
    soft: "#E5FBEC",
    desc: "把英文和中文配成一对，点掉整盘卡片",
    needsSpeech: false,

    create: function (ctx) {
      var items = ctx.items.slice(0, 8);
      var pairs = items.length;
      var cards = [];
      items.forEach(function (w, i) {
        cards.push({ pid: i, word: w, type: "en", text: w.en });
        cards.push({ pid: i, word: w, type: "cn", text: w.cn });
      });
      cards = EWG.kit.shuffle(cards);

      var first = null;
      var locked = false;
      var matched = 0;
      var moves = 0;
      var timer = EWG.kit.timers();

      var root = document.createElement("div");
      root.style.display = "flex";
      root.style.flexDirection = "column";
      root.style.flex = "1";
      ctx.container.appendChild(root);

      root.innerHTML = `
        <div class="match-head">
          <div>
            <div class="ph-title" style="font-size:16px">把英文和它对应的中文配成一对</div>
            <div class="q-hint" style="text-align:left;margin-top:2px">点一张英文卡，再点它的中文卡，配对成功就会消失</div>
          </div>
          <span class="q-count" id="matchLeft">剩 ${pairs} 对</span>
        </div>
        <div class="match-grid" id="matchGrid">
          ${cards.map(function (c, i) {
            return `<button class="mcard ${c.type === "en" ? "en-card" : "cn-card"}" type="button" data-i="${i}">
              <span class="${c.type === "en" ? "en" : "cn"}">${EWG.ui.esc(c.text)}</span>
            </button>`;
          }).join("")}
        </div>`;

      var grid = document.getElementById("matchGrid");
      var leftEl = document.getElementById("matchLeft");

      ctx.setProgress(0, pairs, "0/" + pairs + " 对");
      ctx.clearFeedback("点一张英文卡，再点它的中文卡～");

      grid.addEventListener("click", function (e) {
        var btn = e.target.closest(".mcard");
        if (!btn || locked) return;
        var i = parseInt(btn.getAttribute("data-i"), 10);
        var card = cards[i];
        if (card.done || btn.classList.contains("picked")) return;

        btn.classList.add("picked");
        EWG.audio.sfx("pick");

        if (!first) { first = { i: i, card: card, el: btn }; return; }

        // 第二张
        var a = first, b = { i: i, card: card, el: btn };
        moves++;

        if (a.card.pid === b.card.pid) {
          // 配对成功
          a.card.done = b.card.done = true;
          matched++;
          a.el.classList.add("matched");
          b.el.classList.add("matched");
          a.el.classList.remove("picked");
          b.el.classList.remove("picked");
          leftEl.textContent = "剩 " + (pairs - matched) + " 对";
          ctx.setProgress(matched, pairs, matched + "/" + pairs + " 对");
          ctx.onAnswer(a.card.word, true, b.el, null, null);
          EWG.audio.speak(a.card.word.en);
          first = null;
          if (matched >= pairs) {
            timer.set(function () { ctx.finish(); }, 620);
          }
          return;
        }

        // 配对失败
        locked = true;
        var w = a.card.word;
        a.el.classList.add("miss");
        b.el.classList.add("miss");
        ctx.onAnswer(w, false, null, null, "这两个不是一对，再找找看～");
        timer.set(function () {
          [a, b].forEach(function (x) {
            x.el.classList.remove("picked", "miss");
          });
          locked = false;
          first = null;
        }, 720);
      });

      return {
        destroy: function () { timer.clearAll(); }
      };
    }
  };

  EWG.games[def.id] = def;
  EWG.GAMES.push(def);
})(window.EWG);
