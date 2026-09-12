const BASE = process.env.REPRO_BASE ?? "http://localhost:3000";
import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push("PAGEERROR: " + (e.stack ?? e.message)));
page.on("console", (m) => m.type() === "error" && errors.push("CONSOLE: " + m.text()));
async function visit(route, opts = {}) {
  errors.length = 0;
  try {
    const resp = await page.goto(BASE + route, { waitUntil: opts.wait ?? "networkidle", timeout: 60000 });
    if (opts.reload) await page.reload({ waitUntil: "networkidle" });
    console.log(route, "STATUS:", resp.status(), "ERRORS:", errors.length ? errors.slice(0, 3).join(" || ") : "none");
    return resp.status();
  } catch (e) {
    console.log(route, "NAV-FAIL:", String(e).slice(0, 200), errors.slice(0, 2).join(" || "));
    return 0;
  }
}

// 1. Heavy client pages: wizard (dynamic map), auth-adjacent
for (const r of ["/report/lost", "/report/found", "/forgot-password", "/reset-password", "/verify-success", "/offline", "/faq", "/contact", "/privacy", "/terms"]) {
  await visit(r);
}

// 2. Grab real detail ids from discover feed links
await visit("/discover");
const links = await page.$$eval('a[href^="/lost/"], a[href^="/found/"]', (as) => as.map((a) => a.getAttribute("href")).filter((h) => h && h.split("/").length === 3));
const firstLost = links.find((h) => h.startsWith("/lost/"));
const firstFound = links.find((h) => h.startsWith("/found/"));
console.log("DETAIL LINKS FOUND:", links.slice(0, 5).join(", "));
if (firstLost) await visit(firstLost, { reload: true });
if (firstFound) await visit(firstFound, { reload: true });

// 3. Client-side Link navigation: home -> discover -> detail -> home
errors.length = 0;
await page.goto(BASE + "/", { waitUntil: "networkidle" });
const nav = async (sel, label) => {
  try {
    await page.click(sel, { timeout: 8000 });
    await page.waitForLoadState("networkidle");
    console.log("CLIENT-NAV", label, page.url(), "ERRORS:", errors.length ? errors.slice(0, 3).join(" || ") : "none");
  } catch (e) {
    console.log("CLIENT-NAV", label, "FAIL:", String(e).slice(0, 120), errors.slice(0, 2).join(" || "));
  }
};
await nav('a[href="/discover"]', "home->discover");
if (firstLost) {
  await nav(`a[href="${firstLost}"]`, "discover->detail");
  await nav('a[href="/"]', "detail->home");
}
// wizard internal step nav
await visit("/report/lost");
await nav('button:has-text("Continue")', "wizard step1->2");

await browser.close();