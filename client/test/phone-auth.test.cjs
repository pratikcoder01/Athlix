const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { test } = require('node:test');
const React = require('react');
const ts = require('typescript');

const filename = path.resolve(__dirname, '../src/app/(auth)/login/phone/page.tsx');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  fileName: filename,
}).outputText;
const dependencyRequire = createRequire(filename);
const actor = { id: '507f1f77bcf86cd799439011', name: 'Reviewed coach', role: 'coach' };
const credentials = () => ({ user: { getIdToken: async () => 'fixture-id-token' } });
const response = () => Response.json({ user: actor, token: 'fixture-athlix-token' });

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

async function reached(predicate) {
  for (let attempt = 0; attempt < 20; attempt++) {
    if (predicate()) return;
    await new Promise(setImmediate);
  }
  assert.fail('Expected asynchronous boundary was not reached');
}

// Run the actual page's JSX, effects and handlers. Only React's mounting hooks
// and the Firebase/router/transport boundaries are controlled; no listener,
// Firebase project, browser reCAPTCHA script or SMS recipient is involved.
function pageFixture(options = {}) {
  const slots = [], effects = [], cleanups = [], writes = [];
  const calls = { verifiers: [], render: [], send: [], confirm: [], fetch: [], setAuth: [], push: [], locks: 0, timeouts: [] };
  const timers = new Map(); let nextTimer = 0;
  let cursor = 0, tree;
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], value => {
        writes.push(index);
        slots[index] = typeof value === 'function' ? value(slots[index]) : value;
      }];
    },
    useRef(initial) {
      const index = cursor++;
      return slots[index] ??= { current: initial };
    },
    useEffect(effect) {
      const index = cursor++;
      if (!(index in slots)) { slots[index] = true; effects.push(effect); }
    },
  };
  class Verifier {
    constructor(...args) {
      assert.equal(args[1]?.id, 'fixture-recaptcha-container');
      assert.equal(args[2].size, 'invisible');
      if (options.constructorError) throw options.constructorError;
      this.cleared = false;
      calls.verifiers.push(this);
    }
    render() {
      assert.equal(this.cleared, false, 'A destroyed verifier must never be rendered');
      calls.render.push(this);
      return options.render ? options.render(this) : Promise.resolve(0);
    }
    clear() {
      assert.equal(this.cleared, false, 'Firebase clear() is destructive and cannot run twice');
      this.cleared = true;
    }
  }
  const confirmation = { confirm: async code => {
    calls.confirm.push(code);
    return options.confirm ? options.confirm(code) : credentials();
  } };
  const stub = () => null;
  const exports = {};
  const context = vm.createContext({
    exports, AbortController,
    // Safari versions in the framework target do not provide AbortSignal.any.
    AbortSignal: {},
    setTimeout: (callback, duration) => {
      calls.timeouts.push(duration);
      if (!options.manualTimers) return setTimeout(callback, duration);
      timers.set(++nextTimer, callback); return nextTimer;
    },
    clearTimeout: timer => options.manualTimers ? timers.delete(timer) : clearTimeout(timer),
    fetch: async (url, init) => {
      calls.fetch.push({ url, init, body: JSON.parse(init.body) });
      return options.fetch ? options.fetch(url, init) : response();
    },
    require: name => {
      if (name === 'react') return { ...React, ...hooks };
      if (name === 'next/navigation') return { useRouter: () => ({ push: target => calls.push.push(target) }) };
      if (name === 'next/link' || name.endsWith('/MagneticButton') || name.endsWith('/SpotlightCard')) return stub;
      if (name === 'lucide-react') return { ArrowLeft: stub, Smartphone: stub, ChevronRight: stub, AlertCircle: stub };
      if (name.endsWith('/lib/firebase')) return { auth: {} };
      if (name.endsWith('/lib/authSession')) return { withSessionLock: async run => { calls.locks++; return options.lock ? options.lock(run) : run(); } };
      if (name.endsWith('/store/authStore')) return { useAuthStore: () => ({ setAuth: (...args) => calls.setAuth.push(args) }) };
      if (name === 'firebase/auth') return { RecaptchaVerifier: Verifier, signInWithPhoneNumber: async (...args) => {
        calls.send.push(args);
        assert.ok(args[2] instanceof Verifier, 'Every send must receive a real, live verifier');
        assert.equal(args[2].cleared, false);
        return options.send ? options.send(...args) : confirmation;
      } };
      return dependencyRequire(name);
    },
  });
  new vm.Script(compiled, { filename }).runInContext(context);
  function walk(node, predicate) {
    if (!node) return null;
    if (Array.isArray(node)) {
      for (const child of node) { const found = walk(child, predicate); if (found) return found; }
    } else if (typeof node === 'object') {
      if (predicate(node)) return node;
      return walk(node.props?.children, predicate);
    }
    return null;
  }
  function text(node) {
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(text).join('');
    return node && typeof node === 'object' ? text(node.props?.children) : '';
  }
  function render() {
    cursor = 0;
    tree = exports.default();
    const container = walk(tree, node => node.props?.id === 'recaptcha-container');
    container.props.ref.current = { id: 'fixture-recaptcha-container' };
    return tree;
  }
  function button(label) {
    const found = walk(tree, node => typeof node.props?.onClick === 'function' && text(node).includes(label));
    assert.ok(found, `Expected button: ${label}`);
    return found;
  }
  function input(id, value) {
    const found = walk(tree, node => node.props?.id === id);
    assert.ok(found, `Expected input: ${id}`);
    found.props.onChange({ target: { value } });
    render();
  }
  render();
  for (const effect of effects) { const cleanup = effect(); if (cleanup) cleanups.push(cleanup); }
  return {
    calls, writes, render, button, input, text: () => text(tree), timers,
    unmount() { for (const cleanup of cleanups.splice(0)) cleanup(); },
    async send(number = '+15555550123') {
      input('phone-number', number);
      await button('SEND OTP').props.onClick();
      render();
    },
    async verify(code = '123456') {
      input('phone-otp', code);
      await button('CONFIRM CODE').props.onClick();
      render();
    },
  };
}

