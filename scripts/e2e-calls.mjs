// E2E: two users in one thread — voice message + real WebRTC voice call
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.trim().startsWith("#")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const ref = url.replace(/^https:\/\//, "").split(".")[0];
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const site = "http://localhost:3002";
const h = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

async function makeUser() {
  const email = `fb-debug-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
  const u = await (await fetch(`${url}/auth/v1/admin/users`, { method: "POST", headers: h, body: JSON.stringify({ email, password: "Debug-pass-123!", email_confirm: true }) })).json();
  const gl = await (await fetch(`${url}/auth/v1/admin/generate_link`, { method: "POST", headers: h, body: JSON.stringify({ type: "magiclink", email }) })).json();
  const al = new URL(gl.action_link);
  const v = await fetch(`${url}/auth/v1/verify?token=${al.searchParams.get("token")}&type=magiclink&redirect_to=${site}/auth/callback`, { redirect: "manual" });
  const p = new URLSearchParams((v.headers.get("location") ?? "").split("#")[1] ?? "");
  if (!p.get("access_token")) throw new Error(`no access_token for ${email}: ${(v.headers.get("location") ?? "").slice(0, 120)}`);
  // sanity: token must authenticate
  const chk = await fetch(`${url}/auth/v1/user`, { headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY, Authorization: `Bearer ${p.get("access_token")}` } });
  if (!chk.ok) throw new Error(`token invalid for ${email}: ${chk.status}`);
  const payload = {
    access_token: p.get("access_token"), token_type: "bearer",
    expires_in: Number(p.get("expires_in") ?? 3600),
    expires_at: Math.floor(Date.now() / 1000) + Number(p.get("expires_in") ?? 3600),
    refresh_token: p.get("refresh_token"), user: u,
  };
  const cv = "base64-" + Buffer.from(JSON.stringify(payload)).toString("base64url");
  return { id: u.id, email, cookie: cv };
}

const A = await makeUser();
const B = await makeUser();

// Debug: does the server accept A's cookie outside the browser?
const probeRes = await fetch(`${site}/messages`, {
  headers: { cookie: A.cookie, redirect: "manual" },
});
console.log("server-side cookie check for A:", probeRes.status, probeRes.headers.get("location") ?? "");

const convo = (await (await fetch(`${url}/rest/v1/conversations`, { method: "POST", headers: { ...h, Prefer: "return=representation" }, body: JSON.stringify({ item_type: "lost_item", item_id: "fcdbc835-ef7b-43c6-a033-e6d08efdf4d1", participant_a: A.id, participant_b: B.id }) })).json())[0];
console.log("convo:", convo.id, "A:", A.id, "B:", B.id);

const browser = await chromium.launch({
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"],
});
const mkPage = async (cookie) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.grantPermissions(["microphone", "camera"], { origin: site });
  await ctx.addCookies([{ name: `sb-${ref}-auth-token`, value: cookie, url: site }]);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("PAGE-ERR:", String(e).slice(0, 200)));
  page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE-ERR:", m.text().slice(0, 300)); });
  return page;
};
const pa = await mkPage(A.cookie);
const pb = await mkPage(B.cookie);

async function openThread(page, label) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    await page.goto(`${site}/messages/${convo.id}`, { waitUntil: "domcontentloaded" });
    try {
      await page.waitForSelector('[aria-label="Record a voice message"]', { timeout: 15000 });
      console.log(`${label} thread ready`);
      return;
    } catch {
      console.log(`${label} not ready (attempt ${attempt}), url=${page.url()}`);
      await page.waitForTimeout(3000);
    }
  }
  const t = await page.evaluate(() => document.body.innerText.slice(0, 200));
  throw new Error(`${label} thread never loaded: ${JSON.stringify(t)}`);
}
await openThread(pa, "A");
await openThread(pb, "B");

// --- 1) Voice message from A ---
await pa.click('[aria-label="Record a voice message"]');
await pa.waitForTimeout(3000);
console.log("recording bar visible:", await pa.locator('text=Recording…').count() > 0,
  "| record error:", JSON.stringify(await pa.locator('[role="alert"]').allInnerTexts().catch(() => [])));
await pa.click('[aria-label="Send voice note"]');
await pa.waitForTimeout(6000);
const aHasVoice = (await pa.content()).includes("Voice") || (await pa.locator("audio").count()) > 0;
const bAudioCount = await pb.locator("audio[controls]").count();
console.log("A voice sent bubble:", aHasVoice, "| B received audio players:", bAudioCount);

// --- 2) Voice call A → B ---
await pa.click('[aria-label^="Voice call"]');
await pa.waitForTimeout(4000);
const bRinging = (await pb.content()).includes("Incoming voice call");
console.log("B sees incoming call:", bRinging);
  if (bRinging) {
  await pb.click('[aria-label="Accept call"]');
  await pa.waitForTimeout(16000);
  const aConnected = await pa.locator('[aria-label="Mute"]:not([disabled])').count();
  const bConnected = await pb.locator('[aria-label="Mute"]:not([disabled])').count();
  console.log("A connected:", aConnected > 0, "| B connected:", bConnected > 0);
  const aEnd = await pa.locator('[aria-label="End call"]').count();
  if (aEnd) {
    await pa.click('[aria-label="End call"]');
    await pa.waitForTimeout(2500);
  }
  const bAfter = await pb.locator('[aria-label="Accept call"]').count();
  console.log("call teardown ok (B back to normal):", bAfter === 0);
} else {
  console.log("!! B never saw the call");
}

await browser.close();

// cleanup
for (const u of [A, B]) {
  const convs = await (await fetch(`${url}/rest/v1/conversations?or=(participant_a.eq.${u.id},participant_b.eq.${u.id})&select=id`, { headers: h })).json();
  for (const c of convs) {
    await fetch(`${url}/rest/v1/messages?conversation_id=eq.${c.id}`, { method: "DELETE", headers: h });
    await fetch(`${url}/rest/v1/conversations?id=eq.${c.id}`, { method: "DELETE", headers: h });
  }
  await fetch(`${url}/auth/v1/admin/users/${u.id}`, { method: "DELETE", headers: h });
}
console.log("cleanup done");
