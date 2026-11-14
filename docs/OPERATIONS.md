# ATHLIX operations and release gates

Updated 2026-11-14. This document prepares a reviewable deployment; it does not
authorize or record a production rollout, database migration or secret rotation.

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

## Startup and shutdown

Production requires an explicit MongoDB target, a securely generated JWT secret
of at least 32 characters, real Firebase configuration and an exact browser
origin allowlist. A local database fallback is development-only. Minimum length
and character diversity checks do not prove entropy; use a real secret generator.
Startup database selection times out after ten seconds and does not log URIs.

SIGTERM/SIGINT mark readiness as draining, stop realtime connections, close the
HTTP listener while current requests drain, then disconnect MongoDB. Repeated
signals share one shutdown. A fatal error makes the exit status nonzero. After
ten seconds the process force-closes transports and exits unsuccessfully. The
host termination grace period must exceed this budget. Do not run multiple Node
workers without reviewing shared rate-limit and realtime adapter/state needs.
The Python CV process is explicitly single-worker/ephemeral and needs its own
container limits; see [worker operations](../cv-service/README.md).

The implementation uses [Node's HTTP shutdown/timeouts](https://nodejs.org/docs/latest-v24.x/api/http.html)
and [Mongoose connection state](https://mongoosejs.com/docs/api/connection.html).
Signal draining is unit tested through injected lifecycle operations; a real
host rolling restart remains a staging check.

## Review before deployment

1. Select an immutable reviewed commit/artifact. Run root locked install, both
   type checks/builds, lint, Node/Python tests, browser fixtures and dependency
   audit. Preserve actual outputs and inspect CI; a local result is not CI proof.
2. Run integration tests on an isolated replica set and exercise separate
   athlete/coach/owner/organizer identities against staging Firebase and MongoDB.
   Confirm booking races, transactional rollback, registration/bracket version
   conflicts, socket isolation and expired/revoked identity handling.
3. Verify actual password-email delivery/template domains, privacy/consent,
   reviewed CV model/native imports, upload limits, deletion and restart failure.
   Do not use customer videos or production credentials as test fixtures.
4. Review legacy privileged-account provenance, long-lived browser-local JWTs,
   global revocation, unimplemented academy/member/billing operations, and
   remaining dependency findings from the audit. Do not call them complete.
5. Configure host secrets through its secret manager, exact HTTPS CORS origins,
   restricted database ingress, least-privilege database access and reviewed
   proxy hop trust. Confirm required indexes exist through an approved process;
   do not silently apply destructive migrations.
6. Assign operators for readiness/error monitoring, alerts, backups and incidents.
   Test a backup restore into a separate environment. No such drill or provider
   alert configuration is claimed by this source-code change.
7. Obtain explicit approval for the concrete deployment and any production data
   or configuration changes. A green PR never authorizes merge/deployment alone.

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
- Recheck readiness, ownership/identity negatives, a controlled booking/event
  journey and worker recovery. Record the incident, artifact IDs and actual
  recovery result. Secret rotation, account demotion, real messages and financial
  operations remain separate authorized actions.

## Known verification boundaries

Local Windows Application Control prevented launching MongoDB and a native
MediaPipe dependency. Real replica-set rollback/concurrency and actual video
inference were not validated locally. CI config supplies a disposable replica
set and Linux Python dependencies, but its actual run must be observed. No
production load test, host drain drill, restored backup, external alert delivery,
payment settlement or regulatory/security certification was performed.
