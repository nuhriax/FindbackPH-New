// Demo photos — generated placeholders (public/demo/*). Playwright renders
// clean flat-lay style compositions with a small "DEMO" watermark so the
// sample assets are honest about what they are.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "demo");
mkdirSync(outDir, { recursive: true });

const assets = [
  {
    file: "iphone-lost.png",
    bg: "#E9E2D6",
    label: "Demo: iPhone 13 (black) — sample photo",
    art: `
      <div style="width:210px;height:420px;border-radius:34px;background:#15181c;box-shadow:0 24px 48px rgba(36,30,23,.35);border:5px solid #2c3138;position:relative;">
        <div style="position:absolute;top:12px;left:50%;transform:translateX(-50%);width:64px;height:18px;border-radius:10px;background:#0a0c0e;"></div>
        <div style="position:absolute;inset:34px 10px 12px;border-radius:24px;background:linear-gradient(180deg,#f7c98b 0%,#e79f5a 38%,#8a5a3b 100%);"></div>
        <div style="position:absolute;bottom:22px;left:50%;transform:translateX(-50%);width:70px;height:5px;border-radius:3px;background:rgba(255,255,255,.75);"></div>
      </div>`,
  },
  {
    file: "iphone-found.png",
    bg: "#DCE4E8",
    label: "Demo: iPhone found — sample photo",
    art: `
      <div style="display:flex;gap:26px;align-items:flex-end;">
        <div style="width:150px;height:96px;border-radius:14px;background:#f3ede2;box-shadow:0 14px 28px rgba(36,30,23,.25);transform:rotate(-4deg);"></div>
        <div style="width:210px;height:420px;border-radius:34px;background:#15181c;box-shadow:0 24px 48px rgba(36,30,23,.35);border:5px solid #2c3138;position:relative;">
          <div style="position:absolute;inset:34px 10px 12px;border-radius:24px;background:#101216;"></div>
          <div style="position:absolute;top:46%;left:50%;transform:translate(-50%,-50%);color:#5b6470;font-size:15px;letter-spacing:2px;">BATTERY EMPTY</div>
        </div>
      </div>`,
  },
];

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 900 },
  deviceScaleFactor: 1,
});

for (const asset of assets) {
  await page.setContent(
    `<!doctype html><html><body style="margin:0">
      <div style="width:1200px;height:900px;position:relative;background:${asset.bg};display:flex;align-items:center;justify-content:center;">
        ${asset.art}
        <div style="position:absolute;right:28px;bottom:24px;font:600 20px/1 -apple-system,'Segoe UI',sans-serif;color:rgba(36,30,23,.45);letter-spacing:3px;">DEMO PHOTO</div>
        <div style="position:absolute;left:28px;top:26px;font:600 17px/1.4 -apple-system,'Segoe UI',sans-serif;color:rgba(36,30,23,.5);">${asset.label}</div>
      </div>
    </body></html>`,
    { waitUntil: "networkidle" }
  );
  await page.screenshot({ path: join(outDir, asset.file) });
  console.log("wrote", asset.file);
}

await browser.close();
