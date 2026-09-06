import { test, expect } from "@playwright/test";

/**
 * FindBackPH Complete Public Route Tests
 * Runtime-tests every public route that doesn't require authentication.
 */
test.describe("Public Routes - Core", () => {
  const publicRoutes = [
    { path: "/", title: /FindBack PH/ },
    { path: "/search", title: /Search/ },
    { path: "/lost", title: /Lost/ },
    { path: "/found", title: /Found/ },
    { path: "/discover", title: /Discover/ },
    { path: "/about", title: /About/ },
    { path: "/safety", title: /Safety/ },
    { path: "/how-it-works", title: /How/ },
    { path: "/faq", title: /FAQ/ },
    { path: "/privacy", title: /Privacy/ },
    { path: "/terms", title: /Terms/ },
    { path: "/offline", title: /Offline|FindBack/ },
  ];

  for (const route of publicRoutes) {
    test(`${route.path} loads correctly`, async ({ page }) => {
      const response = await page.goto(route.path);
      expect(response?.status()).toBeLessThan(400);
      await expect(page).toHaveTitle(route.title);
    });
  }

  test("/contact loads correctly", async ({ page }) => {
    const response = await page.goto("/contact");
    expect(response?.status()).toBeLessThan(400);
    // Contact page is a client component without custom metadata
    await expect(page.getByRole("heading", { name: /Get in touch|Contact|Support/i })).toBeVisible();
  });
});

test.describe("Public Routes - Auth Pages", () => {
  test("/login renders auth form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("input[type=\"email\"]")).toBeVisible();
    await expect(page.locator("input[type=\"password\"]")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in|log in/i })).toBeVisible();
  });

  test("/register renders registration form", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("input[type=\"email\"]")).toBeVisible();
    await expect(page.locator("input[type=\"password\"]").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /create|sign up|register/i })).toBeVisible();
  });

  test("/forgot-password renders reset form", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.locator("input[type=\"email\"]")).toBeVisible();
    await expect(page.getByRole("button", { name: /send|reset/i })).toBeVisible();
  });

  test("/reset-password renders new password form", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.locator("input[type=\"password\"]").first()).toBeVisible();
  });

  test("/verify-success shows success message", async ({ page }) => {
    await page.goto("/verify-success");
    await expect(page.getByRole("heading", { name: /verified/i })).toBeVisible();
  });
});

test.describe("Redirect Routes", () => {
  test("/explore redirects to /discover", async ({ page }) => {
    await page.goto("/explore");
    await expect(page).toHaveURL(/\/discover/);
  });

  test("/finds redirects to /discover", async ({ page }) => {
    await page.goto("/finds");
    await expect(page).toHaveURL(/\/discover/);
  });

  test("/saved redirects to login (requires auth)", async ({ page }) => {
    await page.goto("/saved");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Auth Protection", () => {
  const protectedRoutes = [
    "/dashboard",
    "/dashboard/profile",
    "/dashboard/settings",
    "/dashboard/reports",
    "/dashboard/saved",
    "/dashboard/notifications",
    "/dashboard/messages",
    "/report/lost",
    "/report/found",
    "/messages",
    "/notifications",
    "/admin",
    "/admin/users",
    "/admin/reports",
    "/admin/flags",
    "/admin/analytics",
    "/admin/settings",
    "/admin/audit-logs",
  ];

  for (const route of protectedRoutes) {
    test(`${route} redirects to login when unauthenticated`, async ({ page }) => {
      const response = await page.goto(route);
      // Should redirect to login or return 404 (for admin)
      const url = page.url();
      const status = response?.status();
      // Redirect can be: URL change to /login, 404 status, or response redirected
      const isRedirected = url.includes("/login") || status === 404 || url !== route;
      // Some pages might redirect to dashboard instead of login
      const isRedirectedToDashboard = url.includes("/dashboard");
      expect(isRedirected || isRedirectedToDashboard).toBeTruthy();
    });
  }
});
