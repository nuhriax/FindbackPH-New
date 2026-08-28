/* Headless tile diagnostic: are map tiles loading? Which requests fail? */
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
  page.on("requestfailed", (r) =>
    console.log("[FAILED]", r.url().slice(0, 120), r.failure()?.errorText),
  );
  page.on("response", (r) => {
    if (r.status() >= 400) console.log("[HTTP", r.status() + "]", r.url().slice(0, 120));
  });
  page.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 300)));
  page.on("console", (m) => {
    const t = m.text();
    if (/error|csp|Refused/i.test(t)) console.log("[console]", t.slice(0, 250));
  });

  await page.goto("http://localhost:3000/search", {
    waitUntil: "networkidle2",
    timeout: 90000,
  });
  await page.waitForSelector(".leaflet-container", { timeout: 30000 });
  await page.evaluate(() => {
    document.querySelector(".leaflet-container").scrollIntoView({ block: "center" });
  });
  await new Promise((r) => setTimeout(r, 5000));

  const info = await page.evaluate(() => ({
    tiles: document.querySelectorAll("img.leaflet-tile").length,
    loadedTiles: document.querySelectorAll("img.leaflet-tile-loaded").length,
    markers: document.querySelectorAll(".leaflet-marker-icon").length,
    bg: getComputedStyle(document.querySelector(".leaflet-container")).backgroundColor,
  }));
  console.log(JSON.stringify(info));
  await page.screenshot({ path: "map-diag.png" });
  await browser.close();
})().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
