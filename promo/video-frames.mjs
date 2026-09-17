// Promo VIDEO frame generator — renders 1080x1920 portrait frames for the
// promo video (Reels / TikTok / Shorts). Run: node promo/video-frames.mjs
// Frames are then encoded by ffmpeg into promo/findback-promo.mp4.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";

mkdirSync("promo/assets", { recursive: true });

function frame(inner) {
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Archivo:wght@500;700;800;900&display=swap" rel="stylesheet">
<style>
  *{margin:0;box-sizing:border-box}
  body{width:1080px;height:1920px;overflow:hidden;font-family:Archivo,system-ui,sans-serif;background:#FCF5E5;position:relative}
  .frame{position:absolute;inset:26px;border:16px solid #6B4A2B;border-radius:12px;box-shadow:inset 0 0 0 5px #4A3018,0 24px 70px rgba(0,0,0,.35)}
  .paper{position:absolute;inset:70px;background:#FCF5E5;padding:78px 62px 118px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
  .pin{position:absolute;top:44px;left:50%;transform:translateX(-50%);width:52px;height:52px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#F7CE68,#D99A1F 65%,#8F5E07);box-shadow:0 6px 14px rgba(0,0,0,.35);z-index:5}
  .kicker{font-size:27px;font-weight:800;letter-spacing:.35em;color:#8A6A45;text-transform:uppercase;margin-top:auto}
  .rule{width:210px;border-top:3px double #C9B08A;margin:28px 0}
  h1{font-size:104px;font-weight:900;color:#1B2A4A;line-height:1.05;letter-spacing:-.02em}
  h2{font-size:62px;font-weight:900;color:#1B2A4A;line-height:1.12}
  .hand{font-family:Caveat,cursive;font-size:52px;color:#C05B4D;margin-top:26px}
  .foot{margin-top:auto;font-size:29px;font-weight:800;letter-spacing:.22em;color:#4A3018}
  .cta{background:#1B2A4A;color:#FCF5E5;font-size:44px;font-weight:900;padding:28px 66px;border-radius:999px;letter-spacing:.04em}
  .sub{font-size:29px;color:#5A6478;margin-top:20px}
  .usps{display:flex;flex-direction:column;gap:30px;margin-top:52px;width:100%}
  .usp{display:flex;align-items:center;gap:22px;background:#fff;border:2px solid #E4D5B8;border-radius:18px;padding:30px 30px;text-align:left;box-shadow:0 3px 0 #E4D5B8}
  .ico{flex:none;width:82px;height:82px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:40px}
  .usp b{display:block;font-size:34px;color:#1B2A4A}
  .usp span{font-size:25px;color:#5A6478;line-height:1.35}
  .col{flex:1;border-radius:18px;padding:34px 30px;text-align:left}
  .col h3{font-size:32px;margin-bottom:18px}
  .col li{font-size:25px;line-height:1.55;color:#2A3550;margin:14px 0;list-style:none;padding-left:34px;position:relative}
  .bad::before{content:"✗";position:absolute;left:0;color:#C0392B;font-weight:900}
  .good::before{content:"✓";position:absolute;left:0;color:#1D7A4F;font-weight:900}
  .shot{width:100%;border:3px solid #E4D5B8;border-radius:20px;box-shadow:0 24px 60px rgba(27,42,74,.28);margin-top:44px}
  .phone{width:520px;border:14px solid #1B2A4A;border-radius:52px;box-shadow:0 26px 70px rgba(27,42,74,.32);margin-top:44px;background:#1B2A4A}
  .phone img{display:block;width:100%;border-radius:38px}
</style></head><body>
<div class="frame"></div><div class="pin"></div><div class="paper">${inner}</div></body></html>`;
}

const frames = {};

frames["vf-1-hook"] = frame(`
  <p class="kicker">★ Lost &amp; Found Philippines ★</p><div class="rule"></div>
  <h1>Lost something?<br>Someone probably<br>found it.</h1>
  <p class="hand">post it in 60 seconds — matching is automatic</p>
  <div style="height:56px"></div>
  <p class="cta">findbackph.me</p>
  <p class="sub">Free · Safe · Built for the 🇵🇭 community</p>
  <p class="foot">FINDBACKPH.ME</p>`);

frames["vf-2-desktop"] = frame(`
  <p class="kicker">★ Step 1 — Post a notice ★</p><div class="rule"></div>
  <h2>Report in under<br>a minute</h2>
  <p class="sub" style="margin-top:16px">A photo-first community board — the real site 👇</p>
  <img class="shot" src="site-hero-desktop.png" alt="FindBack PH homepage">
  <p class="foot">FINDBACKPH.ME</p>`);

frames["vf-3-mobile"] = frame(`
  <p class="kicker">★ Step 2 — Match &amp; chat ★</p><div class="rule"></div>
  <h2>Lost &amp; found,<br>wherever you are</h2>
  <div class="phone"><img src="site-hero-mobile.png" alt="FindBack PH on mobile"></div>
  <p class="foot">FINDBACKPH.ME</p>`);

frames["vf-4-trust"] = frame(`
  <p class="kicker">★ Why it's safe ★</p><div class="rule"></div>
  <div class="usps">
    <div class="usp"><div class="ico" style="background:#E8F4EF">🔐</div><div><b>The owner proves it</b><span>Private verification questions — a stranger can't blag their way into your item.</span></div></div>
    <div class="usp"><div class="ico" style="background:#EAF1F9">📷</div><div><b>Photos stay private</b><span>Protected, expiring links. Your photos can't be stolen and reused in scams.</span></div></div>
    <div class="usp"><div class="ico" style="background:#FBEEE7">💬</div><div><b>No contact info exposed</b><span>You message through the app. Your number never goes public.</span></div></div>
  </div>
  <p class="foot">FINDBACKPH.ME</p>`);

frames["vf-5-compare"] = frame(`
  <p class="kicker">★ Posting a found item ★</p><div class="rule"></div>
  <div style="display:flex;gap:24px;width:100%;margin-top:16px">
    <div class="col" style="background:#FBE9E7;border:2px solid #EBC4BE">
      <h3 style="color:#B03A2E">Facebook group post</h3>
      <ul><li class="bad">Photo stolen &amp; reused in scams</li><li class="bad">Number spammed by strangers</li><li class="bad">Fake "owners" claim it</li><li class="bad">Buried in the feed in hours</li></ul>
    </div>
    <div class="col" style="background:#E9F5EE;border:2px solid #BFDCC9">
      <h3 style="color:#1D7A4F">FindBack PH</h3>
      <ul><li class="good">Photos protected &amp; expiring</li><li class="good">Chat inside the app</li><li class="good">Owner verified by questions</li><li class="good">Auto-match finds the pair</li></ul>
    </div>
  </div>
  <p class="foot">FINDBACKPH.ME</p>`);

frames["vf-6-cta"] = frame(`
  <p class="kicker">★ Join the community board ★</p><div class="rule"></div>
  <h1 style="font-size:96px">Post it.<br>Match it.<br>Give it back.</h1>
  <p class="hand">every notice here is a neighbor helping</p>
  <div style="height:56px"></div>
  <p class="cta">FindBack PH — Free forever</p>
  <p class="sub">findbackph.me</p>
  <p class="foot">FINDBACKPH.ME</p>`);

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 });
  for (const [name, html] of Object.entries(frames)) {
    writeFileSync(`promo/assets/${name}.html`, html);
    await page.goto(`file://${process.cwd().replace(/\\/g, "/")}/promo/assets/${name}.html`);
    await page.waitForTimeout(1400); // web fonts + embedded screenshots
    await page.screenshot({ path: `promo/assets/${name}.png` });
    console.log("frame:", name);
  }
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });