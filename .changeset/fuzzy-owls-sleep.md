---
'@tachui/cli': patch
---

Harden `tacho init` scaffolding and release reliability:

- improve default TachUI version resolution with registry-first lookup and compatibility-map fallback behavior
- validate `--tachui-version` inputs and improve fallback messaging
- strengthen template package-root resolution
- expand packed smoke coverage for `npx`/tarball flows and update CI smoke enforcement
- align CLI docs and tests with the new init/version-resolution behavior
