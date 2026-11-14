const assert = require('node:assert/strict');
const { test, afterEach, mock } = require('node:test');
const mongoose = require('mongoose');
const { User } = require('../dist/models/User.js');
const { CoachProfile } = require('../dist/models/CoachProfile.js');
const { RoleChangeAudit } = require('../dist/models/RoleChangeAudit.js');
const { parseRoleProvisioningArgs, provisionRole } = require('../dist/scripts/provisionRole.js');

afterEach(() => mock.restoreAll());
const options = {
  userId: '507f1f77bcf86cd799439011', role: 'coach', expectedRole: 'athlete',
  operator: 'reviewer@example.test', reason: 'Approved credentials in ticket ATH-123', apply: false,
};
const args = [
  '--user-id', options.userId, '--expected-role', options.expectedRole,
  '--role', options.role, '--operator', options.operator, '--reason', options.reason,
];

test('trusted provisioning defaults to dry run and requires a complete attributable approval', () => {
  assert.deepEqual(parseRoleProvisioningArgs(args), options);
  assert.deepEqual(parseRoleProvisioningArgs([...args, '--apply']), { ...options, apply: true });
  assert.throws(() => parseRoleProvisioningArgs(args.filter((value, index) => index !== 8 && index !== 9)));
  assert.throws(() => parseRoleProvisioningArgs([...args, '--operator', 'duplicate']));
  assert.throws(() => parseRoleProvisioningArgs([...args, '--unknown']));
  assert.throws(() => parseRoleProvisioningArgs([...args, 'toString', 'unexpected']));
  assert.throws(() => parseRoleProvisioningArgs(['--apply']));
});

test('trusted provisioning rejects invalid user, role, expected role and insufficient or multiline approval', async () => {
  const find = mock.method(User, 'findOne', async () => { throw new Error('Invalid options must not query database'); });
  for (const invalid of [
    { userId: { $ne: null } }, { userId: 'not-an-id' }, { role: 'superuser' },
    { expectedRole: 'coach' }, { operator: '' }, { operator: 'operator\nforged' },
    { reason: 'short' }, { reason: 'approval\nforged new line' },
  ]) await assert.rejects(() => provisionRole({ ...options, ...invalid }));
  assert.equal(find.mock.callCount(), 0);
});

test('dry run reads only matching active account and makes no writes or sessions', async () => {
  const find = mock.method(User, 'findOne', async () => ({ _id: options.userId, role: options.expectedRole }));
  const start = mock.method(mongoose, 'startSession', async () => { throw new Error('Dry run must not start a write transaction'); });
  const update = mock.method(User, 'findOneAndUpdate', async () => { throw new Error('Dry run must not mutate'); });
  const result = await provisionRole(options);
  assert.equal(result.applied, false);
  assert.deepEqual(find.mock.calls[0].arguments[0], { _id: options.userId, role: 'athlete', isActive: true });
  assert.equal(start.mock.callCount(), 0);
  assert.equal(update.mock.callCount(), 0);
});

test('provisioning inactive, missing or changed accounts makes no writes', async () => {
  mock.method(User, 'findOne', async () => null);
  const start = mock.method(mongoose, 'startSession', async () => { throw new Error('Unavailable account must not start a write'); });
  await assert.rejects(() => provisionRole({ ...options, apply: true }), /expected role/);
  assert.equal(start.mock.callCount(), 0);
});

function transactionFixture() {
  const session = { withTransaction: mock.fn(async (callback) => callback()), endSession: mock.fn(async () => {}) };
  mock.method(mongoose, 'startSession', async () => session);
  mock.method(User, 'findOne', async () => ({ _id: options.userId, role: options.expectedRole }));
  return session;
}

test('apply scopes role compare-and-set, audit and inactive coach creation to the same transaction', async () => {
  const session = transactionFixture();
  const update = mock.method(User, 'findOneAndUpdate', async () => ({ _id: options.userId, role: 'coach' }));
  const audit = mock.method(RoleChangeAudit, 'create', async () => []);
  const coach = mock.method(CoachProfile, 'updateOne', async () => ({}));
  const result = await provisionRole({ ...options, apply: true });
  assert.equal(result.applied, true);
  assert.equal(session.withTransaction.mock.callCount(), 1);
  assert.deepEqual(update.mock.calls[0].arguments, [
    { _id: options.userId, role: 'athlete', isActive: true },
    { $set: { role: 'coach' } }, { new: true, runValidators: true, session },
  ]);
  assert.deepEqual(audit.mock.calls[0].arguments, [[{
    userId: options.userId, previousRole: 'athlete', nextRole: 'coach', operator: options.operator, reason: options.reason,
  }], { session }]);
  assert.equal(coach.mock.calls[0].arguments[1].$setOnInsert.active, false);
  assert.equal(coach.mock.calls[0].arguments[2].session, session);
  assert.equal(session.endSession.mock.callCount(), 1);
});

test('apply refuses a concurrent role change without writing an audit or provisioning a coach', async () => {
  const session = transactionFixture();
  mock.method(User, 'findOneAndUpdate', async () => null);
  const audit = mock.method(RoleChangeAudit, 'create', async () => []);
  const coach = mock.method(CoachProfile, 'updateOne', async () => ({}));
  await assert.rejects(() => provisionRole({ ...options, apply: true }), /concurrently/);
  assert.equal(audit.mock.callCount(), 0);
  assert.equal(coach.mock.callCount(), 0);
  assert.equal(session.endSession.mock.callCount(), 1);
});

test('audit failure rejects the transaction callback and releases its session', async () => {
  const session = transactionFixture();
  mock.method(User, 'findOneAndUpdate', async () => ({ _id: options.userId, role: 'coach' }));
  mock.method(RoleChangeAudit, 'create', async () => { throw new Error('audit storage unavailable'); });
  const coach = mock.method(CoachProfile, 'updateOne', async () => ({}));
  await assert.rejects(() => provisionRole({ ...options, apply: true }), /audit storage unavailable/);
  assert.equal(coach.mock.callCount(), 0);
  assert.equal(session.endSession.mock.callCount(), 1);
});

test('coach privilege revocation deactivates the coach profile in the audit transaction', async () => {
  const session = transactionFixture();
  mock.method(User, 'findOneAndUpdate', async () => ({ _id: options.userId, role: 'athlete' }));
  mock.method(RoleChangeAudit, 'create', async () => []);
  const coach = mock.method(CoachProfile, 'updateOne', async () => ({}));
  await provisionRole({ ...options, expectedRole: 'coach', role: 'athlete', apply: true });
  assert.deepEqual(coach.mock.calls[0].arguments, [{ userId: options.userId }, { $set: { active: false } }, { session }]);
});
