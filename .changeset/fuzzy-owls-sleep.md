---
'@tachui/cli': patch
'@tachui/core': patch
'@tachui/data': patch
'@tachui/devtools': patch
'@tachui/eslint-plugin': patch
'@tachui/flow-control': patch
'@tachui/forms': patch
'@tachui/grid': patch
'@tachui/mobile': patch
'@tachui/modifiers': patch
'@tachui/navigation': patch
'@tachui/primitives': patch
'@tachui/registry': patch
'@tachui/responsive': patch
'@tachui/symbols': patch
'@tachui/types': patch
'@tachui/viewport': patch
---

Release catch-up for npm parity and release workflow migration:

- trigger publication for all current publishable `@tachui/*` packages so npm versions align with the repository baseline
- preserve `@tachui/core`, `@tachui/types`, and `@tachui/registry` fixed-group behavior during versioning

CLI and release hardening included in this release:

- improve default TachUI version resolution with registry-first lookup and compatibility-map fallback behavior
- validate `--tachui-version` inputs and improve fallback messaging
- strengthen template package-root resolution
- expand packed smoke coverage for `npx`/tarball flows and update CI smoke enforcement
- align CLI docs and tests with the new init/version-resolution behavior
