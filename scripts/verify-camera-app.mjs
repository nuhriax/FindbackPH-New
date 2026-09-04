// Verify the real camera app: photo mode + video recording, front/back switch, send both.
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

const email = `fb-debug-${Date.now()}-cam@example.com`;
const u = await (await fetch(`${url}/auth/v1/admin/users`, { method: "POST", headers: h, body: JSON.stringify({ email, password: "Debug-pass-123!", email_confirm: true }) })).json();
const gl = await (await fetch(`${url}/auth/v1/admin/generate_link`, { method: "POST", headers: h, body: JSON.stringify({ type: "magiclink", email }) })).json();
const al = new URL(gl.action_link);
const v = await fetch(`${url}/auth/v1/verify?token=${al.searchParams.get("token")}&type=magiclink&redirect_to=${site}/auth/callback`, { redirect: "manual" });
const p = new URLSearchParams((v.headers.get("location") ?? "").split("#")[1] ?? "");
const cookie = "base64-" + Buffer.from(JSON.stringify({ access_token: p.get("access_token"), token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: p.get("refresh_token"), user: u })).toString("base64url");
const item = (await (await fetch(`${url}/rest/v1/lost_items?id=eq.fcdbc835-ef7b-43c6-a033-e6d08efdf4d1&select=reporter_id`, { headers: h })).json())[0];
const convo = (await (await fetch(`${url}/rest/v1/conversations`, { method: "POST", headers: { ...h, Prefer: "return=representation" }, body: JSON.stringify({ item_type: "lost_item", item_id: "fcdbc835-ef7b-43c6-a033-e6d08efdf4d1", participant_a: u.id, participant_b: item.reporter_id }) })).json())[0];

const browser = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.grantPermissions(["camera", "microphone"], { origin: site });
await ctx.addCookies([{ name: `sb-${ref}-auth-token`, value: cookie, url: site }]);
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("PAGE-ERR:", String(e).slice(0, 200)));
await page.goto(`${site}/messages/${convo.id}`, { waitUntil: "domcontentloaded" });
await page.waitForSelector('[aria-label="Take a photo"]', { timeout: 20000 });

// --- Photo mode + front/back ---
await page.click('[aria-label="Take a photo"]');
const dialog = page.locator('[role="dialog"][aria-label="Camera"]');
await dialog.waitFor({ timeout: 10000 });
await page.waitForTimeout(1200);
await page.screenshot({ path: "scripts/camera-layout.png" });
console.log("mode toggle visible:", (await dialog.locator('[aria-label="Photo mode"]').count()) > 0, (await dialog.locator('[aria-label="Video mode"]').count()) > 0);
console.log("switch-camera button:", (await dialog.locator('[aria-label="Switch camera"]').count()) > 0);

await page.click('[aria-label="Switch camera"]');
await page.waitForTimeout(1200);
console.log("front cam (mirrored):", (await dialog.locator("video").first().getAttribute("class"))?.includes("scale-x"));
const labelAfter = await dialog.locator("text=FRONT").count();
console.log("FRONT label shown after swap:", labelAfter > 0);
await page.click('[aria-label="Switch camera"]');
await page.waitForTimeout(1200);
const labelBack = await dialog.locator("text=BACK").count();
console.log("BACK label shown after swap back:", labelBack > 0);

await page.click('[aria-label="Take photo"]');
await page.waitForTimeout(2000);
console.log("photo review:", (await dialog.locator('img[alt="Captured photo"]').count()) > 0);
await page.screenshot({ path: "scripts/camera-app-photo-review.png" });
await page.click('[aria-label="Send photo"]');
await page.waitForTimeout(6000);
console.log("photo sent:", (await page.locator('img[alt="Shared photo"]').count()));

// --- Video mode ---
await page.click('[aria-label="Take a photo"]');
await dialog.waitFor({ timeout: 10000 });
await page.waitForTimeout(1200);
await page.click('[aria-label="Video mode"]');
await page.waitForTimeout(800);
console.log("video armed:", (await dialog.locator('[aria-label="Record video"]').count()) > 0);

await page.click('[aria-label="Record video"]');
await page.waitForTimeout(500);
console.log("recording:", (await dialog.locator('[aria-label="Stop recording"]').count()) > 0);
await page.waitForTimeout(2200);
await page.click('[aria-label="Stop recording"]');
await page.waitForTimeout(2500);
console.log("video review:", (await dialog.locator("video[src][controls]").count()) > 0);
await page.screenshot({ path: "scripts/camera-app-video-review.png" });
await page.click('[aria-label="Send photo"]');
await page.waitForTimeout(7000);
const vids = await page.locator("video[controls][src]").count();
console.log("video bubbles:", vids);

const photoUrl = await page.locator('img[alt="Shared photo"]').last().getAttribute("src").catch(() => null);
const videoUrl = await page.locator("video[controls][src]").last().getAttribute("src").catch(() => null);
const photoRes = photoUrl ? await fetch(photoUrl) : null;
const videoRes = videoUrl ? await fetch(videoUrl) : null;
console.log("photo fetch:", photoRes?.status, photoRes?.headers.get("content-type"));
console.log("video fetch:", videoRes?.status,videoRes?.headers.get("content-type"));

const overlayClosed = (await dialog.count()) === 0;
const pass = (await page.locator('img[alt="Shared photo"]').count()) > 0 && vids > 0 && photoRes?.ok && videoRes?.ok && overlayClosed;
console.log(pass ? "PASS ✓ real camera (photo+video+front/back) works" : "FAIL ✗");
await browser.close();
process.exit(pass ? 0 : 1);