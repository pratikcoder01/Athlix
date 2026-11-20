// Opt-in disposable replica-set tests. Never uses MONGO_URI or customer data.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { randomBytes } = require('node:crypto');
const mongoose = require('mongoose');
const { safeLocalMongoUri } = require('./helpers/localMongo.cjs');
const { Academy } = require('../dist/models/Academy.js');
const { AcademyMember } = require('../dist/models/AcademyMember.js');
const { AcademyAttendance } = require('../dist/models/AcademyAttendance.js');
const controller = require('../dist/controllers/academyOperationsController.js');
const { withAcademyWrite } = require('../dist/utils/academyTransaction.js');
const { utcDay } = require('../dist/utils/academyOperationsPolicy.js');
const uri = process.env.TEST_MONGO_URI;

test('real academy member/attendance transactions and tenant isolation', { skip: !uri, timeout: 90000 }, async t => {
  const dbName = `athlix_academy_test_${randomBytes(16).toString('hex')}`;
  if (!/^athlix_academy_test_[a-f\d]{32}$/.test(dbName)) throw Error('Unsafe test namespace');
  await mongoose.connect(safeLocalMongoUri(uri), { dbName, serverSelectionTimeoutMS: 10000 });
  try {
    await Promise.all([Academy.init(), AcademyMember.init(), AcademyAttendance.init()]);
    const owner = { _id: new mongoose.Types.ObjectId(), role: 'academy_owner' };
    const other = { _id: new mongoose.Types.ObjectId(), role: 'academy_owner' };
    const academy = await Academy.create({ name: 'Disposable academy', address: 'Isolated fixture', location: { type: 'Point', coordinates: [0, 0] }, ownerId: owner._id, disciplines: ['Karate'] });
    const id = String(academy._id);
    const body = { memberCode: 'ATH-1', name: 'Permissioned fixture', discipline: 'Karate', joinedOn: utcDay(), permissionConfirmed: true };
    async function invoke(handler, fields = {}) {
      const req = { user: owner, body: {}, query: {}, params: { id }, ...fields };
      const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
      let error; await handler(req, res, value => { error = value; }); return { res, error };
    }
    let member;
    await t.test('concurrent same-code member creation stores exactly one record', async () => {
      const results = await Promise.all([invoke(controller.createAcademyMember, { body }), invoke(controller.createAcademyMember, { body: { ...body, memberCode: 'ath-1' } })]);
      assert.deepEqual(results.map(value => value.res.code).sort(), [201, 409]);
      assert.equal(await AcademyMember.countDocuments({ academyId: academy._id }), 1);
      member = await AcademyMember.findOne({ academyId: academy._id }); assert.equal(member.memberCode, 'ATH-1');
    });
    await t.test('foreign owner cannot read or update private member records', async () => {
      assert.equal((await invoke(controller.getAcademyMembers, { user: other })).res.code, 404);
      assert.equal((await invoke(controller.updateAcademyMember, { user: other, params: { id, memberId: String(member._id) }, body: { expectedVersion: 0, status: 'inactive' } })).res.code, 404);
      assert.equal((await AcademyMember.findById(member._id)).status, 'active');
    });
    await t.test('concurrent attendance writes upsert one daily record and preserve ownership', async () => {
      const results = await Promise.all(['present', 'excused'].map(status => invoke(controller.recordAcademyAttendance,
        { body: { memberId: String(member._id), date: utcDay(), status } })));
      for (const result of results) { assert.equal(result.error, undefined); assert.equal(result.res.code, 200); }
      assert.equal(await AcademyAttendance.countDocuments({ academyId: academy._id, memberId: member._id, date: utcDay() }), 1);
      const record = await AcademyAttendance.findOne({ academyId: academy._id }); assert.equal(String(record.recordedBy), String(owner._id));
    });
    await t.test('member update uses version CAS so stale edits do not overwrite another status', async () => {
      const results = await Promise.all(['inactive', 'active'].map(status => invoke(controller.updateAcademyMember,
        { params: { id, memberId: String(member._id) }, body: { expectedVersion: 0, status } })));
      assert.equal(results.filter(result => result.res.code === 200).length, 1);
      assert.equal(results.filter(result => result.error?.statusCode === 409).length, 1);
      assert.equal((await AcademyMember.findById(member._id)).version, 1);
    });
    await t.test('transaction rollback cannot leave a member created before an error', async () => {
      await assert.rejects(withAcademyWrite({ _id: id, ownerId: owner._id }, async session => {
        await AcademyMember.create([{ academyId: academy._id, memberCode: 'ROLLBACK', name: 'Must not persist', discipline: 'Karate', joinedOn: utcDay(), permissionRecordedAt: new Date() }], { session });
        throw Error('Synthetic transaction failure');
      }), /Synthetic transaction failure/);
      assert.equal(await AcademyMember.countDocuments({ academyId: academy._id, memberCode: 'ROLLBACK' }), 0);
    });
    await t.test('archive races serialize with member writes and block every subsequent mutation', async () => {
      const [archived, created] = await Promise.all([
        invoke(controller.updateAcademyListing, { body: { expectedVersion: 0, archived: true } }),
        invoke(controller.createAcademyMember, { body: { ...body, memberCode: 'RACE' } }),
      ]);
      assert.equal(archived.res.code, 200);
      assert.ok(created.res.code === 201 || created.error?.statusCode === 409);
      const count = await AcademyMember.countDocuments({ academyId: academy._id });
      const rejected = await invoke(controller.createAcademyMember, { body: { ...body, memberCode: 'AFTER-ARCHIVE' } });
      assert.equal(rejected.error?.statusCode, 409); assert.equal(await AcademyMember.countDocuments({ academyId: academy._id }), count);
      const attendance = await invoke(controller.recordAcademyAttendance, { body: { memberId: String(member._id), date: utcDay(), status: 'present' } });
      assert.equal(attendance.error?.statusCode, 409);
      assert.equal((await invoke(controller.getAcademyOperations)).res.code, 200);
    });
    await t.test('restoring keeps saved member and attendance records intact', async () => {
      const restored = await invoke(controller.updateAcademyListing, { body: { expectedVersion: 1, archived: false } });
      assert.equal(restored.res.code, 200); assert.equal(restored.res.body.academy.archivedAt, null);
      assert.equal(await AcademyAttendance.countDocuments({ academyId: academy._id }), 1);
      assert.ok(await AcademyMember.findById(member._id));
    });
  } finally {
    if (mongoose.connection.db?.databaseName !== dbName || !/^athlix_academy_test_[a-f\d]{32}$/.test(dbName)) throw Error('Refusing unsafe test database cleanup');
    await mongoose.connection.dropDatabase(); await mongoose.disconnect();
  }
});
