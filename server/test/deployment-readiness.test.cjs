const assert = require('node:assert/strict');
const { test, afterEach, mock } = require('node:test');
const mongoose = require('mongoose');
const { connectDB, probeTransactionCapability, validateTransactionTopology, DATABASE_CAPABILITY_TIMEOUT_MS } = require('../dist/config/db.js');

const primary = { ok: 1, isWritablePrimary: true, setName: 'fixture-rs', logicalSessionTimeoutMinutes: 30, maxWireVersion: 25 };
let databaseDescriptor;
let changedDatabase = false;
afterEach(() => {
  mock.restoreAll();
  if (changedDatabase) {
    if (databaseDescriptor) Object.defineProperty(mongoose.connection, 'db', databaseDescriptor);
    else delete mongoose.connection.db;
    changedDatabase = false;
  }
});
function fixture(reply = primary, failure) {
  const events = [];
  const command = mock.fn(async () => { events.push('hello'); if (failure) throw failure; return reply; });
  databaseDescriptor = Object.getOwnPropertyDescriptor(mongoose.connection, 'db'); changedDatabase = true;
  Object.defineProperty(mongoose.connection, 'db', { configurable: true, value: { admin: () => ({ command }) } });
  const connect = mock.method(mongoose, 'connect', async () => { events.push('connect'); return mongoose; });
  const disconnect = mock.method(mongoose, 'disconnect', async () => { events.push('disconnect'); });
  return { command, connect, disconnect, events };
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
test('production startup connects and validates before reporting success without a data write', async () => {
  const f = fixture(); await connectDB(production);
  assert.deepEqual(f.events, ['connect', 'hello']); assert.equal(f.disconnect.mock.callCount(), 0);
  assert.deepEqual(f.connect.mock.calls[0].arguments, [production.MONGO_URI, { serverSelectionTimeoutMS: 10000, maxPoolSize: 20 }]);
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
});
test('production missing URI fails before attempting connection or a capability probe', async () => {
  const f = fixture(); await assert.rejects(connectDB({ NODE_ENV: 'production' }), /MONGO_URI is required/);
  assert.deepEqual(f.events, []);
});
