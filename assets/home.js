/* Bharat Fine Dine — homepage behaviour */
(function () {
  var C = window.BFD, $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var mq = window.matchMedia("(max-width: 819.98px)");
  var narrow = function () { return mq.matches; };
  var anim = function (els, frames, o) { if (C.reduce) return; els.forEach(function (el, i) { el.animate && el.animate(frames, { duration: o.duration || 380, delay: (o.stagger || 0) * i, easing: C.EASE, fill: "backwards" }); }); };
  var yr = $("#yr"); if (yr) yr.textContent = new Date().getFullYear();
  $("#igMonth").textContent = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" }) + " · latest posts";

  /* ---------- announcement bar: switches by date (India time) ----------
     Each line shows from its date until the next one starts. Add or edit rows here. */
  var ANNOUNCE = [
    ["2026-10-01", "Navratri at Bharat: festive family dinners across all seven kitchens"],
    ["2026-10-20", "Dussehra: celebrate with the family, from the tandoor to the coast"],
    ["2026-11-02", "Diwali week: festive family feasts across all seven kitchens"],
    ["2026-11-13", "Weddings, receptions & year-end parties: book Samiksha or Sanskruti hall"]
  ];
  (function () {
    var today; try { today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date()); } catch (e) { today = new Date().toISOString().slice(0, 10); }
    var line = null; ANNOUNCE.forEach(function (a) { if (a[0] <= today) line = a[1]; });
    var el = $("#announceText"); if (el && line) el.textContent = line;
  })();

  /* ---------- hero mural ---------- */
  var hl = $(".mural .hlogo"); if (hl && !C.reduce) hl.classList.add("hlogo-in");
  var ms = $("#muralScroller");
  function centreMural() { if (narrow() && ms) ms.scrollLeft = (ms.scrollWidth - ms.clientWidth) / 2; }
  var mimg = ms && ms.querySelector("img");
  if (mimg) { if (mimg.complete) centreMural(); else mimg.addEventListener("load", centreMural, { once: true }); }
  mq.addEventListener ? mq.addEventListener("change", centreMural) : mq.addListener(centreMural);

  /* ---------- booking state ---------- */
  var PARTY = [
    { en: "Two of us", sub: "2 guests · Outdoor", g: 2, seat: "Outdoor" },
    { en: "Family", sub: "5 guests · Restaurant", g: 5, seat: "Restaurant" },
    { en: "Friends", sub: "4 guests · Bar & Lounge", g: 4, seat: "Bar & Lounge" },
    { en: "Celebration", sub: "8 guests · Private room", g: 8, seat: "Private room" }
  ];
  var S = { party: null, dateIdx: 0, guests: 2, time: null, seat: "Restaurant", name: "", phone: "", occasion: "None", notes: "", step: 0, ref: "" };
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var DATES = []; for (var i = 0; i < 14; i++) { var d = new Date(today); d.setDate(today.getDate() + i); DATES.push(d); }
  function dateLong(i) { var d = DATES[i]; return i === 0 ? "Today, " + d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }); }
  function guestsTxt() { return S.guests + (S.guests === 1 ? " guest" : " guests"); }
  function choose(p) { S.party = p.en; S.guests = p.g; S.seat = p.seat; }

  function renderHero() {
    $("#heroParties").innerHTML = PARTY.map(function (p, i) { return '<button type="button" class="chip" data-p="' + i + '" aria-pressed="' + (S.party === p.en) + '">' + esc(p.en) + "</button>"; }).join("");
    $("#heroWhen").textContent = dateLong(S.dateIdx);
    $("#heroGuests").textContent = guestsTxt();
  }
  $("#heroParties").addEventListener("click", function (e) { var b = e.target.closest("[data-p]"); if (!b) return; choose(PARTY[+b.dataset.p]); renderHero(); });
  renderHero();

  /* ---------- kitchens ---------- */
  var KIT = [
    { name: "Punjabi", region: "Punjab · North", img: "img/mural-punjab.webp", w: 1000, h: 566, thumb: "img/mural-punjab-480.webp", big: true, col: "#74540D", sec: "punjabi-main-course", line: "The Golden Temple, the dhol, and a basket of naan.", dishes: [["V", "Paneer Sultani"], ["V", "Malai Kofta"], ["V", "Veg Patiyala"], ["V", "Kaju Masala"], ["V", "Garlic Naan"]] },
    { name: "Tandoor & BBQ", region: "Off the coal", img: "img/mural-tandoor.webp", w: 800, h: 806, thumb: "img/mural-tandoor-480.webp", big: true, col: "#B23B2B", sec: "tandoori-starters", line: "Coal under the tandoor, and kebabs straight off the skewer.", dishes: [["N", "Murgh Malai Tikka"], ["V", "Paneer Malai Tikka"], ["V", "Assorted Tandoor Platter"], ["N", "Tandoor Chicken"], ["N", "Murgh Afgani Kebab"], ["V", "Paneer Achari Tikka"]] },
    { name: "Mughlai", region: "Awadh · Lucknow", img: "img/mural-mughlai.webp", w: 900, h: 949, thumb: "img/mural-mughlai-480.webp", big: true, col: "#A05610", sec: "chicken-main-course", line: "Lucknow’s gateway, a nawab at ease, and slow dum handis.", dishes: [["N", "Chicken Mughlai"], ["N", "Mutton Rogan Josh"], ["N", "Murgh Musallam"], ["N", "Mutton Korma"], ["V", "Veg Dum Biryani"], ["V", "Tomato Shorba"]] },
    { name: "Maharashtrian", region: "Home ground", img: "img/mural-maharashtra.webp", w: 1000, h: 690, thumb: "img/mural-maharashtra-480.webp", big: true, col: "#8C2D46", sec: "maharashtrian-main-course", line: "Kolhapuri heat and Saoji spice from next door.", dishes: [["N", "Chicken Kolhapuri"], ["N", "Chicken Saoji"], ["N", "Chicken Malvani"], ["V", "Veg Saoji"], ["V", "Shev Bhaji"], ["V", "Baigan Saoji"]] },
    { name: "Coastal & Seafood", region: "Konkan to Kerala", img: "img/mural-goa.webp", w: 1000, h: 588, thumb: "img/mural-goa-480.webp", big: true, col: "#163E52", sec: "seafood-starters", line: "Church bells, backwater boats and the day’s catch.", dishes: [["N", "Pomfret Tawa / Tandoori / Rava"], ["N", "Prawns Koliwada"], ["N", "Fish Amritsari / Ajwaini"], ["N", "Prawns Curry · Goan / Kerala"], ["N", "Surmai Curry"]] },
    /* Continental + Chinese & Oriental: art is commissioned (see "Mural Art Brief"). Until img/mural-continental.webp and
       img/mural-oriental.webp exist, the onerror fallback shows a pattern in the kitchen colour. */
    { name: "Continental", region: "Beyond Bharat", img: "img/mural-continental.webp", w: 570, h: 723, thumb: "img/mural-continental-300.webp", big: false, col: "#48532A", sec: "continental-starters", line: "Grills, salads, sizzlers, pizza and pasta.", dishes: [["V", "Waldorf Salad"], ["V", "Greek Farmhouse Salad"], ["V", "Cheese Club Sandwich"], ["N", "Grilled Chicken Salad"], ["N", "Caesar’s Chicken Salad"]] },
    { name: "Chinese & Oriental", region: "The East", img: "img/mural-oriental.webp", w: 526, h: 723, thumb: "img/mural-oriental-300.webp", big: false, col: "#0F4E37", sec: "chinese-oriental-starters", line: "Wok-tossed starters, noodles, rice bowls and Thai curries.", dishes: [["V", "Thai Green Curry with Basil Rice"], ["V", "Burnt Garlic Noodles"], ["V", "Crispy Corn Salt & Pepper"], ["V", "Veg Hakka Noodles"], ["N", "Crispy Honey Chilli Chicken"], ["N", "Mongolian Chicken"]] }
  ];
  var K = { region: 0, veg: false, pos: 0 };
  var initial = function (n) { return n.split(/[\s&]+/).filter(Boolean).map(function (w) { return w[0]; }).slice(0, 2).join(""); };
  /* if a mural file is missing, swap in the patterned placeholder */
  window.BFD.muralFallback = function (img) { var s = document.createElement("span"); s.className = "kart"; s.style.setProperty("--k", img.getAttribute("data-kc")); s.innerHTML = "<b>" + img.getAttribute("data-kn") + "</b>"; img.replaceWith(s); };
  var imgTag = function (k, alt, panel) {
    var b = k.img.replace(".webp", "");
    var src = panel ? (k.big ? b + "-720.webp" : k.img) : k.thumb;
    var set = panel && k.big ? ' srcset="' + b + '-480.webp 480w, ' + b + '-720.webp 720w, ' + k.img + ' ' + k.w + 'w" sizes="(max-width: 819.98px) calc(100vw - 32px), 640px"' : "";
    return '<img src="' + src + '"' + set + ' width="' + k.w + '" height="' + k.h + '" alt="' + esc(alt) + '"' + (panel ? "" : ' loading="lazy"') + ' decoding="async" data-kc="' + k.col + '" data-kn="' + esc(initial(k.name)) + '" onerror="BFD.muralFallback(this)">';
  };
  var art = function (k) { return k.img ? imgTag(k, "") : '<span class="kart" style="--k:' + k.col + '"><b>' + esc(initial(k.name)) + "</b></span>"; };
  var kc = $("#kcards");
  kc.innerHTML = KIT.map(function (k, i) {
    return '<button type="button" class="kcard" data-k="' + i + '" style="--k:' + k.col + '" aria-pressed="' + (i === 0) + '"><span class="th">' + art(k) + '</span><span class="bar"></span><span class="tx"><b>' + esc(k.name) + "</b><span>" + esc(k.region) + "</span></span></button>";
  }).join("");
  $("#kdots").innerHTML = KIT.map(function (_, i) { return "<i" + (i === 0 ? ' class="on"' : "") + "></i>"; }).join("");
  function renderPanel(animate) {
    var k = KIT[K.region];
    var ds = k.dishes.filter(function (d) { return !K.veg || d[0] === "V"; });
    $("#kpanel").innerHTML =
      '<div class="kp1" style="--k:' + k.col + '"><div class="art">' + (k.img ? imgTag(k, k.name + " scene from our mural", true) : '<span class="kart" style="--k:' + k.col + '"><b>' + esc(initial(k.name)) + "</b></span>") + '</div><div class="bar"></div>' +
      '<div class="tx"><span class="kick">' + esc(k.region) + "</span><b>" + esc(k.name) + "</b><p>" + esc(k.line) + "</p></div></div>" +
      '<div class="kp2" style="--k:' + k.col + '"><div class="hd"><span class="kick">From the menu</span><div class="seg" role="group" aria-label="Filter dishes"><button type="button" data-veg="0" aria-pressed="' + !K.veg + '">All</button><button type="button" data-veg="1" aria-pressed="' + K.veg + '">Veg</button></div></div>' +
      ds.map(function (d) { var v = d[0] === "V"; return '<div class="dish"><span class="mark' + (v ? "" : " nv") + '" aria-hidden="true"></span><b>' + esc(d[1]) + "</b><small>" + (v ? "Veg" : "Non-veg") + "</small></div>"; }).join("") +
      (ds.length ? "" : '<div class="empty">This kitchen is all seafood. Switch to "All", or try Punjabi for veg favourites.</div>') +
      '<a class="more" href="menu.html#' + k.sec + '" data-wipe>See the full ' + esc(k.name) + " menu →</a></div>";
    if (animate) anim($$("#kpanel > div"), [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { stagger: 60 });
  }
  kc.addEventListener("click", function (e) {
    var b = e.target.closest("[data-k]"); if (!b) return;
    K.region = +b.dataset.k;
    $$(".kcard", kc).forEach(function (c, i) { c.setAttribute("aria-pressed", i === K.region); });
    renderPanel(true);
  });
  $("#kpanel").addEventListener("click", function (e) { var b = e.target.closest("[data-veg]"); if (!b) return; var v = b.dataset.veg === "1"; if (v === K.veg) return; K.veg = v; renderPanel(true); });
  kc.addEventListener("scroll", function () {
    var card = kc.firstElementChild, step = card ? card.offsetWidth + 10 : 1, p = Math.min(6, Math.round(kc.scrollLeft / step));
    if (p !== K.pos) { K.pos = p; $$("#kdots i").forEach(function (d, i) { d.classList.toggle("on", i === p); }); }
  }, { passive: true });
  renderPanel(false);

  /* ---------- who's coming ---------- */
  $$("[data-who]").forEach(function (b) { b.addEventListener("click", function () { choose(PARTY[+b.dataset.who]); renderHero(); openBook(b); }); });

  /* ---------- gallery + lightbox ---------- */
  var GAL = [["dining", "Dining"], ["outdoor", "Outdoor"], ["bar", "Bar & Lounge"], ["private", "Private rooms"], ["meeting", "Meeting rooms"], ["hall", "Banquet halls"]];
  var ALL = []; GAL.forEach(function (g) { for (var n = 1; n <= 6; n++) ALL.push({ k: g[0], cat: g[1], thumb: "img/spaces/thumb/" + g[0] + "-" + n + ".webp", t400: "img/spaces/t400/" + g[0] + "-" + n + ".webp", src: "img/spaces/" + g[0] + "-" + n + ".webp", alt: g[1] + " photo " + n }); });
  var gtab = "all", galList = [];
  function pick() { return gtab === "all" ? GAL.reduce(function (a, g) { return a.concat(ALL.filter(function (x) { return x.k === g[0]; }).slice(0, 2)); }, []) : ALL.filter(function (x) { return x.k === gtab; }); }
  $("#gtabs").innerHTML = [["all", "All"]].concat(GAL).map(function (t) { return '<button type="button" class="chip" data-g="' + t[0] + '" aria-pressed="' + (t[0] === "all") + '">' + esc(t[1]) + "</button>"; }).join("");
  function renderGal(animate) {
    galList = pick(); var nw = narrow();
    $("#galCount").textContent = galList.length + " photos";
    var g = $("#gal");
    g.innerHTML = galList.map(function (x, i) {
      var span = (!nw && i % 6 === 0) || (nw && i % 5 === 0) ? 2 : 1, cspan = !nw && i % 6 === 0 ? 2 : 1;
      return '<button type="button" data-i="' + i + '" aria-label="Open photo: ' + esc(x.alt) + '" style="grid-row:span ' + span + ";grid-column:span " + cspan + '"><img src="' + x.t400 + '" srcset="' + x.t400 + ' 400w, ' + x.thumb + ' 700w" sizes="(max-width: 819.98px) 50vw, 25vw" width="400" height="266" alt="' + esc(x.alt) + '" loading="lazy" decoding="async"><span>' + esc(x.cat) + "</span></button>";
    }).join("");
    if (animate) anim($$("#gal > *"), [{ opacity: 0, transform: "scale(.96)" }, { opacity: 1, transform: "none" }], { duration: 420, stagger: 35 });
  }
  $("#gtabs").addEventListener("click", function (e) { var b = e.target.closest("[data-g]"); if (!b || b.dataset.g === gtab) return; gtab = b.dataset.g; $$("#gtabs .chip").forEach(function (c) { c.setAttribute("aria-pressed", c.dataset.g === gtab); }); renderGal(true); });
  mq.addEventListener ? mq.addEventListener("change", function () { renderGal(false); }) : mq.addListener(function () { renderGal(false); });
  renderGal(false);

  var LB = { list: [], i: 0, opener: null }, lb = $("#lb"), lbImg = $("#lbImg");
  function lbShow(changed) { var x = LB.list[LB.i]; lbImg.src = x.src; lbImg.alt = x.alt; $("#lbPos").textContent = x.cat + " · " + (LB.i + 1) + " / " + LB.list.length; if (changed && !C.reduce) { lbImg.classList.remove("chg"); void lbImg.offsetWidth; lbImg.classList.add("chg"); } }
  function lbOpen(list, i, opener) { LB.list = list; LB.i = i; LB.opener = opener; lbShow(false); lb.hidden = false; document.body.classList.add("lock"); $("#lbClose").focus(); }
  function lbClose() { lb.hidden = true; document.body.classList.remove("lock"); LB.opener && LB.opener.focus(); }
  function lbStep(d) { LB.i = (LB.i + d + LB.list.length) % LB.list.length; lbShow(true); }
  $("#gal").addEventListener("click", function (e) { var b = e.target.closest("[data-i]"); if (b) lbOpen(galList, +b.dataset.i, b); });
  $$("[data-space]").forEach(function (b) { b.addEventListener("click", function () { lbOpen(ALL.filter(function (x) { return x.k === b.dataset.space; }), 0, b); }); });
  $("#lbPrev").addEventListener("click", function (e) { e.stopPropagation(); lbStep(-1); });
  $("#lbNext").addEventListener("click", function (e) { e.stopPropagation(); lbStep(1); });
  $("#lbClose").addEventListener("click", lbClose);
  lb.addEventListener("click", function (e) { if (e.target === lb) lbClose(); });
  var tx0 = null; lb.addEventListener("touchstart", function (e) { tx0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) { if (tx0 == null) return; var dx = e.changedTouches[0].clientX - tx0; if (Math.abs(dx) > 50) lbStep(dx < 0 ? 1 : -1); tx0 = null; });

  /* ---------- events enquiry ---------- */
  var evForm = $("#evForm"), evSend = $("#evSend");
  function evOk() { return $("#evName").value.trim().length > 1; }
  function evMsg() {
    var t = $("#evType").value, g = $("#evGuests").value.trim(), dt = $("#evDate").value, m = $("#evMsg").value.trim(), n = $("#evName").value.trim();
    var dStr = dt ? new Date(dt + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
    return "Hi! I'd like to enquire about a " + t + " for " + (g || "—") + " guests" + (dStr ? " on " + dStr : "") + ". Name: " + n + "." + (m ? " " + m : "");
  }
  evForm.addEventListener("input", function () { evSend.setAttribute("aria-disabled", !evOk()); });
  evForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!evOk()) { $("#evName").focus(); return; }
    var msg = evMsg(), url = C.wa(msg);
    $("#evBubble").textContent = msg; $("#evLink").href = url;
    $("#evDoneTitle").textContent = "Opening WhatsApp, " + ($("#evName").value.trim().split(" ")[0] || "friend") + "…";
    evForm.hidden = true; $("#evDone").hidden = false;
    C.track("Lead", { content_name: "Event enquiry", content_category: $("#evType").value });
    window.open(url, "_blank", "noopener");
  });
  $("#evReset").addEventListener("click", function () { evForm.reset(); evSend.setAttribute("aria-disabled", "true"); $("#evDone").hidden = true; evForm.hidden = false; $("#evName").focus(); });

  /* ---------- FAQ: one open at a time ---------- */
  $$(".faq details").forEach(function (d) { d.addEventListener("toggle", function () { if (d.open) $$(".faq details").forEach(function (o) { if (o !== d) o.open = false; }); }); });

  /* ---------- booking sheet ---------- */
  var bk = $("#bk"), body = $("#bkBody"), opener = null;
  var SLOTS = [{ label: "Lunch", t: ["12:00 pm", "12:30 pm", "1:00 pm", "1:30 pm", "2:00 pm", "2:30 pm"] }, { label: "Dinner", t: ["7:00 pm", "7:30 pm", "8:00 pm", "8:30 pm", "9:00 pm", "9:30 pm", "10:00 pm"] }];
  var SEAT = [["Restaurant", "Indoor · AC"], ["Outdoor", "Open-air, greenery"], ["Bar & Lounge", "Live-music corner"], ["Private room", "Best for 6+ · candlelight"]];
  var OCC = ["None", "Birthday", "Anniversary", "Business", "Date night"];
  function mins(t) { var m = t.match(/(\d+):(\d+)\s*(am|pm)/i), h = +m[1] % 12 + (m[3].toLowerCase() === "pm" ? 12 : 0); return h * 60 + +m[2]; }
  function nowMinsIST() { try { var p = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).formatToParts(new Date()); var g = function (t) { return +p.filter(function (x) { return x.type === t; })[0].value; }; return (g("hour") % 24) * 60 + g("minute"); } catch (e) { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); } }
  function slotPast(t) { return S.dateIdx === 0 && mins(t) < nowMinsIST() + 30; }
  function valid() { return [true, !!S.time, S.name.trim().length > 1 && S.phone.replace(/\D/g, "").length >= 10][S.step]; }
  function guestNote() { return S.guests >= 20 ? "For 20+, try our banquet halls" : S.guests >= 6 ? "Private room available" : "Up to 20 online"; }
  function sumLine() { return dateLong(S.dateIdx) + " · " + guestsTxt() + (S.time ? " · " + S.time : "") + " · " + S.seat; }
  function waText() {
    return "Hi Bharat Fine Dine! Booking request " + S.ref + ": table for " + S.guests + " on " + dateLong(S.dateIdx) + " at " + S.time + ", " + S.seat + ". Name: " + S.name.trim() + ". Phone: " + S.phone.trim() + "." +
      (S.occasion !== "None" ? " Occasion: " + S.occasion + "." : "") + (S.notes.trim() ? " Note: " + S.notes.trim() : "");
  }
  function calUrl() {
    var d = DATES[S.dateIdx], m = mins(S.time), p = function (n) { return (n < 10 ? "0" : "") + n; };
    var ymd = d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate());
    var st = ymd + "T" + p(Math.floor(m / 60)) + p(m % 60) + "00", e2 = m + 120, en = ymd + "T" + p(Math.floor(e2 / 60) % 24) + p(e2 % 60) + "00";
    return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent("Table at Bharat Fine Dine (" + S.guests + ")") + "&dates=" + st + "/" + en + "&ctz=Asia/Kolkata&location=" + encodeURIComponent("Bharat Fine Dine, Plot No. B-37, MIDC Area, Latur 413531") + "&details=" + encodeURIComponent("Booking request " + S.ref + ". Call +91 91262 68181 for changes.");
  }
  var sel = function (on) { return ' aria-pressed="' + !!on + '"'; };

  function render(stepChanged) {
    $("#bkSteps").innerHTML = ["Who & when", "Time & table", "Your details"].map(function (l, i) { return '<div class="' + (i <= S.step ? "on" : "") + '"><i></i><span>' + l + "</span></div>"; }).join("");
    var h = "";
    if (S.step === 0) {
      h = '<div class="grp"><h3>Who\'s coming?</h3><div class="tiles">' + PARTY.map(function (p, i) { return '<button type="button" class="tile" data-act="party" data-v="' + i + '"' + sel(S.party === p.en) + "><b>" + esc(p.en) + "</b><span>" + esc(p.sub) + "</span></button>"; }).join("") + "</div></div>" +
        '<div class="grp"><h3 style="font-size:20px">When?</h3><div class="dates" role="group" aria-label="Date">' + DATES.map(function (d, i) {
          var dow = i === 0 ? "Today" : i === 1 ? "Tmrw" : d.toLocaleDateString("en-IN", { weekday: "short" });
          return '<button type="button" class="date" data-act="date" data-v="' + i + '"' + sel(i === S.dateIdx) + ' aria-label="' + esc(d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })) + '"><small>' + dow + "</small><b>" + d.getDate() + "</b><small>" + d.toLocaleDateString("en-IN", { month: "short" }) + "</small></button>";
        }).join("") + "</div></div>" +
        '<div class="stepper"><div class="t"><b>Guests</b><span>' + guestNote() + '</span></div><div class="c"><button type="button" data-act="dec" aria-label="Fewer guests">−</button><output aria-live="polite">' + S.guests + '</output><button type="button" data-act="inc" aria-label="More guests">+</button></div></div>';
    } else if (S.step === 1) {
      var anyOpen = false;
      h = '<h3 class="big">Pick a time &amp; a table</h3>' + SLOTS.map(function (g) {
        return '<div class="grp" style="gap:8px"><span class="lbl">' + g.label + '</span><div class="slots">' + g.t.map(function (t) { var past = slotPast(t); if (!past) anyOpen = true; return '<button type="button" class="slot" data-act="time" data-v="' + t + '"' + sel(S.time === t) + (past ? " disabled" : "") + ">" + t + "</button>"; }).join("") + "</div></div>";
      }).join("") + (anyOpen ? "" : '<span class="candle">Today\'s slots have passed. Go back and pick another day, or call us on +91 91262 68181.</span>') +
        '<div class="grp" style="gap:8px"><span class="lbl">Where would you like to sit?</span><div class="tiles" style="gap:6px">' + SEAT.map(function (o) { return '<button type="button" class="tile sm" data-act="seat" data-v="' + esc(o[0]) + '"' + sel(S.seat === o[0]) + "><b>" + esc(o[0]) + "</b><span>" + esc(o[1]) + "</span></button>"; }).join("") + "</div></div>";
    } else if (S.step === 2) {
      var digits = S.phone.replace(/\D/g, "").length;
      h = '<h3 class="big">Who\'s the table for?</h3>' +
        '<label class="f">Your name<input class="fld" data-in="name" value="' + esc(S.name) + '" placeholder="Full name" autocomplete="name"></label>' +
        '<label class="f">WhatsApp number<input class="fld" data-in="phone" value="' + esc(S.phone) + '" placeholder="+91 98xxx xxxxx" inputmode="tel" autocomplete="tel"></label>' +
        (S.phone && digits < 10 ? '<span class="err" style="margin-top:-8px">Please enter at least 10 digits.</span>' : "") +
        '<div class="grp" style="gap:8px"><span style="font-size:13px;font-weight:600">Celebrating something?</span><div class="chips">' + OCC.map(function (o) { return '<button type="button" class="chip" data-act="occ" data-v="' + o + '"' + sel(S.occasion === o) + ">" + o + "</button>"; }).join("") + "</div>" +
        (S.occasion === "Birthday" || S.occasion === "Anniversary" ? '<span class="candle">We can set up candlelight in a private room for this. We\'ll confirm on WhatsApp.</span>' : "") + "</div>" +
        '<label class="f">Requests (optional)<input class="fld" data-in="notes" value="' + esc(S.notes) + '" placeholder="High chair, veg-only table, cake…" style="font-size:15px"></label>';
    } else {
      var first = S.name.trim().split(" ")[0] || "friend";
      var rows = [["Date", dateLong(S.dateIdx)], ["Guests", guestsTxt()], ["Time", S.time], ["Seating", S.seat]];
      if (S.occasion !== "None") rows.push(["Occasion", S.occasion]);
      rows.push(["Reference", S.ref]);
      h = '<div class="done" style="display:flex;flex-direction:column;gap:14px"><img src="img/mural-maharashtra-720.webp" alt="" width="720" height="497">' +
        '<span class="mr" lang="mr">भेटूया!</span><h3 class="big">One last step, ' + esc(first) + ".</h3>" +
        '<span class="fine">Send this message on WhatsApp and we\'ll confirm your table there.</span>' +
        '<div class="sumtbl">' + rows.map(function (r) { return "<div><span>" + r[0] + "</span><b>" + esc(r[1]) + "</b></div>"; }).join("") + "</div>" +
        '<div class="wa-bubble" style="font-size:13px">' + esc(waText()) + "</div>" +
        '<div class="acts"><a class="wa" id="bkWa" href="' + C.wa(waText()) + '" target="_blank" rel="noopener">Send on WhatsApp</a><a class="cal" href="' + calUrl() + '" target="_blank" rel="noopener">Add to calendar</a></div>' +
        '<span class="fine">Need to change something? Call <a href="tel:+919126268181">+91 91262 68181</a>.</span></div>';
    }
    body.innerHTML = h;
    $("#bkFoot").hidden = S.step === 3;
    $("#bkBack").hidden = S.step === 0;
    $("#bkSum").textContent = sumLine();
    var n = $("#bkNext"); n.textContent = S.step === 2 ? "Confirm booking" : "Continue"; n.setAttribute("aria-disabled", !valid());
    if (stepChanged) { body.scrollTop = 0; if (!C.reduce) { body.classList.remove("slide-in"); void body.offsetWidth; body.classList.add("slide-in"); } }
  }
  /* only refresh the bits that depend on typed input, so the field keeps focus */
  function softUpdate() {
    $("#bkNext").setAttribute("aria-disabled", !valid());
    var digits = S.phone.replace(/\D/g, "").length, err = body.querySelector(".err");
    if (S.phone && digits < 10 && !err) { var ph = body.querySelector('[data-in="phone"]').parentNode; ph.insertAdjacentHTML("afterend", '<span class="err" style="margin-top:-8px">Please enter at least 10 digits.</span>'); }
    else if ((!S.phone || digits >= 10) && err) err.remove();
  }
  body.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]"); if (!b || b.disabled) return;
    var a = b.dataset.act, v = b.dataset.v;
    if (a === "party") choose(PARTY[+v]);
    else if (a === "date") { S.dateIdx = +v; if (S.time && slotPast(S.time)) S.time = null; }
    else if (a === "inc") S.guests = Math.min(20, S.guests + 1);
    else if (a === "dec") S.guests = Math.max(1, S.guests - 1);
    else if (a === "time") S.time = v;
    else if (a === "seat") S.seat = v;
    else if (a === "occ") S.occasion = v;
    var sx = body.querySelector(".dates") ? body.querySelector(".dates").scrollLeft : 0;
    render(false); renderHero();
    var dd = body.querySelector(".dates"); if (dd) dd.scrollLeft = sx;
    var again = body.querySelector('[data-act="' + a + '"]' + (v != null ? '[data-v="' + v + '"]' : "")); again && again.focus();
  });
  body.addEventListener("input", function (e) { var f = e.target.dataset.in; if (!f) return; S[f] = e.target.value; $("#bkSum").textContent = sumLine(); softUpdate(); });
  body.addEventListener("focusout", function (e) { if (e.target.dataset.in === "phone") softUpdate(); });
  body.addEventListener("click", function (e) { if (e.target.id === "bkWa") C.track("Lead", { content_name: "Table booking", value: S.guests }); });
  $("#bkNext").addEventListener("click", function () {
    if (!valid()) { if (S.step === 2) { var f = body.querySelector(S.name.trim().length > 1 ? '[data-in="phone"]' : '[data-in="name"]'); f && f.focus(); } return; }
    if (S.step === 2) S.ref = "BFD-" + Math.floor(1000 + Math.random() * 9000);
    S.step++; render(true);
  });
  $("#bkBack").addEventListener("click", function () { S.step = Math.max(0, S.step - 1); render(true); });
  function openBook(from) {
    opener = from || document.activeElement; S.step = 0;
    if (S.dateIdx === 0 && S.time && slotPast(S.time)) S.time = null;
    if (C.closeDrawer && !$("#drawer").hidden) C.closeDrawer();
    render(false); bk.hidden = false; document.body.classList.add("lock"); $("#bkClose").focus();
  }
  function closeBook() { bk.hidden = true; document.body.classList.remove("lock"); opener && opener.focus && opener.focus(); }
  $("#bkClose").addEventListener("click", closeBook);
  bk.addEventListener("click", function (e) { if (e.target === bk) closeBook(); });
  $$("[data-book]").forEach(function (b) { b.addEventListener("click", function () { openBook(b); }); });
  /* "Reserve" on the menu page links to index.html#book */
  if (location.hash === "#book") { history.replaceState(null, "", location.pathname); setTimeout(function () { openBook($(".hero .btn-main")); }, 500); }

  /* keyboard: Esc closes, Tab stays inside open dialogs, arrows move the lightbox */
  document.addEventListener("keydown", function (e) {
    var box = !bk.hidden ? $(".sheet", bk) : !lb.hidden ? lb : null;
    if (!box) return;
    if (e.key === "Escape") { (!bk.hidden ? closeBook : lbClose)(); return; }
    if (!lb.hidden && e.key === "ArrowRight") lbStep(1);
    if (!lb.hidden && e.key === "ArrowLeft") lbStep(-1);
    if (e.key === "Tab") {
      var f = $$('button:not([disabled]):not([hidden]),a[href],input,select,textarea', box).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return; var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });
})();
