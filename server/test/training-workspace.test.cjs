const assert = require('node:assert/strict');
const { test, afterEach, mock } = require('node:test');
const { Types } = require('mongoose');
const training = require('../dist/controllers/trainingController.js');
const clients = require('../dist/controllers/coachClientController.js');
const notifications = require('../dist/controllers/notificationController.js');
const policy = require('../dist/utils/trainingPolicy.js');
const { TrainingEntry } = require('../dist/models/TrainingEntry.js');
const { TrainingPlanModel } = require('../dist/models/TrainingPlan.js');
const { Booking } = require('../dist/models/Booking.js');
const { User } = require('../dist/models/User.js');
const { Profile } = require('../dist/models/Profile.js');
const { CoachClientNote } = require('../dist/models/CoachClientNote.js');
const { Notification } = require('../dist/models/Notification.js');
const actorId = new Types.ObjectId('507f1f77bcf86cd799439011');
const target = '507f1f77bcf86cd799439012';
const actor = { _id: actorId, name: 'Fixture athlete', role: 'athlete' };
const coach = { ...actor, role: 'coach' };
const entry = { date: '2026-01-01', discipline: 'Karate', durationMinutes: 60, focus: 'Footwork', notes: 'Private reflection', effort: 4 };
const requestId = 'f3648108-5ff2-44f9-8e54-27f49c719b16';
afterEach(() => mock.restoreAll());
async function invoke(handler, { body = {}, query = {}, params = { id: target }, user = actor } = {}) {
  const res = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  await handler({ body, query, params, user }, res, error => { throw error; });
  return res;
}
function chain(records) {
  const calls = {}; const result = {};
  for (const method of ['select', 'sort', 'skip', 'limit']) result[method] = (...args) => { calls[method] = args; return result; };
  result.lean = async () => records;
  return { result, calls };
}

