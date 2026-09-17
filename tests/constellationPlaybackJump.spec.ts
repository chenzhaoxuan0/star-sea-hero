import { expect, test } from "@playwright/test";

test("diurnal timelapse is on by default and reset button appears to the left of clouds and sea without creating a new row", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  const canvas = page.getByTestId("star-sea-canvas");
  await expect(canvas).toHaveClass(/is-ready/, { timeout: 30_000 });

  // 1. Verify continuous diurnal timelapse playback is ON by default
  await expect(page.locator("text=恒星日流转")).toBeVisible();

  // Reset button should NOT be visible when no constellation is selected
  const resetBtn = page.locator('button:has-text("重置全天视角")');
  await expect(resetBtn).toBeHidden();

  // Let timelapse play for a bit
  await page.waitForTimeout(1000);

  // 2. Select Cygnus (天鹅座) from the dropdown during active playback
  const constellationSelect = page.locator('select[aria-label="选择星宿天区"]');
  await constellationSelect.selectOption("cygnus");

  // Verify UI reflects the selection
  await expect(page.locator("text=已对准【天鹅座")).toBeVisible();

  // 3. Verify the "重置全天视角" button appears on the top header row
  await expect(resetBtn).toBeVisible();

  // Verify it is positioned to the left of the Clouds toggle button
  const resetBox = await resetBtn.boundingBox();
  const cloudBtn = page.locator('button[title*="调整天幕云雾"]');
  const cloudBox = await cloudBtn.boundingBox();
  expect(resetBox).not.toBeNull();
  expect(cloudBox).not.toBeNull();
  if (resetBox && cloudBox) {
    // resetBtn should be to the left of cloudBtn
    expect(resetBox.x).toBeLessThan(cloudBox.x);
  }

  // Wait for 1.2s camera fly-to animation to complete
  await page.waitForTimeout(1500);

  // Check camera pitch & yaw from debug handle
  const cygnusView = await page.evaluate(() => {
    const debug = (window as unknown as { __debug?: { view: { current: { yaw: number; pitch: number } } } }).__debug;
    return debug ? debug.view.current : null;
  });

  expect(cygnusView).not.toBeNull();
  if (cygnusView) {
    expect(cygnusView.pitch).toBeGreaterThan(0.5);
    expect(cygnusView.pitch).toBeLessThanOrEqual(1.26);
  }

  const cygnusScreenshotPath = testInfo.outputPath("cygnus_header_reset.png");
  await page.screenshot({ path: cygnusScreenshotPath });
  await testInfo.attach("cygnus_header_reset", { path: cygnusScreenshotPath, contentType: "image/png" });

  // 4. Click "重置全天视角" button
  await resetBtn.click();

  // Button should disappear after reset
  await expect(resetBtn).toBeHidden();
  await expect(page.locator("text=已对准【天鹅座")).toBeHidden();

  // Wait for fly-to back to default panorama
  await page.waitForTimeout(1500);

  const resetView = await page.evaluate(() => {
    const debug = (window as unknown as { __debug?: { view: { current: { yaw: number; pitch: number } } } }).__debug;
    return debug ? debug.view.current : null;
  });

  expect(resetView).not.toBeNull();
  if (resetView) {
    expect(resetView.pitch).toBeCloseTo(0.28, 1);
  }

  const defaultScreenshotPath = testInfo.outputPath("default_panorama_after_reset.png");
  await page.screenshot({ path: defaultScreenshotPath });
  await testInfo.attach("default_after_reset", { path: defaultScreenshotPath, contentType: "image/png" });

  expect(errors).toEqual([]);
});
