/* ============================================================
   router.js · hash 路由（#/home、#/wordbook、#/play/<game>?...）
   ============================================================ */
window.EWG = window.EWG || {};
(function (EWG) {
  "use strict";

  var current = null;
  var currentKey = "";
  var currentRoute = null;

  function parse() {
    var raw = (location.hash || "").replace(/^#/, "");
    if (!raw) raw = "/home";
    var qi = raw.indexOf("?");
    var path = qi >= 0 ? raw.slice(0, qi) : raw;
    var qs = qi >= 0 ? raw.slice(qi + 1) : "";
    var params = {};
    qs.split("&").forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf("=");
      var k = decodeURIComponent(i < 0 ? kv : kv.slice(0, i));
      var v = i < 0 ? "" : decodeURIComponent(kv.slice(i + 1).replace(/\+/g, " "));
      params[k] = v;
    });
    var seg = path.split("/").filter(Boolean);
    return { name: seg[0] || "home", sub: seg[1] || "", params: params, path: path };
  }

  function resolve(r) {
    if (r.name === "play") {
      return { page: (EWG.pages && EWG.pages.play) || null, key: "play" };
    }
    return { page: (EWG.pages && EWG.pages[r.name]) || null, key: r.name };
  }

  function render() {
    var r = parse();
    var res = resolve(r);
    if (!res.page) {
      if (r.name === "home") {
        document.getElementById("view").innerHTML =
          '<div class="card center"><div class="empty"><span class="ico">🧩</span>页面还没准备好，请刷新一下</div></div>';
        return;
      }
      go("#/home");
      return;
    }

    if (current && typeof current.destroy === "function") {
      try { current.destroy(); } catch (e) { /* noop */ }
    }
    try { EWG.audio.stop(); } catch (e) { /* noop */ }

    var view = document.getElementById("view");
    view.innerHTML = "";
    window.scrollTo(0, 0);

    current = res.page;
    currentKey = res.key;
    currentRoute = r;

    try {
      current.render(view, r);
    } catch (err) {
      if (window.console) console.error("[router]", err);
      view.innerHTML = '<div class="card center"><div class="empty"><span class="ico">🛠️</span>' +
        '这一页不小心绊倒了，回首页再试试吧～</div>' +
        '<button class="btn" data-go="#/home">回首页</button></div>';
    }

    if (EWG.app && EWG.app.onRouteChange) EWG.app.onRouteChange(r);
    EWG.store.save();
  }

  function go(hash) {
    if (location.hash === hash) { render(); }
    else { location.hash = hash; }
  }

  function start() {
    window.addEventListener("hashchange", render);
    if (!location.hash) {
      location.replace("#/home");
      setTimeout(render, 0);
    } else {
      render();
    }
  }

  function refresh() { render(); }
  function currentName() { return currentRoute ? currentRoute.name : ""; }
  function params() { return currentRoute ? currentRoute.params : {}; }

  EWG.router = {
    start: start,
    go: go,
    refresh: refresh,
    parse: parse,
    currentName: currentName,
    params: params
  };
})(window.EWG);
