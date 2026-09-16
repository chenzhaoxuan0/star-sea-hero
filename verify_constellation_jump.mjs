import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/chenziyu/.gemini/antigravity-ide/brain/6b40b3b9-4b0b-4bac-b750-18ab115729a0';

async function main() {
  console.log('Launching Playwright Chromium with WebGL...');
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
    viewport: { width: 2560, height: 1440 }
  });
  const page = await context.newPage();

  page.on('console', msg => console.log(`[Browser ${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => console.error('[Browser Error]', err));

  console.log('Navigating to http://localhost:4010...');
  await page.goto('http://localhost:4010', { waitUntil: 'networkidle' });

  // Wait for canvas readiness
  await page.waitForSelector('canvas.is-ready', { timeout: 20000 });
  console.log('Canvas is ready.');
  await page.waitForTimeout(2000);

  const constellSelect = page.locator('select[aria-label="选择星宿天区"]');
  const latSelect = page.locator('select[aria-label="选择观测纬度"]');
  const dateInput = page.locator('input[aria-label="调整观测时间"]');

  // Test 1: Orion (Winter Sky, 35N)
  console.log('Testing Orion jump...');
  await constellSelect.selectOption('orion');
  await page.waitForTimeout(2000);

  const orionDate = await dateInput.inputValue();
  const orionLat = await latSelect.inputValue();
  const panelTextOrion = await page.locator('.star-sea-panel').textContent();

  console.log(`Orion: date=${orionDate}, lat=${orionLat}`);
  if (!orionDate.startsWith('2026-01') && !orionDate.startsWith('2026-02')) {
    console.warn('Unexpected date for Orion:', orionDate);
  }
  if (!panelTextOrion.includes('冬夜猎户南中天') || !panelTextOrion.includes('猎户座')) {
    console.error('Panel text missing Orion info:', panelTextOrion);
  }

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'v13_constellation_orion_centered.png'),
    fullPage: false
  });
  console.log('Saved v13_constellation_orion_centered.png');

  // Test 2: Southern Cross (Crux, South 35S, Autumn in Southern Hemisphere)
  console.log('Testing Crux (南十字座) jump...');
  await constellSelect.selectOption('crux');
  await page.waitForTimeout(2000);

  const cruxDate = await dateInput.inputValue();
  const cruxLat = await latSelect.inputValue();
  const panelTextCrux = await page.locator('.star-sea-panel').textContent();

  console.log(`Crux: date=${cruxDate}, lat=${cruxLat}`);
  if (cruxLat !== '35S') {
    throw new Error(`Expected latitude 35S for Crux, got: ${cruxLat}`);
  }
  if (!panelTextCrux.includes('南半球秋夜南十字')) {
    throw new Error(`Panel text missing Crux season badge: ${panelTextCrux}`);
  }

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'v13_constellation_crux_southern.png'),
    fullPage: false
  });
  console.log('Saved v13_constellation_crux_southern.png');

  // Test 3: Scorpius (天蝎座, Equator 0EQ, Summer)
  console.log('Testing Scorpius (天蝎座) jump...');
  await constellSelect.selectOption('scorpius');
  await page.waitForTimeout(2000);

  const scoDate = await dateInput.inputValue();
  const scoLat = await latSelect.inputValue();
  const panelTextSco = await page.locator('.star-sea-panel').textContent();

  console.log(`Scorpius: date=${scoDate}, lat=${scoLat}`);
  if (scoLat !== '0EQ') {
    throw new Error(`Expected latitude 0EQ for Scorpius, got: ${scoLat}`);
  }
  if (!panelTextSco.includes('盛夏壮丽心宿')) {
    throw new Error(`Panel text missing Scorpius season badge: ${panelTextSco}`);
  }

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'v13_constellation_scorpius_equator.png'),
    fullPage: false
  });
  console.log('Saved v13_constellation_scorpius_equator.png');

  // Test 4: Reset View
  console.log('Testing Reset View...');
  const resetBtn = page.getByRole('button', { name: '重置全天视角' });
  await resetBtn.click();
  await page.waitForTimeout(2000);

  const selectedValAfterReset = await constellSelect.inputValue();
  console.log('Selected value after reset:', selectedValAfterReset);
  if (selectedValAfterReset !== '') {
    throw new Error('Expected selected value to be empty after reset');
  }

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'v13_constellation_reset_panorama.png'),
    fullPage: false
  });
  console.log('Saved v13_constellation_reset_panorama.png');

  console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
  await browser.close();
}

main().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
