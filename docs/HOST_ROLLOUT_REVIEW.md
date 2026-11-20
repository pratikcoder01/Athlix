# Hosting rollout review

Observed 2026-11-21, Asia/Calcutta. This is a concrete review packet, not approval
to modify production or purchase services. The source candidate remains on
`codex/athlix-market-ready`; `main` has not been merged by this work.

## Verified hosting state

| Component | Observation |
| --- | --- |
| Vercel project | `athlix-client`, project `prj_Ix66X2kDVsKhApEIHgkEoDg8qosV`; production branch `main` |
| Existing preview | Ready at `4b49f14`; branch `codex/athlix-market-ready`; output `.next` |
| Frontend API configuration | `NEXT_PUBLIC_API_URL` is configured for production and preview. No dedicated auth override was present; the compatibility fix uses the existing value. Public production assets reference `https://athlix-9dc0.onrender.com`. |
| Render API | `Athlix`, service `srv-d8ud9ijtqb8s73b4jdog`, repository `pratikcoder01/Athlix`, branch `main`, root `server`, free Node plan, auto-deploy enabled |
| Live backend revision | Render reports its last live deployment as `02d093d4faa5b5162c84889b32be8db542b89f1f`, completed 2026-06-26. This does not match the new preview's API contracts. |
| Health configuration | No explicit Render health-check path was configured. Read-only health/readiness/CORS requests timed out without an HTTP status. This does not identify a database, routing or application failure. |
| Direct environment settings | Ten entries were inspected. `MONGO_URI`, JWT and matching Firebase configuration are present. No direct `ALLOWED_ORIGIN`, `CV_SERVICE_URL` or `CV_SERVICE_API_KEY` entry was present. Effective inherited configuration must also be reviewed before rollout. |
| Database targeting | The stored SRV URI has credentials but no explicit database path. Do not replace it with a guessed database name. A local read-only metadata attempt failed during SRV DNS resolution; no application documents were read or changed. |
| CV hosting | No matching ATHLIX CV service was found in the authorized Render workspace. The supplied CV template has not been deployed. |

Provider secret values were handled in memory only and are omitted here.
No service environment, database record, deployment, billing setting or email
template was changed by these inspections.

An earlier `vercel curl` preview-access attempt automatically created a project
automation bypass credential. It was immediately revoked after matching its
owner, creation time and scope. Verification showed no remaining automation
secret and unchanged SSO protection. Do not use that command as a supposedly
read-only probe. The CLI credentials authorized by the owner remain separate
from deployment-protection settings.

## Prepared backend rollout

Before changing the existing live service:

1. Select the exact passing candidate commit from PR #2 and record the current
   Render deployment as the rollback reference. Reconfirm the service's current
   revision and any traffic/users before acting.
2. Verify the intended database and identity project, effective environment,
   access permissions, retained data and a usable backup/restore procedure.
   Neither the disposable CI restore drill nor a local DNS failure proves the
   condition of the live database.
3. Review all required collections/indexes from `docs/INDEX_READINESS.md`,
   including operator audit collections. Production startup now performs only
   read-only verification and will reject incomplete/conflicting catalogs. Any
   provisioning is a separately approved, additive operator action. Do not drop
   indexes, delete duplicate records or change database namespaces automatically.
4. Set exact reviewed browser origins for the intended deployment. Known origins
   are production `https://athlix-client.vercel.app` and the stable branch preview
   `https://athlix-client-git-codex-athli-f126ce-nagralep233-1977s-projects.vercel.app`.
   Keep build/runtime API settings consistent and verify the Firebase authorized
   domains before Google/phone acceptance. No wildcard origin is proposed.
5. Configure `/api/ready` as the service readiness path and deploy the immutable
   approved backend candidate. Confirm root/workspace installation and start
   commands before changing their current values. The new session contracts
   deliberately require existing users to sign in again.
6. Verify liveness, readiness, CORS, protected unauthenticated routes and the
   authorized preview's auth-cookie path. Then use explicitly approved test
   accounts/tenants for login, reload/renewal, logout, bookings and role isolation.
   No external recovery email is sent without an approved test recipient.
7. Stop/roll back if the preconditions or checks fail. A restart or a green
   frontend build cannot substitute for backend/database acceptance.

An isolated staging backend/database/identity setup is preferable when the
existing service contains real traffic or records. Creating that setup requires
review of its targets, credentials, costs and separation from production. No
existing production data is silently copied into staging.

## Optional hosted CV service and cost

The reviewed template selects one `1c-2g` service and a 1 GB persistent job-state
disk. The public [Render pricing page](https://render.com/pricing), checked during
this review, lists service compute at **US$25/month** for 1 CPU/2 GB and persistent
disk storage at **US$0.25/GB/month**. The indicative additional base cost is
**US$25.25/month**, before taxes, bandwidth/other usage and any workspace charges.
Confirm the actual checkout/account price before creation; this document is not
an authorization to incur it.

If hosting is approved:

- Build the explicit opt-in image with its hash-verified public model. The fixed
  image path is `/models/pose.task`; runtime uploads never download weights.
- Verify model release/license review, non-root access, persistent-volume write
  permissions, one-instance constraints and actual host resource/timeout behavior.
- Generate a new random server-only service credential, store it only on the
  Express API and CV service, and configure a reviewed reachable service URL.
  Prefer supported private networking; retain service authentication in all cases.
- Exercise generated non-person video rejection, owner isolation, retries,
  deletion, expiry and restart persistence without customer videos. A single-CPU
  image smoke test in CI verifies native execution, not real athlete accuracy or
  production throughput.

If spending is not approved, keep hosted CV unavailable and disclose that state.
Checkout and subscriptions stay disabled under the owner's separate decision.
Sample policy details remain drafts for later owner/legal replacement.