test('phone verification is lazy and invalid input never creates a challenge or sends SMS', async () => {
  const f = pageFixture();
  assert.equal(f.calls.verifiers.length, 0);
  await f.send('5551234');
  assert.match(f.text(), /valid international phone number/);
  assert.equal(f.calls.verifiers.length, 0);
  assert.equal(f.calls.send.length, 0);
  f.input('phone-name', 'x'.repeat(101));
  await f.send();
  assert.match(f.text(), /100 characters or fewer/);
  assert.equal(f.calls.verifiers.length, 0);
  f.unmount();
});

test('a rejected reCAPTCHA render is handled and the next send awaits a fresh verifier', async () => {
  const gate = deferred(); let renders = 0;
  const f = pageFixture({ render: () => ++renders === 1 ? Promise.reject({ code: 'auth/network-request-failed' }) : gate.promise });
  await f.send();
  assert.match(f.text(), /Connection failed/);
  assert.equal(f.calls.send.length, 0);
  assert.equal(f.calls.verifiers[0].cleared, true);
  const retry = f.button('SEND OTP').props.onClick();
  assert.equal(f.calls.verifiers.length, 2);
  assert.equal(f.calls.send.length, 0, 'Sending must wait for challenge initialization');
  gate.resolve(1); await retry; f.render();
  assert.equal(f.calls.send.length, 1);
  assert.equal(f.calls.send[0][2], f.calls.verifiers[1]);
  f.unmount();
});

test('a failed SMS send can retry with a fresh verifier and hides provider debug details', async () => {
  let sends = 0;
  const f = pageFixture({ send: async () => {
    if (++sends === 1) throw new Error('sensitive provider debug payload');
    return { confirm: async () => credentials() };
  } });
  await f.send();
  assert.match(f.text(), /Failed to send a code/);
  assert.doesNotMatch(f.text(), /sensitive provider/);
  assert.equal(f.calls.verifiers[0].cleared, true);
  await f.send();
  assert.equal(f.calls.verifiers.length, 2);
  assert.equal(f.calls.send[1][2], f.calls.verifiers[1]);
  assert.match(f.text(), /Code sent to \+15555550123/);
  f.unmount();
});

