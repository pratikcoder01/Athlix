# Persisted community text feed

The `/feed` screen reads saved member posts and comments. It no longer presents
invented followers, engagement, verified athletes, or sample posts as live data.
The `/settings` screen provides the real browser-persisted theme and links to
dedicated profile, coaching, and Firebase recovery workflows. Unimplemented
notification and privacy preferences have no pretend save button.

## API contract

All routes require the normal active-account middleware. Community writes are
also rate limited. The server derives authors from the current account; injected
author, post, activity or media fields are rejected.

- `GET /api/posts?page=1&limit=12`: newest posts first, bounded pages (maximum50).
  Returns `posts`, `page`, `limit`, `hasMore`; author includes only ID/name/role,
  with `likesCount`, `likedByMe`, and a persisted-comment count. Email and the
  raw liker list are not returned.
- `POST /api/posts`: `{ "content": "..." }`, 1–5000 trimmed characters. Text
  only; the UI does not fetch arbitrary media URLs. Confirmed posts publish a
  safe `new_post` event to authenticated Socket.IO clients.
- `POST /api/posts/:id/like`: `{ "liked": true }` or `false`. This compatibility
  route now sets an idempotent desired state rather than blindly toggling.
  `$addToSet` and `$pull` avoid duplicate/lost likes across concurrent processes.
  Legacy duplicate actor entries do not inflate displayed counts.
- `GET /api/posts/:id/comments?page=1&limit=20`: bounded oldest-first comments;
  unknown or malformed posts are errors, not pretend successful empty results.
- `POST /api/posts/:id/comments`: `{ "content": "..." }`, 1–2000 trimmed
  characters. The target comes from the validated route, author from the session.

Post comment totals are derived from persisted Comment documents. The legacy
mutable `commentsCount` field is ignored; no competing read-modify-save counter
can lose another member's comment. Content renders as React text, not raw HTML.

## Limitations and verification

There are no edit/delete, report/moderation, media-upload, follow, or social
notification-delivery workflows in this slice. Those need reviewed ownership,
moderation and transactional/outbox behavior before being advertised. The feed
does not make credential, achievement or coaching-advice verification claims.

23 policy/controller regressions cover missing sessions, oversized and
identity-injected input, bounded primitive pagination, safe projections, atomic
desired-state operations, actual counts, persistence failures, and successful
publication despite a transient realtime transport failure. Persistence is
mocked in these tests. Actual MongoDB race/replica-set integration is **NOT RUN**
for community in this environment.

`node client/test/workspace-e2e.cjs` exercises profile save/reload, owner academy
creation and the gym-directory redirect, feed publication/likes/comments, API
failure recovery, and responsive widths using explicit transport fixtures. This
is browser request-wiring evidence, not a live-provider or database deployment
test.
