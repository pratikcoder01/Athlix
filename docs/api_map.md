# ATHLIX API and realtime contract

Updated 2026-11-14 from current routes/controllers. This is a source contract,
not evidence that cloud services or every database flow passed integration tests.

## Authentication, limits and errors

Except public sign-in/health and the cookie-authorized session/logout routes,
requests require `Authorization: Bearer <ATHLIX JWT>`. Access tokens last 15
minutes and require HS256, issuer `athlix`, audience `athlix-api`, valid account
and session IDs, issued-at/expiry and account session version. Every protected
request checks the active current account/version and unexpired unrevoked session;
roles come from the account. Old 30-day/sessionless tokens are rejected.

Browser access tokens stay in memory. A hashed rotating refresh credential is
delivered only in a host-only HttpOnly cookie with a seven-day absolute deadline;
it uses Secure and the `__Host-` name in production. The browser sends auth calls
through the fixed same-origin Next `/api/auth/*` proxy, configured server-side by
`AUTH_API_ORIGIN`. Cookie refresh/logout require an exact trusted Origin plus
`X-ATHLIX-Session: 1`, independently of CORS. Untrusted browser login origins are
also denied. Firebase identity/revocation is checked at exchange and cookie
renewal; Firebase-only revocation can leave an already issued access token valid
for its remaining 15 minutes. See [session contract](SESSION_SECURITY.md).

JSON/form bodies have a 128 KiB limit; video has its own multipart limits.
General API budget is 600/IP/15 minutes; auth attempts add 30/IP/15 minutes.
Limits are process-local; enabled AI coaching adds five requests/account/15 minutes. Exact
HTTP/WebSocket browser origins use `ALLOWED_ORIGIN`; production requires it.
Every HTTP response has a generated `X-Request-ID`. Central errors return
`{ success: false, message, requestId }`; controller/CV responses are not yet a
uniform envelope. Typical errors: 400 invalid input, 401 missing/invalid session,
403 role/ownership denial, 404 absent resource, 409 stale/conflicting state,
413 size limit, 415 unsupported video, 429 throttling, 502/503 unavailable service.
Internal errors are sanitized. See [operations](OPERATIONS.md).

## Authentication — `/api/auth`

| Method/path | Access | Request and behavior |
| --- | --- | --- |
| `POST /register` | Public | Legacy bcrypt: `{name,email,password,role?,discipline?,beltRank?}`. `role` must be `athlete` or omitted; creates athlete/profile and returns JWT/user. Parsed defaults apply; extra identity/status fields are discarded. |
| `POST /login` | Public | `{email,password}`; authenticates an active unlinked legacy account and returns access token/current user plus refresh cookie. Linked accounts must use Firebase sign-in; the old bcrypt password cannot bypass provider recovery. |
| `POST /firebase` | Public | `{idToken,name?,discipline?,role?}`; verifies Firebase identity/revocation. Optional role accepts only `athlete`. New users are athletes; existing database roles are preserved. Legacy email linking needs verified email and an unlinked-account compare-and-set; conflicting UID links return 409. |
| `GET /me` | Active account | Returns authenticated account/profile context. |
| `POST /session` | Valid refresh cookie, trusted Origin/session header | Atomically rotates the hashed credential and returns fresh access token/current user. Replay revokes the session; expiry never extends beyond the original seven-day deadline. |
| `POST /logout` | Cookie contract above | Revokes the supplied session, clears the cookie and returns success; idempotent if no valid session remains. |
| `POST /logout-all` | Active bearer session | Increments the caller's session version and revokes stored sessions, including other devices; clears the cookie. |

Professional access uses the audited operator CLI, not a public role-change API:
[role provisioning](ROLE_PROVISIONING.md). Password recovery uses Firebase's client
SDK/action links; there is no ATHLIX HTTP password-reset endpoint. Legacy bcrypt
recovery limits are explained in [password recovery](PASSWORD_RECOVERY.md).
Sign-in repairs only a missing baseline profile through an idempotent upsert;
existing profile edits are preserved. Failed profile/session writes do not issue
a fabricated success response. Auth responses are no-store.

## Profiles — `/api/profiles`

All routes require an active account. Read responses omit public email, phone,
Firebase UID and account controls; draft coach settings are owner/admin-visible.

