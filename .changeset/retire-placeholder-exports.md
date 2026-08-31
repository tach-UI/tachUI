---
'@tachui/core': patch
'@tachui/forms': patch
'@tachui/cli': patch
---

Retire the "Phase 3.1.2" placeholder exports and ship a real application entry point (#237, #226).

**`@tachui/core` — `mount()` is now real.** `mount(root, target?)` renders the app and returns a dispose function that unmounts it and tears down its reactive root. The target accepts an element or a CSS selector and defaults to `'#app'`. A missing target now throws naming the selector that missed, instead of rendering nothing. `unmount(target?)` disposes the app mounted at a target for callers that did not keep the dispose function.

`mountRoot()` still works and now delegates to `mount()`, so existing bootstraps are unaffected. It is deprecated in favour of `mount()`.

**Breaking:** `mount`, `unmount`, `updateProps`, `memo` and `lazy` were previously exported from `@tachui/core` as empty functions. `mount` and `unmount` are now real; `updateProps` and `memo` are removed rather than left as silent no-ops, and importing them is now a compile error instead of a call that does nothing. `lazy` is unaffected in practice — the real implementation in `runtime/lazy-component` already shadowed the placeholder at the package root.

`updateProps` has no replacement yet: `PropsManager.setProps` exists but is unreachable from a `ComponentInstance`. Tracked on #237.

**`@tachui/forms` — breaking:** `useFormState()` and `useFormValidation()` returned `{}`. They shadowed the real form-state engine in the same package and are removed; use `createFormState`, `createField` or `createMultiStepFormState`. The `FormStateManager` and `FormUtilOptions` type aliases, both `any`, are removed with them.

**`@tachui/cli`:** `analyze-imports --fix` printed per-optimization success ticks and "Applied N optimizations successfully!" without modifying a single file. It now reports the optimizations it would make and states plainly that nothing was written and the changes are manual.
