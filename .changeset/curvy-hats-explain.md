---
"@tachui/ssr": patch
"@tachui/types": patch
"@tachui/modifiers": patch
---

Fix SSR serialization recursion for component inputs that also expose a `build()` method by prioritizing component rendering and adding cyclic builder-chain detection. Adds regression coverage for mixed component/builder inputs and cyclic builder cases.

Also restore ergonomic dot-access typing for runtime-registered custom assets (e.g. `Assets.brandPrimary.opacity(0.5)`) by relaxing the dynamic index signature on `AssetsInterface`.

Add a new `.compositingGroup()` modifier that maps to CSS `isolation: isolate`, including modifier registry wiring and blend-mode integration coverage.
