---
"@tachui/ssr": patch
"@tachui/types": patch
"@tachui/modifiers": patch
---

Fix SSR serialization recursion for component inputs that also expose a `build()` method by prioritizing component rendering and adding cyclic builder-chain detection. Adds regression coverage for mixed component/builder inputs and cyclic builder cases.

Also add declaration-merging support for custom asset names via `CustomAssets` so consumers can strongly type known runtime-registered keys (for example declaring `sand: ColorAssetProxy` and then calling `Assets.sand.opacity(...)` with full type safety).

Add a new `.compositingGroup()` modifier that maps to CSS `isolation: isolate`, including modifier registry wiring and blend-mode integration coverage.
