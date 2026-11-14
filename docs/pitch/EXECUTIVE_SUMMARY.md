# ATHLIX — development-stage executive summary

Status: 13 November 2026. This is a product hypothesis and repository-backed
engineering summary, not evidence of product-market fit or a production release.

## Customer and problem hypothesis

Start with karate academies and local tournament organizers in one
founder-accessible Indian city, chosen after interviews. The proposed buyer is
the club owner or event organizer; daily users are the event coordinator, coach,
and athlete. The hypothesis is that registration and result coordination across
forms, spreadsheets, and message threads creates avoidable administrative work.
No customer interviews, time-saving measurements, or willingness-to-pay results
have been supplied to validate that hypothesis.

## First product promise to validate

An approved organizer creates a local event, athletes register through their
accounts, and the organizer updates the bracket through authorized, persisted
operations. This is the narrow launch candidate. Full academy operations,
credential verification, payments, and advanced competition formats are not
established capabilities of this development build.

The repository contains Next.js/React screens, an Express/MongoDB API, Firebase
and legacy authentication paths, Socket.IO updates, and a Python pose-analysis
service. Engineering work adds negative authorization tests and makes sample,
experimental, and unavailable functionality explicit. Consult the
[audit](../PRODUCT_AUDIT.md) and [roadmap](../ROADMAP.md) for current verification
and unresolved work. A local test pass is not a deployed-service guarantee.

## Differentiation hypothesis

An optional coach-reviewed kata feedback loop could connect training and local
competition participation. The analyzer currently uses 2D pose estimation and
rule-based metrics. It has no demonstrated independent accuracy benchmark and
must not be used as official judging, a force measurement, or medical advice.
There is no proprietary-data or defensible-model moat established today. A
future advantage would require consented longitudinal data, validated usefulness,
workflow adoption, and strong privacy practices.

## Business and evidence

Test an organizer-paid event fee before a broader academy subscription. No paid
checkout, subscription entitlement system, or settlement ledger is implemented.
Prices, acquisition cost, retention, margins, and market size are unvalidated.
No customer counts, reviews, partnerships, certification, revenue, or financial
projections are asserted.

The next evidence should be observed organizer interviews, a supervised pilot
using real consented participants, measured registration completion and repeat
usage, support workload, infrastructure cost, and a documented willingness-to-pay
decision. Broader expansion depends on that evidence and the production gates in
[investor readiness](INVESTOR_READINESS.md).
