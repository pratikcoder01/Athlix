# Session lifecycle and identity recovery

Updated 2026-11-14. These changes are implemented source and test behavior, not
an assertion that a live Firebase/hosting deployment has been accepted.

## Credentials and revocation

- ATHLIX access JWTs last 15 minutes. They require HS256, issuer `athlix`, audience
  `athlix-api`, a valid account/session ID, account session version, issued-at and
  expiry. Legacy 30-day/sessionless tokens are deliberately rejected: existing
  users must sign in again after rollout.
- Browser access tokens live only in the Zustand memory store. The old
  `athlix-auth` localStorage record is removed and never restored. Firebase's
  browser SDK also uses memory persistence; it supplies the initial identity
  proof, rather than an independent durable login credential.
- A refresh credential contains a random 256-bit secret and a session ID. Only
  its SHA-256 hash is stored in MongoDB. The browser receives an HttpOnly,
  host-only cookie, `__Host-athlix-refresh` with Secure/Path=/ in production.
  Development loopback uses `athlix-refresh` without Secure. No refresh token is
  returned in JSON, stored in browser JavaScript, or included in logs.
- Sessions expire absolutely after seven days; renewal never extends that
  deadline. Every refresh atomically compares/replaces its credential hash.
  Previously consumed hashes detect replay and revoke that session. Unknown
  random credentials do not revoke someone else's known session ID. History is
  capped at 1,024 rotations; reaching the bound requires a fresh sign-in.
- Refresh and cookie logout require an exact allowlisted Origin and
  `X-ATHLIX-Session: 1`, independently of CORS/SameSite. Browser login with an
  untrusted Origin is also rejected. Native sign-in remains possible without an
  Origin; cookie renewal still requires the explicit trusted-origin contract.
- Every protected REST request checks the active current account/version and
  unrevoked unexpired session. Socket handshake does the same; subscriptions and
  a 30-second passive-reader timer recheck it. Consequently socket revocation
  has up to a 30-second passive-reader propagation interval, while REST checks
  happen on the next request.
- `POST /api/auth/logout` revokes the cookie session. Authenticated
  `POST /api/auth/logout-all` increments the account's session version and revokes
  stored sessions; version checks also catch older logins racing cleanup.
  Operator role provisioning increments the version in the audited transaction.
  Account settings exposes global sign-out. A transport/storage failure is shown
  as unconfirmed sign-out, rather than a fabricated success.
- Firebase-backed renewal calls Admin `getUser` and compares the original
  provider auth time with `tokensValidAfterTime`; disabled identities and provider
  password-reset/revocation stop renewal. A provider outage fails renewal closed.
  Already-issued access can remain usable for at most its remaining 15 minutes
  after a Firebase-only revocation unless the ATHLIX session/account is revoked.
- Once a legacy account has been linked to a verified Firebase identity, legacy
  bcrypt login is refused with a Firebase sign-in instruction. An older bcrypt
  password therefore cannot bypass subsequent Firebase password recovery or
  provider revocation. Unlinked legacy accounts retain legacy login/recovery
  limitations until deliberately migrated.

## Same-origin proxy and deployment

The browser sends sign-in, session and logout requests to its own
`/api/auth/:path*`. A fixed Next rewrite forwards those requests to
the trusted backend origin. `AUTH_API_ORIGIN` is an optional server-only override;
when absent or blank, the proxy reuses the operator-configured `NEXT_PUBLIC_API_URL`.
Production builds/startup require at least one of them. Both paths accept only an
exact HTTPS origin without credentials/path/query/fragment; explicit loopback HTTP
remains allowed for isolated CI/development. An invalid nonblank override fails
instead of falling back. The request cannot choose an upstream. The public API
origin is already visible to the browser and must contain no secrets; no session
credential is made public by reusing that configured destination.

This keeps the refresh cookie on the frontend host even when the API is hosted
on a separate Render domain. The default `AUTH_COOKIE_SAME_SITE=lax` therefore
works without relying on third-party cookies. The proxy must preserve the
browser Origin, session header, Cookie and Set-Cookie. Other APIs use the
short-lived bearer token directly; configure their explicit CORS origin too.
Do not cache auth responses or rewrite Origin to bypass the backend checks.

Set these in the reviewed deployment configuration:

```text
# Frontend build/server environment; never NEXT_PUBLIC_AUTH_API_ORIGIN
NEXT_PUBLIC_API_URL=https://your-reviewed-api.example
# Optional when auth uses the same backend as NEXT_PUBLIC_API_URL:
AUTH_API_ORIGIN=https://your-reviewed-api.example
# Backend
ALLOWED_ORIGIN=https://your-reviewed-frontend.example
AUTH_COOKIE_SAME_SITE=lax
NODE_ENV=production
```

The cookie can support `SameSite=none` only with production HTTPS for a separately
reviewed direct cross-site integration, but the supplied frontend uses the
same-origin proxy. Browser third-party policy can block a direct cross-site
alternative; it is not needed by the default architecture.

Browser bootstrapping restores through `POST /api/auth/session` and renews before
access expiry. Requests within a tab deduplicate; Web Locks serializes refresh
across tabs where supported. A concurrent cookie rotation in a browser without
Web Locks fails closed and can require sign-in. Revisions prevent a delayed
bootstrap from clearing a new login or restoring an account after sign-out.

This limits persistent token exposure; it does not eliminate XSS. Malicious
same-origin script can still use a current account or make cookie-authorized
requests. CSP/content validation and operational controls remain relevant.

## Recovering interrupted account creation

After successful legacy/Firebase credential authentication, an idempotent
profile upsert creates only missing baseline fields. It never overwrites saved
profile edits. Duplicate-index races reread the winning profile. A failed
profile/session write returns an error and issues no success token; a subsequent
sign-in repairs an account left behind by an interrupted signup. This is not a
transactional guarantee that an unsuccessful signup leaves no account record.

## Verification and acceptance

- `server/test/sessions.test.cjs`: route-level credential/CSRF/expiry/replay,
  global revocation, provider outage and idempotent profile recovery regressions
  using controlled model/provider boundaries.
- `client/test/auth-session.test.cjs`: actual helper/store renewal races, memory
  state, authorization failures and truthful logout behavior.
- `client/test/auth-proxy.test.cjs`: rejects missing production and unsafe
  upstream configuration.
- `server/test/sessions.integration.test.cjs`: opt-in real loopback MongoDB
  rotation/concurrent replay, global revocation, logout and profile-repair races.
- `server/test/firebase-emulator.integration.test.cjs`: demo-only Auth emulator
  and loopback MongoDB acceptance for sign-in/exchange, verified legacy linking,
  password recovery/old-password refusal, disabled/revoked identities and logout
  replay. It rejects real project IDs and credential files. This proves emulator
  contracts when its CI run succeeds; it does not prove email delivery or live
  provider/hosting configuration. No external recovery email is delivered.

Windows Application Control prevents the local MongoDB executable, so the real
database/emulator suites are explicitly skipped locally and supplied to CI.
Staging must still prove HTTPS cookie round-trip through the actual hosting
proxy, correct identity domains, genuine recovery-email delivery, sessions across
tabs/restarts, indexes and rollback compatibility before production rollout.

Primary references: [Next rewrites](https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites),
[Firebase persistence](https://firebase.google.com/docs/auth/web/auth-state-persistence),
[cookie attributes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie),
[Firebase Auth emulator](https://firebase.google.com/docs/emulator-suite/connect_auth).
