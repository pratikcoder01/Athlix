# Hosting rollout review

Updated 2026-11-22, Asia/Calcutta. The owner approved controlled recovery,
backup/schema preparation, the remaining release work and the specific Vercel
configuration replacement/production promotion. No paid service was approved.
Source remains on `codex/athlix-market-ready`; `main` has not been merged.

## Current deployed evidence (2026-11-22)

Both the production frontend at `https://athlix-client.vercel.app` and the new
Render API at `https://athlix-api-8ded-256083.onrender.com` are deployed from
`24aafcc7f2e70e557e30cc4014fec5c8c2a9ac32`. The service hostname retains its
original release label; its running revision is the corrected candidate.

- [PR CI 44987854947](https://github.com/pratikcoder01/Athlix/actions/runs/44987854947)
  and [push CI 44987850735](https://github.com/pratikcoder01/Athlix/actions/runs/44987850735)
  both passed at that exact commit: **506 JavaScript and 37 Python tests** in
  each run, both builds, lint/types, all ten production browser suites,
  30 accessibility cases, 63 production hydration visits and 189 development
  visits. The local suite passed **446 JavaScript tests**, with nine explicit
  service-dependent skips. Seven moderate dependency findings remain; the
  high/critical gate passed.
- The approved encrypted local backup, **10 new collections / 21 indexes** and
  **20-model / 45-secondary-index** catalog verification are complete. The
  restricted runtime identity has data access to the 18 API collections and
  catalog-read privileges without schema-management privileges. The backup's
  device/account and restore limits below still apply.
- The owner removed the world-access entry after the narrower provider/operator
  entries were prepared. A fresh backend process and connection pool then
  connected successfully under the restricted network and runtime identity.
  All five hosted preflight contracts passed again: liveness, readiness, exact
  allowed-origin CORS, rejected untrusted-origin CORS and the frontend document.
- Expanded actual HTTPS acceptance passed **66 assertions across 106 recorded
  API requests**: Firebase password exchange, cookie rotation/replay and logout,
  audited QA role/session invalidation, public-profile privacy, booking prices
  and conflicts, accepted-booking client notes and private training/community.
  Two temporary athletes completed division registration, bracket publication,
  match results and event completion. Academy member permission, unique codes,
  versioned deactivation, daily attendance and saved operational counts passed.
  Ownership, stale-version and invalid-transition rejections remained enforced.
- The corrected hosted browser run passed **26 session checks**, including real
  Firebase/password login, reload/rotation, logout, cookie clearance, rejection
  of the old cookie/access token and a signed-out reload. It also passed
  **13 recovery UI checks** using an actual Firebase action code: visible password
  update, removal of the one-time code from the URL and no runtime/hydration
  errors. The expanded run's outer assertions also verified pre-reset session
  rejection, old-password rejection and successful new-password exchange.
  The earlier logout body could not be read through CDP; the independent HTTPS
  JSON contract and actual browser session-state checks passed. No recovery
  email or SMS was sent, so delivery/template acceptance is still separate.
- The expanded run removed all **five** temporary Firebase/application identities
  and their owned artifacts, including 12 sessions, coaching notes, the event,
  academy, member and attendance. Three labeled role-audit rows were retained;
  earlier role-fixture runs likewise retained their audits. A subsequent read-only
  runtime check found only the four preexisting athlete accounts and reconfirmed
  bounded privileges/catalogs. Original user records were preserved.

After a long pause, expired temporary operator ingress prevented an initial run
from creating any fixtures. A new four-hour narrow entry restored test access
without restoring world access or changing other rules. A bounded public-host
attempt after the pause also returned a failure; the subsequent five-contract
preflight and complete authenticated run passed without application/settings
changes. These checks do not establish continuous availability. Free-host cold
starts and bounded session timeouts remain operational limits.

The old vulnerable Render service remains suspended. Paid CV hosting, a
permissioned video benchmark, real support/moderation ownership and completed
release policies remain outside these results. Checkout stays disabled until
the owner decides prices; sample policy details remain explicitly labeled drafts.

## Initial approved rollout at `8ded4414` (2026-11-21)

- The old Render API remains suspended. Its June build is a historical reference,
  not an approved rollback: it contains the authorization defects fixed here.
- The owner resumed the existing Atlas free cluster. A native metadata connection
  verified the actual configured database without changing its namespace. An
  encrypted Windows-current-user local backup passed decryption/hash verification
  and `mongorestore --dryRun`; no plaintext archive was saved. This is not an
  off-device disaster-recovery solution or a completed full production restore.
- The reviewed additive operation created **10 collections and 21 indexes**.
  All **20 model catalogs / 45 declared secondary indexes** then passed the exact
  production verifier. No existing records, collections or indexes were removed.
- A new cluster-scoped runtime database identity has CRUD access to the 18 API
  collections and catalog-read privileges, without schema-management privileges.
  Read-only effective-privilege and index checks passed. Existing users' roles
  and credentials were not changed; the bounded inventory found no preexisting
  privileged application accounts.
- A new **free** Render API was built from immutable `8ded4414` at
  `https://athlix-api-8ded-256083.onrender.com`. It uses repository-root locked
  installation, Node 24, production mode, exact browser origins, secure cookies,
  `/api/ready`, the restricted database credential and automatic deploys disabled.
- Vercel's old public API address had legacy Secret classification. Its CLI
  required explicit human confirmation before removal. After owner approval,
  only `NEXT_PUBLIC_API_URL` was replaced as public Config for production and
  preview; all other values and SSO protection were preserved. The promoted
  production build `dpl_4pYAdxndfNV9StWcrf2jnxxe5KMZ` was READY at `8ded4414`.
  Public compiled assets reference the new API and no longer reference the old
  suspended service. All five credential-free host preflight contracts passed.
- The new API's two provider-reported outbound ranges and temporary operator
  access were added before network restriction. The owner removed only the
  `0.0.0.0/0` rule in Atlas after single-entry CLI calls failed authentication.
  The four narrower entries were preserved exactly; a fresh operator database
  connection passed. Fresh backend deployment/connection acceptance was pending
  at this stage; the 2026-11-22 evidence above records its completion.

Actual HTTPS Firebase/password and session acceptance used four new, clearly
marked QA identities. Cookie issuance, rotation, replay rejection, role/session
invalidation and identity checks passed before profile projection acceptance
failed: Mongoose's `select: true` adds `sessionVersion` to an inclusion query.
The later `24aafcc` fix removes forced schema inclusion while retaining normal auth
selection and serializes an explicit public user DTO. Do not weaken the privacy
assertion to accept the internal field. The failed run cleaned up all QA users
and their owned artifacts, retaining only three labeled role-audit records;
original user records were untouched. Final corrected-run and deployment
outcomes are recorded on [PR #2](https://github.com/pratikcoder01/Athlix/pull/2).

Eight hosted public route/viewport visits passed main/heading, layout and password
toggle checks with no runtime or hydration errors. The first mobile visit also
showed a recoverable session timeout; subsequent direct/proxied no-cookie checks
returned the expected 401 promptly. Navigation-aborted bootstrap bodies are not
counted as successful session acceptance. The `24aafcc` correction makes timeout
copy actionable while preserving bounded requests, error reporting and Retry.

Operational receipts, account-bound backup, credential material and IP details
remain in operator-private storage outside Git. Runtime secrets are never printed
or committed. A temporary credential config used by the backup tool had verified
restricted Windows permissions and was removed after archive validation.

## Initial discovery before approved recovery

| Component | Observation |
| --- | --- |
| Vercel project | `athlix-client`, project `prj_Ix66X2kDVsKhApEIHgkEoDg8qosV`; production branch `main` |
| Existing preview | Ready at `4b49f14`; branch `codex/athlix-market-ready`; output `.next` |
| Frontend API configuration | `NEXT_PUBLIC_API_URL` is configured for production and preview. No dedicated auth override was present; the compatibility fix uses the existing value. Public production assets reference `https://athlix-9dc0.onrender.com`. |
| Render API | `Athlix`, service `srv-d8ud9ijtqb8s73b4jdog`, repository `pratikcoder01/Athlix`, branch `main`, root `server`, free Node plan, auto-deploy enabled |
| Live backend revision | Render reports its last live deployment as `02d093d4faa5b5162c84889b32be8db542b89f1f`, completed 2026-06-26. This does not match the new preview's API contracts. |
| Health configuration | No explicit Render health-check path was configured. Read-only health/readiness/CORS requests timed out without an HTTP status. This does not identify a database, routing or application failure. |
| Direct environment settings | Ten entries were inspected. `MONGO_URI`, JWT and matching Firebase configuration are present. No direct `ALLOWED_ORIGIN`, `CV_SERVICE_URL` or `CV_SERVICE_API_KEY` entry was present. Effective inherited configuration must also be reviewed before rollout. |
| Database targeting | The stored SRV URI has credentials but no explicit database path. Do not replace it with a guessed database name. A local read-only metadata attempt failed during SRV DNS resolution; no application documents were read or changed. |
| CV hosting | No matching ATHLIX CV service was found in the authorized Render workspace. The supplied CV template has not been deployed. |

The initial inspections were read-only. The explicitly approved execution
above supersedes their live-state observations. No billing setting or email
template was changed.

An earlier `vercel curl` preview-access attempt automatically created a project
automation bypass credential. It was immediately revoked after matching its
owner, creation time and scope. Verification showed no remaining automation
secret and unchanged SSO protection. Do not use that command as a supposedly
read-only probe. The CLI credentials authorized by the owner remain separate
from deployment-protection settings.

## Reusable rollout prerequisites

Before changing the existing live service:

1. Select the exact passing candidate commit from PR #2 and record the current
   Render deployment as the rollback reference. Reconfirm the service's current
   revision and any traffic/users before acting.
2. Verify the intended database and identity project, effective environment,
   access permissions, retained data and a usable backup/restore procedure.
   Neither the disposable CI restore drill nor a local DNS failure proves the
   condition of the live database.
3. Review all required collections/indexes from `docs/INDEX_READINESS.md`,
   including operator audit collections. Production startup now performs only
   read-only verification and will reject incomplete/conflicting catalogs. Any
   provisioning is a separately approved, additive operator action. Do not drop
   indexes, delete duplicate records or change database namespaces automatically.
4. Set exact reviewed browser origins for the intended deployment. Known origins
   are production `https://athlix-client.vercel.app` and the stable branch preview
   `https://athlix-client-git-codex-athli-f126ce-nagralep233-1977s-projects.vercel.app`.
   Keep build/runtime API settings consistent and verify the Firebase authorized
   domains before Google/phone acceptance. No wildcard origin is proposed.
5. Configure `/api/ready` as the service readiness path and deploy the immutable
   approved backend candidate. Confirm root/workspace installation and start
   commands before changing their current values. The new session contracts
   deliberately require existing users to sign in again.
6. Verify liveness, readiness, CORS, protected unauthenticated routes and the
   authorized preview's auth-cookie path. Then use explicitly approved test
   accounts/tenants for login, reload/renewal, logout, bookings and role isolation.
   No external recovery email is sent without an approved test recipient.
7. Stop/roll back if the preconditions or checks fail. A restart or a green
   frontend build cannot substitute for backend/database acceptance.

An isolated staging backend/database/identity setup is preferable when the
existing service contains real traffic or records. Creating that setup requires
review of its targets, credentials, costs and separation from production. No
existing production data is silently copied into staging.

## Optional hosted CV service and cost

The reviewed template selects one `1c-2g` service and a 1 GB persistent job-state
disk. The public [Render pricing page](https://render.com/pricing), checked during
this review, lists service compute at **US$25/month** for 1 CPU/2 GB and persistent
disk storage at **US$0.25/GB/month**. The indicative additional base cost is
**US$25.25/month**, before taxes, bandwidth/other usage and any workspace charges.
Confirm the actual checkout/account price before creation; this document is not
an authorization to incur it.

If hosting is approved:

- Build the explicit opt-in image with its hash-verified public model. The fixed
  image path is `/models/pose.task`; runtime uploads never download weights.
- Verify model release/license review, non-root access, persistent-volume write
  permissions, one-instance constraints and actual host resource/timeout behavior.
- Generate a new random server-only service credential, store it only on the
  Express API and CV service, and configure a reviewed reachable service URL.
  Prefer supported private networking; retain service authentication in all cases.
- Exercise generated non-person video rejection, owner isolation, retries,
  deletion, expiry and restart persistence without customer videos. A single-CPU
  image smoke test in CI verifies native execution, not real athlete accuracy or
  production throughput.

If spending is not approved, keep hosted CV unavailable and disclose that state.
Checkout and subscriptions stay disabled under the owner's separate decision.
Sample policy details remain drafts for later owner/legal replacement.
