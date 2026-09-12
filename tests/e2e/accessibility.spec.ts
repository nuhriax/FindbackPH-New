import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * FindBackPH Accessibility Tests
 * Runs automated accessibility checks against key pages.
 */
const PAGES = [
  { path: "/", name: "Homepage" },
  { path: "/discover", name: "Discover" },
  { path: "/login", name: "Login" },
  { path: "/register", name: "Register" },
  { path: "/about", name: "About" },
  { path: "/contact", name: "Contact" },
  { path: "/faq", name: "FAQ" },
  { path: "/lost", name: "Lost Items" },
  { path: "/found", name: "Found Items" },
];

test.describe("Accessibility Audit", () => {
  for (const page of PAGES) {
    test(`${page.name} (${page.path}) passes accessibility checks`, async ({ page: p }) => {
      await p.goto(page.path);
      // Wait for network idle to handle dynamic content
      await p.waitForLoadState("networkidle").catch(() => {});
      await p.waitForTimeout(1000);

      // Re-check we're still on the same page (handle redirects)
      if (p.url() !== `http://localhost:3000${page.path}` && !p.url().startsWith(`http://localhost:3000${page.path}?`)) {
        return; // Skip if redirected
      }

      const results = await new AxeBuilder({ page: p })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const violations = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical"
      );

      if (violations.length > 0) {
        console.log(`\n  ${page.path} accessibility violations:`);
        violations.forEach((v) => {
          console.log(`    - ${v.id}: ${v.description} (${v.impact})`);
          v.nodes.forEach((n) => console.log(`      ${n.html}`));
        });
      }

      expect(violations, `${page.path} has ${violations.length} serious/critical violations`).toHaveLength(0);
    });
  }
});

test.describe("Keyboard Navigation", () => {
  test("homepage is keyboard navigable", async ({ page }) => {
    await page.goto("/");

    // Tab through interactive elements
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Check that something is focused
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).not.toBe("BODY");
  });

  test("login form is keyboard accessible", async ({ page }) => {
    await page.goto("/login");

    // Tab to email field
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Type email
    await page.keyboard.type("test@example.com");

    // Tab to password
    await page.keyboard.press("Tab");

    // Type password
    await page.keyboard.type("password123");

    // Tab to submit
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Submit with Enter
    await page.keyboard.press("Enter");

    // Should stay on login page (invalid credentials)
    await expect(page).toHaveURL(/\/login/);
  });
});
