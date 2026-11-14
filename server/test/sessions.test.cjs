const assert = require('node:assert/strict');
const { test, before, after, beforeEach, afterEach, mock } = require('node:test');
const express = require('express');
const jwt = require('jsonwebtoken');
const { Types } = require('mongoose');
process.env.JWT_SECRET = 'isolated-session-test-secret-with-no-real-credentials';
const provider = { verifyIdToken: async () => ({ uid: 'fixture-uid', auth_time: 100, email_verified: true }), getUser: async () => ({ disabled: false, tokensValidAfterTime: new Date(0).toISOString() }) };
const providerPath = require.resolve('../dist/config/firebase.js');
require.cache[providerPath] = { id: providerPath, filename: providerPath, loaded: true, exports: { authAdmin: provider } };
const { User } = require('../dist/models/User');
const { Profile } = require('../dist/models/Profile');
const { AuthSession } = require('../dist/models/AuthSession');
const sessions = require('../dist/utils/sessions');
const router = require('../dist/routes/authRoutes').default;
const app = express(); app.use(express.json()); app.use('/auth', router);
app.use((_error, _req, res, _next) => res.status(500).json({ success: false, message: 'Request failed' }));
let server, base, account, profile, records;
const userId = '507f1f77bcf86cd799439011';
const clone = value => value && { ...value, usedCredentialHashes: [...(value.usedCredentialHashes || [])] };
const byId = value => records.get(String(value));
const future = record => record && !record.revokedAt && record.expiresAt > new Date();
const query = value => ({ select: async () => value });
before(async () => { server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); }); base = `http://127.0.0.1:${server.address().port}`; });
after(() => new Promise(resolve => server.close(resolve)));
afterEach(() => mock.restoreAll());
beforeEach(() => {
  records = new Map();
  account = { _id: userId, name: 'Fixture Athlete', email: 'fixture@example.test', role: 'athlete', isActive: true, sessionVersion: 0, matchPassword: async () => true };
  profile = { userId, discipline: 'Karate', beltRank: 'Brown', bio: 'Saved athlete profile' };
  mock.method(User, 'findOne', async () => account);
  mock.method(User, 'findById', () => query(account));
  mock.method(User, 'updateOne', async (_filter, update) => { account.sessionVersion += update.$inc?.sessionVersion || 0; return { matchedCount: 1 }; });
  mock.method(Profile, 'findOneAndUpdate', async (_filter, update) => { if (!profile) profile = { ...update.$setOnInsert }; return profile; });
  mock.method(Profile, 'findOne', async () => profile);
  mock.method(AuthSession.prototype, 'save', async function () { records.set(String(this._id), this.toObject()); return this; });
  mock.method(AuthSession, 'findOne', filter => query(future(byId(filter._id)) ? clone(byId(filter._id)) : null));
  mock.method(AuthSession, 'findOneAndUpdate', async (filter, update) => {
    const record = byId(filter._id);
    if (!future(record) || record.credentialHash !== filter.credentialHash || record.rotationCount >= filter.rotationCount.$lt) return null;
    record.usedCredentialHashes.push(update.$push.usedCredentialHashes);
    record.credentialHash = update.$set.credentialHash; record.rotationCount++;
    return clone(record);
  });
  mock.method(AuthSession, 'updateOne', async (filter, update) => {
    const record = byId(filter._id);
    const hashMatch = !filter.credentialHash || record?.credentialHash === filter.credentialHash;
    const usedMatch = !filter.usedCredentialHashes || record?.usedCredentialHashes.includes(filter.usedCredentialHashes);
    const orMatch = !filter.$or || filter.$or.some(f => record?.credentialHash === f.credentialHash || record?.usedCredentialHashes.includes(f.usedCredentialHashes));
    if (!record || !hashMatch || !usedMatch || !orMatch) return { matchedCount: 0 };
    Object.assign(record, update.$set); return { matchedCount: 1 };
  });
  mock.method(AuthSession, 'updateMany', async (_filter, update) => { for (const record of records.values()) Object.assign(record, update.$set); return { modifiedCount: records.size }; });
  mock.method(AuthSession, 'exists', async filter => { const record = byId(filter._id); return future(record) && String(record.userId) === filter.userId && record.sessionVersion === filter.sessionVersion ? { _id: record._id } : null; });
});
async function request(path, body, options = {}) {
  const response = await fetch(`${base}/auth${path}`, { method: options.method || 'POST', headers: {
    'Content-Type': 'application/json', Origin: 'http://localhost:3000', 'X-ATHLIX-Session': '1', ...options.headers,
  }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { response, status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
}
const login = () => request('/login', { email: account.email, password: 'test-password' });
const refresh = cookie => request('/session', undefined, { headers: { Cookie: cookie } });
const me = token => request('/me', undefined, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });

test('login issues 15-minute audience-bound access and only a hashed opaque refresh cookie', async () => {
  const result = await login(); assert.equal(result.status, 200);
  const claims = jwt.verify(result.body.token, process.env.JWT_SECRET, { issuer: 'athlix', audience: 'athlix-api' });
  assert.equal(claims.exp - claims.iat, 900); assert.equal(claims.ver, 0);
  assert.match(result.response.headers.get('set-cookie'), /HttpOnly/); assert.match(result.response.headers.get('set-cookie'), /SameSite=Lax/);
  assert.equal(result.response.headers.get('cache-control'), 'no-store');
  const record = byId(claims.sid); assert.ok(record);
  assert.equal(record.credentialHash, sessions.hashCredential(result.cookie.split('=')[1]));
  assert.equal(JSON.stringify(record).includes(result.cookie.split('=')[1]), false);
  assert.equal(result.body.refreshToken, undefined); assert.equal((await me(result.body.token)).status, 200);
});
test('production cookie is host-only, secure and HttpOnly; insecure cross-site configuration is rejected', () => {
  const env = { NODE_ENV: process.env.NODE_ENV, AUTH_COOKIE_SAME_SITE: process.env.AUTH_COOKIE_SAME_SITE };
  try {
    process.env.NODE_ENV = 'production'; process.env.AUTH_COOKIE_SAME_SITE = 'none';
    assert.deepEqual(sessions.cookieOptions(), { httpOnly: true, secure: true, sameSite: 'none', path: '/' });
    assert.equal(sessions.sessionCookieName(), '__Host-athlix-refresh');
    process.env.NODE_ENV = 'development'; assert.throws(() => sessions.cookieOptions(), /configuration/);
  } finally { for (const [key, value] of Object.entries(env)) if (value === undefined) delete process.env[key]; else process.env[key] = value; }
});
test('refresh rotates atomically, retains absolute expiry, and reused credential revokes the session', async () => {
  const first = await login(); const id = jwt.decode(first.body.token).sid; const deadline = byId(id).expiresAt.getTime();
  const second = await refresh(first.cookie); assert.equal(second.status, 200); assert.notEqual(second.cookie, first.cookie);
  assert.equal(byId(id).expiresAt.getTime(), deadline); assert.equal(byId(id).usedCredentialHashes.length, 1);
  assert.equal((await refresh(first.cookie)).status, 401); assert.ok(byId(id).revokedAt);
  assert.equal((await refresh(second.cookie)).status, 401); assert.equal((await me(second.body.token)).status, 401);
});
test('random credential for a known session id cannot revoke the victim session', async () => {
  const first = await login(); const id = jwt.decode(first.body.token).sid;
  assert.equal((await refresh(`athlix-refresh=${id}.${'x'.repeat(43)}`)).status, 401);
  assert.equal(byId(id).revokedAt, null); assert.equal((await refresh(first.cookie)).status, 200);
});
test('refresh compare-and-set loses a rotation race without issuing any access token', async () => {
  const first = await login(); const id = jwt.decode(first.body.token).sid;
  mock.method(AuthSession, 'findOneAndUpdate', async () => { byId(id).usedCredentialHashes.push(sessions.hashCredential(first.cookie.split('=')[1])); return null; });
  const result = await refresh(first.cookie); assert.equal(result.status, 401); assert.equal(result.body.token, undefined); assert.ok(byId(id).revokedAt);
});
test('absolute expiry is enforced before asynchronous TTL cleanup, including access tokens', async () => {
  const first = await login(); byId(jwt.decode(first.body.token).sid).expiresAt = new Date(Date.now() - 1);
  assert.equal((await refresh(first.cookie)).status, 401); assert.equal((await me(first.body.token)).status, 401);
});
test('missing, malformed and ambiguous cookies never consult session storage', async () => {
  const find = mock.method(AuthSession, 'findOne', () => { throw new Error('Must not query'); });
  assert.equal(sessions.readSessionCookie({ headers: { cookie: `athlix-refresh=${'a'.repeat(17000)}` } }), null);
  for (const cookie of ['', 'athlix-refresh=invalid', `athlix-refresh=${userId}.${'x'.repeat(43)}; athlix-refresh=${userId}.${'y'.repeat(43)}`]) {
    const result = await refresh(cookie); assert.equal(result.status, 401);
  }
  assert.equal(find.mock.callCount(), 0);
});
test('cookie mutations require trusted Origin and non-simple header even if a valid cookie is present', async () => {
  const first = await login();
  for (const path of ['/session', '/logout']) {
    for (const headers of [{ Origin: 'https://evil.example' }, { Origin: 'null' }, { Origin: '', 'X-ATHLIX-Session': '1' }, { 'X-ATHLIX-Session': '' }]) {
      assert.equal((await request(path, undefined, { headers: { Cookie: first.cookie, ...headers } })).status, 403);
    }
  }
  assert.equal((await me(first.body.token)).status, 200);
});
test('untrusted browser origins cannot establish login sessions', async () => {
  const find = mock.method(User, 'findOne', () => { throw new Error('No credential lookup'); });
  assert.equal((await request('/login', { email: account.email, password: 'test-password' }, { headers: { Origin: 'https://evil.example' } })).status, 403);
  assert.equal(find.mock.callCount(), 0);
});
test('logout revokes server access immediately and is idempotent', async () => {
  const first = await login();
  const result = await request('/logout', undefined, { headers: { Cookie: first.cookie } }); assert.equal(result.status, 200);
  assert.match(result.response.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/);
  assert.equal((await me(first.body.token)).status, 401);
  assert.equal((await request('/logout', undefined, { headers: { Cookie: first.cookie } })).status, 200);
});
test('global sign-out increments account version and revokes independently created sessions', async () => {
  const first = await login(); const second = await login();
  const result = await request('/logout-all', undefined, { headers: { Authorization: `Bearer ${first.body.token}` } }); assert.equal(result.status, 200);
  assert.equal(account.sessionVersion, 1); assert.equal((await me(first.body.token)).status, 401); assert.equal((await me(second.body.token)).status, 401);
  assert.equal((await refresh(second.cookie)).status, 401);
  const third = await login(); assert.equal(jwt.decode(third.body.token).ver, 1); assert.equal((await me(third.body.token)).status, 200);
});
test('global version rejects a session created by an old login racing session cleanup', async () => {
  const first = await login(); const record = byId(jwt.decode(first.body.token).sid); account.sessionVersion++;
  assert.equal(record.revokedAt, null); assert.equal((await me(first.body.token)).status, 401); assert.equal((await refresh(first.cookie)).status, 401);
});
test('account disabling and record removal stop renewal and REST authorization', async () => {
  const first = await login(); account.isActive = false;
  assert.equal((await me(first.body.token)).status, 401); assert.equal((await refresh(first.cookie)).status, 401);
});
test('legacy 30-day, wrong-audience and sessionless JWTs are invalidated before database lookup', async () => {
  const find = mock.method(User, 'findById', () => { throw new Error('Invalid token must not query'); });
  for (const token of [jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' }),
    jwt.sign({ id: userId, sid: userId, ver: 0 }, process.env.JWT_SECRET, { expiresIn: '30d', issuer: 'athlix', audience: 'athlix-api' }),
    jwt.sign({ id: userId, sid: userId, ver: 0 }, process.env.JWT_SECRET, { expiresIn: '15m', issuer: 'athlix', audience: 'evil-api' })]) assert.equal((await me(token)).status, 401);
  assert.equal(find.mock.callCount(), 0);
});
test('provider password-reset revocation and disabling stop Firebase-backed cookie renewal', async () => {
  account.firebaseUid = 'fixture-uid';
  const result = await request('/firebase', { idToken: 'fixture-id-token' }); assert.equal(result.status, 200);
  mock.method(provider, 'getUser', async () => ({ disabled: false, tokensValidAfterTime: new Date(101000).toISOString() }));
  assert.equal((await refresh(result.cookie)).status, 401);
  const next = await request('/firebase', { idToken: 'fixture-id-token' });
  mock.method(provider, 'getUser', async () => ({ disabled: true })); assert.equal((await refresh(next.cookie)).status, 401);
});
test('provider outage cannot mint a refreshed credential or expose provider diagnostics', async () => {
  account.firebaseUid = 'fixture-uid'; const first = await request('/firebase', { idToken: 'fixture-id-token' });
  mock.method(provider, 'getUser', async () => { throw new Error('sensitive provider message'); });
  const result = await refresh(first.cookie); assert.equal(result.status, 500); assert.equal(result.body.token, undefined); assert.equal(result.cookie, undefined); assert.equal(JSON.stringify(result.body).includes('sensitive'), false);
});
test('successful login repairs a missing profile without overwriting a saved athlete profile', async () => {
  const saved = await login(); assert.equal(saved.body.user.bio, 'Saved athlete profile'); assert.equal(saved.body.user.discipline, 'Karate');
  profile = null; const repaired = await login(); assert.equal(repaired.status, 200); assert.equal(profile.userId, userId); assert.equal(profile.discipline, 'BJJ');
});
test('profile repair duplicate race rereads the winner, and real storage failure never reports successful authentication', async () => {
  mock.method(Profile, 'findOneAndUpdate', async () => { const error = new Error('duplicate'); error.code = 11000; throw error; });
  assert.equal((await login()).status, 200);
  mock.method(Profile, 'findOneAndUpdate', async () => { throw new Error('database unavailable'); });
  const result = await login(); assert.equal(result.status, 500); assert.equal(result.body.token, undefined); assert.equal(records.size, 1);
});
