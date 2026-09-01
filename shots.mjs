import { chromium } from "playwright";

const pages = [
  { url: "http://localhost:3000", name: "home" },
  { url: "http://localhost:3000/discover", name: "explore" },
  { url: "http://localhost:3000/report/lost", name: "report" },
  { url: "http://localhost:3000/about", name: "about" },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

for (const p of pages) {
  try {
    await page.goto(p.url, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `shots/${p.name}-top.png` });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5));
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `shots/${p.name}-mid.png` });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `shots/${p.name}-bottom.png` });
    console.log("OK", p.name);
  } catch (e) {
    console.log("FAIL", p.name, String(e).slice(0, 200));
  }
}

// Mobile check
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mpage = await mctx.newPage();
try {
  await mpage.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 60000 });
  await mpage.waitForTimeout(2500);
  await mpage.screenshot({ path: "shots/home-mobile.png" });
  console.log("OK mobile");
} catch (e) {
  console.log("FAIL mobile", String(e).slice(0, 200));
}

await browser.close();
