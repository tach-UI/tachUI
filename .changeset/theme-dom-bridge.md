---
'@tachui/core': patch
'@tachui/types': patch
---

Bridge theme state to the DOM, so stylesheet theming and `Asset` theming stay in step.

`setTheme()` wrote a signal and nothing else — no attribute, no class — and nothing in tachUI read one. `ColorAsset` theming and CSS-custom-property theming were therefore two independent systems: `setTheme('dark')` did not flip a stylesheet's variables, writing `data-theme="dark"` did not flip any `ColorAsset`, and an app using both had to drive them in lockstep by hand, with any divergence showing as a half-themed UI.

The bridge now runs both ways through `data-theme` on `<html>`, exported as `THEME_ATTRIBUTE`. The name matches the convention CSS-side design systems already key off (`:root[data-theme="dark"]`), so an existing stylesheet and an existing pre-paint script work against tachUI unmodified — which is the point.

- **Reflect**: `setTheme('light' | 'dark')` writes the attribute. `setTheme('system')` *removes* it rather than writing `data-theme="system"`, because the attribute is an override and its absence is what lets `@media (prefers-color-scheme: dark)` apply.
- **Observe**: the attribute is read at load, so an explicit choice a pre-paint script wrote is honoured from the first `getCurrentTheme()` with no boot-time `setTheme()` call, and a `MutationObserver` makes later external writes a reactive theme change that already-rendered components re-resolve in place. A `'system'` choice writes no attribute, so it still needs one `setTheme('system')` at boot until #309 changes the default preference.
- **Follow the OS**: a `prefers-color-scheme` listener makes `'system'` live for rendered components. `getCurrentTheme()` always re-read the media query, but `getThemeSignal()` is a computed and `prefers-color-scheme` is not a signal, so anything already rendered cached the appearance it first painted with and never followed an OS flip.
- **Precedence**, highest first: an explicit `data-theme` on `<html>` > the preference passed to `setTheme()` > `prefers-color-scheme` (consulted when the preference is `'system'`). The DOM outranks the preference so that an app already setting the attribute gets tachUI following along without calling a tachUI API at all.

New: `THEME_ATTRIBUTE`, `getThemePreference()` (the preference as stated, which a settings UI needs in order to show `system` as selected rather than what it resolved to), `startObservingThemeAttribute()` / `stopObservingThemeAttribute()` for hosts that tear down an instance without tearing down the document, and the `ResolvedTheme` type. Starting is idempotent and re-syncs from the attribute, since a write made while not observing leaves no mutation record to catch up on. `getCurrentTheme()`'s declared return type narrows from `Theme` to `ResolvedTheme` — it never could return `'system'`, so this only removes a branch that was already unreachable. The docs gain the attribute name, the precedence chain, and a pre-paint recipe for avoiding a flash of the wrong theme.

Separately, `ColorAsset.validateColor()` now reports `format: 'custom-property'` for `var(--token)` and `format: 'color-mix'` for `color-mix(…)`, instead of bucketing both as `'named'`. Both are accepted as before; what changes is that a caller can now tell a literal colour apart from one only the browser can resolve, which `'named'` made indistinguishable.
