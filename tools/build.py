#!/usr/bin/env python3
"""Build menu.html and assets/data.js from data/menu.json.

Run from the repo root:  python3 tools/build.py
Edit dishes and prices in data/menu.json, edit kitchens below, then re-run.
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MENU = json.loads((ROOT / "data" / "menu.json").read_text(encoding="utf-8"))

# The seven stops, in wall order. `featured` = (name exactly as in menu.json, name to show).
# `pin` = where the stop sits on the mural, in % of the image (None = not on the main wall).
KITCHENS = [
    dict(id="punjabi", name="Punjabi", title="The Punjabi kitchen", sub="Punjab · North", color="#74540D", ink="#74540D",
         art="img/mural-punjab-720.webp", thumb="img/mural-punjab-480.webp", pin=(22, 20),
         line="The Golden Temple, the dhol, and a basket of naan.",
         featured=[("Paneer Sultani", None), ("Malai Kofta", None), ("Veg Patiyala", None), ("Kaju Curry", None)]),
    dict(id="tandoor", short="Tandoor", name="Tandoor & BBQ", title="Tandoor & BBQ", sub="Off the coal", color="#B23B2B", ink="#9A3023",
         art="img/mural-tandoor-720.webp", thumb="img/mural-tandoor-480.webp", pin=(84, 38),
         line="Coal under the tandoor, and kebabs straight off the skewer.",
         featured=[("Murgh Malai Tikka", None), ("Paneer Malai Tikka", None), ("Tandoor Chicken Full/Half", "Tandoor Chicken"), ("Murgh Seekh Kebab", None)]),
    dict(id="mughlai", name="Mughlai", title="The Mughlai kitchen", sub="Awadh · Lucknow", color="#A05610", ink="#8A4A0C",
         art="img/mural-mughlai-720.webp", thumb="img/mural-mughlai-480.webp", pin=(71, 13),
         line="Lucknow’s gateway, a nawab at ease, and slow dum handis.",
         featured=[("Chicken Mughlai", None), ("Mutton Rogan Josh", None), ("Veg Dum Biryani", None), ("Butter Chicken", None)]),
    dict(id="maharashtrian", name="Maharashtrian", title="The Maharashtrian kitchen", sub="Home ground", color="#8C2D46", ink="#8C2D46",
         art="img/mural-maharashtra-720.webp", thumb="img/mural-maharashtra-480.webp", pin=(45, 58),
         line="Kolhapuri heat and Saoji spice from next door.",
         featured=[("Chicken Kolhapuri Full/Half", "Chicken Kolhapuri"), ("Veg Saoji", None), ("Shev Bhaji", None), ("Chicken Sukha", None)]),
    dict(id="coastal", short="Coastal", name="Coastal & Seafood", title="Coastal & Seafood", sub="Konkan to Kerala", color="#163E52", ink="#163E52",
         art="img/mural-goa-720.webp", thumb="img/mural-goa-480.webp", pin=(7, 60),
         line="Church bells, backwater boats and the day’s catch.",
         featured=[("Fish (Amritsari/Ajwaini/Achari/Lasuni)", "Fish Amritsari"), ("Prawns (Koliwada/Rava/Tawa/Tandoori)", "Prawns Koliwada"),
                   ("Surmai Curry (Goan/Kerala/Mangalorean)", "Surmai Curry"), ("Pomfret (Tawa/Tandoori/Rava)", "Pomfret Tawa")]),
    dict(id="continental", name="Continental", title="The Continental kitchen", sub="Beyond Bharat", color="#48532A", ink="#48532A",
         art="img/mural-continental.webp", thumb="img/mural-continental-300.webp", pin=(38, 40),
         line="Grills, salads, sizzlers, pizza and pasta.",
         featured=[("Waldorf Salad", None), ("Cheese Club Sandwich", None), ("Grilled Chicken Salad", None), ("Veg Club Sandwich", None)]),
    dict(id="oriental", short="Chinese", name="Chinese & Oriental", title="Chinese & Oriental", sub="The East", color="#0F4E37", ink="#0F4E37",
         art="img/mural-oriental.webp", thumb="img/mural-oriental-300.webp", pin=(51.5, 40),
         line="Wok-tossed starters, noodles, rice bowls and Thai curries.",
         featured=[("Veg Hakka Noodles", None), ("Burnt Garlic Noodles", None), ("Crispy Honey Chilli Chicken", None), ("Veg Spring Roll", None)]),
]
MORE = dict(id="other", name="Drinks & more", title="Drinks, soups and desserts", sub="For the table", color="#1E1B18", ink="#1E1B18",
            line="Juices, mocktails, soups, salads and something sweet.")

e = html.escape


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def price(p):
    return "As per size" if p.strip().upper() == "APS" else p


by_kitchen = {}
for sec in MENU["sections"]:
    by_kitchen.setdefault(sec["kitchen"], []).append(sec)
all_items = {it["name"]: it for sec in MENU["sections"] for it in sec["items"]}


def counts(kid):
    items = [it for sec in by_kitchen.get(kid, []) for it in sec["items"]]
    return len(items), sum(1 for it in items if it["veg"])


# ---------- assets/data.js ----------
data = []
for i, k in enumerate(KITCHENS, 1):
    n, v = counts(k["id"])
    dishes = []
    for match, show in k["featured"]:
        it = all_items[match]  # KeyError here = a featured dish was renamed in menu.json
        dishes.append({"name": show or it["name"], "veg": it["veg"], "price": price(it["price"])})
    data.append({"n": i, "id": k["id"], "name": k["name"], "title": k["title"], "sub": k["sub"], "color": k["color"], "ink": k["ink"],
                 "art": k["art"], "thumb": k["thumb"], "pin": k["pin"], "line": k["line"], "count": n, "veg": v, "dishes": dishes})
(ROOT / "assets" / "data.js").write_text(
    "/* Generated by tools/build.py from data/menu.json. Do not edit by hand. */\nwindow.BFD_KITCHENS = "
    + json.dumps(data, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")


# ---------- menu.html ----------
def item_html(sec, it):
    iid = slug(sec["id"] + "-" + it["name"])
    search = (it["name"] + " " + it.get("desc", "")).lower()
    desc = f'<p>{e(it["desc"])}</p>' if it.get("desc") else ""
    veg = "1" if it["veg"] else "0"
    return (f'<li class="item" id="{iid}" data-veg="{veg}" data-s="{e(search)}">'
            f'<span class="mark{"" if it["veg"] else " nv"}" aria-hidden="true"></span><span class="sr">{"Veg" if it["veg"] else "Non-veg"}.</span>'
            f'<div class="t"><div class="nm"><span>{e(it["name"])}</span><b>{e(price(it["price"]))}</b></div>{desc}</div>'
            f'<button type="button" class="add" aria-pressed="false" aria-label="Add {e(it["name"])} to my list" '
            f'data-add="{iid}" data-name="{e(it["name"])}" data-price="{e(price(it["price"]))}">+</button></li>')


def kitchen_html(k, n, nxt):
    total, veg = counts(k["id"])
    kind = "all veg" if veg == total else ("seafood" if veg == 0 else f"{veg} veg")
    stop = f"Stop {n} of 7 · {e(k['sub'])}" if n else e(k["sub"])
    art = (f'<img src="{k["art"]}" alt="{e(k["name"])} scene from our mural" width="720" height="300" loading="lazy" decoding="async">'
           if k.get("art") else "")
    out = [f'<section class="kit" id="k-{k["id"]}" data-k="{k["id"]}" style="--k:{k["color"]}" aria-labelledby="kh-{k["id"]}">',
           f'<div class="card flat kban">{art}<div class="tx"><span class="kick" style="--k:{k["ink"]}">{stop}</span>'
           f'<h2 class="h3" id="kh-{k["id"]}">{e(k["title"])}</h2><p>{e(k["line"])} <b>{total}</b> dishes · {kind}.</p></div></div>']
    for sec in by_kitchen.get(k["id"], []):
        out.append(f'<div class="card flat msec" id="{sec["id"]}"><div class="mh"><h3>{e(sec["title"])}</h3>'
                   f'<small>{len(sec["items"])} dishes</small></div><ul class="items">'
                   + "".join(item_html(sec, it) for it in sec["items"]) + "</ul></div>")
    if nxt:
        img = f'<img src="{nxt["thumb"]}" alt="" width="84" height="64" loading="lazy">' if nxt.get("thumb") else ""
        out.append(f'<a class="card flat nextstop" href="#k-{nxt["id"]}" data-go="{nxt["id"]}">{img}'
                   f'<span><span class="kick" style="--k:{nxt["ink"]}">Next stop</span><b>{e(nxt["name"])} · {e(nxt["sub"])}</b></span>'
                   f'<span aria-hidden="true">→</span></a>')
    out.append("</section>")
    return "\n".join(out)


stops = KITCHENS + [MORE]
rail = "".join(
    f'<button type="button" class="chip" data-go="{k["id"]}" aria-pressed="{"true" if i == 0 else "false"}" style="--k:{k["color"]}">'
    + (f'<span class="dot">{i + 1}</span>' if i < 7 else "") + f'{e(k.get("short", k["name"]))}</button>'
    for i, k in enumerate(stops))
kits = "\n".join(kitchen_html(k, i + 1 if i < 7 else 0, stops[i + 1] if i + 1 < len(stops) else KITCHENS[0])
                 for i, k in enumerate(stops))
total_items = sum(len(s["items"]) for s in MENU["sections"])


def offer(it):
    m = re.search(r"₹(\d+)", it["price"])
    o = {"@type": "MenuItem", "name": it["name"],
         "suitableForDiet": "https://schema.org/VegetarianDiet"} if it["veg"] else {"@type": "MenuItem", "name": it["name"]}
    if it.get("desc"):
        o["description"] = it["desc"]
    if m:
        o["offers"] = {"@type": "Offer", "price": m.group(1), "priceCurrency": "INR"}
    return o


ld = {"@context": "https://schema.org", "@type": "Menu", "name": "Bharat Fine Dine Menu", "inLanguage": "en-IN",
      "hasMenuSection": [{"@type": "MenuSection", "name": s["title"], "hasMenuItem": [offer(it) for it in s["items"]]}
                         for s in MENU["sections"]]}

PAGE = f"""<!DOCTYPE html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Menu · Bharat Fine Dine, Latur | {total_items} dishes, seven kitchens</title>
<meta name="description" content="Full menu for Bharat Fine Dine by Sardesai's Kitchen, Latur: Punjabi, tandoor, Mughlai, Maharashtrian, coastal, Continental and Chinese, plus drinks, soups and desserts. Search, filter veg, and build a list for your table.">
<link rel="canonical" href="https://bharatfinedine.com/menu.html">
<meta name="theme-color" content="#FAF5EC">
<link rel="icon" href="BFD_favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="BFD_favicon_32.png">
<link rel="apple-touch-icon" href="BFD_apple-touch-icon_180.png">
<meta property="og:type" content="website">
<meta property="og:title" content="Menu · Bharat Fine Dine by Sardesai's Kitchen">
<meta property="og:description" content="{total_items} dishes across seven kitchens. Latur MIDC.">
<meta property="og:url" content="https://bharatfinedine.com/menu.html">
<meta property="og:image" content="https://bharatfinedine.com/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="assets/fonts/archivo-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/site.css?v=20261219">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False, separators=(",", ":"))}</script>
<noscript><style>.add,.search,#vegOnly,.mgrid aside,.mbar .cnt{{display:none!important}}</style></noscript>
</head>
<body class="has-bar">
<a class="skip" href="#main">Skip to content</a>
<header class="hdr"><div class="wrap">
  <a href="index.html"><img src="img/BFD_logo_horizontal_dark.png" alt="Bharat Fine Dine, home" width="124" height="46"></a>
  <nav aria-label="Main"><a class="l" href="menu.html">Menu</a><a class="l" href="spaces.html">Spaces</a><a class="l" href="events.html">Events</a><a class="l" href="visit.html">Visit</a><a class="btn" href="index.html#plan" data-plan>Plan my table</a><details class="mnav"><summary aria-label="All pages"><i></i></summary><div><a href="index.html">Home</a><a href="menu.html">Food menu</a><a href="spaces.html">Spaces</a><a href="events.html">Events</a><a href="visit.html">Visit</a><a href="tel:+919126268181">Call +91 91262 68181</a></div></details></nav>
