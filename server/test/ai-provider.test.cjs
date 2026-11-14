const assert = require('node:assert/strict');
const { test } = require('node:test');
const { askFeatherlessJSON } = require('../dist/utils/anthropic');
const { configureCloudinary } = require('../dist/config/cloudinary');

function environment(t, values = {}) {
  const names = ['FEATHERLESS_API_KEY', 'OPENROUTER_API_KEY', 'FEATHERLESS_MODEL', 'OPENROUTER_MODEL', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  for (const name of names) delete process.env[name];
  Object.assign(process.env, values);
  t.after(() => { for (const name of names) { if (previous[name] === undefined) delete process.env[name]; else process.env[name] = previous[name]; } });
  t.mock.method(console, 'warn', () => {});
}

const answer = (content) => new Response(JSON.stringify({ choices: [{ message: { content } }] }), { headers: { 'Content-Type': 'application/json' } });

test('native fetch sends a bounded provider request and parses fenced JSON objects', async (t) => {
  environment(t, { FEATHERLESS_API_KEY: 'test-provider-key', FEATHERLESS_MODEL: 'test-model' });
  t.mock.method(globalThis, 'fetch', async (url, request) => {
    assert.equal(url, 'https://api.featherless.ai/v1/chat/completions');
    assert.equal(request.headers.Authorization, 'Bearer test-provider-key');
    assert.ok(request.signal instanceof AbortSignal);
    assert.equal(request.redirect, 'error');
    const body = JSON.parse(request.body);
    assert.equal(body.model, 'test-model');
    assert.equal(body.max_tokens, 100);
    assert.equal(body.messages[1].content, 'user prompt');
    return answer('```json\n{"items":["one"]}\n```');
  });
  assert.deepEqual(await askFeatherlessJSON('system prompt', 'user prompt', 100), { items: ['one'] });
});

test('provider failure falls back deterministically without logging response bodies or secrets', async (t) => {
  environment(t, { FEATHERLESS_API_KEY: 'first-secret', OPENROUTER_API_KEY: 'second-secret' });
  const urls = [];
  const warnings = [];
  console.warn.mock.mockImplementation((...parts) => warnings.push(parts.join(' ')));
  t.mock.method(globalThis, 'fetch', async (url) => {
    urls.push(url);
    return urls.length === 1 ? new Response('private-upstream-body first-secret', { status: 503 }) : answer('{"ok":true}');
  });
  assert.deepEqual(await askFeatherlessJSON('private prompt', 'user'), { ok: true });
  assert.deepEqual(urls, ['https://api.featherless.ai/v1/chat/completions', 'https://openrouter.ai/api/v1/chat/completions']);
  assert.deepEqual(warnings, ['[Featherless] AI request failed']);
});

test('malformed and oversized upstream responses fail with a safe service error', async (t) => {
  environment(t, { FEATHERLESS_API_KEY: 'test-provider-key' });
  const responses = [
    () => new Response('upstream-private-data'),
    () => answer('[]'),
    () => answer('null'),
    () => answer('{broken-json'),
    () => answer({ unsafe: 'not a string' }),
    () => new Response('x'.repeat(512 * 1024 + 1)),
    () => answer('x'.repeat(64 * 1024 + 1)),
  ];
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => responses.shift()());
  for (let index = 0; index < 7; index++) {
    await assert.rejects(() => askFeatherlessJSON('system', 'user'), (error) => error.statusCode === 503 && error.message === 'AI service unavailable. Please try again later.');
  }
  assert.equal(fetchMock.mock.callCount(), 7);
});

test('timeout/network failures are recoverable and do not expose upstream error text', async (t) => {
  environment(t, { FEATHERLESS_API_KEY: 'test-provider-key' });
  t.mock.method(globalThis, 'fetch', async () => { throw new DOMException('private request URL and key', 'TimeoutError'); });
  await assert.rejects(() => askFeatherlessJSON('system', 'user'), (error) => error.statusCode === 503 && !error.message.includes('private'));
});

test('missing provider configuration and invalid token budgets never make a network request', async (t) => {
  environment(t);
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => { throw new Error('should not be called'); });
  await assert.rejects(() => askFeatherlessJSON('system', 'user'), (error) => error.statusCode === 503);
  for (const budget of [0, -1, 4001, 1.5, Infinity]) await assert.rejects(() => askFeatherlessJSON('system', 'user', budget), /token budget/);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('unused media configuration has no mock credentials and fails closed until configured', (t) => {
  environment(t);
  assert.throws(configureCloudinary, (error) => error.statusCode === 503);
  Object.assign(process.env, { CLOUDINARY_CLOUD_NAME: 'test-cloud', CLOUDINARY_API_KEY: 'test-key', CLOUDINARY_API_SECRET: 'test-secret' });
  const client = configureCloudinary();
  assert.equal(client.config().cloud_name, 'test-cloud');
  assert.equal(client.config().secure, true);
});