| Method/path | Additional access | Request and behavior |
| --- | --- | --- |
| `GET /` | None | Literal `search` (max80), `discipline`, non-admin `role`, `page`, `limit`; default24/max50. Returns `profiles`, `page`, `count`, `hasMore`. |
| `GET /:userId` | None | Valid ObjectID; returns active user's public profile and permitted coach settings. |
| `PUT /` | Self | Nonempty strict subset of `bio,discipline,beltRank,achievements,location,socialLinks,profileImage`. Achievements are self-reported; external URLs require credential-free HTTPS or empty values. |
| `PUT /coach` | Coach | Strict settings subset: `certifications,experienceYears,pricingPerHour,currency,availabilityTimezone,availability,active,autoConfirm`. Currency INR/USD; timezone only UTC. Windows `{dayOfWeek,startTime,endTime}` use same-day `HH:mm`, cannot overlap. Publication requires valid rate/currency/UTC availability. Writes share booking transaction locks. |

See [booking and coach settings](BOOKING_SECURITY.md). No profile update can set
account role or activation. Directory results are persisted records, not evidence
of independently verified qualifications or achievements.

## Academies — `/api/academies`

| Method/path | Access | Request and behavior |
| --- | --- | --- |
| `GET /` | Active account | Literal `search` (max80), `discipline`, `mine=true`, `page`, `limit` (default24/max50). Optional paired `lat,lng` enables nearest search; `maxDistanceKm` 0.1–100, default10. Returns paginated public listings/owner names. |
| `GET /:id` | Active account | Valid ObjectID; public listing/owner name, not contact credentials. |
| `POST /` | Academy owner/admin | Strict `{name,address,longitude,latitude,disciplines,description?,schedule?,gallery?}`; finite longitude −180…180, latitude −90…90 (zero valid), bounded text/HTTPS gallery. Owner is the session account. |
| `GET /analytics` | Owner/organizer/admin | Owners/organizers receive their account-scoped academy/event counts and up to100 recent owned events. Admin scope is platform-wide. `registrationsShown` counts listed events only; no revenue, settled payments or assumed capacity is reported. |
| `GET /:id/operations` | Academy owner/admin | Owner-scoped listing and actual total/active/inactive member counts plus today's stored UTC attendance. |
| `PATCH /:id` | Academy owner/admin | Strict bounded listing changes plus `expectedVersion`; optional `isPublished` and `archived`. Archive hides the listing and blocks operations writes; restore retains records. No owner transfer or permanent delete. |
| `GET /:id/members` | Academy owner/admin | Private literal name/code search, optional `status`, bounded `page,limit`; no other tenant's records. |
| `POST /:id/members` | Academy owner/admin | Strict member code/name/discipline/joined date, optional email/rank/notes and required `permissionConfirmed:true`. Academy/status/permission timestamp are server-derived; codes normalize uppercase. |
| `PATCH /:id/members/:memberId` | Academy owner/admin | `expectedVersion` plus bounded member changes or active/inactive status; conditional tenant/version update. |
| `GET /:id/attendance` | Academy owner/admin | Private `date,page,limit` query; matched member names/codes only. |
| `PUT /:id/attendance` | Academy owner/admin | Strict `{memberId,date,status}` with present/absent/excused, active local member and UTC date in the past year. Desired-state daily upsert. |

Published-directory reads exclude unpublished/archived listings; `mine=true`
returns the caller's own listing state. Member/attendance writes share the academy
transaction lock, serializing against archive and member changes. Required unique
indexes prevent duplicate academy member codes and member/day attendance. Billing,
class scheduling, owner transfer and permanent erasure are not exposed. See
[academy operations](ACADEMY_OPERATIONS.md).

## Coaching sessions — `/api/bookings`

| Method/path | Access | Request and behavior |
| --- | --- | --- |
| `GET /coaches` | Active account | Published UTC profiles of active approved coaches. `search,discipline,coachId,page,limit` (default24/max100); returns `coaches,page,hasMore`, with self-reported credentials and stored rates, not private contacts. |
| `POST /` | Athlete | Strict `{coachId,scheduledTime,durationMinutes,quotedPrice?,quotedCurrency?,price?}`. Start is an offset-bearing ISO instant on a 15-minute boundary, future within90 days; duration15–240 in 15-minute steps. Quote price/currency must appear together. Legacy `price` is ignored; server derives price from stored coach rate. Stale quote, unavailable window or participant overlap returns409. |
| `GET /` | Active account | Only bookings where caller is athlete or coach, including history after role changes. `page,limit` default50/max100; returns `bookings,page,hasMore`. |
| `PATCH /:id` | Participant | Strict `{status}`. Assigned current coach accepts/rejects pending requests or completes accepted sessions after their end. Participants cancel pending/accepted sessions before start. Terminal states cannot reopen; identical retries do not duplicate notifications. |

