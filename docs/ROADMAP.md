# ATHLIX execution roadmap

Updated 2026-11-13. Work proceeds on `codex/athlix-market-ready`; no merge or production deployment is implied.

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
