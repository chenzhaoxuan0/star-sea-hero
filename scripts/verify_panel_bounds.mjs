import { chromium } from 'playwright';

async function testPanel() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 2560, height: 1313 } });
  await page.goto('http://localhost:4010', { waitUntil: 'networkidle' });
  await page.waitForSelector('.star-sea-panel', { timeout: 15000 });
  await page.waitForTimeout(1000);

  // Measure bounding boxes
  const metrics = await page.evaluate(() => {
    const panel = document.querySelector('.star-sea-panel');
    const playBtn = document.querySelector('button[title*="流转"]');
    const panelRect = panel.getBoundingClientRect();
    const btnRect = playBtn.getBoundingClientRect();

    return {
      panelWidth: panelRect.width,
      panelRight: panelRect.right,
      btnRight: btnRect.right,
      btnWidth: btnRect.width,
      rightMargin: panelRect.right - btnRect.right,
      overflow: btnRect.right > panelRect.right,
    };
  });

  console.log('Panel metrics at 2560x1313:', metrics);

  // Take screenshot of the bottom controls
  const panelElem = page.locator('.star-sea-panel');
  await panelElem.screenshot({ path: 'test-panel-screenshot.png' });
  console.log('Screenshot saved to test-panel-screenshot.png');

  // Also test at 1920x1080
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.waitForTimeout(500);
  const metrics1080 = await page.evaluate(() => {
    const panel = document.querySelector('.star-sea-panel');
    const playBtn = document.querySelector('button[title*="流转"]');
    const panelRect = panel.getBoundingClientRect();
    const btnRect = playBtn.getBoundingClientRect();

    return {
      panelWidth: panelRect.width,
      panelRight: panelRect.right,
      btnRight: btnRect.right,
      rightMargin: panelRect.right - btnRect.right,
      overflow: btnRect.right > panelRect.right,
    };
  });
  console.log('Panel metrics at 1920x1080:', metrics1080);

  // Also test at 1366x768 (laptop screen)
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.waitForTimeout(500);
  const metrics1366 = await page.evaluate(() => {
    const panel = document.querySelector('.star-sea-panel');
    const playBtn = document.querySelector('button[title*="流转"]');
    const panelRect = panel.getBoundingClientRect();
    const btnRect = playBtn.getBoundingClientRect();

    return {
      panelWidth: panelRect.width,
      panelRight: panelRect.right,
      btnRight: btnRect.right,
      rightMargin: panelRect.right - btnRect.right,
      overflow: btnRect.right > panelRect.right,
    };
  });
  console.log('Panel metrics at 1366x768:', metrics1366);

  // Test selected constellation layout
  const select = page.locator('select[aria-label="选择星宿天区"]');
  await select.selectOption('aries');
  await page.waitForTimeout(1500);
  await page.locator('.star-sea-panel').screenshot({ path: 'test-panel-selected.png' });
  console.log('Saved test-panel-selected.png');

  await browser.close();
}

testPanel().catch(err => {
  console.error(err);
  process.exit(1);
});
