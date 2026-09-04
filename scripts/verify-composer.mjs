// Verify the Messenger-style composer: screenshot + heart quick-send works.
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.trim().startsWith("#")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const ref = url.replace(/^https:\/\//, "").split(".")[0];
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const site = process.env.E2E_SITE ?? "http://localhost:3000";
const h = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

const email = `fb-debug-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
const u = await (await fetch(`${url}/auth/v1/admin/users`, { method: "POST", headers: h, body: JSON.stringify({ email, password: "Debug-pass-123!", email_confirm: true }) })).json();
const gl = await (await fetch(`${url}/auth/v1/admin/generate_link`, { method: "POST", headers: h, body: JSON.stringify({ type: "magiclink", email }) })).json();
const al = new URL(gl.action_link);
const v = await fetch(`${url}/auth/v1/verify?token=${al.searchParams.get("token")}&type=magiclink&redirect_to=${site}/auth/callback`, { redirect: "manual" });
const p = new URLSearchParams((v.headers.get("location") ?? "").split("#")[1] ?? "");
const cookie = "base64-" + Buffer.from(JSON.stringify({
  access_token: p.get("access_token"), token_type: "bearer",
  expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: p.get("refresh_token"), user: u,
})).toString("base64url");

const item = (await (await fetch(`${url}/rest/v1/lost_items?id=eq.fcdbc835-ef7b-43c6-a033-e6d08efdf4d1&select=reporter_id`, { headers: h })).json())[0];
const convo = (await (await fetch(`${url}/rest/v1/conversations`, { method: "POST", headers: { ...h, Prefer: "return=representation" }, body: JSON.stringify({ item_type: "lost_item", item_id: "fcdbc835-ef7b-43c6-a033-e6d08efdf4d1", participant_a: u.id, participant_b: item.reporter_id }) })).json())[0];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.addCookies([{ name: `sb-${ref}-auth-token`, value: cookie, url: site }]);
const page = await ctx.newPage();
await page.goto(`${site}/messages/${convo.id}`, { waitUntil: "domcontentloaded" });

const composer = page.locator('form:has(textarea[aria-label^="Message"])');
await composer.waitFor({ timeout: 20000 });
await page.waitForTimeout(1500);
await composer.screenshot({ path: "scripts/composer-preview.png" });
console.log("composer screenshot saved");

// Quick heart send
await page.click('[aria-label="Send a heart"]');
await page.waitForTimeout(4000);
const heartSent = await page.locator('text=❤️').count();
console.log("heart bubble rendered:", heartSent > 0);
const singleCheck = await page.locator('[aria-label="Sent"]').count();
console.log("heart has single-check receipt:", singleCheck > 0);

// Emoji picker toggle
await page.click('[aria-label="Choose an emoji"]');
await page.waitForTimeout(800);
const pickerVisible = await page.locator('text=Hearts').count() > 0 || await page.locator('[aria-label="Choose an emoji"][aria-expanded="true"]').count() > 0;
console.log("emoji picker opens:", pickerVisible);

await page.screenshot({ path: "scripts/composer-open.png", clip: { x: 0, y: 560, width: 1280, height: 340 } });
const pass = heartSent > 0 && singleCheck > 0 && pickerVisible;
console.log(pass ? "PASS ✓ composer works" : "FAIL ✗");
await browser.close();
process.exit(pass ? 0 : 1);
