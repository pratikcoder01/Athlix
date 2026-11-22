const assert = require('node:assert/strict');
const { test, before, after } = require('node:test');
const express = require('express');
const { createRequestLogger } = require('../dist/middleware/loggingMiddleware.js');
const { createErrorHandler } = require('../dist/middleware/errorMiddleware.js');
const { createHealthRoutes } = require('../dist/routes/healthRoutes.js');
const { validateRuntimeConfig } = require('../dist/config/runtime.js');
const { getJwtSecret } = require('../dist/config/jwt.js');
const { createShutdown, closeRealtimeAndHttp } = require('../dist/utils/lifecycle.js');
const http = require('node:http');
const { Server: SocketIOServer } = require('socket.io');
const { io: connectSocket } = require('socket.io-client');
const { apiLimiter, authLimiter } = require('../dist/middleware/rateLimitMiddleware.js');

let server;
let base;
const logs = [];
let databaseReady = false;
const app = express();
app.use(createRequestLogger(event => logs.push(event)));
app.use(express.json({ limit: '128kb' }));
app.use('/api', createHealthRoutes(() => databaseReady));
app.post('/body', (req, res) => res.json({ accepted: true }));
app.get('/poll', apiLimiter, (_req, res) => res.json({ status: 'processing' }));
app.post('/auth-attempt', authLimiter, (_req, res) => res.status(401).json({ success: false }));
app.get('/stream-error', (_req, res, next) => { res.write('partial response');next(new Error('private-stream-credential')); });
app.get('/error/:kind', (req, res, next) => {
  const error = new Error('private-driver-token-and-database-credential');
  const details = {
    internal: {}, duplicate: { code: 11000 }, cast: { name: 'CastError' },
    validation: { name: 'ValidationError' }, version: { name: 'VersionError' },
    intentional: { statusCode: 403, message: 'Access denied' }, invalidStatus: { statusCode: 200 },
  };
  next(Object.assign(error, details[req.params.kind]));
});
app.use((req, res, next) => next(Object.assign(new Error('Endpoint not found'), { statusCode: 404 })));
app.use(createErrorHandler(event => logs.push(event)));
before(async () => {
  server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())));

