# ATHLIX setup and verification

Updated 2026-11-15 for current source. This is a development/pilot build;
successful setup does not establish production readiness. Current test counts
and latest CI outcomes are tracked in [verification](VERIFICATION.md) and
[PR #2](https://github.com/pratikcoder01/Athlix/pull/2).

## Reproducible workspace

Use Node.js 24 (`.nvmrc`), npm and Python 3.11. The root manifest requires at least
Node 22.18; CI uses Node 24. Install only from the canonical root workspace lock.
The frontend production build/start requires an explicit backend origin in
`NEXT_PUBLIC_API_URL`, or a dedicated server-only `AUTH_API_ORIGIN` override.
Use loopback only for local/test services.

```powershell
npm ci --legacy-peer-deps
$env:AUTH_API_ORIGIN = 'http://127.0.0.1:5000'
npm run typecheck
npm run lint
npm test
npm run build
npm audit --audit-level=high
```

On a POSIX shell, set `export AUTH_API_ORIGIN=http://127.0.0.1:5000` before those
checks. Use the reviewed HTTPS backend origin for a hosted build and runtime.
Do not run independent client/server installs or forced audit upgrades to bypass
failures. See [dependency review](DEPENDENCY_REVIEW.md).

## Local services and identity

1. Create `server/.env` and `client/.env.local` from the corresponding sections
   of root `.env.example`. Keep Admin credentials, JWT/CV secrets and provider
   keys server-only. `AUTH_API_ORIGIN` belongs to the frontend build/server
   configuration and overrides the shared `NEXT_PUBLIC_API_URL` destination.
2. Configure a reviewed MongoDB replica set or transaction-capable managed
   cluster. Booking, academy/member/attendance, community moderation and audited
   operator changes require transactions. A standalone MongoDB cannot prove or
   support those workflows. Deploy required unique/TTL indexes before traffic.
3. Configure the same Firebase project on both SDKs, allowed identity domains and
   password-action handler. Admin uses a protected service account or Application
   Default Credentials. Client Firebase configuration is not an Admin credential.
4. Set a securely generated `JWT_SECRET`, exact `ALLOWED_ORIGIN` browser origins
   and `AUTH_COOKIE_SAME_SITE=lax` on the API. The frontend's fixed `/api/auth/*`
   proxy preserves browser Origin, Cookie and Set-Cookie. Other APIs use the
   short-lived bearer directly. Local defaults allow localhost/127.0.0.1:3000;
   add an exact alternative port only for a reviewed local test setup.
5. Run root `npm run dev` (client 3000, API 5000 by default). Check Express
   `/api/health` for process liveness and `/api/ready` for current database/drain
   state. These probes do not verify Firebase, transactions or the CV service.

An approved Docker runtime can supply a disposable replica set, publishing
27017 only on 127.0.0.1 and initializing `rs0` with that loopback member. CI's
workflow is a reproducible example. Test suites use only `TEST_MONGO_URI`, validate
the loopback URI and create/drop their exact random test database. They never use
the application's production `MONGO_URI`.

For isolated identity acceptance use only demo project `demo-athlix`, the checked-in
`test/firebase.json` and an isolated replica set:

```powershell
$env:TEST_MONGO_URI = 'mongodb://127.0.0.1:27017/?replicaSet=rs0'
$env:FIREBASE_PROJECT_ID = 'demo-athlix'
$env:GCLOUD_PROJECT = 'demo-athlix'
npx --yes firebase-tools@15.36.0 emulators:exec --project demo-athlix --only auth --config test/firebase.json "node --test server/test/firebase-emulator.integration.test.cjs"
```

Do not supply real service-account credentials to that suite. It enforces demo
project/loopback guards and checks identity exchange, linking, reset credentials
and revocation; it does not deliver an external email. For an interactive local
demo client also set `NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-athlix` and
`NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true`; server emulator host is
`FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`. Never use emulator settings in a real
hosted identity environment. Actual latest emulator CI results must be observed.

## Account and product workspaces

- Public accounts are athletes. Professional access uses the
  [audited role CLI](ROLE_PROVISIONING.md); it defaults to a dry run. Existing
  privileged-account provenance must be reviewed rather than assumed approved.
- Sessions use memory-only 15-minute access and rotating HttpOnly cookies with
  a seven-day absolute deadline. Old 30-day/sessionless tokens no longer work;
  plan for sign-in after rollout. Linked accounts use Firebase sign-in. See
  [session/proxy deployment and recovery](SESSION_SECURITY.md).
- `/profile` edits self-reported details/achievements. `/training` manages the
  caller's private history and reads saved plans; archive is not legal erasure.
- Coaches publish stored rates/UTC availability at `/coach-settings`, manage
  bookings at `/bookings` and accepted/completed clients/private notes at
  `/clients`. `/notifications` reads the real recipient inbox; no email or push
  delivery is implied. See [workspace contracts](TRAINING_AND_CLIENTS.md).
- Academy owners/admins manage listings, members and daily attendance from
  `/academies`; archive hides the listing and pauses writes, while restore retains
  records. Review [permission/privacy and index requirements](ACADEMY_OPERATIONS.md).
- Organizers use `/tournaments` for owned events, division configuration,
  registration/withdrawal, brackets/results and unpublished-division cancellation.
  Eligibility, fees and refunds remain organizer responsibilities. Legacy bracket
  conversion is a separately reviewed [dry-run-first tool](MIGRATION_REVIEW.md).
- `/feed` supports author edits/soft removal and reports. Current administrators
  review `/moderation`; assign a human moderation owner and policy before a public
  pilot. Read [moderation limits](COMMUNITY_MODERATION.md).
- Configure genuine recovery-email delivery according to
  [password recovery](PASSWORD_RECOVERY.md). The emulator and transport fixtures
  cannot establish hosted delivery. Unlinked legacy bcrypt recovery remains limited.
- Contact only opens a user-sent draft when `NEXT_PUBLIC_CONTACT_EMAIL` is set.
  Checkout/subscriptions, federation certification and validated accuracy claims
  remain unavailable. Privacy/terms still require appropriate review.

## Optional video and provider services

Provider-backed coaching defaults off. Enable `AI_COACHING_ENABLED=true` and
reviewed provider credentials only after privacy/usefulness acceptance. Ordinary
coach discovery, deterministic brackets and existing saved-plan reads remain
available without AI. No provider acceptance is established by mock tests.

Follow [video worker setup](../cv-service/README.md) for Python requirements and
the pinned model manifest/provisioner. Set the same protected `CV_SERVICE_API_KEY`
on Express/Python and a reviewed internal `CV_SERVICE_URL` on Express. Provision
the manifest-pinned `.task` separately, record its hash/license/release approval,
and set `CV_MODEL_PATH`. Customer uploads never download a model.

Run exactly one instance/worker. Set `CV_STATE_DIR` to a private persistent local
volume for completed results to survive restarts until their original 15-minute
expiry; the system-temp default is not hosted durability. Interrupted jobs become
failed/retryable and media is removed. SQLite is not a horizontally shared queue.

`cv-service/compose.yaml` supplies non-root/read-only execution, a private 160 MiB
tmpfs, 1,536 MiB memory, two CPUs, 64 PIDs, a persistent state volume and read-only
model mount. Configure `CV_MODEL_HOST_PATH` and the service key before a reviewed
local container run. Verify state-volume ownership for UID 10001. The Render
template declares one instance and persistent disk with auto-deploy off; it is
preparation, not an approved purchase or observed deployment. Target hosts need
equivalent actual resource/disk controls and restart testing.

FastAPI `/ready` checks the lease, SQLite, key and model file. It does not prove
native inference or domain accuracy. CI includes pinned-model/generated-video
native and container smoke scripts; outcomes are tracked on the PR. Permissioned
athlete-video evaluation and hosted acceptance remain separate.

## Browser and integration checks

Root `npm test` runs source regression suites. Supplying the guarded loopback
`TEST_MONGO_URI` enables real database concurrency/rollback suites. Windows
Application Control blocks the local MongoDB executable and a native MediaPipe
dependency; do not bypass it or label skipped checks as passing.

After a production build, keep the same backend origin settings, start the client on
loopback 3100 and run the browser scripts from a second terminal:

```sh
npm run start --workspace client -- --hostname 127.0.0.1 --port 3100
# Separate terminal, repository root:
node client/test/e2e-smoke.cjs
node client/test/auth-proxy-e2e.cjs
node client/test/booking-e2e.cjs
node client/test/workspace-e2e.cjs
node client/test/academy-operations-e2e.cjs
node client/test/training-workspace-e2e.cjs
node client/test/tournament-divisions-e2e.cjs
node client/test/community-moderation-e2e.cjs
node client/test/accessibility-e2e.cjs
```

These use explicit synthetic identity/API fixtures; the auth proxy suite checks
an actual local Next rewrite against a controlled backend. They do not prove live
email, customer database, payment or model quality. Use approved Edge locally or
the CI-installed Playwright Chromium. Consult each script and current verification
for its precise boundaries; passing targeted accessibility checks is not full WCAG
or performance certification.

## Hosting preparation

Both hosts need the root lockfile/workspace install. Build/start the backend with
`npm run build --workspace athlix-server` / `npm run start --workspace athlix-server`;
build the frontend with `npm run build --workspace client`. Configure monorepo roots
explicitly. Keep frontend build and runtime origin settings consistent.
`NEXT_PUBLIC_API_URL` supplies direct bearer/realtime requests and, by default,
the same-origin auth proxy. Set `AUTH_API_ORIGIN` only when a dedicated auth
upstream is required or an explicit override is preferred.

### Vercel failure: missing backend origin

The supplied Vercel log for `5f7376e` failed while loading `next.config.ts`
because `AUTH_API_ORIGIN` was missing. It failed before page compilation;
the npm warnings were not the terminating error. The compatibility fix reuses
`NEXT_PUBLIC_API_URL` when no dedicated auth override is set. No backend address
is guessed, and production still fails when both settings are missing.

1. Open Vercel project `athlix-client`, then **Environment Variables**.
2. Set `NEXT_PUBLIC_API_URL` to the Express backend's public HTTPS origin, for
   example `https://your-api.example`, with no `/api` path. If a dedicated auth
   destination is needed, set `AUTH_API_ORIGIN` to its reviewed HTTPS origin.
3. Select the environment used by the failed deployment. Standard feature-branch
   deployments use Preview; apply Production changes only in an approved rollout.
4. Save and create a new deployment of the updated branch. Environment changes
   do not change an existing deployment. Then verify `/api/auth/session`, real
   sign-in/renewal/logout and the direct API/CORS configuration in staging.

The destination URL is public configuration, not an API credential. Keep Firebase
Admin, JWT, CV and provider secrets on their intended servers.
See [Vercel environment setup](https://vercel.com/docs/environment-variables/managing-environment-variables).

Production requires explicit `MONGO_URI`, strong JWT secret, Firebase credentials,
exact HTTPS browser origins, protected CV configuration and reviewed indexes.
Review `TRUST_PROXY_HOPS` against the actual Vercel/Render ingress chain before
changing its default zero; verify client-rate limits through the auth proxy.
Merging the deployment branch may trigger hosted auto-deploys independently of
this repository's CI. Confirm host settings and obtain the required concrete
rollout approval. No hosting setting or production deployment is applied by this
guide. Follow [operations and rollback](OPERATIONS.md).
