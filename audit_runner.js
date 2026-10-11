const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROUTES = [
  { path: '/dashboard', name: 'dashboard' },
  { path: '/transactions', name: 'transactions' },
  { path: '/ai', name: 'ai' },
  { path: '/budgets', name: 'budgets' },
  { path: '/goals', name: 'goals' },
  { path: '/subscriptions', name: 'subscriptions' },
  { path: '/analytics', name: 'analytics' },
  { path: '/forecast', name: 'forecast' },
  { path: '/net-worth', name: 'net_worth' },
  { path: '/debt', name: 'debt' },
  { path: '/simulator', name: 'simulator' },
  { path: '/receipts', name: 'receipts' },
  { path: '/reports', name: 'reports' },
  { path: '/notifications', name: 'notifications' },
  { path: '/security', name: 'security' },
  { path: '/settings', name: 'settings' },
];

const VIEWPORTS = [
  { label: 'desktop', width: 1440, height: 900 },
  { label: 'mobile', width: 390, height: 844 },
];

const SCREENSHOT_DIR = path.join(__dirname, 'audit_screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzkxNzM3Nzc3LCJpYXQiOjE3OTE3MzQxNzcsImp0aSI6IjQzYzc3OTIwZDU2MTQzYjc5M2E3OTM2ZjZjNjc0NjY0IiwidXNlcl9pZCI6Ijc3In0.95zWo7N44Gdis3-3-gLkUm33YpBo08-d0vXytDT36us';
const REFRESH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5MjMzODk3NywiaWF0IjoxNzkxNzM0MTc3LCJqdGkiOiJhZDg1OTcxZjI3N2M0YjQwYWQ3MmFkMmVlOTBlNDVhNyIsInVzZXJfaWQiOiI3NyJ9._o2hkG9s4S3LKOLaLyZacC1ogZG7tdxvXHvFlq2Zb_E';

async function runAudit() {
  console.log('--- MONVEX FORENSIC AUDIT STARTING ---');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  const results = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n=== AUDITING VIEWPORT: ${vp.label.toUpperCase()} (${vp.width}x${vp.height}) ===`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      userAgent: vp.label === 'mobile'
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
        : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    // Seed session in localStorage
    await context.addInitScript(({ access, refresh }) => {
      const session = {
        access,
        refresh,
        lastActivity: Date.now(),
        version: 2,
      };
      const profile = {
        id: 77,
        username: 'audit_lead',
        email: 'audit@monvex.ai',
        first_name: 'Alex',
        last_name: 'Vance',
        currency: 'USD',
        avatar_url: null,
      };
      localStorage.setItem('monvex_auth_session', JSON.stringify(session));
      localStorage.setItem('monvex_user_profile', JSON.stringify(profile));
    }, { access: ACCESS_TOKEN, refresh: REFRESH_TOKEN });

    for (const route of ROUTES) {
      const page = await context.newPage();
      const consoleErrors = [];
      const consoleWarnings = [];
      const failedRequests = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
        if (msg.type() === 'warning') consoleWarnings.push(msg.text());
      });

      page.on('requestfailed', (req) => {
        failedRequests.push({ url: req.url(), failure: req.failure()?.errorText });
      });

      page.on('response', (res) => {
        if (res.status() >= 400 && !res.url().includes('favicon')) {
          failedRequests.push({ url: res.url(), status: res.status() });
        }
      });

      const url = `http://localhost:3000${route.path}`;
      let pageTitle = '';
      let overflow = false;
      let finalUrl = '';
      let status = 'PASS';
      let failureReason = '';

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(1000); // Allow react hydrate and layout settle
        finalUrl = page.url();
        pageTitle = await page.title();

        if (finalUrl.includes('/login')) {
          status = 'FAIL';
          failureReason = 'Redirected to /login (Auth Guard failure)';
        }

        // Check horizontal overflow
        overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth || document.body.scrollWidth > window.innerWidth;
        });

        // Screenshot
        const screenshotPath = path.join(SCREENSHOT_DIR, `${route.name}_${vp.label}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });

        // Meaningful content check
        const contentCheck = await page.evaluate(() => {
          const text = document.body.innerText || '';
          return text.length > 50;
        });

        if (!contentCheck && status === 'PASS') {
          status = 'FAIL';
          failureReason = 'Empty or minimal content rendered';
        }

        if (overflow) {
          status = status === 'PASS' ? 'WARNING' : status;
          failureReason = (failureReason ? failureReason + '; ' : '') + 'Horizontal overflow detected';
        }
      } catch (err) {
        status = 'FAIL';
        failureReason = err.message;
      }

      const result = {
        route: route.path,
        name: route.name,
        viewport: vp.label,
        width: vp.width,
        height: vp.height,
        finalUrl,
        pageTitle,
        status,
        failureReason,
        overflow,
        consoleErrorsCount: consoleErrors.length,
        consoleErrors: consoleErrors.slice(0, 5),
        failedRequestsCount: failedRequests.length,
        failedRequests: failedRequests.slice(0, 5),
      };

      results.push(result);
      console.log(`  [${status}] ${route.path.padEnd(16)} | Overflows: ${overflow ? 'YES' : 'NO '} | ConsoleErrs: ${consoleErrors.length} | NetErrs: ${failedRequests.length} ${failureReason ? `(${failureReason})` : ''}`);

      await page.close();
    }

    await context.close();
  }

  await browser.close();

  fs.writeFileSync(path.join(__dirname, 'audit_results.json'), JSON.stringify(results, null, 2));
  console.log('\n--- AUDIT COMPLETE. Results saved to audit_results.json ---');
}

runAudit().catch(console.error);
