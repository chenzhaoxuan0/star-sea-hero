import { chromium } from 'playwright';

async function testDarkCalendar() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 2560, height: 1313 } });
  await page.goto('http://localhost:4010', { waitUntil: 'networkidle' });
  await page.waitForSelector('.star-sea-panel');
  await page.waitForTimeout(1500);

  // Click date trigger button
  const dateTrigger = page.locator('button[title*="暗色星空日历"]');
  await dateTrigger.click();
  await page.waitForTimeout(500);

  // Take screenshot of open dark calendar (full page view around bottom panel)
  await page.screenshot({ path: 'test-full-popover.png', clip: { x: 700, y: 550, width: 1160, height: 600 } });
  console.log('Saved test-full-popover.png');

  // Verify elements inside the popover
  const info = await page.evaluate(() => {
    const popover = document.querySelector('button[title*="暗色星空日历"] + div');
    if (!popover) return { found: false };
    const style = window.getComputedStyle(popover);
    return {
      found: true,
      bg: style.backgroundColor,
      color: style.color,
      backdropBlur: style.backdropFilter,
      width: style.width,
    };
  });
  console.log('Popover info:', info);

  // Click on a date (e.g. day 20)
  const day20 = page.locator('button[data-day="20"]');
  if (await day20.isVisible()) {
    await day20.click();
    await page.waitForTimeout(500);
    console.log('Clicked day 20');
  }

  // Click complete button
  const doneBtn = page.locator('button:has-text("完成")');
  if (await doneBtn.isVisible()) {
    await doneBtn.click();
    await page.waitForTimeout(300);
    console.log('Clicked 完成');
  }

  // Final screenshot after selection
  await page.locator('.star-sea-panel').screenshot({ path: 'test-after-calendar-select.png' });
  console.log('Saved test-after-calendar-select.png');

  await browser.close();
}

testDarkCalendar().catch(console.error);
