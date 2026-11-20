# Hosted contract preflight

`scripts/verify-hosts.cjs` performs five unauthenticated checks against explicitly
supplied backend and frontend origins. It accepts no account credentials and
uses only GET and OPTIONS. It never follows redirects, signs in, creates users,
sends recovery messages, changes host settings, or reads product records.

Run from the repository root after the operator has reviewed the target origins:

```sh
node scripts/verify-hosts.cjs --backend https://your-api.example --frontend https://your-app.example
```

Both arguments must be exact HTTPS origins without credentials, paths, query
parameters or fragments. Localhost, `127.0.0.1` and `::1` are rejected; the CLI is
for explicit hosted targets. It does not discover or establish ownership of an
arbitrary domain. Example origins above are placeholders, not deployed services.

The requests are bounded to 20 seconds each and run concurrently, with no retry
loop. Health/CORS bodies are limited to 16 KiB; the frontend document is examined
only through its first 16 KiB. Response bodies, cookies and raw network errors
are not printed. The JSON report includes only the supplied public origins,
check names, HTTP statuses when received, and fixed result codes. Exit status 0
means these five contracts passed; 1 means at least one could not be verified;
2 means the supplied arguments could not start a check.

| Check | Required evidence |
| --- | --- |
| Backend liveness | `/api/health` returns 200 JSON with `success: true`, `status: alive` and `Cache-Control: no-store` |
| Backend readiness | `/api/ready` returns 200 JSON with `success: true`, `status: ready` and `Cache-Control: no-store` |
| Allowed frontend CORS | Preflight for `/api/training` grants the exact supplied frontend origin, credentials, GET and Authorization, and varies by Origin |
| Untrusted origin CORS | A preflight using a reserved `.invalid` origin receives no Access-Control-Allow-Origin grant |
| Frontend document | Root returns a 200 HTML document containing the ATHLIX name |

A redirect or 401/403 on the frontend is reported as blocked. For example, a
Vercel SSO redirect establishes that account access is required; the tool does
not remove deployment protection or treat that as an application failure.
Timeout/network codes mean no usable HTTP response was obtained, not that the
service is necessarily offline or that its CORS policy is wrong.

## Scope of the result

`authenticatedJourneys` always remains `not_run`. Passing this preflight does not
prove login, refresh-cookie rotation, password recovery, authorization, database
transactions/indexes, video processing, paid-provider behavior or legal approval.
The readiness endpoint checks current database connection/drain state; it does
not probe every dependency. Controlled CI and authorized hosted acceptance are
separate evidence.

Use a reviewed test account and authorized preview access for the subsequent
sign-in, reload/renewal, logout, recovery and role/ownership journeys. Provider
emails, customer-data writes and production configuration changes require their
own concrete authorization. No credential or account-session argument is offered
by this tool.

## Observations for ATHLIX

On 2026-11-15, the public production frontend at
`https://athlix-client.vercel.app` returned an HTML document. Its public compiled
scripts referenced backend origin `https://athlix-9dc0.onrender.com`. This
identifies an observed production configuration, not an approved staging target.

Earlier credential-free requests to that backend's health, readiness and CORS
endpoints timed out without an HTTP status. A separate transport check completed
DNS/TCP/TLS but received no HTTP response within its 20-second bound. Those
observations leave host acceptance unverified; they do not diagnose a route,
authentication, CORS or database error. No provider settings were changed.

The feature-branch Vercel preview deployed successfully at `4b49f14`; anonymous
access redirected to Vercel SSO. Its hosted authenticated journeys remain
unverified until authorized access and a reviewed test account are available.

## Regression coverage

`node --test server/test/host-preflight.test.cjs` uses injected fetch responses
only. It starts no local server and covers argument rejection before networking,
credential-free request methods/options, positive and negative CORS, unhealthy
database/cache responses, protected previews, response bounds and safe error
reporting. It cannot establish a real host result.
