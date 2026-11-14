# Dependency and CI review — 13 November 2026

Use Node.js 24 (`.nvmrc`) and the **root** workspace lockfile. Install with
`npm ci --legacy-peer-deps`; the old independent client/server lockfiles were
removed so prefix-based installs cannot silently select stale dependency trees.
The legacy-peer flag is currently part of the reproducible installation recipe;
it does not suppress vulnerability auditing.

## Changes and evidence

The refreshed starting `npm audit --json` reported 47 affected package entries:
4 critical, 21 high, 22 moderate. This differs from earlier audit snapshots
because advisory data changes over time. After the changes below, the same
command reported **0 critical, 0 high, 7 moderate**. Audit counts are not a claim
that the application has no security defects.

- Next.js and its ESLint config: 15.5.19 → 15.5.29. The current
  [Next image-optimization advisory](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw)
  identifies the affected 15.5 range and upstream Sharp requirement. The lockfile
  also refreshes compatible patched transitive dependencies.
- Multer: 1.x → 2.5.0, with matching 2.x types. The existing authenticated CV
  route's limits, file filtering, and error handling remain covered by regression
  tests. [Multer's release notes](https://github.com/expressjs/multer/releases/tag/v2.5.0)
  identify the current security release.
- Cloudinary: 1.x → 2.11.0. The unused `multer-storage-cloudinary` adapter was
  removed. No route imported its upload helpers; the replacement configuration
  function fails closed until real credentials exist and supplies no mock keys.
  This does not create an image/video storage integration.
- Zod: 3.x → 4.6.7 after reviewing schema usage. Two literal error options were
  migrated to the v4 `error` option. Type checks and existing auth, booking, and
  tournament negative-case tests passed after migration. The
  [constrained-collection advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)
  had no patched v3 resolution.
- Compatible `npm audit fix --legacy-peer-deps` refreshed the remaining allowed
  dependency ranges. No `npm audit fix --force`, Firebase downgrade, or Next.js
  major-version migration was used.

## Reviewed overrides

The root manifest records explicit versions for constrained vulnerable
transitives instead of allowing a tool to force unrelated framework changes:

| Dependency | Resolution | Scope and reason |
| --- | --- | --- |
| PostCSS | 8.5.32 | Same PostCSS major, including Next's otherwise exact 8.4.31 dependency. Addresses source-map and stringify advisories. Client's direct version matches the override. |
| qs | 6.17.1 | Express and its parser subtree remain on qs major 6 while replacing constrained vulnerable minor versions. |
| @grpc/grpc-js | 1.14.7 | Firebase Firestore's Node transport remains on grpc major 1; avoids the audit tool's proposed Firebase 9 downgrade. ATHLIX's client uses Firebase Authentication, not Firestore. |

Review these overrides when upgrading their parent packages. Type checks and
route tests are evidence of local compatibility, not a deployed Firestore or
cloud-provider acceptance test. A clean install and full Next production build
remain required release checks; consult the current milestone log for their
actual outcomes.

## Remaining dependency finding

Seven moderate audit entries are the development-tool chain around minimatch
10.2.x: TypeScript-ESLint packages and nodemon. The advisory is
[glob-parts amplification](https://github.com/advisories/GHSA-g3hv-75wg-m249).
Current parents constrain minimatch below its patched 11.0.1 major. The review
does not silently force that major across tools. Avoid accepting untrusted glob
patterns in development automation; update reviewed parent dependencies or test
a dedicated migration before removing this finding. These packages are tooling,
not a declaration that the advisory is harmless in every environment.

## Provider client reliability

The AI JSON helper now uses supported
[Node fetch](https://nodejs.org/docs/latest-v24.x/api/globals.html#fetch) rather
than importing undeclared `node-fetch`. Each provider attempt has a 15-second
deadline, a 512 KiB response budget, no redirects, deterministic fallback,
bounded object parsing, and sanitized errors/logs. Six regressions exercise real
Response streams with mocked fetch, including malformed/oversized data,
timeouts, missing configuration, and failure recovery. No paid provider call was
made. Domain-specific AI output schemas still belong at each caller.

## CI behavior

The ATHLIX workflow installs the root lockfile, checks client lint and both type
checks, runs client/server regressions, builds both workspaces, and records a
dependency audit. High/critical findings fail the audit step; moderate findings
remain visible in the uploaded JSON artifact. The workflow uses read-only
repository permissions and verified action commit pins.

A disposable MongoDB 8 replica set is started on the runner for the booking
transaction integration suite. Only `TEST_MONGO_URI` is passed to tests, using
loopback and a generated test database. Python 3.11 independently installs the
constrained service dependencies, checks their consistency and syntax, and runs
service/scoring unit tests. No model asset, cloud credentials, secrets, real user
video, production database, merge, or deployment is required by these jobs.

Workflow execution is **NOT VERIFIED** merely by adding its YAML. Check the
actual GitHub Actions run before merging. Local Windows policy may prevent a
MongoDB executable from starting; skipped integration tests must be reported as
such rather than counted as passed.
