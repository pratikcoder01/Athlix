const assert = require('node:assert/strict');
const { test, before, after, afterEach, mock } = require('node:test');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { User } = require('../dist/models/User.js');
const { CoachProfile } = require('../dist/models/CoachProfile.js');
const { Booking } = require('../dist/models/Booking.js');
const { Notification } = require('../dist/models/Notification.js');
const { BookingScheduleLock } = require('../dist/models/BookingScheduleLock.js');
const policy = require('../dist/utils/bookingPolicy.js');
const { withScheduleTransaction } = require('../dist/utils/bookingTransaction.js');
const { updateCoachProfile } = require('../dist/controllers/profileController.js');
const protect = require('../dist/middleware/authMiddleware.js').default;

process.env.JWT_SECRET = 'booking-regression-secret-only';
const athleteId = '507f1f77bcf86cd799439011';
const coachId = '507f1f77bcf86cd799439012';
const strangerId = '507f1f77bcf86cd799439013';
const bookingId = '507f1f77bcf86cd799439014';
const start = new Date(Date.now() + 86400000); start.setUTCHours(10, 0, 0, 0);
const startIso = start.toISOString();
const accounts = {
  [athleteId]: { _id: athleteId, role: 'athlete', isActive: true, name: 'Test Athlete' },
  [coachId]: { _id: coachId, role: 'coach', isActive: true, name: 'Test Coach' },
  [strangerId]: { _id: strangerId, role: 'athlete', isActive: true, name: 'Other Athlete' },
};
const schedule = {
  userId: coachId, active: true, autoConfirm: false, pricingPerHour: 80, currency: 'INR', availabilityTimezone: 'UTC',
  availability: policy.weekdays.map(dayOfWeek => ({ dayOfWeek, startTime: '09:00', endTime: '18:00' })),
};
const details = { coachId, scheduledTime: startIso, durationMinutes: 90 };
const booking = (fields = {}) => ({ _id: bookingId, athleteId, coachId, scheduledTime: start, durationMinutes: 90, price: 120, currency: 'INR', status: 'pending', ...fields });
const query = value => ({
  then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
  select: async () => value,
  session: async () => value,
});

