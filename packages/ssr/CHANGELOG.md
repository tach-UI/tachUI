# @tachui/ssr

## 0.8.24

### Patch Changes

- [#181](https://github.com/tach-UI/tachUI/pull/181) [`1e6c1f4`](https://github.com/tach-UI/tachUI/commit/1e6c1f4f98f68929397ce4b5ea9bfc92e6e45dca) Thanks [@whoughton](https://github.com/whoughton)! - Release tree-shaking and packaging improvements across core and feature packages.

  - add explicit `sideEffects` metadata across publishable packages for safer bundling
  - split runtime-safe vs tooling entry points in `@tachui/core` and add subpath exports
  - add granular navigation and responsive subpath exports with artifact verification
  - include SSR and modifiers/runtime fixes plus supporting docs and CI updates

- Updated dependencies [[`1e6c1f4`](https://github.com/tach-UI/tachUI/commit/1e6c1f4f98f68929397ce4b5ea9bfc92e6e45dca)]:
  - @tachui/core@0.8.24

## 0.8.23

### Patch Changes

- [#173](https://github.com/tach-UI/tachUI/pull/173) [`97ad059`](https://github.com/tach-UI/tachUI/commit/97ad059fd80122b84f938aeba5847b7984bacc5f) Thanks [@whoughton](https://github.com/whoughton)! - Fix SSR serialization recursion for component inputs that also expose `build()` by prioritizing component render dispatch and guarding against cyclic builder chains.

  Improve asset typing ergonomics by adding declaration-merging support for custom `Assets` keys via `CustomAssets`.

  Add `.compositingGroup()` modifier mapped to `isolation: isolate`, with non-colliding priority so isolation is applied before blend-mode modifiers.

  Make `FontAsset` loading SSR-safe by no-oping DOM-dependent load paths when `document`/`window` are unavailable (prevents eager Google font crashes during prerender).

- Updated dependencies [[`97ad059`](https://github.com/tach-UI/tachUI/commit/97ad059fd80122b84f938aeba5847b7984bacc5f)]:
  - @tachui/core@0.8.23

## 0.8.22

### Patch Changes

- [#170](https://github.com/tach-UI/tachUI/pull/170) [`6fc0c1c`](https://github.com/tach-UI/tachUI/commit/6fc0c1cd732eb0a18a7886cb1666833542a0abc5) Thanks [@whoughton](https://github.com/whoughton)! - Fix SSR serialization recursion for component inputs that also expose a `build()` method by prioritizing component rendering and adding cyclic builder-chain detection. Adds regression coverage for mixed component/builder inputs and cyclic builder cases.

  Also add declaration-merging support for custom asset names via `CustomAssets` so consumers can strongly type known runtime-registered keys (for example declaring `sand: ColorAssetProxy` and then calling `Assets.sand.opacity(...)` with full type safety).

  Add a new `.compositingGroup()` modifier that maps to CSS `isolation: isolate`, including modifier registry wiring, blend-mode integration coverage, and an explicit non-colliding priority (`91`) so isolation is applied before blend-mode modifiers.

- Updated dependencies []:
  - @tachui/core@0.8.22

## 0.8.21

### Patch Changes

- Updated dependencies [[`711187b`](https://github.com/tach-UI/tachUI/commit/711187b7efa5820f05d6b8bcb396147e90b83d9d)]:
  - @tachui/core@0.8.21

## 0.8.20

### Patch Changes

- Updated dependencies [[`859a15a`](https://github.com/tach-UI/tachUI/commit/859a15a245cbde879a6dba2f74568d8881d74a4c)]:
  - @tachui/core@0.8.20

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

## 0.8.18

### Patch Changes

- Initial package scaffold for TachUI server-side rendering helpers.
