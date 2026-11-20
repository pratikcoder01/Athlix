const assert = require('node:assert/strict');
const { test, afterEach, mock } = require('node:test');
const mongoose = require('mongoose');
const { Academy } = require('../dist/models/Academy.js');
const { AcademyMember } = require('../dist/models/AcademyMember.js');
const { AcademyAttendance } = require('../dist/models/AcademyAttendance.js');
const controller = require('../dist/controllers/academyOperationsController.js');
const directory = require('../dist/controllers/academyController.js');
const policy = require('../dist/utils/academyOperationsPolicy.js');
const transaction = require('../dist/utils/academyTransaction.js');
const id = '507f1f77bcf86cd799439011', ownerId = '507f1f77bcf86cd799439012', memberId = '507f1f77bcf86cd799439013';
const user = { _id: new mongoose.Types.ObjectId(ownerId), role: 'academy_owner' };
const academy = { _id: new mongoose.Types.ObjectId(id), ownerId: user._id, name: 'Owned academy', version: 0, archivedAt: null };
const member = { memberCode: 'ath-1', name: 'Permissioned member', discipline: 'Karate', joinedOn: policy.utcDay(), permissionConfirmed: true };
afterEach(() => mock.restoreAll());
function query(result, inspect = {}) { return { select(value) { inspect.select = value; return this; }, populate(value) { inspect.populate = value; return this; },
  sort(value) { inspect.sort = value; return this; }, skip(value) { inspect.skip = value; return this; }, limit(value) { inspect.limit = value; return this; }, session(value) { inspect.session = value; return this; },
  lean() { return Promise.resolve(result); }, exec() { return Promise.resolve(result); }, then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); } }; }
async function invoke(handler, fields = {}) {
  const req = { user, body: {}, params: { id }, query: {}, ...fields };
  const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  let error; await handler(req, res, value => { error = value; }); return { req, res, error };
}
function own(record = academy) { return mock.method(Academy, 'findOne', () => query(record)); }
function write() { return mock.method(transaction, 'withAcademyWrite', async (_scope, work) => work({ fixture: true })); }

test('listing patches never materialize defaults or accept authority/count mass assignment', () => {
  assert.deepEqual(policy.academyListingUpdateSchema.parse({ expectedVersion: 0, isPublished: false }), { expectedVersion: 0, isPublished: false });
  for (const fields of [{}, { expectedVersion: 0 }, { expectedVersion: 0, latitude: 0 }, { expectedVersion: 0, ownerId },
    { expectedVersion: 0, membersCount: 300 }, { expectedVersion: -1, archived: true }, { expectedVersion: 0, latitude: 91, longitude: 0 }]) {
    assert.equal(policy.academyListingUpdateSchema.safeParse(fields).success, false, JSON.stringify(fields));
  }
  assert.deepEqual(policy.academyMemberUpdateSchema.parse({ expectedVersion: 3, status: 'inactive' }), { expectedVersion: 3, status: 'inactive' });
});

test('member and attendance schemas bound values, reject invalid dates and require affirmative storage permission', () => {
  assert.equal(policy.academyMemberCreateSchema.parse(member).memberCode, 'ATH-1');
  for (const fields of [{ ...member, permissionConfirmed: false }, { ...member, permissionConfirmed: undefined }, { ...member, memberCode: '$regex' },
    { ...member, name: ' ' }, { ...member, joinedOn: '2026-02-30' }, { ...member, joinedOn: '2999-01-01' }, { ...member, academyId: id }, { ...member, email: 'not-email' }]) {
    assert.equal(policy.academyMemberCreateSchema.safeParse(fields).success, false);
  }
  for (const fields of [{ memberId, date: '2999-01-01', status: 'present' }, { memberId, date: '2020-01-01', status: 'present' },
    { memberId, date: policy.utcDay(), status: 'invented' }, { memberId: { $ne: null }, date: policy.utcDay(), status: 'present' }]) {
    assert.equal(policy.academyAttendanceSchema.safeParse(fields).success, false);
  }
  assert.equal(policy.academyMemberQuerySchema.safeParse({ search: { $ne: '' } }).success, false);
  assert.equal(policy.academyAttendanceQuerySchema.safeParse({ limit: '1000' }).success, false);
});

for (const role of ['athlete', 'coach', 'tournament_organizer']) test(`${role} cannot read or mutate academy private records`, async () => {
  const find = own();
  for (const [handler, fields] of [[controller.getAcademyOperations, {}], [controller.getAcademyMembers, {}], [controller.getAcademyAttendance, {}],
    [controller.updateAcademyListing, { body: { expectedVersion: 0, archived: true } }], [controller.createAcademyMember, { body: member }],
    [controller.recordAcademyAttendance, { body: { memberId, date: policy.utcDay(), status: 'present' } }]]) {
    const result = await invoke(handler, { ...fields, user: { ...user, role } }); assert.equal(result.res.code, 403); assert.equal(result.error, undefined);
  }
  assert.equal(find.mock.callCount(), 0);
});

