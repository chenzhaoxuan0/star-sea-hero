import { expect, test } from "@playwright/test";

test("renders the star sea shell without waiting for WebGL", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "星辰大海" })).toBeVisible();
  await expect(page.locator('[data-testid="star-sea-canvas"]')).toBeVisible();
  await expect(page.locator("#explore")).toBeVisible();
});

test("keeps a usable hero when reduced motion is enabled", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "星辰大海" })).toBeVisible();
  await expect(page.getByLabel("选择星宿")).toBeVisible();
});
