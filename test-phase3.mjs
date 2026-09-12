import { chromium } from "playwright";

const b = await chromium.launch();
const errors = [];

async function newPage(mode, width = 1440) {
  const ctx = await b.newContext({
    viewport: { width, height: 900 },
    colorScheme: mode,
    reducedMotion: "no-preference",
  });
  const p = await ctx.newPage();
  await p.addInitScript((m) => localStorage.setItem("fb-auth-theme", m), mode);
  p.on("pageerror", (e) => errors.push("PAGEERROR: " + String(e).slice(0, 200)));
  p.on("console", (m) => m.type() === "error" && errors.push("CONSOLE: " + m.text().slice(0, 200)));
  return { ctx, p };
}

// 1. Wizard review step (step 4) light + dark, both kinds
for (const kind of ["lost", "found"]) {
  for (const mode of ["light", "dark"]) {
    const { ctx, p } = await newPage(mode);
    await p.goto(`http://localhost:3000/report/${kind}`, { waitUntil: "networkidle" });
    await p.fill("#title", "Phase 3 review test item");
    await p.fill("#description", "A test item description long enough for the validator.");
    // advance to step 2, then set the required date via the "Today" chip
    const firstNext = p
      .locator("button:not([disabled])")
      .filter({ hasText: /Continue to/ })
      .last();
    await firstNext.click();
    await p.waitForTimeout(500);
    await p.locator("button:not([disabled])").filter({ hasText: /^Today$/ }).first()
      .click().catch(() => {});
    await p.selectOption("select[name=province]", { index: 1 }).catch(() => {});
    await p.waitForTimeout(700);
    await p.selectOption("select[name=city]", { index: 1 }).catch(() => {});
    await p.waitForTimeout(300);
    // walk to review: click the enabled Continue/Review buttons in WizardNav
    for (let i = 0; i < 4; i++) {
      const next = p
        .locator("button:not([disabled])")
        .filter({ hasText: /Continue to|Review report/ })
        .last();
      if (await next.count()) await next.click().catch(() => {});
      await p.waitForTimeout(400);
      if (await p.locator("button[type=submit]:has-text('Publish')").count()) break;
    }
    const onReview = (await p.locator("button[type=submit]:has-text('Publish')").count()) > 0;
    console.log(`review ${kind} ${mode}: ${onReview ? "reached step 4" : "NOT on review"}`);
    await p.screenshot({ path: `audit-shots/phase3-${mode}-review-${kind}.png` });
    if (onReview && mode === "light") {
      // 2. Publish attempt unauthenticated → error state (no data written)
      await p.check("#confirmAccurate").catch(() => {});
      await p.click("button[type=submit]:has-text('Publish')");
      await p.waitForTimeout(4000);
      const err = await p
        .locator("text=/signed in|must be|error|failed|try again|went wrong/i")
        .count();
      console.log(`publish error state (${kind}): ${err ? "shown" : "no visible error"}`);
      await p.screenshot({ path: `audit-shots/phase3-${mode}-submit-error-${kind}.png` });
    }
    await ctx.close();
  }
}

// 3. Detail route not-found behavior (no seed data available)
for (const path of ["/lost/00000000-0000-0000-0000-000000000000", "/found/00000000-0000-0000-0000-000000000000"]) {
  const { ctx, p } = await newPage("light");
  const resp = await p.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle" });
  console.log(`detail ${path.slice(0, 11)}…: HTTP ${resp.status()}`);
  await p.screenshot({ path: `audit-shots/phase3-${path.startsWith("/lost") ? "lost" : "found"}-notfound.png` });
  await ctx.close();
}

// 4. 320px review step overflow
{
  const { ctx, p } = await newPage("light", 320);
  await p.goto("http://localhost:3000/report/lost", { waitUntil: "networkidle" });
  await p.waitForTimeout(600);
  const ow = await p.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    iw: window.innerWidth,
  }));
  console.log(`w320 report/lost: ${ow.sw > ow.iw + 1 ? "OVERFLOW " + ow.sw : "ok"}`);
  await ctx.close();
}

await b.close();
console.log("console errors:", errors.length ? errors.slice(0, 3).join(" || ") : "none");
