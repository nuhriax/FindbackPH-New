const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(() => localStorage.setItem('fb-auth-theme', 'dark'));
  const p = await ctx.newPage();
  await p.goto('http://localhost:3001/lost/fcdbc835-ef7b-43c6-a033-e6d08efdf4d1', { waitUntil: 'networkidle' });
  const probe = async (sel) => p.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return 'NOT FOUND: ' + s;
    const cs = getComputedStyle(el);
    return s + ' || bg=' + cs.backgroundColor + ' color=' + cs.color + ' border=' + cs.borderColor;
  }, sel);
  console.log(await probe('.status-chip'));
  console.log(await probe('.status-chip .text-red-700'));
  console.log(await probe('section.rounded-\\[32px\\]'));
  const panel = await p.evaluate(() => {
    const el = [...document.querySelectorAll('div')].find(d => d.className.includes('min-h-[620px]'));
    const cs = getComputedStyle(el);
    return 'PANEL bg=' + cs.backgroundColor + ' img=' + cs.backgroundImage.slice(0, 80);
  });
  console.log(panel);
  console.log(await probe('button[class*="Save"], button'));
  await p.goto('http://localhost:3001/how-it-works', { waitUntil: 'networkidle' });
  const ghost = await p.evaluate(() => {
    const links = [...document.querySelectorAll('a')].filter(a => a.textContent.includes('found item'));
    const a = links[links.length - 1];
    if (!a) return 'GHOST NOT FOUND';
    const cs = getComputedStyle(a);
    return 'GHOST bg=' + cs.backgroundColor + ' color=' + cs.color + ' border=' + cs.borderColor;
  });
  console.log(ghost);
  await p.waitForTimeout(6000);
  const ghost2 = await p.evaluate(() => {
    const links = [...document.querySelectorAll('a')].filter(a => /found something/i.test(a.textContent));
    const a = links[links.length - 1];
    if (!a) return 'GHOST NOT FOUND';
    const cs = getComputedStyle(a);
    return 'GHOST bg=' + cs.backgroundColor + ' color=' + cs.color + ' border=' + cs.borderColor;
  });
  console.log(ghost2);
  await p.evaluate(() => document.querySelector('a[href="/report/found"]')?.scrollIntoView({ block: 'center' }));
  await p.waitForTimeout(2000);
  await p.screenshot({ path: 'audit-shots/hiw-cta.jpg', type: 'jpeg', quality: 55, clip: { x: 0, y: 100, width: 1280, height: 400 } });
  await b.close();
})();
