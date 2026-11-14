const assert = require('node:assert/strict');
const { test } = require('node:test');
const { authApiOrigin } = require('../src/server/authProxy.ts');

test('auth proxy requires an explicit production upstream and only exact trusted origins', () => {
  assert.throws(() => authApiOrigin({ NODE_ENV: 'production' }), /AUTH_API_ORIGIN/);
  for (const origin of ['https://user:password@api.example.test', 'https://api.example.test/path', 'https://api.example.test?key=x',
    'https://api.example.test#fragment', 'http://api.example.test', 'file:///private', '*', '/relative']) {
    assert.throws(() => authApiOrigin({ NODE_ENV: 'production', AUTH_API_ORIGIN: origin }));
  }
  assert.equal(authApiOrigin({ NODE_ENV: 'production', AUTH_API_ORIGIN: 'https://api.example.test/' }), 'https://api.example.test');
  assert.equal(authApiOrigin({ NODE_ENV: 'production', AUTH_API_ORIGIN: 'http://127.0.0.1:5000' }), 'http://127.0.0.1:5000');
  assert.equal(authApiOrigin({ NODE_ENV: 'development' }), 'http://127.0.0.1:5000');
});
