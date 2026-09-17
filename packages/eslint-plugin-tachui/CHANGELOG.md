# @tachui/eslint-plugin

## 0.11.2

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

## 0.11.0

## 0.10.0

## 0.8.16

### Patch Changes

- [#242](https://github.com/tach-UI/tachUI/pull/242) [`112d9c5`](https://github.com/tach-UI/tachUI/commit/112d9c551cc71669591678c32ef55ffe9c410fd2) Thanks [@whoughton](https://github.com/whoughton)! - fix(release): publish versioned internal dependency ranges

  Rewrites the `workspace:*` internal dependency ranges to concrete
  versioned ranges so published manifests are installable from npm.
  `@tachui/core@0.8.27` and `@tachui/primitives@0.8.28` (the current
  `latest` tags) shipped `workspace:*` dependencies and are uninstallable
  outside the monorepo (#235). The release pipeline now rewrites workspace
  ranges during versioning and rejects non-publishable protocols before
  any future publish.

## 0.8.15

### Patch Changes

- [#206](https://github.com/tach-UI/tachUI/pull/206) [`d579b1f`](https://github.com/tach-UI/tachUI/commit/d579b1f1fb5cd5441ca281670f815890be20039d) Thanks [@whoughton](https://github.com/whoughton)! - Migrate package manager from pnpm to bun

  - Replace pnpm with bun (v1.2.0) as package manager
  - Update all package scripts from pnpm to bun equivalents
  - Migrate workspace configuration from pnpm-workspace.yaml to package.json workspaces
  - Update CI/CD workflows to use oven-sh/setup-bun@v2
  - Update documentation with bun commands

  Note: This is a tooling change only - no API changes to packages.

## 0.8.14

### Patch Changes

- [#181](https://github.com/tach-UI/tachUI/pull/181) [`1e6c1f4`](https://github.com/tach-UI/tachUI/commit/1e6c1f4f98f68929397ce4b5ea9bfc92e6e45dca) Thanks [@whoughton](https://github.com/whoughton)! - Release tree-shaking and packaging improvements across core and feature packages.

  - add explicit `sideEffects` metadata across publishable packages for safer bundling
  - split runtime-safe vs tooling entry points in `@tachui/core` and add subpath exports
  - add granular navigation and responsive subpath exports with artifact verification
  - include SSR and modifiers/runtime fixes plus supporting docs and CI updates

## 0.8.13

### Patch Changes

- [#109](https://github.com/tach-UI/tachUI/pull/109) [`e02aee1`](https://github.com/tach-UI/tachUI/commit/e02aee14d816b6ccd78684528fdf4ce95e47714a) Thanks [@whoughton](https://github.com/whoughton)! - Release patch versions across all publishable TachUI packages to recover from broken cross-version dependency metadata and restore a coherent single-runtime install graph.

## 0.8.9-alpha.0

### Patch Changes

- [#93](https://github.com/tach-UI/tachUI/pull/93) [`143c53c`](https://github.com/tach-UI/tachUI/commit/143c53c3c7e3c6e7a4eea1871d1c9f07c72d30b5) Thanks [@whoughton](https://github.com/whoughton)! - Start the 0.8.10-alpha prerelease train across all publishable @tachui packages.

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
