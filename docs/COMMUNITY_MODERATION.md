# Community ownership and moderation

Signed-in members can edit or remove their own text posts and comments, or save
a report about visible content. Administrators open `/moderation` from the feed
to review open/resolved reports and save a reasoned decision. No review response
time, notification delivery or automatic policy enforcement is promised.

## Content integrity and visibility

Posts/comments use an editorial `version` and `visibility` (`visible`, `hidden`,
`deleted`). Legacy records without these fields are treated as visible/version
zero. Author edits require the current `expectedVersion`; concurrent/stale writes
return 409 instead of overwriting a newer edit. Only the stored author can edit
or remove the item; even administrators use the separately audited moderation
path to hide another member's content. Authors cannot edit hidden content to
make it visible again. Author removal is soft removal, not permanent erasure.

Feed reads, comment rows, persisted comment counts and likes all exclude hidden
or deleted content. A hidden/deleted/missing parent rejects comment reads and
writes. Comment creates/edits/removals and reports take a transactional write
lock on the visible parent post, so a parent hide/removal serializes with those
writes across API processes. Likes and editorial updates do not share a mutable
counter or increment editorial versions unnecessarily.

## Reports and administrator decisions

Reports accept only reason (`spam`, `harassment`, `safety`, `privacy`, `other`)
and at most 1000 characters of details. `other` requires details. Reporter identity
and target come from the authenticated principal and validated path. A unique
`(reporterId,targetType,targetId)` index makes duplicate submissions idempotent;
there are five report submissions/account/15 minutes. The current limiter is
process-local, so multiple API workers need a reviewed shared budget.

Only current administrators can read the bounded, status-filtered queue. It
contains member-submitted concerns and current target text, not proof of a policy
breach. Account projections contain IDs/names/roles, never email, phone, password
or Firebase controls. Reporter identities/details are not exposed in the feed.

Each decision requires a note and report version. Hiding also requires the
current target version, so an administrator does not hide edited content based
on an obsolete snapshot. Changed, already-hidden or removed targets leave the
report open with a conflict; the operator can reload and dismiss the report.
Dismissal leaves content visibility unchanged. No operation restores content.

Target hide, report closure and append-only application audit are committed in
one MongoDB snapshot/majority transaction. Audit insertion failure rolls back
the hide and closure. Audit records have immutable fields and one record/report;
the application exposes no audit mutation/deletion route. This is application
accountability, not an externally tamper-proof compliance log.

| Method/path | Behavior |
| --- | --- |
| `PATCH /api/posts/:id` | Author content + `expectedVersion` |
| `DELETE /api/posts/:id` | Author soft removal + `expectedVersion` |
| `PATCH /api/posts/:id/comments/:commentId` | Author comment + version |
| `DELETE /api/posts/:id/comments/:commentId` | Author comment soft removal + version |
| `POST /api/posts/:id/report` | Save reason/details for visible post |
| `POST /api/posts/:id/comments/:commentId/report` | Save reason/details for visible comment under visible parent |
| `GET /api/posts/moderation/reports` | Admin-only status/page/limit queue |
| `POST /api/posts/moderation/reports/:reportId/resolve` | Admin `action`, `note`, `expectedVersion`, optional required-for-hide `expectedTargetVersion` |

## Verification and release boundaries

- `community.test.cjs` retains the 23 feed/post/like/comment regressions.
- `community-moderation.test.cjs` adds 27 tests for anonymous/professional-role
  negatives, author/version/visibility scopes, report bounds and identity,
  unavailable parents, private projections and transactional decision handling.
- `community-moderation.integration.test.cjs` uses an explicitly supplied,
  validated loopback replica-set URI and randomly named
  `athlix_community_test_<32 hex>` database. Eight subtests cover real concurrent
  author CAS, duplicate reports, tenant ownership, atomic hide/audit, rollback
  after injected audit failure, hidden comment counts, unavailable parents and
  parent-removal/comment races. It never uses the application's `MONGO_URI` and
  only drops its exact generated database. Local execution skips without the
  opt-in URI; CI must provide actual integration evidence.
- `community-moderation-e2e.cjs` uses explicit session/API fixtures to exercise
  author edits/removal, retained stale drafts, report submission, administrator
  decision recovery, resolved queue, hidden-feed state and 360/768/1440 layouts.
  It does not establish human moderation, live-provider or hosted acceptance.

Before a public pilot, assign a human moderation owner, review the policy and
personal-data retention/erasure process, deploy indexes and validate replica-set
transactions in staging. Stored originals/reports/audits remain private for
review; soft removal is not a legal erasure workflow. Media, follows, automatic
social notifications, appeals and automated abuse classification remain outside
this text moderation slice.
