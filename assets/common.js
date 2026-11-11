/* Bharat Fine Dine — shared behaviour (both pages)
   ==============================================================
   SITE CONFIG — edit these before going live.
   GA4:   Analytics > Admin > Data Streams > Measurement ID (G-XXXXXXXXXX)
   Pixel: Meta Events Manager > Data Sources > Pixel ID (15–16 digits)
   Until both REPLACE_ME values are replaced, no data is collected.
   ============================================================== */
window.BFD = {
  GA4_ID: "G-7H18WZV85X",       // GA4 property "bharatfinedine.com" in the client's Google account, created 6 Oct 2026
  PIXEL_ID: "1766789034649415",   // Meta dataset "Bharat Fine Dine Website", created 6 Oct 2026 in the client's portfolio
  WHATSAPP: "919126268181",       // bookings & event enquiries go here
  OPEN_HOUR: 11, CLOSE_HOUR: 23   // 11 AM – 11 PM, India time
};

(function () {
  var C = window.BFD;
  /* ---------- analytics ----------
     The queues (dataLayer / fbq) exist immediately, so no event is ever lost,
     but the two third-party scripts only download once the page has finished
     loading and the browser is idle. Keeps them off the critical path. */
  var gaOn = C.GA4_ID.indexOf("REPLACE_ME") < 0, pxOn = C.PIXEL_ID.indexOf("REPLACE_ME") < 0;
  if (gaOn) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag("js", new Date()); gtag("config", C.GA4_ID);
  }
  if (pxOn && !window.fbq) {
    var n = window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    window._fbq = n; n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
    fbq("init", C.PIXEL_ID); fbq("track", "PageView");
  }
  function addScript(src) { var s = document.createElement("script"); s.async = true; s.src = src; document.head.appendChild(s); }
  function loadTags() {
    if (gaOn) addScript("https://www.googletagmanager.com/gtag/js?id=" + C.GA4_ID);
    if (pxOn) addScript("https://connect.facebook.net/en_US/fbevents.js");
  }
  function whenIdle() { (window.requestIdleCallback || function (f) { setTimeout(f, 1200); })(loadTags, { timeout: 3000 }); }
  if (document.readyState === "complete") whenIdle(); else window.addEventListener("load", whenIdle, { once: true });

  /* fire a conversion event: track('Lead', {...}) */
  C.track = function (name, data) {
    try { if (window.gtag) gtag("event", name === "Lead" ? "generate_lead" : name.toLowerCase(), data || {}); } catch (e) {}
    try { if (window.fbq) fbq("track", name, data || {}); } catch (e) {}
  };
  C.wa = function (text) { return "https://wa.me/" + C.WHATSAPP + "?text=" + encodeURIComponent(text); };

  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  C.reduce = reduce;
  C.EASE = "cubic-bezier(.2,.7,.2,1)";

  /* ---------- open / closed (always India time) ---------- */
  C.istHour = function () {
    try { return parseInt(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()), 10) % 24; }
    catch (e) { return new Date().getHours(); }
  };
  function setStatus() {
    var h = C.istHour(), open = h >= C.OPEN_HOUR && h < C.CLOSE_HOUR;
    document.querySelectorAll("[data-open-status]").forEach(function (el) {
      el.classList.toggle("closed", !open);
      var t = el.querySelector("[data-open-text]");
      if (t) t.textContent = open ? "Open now · till 11 PM" : "Closed now · opens 11 AM";
    });
  }
  setStatus(); setInterval(setStatus, 60000);

  /* ---------- scroll reveal ---------- */
  if (!reduce && "IntersectionObserver" in window && Element.prototype.animate) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target; io.unobserve(el);
        var kids = el.hasAttribute("data-stagger") ? Array.prototype.slice.call(el.children) : [el];
        var fromR = el.hasAttribute("data-kslide") && window.innerWidth < 820;
        kids.forEach(function (k, i) {
          k.animate([{ opacity: 0, transform: fromR ? "translateX(70px)" : "translateY(28px)" }, { opacity: 1, transform: "none" }],
            { duration: 650, delay: i * 70, easing: C.EASE, fill: "backwards" });
        });
      });
    }, { threshold: 0.12 });
    C.observe = function (root) { (root || document).querySelectorAll("[data-reveal]").forEach(function (el) { io.observe(el); }); };
    C.observe();
  } else { C.observe = function () {}; }

  /* ---------- drawer ---------- */
  var drawer = document.getElementById("drawer");
  if (drawer) {
    var opener = null;
    C.openDrawer = function (btn) { opener = btn; drawer.hidden = false; document.body.classList.add("lock"); var x = drawer.querySelector("[data-close]"); x && x.focus(); };
    C.closeDrawer = function () { drawer.hidden = true; document.body.classList.remove("lock"); opener && opener.focus && opener.focus(); };
    document.querySelectorAll("[data-drawer-open]").forEach(function (b) { b.addEventListener("click", function () { C.openDrawer(b); }); });
    drawer.querySelector("[data-close]").addEventListener("click", C.closeDrawer);
    drawer.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { drawer.hidden = true; document.body.classList.remove("lock"); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !drawer.hidden) C.closeDrawer(); });
  }

  /* ---------- page transition loader: the BFD seal "fills in" between Home and Menu ----------
     A faint (14%) seal sits on cream; a solid maroon copy rises from the bottom.
     Leaving a page: fade in, start filling, navigate. Arriving: pick up from where the
     fill was, finish it, fade out. The seal is a 9 KB PNG. */
  var SEAL = "img/BFD_seal_red.png";
  function overlay(fromPct) {
    var o = document.createElement("div"); o.setAttribute("aria-hidden", "true"); o.className = "bfd-loader";
    /* plain <img> layers (not CSS masks) so it also works when the page is opened from a local folder */
    var w = "min(34vw,148px)", im = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    o.style.cssText = "position:fixed;inset:0;z-index:9999;background:#FAF5EC;display:flex;align-items:center;justify-content:center;pointer-events:none";
    o.innerHTML = '<div style="position:relative;width:' + w + ';aspect-ratio:300/277">' +
      '<img src="' + SEAL + '" alt="" style="' + im + ';opacity:.14">' +
      '<img class="f" src="' + SEAL + '" alt="" style="' + im + ';clip-path:inset(' + (100 - fromPct) + '% 0 0 0)"></div>';
    document.body.appendChild(o); return o;
  }
  function fillTo(o, from, to, ms, ease) {
    return o.querySelector(".f").animate([{ clipPath: "inset(" + (100 - from) + "% 0 0 0)" }, { clipPath: "inset(" + (100 - to) + "% 0 0 0)" }],
      { duration: ms, easing: ease || "cubic-bezier(.3,.6,.3,1)", fill: "forwards" });
  }
  if (!reduce && Element.prototype.animate) {
    /* warm the seal into cache so the loader never shows blank */
    (window.requestIdleCallback || function (f) { setTimeout(f, 1500); })(function () { var i = new Image(); i.src = SEAL; });
    try {
      var got = sessionStorage.getItem("bfdWipe");
      if (got) {
        sessionStorage.removeItem("bfdWipe");
        var from = Math.min(90, Math.max(30, parseInt(got, 10) || 60));
        var o = overlay(from);
        fillTo(o, from, 100, 280).onfinish = function () {
          o.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: "ease-out", fill: "forwards" }).onfinish = function () { o.remove(); };
        };
      }
    } catch (e) {}
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[data-wipe]");
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      var href = a.getAttribute("href"), o = overlay(0);
      o.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "ease-out", fill: "forwards" });
      fillTo(o, 0, 85, 1400);
      setTimeout(function () {
        /* hand the exact fill level to the next page so it carries on from there */
        var p = 60, cp = getComputedStyle(o.querySelector(".f")).clipPath, mt = /inset\(([\d.]+)%/.exec(cp || "");
        if (mt) p = Math.round(100 - parseFloat(mt[1]));
        try { sessionStorage.setItem("bfdWipe", String(p)); } catch (err) {}
        location.href = href;
      }, 380);
    });
    /* coming back via the browser's back button: drop any leftover overlay */
    window.addEventListener("pageshow", function (e) { if (e.persisted) document.querySelectorAll('body>div[aria-hidden="true"][style*="9999"]').forEach(function (n) { n.remove(); }); });
  }
})();
