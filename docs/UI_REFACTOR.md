# Dojo editorial and telemetry UI

Implemented 2026-11-23 on `codex/athlix-market-ready`. This is a frontend
presentation refactor of the existing pilot, not an expansion of its commercial
or measurement claims. Review/CI outcomes are tracked on
[PR #3](https://github.com/pratikcoder01/Athlix/pull/3).

After the owner merged PR #3, the production build exposed the upstream Google
font URL-parser failure again. The follow-up [bundled-font fix](FONT_BUILD.md)
keeps the same typography while removing Google-font downloads from compilation.

Review corrections on 28 November make the mobile drawer a native modal dialog,
keep logout errors visible inside it, and use inset keyboard focus outlines on
both clipped video timeline tracks. The mobile430 compiled browser check passed
background isolation and focus/scroll/error recovery; actual Next CI remains
bound to the reviewed PR head.

## Discovery and preserved boundaries

For the presentation milestone (`d1365ef` through `a688403`), the audit mapped
all **30 page routes**, their auth/navigation destinations,
typed API adapters and shared components before edits. `/gyms` still redirects
to `/academies`; existing `#features` and `#how` anchors remain. No backend,
computer-vision service, session store, API adapter or auth-provider logic was
changed. Phone inputs received explicit label associations; workspace-interest
buttons now expose their selected state and clarify that professional access
requires separate review.

The subsequent account-reliability work in the same review branch intentionally
changes auth exchange/session handlers and removes that unsaved phone role
selector. Its scope and qualification are recorded in
[session security](SESSION_SECURITY.md); the preservation statements above
describe the earlier presentation milestone.

The root keeps Query, AuthSession, Socket, Theme and PageTransition providers
in their existing order, with the toast container. The module-level
`RouteContent` fiber and `data-page-transition` hydration boundary are preserved.
Navbar retains theme switching, session logout, notification state and the
mobile drawer's focus trap, Escape behavior and focus return.

Resolved baseline: Next **15.5.29**, React **19.1.0**, Tailwind **4.3.5**,
Framer Motion **12.42.0**, Lucide **1.21.0**, TanStack Query **5.101.0**,
Zustand **5.0.14** and Socket.IO client **4.8.3**. Retained package versions
were not upgraded during the presentation dependency cleanup. The subsequent
TypeScript-ESLint tooling refresh is recorded in [dependency review](DEPENDENCY_REVIEW.md).

## Presentation system

- Canonical obsidian canvas/surfaces, hairline borders and one vermilion accent
  map onto the legacy semantic tokens used throughout the application. An
  explicit light preference remains supported.
- Plus Jakarta Sans supplies editorial headings; DM Sans supplies body/UI copy;
  JetBrains Mono supplies telemetry, indices and tabular numerals. `next/font`
  serves compiled font assets locally at runtime.
- Bright vermilion controls use dark ink so small labels remain readable. The
  exact muted token remains available for nonessential marks; small explanatory
  copy uses a readable secondary/tertiary token. Heading and paragraph defaults
  live in the base layer so component utilities can override them.
- Landing content is a split hero, two flagship modules, a divided supporting
  matrix, selectable workflow rail, editorial trust/specification section,
  accessible FAQ and one closing CTA. Footer no longer adds a second CTA banner.
- Shared forms, workspace controls, cards, navigation, error states and content
  pages use the same typography and neutral borders. Feedback colors remain
  semantic; status pills use quiet surfaces and small static dots.

## Motion and telemetry

Native scrolling replaces the root Lenis wrapper. Unused R3F background code,
Lenis, GSAP, Three.js, React Three Fiber/Drei and Three types were removed:
**six direct dependencies and 54 lock entries**, without changing retained
versions. Actual video/canvas overlays remain intact. Decorative glows, gradients,
magnetic translations, ambient loops and springs were removed from the touched
presentation surfaces; purposeful loading indicators honor reduced motion.

The union of homepage/layout JavaScript files in the local production manifest
fell from **276,093 to 259,943 gzip bytes** versus the preceding local build
(**16,150 bytes / 5.8%**). This is an asset-compression estimate, excluding fonts,
images and server latency; it is not an LCP, throughput or field-performance claim.

The hero SVG is explicitly **illustrative: no video is processed**. Guard and
stance controls change local geometry and angle readouts calculated from those
same points. Base weights match the current heuristic engine:
stability/precision/symmetry/guard/velocity = **0.25/0.25/0.20/0.15/0.15**.
They are configuration, not a fabricated athlete score. Unobserved components
remain unscored and observed weights are renormalized. No validated skill,
force, true 3D, weight-distribution or kata-name recognition claim is introduced.

## Regression and verification scope

A first compiled-browser pass exposed a new SVG-title hydration mismatch:
JSX supplied two title children, so the server emitted an empty title while the
client expected text. The correction supplies one concatenated string, matching
[React's title contract](https://react.dev/reference/react-dom/components/title).
The actual-component server-render test failed before the correction and passed
afterward. No hydration suppression or client-only rendering workaround was added.

The completed local checks passed **20 client regression tests**, lint,
TypeScript and the production build. Both initial dark/light browser runs
retained their original server-rendered main with zero runtime/hydration errors;
**63 delayed production visits** retained the original frame and main as well.

The first CI development run also caught a last-bit difference in raw SVG arc
coordinates between Node and Chromium. The illustrative arc endpoints now
serialize to three decimal places. An actual-component regression reproduces
the runtime difference with a tiny trigonometric perturbation; it failed before
the correction and passes afterward. Angle readouts and CV calculations are
unchanged, and development hydration warnings remain test failures.

The browser suite checks pose/readout changes, keyboard workflow/FAQ interaction,
native anchor clearance, CTA hierarchy, responsive layouts and runtime font
requests. It saves dark/light review screenshots at 360, 768 and 1440 pixels.
The existing automated accessibility suite now covers **20 routes in both
themes (40 cases)**, including content/policy pages and mobile drawer focus.
Existing role-workflow, auth-rewrite and retained-SSR-node regressions remain
part of CI; UI screenshots are retained as a review artifact.

CI writes review PNGs to an explicitly configured absolute runner-temporary
directory and uploads only those PNGs for seven days. Local screenshots retain
their operator-private default location. This avoids the artifact action's
rejection of literal parent-directory paths without uploading other task files.

Local compiled-asset interception is listener-free and uses synthetic API
fixtures. Nine browser suites passed locally, including the new landing,
accessibility and retained-node checks. The academy-management attempt failed
before rendering because its dynamic URL has no static HTML file; that fixture
and the auth-rewrite fixture require the real Next server in CI. No source
assertion was weakened or substitute server started. Static interception cannot
qualify dynamic server rendering, rewrites or real provider/database journeys;
those distinctions remain explicit in the verification record.
No real recovery email/SMS, camera recording, customer-video upload, payment,
database operation or production promotion is part of this UI work.

Checkout remains disabled. Sample policies remain review drafts. Hosted CV,
permissioned domain evaluation and operational launch gates retain their
existing status; a visual refactor does not close them.