test('owner lookup is scoped to current identity and cross-owner records return 404 before PII reads', async () => {
  const find = own(null);
  const read = mock.method(AcademyMember, 'find', () => { throw Error('Private rows must not be read'); });
  const result = await invoke(controller.getAcademyMembers);
  assert.equal(result.res.code, 404); assert.deepEqual(find.mock.calls[0].arguments[0], { _id: id, ownerId: user._id }); assert.equal(read.mock.callCount(), 0);
  assert.equal((await invoke(controller.getAcademyOperations, { params: { id: 'invalid' } })).res.code, 400);
  assert.equal((await invoke(controller.getAcademyOperations, { user: undefined })).res.code, 401);
});

test('admin scope is explicit; summary counts real member records and daily statuses without exposing rows', async () => {
  const find = own(); const filters = [];
  mock.method(AcademyMember, 'countDocuments', async filter => { filters.push(filter); return filter.status ? 2 : 3; });
  const aggregate = mock.method(AcademyAttendance, 'aggregate', async () => [{ _id: 'present', count: 1 }, { _id: 'absent', count: 1 }]);
  const result = await invoke(controller.getAcademyOperations, { user: { ...user, role: 'admin' } });
  assert.equal(result.res.code, 200); assert.deepEqual(find.mock.calls[0].arguments[0], { _id: id });
  assert.deepEqual(filters, [{ academyId: academy._id }, { academyId: academy._id, status: 'active' }]);
  assert.equal(aggregate.mock.calls[0].arguments[0][0].$match.academyId, academy._id);
  assert.deepEqual(result.res.body.summary.attendance, { present: 1, absent: 1, excused: 0 }); assert.equal(result.res.body.summary.inactiveMembers, 1);
  assert.equal(result.res.body.members, undefined);
});

test('listing update uses owner and expected-version CAS, with atomic archive and restore', async () => {
  own(); const updates = [];
  mock.method(Academy, 'findOneAndUpdate', (filter, data, options) => { updates.push({ filter, data, options }); return query({ ...academy, ...data.$set, version: 1 }); });
  const result = await invoke(controller.updateAcademyListing, { body: { expectedVersion: 0, archived: true } });
  assert.equal(result.res.code, 200); assert.equal(updates[0].filter.ownerId, user._id); assert.deepEqual(updates[0].filter.$or, [{ version: 0 }, { version: { $exists: false } }]);
  assert.ok(updates[0].data.$set.archivedAt instanceof Date); assert.deepEqual(updates[0].data.$inc, { version: 1 });
  assert.equal(updates[0].data.$set.description, undefined); assert.equal(updates[0].options.runValidators, true);
  await invoke(controller.updateAcademyListing, { body: { expectedVersion: 1, archived: false } }); assert.equal(updates[1].data.$set.archivedAt, null);
});

test('stale listing save returns conflict without reporting success', async () => {
  own(); mock.method(Academy, 'findOneAndUpdate', () => query(null));
  const result = await invoke(controller.updateAcademyListing, { body: { expectedVersion: 2, name: 'Changed' } }); assert.equal(result.res.code, 409);
});

test('private member search is tenant-scoped, literal, deterministic and bounded', async () => {
  own(); let filter; const inspect = {};
  mock.method(AcademyMember, 'find', value => { filter = value; return query([{ _id: memberId }, { _id: ownerId }], inspect); });
  const result = await invoke(controller.getAcademyMembers, { query: { search: '.*', status: 'inactive', page: '2', limit: '1' } });
  assert.equal(result.res.code, 200); assert.equal(filter.academyId, academy._id); assert.equal(filter.status, 'inactive');
  assert.equal(filter.$or[0].name.$regex, '\\.\\*'); assert.equal(inspect.skip, 1); assert.equal(inspect.limit, 2); assert.equal(result.res.body.hasMore, true);
});

test('create derives academy, active status and permission timestamp, within the academy write transaction', async () => {
  own(); const tx = write(); const create = mock.method(AcademyMember, 'create', async rows => rows);
  const result = await invoke(controller.createAcademyMember, { body: member });
  assert.equal(result.res.code, 201); assert.deepEqual(tx.mock.calls[0].arguments[0], { _id: id, ownerId: user._id });
  const [rows, options] = create.mock.calls[0].arguments; assert.equal(rows[0].academyId, academy._id); assert.equal(rows[0].memberCode, 'ATH-1');
  assert.equal(rows[0].status, 'active'); assert.ok(rows[0].permissionRecordedAt instanceof Date); assert.equal(rows[0].permissionConfirmed, undefined); assert.ok(options.session);
});

