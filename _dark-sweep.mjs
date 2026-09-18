import { chromium } from "playwright";
import fs from "fs";

const OUT = "audit-shots/dark-sweep";
fs.mkdirSync(OUT, { recursive: true });

const pages = [
  ["home-top", "/", null],
  ["home-trust", "/", "#trust-heading"],
  ["home-feed", "/", "text=See what needs a way home"],
  ["discover", "/discover", null],
  ["lost-id", null, null], // resolved below
  ["found-id", null, null], // resolved below
  ["login", "/login", null],
  ["register", "/register", null],
  ["forgot", "/forgot-password", null],
  ["faq", "/faq", null],
  ["safety", "/safety", null],
  ["how", "/how-it-works", null],
  ["about", "/about", null],
  ["contact", "/contact", null],
  ["privacy", "/privacy", null],
  ["terms", "/terms", null],
];

const b = await chromium.launch();

// Resolve real item ids from /api paths (public JSON API needs no auth)
let lostId = null;
let foundId = null;
try {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto("http://localhost:3000/discover", { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  const hrefs = await p.evaluate(() =>
    Array.from(document.querySelectorAll('a[href^="/lost/"], a[href^="/found/"]'))
      .map((a) => a.getAttribute("href"))
      .slice(0, 8)
  );
  lostId = hrefs.find((h) => h.startsWith("/lost/")) ?? null;
  foundId = hrefs.find((h) => h.startsWith("/found/")) ?? null;
  await ctx.close();
} catch (e) {
  console.log("detail resolve failed:", e.message);
}
console.log("detail links:", lostId, foundId);

const finalPages = [];
for (const [name, url, sel] of pages) {
  if (name === "lost-id" && lostId) finalPages.push(["detail-lost", lostId, null]);
  else if (name === "found-id" && foundId) finalPages.push(["detail-found", foundId, null]);
  else if (url) finalPages.push([name, url, sel]);
}

for (const mode of ["dark", "light"]) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1200 }, colorScheme: mode });
  const p = await ctx.newPage();
  await p.addInitScript((m) => localStorage.setItem("fb-auth-theme", m), mode);
  for (const [name, url, sel] of finalPages) {
    try {
      await p.goto("http://localhost:3000" + url, { waitUntil: "networkidle", timeout: 45000 });
      await p.waitForTimeout(1000);
      if (sel) {
        try {
          await p.locator(sel).first().scrollIntoViewIfNeeded({ timeout: 5000 });
          await p.waitForTimeout(600);
        } catch {}
      }
      await p.screenshot({ path: `${OUT}/${mode}-${name}.png` });
    } catch (e) {
      console.log(`FAIL ${mode}-${name}:`, e.message.split("\n")[0]);
    }
  }
  await ctx.close();
}
await b.close();
console.log("done ->", OUT);
