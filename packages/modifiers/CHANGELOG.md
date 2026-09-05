# @tachui/modifiers

## 0.10.1

### Patch Changes

- Updated dependencies [[`a6d0668`](https://github.com/tach-UI/tachUI/commit/a6d06680e3212b5e5dfe11c60d43ad04ae7e131a)]:
  - @tachui/core@0.10.1
  - @tachui/registry@0.10.1
  - @tachui/types@0.10.1

## 0.10.0

### Patch Changes

- [#327](https://github.com/tach-UI/tachUI/pull/327) [`11a792d`](https://github.com/tach-UI/tachUI/commit/11a792db9d51db5182bc7877f5a8719c15fae11f) Thanks [@whoughton](https://github.com/whoughton)! - Name animation keyframes from their content, so they stop accumulating and SSR agrees with the client.

  `AnimationModifier` derived its `@keyframes` name from `componentId` and `Date.now()`, which minted a fresh name on every apply. Because `addKeyframesToStylesheet` appended to the shared `<style id="tachui-animations">` without deduping or cleanup, every re-render of an animated component left another block behind — five renders of one component produced five blocks — and the element moved to the newest name, so the earlier blocks were dead weight the browser still parsed. Nothing removed them on unmount.

  The same scheme also made the prerendered CSS unusable: `getStaticCSS` named from the selector while `apply` named from the clock, so the server's `@keyframes` was always orphaned and the client always re-injected its own.

  Names are now a hash of the keyframes' own content, via the new `createAnimationKeyframeRule` and `ensureAnimationKeyframes` exports on `@tachui/core/modifiers/base`. Identical keyframes resolve to one name and one block across renders, across components, and across server and client. Duration, easing, iteration count and direction are excluded from the hash — they belong to the element's `animation` shorthand rather than the keyframes block — so components sharing a keyframes object at different speeds share one block. The set of injected names is tracked on the stylesheet element under a registered symbol, so it is discarded exactly when the element is and is shared by all three `AnimationModifier` copies (`@tachui/core` plus both `@tachui/modifiers` builds) that write to it.

  Because content hashing makes a name a reliable statement about a block's contents, the client now also adopts animation keyframes it finds already in the document rather than duplicating them. `@tachui/ssr` emits each static rule in its own anonymous `<style>` rather than into `#tachui-animations`, so prerendered blocks were still being re-injected on hydration even once the names agreed.

  **Breaking for deep importers of `@tachui/core/modifiers/base`**, which is a published subpath export and so reaches beyond this repo: `collectStaticAnimationCSSRules` no longer takes a `createKeyframeRule` callback, deriving the name itself. Emitted keyframe names also change shape, from `tachui-animation-<componentId>-<timestamp>` and `tachui-animation-<selector>` to `tachui-animation-<hash>`. Nothing should depend on the old spelling — the client's was unpredictable by construction — but anything asserting on a literal keyframe name needs updating.

- [#325](https://github.com/tach-UI/tachUI/pull/325) [`7245d29`](https://github.com/tach-UI/tachUI/commit/7245d29aaf569483c16ff9d51788fb4815895caf) Thanks [@whoughton](https://github.com/whoughton)! - Add a gradient `interpolation` option and emit an sRGB fallback pair for it.

  `GradientColors` gains `interpolation?: 'srgb' | 'oklab' | 'oklch'`, emitted as an `in <space>` hint (`linear-gradient(in oklab to right, …)`). A browser that cannot parse the hint drops the whole declaration and the element gets no background at all, so anything other than `'srgb'` is written as a pair: the plain sRGB gradient first, the hinted one second. CSSOM rejects a value it cannot parse as a no-op, so the browser keeps whichever it understood.

  - `gradientToDeclarations(def)` returns that pair (length 1 for `'srgb'`); `gradientToCSS` keeps returning the single preferred string.
  - `GradientAsset`, `StateGradientAsset` and `ReactiveGradientAsset` gain `resolveDeclarations()`; `resolve()` is unchanged. The reactive option types accept `interpolation` too.
  - The background modifier writes every declaration in order at all three of its paths (static value, theme-reactive asset, stateful hover/active/focus/disabled), preferring `resolveDeclarations()` on an asset when present.
  - The SSR style shim appends repeated writes to a property instead of overwriting, and the serializer emits one entry per write, so `renderToString` output carries the same pair in one `style` attribute. A property genuinely overridden by a later modifier now emits both values; the cascade keeps the last, as it does on the client. A write whose `!important` priority differs from the stored value still overwrites, matching `setProperty`, so an inline `red !important` followed by a normal gradient renders the gradient on both server and client.
  - `CSSUtils.withFallback` emits the solid color, then the sRGB gradient, then the hinted one. `CSSUtils.toCustomProperties` always emits the sRGB form: a custom property cannot carry the pair, because an unsupported gradient only fails at `var()` substitution, where the using declaration becomes `unset` rather than falling back. It warns in development when the gradient explicitly asked for a non-sRGB interpolation.
  - A stateful background (`{ default, hover, … }`) rendered where there is no DOM element to attach listeners to, such as `renderToString`, now emits its resting `default` state. Previously the modifier threw a `ReferenceError` on the bare `HTMLElement` check under Node.

  The default interpolation is unchanged in this release step.

- [#316](https://github.com/tach-UI/tachUI/pull/316) [`850d557`](https://github.com/tach-UI/tachUI/commit/850d557b19c763c296f9457e4401b0c4b822cc68) Thanks [@whoughton](https://github.com/whoughton)! - Render `overlay()` content instead of an empty container (#302).

  `overlay()` built its absolutely-positioned container, positioned it correctly, and then rendered nothing inside it. Every content form was dropped: a plain string, a `ComponentInstance`, a `.build()`-ed component, and a content closure all produced `<div style="position: absolute; ...">` with no children.

  The cause was `renderContent` reading `component.render().element`. A component's `render()` returns DOMNode _descriptions_; `element` is populated by the renderer when the node is mounted, so it is always `undefined` on a freshly rendered node. Strings were never handled at all. Content now goes through `renderComponent`, which materializes the nodes, builds an unbuilt modifier chain, and keeps the content reactive.

  ```typescript
  Text("base").overlay(Text("D"), "bottomTrailing");
  // before: <div style="position: absolute; bottom: 0px; right: 0px;"></div>
  // after:  <div style="position: absolute; bottom: 0px; right: 0px;"><span>D</span></div>
  ```

  Accepted content, matching SwiftUI's `.overlay(alignment:content:)`:

  - a `ComponentInstance`, built or not
  - a content closure, `() => Text('D')`
  - a `string` or `number`, rendered as text
  - a `Signal<string | number>`, rendered as reactive text
  - a DOM `Element`

  `OverlayOptions['content']` and the `overlay()` parameter were typed `any`; they are now `OverlayContent`, so an unsupported form is a compile error rather than a silent empty overlay.

  `apply()` now returns a `ModifierResult` carrying cleanup. The positioning effect was previously created and never disposed, and the overlay container was never removed; both are now torn down with the modifier.

  Overlays are also reconciled per render pass. `renderSingle` applies modifiers on every render of a node, not only when the element is created, so a base component that re-renders drives `apply()` again on the same element — and the pipeline's cleanup does not run until unmount. Each pass therefore appended another container and left the previous one behind. That accumulation predates this change, but was invisible while the containers were empty; now that they hold content it would have shown as duplicate, stale layers.

  Bookkeeping is owned by the element rather than the modifier, because a component that builds its chain inline — `Text(label()).overlay(badge)` inside a parent's render — produces a fresh modifier instance on every pass while the renderer reuses the element. A pass boundary is detected from the `ModifierContext` identity, which `applyModifiersToNode` creates once per element render and shares across that pass's modifiers. Entering a new pass disposes what the previous one mounted; the modifiers still in the chain re-mount.

  A pass in which _no_ overlay modifier runs — the last overlay leaving the chain — cannot be seen that way, since the reconciliation is only ever driven from `apply()`. Modifiers are applied inside the render effect's body, so each mount also registers an execution-scoped cleanup (#270), which runs just before that effect's next execution whether or not an overlay applies on it. Outside a computation this degrades to owner-scoped and then to a no-op, and the pass reconciliation covers those paths; both routes end at the same idempotent disposer.

  Cleanup is handed back once per element rather than once per apply. The pipeline chains every returned cleanup onto `node.dispose` and pushes it onto the element's cleanup list without dropping the previous one, so a long-lived reactive overlay would otherwise accumulate stale teardowns and replay them all at unmount.

  `@tachui/core/runtime` was added to the package's Rollup externals. Without it the renderer was inlined into the modifiers bundle, which would have given the package its own `globalRenderer` separate from the app's.

- Updated dependencies [[`11a792d`](https://github.com/tach-UI/tachUI/commit/11a792db9d51db5182bc7877f5a8719c15fae11f), [`d5cd030`](https://github.com/tach-UI/tachUI/commit/d5cd030464dee0be84b8a2c6013fed716e53f551), [`0da0398`](https://github.com/tach-UI/tachUI/commit/0da03983bd74252a0ad917e7443b52781980b0bb), [`746b2be`](https://github.com/tach-UI/tachUI/commit/746b2bed20d71335f04e47097b135196d9f2caad), [`1fe6910`](https://github.com/tach-UI/tachUI/commit/1fe69104fadafa3663163b2d749e963b84620427), [`5cd2e02`](https://github.com/tach-UI/tachUI/commit/5cd2e0236f0336bf86d71744cb4b557145462c5d), [`327e8de`](https://github.com/tach-UI/tachUI/commit/327e8dea132e3a2f26d6afa724cc130b323413fa), [`7245d29`](https://github.com/tach-UI/tachUI/commit/7245d29aaf569483c16ff9d51788fb4815895caf), [`df5c539`](https://github.com/tach-UI/tachUI/commit/df5c5390072163b73ef16509f569b517ce916ea4), [`985a84b`](https://github.com/tach-UI/tachUI/commit/985a84b800dab2413ca563bac943f9ca3efc41db), [`2984b3c`](https://github.com/tach-UI/tachUI/commit/2984b3ccd461f7126acc9286f145d322d190373e)]:
  - @tachui/core@0.10.0
  - @tachui/types@0.10.0
  - @tachui/registry@0.10.0

## 0.8.33

### Patch Changes

- [#299](https://github.com/tach-UI/tachUI/pull/299) [`9ae49e0`](https://github.com/tach-UI/tachUI/commit/9ae49e04ebeaf6d5363d1f5cb85230010f9905c2) Thanks [@whoughton](https://github.com/whoughton)! - Remove `.transitions()`, which never did anything (#297).

  It was chainable, declared in the modifier types, and registered in the modifier registry — so calls resolved without error — but `AnimationModifier.apply` never read `props.transitions`. `Text('x').transitions({ opacity: { duration: 500 } })` left `element.style.transition` empty while the singular `.transition('opacity', 500, 'ease-in')` produced `opacity 500ms ease-in 0ms` on the same render.

  Removing it turns a silent no-op into a compile error. No capability is lost: `.transition()` is the working API and there was never a defined shape for `.transitions()`'s config, which was typed `any`. If a multi-property form is wanted it should be designed and implemented, not inherited from a placeholder.

- Updated dependencies [[`9ae49e0`](https://github.com/tach-UI/tachUI/commit/9ae49e04ebeaf6d5363d1f5cb85230010f9905c2), [`9ae49e0`](https://github.com/tach-UI/tachUI/commit/9ae49e04ebeaf6d5363d1f5cb85230010f9905c2)]:
  - @tachui/core@0.8.32
  - @tachui/types@0.8.32
  - @tachui/registry@0.8.32

## 0.8.32

### Patch Changes

- [#263](https://github.com/tach-UI/tachUI/pull/263) [`fae8633`](https://github.com/tach-UI/tachUI/commit/fae86338af75e0cfcc37f9f74b494a11092b29a2) Thanks [@whoughton](https://github.com/whoughton)! - Fix modifier registration being tree-shaken out of consumer bundles (#260).

  Importing `@tachui/modifiers/preload/basic` — the documented way to register the basic modifiers — had no effect in any production build. Every modifier call then threw `Modifier 'fontSize' not found in registry`, while the same code worked unbundled.

  `registerBasicModifiers()` runs at module scope in `src/basic/index.ts`, but the build forces that module into a hashed `modifiers-basic-<hash>` chunk which matches none of the package's `sideEffects` globs. Rollup treated the chunk as side-effect-free and dropped the call, leaving `dist/preload/basic.js` as a pure re-export that registered nothing.

  `preload/basic` and `preload/effects` now call their registration functions directly, matching `preload/filters`, `shadows`, `transforms` and `backdrop`, which already did this and were never affected. `registerEffectModifiers()` is newly exported from `@tachui/modifiers/effects` for that purpose.

  Segmentation is unchanged: a basic-only import still pulls in no effects code.

  The tree-shaking verifier now also builds fixtures against the published `dist`. Its existing fixtures import from `src`, where the preload entries _are_ covered by `sideEffects` — which is why this never showed up in CI.

- Updated dependencies [[`fae8633`](https://github.com/tach-UI/tachUI/commit/fae86338af75e0cfcc37f9f74b494a11092b29a2), [`fae8633`](https://github.com/tach-UI/tachUI/commit/fae86338af75e0cfcc37f9f74b494a11092b29a2)]:
  - @tachui/core@0.8.31
  - @tachui/types@0.8.31
  - @tachui/registry@0.8.31

## 0.8.31

### Patch Changes

- Updated dependencies [[`de58dac`](https://github.com/tach-UI/tachUI/commit/de58dac18bc26c1d1c0a3cc15472e3d2cde92bf7), [`4a8d3a8`](https://github.com/tach-UI/tachUI/commit/4a8d3a8aa5293ddd5e4698c0cfe21a52327fe972)]:
  - @tachui/core@0.8.30
  - @tachui/types@0.8.30
  - @tachui/registry@0.8.30

## 0.8.30

### Patch Changes

- Updated dependencies [[`6a45ba3`](https://github.com/tach-UI/tachUI/commit/6a45ba3e75bbde9f0fa6e2636f5a6e7d7e7a2019)]:
  - @tachui/core@0.8.29
  - @tachui/types@0.8.29
  - @tachui/registry@0.8.29

## 0.8.29

### Patch Changes

- [#241](https://github.com/tach-UI/tachUI/pull/241) [`547c82e`](https://github.com/tach-UI/tachUI/commit/547c82e61e9f92da31b0cdceece66fe65da7283a) Thanks [@whoughton](https://github.com/whoughton)! - Fix interaction modifier listener leaks (#216): `onHover`, `onContinuousHover`, `onLongPressGesture`, and `InteractionModifier` (`.onTap()`, `.onHover()`, gestures, keyboard, scroll, etc.) now return a `ModifierResult` whose `cleanup` removes every registered DOM event listener — including document-level keyboard shortcut listeners — when the component unmounts. The modifier registry (`applyModifiersSequential`, batch path, and `combineModifiers`) now harvests `ModifierResult` returns and chains their cleanup onto `node.dispose`, which the renderer already drains on teardown. Listener teardown is double-dispose safe.

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
  - @tachui/registry@0.8.28
  - @tachui/types@0.8.28

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
  - @tachui/registry@0.8.27
  - @tachui/types@0.8.27

## 0.8.27

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
  - @tachui/types@0.8.26
  - @tachui/registry@0.8.26

## 0.8.26

### Patch Changes

- [#190](https://github.com/tach-UI/tachUI/pull/190) [`ee3b6ed`](https://github.com/tach-UI/tachUI/commit/ee3b6ed44ca0262a4efe4567e67a52e2e2bd7534) Thanks [@whoughton](https://github.com/whoughton)! - Fix preload registration reliability for segmented modifier imports by hardening side-effect handling against production tree-shaking.

  This updates preload registration behavior for basic/effects and segmented effects preloads (filters, shadows, transforms, backdrop), expands sideEffects coverage for source and dist entrypoints, and adds regression verification/tests so chain methods like `transformStyle` remain available in production bundles.

## 0.8.25

### Patch Changes

- [#184](https://github.com/tach-UI/tachUI/pull/184) [`2e43673`](https://github.com/tach-UI/tachUI/commit/2e43673d98067daf54af8b7a7f31cc125a53ab34) Thanks [@whoughton](https://github.com/whoughton)! - Fix SSR modifier application in Node environments by guarding browser-only globals and preserving style serialization output.

  - guard modifier paths that previously accessed `HTMLElement`, `document`, `window`, or `getComputedStyle` without runtime checks
  - harden modifier factory/runtime code paths used during server-side rendering
  - ensure SSR style materialization captures direct style assignments in addition to `setProperty`
  - add and fix SSR test aliasing and regression coverage for animation/transform/z-index serialization

- Updated dependencies [[`2e43673`](https://github.com/tach-UI/tachUI/commit/2e43673d98067daf54af8b7a7f31cc125a53ab34)]:
  - @tachui/core@0.8.25
  - @tachui/types@0.8.25
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
  - @tachui/registry@0.8.24
  - @tachui/types@0.8.24

## 0.8.23

### Patch Changes

- [#173](https://github.com/tach-UI/tachUI/pull/173) [`97ad059`](https://github.com/tach-UI/tachUI/commit/97ad059fd80122b84f938aeba5847b7984bacc5f) Thanks [@whoughton](https://github.com/whoughton)! - Fix SSR serialization recursion for component inputs that also expose `build()` by prioritizing component render dispatch and guarding against cyclic builder chains.

  Improve asset typing ergonomics by adding declaration-merging support for custom `Assets` keys via `CustomAssets`.

  Add `.compositingGroup()` modifier mapped to `isolation: isolate`, with non-colliding priority so isolation is applied before blend-mode modifiers.

  Make `FontAsset` loading SSR-safe by no-oping DOM-dependent load paths when `document`/`window` are unavailable (prevents eager Google font crashes during prerender).

- Updated dependencies [[`97ad059`](https://github.com/tach-UI/tachUI/commit/97ad059fd80122b84f938aeba5847b7984bacc5f)]:
  - @tachui/core@0.8.23
  - @tachui/types@0.8.23
  - @tachui/registry@0.8.23

## 0.8.22

### Patch Changes

- [#170](https://github.com/tach-UI/tachUI/pull/170) [`6fc0c1c`](https://github.com/tach-UI/tachUI/commit/6fc0c1cd732eb0a18a7886cb1666833542a0abc5) Thanks [@whoughton](https://github.com/whoughton)! - Fix SSR serialization recursion for component inputs that also expose a `build()` method by prioritizing component rendering and adding cyclic builder-chain detection. Adds regression coverage for mixed component/builder inputs and cyclic builder cases.

  Also add declaration-merging support for custom asset names via `CustomAssets` so consumers can strongly type known runtime-registered keys (for example declaring `sand: ColorAssetProxy` and then calling `Assets.sand.opacity(...)` with full type safety).

  Add a new `.compositingGroup()` modifier that maps to CSS `isolation: isolate`, including modifier registry wiring, blend-mode integration coverage, and an explicit non-colliding priority (`91`) so isolation is applied before blend-mode modifiers.

- Updated dependencies [[`6fc0c1c`](https://github.com/tach-UI/tachUI/commit/6fc0c1cd732eb0a18a7886cb1666833542a0abc5)]:
  - @tachui/types@0.8.22
  - @tachui/core@0.8.22
  - @tachui/registry@0.8.22

## 0.8.21

### Patch Changes

- [#163](https://github.com/tach-UI/tachUI/pull/163) [`711187b`](https://github.com/tach-UI/tachUI/commit/711187b7efa5820f05d6b8bcb396147e90b83d9d) Thanks [@whoughton](https://github.com/whoughton)! - Fixes sheet background scroll locking behavior with an explicit opt-out, resolves dynamic asset typing ergonomics for custom color assets, and adds new background/blend appearance modifier capabilities with follow-up type/export improvements.

- Updated dependencies [[`711187b`](https://github.com/tach-UI/tachUI/commit/711187b7efa5820f05d6b8bcb396147e90b83d9d)]:
  - @tachui/core@0.8.21
  - @tachui/types@0.8.21
  - @tachui/registry@0.8.21

## 0.8.20

### Patch Changes

- Updated dependencies [[`859a15a`](https://github.com/tach-UI/tachUI/commit/859a15a245cbde879a6dba2f74568d8881d74a4c)]:
  - @tachui/core@0.8.20
  - @tachui/types@0.8.20
  - @tachui/registry@0.8.20

## 0.8.19

### Patch Changes

- [#148](https://github.com/tach-UI/tachUI/pull/148) [`b2f2522`](https://github.com/tach-UI/tachUI/commit/b2f25224d7d33e249653f90a94091287c3506f47) Thanks [@whoughton](https://github.com/whoughton)! - Ship current ready work on this branch:

  - add the new `@tachui/ssr` package with `renderToString` and `prerender`
  - resolve SSR review findings around attribute serialization, route metadata, and test coverage
  - improve release dependency guard validation with semver-accurate peer range checks plus tools test coverage
  - include current navigation, data, and modifier/type fixes from linked issue work
  - add navigation modal enhancements: `confirmationDialog(...)` and environment `dismiss` support for sheet/full-screen/popover presentations

- Updated dependencies [[`b2f2522`](https://github.com/tach-UI/tachUI/commit/b2f25224d7d33e249653f90a94091287c3506f47)]:
  - @tachui/core@0.8.19
  - @tachui/types@0.8.19
  - @tachui/registry@0.8.19

## 0.8.18

### Patch Changes

- [#145](https://github.com/tach-UI/tachUI/pull/145) [`b3ca77c`](https://github.com/tach-UI/tachUI/commit/b3ca77c89cfcf75994f32ca7c2245bf579f71a82) Thanks [@whoughton](https://github.com/whoughton)! - Patch release for recent bug fixes and typing/reactivity improvements:

  - Fix transform modifier composition/reactive update behavior and add stronger regression coverage.
  - Harden responsive breakpoint reactivity test support and singleton reset behavior.
  - Fix `Spacer()` typing so direct modifier chains (for example `.maxHeight()`) are available.
  - Apply core SVG sanitization lint fix and include related renderer/runtime refinements.

- Updated dependencies [[`b3ca77c`](https://github.com/tach-UI/tachUI/commit/b3ca77c89cfcf75994f32ca7c2245bf579f71a82)]:
  - @tachui/core@0.8.18
  - @tachui/types@0.8.18
  - @tachui/registry@0.8.18

## 0.8.17

### Patch Changes

- Updated dependencies [[`e982ab2`](https://github.com/tach-UI/tachUI/commit/e982ab26f9012c610b9cb0bff78840dc26771d40)]:
  - @tachui/core@0.8.17
  - @tachui/types@0.8.17
  - @tachui/registry@0.8.17

## 0.8.16

### Patch Changes

- [#136](https://github.com/tach-UI/tachUI/pull/136) [`a8a1103`](https://github.com/tach-UI/tachUI/commit/a8a1103ebe68d7052f95995db5d1b3dc89bb3b49) Thanks [@whoughton](https://github.com/whoughton)! - Fix reactive update consistency across modifiers, primitives, forms, navigation, and viewport, and add deterministic test coverage for review feedback items.

- Updated dependencies [[`a8a1103`](https://github.com/tach-UI/tachUI/commit/a8a1103ebe68d7052f95995db5d1b3dc89bb3b49)]:
  - @tachui/core@0.8.16
  - @tachui/types@0.8.16
  - @tachui/registry@0.8.16

## 0.8.15

### Patch Changes

- [#116](https://github.com/tach-UI/tachUI/pull/116) [`8afda39`](https://github.com/tach-UI/tachUI/commit/8afda390d9ced5da657318a78535c9fac8f22819) Thanks [@whoughton](https://github.com/whoughton)! - Correct the internal release line back to `0.8.x` and prevent cross-line drift in future releases.

  This fixes package metadata so internal `@tachui/*` dependencies and peer ranges no longer point at unpublished `0.9.0` or `1.0.0` artifacts, and adds release guards that fail CI when publishable packages diverge across release lines or packed manifests reference unpublished internal versions.

- Updated dependencies [[`8afda39`](https://github.com/tach-UI/tachUI/commit/8afda390d9ced5da657318a78535c9fac8f22819)]:
  - @tachui/core@0.8.15
  - @tachui/types@0.8.15
  - @tachui/registry@0.8.15

## 0.8.14

### Patch Changes

- [#112](https://github.com/tach-UI/tachUI/pull/112) [`8f5eeaa`](https://github.com/tach-UI/tachUI/commit/8f5eeaaa513e0ea581212599b2c115b149de71a8) Thanks [@whoughton](https://github.com/whoughton)! - Fix `backgroundColor(ColorAsset)` theme reactivity so background colors update when the active theme changes, matching `foregroundColor` behavior.

  Also adds regression test coverage for this asset path and preserves stateful background option routing.

- Updated dependencies [[`8f5eeaa`](https://github.com/tach-UI/tachUI/commit/8f5eeaaa513e0ea581212599b2c115b149de71a8)]:
  - @tachui/core@0.9.0
  - @tachui/types@0.9.0
  - @tachui/registry@0.9.0

## 0.8.13

### Patch Changes

- [#109](https://github.com/tach-UI/tachUI/pull/109) [`e02aee1`](https://github.com/tach-UI/tachUI/commit/e02aee14d816b6ccd78684528fdf4ce95e47714a) Thanks [@whoughton](https://github.com/whoughton)! - Release patch versions across all publishable TachUI packages to recover from broken cross-version dependency metadata and restore a coherent single-runtime install graph.

- Updated dependencies [[`e02aee1`](https://github.com/tach-UI/tachUI/commit/e02aee14d816b6ccd78684528fdf4ce95e47714a)]:
  - @tachui/core@0.8.13
  - @tachui/registry@0.8.13
  - @tachui/types@0.8.13

## 0.8.12

### Patch Changes

- Updated dependencies [[`078b01e`](https://github.com/tach-UI/tachUI/commit/078b01e574325d6d3e5eb6d90b81c7fad2cf39cf)]:
  - @tachui/core@0.9.0
  - @tachui/types@0.9.0
  - @tachui/registry@0.9.0

## 0.8.10-alpha.0

### Patch Changes

- [#93](https://github.com/tach-UI/tachUI/pull/93) [`143c53c`](https://github.com/tach-UI/tachUI/commit/143c53c3c7e3c6e7a4eea1871d1c9f07c72d30b5) Thanks [@whoughton](https://github.com/whoughton)! - Start the 0.8.10-alpha prerelease train across all publishable @tachui packages.

- Updated dependencies [[`143c53c`](https://github.com/tach-UI/tachUI/commit/143c53c3c7e3c6e7a4eea1871d1c9f07c72d30b5)]:
  - @tachui/core@0.8.10-alpha.0
  - @tachui/registry@0.8.10-alpha.0
  - @tachui/types@0.8.10-alpha.0

## 0.8.9

### Patch Changes

- Updated dependencies [[`5d3fb03`](https://github.com/tach-UI/tachUI/commit/5d3fb03c5ec91e344c0625bab8c48a2ea5bcee34)]:
  - @tachui/core@0.8.9
  - @tachui/types@0.8.9
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
  - @tachui/registry@0.8.8
  - @tachui/types@0.8.8
