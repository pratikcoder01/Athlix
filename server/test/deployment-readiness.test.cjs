const assert = require('node:assert/strict');
const { test, afterEach, mock } = require('node:test');
const mongoose = require('mongoose');
const { connectDB, probeTransactionCapability, validateTransactionTopology, DATABASE_CAPABILITY_TIMEOUT_MS } = require('../dist/config/db.js');

const primary = { ok: 1, isWritablePrimary: true, setName: 'fixture-rs', logicalSessionTimeoutMinutes: 30, maxWireVersion: 25 };
let databaseDescriptor;
let modelsDescriptor;
let changedDatabase = false;
afterEach(() => {
  mock.restoreAll();
  if (changedDatabase) {
    if (databaseDescriptor) Object.defineProperty(mongoose.connection, 'db', databaseDescriptor);
    else delete mongoose.connection.db;
    if (modelsDescriptor) Object.defineProperty(mongoose.connection, 'models', modelsDescriptor);
    else delete mongoose.connection.models;
    changedDatabase = false;
  }
});
function fixture(reply = primary, failure) {
  const events = [];
  const command = mock.fn(async () => { events.push('hello'); if (failure) throw failure; return reply; });
  const indexes = mock.fn(async () => [{ key: { _id: 1 }, name: '_id_' }, { key: { ownerId: 1, requestId: 1 }, unique: true }]);
  const runCursorCommand = mock.fn(() => { events.push('indexes'); return { toArray: indexes }; });
  databaseDescriptor = Object.getOwnPropertyDescriptor(mongoose.connection, 'db'); changedDatabase = true;
  modelsDescriptor = Object.getOwnPropertyDescriptor(mongoose.connection, 'models');
  Object.defineProperty(mongoose.connection, 'db', { configurable: true, value: { admin: () => ({ command }), runCursorCommand } });
  Object.defineProperty(mongoose.connection, 'models', { configurable: true, value: {
    RequiredRecord: { collection: { name: 'requiredrecords' }, schema: { indexes: () => [[{ ownerId: 1, requestId: 1 }, { unique: true }]] } },
  } });
  const connect = mock.method(mongoose, 'connect', async () => { events.push('connect'); return mongoose; });
  const disconnect = mock.method(mongoose, 'disconnect', async () => { events.push('disconnect'); });
  return { command, connect, disconnect, indexes, runCursorCommand, events };
}
const production = { NODE_ENV: 'production', MONGO_URI: 'mongodb://fixture.invalid/review-only' };

test('accepts a writable supported replica set and a session-capable mongos', () => {
  assert.equal(validateTransactionTopology(primary), 'replica_set');
  const { setName, ...router } = primary;
  assert.equal(validateTransactionTopology({ ...router, msg: 'isdbgrid' }), 'mongos');
});
test('rejects standalone, read-only/secondary/arbiter and unsupported wire topologies', () => {
  const { setName, ...standalone } = primary;
  for (const hello of [standalone, { ...primary, setName: '' }, { ...primary, setName: ' ' }, { ...primary, isWritablePrimary: false },
    { ...primary, readOnly: true }, { ...primary, arbiterOnly: true, isWritablePrimary: false }, { ...primary, ok: 0 },
    { ...primary, maxWireVersion: 7 }, { ...primary, maxWireVersion: undefined }, { ...primary, maxWireVersion: Infinity },
    { ...primary, msg: 'isdbgrid', isWritablePrimary: false }]) assert.throws(() => validateTransactionTopology(hello), /startup validation failed/);
});
test('rejects absent, malformed, nonfinite and unavailable logical-session support', () => {
  for (const logicalSessionTimeoutMinutes of [undefined, null, 0, -1, '30', NaN, Infinity, 1.5]) {
    assert.throws(() => validateTransactionTopology({ ...primary, logicalSessionTimeoutMinutes }), /logical-session support/);
  }
  for (const hello of [undefined, null, [], 'raw private driver output', true]) assert.throws(() => validateTransactionTopology(hello));
});
test('probe sends only bounded read-only hello with primary selection and client/server timeouts', async () => {
  const f = fixture();
  assert.equal(await probeTransactionCapability(), 'replica_set');
  assert.deepEqual(f.command.mock.calls[0].arguments, [{ hello: 1, maxTimeMS: 5000 }, { readPreference: 'primary', timeoutMS: 5000 }]);
  assert.equal(DATABASE_CAPABILITY_TIMEOUT_MS, 5000);
  assert.equal(f.connect.mock.callCount(), 0); assert.equal(f.disconnect.mock.callCount(), 0);
});
test('probe failure or missing connection throws a generic error without raw server details', async () => {
  const f = fixture(primary, new Error('mongodb://private-user:private-password@private-host/internal-db'));
  await assert.rejects(probeTransactionCapability(), error => {
    assert.match(error.message, /startup validation failed/); assert.doesNotMatch(error.message, /private-user|private-password|private-host|internal-db/); return true;
  });
  await assert.rejects(probeTransactionCapability({ db: undefined }), /startup validation failed/);
  assert.equal(f.disconnect.mock.callCount(), 0);
});
test('production startup disables schema writes and validates topology plus required indexes before success', async () => {
  const f = fixture(); await connectDB(production);
  assert.deepEqual(f.events, ['connect', 'hello', 'indexes']); assert.equal(f.disconnect.mock.callCount(), 0);
  assert.deepEqual(f.connect.mock.calls[0].arguments, [production.MONGO_URI, { serverSelectionTimeoutMS: 10000, maxPoolSize: 20, autoCreate: false, autoIndex: false }]);
});

