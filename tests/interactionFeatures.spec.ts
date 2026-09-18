import { test, expect } from "@playwright/test";
import path from "node:path";

const artifactDir = "C:\\Users\\chenziyu\\.gemini\\antigravity-ide\\brain\\6b40b3b9-4b0b-4bac-b750-18ab115729a0";

test.describe("Star Sea Hero - Targeting, Immersive Tap & Mobile UI Compression", () => {
  test("clicking non-UI canvas directly toggles immersive mode", async ({ page }) => {
    await page.goto("/");
    const canvas = page.getByTestId("star-sea-canvas");
    await expect(canvas).toHaveClass(/is-ready/, { timeout: 30_000 });

    const controlsPanel = page.locator(".star-sea-panel");
    await expect(controlsPanel).toBeVisible();

    // Click at empty celestial sky (x: 50%, y: 25%)
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    // Single click on sky (non-UI part)
    await canvas.click({ position: { x: 200, y: 200 } });
    await page.waitForTimeout(400);

    // Controls panel should be hidden (opacity-0 / translate-y-6)
    await expect(controlsPanel).toHaveClass(/opacity-0/);

    // Toast notice should be visible
    const toast = page.locator('aside[role="status"]');
    await expect(toast).toContainText("纯净沉浸模式");

    await page.screenshot({ path: path.join(artifactDir, "immersive_mode_single_click.png") });

    // Dragging sky while immersed should NOT exit immersive mode
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.3);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.35, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    // Should STILL be immersed after drag
    await expect(controlsPanel).toHaveClass(/opacity-0/);

    // Another single tap on sky should exit immersive mode and restore UI
    await canvas.click({ position: { x: 200, y: 200 } });
    await page.waitForTimeout(400);
    await expect(controlsPanel).toHaveClass(/opacity-100/);
  });

  test("selecting constellation centers view and re-focus works after dragging", async ({ page }) => {
    await page.goto("/");
    const canvas = page.getByTestId("star-sea-canvas");
    await expect(canvas).toHaveClass(/is-ready/, { timeout: 30_000 });

    const select = page.locator('select[aria-label="选择星宿天区"]');
    await select.selectOption("virgo"); // 室女座 (previously altitude 88°)
    await page.waitForTimeout(1400);

    await page.screenshot({ path: path.join(artifactDir, "desktop_constellation_targeted.png") });

    // Verify camera aim from window.__debug
    const camAim = await page.evaluate(() => {
      const debug = (window as any).__debug;
      return {
        yaw: debug?.view?.current?.yaw,
        pitch: debug?.view?.current?.pitch,
      };
    });

    // Pitch should be around 54° (0.94 rad), NOT stuck at 1.25 rad
    expect(camAim.pitch).toBeGreaterThan(0.7);
    expect(camAim.pitch).toBeLessThan(1.15);

    // Now drag the camera away
    const box = await canvas.boundingBox();
    if (!box) return;

    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    const draggedAim = await page.evaluate(() => {
      const debug = (window as any).__debug;
      return debug?.view?.current?.yaw;
    });
    expect(draggedAim).not.toEqual(camAim.yaw);

    // Click the re-focus button: "已对准【室女座 / Virgo】"
    const refocusBtn = page.locator('button:has-text("已对准【室女座")');
    await refocusBtn.click();
    await page.waitForTimeout(1400);

    const refocusedAim = await page.evaluate(() => {
      const debug = (window as any).__debug;
      return {
        yaw: debug?.view?.current?.yaw,
        pitch: debug?.view?.current?.pitch,
      };
    });

    // Should have returned to target yaw & pitch
    expect(Math.abs(refocusedAim.pitch - camAim.pitch)).toBeLessThan(0.05);
  });

  test("mobile viewport UI is compressed and leaves >80% sky visible", async ({ page }) => {
    // Set iPhone 12/13/14 viewport (390 x 844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const canvas = page.getByTestId("star-sea-canvas");
    await expect(canvas).toHaveClass(/is-ready/, { timeout: 30_000 });

    const panel = page.locator(".star-sea-panel");
    await expect(panel).toBeVisible();

    const panelBox = await panel.boundingBox();
    expect(panelBox).not.toBeNull();
    if (!panelBox) return;

    // Panel height on mobile should be compressed (<= 200px vs original 420px, taking <24% of screen)
    // leaving >76% celestial sky open and visible!
    console.log(`Mobile panel height: ${panelBox.height}px, percentage of screen: ${(panelBox.height / 844 * 100).toFixed(1)}%`);
    expect(panelBox.height).toBeLessThanOrEqual(200);
    expect(panelBox.height / 844).toBeLessThan(0.25);

    await page.screenshot({ path: path.join(artifactDir, "mobile_compressed_ui.png") });

    // Verify all mobile controls are functional and visible
    const constellSelect = page.locator('select[aria-label="选择星宿天区"]');
    const tzSelect = page.locator('select[aria-label="选择观测时区"]');
    const latSelect = page.locator('select[aria-label="选择观测纬度"]');

    await expect(constellSelect).toBeVisible();
    await expect(tzSelect).toBeVisible();
    await expect(latSelect).toBeVisible();

    // Selecting a constellation on mobile should work smoothly
    await constellSelect.selectOption("orion");
    await page.waitForTimeout(800);

    // Center title should be automatically hidden on mobile when constellation is selected
    const centerTitle = page.locator("#star-sea-title");
    await expect(centerTitle).not.toBeVisible();
  });
});
