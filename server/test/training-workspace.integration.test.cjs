const assert = require('node:assert/strict');
const { test } = require('node:test');
const { randomUUID } = require('node:crypto');
const express = require('express');
const mongoose = require('mongoose');
const { accessToken } = require('./helpers/sessionTokens.cjs');
const { safeLocalMongoUri, safeTestDbName } = require('./helpers/localMongo.cjs');
const { User } = require('../dist/models/User.js');
const { AuthSession } = require('../dist/models/AuthSession.js');
const { Profile } = require('../dist/models/Profile.js');
const { TrainingEntry } = require('../dist/models/TrainingEntry.js');
const { TrainingPlanModel } = require('../dist/models/TrainingPlan.js');
const { CoachClientNote } = require('../dist/models/CoachClientNote.js');
const { Booking } = require('../dist/models/Booking.js');
const { Notification } = require('../dist/models/Notification.js');

test('real MongoDB training history, coach-client isolation and notification persistence', {
  skip: !process.env.TEST_MONGO_URI && 'NOT RUN: set loopback TEST_MONGO_URI for isolated persistence checks', timeout: 60000,
}, async t => {
  const uri = safeLocalMongoUri(process.env.TEST_MONGO_URI);
  const dbName = safeTestDbName(`athlix_booking_test_${randomUUID().replaceAll('-', '')}`);
  const previousSecret = process.env.JWT_SECRET; const secret = `test-only-${randomUUID()}`; process.env.JWT_SECRET = secret;
  let server;
  t.after(async () => {
    if (server) await new Promise(resolve => server.close(resolve));
    if (mongoose.connection.readyState === 1 && mongoose.connection.db.databaseName === dbName) {
      safeTestDbName(mongoose.connection.db.databaseName); await mongoose.connection.dropDatabase();
    }
    await mongoose.disconnect(); if (previousSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = previousSecret;
  });
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 5000 });
  for (const model of [User, AuthSession, Profile, TrainingEntry, TrainingPlanModel, CoachClientNote, Booking, Notification]) await model.init();
  const people = await User.create([{ name: 'Athlete A', role: 'athlete' }, { name: 'Athlete B', role: 'athlete' }, { name: 'Coach A', role: 'coach' }, { name: 'Coach B', role: 'coach' }]);
  const [athleteA, athleteB, coachA, coachB] = people;
  const tokens = new Map();
  for (const person of people) {
    const session = await AuthSession.create({ userId: person._id, sessionVersion: 0, credentialHash: randomUUID(), expiresAt: new Date(Date.now() + 3600000) });
    tokens.set(String(person._id), accessToken(String(person._id), secret, {}, { sid: String(session._id) }));
  }
  const app = express(); app.use(express.json());
  app.use('/api/training', require('../dist/routes/trainingRoutes.js').default);
  app.use('/api/coach-clients', require('../dist/routes/coachClientRoutes.js').default);
  app.use('/api/notifications', require('../dist/routes/notificationRoutes.js').default);
  app.use((_error, _req, res, _next) => res.status(500).json({ success: false, message: 'Test persistence error' }));
  server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  async function request(user, path, method = 'GET', body) {
    const response = await fetch(`${base}/api${path}`, { method, headers: { Authorization: `Bearer ${tokens.get(String(user._id))}`, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, body: await response.json() };
  }
  const details = { date: '2026-01-01', discipline: 'Karate', durationMinutes: 45, focus: 'Controlled integration drills', notes: 'Private athlete journal', clientRequestId: randomUUID() };
  let entryId;
  await t.test('draft retries deduplicate, owner history persists and concurrent edits reject stale versions', async () => {
    const creates = await Promise.all([request(athleteA, '/training/entries', 'POST', details), request(athleteA, '/training/entries', 'POST', details)]);
    assert.deepEqual(creates.map(row => row.status).sort(), [200, 201]); entryId = creates[0].body.entry._id;
    assert.equal(await TrainingEntry.countDocuments({ athleteId: athleteA._id }), 1);
    assert.equal((await request(athleteA, '/training/entries')).body.entries[0].notes, details.notes);
    assert.deepEqual((await request(athleteB, '/training/entries')).body.entries, []);
    const { clientRequestId, ...fields } = details;
    assert.equal((await request(athleteB, `/training/entries/${entryId}`, 'PATCH', { ...fields, version: 0 })).status, 409);
    const edits = await Promise.all([request(athleteA, `/training/entries/${entryId}`, 'PATCH', { ...fields, focus: 'Revision A', version: 0 }), request(athleteA, `/training/entries/${entryId}`, 'PATCH', { ...fields, focus: 'Revision B', version: 0 })]);
    assert.deepEqual(edits.map(row => row.status).sort(), [200, 409]);
  });
  await t.test('saved plan retrieval is owner-only while experimental AI remains disabled', async () => {
    const plan = await TrainingPlanModel.create({ athleteId: athleteA._id, weekOverview: 'Stored reviewed plan', days: [{ day: 'Monday', focus: 'Footwork', drills: ['Controlled drill'], duration: '30 minutes', intensity: 'low' }], notes: 'Existing fixture plan' });
    assert.equal((await request(athleteA, '/training/plans')).body.plans.length, 1);
    assert.equal((await request(athleteB, `/training/plans/${plan._id}`)).status, 404);
    assert.equal((await request(athleteA, `/training/plans/${plan._id}`)).body.plan.athleteId, undefined);
  });
  await t.test('clients derive from assigned accepted sessions and never expose athlete journals or contacts', async () => {
    await Profile.create({ userId: athleteA._id, discipline: 'Karate', beltRank: 'White' });
    await Booking.create([{ athleteId: athleteA._id, coachId: coachA._id, scheduledTime: new Date(), durationMinutes: 60, price: 100, status: 'accepted' },
      { athleteId: athleteA._id, coachId: coachB._id, scheduledTime: new Date(), durationMinutes: 60, price: 100, status: 'completed' },
      { athleteId: athleteB._id, coachId: coachA._id, scheduledTime: new Date(), durationMinutes: 60, price: 100, status: 'pending' }]);
    const list = await request(coachA, '/coach-clients'); assert.equal(list.status, 200); assert.equal(list.body.clients.length, 1); assert.equal(list.body.clients[0]._id, String(athleteA._id));
    assert.equal(list.body.clients[0].email, undefined); assert.equal((await request(athleteA, '/coach-clients')).status, 403);
    const detail = await request(coachA, `/coach-clients/${athleteA._id}`); assert.equal(detail.body.sessions.length, 1); assert.equal(detail.body.client.phone, undefined); assert.equal(detail.body.entries, undefined);
    assert.deepEqual((await request(coachA, '/training/entries')).body.entries, []);
    assert.equal((await request(coachA, `/coach-clients/${athleteB._id}`)).status, 404);
  });
  await t.test('coach-private notes persist per relationship and reject concurrent first writes', async () => {
    const endpoint = `/coach-clients/${athleteA._id}/notes`;
    const writes = await Promise.all([request(coachA, endpoint, 'PUT', { notes: 'Draft A', version: 0 }), request(coachA, endpoint, 'PUT', { notes: 'Draft B', version: 0 })]);
    assert.deepEqual(writes.map(row => row.status).sort(), [200, 409]);
    assert.equal(await CoachClientNote.countDocuments({ coachId: coachA._id, athleteId: athleteA._id }), 1);
    const own = await request(coachA, `/coach-clients/${athleteA._id}`); assert.equal(own.body.notes.version, 1);
    const other = await request(coachB, `/coach-clients/${athleteA._id}`); assert.equal(other.body.notes.text, ''); assert.equal(other.body.notes.version, 0);
    assert.equal((await request(athleteA, endpoint, 'PUT', { notes: 'Cannot write coach notes', version: 1 })).status, 403);
  });
  await t.test('notifications survive reconnect reads and exact-state updates remain recipient-scoped', async () => {
    const [mine, theirs] = await Notification.create([{ recipientId: athleteA._id, senderId: coachA._id, type: 'booking', message: 'Persisted session acceptance', read: false, link: '/bookings' },
      { recipientId: athleteB._id, senderId: coachA._id, type: 'booking', message: 'Other account update', read: false, link: 'https://evil.example' }]);
    const inbox = await request(athleteA, '/notifications'); assert.equal(inbox.body.unreadCount, 1); assert.equal(inbox.body.notifications.length, 1);
    assert.equal((await request(athleteA, `/notifications/${theirs._id}`, 'PATCH', { read: true })).status, 404);
    assert.equal((await request(athleteA, `/notifications/${mine._id}`, 'PATCH', { read: true })).status, 200);
    assert.equal((await request(athleteA, '/notifications')).body.unreadCount, 0);
    assert.equal((await request(athleteB, '/notifications')).body.notifications[0].link, '');
    assert.equal((await request(athleteB, '/notifications/read-all', 'POST', {})).body.changed, 1);
    assert.equal((await Notification.findById(theirs._id)).read, true);
  });
  await t.test('archiving removes completed work from active history without cross-owner mutation', async () => {
    assert.equal((await request(athleteB, `/training/entries/${entryId}`, 'DELETE', { version: 1 })).status, 409);
    assert.equal((await request(athleteA, `/training/entries/${entryId}`, 'DELETE', { version: 1 })).status, 200);
    assert.deepEqual((await request(athleteA, '/training/entries')).body.entries, []);
    assert.equal((await request(athleteA, '/training/entries', 'POST', details)).status, 409);
  });
});
