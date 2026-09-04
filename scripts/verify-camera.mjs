// Verify in-app camera: open overlay → shutter → photo sent as a message.
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

const browser = await chromium.launch({
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.grantPermissions(["camera"], { origin: site });
await ctx.addCookies([{ name: `sb-${ref}-auth-token`, value: cookie, url: site }]);
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("PAGE-ERR:", String(e).slice(0, 200)));
await page.goto(`${site}/messages/${convo.id}`, { waitUntil: "domcontentloaded" });
await page.waitForSelector('[aria-label="Take a photo"]', { timeout: 20000 });

// 1) Open the camera overlay
await page.click('[aria-label="Take a photo"]');
const dialog = page.locator('[role="dialog"][aria-label="Camera"]');
await dialog.waitFor({ timeout: 10000 });
console.log("camera overlay opened: true");
await page.waitForTimeout(1500);
const videoLive = await dialog.locator("video").first().evaluate((el) => el.readyState >= 2 && el.videoWidth > 0).catch(() => false);
console.log("live preview streaming:", videoLive);
await page.screenshot({ path: "scripts/camera-preview.png" });

// 2) Switch camera (should not error even with single fake device)
await page.click('[aria-label="Switch camera"]');
await page.waitForTimeout(1500);
const stillLive = await dialog.locator("video").first().evaluate((el) => el.readyState >= 2).catch(() => false);
console.log("after switch, preview ok:", stillLive);

// 3) Shutter → photo review screen → Send
await page.click('[aria-label="Take photo"]');
await page.waitForTimeout(2500);
const reviewShown = await page.locator('img[alt="Captured photo"]').count();
console.log("photo review screen shown:", reviewShown > 0);
await page.screenshot({ path: "scripts/camera-review.png" });
await page.click('[aria-label="Send photo"]');
await page.waitForTimeout(7000);
const overlayClosed = (await dialog.count()) === 0;
const imgs = await page.locator('img[alt="Shared photo"]').count();
const src = imgs > 0 ? await page.locator('img[alt="Shared photo"]').first().getAttribute("src") : null;
const resp = src ? await fetch(src) : null;
console.log("overlay closed after send:", overlayClosed);
console.log("photo bubble rendered:", imgs, "| fetch:", resp?.status, resp?.headers.get("content-type"));

const pass = videoLive && stillLive && reviewShown > 0 && overlayClosed && imgs >= 1 && resp?.ok;
console.log(pass ? "PASS ✓ in-app camera works" : "FAIL ✗");
await browser.close();
process.exit(pass ? 0 : 1);
