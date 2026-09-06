import { test, expect } from "@playwright/test";

/**
 * FindBackPH Admin Route Tests
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

test.describe("Admin Routes", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ADMIN.email, TEST_ADMIN.password);
  });

  const routes = [
    "/admin",
    "/admin/users",
    "/admin/reports",
    "/admin/flags",
    "/admin/analytics",
    "/admin/settings",
    "/admin/audit-logs",
  ];

  for (const route of routes) {
    test(`${route} loads`, async ({ page }) => {
      const response = await page.goto(route);
      const status = response?.status();
      expect(status).toBeLessThan(500);
      await page.waitForLoadState("networkidle");
      const bodyText = await page.locator("body").textContent();
      expect(bodyText?.length).toBeGreaterThan(0);
    });
  }
});

test.describe("Authorization - Normal User Cannot Access Admin", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USER.email, TEST_USER.password);
  });

  const adminRoutes = [
    "/admin",
    "/admin/users",
    "/admin/reports",
    "/admin/flags",
    "/admin/analytics",
    "/admin/settings",
    "/admin/audit-logs",
  ];

  for (const route of adminRoutes) {
    test(`normal user blocked from ${route}`, async ({ page }) => {
      const response = await page.goto(route);
      const url = page.url();
      const status = response?.status();
      // Should redirect to dashboard, login, or return 404
      const isBlocked = url.includes("/dashboard") || url.includes("/login") || status === 404 || url !== `http://localhost:3000${route}`;
      expect(isBlocked).toBeTruthy();
    });
  }
});
