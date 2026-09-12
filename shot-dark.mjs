import { chromium } from "playwright";

const pages = [
  ["home", "http://localhost:3000/"],
  ["discover", "http://localhost:3000/discover"],
  ["report-lost", "http://localhost:3000/report/lost"],
  ["report-found", "http://localhost:3000/report/found"],
];

const b = await chromium.launch();

// Find a live detail link from /discover (lost or found)
let detailPath = null;
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto("http://localhost:3000/discover", { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  const href = await p.evaluate(() => {
    const a = document.querySelector('a[href^="/lost/"], a[href^="/found/"]');
    return a ? a.getAttribute("href") : null;
  });
  detailPath = href;
  await ctx.close();
}
if (detailPath) pages.push(["detail", `http://localhost:3000${detailPath}`]);
console.log(`detail link: ${detailPath ?? "none found"}`);

for (const mode of ["light", "dark"]) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: mode });
  const p = await ctx.newPage();
  await p.addInitScript((m) => localStorage.setItem("fb-auth-theme", m), mode);
  for (const [name, url] of pages) {
    await p.goto(url, { waitUntil: "networkidle" });
    await p.waitForTimeout(900);
    await p.screenshot({ path: `audit-shots/phase2-${mode}-${name}.png` });
    console.log(`shot: phase2-${mode}-${name}.png`);
  }
  await ctx.close();
}

// 320px mobile-width overflow check (light theme)
{
  const ctx = await b.newContext({ viewport: { width: 320, height: 700 }, colorScheme: "light" });
  const p = await ctx.newPage();
  await p.addInitScript(() => localStorage.setItem("fb-auth-theme", "light"));
  for (const [name, url] of pages) {
    await p.goto(url, { waitUntil: "networkidle" });
    await p.waitForTimeout(600);
    const overflow = await p.evaluate(() => {
      const bad = [];
      const doc = document.documentElement;
      if (doc.scrollWidth > window.innerWidth + 1) {
        for (const el of document.querySelectorAll("*")) {
          const r = el.getBoundingClientRect();
          if (r.right > window.innerWidth + 1 && r.width > 24 && el.children.length < 40)
            bad.push(`${el.tagName}.${String(el.className).slice(0, 60)}`);
          if (bad.length > 4) break;
        }
      }
      return { scrollW: doc.scrollWidth, innerW: window.innerWidth, offenders: bad };
    });
    console.log(
      `w320 ${name}: ${overflow.scrollW > overflow.innerW + 1 ? "OVERFLOW scrollW=" + overflow.scrollW : "ok"}` +
        (overflow.offenders.length ? " offenders: " + overflow.offenders.join(" | ") : ""),
    );
    await p.screenshot({ path: `audit-shots/phase2-w320-${name}.png` });
  }
  await ctx.close();
}
await b.close();
