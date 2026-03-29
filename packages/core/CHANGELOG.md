# @tachui/core

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
