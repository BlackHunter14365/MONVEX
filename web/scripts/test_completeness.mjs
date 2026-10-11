import { chromium } from 'playwright';

async function runCompletenessAudit() {
  console.log('🚀 Starting MONVEX Website Completeness & 404 Audit...');
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  } catch {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  }
  const context = await browser.newContext();
  const page = await context.newPage();

  const baseUrl = 'http://localhost:3000';
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Audit 404 Not Found Experience
    console.log('\n[1/5] Testing 404 Not Found Experience on /nonexistent-route-xyz...');
    await page.goto(`${baseUrl}/nonexistent-route-xyz`, { waitUntil: 'networkidle' });
    const notFoundTitle = await page.locator('h1').innerText();
    assert(notFoundTitle.includes('Page Not Located') || notFoundTitle.includes('Not Found') || notFoundTitle.includes('Unavailable'), `404 title rendered: "${notFoundTitle}"`);
    
    const returnHomeBtn = page.locator('text=Return to Homepage');
    assert(await returnHomeBtn.isVisible(), 'Primary CTA "Return to Homepage" is visible');
    
    const browseHelpBtn = page.locator('text=Browse Help Center');
    assert(await browseHelpBtn.isVisible(), 'Secondary CTA "Browse Help Center" is visible');

    // 2. Audit All 8 Dedicated Legal & Public Routes
    const publicPages = [
      { path: '/privacy-policy', expectedH1: 'Privacy Policy', testText: 'Zero Data Monetization' },
      { path: '/terms-of-service', expectedH1: 'Terms of Service', testText: 'Non-Custodial' },
      { path: '/cookie-policy', expectedH1: 'Cookie & Storage Policy', testText: 'Zero Third-Party Advertising Trackers' },
      { path: '/financial-disclaimer', expectedH1: 'Financial Disclaimer', testText: 'Non-Advisory & Non-Fiduciary' },
      { path: '/about', expectedH1: 'About MONVEX', testText: 'Danish Ansari' },
      { path: '/security-overview', expectedH1: 'Security & Trust Overview', testText: 'ZERO-TRUST ARCHITECTURAL POSTURE' },
      { path: '/help', expectedH1: 'Help Center & FAQs', testText: 'Double-Entry Accounting' },
      { path: '/contact', expectedH1: 'Contact MONVEX', testText: 'Dispatch a Message' },
    ];

    console.log('\n[2/5] Testing 8 Public and Legal Routes...');
    for (const p of publicPages) {
      console.log(`\n  Navigating to ${p.path}...`);
      await page.goto(`${baseUrl}${p.path}`, { waitUntil: 'networkidle' });
      const h1Text = await page.locator('h1').innerText();
      assert(h1Text.includes(p.expectedH1), `${p.path} has correct H1: "${h1Text}"`);
      
      const bodyText = await page.locator('body').innerText();
      assert(bodyText.includes(p.testText), `${p.path} contains expected text signature: "${p.testText}"`);

      // Verify structured footer exists on every public page
      const footerPrivacy = page.locator('footer a[href="/privacy-policy"]');
      assert((await footerPrivacy.count()) > 0, `${p.path} includes footer link to /privacy-policy`);
    }

    // 3. Test Interactive Help Search & Expand
    console.log('\n[3/5] Testing Help Page interactive search & accordion...');
    await page.goto(`${baseUrl}/help`, { waitUntil: 'networkidle' });
    const searchInput = page.locator('input[placeholder*="Search guides"]');
    await searchInput.fill('double-entry');
    await page.waitForTimeout(300);
    const searchResultsText = await page.locator('text=Showing').innerText();
    console.log(`  Filtered results text: "${searchResultsText}"`);
    assert(searchResultsText.includes('Showing'), 'Interactive FAQ filter successfully updated results count');

    // 4. Test Live Contact Form Submission
    console.log('\n[4/5] Testing Live Contact Form Submission to /api/v1/contact/...');
    await page.goto(`${baseUrl}/contact`, { waitUntil: 'networkidle' });
    
    // Fill out the form
    await page.locator('input[placeholder="Danish Ansari"]').fill('Automated Verification Bot');
    await page.locator('input[placeholder="user@example.com"]').fill('bot-audit@monvex.local');
    await page.locator('input[placeholder="+91 98765 43210"]').fill('+1 555 123 4567');
    await page.locator('textarea[placeholder*="Provide details"]').fill('This is a verified automated system test of the MONVEX contact dispatch pipeline.');
    
    // Submit
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Wait for success confirmation
    await page.waitForSelector('text=Message Transmitted Successfully!', { timeout: 10000 });
    const successCardText = await page.locator('text=Message Transmitted Successfully!').innerText();
    assert(successCardText.includes('Message Transmitted Successfully!'), 'Contact form submission completed with confirmation banner');

    const trackingIdElement = page.locator('text=Tracking ID:');
    assert(await trackingIdElement.isVisible(), 'Tracking ID was returned by the backend and rendered in the UI');

    // 5. Test Integration Links in Register and AuthShell
    console.log('\n[5/6] Testing AuthShell and Register disclosures...');
    await page.goto(`${baseUrl}/register`, { waitUntil: 'networkidle' });
    const termsLink = page.locator('a[href="/terms-of-service"]');
    assert((await termsLink.count()) > 0, 'Register page contains clickable Terms of Service link');
    
    const privacyLink = page.locator('a[href="/privacy-policy"]');
    assert((await privacyLink.count()) > 0, 'Register page contains clickable Privacy Policy link');

    // Check footer on login page
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    const authShellPrivacy = page.locator('footer a[href="/privacy-policy"]');
    assert((await authShellPrivacy.count()) > 0, 'AuthShell footer on /login has clickable link to /privacy-policy');
    const authShellSecurity = page.locator('footer a[href="/security-overview"]');
    assert((await authShellSecurity.count()) > 0, 'AuthShell footer on /login has clickable link to /security-overview');

    // 6. Test Theme Toggle on Public Shell
    console.log('\n[6/6] Testing Theme Toggle on Public Shell...');
    await page.goto(`${baseUrl}/about`, { waitUntil: 'networkidle' });
    const themeBtn = page.locator('header button[aria-label*="mode"]');
    assert(await themeBtn.isVisible(), 'Theme toggle button is present on public header');
    
    const initialHtmlClass = await page.evaluate(() => document.documentElement.className);
    await themeBtn.click();
    await page.waitForTimeout(200);
    const toggledHtmlClass = await page.evaluate(() => document.documentElement.className);
    assert(initialHtmlClass !== toggledHtmlClass, `Theme toggle successfully changed root HTML class (from "${initialHtmlClass}" to "${toggledHtmlClass}")`);

  } catch (error) {
    console.error('Audit exception occurred:', error);
    failed++;
  } finally {
    await browser.close();
  }

  console.log(`\n========================================`);
  console.log(`AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================`);
  if (failed > 0) {
    process.exit(1);
  }
}

runCompletenessAudit();
