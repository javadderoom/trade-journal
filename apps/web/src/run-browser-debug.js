const { chromium } = require('playwright');

async function main() {
  console.log('Starting Playwright...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Listen to console events
  page.on('console', msg => {
    console.log(`BROWSER CONSOLE [${msg.type()}]:`, msg.text());
  });

  // Listen to page errors (uncaught exceptions)
  page.on('pageerror', err => {
    console.error('BROWSER ERROR:', err.message);
    if (err.stack) console.error(err.stack);
  });

  try {
    console.log('Navigating to register page...');
    await page.goto('http://localhost:3001/register');
    await page.waitForTimeout(2000);

    console.log('Filling form...');
    await page.fill('#name', 'Reza Alavi');
    await page.fill('#email', `test_flow_${Date.now()}@example.com`);
    await page.fill('#phone', `09129${Math.floor(1000000 + Math.random() * 9000000)}`);
    await page.fill('#password', 'Password123');
    await page.fill('#confirmPassword', 'Password123');

    console.log('Form filled. Submitting...');
    await page.click('button[type="submit"]');

    console.log('Waiting for redirection (5 seconds)...');
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    const bodyHtml = await page.evaluate(() => document.body.innerHTML);
    console.log('PAGE HTML BODY CONTENT LENGTH:', bodyHtml.length);
    console.log('PAGE HTML BODY SNIPPET:', bodyHtml.substring(0, 1000));
  } catch (err) {
    console.error('Execution error:', err);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}

main();
