const assert = require('node:assert/strict');
const { test, afterEach, mock } = require('node:test');
const { Types } = require('mongoose');
const policy = require('../dist/utils/tournamentPolicy.js');
const { Tournament } = require('../dist/models/Tournament.js');
const controller = require('../dist/controllers/tournamentController.js');
const { seedTournamentBracket } = require('../dist/controllers/aiController.js');
const ids = Array.from({ length: 256 }, (_, i) => (i + 1).toString(16).padStart(24, '0'));
const owner = new Types.ObjectId('507f1f77bcf86cd799439011');
const stranger = new Types.ObjectId('507f1f77bcf86cd799439012');
const eventId = '507f1f77bcf86cd799439013';
const account = (role = 'tournament_organizer', _id = owner) => ({ role, _id });
const event = (fields = {}) => ({ _id: eventId, organizerId: owner, status: 'upcoming', registrations: ids.slice(0, 3),
  brackets: policy.generateSingleElimination(ids.slice(0, 3)), get: () => 2, ...fields });
function invoke(handler, body, user = account(), params = { id: eventId }) {
  const emit = mock.fn(); const req = { body, user, params, query: {}, app: { get: () => ({ to: () => ({ emit }) }) } };
  const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  return handler(req, res, error => { throw error; }).then(() => ({ res, req, emit }));
}
afterEach(() => mock.restoreAll());

