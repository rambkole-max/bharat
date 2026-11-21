#!/usr/bin/env python3
"""Make the zip to upload to the host. Run from the repo root.

  python3 tools/package.py            -> bharat-site-live.zip  (for bharatfinedine.com)
  python3 tools/package.py --test URL -> bharat-site-test.zip  (for a test address; hidden from search engines)

The live zip lets search engines in and carries the Google verification file.
The test zip blocks search engines and points link previews at the test address.
Never upload a test zip to the real site."""
import os, sys, zipfile, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
test = "--test" in sys.argv
test_url = sys.argv[sys.argv.index("--test") + 1].rstrip("/") if test else None
out = pathlib.Path(sys.argv[-1]) if sys.argv[-1].endswith(".zip") else ROOT.parent / ("bharat-site-test.zip" if test else "bharat-site-live.zip")
PAGES = ["index.html", "menu.html", "events.html", "spaces.html", "visit.html", "404.html"]
z = zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED)
for f in PAGES:
    t = (ROOT / f).read_text(encoding="utf-8")
    if test: t = t.replace("https://bharatfinedine.com/og-bharat.jpg", test_url + "/og-bharat.jpg")
    z.writestr(f, t)
for f in ["og-bharat.jpg", "sitemap.xml", "_headers", "BFD_favicon.ico"] + sorted(x for x in os.listdir(ROOT) if x.startswith("BFD_") and x.endswith(".png")):
    z.write(ROOT / f, f)
for d in ["assets", "img"]:
    for root, _, files in os.walk(ROOT / d):
        for x in sorted(files):
            p = pathlib.Path(root) / x; rel = p.relative_to(ROOT).as_posix()
            if rel != "assets/app.js": z.write(p, rel)          # the readable source stays out; app.min.js is what the pages load
if test:
    z.writestr("robots.txt", "User-agent: *\nDisallow: /\n")
else:
    z.write(ROOT / "robots.txt", "robots.txt")
    for x in sorted(os.listdir(ROOT)):
        if x.startswith("google") and x.endswith(".html"): z.write(ROOT / x, x)   # Search Console ownership file
z.close()
names = zipfile.ZipFile(out).namelist()
robots = zipfile.ZipFile(out).read("robots.txt").decode()
assert test or "Disallow: /" not in robots, "live zip must not block search engines"
print(out, len(names), "files,", os.path.getsize(out) // 1024, "KB,", "TEST (hidden from search)" if test else "LIVE (search engines allowed)")