Pending/accepted sessions reserve both participants. Booking/settings writes need
a MongoDB replica set; unsupported standalone writes return503. Transactions lock
participant schedules and persist notifications before emitting hints. INR/USD
prices schedule sessions; no online payment is collected. See
[booking security and integration evidence](BOOKING_SECURITY.md).

## Private training — `/api/training`

All routes derive ownership from the active caller, including after role changes.
No coach/admin journal access is granted by a supplied athlete ID.

| Method/path | Request and behavior |
| --- | --- |
| `GET /entries` | Caller-owned nonarchived history; `page,limit` default12/max50; `entries,page,hasMore`. |
| `POST /entries` | Strict `{clientRequestId,date,discipline,durationMinutes,focus,notes?,effort?}`. UUID draft key, actual date from1900 through today UTC, duration1–1440 whole minutes, focus max200, notes max3000, effort1–10. An identical account/draft retry returns its saved entry; conflicting reuse returns409. |
| `PATCH /entries/:id` | Complete editable entry fields plus `version`; conditional owner/version/active update. Stale or inaccessible records return409. |
| `DELETE /entries/:id` | Strict `{version}` archives the owner record with `deletedAt`; this removes it from active history without permanent data erasure. |
| `GET /plans` | Caller-owned saved plans with bounded pagination; works while provider AI is disabled. Plans are suggestions, not completed training. |
| `GET /plans/:id` | One caller-owned saved plan; foreign/absent record returns404. |

## Coach clients — `/api/coach-clients`

Only current approved `coach` accounts can use these endpoints. A relationship
requires that coach's accepted/completed booking with the athlete; administrators
do not automatically receive access to another coach's private notes.

| Method/path | Request and behavior |
| --- | --- |
| `GET /` | Bounded `page,limit`; booking-derived client names/public ranks and actual session counts. |
| `GET /:id` | Relationship-scoped client projection, pair-private notes/version and only that coach/athlete's paged sessions; no contacts or private journals. |
| `PUT /:id/notes` | Strict `{notes,version}` (max5000 characters), pair-scoped compare-and-set. Concurrent first saves share a unique `(coachId,athleteId)` index; stale writes return409. |

## Stored inbox — `/api/notifications`

| Method/path | Request and behavior |
| --- | --- |
| `GET /` | Recipient-scoped `page,limit,unreadOnly=true|false`; saved notifications, total unread count and `hasMore`. Projections omit sender/recipient IDs and remove unsafe legacy links. |
| `PATCH /:id` | Strict `{read:boolean}`; recipient-only desired-state read/unread change. |
| `POST /read-all` | Strict `{}`; marks the caller's unread rows through a server timestamp, leaving later notifications unread. |

Booking transactions produce durable in-app notifications. Email, mobile push and
automatic social notifications are not implemented. See
[training, clients and inbox](TRAINING_AND_CLIENTS.md).

## Tournaments — `/api/tournaments`

| Method/path | Access | Request and behavior |
| --- | --- | --- |
| `GET /` | Active account | Literal `search` (max100), `discipline,status,page,limit` default24/max100. Returns `tournaments,count,page,limit`. |
| `GET /:id` | Active account | Persisted event, public organizer/registered athlete names and bracket/version; no participant emails. |
| `POST /` | Organizer/admin | Strict `{title,description,date,registrationDeadline,location,entryFee,disciplines}`. Future offset-bearing dates, deadline no later than event, bounded text/fee. Session sets owner; client brackets are not accepted here. |
| `POST /:id/register` | Athlete | Nondivision events only: atomic enrollment before deadline, upcoming status, capacity256 and unpublished bracket; duplicate/closed enrollment returns409. |
| `POST /:id/brackets/generate` | Event owner/admin | `{version: __v}`. Requires2–256 registered athletes and unpublished upcoming event. Deterministic registration-order single elimination, automatic byes; no model ability ranking. Publication closes registration. |
| `PUT /:id/brackets` | Event owner/admin | Strict `{version,brackets?,status?}`, at least one change. Validated complete seed/round/match tree; participants are roster IDs/`BYE`/`TBD`, not arbitrary labels. Published seed identities/order cannot change. Results require ongoing status; corrections clear dependent results. Final winner required for completion; completed events are read-only. |
| `POST /:id/withdraw` | Athlete | Strict `{version}` removes only the caller from event/division rosters before any bracket is published. No fee refund is processed. |
| `POST /:id/divisions` | Event owner/admin | Strict `{version,key,title,discipline,capacity?,eligibilityNotes?}` before first enrollment/bracket. Unique slug key, event discipline, capacity2–256, up to16 divisions; eligibility is organizer supplied. |
| `POST /:id/divisions/:key/register` | Athlete | Strict `{version}`; one division per athlete/event, division capacity and total256 limit; updates both rosters atomically. |
| `POST /:id/divisions/:key/cancel` | Event owner/admin | Strict `{version,reason}` with public reason5–500 characters. Only an unstarted event's unpublished division; removes its entrants and records bounded public cancellation history. Other published brackets remain unchanged. |
| `POST /:id/divisions/:key/brackets/generate` | Event owner/admin | Strict `{version}`; at least two division athletes and unpublished upcoming event. Publishing any bracket locks all enrollment/athlete withdrawal. |
| `PUT /:id/divisions/:key/brackets` | Event owner/admin | Same strict versioned tree/status contract for one division; event must be ongoing. Published seeds are fixed; complete the division only after its final result. |

