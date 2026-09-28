---
'@tachui/core': patch
'@tachui/modifiers': patch
---

`InteractionModifier` now has one implementation, in
`@tachui/core/modifiers/base`, and `@tachui/modifiers/base` and the
`@tachui/modifiers` root re-export it. Existing imports keep working.

- Touch handlers (`onTouchStart`, `onTouchMove`, `onTouchEnd`,
  `onTouchCancel`) and `onSwipeLeft` / `onSwipeRight` apply from every entry.
  Before, the `@tachui/modifiers` root's copy dropped them.
- `disabled` given as a signal or computed toggles the `disabled` attribute,
  pointer events and opacity as it changes, from every entry. Before, core's
  class applied it once.
- Long press, keyboard shortcuts, focus, `focusable`, continuous hover and hit
  testing are the `.onLongPressGesture()`, `.keyboardShortcut()`,
  `.focused()`, `.focusable()`, `.onContinuousHover()` and
  `.allowsHitTesting()` modifiers, now registered with metadata by
  `@tachui/modifiers`. `InteractionModifier` no longer reads those props when
  constructed directly; use the chain methods instead.
- `.keyboardShortcut()`, and `.focused()` with a signal and
  `.focusable(true, ['activate'])`, return their cleanup, so disposing the
  component removes their listeners, including the one on `document`.
- `LayoutModifier` no longer accepts `offset`, `aspectRatio`, `scaleEffect` or
  `zIndex`, and `LayoutModifierProps` no longer declares them. Use the
  `.offset()`, `.aspectRatio()`, `.scaleEffect()` and `.zIndex()` chain
  methods, which are unchanged. `LayoutModifierProps['position']` accepts
  signal coordinates, which it already followed.
