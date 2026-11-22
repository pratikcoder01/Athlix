const assert = require('node:assert/strict');
const { test } = require('node:test');
const { randomUUID } = require('node:crypto');
const mongoose = require('mongoose');
const { safeLocalMongoUri } = require('./helpers/localMongo.cjs');
const { connectDB } = require('../dist/config/db');

test('production startup observes provisioned API indexes without changing a fresh or conflicting catalog', {
  skip: !process.env.TEST_MONGO_URI && 'NOT RUN: loopback TEST_MONGO_URI is required', timeout: 90000,
}, async t => {
  const uri = safeLocalMongoUri(process.env.TEST_MONGO_URI);
  const dbName = `athlix_index_test_${randomUUID().replaceAll('-', '')}`;
  const target = new URL(uri); target.pathname = `/${dbName}`;
  const environment = { NODE_ENV: 'production', MONGO_URI: target.toString() };
  const providerPath = require.resolve('../dist/config/firebase');
  require.cache[providerPath] = { id: providerPath, filename: providerPath, loaded: true, exports: { authAdmin: {} } };
  require('../dist/app');
  const models = Object.values(mongoose.connection.models);
  assert.equal(models.length, 18, 'Exercise the complete API model registration');
  const observer = new mongoose.mongo.MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  let owned = false;
  t.after(async () => {
    await mongoose.disconnect();
    if (owned) {
      assert.match(dbName, /^athlix_index_test_[a-f\d]{32}$/);
      await observer.db(dbName).dropDatabase();
    }
    await observer.close();
  });
  await observer.connect();
  const database = observer.db(dbName);
  const existing = await observer.db('admin').command({ listDatabases: 1, nameOnly: true, filter: { name: dbName } });
  assert.equal(existing.databases.length, 0, 'Generated fixture namespace already exists');
  owned = true;
  const catalog = async () => {
    const collections = await database.listCollections({}, { nameOnly: true }).toArray();
    return Promise.all(collections.sort((a, b) => a.name.localeCompare(b.name)).map(async collection => ({
      name: collection.name,
      indexes: (await database.collection(collection.name).listIndexes().toArray()).sort((a, b) => a.name.localeCompare(b.name)),
    })));
  };
  await assert.rejects(connectDB(environment), /required indexes/);
  assert.equal(mongoose.connection.readyState, 0);
  assert.deepEqual(await catalog(), [], 'Rejected production startup must not auto-create collections or indexes');

  // Deliberate operator provisioning is allowed only inside this generated,
  // credential-free loopback fixture. Startup itself never invokes these writes.
  for (const model of models) {
    await database.createCollection(model.collection.name);
    const indexes = model.schema.indexes().map(([key, options]) => ({
      key, name: Object.entries(key).map(([field, direction]) => `${field}_${direction}`).join('_'), ...options,
    }));
    if (indexes.length) await database.collection(model.collection.name).createIndexes(indexes);
  }
  await database.collection('trainingentries').createIndex({ syntheticExtra: 1 });
  const before = await catalog();
  await connectDB(environment);
  assert.equal(mongoose.connection.readyState, 1);
  assert.deepEqual(await catalog(), before, 'Successful startup must preserve operator index policy');
  await mongoose.disconnect();

  const entries = database.collection('trainingentries');
  await entries.dropIndex('athleteId_1_clientRequestId_1');
  await entries.createIndex({ athleteId: 1, clientRequestId: 1 });
  const conflicting = await catalog();
  await assert.rejects(connectDB(environment), /required indexes/);
  assert.equal(mongoose.connection.readyState, 0);
  assert.deepEqual(await catalog(), conflicting, 'Startup must reject the nonunique replacement without repairing it');
});
