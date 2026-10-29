/* ============================================================
   ui.js · 通用反馈：星星、彩带、抖动、弹层、朗读按钮
   ============================================================ */
window.EWG = window.EWG || {};
(function (EWG) {
  "use strict";

  var fxRoot = null;
  var toastRoot = null;
  var modalRoot = null;

  function $(sel, root) { return (root || document).querySelector(sel); }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function init() {
    fxRoot = document.getElementById("fx-root");
    toastRoot = document.getElementById("toast-root");
    modalRoot = document.getElementById("modal-root");

    // 全局朗读按钮代理
    document.addEventListener("click", function (e) {
      var btn = e.target && e.target.closest ? e.target.closest("[data-speak]") : null;
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      var text = btn.getAttribute("data-speak");
      var ok = EWG.audio.speak(text);
      if (!ok) { toast("这台手机暂时听不到发音，我们先看中文练吧", "warn"); return; }
      btn.classList.add("playing");
      setTimeout(function () { btn.classList.remove("playing"); }, 900);
    }, true);

    // 首次交互解锁音频
    var unlockOnce = function () {
      EWG.audio.unlock();
      document.removeEventListener("pointerdown", unlockOnce);
    };
    document.addEventListener("pointerdown", unlockOnce);

    window.addEventListener("beforeunload", function () {
      if (EWG.store) EWG.store.save(true);
    });

    // 关闭弹层：点遮罩 / 按 Esc
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modalRoot && modalRoot.classList.contains("on")) closeModal();
    });
  }

  /* ---------------- 星星 ---------------- */
  function stars(n, cls) {
    var out = '<span class="stars ' + (cls || "") + '" aria-label="掌握度 ' + n + ' 星">';
    for (var i = 1; i <= 5; i++) {
      out += '<span class="s' + (i <= n ? " on" : "") + '">★</span>';
    }
    return out + "</span>";
  }

  /* ---------------- Toast ---------------- */
  function toast(msg, type) {
    if (!toastRoot) toastRoot = document.getElementById("toast-root");
    if (!toastRoot) return;
    var el = document.createElement("div");
    el.className = "toast " + (type || "");
    el.textContent = msg;
    toastRoot.appendChild(el);
    setTimeout(function () {
      el.classList.add("out");
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 320);
    }, 1700);
  }

  /* ---------------- 星星迸射 ---------------- */
  var STAR_GLYPHS = ["★", "⭐", "✦", "✧", "🌟"];

  function burst(x, y, count) {
    if (!fxRoot) fxRoot = document.getElementById("fx-root");
    if (!fxRoot) return;
    count = count || 12;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    for (var i = 0; i < count; i++) {
      var s = document.createElement("span");
      s.className = "fx-star";
      s.textContent = STAR_GLYPHS[Math.floor(Math.random() * STAR_GLYPHS.length)];
      var ang = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      var dist = 60 + Math.random() * 110;
      s.style.left = x + "px";
      s.style.top = y + "px";
      s.style.setProperty("--dx", Math.cos(ang) * dist + "px");
      s.style.setProperty("--dy", (Math.sin(ang) * dist - 40) + "px");
      s.style.setProperty("--rot", (Math.random() * 520 - 260) + "deg");
      s.style.fontSize = (14 + Math.random() * 14) + "px";
      s.style.animationDelay = (Math.random() * 0.08) + "s";
      fxRoot.appendChild(s);
      (function (node) {
        setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 1000);
      })(s);
    }
  }

  function burstAt(el, count) {
    if (!el) return;
    var r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, count);
  }

  /* ---------------- 彩带 ---------------- */
  function confetti(n) {
    if (!fxRoot) fxRoot = document.getElementById("fx-root");
    if (!fxRoot) return;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    n = n || 40;
    var colors = ["#FF7A45", "#FFB020", "#4CC9F0", "#7B61FF", "#4ADE80", "#FF6FA5"];
    for (var i = 0; i < n; i++) {
      var c = document.createElement("i");
      c.className = "fx-confetti";
      c.style.left = Math.random() * 100 + "vw";
      c.style.background = colors[i % colors.length];
      c.style.setProperty("--dx", (Math.random() * 120 - 60) + "px");
      c.style.setProperty("--rot", (Math.random() * 900 - 450) + "deg");
      c.style.setProperty("--dur", (1.8 + Math.random() * 1.6) + "s");
      c.style.animationDelay = (Math.random() * 0.5) + "s";
      c.style.width = (6 + Math.random() * 6) + "px";
      c.style.height = (9 + Math.random() * 8) + "px";
      fxRoot.appendChild(c);
      (function (node) {
        setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 3600);
      })(c);
    }
  }

  function shake(el) {
    if (!el) return;
    el.classList.remove("shake");
    void el.offsetWidth;
    el.classList.add("shake");
    setTimeout(function () { el.classList.remove("shake"); }, 460);
  }

  /* ---------------- 弹层 ---------------- */
  var modalOnClose = null;

  function modal(html, onClose) {
    if (!modalRoot) modalRoot = document.getElementById("modal-root");
    if (!modalRoot) return;
    modalOnClose = onClose || null;
    modalRoot.innerHTML = '<div class="modal-mask"></div><div class="modal-card">' + html + "</div>";
    modalRoot.classList.add("on");
    var mask = modalRoot.querySelector(".modal-mask");
    if (mask) mask.addEventListener("click", function () {
      if (modalRoot.querySelector("[data-lock]")) return;
      closeModal();
    });
  }

  function closeModal() {
    if (!modalRoot) return;
    modalRoot.classList.remove("on");
    modalRoot.innerHTML = "";
    var cb = modalOnClose;
    modalOnClose = null;
    if (cb) cb();
  }

  /* ---------------- 时间格式 ---------------- */
  function fmtTime(sec) {
    sec = Math.max(0, Math.round(sec || 0));
    if (sec < 60) return sec + " 秒";
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    if (m < 60) return m + " 分" + (s ? " " + s + " 秒" : "");
    var h = Math.floor(m / 60);
    return h + " 小时 " + (m % 60) + " 分";
  }

  function pad2(n) { return n < 10 ? "0" + n : "" + n; }

  function fmtDate(ts) {
    if (!ts) return "—";
    var d = new Date(ts);
    return (d.getMonth() + 1) + "/" + d.getDate();
  }

  /* ---------------- 朗读按钮 ---------------- */
  function speakBtn(text, cls) {
    // 不再按可用性禁用：很多手机浏览器首次 getVoices() 返回空，
    // 禁用会让按钮彻底点不动。改为始终可点，失败时给友好提示。
    return '<button class="speak-btn ' + (cls || "") + '" type="button" data-speak="' + esc(text) +
      '" aria-label="朗读 ' + esc(text) + '">🔊</button>';
  }

  function refreshTopbar() {
    if (EWG.app && EWG.app.refreshTopbar) EWG.app.refreshTopbar();
  }

  /* ---------------- 强调色 ---------------- */
  function themeVars(theme) {
    var t = EWG.THEMES[theme] || EWG.THEMES.school;
    return "--accent:" + t.color + ";--accent-soft:" + t.soft + ";";
  }

  EWG.ui = {
    $: $,
    esc: esc,
    init: init,
    stars: stars,
    toast: toast,
    burst: burst,
    burstAt: burstAt,
    confetti: confetti,
    shake: shake,
    modal: modal,
    closeModal: closeModal,
    fmtTime: fmtTime,
    fmtDate: fmtDate,
    pad2: pad2,
    speakBtn: speakBtn,
    refreshTopbar: refreshTopbar,
    themeVars: themeVars
  };
})(window.EWG);
