const assert = require('node:assert/strict');
const { test, mock } = require('node:test');
const mongoose = require('mongoose');
const { verifyRequiredIndexes, DATABASE_INDEX_TIMEOUT_MS } = require('../dist/config/indexes');

const required = [
  [{ ownerId: 1, requestId: 1 }, { unique: true }],
  [{ expiresAt: 1 }, { expireAfterSeconds: 0 }],
  [{ email: 1 }, { unique: true, sparse: true }],
  [{ location: '2dsphere' }, {}],
];
const catalog = () => [
  { v: 2, key: { _id: 1 }, name: '_id_' },
  ...required.map(([key, options], index) => ({ v: 2, key, name: `operator_name_${index}`, ...options })),
];
function fixture(indexes = catalog(), definitions = required) {
  const toArray = mock.fn(async () => indexes);
  const runCursorCommand = mock.fn(() => ({ toArray }));
  const write = mock.fn(() => { throw Error('Index validation must not write'); });
  const model = { collection: { name: 'requiredrecords' }, schema: { indexes: () => definitions } };
  return { connection: { models: { RequiredRecord: model }, db: { runCursorCommand, createCollection: write, command: write } },
    toArray, runCursorCommand, write };
}

test('read-only gate accepts all requirements plus extra indexes with one bounded primary cursor per collection', async () => {
  const f = fixture([...catalog(), { key: { extra: -1 }, name: 'operator_extra' }]);
  await verifyRequiredIndexes(f.connection);
  assert.equal(DATABASE_INDEX_TIMEOUT_MS, 5000);
  assert.deepEqual(f.runCursorCommand.mock.calls[0].arguments, [
    { listIndexes: 'requiredrecords', includeBuildUUIDs: true, maxTimeMS: 5000 },
    { readPreference: 'primary', timeoutMS: 5000, timeoutMode: 'cursorLifetime' },
  ]);
  assert.equal(f.runCursorCommand.mock.callCount(), 1);
  assert.equal(f.toArray.mock.callCount(), 1);
  assert.equal(f.write.mock.callCount(), 0);
});

test('simple collation and explicit false flags match ordinary visible index defaults', async () => {
  const indexes = catalog().map(index => ({ ...index, collation: { locale: 'simple' },
    unique: index.unique ?? false, sparse: index.sparse ?? false, hidden: false }));
  await verifyRequiredIndexes(fixture(indexes).connection);
});

test('every declared index is required, including TTL cleanup and geospatial queries', async () => {
  for (let index = 0; index < catalog().length; index++) {
    await assert.rejects(verifyRequiredIndexes(fixture(catalog().filter((_, position) => position !== index)).connection), /index validation failed/);
  }
});

test('compound field order and direction are significant', async () => {
  for (const key of [{ requestId: 1, ownerId: 1 }, { ownerId: -1, requestId: 1 }, { ownerId: 1 }]) {
    const indexes = catalog(); indexes[1] = { ...indexes[1], key };
    await assert.rejects(verifyRequiredIndexes(fixture(indexes).connection));
  }
});

test('unique and sparse semantics must match in both directions', async () => {
  for (const [position, change] of [[1, { unique: false }], [2, { unique: true }], [3, { sparse: false }], [1, { sparse: true }]]) {
    const indexes = catalog(); indexes[position] = { ...indexes[position], ...change };
    await assert.rejects(verifyRequiredIndexes(fixture(indexes).connection));
  }
});

test('TTL zero must exist exactly and ordinary indexes cannot unexpectedly expire records', async () => {
  for (const expireAfterSeconds of [undefined, null, 1, -1, '0']) {
    const indexes = catalog(); indexes[2] = { ...indexes[2], expireAfterSeconds };
    await assert.rejects(verifyRequiredIndexes(fixture(indexes).connection));
  }
  const indexes = catalog(); indexes[1].expireAfterSeconds = 0;
  await assert.rejects(verifyRequiredIndexes(fixture(indexes).connection));
});

