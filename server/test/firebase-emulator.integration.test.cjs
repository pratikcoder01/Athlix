const assert = require('node:assert/strict');
const { test } = require('node:test');
const { randomUUID } = require('node:crypto');
const express = require('express');
const mongoose = require('mongoose');
const { safeLocalMongoUri, safeTestDbName } = require('./helpers/localMongo.cjs');

test('Firebase Auth Emulator identities, recovery, legacy linking and ATHLIX sessions', {
  skip: (!process.env.FIREBASE_AUTH_EMULATOR_HOST || !process.env.TEST_MONGO_URI) && 'NOT RUN: demo Firebase Auth emulator plus loopback TEST_MONGO_URI are required',
  timeout: 120000,
}, async t => {
  const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  if (!/^127\.0\.0\.1:\d{1,5}$/.test(emulatorHost) || Number(emulatorHost.split(':')[1]) > 65535) throw new Error('Only an explicit loopback Auth emulator is permitted');
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PROJECT_ID !== 'demo-athlix') throw new Error('Refusing a non-demo Firebase project');
  if (process.env.GCLOUD_PROJECT && process.env.GCLOUD_PROJECT !== 'demo-athlix') throw new Error('Refusing a non-demo Google project');
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS) throw new Error('Real credential files are not permitted in the emulator acceptance suite');
  const uri = safeLocalMongoUri(process.env.TEST_MONGO_URI);
  const dbName = safeTestDbName(`athlix_booking_test_${randomUUID().replaceAll('-', '')}`);
  process.env.FIREBASE_PROJECT_ID = 'demo-athlix'; process.env.GCLOUD_PROJECT = 'demo-athlix';
  process.env.JWT_SECRET = `emulator-fixture-${randomUUID()}`;
  const emulator = `http://${emulatorHost}`;
  const { authAdmin } = require('../dist/config/firebase');
  const { User } = require('../dist/models/User'); const { Profile } = require('../dist/models/Profile'); const { AuthSession } = require('../dist/models/AuthSession');
  const identities = new Set(); let server;
  t.after(async () => {
    if (server) await new Promise(resolve => server.close(resolve));
    for (const uid of identities) await authAdmin.deleteUser(uid).catch(() => {});
    if (mongoose.connection.readyState === 1 && mongoose.connection.db?.databaseName === dbName) { safeTestDbName(dbName); await mongoose.connection.dropDatabase(); }
    await mongoose.disconnect();
  });
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 5000 });
  for (const model of [User, Profile, AuthSession]) await model.init();
  const app = express(); app.use(express.json()); app.use('/auth', require('../dist/routes/authRoutes').default);
  app.use((_error, _req, res, _next) => res.status(500).json({ success: false, message: 'Emulator acceptance request failed' }));
  server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const api = `http://127.0.0.1:${server.address().port}/auth`;
  async function firebase(action, body) {
    const response = await fetch(`${emulator}/identitytoolkit.googleapis.com/v1/accounts:${action}?key=demo-only-not-a-real-key`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(10000),
    });
    return { status: response.status, body: await response.json() };
  }
  async function request(path, body, headers = {}, method = 'POST') {
    const response = await fetch(`${api}${path}`, { method, headers: { Origin: 'http://localhost:3000', 'X-ATHLIX-Session': '1', 'Content-Type': 'application/json', ...headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(10000) });
    return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
  }
  async function identity() {
    const email = `${randomUUID()}@example.test`; const password = 'emulator-test-password';
    const result = await firebase('signUp', { email, password, returnSecureToken: true }); assert.equal(result.status, 200);
    identities.add(result.body.localId); return { email, password, uid: result.body.localId, token: result.body.idToken };
  }
  const exchange = token => request('/firebase', { idToken: token });
  await t.test('real emulator email sign-in exchanges through Admin verification and restores a cookie session', async () => {
    const actor = await identity();
    const signed = await firebase('signInWithPassword', { email: actor.email, password: actor.password, returnSecureToken: true }); assert.equal(signed.status, 200);
    const result = await exchange(signed.body.idToken); assert.equal(result.status, 200); assert.equal(result.body.user.role, 'athlete');
    assert.equal((await User.findById(result.body.user.id)).firebaseUid, actor.uid);
    assert.equal((await request('/session', undefined, { Cookie: result.cookie })).status, 200);
  });
  await t.test('legacy linking refuses unverified email and accepts an emulator-verified identity', async () => {
    const actor = await identity();
    const legacy = await User.create({ name: 'Synthetic Legacy Athlete', email: actor.email, password: 'legacy-test-password', role: 'athlete' });
    assert.equal((await exchange(actor.token)).status, 403);
    await authAdmin.updateUser(actor.uid, { emailVerified: true });
    const fresh = await firebase('signInWithPassword', { email: actor.email, password: actor.password, returnSecureToken: true });
    const linked = await exchange(fresh.body.idToken); assert.equal(linked.status, 200); assert.equal(linked.body.user.id, String(legacy._id));
    assert.equal((await User.findById(legacy._id)).firebaseUid, actor.uid); assert.equal(await Profile.countDocuments({ userId: legacy._id }), 1);
  });
  await t.test('password recovery changes the emulator credential; old password fails and new password signs in', async () => {
    const actor = await identity();
    const sent = await firebase('sendOobCode', { requestType: 'PASSWORD_RESET', email: actor.email }); assert.equal(sent.status, 200);
    const codesResponse = await fetch(`${emulator}/emulator/v1/projects/demo-athlix/oobCodes`, { signal: AbortSignal.timeout(10000) });
    const codes = await codesResponse.json(); const code = codes.oobCodes.find(item => item.email === actor.email && item.requestType === 'PASSWORD_RESET'); assert.ok(code?.oobCode);
    const verified = await firebase('resetPassword', { oobCode: code.oobCode }); assert.equal(verified.status, 200);
    const nextPassword = 'replacement-emulator-password';
    const changed = await firebase('resetPassword', { oobCode: code.oobCode, newPassword: nextPassword }); assert.equal(changed.status, 200);
    assert.notEqual((await firebase('signInWithPassword', { email: actor.email, password: actor.password, returnSecureToken: true })).status, 200);
    const fresh = await firebase('signInWithPassword', { email: actor.email, password: nextPassword, returnSecureToken: true }); assert.equal(fresh.status, 200);
    assert.equal((await exchange(fresh.body.idToken)).status, 200);
    assert.notEqual((await firebase('resetPassword', { oobCode: code.oobCode, newPassword: nextPassword })).status, 200);
  });
  await t.test('provider disabled identities fail exchange and cannot renew ATHLIX cookies', async () => {
    const actor = await identity(); const first = await exchange(actor.token); assert.equal(first.status, 200);
    await authAdmin.updateUser(actor.uid, { disabled: true });
    assert.equal((await exchange(actor.token)).status, 401); assert.equal((await request('/session', undefined, { Cookie: first.cookie })).status, 401);
  });
  await t.test('provider refresh revocation stops old identity exchange and ATHLIX renewal', async () => {
    const actor = await identity(); const first = await exchange(actor.token); assert.equal(first.status, 200);
    // Firebase auth_time and validSince are second-granularity, so revoke after
    // entering the next second rather than creating a false same-second result.
    await new Promise(resolve => setTimeout(resolve, 1100)); await authAdmin.revokeRefreshTokens(actor.uid);
    assert.equal((await exchange(actor.token)).status, 401); assert.equal((await request('/session', undefined, { Cookie: first.cookie })).status, 401);
  });
  await t.test('cookie replay after logout cannot restore an emulator-authenticated account', async () => {
    const actor = await identity(); const first = await exchange(actor.token); assert.equal(first.status, 200);
    assert.equal((await request('/logout', undefined, { Cookie: first.cookie })).status, 200);
    assert.equal((await request('/session', undefined, { Cookie: first.cookie })).status, 401);
    assert.equal((await request('/me', undefined, { Authorization: `Bearer ${first.body.token}` }, 'GET')).status, 401);
  });
});
