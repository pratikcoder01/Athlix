# ATHLIX API and realtime contract

Updated 2026-11-14 from current routes/controllers. This is a source contract,
not evidence that cloud services or every database flow passed integration tests.

## Authentication, limits and errors

Except public authentication and health probes, routes require
`Authorization: Bearer <ATHLIX JWT>`. The API verifies HS256, expiry, a valid user
ID and an active current MongoDB account; roles come from that account. Firebase
ID tokens must first be exchanged. Public signup cannot grant professional roles.
JWTs currently last 30 days; browser-local storage and global revocation remain
release work. Firebase revocation is checked at exchange, not on each API call.

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
| `POST /login` | Public | `{email,password}`; authenticates an active legacy account and returns JWT/current user. |
| `POST /firebase` | Public | `{idToken,name?,discipline?,role?}`; verifies Firebase identity/revocation. Optional role accepts only `athlete`. New users are athletes; existing database roles are preserved. Legacy email linking needs verified email and an unlinked-account compare-and-set; conflicting UID links return 409. |
| `GET /me` | Active account | Returns authenticated account/profile context. |

Professional access uses the audited operator CLI, not a public role-change API:
[role provisioning](ROLE_PROVISIONING.md). Password recovery uses Firebase's client
SDK/action links; there is no ATHLIX HTTP password-reset endpoint. Legacy bcrypt
recovery limits are explained in [password recovery](PASSWORD_RECOVERY.md).

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

There are no member, attendance, academy edit/delete or billing APIs in this slice.

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

## Tournaments — `/api/tournaments`

| Method/path | Access | Request and behavior |
| --- | --- | --- |
| `GET /` | Active account | Literal `search` (max100), `discipline,status,page,limit` default24/max100. Returns `tournaments,count,page,limit`. |
| `GET /:id` | Active account | Persisted event, public organizer/registered athlete names and bracket/version; no participant emails. |
| `POST /` | Organizer/admin | Strict `{title,description,date,registrationDeadline,location,entryFee,disciplines}`. Future offset-bearing dates, deadline no later than event, bounded text/fee. Session sets owner; client brackets are not accepted here. |
| `POST /:id/register` | Athlete | No identity/price body. Atomic enrollment before deadline, upcoming status, capacity256 and unpublished bracket; duplicate/closed enrollment returns409. |
| `POST /:id/brackets/generate` | Event owner/admin | `{version: __v}`. Requires2–256 registered athletes and unpublished upcoming event. Deterministic registration-order single elimination, automatic byes; no model ability ranking. Publication closes registration. |
| `PUT /:id/brackets` | Event owner/admin | Strict `{version,brackets?,status?}`, at least one change. Validated complete seed/round/match tree; participants are roster IDs/`BYE`/`TBD`, not arbitrary labels. Published seed identities/order cannot change. Results require ongoing status; corrections clear dependent results. Final winner required for completion; completed events are read-only. |

Writes compare the fetched/current `__v`, owner and state and increment version;
stale edits return409. Status progresses upcoming → ongoing → completed. Entry
fees are informational, with no collection. See [tree contract and existing-data
limitations](TOURNAMENTS.md); divisions/withdrawals/reseeding are not implemented.

## Text community — `/api/posts`

All routes require an active account; writes add a shared30/IP/15-minute budget.

| Method/path | Request and behavior |
| --- | --- |
| `GET /` | `page,limit` default12/max50; newest-first posts with public author ID/name/role, `likesCount,likedByMe,commentsCount,hasMore`. Raw liker identities are omitted; comment totals come from persisted comments. |
| `POST /` | Strict `{content}`: 1–5000 trimmed characters; author is session-derived. Text only, no media/author/status fields. |
| `POST /:id/like` | Strict `{liked: boolean}` sets desired state atomically/idempotently; no blind toggle or supplied actor ID. |
| `GET /:id/comments` | Valid existing post; `page,limit` default12/max50; oldest-first comments with public author fields and `hasMore`. |
| `POST /:id/comments` | Strict `{content}`: 1–2000 trimmed characters; session-derived author and validated route target. |

No post/comment edit/delete, moderation, follows or social-notification workflow
is exposed. See [community behavior and test limitations](COMMUNITY.md).

## Video analysis — `/api/cv`

All routes require an active account plus configured internal worker URL/key.

| Method/path | Request and behavior |
| --- | --- |
| `POST /analyze` | Multipart one `file` plus `consent` string `true`; matching MP4/MOV/AVI/WebM extension/MIME; nonempty, ≤25 MiB. Five submissions/account/15 minutes, two concurrent API uploads/process. Returns202/task ID only when accepted. |
| `GET /status/:id` | UUIDv4 task ID; proxy derives owner from session. Another user's, expired or lost task returns404; completed results are private/no-store. |
| `DELETE /status/:id` | Same owner scope; deletes completed/failed result (204). Active job deletion returns409. |

The browser never receives the internal service key or chooses an owner header.
Python requires that key and derived owner before parsing uploads; it is not a
public browser API. Worker budgets: one admitted job, 60sec/1080p/60fps video,
bounded frames, 180sec processing deadline, temporary-file cleanup and 15-minute
result expiry. Store/queue is single-worker/ephemeral; missing model/config is an
error, not a score. Native inference remains gated/unverified; see
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
| `POST /save-plan` | Strict `{plan}` with the same bounded full-plan schema; saves under caller-derived `athleteId`. Supplied identity/metadata is rejected. No provider call or plan-history read endpoint. |
| `POST /match-coach` | Strict `{query,location?}` (max500/200). Roster capped25, limited to published UTC active profiles and active approved coach accounts. A second allowlist excludes contacts, identity controls and invented ratings from both provider prompt and API result. Returned IDs must be unique roster IDs; match scores are experimental suggestions, not measured ability. Use `/api/bookings/coaches` for ordinary discovery. |
| `POST /wellbeing-nudge` | Strict finite numeric `{currentPeriodHours,trailingAverageHours}`: current0–168, baseline >0 and≤168. No division by a supplied zero baseline. Output is a bounded120-character general reminder from user-reported observations, not verified activity or medical advice. |

## Probes and Socket.IO

`GET /api/health` is public200 `{success:true,status:"alive"}`. Public
`GET /api/ready` is200 only while MongoDB reports connected and the process is
not draining; otherwise503. Both are no-store and outside user rate buckets.
Neither probes Firebase/CV/paid providers or proves transaction support.

Socket.IO handshake uses `auth: {token: <ATHLIX JWT>}`. HS256/expiry/current active
account and exact browser origin are checked; personal room is derived server-side.
**There is no `join_user_room` handler.** `join_tournament_room(id, acknowledge)`
checks real event ID/existence and current session, matching authenticated HTTP
read visibility. `leave_tournament_room(id)` unsubscribes. Limits:10 tournament
rooms/socket,20 join attempts/minute and32 KiB incoming messages. Reconnects must
resubscribe. JWT expiry disconnects; disabling rechecks within30 seconds.

Server events: `notification` and `booking_update` target private participant
rooms; `bracket_update` targets `tournament_<id>`; `new_post` broadcasts safe saved
posts to authenticated clients. Persisted API state is authoritative; clients
reload after hints/reconnect. Social notification delivery is not implemented.
See [realtime authentication and CORS](REALTIME_SECURITY.md).
