import { expect, test } from "@playwright/test";

test("constellation selection during timelapse playback smoothly flies and centers on the constellation above horizon", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("http://localhost:4010/");
  const canvas = page.getByTestId("star-sea-canvas");
  await expect(canvas).toHaveClass(/is-ready/, { timeout: 30_000 });

  // 1. Start continuous diurnal timelapse playback
  const playButton = page.locator('button[title*="开启时间流转"], button[title*="暂停流转"]').first();
  await playButton.click();

  // Verify timelapse indicator is active
  await expect(page.locator("text=恒星日流转")).toBeVisible();

  // Let timelapse play for a bit so time advances
  await page.waitForTimeout(1200);

  // 2. Select Cygnus (天鹅座) from the dropdown during active playback
  const constellationSelect = page.locator('select[aria-label="选择星宿天区"]');
  await constellationSelect.selectOption("cygnus");

  // Verify UI reflects the selection
  await expect(page.locator("text=已对准【天鹅座")).toBeVisible();

  // Wait for 1.2s camera fly-to animation to complete
  await page.waitForTimeout(1500);

  // Check camera pitch & yaw from debug handle
  const cygnusView = await page.evaluate(() => {
    const debug = (window as unknown as { __debug?: { view: { current: { yaw: number; pitch: number } } } }).__debug;
    return debug ? debug.view.current : null;
  });

  expect(cygnusView).not.toBeNull();
  if (cygnusView) {
    // Pitch should be high in the sky (between 0.4 rad and 1.3 rad), definitely above horizon (0.22+)
    expect(cygnusView.pitch).toBeGreaterThan(0.5);
    expect(cygnusView.pitch).toBeLessThanOrEqual(1.26);
  }

  const cygnusScreenshotPath = testInfo.outputPath("cygnus_centered_in_playback.png");
  await page.screenshot({ path: cygnusScreenshotPath });
  await testInfo.attach("cygnus_playback", { path: cygnusScreenshotPath, contentType: "image/png" });

  // 3. Now select Orion (猎户座) while playback is still active
  await constellationSelect.selectOption("orion");
  await expect(page.locator("text=已对准【猎户座")).toBeVisible();

  await page.waitForTimeout(1500);

  const orionView = await page.evaluate(() => {
    const debug = (window as unknown as { __debug?: { view: { current: { yaw: number; pitch: number } } } }).__debug;
    return debug ? debug.view.current : null;
  });

  expect(orionView).not.toBeNull();
  if (orionView) {
    // Pitch should be high in the sky for Orion (~61.5° = ~1.07 rad)
    expect(orionView.pitch).toBeGreaterThan(0.5);
    expect(orionView.pitch).toBeLessThanOrEqual(1.26);
    // Yaw should have changed significantly from Cygnus
    if (cygnusView) {
      expect(Math.abs(orionView.yaw - cygnusView.yaw)).toBeGreaterThan(0.2);
    }
  }

  const orionScreenshotPath = testInfo.outputPath("orion_centered_in_playback.png");
  await page.screenshot({ path: orionScreenshotPath });
  await testInfo.attach("orion_playback", { path: orionScreenshotPath, contentType: "image/png" });

  // 4. Test Southern Hemisphere constellation: Crux (南十字座)
  await constellationSelect.selectOption("crux");
  await expect(page.locator("text=已对准【南十字座")).toBeVisible();

  await page.waitForTimeout(1500);

  const cruxView = await page.evaluate(() => {
    const debug = (window as unknown as { __debug?: { view: { current: { yaw: number; pitch: number } } } }).__debug;
    return debug ? debug.view.current : null;
  });

  expect(cruxView).not.toBeNull();
  if (cruxView) {
    expect(cruxView.pitch).toBeGreaterThan(0.5);
    expect(cruxView.pitch).toBeLessThanOrEqual(1.26);
  }

  const cruxScreenshotPath = testInfo.outputPath("crux_centered_in_playback.png");
  await page.screenshot({ path: cruxScreenshotPath });
  await testInfo.attach("crux_playback", { path: cruxScreenshotPath, contentType: "image/png" });

  expect(errors).toEqual([]);
});
