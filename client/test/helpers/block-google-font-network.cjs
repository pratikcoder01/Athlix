// Build-time regression guard, inherited by Next's workers through NODE_OPTIONS.
// Reject remote font dependencies rather than replacing them with mock fonts.
const { syncBuiltinESMExports } = require('node:module');
const blocked = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);

function hostname(input) {
  try {
    const value = typeof input === 'string' || input instanceof URL ? input : input?.url;
    return value ? new URL(value).hostname.toLowerCase().replace(/\.$/, '') : '';
  } catch { return ''; }
}

function rejectFontHost(host) {
  if (blocked.has(host)) throw new Error(`ATHLIX_FONT_NETWORK_BLOCKED: ${host}`);
}

for (const name of ['node:http', 'node:https']) {
  const transport = require(name);
  for (const method of ['request', 'get']) {
    const original = transport[method];
    transport[method] = function (...args) {
      const options = args[0] && typeof args[0] === 'object' && !(args[0] instanceof URL)
        ? args[0] : args[1] && typeof args[1] === 'object' ? args[1] : {};
      const host = options.hostname || options.host;
      rejectFontHost(host ? hostname(`http://${host}`) : hostname(args[0]));
      return Reflect.apply(original, this, args);
    };
  }
}
syncBuiltinESMExports();

const originalFetch = globalThis.fetch;
if (originalFetch) {
  globalThis.fetch = function (input, ...args) {
    rejectFontHost(hostname(input));
    return Reflect.apply(originalFetch, this, [input, ...args]);
  };
}
