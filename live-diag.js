// live-diag.js — diagnose the live FindBackPH map (search page + report pick page)
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const logs = [];
  page.on('console', m => { const t = m.text(); if (/error|warn|fail|worker|tile/i.test(t)) logs.push('[console] ' + t.slice(0, 200)); });
  page.on('pageerror', e => logs.push('[pageerror] ' + String(e).slice(0, 200)));
  page.on('requestfailed', r => logs.push('[reqfail] ' + r.url().slice(0, 140) + ' :: ' + (r.failure()?.errorText || '')));

  for (const url of ['https://findbackph.me/search', 'https://findbackph.me/report/lost']) {
    console.log('=== ' + url + ' ===');
    logs.length = 0;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(e => console.log('goto err', String(e).slice(0, 120)));
    await page.waitForTimeout(6000);
    const info = await page.evaluate(() => {
      const canvas = document.querySelector('.maplibregl-canvas');
      const mapEl = canvas?.closest('.maplibregl-map');
      const markers = document.querySelectorAll('.fbx-pin, .maplibregl-marker').length;
      return {
        hasCanvas: !!canvas,
        canvasSize: canvas ? canvas.width + 'x' + canvas.height : null,
        markers,
        containerCount: document.querySelectorAll('.maplibregl-map').length,
        workerUrls: performance.getEntriesByType('resource').map(r => r.name).filter(n => n.includes('worker')).slice(0, 3),
      };
    }).catch(e => ({ evalErr: String(e).slice(0, 200) }));
    console.log(JSON.stringify(info));
    console.log(logs.slice(0, 15).join('\n'));
  }
  await browser.close();
})();

// Part 2: DB check + report page walkthrough
(async () => {
  const fs = require('fs');
  for (const f of ['.env.local', '.env']) {
    if (fs.existsSync(f)) for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return console.log('no supabase env');
  const results = {};
  for (const table of ['lost_items', 'found_items']) {
    const q = `${url}/rest/v1/${table}?select=id,title,latitude,longitude,city,province&limit=1000`;
    const r = await fetch(q, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    const rows = await r.json();
    if (!Array.isArray(rows)) { results[table] = rows; continue; }
    results[table] = {
      total: rows.length,
      withPin: rows.filter(x => x.latitude != null && x.longitude != null).length,
      withCity: rows.filter(x => x.city).length,
      sample: rows.slice(0, 3).map(x => ({ title: x.title, city: x.city, lat: x.latitude, lng: x.longitude })),
    };
  }
  console.log(JSON.stringify(results, null, 1));
})();

// Part 4: screenshot search map to confirm tiles render
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto('https://findbackph.me/search', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(8000);
  await p.locator('.maplibregl-canvas').first().screenshot({ path: 'search-map.png' }).catch(e => console.log('shot fail', String(e).slice(0, 100)));
  // count failed tile requests
  await b.close();
})();

(async () => {
  const page2 = await (await chromium.launch()).newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  page2.on('pageerror', e => errs.push(String(e).slice(0, 150)));
  await page2.goto('https://findbackph.me/report/lost', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page2.waitForTimeout(3000);
  // dump buttons/inputs to understand the form
  const controls = await page2.evaluate(() =>
    [...document.querySelectorAll('button, input, select, textarea')].slice(0, 25).map(el =>
      (el.tagName + ':' + (el.textContent || el.placeholder || el.type || '').trim().slice(0, 40)))
  ).catch(e => [String(e).slice(0, 100)]);
  console.log('controls:', JSON.stringify(controls, null, 0));
  console.log('errors:', errs.join(' | ') || 'none');
  await page2.screenshot({ path: 'report-step1.png', fullPage: false });
  await page2.context().browser().close();
})();

