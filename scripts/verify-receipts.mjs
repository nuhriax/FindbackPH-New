// Verify read receipts: A sends → sees single ✓; B opens thread → A sees blue ✓✓.
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
  return { id: u.id, cookie: "base64-" + Buffer.from(JSON.stringify(payload)).toString("base64url") };
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
  return page;
};
const pa = await mkPage(A.cookie, "A");
const pb = await mkPage(B.cookie, "B");

// A opens the thread and sends a text message — B has NOT opened it yet.
await pa.goto(`${site}/messages/${convo.id}`, { waitUntil: "domcontentloaded" });
const box = pa.locator('textarea[aria-label^="Message"]');
await box.waitFor({ timeout: 20000 });
const body = `receipt-test-${Date.now()}`;
await box.fill(body);
await pa.locator('[aria-label="Send message"]').click();

// Poll for the single-check receipt (realtime optimistic→real replacement is timing-dependent)
await pa.locator('[aria-label="Sent"]').first().waitFor({ timeout: 20000 });
const sentChecks = await pa.locator('[aria-label="Sent"]').count();
const seenChecks = await pa.locator('[aria-label="Seen"]').count();
const bubble = await pa.locator(`text=${body}`).count();
console.log("A sent bubble rendered:", bubble > 0);
console.log("STEP 1 (B has not opened): A single-check receipts:", sentChecks, "| seen-checks:", seenChecks);

// B opens the thread → messages get marked read → A's checks should flip live.
await pb.goto(`${site}/messages/${convo.id}`, { waitUntil: "domcontentloaded" });
// Poll for the seen flip (mark_messages_read RPC + realtime UPDATE)
await pa.locator('[aria-label="Seen"]').first().waitFor({ timeout: 25000 });
await pa.screenshot({ path: "scripts/messenger-layout.png" });
// Also capture the rail + thread two-pane view at a wider viewport
await pa.setViewportSize({ width: 1440, height: 900 });
await pa.waitForTimeout(1500);
await pa.screenshot({ path: "scripts/messenger-two-pane.png" });

const seenAfter = await pa.locator('[aria-label="Seen"]').count();
const sentAfter = await pa.locator('[aria-label="Sent"]').count();
console.log("STEP 2 (B opened thread): A seen-checks (✓✓):", seenAfter, "| single-checks left:", sentAfter);

// B also should show the incoming message WITHOUT any receipt of their own.
const bReceipts = await pb.locator('[aria-label="Seen"], [aria-label="Sent"]').count();
console.log("B (receiver) receipt icons on own bubbles:", bReceipts, "(expected 0)");

const pass = sentChecks > 0 && seenChecks === 0 && seenAfter > 0 && bReceipts === 0;
console.log(pass ? "PASS ✓ receipts work end-to-end" : "FAIL ✗");
await browser.close();
process.exit(pass ? 0 : 1);
