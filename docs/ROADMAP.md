# ATHLIX execution roadmap

Updated 2026-11-15. Work proceeds on `codex/athlix-market-ready`; no merge or production deployment is implied.

Latest verification: 2026-11-15. See [VERIFICATION.md](VERIFICATION.md) and
[FEATURE_STATUS.md](FEATURE_STATUS.md). Initial priorities below are retained as
the release roadmap, not a claim that every phase is complete.

## Reviewable milestones

1. **Account trust:** reject public privilege escalation in both auth flows, verify account linking, reject disabled identities, apply parsed validation, add audited operator provisioning and regression tests. Align signup copy with the actual account policy.
2. **Realtime confidentiality:** verify handshake JWT/current user, derive private user rooms, authorize tournament subscriptions, enforce expiry, share fail-closed production origin policy, test real loopback sockets.
3. **Tournament integrity:** enforce organizer ownership in manual/AI writes, validate payloads and forward-only progression, reject stale concurrent edits, atomically deduplicate registration and respect event status/deadlines. Deliver persisted UI with deterministic single-elimination brackets before more formats.
4. **Video privacy/resource safety:** authenticated Node proxy/private Python service, ownership-bound task status, bounded files/queue/frames/time, cleanup/expiry, no raw video retention, deterministic heuristic tests and explicit limitations. Durable multi-worker jobs remain a separate release requirement.
5. **Password recovery:** verify real Firebase action links, call password confirmation, show invalid/expired/retry/success states, test failure paths and document email-template setup. Clearly identify legacy auth recovery limitations.
6. **Booking correctness:** authoritative coach rates, availability/timezone validation, atomic overlap reservations, ownership and forward-only status transitions, DB-backed race regression tests and client recovery states.
7. **Dependency/CI foundation:** reviewed compatible security updates; Node/server/client checks, Python tests and audit in Actions; reproducible setup and observability/rollback documentation. Do not suppress failing checks.
8. **Truthful product/demo:** remove unsupported claims and pretend checkout/results; persisted directories or honest empty states; actual feature status and factual investor materials under `docs/pitch/`.
9. **Vertical slices:** complete athlete profile -> approved coach discovery/booking -> organizer events/brackets -> academy membership operations, each with API/DB/UI tests and mobile verification.
10. **Design and launch qualification:** consistent accessible dark/orange system, keyboard/focus/reduced-motion checks, responsive screenshots, measured performance, independent permissioned video benchmark and pilot feedback.

## Definition of a verified milestone

- Implement behavior and authorization boundaries; add meaningful negative regression tests.
- Run relevant build/type/lint/tests; distinguish local, mocked dependency, database integration and external provider checks.
- Review the diff for secrets, accidental generated files and unrelated changes.
- Commit an atomic change and push the verified commit to the review branch; record commit/push/PR outcome.
- Record unavailable credentials and unfinished release gates. Never substitute invented data or a success toast for a working service.

## Milestone log

### Baseline (2026-11-13)

- Cloned current remote main `870942c` in a fresh working directory; preserved the supplied ZIP and unrelated parent Git repository.
- Locked workspace install, server build and frontend build passed. Lint has 58 warnings / zero errors.
- Audit found 37 production dependency advisories. Database/provider E2E, browser responsive checks and Python tests have not yet run.
- Next: close public role escalation with regression tests and a verified feature-branch commit.

### Account trust

- Both signup flows now reject privileged roles, create athletes only, apply parsed validation and ignore injected identity/status fields. Existing trusted roles are preserved during login.
- Firebase verifies revocation at exchange; legacy email linking requires verified email and an atomic unlinked-account condition. API requests reject inactive accounts, invalid IDs, unsupported JWT algorithms and missing expiry.
- Added dry-run-first operator role provisioning with an audit record in the same transaction and inactive initial coach profiles. No provisioning was executed.
- Verification: server build PASS; 44/44 auth/operator tests PASS using real HTTP handlers and mocked provider/database; client typecheck and targeted signup/realtime lint PASS.
- NOT RUN: live Firebase email/provider integration and actual Mongo transaction rollback. Existing privileged-account provenance, profile-creation recovery, 30-day browser-local JWT sessions and global revocation remain release work.

### Realtime confidentiality

- Commit `3a52c47` pushed after auth commit `6edee73`. Auth now has 44 passing regressions; realtime has 10 passing real Socket.IO loopback regressions.
- Private rooms derive from a validated current account, connections expire, subscriptions validate real event IDs and origin policy fails closed in production.
- PR: https://github.com/pratikcoder01/Athlix/pull/2 (draft). The connector refused PR creation; authenticated Git credentials successfully created the draft through the GitHub API.

### Tournament integrity

