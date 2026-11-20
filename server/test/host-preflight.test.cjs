// Safe host-check harness: injected fetch responses only; never starts a listener.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { exactOrigin, parseArgs, verifyHosts } = require('../../scripts/verify-hosts.cjs');
const backend = 'https://api.example.test';
const frontend = 'https://preview.example.test';
const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
});

function fixture(overrides = {}) {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    const override = overrides[url] || overrides[options.method];
    if (override) return override(url, options);
    if (url === backend + '/api/health') return json({ success: true, status: 'alive' });
    if (url === backend + '/api/ready') return json({ success: true, status: 'ready' });
    if (options.method === 'OPTIONS') return options.headers.Origin === frontend ? new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Origin': frontend, 'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Vary': 'Origin',
    } }) : json({ success: false }, 404);
    if (url === frontend) return new Response('<html><title>ATHLIX</title>' + 'x'.repeat(32_768), { headers: { 'Content-Type': 'text/html' } });
    throw Error('Unexpected fixture request');
  };
  return { calls, fetcher };
}

test('host preflight validates all targets before networking and accepts no credentials or ambiguous origins', async () => {
  for (const invalid of ['http://api.example.test', 'https://u:private-secret@api.example.test', 'https://api.example.test/api',
    'https://api.example.test?token=private-secret', 'https://api.example.test#private-secret', '/relative', 'https://localhost',
    'https://127.0.0.1', 'https://[::1]', undefined]) {
    const f = fixture();
    await assert.rejects(verifyHosts({ backend: invalid, frontend }, f.fetcher), error => !error.message.includes('private-secret'));
    await assert.rejects(verifyHosts({ backend, frontend: invalid }, f.fetcher));
    assert.equal(f.calls.length, 0);
  }
  assert.equal(exactOrigin(backend + '/', '--backend'), backend);
  await assert.rejects(verifyHosts({ backend, frontend: backend }, fixture().fetcher));
});

test('default host preflight makes only bounded credential-free GET/OPTIONS and proves exact positive/negative CORS contracts', async () => {
  const f = fixture();
  const report = await verifyHosts({ backend, frontend }, f.fetcher);
  assert.equal(report.passed, true);
  assert.equal(report.authenticatedJourneys, 'not_run');
  assert.equal(report.checks.length, 5);
  assert.equal(f.calls.length, 5);
  for (const { url, options } of f.calls) {
    assert.ok(url.startsWith(backend) || url.startsWith(frontend));
    assert.ok(['GET', 'OPTIONS'].includes(options.method));
    assert.equal(options.redirect, 'manual');
    assert.equal(options.credentials, 'omit');
    assert.equal(options.cache, 'no-store');
    assert.ok(options.signal instanceof AbortSignal);
    const headers = new Headers(options.headers);
    assert.equal(headers.has('cookie'), false);
    assert.equal(headers.has('authorization'), false);
  }
});

test('preflight rejects unavailable database state, wildcard/reflected CORS and unsafe cache contracts', async () => {
  for (const f of [
    fixture({ [backend + '/api/ready']: () => json({ success: false, status: 'not_ready' }, 503) }),
    fixture({ OPTIONS: () => new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*' } }) }),
    fixture({ OPTIONS: (_url, options) => new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': options.headers.Origin } }) }),
    fixture({ [backend + '/api/health']: () => json({ success: true, status: 'alive' }, 200, { 'Cache-Control': 'public, max-age=300' }) }),
  ]) {
    const report = await verifyHosts({ backend, frontend }, f.fetcher);
    assert.equal(report.passed, false);
    assert.ok(report.checks.some(check => check.outcome === 'fail'));
  }
});

test('protected/redirecting preview is blocked without following it or attempting authentication', async () => {
  for (const response of [() => new Response(null, { status: 302, headers: { Location: 'https://vercel.com/sso-api?private-secret' } }),
    () => new Response('Authentication required', { status: 401 })]) {
    const f = fixture({ [frontend]: response });
    const report = await verifyHosts({ backend, frontend }, f.fetcher);
    assert.equal(report.passed, false);
    assert.equal(report.checks.find(check => check.check === 'frontend_document').outcome, 'blocked');
    assert.equal(f.calls.some(call => call.options.method === 'POST'), false);
    assert.equal(JSON.stringify(report).includes('private-secret'), false);
  }
});

test('oversized/network error responses fail without exposing their contents and CLI parsing cannot add request credentials', async () => {
  for (const response of [() => new Response('private-secret'.repeat(5000)), () => { throw Error('private-driver-token'); }]) {
    const f = fixture({ [backend + '/api/health']: response });
    const report = await verifyHosts({ backend, frontend }, f.fetcher);
    assert.equal(report.passed, false);
    assert.equal(JSON.stringify(report).includes('private-'), false);
  }
  assert.deepEqual(parseArgs(['--backend', backend, '--frontend', frontend]), { backend, frontend });
  assert.deepEqual(parseArgs(['--help']), { help: true });
  for (const args of [[], ['--backend', backend], ['--frontend', frontend, '--backend'],
    ['--backend', backend, '--backend', backend, '--frontend', frontend], ['--cookie', 'private-secret'],
    ['--check-auth-proxy']]) assert.throws(() => parseArgs(args));
});
