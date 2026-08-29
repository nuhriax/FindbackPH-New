// diag-map.js — deep diagnostic: enable Network + Runtime on the MapLibre worker
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  const p = await ctx.newPage();
  const seen = new Set();
  const log = (t, m) => { const k = t + '|' + m; if (!seen.has(k)) { seen.add(k); console.log(`[${t}] ${m}`); } };
  p.on('console', (m) => log('console:' + m.type(), m.text().slice(0, 300)));
  p.on('pageerror', (e) => log('pageerror', String(e).slice(0, 300)));
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true });
  cdp.on('Target.attachedToTarget', async (e) => {
    console.log('[target]', e.targetInfo.type, e.targetInfo.url.slice(0, 80));
    if (e.targetInfo.type === 'worker') {
      const sid = e.sessionId;
      await cdp.send('Network.enable', {}, sid).catch(() => {});
      await cdp.send('Runtime.enable', {}, sid).catch(() => {});
      cdp.on('Network.requestWillBeSent', (ev) => { if (ev.sessionId === sid || true) log('worker-req', ev.request.url.slice(0, 140)); });
      cdp.on('Network.loadingFailed', (ev) => log('worker-fail', (ev.errorText || '') + ' ' + (ev.blockedReason || '')));
      cdp.on('Network.loadingCompleted', (ev) => log('worker-ok', ev.requestId));
      cdp.on('Runtime.exceptionThrown', (ev) => log('worker-exc', JSON.stringify(ev.exceptionDetails).slice(0, 400)));
    }
  });
  p.on('request', (r) => { const u = r.url(); if (/openfreemap|pbf|carto|osm|arcgis/.test(u)) log('page-req', u.slice(0, 140)); });
  p.on('requestfailed', (r) => log('page-fail', r.url().slice(0, 140) + ' :: ' + r.failure()?.errorText));
  try { await p.goto('http://localhost:3222/search', { waitUntil: 'domcontentloaded', timeout: 30000 }); } catch (e) { console.log('goto:', String(e).slice(0, 120)); }
  await p.waitForTimeout(15000);
  console.log('/*title:*/', await p.title());
  // inspect runtime map state + actual pixel content
  const state = await p.evaluate(() => {
    const c = document.querySelector('canvas');
    if (!c) return { canvas: false };
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    const px = new Uint8Array(4 * 100);
    // read from center
    gl.readPixels(Math.floor(c.width / 2), Math.floor(c.height / 2), 10, 10, gl.RGBA, gl.UNSIGNED_BYTE, px);
    let nonzero = 0;
    for (let i = 0; i < px.length; i += 4) if (px[i] + px[i + 1] + px[i + 2] > 0) nonzero++;
    return { canvas: true, w: c.width, h: c.height, nonzeroCenterPx: nonzero };
  }).catch(e => ({ evalErr: String(e).slice(0, 200) }));
  console.log('/*state:*/', JSON.stringify(state));
  const mapState = await p.evaluate(() => {
    const m = window.__fbMap;
    if (!m) return { noMap: true };
    const el = document.elementFromPoint(640, 400);
    const chain = [];
    let n = el;
    while (n && n !== document.body && chain.length < 6) {
      const cs = getComputedStyle(n);
      chain.push({ tag: n.tagName, cls: String(n.className).slice(0, 60), bg: cs.backgroundColor, op: cs.opacity, pos: cs.position, z: cs.zIndex });
      n = n.parentElement;
    }
    let water = -1, all = -1;
    try { all = m.queryRenderedFeatures().length; water = m.queryRenderedFeatures(undefined, { layers: ['water'] }).length; } catch (e) { all = 'ERR ' + String(e).slice(0, 80); }
    return {
      loaded: m.loaded(), styleLoaded: m.isStyleLoaded(), tilesLoaded: m.areTilesLoaded(),
      zoom: m.getZoom(), center: m.getCenter(),
      layers: m.getStyle().layers.map(l => l.id),
      renderedFeatures: all, waterFeatures: water,
      elementAtCenter: chain,
    };
  }).catch(e => ({ evalErr: String(e).slice(0, 300) }));
  console.log('/*mapState:*/', JSON.stringify(mapState));
  // Live bisection: remove mask/satellite layers, repaint, re-shoot
  const bisect = await p.evaluate(async () => {
    const m = window.__fbMap;
    const removed = [];
    for (const id of ['ph-mask', 'ph-mask-fallback', 'satellite']) { try { if (m.getLayer(id)) { m.removeLayer(id); removed.push(id); } } catch {} }
    m.triggerRepaint();
    return removed;
  }).catch(e => ({ evalErr: String(e).slice(0, 300) }));
  console.log('/*removed:*/', JSON.stringify(bisect));
  await p.waitForTimeout(2500);
  const shot2 = await p.locator('.maplibregl-canvas').first().screenshot({ path: 'canvas-nomask.png' }).catch(() => null);
  console.log('/*shot2Bytes:*/', shot2 ? shot2.length : 'FAILED');
  // Identify the culprit layer: re-add one at a time
  const culprit = await p.evaluate(async () => {
    const m = window.__fbMap;
    // 1) real Esri satellite layer, hidden
    try {
      if (!m.getSource('satellite-raster')) m.addSource('satellite-raster', { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, maxzoom: 19 });
      m.addLayer({ id: 'satellite', type: 'raster', source: 'satellite-raster', layout: { visibility: 'none' } });
    } catch (e) { return 'sat-err ' + e.message; }
    m.triggerRepaint();
    await new Promise(r => setTimeout(r, 3000));
    return 'sat-added';
  }).catch(e => ({ evalErr: String(e).slice(0, 300) }));
  console.log('/*culprit-notes:*/', JSON.stringify(culprit));
  const shot4 = await p.locator('.maplibregl-canvas').first().screenshot({ path: 'canvas-testmask.png' }).catch(() => null);
  console.log('/*shot4Bytes-sat:*/', shot4 ? shot4.length : 'FAILED');
  // 2) now add the full boundary mask on top
  const mask = await p.evaluate(async () => {
    const m = window.__fbMap;
    try {
      const worldRing = [[-180,-85],[180,-85],[180,85],[-180,85]];
      // step A: world ring ONLY (no holes)
      if (!m.getSource('testA')) m.addSource('testA', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [worldRing] } } });
      m.addLayer({ id: 'testA-layer', type: 'fill', source: 'testA', paint: { 'fill-color': '#ff0000' } });
      m.triggerRepaint();
      await new Promise(r => setTimeout(r, 2500));
      return 'worldring-added';
    } catch (e) { return 'mask-err ' + e.message; }
  }).catch(e => ({ evalErr: String(e).slice(0, 300) }));
  console.log('/*mask-notes:*/', JSON.stringify(mask));
  const shot5 = await p.locator('.maplibregl-canvas').first().screenshot({ path: 'canvas-testmask2.png' }).catch(() => null);
  console.log('/*shot5Bytes-worldring:*/', shot5 ? shot5.length : 'FAILED');
  // step B: remove world ring, add world ring with ONE simple PH hole
  const maskB = await p.evaluate(async () => {
    const m = window.__fbMap;
    try { m.removeLayer('testA-layer'); } catch {}
    try {
      const worldRing = [[-180,-85],[180,-85],[180,85],[-180,85]];
      const ph = [[117,5],[127,5],[127,20],[117,20],[117,5]];
      const area = (r) => { let s = 0; for (let i = 0; i < r.length - 1; i++) s += (r[i][0]-r[i+1][0])*(r[i][1]+r[i+1][1]); return s > 0 ? 1 : -1; };
      const hole = area(ph) === area(worldRing) ? [...ph].reverse() : ph;
      if (!m.getSource('testB')) m.addSource('testB', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [worldRing, hole] } } });
      m.addLayer({ id: 'testB-layer', type: 'fill', source: 'testB', paint: { 'fill-color': '#00ff00' } });
      m.triggerRepaint();
      await new Promise(r => setTimeout(r, 2500));
      return 'hole-added';
    } catch (e) { return 'maskB-err ' + e.message; }
  }).catch(e => ({ evalErr: String(e).slice(0, 300) }));
  console.log('/*maskB:*/', JSON.stringify(maskB));
  const shot6 = await p.locator('.maplibregl-canvas').first().screenshot({ path: 'canvas-testmask3.png' }).catch(() => null);
  console.log('/*shot6Bytes-hole:*/', shot6 ? shot6.length : 'FAILED');
  // step C: add the REAL boundary rings
  const maskC = await p.evaluate(async () => {
    const m = window.__fbMap;
    try {
      const res = await fetch('https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/main/releaseData/gbOpen/PHL/ADM0/geoBoundaries-PHL-ADM0_simplified.geojson');
      const gj = await res.json();
      const shape = gj.type === 'FeatureCollection' ? gj.features[0] : gj;
      const polys = shape.geometry.type === 'Polygon' ? [shape.geometry.coordinates] : shape.geometry.coordinates;
      const area = (r) => { let s = 0; for (let i = 0; i < r.length - 1; i++) s += (r[i][0]-r[i+1][0])*(r[i][1]+r[i+1][1]); return s; };
      let minX = 999, maxX = -999, minY = 999, maxY = -999, pos = 0, neg = 0, totalPts = 0;
      for (const rings of polys) for (const r of rings) { const a = area(r); if (a > 0) pos++; else neg++; totalPts += r.length; for (const [x, y] of r) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; } }
      return { type: shape.geometry.type, polys: polys.length, posRings: pos, negRings: neg, totalPts, bbox: [minX, minY, maxX, maxY] };
    } catch (e) { return 'maskC-err ' + e.message; }
  }).catch(e => ({ evalErr: String(e).slice(0, 300) }));
  console.log('/*maskC:*/', JSON.stringify(maskC));
  const shot7 = await p.locator('.maplibregl-canvas').first().screenshot({ path: 'canvas-testmask4.png' }).catch(() => null);
  console.log('/*shot7Bytes-real:*/', shot7 ? shot7.length : 'FAILED');
  // step D: SINGLE feature, one world ring, all island rings as holes
  const maskD = await p.evaluate(async () => {
    const m = window.__fbMap;
    try {
      const res = await fetch('https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/main/releaseData/gbOpen/PHL/ADM0/geoBoundaries-PHL-ADM0_simplified.geojson');
      const gj = await res.json();
      const worldRing = [[-180,-85],[180,-85],[180,85],[-180,85],[-180,-85]];
      const shape = gj.type === 'FeatureCollection' ? gj.features[0] : gj;
      const polys = shape.geometry.type === 'Polygon' ? [shape.geometry.coordinates] : shape.geometry.coordinates;
      const area = (r) => { let s = 0; for (let i = 0; i < r.length - 1; i++) s += (r[i][0]-r[i+1][0])*(r[i][1]+r[i+1][1]); return s; };
      const wsign = area(worldRing);
      const holes = [];
      for (const rings of polys) for (const r of rings) holes.push(area(r) === wsign ? [...r].reverse() : r);
      if (!m.getSource('testD')) m.addSource('testD', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [worldRing, ...holes] } } });
      m.addLayer({ id: 'testD-layer', type: 'fill', source: 'testD', paint: { 'fill-color': '#111111', 'fill-opacity': 0.75 } });
    } catch (e) { return 'maskD-err ' + e.message; }
    m.triggerRepaint();
    await new Promise(r => setTimeout(r, 4000));
    return 'maskD-added';
  }).catch(e => ({ evalErr: String(e).slice(0, 300) }));
  console.log('/*maskD:*/', JSON.stringify(maskD));
  const shot8 = await p.locator('.maplibregl-canvas').first().screenshot({ path: 'canvas-testmask5.png' }).catch(() => null);
  console.log('/*shot8Bytes-singlefeature:*/', shot8 ? shot8.length : 'FAILED');
  await p.screenshot({ path: 'diag-map.png' });
  console.log('--- done ---');
  await b.close();
})();
