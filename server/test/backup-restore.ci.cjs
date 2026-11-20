// Synthetic CI drill only. This intentionally cannot accept a production target.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { randomUUID, createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const { safeLocalMongoUri } = require('./helpers/localMongo.cjs');
const { MongoClient, ObjectId, Binary, Decimal128, Long, BSON } = mongoose.mongo;
const sourceContainerName = 'athlix-ci-mongo';
const ownershipLabel = 'com.athlix.ci-run';

function drillEnvironment(environment) {
  assert.equal(environment.CI, 'true', 'Backup drill requires disposable CI');
  assert.equal(environment.GITHUB_ACTIONS, 'true', 'Backup drill requires GitHub Actions');
  assert.match(environment.GITHUB_RUN_ID || '', /^\d+$/, 'Backup drill requires a CI run identifier');
  assert.ok(environment.TEST_MONGO_URI, 'Backup drill requires its explicit test URI');
  const uri = new URL(safeLocalMongoUri(environment.TEST_MONGO_URI));
  assert.equal(uri.hostname, '127.0.0.1', 'Backup drill accepts only the CI Mongo seed');
  assert.equal(uri.port, '27017', 'Backup drill accepts only the CI Mongo port');
  assert.equal(uri.searchParams.get('replicaSet'), 'rs0', 'Backup drill requires the isolated replica set');
  return { uri: uri.toString(), runId: environment.GITHUB_RUN_ID };
}

function validateSourceContainer(container, runId) {
  assert.match(container?.Id || '', /^[a-f\d]{64}$/, 'Missing CI container identity');
  assert.equal(container.Name, '/' + sourceContainerName, 'Unexpected CI container');
  assert.equal(container.Config?.Image, 'mongo:8.0', 'Unexpected CI Mongo image');
  assert.equal(container.Config?.Labels?.[ownershipLabel], runId, 'Mongo container is not owned by this CI run');
  assert.equal(container.State?.Running, true, 'CI Mongo is not running');
  const bindings = container.NetworkSettings?.Ports?.['27017/tcp'];
  assert.deepEqual(bindings, [{ HostIp: '127.0.0.1', HostPort: '27017' }], 'CI Mongo must expose only its isolated loopback port');
  return container.Id;
}

function generatedDatabaseName(nonce) {
  assert.match(nonce, /^[a-f\d]{32}$/, 'Invalid generated backup namespace');
  return `athlix_backup_test_${nonce}`;
}

function docker(args, input) {
  return execFileSync('docker', args, { input, encoding: input ? undefined : 'buffer', timeout: 60000, maxBuffer: 8 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'] });
}

const inspect = id => JSON.parse(docker(['inspect', id]).toString())[0];
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const serialize = value => BSON.EJSON.stringify(value, { relaxed: false });
const canonicalOptions = value => {
  if (Array.isArray(value)) return value.map(canonicalOptions);
  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalOptions(value[key])]));
  }
  return value;
};

function indexDefinition(index) {
  // Namespace is deployment identity. Preserve every index option, including
  // geospatial versions, while treating only compound key order as significant.
  const { ns: namespace, key, ...options } = index;
  void namespace;
  return canonicalOptions({ ...options, key: Object.entries(key), unique: index.unique || false,
    sparse: index.sparse || false, hidden: index.hidden || false });
}

async function snapshot(database) {
  const collections = await database.listCollections({}, { nameOnly: false }).toArray();
  const result = [];
  for (const collection of collections.sort((a, b) => a.name.localeCompare(b.name))) {
    assert.equal(collection.type, 'collection', 'Drill fixtures must be ordinary collections');
    const cursor = database.collection(collection.name);
    const documents = await cursor.find({}).sort({ _id: 1 }).toArray();
    const indexes = (await cursor.listIndexes().toArray()).map(indexDefinition).sort((a, b) => a.name.localeCompare(b.name));
    result.push({ name: collection.name, options: collection.options, documents, indexes });
  }
  return serialize(result);
}

