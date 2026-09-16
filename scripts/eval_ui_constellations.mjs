import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 2560, height: 1440 } });

  await page.goto('http://localhost:4010', { waitUntil: 'networkidle' });
  await page.waitForSelector('canvas.is-ready', { timeout: 20000 });
  await page.waitForTimeout(2000);

  // Evaluate inside the page where THREE and handleRef or window are
  const results = await page.evaluate(async () => {
    const select = document.querySelector('select[aria-label="选择星宿天区"]');
    const options = Array.from(select.querySelectorAll('option')).map(o => o.value).filter(Boolean);
    
    const reports = [];

    for (const opt of options) {
      select.value = opt;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      // Wait for fly to complete (1.2s animation)
      await new Promise(r => setTimeout(r, 1400));

      const latSelect = document.querySelector('select[aria-label="选择观测纬度"]');
      const dateInput = document.querySelector('input[aria-label="调整观测时间"]');
      const panel = document.querySelector('.star-sea-panel');

      reports.push({
        id: opt,
        lat: latSelect ? latSelect.value : null,
        date: dateInput ? dateInput.value : null,
        panelText: panel ? panel.textContent.trim().replace(/\s+/g, ' ') : null,
      });
    }

    return reports;
  });

  console.log('UI Options Evaluation:');
  console.table(results);

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
