#!/usr/bin/env python3
"""Build spaces.html and visit.html. Run from the repo root: python3 tools/pages.py
Edit the SPACES list or the FAQ list below, then re-run. tools/build.py calls this too."""
import html, pathlib, re
ROOT = pathlib.Path(__file__).resolve().parent.parent
V = re.search(r'site\.css\?v=(\d+)', (ROOT / "index.html").read_text(encoding="utf-8")).group(1)
e = html.escape

NAV = ('<a class="l" href="menu.html">Menu</a><a class="l" href="spaces.html">Spaces</a><a class="l" href="events.html">Events</a>'
       '<a class="l" href="visit.html">Visit</a><a class="btn" href="index.html#plan" data-plan>Plan my table</a>'
       '<details class="mnav"><summary aria-label="All pages"><i></i></summary><div><a href="index.html">Home</a><a href="menu.html">Food menu</a><a href="spaces.html">Spaces</a><a href="events.html">Events</a><a href="visit.html">Visit</a><a href="tel:+919126268181">Call +91 91262 68181</a></div></details>')

def page(slug, title, desc, body, bar=True):
    return f'''<!DOCTYPE html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="https://bharatfinedine.com/{slug}.html">
<meta name="theme-color" content="#FAF5EC">
<link rel="icon" href="BFD_favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="BFD_favicon_32.png">
<link rel="apple-touch-icon" href="BFD_apple-touch-icon_180.png">
<meta property="og:type" content="website">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="https://bharatfinedine.com/{slug}.html">
<meta property="og:image" content="https://bharatfinedine.com/og-bharat.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="assets/fonts/archivo-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/instrument-serif.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/site.css?v={V}">
</head>
<body class="has-bar">
<a class="skip" href="#main">Skip to content</a>
<header class="hdr"><div class="wrap">
  <a href="index.html"><img src="img/BFD_logo_horizontal_dark.png" alt="Bharat Fine Dine, home" width="124" height="46"></a>
  <nav aria-label="Main">{NAV}</nav>
</div></header>

<main id="main">
{body}
</main>

<footer class="foot"><div class="legal"><div class="wrap"><span>© <span id="yr">2026</span> Bharat Fine Dine · by Sardesai's Kitchen · FSSAI Lic. No. 11524049000056</span><span><a href="index.html">Home</a> · <a href="menu.html">Menu</a> · <a href="spaces.html">Spaces</a> · <a href="events.html">Events</a> · <a href="visit.html">Visit</a></span></div></div></footer>
<div class="mbar" aria-label="Quick actions"><a href="tel:+919126268181">Call</a><a href="https://www.google.com/maps/dir/?api=1&amp;destination=18.4099037,76.5422986" target="_blank" rel="noopener">Directions</a><button type="button" class="go" data-plan>Plan my table</button></div>
<script src="assets/app.min.js?v={V}" defer></script>
</body>
</html>
'''

