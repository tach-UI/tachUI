# @tachui/forms

## 0.11.0

### Patch Changes

- [#365](https://github.com/tach-UI/tachUI/pull/365) [`1c3099d`](https://github.com/tach-UI/tachUI/commit/1c3099d059b03af704ed91ead50079bc36e92007) Thanks [@whoughton](https://github.com/whoughton)! - `isSignal` now recognises a computed, and `Button`'s `isEnabled` follows a
  signal.

  `createSignal` marks its accessor `tachui.signal` and `createComputed` marks
  its own `tachui.computed`, but `isSignal` looked only for the first — so a
  computed failed the guard for the `Signal` type it satisfies. That is not a
  narrow miss. The standard `isSignal(x) ? x() : x` split then passes the
  _function_ on as if it were a value, so a prop reads as permanently truthy, a
  style is set to a function, and nothing subscribes.

  **This changes runtime behaviour wherever that split appears, which is roughly a
  hundred call sites** — `Stepper`, `DatePicker`, `Picker`, `TextField` and
  `Slider` in forms; `tab-view`, `navigation-link` and the navigation modifiers;
  `List` and `Menu` in data; `Alert` and `ActionSheet` in mobile; and reactive
  class handling in modifiers and grid. A prop that accepts `boolean | Signal`
  and was handed a computed now honours it. `isSignal` is public API and this
  widens what it accepts deliberately, hence a minor rather than a patch on core.

  `NavigationLink` is the one place where widening did more than fix a split. Its
  `isActive` handling intercepts the _write_ that sets the value true, navigates,
  and sets it back to false. A computed has no write to intercept, and the
  fallback path it now reaches would navigate the moment the value was truthy —
  on mount, and again on every recomputation, with nothing able to reset it. A
  source with no settable implementation behind it is no longer driven from
  there.

  `Button.isEnabled()` returned the signal itself rather than its value, which
  made every consumer wrong the same way: `if (!isEnabled)` on a function is
  never true, so the press guard never fired and `getButtonStyles` computed its
  disabled appearance from a truthy function. It resolves now, the way
  `isLoading` already did.

  `disabled` reaches the renderer as an inverted signal, built fresh on each
  render. Identity matters as much as value: a render runs inside an effect, so
  an enclosing component re-rendering for any reason disposes that scope and
  takes the renderer's subscription with it, and the renderer diffs props by
  identity — a cached accessor would be recognised, skipped, and never
  resubscribed. Where a render has no owner at all, which is the direct mount
  path behind sheets, popovers and split views, `disabled` is a plain value
  instead: nothing there disposes what a render creates, so a subscription made
  in that path would be held for the life of the process, one per mount.

  Button's reactive style effect no longer subscribes to anything a caller owns.
  It is created on DOM ready, a path where nothing disposes it — the component's
  cleanup array is copied by `build()` before a render can add to it, and the
  renderer's element cleanup does not run there either — so every signal it read
  was held for the life of the process, one observer per mount, and those signals
  are shared across every component handed the same one. It now reads the enabled
  and loading state, `tint`, `backgroundColor`, `foregroundColor`, and the theme a
  `ColorAsset` resolves against as snapshots, and depends only on the component's
  own state signal.

  That removes reactivity as well as the leak: a caller's colour or loading signal
  changing no longer restyles through this effect. Nothing observable changes
  today, because the style application skips any property that already has a
  value and so only the first pass ever reaches the DOM — but when that skip is
  fixed, or when the mount path learns to dispose what a render creates, the
  subscriptions belong back here and not before.

  The click handler also declines while disabled **or loading**. A disabled
  button suppresses clicks natively in a browser but not in every environment,
  and `handlePress` has always refused a press while loading — so a click and a
  press could disagree about whether a loading button acts. They no longer do.

  A disabled Button also _looks_ disabled now, which it did not before and does
  not on the released version either. Its styles travel with the element as a
  prop the renderer owns, rather than being written onto the element afterwards
  by an effect that ran on DOM ready — an effect the ordinary render path never
  fires, so a Button rendered that way had no styles at all, disabled or
  otherwise. Applying them before modifiers rather than after also makes modifier
  precedence a matter of ordering rather than of inspecting what is already on
  the element: the component no longer has to guess whether a value it finds
  there was a modifier's or its own from a previous pass, which it guessed wrong,
  so every pass after the first stood down and a button that became disabled kept
  the appearance of one that was not.

  The other half of the report — signal-driven style modifier values reading once
  — was not reproducible: effects flush on a microtask, so a read in the same
  task as the write is stale by design. Nothing pinned it either way, which is
  why it was plausible enough to report, so `foregroundColor` and
  `backgroundColor` now carry signal-update tests.

  `clone-helpers` drops a local `isSignal` that tested for a `.set` no signal
  accessor has ever had. It matched nothing, and signals reached the generic
  branch that passes functions through by reference — the right answer for no
  reason.

- [#365](https://github.com/tach-UI/tachUI/pull/365) [`eabe555`](https://github.com/tach-UI/tachUI/commit/eabe55501766e5da320e42e65420dbd64e71e616) Thanks [@whoughton](https://github.com/whoughton)! - Writing a value back through a two-way prop now says when it cannot.

  A prop declared `T | Signal<T>` is written through the accessor it was given,
  and only a `createSignal` accessor has anything to write to. A computed is a
  `Signal` and has no setter, so `Stepper`'s value and `TabView`'s selection
  moved their control and changed nothing — silently, which is the worst of the
  available answers. Both now go through `writeSignal`, which writes where it
  can, reports whether it landed, and explains itself in development where it
  cannot.

  This matters more now that a computed passes `isSignal` at all. The other
  write-back sites in the navigation modifiers are deliberately left alone: they
  fall through to a binding or a callback when the signal path does not take, so
  nothing is silently dropped there.

- Updated dependencies [[`a6d0668`](https://github.com/tach-UI/tachUI/commit/a6d06680e3212b5e5dfe11c60d43ad04ae7e131a), [`b30f4a3`](https://github.com/tach-UI/tachUI/commit/b30f4a3c80a816398ed644fe2f489c1ca532318b), [`a2e553b`](https://github.com/tach-UI/tachUI/commit/a2e553b39c649240e5f361c6d925394ccba17d2b), [`0c10b49`](https://github.com/tach-UI/tachUI/commit/0c10b4945aefaf290a2779fa44c0a12ff2fc0d8a), [`eabe555`](https://github.com/tach-UI/tachUI/commit/eabe55501766e5da320e42e65420dbd64e71e616), [`1c3099d`](https://github.com/tach-UI/tachUI/commit/1c3099d059b03af704ed91ead50079bc36e92007), [`eabe555`](https://github.com/tach-UI/tachUI/commit/eabe55501766e5da320e42e65420dbd64e71e616)]:
  - @tachui/core@0.11.0
  - @tachui/primitives@0.11.0
  - @tachui/modifiers@0.11.0
  - @tachui/registry@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [[`11a792d`](https://github.com/tach-UI/tachUI/commit/11a792db9d51db5182bc7877f5a8719c15fae11f), [`d067ce9`](https://github.com/tach-UI/tachUI/commit/d067ce91ae4ed537a3ec3848c05addf8a5f45a1d), [`d5cd030`](https://github.com/tach-UI/tachUI/commit/d5cd030464dee0be84b8a2c6013fed716e53f551), [`0da0398`](https://github.com/tach-UI/tachUI/commit/0da03983bd74252a0ad917e7443b52781980b0bb), [`746b2be`](https://github.com/tach-UI/tachUI/commit/746b2bed20d71335f04e47097b135196d9f2caad), [`1fe6910`](https://github.com/tach-UI/tachUI/commit/1fe69104fadafa3663163b2d749e963b84620427), [`5cd2e02`](https://github.com/tach-UI/tachUI/commit/5cd2e0236f0336bf86d71744cb4b557145462c5d), [`327e8de`](https://github.com/tach-UI/tachUI/commit/327e8dea132e3a2f26d6afa724cc130b323413fa), [`7245d29`](https://github.com/tach-UI/tachUI/commit/7245d29aaf569483c16ff9d51788fb4815895caf), [`df5c539`](https://github.com/tach-UI/tachUI/commit/df5c5390072163b73ef16509f569b517ce916ea4), [`850d557`](https://github.com/tach-UI/tachUI/commit/850d557b19c763c296f9457e4401b0c4b822cc68), [`985a84b`](https://github.com/tach-UI/tachUI/commit/985a84b800dab2413ca563bac943f9ca3efc41db), [`2984b3c`](https://github.com/tach-UI/tachUI/commit/2984b3ccd461f7126acc9286f145d322d190373e)]:
  - @tachui/core@0.10.0
  - @tachui/modifiers@0.10.0
  - @tachui/primitives@0.10.0
  - @tachui/registry@0.10.0

## 0.8.34

### Patch Changes

- Updated dependencies [[`9ae49e0`](https://github.com/tach-UI/tachUI/commit/9ae49e04ebeaf6d5363d1f5cb85230010f9905c2), [`9ae49e0`](https://github.com/tach-UI/tachUI/commit/9ae49e04ebeaf6d5363d1f5cb85230010f9905c2)]:
  - @tachui/core@0.8.32
  - @tachui/modifiers@0.8.33
  - @tachui/primitives@0.8.34
  - @tachui/registry@0.8.32

## 0.8.33

### Patch Changes

- Updated dependencies [[`80ebe36`](https://github.com/tach-UI/tachUI/commit/80ebe366c5e64bd6ebe3419744f5bff3605e51be)]:
  - @tachui/primitives@0.8.33

## 0.8.32

### Patch Changes

- [#263](https://github.com/tach-UI/tachUI/pull/263) [`fae8633`](https://github.com/tach-UI/tachUI/commit/fae86338af75e0cfcc37f9f74b494a11092b29a2) Thanks [@whoughton](https://github.com/whoughton)! - Retire the "Phase 3.1.2" placeholder exports and ship a real application entry point (#237, #226).

  **`@tachui/core` — `mount()` is now real.** `mount(root, target?)` renders the app and returns a dispose function that unmounts it and tears down its reactive root. The target accepts an element or a CSS selector and defaults to `'#app'`. A missing target now throws naming the selector that missed, instead of rendering nothing. `unmount(target?)` disposes the app mounted at a target for callers that did not keep the dispose function.

  `mountRoot()` still works and now delegates to `mount()`, so existing bootstraps are unaffected. It is deprecated in favour of `mount()`.

  **Breaking:** `mount`, `unmount`, `updateProps`, `memo` and `lazy` were previously exported from `@tachui/core` as empty functions. `mount` and `unmount` are now real; `updateProps` and `memo` are removed rather than left as silent no-ops, and importing them is now a compile error instead of a call that does nothing. `lazy` is unaffected in practice — the real implementation in `runtime/lazy-component` already shadowed the placeholder at the package root.

  `updateProps` has no replacement yet: `PropsManager.setProps` exists but is unreachable from a `ComponentInstance`. Tracked on #237.

  **`@tachui/forms` — breaking:** `useFormState()` and `useFormValidation()` returned `{}`. They shadowed the real form-state engine in the same package and are removed; use `createFormState`, `createField` or `createMultiStepFormState`. The `FormStateManager` and `FormUtilOptions` type aliases, both `any`, are removed with them.

  **`@tachui/cli`:** `analyze-imports --fix` printed per-optimization success ticks and "Applied N optimizations successfully!" without modifying a single file. It now reports the optimizations it would make and states plainly that nothing was written and the changes are manual.

- Updated dependencies [[`fae8633`](https://github.com/tach-UI/tachUI/commit/fae86338af75e0cfcc37f9f74b494a11092b29a2), [`fae8633`](https://github.com/tach-UI/tachUI/commit/fae86338af75e0cfcc37f9f74b494a11092b29a2), [`fae8633`](https://github.com/tach-UI/tachUI/commit/fae86338af75e0cfcc37f9f74b494a11092b29a2)]:
  - @tachui/core@0.8.31
  - @tachui/modifiers@0.8.32
  - @tachui/primitives@0.8.32
  - @tachui/registry@0.8.31

## 0.8.31

### Patch Changes

- Updated dependencies [[`de58dac`](https://github.com/tach-UI/tachUI/commit/de58dac18bc26c1d1c0a3cc15472e3d2cde92bf7), [`4a8d3a8`](https://github.com/tach-UI/tachUI/commit/4a8d3a8aa5293ddd5e4698c0cfe21a52327fe972)]:
  - @tachui/core@0.8.30
  - @tachui/modifiers@0.8.31
  - @tachui/primitives@0.8.31
  - @tachui/registry@0.8.30

## 0.8.30

### Patch Changes

- Updated dependencies [[`6a45ba3`](https://github.com/tach-UI/tachUI/commit/6a45ba3e75bbde9f0fa6e2636f5a6e7d7e7a2019)]:
  - @tachui/core@0.8.29
  - @tachui/modifiers@0.8.30
  - @tachui/primitives@0.8.30
  - @tachui/registry@0.8.29

## 0.8.29

### Patch Changes

- [#242](https://github.com/tach-UI/tachUI/pull/242) [`112d9c5`](https://github.com/tach-UI/tachUI/commit/112d9c551cc71669591678c32ef55ffe9c410fd2) Thanks [@whoughton](https://github.com/whoughton)! - fix(release): publish versioned internal dependency ranges

  Rewrites the `workspace:*` internal dependency ranges to concrete
  versioned ranges so published manifests are installable from npm.
  `@tachui/core@0.8.27` and `@tachui/primitives@0.8.28` (the current
  `latest` tags) shipped `workspace:*` dependencies and are uninstallable
  outside the monorepo (#235). The release pipeline now rewrites workspace
  ranges during versioning and rejects non-publishable protocols before
  any future publish.

- Updated dependencies [[`d4c6f85`](https://github.com/tach-UI/tachUI/commit/d4c6f85f8a706076cfc47e0e58f76ac39b346513), [`547c82e`](https://github.com/tach-UI/tachUI/commit/547c82e61e9f92da31b0cdceece66fe65da7283a), [`112d9c5`](https://github.com/tach-UI/tachUI/commit/112d9c551cc71669591678c32ef55ffe9c410fd2)]:
  - @tachui/core@0.8.28
  - @tachui/modifiers@0.8.29
  - @tachui/primitives@0.8.29
  - @tachui/registry@0.8.28

## 0.8.28

### Patch Changes

- [#206](https://github.com/tach-UI/tachUI/pull/206) [`d579b1f`](https://github.com/tach-UI/tachUI/commit/d579b1f1fb5cd5441ca281670f815890be20039d) Thanks [@whoughton](https://github.com/whoughton)! - Migrate package manager from pnpm to bun

  - Replace pnpm with bun (v1.2.0) as package manager
  - Update all package scripts from pnpm to bun equivalents
  - Migrate workspace configuration from pnpm-workspace.yaml to package.json workspaces
  - Update CI/CD workflows to use oven-sh/setup-bun@v2
  - Update documentation with bun commands

  Note: This is a tooling change only - no API changes to packages.

- Updated dependencies [[`d579b1f`](https://github.com/tach-UI/tachUI/commit/d579b1f1fb5cd5441ca281670f815890be20039d)]:
  - @tachui/core@0.8.27
  - @tachui/modifiers@0.8.28
  - @tachui/primitives@0.8.28
  - @tachui/registry@0.8.27

## 0.8.27

### Patch Changes

- Updated dependencies [[`ea92165`](https://github.com/tach-UI/tachUI/commit/ea921651953ac5edaefe410ac7c08730634f869f)]:
  - @tachui/core@0.8.26
  - @tachui/modifiers@0.8.27
  - @tachui/primitives@0.8.27
  - @tachui/registry@0.8.26

## 0.8.26

### Patch Changes

- Updated dependencies [[`ee3b6ed`](https://github.com/tach-UI/tachUI/commit/ee3b6ed44ca0262a4efe4567e67a52e2e2bd7534)]:
  - @tachui/modifiers@0.8.26
  - @tachui/primitives@0.8.26

## 0.8.25

### Patch Changes

- Updated dependencies [[`2e43673`](https://github.com/tach-UI/tachUI/commit/2e43673d98067daf54af8b7a7f31cc125a53ab34)]:
  - @tachui/core@0.8.25
  - @tachui/modifiers@0.8.25
  - @tachui/primitives@0.8.25
  - @tachui/registry@0.8.25

## 0.8.24

### Patch Changes

- [#181](https://github.com/tach-UI/tachUI/pull/181) [`1e6c1f4`](https://github.com/tach-UI/tachUI/commit/1e6c1f4f98f68929397ce4b5ea9bfc92e6e45dca) Thanks [@whoughton](https://github.com/whoughton)! - Release tree-shaking and packaging improvements across core and feature packages.

  - add explicit `sideEffects` metadata across publishable packages for safer bundling
  - split runtime-safe vs tooling entry points in `@tachui/core` and add subpath exports
  - add granular navigation and responsive subpath exports with artifact verification
  - include SSR and modifiers/runtime fixes plus supporting docs and CI updates

- Updated dependencies [[`1e6c1f4`](https://github.com/tach-UI/tachUI/commit/1e6c1f4f98f68929397ce4b5ea9bfc92e6e45dca)]:
  - @tachui/core@0.8.24
  - @tachui/modifiers@0.8.24
  - @tachui/primitives@0.8.24
  - @tachui/registry@0.8.24

## 0.8.23

### Patch Changes

- Updated dependencies [[`97ad059`](https://github.com/tach-UI/tachUI/commit/97ad059fd80122b84f938aeba5847b7984bacc5f)]:
  - @tachui/core@0.8.23
  - @tachui/modifiers@0.8.23
  - @tachui/primitives@0.8.23
  - @tachui/registry@0.8.23

## 0.8.22

### Patch Changes

- Updated dependencies [[`6fc0c1c`](https://github.com/tach-UI/tachUI/commit/6fc0c1cd732eb0a18a7886cb1666833542a0abc5)]:
  - @tachui/modifiers@0.8.22
  - @tachui/core@0.8.22
  - @tachui/primitives@0.8.22
  - @tachui/registry@0.8.22

## 0.8.21

### Patch Changes

- Updated dependencies [[`711187b`](https://github.com/tach-UI/tachUI/commit/711187b7efa5820f05d6b8bcb396147e90b83d9d)]:
  - @tachui/core@0.8.21
  - @tachui/modifiers@0.8.21
  - @tachui/primitives@0.8.21
  - @tachui/registry@0.8.21

## 0.8.20

### Patch Changes

- Updated dependencies [[`859a15a`](https://github.com/tach-UI/tachUI/commit/859a15a245cbde879a6dba2f74568d8881d74a4c)]:
  - @tachui/core@0.8.20
  - @tachui/modifiers@0.8.20
  - @tachui/primitives@0.8.20
  - @tachui/registry@0.8.20

## 0.8.19

### Patch Changes

- Updated dependencies [[`b2f2522`](https://github.com/tach-UI/tachUI/commit/b2f25224d7d33e249653f90a94091287c3506f47)]:
  - @tachui/core@0.8.19
  - @tachui/modifiers@0.8.19
  - @tachui/primitives@0.8.19
  - @tachui/registry@0.8.19

## 0.8.18

### Patch Changes

- Updated dependencies [[`b3ca77c`](https://github.com/tach-UI/tachUI/commit/b3ca77c89cfcf75994f32ca7c2245bf579f71a82)]:
  - @tachui/core@0.8.18
  - @tachui/modifiers@0.8.18
  - @tachui/primitives@0.8.18
  - @tachui/registry@0.8.18

## 0.8.17

### Patch Changes

- Updated dependencies [[`e982ab2`](https://github.com/tach-UI/tachUI/commit/e982ab26f9012c610b9cb0bff78840dc26771d40)]:
  - @tachui/core@0.8.17
  - @tachui/primitives@0.8.17
  - @tachui/modifiers@0.8.17
  - @tachui/registry@0.8.17

## 0.8.16

### Patch Changes

- [#136](https://github.com/tach-UI/tachUI/pull/136) [`a8a1103`](https://github.com/tach-UI/tachUI/commit/a8a1103ebe68d7052f95995db5d1b3dc89bb3b49) Thanks [@whoughton](https://github.com/whoughton)! - Fix reactive update consistency across modifiers, primitives, forms, navigation, and viewport, and add deterministic test coverage for review feedback items.

- Updated dependencies [[`a8a1103`](https://github.com/tach-UI/tachUI/commit/a8a1103ebe68d7052f95995db5d1b3dc89bb3b49)]:
  - @tachui/core@0.8.16
  - @tachui/modifiers@0.8.16
  - @tachui/primitives@0.8.16
  - @tachui/registry@0.8.16

## 0.8.15

### Patch Changes

- [#116](https://github.com/tach-UI/tachUI/pull/116) [`8afda39`](https://github.com/tach-UI/tachUI/commit/8afda390d9ced5da657318a78535c9fac8f22819) Thanks [@whoughton](https://github.com/whoughton)! - Correct the internal release line back to `0.8.x` and prevent cross-line drift in future releases.

  This fixes package metadata so internal `@tachui/*` dependencies and peer ranges no longer point at unpublished `0.9.0` or `1.0.0` artifacts, and adds release guards that fail CI when publishable packages diverge across release lines or packed manifests reference unpublished internal versions.

- Updated dependencies [[`8afda39`](https://github.com/tach-UI/tachUI/commit/8afda390d9ced5da657318a78535c9fac8f22819)]:
  - @tachui/core@0.8.15
  - @tachui/registry@0.8.15
  - @tachui/modifiers@0.8.15
  - @tachui/primitives@0.8.15

## 1.0.0

### Patch Changes

- Updated dependencies [[`8f5eeaa`](https://github.com/tach-UI/tachUI/commit/8f5eeaaa513e0ea581212599b2c115b149de71a8), [`8f5eeaa`](https://github.com/tach-UI/tachUI/commit/8f5eeaaa513e0ea581212599b2c115b149de71a8)]:
  - @tachui/modifiers@0.8.14
  - @tachui/core@0.9.0
  - @tachui/primitives@0.8.14
  - @tachui/registry@0.9.0

## 0.8.13

### Patch Changes

- [#109](https://github.com/tach-UI/tachUI/pull/109) [`e02aee1`](https://github.com/tach-UI/tachUI/commit/e02aee14d816b6ccd78684528fdf4ce95e47714a) Thanks [@whoughton](https://github.com/whoughton)! - Release patch versions across all publishable TachUI packages to recover from broken cross-version dependency metadata and restore a coherent single-runtime install graph.

- Updated dependencies [[`e02aee1`](https://github.com/tach-UI/tachUI/commit/e02aee14d816b6ccd78684528fdf4ce95e47714a)]:
  - @tachui/core@0.8.13
  - @tachui/modifiers@0.8.13
  - @tachui/primitives@0.8.13
  - @tachui/registry@0.8.13

## 1.0.0

### Patch Changes

- Updated dependencies [[`078b01e`](https://github.com/tach-UI/tachUI/commit/078b01e574325d6d3e5eb6d90b81c7fad2cf39cf)]:
  - @tachui/core@0.9.0
  - @tachui/modifiers@0.8.12
  - @tachui/primitives@0.8.12
  - @tachui/registry@0.9.0

## 0.8.10-alpha.0

### Patch Changes

- [#93](https://github.com/tach-UI/tachUI/pull/93) [`143c53c`](https://github.com/tach-UI/tachUI/commit/143c53c3c7e3c6e7a4eea1871d1c9f07c72d30b5) Thanks [@whoughton](https://github.com/whoughton)! - Start the 0.8.10-alpha prerelease train across all publishable @tachui packages.

- Updated dependencies [[`143c53c`](https://github.com/tach-UI/tachUI/commit/143c53c3c7e3c6e7a4eea1871d1c9f07c72d30b5)]:
  - @tachui/core@0.8.10-alpha.0
  - @tachui/modifiers@0.8.10-alpha.0
  - @tachui/primitives@0.8.10-alpha.0
  - @tachui/registry@0.8.10-alpha.0

## 0.8.9

### Patch Changes

- Updated dependencies [[`5d3fb03`](https://github.com/tach-UI/tachUI/commit/5d3fb03c5ec91e344c0625bab8c48a2ea5bcee34)]:
  - @tachui/core@0.8.9
  - @tachui/primitives@0.8.9
  - @tachui/modifiers@0.8.9
  - @tachui/registry@0.8.9

## 0.8.8

### Patch Changes

- [#84](https://github.com/tach-UI/tachUI/pull/84) [`78ab143`](https://github.com/tach-UI/tachUI/commit/78ab143a2bcb99092d70d1fa65c3e827e2cccc70) Thanks [@whoughton](https://github.com/whoughton)! - Release catch-up for npm parity and release workflow migration:

  - trigger publication for all current publishable `@tachui/*` packages so npm versions align with the repository baseline
  - preserve `@tachui/core`, `@tachui/types`, and `@tachui/registry` fixed-group behavior during versioning

  CLI and release hardening included in this release:

  - improve default TachUI version resolution with registry-first lookup and compatibility-map fallback behavior
  - validate `--tachui-version` inputs and improve fallback messaging
  - strengthen template package-root resolution
  - expand packed smoke coverage for `npx`/tarball flows and update CI smoke enforcement
  - align CLI docs and tests with the new init/version-resolution behavior

- Updated dependencies [[`78ab143`](https://github.com/tach-UI/tachUI/commit/78ab143a2bcb99092d70d1fa65c3e827e2cccc70)]:
  - @tachui/core@0.8.8
  - @tachui/modifiers@0.8.8
  - @tachui/primitives@0.8.8
  - @tachui/registry@0.8.8
