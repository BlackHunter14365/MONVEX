import { chromium } from 'playwright';

async function testAllPublicLinks() {
  console.log('--- STARTING COMPREHENSIVE PUBLIC LINKS VALIDATION ---');
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  } catch {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  }
  const context = await browser.newContext();
  const page = await context.newPage();

  let unrecoverableError = false;
  let unwantedLoginRedirect = false;

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('unrecoverable error') || text.includes('Segment mismatch')) {
      console.error(`[CONSOLE ERROR] ${text}`);
      unrecoverableError = true;
    }
  });

  const testCases = [
    // 1. From landing page (/)
    { source: 'http://localhost:3000', selector: 'footer a[href="/privacy-policy"]', expected: '/privacy-policy', name: 'Landing Footer -> Privacy' },
    { source: 'http://localhost:3000', selector: 'footer a[href="/terms-of-service"]', expected: '/terms-of-service', name: 'Landing Footer -> Terms' },
    { source: 'http://localhost:3000', selector: 'footer a[href="/cookie-policy"]', expected: '/cookie-policy', name: 'Landing Footer -> Cookies' },
    { source: 'http://localhost:3000', selector: 'footer a[href="/financial-disclaimer"]', expected: '/financial-disclaimer', name: 'Landing Footer -> Finance Disclaimer' },
    { source: 'http://localhost:3000', selector: 'footer a[href="/security-overview"]', expected: '/security-overview', name: 'Landing Footer -> Security Overview' },
    { source: 'http://localhost:3000', selector: 'footer a[href="/about"]', expected: '/about', name: 'Landing Footer -> About' },
    { source: 'http://localhost:3000', selector: 'footer a[href="/help"]', expected: '/help', name: 'Landing Footer -> Help' },
    { source: 'http://localhost:3000', selector: 'footer a[href="/contact"]', expected: '/contact', name: 'Landing Footer -> Contact' },

    // 2. From /login page footer
    { source: 'http://localhost:3000/login', selector: 'footer a[href="/privacy-policy"]', expected: '/privacy-policy', name: 'Login Footer -> Privacy' },
    { source: 'http://localhost:3000/login', selector: 'footer a[href="/terms-of-service"]', expected: '/terms-of-service', name: 'Login Footer -> Terms' },
    { source: 'http://localhost:3000/login', selector: 'footer a[href="/security-overview"]', expected: '/security-overview', name: 'Login Footer -> Security' },
    { source: 'http://localhost:3000/login', selector: 'footer a[href="/financial-disclaimer"]', expected: '/financial-disclaimer', name: 'Login Footer -> Finance Disclaimer' },
    { source: 'http://localhost:3000/login', selector: 'footer a[href="/contact"]', expected: '/contact', name: 'Login Footer -> Contact' },

    // 3. From /register page footer & form
    { source: 'http://localhost:3000/register', selector: 'footer a[href="/privacy-policy"]', expected: '/privacy-policy', name: 'Register Footer -> Privacy' },
    { source: 'http://localhost:3000/register', selector: 'footer a[href="/terms-of-service"]', expected: '/terms-of-service', name: 'Register Footer -> Terms' },
    { source: 'http://localhost:3000/register', selector: 'footer a[href="/security-overview"]', expected: '/security-overview', name: 'Register Footer -> Security' },
    { source: 'http://localhost:3000/register', selector: 'footer a[href="/financial-disclaimer"]', expected: '/financial-disclaimer', name: 'Register Footer -> Finance Disclaimer' },

    // 4. From /privacy-policy top navigation & footer to other pages
    { source: 'http://localhost:3000/privacy-policy', selector: 'header nav a[href="/about"]', expected: '/about', name: 'Privacy Header Nav -> About' },
    { source: 'http://localhost:3000/privacy-policy', selector: 'header nav a[href="/security-overview"]', expected: '/security-overview', name: 'Privacy Header Nav -> Security' },
    { source: 'http://localhost:3000/privacy-policy', selector: 'header nav a[href="/help"]', expected: '/help', name: 'Privacy Header Nav -> Help' },
    { source: 'http://localhost:3000/privacy-policy', selector: 'header nav a[href="/contact"]', expected: '/contact', name: 'Privacy Header Nav -> Contact' },
    { source: 'http://localhost:3000/privacy-policy', selector: 'footer a[href="/terms-of-service"]', expected: '/terms-of-service', name: 'Privacy Footer -> Terms' },
    { source: 'http://localhost:3000/privacy-policy', selector: 'footer a[href="/cookie-policy"]', expected: '/cookie-policy', name: 'Privacy Footer -> Cookie Policy' },
    { source: 'http://localhost:3000/privacy-policy', selector: 'footer a[href="/financial-disclaimer"]', expected: '/financial-disclaimer', name: 'Privacy Footer -> Financial Disclaimer' },
  ];

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    process.stdout.write(`Testing: ${tc.name}... `);
    try {
      await page.goto(tc.source, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      const link = page.locator(tc.selector).first();
      const count = await link.count();
      if (count === 0) {
        console.log(`FAILED (selector not found: ${tc.selector})`);
        failed++;
        continue;
      }

      // Single click
      await link.click();
      await page.waitForTimeout(1000);

      const finalUrl = page.url();
      const targetPath = new URL(finalUrl).pathname;

      if (targetPath === tc.expected) {
        console.log(`PASSED (${targetPath})`);
        passed++;
      } else {
        console.log(`FAILED! Expected ${tc.expected}, got ${targetPath}`);
        failed++;
      }
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n--- RESULTS: ${passed} passed, ${failed} failed ---`);
  if (unrecoverableError) {
    console.error('FAIL: Detected unrecoverable Next.js error or segment mismatch!');
  }

  await browser.close();

  if (failed > 0 || unrecoverableError) {
    process.exit(1);
  } else {
    console.log('SUCCESS: All public links open directly on a single click without login redirects!');
  }
}

testAllPublicLinks();
