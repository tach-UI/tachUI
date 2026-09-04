---
'@tachui/core': patch
---

**Behaviour change:** the default theme now follows the OS. Apps that never call `setTheme()` will render their dark `ColorAsset` variants for users whose system prefers dark, where they previously always rendered light.

The theme preference defaulted to `'light'`, and `getCurrentTheme()` consulted `prefers-color-scheme` only when the preference held the literal `'system'` — which nothing ever set. So a fresh app ignored the OS entirely:

```ts
const hex = ColorAsset.init({ name: 'p', default: '#2A9D8F', light: '#2A9D8F', dark: '#5FD0C1' })

detectSystemTheme()   // 'dark'   — correct
getCurrentTheme()     // 'light'  — ignored it
hex.resolve()         // '#2A9D8F', the LIGHT value, for a user who prefers dark
```

Respecting the OS was effectively opt-in through an undocumented sentinel value, and the failure was silent — the app simply rendered in the wrong theme.

The preference now defaults to `'system'`. Nothing else about resolution changes: an explicit `data-theme` on `<html>` still outranks it, `setTheme('light' | 'dark')` still pins an appearance, and `getThemePreference()` reports `'system'` unresolved so a settings UI can show it as selected.

**What to check when upgrading.** If your app renders literal-valued `ColorAsset`s and has never called `setTheme()`, it will now render dark for dark-OS users. That is the intended behaviour, but it is a visible change. To keep the old behaviour, call `setTheme('light')` at startup.

Note that this is invisible to most test suites: jsdom provides no `matchMedia`, so `detectSystemTheme()` reports light there regardless. Stub `matchMedia` if you want to exercise the dark path.
