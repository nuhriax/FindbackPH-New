// Verify image messaging: A sends a photo → B sees it rendered, no duplicates.
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium } from "playwright";

// Build a colorful test PNG (no deps — minimal encoder via canvas is unavailable
// in node, so embed a tiny valid PNG base64 instead).
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAJUlEQVR4nGP8z8Dwn4GKgImaho0aOGrgqIGjBo4aOGrgqIEDaSAAoQwDEZ0eD8oAAAAASUVORK5CYII=",
  "base64"
);
const imgPath = path.join(tmpdir(), `chat-test-${Date.now()}.png`);
writeFileSync(imgPath, png);

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
  return { id: u.id, cookie: "base64-" + Buffer.from(JSON.stringify(payload)).toString("base64url" ) };
}

const A = await makeUser();
const B = await makeUser();
const convo = (await (await fetch(`${url}/rest/v1/conversations`, { method: "POST", headers: { ...h, Prefer: "return=representation" }, body: JSON.stringify({ item_type: "lost_item", item_id: "fcdbc835-ef7b-43c6-a033-e6d08efdf4d1", participant_a: A.id, participant_b: B.id }) })).json())[0];
console.log("convo:", convo.id);

const browser = await chromium.launch();
const mkPage = async (cookie, label) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
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
await pa.waitForSelector('[aria-label="Send an image"]', { timeout: 20000 });

// A picks the test image via the (hidden) gallery input
await pa.setInputFiles('input[type="file"][accept="image/*"]', imgPath);
await pa.waitForTimeout(7000);

const aImgs = await pa.locator('img[alt="Shared photo"]').count();
console.log("A image bubbles:", aImgs, "(expect 1 — optimistic replaced, no dup)");
const src = await pa.locator('img[alt="Shared photo"]').first().getAttribute("src");
console.log("image src:", src);
const resp = await fetch(src);
console.log("image fetch:", resp.status, resp.headers.get("content-type"));

// B should see it live via realtime
await pb.waitForTimeout(3000);
const bImgs = await pb.locator('img[alt="Shared photo"]').count();
console.log("B image bubbles:", bImgs, "(expect 1)");
const bLoaded = await pb.locator('img[alt="Shared photo"]').first().evaluate((el) => el.complete && el.naturalWidth > 0).catch(() => false);
console.log("B image actually decoded:", bLoaded);

const pass = aImgs === 1 && bImgs === 1 && resp.ok && bLoaded;
console.log(pass ? "PASS ✓ image messaging works" : "FAIL ✗");
await browser.close();
process.exit(pass ? 0 : 1);
