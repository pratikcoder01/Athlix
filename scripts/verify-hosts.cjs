// Unauthenticated, bounded host checks. No account credentials are accepted or
// sent. These checks cannot establish that signed-in product journeys work.
const UNTRUSTED_ORIGIN = 'https://untrusted-athlix-preflight.invalid';
const MAX_BODY_BYTES = 16 * 1024;

function exactOrigin(value, field) {
  let url;
  try { if (typeof value === 'string') url = new URL(value); } catch { /* Report the field, never its value. */ }
  if (!url || url.protocol !== 'https:' || url.username || url.password ||
      url.pathname !== '/' || url.search || url.hash ||
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw new Error(`${field} must be an exact HTTPS origin without credentials, path, query or fragment`);
  }
  return url.origin;
}

async function boundedText(response, allowPrefix = false) {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks = [];
  let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      const remaining = MAX_BODY_BYTES - bytes;
      if (value.byteLength > remaining) {
        if (allowPrefix) chunks.push(Buffer.from(value.subarray(0, remaining)));
        await reader.cancel();
        if (allowPrefix) return Buffer.concat(chunks).toString('utf8');
        throw new Error('RESPONSE_TOO_LARGE');
      }
      bytes += value.byteLength;
      chunks.push(Buffer.from(value));
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks).toString('utf8');
}

const tokens = value => (value || '').toLowerCase().split(',').map(part => part.trim());
const noStore = response => tokens(response.headers.get('cache-control')).includes('no-store');
const isJson = response => /^application\/json(?:;|$)/i.test(response.headers.get('content-type') || '');
const jsonBody = text => { try { return JSON.parse(text); } catch { return null; } };

async function verifyHosts({ backend, frontend }, fetcher = globalThis.fetch) {
  backend = exactOrigin(backend, '--backend');
  frontend = exactOrigin(frontend, '--frontend');
  if (backend === frontend || frontend === UNTRUSTED_ORIGIN) throw new Error('Provide distinct backend and frontend origins');

  const request = async (check, url, options, inspect) => {
    try {
      const response = await fetcher(url, { ...options, redirect: 'manual', credentials: 'omit',
        cache: 'no-store', signal: AbortSignal.timeout(20_000) });
      if (response.status >= 300 && response.status < 400) {
        await response.body?.cancel();
        return { check, outcome: 'blocked', code: 'REDIRECT_REQUIRES_TARGET_REVIEW', status: response.status };
      }
      const result = inspect(response, await boundedText(response, check === 'frontend_document'));
      return { check, ...result, status: response.status };
    } catch (error) {
      return { check, outcome: 'fail', code: error?.message === 'RESPONSE_TOO_LARGE' ? 'RESPONSE_TOO_LARGE' : 'NETWORK_OR_TIMEOUT' };
    }
  };

  const health = expected => (response, text) => {
    const body = jsonBody(text);
    const valid = response.status === 200 && isJson(response) && body?.success === true && body?.status === expected && noStore(response);
    return { outcome: valid ? 'pass' : 'fail', code: valid ? 'EXPECTED_HEALTH_CONTRACT' : 'HEALTH_CONTRACT_NOT_READY' };
  };
  const options = origin => ({ method: 'OPTIONS', headers: { Origin: origin,
    'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'Authorization' } });

  const checks = await Promise.all([
    request('backend_liveness', backend + '/api/health', { method: 'GET' }, health('alive')),
    request('backend_readiness', backend + '/api/ready', { method: 'GET' }, health('ready')),
    request('cors_allowed_frontend', backend + '/api/training', options(frontend), response => {
      const valid = response.status >= 200 && response.status < 300 &&
        response.headers.get('access-control-allow-origin') === frontend &&
        response.headers.get('access-control-allow-credentials') === 'true' &&
        tokens(response.headers.get('access-control-allow-methods')).includes('get') &&
        tokens(response.headers.get('access-control-allow-headers')).includes('authorization') &&
        tokens(response.headers.get('vary')).includes('origin');
      return { outcome: valid ? 'pass' : 'fail', code: valid ? 'EXACT_ORIGIN_ALLOWED' : 'FRONTEND_CORS_MISMATCH' };
    }),
    request('cors_untrusted_origin', backend + '/api/training', options(UNTRUSTED_ORIGIN), response => {
      const valid = response.status >= 200 && response.status < 500 && !response.headers.has('access-control-allow-origin');
      return { outcome: valid ? 'pass' : 'fail', code: valid ? 'UNTRUSTED_ORIGIN_NOT_GRANTED' : 'UNTRUSTED_ORIGIN_NOT_SAFELY_DENIED' };
    }),
    request('frontend_document', frontend, { method: 'GET' }, (response, text) => {
      if ([401, 403].includes(response.status)) return { outcome: 'blocked', code: 'FRONTEND_ACCESS_REQUIRES_AUTHORIZATION' };
      const valid = response.status === 200 && /text\/html/i.test(response.headers.get('content-type') || '') && /\bATHLIX\b/.test(text);
      return { outcome: valid ? 'pass' : 'fail', code: valid ? 'ATHLIX_DOCUMENT_REACHABLE' : 'FRONTEND_DOCUMENT_NOT_VERIFIED' };
    }),
  ]);

  return { schemaVersion: 1, checkedAt: new Date().toISOString(), targets: { backend, frontend },
    scope: 'unauthenticated_host_contracts', authenticatedJourneys: 'not_run',
    passed: checks.every(check => check.outcome === 'pass'), checks };
}

function parseArgs(args) {
  const options = {};
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--help' && args.length === 1) return { help: true };
    if (arg === '--backend' || arg === '--frontend') {
      const field = arg.slice(2);
      if (options[field] !== undefined || !args[index + 1] || args[index + 1].startsWith('--')) throw new Error(`Provide exactly one value for ${arg}`);
      options[field] = args[++index];
    } else throw new Error('Unsupported option. Use --help');
  }
  if (!options.backend || !options.frontend) throw new Error('--backend and --frontend are required');
  return options;
}

if (require.main === module) {
  (async () => {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      console.log('Usage: node scripts/verify-hosts.cjs --backend https://your-api.example --frontend https://your-app.example');
      return;
    }
    const result = await verifyHosts(options);
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.passed ? 0 : 1;
  })().catch(() => {
    console.error('Host verification could not start. Supply exact HTTPS origins; use --help for arguments.');
    process.exitCode = 2;
  });
}

module.exports = { exactOrigin, parseArgs, verifyHosts };
