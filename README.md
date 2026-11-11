# Bharat Fine Dine — website ("Walk the wall")

Static HTML/CSS/JS. No framework. Three pages:

| Page | What it does |
|---|---|
| `index.html` | The mural as navigation: seven kitchens, seven stops. Stop card, "Plan my table", spaces, reviews, visit. |
| `menu.html` | The menu in wall order. Search, veg-only, and a dish list that travels with the table request. **Generated, do not edit by hand.** |
| `events.html` | Event planner: type, guest count, date, menu, the spaces that fit, enquiry on WhatsApp. |

Shared files: `assets/site.css` (design tokens + all components), `assets/app.js` (all behaviour), `assets/data.js` (generated kitchen data).

## Deploy
Upload `index.html`, `menu.html`, `events.html`, `assets/`, the favicons, `og-image.jpg`, `robots.txt`, `sitemap.xml`, `_headers`.

**Do not delete `img/` or `assets/fonts/` on the server.** Those two folders are on the live host but not in this repository, and every image and font on the site comes from them. Copy them into the repo when you can, so the repo is the whole site. Back up the live site before the first deploy.

## Changing the menu
1. Edit `data/menu.json` (dish name, `veg`, `price`, optional `desc`; each section has a `kitchen`).
2. Run `python3 tools/build.py` from the repo root. It rewrites `menu.html`, `assets/data.js` and the first stop card inside `index.html`.
3. Bump the `?v=` number on the CSS/JS links in the three pages so phones fetch the new files.

Kitchen names, colours, mural art, pin positions and the featured dishes of each stop are in `KITCHENS` at the top of `tools/build.py`.

## How booking works
There is no reservation backend. "Plan my table" builds a WhatsApp message (occasion, guests, day, time, a suggested seating, any dishes on the list, a `BFD-xxxx` reference) and opens it to +91 91262 68181. Staff confirm on WhatsApp; the site says "request", never "confirmed". Slots already past today (India time) are disabled. The event planner works the same way.

Phone number, hours, slots and tracking IDs (GA4, Meta Pixel) are in `CFG` at the top of `assets/app.js`. Analytics load after the page is idle.

## Still to confirm with the client
- **Hall and room capacities** in `ROOMS` (`assets/app.js`) are placeholders. The event planner's "fits your event" depends on them.
- Featured dishes and their descriptions for each stop.
- Review names and quotes; the review count in the page's structured data.
- Food photography (none is used yet).
