const assert = require('node:assert/strict');
const { test } = require('node:test');
const { randomUUID } = require('node:crypto');
const mongoose = require('mongoose');
const express = require('express');
const jwt = require('jsonwebtoken');
const { safeLocalMongoUri, safeTestDbName } = require('./helpers/localMongo.cjs');

test('real database session rotation, replay, revocation and interrupted-profile recovery', {
  skip: !process.env.TEST_MONGO_URI && 'NOT RUN: loopback TEST_MONGO_URI is required', timeout: 90000,
}, async t => {
  const uri = safeLocalMongoUri(process.env.TEST_MONGO_URI);
  const dbName = safeTestDbName(`athlix_booking_test_${randomUUID().replaceAll('-', '')}`);
  process.env.JWT_SECRET = `session-fixture-${randomUUID()}`;
  const providerPath = require.resolve('../dist/config/firebase');
  require.cache[providerPath] = { id: providerPath, filename: providerPath, loaded: true, exports: { authAdmin: {} } };
  const { User } = require('../dist/models/User'); const { Profile } = require('../dist/models/Profile');
  const { AuthSession } = require('../dist/models/AuthSession');
  let server;
  t.after(async () => {
    if (server) await new Promise(resolve => server.close(resolve));
    if (mongoose.connection.readyState === 1 && mongoose.connection.db?.databaseName === dbName) { safeTestDbName(dbName); await mongoose.connection.dropDatabase(); }
    await mongoose.disconnect();
  });
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 5000 });
  for (const model of [User, Profile, AuthSession]) await model.init();
  const app = express(); app.use(express.json()); app.use('/auth', require('../dist/routes/authRoutes').default);
  app.use((_error, _req, res, _next) => res.status(500).json({ success: false, message: 'Fixture request failed' }));
  server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}/auth`;
  async function request(path, body, headers = {}, method = 'POST') {
    const response = await fetch(`${base}${path}`, { method, headers: { Origin: 'http://localhost:3000', 'X-ATHLIX-Session': '1', 'Content-Type': 'application/json', ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
  }
  const signup = () => request('/register', { name: 'Synthetic Session Athlete', email: `${randomUUID()}@example.test`, password: 'isolated-session-password' });
  await t.test('persisted credentials are hashed and a consumed refresh credential invalidates REST access', async () => {
    const first = await signup(); assert.equal(first.status, 201); const id = jwt.decode(first.body.token).sid;
    const record = await AuthSession.findById(id).select('+credentialHash').lean();
    assert.equal(record.credentialHash.length, 64); assert.equal(record.credentialHash.includes(first.cookie.split('=')[1]), false);
    const renewed = await request('/session', undefined, { Cookie: first.cookie }); assert.equal(renewed.status, 200);
    assert.equal((await request('/session', undefined, { Cookie: first.cookie })).status, 401);
    assert.ok((await AuthSession.findById(id)).revokedAt);
    assert.equal((await request('/me', undefined, { Authorization: `Bearer ${renewed.body.token}` }, 'GET')).status, 401);
  });
  await t.test('simultaneous rotation admits at most one successor and replay revokes it', async () => {
    const first = await signup();
    const responses = await Promise.all([request('/session', undefined, { Cookie: first.cookie }), request('/session', undefined, { Cookie: first.cookie })]);
    assert.deepEqual(responses.map(r => r.status).sort(), [200, 401]);
    const successor = responses.find(r => r.status === 200);
    assert.equal((await request('/session', undefined, { Cookie: successor.cookie })).status, 401);
  });
  await t.test('global version invalidates both devices and role changes invalidate old session records', async () => {
    const first = await signup(); const user = first.body.user;
    const second = await request('/login', { email: user.email, password: 'isolated-session-password' });
    assert.equal((await request('/logout-all', undefined, { Authorization: `Bearer ${first.body.token}` })).status, 200);
    for (const session of [first, second]) assert.equal((await request('/me', undefined, { Authorization: `Bearer ${session.body.token}` }, 'GET')).status, 401);
    const fresh = await request('/login', { email: user.email, password: 'isolated-session-password' });
    await User.updateOne({ _id: user.id }, { $inc: { sessionVersion: 1 } });
    assert.equal((await request('/session', undefined, { Cookie: fresh.cookie })).status, 401);
  });
  await t.test('legacy account without profile recovers idempotently and preserves later edits', async () => {
    const user = await User.create({ name: 'Interrupted Signup', email: `${randomUUID()}@example.test`, password: 'profile-repair-password', role: 'athlete' });
    const details = { email: user.email, password: 'profile-repair-password' };
    assert.equal(await Profile.countDocuments({ userId: user._id }), 0);
    const results = await Promise.all([request('/login', details), request('/login', details)]); assert.ok(results.every(r => r.status === 200));
    assert.equal(await Profile.countDocuments({ userId: user._id }), 1);
    await Profile.updateOne({ userId: user._id }, { $set: { bio: 'Preserved profile edit', discipline: 'Judo' } });
    const next = await request('/login', details); assert.equal(next.body.user.bio, 'Preserved profile edit'); assert.equal(next.body.user.discipline, 'Judo');
  });
  await t.test('logout clears cookie and revokes the real stored session', async () => {
    const first = await signup(); assert.equal((await request('/logout', undefined, { Cookie: first.cookie })).status, 200);
    assert.equal((await request('/me', undefined, { Authorization: `Bearer ${first.body.token}` }, 'GET')).status, 401);
  });
});