test('requests receive generated IDs; structured logs exclude query, body, auth and supplied IDs', async () => {
  logs.length = 0;
  const response = await fetch(`${base}/body?token=query-secret`, { method: 'POST',
    headers: { Authorization: 'Bearer header-secret', 'X-Request-ID': 'untrusted-request-id', 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'body-secret' }) });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('x-request-id'), /^[a-f\d-]{36}$/);
  assert.notEqual(response.headers.get('x-request-id'), 'untrusted-request-id');
  await response.json();
  assert.equal(logs.length, 1);assert.equal(logs[0].event, 'http_request');assert.equal(logs[0].route, '/body');
  assert.equal(logs[0].completed, true);assert.ok(logs[0].durationMs >= 0);
  assert.doesNotMatch(JSON.stringify(logs), /query-secret|header-secret|body-secret|untrusted-request-id/);
});
for (const [kind, status, message] of [
  ['internal', 500, 'The server could not complete'], ['invalidStatus', 500, 'The server could not complete'],
  ['duplicate', 409, 'already exists'], ['cast', 400, 'Invalid identifier'],
  ['validation', 400, 'validation failed'], ['version', 409, 'record changed'], ['intentional', 403, 'Access denied'],
]) {
  test(`error normalization ${kind} does not disclose private driver detail or stack`, async () => {
    logs.length = 0;
    const response = await fetch(`${base}/error/${kind}`);const body = await response.json();
    assert.equal(response.status, status);assert.match(body.message, new RegExp(message, 'i'));
    assert.equal(body.requestId, response.headers.get('x-request-id'));
    assert.equal(body.stack, undefined);assert.doesNotMatch(JSON.stringify([body, logs]), /private-driver-token|credential|Error:|stack/);
    assert.ok(logs.some(event => event.event === 'http_error' && event.requestId === body.requestId));
  });
}
test('malformed and oversized JSON use actionable 400/413 without echoing submitted content', async () => {
  let response = await fetch(`${base}/body`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"private":"broken-secret"' });
  assert.equal(response.status, 400);let body = await response.json();assert.equal(body.message, 'Invalid JSON request body');assert.doesNotMatch(JSON.stringify(body), /broken-secret/);
  response = await fetch(`${base}/body`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: 'x'.repeat(130 * 1024) }) });
  assert.equal(response.status, 413);body = await response.json();assert.match(body.message, /size limit/);
});
test('errors after response headers interrupt the response without exposing or fallback-logging private details', async () => {
  logs.length = 0;
  await assert.rejects(async () => { const response = await fetch(`${base}/stream-error`);await response.text(); });
  assert.ok(logs.some(event => event.category === 'response_interrupted'));
  assert.doesNotMatch(JSON.stringify(logs), /private-stream-credential/);
});
test('liveness stays explicit; readiness requires a connected database and no drain state', async () => {
  databaseReady = false;app.locals.draining = false;
  let response = await fetch(`${base}/api/health`);assert.equal(response.status, 200);assert.equal((await response.json()).status, 'alive');
  response = await fetch(`${base}/api/ready`);assert.equal(response.status, 503);assert.equal(response.headers.get('cache-control'), 'no-store');
  databaseReady = true;response = await fetch(`${base}/api/ready`);assert.equal(response.status, 200);
  app.locals.draining = true;response = await fetch(`${base}/api/ready`);assert.equal(response.status, 503);
});
test('production configuration rejects missing targets, weak secrets and unreviewed proxy settings', () => {
  const valid = { NODE_ENV: 'production', JWT_SECRET: 'fixture-strong-key-1234567890-ABCDEFG', MONGO_URI: 'mongodb://127.0.0.1:27017/reviewed' };
  assert.equal(validateRuntimeConfig(valid).port, 5000);
  for (const patch of [{ MONGO_URI: '' }, { MONGO_URI: 'https://attacker.test' }, { JWT_SECRET: '' }, { JWT_SECRET: 'a'.repeat(40) }, { JWT_SECRET: 'short' }, { PORT: '70000' }, { PORT: 'abc' }, { PORT: '0' }, { TRUST_PROXY_HOPS: 'true' }, { TRUST_PROXY_HOPS: '10' }]) {
    assert.throws(() => validateRuntimeConfig({ ...valid, ...patch }));
  }
  assert.equal(validateRuntimeConfig({ JWT_SECRET: 'development-only' }).mongoUri, 'mongodb://127.0.0.1:27017/athlix');
});
test('one bounded analysis polling journey fits the general budget while authentication is separately limited', async () => {
  for (let count = 0; count < 160; count++) {
    const response = await fetch(`${base}/poll`);assert.equal(response.status, 200);await response.json();
  }
  for (let count = 0; count < 30; count++) {
    const response = await fetch(`${base}/auth-attempt`, { method: 'POST' });assert.equal(response.status, 401);await response.json();
  }
  const response = await fetch(`${base}/auth-attempt`, { method: 'POST' });assert.equal(response.status, 429);assert.ok(response.headers.get('retry-after'));
});
test('every production JWT consumer rejects weak signing configuration, including alternate app entrypoints', () => {
  const previous = { NODE_ENV: process.env.NODE_ENV, JWT_SECRET: process.env.JWT_SECRET };
  try {
    process.env.NODE_ENV = 'production';process.env.JWT_SECRET = 'weak-secret';assert.throws(() => getJwtSecret());
    process.env.JWT_SECRET = 'fixture-strong-key-1234567890-ABCDEFG';assert.equal(getJwtSecret(), process.env.JWT_SECRET);
  } finally {
    for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key];else process.env[key] = value; }
  }
});
test('shutdown drains transports before DB disconnect, is idempotent and records a later fatal exit', async () => {
  const calls = [];let release;
  const pending = new Promise(resolve => { release = resolve; });
  const shutdown = createShutdown({ markDraining: () => calls.push('draining'), closeServer: async () => { calls.push('close');await pending; },
    disconnectDatabase: async () => calls.push('database'), forceClose: () => calls.push('force'), exit: code => calls.push(`exit:${code}`), write: () => {} });
  const first = shutdown('SIGTERM');const second = shutdown('unhandled_rejection', 1);assert.equal(first, second);
  release();await first;assert.deepEqual(calls, ['draining', 'close', 'database', 'exit:1']);
});
test('shutdown enforces its deadline when a request never drains', async () => {
  const calls = [];
  const shutdown = createShutdown({ markDraining: () => calls.push('draining'), closeServer: () => new Promise(() => {}),
    disconnectDatabase: async () => calls.push('database'), forceClose: () => calls.push('force'), exit: code => calls.push(`exit:${code}`), timeoutMs: 20, write: () => {} });
  await shutdown('SIGINT');assert.deepEqual(calls, ['draining', 'force', 'exit:1']);
});
test('shutdown resource failures produce a nonzero exit without logging raw exceptions', async () => {
  const logs = [];let code;
  const shutdown = createShutdown({ markDraining: () => {}, closeServer: async () => { throw Error('private-connection-secret'); },
    disconnectDatabase: async () => {}, forceClose: () => {}, exit: value => { code = value; }, write: value => logs.push(value) });
  await shutdown('startup_failure', 1);assert.equal(code, 1);assert.doesNotMatch(JSON.stringify(logs), /private-connection-secret/);
});
test('actual HTTP and websocket transports close without dropping an in-flight HTTP response', { timeout: 15000 }, async () => {
  let completeResponse;let started;
  const incoming = new Promise(resolve => { started = resolve; });
  const listener = http.createServer((_req, res) => { completeResponse = () => res.end('completed');started(); });
  const realtime = new SocketIOServer(listener);
  await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${listener.address().port}`;
  const client = connectSocket(url, { transports: ['websocket'], reconnection: false });
  try {
    await new Promise((resolve, reject) => { client.once('connect', resolve);client.once('connect_error', reject); });
    const response = fetch(`${url}/slow`);await incoming;
    let exited = false;let disconnectedDb = false;
    const disconnected = new Promise(resolve => client.once('disconnect', resolve));
    const shutdown = createShutdown({ markDraining: () => {}, closeServer: () => closeRealtimeAndHttp(listener, realtime),
      disconnectDatabase: async () => { disconnectedDb = true; }, forceClose: () => listener.closeAllConnections(),
      exit: code => { assert.equal(code, 0);exited = true; }, write: () => {} });
    const closing = shutdown('SIGTERM');await disconnected;
    assert.equal(exited, false);assert.equal(disconnectedDb, false);
    completeResponse();assert.equal(await (await response).text(), 'completed');
    await closing;assert.ok(disconnectedDb);assert.ok(exited);
  } finally { client.close();listener.closeAllConnections();realtime.close(); }
});