Writes compare the fetched/current `__v`, owner and state and increment version;
stale edits return409. Status progresses upcoming → ongoing → completed. Entry
fees are informational, with no collection. Configure all divisions before first
enrollment, generate every active division before event start, and complete them
before event completion. Cancellation can resolve an empty/unpublished division
even after another division publishes. Eligibility/refunds, richer formats,
published-bracket forfeits, appeals and reseeding remain outside this slice. See
[tree/division contract](TOURNAMENTS.md) and the separately approved
[legacy migration review tool](MIGRATION_REVIEW.md); no customer migration ran.

## Text community — `/api/posts`

All routes require an active account; writes add a shared30/IP/15-minute budget.

| Method/path | Request and behavior |
| --- | --- |
| `GET /` | `page,limit` default12/max50; newest-first posts with public author ID/name/role, `likesCount,likedByMe,commentsCount,hasMore`. Raw liker identities are omitted; comment totals come from persisted comments. |
| `POST /` | Strict `{content}`: 1–5000 trimmed characters; author is session-derived. Text only, no media/author/status fields. |
| `POST /:id/like` | Strict `{liked: boolean}` sets desired state atomically/idempotently; no blind toggle or supplied actor ID. |
| `GET /:id/comments` | Valid existing post; `page,limit` default12/max50; oldest-first comments with public author fields and `hasMore`. |
| `POST /:id/comments` | Strict `{content}`: 1–2000 trimmed characters; session-derived author and validated route target. |
| `PATCH /:id` | Author only: strict `{content,expectedVersion}`; versioned visible post edit. |
| `DELETE /:id` | Author only: strict `{expectedVersion}`; soft removal, retaining the private stored original. |
| `PATCH /:id/comments/:commentId` | Stored comment author only: `{content,expectedVersion}` under the visible parent. |
| `DELETE /:id/comments/:commentId` | Stored comment author only: `{expectedVersion}`; versioned soft removal under the visible parent. |
| `POST /:id/report` | Strict `{reason,details?}`; reason spam/harassment/safety/privacy/other, details max1000 and required for other. Session-derived reporter, five reports/account/15 minutes; duplicate target report is idempotent. |
| `POST /:id/comments/:commentId/report` | Same bounded report contract for a visible comment under the validated visible parent. |
| `GET /moderation/reports` | Current admin only: bounded `page,limit,status=open|resolved`; private reports/current target projection. |
| `POST /moderation/reports/:reportId/resolve` | Current admin only: strict `{expectedVersion,action,note,expectedTargetVersion?}`. Action hide/dismiss, bounded nonempty reason; hide requires current target version. Decision/content hide and immutable-schema audit share a transaction. |

Hidden/deleted content is excluded from reads, likes and real comment counts.
Parent visibility and transactional write coordination prevent comment/report
writes after removal. Authors cannot revive hidden content. Soft removal is not
permanent erasure; moderation still needs a human owner/policy. Follows, media,
appeals and automatic social notifications remain unavailable. See
[community](COMMUNITY.md) and [moderation](COMMUNITY_MODERATION.md).

## Video analysis — `/api/cv`

All routes require an active account plus configured internal worker URL/key.

| Method/path | Request and behavior |
| --- | --- |
| `POST /analyze` | Multipart one `file`, `consent` string `true` and optional UUIDv4 `requestId`; matching MP4/MOV/AVI/WebM extension/MIME; nonempty, ≤25 MiB. Five submissions/account/15 minutes, two concurrent API uploads/process. Derived owner/request key is forwarded privately. Same owner/key/video retry finds the original task; conflicting content/key reuse returns409. Returns202/task ID only when accepted. |
| `GET /status/:id` | UUIDv4 task ID; proxy derives owner from session. Another user's, deleted or expired task returns404; completed/failed state is private/no-store. Interrupted jobs fail explicitly after worker restart. |
| `DELETE /status/:id` | Same owner scope; deletes completed/failed result (204). Active job deletion returns409. |

