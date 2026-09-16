import { chromium } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/chenziyu/.gemini/antigravity-ide/brain/6b40b3b9-4b0b-4bac-b750-18ab115729a0';

async function main() {
  console.log('Launching chromium...');
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--no-sandbox'
    ]
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const consoleLogs = [];
  const errors = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') {
      errors.push(text);
    }
  });
  page.on('pageerror', err => {
    errors.push(err.toString());
  });

  console.log('Navigating to http://localhost:4010...');
  await page.goto('http://localhost:4010', { waitUntil: 'networkidle' });

  // Wait for canvas to have is-ready
  await page.waitForSelector('canvas.is-ready', { timeout: 15000 });
  console.log('Canvas is-ready selector matched!');

  // Wait 2.5 seconds for initial rendering
  await page.waitForTimeout(2500);

  // Take initial calm ocean screenshot
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'playwright_initial_calm_sea.png'),
    fullPage: false
  });
  console.log('Captured initial calm sea screenshot.');

  // Check cloud control button
  const cloudBtn = page.locator('button[title="调整天幕云雾薄厚与位置"]');
  await cloudBtn.click();
  await page.waitForTimeout(600);

  // Click dense clouds preset
  const denseCloudBtn = page.getByRole('button', { name: '浓郁层云' });
  await denseCloudBtn.click();
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'playwright_dense_clouds.png'),
    fullPage: false
  });
  console.log('Captured dense clouds screenshot.');

  // Click clear sky preset
  const clearSkyBtn = page.getByRole('button', { name: '晴朗明澈' });
  await clearSkyBtn.click();
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'playwright_clear_sky.png'),
    fullPage: false
  });
  console.log('Captured clear sky screenshot.');

  // Close cloud popup
  await cloudBtn.click();
  await page.waitForTimeout(400);

  // Toggle ocean waves
  const oceanBtn = page.locator('button[title="切换海面状态：镜面平静或微波起伏"]');
  await oceanBtn.click();
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'playwright_wavy_ocean.png'),
    fullPage: false
  });
  console.log('Captured wavy ocean screenshot.');

  // Select Cygnus constellation
  const constellSelect = page.getByLabel('选择星宿天区');
  await constellSelect.selectOption('cygnus');
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'playwright_constellation_cygnus.png'),
    fullPage: false
  });
  console.log('Captured Cygnus constellation screenshot.');

  // Select Ursa Major
  await constellSelect.selectOption('ursa-major');
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'playwright_constellation_ursa_major.png'),
    fullPage: false
  });
  console.log('Captured Ursa Major constellation screenshot.');

  console.log('PAGE CONSOLE LOGS COUNT:', consoleLogs.length);
  console.log('PAGE ERRORS COUNT:', errors.length);
  if (errors.length > 0) {
    console.log('ERRORS:', errors);
  }

  await browser.close();
  console.log('Verification finished successfully!');
}

main().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
