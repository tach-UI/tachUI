# @tachui/grid

## 0.11.7

### Patch Changes

- Updated dependencies [[`1e8bf73`](https://github.com/tach-UI/tachUI/commit/1e8bf73780e3ae779ca4e6d679409b98f1cd619d)]:
  - @tachui/core@0.11.7
  - @tachui/modifiers@0.11.7
  - @tachui/responsive@0.11.7
  - @tachui/registry@0.11.7
  - @tachui/types@0.11.7

## 0.11.6

### Patch Changes

- Updated dependencies [[`a5016c8`](https://github.com/tach-UI/tachUI/commit/a5016c8f94ad4409e439600c6ba538d8707a63c8), [`25c07ae`](https://github.com/tach-UI/tachUI/commit/25c07ae8bb15bb3bc35e786dd2ee5bfbfc70b83a), [`68dfd91`](https://github.com/tach-UI/tachUI/commit/68dfd9177f417ea11265574c230c82b7e2f009a8), [`cdc34b2`](https://github.com/tach-UI/tachUI/commit/cdc34b2be48a3979da71d40c18756e467b932b07)]:
  - @tachui/core@0.11.6
  - @tachui/types@0.11.6
  - @tachui/modifiers@0.11.6
  - @tachui/responsive@0.11.6
  - @tachui/registry@0.11.6

## 0.11.5

### Patch Changes

- [#408](https://github.com/tach-UI/tachUI/pull/408) [`6a5f04a`](https://github.com/tach-UI/tachUI/commit/6a5f04a175e853c9924bdd791f554c4a7265b209) Thanks [@whoughton](https://github.com/whoughton)! - Chain methods are now type-checked. `ModifierBuilder` ended in
  `[key: string]: any`, so every chain call typechecked as `any`, including a
  misspelled method, wrong arguments, or a modifier no package had typed. That
  fallback is gone.

  A method is now typed if core declares it or if the package that registers it
  adds it. Each registering module adds its modifiers to `ModifierBuilder` by
  augmenting `@tachui/types/modifiers`, with signatures derived from the
  registered factories through the new `ModifierMethodsOf` and
  `ModifierFactoriesOf` helpers. A method is therefore typed exactly when
  importing its package registers it, and its parameters can't drift from its
  factory. About 150 registered modifiers had no declaration anywhere, including
  the aria helpers, `role`, most padding and margin sides, the touch handlers,
  and the whole effects set. They are all typed now. The separate
  `ModifierBuilder` that `@tachui/modifiers/types` declared is replaced by a
  re-export of the one interface.

  A chain on a component returns that component, as the runtime does, so a
  modified component can be a child: `VStack({ children: [Text('a').padding(4)] })`.
  A chain on `.modifier` returns the builder until `.build()`.

  Typing them exposed some runtime bugs:

  - `margin(signal)` treated the signal as its options object and set no margin.
    It now follows the signal, as `padding(signal)` does.
  - Navigation's tab views, stacks, links and split view called basic modifiers
    without loading them, so they only worked if the app had. They now import
    `@tachui/modifiers/preload/basic`, and navigation's build keeps every
    `@tachui/*` import external. It used to bundle what it imported beyond
    `@tachui/core` and `@tachui/primitives`, which would have given it a private
    registry that the app's builder never reads.
  - Navigation's builder methods (`.navigationTitle()`, `.toolbarBackground()`
    and the rest) were missing from the published build: they were a module
    side effect, and the bundler dropped them. They are now installed by an
    explicit call from the package's entry points, on the app's builder from
    `@tachui/core/modifiers`. A `dist` check in `test:ci` covers all of this.

  Typing also required two small changes in navigation. A tab view now
  normalizes a tab button's render result to an array before mapping it, as the
  declared return type requires. The split view now applies the detail column's
  `maxWidth` only when one is configured, so an unset width still writes nothing
  inline.

  Navigation's own builder augmentation targeted `@tachui/core`, which re-exports
  the interface through `export *`, a path augmentation cannot reach. It now
  targets `@tachui/types/modifiers`. Grid, responsive, viewport, mobile, forms,
  fragments and navigation now depend on `@tachui/types` directly, because their
  published declarations reference it.

  The size modifiers (`width`, `height`, `minWidth`, `maxWidth`, `minHeight`,
  `maxHeight`) and the `padding` and `margin` families accept a signal in their
  types, as they already did at runtime.

  Some typed signatures change where the old ones were wrong:

  - `refreshable` takes its options object, `{ onRefresh, … }`. The old type
    took a bare function, which failed at runtime on the first pull.
  - `transition` also takes its object form, `{ property, duration, easing,
delay }`, which the runtime always accepted.
  - `.transform()` is typed for a string. The basic and effects modifiers both
    register `transform`, and whichever loads first is what the chain calls. The
    effects version now also takes a string (it used to throw during render),
    so a string works in either order. Its configuration form is available by
    calling the factory directly, or through `.scale()`, `.rotate()` and the
    other transform modifiers.
  - `.asHTML()` is written out, not derived, so its security notice appears
    where it is called.

  The error for a modifier missing from the registry now names the right
  imports: it used to suggest `@tachui/modifiers` even for grid, navigation or
  forms modifiers.

  Six chain methods that are registered, and now typed, used to throw when
  called: `.onAppear()`, `.onDisappear()`, `.refreshable()`,
  `.customProperty()`, `.customProperties()` and `.cssVariables()`. Each had a
  leftover "moved to another package" stub on the builder, which the chain
  finds before the registry. The stubs are gone, so these resolve from the
  registry like every other registered modifier. Ten transition presets
  (`fadeTransition`, `buttonTransition` and the rest) were declared on the
  builder but never implemented anywhere, so calling one threw a `TypeError`.
  They are no longer declared.

- Updated dependencies [[`3c7d240`](https://github.com/tach-UI/tachUI/commit/3c7d24003bac08f32d1131620c5320dea3448d4a), [`42e2555`](https://github.com/tach-UI/tachUI/commit/42e2555028b3bb8d9b121da8a849e4c06dd3b258), [`59a1495`](https://github.com/tach-UI/tachUI/commit/59a149583c907d37954f557921e9634f17c874db), [`0597547`](https://github.com/tach-UI/tachUI/commit/0597547f699efab16648906a4c8132b02093df36), [`adb81be`](https://github.com/tach-UI/tachUI/commit/adb81be8830ba8de02d4c53d02689ff3a2d97280), [`0597547`](https://github.com/tach-UI/tachUI/commit/0597547f699efab16648906a4c8132b02093df36), [`6a5f04a`](https://github.com/tach-UI/tachUI/commit/6a5f04a175e853c9924bdd791f554c4a7265b209), [`2593ced`](https://github.com/tach-UI/tachUI/commit/2593ced011ce4148199028edf401156888865660), [`e8607d0`](https://github.com/tach-UI/tachUI/commit/e8607d02a149147226c38d4545c432fa34624693), [`3242516`](https://github.com/tach-UI/tachUI/commit/3242516a36ef4456652791e1d27f33a87a972b11), [`1f9de1f`](https://github.com/tach-UI/tachUI/commit/1f9de1fc374c166668b73575c244e565f6a0fb7d), [`51cee06`](https://github.com/tach-UI/tachUI/commit/51cee060d97f5172bf2f00888cef2570efbb7171), [`818d1aa`](https://github.com/tach-UI/tachUI/commit/818d1aac5e3f0e68e073ca9fe5930ffcef5ff8b2), [`3f061b5`](https://github.com/tach-UI/tachUI/commit/3f061b54bb6096fb4555282ece8f5dd9e7fb495c), [`6d787ba`](https://github.com/tach-UI/tachUI/commit/6d787ba6658cc640548133dac94938a1d7d75a49), [`5c4eddb`](https://github.com/tach-UI/tachUI/commit/5c4eddbb5a1af5a0283268249a20f093c6dc0b11), [`3f061b5`](https://github.com/tach-UI/tachUI/commit/3f061b54bb6096fb4555282ece8f5dd9e7fb495c), [`ecf7ed0`](https://github.com/tach-UI/tachUI/commit/ecf7ed02d0a7b8708e7eba04cb2bfe6ca267f5a9), [`9d47ded`](https://github.com/tach-UI/tachUI/commit/9d47dedfcffe259abd1d07407512761e29dca0a3), [`5a6ac09`](https://github.com/tach-UI/tachUI/commit/5a6ac0904f6e4b22af8239a1ebbac8395708db74)]:
  - @tachui/core@0.11.5
  - @tachui/modifiers@0.11.5
  - @tachui/types@0.11.5
  - @tachui/responsive@0.11.5
  - @tachui/registry@0.11.5

## 0.11.1

### Patch Changes

- [#371](https://github.com/tach-UI/tachUI/pull/371) [`e58bce2`](https://github.com/tach-UI/tachUI/commit/e58bce248829451c8e89a9af5ab19705dd806f57) Thanks [@whoughton](https://github.com/whoughton)! - `@tachui/grid` and `@tachui/viewport` shipped 0.11.0 with no type declarations
  at all, while their manifests pointed at `dist/index.d.ts`. Grid's build never
  ran `tsc`; viewport's did, but inherited `noEmit: true` from the root config,
  which wins over `emitDeclarationOnly`, so it produced a `.tsbuildinfo` and
  nothing else. Both then hit a second fault: the incremental state sat at the
  package root, where the build script's `rm -rf dist` could not reach it, so a
  clean rebuild believed the declarations were current and emitted nothing —
  silently, with exit code 0. The state now lives in `dist`, and viewport gets an
  explicit `rootDir` so the output lands where the manifest says.

  `@tachui/core`'s `./minimal`, `./common`, `./essential` and `./minimal-prod`
  subpaths advertised `dist/<name>.d.ts`. Those bundles are built from
  `src/bundles/`, so their declarations are at `dist/bundles/<name>.d.ts` — the
  JavaScript resolved and the types never did.

  `ci:check-declared-types` now fails a build where a publishable package
  advertises declarations it did not produce. Three entry points are recorded as
  known gaps rather than hidden: `@tachui/core`'s `./viewport` and
  `@tachui/grid`'s `./components` and `./modifiers` have no build output at all,
  which is a build fix rather than a manifest fix.

  `@tachui/eslint-plugin@0.11.0` published with no code in it — `package.json` and
  `README.md`, nothing else. It has a build script and is not private, but it was
  absent from `build:packages`, and the release workflow builds by running exactly
  that. With no `prepack` hook either, `changeset publish` packed a directory that
  had never been written. Installing it got you an empty package. It joins the
  build chain.

  That is also why `ci:check-declared-types` runs in the build job: checked
  against a stale local `dist` it passes, which is how this went unnoticed here
  before CI ran it on a clean tree.

  Every entry point the packages advertise now exists. `@tachui/mobile`'s main
  entry pointed at `dist/index.js` while vite, given a bare entry, named the
  output after the package — `dist/mobile.js`. Its types resolved and importing
  the package did not. `@tachui/grid`'s `./components` and `./modifiers`, and
  `@tachui/viewport`'s `./modifiers`, were advertised with nothing building them;
  grid needed the index files written as well. `@tachui/core` listed six subpaths
  whose JavaScript was never built — the declarations existed because tsc walks
  the whole tree, so they type-checked and then failed to resolve. Four of those
  are build-plugin and type-generator entries importing `node:` builtins, which
  rollup could not resolve until they were externalised; they are Node-side
  tooling, not browser code.

  `@tachui/core`'s `./viewport` subpath is removed rather than repaired. It has no
  source behind it at all: viewport moved to `@tachui/viewport`, and the export
  was left behind pointing at nothing.

  `ci:check-declared-types` now checks `import`, `types`, `require` and `default`
  on every exports entry rather than declarations alone — 258 entry points. The
  known-gaps list it carried is gone, because the gaps are.

  `@tachui/eslint-plugin` needed a second repair. Putting it in the build chain
  got it to publish a `dist`; the entry still threw `ERR_MODULE_NOT_FOUND` on
  load, because `"type": "module"` requires extensioned relative specifiers and
  the source imported `./rules/prefer-direct-modifiers`. It went from publishing
  nothing to publishing something unusable, and every existence check passed
  throughout. `ci:check-entry-imports` now loads what the manifests advertise.

  Making `@tachui/core/build-plugins` build exposed a plugin that assumed the
  repository layout. Its default hydrator walked a relative path to
  `../../modifiers/src/index.ts` — correct beside the source, and in
  `node_modules` a path into `@tachui/modifiers/src`, which published packages do
  not contain, so it resolved nothing and said nothing. The hydrators carry a
  package specifier now and try it first, falling back to the relative source for
  running inside this repository. Its default output moved likewise: from
  `node_modules/@tachui/core/src`, where generated types help nobody and the next
  install erases them, to the consumer's own project.

  Verified by installing core, modifiers, registry and types into a scratch
  project as copies rather than links and running the documented
  `modifierTypesPlugin()`: it reports hydrating via `@tachui/modifiers` and writes
  into the project's `src/types/`.

  It still generates zero modifiers, and that is a different fault (#373): nothing
  registers metadata for it to describe. `@tachui/modifiers` exports
  `registerModifiers` without a `registerModifierMetadata` beside it, and the hook
  that does exist is in a devtools module that is neither built as an entry nor
  exported, so it is reachable from the source tree and nowhere else. The count is
  0 in this repository too, where resolution has always worked, and the committed
  declaration has said so since October 2025. Resolving when installed is
  necessary and not sufficient; the rest belongs to #373.

- Updated dependencies [[`23c5c26`](https://github.com/tach-UI/tachUI/commit/23c5c26e90085bb665d3e18b75b5763dbf2709fa), [`e58bce2`](https://github.com/tach-UI/tachUI/commit/e58bce248829451c8e89a9af5ab19705dd806f57)]:
  - @tachui/core@0.11.1
  - @tachui/modifiers@0.11.1
  - @tachui/responsive@0.11.1
  - @tachui/registry@0.11.1

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

- Updated dependencies [[`a6d0668`](https://github.com/tach-UI/tachUI/commit/a6d06680e3212b5e5dfe11c60d43ad04ae7e131a), [`9864d4c`](https://github.com/tach-UI/tachUI/commit/9864d4cab381e92abfc365f7749b9608636e4bb5), [`b30f4a3`](https://github.com/tach-UI/tachUI/commit/b30f4a3c80a816398ed644fe2f489c1ca532318b), [`a2e553b`](https://github.com/tach-UI/tachUI/commit/a2e553b39c649240e5f361c6d925394ccba17d2b), [`0c10b49`](https://github.com/tach-UI/tachUI/commit/0c10b4945aefaf290a2779fa44c0a12ff2fc0d8a), [`eabe555`](https://github.com/tach-UI/tachUI/commit/eabe55501766e5da320e42e65420dbd64e71e616), [`1c3099d`](https://github.com/tach-UI/tachUI/commit/1c3099d059b03af704ed91ead50079bc36e92007), [`b2335fe`](https://github.com/tach-UI/tachUI/commit/b2335fe0c43a9704b6544af48a54071529d2f441), [`eabe555`](https://github.com/tach-UI/tachUI/commit/eabe55501766e5da320e42e65420dbd64e71e616)]:
  - @tachui/core@0.11.0
  - @tachui/modifiers@0.11.0
  - @tachui/responsive@0.11.0
  - @tachui/registry@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [[`11a792d`](https://github.com/tach-UI/tachUI/commit/11a792db9d51db5182bc7877f5a8719c15fae11f), [`d5cd030`](https://github.com/tach-UI/tachUI/commit/d5cd030464dee0be84b8a2c6013fed716e53f551), [`0da0398`](https://github.com/tach-UI/tachUI/commit/0da03983bd74252a0ad917e7443b52781980b0bb), [`746b2be`](https://github.com/tach-UI/tachUI/commit/746b2bed20d71335f04e47097b135196d9f2caad), [`1fe6910`](https://github.com/tach-UI/tachUI/commit/1fe69104fadafa3663163b2d749e963b84620427), [`5cd2e02`](https://github.com/tach-UI/tachUI/commit/5cd2e0236f0336bf86d71744cb4b557145462c5d), [`327e8de`](https://github.com/tach-UI/tachUI/commit/327e8dea132e3a2f26d6afa724cc130b323413fa), [`7245d29`](https://github.com/tach-UI/tachUI/commit/7245d29aaf569483c16ff9d51788fb4815895caf), [`df5c539`](https://github.com/tach-UI/tachUI/commit/df5c5390072163b73ef16509f569b517ce916ea4), [`850d557`](https://github.com/tach-UI/tachUI/commit/850d557b19c763c296f9457e4401b0c4b822cc68), [`985a84b`](https://github.com/tach-UI/tachUI/commit/985a84b800dab2413ca563bac943f9ca3efc41db), [`2984b3c`](https://github.com/tach-UI/tachUI/commit/2984b3ccd461f7126acc9286f145d322d190373e)]:
  - @tachui/core@0.10.0
  - @tachui/modifiers@0.10.0
  - @tachui/responsive@0.10.0
  - @tachui/registry@0.10.0

## 0.8.33

### Patch Changes

- Updated dependencies [[`9ae49e0`](https://github.com/tach-UI/tachUI/commit/9ae49e04ebeaf6d5363d1f5cb85230010f9905c2), [`9ae49e0`](https://github.com/tach-UI/tachUI/commit/9ae49e04ebeaf6d5363d1f5cb85230010f9905c2)]:
  - @tachui/core@0.8.32
  - @tachui/modifiers@0.8.33
  - @tachui/responsive@0.8.33
  - @tachui/registry@0.8.32

## 0.8.32

### Patch Changes

- Updated dependencies [[`fae8633`](https://github.com/tach-UI/tachUI/commit/fae86338af75e0cfcc37f9f74b494a11092b29a2), [`fae8633`](https://github.com/tach-UI/tachUI/commit/fae86338af75e0cfcc37f9f74b494a11092b29a2), [`fae8633`](https://github.com/tach-UI/tachUI/commit/fae86338af75e0cfcc37f9f74b494a11092b29a2)]:
  - @tachui/core@0.8.31
  - @tachui/modifiers@0.8.32
  - @tachui/responsive@0.8.32
  - @tachui/registry@0.8.31

## 0.8.31

### Patch Changes

- Updated dependencies [[`de58dac`](https://github.com/tach-UI/tachUI/commit/de58dac18bc26c1d1c0a3cc15472e3d2cde92bf7), [`4a8d3a8`](https://github.com/tach-UI/tachUI/commit/4a8d3a8aa5293ddd5e4698c0cfe21a52327fe972)]:
  - @tachui/core@0.8.30
  - @tachui/modifiers@0.8.31
  - @tachui/responsive@0.8.31
  - @tachui/registry@0.8.30

## 0.8.30

### Patch Changes

- Updated dependencies [[`6a45ba3`](https://github.com/tach-UI/tachUI/commit/6a45ba3e75bbde9f0fa6e2636f5a6e7d7e7a2019)]:
  - @tachui/core@0.8.29
  - @tachui/modifiers@0.8.30
  - @tachui/responsive@0.8.30
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
  - @tachui/registry@0.8.28
  - @tachui/responsive@0.8.29

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
  - @tachui/registry@0.8.27
  - @tachui/responsive@0.8.28

## 0.8.27

### Patch Changes

- Updated dependencies [[`ea92165`](https://github.com/tach-UI/tachUI/commit/ea921651953ac5edaefe410ac7c08730634f869f)]:
  - @tachui/core@0.8.26
  - @tachui/modifiers@0.8.27
  - @tachui/responsive@0.8.27
  - @tachui/registry@0.8.26

## 0.8.26

### Patch Changes

- Updated dependencies [[`ee3b6ed`](https://github.com/tach-UI/tachUI/commit/ee3b6ed44ca0262a4efe4567e67a52e2e2bd7534)]:
  - @tachui/modifiers@0.8.26
  - @tachui/responsive@0.8.26

## 0.8.25

### Patch Changes

- Updated dependencies [[`2e43673`](https://github.com/tach-UI/tachUI/commit/2e43673d98067daf54af8b7a7f31cc125a53ab34)]:
  - @tachui/core@0.8.25
  - @tachui/modifiers@0.8.25
  - @tachui/responsive@0.8.25
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
  - @tachui/registry@0.8.24
  - @tachui/responsive@0.8.24

## 0.8.23

### Patch Changes

- Updated dependencies [[`97ad059`](https://github.com/tach-UI/tachUI/commit/97ad059fd80122b84f938aeba5847b7984bacc5f)]:
  - @tachui/core@0.8.23
  - @tachui/modifiers@0.8.23
  - @tachui/responsive@0.8.23
  - @tachui/registry@0.8.23

## 0.8.22

### Patch Changes

- Updated dependencies [[`6fc0c1c`](https://github.com/tach-UI/tachUI/commit/6fc0c1cd732eb0a18a7886cb1666833542a0abc5)]:
  - @tachui/modifiers@0.8.22
  - @tachui/core@0.8.22
  - @tachui/responsive@0.8.22
  - @tachui/registry@0.8.22

## 0.8.21

### Patch Changes

- Updated dependencies [[`711187b`](https://github.com/tach-UI/tachUI/commit/711187b7efa5820f05d6b8bcb396147e90b83d9d)]:
  - @tachui/core@0.8.21
  - @tachui/modifiers@0.8.21
  - @tachui/responsive@0.8.21
  - @tachui/registry@0.8.21

## 0.8.20

### Patch Changes

- Updated dependencies [[`859a15a`](https://github.com/tach-UI/tachUI/commit/859a15a245cbde879a6dba2f74568d8881d74a4c)]:
  - @tachui/core@0.8.20
  - @tachui/modifiers@0.8.20
  - @tachui/responsive@0.8.20
  - @tachui/registry@0.8.20

## 0.8.19

### Patch Changes

- Updated dependencies [[`b2f2522`](https://github.com/tach-UI/tachUI/commit/b2f25224d7d33e249653f90a94091287c3506f47)]:
  - @tachui/core@0.8.19
  - @tachui/modifiers@0.8.19
  - @tachui/responsive@0.8.19
  - @tachui/registry@0.8.19

## 0.8.18

### Patch Changes

- Updated dependencies [[`b3ca77c`](https://github.com/tach-UI/tachUI/commit/b3ca77c89cfcf75994f32ca7c2245bf579f71a82)]:
  - @tachui/core@0.8.18
  - @tachui/modifiers@0.8.18
  - @tachui/responsive@0.8.18
  - @tachui/registry@0.8.18

## 0.8.17

### Patch Changes

- Updated dependencies [[`e982ab2`](https://github.com/tach-UI/tachUI/commit/e982ab26f9012c610b9cb0bff78840dc26771d40)]:
  - @tachui/core@0.8.17
  - @tachui/modifiers@0.8.17
  - @tachui/responsive@0.8.17
  - @tachui/registry@0.8.17

## 0.8.16

### Patch Changes

- [#136](https://github.com/tach-UI/tachUI/pull/136) [`a8a1103`](https://github.com/tach-UI/tachUI/commit/a8a1103ebe68d7052f95995db5d1b3dc89bb3b49) Thanks [@whoughton](https://github.com/whoughton)! - Fix reactive update consistency across modifiers, primitives, forms, navigation, and viewport, and add deterministic test coverage for review feedback items.

- Updated dependencies [[`a8a1103`](https://github.com/tach-UI/tachUI/commit/a8a1103ebe68d7052f95995db5d1b3dc89bb3b49)]:
  - @tachui/core@0.8.16
  - @tachui/modifiers@0.8.16
  - @tachui/responsive@0.8.16
  - @tachui/registry@0.8.16

## 0.8.15

### Patch Changes

- Updated dependencies [[`8afda39`](https://github.com/tach-UI/tachUI/commit/8afda390d9ced5da657318a78535c9fac8f22819)]:
  - @tachui/core@0.8.15
  - @tachui/registry@0.8.15
  - @tachui/modifiers@0.8.15
  - @tachui/responsive@0.8.15

## 0.8.14

### Patch Changes

- Updated dependencies [[`8f5eeaa`](https://github.com/tach-UI/tachUI/commit/8f5eeaaa513e0ea581212599b2c115b149de71a8), [`8f5eeaa`](https://github.com/tach-UI/tachUI/commit/8f5eeaaa513e0ea581212599b2c115b149de71a8)]:
  - @tachui/modifiers@0.8.14
  - @tachui/core@0.9.0
  - @tachui/responsive@0.8.14
  - @tachui/registry@0.9.0

## 0.8.13

### Patch Changes

- [#109](https://github.com/tach-UI/tachUI/pull/109) [`e02aee1`](https://github.com/tach-UI/tachUI/commit/e02aee14d816b6ccd78684528fdf4ce95e47714a) Thanks [@whoughton](https://github.com/whoughton)! - Release patch versions across all publishable TachUI packages to recover from broken cross-version dependency metadata and restore a coherent single-runtime install graph.

- Updated dependencies [[`e02aee1`](https://github.com/tach-UI/tachUI/commit/e02aee14d816b6ccd78684528fdf4ce95e47714a)]:
  - @tachui/core@0.8.13
  - @tachui/modifiers@0.8.13
  - @tachui/registry@0.8.13
  - @tachui/responsive@0.8.13

## 0.8.12

### Patch Changes

- Updated dependencies [[`078b01e`](https://github.com/tach-UI/tachUI/commit/078b01e574325d6d3e5eb6d90b81c7fad2cf39cf)]:
  - @tachui/core@0.9.0
  - @tachui/modifiers@0.8.12
  - @tachui/responsive@0.8.12
  - @tachui/registry@0.9.0

## 0.8.10-alpha.0

### Patch Changes

- [#93](https://github.com/tach-UI/tachUI/pull/93) [`143c53c`](https://github.com/tach-UI/tachUI/commit/143c53c3c7e3c6e7a4eea1871d1c9f07c72d30b5) Thanks [@whoughton](https://github.com/whoughton)! - Start the 0.8.10-alpha prerelease train across all publishable @tachui packages.

- Updated dependencies [[`143c53c`](https://github.com/tach-UI/tachUI/commit/143c53c3c7e3c6e7a4eea1871d1c9f07c72d30b5)]:
  - @tachui/core@0.8.10-alpha.0
  - @tachui/modifiers@0.8.10-alpha.0
  - @tachui/registry@0.8.10-alpha.0
  - @tachui/responsive@0.8.10-alpha.0

## 0.8.9

### Patch Changes

- Updated dependencies [[`5d3fb03`](https://github.com/tach-UI/tachUI/commit/5d3fb03c5ec91e344c0625bab8c48a2ea5bcee34)]:
  - @tachui/core@0.8.9
  - @tachui/modifiers@0.8.9
  - @tachui/responsive@0.8.9
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
  - @tachui/registry@0.8.8
  - @tachui/responsive@0.8.8
