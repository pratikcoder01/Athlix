# Reviewed collection and index provisioning

Production startup disables Mongoose automatic collection/index creation. After
the topology check, it reads the index catalog for every model registered by the
API before opening its HTTP listener. A fresh database therefore fails startup
until an operator provisions the reviewed collections and indexes separately.
The role-provisioning CLI also disables automatic collection/index creation in
both dry-run and apply modes; bracket review already does so.

## What startup requires

Every API collection must exist with its intrinsic `_id_` index, including
`bookingschedulelocks`, which declares no secondary indexes. Every index from
each registered model's `schema.indexes()` must have the same ordered fields,
directions/type, unique/sparse policy and TTL value. In particular:

- Sparse unique email, phone and Firebase UID indexes preserve account identity.
- Unique profile/coach-profile user IDs, training draft IDs, coach/athlete note
  pairs, academy member/day records, community reports and moderation audit
  report IDs enforce concurrency and idempotency requirements.
- `authsessions.expiresAt` requires `expireAfterSeconds: 0`. Authorization still
  checks expiry independently because TTL cleanup is asynchronous.
- `academies.location` requires its `2dsphere` index; declared list/query indexes
  are required as well.

Partial, hidden, unfinished, preparatory-unique or conflicting collation indexes
cannot substitute for required indexes. Current schemas use simple collation;
omitted collation and explicit `{locale: 'simple'}` are equivalent. Generated
index names and background/version metadata do not determine compatibility.
Additional operator indexes are allowed. Startup never creates, drops, rebuilds
or repairs indexes, nor reads application documents during this gate.

The native `listIndexes` cursor command requests `includeBuildUUIDs: true` so
unfinished builds cannot masquerade as completed constraints. Each collection
uses primary selection and one five-second client cursor budget covering every
batch, with a bounded server command. Checks run concurrently. Missing metadata,
insufficient catalog permissions, timeout or any mismatch causes a sanitized
startup failure and disconnect. Unsupported catalog commands also fail closed.
An empty model registry fails rather than silently skipping verification.

## Operator preparation and approval

Review the exact release's `server/src/models` and their collection names and
`schema.indexes()` output. The API currently registers 18 models with 43 declared
secondary indexes. The two operator-only audit models in `server/src/models`
bring the complete source catalog to 20 collections and 45 secondary indexes;
review/provision their collections and indexes before using their operator tools.
Do not infer a complete manifest from only the examples below.

Before approved provisioning, select the exact database and immutable release,
inspect existing indexes and duplicate/invalid data, arrange a backup/restore
plan and build window, and review resource impact. Unique index creation can fail
on existing duplicates; a TTL index can begin deleting expired records. Neither
condition authorizes automatic data repair. Keep DDL privileges separate from the
application credential, which needs catalog-read access plus its reviewed data
permissions. Operator tools do not provision their own schema.

These are **mongosh review templates**, to be adapted into an explicitly approved
operator change against an already selected target. They were not executed on a
production database:

```javascript
if (db.getName() !== 'REVIEWED_DATABASE') throw new Error('Wrong target');
// Read-only review; listIndexes reports unfinished builds as wrappers.
db.runCommand({ listIndexes: 'trainingentries', includeBuildUUIDs: true });

// Separately approved writes, only after catalog/data/build-window review.
// createCollection is needed only if the reviewed collection is absent.
db.createCollection('trainingentries');
db.trainingentries.createIndex(
  { athleteId: 1, clientRequestId: 1 }, { unique: true }
);
db.createCollection('authsessions');
db.authsessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

Provision the complete reviewed catalog, await acknowledged build completion,
then start the reviewed release and verify readiness and concurrent write flows
in staging. A startup pass observes the catalog at that moment; it cannot prevent
a later privileged operator from altering it or establish transaction permissions,
backup acceptance or production rollout approval. Do not use `syncIndexes()` as
a startup repair because it can drop operator-managed indexes.

## Verification boundaries

Unit tests cover actual API model registration, ordered keys, unique/sparse/TTL
semantics, unfinished builds, conflicting options, bounded reads, sanitization,
disconnects and role CLI connection options. The opt-in
`server/test/index-readiness.integration.test.cjs` uses only a generated loopback
database: fresh startup fails without DDL, explicit synthetic provisioning passes,
and replacing a required unique index with a nonunique one fails without repair.
It skips without `TEST_MONGO_URI`; a local skip does not establish real MongoDB
acceptance. The initial automated phase did not connect to a production database.
The later owner-approved hosted inspection and additive 10-collection/21-index
provisioning are recorded in [HOST_ROLLOUT_REVIEW.md](HOST_ROLLOUT_REVIEW.md);
the actual production verifier passed against that catalog. This does not imply
permission for future DDL or acceptance of a full production restore.

The build-info format is supported from
[MongoDB 4.2](https://github.com/mongodb/mongo/blob/r4.2.0/src/mongo/db/commands/list_indexes.cpp#L61-L86)
through [MongoDB 8.0](https://github.com/mongodb/mongo/blob/v8.0/src/mongo/db/commands/list_indexes.cpp#L140-L168),
matching the existing wire-version minimum. See also
[Mongoose initialization](https://mongoosejs.com/docs/api/model.html#Model.init())
and [MongoDB createIndexes](https://www.mongodb.com/docs/manual/reference/command/createIndexes/).
