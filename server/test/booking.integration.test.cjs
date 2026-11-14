const assert = require('node:assert/strict');
const { test, mock } = require('node:test');
const { randomUUID } = require('node:crypto');
const { fork } = require('node:child_process');
const path = require('node:path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { safeLocalMongoUri, safeTestDbName } = require('./helpers/localMongo.cjs');
const { User } = require('../dist/models/User.js');
const { Profile } = require('../dist/models/Profile.js');
const { CoachProfile } = require('../dist/models/CoachProfile.js');
const { Booking } = require('../dist/models/Booking.js');
const { Notification } = require('../dist/models/Notification.js');
const { BookingScheduleLock } = require('../dist/models/BookingScheduleLock.js');
const { RoleChangeAudit } = require('../dist/models/RoleChangeAudit.js');
const { provisionRole } = require('../dist/scripts/provisionRole.js');
const { weekdays } = require('../dist/utils/bookingPolicy.js');

test('test database guard rejects remote seeds, credentials and existing database paths', () => {
  for (const uri of ['mongodb://example.com:27017/', 'mongodb+srv://localhost/', 'mongodb://user:password@127.0.0.1/', 'mongodb://127.0.0.1/athlix', 'mongodb://localhost,example.com/',
    'mongodb://127.0.0.1/?proxyHost=example.com', 'mongodb://127.0.0.1/?tlsCertificateKeyFile=private.pem',
    'mongodb://127.0.0.1/?replicaSet=rs0&replicaSet=rs1', 'mongodb://127.0.0.1/?replicaSet=invalid%20name']) {
    assert.throws(() => safeLocalMongoUri(uri));
  }
  assert.throws(() => safeTestDbName('athlix'));
  assert.equal(new URL(safeLocalMongoUri('mongodb://127.0.0.1:27017/?replicaSet=rs0')).searchParams.get('directConnection'), 'true');
});

test('real replica-set booking isolation, persistence and rollback across independent API processes', {
  skip: !process.env.TEST_MONGO_URI && 'NOT RUN: set loopback TEST_MONGO_URI for an isolated MongoDB replica set', timeout: 120000,
}, async t => {
  // This suite intentionally never reads MONGO_URI or any production credentials.
  const uri = safeLocalMongoUri(process.env.TEST_MONGO_URI);
  const dbName = safeTestDbName(`athlix_booking_test_${randomUUID().replaceAll('-', '')}`);
  const secret = `test-only-${randomUUID()}`;
  const workers = [];
  t.after(async () => {
    for (const child of workers) {
      if (child.exitCode !== null) continue;
      await new Promise(resolve => {
        const timer = setTimeout(() => { child.kill(); resolve(); }, 3000);
        child.once('exit', () => { clearTimeout(timer); resolve(); });
        if (child.connected) child.send({ type: 'shutdown' }); else child.kill();
      });
    }
    if (mongoose.connection.readyState === 1 && mongoose.connection.db?.databaseName === dbName) {
      safeTestDbName(mongoose.connection.db.databaseName);
      await mongoose.connection.dropDatabase();
    }
    await mongoose.disconnect();
  });
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 5000, maxPoolSize: 20 });
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  assert.ok(hello.setName, 'A replica set is required; a standalone database cannot prove transaction correctness');
  for (const model of [User, Profile, CoachProfile, Booking, Notification, BookingScheduleLock, RoleChangeAudit]) await model.init();

  async function startApi(failNotifications = false) {
    const child = fork(path.join(__dirname, 'helpers', 'booking-api-worker.cjs'), [], {
      env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot,
        TEST_MONGO_URI: uri, ATHLIX_TEST_DB_NAME: dbName, JWT_SECRET: secret,
        ATHLIX_TEST_FAIL_NOTIFICATIONS: String(failNotifications) },
      stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
    });
    workers.push(child);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Test API startup timed out')), 15000);
      child.once('error', error => { clearTimeout(timer); reject(error); });
      child.once('exit', code => { clearTimeout(timer); reject(new Error(`Test API exited before readiness (${code})`)); });
      child.once('message', message => {
        clearTimeout(timer);
        if (message.ready) resolve(`http://127.0.0.1:${message.port}`); else reject(new Error(message.error));
      });
    });
  }
  const apiA = await startApi();
  const apiB = await startApi();
  const failingApi = await startApi(true);

  async function fixture() {
    const people = await User.create([
      { name: 'Integration Athlete A', role: 'athlete', isActive: true },
      { name: 'Integration Athlete B', role: 'athlete', isActive: true },
      { name: 'Integration Other Athlete', role: 'athlete', isActive: true },
      { name: 'Integration Coach A', role: 'coach', isActive: true },
      { name: 'Integration Coach B', role: 'coach', isActive: true },
    ]);
    const [athleteA, athleteB, otherAthlete, coachA, coachB] = people;
    const availability = weekdays.map(dayOfWeek => ({ dayOfWeek, startTime: '09:00', endTime: '18:00' }));
    for (const coach of [coachA, coachB]) {
      await Profile.create({ userId: coach._id, discipline: 'Karate', beltRank: 'Black', bio: 'Controlled test data' });
      await CoachProfile.create({ userId: coach._id, active: true, autoConfirm: false, pricingPerHour: 80,
        currency: 'INR', availabilityTimezone: 'UTC', availability });
    }
    const start = new Date(Date.now() + 86400000); start.setUTCHours(10, 0, 0, 0);
    const details = { coachId: String(coachA._id), scheduledTime: start.toISOString(), durationMinutes: 60 };
    return { athleteA, athleteB, otherAthlete, coachA, coachB, start, details };
  }
  async function request(api, actor, route, body, method = 'POST') {
    const token = jwt.sign({ id: String(actor._id) }, secret, { expiresIn: '1h' });
    const response = await fetch(`${api}${route}`, { method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, body: await response.json() };
  }

  await t.test('real discovery and server price persist correctly without exposing identity controls', async () => {
    const f = await fixture();
    const result = await request(apiA, f.athleteA, '/api/bookings', { ...f.details, durationMinutes: 90, price: 0 });
    assert.equal(result.status, 201);
    const saved = await Booking.findById(result.body.booking._id).lean();
    assert.equal(saved.price, 120); assert.equal(saved.currency, 'INR');
    assert.equal(saved.scheduledTime.toISOString(), f.details.scheduledTime);
    assert.equal(await Notification.countDocuments({ recipientId: f.coachA._id }), 1);
    const discovery = await request(apiA, f.athleteA, `/api/bookings/coaches?coachId=${f.coachA._id}`, undefined, 'GET');
    assert.equal(discovery.status, 200);
    assert.equal(discovery.body.coaches[0].id, String(f.coachA._id));
    assert.equal(discovery.body.coaches[0].discipline, 'Karate');
    assert.equal(discovery.body.coaches[0].email, undefined);
    assert.equal(discovery.body.coaches[0].firebaseUid, undefined);
  });

  await t.test('two API processes and different athletes cannot reserve overlapping coach time', async () => {
    const f = await fixture();
    const results = await Promise.all([
      request(apiA, f.athleteA, '/api/bookings', f.details),
      request(apiB, f.athleteB, '/api/bookings', f.details),
    ]);
    assert.deepEqual(results.map(result => result.status).sort(), [201, 409]);
    assert.equal(await Booking.countDocuments({ coachId: f.coachA._id }), 1);
    assert.equal(await Notification.countDocuments({ recipientId: f.coachA._id }), 1);
  });

  await t.test('two API processes cannot double-book an athlete across different coaches', async () => {
    const f = await fixture();
    const results = await Promise.all([
      request(apiA, f.athleteA, '/api/bookings', f.details),
      request(apiB, f.athleteA, '/api/bookings', { ...f.details, coachId: String(f.coachB._id) }),
    ]);
    assert.deepEqual(results.map(result => result.status).sort(), [201, 409]);
    assert.equal(await Booking.countDocuments({ athleteId: f.athleteA._id }), 1);
  });

  await t.test('adjacent sessions are permitted, while old records without currency still block overlaps', async () => {
    const f = await fixture();
    await Booking.collection.insertOne({ athleteId: f.athleteA._id, coachId: f.coachA._id, scheduledTime: f.start,
      durationMinutes: 60, price: 10, status: 'accepted' });
    assert.equal((await request(apiB, f.athleteB, '/api/bookings', f.details)).status, 409);
    const adjacent = new Date(f.start.getTime() + 3600000).toISOString();
    assert.equal((await request(apiA, f.athleteB, '/api/bookings', { ...f.details, scheduledTime: adjacent })).status, 201);
  });

  await t.test('owner status transitions persist, cancellation releases time and terminal states cannot reopen', async () => {
    const f = await fixture();
    const created = await request(apiA, f.athleteA, '/api/bookings', f.details);
    const route = `/api/bookings/${created.body.booking._id}`;
    assert.equal((await request(apiB, f.otherAthlete, route, { status: 'cancelled' }, 'PATCH')).status, 403);
    assert.equal((await request(apiB, f.coachA, route, { status: 'accepted' }, 'PATCH')).status, 200);
    assert.equal((await request(apiA, f.athleteA, route, { status: 'cancelled' }, 'PATCH')).status, 200);
    assert.equal((await request(apiB, f.coachA, route, { status: 'accepted' }, 'PATCH')).status, 409);
    assert.equal((await request(apiB, f.athleteB, '/api/bookings', f.details)).status, 201);
    assert.equal((await Booking.findById(created.body.booking._id)).status, 'cancelled');
  });

  await t.test('notification storage failure rolls back real booking and frees the reservation', async () => {
    const f = await fixture();
    const failed = await request(failingApi, f.athleteA, '/api/bookings', f.details);
    assert.equal(failed.status, 500);
    assert.equal(await Booking.countDocuments({ coachId: f.coachA._id }), 0);
    assert.equal(await Notification.countDocuments({ recipientId: f.coachA._id }), 0);
    assert.equal((await request(apiB, f.athleteA, '/api/bookings', f.details)).status, 201);
  });

  await t.test('coach rate publication and stale quotes use real database state across processes', async () => {
    const f = await fixture();
    const updated = await request(apiA, f.coachA, '/api/profiles/coach', { pricingPerHour: 100 }, 'PUT');
    assert.equal(updated.status, 200);
    const stale = await request(apiB, f.athleteA, '/api/bookings', { ...f.details, quotedPrice: 80, quotedCurrency: 'INR' });
    assert.equal(stale.status, 409);
    const created = await request(apiB, f.athleteA, '/api/bookings', { ...f.details, quotedPrice: 100, quotedCurrency: 'INR' });
    assert.equal(created.status, 201); assert.equal(created.body.booking.price, 100);
  });

  await t.test('operator role changes commit with audit and a failed audit rolls back the real role update', async () => {
    const f = await fixture();
    const options = { userId: String(f.otherAthlete._id), role: 'coach', expectedRole: 'athlete',
      operator: 'integration-operator', reason: 'Controlled integration approval test', apply: true };
    const injected = mock.method(RoleChangeAudit, 'create', async () => { throw new Error('Injected audit write failure'); });
    try { await assert.rejects(() => provisionRole(options), /Injected audit write failure/); }
    finally { injected.mock.restore(); }
    assert.equal((await User.findById(f.otherAthlete._id)).role, 'athlete');
    assert.equal(await RoleChangeAudit.countDocuments({ userId: f.otherAthlete._id }), 0);
    const result = await provisionRole(options);
    assert.equal(result.applied, true);
    assert.equal((await User.findById(f.otherAthlete._id)).role, 'coach');
    assert.equal(await RoleChangeAudit.countDocuments({ userId: f.otherAthlete._id }), 1);
    assert.equal((await CoachProfile.findOne({ userId: f.otherAthlete._id })).active, false);
  });
});
