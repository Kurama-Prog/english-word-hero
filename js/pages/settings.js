/* ============================================================
   pages/settings.js · 设置（每日目标 / 发音 / 音效 / 数据）
   ============================================================ */
window.EWG = window.EWG || {};
EWG.pages = EWG.pages || {};
(function (EWG) {
  "use strict";

  var GOALS = [10, 20, 30, 50];

  EWG.pages.settings = {
    render: function (view) {
      var data = EWG.store.data;

      view.innerHTML = `
        <div class="section-head" style="margin-top:0">
          <h2><span class="dot"></span>设置</h2>
          <span class="sub">改完立刻生效，进度会自动保存</span>
        </div>

        <div class="card fade-up">
          <div class="setting-row">
            <div class="sr-label">
              <b>每天做几题</b>
              <span>首页的今日进度环按这个目标计算</span>
            </div>
            <div class="seg" id="goalSeg">
              ${GOALS.map(function (g) {
                return `<button type="button" data-goal="${g}" class="${data.goal === g ? "on" : ""}">${g} 题</button>`;
              }).join("")}
            </div>
          </div>

          <div class="setting-row">
            <div class="sr-label">
              <b>发音速度</b>
              <span>觉得太快就调慢一点</span>
            </div>
            <div class="row gap-12">
              <input type="range" id="rateRange" min="0.6" max="1.2" step="0.05" value="${data.rate}" />
              <span class="capsule" id="rateVal">${Number(data.rate).toFixed(2)}x</span>
            </div>
          </div>

          <div class="setting-row">
            <div class="sr-label">
              <b>游戏音效</b>
              <span>答对答错的提示音（不含朗读）</span>
            </div>
            <button class="switch ${data.sound ? "on" : ""}" id="soundSwitch" type="button"
              aria-label="切换音效"></button>
          </div>

          <div class="setting-row">
            <div class="sr-label">
              <b>英文朗读</b>
              <span id="voiceInfo">${EWG.audio.hasAudioPack()
                ? "本地发音包 · " + Object.keys(EWG.AUDIO_MAP || {}).length + " 个单词已打包，离线也能播"
                : "系统语音 · " + EWG.ui.esc(EWG.audio.voiceName())}</span>
            </div>
            <button class="btn btn-sm btn-ghost" type="button" id="testVoice">试听 classroom</button>
          </div>

          <div class="setting-row">
            <div class="sr-label">
              <b>成绩保存在哪里</b>
              <span id="storeInfo">${EWG.store.isPersistent() ? "这台电脑的浏览器本地，清缓存会丢失" : "浏览器不允许本地保存，本次进度只在当前窗口有效"}</span>
            </div>
            <span class="capsule">${EWG.store.isPersistent() ? "已开启" : "受限"}</span>
          </div>

          <div class="setting-row">
            <div class="sr-label">
              <b>清空全部进度</b>
              <span>单词星级、错词本、学习时长都会归零</span>
            </div>
            <button class="btn btn-sm btn-quiet" type="button" id="resetBtn">清空</button>
          </div>
        </div>

        <div class="section-head">
          <h2><span class="dot" style="background:var(--sky)"></span>怎么玩</h2>
        </div>
        <div class="card">
          <div class="note-card">
            <b>六个小游戏轮着来</b>，每次 8 题（配对类 6–8 对）。通关后结算页会给出「下一关」按钮，
            一路玩下去就是一整轮复习。
          </div>
          <div style="margin-top:14px;display:grid;gap:10px">
            ${(EWG.GAMES || []).map(function (g) {
              return `<div class="row gap-12" style="padding:6px 0">
                <span class="game-ico" style="width:38px;height:38px;font-size:19px;margin:0;--accent-soft:${g.soft}">${g.icon}</span>
                <span class="grow"><b style="font-size:14.5px">${g.name}</b>
                  <span class="tiny muted" style="display:block">${g.desc}</span></span>
              </div>`;
            }).join("")}
          </div>
          <div class="note-card" style="margin-top:16px">
            <b>键盘也能玩：</b>
            <span class="kbd">1</span> <span class="kbd">2</span> <span class="kbd">3</span> <span class="kbd">4</span> 选答案 ·
            拼写关直接敲字母 · <span class="kbd">Backspace</span> 退一格 ·
            <span class="kbd">Enter</span> 下一题 · <span class="kbd">Esc</span> 回首页
          </div>
        </div>
      `;

      /* ---- 每日目标 ---- */
      var seg = document.getElementById("goalSeg");
      seg.addEventListener("click", function (e) {
        var b = e.target.closest("[data-goal]");
        if (!b) return;
        data.goal = parseInt(b.getAttribute("data-goal"), 10);
        EWG.store.touch();
        EWG.store.save();
        var all = seg.querySelectorAll("button");
        for (var i = 0; i < all.length; i++) all[i].classList.toggle("on", all[i] === b);
        EWG.ui.toast("每日目标改成 " + data.goal + " 题啦", "ok");
      });

      /* ---- 语速 ---- */
      var range = document.getElementById("rateRange");
      var rateVal = document.getElementById("rateVal");
      range.addEventListener("input", function () {
        data.rate = parseFloat(this.value);
        rateVal.textContent = Number(data.rate).toFixed(2) + "x";
        EWG.store.touch();
      });
      range.addEventListener("change", function () {
        EWG.store.save();
        EWG.audio.speak("classroom");
      });

      /* ---- 音效 ---- */
      var sw = document.getElementById("soundSwitch");
      sw.addEventListener("click", function () {
        data.sound = !data.sound;
        sw.classList.toggle("on", data.sound);
        EWG.store.touch();
        EWG.store.save();
        if (data.sound) EWG.audio.sfx("correct");
      });

      /* ---- 试听 ---- */
      document.getElementById("testVoice").addEventListener("click", function () {
        var w = EWG.getWord("u1-classroom") || { id: "u1-classroom", en: "classroom" };
        var ok = EWG.audio.speak(w);
        if (!ok) EWG.ui.toast("这台手机暂时听不到发音，我们先看中文练吧", "warn");
        else EWG.ui.toast("听到 classroom 了吗？没听到就调大手机音量", "ok");
      });

      /* ---- 清空 ---- */
      document.getElementById("resetBtn").addEventListener("click", function () {
        EWG.ui.modal(`
          <div data-lock>
            <h2 style="font-size:21px">真的要清空吗？</h2>
            <p class="small muted" style="margin-top:8px">
              所有星星、错词本和学习时长都会归零，无法恢复。建议先看看家长报告再决定。
            </p>
            <div class="row" style="margin-top:22px;justify-content:flex-end;gap:10px">
              <button class="btn btn-ghost btn-sm" type="button" id="cancelReset">先不清</button>
              <button class="btn btn-sm" type="button" id="doReset"
                style="--btn-bg:linear-gradient(135deg,#FF7B7B,#EF4444)">确认清空</button>
            </div>
          </div>
        `);
        document.getElementById("cancelReset").addEventListener("click", function () {
          EWG.ui.closeModal();
        });
        document.getElementById("doReset").addEventListener("click", function () {
          EWG.store.reset();
          EWG.ui.closeModal();
          EWG.ui.refreshTopbar();
          EWG.ui.toast("已经清空，重新开始吧！", "ok");
          EWG.router.go("#/home");
        });
      });
    },
    destroy: function () {}
  };
})(window.EWG);
