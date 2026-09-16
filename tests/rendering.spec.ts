import { expect, test } from "@playwright/test";

test("completed WebGL initialization reveals the canvas", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  const canvas = page.getByTestId("star-sea-canvas");
  await expect(canvas).toHaveClass(/is-ready/, { timeout: 30_000 });
  await page.screenshot({ path: testInfo.outputPath("hero.png") });
  await testInfo.attach("hero", { path: testInfo.outputPath("hero.png"), contentType: "image/png" });
  await expect(canvas).toHaveCSS("opacity", "1");
  expect(errors).toEqual([]);
});
