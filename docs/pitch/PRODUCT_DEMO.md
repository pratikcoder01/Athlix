# ATHLIX — honest product demo

This is a proposed demonstration script, not a completed live acceptance test.
Use controlled development/staging accounts and a disposable database. Do not
connect a demonstration to production customer data, send external messages,
collect money, or change production roles.

## Prepare the environment

1. Follow [setup](../setup_guide.md), set real development environment values,
   install from the lockfile, and run the checks recorded in the product audit.
2. Confirm client/API origin settings, MongoDB, Firebase, and JWT configuration.
   Prepare two athlete accounts and an approved organizer using the reviewed
   [operator provisioning process](../ROLE_PROVISIONING.md). Do not self-select
   a professional role at signup or hard-code passwords into source control.
3. If including kata analysis, configure its authenticated Node proxy and service
   credentials, review the consent/retention disclosure, and use a short video
   you own. Demonstrate its unavailable state if those services are absent.
4. Refresh the audit's actual check results. Do not describe fixture-based tests
   as a successful MongoDB/Firebase/cloud integration test.

## Suggested six-minute walkthrough

| Step | Show | Explain honestly |
| --- | --- | --- |
| 1 | Home and product-status page | Development scope, proposed karate pilot, labeled example screens, and no claimed traction. |
| 2 | Athlete signup/login | A new account receives athlete permissions. Professional access requires approval. |
| 3 | Tournaments with the approved organizer | Create a real event in the configured staging database; reload to show persistence. If creation is not supported by the current UI, disclose that gap rather than simulating success. |
| 4 | Athlete event registration | Register with an athlete account, refresh, then try duplicate registration and show the actual error. |
| 5 | Organizer-managed bracket | Show an authorized update and, in a second account, the denied cross-organizer request. Demonstrate realtime only if the subscribed client actually receives the update. |
| 6 | Organizer overview | Explain account-scoped saved counts. Registrations and listed fees are not revenue; no assumed bracket capacity is displayed. |
| Optional | Experimental kata analysis | Show processing/error states and explain 2D heuristics, low-confidence limitations, consent, and lack of a validated accuracy score. |

Close with the next validation question: which part of the organizer's real
workflow is most costly today, and would this pilot make it measurably easier?
Do not turn that question into an invented testimonial.

## Evidence to retain

Record the tested commit, environment, service configuration (without secrets),
browser/viewport, steps, actual outcomes, and any failures. Save only consented,
non-sensitive screenshots. Explicitly mark unexercised steps **NOT RUN**, including
payment, credential verification, academy member management, official scoring,
and full cloud integration when unavailable. A fallback screen is a useful demo
of error handling, not proof that the missing integration works.