test('duplicate member codes return 409 and invalid records never start a transaction', async () => {
  own(); const tx = write(); mock.method(AcademyMember, 'create', async () => { throw { code: 11000 }; });
  assert.equal((await invoke(controller.createAcademyMember, { body: member })).res.code, 409);
  const count = tx.mock.callCount(); assert.equal((await invoke(controller.createAcademyMember, { body: { ...member, ownerId } })).res.code, 400); assert.equal(tx.mock.callCount(), count);
});

test('member update cannot cross academies or overwrite a concurrent edit and does not reset other optional fields', async () => {
  own(); write(); const update = mock.method(AcademyMember, 'findOneAndUpdate', () => query(null));
  const result = await invoke(controller.updateAcademyMember, { params: { id, memberId }, body: { expectedVersion: 3, status: 'inactive' } });
  assert.equal(result.error.statusCode, 409); const [filter, change] = update.mock.calls[0].arguments;
  assert.deepEqual(filter, { _id: memberId, academyId: academy._id, version: 3 }); assert.deepEqual(change, { $set: { status: 'inactive' }, $inc: { version: 1 } });
});

test('attendance rejects inactive or foreign members before touching attendance records', async () => {
  own(); write(); const inspect = {}; mock.method(AcademyMember, 'findOne', filter => { assert.deepEqual(filter, { _id: memberId, academyId: academy._id, status: 'active' }); return query(null, inspect); });
  const update = mock.method(AcademyAttendance, 'findOneAndUpdate', () => { throw Error('No foreign attendance write'); });
  const result = await invoke(controller.recordAcademyAttendance, { body: { memberId, date: policy.utcDay(), status: 'present' } });
  assert.equal(result.error.statusCode, 404); assert.equal(update.mock.callCount(), 0); assert.ok(inspect.session);
});

test('attendance is desired-state upsert with academy/member/day key and server-derived recorder', async () => {
  own(); write(); mock.method(AcademyMember, 'findOne', () => query({ _id: memberId }));
  const update = mock.method(AcademyAttendance, 'findOneAndUpdate', (filter, change) => query({ ...filter, ...change.$set }));
  const result = await invoke(controller.recordAcademyAttendance, { body: { memberId, date: policy.utcDay(), status: 'excused' } });
  assert.equal(result.res.code, 200); const [filter, change, options] = update.mock.calls[0].arguments;
  assert.deepEqual(filter, { academyId: academy._id, memberId, date: policy.utcDay() }); assert.equal(change.$set.recordedBy, user._id); assert.equal(options.upsert, true); assert.ok(options.session);
});

test('attendance reads use tenant-matched member population and bounded pagination', async () => {
  own(); const inspect = {}; const find = mock.method(AcademyAttendance, 'find', () => query([], inspect));
  const result = await invoke(controller.getAcademyAttendance, { query: { page: '2', limit: '10', date: policy.utcDay() } });
  assert.equal(result.res.code, 200); assert.equal(find.mock.calls[0].arguments[0].academyId, academy._id); assert.equal(inspect.populate.match.academyId, academy._id);
  assert.equal(inspect.populate.select, 'name memberCode'); assert.equal(inspect.skip, 10); assert.equal(inspect.limit, 11);
});

test('public directory filters archived/unpublished listings and never requests member PII', async () => {
  let filter; const inspect = {}; mock.method(Academy, 'find', value => { filter = value; return query([], inspect); });
  const result = await invoke(directory.getAcademies);
  assert.equal(result.res.code, 200); assert.deepEqual(filter.isPublished, { $ne: false }); assert.equal(filter.archivedAt, null);
  assert.doesNotMatch(inspect.select, /email|member|permission|notes/);
});

test('academy transaction serializes with archive and always closes session on rejection', async () => {
  let ended = 0, worked = 0, options;
  const session = { withTransaction: async (callback, value) => { options = value; return callback(); }, endSession: async () => ended++ };
  mock.method(mongoose, 'startSession', async () => session);
  const update = mock.method(Academy, 'updateOne', async () => ({ matchedCount: 0 }));
  await assert.rejects(transaction.withAcademyWrite({ _id: id, ownerId }, async () => { worked++; return true; }), error => error.statusCode === 409);
  assert.equal(worked, 0); assert.equal(ended, 1); assert.equal(update.mock.calls[0].arguments[0].archivedAt, null); assert.equal(options.readConcern.level, 'snapshot');
});
