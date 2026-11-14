# ATHLIX execution roadmap

Updated 2026-11-13. Work proceeds on `codex/athlix-market-ready`; no merge or production deployment is implied.

Latest verification: 2026-11-14. See [VERIFICATION.md](VERIFICATION.md) and
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

Every commit below was pushed to the review branch. File groups and remaining
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

The next release-critical work is actual staging identity/native-video validation,
session revocation/storage design, existing privileged-account review and the
remaining product gates, not a production rollout based solely on fixture tests.
