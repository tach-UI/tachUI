---
'@tachui/modifiers': patch
---

Fix `backgroundColor(ColorAsset)` theme reactivity so background colors update when the active theme changes, matching `foregroundColor` behavior.

Also adds regression test coverage for this asset path and preserves stateful background option routing.
