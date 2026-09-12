import { test, expect } from "@playwright/test";

/**
 * FindBackPH Comprehensive Responsive Tests
 * Tests layouts at multiple viewport sizes.
 */
const viewports = [
  { name: "mobile-s", width: 360, height: 800 },
  { name: "mobile-m", width: 375, height: 812 },
  { name: "mobile-l", width: 390, height: 844 },
  { name: "mobile-xl", width: 414, height: 896 },
  { name: "mobile-xxl", width: 430, height: 932 },
  { name: "tablet-s", width: 768, height: 1024 },
  { name: "tablet-m", width: 834, height: 1112 },
  { name: "tablet-l", width: 1024, height: 1366 },
  { name: "desktop-s", width: 1280, height: 800 },
  { name: "desktop-m", width: 1366, height: 768 },
  { name: "desktop-l", width: 1440, height: 900 },
  { name: "desktop-xl", width: 1920, height: 1080 },
];

const pages = [
  { path: "/", name: "homepage" },
  { path: "/discover", name: "discover" },
  { path: "/login", name: "login" },
  { path: "/register", name: "register" },
  { path: "/lost", name: "lost" },
  { path: "/found", name: "found" },
  { path: "/about", name: "about" },
  { path: "/contact", name: "contact" },
];

test.describe("Responsive Layouts", () => {
  for (const viewport of viewports) {
    for (const page of pages) {
      test(`${page.name} at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page: p }) => {
        await p.setViewportSize({ width: viewport.width, height: viewport.height });
        await p.goto(page.path);
        await p.waitForLoadState("domcontentloaded");

        // Check no horizontal overflow (allow 2px tolerance for scrollbar/subpixel rendering)
        const hasHorizontalScroll = await p.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
        });
        expect(hasHorizontalScroll).toBeFalsy();
      });
    }
  }
});
