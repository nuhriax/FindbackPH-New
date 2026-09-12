import { readFileSync } from "fs";
import { chromium } from "playwright";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });
const page = await ctx.newPage();
// site-ink dark mode is toggled via the ThemeToggle -> html.site-ink class.
// Force it by evaluating localStorage + class before load.
await page.addInitScript(() => { localStorage.setItem("fb-auth-theme", "dark"); });
const errors = [];
page.on("pageerror", (e) => errors.push("PAGEERROR: " + (e.stack ?? e.message).slice(0, 300)));
page.on("console", (m) => m.type() === "error" && errors.push("CONSOLE: " + m.text().slice(0, 300)));
for (const [route, name] of [["/", "dark-home"], ["/discover", "dark-discover"], ["/login", "dark-login"]]) {
  await page.goto("http://localhost:3000" + route, { waitUntil: "networkidle", timeout: 60000 });
  // theme script reads fb-auth-theme on load; also click toggle if present
  await page.screenshot({ path: `audit-shots/phase2-${name}.png` });
  console.log("shot", name, "ERRORS:", errors.length ? errors.slice(0, 2).join(" || ") : "none");
  errors.length = 0;
}
await browser.close();