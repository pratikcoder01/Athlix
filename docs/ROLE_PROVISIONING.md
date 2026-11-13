# Trusted role provisioning

Public legacy and Firebase signup create **athletes only**. A client cannot grant
itself coach, academy owner, organizer or administrator permissions. Existing
operator-assigned roles remain valid at login. ATHLIX does not yet offer a public
role application/review dashboard.

A trusted ATHLIX operator must verify a role request outside the application,
record the approval/ticket and then run the operator CLI with restricted database
credentials. Database access is the trust boundary; this command is not exposed
through HTTP. The `operator` field is a human audit attribution, not proof of the
operator's identity. Restrict shell/database access and retain the approval in
your organization’s access review system. Never place database credentials in
command arguments, source control or the approval record.

From `server/`, install dependencies and set `MONGO_URI` to an explicitly reviewed
development/staging database. The following command previews a change only:

```sh
npm run role:provision -- --user-id 507f1f77bcf86cd799439011 --expected-role athlete --role coach --operator "operator@example.test" --reason "Approved credentials in ticket ATH-123"
```

Review the database, account ID, expected/current role, new role and reason.
Append `--apply` only when ready to write. Any production role change requires
explicit human approval before execution. No production role changes were run
as part of this implementation.

The CLI requires an active account and an exact expected role, rejects unknown
or duplicate flags, and defaults to a dry run. Apply uses a MongoDB transaction
to commit the role change and `rolechangeaudits` entry together. It refuses
concurrent changes rather than overwriting them. A replica set or transaction
capable MongoDB deployment is required for apply; a standalone MongoDB instance
will fail without committing a role change. The audit records target ID,
previous/new role, operator, reason and creation time. It is a database audit
trail, not a tamper-proof ledger. No public API can edit it.

For a newly approved coach, the CLI creates an inactive coach profile. The coach
must configure real rates and availability and activate the profile before
accepting bookings. Revoking a coach role deactivates its coach profile. To revoke
another privileged role, use that role as `--expected-role` and `athlete` as
`--role`, with a fresh review reason.

The first administrator can be provisioned through this same trusted database
operator process, with `admin` as the target role. This does not create a public
bootstrap endpoint or hard-coded administrator credentials.

## Firebase account linking

Firebase exchanges verify revocation/disabled status. An existing ATHLIX account
may link by email only when Firebase reports `email_verified: true` and the
account has no other Firebase UID. A conflicting identity returns 409. Linking
is atomic and preserves the database role. Existing users who encounter the
verification message must verify the email through their identity provider,
refresh their Firebase ID token and retry. Never bypass this check to repair a
login issue.

## Existing account review

The fix prevents new self-granted roles; it cannot establish the provenance of
old privileged accounts. Review all existing coach, academy owner, organizer
and admin accounts against approval evidence before a public launch. This
implementation intentionally does not demote, delete or migrate existing users.
JWT-protected HTTP requests and new Socket.IO connections read current account
state from the database. Already connected sockets and long-lived issued tokens
still need the broader session revocation work described in the roadmap.

## Verification limits

Regression tests execute real HTTP routes with mocked database/provider methods
and exercise CLI dry-run/transaction orchestration. They do not establish that a
deployed Firebase project, database transaction or production operator workflow
is configured correctly. Run staging smoke tests with controlled accounts before
release and test transaction rollback using the deployment’s MongoDB version.
