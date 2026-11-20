const assert = require('node:assert/strict');
const { test, beforeEach, afterEach, mock } = require('node:test');
const mongoose = require('mongoose');
const { Tournament } = require('../dist/models/Tournament');
const { User } = require('../dist/models/User');
const { BracketMigrationAudit } = require('../dist/models/BracketMigrationAudit');
const { generateSingleElimination, advanceWinners } = require('../dist/utils/tournamentPolicy');
const { parseBracketMigrationArgs, prepareLegacyBracket, migrateBrackets, reviewedMigrationUri } = require('../dist/scripts/migrateBrackets');
const ids = ['aaaaaaaaaaaaaaaaaaaaaaa1', 'aaaaaaaaaaaaaaaaaaaaaaa2', 'aaaaaaaaaaaaaaaaaaaaaaa3'];
const ownerId = 'bbbbbbbbbbbbbbbbbbbbbbbb', tournamentId = 'cccccccccccccccccccccccc';
const options = { tournamentId, database: 'athlix_migration_test', operator: 'fixture-operator', reason: 'Review ticket ATH-123 validates complete historical bracket', apply: false };
const args = ['--tournament-id', tournamentId, '--database', options.database, '--operator', options.operator, '--reason', options.reason];
const raw = (fields = {}) => ({ _id: new mongoose.Types.ObjectId(tournamentId), organizerId: new mongoose.Types.ObjectId(ownerId),
  registrations: ids.map(id => new mongoose.Types.ObjectId(id)), brackets: JSON.stringify(generateSingleElimination(ids)), status: 'upcoming', __v: 3, ...fields });
let descriptors;
beforeEach(() => {
  descriptors = ['db', 'readyState'].map(key => [key, Object.getOwnPropertyDescriptor(mongoose.connection, key)]);
  Object.defineProperty(mongoose.connection, 'db', { configurable: true, value: { databaseName: options.database } });
  Object.defineProperty(mongoose.connection, 'readyState', { configurable: true, value: 1 });
});
afterEach(() => { mock.restoreAll(); for (const [key, descriptor] of descriptors) if (descriptor) Object.defineProperty(mongoose.connection, key, descriptor); else delete mongoose.connection[key]; });

