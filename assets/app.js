/* Bharat Fine Dine — site behaviour for index.html, menu.html and events.html.
   Each block runs only when its page has the elements it needs. */
(function () {
  "use strict";
  var CFG = {
    GA4_ID: "G-7H18WZV85X",
    PIXEL_ID: "1766789034649415",
    WHATSAPP: "919126268181",
    PHONE: "+91 91262 68181",
    OPEN_HOUR: 11, CLOSE_HOUR: 23,            // India time
    SLOTS: { Lunch: ["12:00 pm", "12:30 pm", "1:00 pm", "1:30 pm", "2:00 pm", "2:30 pm"], Dinner: ["7:00 pm", "7:30 pm", "8:00 pm", "8:30 pm", "9:00 pm", "9:30 pm", "10:00 pm"] },
    MAX_GUESTS: 20                             // larger groups go to the event planner
  };
  var K = window.BFD_KITCHENS || [];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var wa = function (text) { return "https://wa.me/" + CFG.WHATSAPP + "?text=" + encodeURIComponent(text); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  document.documentElement.classList.add("js");

  /* ---------- analytics: queues exist at once, scripts load when idle ---------- */
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date()); window.gtag("config", CFG.GA4_ID);
  if (!window.fbq) {
    var fb = window.fbq = function () { fb.callMethod ? fb.callMethod.apply(fb, arguments) : fb.queue.push(arguments); };
    window._fbq = fb; fb.push = fb; fb.loaded = true; fb.version = "2.0"; fb.queue = [];
    window.fbq("init", CFG.PIXEL_ID); window.fbq("track", "PageView");
  }
  function loadTags() {
    ["https://www.googletagmanager.com/gtag/js?id=" + CFG.GA4_ID, "https://connect.facebook.net/en_US/fbevents.js"].forEach(function (src) {
      var s = document.createElement("script"); s.async = true; s.src = src; document.head.appendChild(s);
    });
  }
  window.addEventListener("load", function () { (window.requestIdleCallback || function (f) { setTimeout(f, 1200); })(loadTags, { timeout: 3000 }); }, { once: true });
  function track(name, data) {
    try { window.gtag("event", name === "Lead" ? "generate_lead" : name.toLowerCase(), data || {}); } catch (e) {}
    try { window.fbq("track", name, data || {}); } catch (e) {}
  }

  /* ---------- time helpers (always India time) ---------- */
  function istParts() {
    try {
      var p = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).formatToParts(new Date());
      var g = function (t) { return +p.filter(function (x) { return x.type === t; })[0].value; };
      return { h: g("hour") % 24, m: g("minute") };
    } catch (e) { var d = new Date(); return { h: d.getHours(), m: d.getMinutes() }; }
  }
  function mins(t) { var m = t.match(/(\d+):(\d+)\s*(am|pm)/i); return (+m[1] % 12 + (m[3].toLowerCase() === "pm" ? 12 : 0)) * 60 + +m[2]; }
  function isOpen() { var h = istParts().h; return h >= CFG.OPEN_HOUR && h < CFG.CLOSE_HOUR; }
  $$("[data-status]").forEach(function (el) {
    var open = isOpen(); el.classList.toggle("closed", !open);
    var t = $("span", el); if (t) t.textContent = (open ? "Open now · till 11 PM" : "Closed now · opens 11 AM") + " · Latur MIDC";
  });

  /* ---------- my list (shared by menu and booking) ---------- */
  var list = store.get("bfd-list", []);
  function saveList() { store.set("bfd-list", list); }
  var onListChange = null;
  function inList(id) { return list.some(function (x) { return x.id === id; }); }

  /* =====================================================================
     HOME: the wall, the seven stops, spaces
     ===================================================================== */
  var stopEl = $("#stop");
  if (stopEl && K.length) {
    var cur = 1, wall = $("#wallScroll"), pins = $("#pins"), journey = $("#journey");
    var kind = function (k) { return k.veg === k.count ? "all veg" : k.veg === 0 ? "seafood" : k.veg + " veg"; };
    pins.innerHTML = K.filter(function (k) { return k.pin; }).map(function (k) {
      return '<button type="button" class="pin" data-stop="' + k.n + '" style="left:' + k.pin[0] + "%;top:" + k.pin[1] + '%"><span class="dot" style="--k:' + k.color + '">' + k.n + "</span>" + esc(k.name) + "</button>";
    }).join("");
    // phone: a pin whose label would be cut by the screen edge shows only its number until swiped into view
    var flipPins = function () {
      var w = wall.clientWidth, sl = wall.scrollLeft, scrolls = wall.scrollWidth > w;
      Array.prototype.forEach.call(pins.querySelectorAll(".pin"), function (b) {
        if (!b._w) { var had = b.classList.contains("flip"); b.classList.remove("flip"); b._w = b.offsetWidth; if (had) b.classList.add("flip"); }   // natural label width, measured once
        var left = b.offsetLeft - 12 - sl;                                                                                                          // from layout, so a running transition cannot skew it
        b.classList.toggle("flip", scrolls && left < w - 8 && left + b._w > w - 8);
      });
    };
    flipPins(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(flipPins); window.addEventListener("resize", flipPins); wall.addEventListener("scroll", flipPins, { passive: true });
    if (journey) journey.innerHTML = K.map(function (k) {
      return '<button type="button" class="node" data-stop="' + k.n + '" style="--k:' + k.color + '"><span class="dot">' + k.n + "</span>" + esc(k.name) + "</button>";
    }).join("");
    var renderStop = function () {
      var k = K[cur - 1], nx = K[cur % K.length];
      stopEl.innerHTML = '<div class="top"><span class="kick" style="--k:' + k.ink + '">Stop ' + k.n + " of " + K.length + '<span class="rg"> · ' + esc(k.sub) + '</span></span><button type="button" class="next" data-stop="' + nx.n + '">' + (cur < K.length ? "Next: " : "Back to: ") + esc(nx.name) + " →</button></div>" +
        '<h2 class="h3">' + esc(k.title) + '</h2><p class="line">' + esc(k.line) + "</p>" +
        k.dishes.map(function (d) { return '<div class="dish"><span class="mark' + (d.veg ? "" : " nv") + '" aria-hidden="true"></span><span class="n">' + esc(d.name) + '</span><span class="sr">' + (d.veg ? "Veg" : "Non-veg") + ".</span><b>" + esc(d.price) + "</b></div>"; }).join("") +
        '<a class="lnk" href="menu.html#k-' + k.id + '">See all ' + k.count + " " + esc(k.name) + " dishes →</a>";
      var jn = $("#jNote");
      if (jn) jn.innerHTML = "<b>" + esc(k.title) + "</b><span>" + k.dishes.map(function (d) { return esc(d.name); }).join(" · ") + '</span><a class="lnk" href="menu.html#k-' + k.id + '">See all ' + k.count + " dishes →</a>";
      $$("[data-stop]").forEach(function (b) { if (b.classList.contains("pin") || b.classList.contains("node")) b.setAttribute("aria-pressed", +b.dataset.stop === cur); });
    };
    var select = function (n, scrollWall) {
      cur = n; renderStop();
      var k = K[n - 1];
      if (scrollWall && k.pin && wall.scrollWidth > wall.clientWidth) wall.scrollTo({ left: Math.max(0, wall.scrollWidth * k.pin[0] / 100 - wall.clientWidth / 2) });
    };
    document.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-stop]"); if (!b) return;
      select(+b.dataset.stop, !b.classList.contains("pin"));
    });
    renderStop();
  }

  var sTabs = $("#stabs");
  if (sTabs) {
    var SPACES = [
      { k: "dining", name: "Fine-dine restaurant", seat: "Restaurant", img: "img/svc-dining-720.webp", desc: "Air-conditioned indoor dining across seven kitchens, with a full vegetarian menu alongside." },
      { k: "outdoor", name: "Outdoor dining", seat: "Outdoor", img: "img/svc-garden-720.webp", desc: "Open-air seating wrapped in greenery and soft light, our signature table for easy evenings." },
      { k: "bar", name: "The Bar & Lounge", seat: "Bar & Lounge", img: "img/spaces/bar-3.webp", tile: "img/spaces/thumb/bar-3.webp", desc: "A relaxed bar with a live-music corner, a curated pour and fair prices." },
      { k: "private", name: "Private dining rooms", seat: "Private room", img: "img/svc-private-720.webp", desc: "Marble-table rooms for celebrations and business lunches. Candlelight on request." },
      { k: "meeting", name: "Board & meeting rooms", seat: null, img: "img/svc-meeting-720.webp", desc: "Board rooms with screens and catering on tap, built for meetings and offsites." },
      { k: "hall", name: "Banquet halls", seat: null, img: "img/svc-hall-720.webp", desc: "Samiksha and Sanskruti: two 300+ seat halls for weddings, receptions and functions, with full catering." }
    ];
    var sp = 0, lb = $("#lb"), lbList = [], lbI = 0;
    sTabs.innerHTML = SPACES.map(function (s, i) { return '<button type="button" class="chip" data-sp="' + i + '" aria-pressed="' + (i === 0) + '"><img src="' + (s.tile || s.img.replace("-720.", "-600.")) + '" alt="" width="600" height="400" loading="lazy" decoding="async"><span>' + esc(s.name) + "</span></button>"; }).join("");
    var photos = function (s) { var a = []; for (var n = 1; n <= 6; n++) a.push({ t: "img/spaces/t400/" + s.k + "-" + n + ".webp", f: "img/spaces/" + s.k + "-" + n + ".webp", alt: s.name + ", photo " + n }); return a; };
    var renderSpace = function () {
      var s = SPACES[sp];
      $("#sImg").src = s.img; $("#sImg").alt = s.name; $("#sName").textContent = s.name; $("#sDesc").textContent = s.desc;
      $("#sThumbs").innerHTML = photos(s).slice(0, 4).map(function (p, i) { return '<button type="button" data-ph="' + i + '" aria-label="Open ' + esc(p.alt) + '"><img src="' + p.t + '" alt="" width="400" height="266" loading="lazy"></button>'; }).join("");
      var a = $("#sAct");
      if (s.seat) { a.textContent = "Plan a table here"; a.setAttribute("href", "#plan"); a.dataset.plan = s.seat; }
      else { a.textContent = "Open the event planner"; a.setAttribute("href", "events.html"); delete a.dataset.plan; }
      $$(".chip", sTabs).forEach(function (c, i) { c.setAttribute("aria-pressed", i === sp); });
    };
    sTabs.addEventListener("click", function (e) { var b = e.target.closest("[data-sp]"); if (b) { sp = +b.dataset.sp; renderSpace(); } });
    var lbShow = function () { var p = lbList[lbI]; $("#lbImg").src = p.f; $("#lbImg").alt = p.alt; $("#lbPos").textContent = (lbI + 1) + " / " + lbList.length; };
    $("#sThumbs").addEventListener("click", function (e) { var b = e.target.closest("[data-ph]"); if (!b) return; lbList = photos(SPACES[sp]); lbI = +b.dataset.ph; lbShow(); lb.showModal(); });
    $("#lbPrev").addEventListener("click", function () { lbI = (lbI - 1 + lbList.length) % lbList.length; lbShow(); });
    $("#lbNext").addEventListener("click", function () { lbI = (lbI + 1) % lbList.length; lbShow(); });
    $("#lbClose").addEventListener("click", function () { lb.close(); });
    lb.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") $("#lbNext").click(); if (e.key === "ArrowLeft") $("#lbPrev").click(); });
    renderSpace();
  }

  /* =====================================================================
     PLAN MY TABLE: card on the page, then a three-step dialog
     ===================================================================== */
  var dlg = $("#planDlg");
  if (!dlg) {   // menu and events pages do not carry the dialog; it is built here so booking never leaves the page
    dlg = document.createElement("dialog"); dlg.className = "dlg"; dlg.id = "planDlg"; dlg.setAttribute("aria-labelledby", "pTitle");
    dlg.innerHTML = '<div class="sheet"><div class="top"><div class="r"><b id="pTitle">Plan my table</b><button type="button" class="x" id="pClose" aria-label="Close">×</button></div><div class="prog" id="pProg"></div></div><div class="body" id="pBody"></div><div class="ft" id="pFt"></div></div>';
    document.body.appendChild(dlg);
  }
  if (dlg) {
    var WHO = [{ t: "Two of us", g: 2, seat: "Outdoor" }, { t: "Family", g: 5, seat: "Restaurant" }, { t: "Friends", g: 4, seat: "Bar & Lounge" }, { t: "Celebration", g: 8, seat: "Private room" }, { t: "Work", g: 6, seat: "Private room" }];
    var SEATS = {
      "Restaurant": { title: "The fine-dine restaurant", img: "img/svc-dining-720.webp", why: ["Indoor and air-conditioned", "All seven kitchens, with a full veg menu", "Room for the whole family"] },
      "Outdoor": { title: "An outdoor table", img: "img/svc-garden-720.webp", why: ["Open-air seating among the plants", "Soft light in the evening", "Candlelight on request"] },
      "Bar & Lounge": { title: "The Bar & Lounge", img: "img/spaces/thumb/bar-3.webp", why: ["A relaxed, separate bar", "Live-music corner", "Easy for a group of friends"] },
      "Private room": { title: "A private dining room", img: "img/svc-private-720.webp", why: ["Best for groups of six or more", "A room to yourselves", "Candlelight set up on request"] }
    };
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var P = { who: 0, guests: 2, date: new Date(today), seat: "Outdoor", time: null, name: "", phone: "", note: "", step: 1, ref: "" };
    var dayDiff = function () { return Math.round((P.date - today) / 86400000); };
    var dateTxt = function () { var d = dayDiff(), f = P.date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }); return d === 0 ? "Today, " + P.date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : d === 1 ? "Tomorrow, " + P.date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : f; };
    var guestsTxt = function () { return P.guests + (P.guests === 1 ? " guest" : " guests"); };
    var past = function (t) { var n = istParts(); return dayDiff() === 0 && mins(t) < n.h * 60 + n.m + 30; };
    var anySlot = function () { return [].concat(CFG.SLOTS.Lunch, CFG.SLOTS.Dinner).some(function (t) { return !past(t); }); };
    if (!anySlot()) P.date = new Date(today.getTime() + 86400000);   // nothing left today: start on tomorrow

    /* --- the card on the page --- */
    var card = $("#plan");
    var renderCard = function () {
      if (!card) return;
      $("#who").innerHTML = WHO.map(function (w, i) { return '<button type="button" class="chip" data-who="' + i + '" aria-pressed="' + (i === P.who) + '">' + w.t + "</button>"; }).join("");
      $("#guests").textContent = P.guests;
      var d = dayDiff();
      $("#when").innerHTML = [["0", "Today"], ["1", "Tomorrow"]].map(function (o) { return '<button type="button" class="chip" data-day="' + o[0] + '" aria-pressed="' + (d === +o[0]) + '">' + o[1] + "</button>"; }).join("") +
        '<button type="button" class="chip" data-day="pick" aria-pressed="' + (d > 1) + '">' + (d > 1 ? esc(dateTxt()) : "Pick a date") + "</button>";
      $("#guestNote").textContent = P.guests >= CFG.MAX_GUESTS ? "For more than " + CFG.MAX_GUESTS + ", use the event planner" : "";
    };
    if (card) card.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.who) { P.who = +b.dataset.who; P.guests = WHO[P.who].g; P.seat = WHO[P.who].seat; }
      else if (b.dataset.day === "pick") { var di = $("#datePick"); if (di.showPicker) { try { di.showPicker(); } catch (er) { di.focus(); } } else di.focus(); return; }
      else if (b.dataset.day) { P.date = new Date(today.getTime() + (+b.dataset.day) * 86400000); P.time = null; }
      else if (b.dataset.g) { P.guests = Math.min(CFG.MAX_GUESTS, Math.max(1, P.guests + (+b.dataset.g))); }
      else return;
      renderCard();
    });
    var dp = $("#datePick"), iso = function (d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); };
    var maxDay = iso(new Date(today.getTime() + 60 * 86400000));
    if (dp) { dp.min = iso(today); dp.max = maxDay; }
    if (dp) dp.addEventListener("change", function () { if (!dp.value) return; var d = new Date(dp.value + "T00:00"); if (d >= today) { P.date = d; P.time = null; renderCard(); } });
    renderCard();

    /* --- the dialog --- */
    var body = $("#pBody"), ft = $("#pFt");
    var sumLine = function () { return (P.step === 1 ? WHO[P.who].t : P.seat) + " · " + guestsTxt() + " · " + dateTxt() + (P.time && P.step > 1 ? " · " + P.time : ""); };
    var listNames = function () { return list.map(function (x) { return (x.q > 1 ? x.q + " × " : "") + x.name; }); };
    var message = function () {
      return "Hi Bharat Fine Dine! Table request " + P.ref + ": " + P.seat + " for " + P.guests + " on " + dateTxt() + " at " + P.time + " (" + WHO[P.who].t + "). Name: " + P.name.trim() + ". Phone: " + P.phone.trim() + "." +
        (listNames().length ? " Dishes we would like: " + listNames().join(", ") + "." : "") + (P.note.trim() ? " Note: " + P.note.trim() : "");
    };
    var calUrl = function () {
      var m = mins(P.time), p = function (n) { return (n < 10 ? "0" : "") + n; }, ymd = P.date.getFullYear() + p(P.date.getMonth() + 1) + p(P.date.getDate()), e2 = m + 120;
      return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent("Table at Bharat Fine Dine (" + P.guests + ")") + "&dates=" + ymd + "T" + p(Math.floor(m / 60)) + p(m % 60) + "00/" + ymd + "T" + p(Math.floor(e2 / 60) % 24) + p(e2 % 60) + "00&ctz=Asia/Kolkata&location=" + encodeURIComponent("Bharat Fine Dine, Plot No. B-37, MIDC Area, Latur 413531") + "&details=" + encodeURIComponent("Table request " + P.ref + ". Not confirmed until the restaurant replies on WhatsApp. Call " + CFG.PHONE + " for changes.");
    };
    var valid = function () { return P.step === 1 ? !!P.time : P.step === 2 ? P.name.trim().length > 1 && P.phone.replace(/\D/g, "").length >= 10 : true; };
    var render = function () {
      $("#pProg").hidden = P.step > 3;
      $("#pProg").innerHTML = "<div>" + [1, 2, 3].map(function (i) { return '<i class="' + (i <= P.step ? "on" : "") + '"></i>'; }).join("") + "</div><span>Step " + Math.min(P.step, 3) + " of 3</span>";
      var h = "", f = "";
      var sum = '<div class="sum"><span>' + esc(sumLine()) + '</span><button type="button" data-act="change">Change</button></div>';
      if (P.step === 1) {
        var s = SEATS[P.seat], dd = dayDiff();
        var pick = card ? sum :
          '<div class="grp"><b>Who’s coming?</b><div class="chips">' + WHO.map(function (w, i) { return '<button type="button" class="chip" data-act="who" data-v="' + i + '" aria-pressed="' + (i === P.who) + '">' + w.t + "</button>"; }).join("") + "</div></div>" +
          '<div class="stepper"><b style="font-size:14px">How many?</b><div class="c"><button type="button" data-act="g" data-v="-1" aria-label="Fewer guests">−</button><output aria-live="polite">' + P.guests + '</output><button type="button" data-act="g" data-v="1" aria-label="More guests">+</button></div></div>' +
          '<div class="grp"><b>When?</b><div class="chips">' + [["0", "Today"], ["1", "Tomorrow"]].map(function (o) { return '<button type="button" class="chip" data-act="day" data-v="' + o[0] + '" aria-pressed="' + (dd === +o[0]) + '">' + o[1] + "</button>"; }).join("") +
          '<label class="chip datechip" aria-pressed="' + (dd > 1) + '">' + (dd > 1 ? esc(dateTxt()) : "Pick a date") + '<input type="date" data-pick min="' + iso(today) + '" max="' + maxDay + '" value="' + (dd > 1 ? iso(P.date) : "") + '" aria-label="Pick a date"></label></div></div>';
        h = pick + '<div class="card flat sug"><img src="' + s.img + '" alt="' + esc(s.title) + '" width="720" height="480"><div class="tx"><span class="kick">We would seat you in</span><h3 class="h3">' + esc(s.title) + '</h3><ul class="why">' + s.why.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ul></div></div>" +
          '<div class="grp"><b>Or sit somewhere else</b><div class="chips">' + Object.keys(SEATS).map(function (k) { return '<button type="button" class="chip" data-act="seat" data-v="' + esc(k) + '" aria-pressed="' + (P.seat === k) + '">' + esc(k) + "</button>"; }).join("") + "</div></div>" +
          Object.keys(CFG.SLOTS).map(function (g) { return '<div class="grp"><b>' + g + '</b><div class="chips">' + CFG.SLOTS[g].map(function (t) { return '<button type="button" class="chip" data-act="time" data-v="' + t + '" aria-pressed="' + (P.time === t) + '"' + (past(t) ? " disabled" : "") + ">" + t + "</button>"; }).join("") + "</div></div>"; }).join("") +
          (anySlot() ? "" : '<p class="err">Today’s times have passed. Tap “Change” and pick another day, or call ' + CFG.PHONE + ".</p>") +
          '<p class="note">More than ' + CFG.MAX_GUESTS + ' guests? <a href="events.html" class="lnk">Open the event planner</a></p>';
        f = '<span class="note">Your table is held once we reply to confirm on WhatsApp.</span><div class="row"><button type="button" class="btn" data-act="next" aria-disabled="' + !valid() + '">Request this table</button></div>';
      } else if (P.step === 2) {
        h = sum + '<h3 class="h3" style="font-size:20px">Who is the table for?</h3>' +
          '<label class="f">Your name<input class="fld" data-in="name" value="' + esc(P.name) + '" autocomplete="name"></label>' +
          '<label class="f">WhatsApp number<input class="fld" data-in="phone" value="' + esc(P.phone) + '" inputmode="tel" autocomplete="tel" placeholder="+91"></label>' +
          '<label class="f">Anything we should know? (optional)<input class="fld" data-in="note" value="' + esc(P.note) + '" placeholder="Cake at 9 pm, high chair"></label>' +
          (list.length ? '<div class="grp"><b>Dishes going with your request</b><div class="tags">' + list.map(function (x) { return '<span class="tag">' + (x.q > 1 ? x.q + " × " : "") + esc(x.name) + '<button type="button" data-act="drop" data-v="' + esc(x.id) + '" aria-label="Remove ' + esc(x.name) + '">×</button></span>'; }).join("") + "</div></div>" : '<p class="note">Want the kitchen to know what you are coming for? <a class="lnk" href="menu.html">Add dishes from the menu</a></p>');
        f = '<div class="row"><button type="button" class="btn line" data-act="back">Back</button><button type="button" class="btn" data-act="next" aria-disabled="' + !valid() + '">Check my request</button></div>';
      } else if (P.step === 3) {
        var rows = [["Table", P.seat], ["Date", dateTxt()], ["Time", P.time], ["Guests", P.guests + " · " + WHO[P.who].t], ["Name", P.name.trim()], ["WhatsApp", P.phone.trim()]];
        if (list.length) rows.push(["Dishes noted", listNames().join(", ")]);
        h = '<h3 class="h3" style="font-size:20px">Check and send</h3><div class="card flat tbl">' + rows.map(function (r) { return "<div><span>" + r[0] + "</span><b>" + esc(r[1]) + "</b></div>"; }).join("") + "</div>" +
          '<div class="grp"><b style="font-size:13px;color:var(--body)">The message we will open in WhatsApp</b><div class="bubble">' + esc(message()) + "</div></div>";
        f = '<span class="note">Your table is held once we reply to confirm.</span><div class="row"><button type="button" class="btn line" data-act="back">Back</button><a class="btn wa" id="pSend" href="' + wa(message()) + '" target="_blank" rel="noopener">Send on WhatsApp</a></div>';
      } else {
        var first = P.name.trim().split(" ")[0] || "friend";
        h = '<span class="mr" lang="mr" style="font-size:26px">भेटूया!</span><h3 class="h3">Request sent, ' + esc(first) + ".</h3>" +
          '<div class="sum" style="flex-direction:column;align-items:flex-start;gap:4px"><span>Waiting for our reply on WhatsApp</span><span class="note" style="font-weight:400">' + esc(P.seat + " · " + guestsTxt() + " · " + dateTxt() + " · " + P.time) + ". Reference <b>" + P.ref + "</b></span></div>" +
          '<ol class="steps"><li>We reply on WhatsApp to confirm your table.</li><li>We set it up the way you asked.</li>' + (list.length ? "<li>The kitchen gets your dish list.</li>" : "") + "</ol>" +
          '<a class="btn ink block" href="' + calUrl() + '" target="_blank" rel="noopener">Add to calendar</a><button type="button" class="btn line block" data-act="close">' + (card ? "Back to the wall" : "Done") + '</button>' +
          '<p class="note">WhatsApp did not open? <a class="lnk" href="' + wa(message()) + '" target="_blank" rel="noopener">Send it again</a> or call <a class="lnk" href="tel:+' + CFG.WHATSAPP + '">' + CFG.PHONE + "</a>.</p>";
      }
      var keep = body.dataset.step === String(P.step) ? body.scrollTop : 0;
      body.innerHTML = h; ft.innerHTML = f; ft.hidden = !f; body.dataset.step = P.step; body.scrollTop = keep;
    };
    var open = function (seat) {
      if (seat && SEATS[seat]) P.seat = seat;
      if (P.guests > 6 && P.seat === "Outdoor") P.seat = "Restaurant";
      if (P.time && past(P.time)) P.time = null;
      P.step = 1; render(); if (!dlg.open) dlg.showModal(); document.body.classList.add("lock");
    };
    var close = function () { if (dlg.open) dlg.close(); };
    dlg.addEventListener("close", function () { document.body.classList.remove("lock"); });
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg) return close();
      if (e.target.id === "pSend") {
        store.set("bfd-last", { ref: P.ref, seat: P.seat, guests: P.guests, date: iso(P.date), time: P.time, at: Date.now() });
        track("Lead", { content_name: "Table request", value: P.guests });
        setTimeout(function () { P.step = 4; render(); }, 300); return;
      }
      var b = e.target.closest("[data-act]"); if (!b) return;
      var a = b.dataset.act, v = b.dataset.v;
      if (a === "time") P.time = v;
      else if (a === "seat") P.seat = v;
      else if (a === "drop") { list = list.filter(function (x) { return x.id !== v; }); saveList(); if (onListChange) onListChange(); }
      else if (a === "back") P.step--;
      else if (a === "who") { P.who = +v; P.guests = WHO[P.who].g; P.seat = WHO[P.who].seat; }
      else if (a === "g") P.guests = Math.min(CFG.MAX_GUESTS, Math.max(1, P.guests + (+v)));
      else if (a === "day") { P.date = new Date(today.getTime() + (+v) * 86400000); P.time = null; }
      else if (a === "change" && !card) P.step = 1;
      else if (a === "change" || a === "close") { close(); if (a === "change") card.scrollIntoView({ block: "center" }); return; }
      else if (a === "next") {
        if (!valid()) { var bad = body.querySelector(P.name.trim().length > 1 ? '[data-in="phone"]' : '[data-in="name"]'); if (bad) bad.focus(); return; }
        if (P.step === 2) P.ref = "BFD-" + Math.floor(1000 + Math.random() * 9000);
        P.step++;
      }
      render();
    });
    body.addEventListener("input", function (e) {
      var k = e.target.dataset.in; if (!k) return; P[k] = e.target.value;
      var n = ft.querySelector('[data-act="next"]'); if (n) n.setAttribute("aria-disabled", !valid());
    });
    body.addEventListener("change", function (e) {
      if (!e.target.hasAttribute("data-pick") || !e.target.value) return;
      var d = new Date(e.target.value + "T00:00"); if (d >= today) { P.date = d; P.time = null; render(); }
    });
    $("#pClose").addEventListener("click", close);
    document.addEventListener("click", function (e) {
      /* on pages without the booking card, links to it open the booking here instead of leaving the page */
      var b = e.target.closest && e.target.closest('[data-plan], a[href$="#plan"]'); if (!b) return;
      e.preventDefault(); open(b.dataset.plan);
    });
    if (card && location.hash === "#plan") setTimeout(function () { card.scrollIntoView({ block: "center" }); }, 100);
  }

  /* =====================================================================
     MENU: one kitchen at a time, search, veg only, my list
     ===================================================================== */
  var kits = $("#kits");
  if (kits) {
    var all = $$(".kit", kits), rail = $("#rail"), q = $("#q"), vegBtn = $("#vegOnly"), curK = all[0].dataset.k, veg = false;
    var apply = function () {
      var term = q.value.trim().toLowerCase(), shown = 0;
      all.forEach(function (kit) {
        var n = 0;
        $$(".msec", kit).forEach(function (sec) {
          var m = 0;
          $$(".item", sec).forEach(function (li) { var ok = (!veg || li.dataset.veg === "1") && (!term || li.dataset.s.indexOf(term) > -1); li.hidden = !ok; if (ok) m++; });
          sec.hidden = m === 0; n += m;
        });
        var on = term ? n > 0 : kit.dataset.k === curK;
        kit.classList.toggle("show", on); if (on) shown += n;
        var ban = $(".kban", kit), nx = $(".nextstop", kit); if (ban) ban.hidden = !!term; if (nx) nx.hidden = !!term;
      });
      $("#nores").hidden = shown > 0;
      $$("[data-go]", rail).forEach(function (b) { b.setAttribute("aria-pressed", !term && b.dataset.go === curK); });
    };
    var go = function (id, scroll) {
      if (!all.some(function (k) { return k.dataset.k === id; })) return;
      curK = id; q.value = ""; apply();
      /* only scroll when the dishes have gone up under the sticky rail; from the top of the page the search stays in view */
      if (scroll) { var rb = $(".railbox").getBoundingClientRect().bottom, gt = $(".mgrid").getBoundingClientRect().top; if (gt < rb) window.scrollTo({ top: window.scrollY + gt - rb - 8 }); }
      try { history.replaceState(null, "", "#k-" + id); } catch (e) {}
    };
    document.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-go]"); if (!b) return;
      e.preventDefault(); go(b.dataset.go, true);
    });
    var t; q.addEventListener("input", function () { clearTimeout(t); t = setTimeout(apply, 80); });
    vegBtn.addEventListener("click", function () { veg = !veg; vegBtn.setAttribute("aria-pressed", veg); apply(); });
    /* deep links: menu.html#k-tandoor or menu.html#punjabi-main-course */
    var hash = decodeURIComponent(location.hash.slice(1)), target = hash && document.getElementById(hash);
    if (target) { var kt = target.closest(".kit"); if (kt) curK = kt.dataset.k; }
    apply();
    if (target && !target.classList.contains("kit")) setTimeout(function () { target.scrollIntoView({ behavior: "auto", block: "start" }); }, 60);
    window.addEventListener("hashchange", function () { var el = document.getElementById(decodeURIComponent(location.hash.slice(1))), kt2 = el && el.closest(".kit"); if (kt2 && kt2.dataset.k !== curK) { curK = kt2.dataset.k; q.value = ""; apply(); if (el !== kt2) el.scrollIntoView({ behavior: "auto", block: "start" }); } });

    var panel = $("#mylist"), bar = $("#barCount");
    var renderList = function () {
      $$(".add").forEach(function (b) { var on = inList(b.dataset.add); b.setAttribute("aria-pressed", on); b.textContent = on ? "✓" : "+"; b.setAttribute("aria-label", (on ? "Remove " : "Add ") + b.dataset.name + (on ? " from my list" : " to my list")); });
      bar.textContent = list.length ? list.length + (list.length === 1 ? " dish" : " dishes") + " on your list" : "Add dishes with +";
      panel.hidden = false; panel.classList.toggle("empty", !list.length);
      if (!list.length) { panel.innerHTML = '<span class="kick">Your list</span><b style="font-size:20px">Nothing yet</b><p class="note" style="margin-top:6px">Tap + beside a dish to add it. Your list goes with your table request, so the kitchen knows what you are coming for.</p>'; return; }
      panel.innerHTML = '<span class="kick">Your list</span><b style="font-size:20px">' + list.length + (list.length === 1 ? " dish" : " dishes") + "</b>" +
        list.map(function (x) { return '<div class="row"><span>' + esc(x.name) + '<small>' + esc(x.price) + '</small></span><span class="qty"><button type="button" data-q="-1" data-id="' + esc(x.id) + '" aria-label="One less ' + esc(x.name) + '">−</button><output aria-live="polite">' + (x.q || 1) + '</output><button type="button" data-q="1" data-id="' + esc(x.id) + '" aria-label="One more ' + esc(x.name) + '">+</button><button type="button" class="rm" data-rm="' + esc(x.id) + '" aria-label="Remove ' + esc(x.name) + '">×</button></span></div>'; }).join("") +
        '<p class="note" style="margin:8px 0 10px">Your list goes with your table request.</p><button type="button" class="btn" data-plan style="align-self:flex-start">Plan my table</button>';
    };
    kits.addEventListener("click", function (e) {
      var b = e.target.closest(".add"); if (!b) return;
      if (inList(b.dataset.add)) list = list.filter(function (x) { return x.id !== b.dataset.add; });
      else list.push({ id: b.dataset.add, name: b.dataset.name, price: b.dataset.price, q: 1 });
      saveList(); renderList();
    });
    panel.addEventListener("click", function (e) {
      var qb = e.target.closest("[data-q]");
      if (qb) { var it = list.filter(function (x) { return x.id === qb.dataset.id; })[0]; if (it) { it.q = Math.min(20, (it.q || 1) + (+qb.dataset.q)); if (it.q < 1) list = list.filter(function (x) { return x !== it; }); saveList(); renderList(); } return; }
      var b = e.target.closest("[data-rm]"); if (!b) return; list = list.filter(function (x) { return x.id !== b.dataset.rm; }); saveList(); renderList(); });
    renderList(); onListChange = renderList;
  }

  /* =====================================================================
     EVENTS: planner
     ===================================================================== */
  var ev = $("#planner");
  if (ev) {
    /* Each banquet hall seats about 300 to 350 (confirmed by the restaurant). Rooms take up to 20, the online table limit. */
    var SIZES = [{ t: "Up to 20", max: 20 }, { t: "20 to 100", max: 100 }, { t: "100 to 300", max: 300 }, { t: "300+", max: 9999 }];
    var ROOMS = [
      { name: "Samiksha banquet hall", info: "300 to 350 seats · full catering", img: "img/svc-hall-720.webp", min: 21, max: 350 },
      { name: "Sanskruti banquet hall", info: "300 to 350 seats · full catering", img: "img/hall-sanskruti-720.webp", min: 21, max: 350 },
      { name: "Private dining rooms", info: "Smaller celebrations", img: "img/svc-private-720.webp", min: 1, max: 20 },
      { name: "Board and meeting rooms", info: "AV-ready, for meetings", img: "img/svc-meeting-720.webp", min: 1, max: 20 }
    ];
    var E = { type: "Wedding", size: 2, spread: "Veg and non-veg" };
    var TYPES = ["Wedding", "Engagement", "Birthday", "Corporate", "Other"], SPREADS = ["Veg", "Veg and non-veg"];
    var chipRow = function (id, items, curIdx, key) { $(id).innerHTML = items.map(function (t, i) { return '<button type="button" class="chip" data-' + key + '="' + i + '" aria-pressed="' + (i === curIdx) + '">' + esc(t) + "</button>"; }).join(""); };
    var evMsg = function () {
      var d = $("#evDate").value, ds = d ? new Date(d + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "date to be decided";
      return "Hi Bharat Fine Dine! Event enquiry: " + E.type + " for " + SIZES[E.size].t + " guests, " + ds + ". Menu: " + E.spread + ". Name: " + $("#evName").value.trim() + ". Phone: " + $("#evPhone").value.trim() + "." + ($("#evNote").value.trim() ? " " + $("#evNote").value.trim() : "");
    };
    var evOk = function () { return $("#evName").value.trim().length > 1 && $("#evPhone").value.replace(/\D/g, "").length >= 10; };
    var renderEv = function () {
      chipRow("#evType", TYPES, TYPES.indexOf(E.type), "type");
      chipRow("#evSize", SIZES.map(function (s) { return s.t; }), E.size, "size");
      chipRow("#evSpread", SPREADS, SPREADS.indexOf(E.spread), "spread");
      var lo = E.size === 0 ? 1 : SIZES[E.size - 1].max + 1;
      $("#fitTitle").textContent = "Spaces that fit " + SIZES[E.size].t.toLowerCase() + " guests";
      $("#fits").innerHTML = ROOMS.map(function (r) { var ok = lo <= r.max && SIZES[E.size].max >= r.min; return { r: r, ok: ok }; }).sort(function (a, b) { return b.ok - a.ok; }).map(function (x) {
        return '<div class="card flat fit' + (x.ok ? " ok" : "") + '"><img src="' + x.r.img + '" alt="" width="96" height="72" loading="lazy"><div class="tx"><b>' + esc(x.r.name) + "</b><span>" + esc(x.r.info) + '</span><span class="badge">' + (x.ok ? "Fits your event" : (lo > x.r.max ? "Too small for this" : "Larger than you need")) + "</span></div></div>";
      }).join("") + (E.size === 3 ? '<p class="note">Each hall seats about 300 to 350 guests. Tell us your number and our coordinator will confirm what works.</p>' : "");
      var s = $("#evSend"); s.href = evOk() ? wa(evMsg()) : "#evName"; s.setAttribute("aria-disabled", !evOk());
    };
    ev.addEventListener("click", function (e) {
      var b = e.target.closest("button.chip"); if (!b) return;
      if (b.dataset.type) E.type = TYPES[+b.dataset.type]; else if (b.dataset.size) E.size = +b.dataset.size; else if (b.dataset.spread) E.spread = SPREADS[+b.dataset.spread];
      renderEv();
    });
    ev.addEventListener("input", function () { var s = $("#evSend"); s.href = evOk() ? wa(evMsg()) : "#evName"; s.setAttribute("aria-disabled", !evOk()); });
    $("#evSend").addEventListener("click", function (e) {
      if (!evOk()) { e.preventDefault(); ($("#evName").value.trim().length > 1 ? $("#evPhone") : $("#evName")).focus(); $("#evErr").hidden = false; return; }
      $("#evErr").hidden = true; $("#evDone").hidden = false; track("Lead", { content_name: "Event enquiry", content_category: E.type });
    });
    var d0 = new Date(); $("#evDate").min = d0.getFullYear() + "-" + ("0" + (d0.getMonth() + 1)).slice(-2) + "-" + ("0" + d0.getDate()).slice(-2);
    renderEv();
  }

  /* reveal sections as they scroll in; anything already on screen is left alone */
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    $$("[data-rv]").forEach(function (el) { if (el.getBoundingClientRect().top > window.innerHeight) { el.classList.add("rv"); io.observe(el); } });
  }

  /* moving between pages: a strip of the mural slides past while the next page loads */
  (function () {
    var ld = document.createElement("div"); ld.className = "ld"; ld.setAttribute("aria-hidden", "true");
    ld.innerHTML = '<span class="seal"><img src="img/BFD_seal_red.png" alt="" width="128" height="128"><img class="f" src="img/BFD_seal_red.png" alt="" width="128" height="128"></span><span class="mr" lang="mr">चला…</span>';
    document.body.appendChild(ld);
    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest("a[href]"); if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      var u; try { u = new URL(a.href, location.href); } catch (er) { return; }
      if (u.origin !== location.origin || u.pathname === location.pathname) return;   // other sites and same-page links pass straight through
      e.preventDefault(); ld.classList.add("on");
      setTimeout(function () { location.href = u.href; }, 650);                       // long enough to read as a transition, not a flash
    });
    window.addEventListener("pageshow", function () { ld.classList.remove("on"); });   // also when coming back with the Back button
  })();

  var yr = $("#yr"); if (yr) yr.textContent = new Date().getFullYear();
})();