test('startup cannot report success while required index inspection is pending', async () => {
  const f = fixture(); const validIndexes = await f.indexes(); let release;
  f.indexes.mock.mockImplementation(() => new Promise(resolve => { release = resolve; }));
  let finished = false; const pending = connectDB(production).then(() => { finished = true; });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(f.events, ['connect', 'hello', 'indexes']); assert.equal(finished, false);
  release(validIndexes); await pending; assert.equal(finished, true);
});

test('missing or failed required index inspection disconnects and sanitizes the startup failure', async () => {
  const f = fixture(); f.indexes.mock.mockImplementation(async () => { throw Error('mongodb://private:secret@private-host/private-db'); });
  await assert.rejects(connectDB(production), error => {
    assert.match(error.message, /required indexes/); assert.doesNotMatch(error.message, /secret|private-host|private-db/); return true;
  });
  assert.deepEqual(f.events, ['connect', 'hello', 'indexes', 'disconnect']);
});

test('production rejects a missing required index and disconnects before success', async () => {
  const f = fixture(); f.indexes.mock.mockImplementation(async () => [{ key: { _id: 1 }, name: '_id_' }]);
  await assert.rejects(connectDB(production), /required indexes/);
  assert.deepEqual(f.events, ['connect', 'hello', 'indexes', 'disconnect']);
});

test('production rejects an empty model catalog rather than skipping the index gate', async () => {
  const f = fixture(); Object.defineProperty(mongoose.connection, 'models', { configurable: true, value: {} });
  await assert.rejects(connectDB(production), /required indexes/);
  assert.deepEqual(f.events, ['connect', 'hello', 'disconnect']);
});
test('production rejects a standalone target and disconnects before returning the startup failure', async () => {
  const { setName, ...standalone } = primary;
  const f = fixture(standalone);
  await assert.rejects(connectDB(production), /requires a writable replica set or mongos/);
  assert.deepEqual(f.events, ['connect', 'hello', 'disconnect']);
});
test('production rejects failed/timed-out capability commands and closes the connection', async () => {
  const f = fixture(primary, Object.assign(new Error('private-driver-timeout-detail'), { code: 50 }));
  await assert.rejects(connectDB(production), error => { assert.match(error.message, /startup validation failed/); assert.doesNotMatch(error.message, /private-driver/); return true; });
  assert.deepEqual(f.events, ['connect', 'hello', 'disconnect']);
});
test('connection and disconnect errors are sanitized, including partially established connections', async () => {
  const f = fixture();
  mock.method(mongoose, 'connect', async () => { throw Error('secret connection URI'); });
  mock.method(mongoose, 'disconnect', async () => { throw Error('secret shutdown URI'); });
  await assert.rejects(connectDB(production), error => { assert.doesNotMatch(error.message, /secret|URI/); return true; });
  assert.equal(f.command.mock.callCount(), 0);
});
test('development standalone remains available without pretending transaction journeys were accepted', async () => {
  const f = fixture(); await connectDB({ NODE_ENV: 'development' });
  assert.deepEqual(f.events, ['connect']); assert.equal(f.command.mock.callCount(), 0);
  assert.equal(f.connect.mock.calls[0].arguments[0], 'mongodb://127.0.0.1:27017/athlix');
  assert.deepEqual(f.connect.mock.calls[0].arguments[1], { serverSelectionTimeoutMS: 10000, maxPoolSize: 20 });
  assert.equal(f.runCursorCommand.mock.callCount(), 0);
});
test('production missing URI fails before attempting connection or a capability probe', async () => {
  const f = fixture(); await assert.rejects(connectDB({ NODE_ENV: 'production' }), /MONGO_URI is required/);
  assert.deepEqual(f.events, []);
});
