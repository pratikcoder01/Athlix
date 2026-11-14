const assert = require('node:assert/strict');
const { test, afterEach, mock } = require('node:test');
const { Types } = require('mongoose');
const { Academy } = require('../dist/models/Academy.js');
const { User } = require('../dist/models/User.js');
const { Profile } = require('../dist/models/Profile.js');
const { CoachProfile } = require('../dist/models/CoachProfile.js');
const academy = require('../dist/controllers/academyController.js');
const profile = require('../dist/controllers/profileController.js');
const policy = require('../dist/utils/directoryPolicy.js');
const id = '507f1f77bcf86cd799439011';
const other = '507f1f77bcf86cd799439012';
const user = { _id: new Types.ObjectId(id), role: 'athlete', isActive: true };
const details = { name: 'Test Dojo', address: 'Test address', latitude: 0, longitude: 0, disciplines: ['Karate'] };
afterEach(() => mock.restoreAll());

async function invoke(handler, fields = {}) {
  const req = { user, body: {}, query: {}, params: {}, ...fields };
  const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  await handler(req, res, error => { throw error; });
  return { req, res };
}

for (const role of ['athlete', 'coach', 'tournament_organizer']) {
  test(`${role} cannot publish academy listings`, async () => {
    const create = mock.method(Academy, 'create', async () => { throw Error('Unauthorized database write'); });
    const result = await invoke(academy.registerAcademy, { user: { ...user, role }, body: details });
    assert.equal(result.res.code, 403); assert.equal(create.mock.callCount(), 0);
  });
}
for (const role of ['academy_owner', 'admin']) {
  test(`approved ${role} publishes actual zero coordinates with principal-owned fields`, async () => {
    const create = mock.method(Academy, 'create', async value => value);
    const result = await invoke(academy.registerAcademy, { user: { ...user, role }, body: details });
    assert.equal(result.res.code, 201);
    assert.deepEqual(create.mock.calls[0].arguments[0], {
      name: details.name, address: details.address, disciplines: details.disciplines, description: '', schedule: '', gallery: [],
      ownerId: user._id, location: { type: 'Point', coordinates: [0, 0] },
    });
  });
}
test('invalid academy fields, coordinates, media and ownership mass assignment fail before database access', async () => {
  const create = mock.method(Academy, 'create', async () => { throw Error('Invalid payload must not write'); });
  for (const changes of [{ latitude: 91 }, { longitude: -181 }, { latitude: '0' }, { longitude: null }, { latitude: Infinity },
    { name: '' }, { disciplines: [] }, { disciplines: ['Unrecognized'] }, { ownerId: other }, { membersCount: 1000 },
    { gallery: ['javascript:alert(1)'] }, { gallery: ['not-a-url'] }, { gallery: ['https://user:password@example.test/image.jpg'] }]) {
    const result = await invoke(academy.registerAcademy, { user: { ...user, role: 'academy_owner' }, body: { ...details, ...changes } });
    assert.equal(result.res.code, 400, JSON.stringify(changes));
  }
  assert.equal(create.mock.callCount(), 0);
});

test('directory schemas reject object/array query injection, unbounded pagination and incomplete geography', () => {
  for (const schema of [policy.academyQuerySchema, policy.profileQuerySchema]) {
    for (const query of [{ search: { $ne: '' } }, { search: ['name'] }, { limit: ['1'] }, { page: 0 }, { limit: '1000' }, { search: 'x'.repeat(81) }]) {
      assert.equal(schema.safeParse(query).success, false);
    }
  }
  for (const query of [{ lat: '0' }, { lng: '0' }, { lat: '', lng: '0' }, { lat: '0', lng: '181' }, { maxDistanceKm: '10' }, { lat: '0', lng: '0', maxDistanceKm: '1000' }]) {
    assert.equal(policy.academyQuerySchema.safeParse(query).success, false);
  }
  assert.equal(policy.academyQuerySchema.safeParse({ lat: '0', lng: '0' }).success, true);
});

test('academy search is literal, owner-scoped and bounded; public projection excludes owner email and member totals', async () => {
  let filter, selected, populated, skipped, limited;
  const records = [{ _id: id }, { _id: other }];
  const chain = { select(value) { selected = value; return this; }, populate(...value) { populated = value; return this; },
    sort() { return this; }, skip(value) { skipped = value; return this; }, limit(value) { limited = value; return this; }, exec: async () => records };
  mock.method(Academy, 'find', value => { filter = value; return chain; });
  const result = await invoke(academy.getAcademies, { query: { search: '(a+)+$', mine: 'true', limit: '1', page: '2', lat: '0', lng: '0' } });
  assert.equal(result.res.code, 200); assert.equal(result.res.body.hasMore, true); assert.equal(result.res.body.academies.length, 1);
  assert.equal(filter.ownerId, user._id); assert.equal(filter.name.$regex, '\\(a\\+\\)\\+\\$');
  assert.deepEqual(filter.location.$near.$geometry.coordinates, [0, 0]); assert.equal(filter.location.$near.$maxDistance, 10_000);
  assert.equal(skipped, 1); assert.equal(limited, 2); assert.deepEqual(populated, ['ownerId', 'name']);
  assert.doesNotMatch(selected, /membersCount|email/);
});

