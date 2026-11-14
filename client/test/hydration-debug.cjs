// Diagnostic only: full development React messages, without customer data or APIs.
const { chromium } = require('playwright');
const base = process.env.ATHLIX_E2E_BASE_URL || 'http://127.0.0.1:3101';
if (!['127.0.0.1','localhost','[::1]'].includes(new URL(base).hostname)) throw Error('Use an isolated loopback app');
let browser;
(async () => {
  browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) });
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => { const detail = `${page.url()}\n${error.stack || error.message}`; errors.push(detail); console.error(detail); });
  page.on('console', message => {
    if (message.type() === 'error' && /hydration|did not match|server rendered|server-rendered|HTML cannot|cannot be a descendant/i.test(message.text())) {
      errors.push(message.text()); console.error('HYDRATION CONSOLE', page.url(), message.text());
    }
  });
  for (let pass = 0; pass < 9; pass++) {
    for (const width of [360,768,1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ['/','/signup','/login','/pricing','/tournaments','/kata','/academies']) {
        console.log('Checking hydration', pass, width, route);
        await page.goto(base + route, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForFunction(() => ['dark','light'].includes(document.documentElement.style.colorScheme));
        if (errors.length) throw Error('Hydration diagnostics found a mismatch; full React diff is logged above');
      }
    }
  }
  console.log('PASS development hydration diagnostics');
})().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); });
