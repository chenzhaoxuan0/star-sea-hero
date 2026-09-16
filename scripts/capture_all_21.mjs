import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/chenziyu/.gemini/antigravity-ide/brain/6b40b3b9-4b0b-4bac-b750-18ab115729a0';

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  await page.goto('http://localhost:4010');
  await page.waitForSelector('canvas.is-ready');
  await page.waitForTimeout(2000);

  const select = page.locator('select[aria-label="选择星宿天区"]');
  const options = await select.locator('option').all();
  const values = [];
  for (const opt of options) {
    const v = await opt.getAttribute('value');
    if (v) values.push(v);
  }

  console.log('Testing values:', values);

  for (const id of values) {
    await select.selectOption(id);
    await page.waitForTimeout(1600);

    const latVal = await page.locator('select[aria-label="选择观测纬度"]').inputValue();
    const dateVal = await page.locator('input[aria-label="调整观测时间"]').inputValue();
    console.log(`Constellation [${id}]: lat=${latVal}, date=${dateVal}`);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, `test_c_${id}.png`),
      fullPage: false
    });
  }

  await browser.close();
}

main().catch(console.error);
