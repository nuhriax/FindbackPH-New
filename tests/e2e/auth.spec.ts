import { test, expect } from "@playwright/test";

/**
 * FindBackPH Authentication Tests
 * Verifies auth flows work correctly.
 */
test.describe("Authentication", () => {
  test("login page has email and password fields", async ({ page }) => {
    await page.goto("/login");
    // Auth fields use custom components, find by input type
    await expect(page.locator("input[type=\"email\"]")).toBeVisible();
    await expect(page.locator("input[type=\"password\"]")).toBeVisible();
  });

  test("register page has required fields", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("input[type=\"email\"]")).toBeVisible();
    // Register has password AND confirm password fields
    await expect(page.locator("input[type=\"password\"]").first()).toBeVisible();
  });

  test("protected route redirects to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("admin route redirects anonymous user", async ({ page }) => {
    await page.goto("/admin");
    // Should redirect to login or dashboard
    await expect(page).not.toHaveURL(/\/admin/);
  });

  test("forgot password shows success message", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.locator("input[type=\"email\"]").fill("test@example.com");
    await page.getByRole("button", { name: /send|reset/i }).click();
    await expect(page.getByText(/check your inbox|reset link/i)).toBeVisible();
  });
});