- Replaced fabricated tournament UI/results with API-backed listing, creation, registration, deterministic bracket generation, owner result recording, lifecycle controls and reconnecting subscriptions.
- Closed manual and AI-compatibility ownership bypasses. Added bounded literal search, strict tree/ID validation, read-only completion and compare-and-set version checks.
- Atomic registration deduplicates enrollment and serializes against bracket publication. Published registration-order seeds are locked; entry fees are explicitly unpaid informational amounts.
- Server build and 29/29 tournament policy/controller tests PASS; client typecheck and targeted tournament lint PASS. Controller DB operations are mocked; database races remain NOT RUN due Windows Application Control blocking MongoDB. Divisions/withdrawals/legacy bracket migration remain unfinished.

### Video privacy and processing bounds

- Authenticated Node proxy now derives owner identity and uses a private server-only service key; Python status/deletion is owner-scoped. Uploads require explicit consent and fail closed when service/model configuration is absent.
- Added 25 MB, 60-second, 1080p, 60-fps, sampled-frame and worker-deadline limits, bounded admission/results, cleanup/expiry and webcam track teardown. Feedback uses observed pose metrics and discloses unmeasured components.
- Verification: server build PASS; client typecheck and targeted lint PASS; 8/8 Node proxy tests and 15/15 Python policy/API/scoring tests PASS; Python compileall and pip check PASS.
- NOT RUN: actual MediaPipe inference, reviewed model/video benchmark and native memory isolation. Windows Application Control blocks a MediaPipe dependency DLL. Jobs remain an explicitly documented single-worker ephemeral service; durable jobs and container memory enforcement are release gates.

### Delivered commit register

Every commit in this historical register was pushed to the review branch. File groups and remaining
limits are described in the linked subsystem documents and Git diffs.

| Commit | Milestone and affected files | Verification |
| --- | --- | --- |
| `6edee73` | Auth controllers, validation/middleware, role audit/CLI, signup, audit/roadmap | 44 auth/operator regressions; server build; client types/lint |
| `3a52c47` | Socket server/context, shared CORS and environment docs | 10 real loopback socket regressions |
| `1c12c69`, `60682f1` | Tournament controller/policy/routes, AI compatibility handler and real event UI | 31 bracket/ownership/concurrency-policy tests; peer review fixed future-version and dependent-result gaps |
| `9492139` | CV proxy/routes, Python service/worker/scoring, kata/recorder UI | 8 proxy + 15 Python tests; types/lint/pip check; native inference NOT RUN |
| `f429d71` | Marketing/pricing/contact/legal notices, scoped organizer analytics, pitch docs | 4 marketing/contact + 4 analytics tests; types/lint |
| `fc57860` | Firebase reset/forgot UI and recovery helpers/docs | 3 unit tests; SDK transport browser success/expired/invalid cases |
| `e2e77b7` | Booking transaction/policy/models/UI, profile/directory/academy data flows | 50 booking + 13 directory tests; 1 DB guard; local replica-set suite skipped; 4 booking browser scenarios |
| `b6ce8b7` | Persisted feed/settings, community API/models, workspace browser suite | 23 community regressions and production profile/academy/feed browser checks |
| `247c555` | Canonical lockfile, reviewed dependency upgrades, native bounded fetch | Clean locked install; 6 provider/config tests; audit 0 critical/0 high/7 moderate |
| `764bd53` | Hydration/motion/theme components, readable helper text, core browser suite | Production SDK/event/CV/theme suites; 360/768/1440 responsive checks |
| `a482482` | Health/readiness, request/error logs, config, shutdown, rate limits, CI/setup/rollback/evaluation docs | 18 operations tests including actual HTTP/WebSocket draining; full builds/type/lint/tests |
| `dc0c0b9` | Stable initial scroll provider, route/viewport browser diagnostics and remaining auth-page claim cleanup | Client build/lint and all three local production browser suites; both CI jobs green including real MongoDB and Linux Chromium |
| `ab4bad8` | Default-off experimental AI, published-coach privacy projection, bounded request/output schemas and principal-owned plan writes | 21 new AI security regressions, independent review and complete 235-test local JavaScript suite; no live provider call |

One build during the dependency update encountered its intermediate removed-adapter
state; the final clean install and both production builds passed afterward. One
community/ops verification attempt also overlapped that clean install and was
rerun successfully in the complete suite. These intermediate failures were not
reported as passing checks.

### Continued product and release work (2026-11-14)