test('academy detail validates identifiers and returns 404 for absent records', async () => {
  const find = mock.method(Academy, 'findById', () => ({ select() { return this; }, populate: async () => null }));
  let result = await invoke(academy.getAcademyById, { params: { id: 'not-an-id' } });
  assert.equal(result.res.code, 400); assert.equal(find.mock.callCount(), 0);
  result = await invoke(academy.getAcademyById, { params: { id } }); assert.equal(result.res.code, 404);
});

test('profile updates are atomic and scoped to the current principal with validated self-reported fields', async () => {
  const changes = { bio: ' My training ', discipline: 'Karate', beltRank: ' Brown ', location: ' Mumbai ', achievements: [' First event '] };
  const update = mock.method(Profile, 'findOneAndUpdate', async (_filter, data) => data.$set);
  const result = await invoke(profile.updateProfile, { body: changes });
  assert.equal(result.res.code, 200);
  const [filter, write, options] = update.mock.calls[0].arguments;
  assert.deepEqual(filter, { userId: user._id }); assert.equal(write.$set.bio, 'My training'); assert.deepEqual(write.$set.achievements, ['First event']);
  assert.deepEqual(write.$setOnInsert, { userId: user._id }); assert.equal(options.runValidators, true); assert.equal(options.upsert, true);
});

test('profile updates reject unauthorized identity fields, unsafe links and unbounded achievements before writing', async () => {
  const update = mock.method(Profile, 'findOneAndUpdate', async () => { throw Error('No invalid write'); });
  for (const body of [{}, { role: 'admin' }, { userId: other }, { isActive: false }, { bio: { $ne: '' } }, { discipline: 'Unknown' },
    { achievements: 'invented award' }, { achievements: Array.from({ length: 31 }, () => 'award') }, { achievements: ['x'.repeat(201)] },
    { profileImage: 'javascript:alert(1)' }, { profileImage: 'not-a-url' }, { socialLinks: { instagram: 'http://example.test' } }]) {
    assert.equal((await invoke(profile.updateProfile, { body })).res.code, 400, JSON.stringify(body));
  }
  assert.equal((await invoke(profile.updateProfile, { user: undefined, body: { bio: 'test' } })).res.code, 401);
  assert.equal(update.mock.callCount(), 0);
});

test('profile details select public identity fields and only expose draft coaching settings to their owner', async () => {
  const selections = [], filters = [];
  mock.method(User, 'findOne', filter => { filters.push(filter); return { select: async fields => { selections.push(fields); return { _id: id, name: 'Coach', role: 'coach' }; } }; });
  mock.method(Profile, 'findOne', () => ({ select: async fields => { selections.push(fields); return {}; } }));
  mock.method(CoachProfile, 'findOne', filter => { filters.push(filter); return { select: async fields => { selections.push(fields); return {}; } }; });
  assert.equal((await invoke(profile.getProfileById, { params: { userId: id } })).res.code, 200);
  assert.deepEqual(filters[0], { _id: id, isActive: true }); assert.deepEqual(filters[1], { userId: id });
  assert.equal(selections[0], '_id name role'); assert.ok(selections.every(value => !/email|phone|password|firebaseUid/.test(value)));
  await invoke(profile.getProfileById, { params: { userId: id }, user: { ...user, _id: new Types.ObjectId(other) } });
  assert.deepEqual(filters.at(-1), { userId: id, active: true });
});

test('profile directory uses safe bounded aggregation and projects no private account metadata', async () => {
  const aggregate = mock.method(Profile, 'aggregate', pipeline => ({ exec: async () => [] }));
  const response = await invoke(profile.getProfiles, { query: { search: '.*', discipline: 'Karate', limit: '10', page: '3' } });
  assert.equal(response.res.code, 200);
  const pipeline = aggregate.mock.calls[0].arguments[0];
  assert.deepEqual(pipeline.find(stage => stage.$skip), { $skip: 20 }); assert.deepEqual(pipeline.find(stage => stage.$limit), { $limit: 11 });
  assert.equal(pipeline.find(stage => stage.$match?.['account.isActive']).$match['account.name'].$regex, '\\.\\*');
  assert.deepEqual(pipeline.at(-1).$project.userId, { _id: '$account._id', name: '$account.name', role: '$account.role' });
  assert.doesNotMatch(JSON.stringify(pipeline.at(-1)), /email|password|firebaseUid|phone/);
});
