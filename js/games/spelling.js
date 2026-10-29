/* ============================================================
   游戏 3 · 拼写大挑战
   ============================================================ */
window.EWG = window.EWG || {};
(function (EWG) {
  "use strict";
  EWG.GAMES = EWG.GAMES || [];
  EWG.games = EWG.games || {};

  var ALPHA = "abcdefghijklmnopqrstuvwxyz".split("");

  var def = {
    id: "spelling",
    name: "拼写大挑战",
    icon: "✏️",
    color: "#FF7A45",
    soft: "#FFEDE2",
    desc: "看中文提示，用字母块把单词拼出来",
    needsSpeech: false,

    create: function (ctx) {
      var pool = ctx.items.filter(function (w) { return w.spellable; });
      var items = pool.length >= 3 ? pool : ctx.items.filter(function (w) { return /^[a-zA-Z]{2,12}$/.test(w.en); });
      if (!items.length) items = ctx.items.slice();

      var idx = 0;
      var locked = false;
      var timer = EWG.kit.timers();
      var unbind = null;
      var tiles = [], filled = [], answer = "";

      var root = document.createElement("div");
      root.style.display = "flex";
      root.style.flexDirection = "column";
      root.style.flex = "1";
      ctx.container.appendChild(root);

      function buildTiles(word) {
        answer = word.toLowerCase();
        var chars = answer.split("");
        var extra = EWG.kit.sample(ALPHA, 2);
        var all = chars.concat(extra).map(function (ch) {
          return { ch: ch, used: false };
        });
        tiles = EWG.kit.shuffle(all);
        filled = new Array(chars.length).fill(null);
      }

      function currentWord() { return items[idx]; }

      function render() {
        if (idx >= items.length) { ctx.finish(); return; }
        locked = false;
        var w = currentWord();
        buildTiles(w.en);
        draw();
        ctx.setProgress(idx, items.length);
        ctx.clearFeedback("按顺序点字母，也可以直接用键盘敲出来～");
      }

      function draw() {
        var w = currentWord();
        var len = answer.length;
        var slotStyle = len > 9 ? ' style="width:42px;height:56px;font-size:22px"' : "";
        var cur = filled.indexOf(null);

        var slots = answer.split("").map(function (ch, i) {
          var t = filled[i];
          var filledCh = t === null ? "" : tiles[t].ch;
          var cls = "slot";
          if (t !== null) cls += " filled";
          if (i === cur && !locked) cls += " current";
          return `<button type="button" class="${cls}" data-slot="${i}"${slotStyle}>${EWG.ui.esc(filledCh)}</button>`;
        }).join("");

        var tray = tiles.map(function (t, i) {
          return `<button type="button" class="letter ${t.used ? "used" : ""}" data-tile="${i}">${EWG.ui.esc(t.ch)}</button>`;
        }).join("");

        root.innerHTML = `
          <div class="q-center">
            <div class="q-prompt-label">把下面的单词拼出来</div>
            <div class="q-cn">${EWG.ui.esc(w.cn)}<span class="pos">${EWG.ui.esc(w.pos)}</span></div>
            <div class="q-hint">一共 ${len} 个字母${len > 8 ? "，看清楚再点哦" : ""}</div>
            <div style="margin-top:12px">${EWG.ui.speakBtn(w.en)}</div>
          </div>
          <div class="spell-slots" id="spellSlots">${slots}</div>
          <div class="letter-tray" id="letterTray">${tray}</div>
          <div class="spell-tools">
            <button class="btn btn-sm btn-ghost" type="button" id="spellBack">⌫ 退一格</button>
            <button class="btn btn-sm btn-ghost" type="button" id="spellReset">↺ 重新拼</button>
          </div>`;

        var trayEl = document.getElementById("letterTray");
        trayEl.addEventListener("click", function (e) {
          var btn = e.target.closest("[data-tile]");
          if (!btn || locked) return;
          place(parseInt(btn.getAttribute("data-tile"), 10));
        });

        var slotsEl = document.getElementById("spellSlots");
        slotsEl.addEventListener("click", function (e) {
          var btn = e.target.closest("[data-slot]");
          if (!btn || locked) return;
          removeAt(parseInt(btn.getAttribute("data-slot"), 10));
        });

        document.getElementById("spellBack").addEventListener("click", function () {
          if (locked) return;
          var last = -1;
          for (var i = filled.length - 1; i >= 0; i--) { if (filled[i] !== null) { last = i; break; } }
          if (last > -1) removeAt(last);
        });

        document.getElementById("spellReset").addEventListener("click", function () {
          if (locked) return;
          filled = filled.map(function () { return null; });
          tiles.forEach(function (t) { t.used = false; });
          draw();
        });

        if (unbind) unbind();
        unbind = EWG.kit.onKey(function (e) {
          if (locked) {
            if (e.key === "Enter") { timer.clearAll(); next(); }
            return;
          }
          if (/^[a-zA-Z]$/.test(e.key)) {
            e.preventDefault();
            var ch = e.key.toLowerCase();
            var pick = -1;
            for (var i = 0; i < tiles.length; i++) {
              if (!tiles[i].used && tiles[i].ch === ch) { pick = i; break; }
            }
            if (pick > -1) place(pick);
          } else if (e.key === "Backspace") {
            e.preventDefault();
            var last = -1;
            for (var j = filled.length - 1; j >= 0; j--) { if (filled[j] !== null) { last = j; break; } }
            if (last > -1) removeAt(last);
          }
        });
      }

      function place(tileIdx) {
        var slot = filled.indexOf(null);
        if (slot < 0 || tiles[tileIdx].used) return;
        filled[slot] = tileIdx;
        tiles[tileIdx].used = true;
        EWG.audio.sfx("pick");
        draw();
        if (filled.indexOf(null) < 0) check();
      }

      function removeAt(slot) {
        var t = filled[slot];
        if (t === null) return;
        tiles[t].used = false;
        filled[slot] = null;
        draw();
      }

      function check() {
        locked = true;
        var typed = filled.map(function (t) { return tiles[t].ch; }).join("");
        var ok = typed === answer;
        var w = currentWord();
        var slotEls = root.querySelectorAll(".slot");

        if (ok) {
          for (var i = 0; i < slotEls.length; i++) slotEls[i].classList.add("ok");
        } else {
          for (var j = 0; j < slotEls.length; j++) slotEls[j].classList.add("no");
          EWG.ui.shake(root.querySelector("#spellSlots"));
        }

        ctx.onAnswer(w, ok, null, root);

        if (ok) {
          timer.set(next, 1000);
        } else {
          timer.set(function () {
            var ans = answer.split("");
            slotEls.forEach(function (el, i) {
              el.classList.remove("no");
              el.classList.add("ok");
              el.textContent = ans[i];
            });
          }, 700);
          timer.set(next, 2100);
        }
      }

      function next() { idx++; render(); }

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
