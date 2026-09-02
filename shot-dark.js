/* Quick dark-mode screenshot + page-state dump for visual review. */
const { chromium } = require('playwright');
const BASE = process.env.AUDIT_BASE || 'http://localhost:3001';
const PAGES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['/', '/discover', '/search', '/about', '/report/lost'];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(() => localStorage.setItem('fb-auth-theme', 'dark'));
  const page = await ctx.newPage();
  for (const path of PAGES) {
    await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(6000);
    const name = path.replace(/[^a-z0-9]+/gi, '_');
    console.log(path, '→', page.url(), '|', await page.title());
    // Dump what's actually on screen so we can tell a splash overlay from real content
    const bodyText = (await page.evaluate(() => document.body.innerText.slice(0, 200).replace(/\n/g, ' / ')).catch(() => 'ERR'));
    console.log('   text:', bodyText);
    await page.screenshot({ path: 'audit-shots/v-' + name + '.png' }).catch(() => {});
  }
  await browser.close();
})();
