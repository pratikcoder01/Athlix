/**
 * Screenshot verification script for Athlix redesign
 * Run: node scripts/screenshot-verify.mjs
 */
import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'screenshots', 'after');
const BASE = process.env.BASE_URL || 'http://localhost:3000';

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
];

const PAGES = [
  '/',
  '/about',
  '/features',
  '/pricing',
  '/blog',
  '/login',
  '/signup',
  '/dashboard',
  '/tournaments',
  '/bookings',
  '/profile',
  '/coaches',
];

async function screenshotPage(page, route, viewport, outDir) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(800);
  const slug = route === '/' ? 'home' : route.slice(1).replace(/\//g, '-');
  const file = path.join(outDir, `${slug}-${viewport.name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  ✓ ${file}`);
}

async function bracketStates(page, outDir) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(600);

  await page.screenshot({ path: path.join(outDir, 'bracket-initial.png'), fullPage: false });
  console.log('  ✓ bracket-initial.png');

  // QF winner
  const qf1 = page.locator('text=Quarterfinal 1').first();
  await qf1.click();
  await page.locator('text=Thiago Valente').first().click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, 'bracket-mid-progression.png'), fullPage: false });
  console.log('  ✓ bracket-mid-progression.png');

  // Advance to champion — click through bracket
  await page.locator('text=Lucas Vianna').first().click();
  await page.locator('text=Derek Vance').first().click();
  await page.locator('text=Rodrigo Santos').first().click();
  await page.locator('text=Garrison Thorne').first().click();
  await page.locator('text=Mateo Brandao').first().click();
  await page.locator('text=Callum Pierce').first().click();
  await page.locator('text=Alastair Sinclair').first().click();
  await page.waitForTimeout(300);
  // SF
  await page.locator('text=Semifinal 1').first().click();
  await page.locator('text=Thiago Valente').nth(1).click();
  await page.locator('text=Garrison Thorne').nth(1).click();
  await page.waitForTimeout(300);
  // Finals
  await page.locator('text=Championship Final').first().click();
  await page.locator('text=Thiago Valente').last().click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, 'bracket-champion-crowned.png'), fullPage: false });
  console.log('  ✓ bracket-champion-crowned.png');
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('\n📸 Page screenshots...');
  for (const vp of VIEWPORTS) {
    console.log(`\n[${vp.name} ${vp.width}px]`);
    for (const route of PAGES) {
      try {
        await screenshotPage(page, route, vp, OUT);
      } catch (e) {
        console.error(`  ✗ ${route} @ ${vp.name}: ${e.message}`);
      }
    }
  }

  console.log('\n🏆 Bracket states...');
  try {
    await bracketStates(page, OUT);
  } catch (e) {
    console.error(`  ✗ Bracket states: ${e.message}`);
  }

  await browser.close();
  console.log(`\nDone. Screenshots in ${OUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
