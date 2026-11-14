const assert = require('node:assert/strict');
const { test, before, after, afterEach, mock } = require('node:test');
const express = require('express');
const jwt = require('jsonwebtoken');
const { Types } = require('mongoose');
const { User } = require('../dist/models/User');
const { Profile } = require('../dist/models/Profile');
const { CoachProfile } = require('../dist/models/CoachProfile');
const { TrainingPlanModel } = require('../dist/models/TrainingPlan');
const { Tournament } = require('../dist/models/Tournament');
const provider = require('../dist/utils/anthropic');
const controller = require('../dist/controllers/aiController');
const { createErrorHandler } = require('../dist/middleware/errorMiddleware');
const router = require('../dist/routes/aiRoutes').default;
const previousFlag = process.env.AI_COACHING_ENABLED;
process.env.JWT_SECRET = 'isolated-ai-regression-token-secret';
const actorId = '507f1f77bcf86cd799439011';
const coachId = '507f1f77bcf86cd799439012';
const otherId = '507f1f77bcf86cd799439013';
const actor = { _id: new Types.ObjectId(actorId), name: 'Fixture Athlete', role: 'athlete', isActive: true };
const validPlan = { weekOverview: 'General technical practice', days: [{ day: 'Monday', focus: 'Footwork', drills: ['Controlled footwork'], duration: '30 minutes', intensity: 'low' }], notes: 'Review with your coach.' };
const trainingRequest = { discipline: 'Karate', trainingGoal: 'Practice footwork', daysAvailablePerWeek: 1, notes: '' };
const publicCoach = { id: coachId, name: 'Published Coach', discipline: 'Karate', beltRank: 'Black', location: 'Test City',
  pricingPerHour: 80, currency: 'INR', availabilityTimezone: 'UTC', experienceYears: 5, certifications: ['Self-reported qualification'],
  availability: [{ dayOfWeek: 'Monday', startTime: '09:00', endTime: '17:00' }] };
