# @tachui/core

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
  - @tachui/types@0.8.26
  - @tachui/registry@0.8.26

## 0.8.25

### Patch Changes

- [#184](https://github.com/tach-UI/tachUI/pull/184) [`2e43673`](https://github.com/tach-UI/tachUI/commit/2e43673d98067daf54af8b7a7f31cc125a53ab34) Thanks [@whoughton](https://github.com/whoughton)! - Fix SSR modifier application in Node environments by guarding browser-only globals and preserving style serialization output.

  - guard modifier paths that previously accessed `HTMLElement`, `document`, `window`, or `getComputedStyle` without runtime checks
  - harden modifier factory/runtime code paths used during server-side rendering
  - ensure SSR style materialization captures direct style assignments in addition to `setProperty`
  - add and fix SSR test aliasing and regression coverage for animation/transform/z-index serialization

- Updated dependencies []:
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
  - @tachui/registry@0.8.24
  - @tachui/types@0.8.24

## Unreleased

### Migration Guidance

- Root `@tachui/core` is now runtime-safe and excludes compiler APIs.
- Import compiler/tooling APIs from `@tachui/core/compiler` (and build helpers from `@tachui/core/build-tools`) explicitly.
- `@tachui/core/full` is a temporary compatibility entrypoint and is planned for removal in `v1.0.0`.

## 0.8.23

### Patch Changes

- [#173](https://github.com/tach-UI/tachUI/pull/173) [`97ad059`](https://github.com/tach-UI/tachUI/commit/97ad059fd80122b84f938aeba5847b7984bacc5f) Thanks [@whoughton](https://github.com/whoughton)! - Fix SSR serialization recursion for component inputs that also expose `build()` by prioritizing component render dispatch and guarding against cyclic builder chains.

  Improve asset typing ergonomics by adding declaration-merging support for custom `Assets` keys via `CustomAssets`.

  Add `.compositingGroup()` modifier mapped to `isolation: isolate`, with non-colliding priority so isolation is applied before blend-mode modifiers.

  Make `FontAsset` loading SSR-safe by no-oping DOM-dependent load paths when `document`/`window` are unavailable (prevents eager Google font crashes during prerender).

- Updated dependencies [[`97ad059`](https://github.com/tach-UI/tachUI/commit/97ad059fd80122b84f938aeba5847b7984bacc5f)]:
  - @tachui/types@0.8.23
  - @tachui/registry@0.8.23

## 0.8.22

### Patch Changes

- Updated dependencies [[`6fc0c1c`](https://github.com/tach-UI/tachUI/commit/6fc0c1cd732eb0a18a7886cb1666833542a0abc5)]:
  - @tachui/types@0.8.22
  - @tachui/registry@0.8.22

## 0.8.21

### Patch Changes

- [#163](https://github.com/tach-UI/tachUI/pull/163) [`711187b`](https://github.com/tach-UI/tachUI/commit/711187b7efa5820f05d6b8bcb396147e90b83d9d) Thanks [@whoughton](https://github.com/whoughton)! - Fixes sheet background scroll locking behavior with an explicit opt-out, resolves dynamic asset typing ergonomics for custom color assets, and adds new background/blend appearance modifier capabilities with follow-up type/export improvements.

- Updated dependencies [[`711187b`](https://github.com/tach-UI/tachUI/commit/711187b7efa5820f05d6b8bcb396147e90b83d9d)]:
  - @tachui/types@0.8.21
  - @tachui/registry@0.8.21

## 0.8.20

### Patch Changes

- [#159](https://github.com/tach-UI/tachUI/pull/159) [`859a15a`](https://github.com/tach-UI/tachUI/commit/859a15a245cbde879a6dba2f74568d8881d74a4c) Thanks [@whoughton](https://github.com/whoughton)! - Fix and enhance navigation and asset behavior across the branch scope:

  - add directional sheet edge/size support (`top|bottom|left|right`, axis-aware sizing and drag)
  - add swipe-back gesture support and spring transition improvements in navigation
  - add tab badge support and fix badge reactivity/overlay behavior
  - add `.inspector()` support and dismissal correctness updates
  - fix navigation ComponentInstance compatibility issues and related modal mounting behavior
  - improve typed asset registration and make ColorAsset transforms chainable/theme-adaptive

- Updated dependencies [[`859a15a`](https://github.com/tach-UI/tachUI/commit/859a15a245cbde879a6dba2f74568d8881d74a4c)]:
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
  - @tachui/types@0.8.19
  - @tachui/registry@0.8.19

## 0.8.18

### Patch Changes

- [#145](https://github.com/tach-UI/tachUI/pull/145) [`b3ca77c`](https://github.com/tach-UI/tachUI/commit/b3ca77c89cfcf75994f32ca7c2245bf579f71a82) Thanks [@whoughton](https://github.com/whoughton)! - Patch release for recent bug fixes and typing/reactivity improvements:

  - Fix transform modifier composition/reactive update behavior and add stronger regression coverage.
  - Harden responsive breakpoint reactivity test support and singleton reset behavior.
  - Fix `Spacer()` typing so direct modifier chains (for example `.maxHeight()`) are available.
  - Apply core SVG sanitization lint fix and include related renderer/runtime refinements.

- Updated dependencies []:
  - @tachui/types@0.8.18
  - @tachui/registry@0.8.18

## 0.8.17

### Patch Changes

- [#138](https://github.com/tach-UI/tachUI/pull/138) [`e982ab2`](https://github.com/tach-UI/tachUI/commit/e982ab26f9012c610b9cb0bff78840dc26771d40) Thanks [@whoughton](https://github.com/whoughton)! - Add template SVG rendering mode to `Image` with secure inline SVG sanitization, reactive themed source updates, and accessibility parity for template-rendered images.

- Updated dependencies []:
  - @tachui/types@0.8.17
  - @tachui/registry@0.8.17

## 0.8.16

### Patch Changes

- [#136](https://github.com/tach-UI/tachUI/pull/136) [`a8a1103`](https://github.com/tach-UI/tachUI/commit/a8a1103ebe68d7052f95995db5d1b3dc89bb3b49) Thanks [@whoughton](https://github.com/whoughton)! - Fix reactive update consistency across modifiers, primitives, forms, navigation, and viewport, and add deterministic test coverage for review feedback items.

- Updated dependencies []:
  - @tachui/types@0.8.16
  - @tachui/registry@0.8.16

## 0.8.15

### Patch Changes

- [#116](https://github.com/tach-UI/tachUI/pull/116) [`8afda39`](https://github.com/tach-UI/tachUI/commit/8afda390d9ced5da657318a78535c9fac8f22819) Thanks [@whoughton](https://github.com/whoughton)! - Correct the internal release line back to `0.8.x` and prevent cross-line drift in future releases.

  This fixes package metadata so internal `@tachui/*` dependencies and peer ranges no longer point at unpublished `0.9.0` or `1.0.0` artifacts, and adds release guards that fail CI when publishable packages diverge across release lines or packed manifests reference unpublished internal versions.

- Updated dependencies [[`8afda39`](https://github.com/tach-UI/tachUI/commit/8afda390d9ced5da657318a78535c9fac8f22819)]:
  - @tachui/types@0.8.15
  - @tachui/registry@0.8.15

## 0.9.0

### Minor Changes

- [#112](https://github.com/tach-UI/tachUI/pull/112) [`8f5eeaa`](https://github.com/tach-UI/tachUI/commit/8f5eeaaa513e0ea581212599b2c115b149de71a8) Thanks [@whoughton](https://github.com/whoughton)! - Update `ZStack` to use content sizing by default so one child remains in normal document flow, preventing sibling overlap in common section-layout usage.

  Add explicit `sizing` modes (`'content' | 'priority' | 'explicit'`) and `sizingChildIndex` for precise control.

### Patch Changes

- Updated dependencies []:
  - @tachui/types@0.9.0
  - @tachui/registry@0.9.0

## 0.8.13

### Patch Changes

- [#109](https://github.com/tach-UI/tachUI/pull/109) [`e02aee1`](https://github.com/tach-UI/tachUI/commit/e02aee14d816b6ccd78684528fdf4ce95e47714a) Thanks [@whoughton](https://github.com/whoughton)! - Release patch versions across all publishable TachUI packages to recover from broken cross-version dependency metadata and restore a coherent single-runtime install graph.

- Updated dependencies [[`e02aee1`](https://github.com/tach-UI/tachUI/commit/e02aee14d816b6ccd78684528fdf4ce95e47714a)]:
  - @tachui/registry@0.8.13
  - @tachui/types@0.8.13

## 0.9.0

### Minor Changes

- [#102](https://github.com/tach-UI/tachUI/pull/102) [`078b01e`](https://github.com/tach-UI/tachUI/commit/078b01e574325d6d3e5eb6d90b81c7fad2cf39cf) Thanks [@whoughton](https://github.com/whoughton)! - Ship color-asset transform APIs and scaffold updates.

  - Add `ColorAsset` transform helpers: `opacity`, `saturate`, `brighten`, `rotateHue`, and `contrast` with deterministic range semantics and expanded format handling.
  - Add variadic `registerAsset(...)` batch registration support and tighten overload typing.
  - Update `@tachui/types` asset proxy typing to include the new color transform methods.
  - Update `@tachui/cli` starter templates to current TachUI APIs (`mountRoot`, modifiers preload, and `@tachui/primitives` button usage) and include required template dependencies.
  - Expand tests and docs for transform behavior, output normalization, and edge-case handling.

### Patch Changes

- Updated dependencies [[`078b01e`](https://github.com/tach-UI/tachUI/commit/078b01e574325d6d3e5eb6d90b81c7fad2cf39cf)]:
  - @tachui/types@0.9.0
  - @tachui/registry@0.9.0

## 0.8.10-alpha.0

### Patch Changes

- [#93](https://github.com/tach-UI/tachUI/pull/93) [`143c53c`](https://github.com/tach-UI/tachUI/commit/143c53c3c7e3c6e7a4eea1871d1c9f07c72d30b5) Thanks [@whoughton](https://github.com/whoughton)! - Start the 0.8.10-alpha prerelease train across all publishable @tachui packages.

- Updated dependencies [[`143c53c`](https://github.com/tach-UI/tachUI/commit/143c53c3c7e3c6e7a4eea1871d1c9f07c72d30b5)]:
  - @tachui/registry@0.8.10-alpha.0
  - @tachui/types@0.8.10-alpha.0

## 0.8.9

### Patch Changes

- [#90](https://github.com/tach-UI/tachUI/pull/90) [`5d3fb03`](https://github.com/tach-UI/tachUI/commit/5d3fb03c5ec91e344c0625bab8c48a2ea5bcee34) Thanks [@whoughton](https://github.com/whoughton)! - Ship semantic/accessibility and metadata fixes across navigation, primitives, mobile, and core.

  - `@tachui/navigation`: make `NavigationLink` crawlable anchors with safer client-navigation interception; add per-view `DocumentHead` metadata APIs and runtime fixes for multi-stack behavior, cleanup, template warnings, and tests.
  - `@tachui/primitives`: add semantic heading support (`Heading`, `Text.H1..H6`), improve toggle label/input associations, and hide spacer from accessibility tree.
  - `@tachui/mobile`: improve `ActionSheet` dialog semantics/focus behavior and related test coverage.
  - `@tachui/core`: remove CommonJS-style runtime access in CSS class DOM integration and cover reactive class cleanup behavior.

- Updated dependencies []:
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
  - @tachui/registry@0.8.8
  - @tachui/types@0.8.8
