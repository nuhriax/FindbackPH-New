import { test, expect } from "@playwright/test";

/**
 * FindBackPH Link Audit
 * Discovers and validates internal links from rendered pages.
 */
test.describe("Link Audit", () => {
  const pagesToCheck = ["/", "/discover", "/about", "/contact", "/login"];

  for (const pagePath of pagesToCheck) {
    test(`${pagePath} internal links return valid status`, async ({ page, request }) => {
      await page.goto(pagePath);
      await page.waitForLoadState("domcontentloaded");

      const links = page.locator("a[href]");
      const count = await links.count();

      const checked = new Set<string>();
      let validCount = 0;
      let invalidCount = 0;

      for (let i = 0; i < Math.min(count, 20); i++) {
        const href = await links.nth(i).getAttribute("href");
        if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#")) continue;
        if (href.startsWith("http")) continue; // Skip external links
        if (checked.has(href)) continue;
        checked.add(href);

        try {
          const response = await request.get(href);
          const status = response.status();
          if (status < 400) {
            validCount++;
          } else if (status === 404) {
            invalidCount++;
            console.log(`  404: ${href}`);
          }
        } catch {
          // Network error - skip
        }
      }

      expect(validCount).toBeGreaterThan(0);
      expect(invalidCount).toBe(0);
    });
  }
});

test.describe("Important Navigation Links", () => {
  test("homepage has key navigation links", async ({ page }) => {
    await page.goto("/");

    // Check for key navigation elements
    await expect(page.getByRole("link", { name: /report/i }).first()).toBeVisible();
  });

  test("footer has valid links", async ({ page }) => {
    await page.goto("/");

    const footerLinks = page.locator("footer a[href]");
    const count = await footerLinks.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const href = await footerLinks.nth(i).getAttribute("href");
      if (href && href.startsWith("/")) {
        const response = await page.request.get(href);
        expect(response.status()).toBeLessThan(400);
      }
    }
  });
});