test('concurrent send handlers are deduplicated before React commits loading state', async () => {
  const gate = deferred();
  const f = pageFixture({ render: () => gate.promise });
  f.input('phone-number', '+15555550123');
  const send = f.button('SEND OTP').props.onClick;
  const first = send(); const duplicate = send();
  assert.equal(f.calls.verifiers.length, 1);
  gate.resolve(0); await Promise.all([first, duplicate]);
  assert.equal(f.calls.send.length, 1);
  f.unmount();
});

test('correct OTP exchange omits public role assignment and preserves the server-reviewed role', async () => {
  const f = pageFixture();
  assert.doesNotMatch(f.text(), /Workspace interest/);
  f.input('phone-name', '  Phone athlete  ');
  await f.send(); await f.verify();
  assert.equal(f.calls.fetch.length, 1);
  assert.equal(f.calls.fetch[0].url, '/api/auth/firebase');
  assert.deepEqual(f.calls.fetch[0].body, { idToken: 'fixture-id-token', name: 'Phone athlete' });
  assert.equal(f.calls.fetch[0].init.credentials, 'include');
  assert.ok(f.calls.fetch[0].init.signal instanceof AbortSignal);
  assert.equal(f.calls.locks, 1);
  assert.deepEqual(f.calls.timeouts, [15_000]);
  assert.deepEqual(f.calls.setAuth, [[actor, 'fixture-athlix-token']]);
  assert.deepEqual(f.calls.push, ['/dashboard']);
  f.unmount();
});

test('blank display names use the safe athlete fallback', async () => {
  const f = pageFixture();
  f.input('phone-name', '   ');
  await f.send(); await f.verify();
  assert.equal(f.calls.fetch[0].body.name, 'Athlete');
  f.unmount();
});

test('concurrent verify handlers exchange the identity only once', async () => {
  const gate = deferred();
  const f = pageFixture({ confirm: () => gate.promise });
  await f.send(); f.input('phone-otp', '123456');
  const verify = f.button('CONFIRM CODE').props.onClick;
  const first = verify(); const duplicate = verify();
  assert.equal(f.calls.confirm.length, 1);
  gate.resolve(credentials()); await Promise.all([first, duplicate]);
  assert.equal(f.calls.fetch.length, 1);
  assert.equal(f.calls.setAuth.length, 1);
  f.unmount();
});

test('an incorrect OTP stays editable and can be retried', async () => {
  let confirmations = 0;
  const f = pageFixture({ confirm: async () => {
    if (++confirmations === 1) throw { code: 'auth/invalid-verification-code' };
    return credentials();
  } });
  await f.send(); await f.verify('111111');
  assert.match(f.text(), /Incorrect code/);
  assert.equal(f.calls.fetch.length, 0);
  await f.verify('123456');
  assert.equal(f.calls.setAuth.length, 1);
  f.unmount();
});

for (const failure of ['network', 'http', 'invalid-json']) {
  test(`a completed SMS confirmation survives an ATHLIX ${failure} failure without reusing the code`, async () => {
    let confirms = 0, exchanges = 0;
    const f = pageFixture({
      confirm: async () => {
        assert.equal(++confirms, 1, 'The SMS session has already been consumed');
        return credentials();
      },
      fetch: async () => {
        if (++exchanges === 1) {
          if (failure === 'network') throw new Error('fixture connection lost');
          if (failure === 'http') return Response.json({ message: 'fixture unavailable' }, { status: 503 });
          return new Response('unavailable', { status: 502 });
        }
        return response();
      },
    });
    await f.send(); await f.verify();
    assert.match(f.text(), /Sign-in could not be completed/);
    assert.equal(f.calls.setAuth.length, 0);
    await f.button('COMPLETE SIGN-IN').props.onClick(); f.render();
    assert.equal(f.calls.confirm.length, 1);
    assert.equal(f.calls.fetch.length, 2);
    assert.deepEqual(f.calls.setAuth, [[actor, 'fixture-athlix-token']]);
    f.unmount();
  });
}

