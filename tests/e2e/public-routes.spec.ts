import { test, expect } from "@playwright/test";

/**
 * FindBackPH Public Route Tests
 * Verifies all public routes load correctly without errors.
 */
test.describe("Public Routes", () => {
  test("homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/FindBack PH/);
    // Check the main content area loads (use the content main, not the page main)
    await expect(page.locator("#main-content")).toBeVisible();
  });

  test("search page loads", async ({ page }) => {
    await page.goto("/search");
    await expect(page).toHaveTitle(/Search/);
  });

  test("lost items page loads", async ({ page }) => {
    await page.goto("/lost");
    await expect(page).toHaveTitle(/Lost/);
  });

  test("found items page loads", async ({ page }) => {
    await page.goto("/found");
    await expect(page).toHaveTitle(/Found/);
  });

  test("discover page loads", async ({ page }) => {
    await page.goto("/discover");
    await expect(page).toHaveTitle(/Discover/);
  });

  test("about page loads", async ({ page }) => {
    await page.goto("/about");
    await expect(page).toHaveTitle(/About/);
  });

  test("safety page loads", async ({ page }) => {
    await page.goto("/safety");
    await expect(page).toHaveTitle(/Safety/);
  });

  test("how-it-works page loads", async ({ page }) => {
    await page.goto("/how-it-works");
    await expect(page).toHaveTitle(/How/);
  });

  test("faq page loads", async ({ page }) => {
    await page.goto("/faq");
    await expect(page).toHaveTitle(/FAQ/);
  });

  test("contact page loads", async ({ page }) => {
    await page.goto("/contact");
    // Contact page uses default title
    await expect(page.getByRole("heading", { name: /Contact|Support|Get in touch/i })).toBeVisible();
  });

  test("privacy page loads", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page).toHaveTitle(/Privacy/);
  });

  test("terms page loads", async ({ page }) => {
    await page.goto("/terms");
    await expect(page).toHaveTitle(/Terms/);
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    // Login page uses default title or auth layout
    await expect(page.getByRole("heading", { name: /Welcome Back|Sign In|Log In/i })).toBeVisible();
  });

  test("register page loads", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /Create|Sign Up|Register/i })).toBeVisible();
  });

  test("forgot-password page loads", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: /Forgot|Password|Reset/i })).toBeVisible();
  });
});

/**
 * Redirect route tests
 */
test.describe("Redirect Routes", () => {
  test("/explore redirects to /discover", async ({ page }) => {
    await page.goto("/explore");
    await expect(page).toHaveURL(/\/discover/);
  });

  test("/finds redirects to /discover", async ({ page }) => {
    await page.goto("/finds");
    await expect(page).toHaveURL(/\/discover/);
  });

  test("/saved redirects to /dashboard/saved (requires auth)", async ({ page }) => {
    await page.goto("/saved");
    // Should redirect to login since /dashboard/saved requires auth
    await expect(page).toHaveURL(/\/login/);
  });
});
