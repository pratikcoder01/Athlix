# Training, coaching clients and in-app notifications

Implemented on the review branch; no customer records or hosted services were
changed. These are persisted account workspaces, not proof of completed live
provider acceptance or externally verified athletic achievements.

## Private training history

`/training` records completed practice with a calendar date, discipline, duration,
focus, optional perceived effort and private notes. Dates must be actual calendar
dates from 1900 through today in UTC; duration is 1–1,440 whole minutes, effort
1–10, focus at most 200 characters and notes at most 3,000. Values are
self-reported. No score, physiological measurement or medical inference is
created from them.

All entry reads/writes derive `athleteId` from the authenticated principal,
including after an account's role changes. Coaches cannot read an athlete's
private journal through their client directory. The strict request schemas
reject supplied actor IDs and unknown properties. Lists have bounded pagination.

`POST /api/training/entries` uses an account-scoped unique browser draft UUID.
An identical retry returns the already persisted entry. Reusing that UUID for
different or archived work returns 409. Edits require the current record version
and update conditionally with ownership, active state and version in one write.
Stale/foreign writes return the same conflict without disclosing foreign records.

The Archive action removes the entry from active history with a versioned
`deletedAt` update. **Archive is not permanent data erasure:** the record remains
in storage for recovery/account operations. There is no advertised retention or
legal-erasure policy supplied by this implementation. The UI says Archive.

`GET /api/training/plans` and `/plans/:id` retrieve only the caller's saved plans;
they remain available when experimental AI is disabled. A plan is a suggestion,
not completed work. No synthetic plan is inserted to populate an empty page.

## Coach client workspace

`/clients` is restricted to current approved coach accounts. Its directory is
derived from that coach's accepted/completed bookings, grouped by athlete. It
shows real session counts and the athlete's public name, discipline and belt.
Unaccepted requests do not create a client relationship. The detail endpoint
returns only sessions where both the coach and athlete match the actor's actual
relationship. Private contacts, account controls and training journals are not
returned.

Coaching notes are private to one `(coachId, athleteId)` pair. The first save and
all subsequent writes compare a client version; the compound unique index
prevents concurrent initial writes from producing duplicate note records.
Competing/stale writes return 409. Drafts remain visible after a failed save;
reload is explicit before replacing them with the server copy. Other coaches,
the athlete and administrator roles cannot access that coach's private workspace
through these endpoints. This is a coaching record, not medical-record software.

## Durable in-app inbox

`/notifications` reads existing database notifications for the authenticated
recipient, with bounded pages, an unread filter and persisted read/unread state.
Booking creation/status changes already write these notifications in the booking
transaction. No email, mobile push or social-notification delivery is claimed.

The Socket provider now treats realtime events as refresh hints. Initial load,
reconnect, focus and successful inbox updates reload the recipient's stored
records and unread count; an event cannot fabricate an unread increment. Errors
are exposed through `notificationError` instead of reporting a successful
persistence operation. Mark-all-read uses a recipient-scoped write through the
request's server timestamp, so later notifications remain unread.

Only reviewed internal workspace links can be followed. Legacy external,
protocol-relative, traversal and backslash URLs are removed from API responses.
Sender/recipient identifiers are not included in inbox projections.

## Verification

- `server/test/training-workspace.test.cjs`: anonymous/role rejection, strict
  schema and bounds, principal-derived filters, safe projections, create retries,
  conditional versions, foreign records, notes conflicts, recipient isolation and
  safe notification links.
- `server/test/training-workspace.integration.test.cjs`: opt-in isolated loopback
  MongoDB suite exercises actual unique indexes, concurrent drafts/edits/notes,
  owner-only plans, aggregate-derived clients and persisted inbox state. It never
  reads the production database URI. Local Windows executable restrictions mean
  actual database execution must be observed in CI rather than claimed locally.
- `client/test/training-workspace-e2e.cjs`: explicit API/session transport fixtures
  exercise save/reload/edit/archive, retained drafts after conflicts, saved plan
  rendering, coach notes, inbox read state and 360/768/1440 widths. These fixtures
  do not establish live Firebase/MongoDB integration.

Required indexes must be created through the approved deployment process before
accepting concurrent traffic. No production index build or data migration ran.
