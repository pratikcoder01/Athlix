const assert = require('node:assert/strict');
const { test, mock } = require('node:test');
const { randomUUID } = require('node:crypto');
const mongoose = require('mongoose');
const { safeLocalMongoUri, safeTestDbName } = require('./helpers/localMongo.cjs');
const { User } = require('../dist/models/User');
const { Tournament } = require('../dist/models/Tournament');
const { BracketMigrationAudit } = require('../dist/models/BracketMigrationAudit');
const { generateSingleElimination } = require('../dist/utils/tournamentPolicy');
const { migrateBrackets } = require('../dist/scripts/migrateBrackets');

test('real replica-set legacy bracket review, exact conversion and audit rollback', {
  skip: !process.env.TEST_MONGO_URI && 'NOT RUN: loopback TEST_MONGO_URI is required', timeout: 90000,
}, async t => {
  const uri = safeLocalMongoUri(process.env.TEST_MONGO_URI);
  const dbName = safeTestDbName(`athlix_booking_test_${randomUUID().replaceAll('-', '')}`);
  t.after(async () => {
    mock.restoreAll();
    if (mongoose.connection.readyState === 1 && mongoose.connection.db?.databaseName === dbName) { safeTestDbName(dbName); await mongoose.connection.dropDatabase(); }
    await mongoose.disconnect();
  });
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 5000 });
  assert.ok((await mongoose.connection.db.admin().command({ hello: 1 })).setName, 'Migration apply requires a transaction-capable replica set');
  for (const model of [User, Tournament, BracketMigrationAudit]) await model.init();
  async function fixture(missingVersion = false) {
    const people = await User.create([{ name: 'Fixture Organizer', role: 'tournament_organizer' }, { name: 'Fixture Athlete A', role: 'athlete' }, { name: 'Fixture Athlete B', role: 'athlete' }, { name: 'Fixture Athlete C', role: 'athlete' }]);
    const bracket = generateSingleElimination(people.slice(1).map(user => String(user._id)));
    const record = { _id: new mongoose.Types.ObjectId(), title: 'Synthetic legacy fixture', description: 'Test-only source',
      organizerId: people[0]._id, registrations: people.slice(1).map(user => user._id), brackets: JSON.stringify(bracket),
      status: 'upcoming', ...(!missingVersion ? { __v: 3 } : {}) };
    await Tournament.collection.insertOne(record);
    const options = { tournamentId: String(record._id), database: dbName, operator: 'synthetic-test-operator', reason: 'Isolated disposable database migration regression', apply: false };
    return { record, options, bracket };
  }
  await t.test('dry run leaves native source and audit collection unchanged', async () => {
    const f = await fixture(); const preview = await migrateBrackets(f.options);
    assert.equal(preview.applied, false); assert.deepEqual(preview.bracket, f.bracket);
    assert.deepEqual(await Tournament.collection.findOne({ _id: f.record._id }), f.record);
    assert.equal(await BracketMigrationAudit.countDocuments({ tournamentId: f.record._id }), 0);
  });
  await t.test('apply persists actual BSON identifiers, exact version and original source audit', async () => {
    const f = await fixture(); const preview = await migrateBrackets(f.options);
    const applied = await migrateBrackets({ ...f.options, apply: true, expectedVersion: 3, expectedSha256: preview.sourceSha256 }); assert.equal(applied.applied, true);
    const saved = await Tournament.collection.findOne({ _id: f.record._id }); assert.equal(saved.__v, 4); assert.equal(typeof saved.brackets, 'object');
    assert.ok(saved.brackets.seeds[0].fighterId instanceof mongoose.Types.ObjectId);
    assert.deepEqual(JSON.parse(JSON.stringify(saved.brackets)), f.bracket);
    const audit = await BracketMigrationAudit.findOne({ tournamentId: f.record._id }).lean();
    assert.equal(audit.originalRawBrackets, f.record.brackets); assert.equal(audit.sourceSha256, preview.sourceSha256); assert.equal(audit.previousVersion, '3'); assert.equal(audit.nextVersion, 4);
    await assert.rejects(migrateBrackets({ ...f.options, apply: true, expectedVersion: 3, expectedSha256: preview.sourceSha256 }));
  });
  await t.test('audit failure rolls back the actual source conversion and version increment', async () => {
    const f = await fixture(); const preview = await migrateBrackets(f.options);
    const failingAudit = mock.method(BracketMigrationAudit, 'create', async () => { throw new Error('Injected audit storage failure'); });
    try { await assert.rejects(migrateBrackets({ ...f.options, apply: true, expectedVersion: 3, expectedSha256: preview.sourceSha256 }), /Injected audit/); }
    finally { failingAudit.mock.restore(); }
    assert.deepEqual(await Tournament.collection.findOne({ _id: f.record._id }), f.record);
    assert.equal(await BracketMigrationAudit.countDocuments({ tournamentId: f.record._id }), 0);
  });
  await t.test('review of an absent original version sets one through an absence-based CAS', async () => {
    const f = await fixture(true); const preview = await migrateBrackets(f.options); assert.equal(preview.previousVersion, 'missing');
    await migrateBrackets({ ...f.options, apply: true, expectedVersion: 'missing', expectedSha256: preview.sourceSha256 });
    assert.equal((await Tournament.collection.findOne({ _id: f.record._id })).__v, 1);
  });
  await t.test('stale reviewed version and missing account references reject without conversion', async () => {
    const f = await fixture(); const preview = await migrateBrackets(f.options);
    await Tournament.collection.updateOne({ _id: f.record._id }, { $inc: { __v: 1 } });
    await assert.rejects(migrateBrackets({ ...f.options, apply: true, expectedVersion: 3, expectedSha256: preview.sourceSha256 }), /version changed/);
    await User.deleteOne({ _id: f.record.registrations[0] });
    await assert.rejects(migrateBrackets(f.options), /missing account/);
    assert.equal(typeof (await Tournament.collection.findOne({ _id: f.record._id })).brackets, 'string');
    assert.equal(await BracketMigrationAudit.countDocuments({ tournamentId: f.record._id }), 0);
  });
});
