const assert = require('node:assert/strict');
const { test } = require('node:test');
const { Tournament } = require('../dist/models/Tournament');
const { Academy } = require('../dist/models/Academy');
const { getAcademyAnalytics } = require('../dist/controllers/analyticsController');

const ownerId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const record = { _id: 'bbbbbbbbbbbbbbbbbbbbbbbb', title: 'Club pilot', date: '2027-01-10', registrations: ['athlete-1', 'athlete-2'], status: 'upcoming' };
function response() {
  return { code: 200, body: null, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
}

test('analytics rejects unauthenticated and non-professional users before database access', async () => {
  for (const [user, status] of [[undefined, 401], [{ _id: ownerId, role: 'athlete' }, 403], [{ _id: ownerId, role: 'coach' }, 403]]) {
    const res = response();
    await getAcademyAnalytics({ user }, res, (error) => { throw error; });
    assert.equal(res.code, status);
    assert.equal(res.body.success, false);
  }
});

test('professional analytics filters every query to resources owned by the current account', async (t) => {
  const queries = [];
  t.mock.method(Academy, 'countDocuments', async (filter) => { queries.push(['academy', filter]); return 1; });
  t.mock.method(Tournament, 'countDocuments', async (filter) => { queries.push(['count', filter]); return 101; });
  t.mock.method(Tournament, 'find', (filter) => {
    queries.push(['events', filter]);
    return {
      select(fields) { assert.equal(fields, 'title date registrations status'); return this; },
      sort(order) { assert.deepEqual(order, { date: -1, _id: -1 }); return this; },
      limit(limit) { assert.equal(limit, 100); return this; },
      lean: async () => [record],
    };
  });
  for (const role of ['tournament_organizer', 'academy_owner']) {
    queries.length = 0;
    const res = response();
    await getAcademyAnalytics({ user: { _id: ownerId, role } }, res, (error) => { throw error; });
    assert.equal(res.code, 200);
    assert.deepEqual(queries, [['academy', { ownerId }], ['count', { organizerId: ownerId }], ['events', { organizerId: ownerId }]]);
    assert.equal(res.body.analytics.scope, 'account');
    assert.equal(res.body.analytics.totalTournaments, 101);
    assert.equal(res.body.analytics.registrationsShown, 2);
    assert.equal(res.body.analytics.paymentsAvailable, false);
    assert.equal(res.body.analytics.limit, 100);
    assert.deepEqual(res.body.analytics.tournaments[0], { id: record._id, title: record.title, date: record.date, registrationsCount: 2, status: record.status });
    for (const key of ['totalRevenue', 'bookingRevenue', 'tournamentRevenue', 'averageFillRate']) assert.equal(key in res.body.analytics, false);
  }
});

test('only administrators receive platform scope and empty counts are accurate', async (t) => {
  t.mock.method(Academy, 'countDocuments', async (filter) => { assert.deepEqual(filter, {}); return 0; });
  t.mock.method(Tournament, 'countDocuments', async (filter) => { assert.deepEqual(filter, {}); return 0; });
  t.mock.method(Tournament, 'find', (filter) => {
    assert.deepEqual(filter, {});
    return { select() { return this; }, sort() { return this; }, limit() { return this; }, lean: async () => [] };
  });
  const res = response();
  await getAcademyAnalytics({ user: { _id: ownerId, role: 'admin' } }, res, (error) => { throw error; });
  assert.equal(res.body.analytics.scope, 'platform');
  assert.equal(res.body.analytics.totalAcademies, 0);
  assert.equal(res.body.analytics.totalTournaments, 0);
  assert.equal(res.body.analytics.registrationsShown, 0);
});

test('persistence errors reach the central error handler instead of reporting success', async (t) => {
  const failure = new Error('database unavailable');
  t.mock.method(Academy, 'countDocuments', async () => { throw failure; });
  t.mock.method(Tournament, 'countDocuments', async () => 0);
  t.mock.method(Tournament, 'find', () => ({ select() { return this; }, sort() { return this; }, limit() { return this; }, lean: async () => [] }));
  const res = response();
  let received;
  await getAcademyAnalytics({ user: { _id: ownerId, role: 'admin' } }, res, (error) => { received = error; });
  assert.equal(received, failure);
  assert.equal(res.body, null);
});