test('a completed confirmation survives a token retrieval failure without reconfirming the code', async () => {
  let tokens = 0;
  const f = pageFixture({ confirm: async () => ({ user: { getIdToken: async () => {
    if (++tokens === 1) throw { code: 'auth/network-request-failed' };
    return 'fixture-id-token';
  } } }) });
  await f.send(); await f.verify();
  assert.match(f.text(), /Connection failed/);
  assert.equal(f.calls.fetch.length, 0);
  await f.button('COMPLETE SIGN-IN').props.onClick(); f.render();
  assert.equal(f.calls.confirm.length, 1);
  assert.equal(tokens, 2);
  assert.equal(f.calls.setAuth.length, 1);
  f.unmount();
});

test('change number discards a previously confirmed identity before the next OTP attempt', async () => {
  let exchanges = 0;
  const f = pageFixture({ fetch: async () => {
    if (++exchanges === 1) throw new Error('fixture connection lost');
    return response();
  } });
  await f.send(); await f.verify();
  f.button('Change number').props.onClick(); f.render();
  await f.send('+15555550456'); await f.verify('654321');
  assert.deepEqual(f.calls.confirm, ['123456', '654321']);
  assert.equal(f.calls.setAuth.length, 1);
  f.unmount();
});

test('an expired OTP discards its confirmation and starts a fresh challenge', async () => {
  const f = pageFixture({ confirm: async () => { throw { code: 'auth/code-expired' }; } });
  await f.send(); await f.verify();
  assert.match(f.text(), /Code expired/);
  assert.equal(f.calls.verifiers[0].cleared, true);
  assert.equal(f.calls.fetch.length, 0);
  await f.send('+15555550456');
  assert.equal(f.calls.verifiers.length, 2);
  assert.match(f.text(), /Code sent to \+15555550456/);
  assert.equal(f.button('CONFIRM CODE').props.disabled, true);
  f.unmount();
});

for (const code of ['auth/session-expired', 'auth/invalid-verification-id']) {
  test(`${code} returns to a fresh phone challenge without exposing provider details`, async () => {
    const f = pageFixture({ confirm: async () => { throw { code, message: 'private provider payload' }; } });
    await f.send(); await f.verify();
    assert.match(f.text(), /Code expired/);
    assert.doesNotMatch(f.text(), /private provider/);
    assert.ok(f.button('SEND OTP'));
    assert.equal(f.calls.fetch.length, 0);
    f.unmount();
  });
}

test('change number cancels a pending confirmation without letting it unlock a newer send', async () => {
  const oldConfirm = deferred(), newSend = deferred(); let sends = 0;
  const confirmation = { confirm: () => oldConfirm.promise };
  const f = pageFixture({ send: () => ++sends === 1 ? confirmation : newSend.promise });
  await f.send(); f.input('phone-otp', '123456');
  const oldVerify = f.button('CONFIRM CODE').props.onClick();
  f.button('Change number').props.onClick(); f.render();
  f.input('phone-number', '+15555550456');
  const nextSend = f.button('SEND OTP').props.onClick();
  oldConfirm.resolve(credentials()); await oldVerify; f.render();
  assert.equal(f.calls.fetch.length, 0);
  assert.equal(f.calls.setAuth.length, 0);
  assert.equal(f.button('SENDING CODE...').props.disabled, true, 'Old finally must not release a newer operation');
  newSend.resolve(confirmation); await nextSend; f.render();
  assert.match(f.text(), /Code sent to \+15555550456/);
  assert.equal(f.calls.verifiers.length, 2);
  f.unmount();
});

test('unmount during challenge initialization prevents a late SMS request', async () => {
  const gate = deferred();
  const f = pageFixture({ render: () => gate.promise });
  f.input('phone-number', '+15555550123');
  const pending = f.button('SEND OTP').props.onClick();
  f.unmount(); const writes = f.writes.length;
  gate.resolve(0); await pending;
  assert.equal(f.calls.verifiers[0].cleared, true);
  assert.equal(f.calls.send.length, 0);
  assert.equal(f.writes.length, writes);
});

test('unmount during an SMS request ignores its late completion', async () => {
  const gate = deferred();
  const f = pageFixture({ send: () => gate.promise });
  f.input('phone-number', '+15555550123');
  const pending = f.button('SEND OTP').props.onClick();
  await reached(() => f.calls.send.length === 1);
  f.unmount(); const writes = f.writes.length;
  gate.resolve({ confirm: async () => credentials() }); await pending;
  assert.equal(f.writes.length, writes);
  assert.equal(f.calls.verifiers[0].cleared, true);
});

