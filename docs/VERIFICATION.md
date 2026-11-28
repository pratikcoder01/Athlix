# Verification record

## Production font-build recovery (2026-11-28)

The owner merged PR #3 as `f701116`; the subsequent Vercel build failed in the
upstream `next/font/google` URL parser. The follow-up uses licensed local
variable fonts instead of another download retry. See [font build](FONT_BUILD.md)
and the pinned asset/license manifest for the source and exact scope.

A fresh client build, with the previous `.next` output preserved outside the
repository and Google-font hosts blocked through an inherited Node preload,
passed. All 65 client tests, lint and both type checks passed. The compiled
landing browser suite passed in dark/light with three real loaded font families,
nine requested family/weight combinations and three same-origin WOFF2 responses
per theme, zero Google-font requests, and all 12 responsive screenshots. These
local browser checks use the listener-free compiled transport; actual Next
server behavior is checked separately in CI.

CI now applies the same Google-font network guard to its build step. Its current
review-head outcome must be checked independently of the historical runs below.
No framework version, deployment environment variable or backend behavior changed.

## Review corrections and refreshed checks (2026-11-28)

The account candidate `89d5e6b` passed both
[PR CI](https://github.com/pratikcoder01/Athlix/actions/runs/45131099742) and
[push CI](https://github.com/pratikcoder01/Athlix/actions/runs/45131088718):
**549 JavaScript tests** (60 client, 481 server/database, eight dedicated demo
Firebase tests), 37 Python tests, both builds, lint/types, 40 accessibility cases,
63 production hydration visits and 189 development visits. The server phase's
one intentional emulator skip was covered by its dedicated step. The actual
Next browser fixture passed strict rotation, both tab-hint transports and the
renewal/logout/guest-sign-in ordering case. Vercel preview also passed. These
results apply to that revision, before the corrections below.

Follow-up review corrections use a native modal mobile menu to block background
pointer/focus interaction, show logout failures inside the drawer, keep both
video timeline focus outlines inside their clipped tracks, prevent Change number
from abandoning a dispatched phone exchange, and replace sleep-sensitive
performance timestamps with wall-clock/local-monotonic ordering. Clock changes
can still disturb ordering across tabs; server authorization remains authoritative.
The new phone and clock regressions exercise actual components/modules with
controlled boundaries, rather than real SMS or OS-sleep automation.

The compiled, listener-free mobile430 browser scope passed modal isolation,
failed logout/retry, Escape and focus/scroll restoration. Generated CSS and
keyboard-focus geometry verified the timeline's inset outline in both themes.
All 65 client unit tests, lint, both type checks and the production client build
passed locally for this follow-up. The new phone/clock regressions failed
against the previous source and passed after their fixes.
Actual Next/server acceptance for the final follow-up head is tracked in
[PR #3](https://github.com/pratikcoder01/Athlix/pull/3).

Fresh full and production-only audits again reported zero findings without any
lockfile change. All five public host contracts passed on a bounded retry; the
initial post-idle backend probes timed out while the frontend passed. No host
settings were changed. This is readiness/CORS evidence, not continuous uptime,
deployed-SHA identification or authenticated acceptance of the new source.

## Account reliability and dependency cleanup (2026-11-23)

[PR #3](https://github.com/pratikcoder01/Athlix/pull/3) contains the presentation
refactor and subsequent account fixes. Its exact head checks are the authority
for the current CI outcome; the dated results below do not qualify later source.

The follow-up repairs destroyed reCAPTCHA retries, rejected phone role payloads,
reconfirmation of consumed SMS codes, abandoned phone continuations and stale
signed-in UI in other tabs after logout. Login/signup/phone exchanges, renewal
and logout share a Web Lock where the browser supports it; credential verification happens outside it,
cookie exchanges and memory-auth commits inside it. Tests cover queued login/
logout order, late provider results, failed logout and secret-free tab hints.

Local verification passed a clean locked install, all client unit tests, client
lint, both type checks and both builds. The server suite passed **428 tests**
with **nine explicit local-service skips**. Real MongoDB, the demo Auth emulator
and actual Next rewrite/browser checks are supplied to CI; their absence locally
is not counted as passing integration coverage. The expanded emulator phone case
checks incorrect codes, email-less identity isolation, renewal and approved roles.
The two-tab browser fixture uses exact single-use cookie rotation and tests both
BroadcastChannel and storage-event sign-out propagation.

The targeted TypeScript-ESLint cleanup removed unused nodemon and resolved the
remaining tooling advisory without framework upgrades. Both full and
production-only audits reported **zero findings** on 23 November; see
[dependency review](DEPENDENCY_REVIEW.md). All five unauthenticated public host
contracts passed on that date. This probe does not identify the deployed SHA or
qualify the new auth source against real providers.

No production promotion, real SMS/email delivery or paid provider call is part
of this milestone. The owner merged PR #2 on 22 November; PR #3 remains a separate
review. Genuine provider delivery, reviewed policies/support ownership,
off-device backup/full hosted restore and optional CV hosting/evaluation remain
launch gates.

## Hosted acceptance revision (2026-11-22)

The production Vercel frontend and new free Render API were both verified at
`24aafcc7f2e70e557e30cc4014fec5c8c2a9ac32` during this acceptance. The old
vulnerable API was suspended; the June artifact is not an approved safe rollback.
This dated record does not establish a later deployment's source revision.

[PR run 44987854947](https://github.com/pratikcoder01/Athlix/actions/runs/44987854947)
and [push run 44987850735](https://github.com/pratikcoder01/Athlix/actions/runs/44987850735)
both completed successfully at that exact candidate. Each passed:

- **506 JavaScript tests:** 18 client, 481 server/database and seven separate demo
  Firebase identity/recovery tests. The server phase had one intentional emulator
  skip before the dedicated emulator step; no failures were reported. All three
  public-projection/auth-version/explicit-DTO regressions passed.
- Lint/types, both builds and all ten production browser suites, including the
  actual Next auth rewrite and HttpOnly cookie round trip. Automated accessibility
  passed **30 dark/light cases**; delayed production hydration passed **63 visits**
  retaining original SSR nodes; development diagnostics passed **189 visits**.
- A real **synthetic** archive/restore across **21 collections**, with complete
  document/index equality, unique enforcement, geospatial query, TTL expiry and
  unchanged source. This does not establish production-backup acceptance.
- **37 Python tests**, actual native model execution/blank-video rejection, a
  mount-free/network-free one-CPU image smoke and full two-CPU constrained-container
  owner isolation, retry, deletion and restart persistence. No athlete-scoring
  accuracy or target-host CV throughput was evaluated.
- The dependency high/critical gate; seven moderate findings remain.

Local verification passed **446 JavaScript tests** (18 client / 428 server), with
nine explicit service-dependent skips, plus client lint/type/build and server
compilation. Local skips are not substituted for the real remote integrations.

The approved live database work completed encrypted local backup/decryption/hash
and archive dry-run validation, **10 added collections / 21 indexes** and the
production verifier for all **20 model catalogs / 45 secondary indexes**. Runtime
access is restricted to the 18 API collections and catalog reads, without DDL
privileges. After removal of the world-access rule, a fresh backend process and
connection pool succeeded. All five hosted liveness/readiness/CORS/frontend
preflight contracts passed on 2026-11-22. The local backup still requires its
Windows account/computer; an off-device copy and full isolated production-data
restore have not been qualified.

Expanded actual HTTPS acceptance passed **66 assertions across 106 recorded API
requests**, covering Firebase/password, sessions, role/privacy, booking conflicts,
private coach notes/training, community, division brackets/results and academy
members/attendance/counts. Negative ownership, version and transition checks
passed. All five temporary Firebase/application identities and their owned data
were removed, including 12 sessions; three labeled role-audit records remain.
Post-cleanup read-only verification found only the four preexisting athlete
accounts and reconfirmed runtime privileges/catalogs. The same run passed
**26 browser session checks**:
actual Firebase/password login, cookie restoration/rotation, logout, cleared
refresh cookie, rejected old cookie/access token and signed-out reload. It also
passed **13 recovery UI checks** using a real Firebase action code, including
visible password-update success and one-time-code removal from the URL. There
were no runtime/hydration errors. The outer assertions also verified the HTTP
and provider contracts: the pre-reset session was rejected, the old password
failed and the new password signed in/exchanged successfully. The preceding
browser-only run independently passed these browser/recovery checks and cleaned
up its one QA identity/four sessions without creating role-audit rows.

An earlier browser helper could not read an unread logout response body through
CDP, despite observing HTTP 200. The independent actual HTTPS JSON contract and
the browser's cookie/token/reload outcomes subsequently passed; the status alone
was not substituted for session-state proof. No email or SMS was sent. These
tests qualify the controlled action-code reset, not real recovery-email delivery,
Google/phone providers or every role-workflow/browser combination.

After a long pause, an expired temporary operator-network entry stopped a run
before any QA identity/API request was created; narrow time-limited access was
renewed without restoring world access. A bounded public preflight also failed
after the pause, then all five contracts passed on repeat without application or
host-setting changes. The final authenticated run passed. Free-host cold starts
and bounded session timeouts remain limits, not continuous-availability evidence.

Checkout remains disabled until the owner decides prices. Policy examples remain
marked review drafts. Paid CV hosting and a permissioned domain evaluation have
not been approved/completed. The dated observations below preserve earlier
failures and their original verification scope.

## Hosted profile-boundary correction (2026-11-22)

Real hosted acceptance exposed an internal session counter in a public profile
response. The cause was Mongoose's schema-level `select: true`, which also forces
the field into name-only owner/author selections. That unnecessary flag is removed;
ordinary and password-exclusion auth queries still select the real version, and
socket queries request it explicitly. The profile handler also serializes an
explicit `_id`/name/role DTO rather than a whole hydrated account document.

Regression coverage uses actual Mongoose selection/hydration with only the driver
transport replaced. Public projections omit controls; normal/auth/socket queries
retain a nonzero version; the DTO rejects private fields even when supplied a
hydrated account containing them. The projection regression failed before the
schema correction. All **16 directory tests** passed afterward.

The combined local suite passed **18 client + 428 server tests (446 total)**,
with nine service-dependent skips. Client lint/type checking and the production
build passed; server compilation passed. Timeout/network errors now have
actionable recovery copy and a theme-aware Retry link, without changing request
bounds, retries, cookie logic or logout. Corrected hosted-run and remote CI
outcomes are tracked on PR #2; prior results below remain historical evidence.

## Hosted recovery and release acceptance (2026-11-21)

At `8ded4414`, [PR CI 44796878096](https://github.com/pratikcoder01/Athlix/actions/runs/44796878096)
and [push CI 44796869350](https://github.com/pratikcoder01/Athlix/actions/runs/44796869350)
both passed: **503 JavaScript tests** (18 client, 478 server/database, seven
separate demo Firebase tests), 37 Python tests, all ten production browser suites,
30 accessibility cases, 63 production and 189 development hydration visits.
Actual synthetic backup/restore, native model execution, the mount-free image
and constrained container/restart acceptance passed. Seven moderate dependency
findings remain; the high/critical gate passed.

The approved live database preparation subsequently passed a real encrypted
local backup/decryption/hash/archive dry run, an additive 10-collection/21-index
operation and the production catalog verifier against all 20 model catalogs.
The owner removed the world-access rule after narrower provider/operator rules
were added. A fresh restricted runtime-identity connection passed without DDL
privileges; a fresh backend process had not yet been checked at this stage. The
2026-11-22 deployed-candidate evidence above records that later acceptance. See
[host rollout evidence](HOST_ROLLOUT_REVIEW.md) for the backup's account/device
and consistency limits; this is not a full production restore claim.

A new free backend and promoted production frontend were verified at `8ded4414`.
Public assets use the new API; all five unauthenticated host contracts passed.
Actual HTTPS QA passed 28 auth/session/privacy-boundary checks before revealing
an internal `sessionVersion` field in the profile response. The source now uses
an explicit public DTO and retains the original rejection assertion. This is a
confirmed live failure followed by a source fix, not a passing corrected hosted
claim at that stage. The 2026-11-22 entry above records later corrected-run
outcomes. The failed run's four temporary identities/artifacts
were cleaned up; three labeled role-audit entries remain as operational evidence.
Later corrected-run/CI outcomes are tracked on PR #2.

The small hosted browser smoke passed eight page/viewport heading/layout and
password-toggle checks with zero runtime/hydration errors, but recorded a first
mobile session timeout and navigation-aborted bootstrap requests. These results
do not replace authenticated acceptance. Bounded requests and visible recovery
remain; timeout copy is improved without claiming that free-host cold starts
or every external provider workflow have been qualified.

## Release-safety increment (2026-11-21)

Local checks for the current source additions passed **18 client + 425 server
tests (443 total)**, with nine service-dependent suites explicitly skipped.
Python passed **37 tests**. Both builds passed; the client build included lint
and TypeScript checking. The policy pages were added to browser acceptance:
**30 dark/light route cases** passed automated accessibility, four viewport
widths, draft-banner/inactive-email checks and drawer keyboard behavior using
the actual compiled assets through listener-free interception.

New CI checks perform an actual synthetic Mongo archive/restore into a separate
disposable deployment, real production index-gate acceptance before/after
explicit fixture provisioning, and an opt-in Render-style model image build
followed by single-CPU native inference with no host model mount or network.
Their new remote outcomes must be observed; local guards and fixture checks
alone are not reported as real Docker/Mongo acceptance.

Read-only hosting discoveries and the concrete review-before-rollout steps are
recorded in [HOST_ROLLOUT_REVIEW.md](HOST_ROLLOUT_REVIEW.md). They identify an old
live backend revision and configuration gaps without claiming a diagnosed
outage, successful live login or authorization for production changes.
The owner's requested sample policy details are explicitly labeled and inert;
they do not establish an approved legal policy.

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
