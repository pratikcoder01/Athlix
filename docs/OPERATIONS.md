# ATHLIX operations and release gates

Updated 2026-11-15. This document prepares a reviewable deployment; it does not
authorize or record a production rollout, database migration or secret rotation.
Current test counts and latest remote outcomes are tracked in
[verification](VERIFICATION.md) and [PR #2](https://github.com/pratikcoder01/Athlix/pull/2).
The expanded CI configuration is not evidence that its newest run succeeded.

## Health, logs and bounded requests

- `GET /api/health` returns process liveness (`alive`); it makes no dependency
  guarantee. `GET /api/ready` returns 200 only when Mongoose reports connected
  and shutdown is not draining; otherwise 503. Neither probe performs a paid
  provider call or claims the CV worker/Firebase is healthy. Mongoose connectivity
  follows its heartbeat state, so this is not a transaction/replica-set probe.
- Both probes are outside user rate-limit buckets and set `Cache-Control:
  no-store`. Point load-balancer readiness checks at `/api/ready`.
- Each HTTP request receives a generated `X-Request-ID`. JSON request logs record
  request ID, method, defined route pattern, status, duration and completion.
  They exclude arbitrary URL/query/body/authorization and caller-supplied IDs.
- Error responses include the correlation ID. Internal errors are generic;
  malformed JSON, oversized bodies, duplicate records, validation/casting and
  stale writes receive safe 400/413/409 errors. Logs record a bounded category,
  not raw database/provider error messages or stacks that can contain secrets.
  Error details require a separately reviewed, access-controlled diagnostic
  mechanism; no external telemetry integration is configured by this work.
- JSON/form bodies are limited to 128 KiB; URL-encoded forms accept at most 100
  parameters. Multipart video uses its separate authenticated 25 MiB policy.
- Node allows 15 seconds for headers, 60 seconds to receive a request and
  5-second idle keepalive. Video processing is asynchronous and separately
  bounded. General API requests allow 600/IP/15 minutes so a bounded analysis
  polling journey fits; signup/login/Firebase exchange allow 30/IP/15 minutes.
  Video submissions retain the separate five/account/15-minute policy.
- Default proxy trust is zero. Set `TRUST_PROXY_HOPS` only to a reviewed integer
  from 0–3 matching the deployed network. Blindly trusting forwarded headers can
  defeat IP rate limits. Verify platform ingress and NAT behavior in staging.
- FastAPI's private `/ready` checks its exclusive instance lease, SQLite schema,
  service key and model-file presence. It does not run inference or establish
  model quality. Node readiness does not probe this worker, Firebase, the auth
  proxy, unique/TTL indexes or transaction capability; accept these separately.

## Session and proxy rollout

- Frontend build/start requires one explicit reviewed backend origin:
  `AUTH_API_ORIGIN` takes precedence, otherwise `NEXT_PUBLIC_API_URL` is reused.
  Both require HTTPS and reject credentials/path/query/fragment; a malformed
  explicit override is rejected rather than silently selecting the fallback.
  Explicit loopback HTTP is accepted only for isolated local/CI services.
  Keep build/runtime configuration consistent; the fixed Next `/api/auth/*`
  rewrite cannot select its upstream from a caller's request.
- The proxy preserves the browser Origin, session header, Cookie and Set-Cookie.
  Production refresh cookies are host-only, Secure and HttpOnly with Path=/;
  default `AUTH_COOKIE_SAME_SITE=lax` works because auth is same-origin. Verify
  real host cookie behavior rather than relying on direct cross-site cookies.
  Configure `NEXT_PUBLIC_API_URL` for the other direct bearer/realtime APIs.
- Access JWTs last 15 minutes and are memory-only. Refresh credentials rotate,
  are hashed in MongoDB and expire absolutely after seven days. Old 30-day or
  sessionless tokens are intentionally invalidated. Plan an explicit sign-in
  transition and review rollback compatibility; do not restore old insecure
  token acceptance to avoid that transition.
- Each REST request checks the active account/session version and unrevoked
  session. Cookie renewal checks Firebase provider disabling/revocation; an
  already-issued access token can remain valid for its remaining 15 minutes
  after Firebase-only revocation. Passive socket readers are rechecked within
  30 seconds. Global sign-out and audited role changes invalidate account versions.
- Observe logout, global logout, renewal/replay, expired/revoked identities,
  legacy account linking and missing-profile recovery on staging. Verify Web
  Locks/multiple-tab and restart behavior. Linked accounts use Firebase sign-in;
  older bcrypt passwords no longer provide an alternate path. A failed server
  sign-out is shown as unconfirmed, not silently reported as success.
- Restrict access to session hashes and audit collections; create/review required
  indexes through the approved rollout process. HttpOnly limits persistent
  credential exposure but does not make same-origin XSS harmless. See
  [session limits and deployment contract](SESSION_SECURITY.md).

## Persisted operations and data handling

The application now stores private training journals/plans, coach-pair notes,
recipient inbox state, academy members/attendance, division/cancellation records,
reports and moderation/migration audits. Apply least-privilege database access,
appropriate storage/backup controls and a reviewed retention/erasure policy.
Training/academy archive and community soft removal retain records; API visibility
changes are not guarantees of physical erasure or deletion from backups.

Replica-set transactions protect booking participant reservations, academy
archive/member/attendance coordination, community parent/report/moderation writes
and approved operator audit changes. Deploy and verify unique indexes for
idempotent drafts, coach-pair notes, academy member/day records and duplicate
reports before accepting concurrent traffic. Test stale versions and rollback
against the actual managed database; ordinary readiness is insufficient.

Legacy bracket conversion uses the restricted [review tool](MIGRATION_REVIEW.md):
explicit server/database/tournament/operator/reason, dry-run default, then approved
source hash/version before apply. It refuses ambiguous/incomplete trees and
commits exact-source CAS and audit together. No production conversion, role
change, index build or account-data repair was performed by this source work.

## Startup and shutdown

Production requires an explicit MongoDB target, a securely generated JWT secret
of at least 32 characters, real Firebase configuration and an exact browser
origin allowlist. A local database fallback is development-only. Minimum length
and character diversity checks do not prove entropy; use a real secret generator.
Startup database selection times out after ten seconds and does not log URIs.
Before listening in production, startup also runs a read-only `hello` with a
five-second server/client operation budget and primary selection. It requires a
writable replica set or mongos, logical sessions and the installed driver's
supported wire version; a standalone, read-only target or failed probe causes a
safe disconnect and startup failure. This checks advertised capability without
writing application data; permissions, required indexes, feature compatibility
and actual transaction rollback still need integration acceptance. Development
can connect to a standalone for read/demo work, while transaction-backed writes
continue to require a replica set or sharded deployment. See MongoDB's
[hello command](https://www.mongodb.com/docs/manual/reference/command/hello/) and
[transaction deployment requirements](https://www.mongodb.com/docs/manual/core/transactions-production-consideration/).

SIGTERM/SIGINT mark readiness as draining, stop realtime connections, close the
HTTP listener while current requests drain, then disconnect MongoDB. Repeated
signals share one shutdown. A fatal error makes the exit status nonzero. After
ten seconds the process force-closes transports and exits unsuccessfully. The
host termination grace period must exceed this budget. Do not run multiple Node
workers without reviewing shared rate-limit and realtime adapter/state needs.
The Python CV process is single-worker/single-instance with an exclusive local
state lease. Configure private persistent `CV_STATE_DIR`; completed SQLite results
survive reopening until their original 15-minute expiry. Interrupted work becomes
failed and private media is removed. The default temporary directory is not a
hosted persistence guarantee. Never scale this state store to multiple instances
or a network filesystem; see [worker operations](../cv-service/README.md).

The supplied Docker/Compose template uses non-root/read-only execution, a 160 MiB
private tmpfs, 1,536 MiB container memory, two CPUs and 64 PIDs, with a persistent
state volume and read-only separately provisioned model. Verify state ownership
for UID 10001 and equivalent actual platform limits. A pinned manifest/provisioner
and native/container smoke scripts support reproducibility; their configuration
does not prove image execution, model usefulness or hosted persistence. Render's
template disables auto-deploy and requests one instance/persistent disk; its paid
compute declaration is not an approved purchase. Persistent-disk deploys require
an observed interruption/recovery exercise, not a seamless-deploy claim.

The implementation uses [Node's HTTP shutdown/timeouts](https://nodejs.org/docs/latest-v24.x/api/http.html)
and [Mongoose connection state](https://mongoosejs.com/docs/api/connection.html).
Signal draining is unit tested through injected lifecycle operations; a real
host rolling restart remains a staging check.

## Disposable backup/restore drill

CI runs `server/test/backup-restore.ci.cjs` against its isolated MongoDB 8 replica
set, using synthetic records only. The script requires GitHub Actions, an
explicit loopback test URI and a source container labeled for the current CI
run. It ignores `MONGO_URI`, rejects credentials and database paths, and never
loads customer data. All application model collections/indexes are initialized in a
fresh generated namespace, including private-field, archive and typed BSON
fixtures.

The drill creates an in-memory compressed binary archive with `mongodump`, then
uses `mongorestore` in a **separate newly created disposable Mongo container**.
It does not overwrite the source or use `--drop`. It compares every collection,
document, collection option and index policy, preserving compound key order.
It also observes the restored unique draft constraint rejecting a duplicate,
an academy proximity query using the restored geospatial index, and the restored
session TTL index deleting an expired synthetic session. It checks
both retained restored data and unchanged source data afterward. The generated
source namespace and owned restore container are cleaned up; a workflow cleanup
also stops this run's labeled containers after failures/timeouts.

Local guard regressions are separate from actual dump/restore execution. Check
the exact commit's CI output for `backup_restore_drill: passed`; adding this
script is not evidence that it ran. No archive or document contents are retained
as CI artifacts; output contains only aggregate results and an archive checksum.

This validates the application's schema/data/index restore path on disposable
MongoDB. It does **not** accept production backups, Atlas snapshot permissions,
encryption, retention, off-site storage, recovery times or a live rollback.
Those require a separately approved restore into the actual staging environment
and operator ownership before launch. MongoDB documents the binary archive and
index behavior in [mongodump](https://www.mongodb.com/docs/database-tools/mongodump/)
and [mongorestore](https://www.mongodb.com/docs/database-tools/mongorestore/).

## Review before deployment

1. Select an immutable reviewed commit/artifact. Run root locked install, both
   type checks/builds, lint, Node/Python tests, browser fixtures and dependency
   audit. Preserve actual outputs and inspect CI; a local result is not CI proof.
2. Observe the expanded CI's isolated replica-set, demo Auth emulator, browser and
   native/container run outcomes at the exact candidate commit. Exercise separate
   athlete/coach/owner/organizer identities against staging Firebase and MongoDB.
   Confirm booking races, transactional rollback, registration/bracket version
   conflicts, academy archive/member/attendance races, private journals/client
   notes/inbox isolation, moderation audit rollback, socket isolation and
   expired/revoked identity handling. Emulator credentials are synthetic and
   cannot establish genuine recovery-email delivery.
3. Verify actual password-email delivery/template domains, privacy/consent,
   reviewed CV model/native imports, upload limits, owner/request idempotency,
   result expiry/deletion, interrupted-job failure and persistent-volume recovery.
   Do not use customer videos or production credentials as test fixtures.
4. Review legacy privileged-account provenance, approved bracket/source decisions,
   forced sign-in/session compatibility, billing/legal boundaries and remaining
   dependency findings. Session, academy and moderation source implementations
   do not replace live acceptance or human policy/support ownership.
5. Configure host secrets through its secret manager, exact HTTPS CORS origins,
   restricted database ingress, least-privilege database access and reviewed
   proxy hop trust. Confirm required indexes exist through an approved process;
   do not silently apply destructive migrations.
6. Assign operators for readiness/error monitoring, alerts, backups, moderation,
   member privacy/retention and incidents.
   Test a real hosted backup restore into a separate approved environment. The
   disposable synthetic CI drill above does not replace that acceptance; no
   provider alert configuration is claimed by this source-code change.
7. Obtain explicit approval for the concrete deployment and any production data
   or configuration changes. A green PR never authorizes merge/deployment alone.
   Inspect Vercel/Render branch auto-deploy settings before a merge; a merge to a
   deployment branch can trigger host hooks outside this repository's CI.

## Rollback procedure

- Record the current and candidate commit, dependency lockfile, host settings and
  database compatibility before rollout. Keep the last reviewed safe artifact.
- If readiness or critical flows fail, stop new traffic to the affected feature
  or withdraw the candidate using the host's reviewed traffic controls. Inspect
  correlation IDs and safe logs before retrying.
- Redeploy a reviewed compatible safe artifact only after authorization. Do not
  revert to the known privilege-escalation/private-room vulnerabilities merely
  because they are older. Prefer disabling an affected endpoint if no safe
  previous artifact exists.
- These changes add models and strict policies; no production migration was
  executed. Review documents/index compatibility before rollback. Back up and
  approve any data repair separately; never drop collections or force-push Git
  to achieve a rollback.
- Preserve compatibility with session version/revocation state, protected journal/
  member/moderation data and the CV state volume. A worker restart fails active
  work rather than re-running private media. Do not delete the SQLite volume as
  a generic recovery step or claim API result expiry erased platform backups.
- Recheck readiness, ownership/identity negatives, a controlled booking/event
  journey and worker recovery. Record the incident, artifact IDs and actual
  recovery result. Secret rotation, account demotion, real messages and financial
  operations remain separate authorized actions.

## Known verification boundaries

Local Windows Application Control prevented launching MongoDB and a native
MediaPipe dependency; the local Docker daemon is not an observed container
runtime. Expanded real database/emulator/native/container suites must be observed
in their CI environment, independently of local unit/fixture checks or an older
green commit. A generated-video runtime smoke is not a permissioned athlete
benchmark. No production load test, host drain drill, restored hosted backup, external alert delivery,
payment settlement or regulatory/security certification was performed.
