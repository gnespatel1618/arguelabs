(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- ordered-dither cloud textures ---------- */
  var PALETTES = {
    sky:  [[233,227,217],[214,214,226],[176,192,224],[143,168,216],[241,237,230]],
    dusk: [[241,237,230],[243,196,206],[239,150,174],[214,214,226],[176,192,224]]
  };
  var BAYER = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];

  function hash(x, y, s) {
    var h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function noise(x, y, s) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    var u = smooth(xf), v = smooth(yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, s) {
    var t = 0, amp = 0.5, f = 1;
    for (var o = 0; o < 5; o++) { t += amp * noise(x * f, y * f, s + o); f *= 2; amp *= 0.5; }
    return t;
  }

  function paint(el) {
    var pal = PALETTES[el.getAttribute("data-dither")] || PALETTES.sky;
    var seed = (el.offsetTop % 97) + 7;
    var px = window.innerWidth < 600 ? 2 : 3;
    var w = Math.max(1, Math.ceil(el.clientWidth / px));
    var h = Math.max(1, Math.ceil(el.clientHeight / px));
    var cv = el.querySelector("canvas") || el.appendChild(document.createElement("canvas"));
    cv.width = w; cv.height = h;
    var ctx = cv.getContext("2d");
    var img = ctx.createImageData(w, h), data = img.data;
    var scale = 1 / 90 * px;
    var levels = pal.length - 1;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var n = fbm(x * scale, y * scale * 1.6, seed);
        var g = n * 1.25 - 0.18 + (y / h) * 0.25;
        g = Math.min(0.999, Math.max(0, g));
        var t = BAYER[(y & 3) * 4 + (x & 3)] / 16;
        var lv = Math.min(levels, Math.floor(g * levels + t));
        var c = pal[lv], i = (y * w + x) * 4;
        data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  var dithers = [].slice.call(document.querySelectorAll("[data-dither]"));
  function paintAll() { dithers.forEach(function (el) { try { paint(el); } catch (e) {} }); }
  if (dithers.length) {
    paintAll();
    var lastW = window.innerWidth, timer;
    window.addEventListener("resize", function () {
      if (Math.abs(window.innerWidth - lastW) < 40) return;
      lastW = window.innerWidth; clearTimeout(timer); timer = setTimeout(paintAll, 200);
    });
  }

  /* ---------- typewriter ---------- */
  var el = document.querySelector(".type[data-words]");
  if (el && !reduce) {
    var words = el.getAttribute("data-words").split(","), wi = 0, ci = words[0].length, del = true;
    el.setAttribute("aria-label", words.join(", "));
    function tick() {
      var w = words[wi];
      if (del) { ci--; if (ci <= 0) { del = false; wi = (wi + 1) % words.length; } }
      else { ci++; if (ci >= words[wi].length) { del = true; el.textContent = words[wi]; return setTimeout(tick, 2200); } }
      el.textContent = words[wi].slice(0, Math.max(0, ci)) || "​";
      setTimeout(tick, del ? 45 : 85);
    }
    setTimeout(tick, 2200);
  }
})();
