# ATHLIX product audit

Audit started 2026-11-13 against GitHub `main` at `870942cbf5378a40e3a3510801182c1c5d22ca5f`.
Working branch: `codex/athlix-market-ready`. The downloaded ZIP is preserved separately.

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

## Local baseline

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

## Architecture and data flows

- Next.js client authenticates with Firebase, exchanges an ID token for an API JWT, and stores API identity in Zustand. Legacy bcrypt signup/login also exists. Express middleware resolves the user in MongoDB.
- Profile and CoachProfile documents extend User; academy records belong to an owner. Booking references an athlete and coach, persists notifications and publishes Socket.IO updates.
- Tournament records store organizer, registrations and embedded bracket rounds/seeds. The current UI does not yet reflect those persisted records reliably.
- Kata analysis currently uploads from the browser to Python; the hardening milestone changes this to authenticated Express proxy -> private Python worker -> bounded result polling. Optional LLM features use Featherless/OpenRouter and must fail honestly when unavailable.

## Release gates

Do not describe the product as market-ready yet. Release requires negative authorization tests, DB-backed concurrency tests, validated reset delivery, reproducible video evaluation, truthful marketing, critical journey smoke tests, operational setup/rollback documentation and review of unresolved dependency advisories. Source-level or mocked-model tests cannot establish production integration readiness.

Milestone outcomes and remaining limitations are recorded in `docs/ROADMAP.md` and the PR description.
