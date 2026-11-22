# Academy operations

The approved academy owner can open **My listings** in `/academies`, select a
listing, then choose **Manage listing, members and attendance**. Administrators
may manage any academy. No other role or academy owner can access member data.
The public directory returns only published, nonarchived listings; legacy
listings without the new flags retain their previous published state.

## Implemented journey

- Listing name, address, coordinates, disciplines, description and schedule can
  be edited. Unpublishing hides the directory entry. Archive hides it and pauses
  member/attendance writes; restore retains the same records. No data is deleted.
- Member records include a unique academy-local code, name, optional email,
  discipline/rank, joining date, active/inactive status and bounded administrative
  notes. The operator must affirm permission before creating a record; the server
  records that acknowledgement's timestamp. This is not an independent consent
  or credentials verification system. Do not store identity documents, medical
  details or payment details. A guardian's permission may be required for minors.
- Daily attendance stores present/absent/excused for one active member per UTC
  date. Repeated saves update that day's status. The UI offers active members
  from the current searchable member page. Dates are limited to the past year;
  no future attendance is accepted. This is daily attendance, not class scheduling.
- The operational summary counts actual total/active/inactive members and today's
  stored attendance. It does not use the old mutable `membersCount` field or
  report revenue, verified credentials or message delivery.

## API and authorization

All routes require authentication. Every operations handler requires
`academy_owner` or `admin` and scopes lookup to the current owner (administrators
use an explicit platform scope). An inaccessible academy returns 404 without
querying member rows. No ownership or stored-count fields are accepted in writes.

| Method/path | Behavior |
| --- | --- |
| `GET /api/academies/:id/operations` | Owned listing and real summary counts |
| `PATCH /api/academies/:id` | Bounded listing changes with `expectedVersion`; optional `isPublished` and `archived` |
| `GET /api/academies/:id/members` | Private literal name/code search; optional status; bounded page/limit |
| `POST /api/academies/:id/members` | Create with `permissionConfirmed:true`; academy/status/timestamp derived server-side |
| `PATCH /api/academies/:id/members/:memberId` | Versioned private member update or deactivation |
| `GET /api/academies/:id/attendance` | Private date-filtered bounded attendance, minimal matched member names/codes |
| `PUT /api/academies/:id/attendance` | Desired-state `{memberId,date,status}` daily record |

Listing and member updates use compare-and-set versions. Reload after a 409
instead of overwriting another operator's changes. Codes are normalized to
uppercase. Unique MongoDB indexes on `(academyId,memberCode)` and
`(academyId,memberId,date)` prevent concurrent duplicates.

Member and attendance writes require a MongoDB replica set. Each transaction
increments the same academy coordination field before reading/writing records,
serializing those writes with listing archive and membership changes across API
workers. Snapshot transactions commit with majority write concern; errors roll
back the entire write. Deploy the required unique indexes through the reviewed
index procedure before admitting traffic; preexisting duplicates require review,
not an automatic destructive cleanup.

## Verification and boundaries

`server/test/academy-operations.test.cjs` covers schema bounds, mass assignment,
tenant/role negatives, server-derived fields, version conflicts, literal search,
archive transaction denial, minimal private population and public visibility.
The existing directory tests also cover these changed listing projections.

`server/test/academy-operations.integration.test.cjs` is opt-in through
`TEST_MONGO_URI` and uses only a validated loopback URI and random
`athlix_academy_test_<32 hex>` database. It checks actual concurrent uniqueness,
tenant isolation, version conflicts, attendance upsert, rollback, archive races
and restoration. The suite drops only its exact generated database. Local Windows
Application Control blocks the MongoDB executable; CI's disposable replica set
must supply actual integration results.

`client/test/academy-operations-e2e.cjs` uses explicit session/API transport
fixtures to check listing editing, member creation and retained duplicate drafts,
attendance replacement, deactivation, archive/restore, role denial and responsive
360/768/1440 widths. These fixture checks do not establish live hosted acceptance.

Billing, payment collection, automated member messages, class-level scheduling,
bulk imports, attendance corrections audit trails and member self-service remain
outside this administrative slice. Listing owner transfer and permanent personal
data erasure require a reviewed operator process; archive is not erasure.
