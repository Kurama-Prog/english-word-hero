/* ============================================================
   pages/report.js · 家长报告（掌握度 / 错词本 / 学习时长）
   ============================================================ */
window.EWG = window.EWG || {};
EWG.pages = EWG.pages || {};
(function (EWG) {
  "use strict";

  function stackBar(sum) {
    var t = Math.max(1, sum.total);
    var m = (sum.mastered / t) * 100;
    var l = (sum.learning / t) * 100;
    var n = (sum.untouched / t) * 100;
    return `
      <div class="stack-bar">
        <i style="width:${m}%;background:linear-gradient(90deg,#7BEBA9,#28C06B)"></i>
        <i style="width:${l}%;background:linear-gradient(90deg,#FFC46B,#FF9A5C)"></i>
        <i style="width:${n}%;background:#E9DFD6"></i>
      </div>
      <div class="legend">
        <span><i style="background:#28C06B"></i>已掌握 ${sum.mastered}</span>
        <span><i style="background:#FF9A5C"></i>学习中 ${sum.learning}</span>
        <span><i style="background:#E9DFD6"></i>还没学 ${sum.untouched}</span>
      </div>`;
  }

  function unitBars(sum) {
    return sum.byUnit.map(function (u) {
      var t = EWG.THEMES[u.theme];
      var pct = u.total ? Math.round((u.mastered / u.total) * 100) : 0;
      return `
        <div style="display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px dashed var(--line-soft)">
          <span style="flex:0 0 176px;font-size:13px;font-weight:800;display:flex;align-items:center;gap:7px;white-space:nowrap">
            <i style="width:8px;height:8px;border-radius:50%;background:${t.color};display:inline-block"></i>
            ${u.name} ${u.title}
          </span>
          <span class="bar grow ${u.unit === 1 ? "sky" : u.unit === 2 ? "" : u.unit === 3 ? "green" : "violet"}">
            <i style="width:${pct}%"></i>
          </span>
          <span class="tiny muted" style="width:96px;text-align:right">${u.mastered}/${u.total} 个</span>
        </div>`;
    }).join("");
  }

  function wrongTable() {
    var list = EWG.progress.wrongWords(15);
    if (!list.length) {
      return `<div class="empty"><span class="ico">🌟</span>
        错词本还是空的，说明小家伙还没被难住过～<br>
        <span class="tiny">答错的单词会自动记到这里</span></div>`;
    }
    return `
      <table class="wrong-table">
        <thead>
          <tr><th>单词</th><th>中文</th><th>错了几次</th><th>掌握度</th><th>最后练</th><th></th></tr>
        </thead>
        <tbody>
          ${list.map(function (w) {
            var r = EWG.progress.rec(w.id);
            return `<tr>
              <td class="w-en">${EWG.ui.esc(w.en)} ${EWG.ui.speakBtn(w.en)}</td>
              <td class="w-cn">${EWG.ui.esc(w.cn)}</td>
              <td class="w-bad">${r.wrong} 次</td>
              <td>${EWG.ui.stars(r.stars)}</td>
              <td class="tiny muted">${EWG.ui.fmtDate(r.lastSeen)}</td>
              <td><button class="btn btn-sm btn-ghost" type="button"
                data-go="#/play/quiz-meaning?ids=${w.id}&n=4">专练</button></td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>`;
  }

  function weekBars() {
    var week = EWG.store.week();
    var max = 1;
    week.forEach(function (d) { if (d.q > max) max = d.q; });
    return week.map(function (d) {
      var h = Math.max(4, Math.round((d.q / max) * 100));
      return `<div class="wb ${d.isToday ? "today" : ""}">
        <i style="height:${h}%" title="${d.key}：${d.q} 题"></i>
        <span>${d.label}</span>
      </div>`;
    }).join("");
  }

  function grammarList() {
    return EWG.GRAMMAR_TIPS.map(function (g) {
      return `
        <details style="border-bottom:1px dashed var(--line-soft);padding:12px 2px">
          <summary style="cursor:pointer;font-size:14.5px;font-weight:800;color:var(--ink);list-style:none;display:flex;align-items:center;gap:8px">
            <span style="color:var(--orange-deep)">§</span>${EWG.ui.esc(g.title)}
          </summary>
          <div style="padding:10px 0 4px 20px">
            <p class="small" style="color:var(--ink-soft);line-height:1.7">${EWG.ui.esc(g.rule)}</p>
            <p class="small" style="margin-top:8px;background:var(--cream);border-radius:9px;padding:8px 11px">
              <b style="color:var(--orange-deep)">例</b> ${EWG.ui.esc(g.eg)}<br>
              <span class="muted">${EWG.ui.esc(g.egCn)}</span>
            </p>
          </div>
        </details>`;
    }).join("");
  }

  EWG.pages.report = {
    render: function (view) {
      var sum = EWG.progress.summary();
      var today = EWG.store.today();
      var week = EWG.store.week();
      var weekQ = week.reduce(function (a, d) { return a + d.q; }, 0);
      var weekSec = week.reduce(function (a, d) { return a + d.sec; }, 0);
      var totalSec = Object.keys(EWG.store.data.days).reduce(function (a, k) {
        return a + (EWG.store.data.days[k].sec || 0);
      }, 0);
      var wrongs = EWG.progress.wrongWords();
      var goal = EWG.store.data.goal || 20;

      view.innerHTML = `
        <div class="section-head" style="margin-top:0">
          <h2><span class="dot"></span>家长报告</h2>
          <span class="sub">数据保存在这台电脑的浏览器里 · 只统计真实答题</span>
        </div>

        <section class="report-top">
          <div class="card fade-up">
            <div class="row-between">
              <h3>掌握度总览</h3>
              <span class="capsule">共 ${sum.total} 个词条</span>
            </div>
            <div class="mastery-num"><b>${sum.percent}%</b><span>单词已掌握</span></div>
            ${stackBar(sum)}
            <p class="tiny muted" style="margin-top:14px">
              4 星及以上算「已掌握」。每个单词的星级会随答题动态升降，答错会掉星并重新回到复习队列。
            </p>
          </div>

          <div class="card fade-up">
            <div class="row-between">
              <h3>学习统计</h3>
              <span class="capsule">目标 ${goal} 题/天</span>
            </div>
            <div class="stat-tiles" style="margin-top:14px">
              <div class="tile"><small>今日答题</small><b>${today.q}<em>/ ${goal} 题</em></b></div>
              <div class="tile"><small>今日时长</small><b>${Math.round(today.sec / 60)}<em>分钟</em></b></div>
              <div class="tile"><small>本周答题</small><b>${weekQ}<em>题</em></b></div>
              <div class="tile"><small>连续打卡</small><b>${EWG.store.streak()}<em>天</em></b></div>
            </div>
            <div class="bar thick" style="margin-top:14px">
              <i style="width:${Math.min(100, Math.round((today.q / goal) * 100))}%"></i>
            </div>
            <p class="tiny muted" style="margin-top:8px">今日目标完成度 ${Math.min(100, Math.round((today.q / goal) * 100))}%</p>
          </div>
        </section>

        <div class="section-head">
          <h2><span class="dot" style="background:var(--sky)"></span>单元进度</h2>
          <span class="sub">按课本四个单元统计</span>
        </div>
        <div class="card card-tight">${unitBars(sum)}</div>

        <div class="section-head">
          <h2><span class="dot" style="background:var(--red)"></span>错词本</h2>
          <span class="sub">${wrongs.length ? "共 " + wrongs.length + " 个词答错过" : "暂时没有错词"}</span>
        </div>
        <div class="card">
          ${wrongTable()}
          ${wrongs.length ? `<div class="row" style="margin-top:16px;justify-content:flex-end">
            <button class="btn btn-sm" type="button" data-go="#/play/quiz-meaning?mode=wrong&n=8">一键专练错词 →</button>
          </div>` : ""}
        </div>

        <div class="section-head">
          <h2><span class="dot" style="background:var(--green)"></span>最近 7 天</h2>
          <span class="sub">本周共 ${weekQ} 题 · ${EWG.ui.fmtTime(weekSec)}</span>
        </div>
        <div class="card">
          <div class="week-bars">${weekBars()}</div>
          <p class="tiny muted" style="margin-top:12px">累计学习时长 ${EWG.ui.fmtTime(totalSec)}</p>
        </div>

        <div class="section-head">
          <h2><span class="dot" style="background:var(--violet)"></span>语法小贴士</h2>
          <span class="sub">来自复习卷的语法解析，点开就能看</span>
        </div>
        <div class="card card-tight">${grammarList()}</div>
      `;
    },
    destroy: function () {}
  };
})(window.EWG);