test('migration defaults to a single-target dry run with attributable required review', () => {
  assert.deepEqual(parseBracketMigrationArgs(args), options);
  for (const bad of [[], ['--apply'], [...args, '--apply'], [...args, '--unknown', 'x'], [...args, '--operator', 'duplicate'], [...args, 'toString', 'x'], [...args, '--expected-version', '1.2']]) assert.throws(() => parseBracketMigrationArgs(bad));
  const hash = 'a'.repeat(64);
  assert.deepEqual(parseBracketMigrationArgs([...args, '--apply', '--expected-version', 'missing', '--expected-sha256', hash]), { ...options, apply: true, expectedVersion: 'missing', expectedSha256: hash });
});
test('reviewed database URI has no fallback and cannot silently target a different database', () => {
  for (const [uri, database] of [[undefined, options.database], ['http://localhost/db', options.database], ['mongodb://localhost/another', options.database], ['mongodb://localhost/db#fragment', 'db'], ['mongodb://localhost/', 'admin'], ['mongodb://localhost/', 'config'], ['mongodb://localhost/', 'invalid/name']]) assert.throws(() => reviewedMigrationUri(uri, database));
  assert.equal(reviewedMigrationUri('mongodb://localhost/', options.database), 'mongodb://localhost/');
  assert.equal(reviewedMigrationUri(`mongodb://localhost/${options.database}`, options.database), `mongodb://localhost/${options.database}`);
});
test('complete ID-based legacy trees are preserved, with only canonical identifier casing', () => {
  const source = raw(); const candidate = prepareLegacyBracket(source);
  assert.deepEqual(candidate.bracket, JSON.parse(source.brackets)); assert.equal(candidate.previousVersion, 3); assert.equal(candidate.sourceSha256.length, 64);
  const uppercase = raw({ brackets: source.brackets.replace(/aaaaaaaaaaaaaaaaaaaaaaa/g, 'AAAAAAAAAAAAAAAAAAAAAAA') });
  assert.deepEqual(prepareLegacyBracket(uppercase).bracket, candidate.bracket);
  const missingVersion = raw(); delete missingVersion.__v; assert.equal(prepareLegacyBracket(missingVersion).previousVersion, 'missing');
});
for (const malformed of [
  record => ({ ...record, brackets: JSON.stringify(JSON.parse(record.brackets).seeds) }),
  record => ({ ...record, brackets: JSON.stringify(JSON.parse(record.brackets).rounds) }),
  record => ({ ...record, brackets: '{invalid json' }),
  record => ({ ...record, brackets: { seeds: [], rounds: [] } }),
  record => ({ ...record, brackets: record.brackets.replace(ids[0], 'Display Name') }),
  record => ({ ...record, registrations: [record.registrations[0], record.registrations[0]] }),
  record => ({ ...record, registrations: ['missing-user', ...record.registrations.slice(1)] }),
  record => ({ ...record, divisions: [{ key: 'division' }] }),
  record => ({ ...record, __v: 'missing' }),
  record => ({ ...record, __v: null }),
  record => ({ ...record, __v: Number.MAX_SAFE_INTEGER }),
  record => ({ ...record, status: 'completed' }),
]) test('ambiguous, malformed or incomplete legacy records cannot produce a migration candidate', () => assert.throws(() => prepareLegacyBracket(malformed(raw()))));
test('duplicate JSON keys are rejected rather than silently taking a hidden competing value', () => {
  const source = raw(); const parsed = JSON.parse(source.brackets);
  assert.throws(() => prepareLegacyBracket({ ...source, brackets: `{"seeds":[],"seeds":${JSON.stringify(parsed.seeds)},"rounds":${JSON.stringify(parsed.rounds)}}` }), /Duplicate/);
  assert.throws(() => prepareLegacyBracket({ ...source, brackets: source.brackets.replace('"score":"Pending"', '"score":"forged","score":"Pending"') }), /Duplicate/);
});
test('upcoming events with contested winners and completed events without final winners require manual review', () => {
  const bracket = generateSingleElimination(ids.slice(0, 2)); bracket.rounds[0].matches[0].winner = ids[0];
  const record = raw({ registrations: ids.slice(0, 2), brackets: JSON.stringify(bracket) });
  assert.throws(() => prepareLegacyBracket(record), /upcoming/);
  assert.equal(prepareLegacyBracket({ ...record, status: 'completed' }).bracket.rounds[0].matches[0].winner, ids[0]);
});

