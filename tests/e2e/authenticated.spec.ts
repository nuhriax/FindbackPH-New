import { test, expect } from "@playwright/test";

/**
 * FindBackPH Authenticated Route Tests
 */

const TEST_USER = {
  email: "testuser@findbackph.test",
  password: "TestPassword123!",
};

const TEST_ADMIN = {
  email: "testadmin@findbackph.test",
  password: "AdminPassword123!",
};

async function login(page: any, email: string, password: string) {
  await page.goto("/login");
  await page.locator("input[type=\"email\"]").fill(email);
  await page.locator("input[type=\"password\"]").fill(password);
  await page.locator("button[type=\"submit\"]").click();
  await page.waitForURL(/\/dashboard|\//, { timeout: 15000 });
}

test.describe("Authenticated Routes", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USER.email, TEST_USER.password);
  });

  const routes = [
    "/dashboard",
    "/dashboard/profile",
    "/dashboard/settings",
    "/dashboard/reports",
    "/dashboard/saved",
    "/dashboard/notifications",
    "/dashboard/messages",
    "/report/lost",
    "/report/found",
  ];

  for (const route of routes) {
    test(`${route} loads`, async ({ page }) => {
      const response = await page.goto(route);
      // Page should return success or redirect (not 500)
      const status = response?.status();
      expect(status).toBeLessThan(500);
      // Wait for page to render
      await page.waitForLoadState("networkidle");
      // Check page has some visible content (body is not empty)
      const bodyText = await page.locator("body").textContent();
      expect(bodyText?.length).toBeGreaterThan(0);
    });
  }
});
