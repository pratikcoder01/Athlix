# Verification record

## Vercel backend-origin compatibility (2026-11-15)

The owner's Vercel log at `5f7376e` confirms that the missing `AUTH_API_ORIGIN`
stopped configuration loading. Auth configuration now falls back to an explicit
`NEXT_PUBLIC_API_URL`, retains the dedicated override and all origin validation,
and still rejects missing production configuration. All **18 client tests pass**,
including fallback, precedence, invalid override and missing/unsafe configuration
regressions. A fresh production client build passed with `AUTH_API_ORIGIN` absent
and only an explicit loopback `NEXT_PUBLIC_API_URL`; its generated auth rewrite
targets that configured origin. The build also ran lint and TypeScript checks.
CI now exercises that fallback through the actual Next rewrite/browser suites.
The previous green runs below establish `5f7376e`; later CI and Vercel outcomes
are tracked on PR #2. No host setting was changed, and no hosted acceptance is
claimed from the local loopback build.

## Continued increment: current evidence

2026-11-15 (Asia/Calcutta). The continued increment includes revocable sessions,
academy operations, training, coach clients, notifications, moderation, divisions,
video persistence and safe migration work described in [ROADMAP.md](ROADMAP.md).
The latest completed local `npm test` run passes **15 client + 398 server tests
(413 total)**; eight service-dependent suites explicitly skip. Python passes
**32 tests** using the service's virtual environment. Standalone lint passes with
**zero warnings/errors**, both type checks pass, and both production builds pass.
Audit remains **zero high/critical and seven moderate** findings. These local
results are separate from remote CI; current run outcomes are linked from
[PR #2](https://github.com/pratikcoder01/Athlix/pull/2).

CI now supplies the real disposable Mongo replica set for academy, training,
community, divisions, sessions and migration rollback, plus a demo-only Firebase
Auth emulator for actual identity/recovery contracts. Browser checks cover all
new workspaces, a real Next auth rewrite/HttpOnly cookie round-trip, automated
WCAG scans and keyboard drawer behavior. Native checks download a hash-pinned
official pose asset, run inference on generated blank video, and exercise actual
container limits, owner isolation and result persistence after service restart.
Observed at pushed commit `8bea3de` in
[PR run 43623613570](https://github.com/pratikcoder01/Athlix/actions/runs/43623613570)
and [push run 43623610030](https://github.com/pratikcoder01/Athlix/actions/runs/43623610030):

- **Python job: PASS in both runs.** Thirty regressions, dependency/syntax checks,
  hash-pinned model provisioning, actual native inference on generated blank video
  and low-confidence rejection passed. The actual Docker service passed owner
  isolation, request retry, deletion and result persistence after restart. Measured
  constraints were non-root UID 10001, 1536 MiB memory, two CPUs, 64 PIDs,
  read-only root, dropped capabilities and no-new-privileges.
- **JavaScript job: FAIL in both runs.** Locked install, lint/types, disposable
  MongoDB suites and both builds passed. The database run reported 429 passing
  server tests and one explicit emulator skip; the separate demo Firebase Auth
  emulator run passed all seven identity/recovery tests. It sent no real email.
- The push browser run failed on intermittent production React hydration error
  418. The PR browser run passed the first smoke, real Next proxy/HttpOnly-cookie
  round-trip, booking scenarios and profile/academy/feed suite, then timed out on
  an academy attendance locator. That locator has been corrected in source, but
  its corrected hosted-run result is tracked in PR #2. Production hydration was
  reproduced and addressed as documented in HYDRATION.md; development diagnostics passed
  189 route/viewport visits in both runs and do not override the production error.

The workflow now attempts all ten browser suites before returning failure so
that an early failure does not conceal later results. The observations above
are retained as prior failure evidence; later source CI is tracked in PR #2.

Windows Application Control still blocks local Mongo/native import, Docker's
daemon is unavailable, and automatic approval review rejected root's local
production-server launch (only reason: "blocked by policy"). No blocked launch
was retried through another mechanism. A listener-free Playwright fixture can
serve actual compiled HTML/chunks through request interception, permitting local
hydration and accessibility diagnostics without a server process. These fixture
results remain distinct from CI's actual Next HTTP/proxy checks.

The rebuilt source passed all seven existing browser suites that can use this
listener-free transport: recovery/tournaments/video/responsive/theme smoke,
booking, profiles/academy creation/feed, training/clients/notifications,
divisions, moderation, and accessibility. The accessibility suite passed 26
route/theme cases, four viewport widths, main/heading and single keyboard target
checks, and drawer focus trapping/restoration in both themes. No browser
exceptions or external Google font requests were observed. Dynamic academy
management and the actual Next auth rewrite/cookie round-trip still require the
CI server. The additional production timing regression is recorded separately
in [HYDRATION.md](HYDRATION.md).

The final rebuilt route-resolution fix also passed **63 production visits** with
deterministically delayed assets and the unmodified production renderer. The
original server-rendered frame and main elements were retained on every visit;
no page or hydration console errors were observed. This listener-free check
does not substitute for the CI server or hosted staging acceptance.

Read-only Firebase configuration discovery is recorded in
[STAGING_DISCOVERY.md](STAGING_DISCOVERY.md): the existing live project uses the
Firebase-hosted email action handler, and no dedicated staging origin was found.
No recovery email or production configuration change was made.

Live Firebase email/HTTPS cookie behavior/host secrets, production account provenance,
deployment/backup exercises, legal/commercial approval and permissioned athlete
video usefulness/accuracy are still **NOT RUN**. Generated blank-video inference
can prove runtime execution and rejection behavior, never domain accuracy.

## Historical evidence from the first milestone

Date: 2026-11-14 (Asia/Calcutta). Historical source implementation through `ab4bad8` on
`codex/athlix-market-ready`, reviewed in draft PR
[pratikcoder01/Athlix#2](https://github.com/pratikcoder01/Athlix/pull/2).
No merge or production deployment was performed.

## Final local checks

Windows; Node 24.18.0; npm 11.16.0; Python 3.11.9; installed Microsoft Edge driven
by Playwright. The original downloaded ZIP and unrelated parent Git repository
were preserved. Working clone: `Athlix-working`.

| Check | Actual result |
| --- | --- |
| `npm ci --legacy-peer-deps --no-audit --no-fund` | PASS, fresh 818-package install from the canonical root lockfile. Four dependency lifecycle scripts remain unapproved locally; deprecation warnings remain. |
| `npm run build` | PASS: Next.js 15.5.29 production build (29 static-page build entries) and server TypeScript build. Lint and type checks are enabled in Next build. |
| `npm run typecheck` | PASS for client and server. |
| `npm run lint` | PASS: zero errors, 17 warnings. Warnings include unused legacy component variables, an existing hook dependency and image optimization. |
| `npm run test` | PASS: 7 client tests plus 228 server tests (235 total); one real MongoDB integration suite explicitly skipped locally. Includes 21 additional experimental-AI security regressions after the first green CI run. |
| Python `unittest discover -s tests -v` | PASS, 15 API/policy/scoring tests. Native inference is mocked/lazy and is not established by this result. |
| Python `pip check`, `compileall` | PASS. |
| `npm audit --json` | 0 critical, 0 high, 7 moderate. See [dependency review](DEPENDENCY_REVIEW.md); this is not a clean-bill-of-health claim. |
| Static app-link inventory | No missing literal internal app routes found. Dynamic/external links are outside that check. |

## Browser evidence against the production build

Started the built client on loopback port 3100, then ran all three scripts
successfully. Their API/Firebase transports use controlled fixtures; they do not
contact production customers, deliver recovery emails, charge money or establish
live database/provider integration.

- `node client/test/e2e-smoke.cjs`: real Firebase SDK verify/confirm request wiring,
  missing/expired/consumed error handling, organizer generate/start/winner/complete,
  athlete registration, consent-required video upload and unavailable-service
  recovery, dark default and persisted light preference, responsive route checks.
- `node client/test/booking-e2e.cjs`: selected real record ID and chosen local-to-UTC
  time/quote, saved request and cancellation, 409/network failure recovery, coach
  UTC schedule/rate publication and acceptance; dark/light views.
- `node client/test/workspace-e2e.cjs`: profile save/reload, approved-owner academy
  creation (including valid zero coordinates), `/gyms` redirect, saved community
  publication/likes/comments, retained drafts/state after errors, hydration checks.

Responsive widths: 360, 768 and 1440 pixels. No horizontal overflow or page
exceptions in those tested states. Workspace console checks also found and then
verified fixes for reduced-motion hydration mismatches. Screenshots were inspected
locally; these checks are not a complete WCAG audit or Core Web Vitals benchmark.

## Integration and release limitations

- **Local MongoDB replica-set suite: NOT RUN.** The official MongoDB executable
  was blocked by Windows Application Control. The opt-in suite accepts only a
  loopback test URI, creates a random test database, runs independent API processes
  and tests reservation races, rollback and operator audit transactions. CI starts
  a disposable MongoDB replica set for it. No production `MONGO_URI` is used.
- **Live Firebase email/provider acceptance: NOT RUN.** No project credentials,
  email-template change or external email delivery was used. Review legacy
  privileged accounts and account linking in a controlled staging project.
- **Native MediaPipe inference/accuracy benchmark: NOT RUN.** Windows Application
  Control blocked a dependency DLL; no reviewed model or permissioned video corpus
  was supplied. Queue durability, model usefulness and OS/container memory limits
  remain explicit release gates.
- **Billing, legal approval, customer traction, production uptime, real hosting
  rollback, complete accessibility/performance certification: NOT RUN/not claimed.**
- At that historical milestone, session tokens had a 30-day lifetime and browser-local persistence.
  Broader revocation, token storage/rotation, partial account/profile recovery and
  privileged-account provenance remain unresolved security work.

## Remote CI

The new ATHLIX checks run locked installs, lint/types/tests, an isolated MongoDB
replica set, both builds, all three browser scripts, a high/critical audit gate,
and constrained Python checks. Remote run outcomes must be read from
[GitHub Actions](https://github.com/pratikcoder01/Athlix/actions), separately from
the local results above. The first new runs at `a482482` passed Python, builds
and actual replica-set booking/rollback tests, then failed responsive browser
smoke with a React hydration error on Linux Chromium. The `dc0c0b9` follow-up
stabilizes the scroll provider's initial tree and adds route/viewport diagnostics.

[CI run 43560919541](https://github.com/pratikcoder01/Athlix/actions/runs/43560919541)
then completed **successfully** for JavaScript and Python. Its JavaScript job
passed 7 client tests and 216 server tests with zero skips, including eight real
MongoDB subtests covering cross-process coach/athlete conflicts, cancellation,
legacy overlap handling, stale quotes, notification rollback and operator-role
audit rollback. Builds and all three Linux Chromium browser suites also passed.
This is real disposable-database evidence, distinct from local mocked-model tests;
it still does not establish live Firebase/native-model/production-host acceptance.

The later `ab4bad8` security increment defaults legacy AI coaching off, filters
private/draft coach data, validates provider output and caller-owned saved plans,
and bounds per-account requests. Its local server build, full JavaScript suite
and independent review pass; its downstream CI result is tracked on the PR.
