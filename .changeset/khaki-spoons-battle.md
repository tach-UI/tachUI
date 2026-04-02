---
"@tachui/core": patch
"@tachui/data": patch
"@tachui/eslint-plugin": patch
"@tachui/flow-control": patch
"@tachui/forms": patch
"@tachui/grid": patch
"@tachui/mobile": patch
"@tachui/modifiers": patch
"@tachui/navigation": patch
"@tachui/primitives": patch
"@tachui/registry": patch
"@tachui/responsive": patch
"@tachui/ssr": patch
"@tachui/symbols": patch
"@tachui/viewport": patch
---

Release tree-shaking and packaging improvements across core and feature packages.

- add explicit `sideEffects` metadata across publishable packages for safer bundling
- split runtime-safe vs tooling entry points in `@tachui/core` and add subpath exports
- add granular navigation and responsive subpath exports with artifact verification
- include SSR and modifiers/runtime fixes plus supporting docs and CI updates
