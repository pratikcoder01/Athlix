# Experimental provider coaching

Provider-backed plans, coach ranking, plan saving and wellbeing reminders are
disabled by default. An operator must explicitly set `AI_COACHING_ENABLED=true`
in `server/.env` after reviewing provider access, privacy and evaluation needs.
Provider keys belong only on the server. Disabled requests return503 before
authentication database lookups or provider work; handlers repeat the gate.
The owned deterministic bracket alias stays available without this feature.

Enabled routes still require an active account and share five requests per
account per15minutes. This quota is process-local; distributed quotas, aggregate
provider budgets and live-provider acceptance remain deployment work.

Coach ranking considers at most25 active published UTC profiles belonging to
active coach accounts. A runtime public-field allowlist strips email, phone,
Firebase identifiers, controls and invented ratings before both the provider
prompt and API response. Returned IDs must be unique members of that roster.
Match scores are experimental suggestions, not measured skill or credentials.

Plan requests and outputs use bounded schemas, unique weekdays and the requested
day count. Saving validates the full plan and derives its account ID from the
session. Nudge inputs require finite weekly hours and a positive baseline; no
user-controlled division creates Infinity/NaN. Invalid provider structures return
a safe502 rather than invented successful feedback.

21 focused regressions and the complete local JavaScript suite pass. Tests use
provider/database mocks and real HTTP route wiring; no paid provider call was
made. General coaching usefulness, provider acceptance, a plan-history read UI
and consent/operational review are still separate release requirements. See the
[API contract](api_map.md) and [feature matrix](FEATURE_STATUS.md).
