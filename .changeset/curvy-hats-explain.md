---
"@tachui/ssr": patch
---

Fix SSR serialization recursion for component inputs that also expose a `build()` method by prioritizing component rendering and adding cyclic builder-chain detection. Adds regression coverage for mixed component/builder inputs and cyclic builder cases.
