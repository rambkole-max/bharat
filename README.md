# Bharat Fine Dine — Website v2

Built 6 Oct 2026 from `../design_handoff_bharat_fine_dine/`. Static HTML/CSS/JS with no framework and no build step to deploy.
The live site is still `../Website/`. Nothing has been deployed yet.

## Deploy
Upload **the contents of this folder** to the site root of `bharatfinedine.com`: `index.html`, `menu.html`, `assets/`, `img/`, the favicons, `og-image.jpg`, `robots.txt` and `sitemap.xml`. You can skip this README.
Back up the current live site **before** you deploy, because no rollback copy of the old site exists.

## Before going live
1. ✅ Tracking installed 6 Oct 2026 in `assets/common.js`: **GA4 `G-7H18WZV85X`** (property "bharatfinedine.com", in the client's Google account) and **Meta Pixel `1766789034649415`**. WhatsApp booking/event taps fire `generate_lead` in GA4 and `Lead` in Meta. ✅ The Meta domain-verification tag is in `index.html`; after deploy, click **Verify domain** in Meta Business Settings → Domains.
2. ✅ The announcement bar switches by date: Navratri from 1 Oct, Dussehra from 20 Oct, Diwali week from 2 Nov, and banquet season from 13 Nov. Edit `ANNOUNCE` in `assets/home.js` to change it.
3. ✅ The client signed off on menu prices (6 Oct 2026). ✅ The client confirmed the three review quotes. Still to confirm: the "4 private rooms" stat and the 531 review count.

## Placeholders still in the site
- ✅ Continental and Chinese & Oriental art added 6 Oct 2026 (`img/mural-continental.webp`, `img/mural-oriental.webp`). The source is in `../Mural Art Brief/`. To replace them, drop new JPGs into `img/` and run `python ../Website-v2-source/add_mural_art.py`.
- The Sanskruti hall card shows a Samiksha photo and is labelled "Photos soon".
- The Instagram tiles are static images. Wire them to a live feed (Behold, EmbedSocial or the Graph API).

## How booking works
There is no reservation backend. The 3-step sheet builds a WhatsApp message with a `BFD-xxxx` reference and sends it to +91 91262 68181, and staff confirm the booking on WhatsApp. Time slots that have already passed today are disabled. The prototype's fake "Full" and "2 left" availability was removed.

## Editing the menu or styles
The source is in `../Website-v2-source/`.
- **Menu:** edit `menu.json`, run `python3 build_menu.py menu.json ../Website-v2/menu.html menu.tpl.html`, **then** `python3 inline_css.py ../Website-v2`.
- **Styles:** edit `assets/site.css`, then run `python3 inline_css.py ../Website-v2`. The CSS is inlined into both pages for speed, so editing the .css file alone changes nothing until you re-run this.
- After changing `assets/*.js`, bump the `?v=` number in both HTML files so phones fetch the new version.

## Performance (6 Oct 2026)
Lighthouse mobile, measured locally: home **78 → 95**, menu **83 → 95**. Accessibility, SEO and best practices are 100 apart from the analytics noise.
- CSS is inlined (no render-blocking request) and scripts are deferred.
- GA4 and the Meta Pixel load after the page is idle. Events are queued, so none are lost.
- Images are responsive (`srcset`), with smaller copies `*-400/480/600/720/800/1280/1440.webp` and gallery thumbnails in `img/spaces/t400/`.
- Fonts are subset to the characters used: Archivo is 45 KB, plus a 1 KB file for ₹, and the Marathi font is 24 KB (was about 270 KB in total). **If you add new Marathi words, the font must be re-subset** or the new letters will fall back to a system font.
- The logos are PNGs (4 KB and 16 KB) instead of 55 KB SVGs.
- `_headers` sets cache rules on Netlify.

## Notes
- Images are WebP and about 60% smaller than the old JPEGs. Gallery thumbnails are in `img/spaces/thumb/`.
- Fonts (Archivo and Tiro Devanagari Marathi, OFL) are self-hosted in `assets/fonts/`, so the site makes no Google Fonts call.
- Motion respects `prefers-reduced-motion`.
- Page-transition loader (7 Oct 2026): the BFD seal fills in maroon from the bottom (`img/BFD_seal_red.png`, 9 KB, two image layers, so it also works when opened from a local folder). Code is in `assets/common.js`, under "page transition loader".
