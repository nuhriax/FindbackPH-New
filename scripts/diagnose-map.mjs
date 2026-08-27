/* Headless diagnostic: what element sits on top of the map, and does a click
   on a Leaflet marker open a popup? Run while `npm run dev` is up. */
import puppeteer from "puppeteer-core";

(async () => {
  const browser = await puppeteer.launch({
    executablePath:
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1380, height: 900 });
  page.on("console", (m) => {
    const t = m.text();
    if (/error|leaflet/i.test(t)) console.log("[console]", t.slice(0, 200));
  });
  page.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 300)));

  await page.goto("http://localhost:3222/search", {
    waitUntil: "networkidle2",
    timeout: 90000,
  });
  await page.waitForSelector(".leaflet-container", { timeout: 30000 });
  // Scroll the map into the viewport so hit-testing works.
  await page.evaluate(() => {
    document.querySelector(".leaflet-container").scrollIntoView({ block: "center" });
  });
  await new Promise((r) => setTimeout(r, 1500));

  const info = await page.evaluate(() => {
    const map = document.querySelector(".leaflet-container");
    const r = map.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const stack = document.elementsFromPoint(cx, cy).slice(0, 6).map((el) => {
      const cs = getComputedStyle(el);
      return `${el.tagName.toLowerCase()}.${String(el.className.baseVal ?? el.className).split(" ").slice(0, 3).join(".")} pe=${cs.pointerEvents} z=${cs.zIndex}`;
    });
    // what's on top of the zoom control?
    const zoom = document.querySelector(".leaflet-control-zoom-in");
    let zoomStack = [];
    if (zoom) {
      const zr = zoom.getBoundingClientRect();
      zoomStack = document
        .elementsFromPoint(zr.left + zr.width / 2, zr.top + zr.height / 2)
        .slice(0, 4)
        .map((el) => `${el.tagName.toLowerCase()}.${String(el.className.baseVal ?? el.className).split(" ").slice(0, 3).join(".")}`);
    }
    return {
      mapRect: { w: r.width, h: r.height },
      centerStack: stack,
      zoomStack,
      markers: document.querySelectorAll(".leaflet-marker-icon").length,
      tiles: document.querySelectorAll("img.leaflet-tile").length,
      loadedTiles: document.querySelectorAll("img.leaflet-tile-loaded").length,
    };
  });
  console.log(JSON.stringify(info, null, 2));

  // Click the first marker → does a popup appear?
  const marker = await page.$(".leaflet-marker-icon");
  if (marker) {
    const box = await marker.boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await new Promise((r) => setTimeout(r, 800));
    const popup = await page.$(".leaflet-popup");
    console.log("marker click → popup:", popup ? "OPENED ✅" : "NOT OPENED ❌");
  } else {
    console.log("no markers found");
  }

  // Drag the map → does the pane transform change?
  const r = await page.evaluate(() => {
    const el = document.querySelector(".leaflet-container").getBoundingClientRect();
    return { x: el.left + el.width / 2, y: el.top + el.height / 2 };
  });
  const getTransform = () =>
    page.evaluate(() => getComputedStyle(document.querySelector(".leaflet-map-pane")).transform);
  const t0 = await getTransform();
  await page.mouse.move(r.x, r.y);
  await page.mouse.down();
  await page.mouse.move(r.x - 80, r.y - 40, { steps: 8 });
  await page.mouse.up();
  await new Promise((r2) => setTimeout(r2, 600));
  const t1 = await getTransform();
  console.log("drag moved map pane:", t0 !== t1 ? "YES ✅" : `NO ❌ (${t0} → ${t1})`);

  // Click the zoom-in control → new tiles should load.
  const zoomBtn = await page.$(".leaflet-control-zoom-in");
  if (zoomBtn) {
    const tilesBefore = await page.evaluate(() => document.querySelectorAll("img.leaflet-tile").length);
    const zb = await zoomBtn.boundingBox();
    await page.mouse.click(zb.x + zb.width / 2, zb.y + zb.height / 2);
    await new Promise((r2) => setTimeout(r2, 1200));
    const tilesAfter = await page.evaluate(() => document.querySelectorAll("img.leaflet-tile").length);
    console.log(`zoom-in control click: tiles ${tilesBefore} → ${tilesAfter} ${tilesAfter !== tilesBefore || tilesAfter > 0 ? "(clicked ✅)" : "❌"}`);
  } else {
    console.log("zoom control NOT FOUND ❌");
  }

  // NEW: click map once → wheel should now zoom (ScrollWheelZoomActivator).
  const r2 = await page.evaluate(() => {
    const el = document.querySelector(".leaflet-container").getBoundingClientRect();
    return { x: el.left + el.width / 2, y: el.top + el.height / 2 };
  });
  const tiles0 = await page.evaluate(() => document.querySelectorAll("img.leaflet-tile").length);
  await page.mouse.click(r2.x, r2.y);
  await new Promise((r3) => setTimeout(r3, 300));
  await page.mouse.move(r2.x, r2.y);
  await page.mouse.wheel({ deltaY: -240 });
  await new Promise((r3) => setTimeout(r3, 1500));
  const tiles1 = await page.evaluate(() => document.querySelectorAll("img.leaflet-tile").length);
  const zoomed = await page.evaluate(() =>
    document.querySelectorAll("img.leaflet-tile-loaded").length > 0 &&
    getComputedStyle(document.querySelector(".leaflet-map-pane")).transform !== "none"
  );
  console.log(`click-then-wheel zoom: tiles ${tiles0} → ${tiles1} (map animated: ${zoomed}) ${tiles1 !== tiles0 ? "✅ wheel zoom works" : "❌ wheel zoom did NOT change tiles"}`);

  await browser.close();
})().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
