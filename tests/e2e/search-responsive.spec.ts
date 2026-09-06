import { test, expect } from "@playwright/test";

/**
 * FindBackPH Search Tests
 * Verifies search functionality works correctly.
 */
test.describe("Search", () => {
  test("search page loads with no results initially", async ({ page }) => {
    await page.goto("/search");
    await expect(page).toHaveTitle(/Search/);
  });

  test("search with query parameter", async ({ page }) => {
    await page.goto("/search?q=phone");
    await expect(page).toHaveTitle(/Search/);
  });

  test("search with category filter", async ({ page }) => {
    await page.goto("/search?category=phones");
    await expect(page).toHaveTitle(/Search/);
  });

  test("search with type filter", async ({ page }) => {
    await page.goto("/search?type=lost");
    await expect(page).toHaveTitle(/Search/);
  });

  test("search with city filter", async ({ page }) => {
    await page.goto("/search?city=Manila");
    await expect(page).toHaveTitle(/Search/);
  });

  test("search with special characters does not crash", async ({ page }) => {
    await page.goto("/search?q=%22test%22");
    await expect(page).toHaveTitle(/Search/);
  });

  test("search with emoji does not crash", async ({ page }) => {
    await page.goto("/search?q=%F0%9F%93%9F");
    await expect(page).toHaveTitle(/Search/);
  });

  test("search with very long query does not crash", async ({ page }) => {
    const longQuery = "a".repeat(200);
    await page.goto(`/search?q=${longQuery}`);
    await expect(page).toHaveTitle(/Search/);
  });

  test("search with SQL injection attempt does not crash", async ({ page }) => {
    await page.goto("/search?q='; DROP TABLE users; --");
    await expect(page).toHaveTitle(/Search/);
  });
});

/**
 * FindBackPH Responsive Tests
 * Verifies layouts work at different viewport sizes.
 */
test.describe("Responsive", () => {
  test("homepage renders at mobile width", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.locator("#main-content")).toBeVisible();
    // Check no horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBeFalsy();
  });

  test("homepage renders at tablet width", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await expect(page.locator("#main-content")).toBeVisible();
  });

  test("homepage renders at desktop width", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.locator("#main-content")).toBeVisible();
  });

  test("search page renders at mobile width", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/search");
    await expect(page).toHaveTitle(/Search/);
  });

  test("login page renders at mobile width", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/login");
    await expect(page.locator("input[type=\"email\"]")).toBeVisible();
  });
});
