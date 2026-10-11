import fs from 'fs';
import path from 'path';
import { chromium } from '@playwright/test';

const WEB_BASE = 'http://localhost:3000';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:/Users/Demon68/.gemini/antigravity/brain/5a359b5f-f310-4a2c-8b10-1d3556e47689';

async function logStep(name, fn) {
  process.stdout.write(`\n--- [TEST] ${name} ... `);
  try {
    const res = await fn();
    console.log('✓ PASS');
    return { name, pass: true, data: res };
  } catch (err) {
    console.log('✗ FAIL');
    console.error(err);
    return { name, pass: false, error: err.message };
  }
}

async function main() {
  console.log('====================================================');
  console.log('   MONVEX SIDEBAR STABILITY & HYDRATION AUDIT       ');
  console.log('====================================================');

  const consoleLogs = [];
  const consoleErrors = [];

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push({ type: msg.type(), text });
    if (msg.type() === 'error' || text.includes('Warning:') || text.includes('Hydration')) {
      consoleErrors.push(text);
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  const results = [];

  try {
    // 1. Authenticate
    results.push(await logStep('0. Authenticate test session', async () => {
      await page.goto(`${WEB_BASE}/login`, { waitUntil: 'networkidle' });
      await page.fill('#login-identifier', 'audit@monvex.ai');
      await page.fill('#login-password', 'MonvexTestPass123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      await page.waitForSelector('aside[aria-label="Application sidebar"]', { state: 'visible', timeout: 10000 });
      return { url: page.url() };
    }));

    // TEST A: Desktop Refresh Stability
    results.push(await logStep('TEST A1: Desktop Refresh with Collapsed Sidebar', async () => {
      const sidebar = page.locator('aside[aria-label="Application sidebar"]');
      
      // Ensure collapsed
      const isCurrentlyCollapsed = await sidebar.evaluate(el => el.classList.contains('w-[76px]'));
      if (!isCurrentlyCollapsed) {
        await sidebar.locator('button[aria-label="Collapse sidebar"]').click();
        await page.waitForTimeout(300);
      }

      // Record width before reload
      const widthBefore = await sidebar.evaluate(el => el.getBoundingClientRect().width);
      if (Math.round(widthBefore) !== 76) {
        throw new Error(`Expected collapsed width 76px before reload, got ${widthBefore}px`);
      }

      // Reload page and immediately sample width before and after hydration
      const response = await page.reload({ waitUntil: 'domcontentloaded' });
      if (!response?.ok()) throw new Error(`Reload failed with status ${response?.status()}`);

      // Sample width immediately on DOM ready (pre-hydration)
      const earlyWidth = await sidebar.evaluate(el => el.getBoundingClientRect().width);
      console.log(`    Early width immediately on domcontentloaded: ${earlyWidth}px`);

      // Wait for complete hydration / network idle
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const postHydrationWidth = await sidebar.evaluate(el => el.getBoundingClientRect().width);
      console.log(`    Post-hydration width after networkidle: ${postHydrationWidth}px`);

      if (Math.round(earlyWidth) > 100) {
        throw new Error(`Sidebar flashed open on reload! Initial width was ${earlyWidth}px instead of 76px.`);
      }
      if (Math.round(postHydrationWidth) !== 76) {
        throw new Error(`Sidebar collapsed state lost after hydration! Width is ${postHydrationWidth}px.`);
      }

      return { earlyWidth, postHydrationWidth };
    }));

    results.push(await logStep('TEST A2: Desktop Refresh with Expanded Sidebar', async () => {
      const sidebar = page.locator('aside[aria-label="Application sidebar"]');
      
      // Expand sidebar
      await sidebar.locator('button[aria-label="Expand sidebar"]').click();
      await page.waitForTimeout(300);

      const widthBefore = await sidebar.evaluate(el => el.getBoundingClientRect().width);
      if (Math.round(widthBefore) !== 260) {
        throw new Error(`Expected expanded width 260px before reload, got ${widthBefore}px`);
      }

      // Reload page
      await page.reload({ waitUntil: 'domcontentloaded' });
      const earlyWidth = await sidebar.evaluate(el => el.getBoundingClientRect().width);
      console.log(`    Early expanded width on domcontentloaded: ${earlyWidth}px`);

      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const postHydrationWidth = await sidebar.evaluate(el => el.getBoundingClientRect().width);
      console.log(`    Post-hydration expanded width: ${postHydrationWidth}px`);

      if (Math.round(earlyWidth) < 250) {
        throw new Error(`Sidebar flashed collapsed on reload! Initial width was ${earlyWidth}px instead of 260px.`);
      }
      if (Math.round(postHydrationWidth) !== 260) {
        throw new Error(`Sidebar expanded state lost after hydration! Width is ${postHydrationWidth}px.`);
      }

      return { earlyWidth, postHydrationWidth };
    }));

    // TEST B: Browser Tab Switching & Cross-Tab Synchronization
    results.push(await logStep('TEST B: Browser Tab Switching & Cross-Tab Sync', async () => {
      const sidebar = page.locator('aside[aria-label="Application sidebar"]');

      // 1. Collapse in Tab 1
      await sidebar.locator('button[aria-label="Collapse sidebar"]').click();
      await page.waitForTimeout(300);

      // 2. Open Tab 2 to blank, activate it
      const tab2 = await context.newPage();
      await tab2.goto('about:blank');
      await tab2.bringToFront();
      await page.waitForTimeout(1000);

      // 3. Switch back to Tab 1
      await page.bringToFront();
      await page.waitForTimeout(1000);

      const tab1WidthAfterReturn = await sidebar.evaluate(el => el.getBoundingClientRect().width);
      console.log(`    Tab 1 width after returning from background: ${tab1WidthAfterReturn}px`);
      if (Math.round(tab1WidthAfterReturn) !== 76) {
        throw new Error(`Sidebar state changed on returning to tab! Expected 76px, got ${tab1WidthAfterReturn}px`);
      }

      // 4. Open MONVEX in Tab 2 and verify cross-tab synchronization
      await tab2.goto(`${WEB_BASE}/dashboard`, { waitUntil: 'networkidle' });
      const tab2Sidebar = tab2.locator('aside[aria-label="Application sidebar"]');
      const tab2InitialWidth = await tab2Sidebar.evaluate(el => el.getBoundingClientRect().width);
      console.log(`    Tab 2 initial width from persisted state: ${tab2InitialWidth}px`);
      if (Math.round(tab2InitialWidth) !== 76) {
        throw new Error(`Tab 2 did not initialize to 76px! Got ${tab2InitialWidth}px`);
      }

      // 5. Expand sidebar in Tab 2
      await tab2Sidebar.locator('button[aria-label="Expand sidebar"]').click();
      await tab2.waitForTimeout(400);

      // 6. Check Tab 1: It should have synchronized to 260px via storage event!
      await page.bringToFront();
      await page.waitForTimeout(400);
      const tab1SyncedWidth = await sidebar.evaluate(el => el.getBoundingClientRect().width);
      console.log(`    Tab 1 synced width after Tab 2 expanded: ${tab1SyncedWidth}px`);
      if (Math.round(tab1SyncedWidth) !== 260) {
        throw new Error(`Tab 1 failed to synchronize state from Tab 2! Got ${tab1SyncedWidth}px`);
      }

      await tab2.close();
      return { tab1WidthAfterReturn, tab2InitialWidth, tab1SyncedWidth };
    }));

    // TEST C: Route Navigation Stability
    results.push(await logStep('TEST C: Route Navigation Stability Across 5 Pages', async () => {
      const sidebar = page.locator('aside[aria-label="Application sidebar"]');
      
      // Collapse sidebar first to test that collapsed state NEVER resets to open during navigation
      await sidebar.locator('button[aria-label="Collapse sidebar"]').click();
      await page.waitForTimeout(300);

      const routesToVisit = [
        { name: 'Transactions', href: '/transactions' },
        { name: 'Budgets', href: '/budgets' },
        { name: 'Savings Goals', href: '/goals' },
        { name: 'Settings', href: '/settings' },
        { name: 'Dashboard', href: '/dashboard' },
      ];

      for (const route of routesToVisit) {
        // Click link inside nav
        const link = sidebar.locator('nav').locator(`a[href="${route.href}"]`).first();
        await link.click();
        await page.waitForURL(`**${route.href}`, { timeout: 10000 });

        // Immediately check width on navigation
        const width = await sidebar.evaluate(el => el.getBoundingClientRect().width);
        console.log(`    Navigated to ${route.href}: Sidebar width is ${width}px`);
        if (Math.round(width) !== 76) {
          throw new Error(`Sidebar reset to expanded on navigation to ${route.href}! Got ${width}px.`);
        }
      }

      return { visitedRoutes: routesToVisit.length, stableWidth: 76 };
    }));

    // TEST D: Direct Nested Route Cold Access & Reload
    results.push(await logStep('TEST D: Direct Nested Route Cold Access & Reload', async () => {
      // Direct navigation to nested route /simulator while collapsed
      await page.goto(`${WEB_BASE}/simulator`, { waitUntil: 'domcontentloaded' });
      const sidebar = page.locator('aside[aria-label="Application sidebar"]');
      
      const directLoadWidth = await sidebar.evaluate(el => el.getBoundingClientRect().width);
      console.log(`    Cold load of /simulator: Sidebar width is ${directLoadWidth}px`);
      if (Math.round(directLoadWidth) !== 76) {
        throw new Error(`Direct access to /simulator opened expanded! Got ${directLoadWidth}px`);
      }

      // Reload nested route
      await page.reload({ waitUntil: 'networkidle' });
      const reloadWidth = await sidebar.evaluate(el => el.getBoundingClientRect().width);
      console.log(`    Reload of /simulator: Sidebar width is ${reloadWidth}px`);
      if (Math.round(reloadWidth) !== 76) {
        throw new Error(`Reload of /simulator changed sidebar state! Got ${reloadWidth}px`);
      }

      return { directLoadWidth, reloadWidth };
    }));

    // TEST E: Mobile Drawer Independent Behavior
    results.push(await logStep('TEST E: Mobile Drawer Isolated Lifecycle', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${WEB_BASE}/dashboard`, { waitUntil: 'networkidle' });

      // 1. Verify drawer is closed on load
      const drawer = page.locator('div[role="dialog"][aria-label="Navigation drawer"]');
      const isDrawerVisibleInitially = await drawer.isVisible();
      if (isDrawerVisibleInitially) {
        throw new Error('Mobile drawer unexpectedly opened automatically on page load!');
      }

      // 2. Open drawer manually
      const hamburger = page.locator('button[aria-label="Open Navigation Menu" i]').first();
      await hamburger.click();
      await page.waitForTimeout(300);
      if (!(await drawer.isVisible())) {
        throw new Error('Mobile drawer did not open on hamburger click');
      }

      // 3. Navigate inside drawer to /transactions
      const txLink = drawer.locator('a[href="/transactions"]');
      await txLink.click();
      await page.waitForURL('**/transactions', { timeout: 10000 });
      await page.waitForTimeout(500);

      // Verify drawer closed automatically after navigation
      const isDrawerOpenAfterNav = await drawer.isVisible();
      if (isDrawerOpenAfterNav) {
        throw new Error('Mobile drawer remained open after navigating to /transactions!');
      }

      // 4. Reload page on mobile
      await page.reload({ waitUntil: 'networkidle' });
      const isDrawerOpenAfterReload = await drawer.isVisible();
      if (isDrawerOpenAfterReload) {
        throw new Error('Mobile drawer unexpectedly opened on page reload!');
      }

      // Restore desktop viewport
      await page.setViewportSize({ width: 1440, height: 900 });
      return { initialClosed: true, navClosed: true, reloadClosed: true };
    }));

    // TEST F: Theme Compatibility
    results.push(await logStep('TEST F: Theme Switch & Stability in Dark Mode', async () => {
      await page.goto(`${WEB_BASE}/dashboard`, { waitUntil: 'networkidle' });
      const sidebar = page.locator('aside[aria-label="Application sidebar"]');

      // Expand sidebar
      if (await sidebar.evaluate(el => el.classList.contains('w-[76px]'))) {
        await sidebar.locator('button[aria-label="Expand sidebar"]').click();
        await page.waitForTimeout(300);
      }

      // Switch to dark mode
      await sidebar.locator('button[aria-label="Switch to dark theme"]').click();
      await page.waitForTimeout(400);

      // Collapse in dark mode
      await sidebar.locator('button[aria-label="Collapse sidebar"]').click();
      await page.waitForTimeout(300);

      // Reload in dark mode
      await page.reload({ waitUntil: 'networkidle' });
      const darkReloadWidth = await sidebar.evaluate(el => el.getBoundingClientRect().width);
      const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));

      console.log(`    Dark mode reload: Width is ${darkReloadWidth}px, isDark: ${isDark}`);
      if (Math.round(darkReloadWidth) !== 76 || !isDark) {
        throw new Error(`Failed dark mode stability check: width ${darkReloadWidth}px, dark: ${isDark}`);
      }

      // Re-expand
      await sidebar.locator('button[aria-label="Expand sidebar"]').click();
      await page.waitForTimeout(300);

      return { darkReloadWidth, isDark };
    }));

    // TEST G: Browser Console Warnings & Hydration Errors Check
    results.push(await logStep('TEST G: Browser Console Hydration & Runtime Error Check', async () => {
      const hydrationErrors = consoleErrors.filter(e => 
        e.toLowerCase().includes('hydration') ||
        e.toLowerCase().includes('did not match') ||
        e.toLowerCase().includes('react-dom.development')
      );

      console.log(`    Total console errors recorded during all runs: ${consoleErrors.length}`);
      console.log(`    Hydration errors: ${hydrationErrors.length}`);

      if (hydrationErrors.length > 0) {
        console.error('    Hydration error details:', hydrationErrors);
        throw new Error(`Detected ${hydrationErrors.length} React hydration mismatch errors!`);
      }

      return { totalErrors: consoleErrors.length, hydrationErrors: 0 };
    }));

  } finally {
    await browser.close();
  }

  console.log('\n====================================================');
  console.log('              FINAL STABILITY SUMMARY               ');
  console.log('====================================================');
  const allPassed = results.every(r => r.pass);
  results.forEach(r => {
    console.log(`${r.pass ? '✓ PASS' : '✗ FAIL'} : ${r.name}`);
  });
  console.log('====================================================');
  console.log(`TOTAL: ${results.filter(r => r.pass).length}/${results.length} PASSED`);
  if (!allPassed) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Stability test run failed:', err);
  process.exit(1);
});
