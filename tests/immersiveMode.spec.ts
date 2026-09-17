import { expect, test } from "@playwright/test";

test("center title toggle button hides and restores center title text", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  const canvas = page.getByTestId("star-sea-canvas");
  await expect(canvas).toHaveClass(/is-ready/, { timeout: 30_000 });

  // Verify center title is visible initially
  const centerTitle = page.locator("#star-sea-title");
  await expect(centerTitle).toBeVisible();
  await expect(page.locator("text=仰望浩瀚星穹")).toBeVisible();
  await expect(page.locator("text=Celestial Atlas & Ocean Mirror")).toBeVisible();

  // Find the toggle button
  const toggleTitleBtn = page.locator('button:has-text("隐藏标题")');
  await expect(toggleTitleBtn).toBeVisible();

  // 1. Click "隐藏标题" to hide the center text
  await toggleTitleBtn.click();

  // Button text changes to "显示标题"
  const showTitleBtn = page.locator('button:has-text("显示标题")');
  await expect(showTitleBtn).toBeVisible();

  // Center title block becomes hidden / opacity-0
  const centerTitleContainer = centerTitle.locator("..");
  await expect(centerTitleContainer).toHaveClass(/opacity-0/);

  // Four corners and bottom dock remain visible
  await expect(page.locator("text=Star Sea / WebGL 3D")).toBeVisible();
  await expect(page.locator("text=Celestial Horizon")).toBeVisible();
  await expect(page.locator(".star-sea-panel")).toBeVisible();

  // Wait for fade transition to finish
  await page.waitForTimeout(600);
  const titleHiddenScreenshot = testInfo.outputPath("center_title_hidden.png");
  await page.screenshot({ path: titleHiddenScreenshot });
  await testInfo.attach("center_title_hidden", { path: titleHiddenScreenshot, contentType: "image/png" });

  // 2. Click "显示标题" to restore the center text
  await showTitleBtn.click();
  await expect(toggleTitleBtn).toBeVisible();
  await expect(centerTitleContainer).toHaveClass(/opacity-100/);
  await expect(centerTitle).toBeVisible();

  expect(errors).toEqual([]);
});

test("immersive mode button completely hides all UI and restores after 3 clicks on canvas", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  const canvas = page.getByTestId("star-sea-canvas");
  await expect(canvas).toHaveClass(/is-ready/, { timeout: 30_000 });

  // Locate the immersive mode button
  const immersiveBtn = page.locator('button:has-text("沉浸模式")');
  await expect(immersiveBtn).toBeVisible();
  await expect(immersiveBtn).toHaveText("沉浸模式");

  // Verify button title attribute
  const titleAttr = await immersiveBtn.getAttribute("title");
  expect(titleAttr).toContain("沉浸式观看星辰大海");

  // 1. Enter Immersive Mode
  await immersiveBtn.click();

  // Guidance toast notice should be displayed
  const toast = page.locator('aside[role="status"]');
  await expect(toast).toBeVisible();
  await expect(toast).toContainText("连续点击画面 3 次重现界面");

  // Bottom dock panel should fade out (opacity-0)
  const panel = page.locator(".star-sea-panel");
  await expect(panel).toHaveClass(/opacity-0/);

  // Corner texts overlay should fade out (opacity-0)
  const overlay = page.locator("text=Star Sea / WebGL 3D").locator("../..");
  await expect(overlay).toHaveClass(/opacity-0/);

  // Wait for 500ms fade transition to complete
  await page.waitForTimeout(600);
  const immersiveScreenshot = testInfo.outputPath("immersive_mode_active.png");
  await page.screenshot({ path: immersiveScreenshot });
  await testInfo.attach("immersive_mode_active", { path: immersiveScreenshot, contentType: "image/png" });

  // 2. Perform 3 clicks on the screen to restore the UI
  // Tap 1
  await canvas.click({ position: { x: 300, y: 300 } });
  await page.waitForTimeout(100);

  // Tap 2
  await canvas.click({ position: { x: 320, y: 310 } });
  await page.waitForTimeout(100);

  // Tap 3
  await canvas.click({ position: { x: 310, y: 320 } });

  // 3. UI should now be fully restored!
  await expect(panel).toHaveClass(/opacity-100/);
  await expect(overlay).toHaveClass(/opacity-100/);
  await expect(panel).toBeVisible();
  await expect(page.locator("text=Star Sea / WebGL 3D")).toBeVisible();
  await expect(page.locator("#star-sea-title")).toBeVisible();

  const restoredScreenshot = testInfo.outputPath("ui_restored_after_triple_click.png");
  await page.screenshot({ path: restoredScreenshot });
  await testInfo.attach("ui_restored_after_triple_click", { path: restoredScreenshot, contentType: "image/png" });

  expect(errors).toEqual([]);
});
