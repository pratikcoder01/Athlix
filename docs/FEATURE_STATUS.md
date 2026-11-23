# Product feature status

Updated 2026-11-23 for source and hosted evidence. The implementation column
describes code behavior and its regression/fixture coverage; it does **not** mean
the feature was deployed or accepted against live services. Latest aggregate
test counts and remote run outcomes are tracked in [verification](VERIFICATION.md)
and [PR #3](https://github.com/pratikcoder01/Athlix/pull/3). The owner merged PR #2
on 22 November. Older green CI runs do not establish the result of later source.
The last authenticated hosted qualification covered `24aafcc`; the design
candidate `a688403` passed both CI runs with 508 JavaScript and 37 Python tests.
All five public host contracts passed again on 23 November; this unauthenticated
probe does not determine the deployed source revision.
Approved backup/catalog preparation, runtime database privileges and restricted
network acceptance are complete. Expanded HTTPS QA passed 66 assertions across
106 recorded API requests, plus 26 browser login/reload/logout checks and 13 real
Firebase recovery UI checks. All five temporary identities and their owned data
were removed; three labeled role-audit records remain. Real email/SMS delivery was
not exercised. See
[host rollout evidence](HOST_ROLLOUT_REVIEW.md) for precise live outcomes and limits.

| Audience/area | Implemented source behavior | Remaining or gated |
| --- | --- | --- |
| Accounts | Athlete-only public signup; verified Firebase legacy linking; idempotent missing-profile recovery; 15-minute memory-only access JWTs; seven-day absolute HttpOnly cookie sessions with hashed credential rotation/replay detection, current account/session checks and global revocation; same-origin auth proxy; real Firebase recovery; audited role CLI; phone reCAPTCHA/consumed-code retry and abandoned-operation guards; confirmed cross-tab sign-out hints and serialized auth-cookie mutations; earlier hosted password/session/privacy, browser logout/signed-out reload and action-code password reset passed | Actual recovery-email/template delivery and Google/phone acceptance; operator-approved account migration/erasure; broader browser/restart/account-switch and XSS qualification. New phone/session source checks are not live SMS or hosted release acceptance. The preexisting-role inventory was reviewed; future professional approval still needs a responsible operator |
| Athletes | Saved profile and self-reported achievements; private versioned training journal with idempotent creates, edits and archive; owner-only saved-plan retrieval; published coach discovery; real session requests/cancellation; event/division registration/withdrawal; text community and stored inbox | Independently verified achievements, richer onboarding, rescheduling and coach-approved training exchanges; archive is not permanent data erasure |
| Coaches | Operator-approved role; stored hourly rates/currency and explicit UTC availability; publish/unpublish; booking acceptance/rejection/completion; accepted/completed-booking client directory and pair-private versioned coaching notes; stored booking notifications; hosted booking price/conflict/participant and private client-note persistence/version/isolation checks passed | Fuller role-UI/inbox qualification, independent credentials verification, timezone-local recurrence, rescheduling, billing and broader CRM; coaches cannot read athletes' private journals through client APIs |
| Academies | Published listing directory; owner/admin listing editing, unpublish, archive/restore; permission-acknowledged private member records, versioned edits/deactivation; daily UTC attendance and actual operational counts; transactional archive/member/attendance coordination; hosted member/attendance/version/permission/count and tenant-denial checks passed | Broader role-UI/archive race qualification, billing, class-level scheduling, imports, owner transfer, member self-service and reviewed retention/erasure; archive preserves records |
| Organizers | Real owned events; up to 16 divisions and one division per athlete; bounded registration/capacity; prepublication withdrawal; versioned single-elimination brackets/byes/results; cancellation of an unpublished division with public reason and roster update; realtime refresh hints; dry-run-first audited legacy conversion tool; hosted two-athlete division registration, bracket publication, match result and completion plus ownership/version/transition rejections passed | Broader role-UI/realtime qualification and actual legacy-source decisions; automated age/weight/rank eligibility, score rules/appeals, richer formats, published-bracket forfeits/reseeding and federation certification; fees/refunds remain outside ATHLIX |
| Community | Persisted text feed/comments; desired-state likes and real counts; author-only versioned edits and soft removal; bounded reports; admin-only queue and transactional hide/dismiss decisions with audit; hidden/deleted content filtering; basic hosted author/ownership checks passed | Full hosted administrative moderation acceptance, human moderation ownership/policies, appeals, legal erasure/retention, media, following and automatic social notifications; soft removal retains private records |
| Kata feedback | Owner-scoped consented bounded uploads; idempotent owner/request/video retries; exclusive single-instance SQLite job/result state; expired-result deletion; interrupted jobs fail explicitly on restart; pinned model manifest/provisioning; native/container execution and restart acceptance passed in both `24aafcc` CI runs; resource-limited Docker/Compose/Render templates; observed-component heuristic feedback | Paid hosting approval, actual target-host image/model/disk/resource acceptance, permissioned combat-sports benchmark and expert usefulness review; no accuracy/force/kata-recognition claim; horizontal scaling needs a different shared-job design |
| Provider coaching | Default-off explicit opt-in; bounded schemas/budgets; public published-coach allowlist; caller-owned validated plan saves; saved plans remain readable when provider features are disabled | Live provider/privacy acceptance, evaluated usefulness, distributed budgets and operator-approved commercial terms |
| Marketing/commercial | Factual pilot scope, no fabricated social proof or revenue; checkout remains disabled by owner decision until prices are decided; user-opened contact draft; factual pitch documents | Approved support mailbox, customer evidence, pricing validation, secure billing/entitlements if later approved, and reviewed privacy/terms |
| Operations | Canonical locked installs; CI source/database/emulator/browser/native/container/audit coverage; reviewed compatible development-tool cleanup with zero full/production audit findings on 23 November; request IDs/safe logs; liveness/readiness; bounded shutdown; approved encrypted local backup and additive catalog preparation; restricted runtime database identity/network and fresh backend pool verified; all five hosted preflights passed | Remaining browser/provider and fuller role-workflow qualification; off-device backup and an isolated full hosted restore, host drain/load exercises, telemetry/support/moderation ownership and full accessibility/performance qualification |

Some illustrative mockups and the bracket simulator remain explicitly labeled
examples. The product remains a development/pilot candidate. Completed source
slices and passing synthetic checks do not constitute a market-ready release.

Subsystem contracts: [sessions](SESSION_SECURITY.md), [training/clients/inbox](TRAINING_AND_CLIENTS.md),
[academy operations](ACADEMY_OPERATIONS.md), [tournaments](TOURNAMENTS.md),
[moderation](COMMUNITY_MODERATION.md), [migration review](MIGRATION_REVIEW.md),
and [video worker](../cv-service/README.md).
