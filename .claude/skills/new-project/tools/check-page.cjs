const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-gpu'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 700 });
  page.on('console', message => console.log('CONSOLE', message.type(), message.text()));
  page.on('pageerror', error => console.log('PAGEERROR', error.message));
  page.on('requestfailed', request =>
    console.log('REQFAILED', request.url(), request.failure()?.errorText)
  );

  await page.goto(process.env.TARGET_URL, { waitUntil: 'networkidle0', timeout: 150000 });
  await page.waitForSelector('dl, [role=alert]', { timeout: 90000 });
  console.log('--- visible text:');
  console.log(await page.evaluate(() => document.body.innerText));
  await page.screenshot({ path: '/out/home.png' });
  await browser.close();
})().catch(error => {
  console.log('SCRIPT FAILED', error.message);
  process.exit(1);
});
