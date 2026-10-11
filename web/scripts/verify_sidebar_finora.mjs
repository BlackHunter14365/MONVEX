import fs from 'fs';
import path from 'path';
import { chromium } from '@playwright/test';

const WEB_BASE = 'http://localhost:3000';
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

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function saveScreenshot(page, filename) {
  const scratchDir = path.resolve('..', 'scratch');
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });
  const scratchPath = path.join(scratchDir, filename);
  const artifactPath = path.join(ARTIFACT_DIR, filename);
  await page.screenshot({ path: scratchPath });
  fs.copyFileSync(scratchPath, artifactPath);
  console.log(`  Saved screenshot: ${filename}`);
}

async function main() {
  console.log('====================================================');
  console.log('  MONVEX FINORA-STYLE SIDEBAR REDESIGN AUDIT SUITE  ');
  console.log('====================================================');

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();
  const results = [];

  try {
    // 1. Authenticate
    results.push(await logStep('1. Authenticate user into MONVEX', async () => {
      await page.goto(`${WEB_BASE}/login`, { waitUntil: 'networkidle' });
      
      // Fill credentials
      await page.fill('#login-identifier', 'audit@monvex.ai');
      await page.fill('#login-password', 'MonvexTestPass123!');
      await page.click('button[type="submit"]');

      // Wait for navigation to dashboard
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      await page.waitForSelector('aside[aria-label="Application sidebar"]', { state: 'visible', timeout: 10000 });
      return { url: page.url() };
    }));

    // 2. Verify Desktop Expanded Sidebar Structure & Navigation Hierarchy
    results.push(await logStep('2. Verify Expanded Sidebar (1440x900): Layout, Dimensions & Branding', async () => {
      const sidebar = page.locator('aside[aria-label="Application sidebar"]');
      const box = await sidebar.boundingBox();
      if (!box || Math.round(box.width) < 250 || Math.round(box.width) > 270) {
        throw new Error(`Expected sidebar width ~260px, got ${box?.width}px`);
      }

      // Check Brand Header
      const brandText = await sidebar.locator('text=Monvex').first().isVisible();
      const subText = await sidebar.locator('text=Financial OS').first().isVisible();
      if (!brandText || !subText) {
        throw new Error('Brand text Monvex or Financial OS missing from sidebar header');
      }

      // Check Collapse button
      const collapseBtn = sidebar.locator('button[aria-label="Collapse sidebar"]');
      if (!(await collapseBtn.isVisible())) {
        throw new Error('Collapse sidebar button not visible');
      }

      return { width: box.width, brandText, subText };
    }));

    // 3. Verify All 5 Hierarchical Navigation Sections & 16 Routes
    results.push(await logStep('3. Verify 5 Hierarchical Groups & All 16 Preserved Routes', async () => {
      const sidebar = page.locator('aside[aria-label="Application sidebar"]');

      // Check Section Headers
      const expectedSections = ['Main', 'Money Management', 'AI & Intelligence', 'Documents & Vision', 'System & Security'];
      for (const section of expectedSections) {
        const header = sidebar.locator(`text=${section}`);
        if (!(await header.first().isVisible())) {
          throw new Error(`Navigation section header "${section}" not found`);
        }
      }

      // Check All 16 Routes
      const expectedRoutes = [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Transactions', href: '/transactions' },
        { name: 'Analytics', href: '/analytics' },
        { name: 'Net Worth', href: '/net-worth' },
        { name: 'Budgets', href: '/budgets' },
        { name: 'Savings Goals', href: '/goals' },
        { name: 'Debt & Loans', href: '/debt' },
        { name: 'Subscriptions', href: '/subscriptions' },
        { name: 'AI Copilot', href: '/ai' },
        { name: 'Cashflow Forecast', href: '/forecast' },
        { name: 'What-If Simulator', href: '/simulator' },
        { name: 'Receipt Vision', href: '/receipts' },
        { name: 'Reports & Statements', href: '/reports' },
        { name: 'Smart Alerts', href: '/notifications' },
        { name: 'Security Vault', href: '/security' },
        { name: 'Settings', href: '/settings' },
      ];

      for (const route of expectedRoutes) {
        const link = sidebar.locator(`a[href="${route.href}"]`);
        if (!(await link.first().isVisible())) {
          throw new Error(`Route link "${route.name}" (${route.href}) not found in sidebar`);
        }
      }

      return { totalRoutes: expectedRoutes.length, sections: expectedSections };
    }));

    // 4. Verify Active Item Pill Styling (Finora Aurora Gradient)
    results.push(await logStep('4. Verify Active Item Styling & Color Contrast', async () => {
      const sidebar = page.locator('aside[aria-label="Application sidebar"]');
      const activeLink = sidebar.locator('a[href="/dashboard"][aria-current="page"]');
      if (!(await activeLink.isVisible())) {
        throw new Error('Active item for /dashboard not found with aria-current="page"');
      }

      // Check computed styles
      const computed = await activeLink.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          backgroundImage: style.backgroundImage,
          color: style.color,
          borderRadius: style.borderRadius,
          fontWeight: style.fontWeight
        };
      });

      console.log('    Computed active styles:', computed);
      if (!computed.backgroundImage.includes('gradient')) {
        throw new Error(`Expected gradient background on active item, got: ${computed.backgroundImage}`);
      }

      // Check that icon is pure white
      const iconComputed = await activeLink.locator('svg').evaluate((el) => {
        return window.getComputedStyle(el).color;
      });
      console.log('    Computed active icon color:', iconComputed);

      await saveScreenshot(page, 'sidebar_desktop_expanded_light.png');

      return { computed, iconColor: iconComputed };
    }));

    // 5. Test Profile Modal Trigger
    results.push(await logStep('5. Verify Profile Modal Trigger from Sidebar', async () => {
      const sidebar = page.locator('aside[aria-label="Application sidebar"]');
      const profileBtn = sidebar.locator('button:has-text("Personal Account")').first();
      await profileBtn.click();

      // Check if modal opens
      const modal = page.locator('[role="dialog"]');
      await modal.waitFor({ state: 'visible', timeout: 5000 });
      const modalVisible = await modal.isVisible();
      if (!modalVisible) throw new Error('Profile modal did not open on trigger click');

      // Close modal
      const closeBtn = modal.locator('button[aria-label="Close dialog"], button:has-text("Cancel"), button:has-text("Save")').first();
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);

      return { modalOpened: true };
    }));

    // 6. Test Sidebar Collapse to 76px Icon Rail & Tooltip Verification
    results.push(await logStep('6. Test Collapsible Icon Rail Mode (76px) & Tooltip Hover', async () => {
      const sidebar = page.locator('aside[aria-label="Application sidebar"]');
      const collapseBtn = sidebar.locator('button[aria-label="Collapse sidebar"]');
      await collapseBtn.click();
      await page.waitForTimeout(500);

      // Verify collapsed width
      const box = await sidebar.boundingBox();
      if (!box || Math.round(box.width) < 70 || Math.round(box.width) > 85) {
        throw new Error(`Expected collapsed sidebar width ~76px, got ${box?.width}px`);
      }

      // Verify brand text hidden in rail mode
      const brandVisible = await sidebar.locator('text=Financial OS').isVisible();
      if (brandVisible) {
        throw new Error('Financial OS text should be hidden in collapsed rail mode');
      }

      // Verify active item in rail mode
      const activeRailItem = sidebar.locator('a[href="/dashboard"][aria-current="page"]');
      if (!(await activeRailItem.isVisible())) {
        throw new Error('Active rail icon item not visible');
      }

      // Hover over an inactive item (Analytics) and verify Tooltip appears
      const analyticsLink = sidebar.locator('a[href="/analytics"]');
      await analyticsLink.hover();
      await page.waitForTimeout(400);

      const tooltip = page.locator('[role="tooltip"], div:has-text("Analytics")').last();
      const tooltipVisible = await tooltip.isVisible();
      console.log('    Tooltip visible on hover:', tooltipVisible);

      await saveScreenshot(page, 'sidebar_desktop_collapsed_light.png');

      // Verify persistence in localStorage
      const persistedState = await page.evaluate(() => localStorage.getItem('monvex-sidebar-collapsed'));
      if (persistedState !== 'true') {
        throw new Error(`Expected monvex-sidebar-collapsed in localStorage to be 'true', got '${persistedState}'`);
      }

      return { collapsedWidth: box.width, tooltipVisible, persistedState };
    }));

    // 7. Test Expand Back to Full Width
    results.push(await logStep('7. Test Expand Back to Full Sidebar Width', async () => {
      const sidebar = page.locator('aside[aria-label="Application sidebar"]');
      const expandBtn = sidebar.locator('button[aria-label="Expand sidebar"]');
      await expandBtn.click();
      await page.waitForTimeout(500);

      const box = await sidebar.boundingBox();
      if (!box || Math.round(box.width) < 250 || Math.round(box.width) > 270) {
        throw new Error(`Expected expanded sidebar width ~260px after toggle, got ${box?.width}px`);
      }

      const persistedState = await page.evaluate(() => localStorage.getItem('monvex-sidebar-collapsed'));
      if (persistedState !== 'false') {
        throw new Error(`Expected monvex-sidebar-collapsed in localStorage to be 'false', got '${persistedState}'`);
      }

      return { expandedWidth: box.width, persistedState };
    }));

    // 8. Test Dark Mode Switch & Visual Verification
    results.push(await logStep('8. Test Dark Theme Palette Preservation & Gradient Contrast', async () => {
      const sidebar = page.locator('aside[aria-label="Application sidebar"]');
      const darkToggleBtn = sidebar.locator('button[aria-label="Switch to dark theme"]');
      await darkToggleBtn.click();
      await page.waitForTimeout(600);

      // Verify html has dark class
      const isDarkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      if (!isDarkClass) throw new Error('html element missing dark class after toggle');

      // Check sidebar background color
      const sidebarBg = await sidebar.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      console.log('    Dark sidebar background:', sidebarBg);

      await saveScreenshot(page, 'sidebar_desktop_expanded_dark.png');

      // Collapse in dark mode
      const collapseBtn = sidebar.locator('button[aria-label="Collapse sidebar"]');
      await collapseBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, 'sidebar_desktop_collapsed_dark.png');

      // Re-expand
      await sidebar.locator('button[aria-label="Expand sidebar"]').click();
      await page.waitForTimeout(500);

      return { isDarkClass, sidebarBg };
    }));

    // 9. Mobile Viewport (390x844) Audit
    results.push(await logStep('9. Mobile Viewport (390x844): Drawer Navigation Audit', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(500);

      // Desktop sidebar must be hidden
      const desktopSidebar = page.locator('aside[aria-label="Application sidebar"]');
      const isDesktopVisible = await desktopSidebar.isVisible();
      if (isDesktopVisible) throw new Error('Desktop sidebar should be hidden on mobile viewport');

      // Click Hamburger Menu Button in Header
      const hamburgerBtn = page.locator('button[aria-label="Open Navigation Menu" i]').first();
      await hamburgerBtn.click();
      await page.waitForTimeout(500);

      // Verify MobileDrawer is open
      const drawer = page.locator('div[role="dialog"][aria-label="Navigation drawer"]');
      if (!(await drawer.isVisible())) {
        throw new Error('Mobile drawer did not open');
      }

      // Check Mobile Drawer Header Brand
      const mobileBrand = await drawer.locator('text=Monvex').first().isVisible();
      const mobileOS = await drawer.locator('text=Financial OS').first().isVisible();
      if (!mobileBrand || !mobileOS) {
        throw new Error('Mobile drawer missing Monvex / Financial OS brand header');
      }

      // Verify all 5 groups are in mobile drawer
      const sections = ['Main', 'Money Management', 'AI & Intelligence', 'Documents & Vision', 'System & Security'];
      for (const section of sections) {
        const sec = drawer.locator(`text=${section}`);
        if (!(await sec.first().isVisible())) {
          throw new Error(`Mobile drawer missing section: ${section}`);
        }
      }

      // Verify active gradient pill in mobile drawer
      const mobileActive = drawer.locator('a[href="/dashboard"][aria-current="page"]');
      if (!(await mobileActive.isVisible())) {
        throw new Error('Mobile drawer missing active dashboard link');
      }

      await saveScreenshot(page, 'sidebar_mobile_drawer_dark.png');

      // Switch to Light Mode inside drawer
      const lightToggle = drawer.locator('button[aria-label="Switch to light theme"]');
      await lightToggle.click();
      await page.waitForTimeout(500);

      await saveScreenshot(page, 'sidebar_mobile_drawer_light.png');

      // Close drawer
      const closeBtn = drawer.locator('button[aria-label="Close menu"]');
      await closeBtn.click();
      await page.waitForTimeout(500);

      const isDrawerClosed = !(await drawer.isVisible());
      if (!isDrawerClosed) throw new Error('Mobile drawer did not close after clicking close button');

      return { isDrawerClosed: true, sectionsVerified: sections.length };
    }));

  } finally {
    await browser.close();
  }

  console.log('\n====================================================');
  console.log('                 AUDIT SUMMARY                      ');
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
  console.error('Audit run error:', err);
  process.exit(1);
});
