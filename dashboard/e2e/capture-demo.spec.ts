import { test } from "@playwright/test";
import path from "path";

/**
 * Proxygen — Demo Capture Script
 *
 * Captures screenshots and recordings for the YouTube demo video.
 * Output: DemoStudio/012_Proxygen/screenshots/ and recordings/
 *
 * Usage:
 *   cd dashboard
 *   npx playwright test e2e/capture-demo.spec.ts --project=chromium
 *
 * Prerequisites:
 *   - Dashboard running on localhost:3000 (npm run dev)
 */

const SCREENSHOT_DIR = path.resolve(
  __dirname,
  "../../../../DemoStudio/012_Proxygen/screenshots"
);
const RECORDING_DIR = path.resolve(
  __dirname,
  "../../../../DemoStudio/012_Proxygen/recordings"
);

const VIEWPORT = { width: 1920, height: 1080 };

test.use({
  viewport: VIEWPORT,
  video: { mode: "on", size: VIEWPORT },
  launchOptions: { slowMo: 300 },
});

test.describe("Proxygen — Demo Capture", () => {
  test.beforeEach(async ({}, testInfo) => {
    test.setTimeout(120000);
    if (testInfo.project.name !== "chromium") {
      test.skip();
    }
  });

  test("01 — Dashboard overview (viewport)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "01-dashboard.png"),
      fullPage: false,
    });
  });

  test("02 — Dashboard full page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "02-dashboard-full.png"),
      fullPage: true,
    });
  });

  test("03 — Source health grid", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // Scroll to source health section
    const sourceSection = page.locator("[class*=source], [class*=Source], [class*=health], [class*=Health]");
    if (await sourceSection.first().isVisible()) {
      await sourceSection.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "03-source-health.png"),
      fullPage: false,
    });
  });

  test("04 — Economics panel", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // Scroll to economics section
    const econ = page.locator("[class*=econom], [class*=Econom], [class*=revenue], [class*=Revenue]");
    if (await econ.first().isVisible()) {
      await econ.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "04-economics.png"),
      fullPage: false,
    });
  });

  test("05 — Feed detail cards", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // Scroll to feed cards
    const feeds = page.locator(".glass-card");
    const feedCount = await feeds.count();
    if (feedCount > 0) {
      await feeds.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      
      // Hover over first few feed cards
      for (let i = 0; i < Math.min(feedCount, 3); i++) {
        const feed = feeds.nth(i);
        if (await feed.isVisible()) {
          await feed.hover();
          await page.waitForTimeout(500);
        }
      }
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "05-feed-cards.png"),
      fullPage: false,
    });
  });

  test("06 — Kimchi premium signal", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // Look for premium/signal indicators
    const premium = page.locator("[class*=premium], [class*=Premium], [class*=signal], [class*=Signal], [class*=kimchi], [class*=Kimchi]");
    if (await premium.first().isVisible()) {
      await premium.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "06-kimchi-premium.png"),
      fullPage: false,
    });
  });

  test("07 — Video walkthrough recording", async ({ page }) => {
    // Main dashboard
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(4000);

    // Slow scroll through entire dashboard
    await page.evaluate(async () => {
      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
      for (let i = 0; i < document.body.scrollHeight; i += 5) {
        window.scrollBy(0, 5);
        await delay(3);
      }
    });
    await page.waitForTimeout(2000);

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    // Hover over each major section
    const sections = page.locator("section, [class*=section], [class*=Section]");
    const sectionCount = await sections.count();
    for (let i = 0; i < Math.min(sectionCount, 6); i++) {
      const section = sections.nth(i);
      if (await section.isVisible()) {
        await section.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1500);
        await section.hover();
        await page.waitForTimeout(800);
      }
    }

    // Hover over interactive cards
    const cards = page.locator(".glass-card");
    const cardCount = await cards.count();
    for (let i = 0; i < Math.min(cardCount, 5); i++) {
      const card = cards.nth(i);
      if (await card.isVisible()) {
        await card.hover();
        await page.waitForTimeout(600);
      }
    }

    await page.waitForTimeout(2000);
  });
});
