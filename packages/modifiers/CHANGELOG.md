# @tachui/modifiers

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