# ---------------- spaces ----------------
SPACES = [
    dict(k="dining", name="Fine-dine restaurant", seat="Restaurant", lead="img/svc-dining-720.webp",
         desc="Air-conditioned indoor dining across seven kitchens, with a full vegetarian menu alongside. The mural runs along one wall.",
         facts=["Indoor, air-conditioned", "All seven kitchens", "Families and groups"]),
    dict(k="outdoor", name="Outdoor dining", seat="Outdoor", lead="img/svc-garden-720.webp",
         desc="Open-air seating wrapped in greenery and soft light. Our signature table for easy evenings.",
         facts=["Open air, among the plants", "Best after sunset", "Candlelight on request"]),
    dict(k="bar", name="The Bar & Lounge", seat="Bar & Lounge", lead="img/spaces/thumb/bar-3.webp",
         desc="A relaxed, separate bar with a live-music corner, a curated pour and fair prices.",
         facts=["Separate from the dining room", "Live-music corner", "Good for a group of friends"]),
    dict(k="private", name="Private dining rooms", seat="Private room", lead="img/svc-private-720.webp",
         desc="Marble-table rooms for celebrations and business lunches. A room to yourselves, with candlelight set up on request.",
         facts=["Best for six or more", "Birthdays and anniversaries", "Business lunches"]),
    dict(k="meeting", name="Board & meeting rooms", seat=None, lead="img/svc-meeting-720.webp",
         desc="Board rooms with screens and catering on tap, built for meetings and offsites.",
         facts=["AV-ready", "Catering from our kitchens", "Half-day and full-day"]),
    dict(k="hall", name="Banquet halls", seat=None, lead="img/svc-hall-720.webp",
         desc="Samiksha and Sanskruti: two halls of about 300 to 350 seats each, for weddings, receptions and functions, with full catering.",
         facts=["Two halls, 300 to 350 seats each", "Weddings and receptions", "Custom veg and non-veg spreads"]),
]
jump = "".join(f'<a class="chip" href="#sp-{s["k"]}">{e(s["name"])}</a>' for s in SPACES)
secs = []
for i, s in enumerate(SPACES):
    gal = "".join(f'<button type="button" data-lbk="{s["k"]}" data-lbn="{n}" data-lbname="{e(s["name"])}" aria-label="Open {e(s["name"])}, photo {n}">'
                  f'<img src="img/spaces/t400/{s["k"]}-{n}.webp" alt="" width="400" height="266" loading="lazy"></button>' for n in range(1, 7))
    act = (f'<button type="button" class="btn" data-plan="{e(s["seat"])}">Plan a table here</button>' if s["seat"]
           else '<a class="btn" href="events.html">Open the event planner</a>')
    facts = "".join(f"<li>{e(f)}</li>" for f in s["facts"])
    secs.append(f'''  <section class="sec sp{' alt' if i % 2 else ''}" id="sp-{s["k"]}" aria-labelledby="h-{s["k"]}" data-rv>
    <div class="wrap split">
      <img class="photo lead" src="{s["lead"]}" alt="{e(s["name"])}" width="1200" height="798"{'' if i == 0 else ' loading="lazy"'}>
      <div class="stack">
        <span class="kick">Space {i + 1} of {len(SPACES)}</span>
        <h2 class="h2" id="h-{s["k"]}">{e(s["name"])}</h2>
        <p class="lede">{e(s["desc"])}</p>
        <ul class="why">{facts}</ul>
        {act}
      </div>
    </div>
    <div class="wrap"><div class="gal">{gal}</div></div>
  </section>''')
body = f'''  <div class="wrap phead">
    <span class="kick">Six spaces, one address</span>
    <h1 class="h1">Rooms for <em>every kind of evening</em></h1>
    <p class="lede">A dining room, a garden, a bar, private rooms, board rooms and two banquet halls. Every hall is air-conditioned. Tap any photo to look closer.</p>
    <div class="chips jump">{jump}</div>
  </div>
''' + "\n".join(secs)
(ROOT / "spaces.html").write_text(page("spaces", "Spaces · Bharat Fine Dine, Latur | Dining, garden, bar, halls",
    "Six spaces at Bharat Fine Dine, Latur MIDC: fine-dine restaurant, outdoor dining, bar and lounge, private dining rooms, board rooms and two banquet halls. See photos and plan a table.", body), encoding="utf-8")

