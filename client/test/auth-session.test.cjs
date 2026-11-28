const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { test, beforeEach } = require('node:test');
const ts = require('typescript');
const authStore = require('../src/store/authStore.ts');
const { useAuthStore, sessionChangeTime } = authStore;
const user = { id: '507f1f77bcf86cd799439011', name: 'Fixture Athlete', email: 'fixture@example.test', role: 'athlete' };
const filename = path.resolve(__dirname, '../src/lib/authSession.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const dependencyRequire = createRequire(filename);
// Execute the actual client module with controlled browser transport. The real
// Zustand store is retained; only network/lock/storage boundaries are injected.
function moduleFor(fetch, navigator = {}, store = authStore) {
  const removed = [], events = [];
  const context = vm.createContext({ exports: {}, require: name => name === '../store/authStore' ? store
    : name === './sessionEvents' ? { publishSessionSignOut: startedAt => events.push({ type: 'signed-out', startedAt }) } : dependencyRequire(name),
    fetch, navigator, AbortSignal, atob, localStorage: { removeItem: key => removed.push(key) } });
  new vm.Script(compiled, { filename }).runInContext(context);
  return { ...context.exports, removed, events };
}
const response = (status = 200, token = 'fixture-new-token') => Response.json(status === 200 ? { success: true, token, user } : { success: false }, { status });
const storeFilename = path.resolve(__dirname, '../src/store/authStore.ts');
const storeSource = ts.transpileModule(fs.readFileSync(storeFilename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function storeForClock(clock) {
  // Execute the real store in a separate tab realm. Only its clock is controlled;
  // retaining a paused performance clock models browsers that stop it in sleep.
  const context = vm.createContext({ exports: {}, require: createRequire(storeFilename), Date: { now: () => clock.wallTime },
    performance: { timeOrigin: clock.timeOrigin, now: () => clock.performanceNow } });
  new vm.Script(storeSource, { filename: storeFilename }).runInContext(context);
  return context.exports;
}
const providerFilename = path.resolve(__dirname, '../src/context/AuthSessionProvider.tsx');
const providerSource = ts.transpileModule(fs.readFileSync(providerFilename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
function mountProvider(api) {
  let effect, signOutListener, message = '', retry; const timers = new Map(), listeners = new Map(); let nextTimer = 0;
  const context = vm.createContext({ exports: {}, require: name => {
    if (name === 'react') return { useEffect: callback => { effect = callback; }, useState: () => ['', value => { message = value; }], useRef: value => (retry = { current: value }) };
    if (name === 'react/jsx-runtime') return { jsx: () => null, jsxs: () => null, Fragment: Symbol() };
    if (name === '../store/authStore') return authStore;
    if (name === '../lib/authSession') return api;
    if (name === '../lib/sessionEvents') return { subscribeSessionSignOut: callback => { signOutListener = callback; return () => { signOutListener = null; }; } };
    return dependencyRequire(name);
  }, localStorage: { removeItem() {} }, window: { addEventListener: (name, callback) => listeners.set(name, callback), removeEventListener: name => listeners.delete(name) },
  setTimeout: (callback, delay) => { timers.set(++nextTimer, { callback, delay }); return nextTimer; }, clearTimeout: id => timers.delete(id) });
  new vm.Script(providerSource, { filename: providerFilename }).runInContext(context);
  context.exports.default({ children: null }); const cleanup = effect();
  return { timers, listeners, cleanup, retry: () => retry.current(), get message() { return message; }, get signOutListener() { return signOutListener; } };
}
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
  const denied = moduleFor(async () => response(500)); await assert.rejects(denied.logoutSession(), /could not be confirmed/); assert.equal(useAuthStore.getState().token, 'initial-token'); assert.equal(denied.events.length, 0);
  const success = moduleFor(async (url, init) => { assert.equal(url, '/api/auth/logout'); assert.equal(init.credentials, 'include'); return Response.json({ success: true }); });
  await success.logoutSession(); assert.equal(useAuthStore.getState().user, null); assert.deepEqual(success.removed, ['athlix-auth']);
  assert.deepEqual(Object.keys(success.events[0]), ['type', 'startedAt']); assert.equal(success.events[0].type, 'signed-out');
});
test('global logout sends access authorization and Web Locks serializes cookie renewal', async () => {
  useAuthStore.getState().setAuth(user, 'current-access'); let locks = 0;
  const f = moduleFor(async (url, init) => {
    if (url.endsWith('logout-all')) { assert.equal(init.headers.Authorization, 'Bearer current-access'); return Response.json({ success: true }); }
    return response();
  }, { locks: { request: async (name, callback) => { assert.equal(name, 'athlix-session'); locks++; return await callback(); } } });
  await f.logoutSession(true); await f.renewSession(); assert.equal(locks, 2);
});

test('rotation and logout share the lock, so a delayed renewal completes before sign-out', async () => {
  useAuthStore.getState().setAuth(user, 'initial-token');
  let release, queue = Promise.resolve(); const calls = [];
  const navigator = { locks: { request(name, callback) { assert.equal(name, 'athlix-session'); const result = queue.then(callback); queue = result.catch(() => {}); return result; } } };
  const f = moduleFor(async url => {
    calls.push(url);
    return url.endsWith('/session') ? new Promise(resolve => { release = resolve; }) : Response.json({ success: true });
  }, navigator);
  const renewal = f.renewSession(); const logout = f.logoutSession();
  await Promise.resolve(); assert.deepEqual(calls, ['/api/auth/session']);
  release(response()); await Promise.all([renewal, logout]);
  assert.deepEqual(calls, ['/api/auth/session', '/api/auth/logout']);
  assert.equal(useAuthStore.getState().token, null); assert.equal(f.events.length, 1);
});

test('delayed sign-out confirmation and peer hints cannot clear a newer explicit sign-in', async () => {
  useAuthStore.getState().setAuth(user, 'old-token');
  let release; const f = moduleFor(() => new Promise(resolve => { release = resolve; }));
  const startedAt = sessionChangeTime(); const pending = f.logoutSession();
  useAuthStore.getState().setAuth({ ...user, name: 'New Login' }, 'fresh-login');
  release(Response.json({ success: true })); await pending;
  assert.equal(useAuthStore.getState().token, 'fresh-login');
  assert.equal(f.applySessionSignOut(startedAt), false); assert.equal(useAuthStore.getState().token, 'fresh-login');
  const newerLogout = sessionChangeTime();
  assert.equal(f.applySessionSignOut(newerLogout), true); assert.equal(useAuthStore.getState().token, null);
});

test('queued sign-in/logout follow lock order and global logout uses the identity at dispatch', async () => {
  let queue = Promise.resolve(), release;
  const navigator = { locks: { request(_name, callback) { const result = queue.then(callback); queue = result.catch(() => {}); return result; } } };
  const f = moduleFor(async (_url, init) => { assert.equal(init.headers.Authorization, 'Bearer new-login'); return Response.json({ success: true }); }, navigator);
  useAuthStore.getState().setAuth(user, 'old-login');
  const blocking = f.withSessionLock(() => new Promise(resolve => { release = resolve; }));
  await Promise.resolve();
  const signIn = f.withSessionLock(async () => { useAuthStore.getState().setAuth(user, 'new-login'); });
  const logout = f.logoutSession(true); release(); await Promise.all([blocking, signIn, logout]);
  assert.equal(useAuthStore.getState().token, null, 'A later queued logout must clear the login it actually revoked');

  let finishLogout;
  const second = moduleFor(() => new Promise(resolve => { finishLogout = resolve; }), navigator);
  useAuthStore.getState().setAuth(user, 'old-login');
  const firstLogout = second.logoutSession(); await Promise.resolve();
  const laterSignIn = second.withSessionLock(async () => { useAuthStore.getState().setAuth(user, 'later-login'); });
  finishLogout(Response.json({ success: true })); await Promise.all([firstLogout, laterSignIn]);
  assert.equal(second.applySessionSignOut(second.events[0].startedAt), false);
  assert.equal(useAuthStore.getState().token, 'later-login', 'An earlier delayed logout hint must preserve a subsequent login');
});

test('automatic rotation is not a fresh sign-in and cannot suppress a pending peer sign-out', async () => {
  useAuthStore.getState().setAuth(user, 'initial-token'); const signInAt = useAuthStore.getState().lastSignInAt;
  const startedAt = sessionChangeTime(); const f = moduleFor(async () => response());
  await f.renewSession(); assert.equal(useAuthStore.getState().lastSignInAt, signInAt);
  assert.equal(f.applySessionSignOut(startedAt), true); assert.equal(useAuthStore.getState().token, null);
});

test('a pre-sleep tab can invalidate a newer post-wake tab despite a paused performance clock', async () => {
  const beforeSleep = 1_800_000_000_000;
  const senderClock = { wallTime: beforeSleep, timeOrigin: beforeSleep - 5000, performanceNow: 5000 };
  const senderStore = storeForClock(senderClock);
  senderStore.useAuthStore.getState().setAuth(user, 'pre-sleep-token');
  senderClock.wallTime += 60 * 60_000; // performanceNow deliberately stays paused.
  const receiverStore = storeForClock({ wallTime: senderClock.wallTime, timeOrigin: senderClock.wallTime, performanceNow: 0 });
  receiverStore.useAuthStore.getState().setAuth(user, 'post-wake-token');
  senderClock.wallTime++;
  const sender = moduleFor(async () => Response.json({ success: true }), {}, senderStore);
  const receiver = moduleFor(() => { throw Error('No receiver request expected'); }, {}, receiverStore);
  await sender.logoutSession();
  assert.equal(sender.events[0].startedAt, senderClock.wallTime);
  assert.equal(receiver.applySessionSignOut(sender.events[0].startedAt), true);
  assert.equal(receiverStore.useAuthStore.getState().token, null);
  assert.equal(senderClock.performanceNow, 5000);
});

test('same-tab sign-in ordering survives repeated milliseconds and a backward wall-clock adjustment', async () => {
  const clock = { wallTime: 1000, timeOrigin: 1000, performanceNow: 0 };
  const store = storeForClock(clock); let release;
  const api = moduleFor(url => url.endsWith('/logout') ? new Promise(resolve => { release = resolve; }) : Promise.resolve(response()), {}, store);
  store.useAuthStore.getState().setAuth(user, 'old-login');
  const pending = api.logoutSession();
  store.useAuthStore.getState().setAuth(user, 'new-login-in-same-millisecond');
  release(Response.json({ success: true })); await pending;
  assert.equal(store.useAuthStore.getState().token, 'new-login-in-same-millisecond');
  assert.equal(api.applySessionSignOut(api.events[0].startedAt), false);
  const previousSignIn = store.useAuthStore.getState().lastSignInAt;
  clock.wallTime = 500;
  store.useAuthStore.getState().setAuth(user, 'new-login-after-clock-adjustment');
  const adjustedSignIn = store.useAuthStore.getState().lastSignInAt;
  assert.ok(adjustedSignIn > previousSignIn);
  await api.renewSession();
  assert.equal(store.useAuthStore.getState().lastSignInAt, adjustedSignIn, 'Rotation must not become a fresh explicit sign-in');
  const laterLogout = store.sessionChangeTime();
  assert.ok(laterLogout > adjustedSignIn);
  assert.equal(api.applySessionSignOut(laterLogout), true);
  assert.equal(store.useAuthStore.getState().token, null);
});

test('peer sign-out cancels pending provider success/error continuations and retry timers', async () => {
  for (const status of [200, 503]) {
    useAuthStore.getState().logout(); let release;
    const nearExpiry = `x.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 })).toString('base64url')}.x`;
    let calls = 0;
    const api = moduleFor(() => ++calls === 1 ? Promise.resolve(response(200, nearExpiry)) : new Promise(resolve => { release = resolve; }));
    const provider = mountProvider(api);
    await new Promise(resolve => setImmediate(resolve)); assert.equal(useAuthStore.getState().isAuthenticated, true);
    provider.listeners.get('focus')(); assert.equal(calls, 2);
    provider.signOutListener(sessionChangeTime()); assert.equal(useAuthStore.getState().token, null);
    release(response(status)); await new Promise(resolve => setImmediate(resolve));
    assert.equal(provider.message, '', `No stale provider error after peer sign-out (${status})`);
    assert.equal(provider.timers.size, 0, `No stale refresh/retry timer after peer sign-out (${status})`);
    assert.equal(useAuthStore.getState().token, null); provider.cleanup(); assert.equal(provider.signOutListener, null); assert.equal(provider.listeners.size, 0);
  }
});

test('an authoritative signed-out retry clears an earlier anonymous bootstrap error', async () => {
  let calls = 0; const provider = mountProvider(moduleFor(async () => response(++calls === 1 ? 503 : 401)));
  try {
    await new Promise(resolve => setImmediate(resolve)); assert.ok(provider.message); assert.equal(provider.timers.size, 1);
    await provider.retry();
    assert.equal(provider.message, ''); assert.equal(useAuthStore.getState().sessionLoading, false); assert.equal(useAuthStore.getState().token, null);
    // The prior retry timer has fired/was consumed in the actual browser. The
    // Retry button must also cancel it when verification settles as signed out.
    assert.equal(provider.timers.size, 0);
  } finally { provider.cleanup(); }
});

test('sign-out hints cross tabs without credentials and restricted transports do not break logout', () => {
  const eventFilename = path.resolve(__dirname, '../src/lib/sessionEvents.ts');
  const eventSource = ts.transpileModule(fs.readFileSync(eventFilename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const channels = new Set(), sent = [], storageListeners = new Set();
  class Channel {
    constructor(name) { this.name = name; channels.add(this); }
    postMessage(value) { sent.push(value); for (const target of channels) if (target !== this && target.name === this.name) target.onmessage?.({ data: value }); }
    close() { channels.delete(this); }
  }
  function eventsFor(transport = Channel, storage = { setItem() {}, removeItem() {} }) {
    const context = vm.createContext({ exports: {}, BroadcastChannel: transport, localStorage: storage,
      window: { addEventListener: (_name, listener) => storageListeners.add(listener), removeEventListener: (_name, listener) => storageListeners.delete(listener) } });
    new vm.Script(eventSource, { filename: eventFilename }).runInContext(context); return context.exports;
  }
  const a = eventsFor(), b = eventsFor(), received = []; const unsubscribe = b.subscribeSessionSignOut(at => received.push(at));
  a.publishSessionSignOut(123); assert.deepEqual(received, [123]);
  assert.equal(JSON.stringify(sent[0]), '{"type":"signed-out","startedAt":123}');
  unsubscribe(); a.publishSessionSignOut(456); assert.deepEqual(received, [123]); assert.equal(channels.size, 0);
  const noChannel = class { constructor() { throw Error('Unavailable'); } };
  const stored = [];
  const fallback = eventsFor(noChannel, { setItem(key, value) { stored.push(value); for (const listener of storageListeners) listener({ key, newValue: value }); }, removeItem() {} });
  const stop = fallback.subscribeSessionSignOut(at => received.push(at)); fallback.publishSessionSignOut(789);
  assert.deepEqual(received, [123, 789]); assert.equal(stored.length, 1);
  for (const value of ['null', '{"type":"signed-out","startedAt":"1"}', '{"type":"signed-out","startedAt":-1}', '{', 'x'.repeat(257)]) {
    for (const listener of storageListeners) listener({ key: 'athlix-session-event', newValue: value });
  }
  assert.deepEqual(received, [123, 789]); stop(); assert.equal(storageListeners.size, 0);
  assert.doesNotThrow(() => eventsFor(noChannel, { setItem() { throw Error('Denied'); } }).publishSessionSignOut(1000));
});
