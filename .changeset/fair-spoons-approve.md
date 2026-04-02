---
"@tachui/core": patch
"@tachui/ssr": patch
"@tachui/types": patch
"@tachui/modifiers": patch
---

Fix SSR serialization recursion for component inputs that also expose `build()` by prioritizing component render dispatch and guarding against cyclic builder chains.

Improve asset typing ergonomics by adding declaration-merging support for custom `Assets` keys via `CustomAssets`.

Add `.compositingGroup()` modifier mapped to `isolation: isolate`, with non-colliding priority so isolation is applied before blend-mode modifiers.

Make `FontAsset` loading SSR-safe by no-oping DOM-dependent load paths when `document`/`window` are unavailable (prevents eager Google font crashes during prerender).
