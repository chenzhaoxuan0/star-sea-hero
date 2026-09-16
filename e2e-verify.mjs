import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/chenziyu/.gemini/antigravity-ide/brain/6b40b3b9-4b0b-4bac-b750-18ab115729a0';

async function main() {
  console.log('Launching chromium with WebGL...');
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
  await page.waitForSelector('canvas.is-ready', { timeout: 20000 });
  console.log('Canvas is-ready selector matched!');

  // Wait 3 seconds for texture loading and initial rendering
  await page.waitForTimeout(3000);

  // 1. Initial view: calm ocean with starry mirror and Stellarium Milky Way
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'v11_initial_calm_sea_reflection.png'),
    fullPage: false
  });
  console.log('Captured 1: v11_initial_calm_sea_reflection.png');

  // 2. Drag to look up into the deep celestial sphere (Milky Way view)
  const canvas = page.locator('canvas.star-sea-canvas');
  const box = await canvas.boundingBox();
  if (box) {
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    // Drag down to pitch camera up towards high zenith
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 180, startY + 280, { steps: 25 });
    await page.mouse.up();
  }
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'v11_milky_way_sky_dome.png'),
    fullPage: false
  });
  console.log('Captured 2: v11_milky_way_sky_dome.png');

  // 3. Toggle ocean to wavy mode
  const oceanBtn = page.getByRole('button', { name: /海面：/ });
  await oceanBtn.click();
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'v11_wavy_ocean_mode.png'),
    fullPage: false
  });
  console.log('Captured 3: v11_wavy_ocean_mode.png');

  // 4. Select Sagittarius (Teapot at Galactic Core)
  const constellSelect = page.locator('select[aria-label="选择星宿天区"]');
  await constellSelect.selectOption('sagittarius');
  await page.waitForTimeout(2500);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'v11_constellation_sagittarius_core.png'),
    fullPage: false
  });
  console.log('Captured 4: v11_constellation_sagittarius_core.png');

  // 5. Select Orion (Hunter)
  await constellSelect.selectOption('orion');
  await page.waitForTimeout(2500);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'v11_constellation_orion.png'),
    fullPage: false
  });
  console.log('Captured 5: v11_constellation_orion.png');

  // 6. Select Ursa Major (Big Dipper)
  await constellSelect.selectOption('ursa-major');
  await page.waitForTimeout(2500);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'v11_constellation_ursa_major.png'),
    fullPage: false
  });
  console.log('Captured 6: v11_constellation_ursa_major.png');

  console.log('PAGE CONSOLE LOGS COUNT:', consoleLogs.length);
  console.log('PAGE ERRORS COUNT:', errors.length);
  if (errors.length > 0) {
    console.log('ERRORS:', errors);
  }

  await browser.close();
  console.log('Playwright verification finished successfully!');
}

main().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
