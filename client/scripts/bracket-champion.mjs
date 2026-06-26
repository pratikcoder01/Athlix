import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdir } from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'screenshots', 'after');

async function clickAthlete(page, name, index = 0) {
  await page.locator(`text=${name}`).nth(index).click();
  await page.waitForTimeout(220);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

  await page.screenshot({ path: path.join(OUT, 'home-hero-after.png') });

  await page.locator('text=Reset Bracket').click();
  await page.waitForTimeout(300);
  await page.locator('section').nth(2).scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);

  // QF winners (indices 0 = first occurrence each)
  await clickAthlete(page, 'Thiago Valente', 0);
  await clickAthlete(page, 'Derek Vance', 0);
  await clickAthlete(page, 'Garrison Thorne', 0);
  await clickAthlete(page, 'Callum Pierce', 0);

  // SF — Thiago appears in QF1 + SF1; Garrison in QF3 + SF2
  await clickAthlete(page, 'Thiago Valente', 1);
  await clickAthlete(page, 'Garrison Thorne', 1);

  // Finals — Thiago in SF1 + Finals
  await clickAthlete(page, 'Thiago Valente', 2);
  await page.waitForTimeout(1500);

  await page.locator('.hidden.md\\:block').screenshot({ path: path.join(OUT, 'bracket-champion-crowned.png') });
  console.log('Done');

  await browser.close();
}

main();
