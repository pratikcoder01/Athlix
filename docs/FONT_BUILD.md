# Bundled fonts and build verification

The production build at `f701116` failed in Next.js 15.5.29's Google-font loader.
Its URL-extension parser can reject valid extensionless Google Fonts URLs; see
the [upstream issue](https://github.com/vercel/next.js/issues/99114). Retrying a
download does not remove that dependency.

The root layout now uses `next/font/local` with three checked-in Latin variable
WOFF2 files. DM Sans and JetBrains Mono retain weights 400/500/600; Plus Jakarta
Sans retains 600/700/800. Existing CSS variables, `display: swap`, preloading,
theme styles and provider ordering remain intact. No framework upgrade or
deployment environment change is required.

The fonts total 95,712 bytes. Their official source URLs, SHA-256 hashes,
verified variable axes and pinned OFL license provenance are recorded in
[the asset directory](../client/src/assets/fonts/README.md). License copies
accompany the source files and are also served at `/font-licenses.txt`.

## Preventing recurrence

The normal CI build runs with
`client/test/helpers/block-google-font-network.cjs` preloaded through
`NODE_OPTIONS`. It rejects requests to `fonts.googleapis.com` and
`fonts.gstatic.com`, including in Next's worker processes. It does not return
mock font data or suppress compilation errors. Other network services remain
available; this proves independence from Google Fonts, not a fully air-gapped
dependency installation.

The landing browser suite also blocks those hosts. It verifies that all three
font variables are used by real body/heading/telemetry text, that each requested
weight returns a nonempty loaded `FontFace`, and that the font files return HTTP
200 from the application's `/_next/static/media/` assets. A fallback-only render
cannot satisfy these assertions. Existing dark/light responsive screenshots
remain part of that suite.

The build does not patch `node_modules`, use Google's font-response mock hook,
or fetch fonts from a CDN. Future font updates must replace the reviewed local
assets and update their provenance and license notices.
