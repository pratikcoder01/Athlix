// Real Next rewrite/browser cookie round-trip against a controlled HTTP backend.
// Provider and database policy have separate integration suites.
const assert = require('node:assert/strict');
const http = require('node:http');
const { chromium } = require('playwright');
const base = process.env.ATHLIX_E2E_BASE_URL || 'http://127.0.0.1:3100';
const upstream = process.env.AUTH_API_ORIGIN || 'http://127.0.0.1:5000';
if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname) || new URL(upstream).hostname !== '127.0.0.1') throw Error('Use isolated loopback origins');
let browser, server;
(async () => {
  let refreshes = 0, signOuts = 0;
  server = http.createServer((req, res) => {
    const send = (status, payload, cookie) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...(cookie ? { 'Set-Cookie': cookie } : {}) }); res.end(JSON.stringify(payload)); };
    if (!req.url.startsWith('/api/auth/')) return send(404, { success: false });
    assert.equal(req.method, 'POST'); assert.equal(req.headers.origin, new URL(base).origin); assert.equal(req.headers['x-athlix-session'], '1');
    if (req.url === '/api/auth/session') {
      if (!req.headers.cookie?.includes('athlix-refresh=')) return send(401, { success: false });
      refreshes++;
      return send(200, { success: true, token: 'proxy-fixture-token', user: { id: '507f1f77bcf86cd799439011', name: 'Proxy Fixture', email: 'proxy@example.test', role: 'athlete' } }, `athlix-refresh=rotated-${refreshes}; HttpOnly; SameSite=Lax; Path=/`);
    }
    if (req.url === '/api/auth/logout') { signOuts++; return send(200, { success: true }, 'athlix-refresh=; Max-Age=0; HttpOnly; SameSite=Lax; Path=/'); }
    return send(404, { success: false });
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(Number(new URL(upstream).port || 80), '127.0.0.1', resolve); });
  browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) });
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  await context.addCookies([{ name: 'athlix-refresh', value: 'initial-controlled-cookie', url: base, httpOnly: true, sameSite: 'Lax' }]);
  await context.route('**/api/notifications?**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, notifications: [], unreadCount: 0, page: 1, hasMore: false }) }));
  const page = await context.newPage();
  await page.routeWebSocket('**/socket.io/**', socket => socket.close()); await page.route('**/socket.io/**', route => route.abort());
  let response = await page.goto(base + '/settings', { waitUntil: 'networkidle' }); assert.equal(response.status(), 200);
  await page.getByText('Signed in as Proxy Fixture.', { exact: false }).waitFor();
  assert.ok(!(await page.evaluate(() => document.cookie)).includes('athlix-refresh'), 'Refresh cookie must be inaccessible to scripts');
  assert.equal(await page.evaluate(() => localStorage.getItem('athlix-auth')), null);
  const first = refreshes;
  response = await page.reload({ waitUntil: 'networkidle' }); assert.equal(response.status(), 200);
  await page.getByText('Signed in as Proxy Fixture.', { exact: false }).waitFor(); assert.ok(refreshes > first);
  await page.getByRole('button', { name: 'Log out', exact: true }).click();
  await page.getByRole('link', { name: 'Log in', exact: true }).waitFor();
  assert.equal(signOuts, 1); assert.equal((await context.cookies()).filter(cookie => cookie.name === 'athlix-refresh').length, 0);
  await page.reload({ waitUntil: 'networkidle' }); await page.getByRole('link', { name: 'Log in', exact: true }).waitFor();
  console.log('PASS actual Next auth rewrite, HttpOnly cookie restore/rotation and logout');
  await context.close();
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); if (server) await new Promise(resolve => server.close(resolve)); });
