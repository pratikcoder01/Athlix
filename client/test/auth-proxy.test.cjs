const assert = require('node:assert/strict');
const { test } = require('node:test');
const { authApiOrigin } = require('../src/server/authProxy.ts');

const forbiddenOrigins = ['https://user:password@api.example.test', 'https://api.example.test/path', 'https://api.example.test?key=x',
  'https://api.example.test#fragment', 'http://api.example.test', 'file:///private', '*', '/relative'];

test('auth proxy requires an explicit production upstream and only exact trusted origins', () => {
  assert.throws(() => authApiOrigin({ NODE_ENV: 'production' }), /AUTH_API_ORIGIN/);
  for (const origin of forbiddenOrigins) {
    assert.throws(() => authApiOrigin({ NODE_ENV: 'production', AUTH_API_ORIGIN: origin }));
  }
  assert.equal(authApiOrigin({ NODE_ENV: 'production', AUTH_API_ORIGIN: 'https://api.example.test/' }), 'https://api.example.test');
  assert.equal(authApiOrigin({ NODE_ENV: 'production', AUTH_API_ORIGIN: 'http://127.0.0.1:5000' }), 'http://127.0.0.1:5000');
  assert.equal(authApiOrigin({ NODE_ENV: 'development' }), 'http://127.0.0.1:5000');
});

test('production auth proxy reuses the explicitly configured public API origin', () => {
  assert.equal(authApiOrigin({ NODE_ENV: 'production', NEXT_PUBLIC_API_URL: 'https://api.example.test/' }), 'https://api.example.test');
  assert.equal(authApiOrigin({ NODE_ENV: 'production', AUTH_API_ORIGIN: '  ', NEXT_PUBLIC_API_URL: ' https://api.example.test ' }), 'https://api.example.test');
  for (const origin of forbiddenOrigins) {
    assert.throws(() => authApiOrigin({ NODE_ENV: 'production', NEXT_PUBLIC_API_URL: origin }));
  }
});

test('a dedicated auth origin takes precedence and an invalid override never falls back', () => {
  assert.equal(authApiOrigin({ NODE_ENV: 'production', AUTH_API_ORIGIN: 'https://auth.example.test', NEXT_PUBLIC_API_URL: 'https://api.example.test' }), 'https://auth.example.test');
  assert.equal(authApiOrigin({ NODE_ENV: 'production', AUTH_API_ORIGIN: 'https://auth.example.test', NEXT_PUBLIC_API_URL: '/invalid' }), 'https://auth.example.test');
  for (const origin of forbiddenOrigins) {
    assert.throws(() => authApiOrigin({ NODE_ENV: 'production', AUTH_API_ORIGIN: origin, NEXT_PUBLIC_API_URL: 'https://api.example.test' }));
  }
});

test('missing or blank production configuration never selects an implicit localhost backend', () => {
  for (const configuration of [{}, { AUTH_API_ORIGIN: '', NEXT_PUBLIC_API_URL: ' ' }]) {
    assert.throws(() => authApiOrigin({ NODE_ENV: 'production', ...configuration }), /AUTH_API_ORIGIN or NEXT_PUBLIC_API_URL/);
  }
});