| Commit | Increment | Local evidence and next check |
| --- | --- | --- |
| `4ccda74` | Memory-only short access tokens, rotating HttpOnly sessions through a same-origin auth proxy, global revocation/profile recovery; structured training, saved plans, coach clients and persisted notifications | Session/workspace regression suites pass; real Mongo and demo Firebase acceptance supplied to CI |
| `0737129` | Academy listing editing/archive/restore, owner-private members, attendance and operational counts | 31 academy/directory regressions; seven real transaction subtests supplied to CI |
| `31f33b2` | Versioned author edits/removal, private reports, transactional moderator decisions and audit | 50 community regressions; eight real Mongo subtests supplied to CI |
| `be4de1a` | Named divisions, capacity, athlete withdrawal, versioned results and public division cancellation | 21 division regressions and disposable Mongo/browser suites; review caught and fixed the underfilled-division start dead end |
| `38e6a29` | Owner/content-bound video request retries, durable bounded SQLite state, crash recovery, container constraints, pinned model and native runtime probes | 30 Python tests and 10 Node CV regressions pass; actual container/native checks supplied to CI |
| `2504d0d` | Explicit-target dry-run legacy bracket review, strict complete-tree validation, exact source/version CAS and transactional migration audit | 23 regressions; actual database rollback suite supplied to CI; no migration was applied |
| `dde6d69` | Automated accessibility/responsive checks, real browser/proxy cookie round-trip, demo identity recovery, actual model/container/restart CI | Local lint has zero warnings/errors; CI outcome must be observed |
| `edd1d27`, `8bea3de` | Correct CI model path, native graphics dependencies and explicit CPU inference | Native inference and actual constrained-container/restart checks passed in both remote runs at `8bea3de`; JavaScript/browser jobs failed, as recorded below |

### Final review fixes (2026-11-15)

Review commits after `8bea3de` include `764711c` (retain bounded CV
admission through upload/upstream cleanup and model read permissions), `6297431`
(self-hosted display fonts), `2f2fd34` (reject unsupported production transaction
topologies before listening), `b684b39` (semantic font variables), `123ada2`
(form/button semantics, keyboard targets, contrast and fixture locators), and
`22f4b7b` (current operating contracts and measured release limits). Earlier
remote results do not cover these additions. The final source also isolates
delayed route resolution and adds a production hydration regression; current
remote run outcomes are linked from PR #2.

The latest combined local check passed 15 client and 398 server tests (413 total);
eight service-dependent integration suites explicitly skipped. Python passed 32
tests in the service virtual environment. Builds and standalone type checks pass;
dependency audit remains zero high/critical and seven moderate development-tool
findings. Earlier in-progress tests
failed while community mocks still reflected the old API and were corrected and
rerun; an extended video fixture assertion was corrected after waiting for an
intentionally hidden file input. That corrected browser path passed in the PR run
at `8bea3de`.

At `8bea3de`, both remote Python jobs passed native inference and actual Docker
isolation/restart persistence. JavaScript database suites passed 429 server tests
with one intentional skip, and the separate demo Firebase emulator passed seven
identity/recovery cases. Both JavaScript jobs nevertheless failed: one on React
418, the other on an academy attendance locator after earlier browser suites
passed. The locator is corrected; the reproduced hydration mechanism and source
fix are documented in [HYDRATION.md](HYDRATION.md). Neither earlier run is a green acceptance result. See
[verification](VERIFICATION.md) for linked runs and exact scope.

Local production-server start was rejected by automatic approval review with
"blocked by policy"; no alternate launch was used by root to bypass it. CI owns
the final production browser check. A previously running agent development
server was stopped; its result is not substituted for a production run.

Read-only discovery found the existing Firebase project and production authorized
domain, with outgoing recovery links still using Firebase's hosted action page;
no settings or users were changed. See [staging discovery](STAGING_DISCOVERY.md).
The next release-critical checks are actual staging identity/email/cookie/hosting
acceptance, reviewed account provenance and deployment/backup exercises. Source
implementation and disposable CI do not establish production release readiness.
Checkout remains disabled by the owner's explicit decision until plan prices
are decided. Billing is an intentional deferral. Legal/customer evidence and
permissioned domain evaluation still require business or external inputs
described by the feature matrix.

### Confirmed Vercel configuration failure (2026-11-15)

The supplied build log identifies missing `AUTH_API_ORIGIN` at `5f7376e` as the
terminating error. Auth configuration now reuses an existing operator-configured
`NEXT_PUBLIC_API_URL` when no dedicated override is present. Exact-origin/HTTPS
validation and fail-closed missing configuration remain; malformed overrides
never silently fall back. Eighteen client tests and a production build using
only the public API setting passed. CI now builds and tests the real proxy with
that fallback; current hosted/CI outcomes are recorded on PR #2. Hosted builds
still need the real Express backend origin; no URL or successful deployment was
invented. The setup guide includes the corresponding Vercel environment steps.
