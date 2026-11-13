// Full section-by-section test of the site: layout at five screen sizes, every section, the booking
// and event flows, the menu against data/menu.json, and behaviour without JavaScript.
// Run from the repo root:  node tools/test.js      (needs Node.js and Playwright: npm i -g playwright)
// Exit code is 0 when every check passes. Times are pinned to 11 Nov 2026, 1:10 pm India time.
const { chromium } = require('playwright'); const fs = require('fs');
const path = require('path'), http = require('http');
const REPO = path.resolve(__dirname, '..') + '/', PORT = 8791, U = 'http://localhost:' + PORT + '/';
const MENU = JSON.parse(fs.readFileSync(REPO + 'data/menu.json', 'utf8'));
const MIME = { html: 'text/html; charset=utf-8', css: 'text/css', js: 'text/javascript', json: 'application/json', png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', ico: 'image/x-icon', woff2: 'font/woff2', xml: 'text/xml', txt: 'text/plain' };
const server = http.createServer((q, s) => {
  const f = path.join(REPO, decodeURIComponent(q.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!f.startsWith(REPO) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'content-type': MIME[f.split('.').pop()] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s);
});
const R = []; const imgs = new Set(); let errs = [];
const ck = (sec, name, ok, detail) => { R.push({ sec, name, ok: !!ok, detail: ok ? '' : String(detail === undefined ? '' : detail).slice(0, 300) }); };
const eq = (sec, name, got, want) => ck(sec, name, JSON.stringify(got) === JSON.stringify(want), 'got ' + JSON.stringify(got) + ' want ' + JSON.stringify(want));

(async () => {
  await new Promise(ok => server.listen(PORT, ok));
  const b = await chromium.launch();
  async function ctx(w, h, opt = {}) {
    const c = await b.newContext(Object.assign({ viewport: { width: w, height: h }, timezoneId: 'Asia/Kolkata', locale: 'en-IN' }, opt));
    const p = await c.newPage();
    p.on('console', m => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errs.push(m.text()); });
    p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
    await p.route('**/img/**', r => { const u = r.request().url(); imgs.add(u.replace(U, '')); const f = REPO + u.replace(U, '').split('?')[0]; fs.existsSync(f) ? r.continue() : r.fulfill({ status: 404, body: '' }); });   // img/ may not be in the repo
    await p.route(/googletagmanager|facebook|fonts\//, r => r.abort());
    return p;
  }
  const at = async (p, isoUtc) => { await p.clock.setFixedTime(new Date(isoUtc)); };
  // generic layout + a11y audit of whatever is on screen
  const audit = async (p, sec) => {
    const r = await p.evaluate(() => {
      const out = { overflow: document.documentElement.scrollWidth - innerWidth, off: [], noname: [], noalt: [], dup: [], small: [], clipped: [], h1: document.querySelectorAll('h1').length };
      const vis = e => { const s = getComputedStyle(e), r = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
      const inScroller = e => { for (let x = e.parentElement; x; x = x.parentElement) { const s = getComputedStyle(x); if (/(auto|scroll)/.test(s.overflowX) && x.scrollWidth > x.clientWidth) return true; if (x.tagName === 'DIALOG' && !x.open) return true; } return false; };
      const id = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : '') + ':' + (e.textContent || '').trim().slice(0, 24);
      document.querySelectorAll('body *').forEach(e => {
        if (!vis(e) || e.closest('.sr,.skip')) return;
        const r = e.getBoundingClientRect();
        if ((r.right > innerWidth + 1 || r.left < -1) && !inScroller(e) && !e.closest('.wall,.foot .m,.zoom')) out.off.push(id(e));
        if (/^(A|BUTTON)$/.test(e.tagName)) {
          const nm = (e.getAttribute('aria-label') || e.textContent || '').trim() || (e.querySelector('img[alt]:not([alt=""])') ? 'img' : '');
          if (!nm) out.noname.push(id(e));
          if (innerWidth < 820 && (r.height < 40 || r.width < 40) && !e.closest('p,address,cite,.legal,.note,.faq,.sum,.tag,li.item,.row') && !e.classList.contains('lnk') && !e.classList.contains('next')) out.small.push(id(e) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
        }
        if (e.children.length === 0 && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible' && e.textContent.trim()) out.clipped.push(id(e));
      });
      document.querySelectorAll('img').forEach(i => { if (!i.hasAttribute('alt')) out.noalt.push(i.src); });
      const seen = {}; document.querySelectorAll('[id]').forEach(e => { if (seen[e.id]) out.dup.push(e.id); seen[e.id] = 1; });
      return out;
    });
    ck(sec, 'no sideways scroll', r.overflow <= 0, 'page is ' + r.overflow + 'px wider than screen');
    ck(sec, 'nothing hangs off screen', r.off.length === 0, r.off.slice(0, 5).join(' | '));
    ck(sec, 'every link/button has a name', r.noname.length === 0, r.noname.slice(0, 5).join(' | '));
    ck(sec, 'every image has alt', r.noalt.length === 0, r.noalt.slice(0, 3).join(' | '));
    ck(sec, 'no duplicate ids', r.dup.length === 0, r.dup.slice(0, 8).join(','));
    ck(sec, 'tap targets at least 40px (phone)', r.small.length === 0, r.small.slice(0, 6).join(' | '));
    ck(sec, 'no cut-off text', r.clipped.length === 0, r.clipped.slice(0, 5).join(' | '));
    ck(sec, 'exactly one h1', r.h1 === 1, r.h1);
  };
  const VP = [['phone 360', 360, 740], ['phone 390', 390, 844], ['tablet 768', 768, 1024], ['laptop 1280', 1280, 800], ['desktop 1440', 1440, 900]];
  const DAY = '2026-11-11T07:40:00Z';   // 13:10 India time, a Wednesday

  /* ============ 1. layout audit, every page, every size ============ */
  for (const [vn, w, h] of VP) for (const pg of ['index.html', 'menu.html', 'events.html', 'spaces.html', 'visit.html']) {
    const p = await ctx(w, h); await at(p, DAY); await p.goto(U + pg); await p.waitForTimeout(350);
    await audit(p, 'Layout · ' + pg + ' · ' + vn);
    if (pg === 'index.html') {
      eq('Layout · ' + pg + ' · ' + vn, 'all seven kitchens have a pin on the mural', await p.$$eval('.pin', e => e.length), 7);
      const bar = await p.$eval('.mbar', e => getComputedStyle(e).display !== 'none');
      eq('Layout · ' + pg + ' · ' + vn, 'bottom bar only on phone/tablet', bar, w < 820);
      await p.click('[data-plan] >> visible=true >> nth=0'); await p.waitForTimeout(250);
      await audit(p, 'Layout · booking dialog · ' + vn);
      const fit = await p.$eval('#planDlg .sheet', e => { const r = e.getBoundingClientRect(); return r.top >= -1 && r.bottom <= innerHeight + 1 && r.left >= -1 && r.right <= innerWidth + 1; });
      ck('Layout · booking dialog · ' + vn, 'dialog fits inside the screen', fit);
    }
    if (pg === 'menu.html') {
      const rt = await p.$$eval('#rail > *', e => e.map(x => Math.round(x.getBoundingClientRect().top)));
      ck('Layout · ' + pg + ' · ' + vn, 'kitchen rail stays on one line', new Set(rt).size === 1, rt);
      for (const k of ['tandoor', 'coastal', 'oriental', 'other']) { await p.click('#rail [data-go="' + k + '"]', { force: true }); await p.waitForTimeout(120); const o = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); ck('Layout · ' + pg + ' · ' + vn, 'no sideways scroll in ' + k, o <= 0, o); }
    }
    await p.context().close();
  }

  /* ============ 2. header, hero, links ============ */
  {
    const p = await ctx(1440, 900); await at(p, DAY); await p.goto(U + 'index.html'); await p.waitForTimeout(300);
    eq('Header', 'desktop nav items', await p.$$eval('.hdr nav a', e => e.filter(x => x.offsetParent).map(x => x.textContent.trim())), ['Menu', 'Spaces', 'Events', 'Visit', 'Plan my table']);
    eq('Header', 'stays pinned on scroll', await p.evaluate(async () => { scrollTo(0, 2000); await new Promise(r => setTimeout(r, 100)); return Math.round(document.querySelector('.hdr').getBoundingClientRect().top); }), 0);
    // every internal link resolves
    for (const pg of ['index.html', 'menu.html', 'events.html', 'spaces.html', 'visit.html']) {
      await p.goto(U + pg); await p.waitForTimeout(200);
      const links = await p.$$eval('a[href]', e => e.map(x => x.getAttribute('href')));
      const bad = [];
      for (const l of new Set(links)) {
        if (/^(https?:|tel:|mailto:)/.test(l)) continue;
        const [file, hash] = l.split('#'); const f = file || pg;
        if (!fs.existsSync(REPO + f.split('?')[0])) { bad.push(l); continue; }
        if (hash) { const html = fs.readFileSync(REPO + f.split('?')[0], 'utf8'); if (!html.includes('id="' + hash + '"')) bad.push(l + ' (no such anchor)'); }
      }
      ck('Links', pg + ': all internal links and anchors exist', bad.length === 0, bad.join(' | '));
      const ext = [...new Set(links.filter(l => /^(https?:|tel:|mailto:)/.test(l)))];
      ck('Links', pg + ': phone/WhatsApp/maps links well formed', ext.every(l => /^tel:\+919126268181$|^mailto:hello@bharatfinedine\.com$|^https:\/\/(wa\.me\/919126268181|www\.google\.com\/maps|www\.instagram\.com|www\.facebook\.com|calendar\.google\.com)/.test(l)), ext.join(' | '));
      const blank = await p.$$eval('a[target=_blank]', e => e.filter(x => !/noopener/.test(x.rel)).length);
      eq('Links', pg + ': new-tab links are safe (noopener)', blank, 0);
      const ld = await p.$$eval('script[type="application/ld+json"]', e => e.map(x => { try { JSON.parse(x.textContent); return 'ok'; } catch (er) { return 'BAD'; } }));
      ck('SEO', pg + ': structured data parses', !ld.includes('BAD'), ld);
      const meta = await p.evaluate(() => ({ t: document.title.length, d: (document.querySelector('meta[name=description]') || {}).content, c: (document.querySelector('link[rel=canonical]') || {}).href, lang: document.documentElement.lang, vp: !!document.querySelector('meta[name=viewport]') }));
      ck('SEO', pg + ': title, description, canonical, lang, viewport', meta.t > 10 && meta.t < 75 && meta.d && meta.d.length > 50 && meta.d.length < 260 && meta.c && meta.lang && meta.vp, JSON.stringify(meta));
    }
    // open / closed wording
    for (const [iso, want] of [['2026-11-11T05:00:00Z', 'Closed now'], ['2026-11-11T05:31:00Z', 'Open now'], ['2026-11-11T17:29:00Z', 'Open now'], ['2026-11-11T17:31:00Z', 'Closed now']]) {
      await at(p, iso); await p.goto(U + 'index.html'); const t = await p.textContent('[data-status] span');
      ck('Hero', 'status at ' + new Date(iso).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' }) + ' India time says "' + want + '"', t.startsWith(want), t);
    }
    // a visitor abroad still sees India time
    const q = await ctx(1280, 800, { timezoneId: 'America/New_York' }); await at(q, '2026-11-11T07:40:00Z'); await q.goto(U + 'index.html');
    ck('Hero', 'visitor in another time zone still sees India hours', (await q.textContent('[data-status] span')).startsWith('Open now'));
    await q.context().close(); await p.context().close();
  }

  /* ============ 3. wall, stops, journey ============ */
  for (const [vn, w, h] of [['phone', 390, 844], ['desktop', 1440, 900]]) {
    const S = 'Wall & stops · ' + vn;
    const p = await ctx(w, h); await at(p, DAY); await p.goto(U + 'index.html'); await p.waitForTimeout(300);
    const K = await p.evaluate(() => window.BFD_KITCHENS);
    eq(S, '7 pins on the mural', await p.$$eval('.pin', e => e.length), 7);
    const byK = {}; MENU.sections.forEach(s => { (byK[s.kitchen] = byK[s.kitchen] || []).push(...s.items); });
    for (const k of K) {
      await p.click('.pin[data-stop="' + k.n + '"]', { force: true }); await p.waitForTimeout(w < 820 ? 450 : 80);
      const got = await p.evaluate(() => ({ title: document.querySelector('#stop h2').textContent, kick: document.querySelector('#stop .kick').textContent, dishes: [...document.querySelectorAll('#stop .dish')].map(d => [d.querySelector('.n').textContent, d.querySelector('b').textContent, !d.querySelector('.mark').classList.contains('nv')]), link: document.querySelector('#stop .lnk').getAttribute('href'), linkT: document.querySelector('#stop .lnk').textContent, next: document.querySelector('#stop .next').textContent, pressed: [...document.querySelectorAll('.pin[aria-pressed=true]')].map(x => x.dataset.stop) }));
      const items = byK[k.id];
      const okD = got.dishes.length === 4 && got.dishes.every(d => items.some(i => i.veg === d[2] && (i.price === 'APS' ? d[1] === 'As per size' : d[1].replace(/\s/g, '') === String(i.price).replace(/\s/g, '').replace(/^(?!₹)/, ''))));
      ck(S, 'stop ' + k.n + ' ' + k.name + ': title, 4 dishes with real menu prices and veg marks', got.title === k.title && okD, JSON.stringify(got.dishes));
      ck(S, 'stop ' + k.n + ': dish count matches the menu (' + items.length + ')', k.count === items.length && got.linkT.includes(String(items.length)) && got.link === 'menu.html#k-' + k.id, got.linkT + ' ' + got.link + ' count ' + k.count);
      ck(S, 'stop ' + k.n + ': veg count matches the menu', k.veg === items.filter(i => i.veg).length, k.veg);
      ck(S, 'stop ' + k.n + ': highlighted in the journey, "next" label right', got.pressed.join() === String(k.n) && got.next.startsWith(k.n < 7 ? 'Next: ' + K[k.n].name : 'Back to: ' + K[0].name), got.pressed + ' ' + got.next);
    }
    await p.click('#stop .next'); eq(S, '"Back to" on stop 7 returns to stop 1', await p.textContent('#stop h2'), K[0].title);
    for (const k of K.filter(x => x.pin)) {
      if (w < 820) await p.$eval('#wallScroll', (e, x) => { e.scrollLeft = Math.max(0, e.scrollWidth * x / 100 - e.clientWidth / 2); }, k.pin[0]);
      await p.waitForTimeout(w < 820 ? 500 : 50);
      await p.click('.pin[data-stop="' + k.n + '"]'); eq(S, 'pin ' + k.n + ' opens ' + k.name, await p.textContent('#stop h2'), k.title);
      if (w < 820) { const full = await p.$eval('.pin[data-stop="' + k.n + '"]', e => { const r = e.getBoundingClientRect(); return !e.classList.contains('flip') && r.left >= 0 && r.right <= innerWidth; }); ck(S, 'pin ' + k.n + ' shows its full name once swiped to', full); }
    }
    if (w < 820) {
      await p.$eval('#wallScroll', e => { e.scrollLeft = 0; }); await p.waitForTimeout(1200);
      const cut = await p.$$eval('.pin', e => { const wr = document.querySelector('#wallScroll').getBoundingClientRect().right; return e.filter(x => { const r = x.getBoundingClientRect(); return r.left < wr - 8 && r.right > wr + 1; }).length; });
      eq(S, 'no pin label is cut by the screen edge', cut, 0);
      const ov = await p.$$eval('.pin', e => { const rs = e.map(x => x.getBoundingClientRect()); let n = 0; for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) if (rs[i].left < rs[j].right && rs[j].left < rs[i].right && rs[i].top < rs[j].bottom && rs[j].top < rs[i].bottom) n++; return n; });
      eq(S, 'pins do not overlap each other', ov, 0);
      ck(S, 'the mural can be swiped sideways', await p.$eval('#wallScroll', e => e.scrollWidth > e.clientWidth));
    }
    // each "see all" link lands on the right kitchen
    for (const k of K) { await p.goto('about:blank'); await p.goto(U + 'menu.html#k-' + k.id); await p.waitForTimeout(120); eq(S, 'menu link for ' + k.name + ' opens that kitchen', await p.$$eval('.kit.show', e => e.map(x => x.dataset.k)), [k.id]); }
    await p.context().close();
  }

  /* ============ 4. plan my table ============ */
  for (const [vn, w, h] of [['phone', 390, 844], ['desktop', 1440, 900]]) {
    const S = 'Plan my table · ' + vn;
    const p = await ctx(w, h); await at(p, DAY); await p.goto(U + 'index.html'); await p.waitForTimeout(300);
    const g = async () => +(await p.textContent('#guests'));
    const exp = [['Two of us', 2, 'An outdoor table'], ['Family', 5, 'The fine-dine restaurant'], ['Friends', 4, 'The Bar & Lounge'], ['Celebration', 8, 'A private dining room'], ['Work', 6, 'A private dining room']];
    for (let i = 0; i < 5; i++) {
      await p.click('#who [data-who="' + i + '"]'); const n = await g();
      await p.click('#plan .btn[data-plan]'); await p.waitForTimeout(150);
      const t = await p.textContent('#pBody .sug h3'); const sum = await p.textContent('#pBody .sum span');
      ck(S, '"' + exp[i][0] + '" sets ' + exp[i][1] + ' guests and suggests ' + exp[i][2], n === exp[i][1] && t === exp[i][2] && sum.startsWith(exp[i][0] + ' · ' + exp[i][1] + ' guests · Today, 11 Nov'), n + ' | ' + t + ' | ' + sum);
      await p.click('#pClose');
    }
    await p.click('#who [data-who="0"]');
    await p.click('#plan [data-g="-1"]'); await p.click('#plan [data-g="-1"]'); await p.click('#plan [data-g="-1"]'); eq(S, 'guest count cannot go below 1', await g(), 1);
    for (let i = 0; i < 25; i++) await p.click('#plan [data-g="1"]');
    eq(S, 'guest count stops at 20 and points to the event planner', [await g(), (await p.textContent('#guestNote')).includes('event planner')], [20, true]);
    await p.click('#plan .btn[data-plan]'); await p.waitForTimeout(150);
    eq(S, '20 guests are not offered an outdoor table for two', await p.textContent('#pBody .sug h3'), 'The fine-dine restaurant');
    eq(S, 'summary says "20 guests"', (await p.textContent('#pBody .sum span')).includes('20 guests'), true);
    // time slots at 13:10: anything before 13:40 is closed
    const dis = await p.$$eval('#pBody [data-act=time]', e => e.filter(x => x.disabled).map(x => x.dataset.v));
    eq(S, 'at 1:10 pm, lunch times up to 1:30 are greyed out, 2:00 onward open', dis, ['12:00 pm', '12:30 pm', '1:00 pm', '1:30 pm']);
    eq(S, 'cannot continue without a time', await p.getAttribute('#pFt [data-act=next]', 'aria-disabled'), 'true');
    await p.click('#pFt [data-act=next]', { force: true }); eq(S, 'pressing the greyed button does nothing', await p.textContent('#pProg span'), 'Step 1 of 3');
    await p.click('#pBody [data-act=time][data-v="12:00 pm"]', { force: true }); eq(S, 'a past time cannot be chosen', await p.$$eval('#pBody [data-act=time][aria-pressed=true]', e => e.length), 0);
    await p.click('#pBody [data-act=seat][data-v="Bar & Lounge"]'); eq(S, '"sit somewhere else" changes the table', await p.textContent('#pBody .sug h3'), 'The Bar & Lounge');
    await p.click('#pBody [data-act=change]'); eq(S, '"Change" closes the dialog back to the card', await p.$eval('#planDlg', d => d.open), false);
    // tomorrow: all slots open
    await p.click('#plan [data-g="-1"]'); await p.click('#when [data-day="1"]'); await p.click('#plan .btn[data-plan]'); await p.waitForTimeout(150);
    eq(S, 'tomorrow: every time is open', await p.$$eval('#pBody [data-act=time]', e => e.filter(x => x.disabled).length), 0);
    ck(S, 'tomorrow shows in the summary', (await p.textContent('#pBody .sum span')).includes('Tomorrow, 12 Nov'));
    await p.click('#pBody [data-act=time][data-v="7:30 pm"]'); await p.click('#pFt [data-act=next]');
    eq(S, 'step 2 opens', await p.textContent('#pProg span'), 'Step 2 of 3');
    // validation
    const tryNext = async () => { await p.click('#pFt [data-act=next]', { force: true }); return p.textContent('#pProg span'); };
    await p.fill('[data-in=name]', 'A'); await p.fill('[data-in=phone]', '9876543210'); eq(S, 'one-letter name is refused', await tryNext(), 'Step 2 of 3');
    eq(S, 'focus moves to the name box', await p.evaluate(() => document.activeElement.dataset.in), 'name');
    await p.fill('[data-in=name]', 'Asha <b>K</b>'); await p.fill('[data-in=phone]', '98765 4321'); eq(S, '9-digit phone is refused', await tryNext(), 'Step 2 of 3');
    eq(S, 'focus moves to the phone box', await p.evaluate(() => document.activeElement.dataset.in), 'phone');
    await p.fill('[data-in=phone]', '+91 98765 43210'); await p.fill('[data-in=note]', 'Cake at 9 & a high chair');
    eq(S, 'button enables once details are valid', await p.getAttribute('#pFt [data-act=next]', 'aria-disabled'), 'false');
    eq(S, 'step 3 opens', await tryNext(), 'Step 3 of 3');
    eq(S, 'typed HTML is shown as text, not run', await p.$$eval('#pBody .tbl b b, #pBody .bubble b', e => e.length), 0);
    const rows = await p.$$eval('#pBody .tbl > div', e => e.map(x => [x.children[0].textContent, x.children[1].textContent]));
    eq(S, 'summary rows are right', rows, [['Table', 'Bar & Lounge'], ['Date', 'Tomorrow, 12 Nov'], ['Time', '7:30 pm'], ['Guests', '19 · Two of us'], ['Name', 'Asha <b>K</b>'], ['WhatsApp', '+91 98765 43210']]);
    const href = await p.getAttribute('#pSend', 'href'); const msg = decodeURIComponent(href.split('text=')[1]);
    ck(S, 'WhatsApp link goes to the restaurant number', href.startsWith('https://wa.me/919126268181?text='), href.slice(0, 50));
    ck(S, 'message carries table, guests, day, time, name, phone, note and a BFD reference', /^Hi Bharat Fine Dine! Table request BFD-\d{4}: Bar & Lounge for 19 on Tomorrow, 12 Nov at 7:30 pm \(Two of us\)\. Name: Asha <b>K<\/b>\. Phone: \+91 98765 43210\. Note: Cake at 9 & a high chair$/.test(msg), msg);
    eq(S, 'message on screen is the message that is sent', await p.textContent('#pBody .bubble'), msg);
    // back keeps values
    await p.click('#pFt [data-act=back]'); eq(S, 'Back keeps what was typed', [await p.inputValue('[data-in=name]'), await p.inputValue('[data-in=phone]'), await p.inputValue('[data-in=note]')], ['Asha <b>K</b>', '+91 98765 43210', 'Cake at 9 & a high chair']);
    await p.click('#pFt [data-act=back]'); eq(S, 'Back to step 1 keeps the chosen time', await p.$$eval('#pBody [data-act=time][aria-pressed=true]', e => e.map(x => x.dataset.v)), ['7:30 pm']);
    await p.click('#pFt [data-act=next]'); await p.click('#pFt [data-act=next]');
    await p.evaluate(() => { document.querySelector('#pSend').addEventListener('click', e => e.preventDefault()); }); await p.click('#pSend'); await p.waitForTimeout(450);
    const done = await p.evaluate(() => ({ h: document.querySelector('#pBody h3').textContent, ft: document.querySelector('#pFt').hidden, prog: document.querySelector('#pProg').hidden, cal: document.querySelector('#pBody a.btn.ink').href, last: JSON.parse(localStorage.getItem('bfd-last')), lead: [...window.dataLayer].some(a => a[0] === 'event' && a[1] === 'generate_lead'), wording: document.querySelector('#pBody').textContent }));
    ck(S, 'after sending: "Request sent" screen, no step bar', done.h === 'Request sent, Asha.' && done.ft && done.prog, JSON.stringify([done.h, done.ft, done.prog]));
    ck(S, 'wording never claims the table is confirmed', /Waiting for our reply/.test(done.wording) && !/\bconfirmed\b|is booked|reserved/i.test(done.wording.replace(/Not confirmed/g, '')), done.wording.slice(0, 200));
    ck(S, 'calendar link has the right day and 7:30–9:30 pm India time', done.cal.includes('dates=20261112T193000/20261112T213000') && done.cal.includes('ctz=Asia/Kolkata'), done.cal.slice(0, 200));
    ck(S, 'request is remembered on the device and counted as a lead', done.last && /^BFD-\d{4}$/.test(done.last.ref) && done.last.date === '2026-11-12' && done.lead, JSON.stringify(done.last) + ' lead ' + done.lead);
    await p.click('#pBody [data-act=close]'); await p.waitForTimeout(120); eq(S, '"Back to the wall" closes and unlocks the page', [await p.$eval('#planDlg', d => d.open), await p.evaluate(() => document.body.classList.contains('lock'))], [false, false]);
    // other ways in and out
    for (const [sel, nm] of [['.hdr [data-plan]', 'header button'], ['.mbar [data-plan]', 'bottom bar'], ['.foot [data-plan]', 'footer button']]) {
      if (!(await p.$eval(sel, e => !!e.offsetParent))) continue;
      await p.click(sel); await p.waitForTimeout(120); const o = await p.$eval('#planDlg', d => d.open); const st = await p.textContent('#pProg span');
      ck(S, nm + ' opens the dialog at step 1', o && st === 'Step 1 of 3', o + ' ' + st);
      await p.keyboard.press('Escape'); await p.waitForTimeout(80);
      eq(S, 'Esc closes it and unlocks the page (' + nm + ')', [await p.$eval('#planDlg', d => d.open), await p.evaluate(() => document.body.classList.contains('lock'))], [false, false]);
    }
    await p.click('.hdr [data-plan], .mbar [data-plan] >> visible=true'); await p.waitForTimeout(100); await p.mouse.click(3, 3); await p.waitForTimeout(100);
    if (w >= 820) eq(S, 'tapping outside the dialog closes it', await p.$eval('#planDlg', d => d.open), false); await p.keyboard.press('Escape'); await p.waitForTimeout(80);
    // focus stays inside the dialog
    await p.click('#plan .btn[data-plan]'); await p.waitForTimeout(100); let inside = true; for (let i = 0; i < 40; i++) { await p.keyboard.press('Tab'); inside = inside && await p.evaluate(() => !!document.activeElement.closest('#planDlg') || document.activeElement === document.body); }
    ck(S, 'keyboard focus stays inside the open dialog', inside); await p.keyboard.press('Escape');
    // pick a date
    await p.$eval('#datePick', e => { e.value = '2026-11-20'; e.dispatchEvent(new Event('change', { bubbles: true })); });
    eq(S, 'picking a date shows it on the card', await p.textContent('#when [data-day=pick]'), 'Fri, 20 Nov');
    eq(S, 'date picker allows today to 60 days ahead only', [await p.getAttribute('#datePick', 'min'), await p.getAttribute('#datePick', 'max')], ['2026-11-11', '2027-01-10']);
    await p.context().close();

    // late evening: today's slots are gone
    const q = await ctx(w, h); await at(q, '2026-11-11T16:20:00Z'); await q.goto(U + 'index.html'); await q.waitForTimeout(250);   // 9:50 pm IST
    eq(S, 'at 9:50 pm the card starts on Tomorrow', await q.$$eval('#when [aria-pressed=true]', e => e.map(x => x.textContent)), ['Tomorrow']);
    await q.click('#when [data-day="0"]'); await q.click('#plan .btn[data-plan]'); await q.waitForTimeout(150);
    ck(S, 'choosing Today at 9:50 pm explains that times have passed', await q.$eval('#pBody', e => /times have passed/.test(e.textContent)) && (await q.$$eval('#pBody [data-act=time]:not([disabled])', e => e.length)) === 0);
    await q.context().close();
    // 9:20 pm: 10:00 pm still open
    const q2 = await ctx(w, h); await at(q2, '2026-11-11T15:50:00Z'); await q2.goto(U + 'index.html'); await q2.waitForTimeout(250); await q2.click('#plan .btn[data-plan]'); await q2.waitForTimeout(150);
    eq(S, 'at 9:20 pm only 10:00 pm is left today', await q2.$$eval('#pBody [data-act=time]:not([disabled])', e => e.map(x => x.dataset.v)), ['10:00 pm']);
    await q2.context().close();
  }

  /* ============ 5. spaces + lightbox, events band, reviews, visit, footer ============ */
  for (const [vn, w, h] of [['phone', 390, 844], ['desktop', 1440, 900]]) {
    const S = 'Spaces · ' + vn; const p = await ctx(w, h); await at(p, DAY); await p.goto(U + 'index.html'); await p.waitForTimeout(300);
    const tiles = await p.$$eval('#spaces .pwall a', e => e.map(x => x.getAttribute('href')));
    eq(S, 'homepage shows six space tiles linking to the Spaces page', tiles, ['dining', 'outdoor', 'bar', 'private', 'meeting', 'hall'].map(k => 'spaces.html#sp-' + k));
    await p.goto(U + 'spaces.html'); await p.waitForTimeout(300);
    await p.addStyleTag({ content: '.rv{opacity:1!important;transform:none!important}' });
    eq(S, 'Spaces page: six sections, six photos each', [await p.$$eval('.sp', e => e.length), await p.$$eval('.gal button', e => e.length)], [6, 36]);
    const SE = { 'Restaurant': 'The fine-dine restaurant', 'Outdoor': 'An outdoor table', 'Bar & Lounge': 'The Bar & Lounge', 'Private room': 'A private dining room' };
    for (const seat of Object.keys(SE)) { await p.click('.sp [data-plan="' + seat + '"]'); await p.waitForTimeout(450); eq(S, seat + ': "Plan a table here" opens booking on this page with that space', [await p.evaluate(() => location.pathname), await p.textContent('#pBody .sug h3')], ['/spaces.html', SE[seat]]); await p.click('#pClose'); await p.waitForTimeout(150); }
    eq(S, 'meeting rooms and halls point to the event planner', await p.$$eval('.sp a.btn', e => e.map(x => x.getAttribute('href'))), ['events.html', 'events.html']);
    await p.click('.gal [data-lbk="bar"][data-lbn="2"]'); await p.waitForTimeout(400);
    eq(S, 'a gallery photo opens the viewer on that photo', [await p.$eval('dialog.lb', d => d.open), await p.textContent('dialog.lb span'), await p.getAttribute('dialog.lb img', 'src')], [true, '2 / 6', 'img/spaces/bar-2.webp']);
    await p.click('dialog.lb [data-d="-1"]'); await p.click('dialog.lb [data-d="-1"]'); eq(S, 'previous wraps round to the last photo', await p.textContent('dialog.lb span'), '6 / 6');
    await p.click('dialog.lb [data-d="1"]'); eq(S, 'next wraps round to the first', await p.textContent('dialog.lb span'), '1 / 6');
    await p.keyboard.press('ArrowRight'); eq(S, 'arrow keys move between photos', await p.textContent('dialog.lb span'), '2 / 6');
    ck(S, 'viewer photo has a description for screen readers', (await p.getAttribute('dialog.lb img', 'alt')).length > 5);
    await p.mouse.click(8, 8); await p.waitForTimeout(150); eq(S, 'tapping outside the photo shuts the viewer', await p.$eval('dialog.lb', d => d.open), false);
    await p.click('.gal [data-lbk="hall"][data-lbn="1"]'); await p.waitForTimeout(300); await p.click('dialog.lb [data-d="0"]'); eq(S, 'Close shuts the viewer', await p.$eval('dialog.lb', d => d.open), false);
    await p.goto(U + 'visit.html'); await p.waitForTimeout(300); await p.addStyleTag({ content: '.rv{opacity:1!important;transform:none!important}' });
    const fq = await p.$$eval('.faq details', e => e.length); let op = 0;
    for (let i = 0; i < fq; i++) { await p.click('.faq details >> nth=' + i + ' >> summary'); if (await p.$eval('.faq details >> nth=' + i, d => d.open && d.querySelector('p').offsetHeight > 10)) op++; }
    eq(S, 'Visit page: all 7 questions open and show an answer', [fq, op], [7, 7]);
    eq(S, 'Visit page: directions link points at the restaurant', await p.getAttribute('.vcard .cta a.btn >> nth=0', 'href'), 'https://www.google.com/maps/dir/?api=1&destination=18.4099037,76.5422986');
    await p.goto(U + 'index.html'); await p.waitForTimeout(300);
    const S2 = 'Lower sections · ' + vn;
    eq(S2, 'events band button goes to the event planner', await p.getAttribute('#events a.btn', 'href'), 'events.html');
    eq(S2, 'three reviews shown', await p.$$eval('.rgrid blockquote', e => e.length), 3);
    const stats = await p.$$eval('.stats b', e => e.map(x => x.textContent)); eq(S2, 'event stats present', stats, ['300+', '2', '4']);
    eq(S2, 'homepage Visit card links to the Visit page', await p.getAttribute('.vcard a.lnk', 'href'), 'visit.html');
    eq(S2, 'directions link points at the restaurant', await p.getAttribute('#visit .cta a.btn >> nth=0', 'href'), 'https://www.google.com/maps/dir/?api=1&destination=18.4099037,76.5422986');
    eq(S2, 'footer year is current', await p.textContent('#yr'), '2026');
    if (w < 820) {
      await p.evaluate(() => scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(150);
      const hid = await p.evaluate(() => { const bar = document.querySelector('.mbar').getBoundingClientRect(), leg = document.querySelector('.foot .legal .wrap > span:last-child').getBoundingClientRect(); return leg.bottom > bar.top; });
      ck(S2, 'bottom bar does not cover the end of the footer', !hid);
      eq(S2, 'bottom bar: Call, Directions, Plan my table', await p.$$eval('.mbar > *', e => e.map(x => x.textContent)), ['Call', 'Directions', 'Plan my table']);
    }
    // header anchors land with the heading visible below the sticky header
    for (const id of ['spaces', 'visit', 'wall']) {
      await p.goto('about:blank'); await p.goto(U + 'index.html#' + id); await p.waitForTimeout(1300);
      const ok = await p.evaluate(id => { const hb = document.querySelector('.hdr').getBoundingClientRect().bottom, el = document.getElementById(id), hd = el.querySelector('h2,.kick,img') || el; const t = hd.getBoundingClientRect().top; return t >= hb - 2 && t < innerHeight; }, id);
      ck(S2, 'jump link #' + id + ' is not hidden under the header', ok);
    }
    await p.context().close();
  }

  /* ============ 6. menu ============ */
  for (const [vn, w, h] of [['phone', 390, 844], ['desktop', 1440, 900]]) {
    const S = 'Menu · ' + vn; const p = await ctx(w, h); await at(p, DAY); await p.goto(U + 'menu.html'); await p.waitForTimeout(300);
    const all = MENU.sections.flatMap(s => s.items);
    eq(S, 'every dish in the data is on the page', await p.$$eval('.item', e => e.length), all.length);
    const page = await p.$$eval('.item', e => e.map(x => [x.querySelector('.nm span, .nm')?.textContent.trim(), x.dataset.veg]));
    const names = await p.$$eval('.add', e => e.map(x => [x.dataset.name, x.dataset.price]));
    const miss = all.filter(i => !names.some(n => n[0] === i.name)); ck(S, 'every dish name matches the data', miss.length === 0, miss.slice(0, 5).map(m => m.name).join(' | '));
    const badP = all.filter(i => !names.some(n => n[0] === i.name && (i.price === 'APS' ? n[1] === 'As per size' : n[1].replace(/\s/g, '') === String(i.price).replace(/\s/g, '')))); ck(S, 'every price matches the data', badP.length === 0, badP.slice(0, 5).map(m => m.name + ' ' + m.price).join(' | '));
    eq(S, 'veg / non-veg marks match the data', await p.$$eval('.item[data-veg="1"]', e => e.length), all.filter(i => i.veg).length);
    ck(S, 'no dish shows an empty or odd price', names.every(n => /^₹\d+( \/ ₹\d+)*$|^As per size$|^MRP$|^Price on request$/.test(n[1])), [...new Set(names.filter(n => !/^₹\d+( \/ ₹\d+)*$|^As per size$/.test(n[1])).map(n => n[1]))].join(' | '));
    eq(S, 'opens on the first kitchen', await p.$$eval('.kit.show', e => e.map(x => x.dataset.k)), ['punjabi']);
    const ids = ['punjabi', 'tandoor', 'mughlai', 'maharashtrian', 'coastal', 'continental', 'oriental', 'other'];
    for (const k of ids) {
      await p.click('#rail [data-go="' + k + '"]', { force: true }); await p.waitForTimeout(150);
      const r = await p.evaluate(k => ({ shown: [...document.querySelectorAll('.kit.show')].map(x => x.dataset.k), n: document.querySelectorAll('#k-' + k + ' .item').length, vis: [...document.querySelectorAll('.item')].filter(x => x.offsetParent).length, pressed: [...document.querySelectorAll('#rail [data-go][aria-pressed=true]')].map(x => x.dataset.go), hash: location.hash, ban: (document.querySelector('#k-' + k + ' .kban') || {}).textContent || '', top: document.querySelector('.kit.show').getBoundingClientRect().top, rb: document.querySelector('.railbox').getBoundingClientRect().bottom }), k);
      const want = MENU.sections.filter(s => s.kitchen === k).flatMap(s => s.items).length;
      ck(S, k + ': only that kitchen shows, ' + want + ' dishes, chip highlighted, address updated', r.shown.join() === k && r.n === want && r.vis === want && r.pressed.join() === k && r.hash === '#k-' + k, JSON.stringify([r.shown, r.n, r.vis, r.pressed, r.hash]));
      if (k !== 'other') ck(S, k + ': banner count is right', r.ban.includes(String(want)), r.ban.slice(0, 120));
      ck(S, k + ': kitchen heading is not hidden under the sticky rail', r.top >= r.rb - 2, 'kit top ' + Math.round(r.top) + ' rail bottom ' + Math.round(r.rb));
    }
    // next-stop links walk the wall in order
    await p.click('#rail [data-go="punjabi"]', { force: true }); const walk = ['punjabi'];
    for (let i = 0; i < 8; i++) { const nx = await p.$('.kit.show .nextstop [data-go], .kit.show .nextstop[data-go], .kit.show .nextstop a'); if (!nx) break; await nx.click(); await p.waitForTimeout(120); walk.push((await p.$$eval('.kit.show', e => e.map(x => x.dataset.k)))[0]); if (walk[walk.length - 1] === walk[walk.length - 2]) break; }
    ck(S, '"next stop" walks the kitchens in wall order', walk.slice(0, 7).join() === ids.slice(0, 7).join(), walk.join(' > '));
    // search
    await p.click('#rail [data-go="punjabi"]', { force: true });
    const search = async t => { await p.fill('#q', t); await p.waitForTimeout(180); return p.evaluate(() => ({ n: [...document.querySelectorAll('.item')].filter(x => x.offsetParent).length, kits: [...document.querySelectorAll('.kit.show')].map(x => x.dataset.k), nores: !document.querySelector('#nores').hidden, emptySec: [...document.querySelectorAll('.kit.show .msec')].filter(s => s.offsetParent && ![...s.querySelectorAll('.item')].some(i => i.offsetParent)).length, ban: [...document.querySelectorAll('.kit.show .kban')].filter(x => x.offsetParent).length })); };
    const cnt = t => MENU.sections.flatMap(s => s.items.map(i => (i.name + ' ' + (i.desc || '') + ' ' + s.title).toLowerCase())).filter(x => x.includes(t)).length;
    let r = await search('biryani'); ck(S, 'search "biryani" finds dishes across kitchens, no empty sections', r.n > 0 && r.n <= cnt('biryani') + 2 && r.n >= all.filter(i => i.name.toLowerCase().includes('biryani')).length && r.emptySec === 0 && r.ban === 0, JSON.stringify(r) + ' expected about ' + cnt('biryani'));
    r = await search('PANEER'); ck(S, 'search ignores capital letters', r.n >= all.filter(i => i.name.toLowerCase().includes('paneer')).length, r.n);
    r = await search('  paneer  '); ck(S, 'search ignores stray spaces', r.n > 0, r.n);
    r = await search('zzzz'); ck(S, 'no match shows a "nothing found" message', r.n === 0 && r.nores, JSON.stringify(r));
    const nrTxt = await p.textContent('#nores'); ck(S, '"nothing found" message has text', nrTxt.trim().length > 10, nrTxt);
    r = await search(''); ck(S, 'clearing search returns to the kitchen', r.kits.join() === 'punjabi' && !r.nores, JSON.stringify(r));
    r = await search('chicken'); await p.click('#rail [data-go="mughlai"]', { force: true }); await p.waitForTimeout(150);
    eq(S, 'picking a kitchen while searching clears the search', [await p.inputValue('#q'), await p.$$eval('.kit.show', e => e.map(x => x.dataset.k))], ['', ['mughlai']]);
    // veg only
    await p.click('#vegOnly', { force: true }); await p.waitForTimeout(120);
    const vg = await p.evaluate(() => ({ nonveg: [...document.querySelectorAll('.item[data-veg="0"]')].filter(x => x.offsetParent).length, veg: [...document.querySelectorAll('.kit.show .item')].filter(x => x.offsetParent).length, pressed: document.querySelector('#vegOnly').getAttribute('aria-pressed'), emptySec: [...document.querySelectorAll('.kit.show .msec')].filter(s => s.offsetParent && ![...s.querySelectorAll('.item')].some(i => i.offsetParent)).length }));
    ck(S, 'veg only hides every non-veg dish and empty sections (Mughlai)', vg.nonveg === 0 && vg.veg === MENU.sections.filter(s => s.kitchen === 'mughlai').flatMap(s => s.items).filter(i => i.veg).length && vg.pressed === 'true' && vg.emptySec === 0, JSON.stringify(vg));
    await p.click('#rail [data-go="coastal"]', { force: true }); await p.waitForTimeout(150);
    const cz = await p.evaluate(() => ({ items: [...document.querySelectorAll('.kit.show .item')].filter(x => x.offsetParent).length, nores: !document.querySelector('#nores').hidden, txt: document.querySelector('#nores').textContent }));
    ck(S, 'veg only on the seafood kitchen (no veg dishes) explains itself', cz.items === 0 && cz.nores, JSON.stringify(cz));
    r = await search('chicken'); ck(S, 'veg only + search "chicken" shows nothing non-veg', (await p.$$eval('.item[data-veg="0"]', e => e.filter(x => x.offsetParent).length)) === 0);
    await p.fill('#q', ''); await p.waitForTimeout(150); await p.click('#vegOnly', { force: true }); await p.click('#rail [data-go="punjabi"]', { force: true });
    // list
    const first = await p.$$eval('#k-punjabi .add', e => e.slice(0, 3).map(x => [x.dataset.add, x.dataset.name, x.dataset.price]));
    await p.click('#k-punjabi .add >> nth=0'); await p.click('#k-punjabi .add >> nth=1'); await p.click('#k-punjabi .add >> nth=2');
    const L = async () => p.evaluate(() => ({ bar: document.querySelector('#barCount').textContent, rows: [...document.querySelectorAll('#mylist .row')].map(x => x.textContent.replace('×', '').trim()), pressed: [...document.querySelectorAll('.add[aria-pressed=true]')].length, store: JSON.parse(localStorage.getItem('bfd-list') || '[]').length, lab: document.querySelector('.add[aria-pressed=true]')?.getAttribute('aria-label') }));
    let l = await L(); ck(S, 'adding 3 dishes: buttons tick, list shows 3, bar says 3', l.pressed === 3 && l.rows.length === 3 && l.bar === '3 dishes on your list' && l.store === 3 && /^Remove .* from my list$/.test(l.lab), JSON.stringify(l));
    await p.click('#k-punjabi .add >> nth=1'); l = await L(); ck(S, 'tapping a ticked dish removes it', l.pressed === 2 && l.rows.length === 2 && l.bar === '2 dishes on your list', JSON.stringify(l));
    if (await p.$eval('#mylist', e => !!e.offsetParent)) { await p.click('#mylist [data-rm] >> nth=0'); l = await L(); ck(S, '× in the list removes a dish and un-ticks it', l.pressed === 1 && l.rows.length === 1 && l.bar === '1 dish on your list', JSON.stringify(l)); }
    else ck(S, 'the list panel is visible on this screen size', false, '#mylist is not displayed, so dishes cannot be reviewed or removed from a list on the menu page');
    if (w < 820) { await p.click('#barCount'); await p.waitForTimeout(700); ck(S, 'tapping the count in the bottom bar jumps to the list', await p.$eval('#mylist', e => { const r = e.getBoundingClientRect(); return r.top < innerHeight - 80 && r.bottom > 0; })); }
    await p.reload(); await p.waitForTimeout(250); l = await L(); ck(S, 'list survives a page reload', l.pressed >= 1 && l.store === l.pressed, JSON.stringify(l));
    const planHref = await p.evaluate(() => { const a = [...document.querySelectorAll('a')].filter(x => x.offsetParent && /Plan my table/.test(x.textContent)); return a.map(x => x.getAttribute('href')); });
    ck(S, 'a visible "Plan my table" link leads to the booking card', planHref.length > 0 && planHref.every(h => h === 'index.html#plan'), JSON.stringify(planHref));
    await p.goto(U + 'index.html#plan'); await p.waitForTimeout(350);
    ck(S, 'arriving from the menu lands on the booking card', await p.$eval('#plan', e => { const r = e.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }));
    await p.click('#plan .btn[data-plan]'); await p.click('#pBody [data-act=time]:not([disabled]) >> nth=0'); await p.click('#pFt [data-act=next]');
    const tags = await p.$$eval('#pBody .tag', e => e.map(x => x.firstChild.textContent)); ck(S, 'dishes from the menu appear in the booking', tags.length === l.pressed, tags.join(','));
    await p.click('#pBody .tag button >> nth=0'); eq(S, 'a dish can be dropped inside the booking', await p.$$eval('#pBody .tag', e => e.length), tags.length - 1);
    ck(S, 'with no dishes left, booking offers a link to the menu', tags.length - 1 > 0 || await p.$eval('#pBody', e => /Add dishes from the menu/.test(e.textContent)));
    // deep link to a section
    const secId = await p.evaluate(async () => { const r = await fetch('menu.html'); const t = await r.text(); const d = new DOMParser().parseFromString(t, 'text/html'); const s = d.querySelector('#k-mughlai .msec:nth-of-type(3), #k-mughlai .msec:last-of-type'); return s && s.id; });
    if (secId) { await p.goto('about:blank'); await p.goto(U + 'menu.html#' + secId); await p.waitForTimeout(450); const dl = await p.evaluate(id => { const e = document.getElementById(id).getBoundingClientRect(); return { kit: [...document.querySelectorAll('.kit.show')].map(x => x.dataset.k), top: Math.round(e.top), rb: Math.round(document.querySelector('.railbox').getBoundingClientRect().bottom), ih: innerHeight }; }, secId); ck(S, 'a link straight to a menu section opens its kitchen with the heading in view', dl.kit.join() === 'mughlai' && dl.top >= dl.rb - 4 && dl.top < dl.ih, JSON.stringify(dl)); }
    await p.evaluate(() => { location.hash = '#k-continental'; }); await p.waitForTimeout(200); eq(S, 'changing the address while on the menu switches kitchen', await p.$$eval('.kit.show', e => e.map(x => x.dataset.k)), ['continental']);
    await p.goto('about:blank'); await p.goto(U + 'menu.html#nonsense'); await p.waitForTimeout(200); eq(S, 'a broken address falls back to the first kitchen', await p.$$eval('.kit.show', e => e.map(x => x.dataset.k)), ['punjabi']);
    await p.context().close();
  }

  /* ============ 7. event planner ============ */
  for (const [vn, w, h] of [['phone', 390, 844], ['desktop', 1440, 900]]) {
    const S = 'Event planner · ' + vn; const p = await ctx(w, h); await at(p, DAY); await p.goto(U + 'events.html'); await p.waitForTimeout(300);
    eq(S, 'starts on Wedding, 100 to 300, veg and non-veg', await p.$$eval('#planner .chip[aria-pressed=true]', e => e.map(x => x.textContent)), ['Wedding', '100 to 300', 'Veg and non-veg']);
    const fitsWant = [['Private dining rooms', 'Board and meeting rooms'], ['Samiksha banquet hall', 'Sanskruti banquet hall'], ['Samiksha banquet hall', 'Sanskruti banquet hall'], ['Samiksha banquet hall', 'Sanskruti banquet hall']];
    for (let i = 0; i < 4; i++) {
      await p.click('#evSize [data-size="' + i + '"]'); const f = await p.$$eval('.fit', e => e.map(x => [x.querySelector('b').textContent, x.classList.contains('ok'), x.querySelector('.badge').textContent]));
      const ok = f.filter(x => x[1]).map(x => x[0]); const order = f.map(x => x[1]).join(); const title = await p.textContent('#fitTitle');
      ck(S, 'size ' + (await p.textContent('#evSize [aria-pressed=true]')) + ': right spaces fit, fitting ones listed first', JSON.stringify(ok) === JSON.stringify(fitsWant[i]) && !/false,true/.test(order) && f.length === 4 && f.every(x => x[1] ? x[2] === 'Fits your event' : /Too small|Larger than/.test(x[2])), JSON.stringify(f) + ' ' + title);
    }
    const info = await p.$$eval('.fit', e => e.map(x => x.querySelector('b').textContent + ': ' + x.querySelectorAll('span')[0].textContent));
    await p.click('#evSize [data-size="3"]');
    const big = await p.$$eval('.fit.ok', e => e.map(x => x.textContent)); ck(S, '300+ guests: halls show 300 to 350 seats and a note about larger numbers', big.every(t => /300 to 350 seats/.test(t)) && await p.$eval('#fits', e => /about 300 to 350 guests/.test(e.textContent)), big.join(' | '));
    eq(S, 'send button is greyed until name and phone are filled', await p.getAttribute('#evSend', 'aria-disabled'), 'true');
    await p.click('#evSend', { force: true }); await p.waitForTimeout(100);
    eq(S, 'pressing it early shows the error and moves focus to name', [await p.$eval('#evErr', e => e.hidden), await p.evaluate(() => document.activeElement.id), await p.$eval('#evDone', e => e.hidden)], [false, 'evName', true]);
    ck(S, 'pressing it early does not jump the page or change the address', !(await p.evaluate(() => location.hash)), await p.evaluate(() => location.hash));
    await p.fill('#evName', 'Asha Kulkarni'); await p.fill('#evPhone', '12345'); eq(S, 'short phone still greyed', await p.getAttribute('#evSend', 'aria-disabled'), 'true');
    await p.fill('#evPhone', '98765 43210'); await p.click('#evType [data-type="3"]'); await p.click('#evSize [data-size="1"]'); await p.click('#evSpread [data-spread="0"]'); await p.fill('#evDate', '2026-12-05'); await p.fill('#evNote', 'Need a projector & stage');
    eq(S, 'typed details survive changing the choices', [await p.inputValue('#evName'), await p.inputValue('#evPhone'), await p.inputValue('#evDate'), await p.inputValue('#evNote')], ['Asha Kulkarni', '98765 43210', '2026-12-05', 'Need a projector & stage']);
    const href = await p.getAttribute('#evSend', 'href'); const msg = href.includes('text=') ? decodeURIComponent(href.split('text=')[1]) : href;
    eq(S, 'enquiry message is complete and correct', msg, 'Hi Bharat Fine Dine! Event enquiry: Corporate for 20 to 100 guests, 5 Dec 2026. Menu: Veg. Name: Asha Kulkarni. Phone: 98765 43210. Need a projector & stage');
    ck(S, 'enquiry goes to the restaurant WhatsApp', href.startsWith('https://wa.me/919126268181?text='));
    await p.evaluate(() => document.querySelector('#evSend').addEventListener('click', e => e.preventDefault())); await p.click('#evSend'); await p.waitForTimeout(100);
    eq(S, 'after sending: thanks note shows, error hides, lead counted', [await p.$eval('#evDone', e => e.hidden), await p.$eval('#evErr', e => e.hidden), await p.evaluate(() => [...window.dataLayer].some(a => a[0] === 'event' && a[1] === 'generate_lead'))], [false, true, true]);
    await p.fill('#evDate', ''); const m2 = decodeURIComponent((await p.getAttribute('#evSend', 'href')).split('text=')[1]); ck(S, 'no date chosen reads "date to be decided"', m2.includes('date to be decided'), m2);
    eq(S, 'past dates cannot be picked', await p.getAttribute('#evDate', 'min'), '2026-11-11');
    ck(S, 'header has a way to book a table or see the menu', (await p.$$eval('.hdr a', e => e.filter(x => x.offsetParent).map(x => x.textContent.trim()))).includes('Plan my table'));
    await p.context().close();
  }

  /* ============ 8. without JavaScript, keyboard, reduced motion, print-ish ============ */
  {
    const S = 'Resilience';
    const p = await ctx(390, 844, { javaScriptEnabled: false }); await p.goto(U + 'index.html');
    const nj = await p.evaluate(() => ({ stop: document.querySelector('#stop h2')?.textContent, dishes: document.querySelectorAll('#stop .dish').length, who: document.querySelector('#who').children.length, planBtnVisible: !!document.querySelector('#plan').offsetParent, journey: 0, jVis: false, tVis: false, bookWA: [...document.querySelectorAll('a')].some(a => a.offsetParent && /wa\.me/.test(a.href)), tabs: 0, wa: [...document.querySelectorAll('a')].some(a => /wa\.me/.test(a.href)), tel: [...document.querySelectorAll('a[href^="tel:"]')].filter(a => a.offsetParent).length }));
    ck(S, 'JavaScript off: first stop card still shows', nj.stop === 'The Punjabi kitchen' && nj.dishes === 4, JSON.stringify(nj));
    ck(S, 'JavaScript off: visitor can still call and book on WhatsApp', nj.tel > 0 && nj.bookWA, JSON.stringify(nj));
    ck(S, 'JavaScript off: no empty, dead controls are shown (booking card, journey, spaces tabs)', !(nj.planBtnVisible && nj.who === 0) && !nj.jVis && !nj.tVis, 'booking card visible with ' + nj.who + ' choices; journey has ' + nj.journey + ' stops; spaces has ' + nj.tabs + ' tabs');
    await p.goto(U + 'menu.html'); const nm = await p.evaluate(() => ({ vis: [...document.querySelectorAll('.item')].filter(x => x.offsetParent).length, add: [...document.querySelectorAll('.add')].filter(x => x.offsetParent).length }));
    ck(S, 'JavaScript off: the whole menu is readable', nm.vis === 293, nm.vis + ' of 293 dishes visible');
    ck(S, 'JavaScript off: dead "+" buttons are hidden', nm.add === 0, nm.add + ' visible');
    await p.goto(U + 'events.html'); const ne = await p.evaluate(() => ({ chips: document.querySelectorAll('#planner .chip').length, tel: [...document.querySelectorAll('a[href^="tel:"]')].filter(a => a.offsetParent).length }));
    ck(S, 'JavaScript off: event page still offers a phone number', ne.tel > 0, JSON.stringify(ne));
    await p.context().close();

    const k = await ctx(1280, 800); await at(k, DAY); await k.goto(U + 'index.html'); await k.waitForTimeout(250);
    await k.keyboard.press('Tab'); const sk = await k.evaluate(() => ({ t: document.activeElement.textContent, vis: document.activeElement.getBoundingClientRect().top >= 0 && document.activeElement.getBoundingClientRect().height > 10 }));
    ck(S, 'keyboard: first Tab reveals "Skip to content"', sk.t === 'Skip to content' && sk.vis, JSON.stringify(sk));
    let noRing = [];
    for (let i = 0; i < 45; i++) { await k.keyboard.press('Tab'); const f = await k.evaluate(() => { const e = document.activeElement, s = getComputedStyle(e); return { id: e.tagName + ':' + (e.textContent || '').trim().slice(0, 20), ring: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 || s.boxShadow !== 'none' }; }); if (!f.ring) noRing.push(f.id); }
    ck(S, 'keyboard: every focused control shows a focus ring', noRing.length === 0, [...new Set(noRing)].slice(0, 6).join(' | '));
    await k.focus('.pin[data-stop="3"]'); await k.keyboard.press('Enter'); eq(S, 'keyboard: Enter on a pin opens that stop', await k.textContent('#stop h2'), (await k.evaluate(() => window.BFD_KITCHENS[2].title)));
    await k.context().close();

    // storage blocked (private mode): site must still work
    const s = await ctx(390, 844); await s.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); }); await at(s, DAY);
    const before = errs.length; await s.goto(U + 'menu.html'); await s.waitForTimeout(250); await s.click('#k-punjabi .add >> nth=0');
    ck(S, 'storage blocked (private browsing): menu and list still work', errs.length === before && (await s.textContent('#barCount')) === '1 dish on your list', errs.slice(before).join(' | '));
    await s.goto(U + 'index.html'); await s.waitForTimeout(250); await s.click('#plan .btn[data-plan]'); ck(S, 'storage blocked: booking still opens', await s.$eval('#planDlg', d => d.open) && errs.length === before, errs.slice(before).join(' | '));
    await s.context().close();

    // zoomed text (200%)
    const z = await ctx(390, 844); await at(z, DAY); await z.goto(U + 'index.html'); await z.addStyleTag({ content: 'html{font-size:200%}' }); await z.waitForTimeout(200);
    const zo = await z.evaluate(() => document.documentElement.scrollWidth - innerWidth); ck(S, 'large-text setting (200%): page still fits the phone width', zo <= 0, zo + 'px too wide');
    await z.context().close();
  }

  ck('Whole run', 'no JavaScript errors on any page', errs.length === 0, errs.slice(0, 5).join(' | '));
  await b.close();
  server.close();
  const fail = R.filter(r => !r.ok); const secs = {};
  R.forEach(r => { const s = r.sec.split(' · ')[0]; secs[s] = secs[s] || [0, 0]; secs[s][r.ok ? 0 : 1]++; });
  console.log('TOTAL', R.length, 'PASS', R.length - fail.length, 'FAIL', fail.length);
  Object.keys(secs).forEach(s => console.log('  ' + s.padEnd(18), 'pass', secs[s][0], 'fail', secs[s][1]));
  fail.forEach(f => console.log('FAIL [' + f.sec + '] ' + f.name + '\n      ' + f.detail));
  const missing = [...imgs].filter(i => !fs.existsSync(REPO + i.split('?')[0]));
  console.log('images referenced: ' + imgs.size + (missing.length ? ' (' + missing.length + ' not in the repo, so not checked)' : ', all present'));
  process.exit(fail.length ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); process.exit(1); });
