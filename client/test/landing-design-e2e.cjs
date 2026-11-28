// Real compiled UI and interactions; identity is an isolated anonymous fixture.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
const { installSession } = require('./helpers/auth-fixture.cjs');
const base = process.env.ATHLIX_E2E_BASE_URL || 'http://127.0.0.1:3100';
if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(base).hostname)) throw Error('Use an isolated loopback app');
const output = process.env.ATHLIX_UI_ARTIFACT_DIR
  ? path.resolve(process.env.ATHLIX_UI_ARTIFACT_DIR)
  : path.resolve(__dirname, '../../../.task-tools/screenshots/dojo-ui');
let browser;
(async () => {
  await fs.mkdir(output, { recursive: true });
  browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) });
  const errors = [], fontRequests = [], unexpectedWrites = [];
  for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 1000 } });
    await installSession(context, null);
    await context.route(/^https?:\/\/fonts\.(?:googleapis|gstatic)\.com(?:\/|$)/, route => route.abort());
    await context.addInitScript(theme => localStorage.setItem('athlix-theme-storage', JSON.stringify({ state: { theme }, version: 0 })), theme);
    const page = await context.newPage();
    const localFontResponses = new Map();
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      if (/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(request.url())) fontRequests.push(request.url());
      const url = new URL(request.url());
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method()) && url.pathname !== '/api/auth/session') unexpectedWrites.push(url.pathname);
    });
    page.on('response', response => {
      const url = new URL(response.url());
      if (url.origin === new URL(base).origin && /^\/_next\/static\/media\/[^/]+\.woff2$/.test(url.pathname)) {
        localFontResponses.set(url.pathname, response.status());
      }
    });
    const response = await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 });
    assert.equal(response.status(), 200);
    await page.waitForFunction(theme => document.documentElement.style.colorScheme === theme, theme);
    await page.getByRole('heading', { level: 1, name: /More time on the mat/ }).waitFor();
    assert.equal(await page.getByRole('main').count(), 1);
    assert.equal(await page.locator('canvas').count(), 0, 'The landing preview uses lightweight SVG');
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains('lenis')), false, 'Native scrolling remains available');

    const telemetry = page.getByRole('region', { name: /KATA POSE HEURISTIC/ });
    await telemetry.getByText('Illustrative sample · no video processed', { exact: true }).waitFor();
    const guard = await telemetry.locator('dl').first().locator('dd').allTextContents();
    assert.equal(guard.length, 3);
    await telemetry.getByRole('button', { name: 'Stance sample', exact: true }).click();
    assert.equal(await telemetry.getByRole('button', { name: 'Stance sample', exact: true }).getAttribute('aria-pressed'), 'true');
    assert.notDeepEqual(await telemetry.locator('dl').first().locator('dd').allTextContents(), guard, 'Changing pose changes the displayed geometry measurements');
    await telemetry.getByRole('button', { name: 'Guard sample', exact: true }).click();
    assert.deepEqual(await telemetry.locator('dl').first().locator('dd').allTextContents(), guard);
    await telemetry.getByText('Heuristic estimate only — not a validated measure of skill.', { exact: true }).waitFor();

    const access = page.getByRole('button', { name: /04 Review access/ });
    await access.focus(); await page.keyboard.press('Enter');
    await page.getByRole('region', { name: /04 Review access/ }).waitFor();
    assert.equal(await access.getAttribute('aria-pressed'), 'true');
    await page.getByRole('region', { name: /04 Review access/ }).getByText(/does not certify coaching qualifications/).waitFor();
    await page.getByRole('link', { name: 'See How It Works', exact: true }).click();
    await page.waitForURL(url => url.hash === '#how', { timeout: 10000 });
    assert.equal(new URL(page.url()).hash, '#how');
    await page.waitForFunction(() => scrollY > 0);
    assert.ok(await page.evaluate(() => scrollY > 0));
    const target = await page.locator('#how').boundingBox();
    const navigation = await page.getByRole('navigation', { name: 'Main navigation', exact: true }).boundingBox();
    assert.ok(target.y >= navigation.y + navigation.height && target.y <= navigation.y + navigation.height + 80,
      'Native anchor clears the fixed header without applying two scroll offsets');

    const question = page.getByRole('button', { name: 'What does the Kata Analyzer measure?', exact: true });
    await question.focus(); await page.keyboard.press('Space');
    const answer = page.getByRole('region', { name: 'What does the Kata Analyzer measure?', exact: true });
    await answer.getByText(/No independently validated accuracy figure/).waitFor();
    assert.equal(await question.getAttribute('aria-expanded'), 'true');
    await question.click();
    assert.equal(await question.getAttribute('aria-expanded'), 'false');
    await page.getByRole('button', { name: /01 Start with an account/ }).click();
    assert.equal(await page.getByRole('link', { name: 'View Product Status', exact: true }).getAttribute('href'), '/features');
    assert.equal(await page.getByRole('link', { name: 'Create Athlete Account', exact: true }).count(), 2, 'One hero action and one closing action');
    assert.equal(await page.locator('footer a[href="/signup"]').count(), 0, 'Footer does not add a duplicate CTA banner');
    await page.evaluate(() => document.fonts.ready);
    const fonts = await page.evaluate(async () => {
      const clean = value => value.trim().replace(/^(['"])(.*)\1$/, '$2');
      const definitions = [
        { variable: '--font-athlix-sans', weights: [400, 500, 600], selector: 'body' },
        { variable: '--font-athlix-mono', weights: [400, 500, 600], selector: '.font-mono' },
        { variable: '--font-athlix-display', weights: [600, 700, 800], selector: 'h1' },
      ];
      return await Promise.all(definitions.map(async definition => {
        const family = clean(getComputedStyle(document.documentElement).getPropertyValue(definition.variable).split(',')[0]);
        const usedFamily = clean(getComputedStyle(document.querySelector(definition.selector)).fontFamily.split(',')[0]);
        const weights = await Promise.all(definition.weights.map(async weight => {
          const faces = await document.fonts.load(`${weight} 16px "${family}"`, 'ATHLIX 0123456789');
          return { weight, loaded: faces.filter(face => clean(face.family) === family && face.status === 'loaded').length };
        }));
        return { variable: definition.variable, family, usedFamily, weights };
      }));
    });
    assert.equal(new Set(fonts.map(font => font.family)).size, 3, 'Body, display and telemetry use three distinct bundled font families');
    for (const font of fonts) {
      assert.ok(font.family, `${font.variable} must resolve to a font family`);
      assert.equal(font.usedFamily, font.family, `${font.variable} must be used by its actual UI text`);
      for (const weight of font.weights) assert.ok(weight.loaded > 0, `${font.variable} ${weight.weight} must load a real FontFace, not a system fallback`);
    }
    assert.ok(localFontResponses.size >= 3, 'All three bundled fonts must be requested from the application');
    assert.ok([...localFontResponses.values()].every(status => status === 200), 'Bundled font assets must load successfully');
    console.log('PASS bundled font loading', theme, { families: fonts.length, requestedWeights: fonts.reduce((count, font) => count + font.weights.length, 0), sameOriginWoff2Assets: localFontResponses.size });
    for (const width of [1440, 768, 360]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(() => scrollTo(0, 0));
      await page.waitForTimeout(80);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'No horizontal overflow at ' + width + ' in ' + theme);
      await page.screenshot({ path: path.join(output, 'landing-' + theme + '-' + width + '.png'), fullPage: true });
      await page.screenshot({ path: path.join(output, 'hero-' + theme + '-' + width + '.png') });
    }
    console.log('PASS landing telemetry, keyboard workflow/FAQ, native anchor, CTA hierarchy, bundled font weights and responsive screenshots', theme);
    await context.close();
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(fontRequests, [], 'Fonts are self-hosted at runtime');
  assert.deepEqual(unexpectedWrites, [], 'Illustrative controls never create data or send video');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); });
