const assert = require('node:assert/strict');
const { test, afterEach, mock } = require('node:test');
const { Types } = require('mongoose');
const { Tournament } = require('../dist/models/Tournament.js');
const policy = require('../dist/utils/tournamentPolicy.js');
const handlers = require('../dist/controllers/tournamentDivisionController.js');
const eventHandlers = require('../dist/controllers/tournamentController.js');
const id = number => number.toString(16).padStart(24, '0');
const owner = new Types.ObjectId(id(1)), athlete = new Types.ObjectId(id(2));
const division = (fields = {}) => ({ key: 'open', title: 'Open division', discipline: 'Karate', eligibilityNotes: 'Organizer reviews eligibility.', capacity: 4, registrations: [id(3), id(4)], status: 'upcoming', ...fields });
const event = (fields = {}) => ({ _id: id(10), organizerId: owner, status: 'upcoming', disciplines: ['Karate'], registrationDeadline: new Date(Date.now() + 86400000), registrations: [id(3), id(4)], divisions: [division()], get: () => 7, ...fields });
const invoke = async (handler, { body = { version: 7 }, user = { _id: owner, role: 'tournament_organizer' }, params = { id: id(10), key: 'open' } } = {}) => {
  const emit = mock.fn();
  const req = { body, user, params, app: { get: () => ({ to: () => ({ emit }) }) } };
  const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  await handler(req, res, error => { throw error; }); return { res, emit };
};
afterEach(() => mock.restoreAll());

test('owner can cancel an underfilled unpublished division without changing another published bracket', async () => {
  const published = division({ key: 'advanced', brackets: policy.generateSingleElimination([id(3), id(4)]) });
  mock.method(Tournament, 'findById', async () => event({ registrations: [id(3), id(4), athlete], divisions: [published, division({ registrations: [athlete] })] }));
  const write = mock.method(Tournament, 'findOneAndUpdate', async () => event());
  const { res } = await invoke(handlers.cancelDivision, { body: { version: 7, reason: 'Too few entrants; contact organizer for options.' } });
  assert.equal(res.code, 200);
  const fields = write.mock.calls[0].arguments[1].$set;
  assert.deepEqual(fields.registrations.map(String), [id(3), id(4)]); assert.equal(fields.divisions.length, 1);
  assert.deepEqual(fields.divisions[0].brackets, published.brackets);
  assert.equal(fields.divisionCancellations[0].cancelledBy, owner); assert.equal(fields.divisionCancellations[0].key, 'open');
});
test('division cancellation rejects foreign organizer, stale version and published or started division', async () => {
  const find = mock.method(Tournament, 'findById', async () => event()); const write = mock.method(Tournament, 'findOneAndUpdate', async () => { throw Error('No invalid cancellation'); });
  const body = { version: 7, reason: 'Insufficient entrants' };
  assert.equal((await invoke(handlers.cancelDivision, { body, user: { _id: athlete, role: 'tournament_organizer' } })).res.code, 403);
  assert.equal((await invoke(handlers.cancelDivision, { body: { ...body, version: 6 } })).res.code, 409);
  find.mock.mockImplementation(async () => event({ divisions: [division({ brackets: policy.generateSingleElimination([id(3), id(4)]) })] }));
  assert.equal((await invoke(handlers.cancelDivision, { body })).res.code, 409);
  find.mock.mockImplementation(async () => event({ status: 'ongoing' }));
  assert.equal((await invoke(handlers.cancelDivision, { body })).res.code, 409);
  assert.equal(write.mock.callCount(), 0);
});

