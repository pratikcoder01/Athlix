# Bundled application fonts

These unmodified, official Google Fonts Latin WOFF2 assets are committed so
`next/font/local` can build and serve the existing typography without contacting
Google Fonts. They were retrieved on 28 November 2026. All three families use
the SIL Open Font License 1.1; the adjacent `*-OFL.txt` files preserve their
copyright notices and complete license text. Font binaries also retain the
matching copyright notice and OFL URL in their OpenType name metadata.

| Family | File | Bytes | Application CSS weights | Binary `wght` axis |
| --- | --- | ---: | --- | --- |
| DM Sans | `dm-sans-latin-variable.woff2` | 36,932 | 400–600, normal | 100–1000 |
| JetBrains Mono | `jetbrains-mono-latin-variable.woff2` | 31,432 | 400–600, normal | 400–800 |
| Plus Jakarta Sans | `plus-jakarta-sans-latin-variable.woff2` | 27,348 | 600–800, normal | 200–800 |

The total binary size is **95,712 bytes**. DM Sans identifies its default
optical-size variant as `DM Sans 9pt` in the font name table; Google serves it
under the requested CSS family `DM Sans`. The files are genuine variable
fonts, not renamed static weights. Only the Latin subset is bundled; other
scripts use the existing system fallback stack.

`manifest.json` records the exact font/CSS URLs, SHA-256 digests, sizes,
verified family names and variation axes. The source URLs below are
provenance, not build or runtime imports. The pinned Google Fonts Git revision
is for the copied licenses; the font binaries are pinned by their own
versioned Gstatic URLs and hashes.

## Sources and hashes

### DM Sans

- Font: <https://fonts.gstatic.com/s/dmsans/v17/rP2Yp2ywxg089UriI5-g4vlH9VoD8Cmcqbu0-K4.woff2>
- CSS request: <https://fonts.googleapis.com/css2?family=DM+Sans%3Awght%40400..600&display=swap>
- License: <https://raw.githubusercontent.com/google/fonts/5026800714d07231937d92eb4cceabf06e05d74e/ofl/dmsans/OFL.txt>
- Binary SHA-256: `9fea608a947e67020c33cad9a6fe3d60c54119dfb8cff87768a8117a15ed7543`

### JetBrains Mono

- Font: <https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPxDcwg.woff2>
- CSS request: <https://fonts.googleapis.com/css2?family=JetBrains+Mono%3Awght%40400..600&display=swap>
- License: <https://raw.githubusercontent.com/google/fonts/5026800714d07231937d92eb4cceabf06e05d74e/ofl/jetbrainsmono/OFL.txt>
- Binary SHA-256: `83c005d49d8a6a50474c73a5a36ac0468076e9c4a29da7bdb14995d80560a5be`

### Plus Jakarta Sans

- Font: <https://fonts.gstatic.com/s/plusjakartasans/v12/LDIoaomQNQcsA88c7O9yZ4KMCoOg4Ko20yw.woff2>
- CSS request: <https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans%3Awght%40600..800&display=swap>
- License: <https://raw.githubusercontent.com/google/fonts/5026800714d07231937d92eb4cceabf06e05d74e/ofl/plusjakartasans/OFL.txt>
- Binary SHA-256: `153fc85b70298beeb1d61a5f723331649e7f23bb77302a66e61cb3e2fbdb5e79`

## Refreshing an asset

Fetch the intended family and weight range from the official source, choose
its exact Latin subset, inspect the WOFF2 family and variable axes, retain
the corresponding license, then update the binary, manifest and hashes
together. Do not add a remote fetch to the application build as an update
shortcut. Browser font-load checks and a build with Google Font networking
blocked should pass before accepting a refresh.
