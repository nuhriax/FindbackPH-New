import { test, expect } from "@playwright/test";

/**
 * Contact page responsive fix verification
 */
test.describe("Contact Page Responsive Fix", () => {
  const viewports = [
    { name: "360px", width: 360, height: 800 },
    { name: "375px", width: 375, height: 812 },
    { name: "390px", width: 390, height: 844 },
    { name: "414px", width: 414, height: 896 },
    { name: "430px", width: 430, height: 932 },
    { name: "768px", width: 768, height: 1024 },
    { name: "1024px", width: 1024, height: 1366 },
    { name: "1440px", width: 1440, height: 900 },
    { name: "1920px", width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    test(`contact page at ${viewport.name} - no horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/contact");
      await page.waitForLoadState("domcontentloaded");

      // Check no horizontal overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
      });
      expect(hasHorizontalScroll).toBeFalsy();
    });
  }
});
