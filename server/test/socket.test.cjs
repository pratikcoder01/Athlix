const assert = require('node:assert/strict');
const { once } = require('node:events');
const http = require('node:http');
const { test } = require('node:test');
const jwt = require('jsonwebtoken');
const { io: connect } = require('socket.io-client');
const { createRealtimeServer } = require('../dist/socket');
const { createOriginPolicy } = require('../dist/config/cors');

const secret = 'test-socket-secret-used-only-in-automated-tests';
const aliceId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const bobId = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const tournamentId = 'cccccccccccccccccccccccc';
const tokenFor = (id, options = {}) => jwt.sign({ id }, secret, { expiresIn: '5m', ...options });

async function fixture(t, options = {}) {
  const accounts = new Map([
    [aliceId, { id: aliceId, isActive: true }],
    [bobId, { id: bobId, isActive: true }],
  ]);
  const server = http.createServer();
  const io = createRealtimeServer(server, {
    getSecret: () => secret,
    findAccount: async (id) => accounts.get(id) || null,
    tournamentExists: async (id) => id === tournamentId,
    environment: { NODE_ENV: 'production', ALLOWED_ORIGIN: 'https://athlix.example' },
    ...options,
  });
  const clients = [];
  t.after(async () => {
    for (const client of clients) client.disconnect();
    await new Promise((resolve) => io.close(resolve));
    if (server.listening) await new Promise((resolve) => server.close(resolve));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}`;

  const open = (token, overrides = {}) => {
    const client = connect(url, {
      auth: { token },
      transports: ['websocket'],
      reconnection: false,
      forceNew: true,
      timeout: 2000,
      ...overrides,
    });
    clients.push(client);
    return client;
  };
  return { io, accounts, open };
}

async function connected(client) {
  await once(client, 'connect', { signal: AbortSignal.timeout(4000) });
  return client;
}

const subscribe = (client, id) => new Promise((resolve, reject) => {
  client.timeout(2000).emit('join_tournament_room', id, (error, result) => {
    if (error) reject(error); else resolve(result);
  });
});

test('CORS defaults to local clients and production requires explicit trusted origins', () => {
  const development = createOriginPolicy({ NODE_ENV: 'development' });
  assert.equal(development.isAllowed('http://localhost:3000'), true);
  assert.equal(development.isAllowed('http://127.0.0.1:3000'), true);
  assert.equal(development.isAllowed('https://attacker.example'), false);
  assert.equal(development.isAllowed('null'), false);
  assert.equal(development.isAllowed(undefined), true);
  assert.throws(() => createOriginPolicy({ NODE_ENV: 'production' }), /ALLOWED_ORIGIN/);
  for (const origin of ['*', 'null', 'https://athlix.example/path', 'https://user:pass@athlix.example', 'https://athlix.example?x=1']) {
    assert.throws(() => createOriginPolicy({ ALLOWED_ORIGIN: origin }), /ALLOWED_ORIGIN/);
  }
  const production = createOriginPolicy({ NODE_ENV: 'production', ALLOWED_ORIGIN: 'https://athlix.example/, https://www.athlix.example' });
  assert.equal(production.isAllowed('https://athlix.example'), true);
  assert.equal(production.isAllowed('https://athlix.example.evil.test'), false);
  assert.equal(production.isAllowed('http://athlix.example'), false);
});

test('handshake rejects missing, forged, expired, wrong-algorithm, unbounded and malformed JWTs', async (t) => {
  const { open } = await fixture(t);
  const invalidTokens = [
    undefined,
    '',
    'not-a-token',
    'x'.repeat(8193),
    { id: aliceId },
    jwt.sign({ id: aliceId }, 'attacker-secret', { expiresIn: '5m' }),
    tokenFor(aliceId, { expiresIn: -1 }),
    tokenFor(aliceId, { algorithm: 'HS384' }),
    jwt.sign({ id: aliceId }, secret),
    tokenFor('not-an-object-id'),
    tokenFor({ $ne: null }),
  ];
  for (const token of invalidTokens) {
    const client = open(token);
    const [error] = await once(client, 'connect_error', { signal: AbortSignal.timeout(4000) });
    assert.equal(error.message, 'Not authorized');
    assert.equal(client.connected, false);
    client.disconnect();
  }
});

test('handshake rejects deleted/disabled users and masks persistence failures', async (t) => {
  const { open, accounts } = await fixture(t);
  accounts.delete(bobId);
  accounts.set(aliceId, { id: aliceId, isActive: false });
  for (const id of [aliceId, bobId]) {
    const client = open(tokenFor(id));
    const [error] = await once(client, 'connect_error', { signal: AbortSignal.timeout(4000) });
    assert.equal(error.message, 'Not authorized');
  }
  const failed = await fixture(t, { findAccount: async () => { throw new Error('database credentials'); } });
  const [error] = await once(failed.open(tokenFor(aliceId)), 'connect_error', { signal: AbortSignal.timeout(4000) });
  assert.equal(error.message, 'Not authorized');
});

test('personal room identity comes from the JWT; cross-account notifications remain inaccessible', async (t) => {
  const { io, open } = await fixture(t);
  const alice = await connected(open(tokenFor(aliceId)));
  const bob = await connected(open(tokenFor(bobId)));
  const aliceNotifications = [];
  alice.on('notification', (message) => aliceNotifications.push(message));

  alice.emit('join_user_room', bobId);
  // This acknowledgement is an event-order barrier after the malicious emit.
  assert.equal((await subscribe(alice, tournamentId)).success, true);
  const serverAlice = io.sockets.sockets.get(alice.id);
  assert.equal(serverAlice.rooms.has(aliceId), true);
  assert.equal(serverAlice.rooms.has(bobId), false);

  const bobNotification = once(bob, 'notification', { signal: AbortSignal.timeout(2000) });
  io.to(bobId).emit('notification', 'bob-private');
  assert.deepEqual(await bobNotification, ['bob-private']);
  const aliceNotification = once(alice, 'notification', { signal: AbortSignal.timeout(2000) });
  io.to(aliceId).emit('notification', 'alice-private');
  await aliceNotification;
  assert.deepEqual(aliceNotifications, ['alice-private']);
});

test('tournament subscriptions validate IDs/existence and match authenticated REST read access', async (t) => {
  const { io, open } = await fixture(t);
  const alice = await connected(open(tokenFor(aliceId)));
  for (const id of ['tournament_1', aliceId, { $ne: null }, null]) {
    assert.equal((await subscribe(alice, id)).success, false);
  }
  assert.equal((await subscribe(alice, tournamentId)).success, true);
  const bracketUpdate = once(alice, 'bracket_update', { signal: AbortSignal.timeout(2000) });
  io.to(`tournament_${tournamentId}`).emit('bracket_update', { tournamentId });
  assert.deepEqual(await bracketUpdate, [{ tournamentId }]);
  alice.emit('leave_tournament_room', tournamentId);
  await subscribe(alice, 'invalid-event-order-barrier');
  assert.equal(io.sockets.sockets.get(alice.id).rooms.has(`tournament_${tournamentId}`), false);
});

test('account disabling revokes subsequent subscriptions and disconnects the client', async (t) => {
  const { open, accounts } = await fixture(t);
  const alice = await connected(open(tokenFor(aliceId)));
  accounts.set(aliceId, { id: aliceId, isActive: false });
  const disconnected = once(alice, 'disconnect', { signal: AbortSignal.timeout(2000) });
  assert.equal((await subscribe(alice, tournamentId)).success, false);
  await disconnected;
  assert.equal(alice.connected, false);
});

test('existing connections disconnect when their JWT expires', async (t) => {
  const { open } = await fixture(t);
  const token = jwt.sign({ id: aliceId, exp: Math.floor(Date.now() / 1000) + 2 }, secret);
  const alice = await connected(open(token));
  await once(alice, 'disconnect', { signal: AbortSignal.timeout(4000) });
  assert.equal(alice.connected, false);
});

test('untrusted browser origins cannot connect over polling or WebSocket', async (t) => {
  const { open } = await fixture(t);
  for (const transport of ['polling', 'websocket']) {
    const rejected = open(tokenFor(aliceId), {
      transports: [transport],
      extraHeaders: { Origin: 'https://attacker.example' },
    });
    await once(rejected, 'connect_error', { signal: AbortSignal.timeout(4000) });
    assert.equal(rejected.connected, false);
    const accepted = await connected(open(tokenFor(aliceId), {
      transports: [transport],
      extraHeaders: { Origin: 'https://athlix.example' },
    }));
    assert.equal(accepted.connected, true);
  }
});

test('tournament room fanout and subscription attempts are bounded per connection', async (t) => {
  const { open, io } = await fixture(t, { tournamentExists: async () => true });
  const alice = await connected(open(tokenFor(aliceId)));
  for (let i = 0; i < 10; i++) {
    const id = i.toString(16).padStart(24, '0');
    assert.equal((await subscribe(alice, id)).success, true);
  }
  assert.equal((await subscribe(alice, tournamentId)).success, false);
  assert.equal(io.sockets.sockets.get(alice.id).rooms.size, 12);
  const bob = await connected(open(tokenFor(bobId)));
  for (let i = 0; i < 20; i++) await subscribe(bob, 'invalid');
  assert.equal((await subscribe(bob, tournamentId)).message, 'Too many tournament subscriptions');
});

test('concurrent tournament joins cannot race past subscription capacity', async (t) => {
  const { open, io } = await fixture(t, { tournamentExists: async () => true });
  const alice = await connected(open(tokenFor(aliceId)));
  const results = await Promise.all(Array.from({ length: 20 }, (_, index) =>
    subscribe(alice, index.toString(16).padStart(24, '0'))));
  assert.equal(results.filter((result) => result.success).length, 10);
  assert.equal(io.sockets.sockets.get(alice.id).rooms.size, 12);
});
