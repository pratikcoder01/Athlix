# Production hydration regression

Investigated on 2026-11-15. The intermittent production React error 418 affected
unrelated routes when route JavaScript arrived during concurrent hydration.
Development builds did not reproduce it in the existing route matrix.

Capturing the production renderer's hydration claims showed the transition
wrapper successfully claiming its server-rendered `div`, followed by a retry
that attempted to claim that same wrapper against its first child (`main` on
the login route). The original wrapper still existed in the document. Replacing
Framer Motion's wrapper with an ordinary `div` also reproduced the failure.

This matches the host-fiber replay mechanism documented in the upstream
[React hydration cursor report](https://github.com/react/react/issues/37584).
The report links the [upstream renderer correction](https://github.com/react/react/pull/35494).
ATHLIX avoids the affected shape by resolving the Flight route slot in a stable,
module-level `RouteContent` function component inside the transition wrapper.
A delayed chunk then replays the function fiber without claiming the transition
host element twice. Page content continues to be prerendered, with the same
markup and no new whole-page loading fallback.

The controlled A/B used the same production build and response-delay seed.
Without the extra fiber it failed on visit 3, `/login` at 360px. Adding a Suspense boundary
coherently to the served HTML and corresponding client element passed 105 visits
with up to 90ms of response jitter. This isolated the change before editing the
source and rebuilding. However, its fresh-build streaming fallback occasionally
replaced the page's original `main` despite retaining the frame and avoiding
error 418. The stricter DOM retention assertion caught that behavior, and the
final source uses the stable function fiber instead. Blocking streamed metadata
did not fix the reproduction and was removed.

The stable function-fiber A/B then passed 105/105 visits under the same 90ms
seeded jitter, with both the original transition wrapper and page element
retained. This covers seven routes at three widths over five passes. The
fresh-source production test below separately checks the rebuilt source.

The final source rebuild passed on 2026-11-15. Its unmodified production renderer
then passed 63/63 visits through the static fixture mode: seven routes, three
widths and three passes, with seeded delays up to 90ms. Every visit retained the
original prerendered transition wrapper and `main`, with no browser exceptions
or hydration console errors. This local result does not replace CI server/API
acceptance or live staging checks.

`client/test/hydration-production-e2e.cjs` exercises the actual production build
at 360, 768 and 1440px on seven public routes, with three passes by default.
It delays assets with a deterministic seed, fails browser exceptions and
hydration console errors, and verifies that the original parsed transition
wrapper and `main` nodes remain attached after hydration. Its default run leaves
the production renderer unchanged. Optional bounded throw diagnostics are enabled
only by `ATHLIX_HYDRATION_DIAGNOSTICS=1`; they preserve the original error throw.

CI runs the test against the production Next server with the isolated API
fixtures. For environments where a local listener is unavailable, run from the
repository root after a build:

```powershell
$env:ATHLIX_STATIC_BUILD='.next'
node client/test/hydration-production-e2e.cjs
```

That mode fulfills browser requests from the real `.next` HTML/chunks through
Playwright interception, rejects external network requests and creates no
listening server. It verifies production markup/hydration, while the separate
CI server and API suites remain necessary for proxy and persisted workflows.
