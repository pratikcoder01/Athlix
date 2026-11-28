// Actual Next rewrite/browser cookie round-trips against a controlled backend.
// JWT signature/database/provider policy has separate server acceptance suites.
const assert = require('node:assert/strict');
const http = require('node:http');
const { chromium } = require('playwright');
const base = process.env.ATHLIX_E2E_BASE_URL || 'http://127.0.0.1:3100';
const upstream = process.env.AUTH_API_ORIGIN || 'http://127.0.0.1:5000';
if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname) || new URL(upstream).hostname !== '127.0.0.1') throw Error('Use isolated loopback origins');
const user = { id: '507f1f77bcf86cd799439011', name: 'Proxy Fixture', email: 'proxy@example.test', role: 'athlete' };
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const bounded = async promise => {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(Error('Timed out waiting for controlled auth request')), 10_000); })]); }
  finally { clearTimeout(timer); }
};
let browser, server, pendingGate;
(async () => {
  let credential, refreshes = 0, signOuts = 0, logoutRequests = 0, exchanges = 0, replays = 0, active = 0, maxActive = 0, failLogout = false, shortExpiry = false;
  const mutations = [];
  const access = () => `e30.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + (shortExpiry ? 120 : 900) })).toString('base64url')}.browser-fixture`;
  server = http.createServer((req, res) => {
    const send = (status, payload, cookie) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...(cookie ? { 'Set-Cookie': cookie } : {}) }); res.end(JSON.stringify(payload)); };
    const clear = 'athlix-refresh=; Max-Age=0; HttpOnly; SameSite=Lax; Path=/';
    if (!req.url.startsWith('/api/auth/')) return send(404, { success: false });
    assert.equal(req.method, 'POST'); assert.equal(req.headers.origin, new URL(base).origin);
    const incoming = req.headers.cookie?.match(/(?:^|;\s*)athlix-refresh=([^;]+)/)?.[1];
    if (req.url === '/api/auth/firebase') {
      let body = ''; req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        assert.equal(typeof JSON.parse(body).idToken, 'string'); mutations.push('sign-in'); exchanges++;
        credential = `explicit-${exchanges}`;
        send(200, { success: true, token: access(), user }, `athlix-refresh=${credential}; HttpOnly; SameSite=Lax; Path=/`);
      });
      return;
    }
    assert.equal(req.headers['x-athlix-session'], '1');
    if (req.url === '/api/auth/session') {
      if (!incoming) return send(401, { success: false }, clear);
      if (!credential || incoming !== credential) { replays++; credential = null; return send(401, { success: false }, clear); }
      refreshes++; active++; maxActive = Math.max(maxActive, active);
      const rotated = credential = `rotated-${refreshes}`;
      const complete = () => { active--; send(200, { success: true, token: access(), user }, `athlix-refresh=${rotated}; HttpOnly; SameSite=Lax; Path=/`); };
      if (pendingGate) { const gate = pendingGate; pendingGate = null; gate.started.resolve(); gate.release.promise.then(complete); }
      else setTimeout(complete, 75);
      return;
    }
    if (req.url === '/api/auth/logout') {
      logoutRequests++;
      if (failLogout) return send(503, { success: false });
      assert.equal(incoming, credential, 'Logout must use the latest rotated cookie');
      mutations.push('logout'); signOuts++; credential = null; return send(200, { success: true }, clear);
    }
    return send(404, { success: false });
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(Number(new URL(upstream).port || 80), '127.0.0.1', resolve); });
  browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) });
  for (const transport of ['broadcast', 'storage']) {
    credential = `initial-${transport}`; maxActive = 0; shortExpiry = false;
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
    try {
      await context.addInitScript(transport => {
        window.__sessionHints = [];
        if (transport === 'storage') Object.defineProperty(window, 'BroadcastChannel', { value: undefined });
        else {
          const NativeChannel = window.BroadcastChannel;
          window.BroadcastChannel = class extends NativeChannel {
            postMessage(value) { if (this.name === 'athlix-session-events') window.__sessionHints.push(value); super.postMessage(value); }
          };
        }
        const setItem = Storage.prototype.setItem;
        Storage.prototype.setItem = function(key, value) {
          if (key === 'athlix-session-event') window.__sessionHints.push(JSON.parse(value));
          return setItem.call(this, key, value);
        };
      }, transport);
      await context.addCookies([{ name: 'athlix-refresh', value: credential, url: base, httpOnly: true, sameSite: 'Lax' }]);
      await context.route('**/api/notifications?**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, notifications: [], unreadCount: 1, page: 1, hasMore: false }) }));
      const pages = await Promise.all([context.newPage(), context.newPage()]);
      for (const page of pages) { await page.routeWebSocket('**/socket.io/**', socket => socket.close()); await page.route('**/socket.io/**', route => route.abort()); }
      const signedIn = page => page.getByText('Signed in as Proxy Fixture.', { exact: false }).waitFor();
      const signedOut = page => page.getByRole('link', { name: 'Log in', exact: true }).waitFor();
      const sessionResponse = page => page.waitForResponse(response => new URL(response.url()).pathname === '/api/auth/session');
      const responses = await Promise.all(pages.map(page => page.goto(base + '/settings', { waitUntil: 'networkidle' })));
      assert.ok(responses.every(response => response.status() === 200)); await Promise.all(pages.map(signedIn));
      assert.equal(maxActive, 1, 'Two-tab bootstrap must serialize single-use cookie rotation'); assert.equal(replays, 0);
      for (const page of pages) {
        assert.equal(await page.evaluate(() => Boolean(navigator.locks)), true, 'This acceptance requires real browser Web Locks');
        assert.ok(!(await page.evaluate(() => document.cookie)).includes('athlix-refresh'));
        assert.equal(await page.evaluate(() => localStorage.getItem('athlix-auth')), null);
      }
      const freshRefreshes = refreshes;
      await Promise.all(pages.map(page => page.evaluate(() => window.dispatchEvent(new Event('focus')))));
      assert.equal(refreshes, freshRefreshes, 'Fresh focus must not rotate the cookie unnecessarily');
      shortExpiry = true;
      await Promise.all(pages.map(page => page.reload({ waitUntil: 'networkidle' }))); await Promise.all(pages.map(signedIn));
      const focused = pages.map(sessionResponse);
      await Promise.all(pages.map(page => page.evaluate(() => window.dispatchEvent(new Event('focus')))));
      assert.ok((await Promise.all(focused)).every(response => response.status() === 200)); assert.equal(maxActive, 1); assert.equal(replays, 0);
      failLogout = true;
      await pages[0].getByRole('button', { name: 'Log out', exact: true }).click();
      await pages[0].getByRole('alert').filter({ hasText: 'Server sign-out could not be confirmed' }).waitFor();
      await Promise.all(pages.map(signedIn));
      assert.ok((await context.cookies()).some(cookie => cookie.name === 'athlix-refresh'));
      assert.equal(await pages[0].evaluate(() => window.__sessionHints.length), 0, 'Failed logout must not invalidate another tab');
      failLogout = false;
      const gate = pendingGate = { started: deferred(), release: deferred() };
      const heldResponse = sessionResponse(pages[1]);
      const beforeLogout = logoutRequests;
      try {
        await pages[1].evaluate(() => window.dispatchEvent(new Event('focus'))); await bounded(gate.started.promise);
        await pages[0].getByRole('button', { name: 'Log out', exact: true }).click();
        assert.equal(await pages[0].getByRole('button', { name: 'Log out', exact: true }).isDisabled(), true);
        assert.equal(logoutRequests, beforeLogout, 'Logout cannot overtake a locked renewal');
      } finally { gate.release.resolve(); }
      assert.equal((await heldResponse).status(), 200);
      await Promise.all(pages.map(signedOut));
      assert.equal((await context.cookies()).filter(cookie => cookie.name === 'athlix-refresh').length, 0); assert.equal(replays, 0);
      for (const page of pages) {
        assert.equal(await page.getByText('Signed in as Proxy Fixture.', { exact: false }).count(), 0);
        assert.equal(await page.getByRole('link', { name: 'Notifications, 1 unread', exact: true }).count(), 0);
        for (const hint of await page.evaluate(() => window.__sessionHints)) { assert.deepEqual(Object.keys(hint).sort(), ['startedAt', 'type']); assert.equal(hint.type, 'signed-out'); assert.equal(typeof hint.startedAt, 'number'); }
        assert.equal(await page.evaluate(() => Object.values(localStorage).concat(Object.values(sessionStorage)).some(value => value.includes('browser-fixture') || value.includes('proxy@example.test'))), false);
      }
      assert.equal((await pages[0].evaluate(() => window.__sessionHints)).length, 1);
      await Promise.all(pages.map(page => page.reload({ waitUntil: 'networkidle' }))); await Promise.all(pages.map(signedOut));
      console.log(`PASS actual Next two-tab ${transport}: strict rotation, concurrent focus, failed logout, locked logout and peer invalidation`);
      if (transport === 'broadcast') {
        // Exercise the real anonymous-sign-in handler/SDK while keeping every
        // provider request synthetic. The API exchange still uses Next's rewrite.
        const now = Math.floor(Date.now() / 1000);
        const providerToken = `e30.${Buffer.from(JSON.stringify({ sub: 'browser-provider-fixture', iat: now, exp: now + 3600, auth_time: now, firebase: { identities: {}, sign_in_provider: 'anonymous' } })).toString('base64url')}.provider-fixture`;
        await context.route('https://identitytoolkit.googleapis.com/**', route => {
          const signup = route.request().url().includes('accounts:signUp');
          const payload = signup ? { localId: 'browser-provider-fixture', idToken: providerToken, refreshToken: 'synthetic-refresh', expiresIn: '3600', isNewUser: true }
            : { users: [{ localId: 'browser-provider-fixture', providerUserInfo: [], createdAt: String(now * 1000), lastLoginAt: String(now * 1000) }] };
          return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
        });
        await context.route('https://securetoken.googleapis.com/**', route => route.abort());
        credential = 'race-initial'; shortExpiry = true;
        await context.addCookies([{ name: 'athlix-refresh', value: credential, url: base, httpOnly: true, sameSite: 'Lax' }]);
        await pages[0].reload({ waitUntil: 'networkidle' }); await signedIn(pages[0]);
        shortExpiry = false;
        await pages[1].goto(base + '/login', { waitUntil: 'networkidle' });
        const loginGate = pendingGate = { started: deferred(), release: deferred() };
        const beforeExchange = exchanges;
        mutations.length = 0;
        try {
          await pages[0].evaluate(() => window.dispatchEvent(new Event('focus'))); await bounded(loginGate.started.promise);
          await pages[0].getByRole('button', { name: 'Log out', exact: true }).click();
          await pages[1].getByRole('button', { name: 'Sign in as guest', exact: true }).click();
          await pages[1].waitForFunction(async () => (await navigator.locks.query()).pending.filter(lock => lock.name === 'athlix-session').length >= 2);
          assert.equal(exchanges, beforeExchange, 'Explicit sign-in must also wait for the current session lock');
        } finally { loginGate.release.resolve(); }
        await pages[1].getByRole('button', { name: 'Log out', exact: true }).waitFor();
        assert.deepEqual(mutations, ['logout', 'sign-in']); assert.equal(exchanges, beforeExchange + 1);
        assert.equal((await context.cookies()).find(cookie => cookie.name === 'athlix-refresh')?.value, credential);
        await pages[1].goto(base + '/settings', { waitUntil: 'networkidle' }); await signedIn(pages[1]);
        assert.equal(replays, 0);
        console.log('PASS actual guest sign-in queued after renewal/logout preserves the fresh cookie and survives reload');
      }
    } finally { await context.close(); }
  }
  assert.equal(signOuts, 3);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  pendingGate?.release.resolve();
  if (browser) await browser.close(); if (server) await new Promise(resolve => server.close(resolve));
});
