import { test, expect } from "@playwright/test";

/**
 * FindBackPH Console Error & Navigation Tests
 * Verifies no unexpected console errors and navigation works.
 */
test.describe("Console Errors", () => {
  test("homepage has no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });
    page.on("pageerror", (err) => {
      errors.push(err.message);
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(errors).toEqual([]);
  });

  test("search page has no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });
    page.on("pageerror", (err) => {
      errors.push(err.message);
    });
    await page.goto("/search");
    await page.waitForLoadState("networkidle");
    expect(errors).toEqual([]);
  });

  test("login page has no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });
    page.on("pageerror", (err) => {
      errors.push(err.message);
    });
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    expect(errors).toEqual([]);
  });
});

/**
 * Navigation link tests
 */
test.describe("Navigation Links", () => {
  test("homepage links are valid", async ({ page }) => {
    await page.goto("/");
    const links = page.locator("a[href]");
    const count = await links.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 10); i++) {
      const href = await links.nth(i).getAttribute("href");
      if (href && href.startsWith("/")) {
        const response = await page.request.get(href);
        expect(response.status()).toBeLessThan(400);
      }
    }
  });

  test("footer links are valid", async ({ page }) => {
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