# ---------------- visit ----------------
FAQ = [
    ("Do you serve both veg and non-veg?", "Yes. There’s a full vegetarian menu alongside the non-veg one. Tell us your preference when you book."),
    ("Is it good for kids and families?", "Very. Children are looked after, there are private rooms for big families, and nobody is rushed."),
    ("Can you set up a birthday or anniversary?", "Yes. Candlelight can be set up in a private dining room. Just mention it when you plan your table."),
    ("Is there a bar?", "Yes, a relaxed, separate bar with a live-music corner and fair prices."),
    ("Can you host weddings and corporate meetings?", 'Yes. We have two banquet halls, Samiksha and Sanskruti, and AV-ready board rooms for meetings and offsites. Use the <a href="events.html">event planner</a>.'),
    ("Is parking available?", "Yes, on-site parking at the venue in Latur MIDC."),
    ("How do I book a table?", "Tap “Plan my table”, choose who is coming and when, and send the request on WhatsApp. Your table is held once we reply to confirm."),
]
faq = "\n          ".join(f"<details><summary>{e(q)}</summary><p>{a}</p></details>" for q, a in FAQ)
DIR = "https://www.google.com/maps/dir/?api=1&amp;destination=18.4099037,76.5422986"
body = f'''  <div class="wrap phead">
    <span class="kick">Latur MIDC</span>
    <h1 class="h1">Come as guests, <em>leave as family</em></h1>
    <p class="lede">We are open every day from 11 in the morning to 11 at night, with parking on site.</p>
  </div>
  <section class="sec tight">
    <div class="wrap">
      <div class="card vcard">
        <div class="vphoto">
          <img src="img/spaces/thumb/outdoor-4.webp" srcset="img/spaces/thumb/outdoor-4.webp 700w, img/spaces/outdoor-4.webp 1400w" sizes="(min-width: 900px) 560px, 100vw" alt="The entrance, with the Sardesai's Kitchen and Bharat Fine Dine signs" width="1400" height="932">
          <figure><img src="img/spaces/t400/outdoor-5.webp" alt="The Bharat Fine Dine building seen from the road, behind a row of trees" width="400" height="266"><figcaption>From the road</figcaption></figure>
        </div>
        <div class="vtx">
          <h2 class="h2">Find us</h2>
          <dl class="vinfo">
            <div><dt>Address</dt><dd>Plot No. B-37, MIDC Area, Latur, Maharashtra 413531</dd></div>
            <div><dt>Hours</dt><dd>Every day · 11 AM – 11 PM<br><span class="status" data-status><i></i><span>Open daily</span></span></dd></div>
            <div><dt>Lunch</dt><dd>Tables from 12:00 to 2:30 pm</dd></div>
            <div><dt>Dinner</dt><dd>Tables from 7:00 to 10:00 pm</dd></div>
            <div><dt>Parking</dt><dd>On site</dd></div>
            <div><dt>Contact</dt><dd><address><a href="tel:+919126268181">+91 91262 68181</a><br><a href="mailto:hello@bharatfinedine.com">hello@bharatfinedine.com</a></address></dd></div>
          </dl>
          <div class="cta"><a class="btn" href="{DIR}" target="_blank" rel="noopener">Get directions</a><a class="btn line" href="tel:+919126268181">Call us</a></div>
        </div>
      </div>
    </div>
  </section>
  <section class="sec tight" aria-labelledby="fq" data-rv>
    <div class="wrap split top">
      <div class="stack">
        <h2 class="h2" id="fq">Before <em>you visit</em></h2>
        <p class="lede">The questions we are asked most. For anything else, call or message us.</p>
        <a class="btn wa" href="https://wa.me/919126268181?text=Hi%20Bharat%20Fine%20Dine!%20I%20have%20a%20question." target="_blank" rel="noopener">Ask on WhatsApp</a>
      </div>
      <div class="faq">
          {faq}
      </div>
    </div>
  </section>
  <section class="band" data-rv>
    <div class="wrap sec split">
      <div class="stack"><h2 class="h2">Planning something <em>bigger?</em></h2><p class="lede">Weddings, receptions, birthdays and offsites. Tell us the day and the guest count and see which hall or room fits.</p><a class="btn" href="events.html">Open the event planner</a></div>
      <div class="stack"><h2 class="h2">Want to see <em>the rooms?</em></h2><p class="lede">Six spaces, from the garden to the banquet halls, with photos of each.</p><a class="btn line" href="spaces.html">See our spaces</a></div>
    </div>
  </section>'''
(ROOT / "visit.html").write_text(page("visit", "Visit · Bharat Fine Dine, Latur | Address, hours, parking, directions",
    "Find Bharat Fine Dine at Plot B-37, MIDC Area, Latur. Open daily 11 AM to 11 PM with on-site parking. Directions, phone, booking and answers to common questions.", body), encoding="utf-8")
print("spaces.html and visit.html written")