let server;
let base;
const emitted = [];
const app = express();
app.use(express.json());
app.set('io', { to: room => ({ emit: (event, value) => emitted.push({ room, event, value }) }) });
app.use('/bookings', require('../dist/routes/bookingRoutes.js').default);
app.put('/settings', protect, updateCoachProfile);
app.use((error, _req, res, _next) => res.status(error.statusCode || 500).json({ success: false, message: error.message }));
before(async () => {
  server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
afterEach(() => { mock.restoreAll(); emitted.length = 0; });

async function request(path, body, actor = athleteId, method = 'POST') {
  const token = jwt.sign({ id: actor }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const response = await fetch(`${base}${path}`, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: response.status, body: await response.json() };
}

function fixture(overrides = {}) {
  const timeline = [];
  const session = {
    withTransaction: mock.fn(async callback => {
      timeline.push('transaction');
      try { const result = await callback(); timeline.push('commit'); return result; }
      catch (error) { timeline.push('abort'); throw error; }
    }), endSession: mock.fn(async () => timeline.push('end')),
  };
  mock.method(mongoose, 'startSession', async () => session);
  const locks = mock.method(BookingScheduleLock, 'updateOne', async (_filter, update) => {
    timeline.push(update.$inc ? 'lock' : 'initialize-lock'); return { matchedCount: 1 };
  });
  mock.method(User, 'findById', id => query(overrides.coach && String(id) === coachId ? overrides.coach : accounts[String(id)]));
  mock.method(User, 'exists', () => query(overrides.athlete === false ? null : { _id: athleteId }));
  mock.method(CoachProfile, 'findOne', () => {
    timeline.push('read-profile'); const value = overrides.profile === null ? null : { ...schedule, ...overrides.profile };
    return query(value && { ...value, toObject: () => value });
  });
  const conflict = mock.method(Booking, 'findOne', () => { timeline.push('read-conflict'); return query(overrides.conflict || null); });
  const create = mock.method(Booking, 'create', async (values, options) => { timeline.push('create'); assert.equal(options.session, session); return values.map(value => booking(value)); });
  const notifications = mock.method(Notification, 'create', async (values, options) => {
    timeline.push('notifications'); assert.equal(options.session, session);
    if (overrides.notificationError) throw new Error('notification unavailable');
    return values.map((value, index) => ({ _id: `notice-${index}`, createdAt: new Date(), ...value }));
  });
  const current = overrides.booking || booking();
  mock.method(Booking, 'findById', () => query(current));
  const update = mock.method(Booking, 'findOneAndUpdate', async (_filter, change, options) => {
    assert.equal(options.session, session); return overrides.changedConcurrently ? null : { ...current, status: change.$set.status };
  });
  return { session, timeline, locks, conflict, create, notifications, update };
}

test('booking uses persisted hourly rate, exact selected start, currency and duration; client price is ignored', async () => {
  const state = fixture();
  const result = await request('/bookings', { ...details, price: 0, quotedPrice: 120, quotedCurrency: 'INR' });
  assert.equal(result.status, 201);
  assert.equal(result.body.booking.price, 120);
  assert.equal(result.body.booking.currency, 'INR');
  assert.equal(result.body.booking.scheduledTime, startIso);
  assert.equal(result.body.booking.durationMinutes, 90);
  assert.equal(result.body.booking.athleteId, athleteId);
  assert.equal(result.body.booking.status, 'pending');
  assert.equal(state.create.mock.callCount(), 1);
  assert.equal(state.timeline.filter(event => event === 'lock').length, 2);
  assert.ok(state.timeline.lastIndexOf('lock') < state.timeline.indexOf('read-conflict'));
  assert.ok(state.timeline.indexOf('notifications') < state.timeline.indexOf('commit'));
  assert.equal(state.session.endSession.mock.callCount(), 1);
  assert.deepEqual(emitted.filter(event => event.event === 'booking_update').map(event => event.room).sort(), [athleteId, coachId].sort());
  const filter = state.conflict.mock.calls[0].arguments[0];
  assert.deepEqual(filter.status, { $in: ['pending', 'accepted'] });
  assert.ok(filter.$expr.$gt[0].$add); // Existing records need no migration/end timestamp.
  assert.deepEqual(filter.$or, [{ coachId: { $in: [coachId, athleteId] } }, { athleteId: { $in: [coachId, athleteId] } }]);
});

test('auto-confirm creates accepted session and two notifications in the transaction', async () => {
  const state = fixture({ profile: { autoConfirm: true } });
  const result = await request('/bookings', details);
  assert.equal(result.status, 201);
  assert.equal(result.body.booking.status, 'accepted');
  assert.equal(state.notifications.mock.calls[0].arguments[0].length, 2);
});

for (const invalid of [
  { coachId: { $ne: null } }, { coachId: 'fake-coach' }, { durationMinutes: 0 }, { durationMinutes: 14 },
  { durationMinutes: 15.5 }, { durationMinutes: 241 }, { scheduledTime: 'not-a-date' },
  { scheduledTime: startIso.slice(0, 16) }, { scheduledTime: '2020-01-01T10:00:00Z' },
  { scheduledTime: new Date(Date.now() + 100 * 86400000).toISOString() },
  { scheduledTime: startIso.replace('10:00:', '10:07:') }, { price: -1 },
  { athleteId: strangerId }, { status: 'accepted' }, { quotedPrice: 1 },
]) {
  test(`booking rejects invalid or client-owned details ${JSON.stringify(invalid)} without writes`, async () => {
    const state = fixture();
    const result = await request('/bookings', { ...details, ...invalid });
    assert.equal(result.status, 400);
    assert.equal(state.locks.mock.callCount(), 0);
    assert.equal(state.create.mock.callCount(), 0);
  });
}

test('booking rejects self booking before schedule writes', async () => {
  const state = fixture();
  const result = await request('/bookings', { ...details, coachId: athleteId });
  assert.equal(result.status, 400);
  assert.equal(state.locks.mock.callCount(), 0);
});

test('non-athlete accounts cannot use athlete booking capability', async () => {
  const state = fixture();
  const result = await request('/bookings', details, coachId);
  assert.equal(result.status, 403);
  assert.equal(state.locks.mock.callCount(), 0);
});

for (const overrides of [
  { coach: { ...accounts[coachId], role: 'athlete' } }, { coach: { ...accounts[coachId], isActive: false } },
]) test('booking rejects inactive or unapproved coach', async () => {
  const state = fixture(overrides);
  const result = await request('/bookings', details);
  assert.equal(result.status, 404);
  assert.equal(state.create.mock.callCount(), 0);
});

for (const profile of [null, { active: false }, { currency: undefined }, { availabilityTimezone: undefined }, { availability: [] }, { pricingPerHour: -1 }]) {
  test(`booking rejects unpublished or invalid coach profile ${JSON.stringify(profile)}`, async () => {
    const state = fixture({ profile });
    const result = await request('/bookings', details);
    assert.equal(result.status, 409);
    assert.equal(state.create.mock.callCount(), 0);
  });
}

test('booking rejects unavailable hours, legacy overlap and stale price quote', async () => {
  const state = fixture({ conflict: booking() });
  const unavailable = await request('/bookings', { ...details, scheduledTime: startIso.replace('10:00:', '20:00:') });
  assert.equal(unavailable.status, 409);
  const stale = await request('/bookings', { ...details, quotedPrice: 0, quotedCurrency: 'USD' });
  assert.equal(stale.status, 409);
  const overlap = await request('/bookings', details);
  assert.equal(overlap.status, 409);
  assert.equal(state.create.mock.callCount(), 0);
  assert.equal(state.notifications.mock.callCount(), 0);
});

test('booking re-checks active athlete inside the transaction', async () => {
  const state = fixture({ athlete: false });
  const result = await request('/bookings', details);
  assert.equal(result.status, 403);
  assert.equal(state.create.mock.callCount(), 0);
});

test('notification failure rejects transaction and never sends realtime success', async () => {
  const state = fixture({ notificationError: true });
  const result = await request('/bookings', details);
  assert.equal(result.status, 500);
  assert.ok(state.timeline.includes('abort'));
  assert.ok(!state.timeline.includes('commit'));
  assert.equal(emitted.length, 0);
  assert.equal(state.session.endSession.mock.callCount(), 1);
});

test('standalone MongoDB fails closed rather than falling back to a race-prone booking write', async () => {
  const state = fixture();
  mock.method(state.session, 'withTransaction', async () => { const error = new Error('standalone'); error.code = 20; throw error; });
  const result = await request('/bookings', details);
  assert.equal(result.status, 503);
  assert.equal(state.create.mock.callCount(), 0);
});

test('another account cannot modify a booking; athletes cannot accept their own requests', async () => {
  const state = fixture();
  assert.equal((await request(`/bookings/${bookingId}`, { status: 'cancelled' }, strangerId, 'PATCH')).status, 403);
  assert.equal((await request(`/bookings/${bookingId}`, { status: 'accepted' }, athleteId, 'PATCH')).status, 403);
  assert.equal(state.locks.mock.callCount(), 0);
  assert.equal(state.update.mock.callCount(), 0);
});

for (const scenario of [
  { current: 'pending', status: 'accepted', actor: coachId, expected: 200 },
  { current: 'pending', status: 'rejected', actor: coachId, expected: 200 },
  { current: 'pending', status: 'cancelled', actor: athleteId, expected: 200 },
  { current: 'accepted', status: 'cancelled', actor: athleteId, expected: 200 },
  { current: 'accepted', status: 'rejected', actor: coachId, expected: 409 },
  { current: 'rejected', status: 'accepted', actor: coachId, expected: 409 },
  { current: 'cancelled', status: 'accepted', actor: coachId, expected: 409 },
  { current: 'completed', status: 'accepted', actor: coachId, expected: 409 },
  { current: 'accepted', status: 'completed', actor: coachId, expected: 409 },
]) test(`owner status transition ${scenario.current} -> ${scenario.status} returns ${scenario.expected}`, async () => {
  const state = fixture({ booking: booking({ status: scenario.current }) });
  const result = await request(`/bookings/${bookingId}`, { status: scenario.status }, scenario.actor, 'PATCH');
  assert.equal(result.status, scenario.expected);
  assert.equal(state.update.mock.callCount(), scenario.expected === 200 ? 1 : 0);
  if (scenario.expected === 200) assert.deepEqual(state.update.mock.calls[0].arguments[0], { _id: bookingId, status: scenario.current });
});

test('accepted session can complete only after its end; cancellation after start is rejected', async () => {
  const past = new Date(Date.now() - 2 * 3600000);
  const state = fixture({ booking: booking({ status: 'accepted', scheduledTime: past, durationMinutes: 60 }) });
  assert.equal((await request(`/bookings/${bookingId}`, { status: 'cancelled' }, athleteId, 'PATCH')).status, 409);
  const result = await request(`/bookings/${bookingId}`, { status: 'completed' }, coachId, 'PATCH');
  assert.equal(result.status, 200);
  assert.equal(state.update.mock.callCount(), 1);
});

test('idempotent status retries do not duplicate notifications; changed status refuses overwrite', async () => {
  const state = fixture({ booking: booking({ status: 'accepted' }), changedConcurrently: true });
  assert.equal((await request(`/bookings/${bookingId}`, { status: 'accepted' }, coachId, 'PATCH')).status, 200);
  assert.equal(state.notifications.mock.callCount(), 0);
  assert.equal((await request(`/bookings/${bookingId}`, { status: 'cancelled' }, athleteId, 'PATCH')).status, 409);
  assert.equal(state.notifications.mock.callCount(), 0);
});

test('status updates validate identifier, shape and enum before database access', async () => {
  const state = fixture();
  assert.equal((await request('/bookings/bad-id', { status: 'accepted' }, coachId, 'PATCH')).status, 400);
  assert.equal((await request(`/bookings/${bookingId}`, { status: 'pending' }, coachId, 'PATCH')).status, 400);
  assert.equal((await request(`/bookings/${bookingId}`, { status: 'accepted', athleteId: strangerId }, coachId, 'PATCH')).status, 400);
  assert.equal(state.locks.mock.callCount(), 0);
});

test('coach settings require role, bounded input, nonoverlapping hours and explicit UTC publication', async () => {
  const state = fixture({ profile: { availabilityTimezone: undefined } });
  const update = mock.method(CoachProfile, 'findOneAndUpdate', async () => ({ ...schedule }));
  assert.equal((await request('/settings', { active: true }, athleteId, 'PUT')).status, 403);
  assert.equal((await request('/settings', { ratings: 5 }, coachId, 'PUT')).status, 400);
  assert.equal((await request('/settings', { availability: [schedule.availability[0], schedule.availability[0]] }, coachId, 'PUT')).status, 400);
  assert.equal((await request('/settings', { pricingPerHour: -1 }, coachId, 'PUT')).status, 400);
  assert.equal((await request('/settings', { active: true }, coachId, 'PUT')).status, 409);
  assert.equal(update.mock.callCount(), 0);
  const result = await request('/settings', { active: true, availabilityTimezone: 'UTC', currency: 'INR' }, coachId, 'PUT');
  assert.equal(result.status, 200);
  assert.equal(update.mock.calls[0].arguments[2].session, state.session);
});

test('coach discovery bounds/escapes filters, only selects active published coaches and excludes private identity fields', async () => {
  fixture();
  const aggregate = mock.method(CoachProfile, 'aggregate', () => ({ exec: async () => [] }));
  const result = await request('/bookings/coaches?search=%28.%2B%29%2B', undefined, athleteId, 'GET');
  assert.equal(result.status, 200);
  const pipeline = aggregate.mock.calls[0].arguments[0];
  assert.equal(pipeline[0].$match.active, true);
  assert.equal(pipeline[0].$match.availabilityTimezone, 'UTC');
  assert.equal(pipeline[3].$match['user.role'], 'coach');
  assert.equal(pipeline[3].$match['user.isActive'], true);
  assert.equal(pipeline[3].$match['user.name'].$regex, '\\(\\.\\+\\)\\+');
  assert.equal(JSON.stringify(pipeline.at(-1)).includes('email'), false);
  assert.equal(JSON.stringify(pipeline.at(-1)).includes('firebaseUid'), false);
  assert.equal((await request('/bookings/coaches?limit=100000', undefined, athleteId, 'GET')).status, 400);
});

test('booking history queries both participant fields, scopes pagination and excludes contact fields', async () => {
  fixture();
  const populate = mock.fn();
  const chain = { populate(...args) { populate(...args); return this; }, sort() { return this; }, skip() { return this; }, limit() { return this; }, exec: async () => [] };
  const find = mock.method(Booking, 'find', () => chain);
  const result = await request('/bookings', undefined, coachId, 'GET');
  assert.equal(result.status, 200);
  assert.deepEqual(find.mock.calls[0].arguments[0], { $or: [{ athleteId: coachId }, { coachId }] });
  assert.equal(populate.mock.calls.every(call => call.arguments[1] === 'name'), true);
  assert.equal((await request('/bookings?limit=100000', undefined, coachId, 'GET')).status, 400);
});

test('participant schedule locking is deterministic, tolerates first-use duplicate insert and releases on failure', async () => {
  const state = fixture();
  let initialization = true;
  mock.method(BookingScheduleLock, 'updateOne', async (_filter, update) => {
    if (update.$setOnInsert && initialization) { initialization = false; const error = new Error('concurrent primary key insert'); error.code = 11000; throw error; }
    return { matchedCount: 1 };
  });
  await assert.rejects(() => withScheduleTransaction([coachId, athleteId, coachId], async () => { throw new Error('rollback signal'); }), /rollback signal/);
  assert.equal(state.session.endSession.mock.callCount(), 1);
  const calls = BookingScheduleLock.updateOne.mock.calls;
  assert.deepEqual(calls.filter(call => call.arguments[1].$inc).map(call => call.arguments[0]._id), [athleteId, coachId].sort());
});

test('price rounding, UTC boundaries and forward-only status rules are deterministic', () => {
  assert.equal(policy.sessionPrice(19.99, 45), 14.99);
  assert.equal(policy.sessionPrice(0, 60), 0);
  assert.throws(() => policy.sessionPrice(-1, 60));
  assert.equal(policy.isWithinAvailability(schedule, new Date('2026-11-16T09:00:00Z'), 60), true);
  assert.equal(policy.isWithinAvailability(schedule, new Date('2026-11-16T17:30:00Z'), 60), false);
  assert.equal(policy.isWithinAvailability(schedule, new Date('2026-11-16T18:00:00+01:00'), 60), true);
  assert.equal(policy.canChangeBookingStatus('cancelled', 'accepted', 'coach', 100, 200, 0), false);
  assert.equal(policy.canChangeBookingStatus('accepted', 'completed', 'coach', 100, 200, 199), false);
  assert.equal(policy.canChangeBookingStatus('accepted', 'completed', 'coach', 100, 200, 200), true);
});
