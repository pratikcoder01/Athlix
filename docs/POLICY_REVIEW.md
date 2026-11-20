# Policy draft and owner review

Prepared 2026-11-21 for the current development build. The owner requested sample
details that can be replaced later. `/privacy` and `/terms` therefore remain
explicit technical drafts, with **Legal review pending** visible on both pages.
This document records source behavior; it is not legal advice or approval.

## Editable examples

Edit `client/src/lib/policyDraft.ts` to replace the sample operator, country,
support address, proposed age and revision date. The shared
`client/src/components/shared/PolicyDocument.tsx` renders them as examples.
The sample support address is inert text, with no email link or delivery action.
The proposed age is not an implemented registration gate. Changing these
examples does not establish a real effective policy or legal review.

The real contact form is separately controlled by `NEXT_PUBLIC_CONTACT_EMAIL`
and `client/src/lib/contact.ts`. It stays disabled when unconfigured and prepares
an email draft when configured; the application does not send that message.

## Technical data inventory

| Records | Purpose and access in current source | Retention/removal behavior | Source |
| --- | --- | --- | --- |
| Account, profile and coach information | Identity, roles, profiles and member-facing directories; private contact fields are excluded from profile-card projections | No general automatic account/profile purge | `server/src/models/User.ts`, `Profile.ts`, `CoachProfile.ts`; directory and auth controllers |
| Access and refresh sessions | Access JWT in browser memory; hashed rotating credential in HttpOnly cookie-backed session | Access lifetime 15 minutes; session absolute expiry seven days; Mongo TTL deletion can lag expiry; revocation is checked separately | `client/src/lib/authSession.ts`; `server/src/models/AuthSession.ts`; session service/controllers |
| Bookings and event records | Participant/authorized administrative workflows; directory/event fields and results are member-facing | Cancellation/completion preserves history; no general automatic purge | Booking and tournament models/controllers; `docs/TOURNAMENTS.md` |
| Private training entries and saved plans | Owner-scoped history and saved outputs | Training removal is soft deletion; no general purge | Training and AI controllers/models; `docs/TRAINING_AND_CLIENTS.md` |
| Coach-client notes | Coach workspace derived from accepted/completed bookings; not a private-journal access grant | Retained records; no general automatic purge | Coach-client controller/model; `docs/TRAINING_AND_CLIENTS.md` |
| Academy members and attendance | Owner/admin workspace; permission acknowledgement before entry | Archive/inactive status preserves records; no general automatic purge | Academy member/attendance models/controllers; `docs/ACADEMY_OPERATIONS.md` |
| Community, reports and moderation audit | Signed-in feed; private reports and administrative moderation | Author removal and moderation change visibility; underlying records/audit remain | Community/moderation controllers/models; `docs/COMMUNITY_MODERATION.md` |
| Recipient notifications | Account inbox and real unread state | Read state persists; no general automatic purge | Notification controller/model |
| Uploaded video and analysis jobs | Consented API-to-internal-worker processing; owner-scoped results | Temporary media cleanup after completion/failure and startup/periodic recovery; terminal jobs/results expire after 15 minutes with periodic cleanup; finished-result deletion available | `cv-service/main.py`, `task_store.py`; Node CV controller; `docs/AI_EVALUATION.md` |
| Request/operational logs | Generated request ID, route pattern, method, status, duration and completion | Application and host log retention require separate operator confirmation | `server/src/app.ts`, operations utilities; `docs/OPERATIONS.md` |

Soft removal, expiry and file cleanup do not guarantee immediate physical erasure
from storage, backups or provider systems. No account export/erasure workflow or
provider retention agreement is asserted by the draft pages.

## Provider boundaries

- Firebase handles configured identity flows. Its SDK uses memory persistence in
  this client; ATHLIX has a separate revocable session lifecycle.
- Optional text AI is disabled by default. When enabled, bounded training inputs
  and belt rank, a bounded published coach roster/query, or submitted recovery
  figures can be sent to Featherless and an optional OpenRouter fallback.
  Failure can result in both providers receiving a request. Their retention,
  locations and training-use terms have not been accepted by this review.
- Video processing uses the configured internal pose worker. The CV upload is
  not sent to those text-AI providers. Native runtime tests do not establish
  combat-sports accuracy, medical usefulness or official judging validity.
- External images and social links can contact third-party sites. Configured
  Cloudinary variables alone do not establish an active upload/storage workflow.
- Actual Vercel, Render, MongoDB and identity project settings, operator access,
  regions, backups and agreements require host-specific verification.

## Owner decisions before a real-data release

1. Confirm the real operator, applicable locations, verified support contact and
   responsible person for privacy, support, moderation and incidents.
2. Define eligibility and any minors/guardian process; the sample 18+ figure does
   not enforce one. Review member records for people without an account.
3. Approve purposes, visibility, provider processing and data-minimization rules,
   including free-text fields and participant video permissions.
4. Set practical retention, backup, deletion/export/request-verification and
   response procedures. Assign someone to carry them out.
5. Finalize content permissions, moderation/appeals, service availability,
   suspension/termination and any required consumer or dispute provisions with
   an appropriate reviewer. No jurisdiction-specific outcome is invented here.
6. Replace the examples, review the complete documents, choose a real effective
   date and update/acceptance process, and only then change the pending-review
   presentation. Checkout remains disabled by the owner's separate decision.

## Verification

Marketing regression guards retain the draft-status disclosure. Browser
accessibility checks include both policy pages in dark/light themes at four
widths, check one main/heading, verify the actual review banner, and reject an
active `.example` email link. Passing these checks validates presentation and
source contracts, not legal sufficiency or actual host retention practices.
