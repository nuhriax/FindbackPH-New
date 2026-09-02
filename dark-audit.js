/* Dark-mode contrast audit: visits pages with fb-auth-theme=dark (site-ink),
   computes effective text color vs effective background for every visible
   element, flags WCAG failures. Run: node dark-audit.js [page ...] */
const { chromium } = require('playwright');

const BASE = process.env.AUDIT_BASE || 'http://localhost:3000';
const PAGES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['/', '/search', '/report/lost', '/report/found', '/about', '/faq', '/safety', '/contact', '/login', '/signup'];

function lum(r, g, b) {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(a, b) {
  const [l1, l2] = [lum(...a), lum(...b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
const parse = (s) => (s.match(/rgba?\(([\d.]+), ?([\d.]+), ?([\d.]+)(?:, ?([\d.]+))?\)/) || []).slice(1).map(Number);
const alphaComposite = (fg, bg) => {
  const a = fg[3] === undefined ? 1 : fg[3];
  return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a)).concat([1]).slice(0, 3);
};

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(() => localStorage.setItem('fb-auth-theme', 'dark'));
  const page = await ctx.newPage();

  const report = [];
  for (const path of PAGES) {
    try {
      await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 45000 });
    } catch { await page.waitForTimeout(3000).catch(() => {}); }
    await page.waitForTimeout(1200);

    const issues = await page.evaluate(() => {
      const els = document.querySelectorAll('body *');
      const out = [];
      const seen = new Set();
      for (const el of els) {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
        const hasText = [...el.childNodes].some(
          (n) => n.nodeType === 3 && n.textContent.trim().length > 1
        );
        const isBtnish = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'LABEL'].includes(el.tagName);
        if (!hasText && !isBtnish) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > innerHeight + 900) continue;

        // effective text color
        let color = cs.color;
        // effective bg: walk up
        let bg = null;
        let node = el;
        while (node && node !== document.documentElement) {
          const b = getComputedStyle(node).backgroundColor;
          const m = b.match(/rgba?\(([\d.]+), ?([\d.]+), ?([\d.]+)(?:, ?([\d.]+))?\)/);
          if (m) {
            const a = m[4] === undefined ? 1 : +m[4];
            if (a > 0.05) { bg = [ +m[1], +m[2], +m[3], a ]; break; }
          }
          if (getComputedStyle(node).backgroundImage !== 'none') break; // gradient: can't judge
          node = node.parentElement;
        }
        if (!bg) continue; // can't determine — skip
        const c = color.match(/rgba?\(([\d.]+), ?([\d.]+), ?([\d.]+)(?:, ?([\d.]+))?\)/);
        if (!c) continue;
        const fg = [+c[1], +c[2], +c[3], c[4] === undefined ? 1 : +c[4]];
        if (fg[3] < 0.15) continue; // intentionally faded
        const effFg = fg[3] < 1 ? fg.slice(0, 3).map((v, i) => v * fg[3] + bg[i] * (1 - fg[3])) : fg.slice(0, 3);
        const effBg = bg[3] < 1
          ? bg.slice(0, 3).map((v, i) => v * bg[3] + 12 * (1 - bg[3])) // page bg #0c2b29 ≈ 12,43,41
          : bg.slice(0, 3);
        const L = (rgb) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]); };
        const [lo, hi] = [L(effFg), L(effBg)].sort((a, b) => a - b);
        const ratio = (hi + 0.05) / (lo + 0.05);
        const big = +parseFloat(cs.fontSize) >= 24 || (+parseFloat(cs.fontSize) >= 18.66 && +cs.fontWeight >= 700);
        const threshold = big ? 3 : 4.5;
        if (ratio >= threshold) continue;
        const key = cs.color + '|' + getComputedStyle(el).backgroundColor + '|' + el.className.toString().slice(0, 80);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          ratio: +ratio.toFixed(2),
          tag: el.tagName,
          text: (el.textContent || el.value || '').trim().slice(0, 40),
          cls: el.className.toString().slice(0, 110),
          color: cs.color, bg: getComputedStyle(el).backgroundColor,
        });
      }
      return out;
    });
    if (issues.length) report.push({ path, issues });
  }

  for (const { path, issues } of report) {
    console.log('\n=== ' + path + ' — ' + issues.length + ' issues ===');
    for (const i of issues.slice(0, 25))
      console.log(` [${i.ratio}] <${i.tag}> "${i.text}" cls=${i.cls} color=${i.color} bg=${i.bg}`);
  }
  if (!report.length) console.log('ALL CLEAR — no low-contrast text found on audited pages.');

  // screenshots for visual review
  for (const path of PAGES) {
    try {
      await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 45000 });
    } catch { await page.waitForTimeout(3000).catch(() => {}); }
    await page.waitForTimeout(1500);
    const name = path === '/' ? 'home' : path.replace(/\//g, '_').replace(/^_/, '');
    await page.screenshot({ path: 'audit-shots/' + name + '.png', fullPage: false }).catch(() => {});
  }

  await browser.close();
})();
