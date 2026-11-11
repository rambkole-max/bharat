/* Bharat Fine Dine — menu page: search, veg filter, kitchen filter */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var st = { q: "", diet: "all", grp: "all" };
  var secs = $$(".msec"), bar = $("#fbar");
  function offset() { return (bar ? bar.offsetHeight : 120) + 12; }
  function go(id, smooth) {
    var el = document.getElementById(id); if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset(), behavior: smooth === false || window.BFD.reduce ? "auto" : "smooth" });
  }
  function apply() {
    var q = st.q.trim().toLowerCase(), shown = 0, seenGrp = {};
    secs.forEach(function (s) {
      var g = s.dataset.grp, okG = st.grp === "all" || st.grp === g, n = 0;
      $$(".item", s).forEach(function (li) {
        var veg = li.dataset.veg === "1";
        var ok = okG && (st.diet === "all" || (st.diet === "veg" ? veg : !veg)) && (!q || li.dataset.s.indexOf(q) > -1);
        li.hidden = !ok; if (ok) n++;
      });
      s.hidden = n === 0; $("[data-n]", s).textContent = n;
      /* kitchen art banner: only on the first visible section of each kitchen, and not while searching */
      var ban = $(".kban", s); if (ban) ban.hidden = !!q;
      var link = $('.side a[data-sec="' + s.id + '"]'); if (link) { link.hidden = n === 0; $("small", link).textContent = n; }
      shown += n;
    });
    $("#nores").hidden = shown > 0;
  }
  var t; $("#q").addEventListener("input", function (e) { clearTimeout(t); t = setTimeout(function () { st.q = e.target.value; apply(); if (window.scrollY > bar.offsetTop + 4) window.scrollTo({ top: bar.offsetTop }); }, 80); });
  $$("[data-diet]").forEach(function (b) { b.addEventListener("click", function () { st.diet = b.dataset.diet; $$("[data-diet]").forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); apply(); }); });
  $$(".gchips [data-grp]").forEach(function (b) {
    b.addEventListener("click", function () {
      st.grp = b.dataset.grp; $$(".gchips [data-grp]").forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); apply();
      window.scrollTo({ top: bar.offsetTop, behavior: window.BFD.reduce ? "auto" : "smooth" });
    });
  });
  $$(".side a").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); go(a.dataset.sec); history.replaceState(null, "", "#" + a.dataset.sec); }); });
  var top = $("#toTop"); top && top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: window.BFD.reduce ? "auto" : "smooth" }); });
  /* deep link from the homepage, e.g. menu.html#punjabi-main-course */
  var h = decodeURIComponent(location.hash.slice(1));
  if (h && document.getElementById(h)) { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; setTimeout(function () { go(h, false); }, 60); window.addEventListener("load", function () { go(h, false); }); }
})();
