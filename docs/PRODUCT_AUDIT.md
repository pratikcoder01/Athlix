# ATHLIX product audit

Audit started 2026-11-13 against GitHub `main` at `870942cbf5378a40e3a3510801182c1c5d22ca5f`.
Working branch: `codex/athlix-market-ready`. The downloaded ZIP is preserved separately.

## Current remediation status — 2026-11-15

The table below preserves the **initial** findings and their initial state. The
implementation has since advanced through the commits in [the roadmap](ROADMAP.md).
Use [verification](VERIFICATION.md) for current test evidence and
[feature status](FEATURE_STATUS.md) for implemented versus unavailable workflows.

- Closed public role escalation, unsafe Firebase legacy linking, disabled-user
  access, arbitrary private socket rooms, cross-owner tournament writes and
  production wildcard CORS. Provider coaching defaults off and allowlists public
  coach data instead of contacts, draft controls or invented ratings.
- Replaced the fake reset success with actual Firebase verification/confirmation.
  Added 15-minute memory-only access JWTs, hashed rotating HttpOnly refresh
  credentials, seven-day absolute sessions, current REST/socket session checks,
  global revocation, fixed-origin Next auth proxy and missing-profile recovery.
  Linked accounts cannot use an older bcrypt password to bypass Firebase recovery.
- Persisted server-priced UTC booking and participant transaction locks remain
  authoritative. New private training history/plan reads, coach relationship/client
  notes and recipient-scoped stored notifications complete additional workspaces.
- Academy owners/admins can edit/publish/archive/restore listings, manage private
  members and daily attendance, and read actual counts. Tenant filters, versions,
  unique indexes and academy write coordination protect concurrent operations.
- Events support divisions, bounded enrollment, prepublication athlete withdrawal,
  versioned brackets/results and reasoned cancellation of an unpublished division.
  The unsafe legacy migration was replaced by an explicit-target, dry-run-first
  full-tree review tool with hash/version CAS and transactional source-preserving
  audit. No existing customer records were migrated.
- Text community adds author-only versioned edits/soft removal, bounded reports,
  private admin review and transactional hide/dismiss audits. Hidden/deleted
  content is excluded from member reads/counts; human policy ownership remains
  separate from these implementation controls.
- Video jobs now use a bounded private SQLite store under an exclusive single
  instance lease. Completed results survive reopening on a persistent local
  volume until expiry; interrupted work fails explicitly and temporary media is
  removed. Owner/request/video retries are idempotent. A pinned model manifest,
  provisioner and non-root resource-limited container templates are supplied.
- Unsupported marketing, partner, billing, certification and revenue claims were
  removed. Factual pitch materials and explicit unreviewed policy notices remain.