test('hidden, partial, non-simple, unfinished and preparatory indexes cannot satisfy a required constraint', async () => {
  for (const change of [{ hidden: true }, { partialFilterExpression: { active: true } },
    { collation: { locale: 'en', strength: 2 } }, { buildUUID: 'unfinished' }, { prepareUnique: true }]) {
    const indexes = catalog(); indexes[1] = { ...indexes[1], ...change };
    await assert.rejects(verifyRequiredIndexes(fixture(indexes).connection));
  }
  const indexes = catalog(); indexes[1] = { spec: indexes[1], buildUUID: 'unfinished' };
  await assert.rejects(verifyRequiredIndexes(fixture(indexes).connection));
  await verifyRequiredIndexes(fixture(catalog()).connection);
});

test('an additional incompatible candidate does not hide a complete matching index', async () => {
  await verifyRequiredIndexes(fixture([...catalog(), { ...catalog()[1], name: 'extra_partial', partialFilterExpression: { active: true } }]).connection);
});

test('collections without secondary indexes still require their intrinsic identifier index', async () => {
  await verifyRequiredIndexes(fixture([catalog()[0]], []).connection);
  await assert.rejects(verifyRequiredIndexes(fixture([], []).connection));
  await assert.rejects(verifyRequiredIndexes(fixture([{ ...catalog()[0], name: 'other' }], []).connection));
});

test('empty model catalogs, missing databases and missing collections fail closed', async () => {
  await assert.rejects(verifyRequiredIndexes({ models: {}, db: fixture().connection.db }));
  await assert.rejects(verifyRequiredIndexes({ models: fixture().connection.models, db: undefined }));
  const f = fixture(); f.toArray.mock.mockImplementation(async () => { throw Object.assign(Error('private namespace'), { code: 26 }); });
  await assert.rejects(verifyRequiredIndexes(f.connection), error => !error.message.includes('private namespace'));
});

test('unauthorized, timeout and driver failures expose no database or index details', async () => {
  for (const code of [13, 50, undefined]) {
    const f = fixture(); f.toArray.mock.mockImplementation(async () => { throw Object.assign(Error('mongodb://private-user:secret@private-host/private-db'), { code }); });
    await assert.rejects(verifyRequiredIndexes(f.connection), error => {
      assert.match(error.message, /index validation failed/);
      assert.doesNotMatch(error.message, /private-user|secret|private-host|private-db/); return true;
    });
  }
});

test('actual app registration supplies every API model, including unique, TTL and identifier-only collections', async () => {
  const providerPath = require.resolve('../dist/config/firebase');
  require.cache[providerPath] = { id: providerPath, filename: providerPath, loaded: true, exports: { authAdmin: {} } };
  require('../dist/app');
  const models = Object.values(mongoose.connection.models);
  assert.deepEqual(models.map(model => model.modelName).sort(), [
    'Academy', 'AcademyAttendance', 'AcademyMember', 'AuthSession', 'Booking', 'BookingScheduleLock',
    'CoachClientNote', 'CoachProfile', 'Comment', 'CommunityModerationAudit', 'CommunityReport',
    'Notification', 'Post', 'Profile', 'Tournament', 'TrainingEntry', 'TrainingPlan', 'User',
  ]);
  // A schema override would take precedence over production connection options.
  for (const model of models) {
    assert.notEqual(model.schema.options.autoIndex, true);
    assert.notEqual(model.schema.options.autoCreate, true);
    assert.notEqual(model.schema.options.autoSearchIndex, true);
  }
  const byCollection = new Map(models.map(model => [model.collection.name, [
    catalog()[0], ...model.schema.indexes().map(([key, options], index) => ({ key, ...options, name: `fixture_${index}` })),
  ]]));
  const runCursorCommand = mock.fn(command => ({ toArray: async () => byCollection.get(command.listIndexes) }));
  await verifyRequiredIndexes({ models: mongoose.connection.models, db: { runCursorCommand } });
  assert.deepEqual(runCursorCommand.mock.calls.map(call => call.arguments[0].listIndexes).sort(), [...byCollection.keys()].sort());
});
