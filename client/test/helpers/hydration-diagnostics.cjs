// Explicit fixture-test instrumentation only. It records the hydration cursor
// before React replaces mismatched markup, while preserving the original throw.
// It never edits build assets on disk or suppresses a React/browser error.
const assert = require('node:assert/strict');

function instrumentHydrationFailure(source) {
  // Next 15's production React renderer declares the hydration parent/cursor
  // immediately before its error-418 function. Discover names from that local
  // declaration instead of assuming a filename/hash or minifier identifier.
  const pattern = /var ([\w$]+)=null,([\w$]+)=null,([\w$]+)=!1,([\w$]+)=null,([\w$]+)=!1,([\w$]+)=Error\([\w$]+\(519\)\);function ([\w$]+)\(([\w$]+)\)\{/;
  const match = pattern.exec(source);
  if (!match) return { source, instrumented: false };
  const parent = match[1], cursor = match[2], fiber = match[8];
  const capture = `try{globalThis.__athlixRecordHydrationFailure?.(${fiber},${parent},${cursor});}catch{}`;
  return { source: source.slice(0, match.index + match[0].length) + capture + source.slice(match.index + match[0].length), instrumented: true };
}

async function captureHydrationDiagnostics(context) {
  await context.addInitScript(() => {
    const records = [];
    const mutations = [];
    const describe = node => node ? {
      nodeType: node.nodeType, name: node.nodeName,
      className: typeof node.className === 'string' ? node.className.slice(0, 600) : undefined,
      hidden: node.nodeType === 1 ? node.hasAttribute('hidden') : undefined,
      children: [...(node.childNodes || [])].slice(0, 8).map(child => ({
        nodeType: child.nodeType, name: child.nodeName,
        className: typeof child.className === 'string' ? child.className.slice(0, 200) : undefined,
        hidden: child.nodeType === 1 ? child.hasAttribute('hidden') : undefined,
      })),
    } : null;
    globalThis.__athlixHydrationDiagnostics = records;
    globalThis.__athlixRecordHydrationFailure = (fiber, parent, cursor) => {
      if (records.length >= 5) return;
      const ancestors = [];
      for (let current = fiber; current && ancestors.length < 55; current = current.return) {
        ancestors.push({
          tag: current.tag,
          type: typeof current.type === 'string' ? current.type : current.type?.displayName || current.type?.name || typeof current.type,
          key: current.key,
          className: typeof current.pendingProps?.className === 'string' ? current.pendingProps.className.slice(0, 600) : undefined,
          node: describe(current.stateNode),
        });
      }
      records.push({ url: location.href, width: innerWidth, expected: ancestors[0], actual: describe(cursor), parent: describe(parent?.stateNode), ancestors, body: describe(document.body), mutations: mutations.slice(-50) });
    };
    new MutationObserver(changes => {
      for (const change of changes) mutations.push({ target: change.target.nodeName, added: [...change.addedNodes].map(node => node.nodeName), removed: [...change.removedNodes].map(node => node.nodeName) });
      if (mutations.length > 300) mutations.splice(0, mutations.length - 300);
    }).observe(document, { childList: true, subtree: true });
  });
}

async function installHydrationDiagnostics(context, { jitterMs = 0, instrument = true } = {}) {
  assert.ok(Number.isInteger(jitterMs) && jitterMs >= 0 && jitterMs <= 250);
  await captureHydrationDiagnostics(context);
  let seed = 418;
  await context.route('**/_next/static/chunks/**', async route => {
    const url = new URL(route.request().url());
    assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname), 'Hydration diagnostics accept only isolated loopback fixture assets');
    if (!url.pathname.endsWith('.js')) return route.continue();
    const response = await route.fetch();
    const source = await response.text();
    const result = instrument ? instrumentHydrationFailure(source) : { source };
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    if (jitterMs) await new Promise(resolve => setTimeout(resolve, Math.floor((seed >>> 0) / 4294967296 * jitterMs)));
    return route.fulfill({ response, body: result.source });
  });
}

module.exports = { captureHydrationDiagnostics, installHydrationDiagnostics, instrumentHydrationFailure };
