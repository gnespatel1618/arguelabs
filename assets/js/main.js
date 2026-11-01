(function () {
  "use strict";
  document.documentElement.classList.add("js");

  /* ---------- tiny storage helpers (storage can be blocked: never break the page) ---------- */
  function get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function count(path, title) {
    try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: path, title: title, event: true }); } catch (e) {}
  }

  var post = document.querySelector("article.post");

  /* ---------- on a post: remember how far you got ---------- */
  if (post) {
    var path = post.getAttribute("data-path");
    var title = post.getAttribute("data-title");
    var minutes = +post.getAttribute("data-minutes") || 0;
    var cover = document.querySelector(".post-head .cover img");
    var key = "al:read:" + path;
    var ticking = false;

    function save() {
      ticking = false;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      if (h <= 0) return;
      var p = Math.max(0, Math.min(1, window.scrollY / h));
      var prev = get(key) || {};
      set(key, { t: title, u: path, p: Math.max(p, prev.done ? 1 : 0), m: minutes, img: cover ? cover.getAttribute("src") : "", at: Date.now(), done: prev.done || p > 0.95 });
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; setTimeout(save, 400); } }, { passive: true });

    /* ---------- claims: mark as read when seen, count opens ---------- */
    var claims = [].slice.call(document.querySelectorAll(".claim[data-claim]"));
    if (claims.length) {
      var ckey = "al:claims:" + path;
      var seen = get(ckey) || [];
      var counter = document.querySelector("[data-read-count]");
      function paint() {
        claims.forEach(function (c) { if (seen.indexOf(c.getAttribute("data-claim")) > -1) c.classList.add("is-read"); });
        if (counter) counter.textContent = seen.length + " of " + claims.length + " read";
      }
      paint();
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            if (!e.isIntersecting) return;
            var n = e.target.getAttribute("data-claim");
            if (seen.indexOf(n) < 0) { seen.push(n); set(ckey, seen); paint(); }
            io.unobserve(e.target);
          });
        }, { threshold: 0.75 });
        claims.forEach(function (c) { io.observe(c.querySelector("h2")); c.querySelector("h2").setAttribute("data-claim", c.getAttribute("data-claim")); });
      }
      document.querySelectorAll("details[data-claim-ev]").forEach(function (d) {
        d.addEventListener("toggle", function () { if (d.open) count(path + "#evidence-" + d.getAttribute("data-claim-ev"), "Evidence opened: " + title); });
      });
      /* phones: claims start folded to their headline; tap to open */
      var phone = window.matchMedia("(max-width:820px)");
      claims.forEach(function (c) {
        var h = c.querySelector("h2");
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-expanded", "false");
        while (h.firstChild) b.appendChild(h.firstChild);
        h.appendChild(b);
        function sync() { b.tabIndex = phone.matches ? 0 : -1; }
        sync();
        if (phone.addEventListener) phone.addEventListener("change", sync);
        b.addEventListener("click", function () {
          if (!phone.matches) return;
          var open = c.classList.toggle("is-open");
          b.setAttribute("aria-expanded", open ? "true" : "false");
          if (open) count(path + "#claim-" + c.getAttribute("data-claim"), "Claim opened: " + title);
        });
      });
      var full = document.querySelector(".claims-end a");
      if (full) full.addEventListener("click", function () { count(path + "#full", "Full analysis: " + title); });
    }

    /* ---------- section labels: show which one you are in ---------- */
    var secs = [].slice.call(document.querySelectorAll(".sec[data-sec]"));
    if (secs.length && "IntersectionObserver" in window) {
      var cur = null;
      var so = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) {
            if (cur) cur.classList.remove("is-here");
            cur = e.target; cur.classList.add("is-here");
          }
        });
      }, { rootMargin: "-40% 0px -55% 0px" });
      secs.forEach(function (s) { so.observe(s); });
    }

    /* ---------- printing opens every piece of evidence ---------- */
    window.addEventListener("beforeprint", function () { document.querySelectorAll("details").forEach(function (d) { d.open = true; }); });
  }

  /* ---------- home and lists: "Continue" row for a post you left halfway ---------- */
  var cont = document.querySelector("[data-continue]");
  if (cont) {
    var best = null;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k.indexOf("al:read:") !== 0) continue;
        var r = get(k);
        if (!r || r.done || r.p < 0.04 || r.p > 0.95) continue;
        if (!document.querySelector('.row[data-path="' + r.u + '"]')) continue;
        if (!best || r.at > best.at) best = r;
      }
    } catch (e) {}
    if (best) {
      cont.href = best.u;
      cont.querySelector("[data-continue-t]").textContent = best.t;
      cont.querySelector("[data-continue-d]").textContent = "Continue · " + Math.round(best.p * 100) + "% read";
      var left = Math.max(1, Math.round(best.m * (1 - best.p)));
      cont.querySelector("[data-continue-x]").textContent = left + " min left";
      var im = cont.querySelector("[data-continue-img]");
      var src = document.querySelector('.row[data-path="' + best.u + '"] .thumb');
      if (src) { im.src = src.getAttribute("src"); im.hidden = false; }
      cont.hidden = false;
    }
  }

  /* ---------- enlarge a chart or figure ---------- */
  var dlg = null;
  function open(node, label) {
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.className = "zoom";
      dlg.innerHTML = '<div class="bar"><span></span><button type="button" aria-label="Close">×</button></div><div class="body"></div>';
      dlg.querySelector("button").addEventListener("click", function () { dlg.close(); });
      dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
      document.body.appendChild(dlg);
    }
    dlg.querySelector(".bar span").textContent = label || "Figure";
    var b = dlg.querySelector(".body");
    b.innerHTML = "";
    b.appendChild(node);
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
  }
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-enlarge]");
    if (btn) {
      var fig = btn.closest("figure");
      var svg = fig && fig.querySelector("svg");
      var lab = fig && fig.querySelector(".lab");
      if (svg) open(svg.cloneNode(true), lab ? lab.textContent : "");
      return;
    }
    var a = e.target.closest("[data-enlarge-img]");
    if (a && window.matchMedia("(max-width:820px)").matches) {
      e.preventDefault();
      var img = new Image(); img.src = a.getAttribute("href"); img.alt = (a.querySelector("img") || {}).alt || "";
      var f = a.closest("figure"); var l = f && f.querySelector(".lab");
      open(img, l ? l.textContent : "");
    }
  });
})();
