import { chromium } from 'playwright';
import path from 'path';

async function captureScreenshots() {
  console.log('📸 Capturing screenshots of completeness and legal pages...');
  const artifactDir = 'C:\\Users\\Demon68\\.gemini\\antigravity\\brain\\5a359b5f-f310-4a2c-8b10-1d3556e47689';
  
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  } catch {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  }

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  const baseUrl = 'http://localhost:3000';

  const screenshots = [
    { url: `${baseUrl}/nonexistent-page-demo`, filename: 'monvex_404_not_found.png', dark: false },
    { url: `${baseUrl}/privacy-policy`, filename: 'monvex_privacy_policy.png', dark: false },
    { url: `${baseUrl}/terms-of-service`, filename: 'monvex_terms_of_service.png', dark: false },
    { url: `${baseUrl}/cookie-policy`, filename: 'monvex_cookie_policy.png', dark: false },
    { url: `${baseUrl}/financial-disclaimer`, filename: 'monvex_financial_disclaimer.png', dark: false },
    { url: `${baseUrl}/about`, filename: 'monvex_about_page.png', dark: false },
    { url: `${baseUrl}/security-overview`, filename: 'monvex_security_overview.png', dark: false },
    { url: `${baseUrl}/help`, filename: 'monvex_help_center.png', dark: false },
    { url: `${baseUrl}/contact`, filename: 'monvex_contact_support.png', dark: false },
  ];

  for (const s of screenshots) {
    console.log(`Capturing ${s.filename}...`);
    await page.goto(s.url, { waitUntil: 'networkidle' });
    if (s.dark) {
      await page.evaluate(() => document.documentElement.classList.add('dark'));
    }
    await page.waitForTimeout(400);
    const savePath = path.join(artifactDir, s.filename);
    await page.screenshot({ path: savePath, fullPage: false });
    console.log(`Saved: ${savePath}`);
  }

  // Also capture 404 in dark mode
  await page.goto(`${baseUrl}/nonexistent-page-demo`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(artifactDir, 'monvex_404_not_found_dark.png'), fullPage: false });
  console.log(`Saved: monvex_404_not_found_dark.png`);

  await browser.close();
  console.log('✅ All screenshots captured.');
}

captureScreenshots();
