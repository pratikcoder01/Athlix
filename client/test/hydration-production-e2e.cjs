// Production Flight chunk timing regression. The static mode serves the actual
// prerendered HTML/assets through Playwright interception without a listener.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
const { installSession } = require('./helpers/auth-fixture.cjs');
const { captureHydrationDiagnostics, installHydrationDiagnostics, instrumentHydrationFailure } = require('./helpers/hydration-diagnostics.cjs');

const base = process.env.ATHLIX_E2E_BASE_URL || 'http://127.0.0.1:3100';
const origin = new URL(base).origin;
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname), 'Use an isolated loopback fixture');
const passes = Number(process.env.ATHLIX_HYDRATION_PASSES || 3);
assert.ok(Number.isInteger(passes) && passes >= 1 && passes <= 9);
const clientRoot = path.resolve(__dirname, '..');
const buildRoot = process.env.ATHLIX_STATIC_BUILD ? path.resolve(clientRoot, process.env.ATHLIX_STATIC_BUILD) : null;
const instrument = process.env.ATHLIX_HYDRATION_DIAGNOSTICS === '1';
const contentTypes = { '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.html': 'text/html', '.rsc': 'text/x-component' };
let browser;

(async () => {
  browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) });
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  let seed = 418;
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) return route.abort();
    if (!buildRoot) return route.fallback();
    let root = clientRoot, relative;
    if (url.pathname.startsWith('/_next/static/')) { root = buildRoot; relative = decodeURIComponent(url.pathname.slice('/_next/'.length)); }
    else if (url.pathname === '/_next/image') relative = path.join('public', url.searchParams.get('url') || '/logo.png');
    else if (route.request().resourceType() === 'document') { root = buildRoot; relative = path.join('server/app', url.pathname === '/' ? 'index.html' : url.pathname.slice(1) + '.html'); }
    else if (url.searchParams.has('_rsc')) { root = buildRoot; relative = path.join('server/app', url.pathname === '/' ? 'index.rsc' : url.pathname.slice(1) + '.rsc'); }
    else relative = path.join('public', decodeURIComponent(url.pathname));
    const file = path.resolve(root, relative);
    assert.ok(file.startsWith(root + path.sep), 'Fixture paths must stay within their build/public directory');
    let body;
    try { body = await fs.readFile(file); } catch { return route.fulfill({ status: 404, body: 'Fixture missing' }); }
    if (instrument && file.endsWith('.js')) body = instrumentHydrationFailure(body.toString()).source;
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    await new Promise(resolve => setTimeout(resolve, Math.floor((seed >>> 0) / 4294967296 * 90)));
    return route.fulfill({ status: 200, contentType: contentTypes[path.extname(file)] || 'application/octet-stream', body });
  });
  await installSession(context, null);
  if (buildRoot) await captureHydrationDiagnostics(context);
  else await installHydrationDiagnostics(context, { jitterMs: 90, instrument });
  await context.addInitScript(() => {
    // Retain the first parsed page/frame nodes, before React can replace them.
    const observer = new MutationObserver(() => {
      const frame = document.querySelector('[data-page-transition]');
      const main = frame?.querySelector('main');
      if (!globalThis.__athlixSSRFrame && frame) globalThis.__athlixSSRFrame = frame;
      if (!globalThis.__athlixSSRMain && main) globalThis.__athlixSSRMain = main;
    });
    observer.observe(document, { childList: true, subtree: true });
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.stack || error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /hydration|did not match|server rendered|server-rendered|HTML cannot|cannot be a descendant/i.test(message.text())) errors.push(message.text());
  });
  let visits = 0;
  for (let pass = 0; pass < passes; pass++) {
    for (const width of [360, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const target of ['/', '/signup', '/login', '/pricing', '/tournaments', '/kata', '/academies']) {
        await page.goto(base + target, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForFunction(() => ['dark', 'light'].includes(document.documentElement.style.colorScheme));
        const result = await page.evaluate(() => ({
          frameReused: globalThis.__athlixSSRFrame === document.querySelector('[data-page-transition]'),
          mainReused: !!globalThis.__athlixSSRMain && globalThis.__athlixSSRMain === document.querySelector('[data-page-transition] main'),
          framePresent: !!document.querySelector('[data-page-transition]'),
          mainPresent: !!document.querySelector('[data-page-transition] main'),
          diagnostics: globalThis.__athlixHydrationDiagnostics,
        }));
        assert.deepEqual(errors, [], `${target} at ${width}px: ${JSON.stringify(result.diagnostics)}`);
        assert.ok(result.frameReused && result.mainReused, `${target} at ${width}px must reuse the original prerendered frame and main: ${JSON.stringify(result)}`);
        visits++;
      }
    }
    console.log(`PASS production hydration pass ${pass + 1}, ${visits} visits with delayed chunks and original SSR nodes retained`);
  }
  await context.close();
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); });
