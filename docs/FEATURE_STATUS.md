# Product feature status

Updated 2026-11-22 for the latest source and hosted corrections. The implementation column
describes code behavior and its regression/fixture coverage; it does **not** mean
the feature was deployed or accepted against live services. Latest aggregate
test counts and remote run outcomes are tracked in [verification](VERIFICATION.md)
and [PR #2](https://github.com/pratikcoder01/Athlix/pull/2). Older green CI runs
do not establish the result of later source. The hosted pilot is deployed, with
qualification still in progress: the approved backup/index preparation and
network restriction completed; actual HTTPS acceptance found an internal-field
projection issue that is now corrected in source. See
[host rollout evidence](HOST_ROLLOUT_REVIEW.md) for precise live outcomes and limits.

| Audience/area | Implemented source behavior | Remaining or gated |
| --- | --- | --- |
| Accounts | Athlete-only public signup; verified Firebase legacy linking; idempotent missing-profile recovery; 15-minute memory-only access JWTs; seven-day absolute HttpOnly cookie sessions with hashed credential rotation/replay detection, current account/session checks and global revocation; same-origin auth proxy; real Firebase recovery; audited role CLI | Hosted HTTPS cookie/proxy and live identity/email acceptance; review of existing privileged-account provenance; operator-approved account migration/erasure; session/XSS controls and multiple-tab behavior need staging acceptance |
| Athletes | Saved profile and self-reported achievements; private versioned training journal with idempotent creates, edits and archive; owner-only saved-plan retrieval; published coach discovery; real session requests/cancellation; event/division registration/withdrawal; text community and stored inbox | Independently verified achievements, richer onboarding, rescheduling and coach-approved training exchanges; archive is not permanent data erasure |
| Coaches | Operator-approved role; stored hourly rates/currency and explicit UTC availability; publish/unpublish; booking acceptance/rejection/completion; accepted/completed-booking client directory and pair-private versioned coaching notes; stored booking notifications | Independent credentials verification, timezone-local recurrence, rescheduling, billing and broader CRM; coaches cannot read athletes' private journals through client APIs |
| Academies | Published listing directory; owner/admin listing editing, unpublish, archive/restore; permission-acknowledged private member records, versioned edits/deactivation; daily UTC attendance and actual operational counts; transactional archive/member/attendance coordination | Hosted transaction/index acceptance, billing, class-level scheduling, imports, owner transfer, member self-service and reviewed retention/erasure; archive preserves records |
| Organizers | Real owned events; up to 16 divisions and one division per athlete; bounded registration/capacity; prepublication withdrawal; versioned single-elimination brackets/byes/results; cancellation of an unpublished division with public reason and roster update; realtime refresh hints; dry-run-first audited legacy conversion tool | Actual legacy-source review/migration, automated age/weight/rank eligibility, score rules/appeals, richer formats, published-bracket forfeits/reseeding and federation certification; fees/refunds remain outside ATHLIX |
| Community | Persisted text feed/comments; desired-state likes and real counts; author-only versioned edits and soft removal; bounded reports; admin-only queue and transactional hide/dismiss decisions with audit; hidden/deleted content filtering | Human moderation ownership/policies, appeals, legal erasure/retention, media, following and automatic social notifications; soft removal retains private records |
| Kata feedback | Owner-scoped consented bounded uploads; idempotent owner/request/video retries; exclusive single-instance SQLite job/result state; expired-result deletion; interrupted jobs fail explicitly on restart; pinned model manifest/provisioning; native/container smoke passed at `8bea3de`; resource-limited Docker/Compose/Render templates; observed-component heuristic feedback | Final source CI, actual target-host image/model/disk/resource acceptance, permissioned combat-sports benchmark and expert usefulness review; no accuracy/force/kata-recognition claim; horizontal scaling needs a different shared-job design |
| Provider coaching | Default-off explicit opt-in; bounded schemas/budgets; public published-coach allowlist; caller-owned validated plan saves; saved plans remain readable when provider features are disabled | Live provider/privacy acceptance, evaluated usefulness, distributed budgets and operator-approved commercial terms |
| Marketing/commercial | Factual pilot scope, no fabricated social proof or revenue; checkout remains disabled by owner decision until prices are decided; user-opened contact draft; factual pitch documents | Approved support mailbox, customer evidence, pricing validation, secure billing/entitlements if later approved, and reviewed privacy/terms |
| Operations | Canonical locked installs; CI for source checks, isolated database suites, demo Auth emulator, browser/accessibility fixtures, native/container smoke and audit gate; request IDs/safe logs; liveness/readiness; bounded shutdown; deployment/rollback guidance | Observed latest CI and live-host acceptance; approved production settings/indexes/data review; telemetry/support/moderation ownership; backup restore/rollout exercise; full accessibility/performance qualification and reviewed dependency findings |

Some illustrative mockups and the bracket simulator remain explicitly labeled
examples. The product remains a development/pilot candidate. Completed source
slices and passing synthetic checks do not constitute a market-ready release.

Subsystem contracts: [sessions](SESSION_SECURITY.md), [training/clients/inbox](TRAINING_AND_CLIENTS.md),
[academy operations](ACADEMY_OPERATIONS.md), [tournaments](TOURNAMENTS.md),
[moderation](COMMUNITY_MODERATION.md), [migration review](MIGRATION_REVIEW.md),
and [video worker](../cv-service/README.md).
