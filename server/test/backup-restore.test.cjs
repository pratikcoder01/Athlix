const assert = require('node:assert/strict');
const { test } = require('node:test');
const { drillEnvironment, validateSourceContainer, generatedDatabaseName, indexDefinition } = require('./backup-restore.ci.cjs');
const environment = { CI: 'true', GITHUB_ACTIONS: 'true', GITHUB_RUN_ID: '12345', TEST_MONGO_URI: 'mongodb://127.0.0.1:27017/?replicaSet=rs0' };

test('backup drill cannot target production credentials, database names or remote hosts', () => {
  for (const env of [{}, { ...environment, CI: 'false' }, { ...environment, GITHUB_ACTIONS: '' }, { ...environment, GITHUB_RUN_ID: '../production' }, { ...environment, TEST_MONGO_URI: '' }]) assert.throws(() => drillEnvironment(env));
  for (const uri of ['mongodb://example.com:27017/?replicaSet=rs0', 'mongodb://user:secret@127.0.0.1:27017/?replicaSet=rs0', 'mongodb://127.0.0.1:27017/athlix?replicaSet=rs0', 'mongodb://127.0.0.1:27018/?replicaSet=rs0', 'mongodb://127.0.0.1:27017/?replicaSet=production', 'mongodb://127.0.0.1:27017/?replicaSet=rs0&proxyHost=example.com']) assert.throws(() => drillEnvironment({ ...environment, TEST_MONGO_URI: uri }));
  const approved = drillEnvironment({ ...environment, MONGO_URI: 'mongodb+srv://production.example.test/athlix' });
  assert.equal(new URL(approved.uri).hostname, '127.0.0.1');
  assert.equal(new URL(approved.uri).searchParams.get('directConnection'), 'true');
  assert.equal(approved.runId, '12345');
});

test('backup drill requires the exact owned CI container and loopback port', () => {
  const container = { Id: 'a'.repeat(64), Name: '/athlix-ci-mongo', Config: { Image: 'mongo:8.0', Labels: { 'com.athlix.ci-run': '12345' } }, State: { Running: true }, NetworkSettings: { Ports: { '27017/tcp': [{ HostIp: '127.0.0.1', HostPort: '27017' }] } } };
  assert.equal(validateSourceContainer(container, '12345'), container.Id);
  for (const mutate of [c => { c.Id = 'not-an-id'; }, c => { c.Name = '/production'; }, c => { c.Config.Image = 'different-image'; }, c => { c.Config.Labels = {}; }, c => { c.State.Running = false; }, c => { c.NetworkSettings.Ports['27017/tcp'][0].HostIp = '0.0.0.0'; }, c => { c.NetworkSettings.Ports['27017/tcp'][0].HostPort = '27018'; }]) {
    const invalid = structuredClone(container); mutate(invalid); assert.throws(() => validateSourceContainer(invalid, '12345'));
  }
  assert.throws(() => validateSourceContainer(container, 'another-run'));
});

test('backup namespaces are generated and index comparison preserves compound key order', () => {
  assert.equal(generatedDatabaseName('a'.repeat(32)), 'athlix_backup_test_' + 'a'.repeat(32));
  for (const name of ['athlix', '', '../', 'a'.repeat(31), 'G'.repeat(32)]) assert.throws(() => generatedDatabaseName(name));
  const restored = indexDefinition({ name: 'owner_request', key: { owner: 1, request: 1 }, unique: true });
  assert.notDeepEqual(restored, indexDefinition({ name: 'owner_request', key: { request: 1, owner: 1 }, unique: true }));
  assert.notDeepEqual(restored, indexDefinition({ name: 'owner_request', key: { owner: 1, request: 1 } }));
  assert.notDeepEqual(indexDefinition({ name: 'ttl', key: { expiresAt: 1 }, expireAfterSeconds: 0 }), indexDefinition({ name: 'ttl', key: { expiresAt: 1 } }));
});

test('backup index comparison retains geospatial policy and ignores object-field ordering', () => {
  const sphere = { name: 'location_2dsphere', key: { location: '2dsphere' }, '2dsphereIndexVersion': 3 };
  assert.notDeepEqual(indexDefinition(sphere), indexDefinition({ ...sphere, '2dsphereIndexVersion': 2 }));
  assert.notDeepEqual(indexDefinition({ ...sphere, hidden: true }), indexDefinition(sphere));
  assert.deepEqual(indexDefinition({ ...sphere, ns: 'source.academies', partialFilterExpression: { status: 'active', visible: true } }),
    indexDefinition({ ...sphere, ns: 'restored.academies', partialFilterExpression: { visible: true, status: 'active' } }));
});
