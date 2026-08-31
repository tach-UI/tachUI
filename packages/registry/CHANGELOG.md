# @tachui/registry

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

## 0.8.27

### Patch Changes

- [#206](https://github.com/tach-UI/tachUI/pull/206) [`d579b1f`](https://github.com/tach-UI/tachUI/commit/d579b1f1fb5cd5441ca281670f815890be20039d) Thanks [@whoughton](https://github.com/whoughton)! - Migrate package manager from pnpm to bun

  - Replace pnpm with bun (v1.2.0) as package manager
  - Update all package scripts from pnpm to bun equivalents
  - Migrate workspace configuration from pnpm-workspace.yaml to package.json workspaces
  - Update CI/CD workflows to use oven-sh/setup-bun@v2
  - Update documentation with bun commands

  Note: This is a tooling change only - no API changes to packages.

## 0.8.26

## 0.8.25

## 0.8.24

### Patch Changes

- [#181](https://github.com/tach-UI/tachUI/pull/181) [`1e6c1f4`](https://github.com/tach-UI/tachUI/commit/1e6c1f4f98f68929397ce4b5ea9bfc92e6e45dca) Thanks [@whoughton](https://github.com/whoughton)! - Release tree-shaking and packaging improvements across core and feature packages.

  - add explicit `sideEffects` metadata across publishable packages for safer bundling
  - split runtime-safe vs tooling entry points in `@tachui/core` and add subpath exports
  - add granular navigation and responsive subpath exports with artifact verification
  - include SSR and modifiers/runtime fixes plus supporting docs and CI updates

## 0.8.23

## 0.8.22

## 0.8.21

## 0.8.20

## 0.8.19

## 0.8.18

## 0.8.17

## 0.8.16

## 0.8.15

### Patch Changes

- [#116](https://github.com/tach-UI/tachUI/pull/116) [`8afda39`](https://github.com/tach-UI/tachUI/commit/8afda390d9ced5da657318a78535c9fac8f22819) Thanks [@whoughton](https://github.com/whoughton)! - Correct the internal release line back to `0.8.x` and prevent cross-line drift in future releases.

  This fixes package metadata so internal `@tachui/*` dependencies and peer ranges no longer point at unpublished `0.9.0` or `1.0.0` artifacts, and adds release guards that fail CI when publishable packages diverge across release lines or packed manifests reference unpublished internal versions.

## 0.9.0

## 0.8.13

### Patch Changes

- [#109](https://github.com/tach-UI/tachUI/pull/109) [`e02aee1`](https://github.com/tach-UI/tachUI/commit/e02aee14d816b6ccd78684528fdf4ce95e47714a) Thanks [@whoughton](https://github.com/whoughton)! - Release patch versions across all publishable TachUI packages to recover from broken cross-version dependency metadata and restore a coherent single-runtime install graph.

## 0.9.0

## 0.8.10-alpha.0

### Patch Changes

- [#93](https://github.com/tach-UI/tachUI/pull/93) [`143c53c`](https://github.com/tach-UI/tachUI/commit/143c53c3c7e3c6e7a4eea1871d1c9f07c72d30b5) Thanks [@whoughton](https://github.com/whoughton)! - Start the 0.8.10-alpha prerelease train across all publishable @tachui packages.

## 0.8.9

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
