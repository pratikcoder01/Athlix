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
ATHLIX avoids the affected shape by rendering a concrete `Suspense` boundary
inside the transition wrapper around the Flight route slot. The route suspends
at that boundary rather than replaying the already claimed host element.
The accessible loading fallback is shown only while that boundary is pending.
Page content continues to be prerendered.

The controlled A/B used the same production build and response-delay seed.
Without the boundary it failed on visit 3, `/login` at 360px. Adding the boundary
coherently to the served HTML and corresponding client element passed 105 visits
with up to 90ms of response jitter. This isolated the change before editing the
source and rebuilding. Blocking streamed metadata did not fix the reproduction
and was removed.

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
