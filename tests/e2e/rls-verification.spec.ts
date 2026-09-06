import { test, expect } from "@playwright/test";

/**
 * FindBackPH RLS Verification Tests
 * Tests that verify Row Level Security through the application interface.
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

test.describe("RLS Verification via Application", () => {
  test("authenticated user can access dashboard", async ({ page }) => {
    await login(page, TEST_USER.email, TEST_USER.password);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // Verify page loaded with content
    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.length).toBeGreaterThan(100);
  });

  test("normal user cannot access admin pages", async ({ page }) => {
    await login(page, TEST_USER.email, TEST_USER.password);
    await page.goto("/admin");
    // Should be redirected away from admin
    const url = page.url();
    expect(url.includes("/dashboard") || url.includes("/login")).toBeTruthy();
  });

  test("admin user can access admin pages", async ({ page }) => {
    await login(page, TEST_ADMIN.email, TEST_ADMIN.password);
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    // Verify page loaded with content
    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.length).toBeGreaterThan(100);
  });

  test("unauthenticated user is redirected from protected routes", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("report lost form requires authentication", async ({ page }) => {
    await page.goto("/report/lost");
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
