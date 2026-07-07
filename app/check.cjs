const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (msg) => errors.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}\n${err.stack}`));

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'check-1-home.png' });

  console.log('--- ERRORS SO FAR ---');
  console.log(errors.filter(e => !e.startsWith('[debug]')).join('\n'));

  // open the theme launcher
  try {
    await page.click('[aria-label="Elegir tema"]', { timeout: 5000 });
    console.log('Opened theme launcher');
  } catch (e) {
    console.log('FAILED to open theme launcher:', e.message);
  }
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'check-2-catalog-open.png' });

  const bgBefore = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  console.log('bg before theme click:', bgBefore);

  // list theme buttons
  const labels = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button[aria-label^="Select "]')).map(b => b.getAttribute('aria-label'))
  );
  console.log('Theme buttons found:', labels);

  // click a theme that is not the current one, e.g. Prince of Darkness
  try {
    await page.click('button[aria-label*="PrinceOfDarkness" i], button[aria-label*="Prince" i]', { timeout: 3000 });
    console.log('Clicked a PrinceOfDarkness-like theme button');
  } catch (e) {
    console.log('No PrinceOfDarkness-like button, clicking first available theme button instead');
    const btn = await page.$('button[aria-label^="Select "]');
    if (btn) await btn.click();
  }
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'check-3-after-theme-click.png' });

  const bgAfter = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  console.log('bg after theme click:', bgAfter);

  console.log('--- CONSOLE ERRORS/WARNINGS ---');
  console.log(errors.filter(e => !e.startsWith('[debug]')).join('\n'));

  await browser.close();
})();
