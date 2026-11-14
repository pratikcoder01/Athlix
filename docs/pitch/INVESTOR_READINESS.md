# ATHLIX — investor-readiness disclosure

Status: 13 November 2026. The repository is a development-stage product. Security
fixes and passing local tests do not establish market readiness, regulatory
compliance, production reliability, or customer adoption.

## Evidence register

| Topic | Evidence available | Gap before asserting readiness |
| --- | --- | --- |
| Product | Source for a Next.js/Express/MongoDB platform and Python pose-analysis service; local regression tests. | Fully exercise critical flows with configured staging Firebase, MongoDB, storage, realtime, and Python services. |
| Authorization | Regression coverage for public role restrictions, account state, Socket.IO rooms, and owned resources. | Review legacy privileged accounts; assess session revocation, storage, and remaining endpoints. |
| Market | Proposed karate academy/local-event pilot. | Interview records, observed workflows, geography choice, buyer decisions, repeat usage. |
| Traction | No verified customer/activation/retention figures supplied to this audit. | Permissioned measurement and a defined reporting period; sample screen numbers are not evidence. |
| Commercial | No paid checkout or settlement ledger. | Willingness-to-pay evidence and secure tested billing before selling plans. |
| AI | 2D pose estimation and heuristic feedback code. | Permissioned labeled evaluation, low-confidence failure analysis, usefulness and cost benchmarks. |
| Trust | Explicit development/sample labels and unreviewed policy placeholders. | Reviewed policies, accountable support contact, safeguarding and data-retention practices. |
| Corporate/IP | Contributor names in the repository. | Confirm legal entity, ownership/assignments, licenses, permissions, and any claimed partnerships. |

## Founder diligence checklist

- Keep a claim register with source, owner, date, scope, and permission for every
  customer number, testimonial, logo, certification, result, or revenue figure.
- Preserve actual test logs and check failures; identify fixture-based tests and
  **NOT RUN** cloud checks. Link commit IDs and review branches in milestone logs.
- Review open dependency/security findings, production environment validation,
  incident response, backup restoration, rollback, and alert ownership.
- Demonstrate account and resource isolation using separate controlled users.
  Review existing privileged accounts without silently deleting or demoting them.
- Keep uploaded videos out of Git and demo bundles. Confirm consent, provider
  access, retention/deletion, and who can inspect analysis results.
- Obtain permission for each participant, quote, dataset, and brand asset used
  in a demo. Obtain appropriate review before involving minors or sensitive data.
- Instrument only necessary product events; define activation and registration
  completion consistently, document collection, and avoid logging tokens/videos.
- Validate the smallest repeat-use journey before promising a multi-sport CRM,
  recruiting marketplace, official scoring engine, or financial platform.

## Release gates

The initial pilot should remain supervised until the highest-priority audit
items are resolved, critical negative cases pass, staging flows are observed,
operators have deploy/rollback instructions, and support/data-handling duties
are reviewed. General public release and production deployments require a
separate explicit decision. No production release, payment change, corporate
certification, or customer-success claim is part of this work.

Use the [product audit](../PRODUCT_AUDIT.md), [roadmap](../ROADMAP.md), and
[demo script](PRODUCT_DEMO.md) as the current engineering reference, then attach
new measured evidence rather than rewriting gaps as achievements.
