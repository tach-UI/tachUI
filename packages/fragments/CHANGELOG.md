# @tachui/fragments

## 0.11.7

### Patch Changes

- Updated dependencies [[`1e8bf73`](https://github.com/tach-UI/tachUI/commit/1e8bf73780e3ae779ca4e6d679409b98f1cd619d)]:
  - @tachui/core@0.11.7
  - @tachui/ssr@0.11.7
  - @tachui/types@0.11.7

## 0.11.6

### Patch Changes

- Updated dependencies [[`a5016c8`](https://github.com/tach-UI/tachUI/commit/a5016c8f94ad4409e439600c6ba538d8707a63c8), [`25c07ae`](https://github.com/tach-UI/tachUI/commit/25c07ae8bb15bb3bc35e786dd2ee5bfbfc70b83a), [`68dfd91`](https://github.com/tach-UI/tachUI/commit/68dfd9177f417ea11265574c230c82b7e2f009a8), [`cdc34b2`](https://github.com/tach-UI/tachUI/commit/cdc34b2be48a3979da71d40c18756e467b932b07)]:
  - @tachui/core@0.11.6
  - @tachui/types@0.11.6
  - @tachui/ssr@0.11.6

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

- Updated dependencies [[`3c7d240`](https://github.com/tach-UI/tachUI/commit/3c7d24003bac08f32d1131620c5320dea3448d4a), [`59a1495`](https://github.com/tach-UI/tachUI/commit/59a149583c907d37954f557921e9634f17c874db), [`0597547`](https://github.com/tach-UI/tachUI/commit/0597547f699efab16648906a4c8132b02093df36), [`adb81be`](https://github.com/tach-UI/tachUI/commit/adb81be8830ba8de02d4c53d02689ff3a2d97280), [`0597547`](https://github.com/tach-UI/tachUI/commit/0597547f699efab16648906a4c8132b02093df36), [`6a5f04a`](https://github.com/tach-UI/tachUI/commit/6a5f04a175e853c9924bdd791f554c4a7265b209), [`818d1aa`](https://github.com/tach-UI/tachUI/commit/818d1aac5e3f0e68e073ca9fe5930ffcef5ff8b2), [`3f061b5`](https://github.com/tach-UI/tachUI/commit/3f061b54bb6096fb4555282ece8f5dd9e7fb495c), [`6d787ba`](https://github.com/tach-UI/tachUI/commit/6d787ba6658cc640548133dac94938a1d7d75a49), [`5c4eddb`](https://github.com/tach-UI/tachUI/commit/5c4eddbb5a1af5a0283268249a20f093c6dc0b11), [`3f061b5`](https://github.com/tach-UI/tachUI/commit/3f061b54bb6096fb4555282ece8f5dd9e7fb495c), [`23ab336`](https://github.com/tach-UI/tachUI/commit/23ab3367b98c038f2486b6cb35780a52006291e7), [`9d47ded`](https://github.com/tach-UI/tachUI/commit/9d47dedfcffe259abd1d07407512761e29dca0a3)]:
  - @tachui/core@0.11.5
  - @tachui/types@0.11.5
  - @tachui/ssr@0.11.5

## 0.11.1

### Patch Changes

- Updated dependencies [[`23c5c26`](https://github.com/tach-UI/tachUI/commit/23c5c26e90085bb665d3e18b75b5763dbf2709fa), [`e58bce2`](https://github.com/tach-UI/tachUI/commit/e58bce248829451c8e89a9af5ab19705dd806f57)]:
  - @tachui/core@0.11.1
  - @tachui/ssr@0.11.1

## 0.11.0

### Patch Changes

- Updated dependencies [[`a6d0668`](https://github.com/tach-UI/tachUI/commit/a6d06680e3212b5e5dfe11c60d43ad04ae7e131a), [`9864d4c`](https://github.com/tach-UI/tachUI/commit/9864d4cab381e92abfc365f7749b9608636e4bb5), [`b30f4a3`](https://github.com/tach-UI/tachUI/commit/b30f4a3c80a816398ed644fe2f489c1ca532318b), [`a2e553b`](https://github.com/tach-UI/tachUI/commit/a2e553b39c649240e5f361c6d925394ccba17d2b), [`0c10b49`](https://github.com/tach-UI/tachUI/commit/0c10b4945aefaf290a2779fa44c0a12ff2fc0d8a), [`eabe555`](https://github.com/tach-UI/tachUI/commit/eabe55501766e5da320e42e65420dbd64e71e616), [`1c3099d`](https://github.com/tach-UI/tachUI/commit/1c3099d059b03af704ed91ead50079bc36e92007), [`b2335fe`](https://github.com/tach-UI/tachUI/commit/b2335fe0c43a9704b6544af48a54071529d2f441), [`eabe555`](https://github.com/tach-UI/tachUI/commit/eabe55501766e5da320e42e65420dbd64e71e616)]:
  - @tachui/core@0.11.0
  - @tachui/ssr@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [[`11a792d`](https://github.com/tach-UI/tachUI/commit/11a792db9d51db5182bc7877f5a8719c15fae11f), [`d5cd030`](https://github.com/tach-UI/tachUI/commit/d5cd030464dee0be84b8a2c6013fed716e53f551), [`0da0398`](https://github.com/tach-UI/tachUI/commit/0da03983bd74252a0ad917e7443b52781980b0bb), [`746b2be`](https://github.com/tach-UI/tachUI/commit/746b2bed20d71335f04e47097b135196d9f2caad), [`1fe6910`](https://github.com/tach-UI/tachUI/commit/1fe69104fadafa3663163b2d749e963b84620427), [`5cd2e02`](https://github.com/tach-UI/tachUI/commit/5cd2e0236f0336bf86d71744cb4b557145462c5d), [`327e8de`](https://github.com/tach-UI/tachUI/commit/327e8dea132e3a2f26d6afa724cc130b323413fa), [`7245d29`](https://github.com/tach-UI/tachUI/commit/7245d29aaf569483c16ff9d51788fb4815895caf), [`df5c539`](https://github.com/tach-UI/tachUI/commit/df5c5390072163b73ef16509f569b517ce916ea4), [`985a84b`](https://github.com/tach-UI/tachUI/commit/985a84b800dab2413ca563bac943f9ca3efc41db), [`603a6f7`](https://github.com/tach-UI/tachUI/commit/603a6f720c43b69c9bfb72cea14f9aafca9eab01), [`2984b3c`](https://github.com/tach-UI/tachUI/commit/2984b3ccd461f7126acc9286f145d322d190373e)]:
  - @tachui/core@0.10.0
  - @tachui/ssr@0.10.0

## 0.8.33

### Patch Changes

- Updated dependencies [[`9ae49e0`](https://github.com/tach-UI/tachUI/commit/9ae49e04ebeaf6d5363d1f5cb85230010f9905c2), [`9ae49e0`](https://github.com/tach-UI/tachUI/commit/9ae49e04ebeaf6d5363d1f5cb85230010f9905c2)]:
  - @tachui/core@0.8.32
  - @tachui/ssr@0.8.33

## 0.8.32

### Patch Changes

- Updated dependencies [[`fae8633`](https://github.com/tach-UI/tachUI/commit/fae86338af75e0cfcc37f9f74b494a11092b29a2), [`fae8633`](https://github.com/tach-UI/tachUI/commit/fae86338af75e0cfcc37f9f74b494a11092b29a2)]:
  - @tachui/core@0.8.31
  - @tachui/ssr@0.8.32

## 0.8.31

### Patch Changes

- Updated dependencies [[`de58dac`](https://github.com/tach-UI/tachUI/commit/de58dac18bc26c1d1c0a3cc15472e3d2cde92bf7), [`4a8d3a8`](https://github.com/tach-UI/tachUI/commit/4a8d3a8aa5293ddd5e4698c0cfe21a52327fe972)]:
  - @tachui/core@0.8.30
  - @tachui/ssr@0.8.31

## 0.8.30

### Patch Changes

- Updated dependencies [[`1022bb4`](https://github.com/tach-UI/tachUI/commit/1022bb436ff32c6046e41ad1d9c650bed6092b5a)]:
  - @tachui/ssr@0.8.30

## 0.8.29

### Patch Changes

- Updated dependencies [[`6a45ba3`](https://github.com/tach-UI/tachUI/commit/6a45ba3e75bbde9f0fa6e2636f5a6e7d7e7a2019)]:
  - @tachui/core@0.8.29
  - @tachui/ssr@0.8.29

## 0.8.28

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
  - @tachui/ssr@0.8.28

## 0.8.27

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
  - @tachui/ssr@0.8.27

## 0.8.26

### Patch Changes

- [#197](https://github.com/tach-UI/tachUI/pull/197) [`ea92165`](https://github.com/tach-UI/tachUI/commit/ea921651953ac5edaefe410ac7c08730634f869f) Thanks [@whoughton](https://github.com/whoughton)! - Add fragments architecture, SSR head collection, and deterministic component IDs.

  ## `@tachui/core`

  - Add `withSSRAssetHeadCollector` / `getSSRAssetHeadCollector` for threading link/style/meta contributions from asset resolution through synchronous SSR render passes
  - Add deterministic structural component IDs (`createDeterministicComponentId`, `beginRenderPass`, `allocateChildIndex`) for stable `data-component-id` values across repeated renders
  - Export `getCurrentComponentContextOrNull` for context-optional reads
  - Prevent internal renderer metadata (`componentMetadata`, `debugLabel`) from leaking into DOM attribute output via `sanitizeDOMProps`
  - Add `collectStaticAnimationCSSRules` shared helper to eliminate divergence across `AnimationModifier` variants

  ## `@tachui/types`

  - Add `FragmentMarker` interface (`componentId`, `componentName`, `snapshotData`)
  - Add `__tachui_fragment?: FragmentMarker` to `DOMNode` as the well-known marker key for the fragments architecture

  ## `@tachui/ssr`

  - Add `SSRContext` type (`links`, `styles`, `meta`) and `createSSRContext()` factory for collecting `<head>` contributions during render
  - Add `serializeToHTMLWithContext()` entry point that threads context and `interactive` flag through serialization
  - Add `head-sanitizer` module (`sanitizeHeadEntry`, `buildHeadEntries`) with injection-safe filtering of head entries; shared by SSR prerender and fragments prerender
  - Add `getStaticCSS` modifier protocol support in serializer: collects pseudo-class, `@keyframes`, and `@media` rules from modifiers that implement `getStaticCSS(selector)`
  - Add fragment serialization: detect `__tachui_fragment` markers on element nodes, wrap output in `<tachui-fragment data-component data-component-id [data-state]>` when `interactive` is true (default), omit wrapper when `interactive: false`; `onFragment` callback fires in both modes for manifest collection
  - Add `RenderToStringOptions.interactive` to control fragment wrapper emission
  - Fix: omit `debugLabel` from serialized HTML attributes

  ## `@tachui/modifiers`

  - Fix `active()` and `focus()` modifier factory functions — previously both emitted `:hover` CSS rules; now correctly emit `:active` and `:focus` respectively via new `pseudoClass` property on `HoverModifier`
  - Add `HoverModifier.getStaticCSS(selector)` for SSR static pseudo-class rule extraction (no `!important` in static output)

  ## `@tachui/responsive`

  - Add `ResponsiveModifier.getStaticCSS(selector)` for SSR static `@media` rule extraction

  ## `@tachui/fragments` (new package)

  Initial release of the fragments architecture for selective hydration.

  - `.interactive()` modifier — marks a component's root node as a hydration boundary via `__tachui_fragment`
  - `.snapshot({ get, restore })` modifier — opt-in state capture; `get()` called at prerender to produce `data-state`, `restore(snap)` called at hydration before first render
  - `Interactive({ children, componentName? })` wrapper component — escape hatch for raw DOM nodes that cannot use `.interactive()` directly
  - `configureFragments({ onHydrationError })` — global hydration error handler; defaults to `console.error`; static HTML snapshot always retained regardless of error
  - `prerender(routes, options)` — fragment-aware static generation; emits per-route HTML files with manifest script and runtime script tag when `interactive: true` (default); strips wrappers when `interactive: false`
  - `registerFragment(name, factory)` / `hydrateFragments()` — client-side runtime; defers to `DOMContentLoaded`, resolves fragments via manifest, calls `restore()` if snapshot present, falls back to static HTML on error

- Updated dependencies [[`ea92165`](https://github.com/tach-UI/tachUI/commit/ea921651953ac5edaefe410ac7c08730634f869f)]:
  - @tachui/core@0.8.26
  - @tachui/ssr@0.8.26
