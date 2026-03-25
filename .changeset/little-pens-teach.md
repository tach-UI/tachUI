---
'@tachui/core': minor
'@tachui/types': minor
'@tachui/cli': minor
---

Ship color-asset transform APIs and scaffold updates.

- Add `ColorAsset` transform helpers: `opacity`, `saturate`, `brighten`, `rotateHue`, and `contrast` with deterministic range semantics and expanded format handling.
- Add variadic `registerAsset(...)` batch registration support and tighten overload typing.
- Update `@tachui/types` asset proxy typing to include the new color transform methods.
- Update `@tachui/cli` starter templates to current TachUI APIs (`mountRoot`, modifiers preload, and `@tachui/primitives` button usage) and include required template dependencies.
- Expand tests and docs for transform behavior, output normalization, and edge-case handling.
