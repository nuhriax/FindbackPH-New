// Promo asset generator — captures live-site screenshots + renders branded slides.
// Run: node promo/generate.mjs   (writes everything into promo/assets/)
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";

mkdirSync("promo/assets", { recursive: true });

// ── Branded slide template (cream poster, cork frame, navy + coral/ocean) ──
function slide(inner) {
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Archivo:wght@500;700;800;900&display=swap" rel="stylesheet">
<style>
  *{margin:0;box-sizing:border-box}
  body{width:1080px;height:1350px;overflow:hidden;font-family:Archivo,system-ui,sans-serif;background:#FCF5E5;position:relative}
  .frame{position:absolute;inset:28px;border:14px solid #6B4A2B;border-radius:10px;box-shadow:inset 0 0 0 4px #4A3018,0 20px 60px rgba(0,0,0,.35)}
  .paper{position:absolute;inset:64px;background:#FCF5E5;padding:70px 64px;display:flex;flex-direction:column;align-items:center;text-align:center}
  .kicker{font-size:24px;font-weight:800;letter-spacing:.35em;color:#8A6A45;text-transform:uppercase}
  .rule{width:200px;border-top:3px double #C9B08A;margin:26px 0}
  h1{font-size:88px;font-weight:900;color:#1B2A4A;line-height:1.04;letter-spacing:-.02em}
  .hand{font-family:Caveat,cursive;font-size:46px;color:#C05B4D;margin-top:22px}
  .foot{margin-top:auto;font-size:30px;font-weight:800;letter-spacing:.2em;color:#4A3018}
  .pin{position:absolute;top:40px;left:50%;transform:translateX(-50%);width:46px;height:46px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#F7CE68,#D99A1F 65%,#8F5E07);box-shadow:0 6px 12px rgba(0,0,0,.35);z-index:5}
  .usps{display:flex;flex-direction:column;gap:26px;margin-top:44px;width:100%}
  .usp{display:flex;align-items:center;gap:20px;background:#fff;border:2px solid #E4D5B8;border-radius:16px;padding:26px 28px;text-align:left;box-shadow:0 3px 0 #E4D5B8}
  .ico{flex:none;width:74px;height:74px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:36px}
  .usp b{display:block;font-size:31px;color:#1B2A4A}
  .usp span{font-size:23px;color:#5A6478;line-height:1.35}
  .col{flex:1;border-radius:16px;padding:30px 28px;text-align:left}
  .col h3{font-size:29px;margin-bottom:16px}
  .col li{font-size:22.5px;line-height:1.55;color:#2A3550;margin:12px 0;list-style:none;padding-left:30px;position:relative}
  .bad::before{content:"✗";position:absolute;left:0;color:#C0392B;font-weight:900}
  .good::before{content:"✓";position:absolute;left:0;color:#1D7A4F;font-weight:900}
  .cta{margin-top:auto;background:#1B2A4A;color:#FCF5E5;font-size:40px;font-weight:900;padding:26px 60px;border-radius:999px;letter-spacing:.04em}
  .sub{font-size:26px;color:#5A6478;margin-top:18px}
</style></head><body>
<div class="frame"></div><div class="pin"></div><div class="paper">${inner}</div></body></html>`;
}

const slides = {
  "slide-1-hook": slide(`
    <p class="kicker">★ Lost &amp; Found Philippines ★</p><div class="rule"></div>
    <h1>Lost something?<br>Someone probably<br>found it.</h1>
    <p class="hand">post it in 60 seconds — matching is automatic</p>
    <p class="cta">findbackph.me</p>
    <p class="sub">Free · Safe · Built for the 🇵🇭 community</p>`),
  "slide-2-trust": slide(`
    <p class="kicker">★ Why it's safe ★</p><div class="rule"></div>
    <div class="usps">
      <div class="usp"><div class="ico" style="background:#E8F4EF">🔐</div><div><b>The owner proves it</b><span>Private verification questions — a stranger can't blag their way into your item.</span></div></div>
      <div class="usp"><div class="ico" style="background:#EAF1F9">📷</div><div><b>Photos stay private</b><span>Protected, expiring links. Your photos can't be stolen and reused in scams.</span></div></div>
      <div class="usp"><div class="ico" style="background:#FBEEE7">💬</div><div><b>No contact info exposed</b><span>You message through the app. Your number never goes public.</span></div></div>
    </div>
    <p class="foot">FINDBACKPH.ME</p>`),
  "slide-3-compare": slide(`
    <p class="kicker">★ Posting a found item ★</p><div class="rule"></div>
    <div style="display:flex;gap:22px;width:100%;margin-top:12px">
      <div class="col" style="background:#FBE9E7;border:2px solid #EBC4BE">
        <h3 style="color:#B03A2E">Facebook group post</h3>
        <ul><li class="bad">Photo stolen &amp; reused in scams</li><li class="bad">Number spammed by strangers</li><li class="bad">Fake "owners" claim it</li><li class="bad">Buried in the feed in hours</li></ul>
      </div>
      <div class="col" style="background:#E9F5EE;border:2px solid #BFDCC9">
        <h3 style="color:#1D7A4F">FindBack PH</h3>
        <ul><li class="good">Photos protected &amp; expiring</li><li class="good">Chat inside the app</li><li class="good">Owner verified by questions</li><li class="good">Auto-match finds the pair</li></ul>
      </div>
    </div>
    <p class="foot">FINDBACKPH.ME</p>`),
  "slide-4-cta": slide(`
    <p class="kicker">★ Join the community board ★</p><div class="rule"></div>
    <h1 style="font-size:76px">Post it.<br>Match it.<br>Give it back.</h1>
    <p class="hand">every notice here is a neighbor helping</p>
    <p class="cta">FindBack PH — Free forever</p>
    <p class="sub">findbackph.me</p>`),
};

async function main() {
  const browser = await chromium.launch();
  // 1) Branded slides (1080x1350 @2x — Instagram-portrait sharp)
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
  for (const [name, html] of Object.entries(slides)) {
    writeFileSync(`promo/assets/${name}.html`, html);
    await page.goto(`file://${process.cwd().replace(/\\/g, "/")}/promo/assets/${name}.html`);
    await page.waitForTimeout(1200); // web fonts
    await page.screenshot({ path: `promo/assets/${name}.png` });
    console.log("slide:", name);
  }
  // 2) Live-site screenshots
  const site = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await site.goto("https://findbackph.me", { waitUntil: "networkidle" });
  await site.waitForTimeout(1200);
  await site.click("text=Accept", { timeout: 5000 }).catch(() => {}); // dismiss cookie banner
  await site.waitForTimeout(800);
  // Hero only — crops away the empty live-feed section below the fold.
  await site.screenshot({ path: "promo/assets/site-hero-desktop.png", clip: { x: 0, y: 0, width: 1440, height: 660 } });
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await mobile.goto("https://findbackph.me", { waitUntil: "networkidle" });
  await mobile.waitForTimeout(1200);
  await mobile.click("text=Accept", { timeout: 5000 }).catch(() => {});
  await mobile.waitForTimeout(800);
  await mobile.screenshot({ path: "promo/assets/site-hero-mobile.png" });
  console.log("site shots done");
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
