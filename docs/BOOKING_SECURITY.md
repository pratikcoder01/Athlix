# Coaching discovery, schedules and session bookings

The coaching directory and `/bookings` screens use persisted API records. They
contain no fabricated coach IDs, reviews, availability, confirmations or payment
results. A new athlete account can discover published coaches and request a
session. Coach access requires trusted role provisioning; an approved coach then
uses `/coach-settings` to publish a rate, currency and weekly availability.

## Schedule and price contract

- Availability is explicitly **UTC**, with named weekdays and `HH:mm` windows on
  the same UTC day. The coach must review and confirm this before publishing.
  Hours do not shift automatically for daylight saving time. Existing schedules
  lacking a confirmed timezone/currency remain unavailable until reviewed.
- The athlete enters their device's local date/time. The form shows its UTC
  equivalent and sends that exact instant. Requests must be within the next 90
  days, start on a 15-minute boundary, and last 15–240 minutes in 15-minute steps.
- Only active, approved coaches with published settings can receive requests.
  The server checks the full session against the stored weekly window.
- The server derives the amount from the stored hourly rate and duration using
  cents and two-decimal rounding. Supported currencies are INR and USD. An old
  client's `price` is ignored; a supplied quote must match the current stored
  rate and currency, otherwise the API returns 409 for the athlete to refresh.
- A zero rate means a free session. ATHLIX currently schedules sessions only;
  it does not collect online payments or assert that an amount was settled.

## Concurrency and authorization

Booking writes and coach settings require a transaction-capable MongoDB replica
set. A standalone database fails closed with 503; there is no check-then-insert
fallback. `BookingScheduleLock` uses MongoDB's native unique `_id` index to create
one stable coordination document per participant. Every booking mutation acquires
both participant documents in sorted order inside the transaction **before**
reading conflicts. Coach settings acquire the same coach document. MongoDB driver
transaction retries then re-run the reads after a conflicting commit.

This serializes requests across API processes and prevents overlapping coach or
athlete reservations, including bookings inserted before the new lock protocol.
Pending and accepted sessions reserve time. Adjacent sessions are allowed.
Notifications are written in the same transaction as the booking; realtime hints
are emitted after commit. A notification write failure cannot return a false
booking success. A lost HTTP response can still leave a committed request: the
client asks users to refresh session history before retrying. Explicit request
idempotency keys remain future work.

Only a participant can manage a booking. The assigned current coach can accept or
decline a pending request, and mark an accepted session completed after its end.
Participants can cancel a pending/accepted session before its start. Terminal
states cannot reopen. Identical retries are read-only and do not duplicate
notifications. History queries include both participant fields, remain available
after a role change, paginate, and omit private contact/identity fields.

Approved role status is a platform permission, not a claim that independently
verified credentials or reviews exist. Published qualifications are self-reported.

## Verification

`node --test server/test/booking.test.cjs server/test/booking.integration.test.cjs`
passes 50 local tests and explicitly skips one real-replica-set suite when
`TEST_MONGO_URI` is unset. The local tests execute real Express handlers and token
middleware with mocked database operations. They cover price tampering, owner
checks, disabled accounts, schedule conflicts, status rules, transaction ordering,
notification failure, publishing rules and input validation. They do not prove
database isolation by themselves.

`client/test/booking-e2e.cjs` drives the real UI and HTTP request wiring with
isolated browser API fixtures: selected coach/local time/UTC conversion and quote,
booking/cancellation, 409/network failures, coach publishing and acceptance. It
checks 360/768/1440px layouts. It does not contact Firebase or MongoDB.

To run the database suite, explicitly set a loopback-only replica-set URI such as
`TEST_MONGO_URI=mongodb://127.0.0.1:27017/?replicaSet=rs0`. The suite rejects remote
seeds, credentials, proxy/file/auth URI options and existing database paths, creates a random
`athlix_booking_test_<uuid>` database, runs independent API processes and cleans up
only that guarded test database. It never reads `MONGO_URI`. This suite covers
cross-process overlap races, actual persistence, notification rollback, pricing
changes and role-audit rollback. It is configured in CI but **NOT RUN locally**:
Windows Application Control blocked the downloaded MongoDB executable. CI results
must be observed before claiming actual database concurrency is verified.

Rescheduling, reminders, cancellation/refund policies, payment collection and
daylight-saving-aware local recurring calendars remain outside this milestone.
