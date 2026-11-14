# ATHLIX setup and verification

Updated 2026-11-14. This is a development/pilot build; completing setup does not
establish production readiness. See [the audit](PRODUCT_AUDIT.md),
[operations](OPERATIONS.md), and [dependency review](DEPENDENCY_REVIEW.md).

## Reproducible workspace

Use Node.js 24 (the `.nvmrc` version), npm and Python 3.11. The root manifest's
minimum supported Node version is 22.18; CI and the local review use Node 24.
Install from the repository root using its single workspace lockfile:

```sh
npm ci --legacy-peer-deps
npm run typecheck
npm run lint
npm test
npm run build
npm audit --audit-level=high
```

The peer-resolution flag is part of this repository's locked recipe. Do not run
independent client/server installs or `npm audit fix --force` to bypass a failure.
See the dependency review for reviewed overrides and remaining moderate findings.

## Local services

1. Create `server/.env` and `client/.env.local` from the appropriate sections of
   the root `.env.example`. Do not copy server secrets into a client file.
2. Configure a reviewed MongoDB target. Booking and role provisioning use
   transactions: the database must be a replica set or a transaction-capable
   managed cluster. A standalone local MongoDB is insufficient for those writes.
3. Configure the same Firebase project in the server/client SDKs. The Admin SDK
   uses either a service-account secret or Application Default Credentials.
   Public Firebase client configuration is not an Admin service account.
4. Set a securely generated `JWT_SECRET`, and exact `ALLOWED_ORIGIN` browser
   origins. Development defaults allow localhost/127.0.0.1 on port 3000 only.
5. From the repository root, run `npm run dev`. The client runs on port 3000 and
   Express on port 5000 by default. Check `/api/health` for process liveness and
   `/api/ready` for current database connectivity/drain state.

For a local disposable replica set, a developer with an approved Docker runtime
can start MongoDB with `--replSet rs0 --bind_ip_all`, publish port 27017 **only on
127.0.0.1**, and initialize member `127.0.0.1:27017` using `rs.initiate`. Use the
CI workflow as a reproducible example. Do not expose a development database to
the public network or reuse production credentials for tests.

For the Firebase Auth Emulator, use the same test project ID on both SDKs, set
`FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099` on the server and
`NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true` on the development client. Provision test
users in that emulator. Emulator installation and live identity flows are not
verified by transport-mocked unit tests.

## Account and product setup

- New public accounts are athletes. Approved professional roles use the
  [audited operator CLI](ROLE_PROVISIONING.md). Dry-run first; applying a role
  changes a database and needs the operator's separately authorized target.
- Coaches publish an explicit UTC availability schedule and stored hourly rate
  through `/coach-settings`. Legacy schedules remain unpublished until reviewed.
  Bookings quote the stored rate; sending a client price cannot override it.
- Organizers use `/tournaments` to publish, register athletes, generate a
  deterministic bracket and record results. Read [event limits](TOURNAMENTS.md).
- Configure Firebase's recovery-email handler according to
  [password recovery](PASSWORD_RECOVERY.md). Real email delivery is a separate
  staging check. Firebase cannot reset an unlinked legacy bcrypt password.
- Contact submission opens a user-sent email draft only when a reviewed
  `NEXT_PUBLIC_CONTACT_EMAIL` is configured. It is not an email-delivery service.
- Checkout/subscriptions, federation certification, verified commercial traction
  and a validated model-accuracy benchmark are unavailable.

## Optional video worker

Experimental provider-backed coaching is separate from the video worker. It is
disabled by default. Only after reviewing provider access/privacy and evaluation,
set `AI_COACHING_ENABLED=true` plus the chosen provider keys in `server/.env`.
Without explicit opt-in the plan, match and nudge routes return unavailable; the
ordinary published-coach directory and deterministic event brackets still work.
Requests/outputs are validated and limited to five requests/account/15 minutes.
No provider acceptance or coaching usefulness is established by mock tests.

Follow [`cv-service/README.md`](../cv-service/README.md) to create its Python
environment, install constrained requirements and supply a reviewed MediaPipe
model file. Set the same server-only `CV_SERVICE_API_KEY` on Express and Python,
and `CV_SERVICE_URL` on Express. No shared key belongs in a `NEXT_PUBLIC_*` value.
The browser uses authenticated `/api/cv` routes; do not expose the worker as an
unauthenticated public upload API.

Run one worker/instance. Jobs/results are ephemeral; restarting it loses jobs.
Container memory limits, reviewed model/video fixtures and native inference on
the target host remain release gates. The local Windows review could run the
Python API/scoring tests, but Application Control blocked a native dependency.

## Integration and browser checks

Ordinary tests mock third-party providers and database operations where noted.
Run the opt-in transaction suite only against an isolated loopback replica set:

```powershell
$env:TEST_MONGO_URI = 'mongodb://127.0.0.1:27017/?replicaSet=rs0'
npm test
Remove-Item Env:TEST_MONGO_URI
```

The suite validates the test target and creates its own disposable database;
never use `MONGO_URI` to select its target. The real local replica-set check was
**NOT RUN** because Windows Application Control blocked the MongoDB executable.
CI is configured to supply an isolated replica set; inspect the actual CI result.

After a client build, start it on loopback port 3100 and run:

```sh
npm run start --workspace client -- --hostname 127.0.0.1 --port 3100
# In another terminal, from the repository root:
node client/test/e2e-smoke.cjs
```

The browser script uses API/Firebase transport fixtures to exercise actual UI
request wiring and responsive layouts. It does not verify real email delivery,
MongoDB persistence, payment settlement, or native video inference. On Windows it
uses an approved installed Edge browser; CI installs Playwright Chromium.

## Hosting preparation

Keep the repository root lockfile available to both builds. Backend preparation
is `npm ci --legacy-peer-deps` then `npm run build --workspace athlix-server`;
start with `npm run start --workspace athlix-server`. Frontend preparation uses
the same root install then `npm run build --workspace client`. Configure each
host's monorepo workspace/root settings explicitly rather than assuming a
nonexistent root `vercel.json` or a stale subdirectory lockfile.

Set `NODE_ENV=production`, explicit `MONGO_URI`, a securely generated secret of
at least 32 characters, real Firebase credentials, and exact HTTPS client origins.
Review proxy topology before configuring `TRUST_PROXY_HOPS`; default zero does
not trust arbitrary forwarding headers. Restrict database ingress to required
application infrastructure. No deployment or production setting was applied by
these instructions. Follow the [release and rollback gates](OPERATIONS.md).
