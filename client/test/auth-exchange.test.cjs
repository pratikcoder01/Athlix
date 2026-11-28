const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { test } = require('node:test');
const React = require('react');
const ts = require('typescript');

const user = { id: '507f1f77bcf86cd799439011', name: 'Fixture athlete', email: 'fixture@example.test', role: 'athlete' };
const fields = { name: 'Fixture athlete', email: 'fixture@example.test', password: 'fixture-test-password' };

async function reached(predicate) {
  for (let attempt = 0; attempt < 20; attempt++) {
    if (predicate()) return;
    await new Promise(setImmediate);
  }
  assert.fail('Expected asynchronous boundary was not reached');
}

function authPage(kind, options = {}) {
  const filename = path.resolve(__dirname, `../src/app/(auth)/${kind}/page.tsx`);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: filename,
  }).outputText;
  const dependencyRequire = createRequire(filename), stub = () => null;
  const calls = { provider: [], locks: 0, deadlines: [], fetch: [], auth: [], push: [], errors: [] };
  let held = false, release;
  const lockGate = new Promise(resolve => { release = resolve; });
  const credentials = { user: { getIdToken: async () => { assert.equal(held, false, 'Firebase token retrieval must remain outside the cookie lock'); return 'fixture-id-token'; } } };
  const provider = name => async () => {
    assert.equal(held, false, 'A slow Firebase operation must never block cookie renewal/logout');
    calls.provider.push(name);
    return options.provider ? options.provider() : credentials;
  };
  const exports = {};
  const context = vm.createContext({
    exports,
    AbortSignal: { timeout: duration => { calls.deadlines.push(duration); return AbortSignal.timeout(duration); } },
    fetch: async (url, init) => {
      assert.equal(held, true, 'Cookie writes must be inside the shared session lock');
      calls.fetch.push({ url, init, body: JSON.parse(init.body) });
      return { ok: options.ok !== false, json: async () => {
        assert.equal(held, true, 'The lock must cover response parsing');
        return options.payload || { user, token: 'fixture-athlix-token' };
      } };
    },
    require: name => {
      if (name === 'react') return { ...React, useState: initial => [initial, value => calls.errors.push(value)] };
      if (name === 'next/link') return stub;
      if (name === 'next/navigation') return { useRouter: () => ({ push: target => { assert.equal(held, true); calls.push.push(target); } }) };
      if (name === 'react-hook-form') return { useForm: () => ({ register: () => ({}), handleSubmit: callback => callback, formState: { errors: {}, isSubmitting: false } }) };
      if (name === '@hookform/resolvers/zod') return { zodResolver: () => stub };
      if (name === 'framer-motion') return { motion: new Proxy({}, { get: () => stub }) };
      if (name === 'lucide-react') return new Proxy({}, { get: () => stub });
      if (name.endsWith('/lib/firebase')) return { auth: {} };
      if (name.endsWith('/lib/authSession')) return { withSessionLock: async run => {
        calls.locks++;
        await lockGate;
        held = true;
        try { return await run(); } finally { held = false; }
      } };
      if (name.endsWith('/store/authStore')) return { useAuthStore: () => ({ setAuth: (...args) => {
        assert.equal(held, true, 'Explicit sign-in must commit before releasing the cookie lock'); calls.auth.push(args);
      } }) };
      if (name === 'firebase/auth') return {
        GoogleAuthProvider: class {},
        signInWithPopup: provider('google'), signInAnonymously: provider('guest'),
        signInWithEmailAndPassword: provider('email'), createUserWithEmailAndPassword: provider('email'),
        updateProfile: async () => { assert.equal(held, false); calls.provider.push('profile'); },
      };
      return dependencyRequire(name);
    },
  });
  new vm.Script(compiled, { filename }).runInContext(context);
  const tree = exports.default();
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
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(text).join('');
    return node && typeof node === 'object' ? text(node.props?.children) : '';
  }
  return { calls, release, credentials, invoke(method) {
    const node = method === 'email' ? walk(tree, item => typeof item.props?.onSubmit === 'function')
      : walk(tree, item => typeof item.props?.onClick === 'function' && text(item).includes(method === 'google' ? 'Google' : 'Guest'));
    assert.ok(node, `Expected ${kind} ${method} handler`);
    return method === 'email' ? node.props.onSubmit(fields) : node.props.onClick();
  } };
}

for (const kind of ['login', 'signup']) {
  for (const method of ['email', 'google', 'guest']) {
    test(`${kind} ${method} performs Firebase work before locking, then serializes the complete server exchange`, async () => {
      const f = authPage(kind);
      const pending = f.invoke(method);
      await reached(() => f.calls.locks === 1);
      assert.equal(f.calls.provider[0], method);
      assert.equal(f.calls.fetch.length, 0, 'An exchange queued behind logout/renewal must not write the cookie early');
      assert.equal(f.calls.auth.length, 0);
      f.release(); await pending;
      assert.equal(f.calls.fetch.length, 1);
      const request = f.calls.fetch[0];
      assert.equal(request.url, '/api/auth/firebase');
      assert.equal(request.init.credentials, 'include');
      assert.ok(request.init.signal instanceof AbortSignal);
      assert.deepEqual(f.calls.deadlines, [15_000]);
      assert.deepEqual(request.body, { idToken: 'fixture-id-token',
        ...(method === 'guest' ? { name: 'Anonymous Athlete' } : kind === 'signup' && method === 'email' ? { name: fields.name } : {}) });
      assert.deepEqual(f.calls.auth, [[user, 'fixture-athlix-token']]);
      assert.deepEqual(f.calls.push, ['/dashboard']);
    });
  }
}

test('a Firebase popup still waiting for the user does not acquire the session lock', async () => {
  let complete;
  const f = authPage('login', { provider: () => new Promise(resolve => { complete = resolve; }) });
  const pending = f.invoke('google');
  assert.equal(f.calls.provider.length, 1);
  assert.equal(f.calls.locks, 0);
  complete(f.credentials); await reached(() => f.calls.locks === 1);
  f.release(); await pending;
  assert.equal(f.calls.auth.length, 1);
});

test('rejected server exchanges preserve existing form errors and never commit an identity', async () => {
  const f = authPage('signup', { ok: false, payload: { message: 'Fixture registration rejected' } });
  const pending = f.invoke('email');
  await reached(() => f.calls.locks === 1); f.release(); await pending;
  assert.ok(f.calls.errors.includes('Fixture registration rejected'));
  assert.equal(f.calls.auth.length, 0);
  assert.equal(f.calls.push.length, 0);
});
