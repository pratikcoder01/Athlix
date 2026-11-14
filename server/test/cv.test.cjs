const assert = require('node:assert/strict');
const { test, afterEach, mock } = require('node:test');
const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../dist/models/User.js');
const router = require('../dist/routes/cvRoutes.js').default;
const nativeFetch = global.fetch;
process.env.JWT_SECRET = 'cv-regression-tests-secret-only';
process.env.CV_SERVICE_URL = 'http://127.0.0.1:8000';
process.env.CV_SERVICE_API_KEY = 'cv-service-test-only-internal-secret-123456';
let account = 0;

afterEach(() => mock.restoreAll());

async function fixture(t, upstream = async () => Response.json({ task_id: '51c48680-38ce-4cc4-9905-548b310cd5d1', status: 'pending' }, { status: 202 })) {
  const owner = (++account).toString(16).padStart(24, '0');
  mock.method(User, 'findById', id => ({ select: async () => ({ _id: id, role: 'athlete', isActive: true }) }));
  const calls = [];
  mock.method(global, 'fetch', async (url, init) => { calls.push({ url, init }); return upstream(url, init); });
  const app = express();
  app.use('/cv', router);
  const server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/cv`;
  const token = jwt.sign({ id: owner }, process.env.JWT_SECRET, { expiresIn: '5m' });
  const headers = { Authorization: `Bearer ${token}` };
  const upload = (options = {}) => {
    const form = new FormData();
    form.append('file', new Blob([options.bytes || 'video'], { type: options.mime || 'video/mp4' }), options.name || 'clip.mp4');
    if (options.consent !== false) form.append('consent', options.consent || 'true');
    return nativeFetch(`${url}/analyze`, { method: 'POST', headers: { ...headers, ...options.headers }, body: form });
  };
  return { url, owner, headers, calls, upload };
}

test('CV routes reject anonymous and inactive accounts before forwarding or parsing uploads', async t => {
  const f = await fixture(t);
  assert.equal((await nativeFetch(`${f.url}/analyze`, { method: 'POST', body: 'bad multipart' })).status, 401);
  assert.equal((await nativeFetch(`${f.url}/status/51c48680-38ce-4cc4-9905-548b310cd5d1`)).status, 401);
  mock.method(User, 'findById', id => ({ select: async () => ({ _id: id, isActive: false }) }));
  assert.equal((await f.upload()).status, 401);
  assert.equal(f.calls.length, 0);
});

test('CV routes fail closed when internal service configuration is missing', async t => {
  const f = await fixture(t);
  const saved = process.env.CV_SERVICE_API_KEY;
  process.env.CV_SERVICE_API_KEY = '';
  try { assert.equal((await f.upload()).status, 503); }
  finally { process.env.CV_SERVICE_API_KEY = saved; }
  assert.equal(f.calls.length, 0);
});

test('video upload requires explicit consent and matching supported media type', async t => {
  const f = await fixture(t);
  assert.equal((await f.upload({ consent: false })).status, 400);
  assert.equal((await f.upload({ mime: 'image/png' })).status, 415);
  assert.equal((await f.upload({ name: 'run.exe' })).status, 415);
  assert.equal(f.calls.length, 0);
});

test('video upload enforces the file size limit on the API server', async t => {
  const f = await fixture(t);
  assert.equal((await f.upload({ bytes: new Uint8Array(25 * 1024 * 1024 + 1) })).status, 413);
  assert.equal(f.calls.length, 0);
});

test('video proxy derives owner and service credential without trusting client headers', async t => {
  const f = await fixture(t);
  const response = await f.upload({ headers: { 'X-Athlix-User': 'attacker-selected-user', 'X-Athlix-Service-Key': 'client-supplied-secret' } });
  assert.equal(response.status, 202);
  assert.equal(f.calls[0].url, 'http://127.0.0.1:8000/analyze');
  assert.equal(f.calls[0].init.headers['X-Athlix-User'], f.owner);
  assert.equal(f.calls[0].init.headers['X-Athlix-Service-Key'], process.env.CV_SERVICE_API_KEY);
  assert.equal(f.calls[0].init.redirect, 'error');
  assert.equal(f.calls[0].init.body.get('file').name, 'clip.mp4');
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
});

test('status and deletion validate task ids and forward only the current principal', async t => {
  const f = await fixture(t, async (_url, init) => init.method === 'DELETE' ? new Response(null, { status: 204 }) : Response.json({ detail: 'Task not found or expired.' }, { status: 404 }));
  assert.equal((await nativeFetch(`${f.url}/status/not-a-uuid`, { headers: f.headers })).status, 400);
  const id = '51c48680-38ce-4cc4-9905-548b310cd5d1';
  assert.equal((await nativeFetch(`${f.url}/status/${id}`, { headers: f.headers })).status, 404);
  assert.equal((await nativeFetch(`${f.url}/status/${id}`, { method: 'DELETE', headers: f.headers })).status, 204);
  assert.ok(f.calls.every(call => call.init.headers['X-Athlix-User'] === f.owner));
  assert.equal(f.calls.length, 2);
});

test('upstream failures return a recovery error without exposing server details', async t => {
  const f = await fixture(t, async () => { throw new Error('private internal connection details'); });
  const response = await f.upload();
  assert.equal(response.status, 502);
  assert.doesNotMatch(JSON.stringify(await response.json()), /private internal/);
});

test('video submissions have a per-account rate limit', async t => {
  const f = await fixture(t);
  for (let i = 0; i < 5; i++) assert.equal((await f.upload()).status, 202);
  assert.equal((await f.upload()).status, 429);
  assert.equal(f.calls.length, 5);
});