for (const count of [2, 3, 4, 5, 7, 8, 9, 16, 31, 64, 127, 256]) {
  test(`deterministic single elimination covers ${count} entrants and resolves byes`, () => {
    const roster = ids.slice(0, count); const bracket = policy.generateSingleElimination(roster);
    assert.deepEqual(bracket, policy.generateSingleElimination(roster));
    assert.equal(policy.bracketProblem(bracket, roster), undefined);
    assert.equal(new Set(bracket.rounds[0].matches.flatMap(m => [m.p1,m.p2]).filter(id => id !== 'BYE')).size, count);
    for (const round of bracket.rounds) {
      for (const match of round.matches) { if (!match.winner) match.winner = match.p1 === 'BYE' ? match.p2 : match.p1; }
      policy.advanceWinners(bracket);
    }
    assert.ok(roster.includes(bracket.rounds.at(-1).matches[0].winner));
    assert.equal(policy.bracketProblem(bracket, roster), undefined);
    assert.equal(bracket.rounds.reduce((n,r) => n+r.matches.filter(m => m.p1 !== 'BYE' && m.p2 !== 'BYE').length,0), count-1);
  });
}
test('invalid, repeated and unbounded rosters fail', () => {
  for (const roster of [[], [ids[0]], [ids[0],ids[0]], ['bad',ids[0]], [...ids, 'f'.repeat(24)]]) assert.throws(() => policy.generateSingleElimination(roster));
});
test('fabricated winners and downstream participants are rejected', () => {
  const bracket = policy.generateSingleElimination(ids.slice(0,4));
  bracket.rounds[0].matches[0].winner = ids[20];
  assert.match(policy.bracketProblem(bracket,ids.slice(0,4)),/Winner/);
  bracket.rounds[0].matches[0].winner = ids[0]; bracket.rounds[1].matches[0].p1 = ids[1];
  assert.match(policy.bracketProblem(bracket,ids.slice(0,4)),/Participants/);
});
test('backward and skipped event state transitions are rejected', () => {
  assert.equal(policy.canTransitionTournament('upcoming','completed'),false);
  assert.equal(policy.canTransitionTournament('completed','ongoing'),false);
  assert.equal(policy.canTransitionTournament('ongoing','upcoming'),false);
  assert.equal(policy.canTransitionTournament('upcoming','ongoing'),true);
});
test('search is literal and array/object/no-limit query injection fails validation', () => {
  const search = '(a+)+$.*['; const escaped = policy.escapeSearch(search);
  assert.ok(new RegExp(escaped,'i').test(search)); assert.ok(!new RegExp(escaped,'i').test('aaaa'));
  for (const query of [{search:{$ne:''}}, {status:['upcoming']}, {limit:100000}, {page:0}, {search:'x'.repeat(101)}]) assert.equal(policy.tournamentQuerySchema.safeParse(query).success,false);
});
for (const role of ['tournament_organizer','athlete','coach','academy_owner']) {
  test(`foreign ${role} cannot modify another organizer event`, async () => {
    mock.method(Tournament,'findById',async()=>event());
    const write=mock.method(Tournament,'findOneAndUpdate',async()=>{throw Error('Unauthorized write');});
    const result=await invoke(controller.updateTournamentBrackets,{version:2,status:'ongoing'},account(role,stranger));
    assert.equal(result.res.code,403);assert.equal(write.mock.callCount(),0);assert.equal(result.emit.mock.callCount(),0);
  });
}
test('foreign organizer cannot regenerate using the AI compatibility endpoint', async () => {
  mock.method(Tournament,'findById',async()=>event({brackets:{seeds:[],rounds:[]}}));
  const write=mock.method(Tournament,'findOneAndUpdate',async()=>{throw Error('Unauthorized write');});
  const result=await invoke(seedTournamentBracket,{tournamentId:eventId,version:2},account('tournament_organizer',stranger),{});
  assert.equal(result.res.code,403);assert.equal(write.mock.callCount(),0);
});
for (const role of ['tournament_organizer','admin']) {
  test(`owner or admin (${role}) updates using compare-and-set, validators and version increment`, async () => {
    const saved=event({status:'ongoing'});mock.method(Tournament,'findById',async()=>event());
    const write=mock.method(Tournament,'findOneAndUpdate',async()=>saved);
    const result=await invoke(controller.updateTournamentBrackets,{version:2,status:'ongoing'},account(role,role==='admin'?stranger:owner));
    assert.equal(result.res.code,200);const [filter,update,options]=write.mock.calls[0].arguments;
    assert.equal(filter.__v,2);assert.equal(filter.organizerId,owner);assert.equal(filter.status,'upcoming');
    assert.deepEqual(update.$inc,{__v:1});assert.equal(options.runValidators,true);assert.equal(result.emit.mock.callCount(),1);
  });
}
test('stale versions and racing writes return409 and never publish success events', async () => {
  mock.method(Tournament,'findById',async()=>event());
  const write=mock.method(Tournament,'findOneAndUpdate',async()=>null);
  let result=await invoke(controller.updateTournamentBrackets,{version:1,status:'ongoing'});
  assert.equal(result.res.code,409);assert.equal(write.mock.callCount(),0);
  result=await invoke(controller.updateTournamentBrackets,{version:2,status:'ongoing'});
  assert.equal(result.res.code,409);assert.equal(result.emit.mock.callCount(),0);
});
test('malformed payloads cannot mutate records', async () => {
  const find=mock.method(Tournament,'findById',async()=>{throw Error('Invalid payload must not query');});
  for (const body of [{brackets:'not-json',version:2},{version:-1,status:'completed'},{version:2,status:'invented'},{version:2,organizerId:stranger}]) {
    const result=await invoke(controller.updateTournamentBrackets,body);assert.equal(result.res.code,400);
  }
  assert.equal(find.mock.callCount(),0);
});
test('event completion requires final result and completed events remain read-only', async () => {
  mock.method(Tournament,'findById',async()=>event({status:'ongoing'}));
  let result=await invoke(controller.updateTournamentBrackets,{version:2,status:'completed'});assert.equal(result.res.code,400);
  mock.restoreAll();mock.method(Tournament,'findById',async()=>event({status:'completed'}));
  result=await invoke(controller.updateTournamentBrackets,{version:2,status:'completed'});assert.equal(result.res.code,409);
});
test('registration uses atomic active-deadline, unique athlete, unlocked-bracket and capacity predicates', async () => {
  const write=mock.method(Tournament,'findOneAndUpdate',async()=>event());
  const result=await invoke(controller.registerForTournament,{},account('athlete'));
  assert.equal(result.res.code,200);const [filter,update]=write.mock.calls[0].arguments;
  assert.equal(filter.status,'upcoming');assert.ok(filter.registrationDeadline.$gte instanceof Date);
  assert.equal(filter.registrations.$ne,owner);assert.deepEqual(filter['brackets.rounds.0'],{$exists:false});
  assert.deepEqual(update.$addToSet,{registrations:owner});assert.deepEqual(update.$inc,{__v:1});assert.ok(filter.$expr);
});
test('duplicate/closed registration reports409; non-athletes and malformed ids cannot write', async () => {
  const write=mock.method(Tournament,'findOneAndUpdate',async()=>null);mock.method(Tournament,'exists',async()=>true);
  let result=await invoke(controller.registerForTournament,{},account('athlete'));assert.equal(result.res.code,409);
  result=await invoke(controller.registerForTournament,{},account('coach'));assert.equal(result.res.code,403);
  result=await invoke(controller.registerForTournament,{},account('athlete'),{id:'not-object-id'});assert.equal(result.res.code,400);
  assert.equal(write.mock.callCount(),1);
});
test('bracket generation uses deterministic roster and refuses stale/published state', async () => {
  mock.method(Tournament,'findById',async()=>event({brackets:{seeds:[],rounds:[]}}));
  const write=mock.method(Tournament,'findOneAndUpdate',async()=>event());
  const result=await invoke(controller.generateTournamentBrackets,{version:2});assert.equal(result.res.code,200);
  const [filter,update]=write.mock.calls[0].arguments;assert.equal(filter.__v,2);assert.deepEqual(filter['brackets.rounds.0'],{$exists:false});
  assert.deepEqual(update.$set.brackets,policy.generateSingleElimination(ids.slice(0,3)));
});