test('division validation bounds capacity, keys, text and injected controls', () => {
  const valid = { version: 7, key: 'adult-open', title: 'Adult open', discipline: 'Karate', capacity: 64 };
  assert.equal(policy.divisionCreateSchema.safeParse(valid).success, true);
  for (const change of [{ key: '../open' }, { key: 'UPPER' }, { capacity: 1 }, { capacity: 257 }, { capacity: 2.5 }, { organizerId: id(20) }, { eligibilityNotes: 'x'.repeat(1001) }]) assert.equal(policy.divisionCreateSchema.safeParse({ ...valid, ...change }).success, false);
});
for (const role of ['athlete', 'coach', 'academy_owner', 'tournament_organizer']) test(`foreign ${role} cannot configure/generate/update divisions`, async () => {
  mock.method(Tournament, 'findById', async () => event()); const write = mock.method(Tournament, 'findOneAndUpdate', async () => { throw Error('Unauthorized write'); });
  for (const [handler, body] of [[handlers.createDivision, { version: 7, key: 'another', title: 'Another', discipline: 'Karate' }], [handlers.generateDivisionBrackets, { version: 7 }], [handlers.updateDivisionBrackets, { version: 7, status: 'ongoing' }]]) {
    const { res } = await invoke(handler, { user: { _id: new Types.ObjectId(id(9)), role }, body }); assert.equal(res.code, 403);
  }
  assert.equal(write.mock.callCount(), 0);
});
test('division creation requires an empty upcoming event and unique bounded keys', async () => {
  const write = mock.method(Tournament, 'findOneAndUpdate', async () => event());
  const find = mock.method(Tournament, 'findById', async () => event({ registrations: [] }));
  let result = await invoke(handlers.createDivision, { body: { version: 7, key: 'beginner', title: 'Beginner', discipline: 'Karate' } });
  assert.equal(result.res.code, 200); const [filter, update] = write.mock.calls[0].arguments;
  assert.equal(filter.__v, 7); assert.equal(filter.organizerId, owner); assert.equal(update.$set.divisions[1].status, 'upcoming');
  find.mock.mockImplementation(async () => event());
  result = await invoke(handlers.createDivision, { body: { version: 7, key: 'beginner', title: 'Beginner', discipline: 'Karate' } }); assert.equal(result.res.code, 409);
  find.mock.mockImplementation(async () => event({ registrations: [] }));
  result = await invoke(handlers.createDivision, { body: { version: 7, key: 'open', title: 'Duplicate', discipline: 'Karate' } }); assert.equal(result.res.code, 409);
  result = await invoke(handlers.createDivision, { body: { version: 7, key: 'judo', title: 'Judo', discipline: 'Judo' } }); assert.equal(result.res.code, 400);
  assert.equal(write.mock.callCount(), 1);
});
test('athlete division registration updates parent and selected roster with one versioned write', async () => {
  mock.method(Tournament, 'findById', async () => event()); const write = mock.method(Tournament, 'findOneAndUpdate', async () => event());
  const { res } = await invoke(handlers.registerForDivision, { user: { _id: athlete, role: 'athlete' } }); assert.equal(res.code, 200);
  const [filter, update, options] = write.mock.calls[0].arguments;
  assert.equal(filter.__v, 7); assert.deepEqual(update.$inc, { __v: 1 }); assert.equal(options.runValidators, true);
  assert.ok(update.$set.registrations.some(value => String(value) === String(athlete)));
  assert.ok(update.$set.divisions[0].registrations.some(value => String(value) === String(athlete)));
});
for (const [label, change] of [
  ['duplicate across divisions', { registrations: [athlete] }], ['full division', { divisions: [division({ capacity: 2 })] }],
  ['closed deadline', { registrationDeadline: new Date(0) }], ['published bracket', { divisions: [division({ brackets: policy.generateSingleElimination([id(3), id(4)]) })] }],
  ['started event', { status: 'ongoing' }],
]) test(`division registration rejects ${label}`, async () => {
  mock.method(Tournament, 'findById', async () => event(change)); const write = mock.method(Tournament, 'findOneAndUpdate', async () => { throw Error('No invalid write'); });
  const { res } = await invoke(handlers.registerForDivision, { user: { _id: athlete, role: 'athlete' } }); assert.equal(res.code, 409); assert.equal(write.mock.callCount(), 0);
});
test('stale/future versions, races and nonexistent division cannot publish a successful write', async () => {
  mock.method(Tournament, 'findById', async () => event()); const write = mock.method(Tournament, 'findOneAndUpdate', async () => null);
  for (const version of [6, 8]) { const { res } = await invoke(handlers.generateDivisionBrackets, { body: { version } }); assert.equal(res.code, 409); }
  assert.equal(write.mock.callCount(), 0);
  const result = await invoke(handlers.generateDivisionBrackets); assert.equal(result.res.code, 409); assert.equal(result.emit.mock.callCount(), 0);
  const missing = await invoke(handlers.generateDivisionBrackets, { params: { id: id(10), key: 'missing' } }); assert.equal(missing.res.code, 404);
});
test('withdrawal only removes the current athlete from all rosters atomically', async () => {
  mock.method(Tournament, 'findById', async () => event({ registrations: [athlete, id(3)], divisions: [division({ registrations: [athlete, id(3)] })] }));
  const write = mock.method(Tournament, 'findOneAndUpdate', async () => event());
  const { res } = await invoke(handlers.withdrawFromTournament, { user: { _id: athlete, role: 'athlete' } }); assert.equal(res.code, 200);
  const update = write.mock.calls[0].arguments[1]; assert.deepEqual(update.$set.registrations.map(String), [id(3)]); assert.deepEqual(update.$set.divisions[0].registrations.map(String), [id(3)]);
});
test('withdrawal after publication or without enrollment rejects without changing brackets', async () => {
  const find = mock.method(Tournament, 'findById', async () => event()); const write = mock.method(Tournament, 'findOneAndUpdate', async () => { throw Error('No withdrawal'); });
  let result = await invoke(handlers.withdrawFromTournament, { user: { _id: athlete, role: 'athlete' } }); assert.equal(result.res.code, 409);
  find.mock.mockImplementation(async () => event({ registrations: [athlete], divisions: [division({ brackets: policy.generateSingleElimination([id(3), id(4)]) })] }));
  result = await invoke(handlers.withdrawFromTournament, { user: { _id: athlete, role: 'athlete' } }); assert.equal(result.res.code, 409); assert.equal(write.mock.callCount(), 0);
});
test('division generation uses its own roster and event-level CAS', async () => {
  mock.method(Tournament, 'findById', async () => event()); const write = mock.method(Tournament, 'findOneAndUpdate', async () => event());
  const { res } = await invoke(handlers.generateDivisionBrackets); assert.equal(res.code, 200);
  assert.deepEqual(write.mock.calls[0].arguments[1].$set.divisions[0].brackets, policy.generateSingleElimination([id(3), id(4)]));
});
test('parent lifecycle requires all division brackets and then all completed divisions', async () => {
  const find = mock.method(Tournament, 'findById', async () => event()); const write = mock.method(Tournament, 'findOneAndUpdate', async () => event({ status: 'ongoing' }));
  let result = await invoke(eventHandlers.updateTournamentBrackets, { body: { version: 7, status: 'ongoing' } }); assert.equal(result.res.code, 400);
  find.mock.mockImplementation(async () => event({ divisions: [division({ brackets: policy.generateSingleElimination([id(3), id(4)]) })] }));
  result = await invoke(eventHandlers.updateTournamentBrackets, { body: { version: 7, status: 'ongoing' } }); assert.equal(result.res.code, 200);
  find.mock.mockImplementation(async () => event({ status: 'ongoing' }));
  result = await invoke(eventHandlers.updateTournamentBrackets, { body: { version: 7, status: 'completed' } }); assert.equal(result.res.code, 400); assert.equal(write.mock.callCount(), 1);
});
test('division results reject foreign winners, backwards states and unfinished completion', async () => {
  const bracket = policy.generateSingleElimination([id(3), id(4)]);
  mock.method(Tournament, 'findById', async () => event({ status: 'ongoing', divisions: [division({ status: 'ongoing', brackets: bracket })] }));
  const write = mock.method(Tournament, 'findOneAndUpdate', async () => { throw Error('No invalid result'); });
  for (const body of [{ version: 7, status: 'upcoming' }, { version: 7, status: 'completed' }, { version: 7, brackets: { ...bracket, rounds: [{ round: 'Final', matches: [{ ...bracket.rounds[0].matches[0], winner: id(99) }] }] } }]) {
    const { res } = await invoke(handlers.updateDivisionBrackets, { body }); assert.equal(res.code, 400);
  }
  assert.equal(write.mock.callCount(), 0);
});
test('a completed division is immutable and a valid final winner permits completion', async () => {
  const brackets = policy.generateSingleElimination([id(3), id(4)]); brackets.rounds[0].matches[0].winner = id(3);
  const find = mock.method(Tournament, 'findById', async () => event({ status: 'ongoing', divisions: [division({ status: 'ongoing', brackets })] }));
  const write = mock.method(Tournament, 'findOneAndUpdate', async () => event());
  let result = await invoke(handlers.updateDivisionBrackets, { body: { version: 7, status: 'completed' } }); assert.equal(result.res.code, 200);
  assert.equal(write.mock.calls[0].arguments[1].$set.divisions[0].status, 'completed');
  find.mock.mockImplementation(async () => event({ status: 'ongoing', divisions: [division({ status: 'completed', brackets })] }));
  result = await invoke(handlers.updateDivisionBrackets, { body: { version: 7, status: 'ongoing' } }); assert.equal(result.res.code, 409);
});
