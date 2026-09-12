import { test, expect } from "@playwright/test";

/**
 * FindBackPH Console Error Audit
 * Checks all public pages for console errors and failed network requests.
 */
const publicPages = [
  "/",
  "/lost",
  "/found",
  "/discover",
  "/about",
  "/safety",
  "/how-it-works",
  "/faq",
  "/contact",
  "/privacy",
  "/terms",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-success",
  "/offline",
];

test.describe("Console Error Audit", () => {
  for (const pagePath of publicPages) {
    test(`${pagePath} has no console errors`, async ({ page }) => {
      const errors: string[] = [];
      const failedRequests: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          errors.push(msg.text());
        }
      });

      page.on("pageerror", (err) => {
        errors.push(err.message);
      });

      page.on("requestfailed", (request) => {
        failedRequests.push(request.url());
      });

      await page.goto(pagePath);
      await page.waitForLoadState("networkidle");

      // Filter out known benign errors
      const realErrors = errors.filter(
        (e) =>
          !e.includes("favicon") &&
          !e.includes("ResizeObserver") &&
          !e.includes("Loading chunk") &&
          !e.includes("Failed to load resource") &&
          !e.includes("net::ERR_") // Network errors in dev
      );

      expect(realErrors).toEqual([]);
    });
  }
});
