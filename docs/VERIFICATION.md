# Verification record

Date: 2026-11-14 (Asia/Calcutta). Source implementation through `ab4bad8` on
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
- Session tokens still have a 30-day lifetime and browser-local persistence.
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
