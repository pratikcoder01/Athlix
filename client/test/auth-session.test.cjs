const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { test, beforeEach } = require('node:test');
const ts = require('typescript');
const { useAuthStore } = require('../src/store/authStore.ts');
const user = { id: '507f1f77bcf86cd799439011', name: 'Fixture Athlete', email: 'fixture@example.test', role: 'athlete' };
const filename = path.resolve(__dirname, '../src/lib/authSession.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const dependencyRequire = createRequire(filename);
// Execute the actual client module with controlled browser transport. The real
// Zustand store is retained; only network/lock/storage boundaries are injected.
function moduleFor(fetch, navigator = {}) {
  const removed = [];
  const context = vm.createContext({ exports: {}, require: name => name === '../store/authStore' ? { useAuthStore } : dependencyRequire(name),
    fetch, navigator, AbortSignal, atob, localStorage: { removeItem: key => removed.push(key) } });
  new vm.Script(compiled, { filename }).runInContext(context);
  return { ...context.exports, removed };
}
const response = (status = 200, token = 'fixture-new-token') => Response.json(status === 200 ? { success: true, token, user } : { success: false }, { status });
beforeEach(() => useAuthStore.getState().logout());

test('access state stays in memory and expiry decoding handles invalid values', () => {
  const f = moduleFor(() => { throw new Error('No network'); });
  useAuthStore.getState().setAuth(user, 'memory-only-token');
  assert.equal(useAuthStore.getState().token, 'memory-only-token'); assert.equal(f.removed.length, 0);
  assert.equal(f.accessExpiresAt(null), 0); assert.equal(f.accessExpiresAt('malformed'), 0);
  assert.equal(f.accessExpiresAt(`x.${Buffer.from(JSON.stringify({ exp: 100 })).toString('base64url')}.x`), 100000);
});
test('concurrent renewal is deduplicated and uses same-origin cookie authorization', async () => {
  let release, calls = 0;
  const f = moduleFor(async (url, init) => { calls++; assert.equal(url, '/api/auth/session'); assert.equal(init.credentials, 'include'); assert.equal(init.headers['X-ATHLIX-Session'], '1'); return new Promise(resolve => { release = resolve; }); });
  const first = f.renewSession(); const second = f.renewSession(); assert.equal(first, second); assert.equal(calls, 1);
  release(response()); assert.equal(await first, true); assert.equal(useAuthStore.getState().token, 'fixture-new-token');
});
test('a late unauthorized bootstrap cannot clear a newly authenticated identity', async () => {
  let release; const f = moduleFor(() => new Promise(resolve => { release = resolve; }));
  const pending = f.renewSession(); useAuthStore.getState().setAuth(user, 'fresh-login-token'); release(response(401));
  assert.equal(await pending, false); assert.equal(useAuthStore.getState().token, 'fresh-login-token');
});
test('a late successful renewal cannot restore an account after local sign-out', async () => {
  useAuthStore.getState().setAuth(user, 'initial-token');
  let release; const f = moduleFor(() => new Promise(resolve => { release = resolve; }));
  const pending = f.renewSession(); useAuthStore.getState().logout(); release(response());
  await pending; assert.equal(useAuthStore.getState().token, null);
});
test('unauthorized renewal clears the current account, while transport/server errors do not claim success', async () => {
  useAuthStore.getState().setAuth(user, 'initial-token');
  const denied = moduleFor(async () => response(401)); assert.equal(await denied.renewSession(), false); assert.equal(useAuthStore.getState().user, null);
  useAuthStore.getState().setAuth(user, 'still-valid-token');
  const failed = moduleFor(async () => response(503)); await assert.rejects(failed.renewSession(), /Unable to renew/); assert.equal(useAuthStore.getState().token, 'still-valid-token');
  const malformed = moduleFor(async () => Response.json({ success: true, token: '', user })); await assert.rejects(malformed.renewSession(), /unexpected session/);
});
test('failed server logout retains account state and successful logout clears legacy browser storage', async () => {
  useAuthStore.getState().setAuth(user, 'initial-token');
  const denied = moduleFor(async () => response(500)); await assert.rejects(denied.logoutSession(), /could not be confirmed/); assert.equal(useAuthStore.getState().token, 'initial-token');
  const success = moduleFor(async (url, init) => { assert.equal(url, '/api/auth/logout'); assert.equal(init.credentials, 'include'); return Response.json({ success: true }); });
  await success.logoutSession(); assert.equal(useAuthStore.getState().user, null); assert.deepEqual(success.removed, ['athlix-auth']);
});
test('global logout sends access authorization and Web Locks serializes cookie renewal', async () => {
  useAuthStore.getState().setAuth(user, 'current-access'); let locks = 0;
  const f = moduleFor(async (url, init) => {
    if (url.endsWith('logout-all')) { assert.equal(init.headers.Authorization, 'Bearer current-access'); return Response.json({ success: true }); }
    return response();
  }, { locks: { request: async (name, callback) => { assert.equal(name, 'athlix-session'); locks++; return await callback(); } } });
  await f.logoutSession(true); await f.renewSession(); assert.equal(locks, 1);
});
