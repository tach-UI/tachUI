---
'@tachui/core': patch
'@tachui/modifiers': patch
'@tachui/primitives': patch
---

`BaseModifier`, `AnimationModifier` and `LifecycleModifier` now have one
implementation, in `@tachui/core/modifiers/base`. `@tachui/modifiers/base` and
the `@tachui/modifiers` root re-export core's classes under the same names, so
existing imports keep working and all three entries export the same class.

- `applyStyles` re-resolves an asset (a `ColorAsset` or anything with a
  `resolve()` method) whenever the theme changes, from every entry point.
  Before, only `@tachui/modifiers/base` did this.
- `AnimationModifier.type` is `'animation' | 'transition'` in core too, so
  `TransitionModifier` extends core's class.
- `LifecycleModifier` no longer sets up pull-to-refresh. A `refreshable` prop
  passed to it through `@tachui/modifiers` or `@tachui/modifiers/base` now does
  nothing. Use `refreshable` from `@tachui/mobile` instead:

  ```ts
  import { refreshable } from '@tachui/mobile'
  ```

`@tachui/core`, `@tachui/modifiers` and `@tachui/primitives` now emit a Vite
manifest and declare a gzip size budget, which `tools/check-size-budget.mjs`
enforces.
