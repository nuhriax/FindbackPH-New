import { chromium } from "playwright";

const b = await chromium.launch();
const errors = [];

function track(page, tag) {
  page.on("pageerror", (e) => errors.push(tag + " PAGEERROR: " + String(e).slice(0, 160)));
  page.on("console", (m) => m.type() === "error" && errors.push(tag + " CONSOLE: " + m.text().slice(0, 160)));
}

async function newCtx(mode, width = 1280) {
  return b.newContext({
    viewport: { width, height: 900 },
    colorScheme: mode,
  });
}

// ---- 1. Auth pages: status + screenshots (light/dark) + 320px overflow ----
const authPages = [
  ["login", "/login"],
  ["register", "/register"],
  ["forgot-password", "/forgot-password"],
  ["reset-password", "/reset-password"],
  ["complete-profile", "/complete-profile"],
];
for (const [name, path] of authPages) {
  for (const mode of ["light", "dark"]) {
    const ctx = await newCtx(mode);
    const p = await ctx.newPage();
    track(p, name + "/" + mode);
    const resp = await p.goto("http://localhost:3000" + path, { waitUntil: "networkidle" });
    const hasForm = (await p.locator("input").count()) > 0 || name === "reset-password";
    console.log(`${name} ${mode}: ${resp.status()} inputs=${await p.locator("input").count()} form=${hasForm}`);
    await p.screenshot({ path: `audit-shots/phase4-${mode}-${name}.png` });
    await ctx.close();
  }
  // 320px overflow
  const ctx = await newCtx("light", 320);
  const p = await ctx.newPage();
  await p.goto("http://localhost:3000" + path, { waitUntil: "networkidle" });
  const ow = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
  console.log(`w320 ${name}: ${ow.sw > ow.iw + 1 ? "OVERFLOW " + ow.sw : "ok"}`);
  await ctx.close();
}

// ---- 2. Gates: unauthenticated access to member/admin routes ----
const gated = [
  ["/dashboard", "login-or-403"],
  ["/dashboard/reports", "login-or-403"],
  ["/dashboard/messages", "login-or-403"],
  ["/dashboard/notifications", "login-or-403"],
  ["/dashboard/profile", "login-or-403"],
  ["/dashboard/settings", "login-or-403"],
  ["/dashboard/saved", "login-or-403"],
  ["/dashboard/reports/x/edit", "login-or-403"],
  ["/admin", "login-or-403"],
  ["/admin/users", "login-or-403"],
  ["/admin/flags", "login-or-403"],
  ["/admin/analytics", "login-or-403"],
  ["/admin/audit-logs", "login-or-403"],
  ["/admin/settings", "login-or-403"],
];
{
  const ctx = await newCtx("light");
  const p = await ctx.newPage();
  track(p, "gates");
  for (const [path] of gated) {
    const resp = await p.goto("http://localhost:3000" + path, { waitUntil: "domcontentloaded" });
    await p.waitForLoadState("networkidle").catch(() => {});
    const url = p.url();
    const status = resp?.status() ?? 0;
    const verdict = url.includes("/login") || url.includes("/register") || status === 403 || status === 404
      ? "gated ✓"
      : `NOT GATED → ${url} (${status})`;
    console.log(`gate ${path}: ${verdict}`);
  }
  await ctx.close();
}

// ---- 3. Member [id] pages with bogus id (unauth) ----
for (const path of ["/member/00000000-0000-0000-0000-000000000000", "/messages/00000000-0000-0000-0000-000000000000", "/notifications"]) {
  const ctx = await newCtx("light");
  const p = await ctx.newPage();
  track(p, "member");
  const resp = await p.goto("http://localhost:3000" + path, { waitUntil: "domcontentloaded" });
  console.log(`member ${path}: ${resp.status()} → ${p.url().replace("http://localhost:3000", "")}`);
  await ctx.close();
}

await b.close();
console.log("console errors:", errors.length ? errors.slice(0, 4).join(" || ") : "none");
