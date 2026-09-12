import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
page.on("console", (m) => m.type() === "error" && errors.push("CONSOLE: " + m.text()));
const resp = await page.goto("http://localhost:3000/discover", { waitUntil: "networkidle", timeout: 60000 });
console.log("STATUS:", resp.status());
await page.waitForTimeout(1500);
const body = (await page.textContent("body")).replace(/\s+/g, " ");
console.log("HAS_SNAG_TEXT:", /snag|went wrong|application error/i.test(body));
console.log("FIRST 400 CHARS:", body.slice(0, 400));
await page.screenshot({ path: "snag.png", fullPage: false });
console.log("ERRORS:", errors.length ? errors.slice(0, 5).join(" || ") : "none");
await browser.close();
