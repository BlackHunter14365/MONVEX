const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

async function getFreshTokens() {
  const res = await fetch('http://127.0.0.1:8000/api/v1/auth/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'audit_lead', password: 'MonvexTestPass123!' })
  });
  const data = await res.json();
  if (!data.access) {
    throw new Error('Could not obtain fresh tokens: ' + JSON.stringify(data));
  }
  return { access: data.access, refresh: data.refresh, user: data.user };
}

async function verifyAssets() {
  console.log('=== STARTING SYSTEMATIC ASSET & UI VERIFICATION ===\n');

  const { access, refresh, user } = await getFreshTokens();
  console.log('Obtained fresh token for user:', user.username);

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  const testCases = [
    { url: 'http://localhost:3000/', name: 'landing', auth: false },
    { url: 'http://localhost:3000/login', name: 'login', auth: false },
    { url: 'http://localhost:3000/dashboard', name: 'dashboard', auth: true },
    { url: 'http://localhost:3000/transactions', name: 'transactions', auth: true },
    { url: 'http://localhost:3000/budgets', name: 'budgets', auth: true },
    { url: 'http://localhost:3000/ai', name: 'ai', auth: true },
    { url: 'http://localhost:3000/analytics', name: 'analytics', auth: true },
    { url: 'http://localhost:3000/settings', name: 'settings', auth: true },
  ];

  const overallResults = [];
  const screenshotDir = path.join(__dirname, 'audit_screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  for (const tc of testCases) {
    console.log(`\n--- Testing ${tc.name} (${tc.url}) [auth=${tc.auth}] ---`);
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });

    if (tc.auth) {
      await context.addInitScript(({ access, refresh, user }) => {
        const session = { access, refresh, lastActivity: Date.now(), version: 2 };
        localStorage.setItem('monvex_auth_session', JSON.stringify(session));
        localStorage.setItem('monvex_user_profile', JSON.stringify(user));
      }, { access, refresh, user });
    }

    const page = await context.newPage();
    const assetResponses = [];
    const consoleErrors = [];
    const failedRequests = [];

    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    page.on('requestfailed', req => {
      failedRequests.push({ url: req.url(), error: req.failure()?.errorText });
    });

    page.on('response', res => {
      const url = res.url();
      if (url.includes('/_next/static/')) {
        assetResponses.push({
          url,
          status: res.status(),
          contentType: res.headers()['content-type'] || '',
        });
      }
    });

    try {
      const response = await page.goto(tc.url, { waitUntil: 'load', timeout: 25000 });
      await page.waitForTimeout(2000); // Allow react hydration and layout settle

      // Check stylesheet responses
      const cssAssets = assetResponses.filter(a => a.url.includes('/css/') || a.url.endsWith('.css') || a.contentType.includes('text/css'));
      const jsAssets = assetResponses.filter(a => a.url.includes('/chunks/') || a.url.endsWith('.js') || a.contentType.includes('javascript'));
      const chunk404s = assetResponses.filter(a => a.status === 404);

      console.log(`  Assets loaded: ${assetResponses.length} total (${cssAssets.length} CSS, ${jsAssets.length} JS)`);
      console.log(`  Chunk 404s: ${chunk404s.length}`);
      if (chunk404s.length > 0) {
        console.log('  404 URLs:', chunk404s.map(c => c.url));
      }
      console.log(`  Console Errors: ${consoleErrors.length}`);
      if (consoleErrors.length > 0) {
        console.log('  Console Errors sample:', consoleErrors.slice(0, 3));
      }

      // Inspect computed styles in browser
      const stylesInfo = await page.evaluate(() => {
        const bodyStyle = window.getComputedStyle(document.body);
        const cards = document.querySelectorAll('.editorial-card, .aurora-card, .liquid-card, [class*="rounded-"]');
        const sampleCard = cards.length > 0 ? window.getComputedStyle(cards[0]) : null;

        return {
          bodyBg: bodyStyle.backgroundColor,
          bodyColor: bodyStyle.color,
          bodyFont: bodyStyle.fontFamily,
          cardsCount: cards.length,
          sampleCardBg: sampleCard ? sampleCard.backgroundColor : 'none',
          sampleCardBorder: sampleCard ? sampleCard.borderColor : 'none',
          title: document.title,
          innerTextLength: (document.body.innerText || '').length,
        };
      });

      console.log('  Computed Styles & DOM:', JSON.stringify(stylesInfo, null, 2));

      // Capture desktop screenshot
      const desktopPath = path.join(screenshotDir, `verify_${tc.name}_desktop.png`);
      await page.screenshot({ path: desktopPath });
      console.log(`  Saved desktop screenshot: ${desktopPath}`);

      // Capture mobile screenshot
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(500);
      const mobilePath = path.join(screenshotDir, `verify_${tc.name}_mobile.png`);
      await page.screenshot({ path: mobilePath });
      console.log(`  Saved mobile screenshot: ${mobilePath}`);

      overallResults.push({
        route: tc.url,
        name: tc.name,
        cssAssetsCount: cssAssets.length,
        jsAssetsCount: jsAssets.length,
        chunk404Count: chunk404s.length,
        consoleErrorsCount: consoleErrors.length,
        failedRequestsCount: failedRequests.length,
        stylesInfo,
      });
    } catch (err) {
      console.error(`  Failed on ${tc.url}:`, err.message);
    } finally {
      await page.close();
      await context.close();
    }
  }

  await browser.close();

  fs.writeFileSync(path.join(__dirname, 'verify_assets_report.json'), JSON.stringify(overallResults, null, 2));
  console.log('\n=== VERIFICATION RUN COMPLETE. Report saved to verify_assets_report.json ===');
}

verifyAssets().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
