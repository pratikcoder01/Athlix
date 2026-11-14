# Product feature status

Updated 2026-11-14. "Implemented" describes source behavior with local regression
and fixture-browser evidence; it does **not** mean deployed or independently
accepted against live Firebase/MongoDB/native-video services.

| Audience/area | Implemented and locally checked | Remaining or gated |
| --- | --- | --- |
| Accounts | Athlete-only public signup, Firebase exchange, verified legacy email linking, disabled-user checks, real Firebase reset UI, audited role CLI | Live identity/email acceptance, legacy role audit, modern session storage/revocation, partial profile-creation recovery |
| Athletes | Real profile/belt/discipline and self-reported achievements, account-scoped dashboard, coach discovery, session requests/cancellation, event registration, text community | Verified achievements, structured training history/plan retrieval, rescheduling and richer onboarding |
| Coaches | Operator-approved role, persisted rates/currency and explicit UTC availability, publish/unpublish, bookable directory, accept/reject/complete sessions | Real credentials verification, full client-management CRM, timezone-local recurring rules, rescheduling |
| Academies | Approved-owner persisted listing creation, genuine directory/search, own saved-record overview; gyms alias uses that directory | Member records, attendance, listing editing/removal, academy billing and operational CRM |
| Organizers | Real event creation/listing, atomic registration, deterministic single-elimination generation/byes, owned versioned winner/status updates, realtime subscriptions | Divisions, withdrawals, appeals/score rules, multiple formats, legacy bracket migration, official federation certification |
| Community | Persisted text posts/comments, atomic desired-state likes, real counts, bounded pages and safe author data | Edit/delete, moderation/reporting, media upload, following and persisted social notification delivery |
| Kata feedback | Authenticated owner-scoped bounded upload/jobs, consent, cleanup/expiry, measured-component feedback, low-confidence handling, safe missing-service/model states | Reviewed model/native runtime, permissioned benchmark, durable shared jobs, container memory enforcement; no accuracy/force/kata-recognition claim |
| Provider coaching | Default-off opt-in, bounded requests/outputs, published public coach roster and caller-owned validated plans | Live provider/privacy acceptance, evaluated usefulness, distributed budgets and a complete plan-history workflow |
| Marketing/commercial | Factual pilot scope, no fabricated social proof, honest unavailable billing, user-opened contact draft, factual pitch documents | Approved support mailbox, customer evidence, pricing validation, secure billing/entitlements, reviewed privacy/terms |
| Operations | Locked installs, CI, safe request/error logs, liveness/readiness, bounded bodies/rate limits, graceful draining and rollback guidance | Production telemetry/support ownership, real backup restoration/rollout exercise, full cloud acceptance and remaining moderate advisories |

Some illustrative feature mockups and the bracket simulator remain explicitly
labeled examples. They are separate from persisted production-intended flows.
The product is a development/pilot candidate, not a market-ready release.