const planHandlers = ['generateTrainingPlan', 'saveTrainingPlan', 'matchCoach', 'generateWellbeingNudge'];
const app = express();app.use(express.json());app.use('/ai', router);app.use(createErrorHandler(() => {}));
let listener;let base;
before(async () => {
  listener = await new Promise(resolve => { const server = app.listen(0, '127.0.0.1', () => resolve(server)); });
  base = `http://127.0.0.1:${listener.address().port}`;
});
after(async () => {
  await new Promise((resolve,reject) => listener.close(error => error ? reject(error) : resolve()));
  if (previousFlag === undefined) delete process.env.AI_COACHING_ENABLED;else process.env.AI_COACHING_ENABLED = previousFlag;
});
afterEach(() => { mock.restoreAll();delete process.env.AI_COACHING_ENABLED; });
async function invoke(name, body = {}, account = actor) {
  const req = { user: account, body, params: {}, app: { get: () => null } };
  const res = { status(code) { this.code = code;return this; }, json(body) { this.body = body;return this; } };
  await controller[name](req,res,error => { throw error; });return res;
}
function enabled() { process.env.AI_COACHING_ENABLED = 'true'; }
function roster(records = [publicCoach]) { return mock.method(CoachProfile,'aggregate',() => ({ exec: async () => records })); }
function authenticate() { mock.method(User,'findById',id => ({ select: async () => ({ ...actor,_id:new Types.ObjectId(id) }) })); }
async function post(path, body, id = actorId) {
  const token=jwt.sign({id},process.env.JWT_SECRET,{expiresIn:'1h'});
  const response=await fetch(`${base}/ai${path}`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
  return {response,body:await response.json()};
}

for (const flag of [undefined,'false','TRUE','1']) {
  test(`AI coaching flag ${String(flag)} fails closed in every exported provider/plan handler`,async () => {
    if(flag!==undefined)process.env.AI_COACHING_ENABLED=flag;
    const db=mock.method(Profile,'findOne',() => {throw Error('No disabled reads');});
    const profiles=mock.method(CoachProfile,'aggregate',() => {throw Error('No disabled roster');});
    const save=mock.method(TrainingPlanModel,'create',() => {throw Error('No disabled writes');});
    const ask=mock.method(provider,'askFeatherlessJSON',async () => {throw Error('No disabled provider');});
    for(const name of planHandlers)assert.equal((await invoke(name,{})).code,503);
    assert.equal(db.mock.callCount()+profiles.mock.callCount()+save.mock.callCount()+ask.mock.callCount(),0);
  });
}
test('disabled HTTP routes stop before authentication database lookups or provider requests',async () => {
  const find=mock.method(User,'findById',() => {throw Error('No disabled auth lookup');});
  const ask=mock.method(provider,'askFeatherlessJSON',async () => {throw Error('No disabled provider');});
  for(const route of ['/training-plan','/save-plan','/match-coach','/wellbeing-nudge'])assert.equal((await post(route,{})).response.status,503);
  assert.equal(find.mock.callCount(),0);assert.equal(ask.mock.callCount(),0);
});
test('enabled provider handlers still require a session',async () => {
  enabled();for(const name of planHandlers)assert.equal((await invoke(name,{},null)).code,401);
});
test('deterministic seed compatibility route remains available while AI coaching is disabled',async () => {
  authenticate();const find=mock.method(Tournament,'findById',async () => null);
  const ask=mock.method(provider,'askFeatherlessJSON',async () => {throw Error('No provider seeding');});
  const result=await post('/seed-bracket',{tournamentId:coachId,version:0});
  assert.equal(result.response.status,404);assert.equal(find.mock.callCount(),1);assert.equal(ask.mock.callCount(),0);
});
test('training requests reject oversized, noninteger and identity-injected details before reads',async () => {
  enabled();const read=mock.method(Profile,'findOne',() => {throw Error('Do not read');});
  for(const patch of [{discipline:{$ne:''}},{trainingGoal:'x'.repeat(501)},{notes:'x'.repeat(2001)},
    {daysAvailablePerWeek:0},{daysAvailablePerWeek:1.5},{daysAvailablePerWeek:8},{athleteId:otherId}]) {
    assert.equal((await invoke('generateTrainingPlan',{...trainingRequest,...patch})).code,400);
  }
  assert.equal(read.mock.callCount(),0);
});
test('training output is validated and prompt reads only caller belt rank',async () => {
  enabled();const read=mock.method(Profile,'findOne',() => ({select:field => {assert.equal(field,'beltRank');return {lean:async () => ({beltRank:'White',email:'private@example.test'})};}}));
  const ask=mock.method(provider,'askFeatherlessJSON',async (_system,prompt) => {
    assert.deepEqual(JSON.parse(prompt),{...trainingRequest,beltRank:'White'});return validPlan;
  });
  const response=await invoke('generateTrainingPlan',trainingRequest);
  assert.equal(response.code,200);assert.deepEqual(response.body.plan,validPlan);assert.equal(response.body.experimental,true);
  assert.deepEqual(read.mock.calls[0].arguments[0],{userId:actor._id});assert.equal(ask.mock.callCount(),1);
});
test('malformed, excessive or wrong-day-count plan outputs return a safe502',async () => {
  enabled();mock.method(Profile,'findOne',() => ({select:() => ({lean:async () => null})}));
  const responses=[null,[],{...validPlan,weekOverview:'x'.repeat(2001)},{...validPlan,days:[]},
    {...validPlan,days:[...validPlan.days,...validPlan.days]}, {...validPlan,secret:'private-provider-data'},validPlan];
  mock.method(provider,'askFeatherlessJSON',async () => responses.shift());
  for(let index=0;index<7;index++) {
    const result=await invoke('generateTrainingPlan',{...trainingRequest,daysAvailablePerWeek:index===6?2:1});
    assert.equal(result.code,502);assert.doesNotMatch(JSON.stringify(result.body),/private-provider-data/);
  }
});
test('saved plan ownership comes only from the session and persists only validated fields',async () => {
  enabled();const save=mock.method(TrainingPlanModel,'create',async fields => ({...fields,_id:coachId}));
  const result=await invoke('saveTrainingPlan',{plan:validPlan});assert.equal(result.code,201);
  assert.deepEqual(save.mock.calls[0].arguments[0],{...validPlan,athleteId:actor._id});
});
test('plan saving rejects injected owners, metadata and invalid plans without persistence',async () => {
  enabled();const save=mock.method(TrainingPlanModel,'create',async () => {throw Error('Do not save');});
  for(const body of [{plan:validPlan,athleteId:otherId},{plan:{...validPlan,athleteId:otherId}},{plan:{...validPlan,_id:coachId}},
    {plan:{...validPlan,days:[]}},{plan:null}])assert.equal((await invoke('saveTrainingPlan',body)).code,400);
  assert.equal(save.mock.callCount(),0);
});
test('plan persistence failure cannot report success or leak driver details',async () => {
  enabled();authenticate();mock.method(TrainingPlanModel,'create',async () => {throw Error('private-driver-credential');});
  const result=await post('/save-plan',{plan:validPlan},otherId);
  assert.equal(result.response.status,500);assert.equal(result.body.success,false);assert.doesNotMatch(JSON.stringify(result.body),/private-driver-credential/);
});
test('coach ranking requires publication/current coach status and allowlists prompt and response fields',async () => {
  enabled();const aggregate=roster([{...publicCoach,email:'private@example.test',phone:'private-phone',firebaseUid:'private-firebase',rating:5,active:true,
    availability:[{...publicCoach.availability[0],privateNote:'private-note'}]}]);
  const ask=mock.method(provider,'askFeatherlessJSON',async (_system,prompt) => {
    const body=JSON.parse(prompt);assert.deepEqual(body.coaches,[publicCoach]);
    assert.doesNotMatch(prompt,/private-|email|phone|firebaseUid|rating/);
    return {matches:[{coachId,matchScore:70,reason:'Matches the requested discipline'}]};
  });
  const result=await invoke('matchCoach',{query:'Karate footwork',location:'Test City'});assert.equal(result.code,200);
  assert.doesNotMatch(JSON.stringify(result.body),/private-|email|phone|firebaseUid|rating/);
  const pipeline=aggregate.mock.calls[0].arguments[0];
  assert.equal(pipeline[0].$match.active,true);assert.equal(pipeline[0].$match.availabilityTimezone,'UTC');
  assert.ok(pipeline.some(stage => stage.$match?.['account.isActive']===true && stage.$match?.['account.role']==='coach'));
  assert.ok(pipeline.some(stage => stage.$limit===25));
  const projection=pipeline.find(stage => stage.$project).$project;
  assert.equal(projection.email,undefined);assert.equal(projection.rating,undefined);assert.equal(ask.mock.callCount(),1);
});
test('no published/valid roster gives an honest empty result without provider calls',async () => {
  enabled();roster([{...publicCoach,availabilityTimezone:undefined}]);const ask=mock.method(provider,'askFeatherlessJSON',async () => {throw Error('No empty-roster provider call');});
  const result=await invoke('matchCoach',{query:'Karate'});assert.equal(result.code,200);assert.deepEqual(result.body.coaches,[]);assert.equal(result.body.skipAI,true);assert.equal(ask.mock.callCount(),0);
});
test('oversized/identity-injected match requests fail before roster lookup',async () => {
  enabled();const aggregate=roster();
  for(const body of [{query:'x'.repeat(501)},{query:'Karate',location:'x'.repeat(201)},{query:'Karate',athleteId:otherId},{query:{$ne:''}}])assert.equal((await invoke('matchCoach',body)).code,400);
  assert.equal(aggregate.mock.callCount(),0);
});
test('unknown/duplicate coaches, invented scores and malformed model fields are rejected with502',async () => {
  enabled();roster();const match={coachId,matchScore:50,reason:'General suggestion'};
  const responses=[{matches:[{...match,coachId:otherId}]},{matches:[match,match]}, {matches:[{...match,matchScore:101}]},
    {matches:[{...match,matchScore:1.5}]},{matches:[{...match,reason:'x'.repeat(501)}]}, {matches:[{...match,email:'private@example.test'}]}, {matches:'private-provider-data'}];
  mock.method(provider,'askFeatherlessJSON',async () => responses.shift());
  for(let index=0;index<7;index++) {const result=await invoke('matchCoach',{query:'Karate'});assert.equal(result.code,502);assert.doesNotMatch(JSON.stringify(result.body),/private@example|private-provider-data/);}
});
test('nudge rejects zero/nonfinite baselines, excess hours and forged fields before provider work',async () => {
  enabled();const ask=mock.method(provider,'askFeatherlessJSON',async () => {throw Error('No invalid nudge');});
  for(const body of [{currentPeriodHours:1,trailingAverageHours:0},{currentPeriodHours:-1,trailingAverageHours:1},
    {currentPeriodHours:169,trailingAverageHours:1},{currentPeriodHours:NaN,trailingAverageHours:1},
    {currentPeriodHours:Infinity,trailingAverageHours:1},{currentPeriodHours:'4',trailingAverageHours:1},
    {currentPeriodHours:1,trailingAverageHours:1,athleteId:otherId}])assert.equal((await invoke('generateWellbeingNudge',body)).code,400);
  assert.equal(ask.mock.callCount(),0);
});
test('nudge sends bounded observed hours without division or invented activity',async () => {
  enabled();mock.method(provider,'askFeatherlessJSON',async (_system,prompt) => {
    assert.deepEqual(JSON.parse(prompt),{currentPeriodHours:4,trailingAverageHours:3});return {nudge:'Plan time for recovery and ask your coach about workload.'};
  });
  const result=await invoke('generateWellbeingNudge',{currentPeriodHours:4,trailingAverageHours:3});assert.equal(result.code,200);assert.equal(result.body.experimental,true);
});
test('malformed nudge output never becomes a successful coaching result',async () => {
  enabled();const responses=[{nudge:'x'.repeat(121)},{nudge:''},{nudge:99},{nudge:'valid',secret:'private-provider-data'}];
  mock.method(provider,'askFeatherlessJSON',async () => responses.shift());
  for(let index=0;index<4;index++)assert.equal((await invoke('generateWellbeingNudge',{currentPeriodHours:4,trailingAverageHours:3})).code,502);
});
test('AI route budget is five requests per authenticated account across endpoints',async () => {
  enabled();authenticate();const ask=mock.method(provider,'askFeatherlessJSON',async () => ({nudge:'Allow time for recovery.'}));
  const rateActor='507f1f77bcf86cd799439021';
  for(let count=0;count<5;count++)assert.equal((await post('/wellbeing-nudge',{currentPeriodHours:4,trailingAverageHours:3},rateActor)).response.status,200);
  const limited=await post('/wellbeing-nudge',{currentPeriodHours:4,trailingAverageHours:3},rateActor);
  assert.equal(limited.response.status,429);assert.ok(limited.response.headers.get('retry-after'));assert.equal(ask.mock.callCount(),5);
  assert.equal((await post('/wellbeing-nudge',{currentPeriodHours:4,trailingAverageHours:3},'507f1f77bcf86cd799439022')).response.status,200);
});