async function run() {
  const { uri, runId } = drillEnvironment(process.env);
  const sourceId = validateSourceContainer(inspect(sourceContainerName), runId);
  const nonce = randomUUID().replaceAll('-', '');
  const databaseName = generatedDatabaseName(nonce);
  let source, target, restoreId, sourceOwned = false, phase = 'source connection';
  try {
    source = await mongoose.createConnection(uri, { dbName: databaseName, serverSelectionTimeoutMS: 5000, socketTimeoutMS: 15000, maxPoolSize: 3, promoteLongs: false }).asPromise();
    const existing = await source.db.admin().command({ listDatabases: 1, nameOnly: true, filter: { name: databaseName } });
    assert.equal(existing.databases.length, 0, 'Generated source namespace already exists; refusing to touch it');
    sourceOwned = true;
    phase = 'synthetic schema and records';
    const models = [];
    const modelDirectory = path.resolve(__dirname, '../dist/models');
    for (const file of fs.readdirSync(modelDirectory).filter(name => name.endsWith('.js')).sort()) {
      for (const model of Object.values(require(path.join(modelDirectory, file)))) {
        if (typeof model !== 'function' || !model.modelName || !model.schema) continue;
        models.push(source.model(model.modelName, model.schema.clone(), model.collection.name));
      }
    }
    assert.ok(models.length >= 20, 'Drill must initialize the complete application collection/index set');
    await Promise.all(models.map(model => model.init()));
    const athlete = new ObjectId(), coach = new ObjectId(), academy = new ObjectId(), member = new ObjectId();
    const instant = new Date('2026-01-01T00:00:00.123Z');
    await source.db.collection('users').insertMany([
      { _id: athlete, name: 'Synthetic backup athlete', email: 'athlete@backup.example.test', role: 'athlete', sessionVersion: 3, isActive: true },
      { _id: coach, name: 'Synthetic backup coach', email: 'coach@backup.example.test', role: 'coach', sessionVersion: 1, isActive: true },
    ]);
    await source.db.collection('authsessions').insertOne({ _id: new ObjectId(), userId: athlete, credentialHash: 'a'.repeat(64), usedCredentialHashes: ['b'.repeat(64)], sessionVersion: 3, rotationCount: 1, expiresAt: new Date('2099-01-01T00:00:00Z'), revokedAt: null });
    const entry = { _id: new ObjectId(), athleteId: athlete, clientRequestId: nonce, date: '2026-01-01', discipline: 'Karate', durationMinutes: 30, focus: 'Synthetic drill', notes: 'Private fixture — no customer data', effort: 4, version: 2, createdAt: instant, updatedAt: instant };
    await source.db.collection('trainingentries').insertMany([entry, { ...entry, _id: new ObjectId(), clientRequestId: randomUUID(), deletedAt: instant }]);
    await source.db.collection('academies').insertOne({ _id: academy, name: 'Synthetic backup academy', address: 'Fixture only', ownerId: coach, location: { type: 'Point', coordinates: [0, 0] }, disciplines: ['Karate'], isPublished: true, archivedAt: null, version: 2 });
    await source.db.collection('academymembers').insertOne({ _id: member, academyId: academy, memberCode: 'BACKUP-1', name: 'Synthetic member', discipline: 'Karate', joinedOn: '2026-01-01', status: 'active', notes: 'Private member fixture', permissionRecordedAt: instant, version: 2 });
    await source.db.collection('academyattendances').insertOne({ _id: new ObjectId(), academyId: academy, memberId: member, date: '2026-01-01', status: 'present', recordedBy: coach, createdAt: instant });
    await source.db.collection('backupdrillprobes').insertOne({ _id: new ObjectId(), objectId: athlete, when: instant, binary: new Binary(Buffer.from('Synthetic archive fixture')), decimal: Decimal128.fromString('1234.500'), largeInteger: Long.fromString('9007199254740993'), nested: [{ retained: true, removed: null }] });
    const before = await snapshot(source.db);
    phase = 'binary archive creation';
    const archive = docker(['exec', sourceId, 'mongodump', '--host=127.0.0.1', '--port=27017', `--db=${databaseName}`, '--archive', '--gzip']);
    assert.ok(archive.length > 0 && archive.length < 4 * 1024 * 1024, 'Synthetic archive size is invalid');
    phase = 'separate restore container';
    restoreId = docker(['run', '--detach', '--rm', '--name', `athlix-ci-restore-${nonce}`, '--label', `${ownershipLabel}=${runId}`, '--label', 'com.athlix.fixture=backup-restore', '--memory=512m', '--cpus=1', '--pids-limit=128', '--publish', '127.0.0.1::27017', 'mongo:8.0', '--bind_ip_all', '--setParameter', 'ttlMonitorSleepSecs=1']).toString().trim();
    assert.match(restoreId, /^[a-f\d]{64}$/, 'Invalid restore container identity');
    const restore = inspect(restoreId);
    assert.equal(restore.Config?.Labels?.[ownershipLabel], runId);
    assert.equal(restore.Config?.Labels?.['com.athlix.fixture'], 'backup-restore');
    const bindings = restore.NetworkSettings?.Ports?.['27017/tcp'];
    assert.equal(bindings?.length, 1);
    assert.equal(bindings[0].HostIp, '127.0.0.1');
    assert.match(bindings[0].HostPort, /^\d{1,5}$/);
    target = new MongoClient(`mongodb://127.0.0.1:${bindings[0].HostPort}/?directConnection=true`, { serverSelectionTimeoutMS: 30000, socketTimeoutMS: 15000, promoteLongs: false });
    await target.connect();
    const restored = target.db(databaseName);
    assert.equal((await restored.listCollections().toArray()).length, 0, 'Restore destination must be empty');
    phase = 'binary archive restore';
    docker(['exec', '-i', restoreId, 'mongorestore', '--host=127.0.0.1', '--port=27017', '--archive', '--gzip', `--nsInclude=${databaseName}.*`, '--stopOnError', '--numParallelCollections=1'], archive);
    phase = 'full record and index comparison';
    assert.equal(await snapshot(restored), before, 'Restored collections, BSON documents, options or indexes differ');
    phase = 'restored unique-index behavior';
    await assert.rejects(restored.collection('trainingentries').insertOne({ ...entry, _id: new ObjectId() }), error => error.code === 11000, 'Restored idempotency index must reject a duplicate draft');
    phase = 'restored geospatial-index behavior';
    const nearby = await restored.collection('academies').find({ location: { $near: { $geometry: { type: 'Point', coordinates: [0, 0] }, $maxDistance: 1000 } } }).toArray();
    assert.equal(nearby.length, 1, 'Restored geospatial index must support academy proximity queries');
    assert.equal(nearby[0]._id.toHexString(), academy.toHexString());
    phase = 'restored TTL behavior';
    const expiredId = new ObjectId();
    await restored.collection('authsessions').insertOne({ _id: expiredId, userId: athlete, credentialHash: 'c'.repeat(64), usedCredentialHashes: [], sessionVersion: 3, expiresAt: new Date(0) });
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline && await restored.collection('authsessions').findOne({ _id: expiredId })) await pause(250);
    assert.equal(await restored.collection('authsessions').findOne({ _id: expiredId }), null, 'Restored TTL index must expire a synthetic session');
    phase = 'source and restored-data preservation';
    assert.equal(await snapshot(source.db), before, 'Source changed during restore');
    assert.equal(await snapshot(restored), before, 'Behavior probes changed retained records');
    console.log(JSON.stringify({ backup_restore_drill: 'passed', synthetic_only: true, collections: JSON.parse(before).length, archive_sha256: createHash('sha256').update(archive).digest('hex'), all_documents_and_indexes_equal: true, unique_constraint_enforced: true, geospatial_query_passed: true, ttl_expiry_observed: true, source_unchanged: true, production_backup_accepted: false }));
  } catch (error) {
    throw new Error(`Disposable Mongo backup/restore drill failed during ${phase}`, { cause: error });
  } finally {
    try { if (target) await target.close(); }
    finally {
      try {
        if (source) {
          try { if (sourceOwned) { assert.equal(source.db.databaseName, generatedDatabaseName(nonce)); await source.db.dropDatabase(); } }
          finally { await source.close(); }
        }
      } finally {
        if (restoreId) {
          const current = inspect(restoreId);
          assert.equal(current.Id, restoreId);
          assert.equal(current.Config?.Labels?.[ownershipLabel], runId, 'Refusing to stop an unowned container');
          assert.equal(current.Config?.Labels?.['com.athlix.fixture'], 'backup-restore', 'Refusing to stop a non-fixture container');
          docker(['stop', '--time=10', restoreId]);
        }
      }
    }
  }
}

module.exports = { drillEnvironment, validateSourceContainer, generatedDatabaseName, indexDefinition };
if (require.main === module) run().catch(error => { console.error(error.message); process.exitCode = 1; });
