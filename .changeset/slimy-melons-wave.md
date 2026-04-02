---
"@tachui/core": patch
"@tachui/modifiers": patch
"@tachui/ssr": patch
---

Fix SSR modifier application in Node environments by guarding browser-only globals and preserving style serialization output.

- guard modifier paths that previously accessed `HTMLElement`, `document`, `window`, or `getComputedStyle` without runtime checks
- harden modifier factory/runtime code paths used during server-side rendering
- ensure SSR style materialization captures direct style assignments in addition to `setProperty`
- add and fix SSR test aliasing and regression coverage for animation/transform/z-index serialization