</div></header>
<main id="main" class="wrap">
  <div class="mhead">
    <div class="l"><span class="mr mrk" lang="mr">काय मागवायचं?</span><h1 class="h2">The menu</h1></div>
    <div class="r"><span class="note">Follow the wall, one stop at a time, or search all {total_items} dishes.</span>
      <label class="search"><span aria-hidden="true">⌕</span><span class="sr">Search dishes</span><input type="search" id="q" placeholder="Search paneer, biryani, kolhapuri" autocomplete="off"></label></div>
  </div>
  <div class="railbox"><div class="rail" id="rail" role="group" aria-label="Kitchens">{rail}<button type="button" class="chip" id="vegOnly" aria-pressed="false"><span class="mark" aria-hidden="true"></span>Veg only</button></div></div>
  <div class="mgrid">
    <aside aria-label="My list">
      <div class="mylist" id="mylist" hidden></div>
    </aside>
    <div id="kits">
{kits}
      <p class="nores" id="nores" hidden>Nothing matches. Try another word, or switch off “Veg only”.</p>
    </div>
  </div>
</main>
<footer class="foot"><div class="legal"><div class="wrap"><span>© 2026 Bharat Fine Dine · by Sardesai's Kitchen · FSSAI Lic. No. 11524049000056</span><span><a href="index.html">Home</a> · <a href="events.html">Events</a> · <a href="tel:+919126268181">+91 91262 68181</a></span></div></div></footer>
<div class="mbar" aria-label="Quick actions"><a class="cnt" id="barCount" href="#mylist">Add dishes with +</a><a class="go" href="index.html#plan" data-plan>Plan my table</a></div>
<script src="assets/data.js?v=20261219" defer></script>
<script src="assets/app.min.js?v=20261219" defer></script>
</body>
</html>
"""
(ROOT / "menu.html").write_text(PAGE, encoding="utf-8")
# ---------- index.html: the stop card shown before JavaScript runs ----------
k = data[0]
card = ('<div class="top"><span class="kick" style="--k:%s">Stop 1 of %d<span class="rg"> · %s</span></span></div><h2 class="h3">%s</h2><p class="line">%s</p>' % (k["ink"], len(data), e(k["sub"]), e(k["title"]), e(k["line"]))
        + "".join('<div class="dish"><span class="mark%s" aria-hidden="true"></span><span class="n">%s</span><b>%s</b></div>' % ("" if d["veg"] else " nv", e(d["name"]), e(d["price"])) for d in k["dishes"])
        + '<a class="lnk" href="menu.html#k-%s">See all %d %s dishes →</a>' % (k["id"], k["count"], e(k["name"])))
idx = ROOT / "index.html"
src = idx.read_text(encoding="utf-8")
src = re.sub(r"<!--stop:start-->.*?<!--stop:end-->", lambda m: "<!--stop:start-->\n        " + card + "\n        <!--stop:end-->", src, flags=re.S)
idx.write_text(src, encoding="utf-8")
print(f"menu.html: {total_items} dishes in {len(MENU['sections'])} sections; data.js: {len(data)} kitchens")

# ---------- assets/app.min.js: the pages load this, not app.js ----------
import shutil, subprocess
npx = shutil.which("npx")
try:
    if not npx:
        raise RuntimeError("npx (Node.js) not found")
    subprocess.run([npx, "--yes", "terser", str(ROOT / "assets" / "app.js"), "--compress", "--mangle", "--comments", "false",
                    "--output", str(ROOT / "assets" / "app.min.js")], check=True)
    print("app.min.js: %d bytes (from %d)" % ((ROOT / "assets" / "app.min.js").stat().st_size, (ROOT / "assets" / "app.js").stat().st_size))
except Exception as err:  # keep the site working even without Node: ship the readable file
    shutil.copyfile(ROOT / "assets" / "app.js", ROOT / "assets" / "app.min.js")
    print("WARNING: could not minify (%s). app.min.js is an unminified copy of app.js." % err)

# ---------- spaces.html and visit.html ----------
import runpy
runpy.run_path(str(ROOT / "tools" / "pages.py"))
