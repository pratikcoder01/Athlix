// Automated WCAG checks are a regression baseline, not full accessibility certification.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;
const { installSession } = require('./helpers/auth-fixture.cjs');
const base = process.env.ATHLIX_E2E_BASE_URL || 'http://127.0.0.1:3100';
if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname)) throw Error('Use an isolated loopback app');
let browser;
(async () => {
  browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) });
  const errors = [], externalFontRequests = [];
  for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
    await installSession(context, null);
    await context.addInitScript(theme => localStorage.setItem('athlix-theme-storage', JSON.stringify({ state: { theme }, version: 0 })), theme);
    const page = await context.newPage();
    page.on('request', request => { if (/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(request.url())) externalFontRequests.push(request.url()); });
    page.on('pageerror', error => errors.push({ theme, message: error.message }));
    for (const path of ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/coaches', '/academies', '/tournaments', '/training', '/clients', '/notifications', '/feed', '/settings']) {
      const response = await page.goto(base + path, { waitUntil: 'networkidle', timeout: 60000 });
      assert.equal(response.status(), 200, `Unexpected server response at ${path} (${theme})`);
      await page.waitForFunction(theme => document.documentElement.style.colorScheme === theme, theme);
      assert.equal(await page.getByRole('main').count(), 1, `Expected one main landmark at ${path} (${theme})`);
      assert.equal(await page.getByRole('heading', { level: 1 }).count(), 1, `Expected one page heading at ${path} (${theme})`);
      assert.equal(await page.locator('a button, a [role="button"], a [tabindex="0"]').count(), 0,
        `Links must have a single keyboard target at ${path} (${theme})`);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const violations = results.violations.map(rule => ({ id: rule.id, impact: rule.impact,
        nodes: rule.nodes.map(node => ({ target: node.target, failureSummary: node.failureSummary })) }));
      assert.deepEqual(violations, [], `Accessibility violations at ${path} (${theme})`);
      for (const width of [360, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(80);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${path} overflows at ${width} (${theme})`);
      }
      console.log('PASS automated accessibility and responsive layout', theme, path);
    }
    await page.setViewportSize({ width: 360, height: 740 });
    await page.getByRole('button', { name: 'Open menu', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Navigation menu' }); await dialog.waitFor();
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Close menu');
    assert.ok(await dialog.getByRole('button', { name: 'Close menu' }).evaluate(node => node === document.activeElement), 'Drawer moves keyboard focus');
    await page.keyboard.press('Shift+Tab');
    await page.waitForFunction(() => {
      const links = document.querySelectorAll('[role="dialog"][aria-label="Navigation menu"] a');
      return links.length > 0 && document.activeElement === links[links.length - 1];
    });
    assert.ok(await dialog.locator('a').last().evaluate(node => node === document.activeElement), 'Drawer traps backward keyboard traversal');
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Open menu');
    assert.ok(await page.getByRole('button', { name: 'Open menu', exact: true }).evaluate(node => node === document.activeElement), 'Drawer restores keyboard focus');
    await context.close();
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(externalFontRequests, [], 'Fonts should be self-hosted, without browser requests to Google');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); });
