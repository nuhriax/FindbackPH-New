// Live map diagnostic: loads /search with Playwright, captures console
// errors and screenshots the map after the style settles.
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("console", (m) => {
    if (["error", "warning"].includes(m.type())) errors.push(`[${m.type()}] ${m.text().slice(0, 300)}`);
  });
  page.on("pageerror", (e) => errors.push(`[pageerror] ${String(e).slice(0, 300)}`));
  page.on("requestfailed", (r) => {
    const u = r.url();
    if (/arcgisonline|tile|geojson|worker/i.test(u)) errors.push(`[reqfail] ${u.slice(0, 140)} -> ${r.failure()?.errorText}`);
  });

  await page.goto("http://localhost:3000/search", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(12000);

  const state = await page.evaluate(() => {
    const map = window.__fbMap;
    if (!map) return { map: false };
    return {
      map: true,
      styleLoaded: map.isStyleLoaded(),
      zoom: map.getZoom(),
      center: map.getCenter(),
      canvas: (() => { const c = map.getCanvas(); const g = c.getContext("webgl2") || c.getContext("webgl"); return g ? "gl-ok" : "gl-null"; })(),
      layers: map.getStyle().layers ? map.getStyle().layers.map((l) => l.id).slice(0, 40) : [],
      sources: Object.keys(map.getStyle().sources || {}),
      zoomTiles: map.areTilesLoaded(),
    };
  }).catch((e) => ({ evalError: String(e).slice(0, 200) }));

  const mapEl = await page.$(".maplibregl-canvas");
  if (mapEl) await mapEl.screenshot({ path: "map-diag.png" });
  await page.screenshot({ path: "page-diag.png" });

  console.log("STATE:", JSON.stringify(state, null, 2));
  console.log("ERRORS:", errors.length ? errors.slice(0, 25).join("\n") : "(none)");
  await browser.close();
})();
