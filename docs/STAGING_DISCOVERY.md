# Hosting and identity discovery

Observed 2026-11-15 (Asia/Calcutta). These are read-only configuration findings,
not a completed staging acceptance test. The owner has not identified a separate
staging Firebase project, Vercel project or Render service. The existing Firebase
project was therefore treated as live and was not changed.

## Firebase configuration observed

The already authenticated Firebase CLI could list the ATHLIX project and read
the matching web-app configuration. Its existing authorization was used in
memory through the CLI's own client; credentials were not copied into the repo,
printed, or read directly from credential files. Auth API reads requested only
the configuration fields needed below, excluding password-hash settings, test
phone numbers/codes, SMTP credentials and provider client secrets.

| Setting | Observed value |
| --- | --- |
| Project | `athlix-4c83d`, display name `Athlix`, active |
| Web app | Display name `athlix`, app ID `1:434786819069:web:bb7fc6865ab6c7bd0b1794` |
| SDK project/auth domain | `athlix-4c83d` / `athlix-4c83d.firebaseapp.com` |
| Authorized domains | `localhost`, `athlix-4c83d.firebaseapp.com`, `athlix-4c83d.web.app`, `athlix-client.vercel.app` |
| Email sign-in | Enabled; password required |
| Phone sign-in | Enabled |
| Anonymous sign-in | Enabled |
| Google provider | `google.com` enabled; standard-provider list had no further page |
| Email delivery method | `DEFAULT` |
| Password-reset sender local part | `noreply` |
| Password-reset body format | `HTML` |
| Email action callback | `https://athlix-4c83d.firebaseapp.com/__/auth/action` |
| Custom email-domain verification | `NOT_STARTED`; no applied custom domain was returned |

These project/app identifiers and domains are public SDK configuration. API keys,
OAuth client IDs/secrets, access/refresh tokens and full email-template bodies are
intentionally omitted from this record.

## Implications for the current source

- The live email action callback still points to Firebase's hosted handler. The
  ATHLIX `/reset-password` page is implemented and tested with controlled action
  codes, but the observed outgoing email configuration does not yet route users
  to that custom page. No template setting was changed and no recovery email was
  sent. Decide the exact staging handler origin before preparing an approved
  template change and genuine email round-trip test.
- The known production frontend domain is authorized. No other Vercel preview or
  dedicated staging hostname was present in the observed allowlist. A concrete
  staging origin must be checked before claiming Google/phone browser acceptance;
  do not broadly add wildcard preview domains.
- Provider enablement proves configuration only. It does not prove OAuth popup
  success, phone/reCAPTCHA/SMS delivery, email delivery, approved sender-domain
  reputation, browser cookie behavior, or API-to-Firebase project agreement on
  the hosted backend. Those journeys remain untested against live services.
- The local source's environment examples do not establish what Vercel/Render
  currently build or run. Match their deployed Firebase project/app, exact
  `AUTH_API_ORIGIN`, API origins/CORS, and production branch before any rollout.

## Hosting access and pending acceptance

At discovery time this session had no connected Vercel or Render tools and no
installed Vercel/Render CLI command. The owner was asked to connect Firebase,
Vercel and Render; the existing Firebase CLI already permits these read-only
checks. Recheck access after connections are confirmed rather than treating this
snapshot as a permanent limitation.

Still required: identify the intended staging project/service names, inspect host
build settings and auto-deploy branches, verify HTTPS auth-cookie proxy behavior,
confirm the backend identity/database/worker configuration and required indexes,
and run controlled identity, recovery, booking and tournament journeys. No hosted
environment, account, user record, email/SMS, payment or production setting was
created, changed, exported or deleted by this discovery.

The inspected reads were the Firebase web-app SDK configuration and the official
[Identity Platform project configuration GET](https://cloud.google.com/identity-platform/docs/reference/rest/v2/projects/getConfig)
and [standard-provider configuration list GET](https://cloud.google.com/identity-platform/docs/reference/rest/v2/projects.defaultSupportedIdpConfigs/list).
Field interpretation follows the official [configuration schema](https://cloud.google.com/identity-platform/docs/reference/rest/v2/Config).