- Latest source checks, test counts, audit findings and browser evidence are
  recorded in [VERIFICATION.md](VERIFICATION.md) and
  [PR #2](https://github.com/pratikcoder01/Athlix/pull/2). Earlier green runs apply
  to their recorded commits only. CI now includes expanded isolated database
  suites, demo Firebase Auth recovery/identity acceptance, browser/accessibility
  fixtures, pinned-model native smoke and container resource/restart checks;
  at `8bea3de`, native/container checks passed while JavaScript jobs failed in
  browser checks. Database/emulator/build stages passed. The production hydration
  failure and final source acceptance remain active work, recorded in verification.

Remaining release gates include actual hosted identity/email/provider and HTTPS
cookie/proxy acceptance, existing privileged-account provenance, reviewed indexes
and legacy-source decisions, target-host native/container/disk acceptance,
permissioned kata evaluation, human support/moderation ownership, legal
review, backup restoration, full accessibility/performance qualification and
supervised pilot evidence. Single-instance SQLite is not a horizontally shared
job service, and archive/soft removal is not permanent personal-data erasure.
Checkout remains disabled by owner decision until prices are decided; billing
is an intentional deferral rather than a feature enabled by this increment.

## Evidence and scope

This is an engineering audit of source code and local checks, not a production penetration test or a certification. No production accounts, database, billing, email delivery, or partner credentials were used. Findings marked **confirmed** have a direct source-level reproduction. Remaining risks need further investigation or integration tests.

| Priority | Finding and reproduction | Evidence | State |
| --- | --- | --- | --- |
| P0 | **Confirmed:** legacy signup accepts `role: admin`; Firebase account creation persists an arbitrary supplied role. Submit a privileged role to either public registration endpoint. | `server/src/utils/validation.ts`, `controllers/authController.ts`, `controllers/firebaseAuthController.ts` | Security fix in progress: athlete-only signup, trusted audited provisioning, regression tests. |
| P0 | **Confirmed:** a Firebase identity can link an existing legacy account using an email without proving it is verified. Inactive accounts remain eligible for token authentication. | `controllers/firebaseAuthController.ts`, `middleware/authMiddleware.ts` | Security fix in progress. |
| P0 | **Confirmed:** unauthenticated Socket.IO clients can `join_user_room` with another user's ID and receive private booking notifications. HTTP CORS defaults to `*`. | `server/src/index.ts`, `server/src/app.ts`, `client/src/context/SocketContext.tsx` | Authenticated socket/room and origin policy fix in progress. |
| P0 | **Confirmed:** organizer A can update organizer B's brackets; AI seeding can overwrite a tournament without ownership checks. | `controllers/tournamentController.ts:updateTournamentBrackets`, `controllers/aiController.ts:seedTournamentBracket` | Pending ownership, validation, concurrency and regression tests. |
| P0 | **Confirmed:** the Python analysis/status endpoints are unauthenticated; uploads and decoded-frame lists are unbounded. | `cv-service/main.py`, `cv-service/cv/pose_detector.py`; `client/src/app/kata/page.tsx` calls Python directly | Authenticated proxy and bounded isolated processing in progress. |
| P0 | **Confirmed:** reset-password displays success without changing a password. | `client/src/app/(auth)/reset-password/page.tsx:onSubmit` | Pending real Firebase action-code verification and confirmation. |
| P0 | **Confirmed:** clients choose booking prices; overlap check and insertion are separate operations; arbitrary status changes lack a transition policy. | `controllers/bookingController.ts`, `models/Booking.ts` | Pending server pricing, atomic reservation and transition tests. |
| P1 | **Confirmed:** tournament/profile/academy searches place unescaped and unbounded input into regex queries and do not paginate. | `controllers/{tournament,profile,academy}Controller.ts` | Pending bounded literal queries and pagination. |
| P1 | **Confirmed:** `validateBody` discards parsed data, so defaults and unknown-field stripping are not applied to controllers. | `server/src/utils/validation.ts` | Fix included in registration milestone. |
| P1 | **Confirmed:** AI helper imports undeclared `node-fetch` (currently supplied transitively). Responses are unchecked, calls have no timeout. | `server/src/utils/anthropic.ts`, `server/package.json` | Backend builds today; native-fetch and validation hardening pending. |
| P1 | **Confirmed:** current dependency audit reports 37 production advisories (3 critical, 19 high, 15 moderate). | `npm audit --omit=dev --json`, 2026-11-13 | Pending reviewed updates; do not use blanket forced upgrades. |
| P1 | **Confirmed:** tournament page uses hard-coded events, registration counts, results and `tournament_1`; gyms uses `mockGyms`. | `client/src/app/tournaments/page.tsx`, `client/src/app/gyms/page.tsx` | Pending persisted directory/registration flow and explicit demo states. |
| P1 | **Confirmed:** marketing/pricing includes unsupported traction, review, partner, billing and compliance claims; analytics labels estimated volume as revenue. | `client/src/app/{page,pricing,about,organizer}/page.tsx`, shared marketing components | Pending truthful copy/feature status and factual pitch materials. |
| P2 | **Confirmed:** CI only builds the client, uses legacy DojoPro name, and installs without a locked `ci` workflow. | `.github/workflows/main.yml` | Pending backend/security/Python checks and smoke tests. |
| P2 | **Needs investigation:** browser-local JWTs with long validity increase XSS/session theft exposure; no global revocation workflow. | `client/src/store/authStore.ts`, `server/src/config/jwt.ts` | Document tradeoffs and design session rotation/revocation before release. |
| P2 | **Needs integration evidence:** academy member records, approval operations, notifications persistence/recovery, timezone availability and full mobile accessibility. | routes, models and role dashboards | Not verified end to end. |

## Initial local baseline (2026-11-13)

Environment: Windows, Node 24.18.0, npm 11.16.0, Python 3.11.9. No real service credentials supplied.

| Check | Observed result |
| --- | --- |
| `npm ci --legacy-peer-deps --no-audit --no-fund` | PASS, 871 packages. Install warned about deprecated dependencies and six unapproved dependency lifecycle scripts. |
| `npm run build --workspace athlix-server` | PASS. The undeclared fetch import currently resolves transitively; this does not make the dependency contract reliable. |
| `npm run build --workspace client` | PASS, 26 static pages generated. Warned about multiple lockfiles/workspace root detection; build skips lint by configuration. |
| `npm run lint --workspace client` | PASS with 0 errors / 58 warnings (unused variables, image optimization, hook dependencies). |
| `npm audit --omit=dev --json` | FAIL: 37 advisories; findings are a dated snapshot, not a clean security bill of health. |
| DB-backed signup/booking/tournament journeys | NOT RUN: isolated test database and Firebase project/emulator not configured yet. |
| Production services, payment, mail, deployment | NOT RUN: intentionally outside local verification. |

## Initial architecture and data flows (historical baseline)

- Next.js client authenticates with Firebase, exchanges an ID token for an API JWT, and stores API identity in Zustand. Legacy bcrypt signup/login also exists. Express middleware resolves the user in MongoDB.
- Profile and CoachProfile documents extend User; academy records belong to an owner. Booking references an athlete and coach, persists notifications and publishes Socket.IO updates.
- Tournament records store organizer, registrations and embedded bracket rounds/seeds. The current UI does not yet reflect those persisted records reliably.
- Kata analysis currently uploads from the browser to Python; the hardening milestone changes this to authenticated Express proxy -> private Python worker -> bounded result polling. Optional LLM features use Featherless/OpenRouter and must fail honestly when unavailable.

## Release gates

Do not describe the product as market-ready yet. Source includes negative
authorization/concurrency tests, truthful marketing, persisted workflows and
operational/rollback documentation; these are not substitutes for observed new CI
results, live reset delivery, hosted proxy/session/database acceptance, reviewed
deployment controls and reproducible permissioned video evaluation. Source or
mocked-model tests cannot establish production integration readiness.

Milestone outcomes and remaining limitations are recorded in `docs/ROADMAP.md` and the PR description.
