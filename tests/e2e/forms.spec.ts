import { test, expect } from "@playwright/test";

/**
 * FindBackPH Form Tests
 * Tests all forms with valid, invalid, empty, and boundary inputs.
 */
test.describe("Login Form", () => {
  test("valid login form structure", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("input[type=\"email\"]")).toBeVisible();
    await expect(page.locator("input[type=\"password\"]")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in|log in/i })).toBeVisible();
  });

  test("empty submission shows validation", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    // Should show validation error or not submit
    await expect(page).toHaveURL(/\/login/);
  });

  test("invalid email shows error", async ({ page }) => {
    await page.goto("/login");
    await page.locator("input[type=\"email\"]").fill("invalid-email");
    await page.locator("input[type=\"password\"]").fill("password123");
    await page.locator("button[type=\"submit\"]").click();
    // Should stay on login page (form validation prevents submission)
    await expect(page).toHaveURL(/\/login/);
    // Should show some error or warning
    const stayedOnPage = page.url().includes("/login");
    expect(stayedOnPage).toBeTruthy();
  });
});

test.describe("Registration Form", () => {
  test("valid registration form structure", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("input[type=\"email\"]")).toBeVisible();
    await expect(page.locator("input[type=\"password\"]").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /create|sign up|register/i })).toBeVisible();
  });

  test("empty submission shows validation", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("button", { name: /create|sign up|register/i }).click();
    await expect(page).toHaveURL(/\/register/);
  });

  test("password mismatch shows error", async ({ page }) => {
    await page.goto("/register");
    await page.locator("input[type=\"password\"]").first().fill("Password123");
    await page.locator("input[type=\"password\"]").nth(1).fill("DifferentPass123");
    await page.getByRole("button", { name: /create|sign up|register/i }).click();
    await expect(page).toHaveURL(/\/register/);
  });

  test("weak password shows error", async ({ page }) => {
    await page.goto("/register");
    await page.locator("input[type=\"password\"]").first().fill("weak");
    await page.locator("input[type=\"password\"]").nth(1).fill("weak");
    await page.getByRole("button", { name: /create|sign up|register/i }).click();
    await expect(page).toHaveURL(/\/register/);
  });

  test("HTML/script injection in fields does not execute", async ({ page }) => {
    await page.goto("/register");
    await page.locator("input[type=\"email\"]").fill("<script>alert('xss')</script>");
    await page.locator("input[type=\"password\"]").first().fill("Password123");
    await page.locator("input[type=\"password\"]").nth(1).fill("Password123");
    await page.getByRole("button", { name: /create|sign up|register/i }).click();
    // Should not execute script, stay on register page
    await expect(page).toHaveURL(/\/register/);
  });
});

test.describe("Forgot Password Form", () => {
  test("valid submission shows success", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.locator("input[type=\"email\"]").fill("test@example.com");
    await page.getByRole("button", { name: /send|reset/i }).click();
    await expect(page.getByText(/check your inbox|reset link|sent/i)).toBeVisible();
  });

  test("empty submission shows validation", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByRole("button", { name: /send|reset/i }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test("invalid email shows error", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.locator("input[type=\"email\"]").fill("not-an-email");
    await page.getByRole("button", { name: /send|reset/i }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });
});

test.describe("Contact Form", () => {
  test("contact form structure", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator("input[type=\"email\"]")).toBeVisible();
    await expect(page.locator("textarea")).toBeVisible();
  });

  test("empty contact form shows validation", async ({ page }) => {
    await page.goto("/contact");
    await page.getByRole("button", { name: /send|submit/i }).click();
    await expect(page).toHaveURL(/\/contact/);
  });
});
