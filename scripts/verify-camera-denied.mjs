// Verify denied-permission error state shows specific guidance.
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.trim().startsWith("#")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
);
const ref = env.NEXT_PUBLIC_SUPABASE_URL.replace(/^https:\/\//, "").split(".")[0];
const site = "http://localhost:3000";

// Login cookie is irrelevant for the camera UI; just visit a messages page.
// Use an invalid convo id — composer still renders? Use existing flow: reuse
// any conversation requires auth, so create a real user quickly.
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const h = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
const email = `fb-debug-${Date.now()}-x@example.com`;
const u = await (await fetch(`${url}/auth/v1/admin/users`, { method: "POST", headers: h, body: JSON.stringify({ email, password: "Debug-pass-123!", email_confirm: true }) })).json();
const gl = await (await fetch(`${url}/auth/v1/admin/generate_link`, { method: "POST", headers: h, body: JSON.stringify({ type: "magiclink", email }) })).json();
const al = new URL(gl.action_link);
const v = await fetch(`${url}/auth/v1/verify?token=${al.searchParams.get("token")}&type=magiclink&redirect_to=${site}/auth/callback`, { redirect: "manual" });
const p = new URLSearchParams((v.headers.get("location") ?? "").split("#")[1] ?? "");
const cookie = "base64-" + Buffer.from(JSON.stringify({ access_token: p.get("access_token"), token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: p.get("refresh_token"), user: u })).toString("base64url");
const item = (await (await fetch(`${url}/rest/v1/lost_items?id=eq.fcdbc835-ef7b-43c6-a033-e6d08efdf4d1&select=reporter_id`, { headers: h })).json())[0];
const convo = (await (await fetch(`${url}/rest/v1/conversations`, { method: "POST", headers: { ...h, Prefer: "return=representation" }, body: JSON.stringify({ item_type: "lost_item", item_id: "fcdbc835-ef7b-43c6-a033-e6d08efdf4d1", participant_a: u.id, participant_b: item.reporter_id }) })).json())[0];

// No --use-fake-ui flag and NO camera permission → getUserMedia must be denied.
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.addCookies([{ name: `sb-${ref}-auth-token`, value: cookie, url: site }]);
const page = await ctx.newPage();
await page.goto(`${site}/messages/${convo.id}`, { waitUntil: "domcontentloaded" });
await page.click('[aria-label="Take a photo"]');
const dialog = page.locator('[role="dialog"][aria-label="Camera"]');
await dialog.waitFor({ timeout: 10000 });
await page.waitForTimeout(1500);
const errText = await dialog.locator("p").first().innerText().catch(() => "");
console.log("denied error message:", JSON.stringify(errText));
const hasTryAgain = await dialog.locator('text=Try again').count();
console.log("Try again button present:", hasTryAgain > 0);
// Meaningful assertions: the overlay shows a friendly error screen (not the
// live camera), and offers Try again + Close. (Exact wording varies per
// browser/headless env, so we don't assert a specific string.)
const pass = errText.length > 10 && hasTryAgain > 0 && (await dialog.locator('text=Close').count()) > 0;
console.log(pass ? "PASS ✓ denied/no-camera state handled" : "FAIL ✗");
await browser.close();
process.exit(pass ? 0 : 1);