The browser never receives the internal service key or chooses an owner header.
Python requires that key and derived owner before parsing uploads; it is not a
public browser API. Worker budgets: one admitted job, 60sec/1080p/60fps video,
bounded frames, 180sec processing deadline, temporary-file cleanup and 15-minute
result expiry. Private SQLite coordinates admission, idempotency and bounded
state under an exclusive single-instance lease. Completed results survive
reopening only with a persistent local state volume, retaining original expiry;
interrupted work becomes failed and private media is removed. SQLite is not a
horizontal shared queue. Missing model/config is an error, not a score. A pinned
model provisioner and resource-limited container templates/native smoke suites
are supplied; latest CI and actual host/runtime/model quality remain distinct
acceptance checks. See
[worker setup, privacy and production limits](../cv-service/README.md).

## Optional/legacy AI — `/api/ai`

The deterministic seed alias remains available to authorized event owners.
Other AI routes are disabled by default: `AI_COACHING_ENABLED=true` is an explicit
server-only opt-in. Disabled routes return503 before authentication database or
provider work. Enabled routes require active accounts and share a five-request
per-account/15-minute quota. Provider-dependent routes additionally require
Featherless/OpenRouter keys; no live provider acceptance is claimed. Inputs and
outputs have runtime size/type schemas; validated shape does not prove useful or
accurate coaching. These experimental workflows still need supervised evaluation.

| Method/path | Current contract and remaining gaps |
| --- | --- |
| `POST /seed-bracket` | `{tournamentId,version}`; deterministic alias of owned tournament generation above. No provider call or unvalidated model seeding. |
| `POST /training-plan` | Strict `{discipline,trainingGoal,daysAvailablePerWeek?,notes?}` (integer days1–7; goal max500, notes max2000). Runtime-validated output has unique weekdays matching the requested count, bounded drills/text and declared intensity. Not automatically saved. |
| `POST /save-plan` | Strict `{plan}` with the same bounded full-plan schema; saves under caller-derived `athleteId`. Supplied identity/metadata is rejected. No provider call; saved-plan reads use `/api/training/plans` and remain available with AI disabled. |
| `POST /match-coach` | Strict `{query,location?}` (max500/200). Roster capped25, limited to published UTC active profiles and active approved coach accounts. A second allowlist excludes contacts, identity controls and invented ratings from both provider prompt and API result. Returned IDs must be unique roster IDs; match scores are experimental suggestions, not measured ability. Use `/api/bookings/coaches` for ordinary discovery. |
| `POST /wellbeing-nudge` | Strict finite numeric `{currentPeriodHours,trailingAverageHours}`: current0–168, baseline >0 and≤168. No division by a supplied zero baseline. Output is a bounded120-character general reminder from user-reported observations, not verified activity or medical advice. |

## Probes and Socket.IO

`GET /api/health` is public200 `{success:true,status:"alive"}`. Public
`GET /api/ready` is200 only while MongoDB reports connected and the process is
not draining; otherwise503. Both are no-store and outside user rate buckets.
Neither probes Firebase/CV/paid providers or proves transaction support.

Socket.IO handshake uses `auth: {token: <ATHLIX JWT>}`. Access signature/issuer/
audience/expiry, current active account/version, unrevoked session and exact browser
origin are checked; the personal room is derived server-side.
**There is no `join_user_room` handler.** `join_tournament_room(id, acknowledge)`
checks real event ID/existence and current session, matching authenticated HTTP
read visibility. `leave_tournament_room(id)` unsubscribes. Limits:10 tournament
rooms/socket,20 join attempts/minute and32 KiB incoming messages. Reconnects must
resubscribe. JWT expiry disconnects; account disabling/version/session revocation
rechecks on subscription and within30 seconds for passive readers.

Server events: `notification` and `booking_update` target private participant
rooms; `bracket_update` targets `tournament_<id>`; `new_post` broadcasts safe saved
posts to authenticated clients. Persisted API state is authoritative; clients
reload after hints/reconnect/focus. The recipient inbox persists booking notices
and read state; automatic social notification delivery is not implemented.
See [realtime authentication and CORS](REALTIME_SECURITY.md).