for (const [name, handler] of Object.entries({ ...training, ...clients, ...notifications })) {
  test(`${name} rejects missing identity before persistence`, async () => {
    const response = await invoke(handler, { user: null }); assert.equal(response.code, 401);
  });
}
test('completed training rejects forged ownership, impossible/future dates and unbounded observations', () => {
  const future = new Date(Date.now() + 172800000).toISOString().slice(0, 10);
  for (const payload of [{ ...entry, athleteId: target }, { ...entry, date: '2026-02-30' }, { ...entry, date: future },
    { ...entry, durationMinutes: 0 }, { ...entry, durationMinutes: 1441 }, { ...entry, durationMinutes: Infinity },
    { ...entry, effort: 11 }, { ...entry, focus: ' ' }, { ...entry, notes: 'x'.repeat(3001) }, { ...entry, clientRequestId: target }]) {
    assert.equal(policy.createTrainingSchema.safeParse({ clientRequestId: requestId, ...payload }).success, false);
  }
  assert.equal(policy.createTrainingSchema.safeParse({ ...entry, clientRequestId: requestId }).success, true);
});
test('training pagination rejects nested operators, arrays and excessive pages before querying', async () => {
  const find = mock.method(TrainingEntry, 'find', () => { throw Error('No invalid query'); });
  for (const query of [{ page: { $gt: 0 } }, { limit: ['12'] }, { limit: '5000' }, { page: '1001' }, { athleteId: target }]) {
    assert.equal((await invoke(training.listTrainingEntries, { query })).code, 400);
  }
  assert.equal(find.mock.callCount(), 0);
});
test('training list is bounded, owner-filtered and excludes archived rows', async () => {
  const result = chain([{ _id: target, ...entry, athleteId: 'should-not-leak', clientRequestId: requestId, version: 0 }, { _id: target }]);
  const find = mock.method(TrainingEntry, 'find', () => result.result);
  const response = await invoke(training.listTrainingEntries, { query: { page: '2', limit: '1' } });
  assert.deepEqual(find.mock.calls[0].arguments[0], { athleteId: actorId, deletedAt: { $exists: false } });
  assert.deepEqual(result.calls.skip, [1]); assert.deepEqual(result.calls.limit, [2]);
  assert.equal(response.body.hasMore, true); assert.equal(response.body.entries.length, 1);
  assert.equal(response.body.entries[0].athleteId, undefined); assert.equal(response.body.entries[0].clientRequestId, undefined);
});
test('entry creation derives actor and explicitly projects only the saved training fields', async () => {
  const create = mock.method(TrainingEntry, 'create', async fields => ({ _id: target, ...fields, internal: 'private' }));
  const response = await invoke(training.createTrainingEntry, { body: { ...entry, clientRequestId: requestId } });
  assert.equal(response.code, 201); assert.deepEqual(create.mock.calls[0].arguments[0], { ...entry, clientRequestId: requestId, athleteId: actorId, version: 0 });
  assert.equal(response.body.entry.athleteId, undefined); assert.equal(response.body.entry.internal, undefined);
});
test('network retry of the same draft returns its persisted record without duplication', async () => {
  mock.method(TrainingEntry, 'create', async () => { throw { code: 11000 }; });
  const found = chain({ _id: target, ...entry, version: 0 }); const find = mock.method(TrainingEntry, 'findOne', () => found.result);
  const response = await invoke(training.createTrainingEntry, { body: { ...entry, clientRequestId: requestId } });
  assert.equal(response.code, 200); assert.equal(response.body.entry._id, target);
  assert.deepEqual(find.mock.calls[0].arguments[0], { athleteId: actorId, clientRequestId: requestId });
});
test('reusing a draft id for altered or archived work produces conflict', async () => {
  mock.method(TrainingEntry, 'create', async () => { throw { code: 11000 }; });
  let stored = { _id: target, ...entry, version: 0, focus: 'Different saved work' };
  mock.method(TrainingEntry, 'findOne', () => chain(stored).result);
  assert.equal((await invoke(training.createTrainingEntry, { body: { ...entry, clientRequestId: requestId } })).code, 409);
  stored = { ...entry, deletedAt: new Date() };
  assert.equal((await invoke(training.createTrainingEntry, { body: { ...entry, clientRequestId: requestId } })).code, 409);
});
test('training persistence failure never becomes a fabricated saved result', async () => {
  mock.method(TrainingEntry, 'create', async () => { throw Error('Database unavailable'); });
  await assert.rejects(invoke(training.createTrainingEntry, { body: { ...entry, clientRequestId: requestId } }), /Database unavailable/);
});
test('training edits compare version and ownership in a single conditional write', async () => {
  const update = mock.method(TrainingEntry, 'findOneAndUpdate', () => chain({ _id: target, ...entry, version: 4 }).result);
  const response = await invoke(training.updateTrainingEntry, { body: { ...entry, version: 3 } });
  assert.equal(response.code, 200);
  const [filter, operation, options] = update.mock.calls[0].arguments;
  assert.deepEqual(filter, { _id: target, athleteId: actorId, version: 3, deletedAt: { $exists: false } });
  assert.deepEqual(operation, { $set: entry, $inc: { version: 1 } }); assert.equal(options.runValidators, true);
});
test('stale and foreign training edits/archives fail without revealing record existence', async () => {
  mock.method(TrainingEntry, 'findOneAndUpdate', () => chain(null).result);
  assert.equal((await invoke(training.updateTrainingEntry, { body: { ...entry, version: 1 } })).code, 409);
  assert.equal((await invoke(training.removeTrainingEntry, { body: { version: 1 } })).code, 409);
});
test('archive preserves a conditional versioned history change and rejects extra identity', async () => {
  const update = mock.method(TrainingEntry, 'findOneAndUpdate', () => chain({ _id: target }).result);
  assert.equal((await invoke(training.removeTrainingEntry, { body: { version: 0, athleteId: target } })).code, 400);
  assert.equal(update.mock.callCount(), 0);
  assert.equal((await invoke(training.removeTrainingEntry, { body: { version: 0 } })).code, 200);
  const [filter, change] = update.mock.calls[0].arguments;
  assert.equal(filter.athleteId, actorId); assert.equal(filter.version, 0); assert.ok(change.$set.deletedAt instanceof Date); assert.equal(change.$inc.version, 1);
});
test('saved plan history is readable with AI disabled but always filtered to the caller', async () => {
  const previous = process.env.AI_COACHING_ENABLED; process.env.AI_COACHING_ENABLED = 'false';
  try {
    const result = chain([{ _id: target, weekOverview: 'Saved existing plan', days: [], notes: '' }]);
    const find = mock.method(TrainingPlanModel, 'find', () => result.result);
    const response = await invoke(training.listTrainingPlans);
    assert.equal(response.code, 200); assert.deepEqual(find.mock.calls[0].arguments[0], { athleteId: actorId });
    assert.equal(result.calls.select[0].includes('athleteId'), false);
    const detail = mock.method(TrainingPlanModel, 'findOne', () => chain(null).result);
    assert.equal((await invoke(training.getTrainingPlan)).code, 404);
    assert.deepEqual(detail.mock.calls[0].arguments[0], { _id: target, athleteId: actorId });
  } finally { if (previous === undefined) delete process.env.AI_COACHING_ENABLED; else process.env.AI_COACHING_ENABLED = previous; }
});
for (const [name, handler] of Object.entries(clients)) {
  test(`${name} denies athletes and admins access to coach-private CRM`, async () => {
    assert.equal((await invoke(handler)).code, 403);
    assert.equal((await invoke(handler, { user: { ...actor, role: 'admin' } })).code, 403);
  });
}
test('coach directory derives relationships exclusively from own accepted/completed bookings', async () => {
  const aggregate = mock.method(Booking, 'aggregate', pipeline => ({ exec: async () => [] }));
  const response = await invoke(clients.listCoachClients, { user: coach }); assert.equal(response.code, 200);
  const pipeline = aggregate.mock.calls[0].arguments[0]; assert.equal(String(pipeline[0].$match.coachId), String(actorId));
  assert.deepEqual(pipeline[0].$match.status, { $in: ['accepted', 'completed'] });
  const projection = pipeline.at(-1).$project;
  assert.deepEqual(Object.keys(projection).sort(), ['_id', 'beltRank', 'completedSessions', 'discipline', 'lastScheduledTime', 'name', 'sessions']);
});
test('an unrelated athlete cannot become a coach client through a forged identifier', async () => {
  const exists = mock.method(Booking, 'exists', async () => false); const find = mock.method(User, 'findById', () => { throw Error('No private reads'); });
  assert.equal((await invoke(clients.getCoachClient, { user: coach })).code, 404);
  assert.equal((await invoke(clients.saveCoachClientNotes, { user: coach, body: { notes: 'Forged', version: 0 } })).code, 404);
  assert.equal(find.mock.callCount(), 0); assert.deepEqual(exists.mock.calls[0].arguments[0], { coachId: actorId, athleteId: target, status: { $in: ['accepted', 'completed'] } });
});
test('client details contain only this coach sessions and public name/profile plus own notes', async () => {
  mock.method(Booking, 'exists', async () => true);
  const account = chain({ _id: target, name: 'Athlete' }); const profile = chain({ discipline: 'Karate', beltRank: 'White' }); const note = chain(null); const bookings = chain([]);
  mock.method(User, 'findById', () => account.result); mock.method(Profile, 'findOne', () => profile.result);
  const noteFind = mock.method(CoachClientNote, 'findOne', () => note.result); const bookingFind = mock.method(Booking, 'find', () => bookings.result);
  const response = await invoke(clients.getCoachClient, { user: coach });
  assert.equal(response.code, 200); assert.deepEqual(response.body.notes, { text: '', version: 0, updatedAt: undefined });
  assert.deepEqual(account.calls.select, ['_id name']); assert.deepEqual(profile.calls.select, ['discipline beltRank']);
  assert.deepEqual(bookingFind.mock.calls[0].arguments[0], { coachId: actorId, athleteId: target });
  assert.deepEqual(noteFind.mock.calls[0].arguments[0], { coachId: actorId, athleteId: target });
});
test('coach notes use actor-derived unique tenant filter and compare-and-set version', async () => {
  mock.method(Booking, 'exists', async () => true);
  const update = mock.method(CoachClientNote, 'findOneAndUpdate', () => chain({ notes: 'Technique focus', version: 2 }).result);
  assert.equal((await invoke(clients.saveCoachClientNotes, { user: coach, body: { notes: ' Technique focus ', version: 1 } })).code, 200);
  const [filter, operation, options] = update.mock.calls[0].arguments;
  assert.deepEqual(filter, { coachId: actorId, athleteId: target, version: 1 }); assert.deepEqual(operation, { $set: { notes: 'Technique focus' }, $inc: { version: 1 } });
  assert.equal(options.upsert, false);
});
test('concurrent first-note upsert conflicts are surfaced rather than overwriting another draft', async () => {
  mock.method(Booking, 'exists', async () => true);
  mock.method(CoachClientNote, 'findOneAndUpdate', () => ({ select: () => ({ lean: async () => { throw { code: 11000 }; } }) }));
  assert.equal((await invoke(clients.saveCoachClientNotes, { user: coach, body: { notes: 'Draft', version: 0 } })).code, 409);
});
test('notes reject identity injection, oversized contents and absent version', async () => {
  const exists = mock.method(Booking, 'exists', () => { throw Error('No bad input reads'); });
  for (const body of [{ notes: 'Valid', coachId: target, version: 0 }, { notes: 'x'.repeat(5001), version: 0 }, { notes: 'Valid' }]) {
    assert.equal((await invoke(clients.saveCoachClientNotes, { user: coach, body })).code, 400);
  }
  assert.equal(exists.mock.callCount(), 0);
});
test('notification history and unread counts are recipient-scoped with safe projections/links', async () => {
  const rows = chain([{ _id: target, type: 'booking', message: 'Saved booking', read: false, link: 'https://evil.test', recipientId: 'private', senderId: 'private' }]);
  const find = mock.method(Notification, 'find', () => rows.result); const count = mock.method(Notification, 'countDocuments', async () => 1);
  const response = await invoke(notifications.listNotifications, { query: { unreadOnly: 'true', page: '2', limit: '10' } });
  assert.equal(response.code, 200); assert.deepEqual(find.mock.calls[0].arguments[0], { recipientId: actorId, read: false });
  assert.deepEqual(count.mock.calls[0].arguments[0], { recipientId: actorId, read: false }); assert.deepEqual(rows.calls.skip, [10]);
  assert.equal(response.body.notifications[0].link, ''); assert.equal(response.body.notifications[0].recipientId, undefined); assert.equal(response.body.notifications[0].senderId, undefined);
});
test('notification desired-state read update cannot touch another recipient and returns404', async () => {
  const update = mock.method(Notification, 'findOneAndUpdate', () => chain(null).result);
  const response = await invoke(notifications.setNotificationRead, { body: { read: true } }); assert.equal(response.code, 404);
  assert.deepEqual(update.mock.calls[0].arguments[0], { _id: target, recipientId: actorId }); assert.deepEqual(update.mock.calls[0].arguments[1], { $set: { read: true } });
});
test('notification filters and writes reject caller identity injection and nonboolean toggles', async () => {
  const update = mock.method(Notification, 'findOneAndUpdate', () => { throw Error('No malformed writes'); });
  for (const body of [{ read: true, recipientId: target }, { read: 'true' }, {}]) assert.equal((await invoke(notifications.setNotificationRead, { body })).code, 400);
  assert.equal((await invoke(notifications.listNotifications, { query: { recipientId: target } })).code, 400); assert.equal(update.mock.callCount(), 0);
});
test('legacy notification URLs cannot escape the reviewed internal destinations', () => {
  for (const link of ['https://evil.test', '//evil.test', 'javascript:alert(1)', '/bookings\\evil.test', '/bookings/../login', '/login', '/bookings\n']) assert.equal(policy.safeNotificationLink(link), '');
  assert.equal(policy.safeNotificationLink('/bookings'), '/bookings'); assert.equal(policy.safeNotificationLink('/tournaments?event=123'), '/tournaments?event=123');
});
test('mark-all-read persists only current recipient records through an explicit cutoff', async () => {
  const update = mock.method(Notification, 'updateMany', async () => ({ modifiedCount: 3 }));
  const response = await invoke(notifications.markAllNotificationsRead);
  assert.equal(response.code, 200); assert.equal(response.body.changed, 3);
  const [filter, change] = update.mock.calls[0].arguments;
  assert.equal(filter.recipientId, actorId); assert.equal(filter.read, false); assert.ok(filter.createdAt.$lte instanceof Date);
  assert.deepEqual(change, { $set: { read: true } });
  assert.equal((await invoke(notifications.markAllNotificationsRead, { body: { recipientId: target } })).code, 400);
  assert.equal(update.mock.callCount(), 1);
});
