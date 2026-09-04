// Focused verify: A records a voice note → B receives a playable audio bubble.
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

async function makeUser() {
  const email = `fb-debug-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
  const u = await (await fetch(`${url}/auth/v1/admin/users`, { method: "POST", headers: h, body: JSON.stringify({ email, password: "Debug-pass-123!", email_confirm: true }) })).json();
  const gl = await (await fetch(`${url}/auth/v1/admin/generate_link`, { method: "POST", headers: h, body: JSON.stringify({ type: "magiclink", email }) })).json();
  const al = new URL(gl.action_link);
  const v = await fetch(`${url}/auth/v1/verify?token=${al.searchParams.get("token")}&type=magiclink&redirect_to=${site}/auth/callback`, { redirect: "manual" });
  const p = new URLSearchParams((v.headers.get("location") ?? "").split("#")[1] ?? "");
  const payload = {
    access_token: p.get("access_token"), token_type: "bearer",
    expires_in: Number(p.get("expires_in") ?? 3600),
    expires_at: Math.floor(Date.now() / 1000) + Number(p.get("expires_in") ?? 3600),
    refresh_token: p.get("refresh_token"), user: u,
  };
  const cv = "base64-" + Buffer.from(JSON.stringify(payload)).toString("base64url");
  return { id: u.id, cookie: cv };
}

const A = await makeUser();
const B = await makeUser();
const convo = (await (await fetch(`${url}/rest/v1/conversations`, { method: "POST", headers: { ...h, Prefer: "return=representation" }, body: JSON.stringify({ item_type: "lost_item", item_id: "fcdbc835-ef7b-43c6-a033-e6d08efdf4d1", participant_a: A.id, participant_b: B.id }) })).json())[0];
console.log("convo:", convo.id);

const browser = await chromium.launch({
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"],
});
const mkPage = async (cookie, label) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.grantPermissions(["microphone"], { origin: site });
  await ctx.addCookies([{ name: `sb-${ref}-auth-token`, value: cookie, url: site }]);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log(`${label} PAGE-ERR:`, String(e).slice(0, 200)));
  page.on("console", (m) => { if (m.type() === "error") console.log(`${label} CONSOLE-ERR:`, m.text().slice(0, 250)); });
  return page;
};
const pa = await mkPage(A.cookie, "A");
const pb = await mkPage(B.cookie, "B");
await pa.goto(`${site}/messages/${convo.id}`, { waitUntil: "domcontentloaded" });
await pb.goto(`${site}/messages/${convo.id}`, { waitUntil: "domcontentloaded" });
await pa.waitForSelector('[aria-label="Record a voice message"]', { timeout: 20000 });
await pb.waitForSelector('[aria-label="Record a voice message"]', { timeout: 20000 });

// A records ~2.5s and sends
await pa.click('[aria-label="Record a voice message"]');
await pa.waitForTimeout(2500);
const recBar = await pa.locator('button[aria-label="Send voice note"]').count();
console.log("A recording bar visible (send button present):", recBar > 0);
await pa.click('[aria-label="Send voice note"]');
await pb.waitForTimeout(7000);

// Check B's page for an audio bubble and whether its src actually loads
const audio = pb.locator("audio").first();
const audioCount = await pb.locator("audio").count();
console.log("B audio elements:", audioCount);
if (audioCount > 0) {
  const src = await audio.getAttribute("src");
  console.log("audio src:", src);
  const head = await fetch(src, { method: "GET" });
  console.log("audio file fetch status:", head.status, "| content-type:", head.headers.get("content-type"));
  // Actually try to play it in B's browser and confirm it isn't in the failed state
  const played = await audio.evaluate((el) =>
    el.play().then(() => ({ ok: true, dur: el.duration, err: null })).catch((e) => ({ ok: false, dur: el.duration, err: String(e) }))
  );
  console.log("B playback attempt:", JSON.stringify(played));
  const failedBtn = await pb.locator('[aria-label="Voice note unavailable"]').count();
  console.log("B failed-state players:", failedBtn);
}

// B plays it back in the UI
if (audioCount > 0) {
  await pb.click('[aria-label="Play voice note"]');
  await pb.waitForTimeout(1500);
  const stillPlaying = await pb.locator('[aria-label="Pause voice note"]').count();
  console.log("B UI play → pause button shown (playing):", stillPlaying > 0);
}

await browser.close();
console.log("DONE");