test('unmount while Firebase obtains a token prevents the ATHLIX exchange', async () => {
  const gate = deferred(); let tokenRequested = false;
  const f = pageFixture({ confirm: async () => ({ user: { getIdToken: () => { tokenRequested = true; return gate.promise; } } }) });
  await f.send(); f.input('phone-otp', '123456');
  const pending = f.button('CONFIRM CODE').props.onClick();
  await reached(() => tokenRequested);
  f.unmount(); const writes = f.writes.length;
  gate.resolve('late-token'); await pending;
  assert.equal(f.calls.fetch.length, 0);
  assert.equal(f.writes.length, writes);
});

test('unmount aborts a pending exchange and ignores even a transport that completes afterward', async () => {
  const gate = deferred();
  const f = pageFixture({ fetch: () => gate.promise });
  await f.send(); f.input('phone-otp', '123456');
  const pending = f.button('CONFIRM CODE').props.onClick();
  await reached(() => f.calls.fetch.length === 1);
  f.unmount(); const writes = f.writes.length;
  assert.equal(f.calls.fetch[0].init.signal.aborted, true);
  gate.resolve(response()); await pending;
  assert.equal(f.calls.setAuth.length, 0);
  assert.equal(f.calls.push.length, 0);
  assert.equal(f.writes.length, writes);
});

test('a dispatched exchange keeps its committed cookie and local identity together while response JSON is pending', async () => {
  const body = deferred(); let bodyRequested = false;
  // Model headers committing the HttpOnly cookie before JavaScript receives the
  // response body. Aborting or discarding that body would not undo this cookie.
  let cookie = null;
  const f = pageFixture({ fetch: async () => {
    cookie = 'committed-phone-session';
    return { ok: true, json: () => { bodyRequested = true; return body.promise; } };
  } });
  await f.send(); f.input('phone-otp', '123456');
  const changeBeforeRender = f.button('Change number').props.onClick;
  const pending = f.button('CONFIRM CODE').props.onClick();
  await reached(() => bodyRequested);
  changeBeforeRender(); // Exercise the synchronous guard before disabled renders.
  assert.equal(f.calls.fetch[0].init.signal.aborted, false, 'Changing the number must not abandon an exchange that committed a cookie');
  f.render();
  assert.equal(f.button('Change number').props.disabled, true);
  assert.equal(cookie, 'committed-phone-session');
  assert.equal(f.calls.setAuth.length, 0);
  body.resolve({ user: actor, token: 'committed-session-access' }); await pending; f.render();
  assert.deepEqual(f.calls.setAuth, [[actor, 'committed-session-access']]);
  assert.deepEqual(f.calls.push, ['/dashboard']);
  assert.equal(cookie, 'committed-phone-session');
  assert.equal(Boolean(f.button('Change number').props.disabled), false);
  f.unmount();
});

for (const recovery of ['retry', 'change number']) {
  test(`a failed dispatched exchange releases the change-number guard and allows ${recovery}`, async () => {
    const body = deferred(); let bodyRequested = false, requests = 0;
    const f = pageFixture({ fetch: async () => {
      if (++requests > 1) return response();
      return { ok: false, json: () => { bodyRequested = true; return body.promise; } };
    } });
    await f.send(); f.input('phone-otp', '123456');
    const pending = f.button('CONFIRM CODE').props.onClick();
    await reached(() => bodyRequested); f.render();
    assert.equal(f.button('Change number').props.disabled, true);
    body.resolve({ message: 'fixture temporarily unavailable' }); await pending; f.render();
    assert.match(f.text(), /Sign-in could not be completed/);
    assert.equal(Boolean(f.button('Change number').props.disabled), false);
    assert.equal(f.calls.setAuth.length, 0);
    if (recovery === 'retry') {
      await f.button('COMPLETE SIGN-IN').props.onClick(); f.render();
      assert.equal(f.calls.confirm.length, 1, 'Recovery reuses the already verified identity');
    } else {
      f.button('Change number').props.onClick(); f.render();
      assert.ok(f.button('SEND OTP'));
      await f.send('+15555550456'); await f.verify('654321');
      assert.deepEqual(f.calls.confirm, ['123456', '654321']);
    }
    assert.equal(f.calls.fetch.length, 2);
    assert.equal(f.calls.setAuth.length, 1);
    f.unmount();
  });
}

