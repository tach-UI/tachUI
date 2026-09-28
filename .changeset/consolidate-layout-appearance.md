---
'@tachui/core': patch
'@tachui/modifiers': patch
---

`LayoutModifier` now has one implementation, in `@tachui/core/modifiers/base`,
and `@tachui/modifiers/base` and the `@tachui/modifiers` root re-export it.
`AppearanceModifier` from both `@tachui/modifiers` entries is now one class:
core's, plus the shadow, `clipped` and `clipShape` branches, which stay out of
core. Existing imports keep working.

- Core's `LayoutModifier` applies `offset`, `scaleEffect` and `zIndex`, and
  `aspectRatio` follows a signal ratio. Offset and scale write through the
  shared transform composer, so they keep an animation's rotation.
- `position` sets `position: absolute`, defaults a missing coordinate to `0`
  rather than `auto`, and follows signal coordinates.
- `layoutPriority` writes `--layout-priority` onto the element from every
  entry. Before, the `@tachui/modifiers` copies dropped it.
- `LayoutModifier` and `AppearanceModifier` apply when the element is on
  either the context or the node. The `@tachui/modifiers` copies needed both.
- Font `size` and `weight` given as signals update the element, and an
  explicit `0` is written rather than dropped, from every entry.
- The `@tachui/modifiers` root's `AppearanceModifier` now applies `role`,
  ARIA and navigation props, and its `shadow` takes `blur` and `spread` as the
  `@tachui/modifiers/base` one already did.
- `clipPathFor`, `clipPathForName`, `isShapeInstance` and `ClipShapeName` are
  exported from `@tachui/core/modifiers`.
