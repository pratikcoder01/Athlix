const assert = require('node:assert/strict');
const { test, before, after, afterEach, mock } = require('node:test');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'auth-regression-test-secret-only';
// The identity provider is mocked; the real router, validation, controllers,
// password policy, token signer and HTTP middleware execute below.
const provider = { verifyIdToken: async () => { throw new Error('Unconfigured test provider'); } };
const firebaseModule = require.resolve('../dist/config/firebase.js');
require.cache[firebaseModule] = { id: firebaseModule, filename: firebaseModule, loaded: true, exports: { authAdmin: provider } };

const { User } = require('../dist/models/User.js');
const { Profile } = require('../dist/models/Profile.js');
const { CoachProfile } = require('../dist/models/CoachProfile.js');
const { register } = require('../dist/controllers/authController.js');
const router = require('../dist/routes/authRoutes.js').default;
const app = express();
app.use(express.json());
app.use('/auth', router);
app.use((error, _req, res, _next) => res.status(error.statusCode || 500).json({ success: false, message: error.message }));

let server;
let base;
before(async () => {
  server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
afterEach(() => mock.restoreAll());

const athleteId = '507f1f77bcf86cd799439011';
const privilegedRoles = ['coach', 'academy_owner', 'tournament_organizer', 'admin'];
const signup = { name: 'Test Athlete', email: 'athlete@example.test', password: 'test-password' };
const identity = { uid: 'firebase-test-uid', email: signup.email, email_verified: false, name: 'Test Athlete' };
const account = (fields = {}) => ({ _id: athleteId, name: signup.name, email: signup.email, role: 'athlete', isActive: true, ...fields });

async function post(path, body) {
  const response = await fetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
}

for (const role of [...privilegedRoles, 'unknown', null, ['athlete'], { $ne: 'athlete' }]) {
  test(`legacy signup rejects client role ${JSON.stringify(role)} before database access`, async () => {
    const find = mock.method(User, 'findOne', async () => { throw new Error('Database must not be consulted'); });
    const result = await post('/auth/register', { ...signup, role });
    assert.equal(result.status, 400);
    assert.equal(find.mock.callCount(), 0);
  });

  test(`Firebase exchange rejects client role ${JSON.stringify(role)} before provider or database access`, async () => {
    const verify = mock.method(provider, 'verifyIdToken', async () => { throw new Error('Provider must not be consulted'); });
    const find = mock.method(User, 'findOne', async () => { throw new Error('Database must not be consulted'); });
    const result = await post('/auth/firebase', { idToken: 'test-id-token', role });
    assert.equal(result.status, 400);
    assert.equal(verify.mock.callCount(), 0);
    assert.equal(find.mock.callCount(), 0);
  });
}

test('legacy signup creates an athlete and strips identity, activity and approval mass assignment', async () => {
  mock.method(User, 'findOne', async (filter) => { assert.deepEqual(filter, { email: signup.email }); return null; });
  const create = mock.method(User, 'create', async (fields) => account(fields));
  mock.method(Profile, 'create', async (fields) => fields);
  const coachCreate = mock.method(CoachProfile, 'create', async () => { throw new Error('No public coach provisioning'); });
  const result = await post('/auth/register', { ...signup, email: ' Athlete@Example.Test ', name: ' Test Athlete ', firebaseUid: 'attacker', isActive: false, approved: true, _id: 'attacker' });
  assert.equal(result.status, 201);
  assert.equal(result.body.user.role, 'athlete');
  assert.deepEqual(create.mock.calls[0].arguments[0], { name: signup.name, email: signup.email, password: signup.password, role: 'athlete' });
  assert.equal(coachCreate.mock.callCount(), 0);
  assert.equal(jwt.verify(result.body.token, process.env.JWT_SECRET).id, athleteId);
});

test('legacy handler also rejects admin when called without validation middleware', async () => {
  const find = mock.method(User, 'findOne', async () => { throw new Error('No database access'); });
  const response = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  await register({ body: { ...signup, role: 'admin' } }, response, (error) => { throw error; });
  assert.equal(response.code, 400);
  assert.equal(find.mock.callCount(), 0);
});

test('Firebase first sign-in creates only an athlete even when provider token contains privileged claims', async () => {
  const verify = mock.method(provider, 'verifyIdToken', async () => ({ ...identity, admin: true, role: 'admin' }));
  mock.method(User, 'findOne', async () => null);
  const create = mock.method(User, 'create', async (fields) => account(fields));
  mock.method(Profile, 'create', async () => ({}));
  mock.method(Profile, 'findOne', async () => ({}));
  const coachCreate = mock.method(CoachProfile, 'create', async () => { throw new Error('No public coach provisioning'); });
  const result = await post('/auth/firebase', { idToken: 'test-id-token', isActive: false, firebaseUid: 'attacker' });
  assert.equal(result.status, 200);
  assert.deepEqual(verify.mock.calls[0].arguments, ['test-id-token', true]);
  assert.equal(create.mock.calls[0].arguments[0].role, 'athlete');
  assert.equal(create.mock.calls[0].arguments[0].firebaseUid, identity.uid);
  assert.equal(result.body.user.role, 'athlete');
  assert.equal(coachCreate.mock.callCount(), 0);
});

test('Firebase unverified email cannot take over a legacy admin account', async () => {
  mock.method(provider, 'verifyIdToken', async () => identity);
  mock.method(User, 'findOne', async (filter) => filter.firebaseUid ? null : account({ role: 'admin' }));
  const link = mock.method(User, 'findOneAndUpdate', async () => { throw new Error('Must not link'); });
  const result = await post('/auth/firebase', { idToken: 'test-id-token' });
  assert.equal(result.status, 403);
  assert.match(result.body.message, /Verify your email/);
  assert.equal(result.body.token, undefined);
  assert.equal(link.mock.callCount(), 0);
});

test('Firebase verified email cannot replace a different linked UID', async () => {
  mock.method(provider, 'verifyIdToken', async () => ({ ...identity, email_verified: true }));
  mock.method(User, 'findOne', async (filter) => filter.firebaseUid ? null : account({ firebaseUid: 'different-uid', role: 'admin' }));
  const link = mock.method(User, 'findOneAndUpdate', async () => { throw new Error('Must not relink'); });
  const result = await post('/auth/firebase', { idToken: 'test-id-token' });
  assert.equal(result.status, 409);
  assert.equal(link.mock.callCount(), 0);
});

test('Firebase verified legacy linking uses compare-and-set and preserves operator-assigned role', async () => {
  const legacy = account({ role: 'tournament_organizer' });
  mock.method(provider, 'verifyIdToken', async () => ({ ...identity, email_verified: true }));
  mock.method(User, 'findOne', async (filter) => filter.firebaseUid ? null : legacy);
  const link = mock.method(User, 'findOneAndUpdate', async () => ({ ...legacy, firebaseUid: identity.uid }));
  mock.method(Profile, 'findOne', async () => ({}));
  const result = await post('/auth/firebase', { idToken: 'test-id-token', role: 'athlete' });
  assert.equal(result.status, 200);
  assert.equal(result.body.user.role, 'tournament_organizer');
  assert.deepEqual(link.mock.calls[0].arguments, [
    { _id: athleteId, firebaseUid: { $exists: false }, isActive: true },
    { $set: { firebaseUid: identity.uid } },
    { new: true, runValidators: true },
  ]);
});

test('Firebase concurrent legacy linking failure issues no token', async () => {
  mock.method(provider, 'verifyIdToken', async () => ({ ...identity, email_verified: true }));
  mock.method(User, 'findOne', async (filter) => filter.firebaseUid ? null : account());
  mock.method(User, 'findOneAndUpdate', async () => null);
  const result = await post('/auth/firebase', { idToken: 'test-id-token' });
  assert.equal(result.status, 409);
  assert.equal(result.body.token, undefined);
});

test('Firebase existing privileged identity retains its database role without public re-provisioning', async () => {
  mock.method(provider, 'verifyIdToken', async () => identity);
  mock.method(User, 'findOne', async () => account({ role: 'coach', firebaseUid: identity.uid }));
  mock.method(Profile, 'findOne', async () => ({}));
  const create = mock.method(User, 'create', async () => { throw new Error('No new user'); });
  const result = await post('/auth/firebase', { idToken: 'test-id-token' });
  assert.equal(result.status, 200);
  assert.equal(result.body.user.role, 'coach');
  assert.equal(create.mock.callCount(), 0);
});

for (const mode of ['uid', 'legacy']) {
  test(`Firebase denies inactive ${mode} accounts`, async () => {
    mock.method(provider, 'verifyIdToken', async () => ({ ...identity, email_verified: true }));
    mock.method(User, 'findOne', async (filter) => mode === 'uid' || filter.email ? account({ isActive: false }) : null);
    const link = mock.method(User, 'findOneAndUpdate', async () => { throw new Error('Inactive account must not be linked'); });
    const result = await post('/auth/firebase', { idToken: 'test-id-token' });
    assert.equal(result.status, 403);
    assert.equal(result.body.token, undefined);
    assert.equal(link.mock.callCount(), 0);
  });
}

test('Firebase revoked or disabled token produces a generic error without provider details', async () => {
  mock.method(provider, 'verifyIdToken', async () => { throw new Error('Sensitive provider internals'); });
  const result = await post('/auth/firebase', { idToken: 'revoked-test-id-token' });
  assert.equal(result.status, 401);
  assert.deepEqual(result.body, { success: false, message: 'Invalid or expired Firebase token' });
});

test('Firebase identity creation collision returns 409 rather than an internal error', async () => {
  mock.method(provider, 'verifyIdToken', async () => identity);
  mock.method(User, 'findOne', async () => null);
  mock.method(User, 'create', async () => { const error = new Error('secret duplicate index'); error.code = 11000; throw error; });
  const result = await post('/auth/firebase', { idToken: 'test-id-token' });
  assert.equal(result.status, 409);
  assert.equal(JSON.stringify(result.body).includes('secret duplicate index'), false);
});

test('legacy login rejects inactive account even with the correct password', async () => {
  const check = mock.fn(async () => true);
  mock.method(User, 'findOne', async () => account({ isActive: false, matchPassword: check }));
  const result = await post('/auth/login', { email: signup.email, password: signup.password });
  assert.equal(result.status, 401);
  assert.equal(result.body.token, undefined);
  assert.equal(check.mock.callCount(), 0);
});

test('legacy login preserves a trusted active admin role', async () => {
  mock.method(User, 'findOne', async () => account({ role: 'admin', matchPassword: async () => true }));
  mock.method(Profile, 'findOne', async () => ({}));
  const result = await post('/auth/login', { email: signup.email, password: signup.password });
  assert.equal(result.status, 200);
  assert.equal(result.body.user.role, 'admin');
});

for (const token of [
  jwt.sign({ id: athleteId }, process.env.JWT_SECRET, { algorithm: 'HS384', expiresIn: '1h' }),
  jwt.sign({ id: athleteId }, process.env.JWT_SECRET),
  jwt.sign({ id: { $ne: null } }, process.env.JWT_SECRET, { expiresIn: '1h' }),
  jwt.sign({ id: athleteId }, process.env.JWT_SECRET, { expiresIn: -1 }),
]) {
  test('protected routes reject unsupported algorithm, absent expiry, malformed id or expired token before DB access', async () => {
    const find = mock.method(User, 'findById', () => { throw new Error('Invalid token must not query database'); });
    const response = await fetch(`${base}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(response.status, 401);
    assert.equal(find.mock.callCount(), 0);
  });
}

test('protected routes reject inactive users on every request', async () => {
  mock.method(User, 'findById', () => ({ select: async () => account({ isActive: false }) }));
  const token = jwt.sign({ id: athleteId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const response = await fetch(`${base}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(response.status, 401);
});

test('protected routes use current database role for an active token owner', async () => {
  mock.method(User, 'findById', () => ({ select: async () => account({ role: 'athlete' }) }));
  mock.method(Profile, 'findOne', async () => ({}));
  const token = jwt.sign({ id: athleteId, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const response = await fetch(`${base}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).user.role, 'athlete');
});