function fixture(record = raw()) {
  const read = mock.method(Tournament.collection, 'findOne', async () => record);
  const users = mock.method(User.collection, 'find', () => ({ toArray: async () => [...ids, ownerId].map(_id => ({ _id: new mongoose.Types.ObjectId(_id) })) }));
  return { read, users, record };
}
function transaction() {
  const session = { withTransaction: mock.fn(async callback => callback()), endSession: mock.fn(async () => {}) };
  mock.method(mongoose, 'startSession', async () => session); return session;
}
test('dry run reads exactly one raw target and makes no writes, audit records or sessions', async () => {
  const f = fixture(); const start = mock.method(mongoose, 'startSession', async () => { throw Error('No transaction'); });
  const update = mock.method(Tournament.collection, 'updateOne', async () => { throw Error('No writes'); });
  const audit = mock.method(BracketMigrationAudit, 'create', async () => { throw Error('No audit write'); });
  const result = await migrateBrackets(options); assert.equal(result.applied, false); assert.equal(result.nextVersion, 4);
  assert.deepEqual(f.read.mock.calls[0].arguments[0], { _id: new mongoose.Types.ObjectId(tournamentId) });
  assert.equal(start.mock.callCount() + update.mock.callCount() + audit.mock.callCount(), 0);
});
test('database mismatch, unknown references and missing targets reject before any write transaction', async () => {
  const f = fixture(); const start = mock.method(mongoose, 'startSession', async () => { throw Error('No transaction'); });
  await assert.rejects(migrateBrackets({ ...options, database: 'different_db' }), /active database/);
  mock.method(User.collection, 'find', () => ({ toArray: async () => [] })); await assert.rejects(migrateBrackets(options), /missing account/);
  mock.method(Tournament.collection, 'findOne', async () => null); await assert.rejects(migrateBrackets(options), /not found/);
  assert.equal(start.mock.callCount(), 0); assert.equal(f.read.mock.callCount(), 1);
});
test('apply requires the exact reviewed source hash/version and rechecks them inside the transaction', async () => {
  const f = fixture(); const preview = await migrateBrackets(options); const session = transaction();
  const update = mock.method(Tournament.collection, 'updateOne', async () => ({ matchedCount: 1, modifiedCount: 1 }));
  const audit = mock.method(BracketMigrationAudit, 'create', async () => []);
  const result = await migrateBrackets({ ...options, apply: true, expectedVersion: 3, expectedSha256: preview.sourceSha256 }); assert.equal(result.applied, true);
  const [filter, change, writeOptions] = update.mock.calls[0].arguments;
  assert.equal(filter.brackets, f.record.brackets); assert.equal(filter.__v, 3); assert.equal(filter.organizerId, f.record.organizerId);
  assert.deepEqual(filter.registrations, f.record.registrations); assert.equal(filter.status, 'upcoming'); assert.deepEqual(filter.divisions, { $exists: false });
  assert.deepEqual(change.$inc, { __v: 1 }); assert.ok(change.$set.brackets.seeds[0].fighterId instanceof mongoose.Types.ObjectId);
  assert.equal(writeOptions.session, session); assert.equal(audit.mock.calls[0].arguments[1].session, session);
  assert.equal(audit.mock.calls[0].arguments[0][0].originalRawBrackets, f.record.brackets); assert.equal(session.endSession.mock.callCount(), 1);
  assert.equal(f.read.mock.calls.at(-1).arguments[1].session, session);
});
test('stale review hash/version, ambiguous apply options and invalid operator cannot start a write', async () => {
  fixture(); const start = mock.method(mongoose, 'startSession', async () => { throw Error('No transaction'); });
  const preview = await migrateBrackets(options);
  for (const changes of [{ expectedVersion: 4, expectedSha256: preview.sourceSha256 }, { expectedVersion: 3, expectedSha256: '0'.repeat(64) }, { expectedSha256: preview.sourceSha256 }, { expectedVersion: 3, expectedSha256: preview.sourceSha256, operator: 'bad\noperator' }]) await assert.rejects(migrateBrackets({ ...options, apply: true, ...changes }));
  assert.equal(start.mock.callCount(), 0);
});
test('source changes after preview are rejected inside the transaction and its session closes', async () => {
  const f = fixture(); const preview = await migrateBrackets(options); const session = transaction(); let reads = 0;
  mock.method(Tournament.collection, 'findOne', async () => ++reads === 1 ? f.record : { ...f.record, brackets: ` ${f.record.brackets}` });
  const update = mock.method(Tournament.collection, 'updateOne', async () => { throw Error('No stale write'); });
  await assert.rejects(migrateBrackets({ ...options, apply: true, expectedVersion: 3, expectedSha256: preview.sourceSha256 }), /Raw bracket changed/);
  assert.equal(update.mock.callCount(), 0); assert.equal(session.endSession.mock.callCount(), 1);
});
test('compare-and-set or audit failure aborts apply and always closes the transaction', async () => {
  fixture(); const preview = await migrateBrackets(options); const session = transaction();
  mock.method(Tournament.collection, 'updateOne', async () => ({ matchedCount: 0, modifiedCount: 0 })); const audit = mock.method(BracketMigrationAudit, 'create', async () => []);
  const apply = { ...options, apply: true, expectedVersion: 3, expectedSha256: preview.sourceSha256 };
  await assert.rejects(migrateBrackets(apply), /concurrently/); assert.equal(audit.mock.callCount(), 0);
  mock.method(Tournament.collection, 'updateOne', async () => ({ matchedCount: 1, modifiedCount: 1 })); mock.method(BracketMigrationAudit, 'create', async () => { throw Error('Audit unavailable'); });
  await assert.rejects(migrateBrackets(apply), /Audit unavailable/); assert.equal(session.endSession.mock.callCount(), 2);
});
