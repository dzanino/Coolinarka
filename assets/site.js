(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  var dataEl = document.getElementById("ck-data");
  var D = dataEl ? JSON.parse(dataEl.textContent) : {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var fill = function (s, a, b) { return s.replace(/%(?:1\$)?(?:lld|@)/, a).replace(/%(?:2\$)?(?:lld|@)/, b); };
  var pos = function (s, a, b) { return s.replace(/%1\$lld/, a).replace(/%2\$lld/, b); };
  function applyTheme(id, mode) {
    var t = D.themes && (D.themes.filter(function (x) { return x.id === id; })[0] || D.themes[0]);
    if (!t) return;
    var dark = mode === "dark" || (mode !== "light" && matchMedia("(prefers-color-scheme: dark)").matches);
    var p = dark ? t.dark : t.light;
    var map = { "--bg": "background", "--card": "card", "--text": "text", "--t2": "textSecondary", "--accent": "accent", "--on-accent": "onAccent", "--soft": "accentSoft", "--on-soft": "onAccentSoft", "--hi": "highlight", "--sec": "secondary", "--sep": "separator" };
    Object.keys(map).forEach(function (k) { doc.style.setProperty(k, p[map[k]]); });
    doc.style.setProperty("--head", t.font);
    doc.style.colorScheme = dark ? "dark" : "light";
    if (mode === "light" || mode === "dark") doc.setAttribute("data-mode", mode); else doc.removeAttribute("data-mode");
    $$(".brand img, .final img").forEach(function (i) { i.src = D.root + "assets/icons/" + t.id + ".webp"; });
    $$(".swatch").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.theme === t.id)); });
    $$("[data-mode-btn]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.modeBtn === (mode || "auto"))); });
  }
  var theme = store.get("ck.theme") || "sefkucharka", mode = store.get("ck.mode") || "auto";
  if (D.themes) {
    applyTheme(theme, mode);
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () { applyTheme(theme, mode); });
    $$(".swatch").forEach(function (b) { b.addEventListener("click", function () { theme = b.dataset.theme; store.set("ck.theme", theme); applyTheme(theme, mode); }); });
    $$("[data-mode-btn]").forEach(function (b) { b.addEventListener("click", function () { mode = b.dataset.modeBtn; store.set("ck.mode", mode); applyTheme(theme, mode); }); });
    var big = $("[data-big]");
    if (big) {
      var setBig = function (on) { doc.classList.toggle("big", on); big.setAttribute("aria-pressed", String(on)); };
      setBig(store.get("ck.big") === "1");
      big.addEventListener("click", function () { var on = !doc.classList.contains("big"); store.set("ck.big", on ? "1" : "0"); setBig(on); });
    }
  }
  var hello = $("[data-greeting]");
  if (hello && D.ui) {
    var h = new Date().getHours();
    hello.textContent = h < 4 ? D.ui.hi_night : h < 10 ? D.ui.hi_morning : h < 14 ? D.ui.hi_day : h < 17 ? D.ui.hi_afternoon : D.ui.hi_evening;
  }
  (function () {
    var box = $("[data-suggest]");
    if (!box || !D.langs || store.get("ck.suggest") === "no") return;
    var ls = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ""];
    for (var i = 0; i < ls.length; i++) {
      var code = String(ls[i]).toLowerCase().slice(0, 2);
      if (code === D.lang) return;
      if (D.langs[code]) {
        var a = $("a", box);
        a.href = D.langs[code].href; a.textContent = D.langs[code].suggest; a.lang = code;
        box.hidden = false;
        $("button", box).addEventListener("click", function () { store.set("ck.suggest", "no"); box.hidden = true; });
        return;
      }
    }
  })();
  function amount(v, unit) {
    if (unit === "metric") { var s = v >= 100 ? 10 : v >= 10 ? 5 : 1; v = Math.round(v / s) * s; }
    else v = Math.round(v * 4) / 4;
    var whole = Math.floor(v), rest = v - whole, g = { 0.25: "¼", 0.5: "½", 0.75: "¾" }[rest];
    if (!g) return String(whole || v);
    return whole ? whole + " " + g : g;
  }
  function line(item, factor) {
    if (item.a == null) return item.raw;
    return amount(item.a * factor, item.metric ? "metric" : "") + item.rest;
  }
  (function () {
    var root = $("#save"), R = D.recipe;
    if (!root || !R) return;
    var post = $(".post", root), card = $(".recipe", root), go = $("[data-save]", root), again = $("[data-again]", root);
    var base = R.servings, n = base, list = $("[data-lines]", root), label = $("[data-servings]", root);
    function draw() {
      label.textContent = D.ui.servings.replace("%lld", n);
      list.innerHTML = "";
      R.ingredients.forEach(function (it, i) {
        var li = document.createElement("li"), id = "ing" + i;
        li.innerHTML = '<input type="checkbox" id="' + id + '"><label for="' + id + '"><span></span></label>';
        $("span", li).textContent = line(it, n / base);
        list.appendChild(li);
      });
    }
    draw();
    card.classList.add("wait");
    go.addEventListener("click", function () { post.classList.add("done"); card.classList.remove("wait"); go.hidden = true; again.hidden = false; n = base; draw(); });
    again.addEventListener("click", function () { post.classList.remove("done"); card.classList.add("wait"); go.hidden = false; again.hidden = true; });
    $("[data-less]", root).addEventListener("click", function () { if (n > 1) { n--; draw(); } });
    $("[data-more]", root).addEventListener("click", function () { if (n < 24) { n++; draw(); } });
  })();
  (function () {
    var root = $("#cook"), R = D.recipe;
    if (!root || !R) return;
    var i = 0, text = $("[data-step]", root), count = $("[data-count]", root), bar = $(".bar i", root), back = $("[data-back]", root), next = $("[data-next]", root), tm = $("[data-timer]", root);
    var left = 0, tick = null, ended = false, audio = null, sound = null;
    function wake() {
      try {
        var A = window.AudioContext || window.webkitAudioContext;
        if (!A) return;
        audio = audio || new A();
        if (audio.state === "suspended") audio.resume();
        if (!sound) {
          sound = "loading";
          fetch(root.getAttribute("data-ding") || "assets/timer_ding.wav").then(function (r) { return r.arrayBuffer(); })
            .then(function (b) { audio.decodeAudioData(b, function (buf) { sound = buf; }, function () { sound = null; }); })
            .catch(function () { sound = null; });
        }
      } catch (e) { audio = null; }
    }
    function ding() {
      if (!audio) return;
      if (sound && sound !== "loading") {
        try { var src = audio.createBufferSource(); src.buffer = sound; src.connect(audio.destination); src.start(); return; } catch (e) {}
      }
      try {
        var t0 = audio.currentTime, out = audio.createGain();
        out.gain.value = 0.35; out.connect(audio.destination);
        [[1, 1, 1.6], [1.003, 0.6, 1.4], [2.76, 0.45, 0.7], [5.4, 0.22, 0.35], [8.93, 0.12, 0.18]].forEach(function (p) {
          var o = audio.createOscillator(), g = audio.createGain();
          o.type = "sine"; o.frequency.value = 1480 * p[0];
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.linearRampToValueAtTime(p[1], t0 + 0.0015);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + p[2] * 3);
          o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + 2.6);
        });
      } catch (e) {}
    }
    function clock(s) { return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
    function drawTimer() {
      var sec = R.steps[i].seconds;
      tm.hidden = !sec;
      if (!sec) return;
      tm.classList.toggle("on", !!tick); tm.classList.toggle("end", ended);
      tm.textContent = ended ? D.ui.timerDone : tick ? clock(left) : D.ui.timerStart.replace("%@", clock(sec));
    }
    function stop() { if (tick) clearInterval(tick); tick = null; ended = false; }
    function draw() {
      text.textContent = R.steps[i].text;
      count.textContent = pos(D.ui.stepOf.replace("%lld", "%1$lld").replace("%lld", "%2$lld"), i + 1, R.steps.length);
      bar.style.width = ((i + 1) / R.steps.length * 100) + "%";
      back.disabled = i === 0;
      next.textContent = i === R.steps.length - 1 ? D.ui.done : D.ui.next;
      drawTimer();
    }
    next.addEventListener("click", function () { stop(); i = i === R.steps.length - 1 ? 0 : i + 1; draw(); });
    back.addEventListener("click", function () { stop(); i = Math.max(0, i - 1); draw(); });
    tm.addEventListener("click", function () {
      wake();
      if (tick || ended) { stop(); drawTimer(); return; }
      left = R.steps[i].seconds;
      tick = setInterval(function () {
        left -= 5;
        if (left <= 0) { clearInterval(tick); tick = null; ended = true; ding(); try { navigator.vibrate && navigator.vibrate(200); } catch (e) {} }
        drawTimer();
      }, 170);
      drawTimer();
    });
    draw();
  })();
  (function () {
    var root = $("#shop"), S = D.shop;
    if (!root || !S) return;
    var cs = $("[data-country]", root), ss = $("[data-store]", root), list = $("[data-list]", root);
    var names; try { names = new Intl.DisplayNames([D.htmlLang], { type: "region" }); } catch (e) { names = null; }
    var flag = function (c) { return String.fromCodePoint.apply(null, c.split("").map(function (x) { return 127397 + x.charCodeAt(0); })); };
    var countries = Object.keys(S.stores).map(function (c) { return { c: c, n: names ? names.of(c) : c }; }).sort(function (a, b) { return a.n.localeCompare(b.n, D.htmlLang); });
    countries.forEach(function (x) { var o = document.createElement("option"); o.value = x.c; o.textContent = flag(x.c) + " " + x.n; cs.appendChild(o); });
    var region = (navigator.language || "").split("-")[1];
    cs.value = S.stores[region] ? region : S.country;
    function drawStores() {
      ss.innerHTML = "";
      S.stores[cs.value].forEach(function (s, i) { var o = document.createElement("option"); o.value = i; o.textContent = s.name; ss.appendChild(o); });
      drawList();
    }
    function drawList() {
      var st = S.stores[cs.value][ss.value || 0];
      list.innerHTML = "";
      S.items.forEach(function (it, i) {
        var term = it.terms[st.language] || it.terms.en, li = document.createElement("li");
        li.innerHTML = '<input type="checkbox" aria-label=""><span><b></b><small class="from"></small><small class="term"></small></span><a target="_blank" rel="noopener noreferrer">↗</a>';
        $("b", li).style.fontWeight = "500"; $("b", li).textContent = it.text;
        $(".from", li).textContent = it.merged ? D.ui.merged : "";
        $(".term", li).textContent = D.ui.searching.replace("%@", term);
        var a = $("a", li); a.href = st.url.replace("{q}", encodeURIComponent(term)); a.setAttribute("aria-label", D.ui.open + ": " + term); a.title = D.ui.open;
        var c = $("input", li); c.setAttribute("aria-label", it.text); c.addEventListener("change", function () { li.classList.toggle("off", c.checked); });
        list.appendChild(li);
      });
    }
    cs.addEventListener("change", drawStores); ss.addEventListener("change", drawList);
    // Ukážka „recept v jazyku stránky, nákup v Tescu v cudzine“: prepne krajinu a obchod a ukáže zoznam.
    var preset = $("[data-preset]", root);
    if (preset) {
      if (!S.stores[preset.dataset.preset]) preset.hidden = true;
      preset.addEventListener("click", function () {
        cs.value = preset.dataset.preset;
        drawStores();
        var tesco = S.stores[cs.value].findIndex(function (s) { return s.name === "Tesco"; });
        if (tesco > 0) { ss.value = tesco; drawList(); }
        list.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
    drawStores();
  })();
  (function () {
    var root = $("#quiz");
    if (!root) return;
    var items = $$(".qitem", root), end = $(".qend", root), score = 0, now = 0;
    function show(i) { items.forEach(function (x, j) { x.classList.toggle("now", j === i); }); end.hidden = i < items.length; if (i >= items.length) finish(); }
    function finish() {
      $("[data-score]", end).textContent = D.ui.score.replace("{score}", score).replace("{total}", items.length);
      $("[data-verdict]", end).textContent = score >= Math.ceil(items.length * 0.7) ? D.ui.finalGood : D.ui.finalBad;
    }
    items.forEach(function (item, i) {
      var opts = $$(".opts button", item), right = +item.dataset.right, punch = $(".punch", item), nx = $(".qnext", item);
      punch.hidden = true; nx.hidden = true;
      opts.forEach(function (b, k) {
        b.addEventListener("click", function () {
          var ok = k === right;
          if (ok) score++;
          opts.forEach(function (x, m) { x.disabled = true; if (m === right) x.classList.add("right"); else if (m === k) x.classList.add("bad"); });
          $("b", punch).textContent = ok ? D.ui.right : D.ui.wrong;
          punch.hidden = false; nx.hidden = false; nx.focus({ preventScroll: true });
        });
      });
      nx.addEventListener("click", function () { now = i + 1; show(now); });
    });
    $("[data-again]", end).addEventListener("click", function () {
      score = 0; now = 0;
      items.forEach(function (item) {
        $$(".opts button", item).forEach(function (x) { x.disabled = false; x.classList.remove("right", "bad"); });
        $(".punch", item).hidden = true; $(".qnext", item).hidden = true;
      });
      show(0);
    });
    show(0);
  })();
  (function () {
    var gal = $(".gal");
    if (!gal) return;
    var step = function (d) { var f = $("figure", gal); gal.scrollBy({ left: d * (f.offsetWidth + 20), behavior: "smooth" }); };
    $$("[data-gal]").forEach(function (b) { b.addEventListener("click", function () { step(+b.dataset.gal); }); });
  })();
  (function () {
    fetch((D.root || "") + "android.json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (c) {
      if (!c || typeof c.live !== "boolean") return;
      var state = c.live ? "live" : (c.test === true ? "test" : "soon");
      $$("[data-android]").forEach(function (el) { el.hidden = el.dataset.android !== state; });
      if (c.live && typeof c.url === "string" && /^https:\/\/play\.google\.com\//.test(c.url)) $$("a[data-android=live], a[data-android-link]").forEach(function (a) { a.href = c.url; });
      if (c.live) $$('script[type="application/ld+json"]').forEach(function (s) {
        try {
          var ld = JSON.parse(s.textContent);
          if (ld["@type"] !== "SoftwareApplication") return;
          ld.operatingSystem = "iOS, iPadOS, Android";
          var urls = [].concat(ld.downloadUrl || []);
          if (urls.indexOf(c.url) < 0) urls.push(c.url);
          ld.downloadUrl = urls;
          s.textContent = JSON.stringify(ld);
        } catch (e) {}
      });
    }).catch(function () {});
  })();
  (function () {
    var ua = navigator.userAgent || "", ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1), and = /Android/i.test(ua);
    var a = document.getElementById("android"), i = document.getElementById("ios");
    if (a && ios) a.hidden = true;
    if (i && and) i.hidden = true;
  })();
  (function () {
    var API = "https://abacus.jasoncameron.dev", NS = "clk-web-7h4q", START = "2026-11-07";
    var LIVE = /(^|\.)coolinarka\.eu$|^dzanino\.github\.io$/.test(location.hostname);
    var OWN = "ck-own", SEEN = "ck-v";
    function day(offset) {
      var d = new Date(Date.now() - (offset || 0) * 86400000);
      try { return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Bratislava" }).format(d); } catch (e) { return d.toISOString().slice(0, 10); }
    }
    function key(ymd) { return "d" + ymd.replace(/-/g, ""); }
    function session(k, v) {
      try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; }
    }
    var ua = navigator.userAgent || "";
    var bot = navigator.webdriver || /bot|crawl|spider|slurp|preview|lighthouse|headless|pingdom|monitor/i.test(ua);
    if (LIVE && !bot && store.get(OWN) !== "1" && !session(SEEN)) {
      session(SEEN, "1");
      var opt = { mode: "cors", keepalive: true, credentials: "omit" };
      ["tot", key(day(0)), "l-" + (D.lang || "sk")].forEach(function (k) {
        fetch(API + "/hit/" + NS + "/" + k, opt).catch(function () {});
      });
    }
    function get(k) {
      return fetch(API + "/get/" + NS + "/" + k, { mode: "cors", credentials: "omit" })
        .then(function (r) { return r.ok ? r.json() : { value: 0 }; })
        .then(function (j) { return j && j.value > 0 ? j.value : 0; })
        .catch(function () { return null; });
    }
    function fmt(n) { return n === null ? "-" : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }
    var panel = null;
    function close() { if (panel) { panel.remove(); panel = null; } }
    function open() {
      if (panel) return close();
      if (store.get(OWN) === null) store.set(OWN, "1");
      var langs = ["sk", "en", "cs", "de", "it", "pl", "hu", "es", "fr", "pt", "uk", "hi", "ko", "zh"];
      panel = document.createElement("div");
      panel.className = "fz";
      panel.setAttribute("role", "dialog");
      panel.innerHTML = '<div class="fzh"><b>Návštevnosť Coolinarka</b><button type="button" aria-label="Zavrieť">×</button></div><div data-x>Načítavam…</div>' +
        '<label><input type="checkbox"> Nepočítať návštevy z tohto zariadenia</label>';
      document.body.appendChild(panel);
      $("button", panel).onclick = close;
      var cb = $("input", panel);
      cb.checked = store.get(OWN) === "1";
      cb.onchange = function () { store.set(OWN, cb.checked ? "1" : "0"); };
      var keys = ["tot"];
      for (var i = 0; i < 7; i++) keys.push(key(day(i)));
      keys = keys.concat(langs.map(function (l) { return "l-" + l; }));
      Promise.all(keys.map(get)).then(function (v) {
        if (!panel) return;
        var total = v[0], days = Math.max(1, Math.floor((Date.parse(day(0)) - Date.parse(START)) / 86400000) + 1);
        var week = v.slice(1, 8).reduce(function (a, b) { return a + (b || 0); }, 0);
        var avg = total === null ? null : (total / days).toFixed(1).replace(".", ",");
        var since = START.split("-").reverse().map(Number).join(". ");
        var rows = langs.map(function (l, i) { return { l: l, n: v[8 + i] }; }).filter(function (r) { return r.n > 0; })
          .sort(function (a, b) { return b.n - a.n; }).map(function (r) { return r.l + " " + fmt(r.n); }).join(" · ");
        $("[data-x]", panel).innerHTML = '<div class="fzg"><span>Celkom</span><b>' + fmt(total) + '</b><span>Denný priemer</span><b>' + (avg === null ? "-" : avg) +
          '</b><span>Dnes</span><b>' + fmt(v[1]) + '</b><span>Včera</span><b>' + fmt(v[2]) + '</b><span>Posledných 7 dní</span><b>' + fmt(week) + '</b></div>' +
          (rows ? '<p>Podľa jazyka: ' + rows + '</p>' : "") +
          '<p>Počíta sa od ' + since + ' (' + days + (days === 1 ? " deň" : days < 5 ? " dni" : " dní") + '). Návšteva = prvé otvorenie webu v okne prehliadača; roboty sa nepočítajú.</p>';
      });
    }
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    var clicks = 0, timer = null;
    document.addEventListener("click", function (e) {
      if (!e.target.closest || !e.target.closest("[data-fz]")) return;
      clicks++;
      clearTimeout(timer);
      timer = setTimeout(function () { clicks = 0; }, 1200);
      if (clicks >= 3) { clicks = 0; open(); }
    });
  })();
})();
document.querySelectorAll('[data-until]').forEach(function(el){if(Date.now()>=new Date(el.dataset.until+'T00:00:00+01:00').getTime())el.textContent=el.dataset.after;});
