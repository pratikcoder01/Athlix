const assert = require('node:assert/strict');
const { test } = require('node:test');
const { resetActionCode, passwordResetError } = require('../src/lib/passwordReset.ts');

test('only single, valid Firebase password reset actions are accepted', () => {
  assert.equal(resetActionCode('?mode=resetPassword&oobCode=one-time-code'), 'one-time-code');
  for (const query of ['', '?mode=verifyEmail&oobCode=x', '?mode=resetPassword', '?oobCode=x',
    '?mode=resetPassword&mode=verifyEmail&oobCode=x', '?mode=resetPassword&oobCode=x&oobCode=y',
    '?mode=resetPassword&oobCode=bad%20code', `?mode=resetPassword&oobCode=${'x'.repeat(4097)}`]) {
    assert.equal(resetActionCode(query), null);
  }
});
test('untrusted continuation URLs never become a redirect target', () => {
  assert.equal(resetActionCode('?mode=resetPassword&oobCode=valid&continueUrl=https://attacker.example'), 'valid');
});
test('expired, consumed, network and password failures have actionable safe messages', () => {
  assert.match(passwordResetError({ code: 'auth/expired-action-code' }), /expired/);
  assert.match(passwordResetError({ code: 'auth/invalid-action-code' }), /already been used/);
  assert.match(passwordResetError({ code: 'auth/network-request-failed' }), /Connection failed/);
  assert.match(passwordResetError({ code: 'auth/weak-password' }), /stronger/);
  assert.doesNotMatch(passwordResetError({ message: 'sensitive provider debug payload' }), /sensitive/);
});