test('change number stays available while token retrieval is pending before exchange dispatch', async () => {
  const token = deferred(); let tokenRequested = false;
  const f = pageFixture({ confirm: async () => ({ user: { getIdToken: () => { tokenRequested = true; return token.promise; } } }) });
  await f.send(); f.input('phone-otp', '123456');
  const pending = f.button('CONFIRM CODE').props.onClick();
  await reached(() => tokenRequested); f.render();
  assert.equal(Boolean(f.button('Change number').props.disabled), false);
  f.button('Change number').props.onClick(); f.render();
  token.resolve('abandoned-provider-token'); await pending;
  assert.equal(f.calls.fetch.length, 0);
  assert.equal(f.calls.setAuth.length, 0);
  assert.ok(f.button('SEND OTP'));
  f.unmount();
});

test('an unmounted phone attempt waiting for the session lock never dispatches its exchange', async () => {
  let release;
  const f = pageFixture({ lock: run => new Promise(resolve => { release = () => resolve(run()); }) });
  await f.send(); f.input('phone-otp', '123456');
  const pending = f.button('CONFIRM CODE').props.onClick();
  await reached(() => release);
  assert.equal(f.calls.confirm.length, 1);
  assert.equal(f.calls.fetch.length, 0);
  f.unmount(); const writes = f.writes.length;
  release(); await pending;
  assert.equal(f.calls.fetch.length, 0);
  assert.equal(f.calls.setAuth.length, 0);
  assert.equal(f.calls.push.length, 0);
  assert.equal(f.writes.length, writes);
});

test('change number invalidates a queued exchange while preserving a newer queued attempt', async () => {
  const releases = [];
  const f = pageFixture({ lock: run => new Promise(resolve => { releases.push(() => resolve(run())); }) });
  await f.send(); f.input('phone-otp', '123456');
  const oldAttempt = f.button('CONFIRM CODE').props.onClick();
  await reached(() => releases.length === 1);
  f.button('Change number').props.onClick(); f.render();
  await f.send('+15555550456'); f.input('phone-otp', '654321');
  const newAttempt = f.button('CONFIRM CODE').props.onClick();
  await reached(() => releases.length === 2);
  releases[0](); await oldAttempt; f.render();
  assert.equal(f.calls.fetch.length, 0);
  assert.equal(f.button('VERIFYING...').props.disabled, true);
  releases[1](); await newAttempt;
  assert.equal(f.calls.fetch.length, 1);
  assert.equal(f.calls.setAuth.length, 1);
  assert.deepEqual(f.calls.confirm, ['123456', '654321']);
  f.unmount();
});

test('the exchange times out without AbortSignal.any, releases its timer and retries the verified identity', async () => {
  let requests = 0;
  const f = pageFixture({ manualTimers: true, fetch: async (_url, init) => {
    if (++requests > 1) return response();
    return new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(Object.assign(new Error('fixture deadline'), { name: 'AbortError' })), { once: true }));
  } });
  await f.send(); f.input('phone-otp', '123456');
  const pending = f.button('CONFIRM CODE').props.onClick();
  await reached(() => f.calls.fetch.length === 1);
  assert.equal(f.timers.size, 1);
  assert.deepEqual(f.calls.timeouts, [15_000]);
  [...f.timers.values()][0](); await pending; f.render();
  assert.equal(f.calls.fetch[0].init.signal.aborted, true);
  assert.equal(f.timers.size, 0);
  assert.equal(f.calls.setAuth.length, 0);
  await f.button('COMPLETE SIGN-IN').props.onClick();
  assert.equal(f.calls.confirm.length, 1);
  assert.equal(f.calls.fetch.length, 2);
  assert.equal(f.calls.setAuth.length, 1);
  assert.equal(f.timers.size, 0);
  f.unmount();
});
