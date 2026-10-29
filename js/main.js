/* ============================================================
   main.js · 启动、顶栏、全局交互
   ============================================================ */
window.EWG = window.EWG || {};
(function (EWG) {
  "use strict";

  var topbar, bound = false;

  function renderTopbar() {
    var data = EWG.store.data;
    var st = EWG.store.streak();
    topbar.innerHTML =
      '<button class="brand" type="button" data-go="#/home" aria-label="回到首页">' +
        '<span class="brand-badge">🦸</span>' +
        '<span class="brand-text"><b>单词小英雄</b><span>WORD HERO</span></span>' +
      '</button>' +
      '<span class="topbar-spacer"></span>' +
      '<div class="nav-links">' +
        '<button class="nav-link" type="button" data-go="#/home" data-nav="home">首页</button>' +
        '<button class="nav-link" type="button" data-go="#/wordbook" data-nav="wordbook">单词本</button>' +
        '<button class="nav-link" type="button" data-go="#/report" data-nav="report">家长报告</button>' +
      '</div>' +
      '<div class="stat-pill" id="pillStars" title="累计获得的星星">' +
        '<span class="ic">⭐</span><span id="pillStarsNum">' + (data.starTotal || 0) + '</span>' +
        '<small>星星</small></div>' +
      '<div class="stat-pill" id="pillStreak" title="连续打卡天数">' +
        '<span class="ic">🔥</span><span>' + st + '</span><small>连击天数</small></div>' +
      '<button class="icon-btn" type="button" data-go="#/settings" title="设置" aria-label="设置">⚙️</button>';

    markNav(EWG.router ? EWG.router.currentName() : "home");
  }

  function markNav(name) {
    if (!topbar) return;
    var map = { home: "home", wordbook: "wordbook", report: "report", settings: "" };
    var target = map[name] || "";
    var links = topbar.querySelectorAll("[data-nav]");
    for (var i = 0; i < links.length; i++) {
      links[i].classList.toggle("is-on", links[i].getAttribute("data-nav") === target);
    }
  }

  function refreshTopbar() {
    if (!topbar) return;
    var data = EWG.store.data;
    var num = document.getElementById("pillStarsNum");
    if (num) num.textContent = data.starTotal || 0;
    var pillS = document.getElementById("pillStars");
    if (pillS) {
      pillS.classList.remove("pop");
      void pillS.offsetWidth;
      pillS.classList.add("pop");
    }
    var pillK = document.getElementById("pillStreak");
    if (pillK) {
      var st = EWG.store.streak();
      var span = pillK.querySelector("span:nth-child(2)");
      if (span) span.textContent = st;
    }
  }

  function bindGlobal() {
    if (bound) return;
    bound = true;

    document.addEventListener("click", function (e) {
      var t = e.target && e.target.closest ? e.target.closest("[data-go]") : null;
      if (!t) return;
      e.preventDefault();
      EWG.router.go(t.getAttribute("data-go"));
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !document.querySelector("#modal-root.on")) {
        var name = EWG.router.currentName();
        if (name === "play") {
          e.preventDefault();
          EWG.router.go("#/home");
        } else if (name !== "home") {
          e.preventDefault();
          EWG.router.go("#/home");
        }
      }
      if (e.key === "Enter" && e.target && e.target.tagName === "INPUT") {
        e.target.blur();
      }
    });
  }

  function boot() {
    topbar = document.getElementById("topbar");
    EWG.store.load();
    renderTopbar();
    bindGlobal();
    EWG.ui.init();
    EWG.router.start();

    if (!EWG.store.isPersistent()) {
      EWG.ui.toast("这台电脑存不了成绩，本次进度只在当前窗口有效", "warn");
    }

    // 语音可用性提示（延迟一点，等 voices 加载）
    setTimeout(function () {
      if (!EWG.audio.hasVoice()) {
        EWG.ui.toast("暂时读不出英文发音，可以先玩看词选义哦", "warn");
      }
    }, 1600);
  }

  EWG.app = {
    refreshTopbar: refreshTopbar,
    markNav: markNav,
    onRouteChange: function (r) {
      markNav(r.name);
      // 路由切换时收起可能还开着的结算弹层
      var mr = document.getElementById("modal-root");
      if (mr && mr.classList.contains("on")) EWG.ui.closeModal();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window.EWG);
