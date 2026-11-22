const assert = require('node:assert/strict');
const { test } = require('node:test');
const { randomUUID } = require('node:crypto');
const mongoose = require('mongoose');
const { safeLocalMongoUri, safeTestDbName } = require('./helpers/localMongo.cjs');
const { Tournament } = require('../dist/models/Tournament.js');
const handlers = require('../dist/controllers/tournamentDivisionController.js');
const root = require('../dist/controllers/tournamentController.js');

test('real Mongo tournament division races preserve rosters and published seeds', { skip: !process.env.TEST_MONGO_URI && 'NOT RUN: isolated loopback MongoDB required', timeout: 60000 }, async t => {
  const dbName = safeTestDbName(`athlix_booking_test_${randomUUID().replaceAll('-', '')}`);
  await mongoose.connect(safeLocalMongoUri(process.env.TEST_MONGO_URI), { dbName, serverSelectionTimeoutMS: 5000 });
  t.after(async () => { if (mongoose.connection.db?.databaseName === dbName) { safeTestDbName(dbName); await mongoose.connection.dropDatabase(); } await mongoose.disconnect(); });
  const owner = { _id: new mongoose.Types.ObjectId(), role: 'tournament_organizer' };
  const athletes = Array.from({ length: 4 }, () => ({ _id: new mongoose.Types.ObjectId(), role: 'athlete' }));
  const event = await Tournament.create({ title: 'Isolated division event', description: 'Synthetic integration record', date: new Date(Date.now() + 172800000), registrationDeadline: new Date(Date.now() + 86400000), location: 'Test', entryFee: 0, organizerId: owner._id, disciplines: ['Karate'] });
  async function invoke(handler, user, body, key = 'open') {
    const req = { user, body, params: { id: String(event._id), key }, app: { get: () => null } };
    const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
    await handler(req, res, error => { throw error; }); return res;
  }
  await t.test('division configuration persists and foreign organizers cannot change it', async () => {
    const denied = await invoke(handlers.createDivision, { _id: new mongoose.Types.ObjectId(), role: 'tournament_organizer' }, { version: 0, key: 'open', title: 'Open', discipline: 'Karate', capacity: 4 }); assert.equal(denied.code, 403);
    const created = await invoke(handlers.createDivision, owner, { version: 0, key: 'open', title: 'Open', discipline: 'Karate', capacity: 4 }); assert.equal(created.code, 200);
    assert.equal((await Tournament.findById(event._id)).divisions[0].title, 'Open');
  });
  await t.test('same-version concurrent registrations cannot overwrite one another', async () => {
    const results = await Promise.all(athletes.slice(0, 2).map(actor => invoke(handlers.registerForDivision, actor, { version: 1 })));
    assert.deepEqual(results.map(res => res.code).sort(), [200, 409]);
    let stored = await Tournament.findById(event._id); const missing = athletes.slice(0, 2).find(actor => !stored.registrations.some(id => String(id) === String(actor._id)));
    assert.equal((await invoke(handlers.registerForDivision, missing, { version: stored.__v })).code, 200);
    stored = await Tournament.findById(event._id);
    assert.equal(stored.registrations.length, 2); assert.deepEqual(stored.divisions[0].registrations.map(String).sort(), stored.registrations.map(String).sort());
  });
  await t.test('duplicate across event and nondivision registration cannot corrupt division mode', async () => {
    const stored = await Tournament.findById(event._id);
    assert.equal((await invoke(handlers.registerForDivision, athletes[0], { version: stored.__v })).code, 409);
    assert.equal((await invoke(root.registerForTournament, athletes[2], {})).code, 409);
  });
  await t.test('withdrawal versus publication is serialized without stale participants', async () => {
    let stored = await Tournament.findById(event._id);
    const results = await Promise.all([invoke(handlers.generateDivisionBrackets, owner, { version: stored.__v }), invoke(handlers.withdrawFromTournament, athletes[0], { version: stored.__v })]);
    assert.deepEqual(results.map(res => res.code).sort(), [200, 409]);
    stored = await Tournament.findById(event._id);
    if (!stored.divisions[0].brackets?.rounds?.length) {
      assert.equal(stored.registrations.length, 1);
      assert.equal((await invoke(handlers.registerForDivision, athletes[0], { version: stored.__v })).code, 200);
      stored = await Tournament.findById(event._id);
      assert.equal((await invoke(handlers.generateDivisionBrackets, owner, { version: stored.__v })).code, 200);
    }
    stored = await Tournament.findById(event._id);
    assert.deepEqual(stored.divisions[0].brackets.seeds.map(seed => String(seed.fighterId)).sort(), stored.registrations.map(String).sort());
    assert.equal((await invoke(handlers.withdrawFromTournament, athletes[0], { version: stored.__v })).code, 409);
    assert.equal((await invoke(handlers.registerForDivision, athletes[2], { version: stored.__v })).code, 409);
  });
  await t.test('parent and division lifecycle persist genuine final results', async () => {
    let stored = await Tournament.findById(event._id);
    assert.equal((await invoke(root.updateTournamentBrackets, owner, { version: stored.__v, status: 'ongoing' })).code, 200);
    stored = await Tournament.findById(event._id);
    assert.equal((await invoke(handlers.updateDivisionBrackets, owner, { version: stored.__v, status: 'ongoing' })).code, 200);
    stored = await Tournament.findById(event._id);
    const brackets = JSON.parse(JSON.stringify(stored.divisions[0].brackets));
    const clean = { seeds: brackets.seeds.map(({ fighterId, seed, rationale }) => ({ fighterId, seed, rationale })), rounds: brackets.rounds.map(({ round, matches }) => ({ round, matches: matches.map(({ p1, p2, score, winner }) => ({ p1, p2, score, winner })) })) };
    clean.rounds[0].matches[0].winner = clean.rounds[0].matches[0].p1;
    assert.equal((await invoke(handlers.updateDivisionBrackets, owner, { version: stored.__v, brackets: clean, status: 'completed' })).code, 200);
    stored = await Tournament.findById(event._id);
    assert.equal((await invoke(root.updateTournamentBrackets, owner, { version: stored.__v, status: 'completed' })).code, 200);
    assert.equal((await Tournament.findById(event._id)).status, 'completed');
  });
  await t.test('zero/one-entrant division cancellation preserves another published bracket and saves a bounded notice', async () => {
    const cancellationEvent = await Tournament.create({ title: 'Isolated cancellation event', description: 'Synthetic underfilled-division fixture',
      date: new Date(Date.now() + 172800000), registrationDeadline: new Date(Date.now() + 86400000), location: 'Test', entryFee: 0,
      organizerId: owner._id, disciplines: ['Karate'] });
    async function call(handler, actor, body, key = 'main') {
      const req = { user: actor, body, params: { id: String(cancellationEvent._id), key }, app: { get: () => null } };
      const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
      await handler(req, res, error => { throw error; }); return res;
    }
    const version = async () => (await Tournament.findById(cancellationEvent._id)).__v;
    for (const key of ['main', 'empty', 'underfilled']) {
      assert.equal((await call(handlers.createDivision, owner, { version: await version(), key, title: key, discipline: 'Karate', capacity: 4 })).code, 200);
    }
    assert.equal((await call(handlers.cancelDivision, owner, { version: await version(), reason: 'No entrants; division cancelled before publication.' }, 'empty')).code, 200);
    for (const actor of athletes.slice(0, 2)) assert.equal((await call(handlers.registerForDivision, actor, { version: await version() })).code, 200);
    assert.equal((await call(handlers.registerForDivision, athletes[2], { version: await version() }, 'underfilled')).code, 200);
    assert.equal((await call(handlers.generateDivisionBrackets, owner, { version: await version() })).code, 200);
    const published = (await Tournament.findById(cancellationEvent._id)).divisions.find(item => item.key === 'main').brackets.toObject();
    const before = await version();
    const cancelled = await call(handlers.cancelDivision, owner, { version: before, reason: 'One entrant; organizer will arrange alternatives directly.' }, 'underfilled');
    assert.equal(cancelled.code, 200);
    const stored = await Tournament.findById(cancellationEvent._id);
    assert.equal(stored.divisions.length, 1); assert.equal(stored.divisions[0].key, 'main'); assert.equal(stored.registrations.length, 2);
    assert.equal(stored.registrations.some(id => String(id) === String(athletes[2]._id)), false);
    assert.deepEqual(stored.divisions[0].brackets.toObject(), published);
    assert.deepEqual(stored.divisionCancellations.map(item => item.key), ['empty', 'underfilled']);
    for (const notice of stored.divisionCancellations) {
      assert.equal(String(notice.cancelledBy), String(owner._id)); assert.ok(notice.cancelledAt instanceof Date);
      assert.deepEqual(Object.keys(notice.toObject()).sort(), ['cancelledAt', 'cancelledBy', 'key', 'reason', 'title']);
    }
    assert.equal((await call(handlers.cancelDivision, owner, { version: before, reason: 'A stale cancellation must not change anything.' }, 'main')).code, 409);
    assert.equal((await call(root.updateTournamentBrackets, owner, { version: await version(), status: 'ongoing' })).code, 200);
  });
});
