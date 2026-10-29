/* ============================================================
   pages/wordbook.js · 单词本（筛选 / 翻转 / 听音 / 批量练习）
   ============================================================ */
window.EWG = window.EWG || {};
EWG.pages = EWG.pages || {};
(function (EWG) {
  "use strict";

  var st = { unit: "all", status: "all", q: "", sel: {}, open: null };
  var gridEl = null, floatEl = null, countEl = null;

  function statusOf(w) {
    var r = EWG.progress.rec(w.id);
    if (r.correct + r.wrong === 0) return "new";
    return r.stars >= EWG.progress.MASTER_STARS ? "mastered" : "learning";
  }

  function filtered() {
    var q = st.q.trim().toLowerCase();
    return EWG.WORD_BANK.filter(function (w) {
      if (st.unit !== "all" && String(w.unit) !== String(st.unit)) return false;
      if (st.status !== "all" && statusOf(w) !== st.status) return false;
      if (q) {
        var hay = (w.en + " " + w.cn).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
  }

  function cardHtml(w) {
    var t = EWG.THEMES[w.theme];
    var stars = EWG.progress.starsOf(w.id);
    var isSel = !!st.sel[w.id];
    var isOpen = st.open === w.id;
    return `
      <article class="wcard ${isSel ? "is-sel" : ""} ${isOpen ? "open" : ""}"
        data-wid="${w.id}" style="--accent:${t.color}" tabindex="0">
        <span class="sel-box" data-sel="${w.id}" title="选中，稍后集中练习">✓</span>
        <div class="wcard-head">
          <div>
            <div class="wcard-en">${EWG.ui.esc(w.en)}<span class="pos">${EWG.ui.esc(w.pos)}</span></div>
            <div class="wcard-cn">${EWG.ui.esc(w.cn)}</div>
          </div>
        </div>
        <div class="wcard-foot">
          ${EWG.ui.stars(stars)}
          <span class="row gap-6">
            <span class="wcard-src">${w.unitName} · ${EWG.ui.esc(w.src)}</span>
            ${EWG.ui.speakBtn(w.en)}
          </span>
        </div>
        <div class="wcard-detail">
          ${w.sentence ? `<div class="sen"><b>例句</b> ${EWG.ui.esc(w.sentence)}<br><span class="muted">${EWG.ui.esc(w.sentenceCn)}</span></div>` : ""}
          ${w.tip ? `<div class="tip">💡 ${EWG.ui.esc(w.tip)}</div>` : ""}
        </div>
      </article>`;
  }

  function draw() {
    var list = filtered();
    if (countEl) countEl.textContent = list.length + " 个词条";
    if (!gridEl) return;
    if (!list.length) {
      gridEl.innerHTML = `<div class="empty" style="grid-column:1/-1">
        <span class="ico">🔍</span>没有找到这样的单词，换个条件试试吧～</div>`;
      return;
    }
    gridEl.innerHTML = list.map(cardHtml).join("");
  }

  function syncFloat() {
    if (!floatEl) return;
    var n = Object.keys(st.sel).length;
    floatEl.classList.toggle("on", n > 0);
    var b = floatEl.querySelector("b");
    if (b) b.textContent = "已选中 " + n + " 个词";
  }

  function openChooser() {
    var ids = Object.keys(st.sel);
    if (!ids.length) return;
    var games = EWG.GAMES || [];
    var rows = games.map(function (g) {
      return `<button class="game-card" type="button" style="--accent:${g.color};--accent-soft:${g.soft}"
        data-go="#/play/${g.id}?ids=${ids.join(",")}&n=${Math.min(8, ids.length)}">
        <span class="game-ico" style="width:42px;height:42px;font-size:21px;margin-bottom:4px">${g.icon}</span>
        <h3 style="font-size:15.5px">${g.name}</h3>
      </button>`;
    }).join("");
    EWG.ui.modal(`
      <div class="row-between" style="margin-bottom:6px">
        <h2 style="font-size:21px">用哪种玩法练这 ${ids.length} 个词？</h2>
      </div>
      <p class="small muted" style="margin-bottom:16px">挑一个你最想玩的吧～</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">${rows}</div>
    `);
  }

  EWG.pages.wordbook = {
    render: function (view, route) {
      st.unit = (route.params && route.params.unit) || "all";
      st.status = "all";
      st.q = "";
      st.sel = {};
      st.open = null;

      var units = EWG.UNITS.map(function (u) {
        return `<button class="chip ${String(st.unit) === String(u.id) ? "is-on" : ""}" type="button"
          data-unit="${u.id}">${u.name} ${u.title}</button>`;
      }).join("");

      var statuses = [
        { k: "all", t: "全部" },
        { k: "new", t: "没学过" },
        { k: "learning", t: "学习中" },
        { k: "mastered", t: "已掌握" }
      ].map(function (s) {
        return `<button class="chip ${st.status === s.k ? "is-on" : ""}" type="button" data-status="${s.k}">${s.t}</button>`;
      }).join("");

      view.innerHTML = `
        <div class="section-head" style="margin-top:0">
          <h2><span class="dot"></span>单词本</h2>
          <span class="sub" id="wbCount">—</span>
        </div>

        <div class="filter-bar fade-up">
          <div class="filter-group">
            <span class="filter-label">单元</span>
            <button class="chip ${st.unit === "all" ? "is-on" : ""}" type="button" data-unit="all">全部</button>
            ${units}
          </div>
          <div class="filter-group">
            <span class="filter-label">状态</span>
            ${statuses}
          </div>
          <div class="search-box">
            <span>🔍</span>
            <input id="wbSearch" type="search" placeholder="搜英文或中文…" autocomplete="off" />
          </div>
        </div>

        <div class="word-grid" id="wbGrid"></div>

        <div class="float-bar" id="wbFloat">
          <b>已选中 0 个词</b>
          <button class="btn btn-sm" type="button" id="wbPlay">开始练习 →</button>
          <button class="btn btn-sm btn-quiet" type="button" id="wbClear"
            style="color:#fff;border-color:rgba(255,255,255,.35)">清空</button>
        </div>

        <p class="tiny muted center" style="margin-top:26px">
          小提示：点卡片可以看例句，点左上角的对勾可以把单词挑出来集中练。
        </p>
      `;

      gridEl = document.getElementById("wbGrid");
      floatEl = document.getElementById("wbFloat");
      countEl = document.getElementById("wbCount");
      draw();
      syncFloat();

      var search = document.getElementById("wbSearch");
      if (search) {
        search.addEventListener("input", function () {
          st.q = this.value || "";
          draw();
        });
      }

      view.addEventListener("click", function (e) {
        var unitBtn = e.target.closest("[data-unit]");
        if (unitBtn) {
          st.unit = unitBtn.getAttribute("data-unit");
          var chips = view.querySelectorAll("[data-unit]");
          for (var i = 0; i < chips.length; i++) chips[i].classList.toggle("is-on", chips[i] === unitBtn);
          draw();
          return;
        }
        var stBtn = e.target.closest("[data-status]");
        if (stBtn) {
          st.status = stBtn.getAttribute("data-status");
          var ss = view.querySelectorAll("[data-status]");
          for (var j = 0; j < ss.length; j++) ss[j].classList.toggle("is-on", ss[j] === stBtn);
          draw();
          return;
        }
        var selBox = e.target.closest("[data-sel]");
        if (selBox) {
          var pid = selBox.getAttribute("data-sel");
          if (st.sel[pid]) delete st.sel[pid]; else st.sel[pid] = true;
          var card = selBox.closest(".wcard");
          if (card) card.classList.toggle("is-sel", !!st.sel[pid]);
          syncFloat();
          EWG.audio.sfx("pick");
          return;
        }
        var cardEl = e.target.closest(".wcard");
        if (cardEl) {
          var wid = cardEl.getAttribute("data-wid");
          st.open = st.open === wid ? null : wid;
          var all = view.querySelectorAll(".wcard");
          for (var k = 0; k < all.length; k++) {
            all[k].classList.toggle("open", all[k].getAttribute("data-wid") === st.open);
          }
        }
      });

      view.addEventListener("keydown", function (e) {
        if (e.key !== "Enter" && e.key !== " ") return;
        var cardEl = e.target.closest ? e.target.closest(".wcard") : null;
        if (!cardEl) return;
        e.preventDefault();
        var wid = cardEl.getAttribute("data-wid");
        st.open = st.open === wid ? null : wid;
        cardEl.classList.toggle("open", st.open === wid);
      });

      var playBtn = document.getElementById("wbPlay");
      if (playBtn) playBtn.addEventListener("click", openChooser);

      var clearBtn = document.getElementById("wbClear");
      if (clearBtn) clearBtn.addEventListener("click", function () {
        st.sel = {};
        var all = view.querySelectorAll(".wcard");
        for (var i = 0; i < all.length; i++) all[i].classList.remove("is-sel");
        syncFloat();
      });
    },

    destroy: function () {
      gridEl = floatEl = countEl = null;
      st.sel = {};
      st.open = null;
    }
  };
})(window.EWG);
