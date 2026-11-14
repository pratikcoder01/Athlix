# Persisted single-elimination events

The `/tournaments` screen now reads the authenticated tournament API. Approved
organizers/admins can publish an event. Athletes can register once before the
deadline while registration is open. Entry fees are informational USD amounts;
ATHLIX has no checkout or payment collection in this flow.

An event supports 2–256 unique athletes. The owner/admin generates a deterministic
single-elimination bracket from registration order, without an AI ability ranking.
Byes advance automatically. Publication locks registration and seed order. Start
the event before recording match winners; each next round uses the previous
round's winners. A final winner is required before completion. Completed events
are read-only. Divisions, withdrawals, score rules, appeals and reseeding are not
implemented; do not represent this as a federation-certified scoring engine.

## Authorization and concurrent writes

- Only the tournament's organizer or an admin can generate/edit its bracket.
  This applies to the legacy `/api/ai/seed-bracket` compatibility endpoint too.
- `POST /api/tournaments/:id/brackets/generate` requires `{ "version": __v }`.
- `PUT /api/tournaments/:id/brackets` requires `version` and `status` and/or a
  validated complete `brackets` tree. Unknown top-level fields and stringified
  arbitrary brackets are rejected. The UI removes Mongoose subdocument metadata.
- Conditional writes compare `__v`, owner and current status, increment `__v`,
  run validators and return 409 for stale edits. Reload data before retrying.
- Registration is one conditional `$addToSet` update with deadline, status,
  capacity and unpublished-bracket predicates. It increments the same version so
  a concurrent publication cannot omit an accepted registration.
- Searches are bounded literal strings with validated filters and pagination.
  Directory/detail responses omit organizer/athlete email addresses.
- Socket subscriptions use actual persisted IDs and resubscribe on connection;
  events trigger an authorized detail reload instead of trusting event payloads.

## Verification and existing data

`node --test server/test/tournament.test.cjs` passes 29 policy/controller tests:
2–256 entrants, byes, invalid trees/IDs/payloads, foreign organizers, compatibility
seeding, stale writes, event transitions, deadline/capacity/dedup predicates.
Controller persistence is mocked. Actual database concurrency is **NOT RUN**:
the local MongoDB executable is blocked by Windows Application Control.

Older brackets with display-name participants or arbitrary model-generated seeds
will fail the stricter tree validation. Export and review those events before
using the new editor; no destructive migration or automatic reseeding is performed.
Existing events should have MongoDB's normal `__v` field before editing.
# Divisions and withdrawal increment (2026-11-14)

Events may configure up to 16 named divisions before the first registration.
The organizer states each division's discipline, capacity and public eligibility
rules; ATHLIX does not verify age, weight, rank or federation eligibility.
One athlete may enter one division per event, with 256 entrants across the event.

Division registration, generation, results and cancellation use the parent event
version. A single conditional document write updates both overall and division
rosters, preventing stale registration from overwriting published seeds. Any
published bracket locks enrollment and athlete withdrawal throughout the event.
Before publication athletes can withdraw and select another division. Entry fees,
refunds and eligibility checks are handled by the organizer outside ATHLIX.

Each division uses the same validated single-elimination progression. Generate
all active division brackets before starting the event; complete their results
before completing the event. The organizer can cancel an unpublished division
before the event starts, including an empty/underfilled division after another
bracket was published. Its entrants are withdrawn and a bounded public reason,
time and acting organizer are stored atomically with the roster change. Other
published brackets remain unchanged. No notification or refund delivery is
claimed. Published divisions and completed results cannot be silently removed.

`tournament-divisions.test.cjs` covers ownership, stale/future versions, capacity,
cross-division duplicates, seed integrity, withdrawal, cancellation and lifecycle.
`tournament-divisions.integration.test.cjs` exercises actual MongoDB races when
an isolated test database is supplied. `tournament-divisions-e2e.cjs` is a browser
transport fixture for configuration, registration/withdrawal, cancellation,
conflict recovery and results; it is not a live federation acceptance test.
