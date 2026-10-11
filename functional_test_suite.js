const { chromium } = require('@playwright/test');

const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzkxNzM3Nzc3LCJpYXQiOjE3OTE3MzQxNzcsImp0aSI6IjQzYzc3OTIwZDU2MTQzYjc5M2E3OTM2ZjZjNjc0NjY0IiwidXNlcl9pZCI6Ijc3In0.95zWo7N44Gdis3-3-gLkUm33YpBo08-d0vXytDT36us';
const REFRESH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5MjMzODk3NywiaWF0IjoxNzkxNzM0MTc3LCJqdGkiOiJhZDg1OTcxZjI3N2M0YjQwYWQ3MmFkMmVlOTBlNDVhNyIsInVzZXJfaWQiOiI3NyJ9._o2hkG9s4S3LKOLaLyZacC1ogZG7tdxvXHvFlq2Zb_E';

async function testFunctionalWorkflows() {
  console.log('=== RUNNING INTERACTIVE FUNCTIONAL WORKFLOWS ===\n');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  await context.addInitScript(({ access, refresh }) => {
    localStorage.setItem('monvex_auth_session', JSON.stringify({ access, refresh, lastActivity: Date.now(), version: 2 }));
    localStorage.setItem('monvex_user_profile', JSON.stringify({ id: 77, username: 'audit_lead', email: 'audit@monvex.ai', first_name: 'Alex', last_name: 'Vance', currency: 'USD' }));
  }, { access: ACCESS_TOKEN, refresh: REFRESH_TOKEN });

  const page = await context.newPage();

  const results = [];

  const runTest = async (name, fn) => {
    try {
      await fn();
      results.push({ name, status: 'PASS' });
      console.log(`[PASS] ${name}`);
    } catch (err) {
      results.push({ name, status: 'FAIL', error: err.message });
      console.error(`[FAIL] ${name}: ${err.message}`);
    }
  };

  // 1. Transactions Search & Filters
  await runTest('Transactions: Search input & Type filtering', async () => {
    await page.goto('http://localhost:3000/transactions', { waitUntil: 'networkidle' });
    const searchInput = page.locator('input[aria-label="Search transactions"]');
    await searchInput.fill('Coffee');
    await page.waitForTimeout(300);
    // Click Outflows filter
    await page.click('button:has-text("Outflows")');
    await page.waitForTimeout(300);
    // Click All filter
    await page.click('button:has-text("All")');
    await searchInput.fill('');
  });

  // 2. Budgets Modal
  await runTest('Budgets: Add Guardrail Modal interaction', async () => {
    await page.goto('http://localhost:3000/budgets', { waitUntil: 'networkidle' });
    const addBtn = page.locator('button:has-text("Set Budget Limit"), button:has-text("Create First Budget")').first();
    await addBtn.click();
    await page.waitForTimeout(500);
    const amountInput = page.locator('input[placeholder*="500"], input[type="number"]').first();
    await amountInput.fill('500');
    // Close modal
    const closeBtn = page.locator('button:has-text("Cancel"), button[aria-label="Close"]').first();
    await closeBtn.click();
  });

  // 3. Forecast Timeframe Levers
  await runTest('Forecast: 30/60/90 Days Selector', async () => {
    await page.goto('http://localhost:3000/forecast', { waitUntil: 'networkidle' });
    await page.click('button:has-text("60 Days")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("90 Days")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("30 Days")');
  });

  // 4. Simulator Presets
  await runTest('Simulator: Presets & Sensitivity Levers', async () => {
    await page.goto('http://localhost:3000/simulator', { waitUntil: 'networkidle' });
    await page.click('button:has-text("Balanced Boost")');
    await page.waitForTimeout(400);
    await page.click('button:has-text("Aggressive Frugal")');
    await page.waitForTimeout(400);
    await page.click('button:has-text("Career Promotion")');
    await page.waitForTimeout(400);
    await page.click('button:has-text("Reset Baseline")');
  });

  // 5. Settings Tab Navigation
  await runTest('Settings: Deep Tab Navigation', async () => {
    await page.goto('http://localhost:3000/settings', { waitUntil: 'networkidle' });
    await page.click('button:has-text("Financial Parameters")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Alert Telemetry")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Copilot Behavior")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Security & Access")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Data Governance")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Profile Identity")');
  });

  // 6. Notifications Filters
  await runTest('Notifications: Severity Filters', async () => {
    await page.goto('http://localhost:3000/notifications', { waitUntil: 'networkidle' });
    await page.click('button:has-text("CRITICAL")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("WARNING")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("ALL")');
  });

  // 7. AI Copilot Interaction
  await runTest('AI Copilot: Prompt submission and response handling', async () => {
    await page.goto('http://localhost:3000/ai', { waitUntil: 'networkidle' });
    const promptCard = page.locator('button:has-text("How much did i spend last month?")').first();
    if (await promptCard.isVisible()) {
      await promptCard.click();
      await page.waitForTimeout(2000); // Wait for streaming or response
    }
  });

  await page.close();
  await context.close();
  await browser.close();

  console.log('\n=== ALL FUNCTIONAL WORKFLOWS COMPLETED ===');
}

testFunctionalWorkflows().catch(console.error);
