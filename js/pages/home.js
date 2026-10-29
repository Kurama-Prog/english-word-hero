/* ============================================================
   pages/home.js · 首页（今日任务 + 六宫格 + 待复习 + 单元进度）
   ============================================================ */
window.EWG = window.EWG || {};
EWG.pages = EWG.pages || {};
(function (EWG) {
  "use strict";

  var RING_LEN = 2 * Math.PI * 52;

  function greeting() {
    var h = new Date().getHours();
    if (h < 6) return "夜深啦，早点休息哦";
    if (h < 11) return "早上好呀，小英雄";
    if (h < 14) return "中午好呀，小英雄";
    if (h < 18) return "下午好呀，小英雄";
    return "晚上好呀，小英雄";
  }

  function recommendGame() {
    var list = EWG.GAMES || [];
    if (!list.length) return null;
    var best = list[0], bestScore = Infinity;
    list.forEach(function (g) {
      var b = EWG.progress.bestOf(g.id);
      var score = b ? b.score : -1;
      if (score < bestScore) { bestScore = score; best = g; }
    });
    return best;
  }

  function ringSvg(pct) {
    var offset = RING_LEN * (1 - Math.min(100, pct) / 100);
    return `
      <div class="ring-wrap">
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#FFA45B"/>
              <stop offset="60%" stop-color="#FFB020"/>
              <stop offset="100%" stop-color="#FF7A45"/>
            </linearGradient>
          </defs>
          <circle class="ring-track" cx="60" cy="60" r="52"></circle>
          <circle class="ring-fill" cx="60" cy="60" r="52"
            stroke-dasharray="${RING_LEN.toFixed(1)}"
            stroke-dashoffset="${offset.toFixed(1)}"></circle>
        </svg>
        <div class="ring-center">
          <div><b>${pct}%</b><small>今日目标</small></div>
        </div>
      </div>`;
  }

  function gameGrid() {
    var list = EWG.GAMES || [];
    return list.map(function (g) {
      var best = EWG.progress.bestOf(g.id);
      var bestHtml = best
        ? `<div class="g-best"><span class="b">最好 ${best.score} 分</span><span>正确率 ${best.acc}%</span></div>`
        : `<div class="g-best"><span class="b">还没玩过</span><span>来试试吧</span></div>`;
      return `
        <button class="game-card" type="button" data-go="#/play/${g.id}?n=8"
          style="--accent:${g.color};--accent-soft:${g.soft}">
          <span class="game-ico">${g.icon}</span>
          <h3>${g.name}</h3>
          <p>${g.desc}</p>
          ${bestHtml}
          <span class="g-go">开始 →</span>
        </button>`;
    }).join("");
  }

  function reviewCard() {
    var weak = EWG.progress.wrongWords(3).filter(function (w) {
      return EWG.progress.starsOf(w.id) <= 3;
    });
    var due = EWG.progress.dueWords();
    if (!weak.length && !due.length) {
      return `
        <div class="review-card">
          <span class="rc-ico">🌱</span>
          <div>
            <b>暂时没有掉队的单词</b>
            <p>继续保持！多练几关，让星星全部点亮吧。</p>
          </div>
          <button class="btn btn-ghost btn-sm" type="button" data-go="#/play/quiz-meaning?n=8">随便练练</button>
        </div>`;
    }
    var words = weak.length ? weak : due.slice(0, 3);
    var chips = words.map(function (w) { return `<span>${EWG.ui.esc(w.en)}</span>`; }).join("");
    var count = weak.length || due.length;
    return `
      <div class="review-card">
        <span class="rc-ico">🩹</span>
        <div>
          <b>有 ${count} 个小调皮还没记牢</b>
          <p>专练这些词，把它们一颗颗点亮吧。</p>
          <div class="review-words">${chips}</div>
        </div>
        <button class="btn btn-sm" type="button" data-go="#/play/quiz-meaning?mode=wrong&n=8">马上专练</button>
      </div>`;
  }

  function unitList(sum) {
    return sum.byUnit.map(function (u) {
      var t = EWG.THEMES[u.theme];
      var pct = u.total ? Math.round((u.mastered / u.total) * 100) : 0;
      return `
        <button class="unit-row" type="button" data-go="#/wordbook?unit=${u.unit}">
          <div class="ur-head">
            <span class="ur-name"><i class="ur-tag" style="background:${t.color}"></i>${u.name} · ${u.title}</span>
            <span class="ur-cnt">${u.mastered}/${u.total}</span>
          </div>
          <div class="bar ${u.unit === 1 ? "sky" : u.unit === 2 ? "" : u.unit === 3 ? "green" : "violet"}">
            <i style="width:${pct}%"></i>
          </div>
          <span class="ur-cnt">已掌握 ${pct}%</span>
        </button>`;
    }).join("");
  }

  EWG.pages.home = {
    render: function (view) {
      var data = EWG.store.data;
      var sum = EWG.progress.summary();
      var today = EWG.store.today();
      var goal = Math.max(1, data.goal || 20);
      var pct = Math.min(100, Math.round((today.q / goal) * 100));
      var next = recommendGame();
      var st = EWG.store.streak();

      view.innerHTML = `
        <section class="hero fade-up">
          <div class="hero-main">
            <span class="hero-eyebrow">✨ ${greeting()}</span>
            <h1 class="hero-title">今天也来当<em>单词小英雄</em>吧！</h1>
            <p class="hero-desc">六个小游戏轮着玩，答对就点亮星星。越不熟悉的单词，会越常来找你玩 —— 这样它们就再也跑不掉啦。</p>
            <div class="hero-actions">
              <button class="btn btn-lg" type="button" data-go="#/play/${next ? next.id : "quiz-meaning"}?n=8">
                🚀 开始今天的冒险
              </button>
              <button class="btn btn-ghost" type="button" data-go="#/wordbook">📖 去单词本逛逛</button>
            </div>
            <div class="hero-meta">
              <div><b>${sum.mastered}</b><span>已掌握的单词</span></div>
              <div><b>${sum.learning}</b><span>正在学习的单词</span></div>
              <div><b>${sum.untouched}</b><span>还没见过的单词</span></div>
              <div><b>${st}</b><span>连续打卡天数</span></div>
            </div>
          </div>
          <div class="hero-ring">
            ${ringSvg(pct)}
            <div class="center">
              <div class="tiny muted">今天已经做完 <b style="color:var(--orange-deep)">${today.q}</b> 题</div>
              <div class="tiny muted">目标 ${goal} 题 · ${pct >= 100 ? "达成啦 🎉" : "还差 " + Math.max(0, goal - today.q) + " 题"}</div>
            </div>
          </div>
        </section>

        <div class="section-head">
          <h2><span class="dot"></span>六个小游戏，轮着玩</h2>
          <span class="sub">每次 8 题，通关自动进入下一次挑战</span>
        </div>
        <section class="game-grid">${gameGrid()}</section>

        <div class="section-head">
          <h2><span class="dot" style="background:var(--green)"></span>需要帮忙的单词</h2>
          <span class="sub">答错的词会自动出现在这里</span>
        </div>
        ${reviewCard()}

        <div class="section-head">
          <h2><span class="dot" style="background:var(--sky)"></span>单元进度</h2>
          <span class="sub">共 ${sum.total} 个词条 · 已掌握 ${sum.percent}%</span>
        </div>
        <section class="unit-list">${unitList(sum)}</section>
      `;
    },
    destroy: function () {}
  };
})(window.EWG);
