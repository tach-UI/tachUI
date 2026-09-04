# @tachui/symbols

## 0.10.0

### Patch Changes

- [#317](https://github.com/tach-UI/tachUI/pull/317) [`2953bf7`](https://github.com/tach-UI/tachUI/commit/2953bf783fdd5f517253f694228fcdb687138222) Thanks [@whoughton](https://github.com/whoughton)! - Resolve SF Symbol names through the mapping table before loading an icon (#303).

  `@tachui/symbols` ships a 140-entry SF Symbol → Lucide mapping table, but `Symbol()` never consulted it. The raw name went straight to the icon set, which PascalCases it and looks it up in Lucide. Dots are not word separators there, so `chevron.right` became `Chevron.right`, missed `ChevronRight`, and drew the error glyph — while `isSFSymbolSupported('chevron.right')` returned `true` and TypeScript was satisfied.

  Only SF Symbols spelled identically in Lucide ever rendered. Of the 23 symbols one reporter's app used that the package claimed to support, 4 worked: `calendar`, `clock`, `pencil`, `plus`. The other 19 silently drew a circle-with-X.

  ```typescript
  Symbol("chevron.right");
  // before: <span class="… tachui-symbol--error"> and a console warning
  // after:  the chevron-right glyph
  ```

  The package README documents `Symbol('heart.fill')`, `Symbol('star.circle')`, `Symbol('person.fill')` and similar throughout, so this affected the component's documented API as written.

  `IconLoader` now resolves a name — and a `fallback` — through `getLucideForSFSymbol()` before asking the icon set for it, matching `Image({ systemName })` in the SwiftUI shim, which has always resolved through the same table. A name with no mapping entry passes through unchanged, so icon-set-native names such as `chevron-right` — the only spelling that worked before — keep working, as do names belonging to other icon sets.

  Resolving at the loader rather than in `Symbol()` keeps every entry point on one name. `IconLoader` is exported from the package root and the compatibility guide documents preloading with SF spellings, so resolving in the component alone would leave `preloadIcons(['heart.fill'])` warming a key the render never asks for — a guaranteed miss, plus a wasted load of a name no icon set has.

  No mapping entries changed: all 140 targets already existed in Lucide, so the table was correct and simply unused. `isSFSymbolSupported()` now agrees with what renders, which is asserted directly rather than assumed.

  **The name as written wins when the backend has an icon of that name.** Seven SF keys — `trash`, `house`, `bolt`, `cross`, `ellipsis`, `forward`, `speaker` — are also real Lucide icons, so resolving them unconditionally would send `Symbol('trash')` to `trash-2`: a different glyph from the one the caller named, and a regression against the behaviour when the table was not consulted at all. Resolution asks Lucide whether it holds the name as written and only maps when it does not.

  That check is exact membership rather than a spelling heuristic. Dot-free is not a usable signal — `checkmark`, `magnifyingglass`, `xmark`, `archivebox`, `person` and `mappin` are dot-free SF names that genuinely need mapping.

  One consequence for `IconLoader`'s cache: entries key on the name the _caller_ asked for rather than the resolved one. Two spellings of the same glyph therefore no longer share an entry. They cannot — `trash` and the SF key mapping to `trash-2` mean different icons, so a shared entry would serve one caller the other's glyph — and the requested name is also the only key available synchronously, now that resolution has to consult the icon set. `isIconCached()` and `getCachedIcon()` are unchanged in signature and stay synchronous.

  ## The symbol never left the loading spinner

  Fixing name resolution alone was not enough to make a glyph appear. Measured in jsdom, no `Symbol` ever painted an SVG — not a valid name, not a warm cache, not with a fallback, not after a signal change. Every one stayed on `⟳`.

  `Symbol` painted from an effect created inside `render()`, but the renderer assigns `node.element` _after_ `render()` returns, so that effect could never paint on its first run. Anything it did manage to write later was overwritten by `updateChildren`, which reconciles the node's declared children on every render.

  ## `render()` describes; the renderer subscribes

  The deeper problem was where the symbol's state was read. A component's `render()` does not run in its own reactive scope: a child's `render()` is called inline inside the _enclosing_ component's render effect, so reading `isLoading`/`error`/`iconDefinition` there subscribes the parent, and every icon that resolved re-rendered the whole surrounding subtree. Where a parent constructs its symbols during its own render — the ordinary way to write it — each pass built fresh signals whose load triggered another pass: **26 enclosing renders for a single symbol**, settling only once the loader cache was warm.

  `Symbol`'s `render()` now reads no signals at all. It hands the renderer memos for the wrapper's classes and styles, and the icon as a `DOMNode.reactiveElement` accessor — see the `@tachui/core` note below. Every subscription belongs to a renderer-owned binding scoped to the mounted element, which is where a reactive `className` or `style` prop has always lived. The component owns no scope, patches no DOM, and holds no reference to the element the renderer built.

  Four things fall out of that, each of which was broken while `Symbol` maintained its own repaint scope:

  - A symbol disposed and re-rendered — what `Show` does across a branch swap — repaints again, instead of freezing at whatever it last painted.
  - A symbol paints inside a layout that hands the renderer a _copy_ of the node. `ZStack` and the tab views spread nodes (`{ ...node }`), so the object the component kept never received an `element`; such a symbol stayed on the spinner forever, including with a warm cache.
  - Modifier styles and classes survive the load. `Symbol('heart').padding(8).frame({ width: 40 })` keeps both the padding and the frame width once the icon resolves, and across a later scale change; `.foregroundColor('red')` stays red.
  - A parent re-render with a fresh `Symbol()` instance leaves one child, not a spinner mounted alongside the icon.

  The wrapper's styles now go over as an object rather than a string, which also fixes keys the string path silently dropped: `lineHeight`, `fontWeight`, `letterSpacing` and `fontVariationSettings` are not valid CSS property names, and the renderer kebab-cases object keys.

  `render()` also no longer needs a DOM: server-side it emits the wrapper alone and the icon is drawn on hydration, rather than throwing on `createElementNS`.

  ## Removed `SelectiveLucideIconSet`

  `src/icon-sets/selective-lucide.ts` carried its own copy of the unresolved-name bug. It was unreachable: not exported from the `icon-sets` barrel or the package root, and the `exports` map has no wildcard subpath, so no consumer could import it. It had no tests and had not been touched since the first public-release commit. Removed rather than fixed in parallel.

- Updated dependencies [[`11a792d`](https://github.com/tach-UI/tachUI/commit/11a792db9d51db5182bc7877f5a8719c15fae11f), [`d5cd030`](https://github.com/tach-UI/tachUI/commit/d5cd030464dee0be84b8a2c6013fed716e53f551), [`0da0398`](https://github.com/tach-UI/tachUI/commit/0da03983bd74252a0ad917e7443b52781980b0bb), [`746b2be`](https://github.com/tach-UI/tachUI/commit/746b2bed20d71335f04e47097b135196d9f2caad), [`1fe6910`](https://github.com/tach-UI/tachUI/commit/1fe69104fadafa3663163b2d749e963b84620427), [`5cd2e02`](https://github.com/tach-UI/tachUI/commit/5cd2e0236f0336bf86d71744cb4b557145462c5d), [`327e8de`](https://github.com/tach-UI/tachUI/commit/327e8dea132e3a2f26d6afa724cc130b323413fa), [`7245d29`](https://github.com/tach-UI/tachUI/commit/7245d29aaf569483c16ff9d51788fb4815895caf), [`df5c539`](https://github.com/tach-UI/tachUI/commit/df5c5390072163b73ef16509f569b517ce916ea4), [`850d557`](https://github.com/tach-UI/tachUI/commit/850d557b19c763c296f9457e4401b0c4b822cc68), [`985a84b`](https://github.com/tach-UI/tachUI/commit/985a84b800dab2413ca563bac943f9ca3efc41db), [`2984b3c`](https://github.com/tach-UI/tachUI/commit/2984b3ccd461f7126acc9286f145d322d190373e)]:
  - @tachui/core@0.10.0
  - @tachui/modifiers@0.10.0

## 0.8.34

### Patch Changes

- Updated dependencies [[`9ae49e0`](https://github.com/tach-UI/tachUI/commit/9ae49e04ebeaf6d5363d1f5cb85230010f9905c2), [`9ae49e0`](https://github.com/tach-UI/tachUI/commit/9ae49e04ebeaf6d5363d1f5cb85230010f9905c2)]:
  - @tachui/core@0.8.32
  - @tachui/modifiers@0.8.33

## 0.8.33

### Patch Changes

- Updated dependencies [[`fae8633`](https://github.com/tach-UI/tachUI/commit/fae86338af75e0cfcc37f9f74b494a11092b29a2), [`fae8633`](https://github.com/tach-UI/tachUI/commit/fae86338af75e0cfcc37f9f74b494a11092b29a2), [`fae8633`](https://github.com/tach-UI/tachUI/commit/fae86338af75e0cfcc37f9f74b494a11092b29a2)]:
  - @tachui/core@0.8.31
  - @tachui/modifiers@0.8.32

## 0.8.32

### Patch Changes

- Updated dependencies [[`de58dac`](https://github.com/tach-UI/tachUI/commit/de58dac18bc26c1d1c0a3cc15472e3d2cde92bf7), [`4a8d3a8`](https://github.com/tach-UI/tachUI/commit/4a8d3a8aa5293ddd5e4698c0cfe21a52327fe972)]:
  - @tachui/core@0.8.30
  - @tachui/modifiers@0.8.31

## 0.8.31

### Patch Changes

- [#249](https://github.com/tach-UI/tachUI/pull/249) [`1022bb4`](https://github.com/tach-UI/tachUI/commit/1022bb436ff32c6046e41ad1d9c650bed6092b5a) Thanks [@whoughton](https://github.com/whoughton)! - Harden icon rendering against untrusted icon definitions (#218): icon SVG bodies are now routed through the framework's `sanitizeSVG` allowlist sanitizer before any `innerHTML` sink (inline-SVG rendering, the sprite-sheet symbol insertion, and the `Symbol` component — which now builds its wrapper `<svg>` via `createElementNS`/`setAttribute` so interpolated attribute values are escaped by the DOM), with per-definition memoization so repeated renders stay flat. Malicious `viewBox` values fall back to the standard `0 0 24 24`, and pluggable icon-set names/variants plus user colors are attribute-escaped in the string render paths.
  Node SSR keeps full icon support: when no DOM is available, a strict DOM-free allowlist rebuilder
  (mirroring the DOM sanitizer's tag/attribute/protocol rules) sanitizes icon bodies instead of the
  DOM-based sanitizer, so the SSR-oriented `INLINE_SVG` strategy no longer requires a DOM. Also declares the existing runtime dependency on `@tachui/core`.

## 0.8.30

### Patch Changes

- Updated dependencies [[`6a45ba3`](https://github.com/tach-UI/tachUI/commit/6a45ba3e75bbde9f0fa6e2636f5a6e7d7e7a2019)]:
  - @tachui/core@0.8.29
  - @tachui/modifiers@0.8.30

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

## 0.8.27

### Patch Changes

- Updated dependencies [[`ea92165`](https://github.com/tach-UI/tachUI/commit/ea921651953ac5edaefe410ac7c08730634f869f)]:
  - @tachui/core@0.8.26
  - @tachui/modifiers@0.8.27

## 0.8.26

### Patch Changes

- Updated dependencies [[`ee3b6ed`](https://github.com/tach-UI/tachUI/commit/ee3b6ed44ca0262a4efe4567e67a52e2e2bd7534)]:
  - @tachui/modifiers@0.8.26

## 0.8.25

### Patch Changes

- Updated dependencies [[`2e43673`](https://github.com/tach-UI/tachUI/commit/2e43673d98067daf54af8b7a7f31cc125a53ab34)]:
  - @tachui/core@0.8.25
  - @tachui/modifiers@0.8.25

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

## 0.8.23

### Patch Changes

- Updated dependencies [[`97ad059`](https://github.com/tach-UI/tachUI/commit/97ad059fd80122b84f938aeba5847b7984bacc5f)]:
  - @tachui/core@0.8.23
  - @tachui/modifiers@0.8.23

## 0.8.22

### Patch Changes

- Updated dependencies [[`6fc0c1c`](https://github.com/tach-UI/tachUI/commit/6fc0c1cd732eb0a18a7886cb1666833542a0abc5)]:
  - @tachui/modifiers@0.8.22
  - @tachui/core@0.8.22

## 0.8.21

### Patch Changes

- Updated dependencies [[`711187b`](https://github.com/tach-UI/tachUI/commit/711187b7efa5820f05d6b8bcb396147e90b83d9d)]:
  - @tachui/core@0.8.21
  - @tachui/modifiers@0.8.21

## 0.8.20

### Patch Changes

- Updated dependencies [[`859a15a`](https://github.com/tach-UI/tachUI/commit/859a15a245cbde879a6dba2f74568d8881d74a4c)]:
  - @tachui/core@0.8.20
  - @tachui/modifiers@0.8.20

## 0.8.19

### Patch Changes

- Updated dependencies [[`b2f2522`](https://github.com/tach-UI/tachUI/commit/b2f25224d7d33e249653f90a94091287c3506f47)]:
  - @tachui/core@0.8.19
  - @tachui/modifiers@0.8.19

## 0.8.18

### Patch Changes

- Updated dependencies [[`b3ca77c`](https://github.com/tach-UI/tachUI/commit/b3ca77c89cfcf75994f32ca7c2245bf579f71a82)]:
  - @tachui/core@0.8.18
  - @tachui/modifiers@0.8.18

## 0.8.17

### Patch Changes

- Updated dependencies [[`e982ab2`](https://github.com/tach-UI/tachUI/commit/e982ab26f9012c610b9cb0bff78840dc26771d40)]:
  - @tachui/core@0.8.17
  - @tachui/modifiers@0.8.17

## 0.8.16

### Patch Changes

- Updated dependencies [[`a8a1103`](https://github.com/tach-UI/tachUI/commit/a8a1103ebe68d7052f95995db5d1b3dc89bb3b49)]:
  - @tachui/core@0.8.16
  - @tachui/modifiers@0.8.16

## 0.8.15

### Patch Changes

- [#116](https://github.com/tach-UI/tachUI/pull/116) [`8afda39`](https://github.com/tach-UI/tachUI/commit/8afda390d9ced5da657318a78535c9fac8f22819) Thanks [@whoughton](https://github.com/whoughton)! - Correct the internal release line back to `0.8.x` and prevent cross-line drift in future releases.

  This fixes package metadata so internal `@tachui/*` dependencies and peer ranges no longer point at unpublished `0.9.0` or `1.0.0` artifacts, and adds release guards that fail CI when publishable packages diverge across release lines or packed manifests reference unpublished internal versions.

- Updated dependencies [[`8afda39`](https://github.com/tach-UI/tachUI/commit/8afda390d9ced5da657318a78535c9fac8f22819)]:
  - @tachui/core@0.8.15
  - @tachui/modifiers@0.8.15

## 1.0.0

### Patch Changes

- Updated dependencies [[`8f5eeaa`](https://github.com/tach-UI/tachUI/commit/8f5eeaaa513e0ea581212599b2c115b149de71a8), [`8f5eeaa`](https://github.com/tach-UI/tachUI/commit/8f5eeaaa513e0ea581212599b2c115b149de71a8)]:
  - @tachui/modifiers@0.8.14
  - @tachui/core@0.9.0

## 0.8.13

### Patch Changes

- [#109](https://github.com/tach-UI/tachUI/pull/109) [`e02aee1`](https://github.com/tach-UI/tachUI/commit/e02aee14d816b6ccd78684528fdf4ce95e47714a) Thanks [@whoughton](https://github.com/whoughton)! - Release patch versions across all publishable TachUI packages to recover from broken cross-version dependency metadata and restore a coherent single-runtime install graph.

- Updated dependencies [[`e02aee1`](https://github.com/tach-UI/tachUI/commit/e02aee14d816b6ccd78684528fdf4ce95e47714a)]:
  - @tachui/core@0.8.13
  - @tachui/modifiers@0.8.13

## 1.0.0

### Patch Changes

- Updated dependencies [[`078b01e`](https://github.com/tach-UI/tachUI/commit/078b01e574325d6d3e5eb6d90b81c7fad2cf39cf)]:
  - @tachui/core@0.9.0
  - @tachui/modifiers@0.8.12

## 0.8.10-alpha.0

### Patch Changes

- [#93](https://github.com/tach-UI/tachUI/pull/93) [`143c53c`](https://github.com/tach-UI/tachUI/commit/143c53c3c7e3c6e7a4eea1871d1c9f07c72d30b5) Thanks [@whoughton](https://github.com/whoughton)! - Start the 0.8.10-alpha prerelease train across all publishable @tachui packages.

- Updated dependencies [[`143c53c`](https://github.com/tach-UI/tachUI/commit/143c53c3c7e3c6e7a4eea1871d1c9f07c72d30b5)]:
  - @tachui/core@0.8.10-alpha.0
  - @tachui/modifiers@0.8.10-alpha.0

## 0.8.9

### Patch Changes

- Updated dependencies [[`5d3fb03`](https://github.com/tach-UI/tachUI/commit/5d3fb03c5ec91e344c0625bab8c48a2ea5bcee34)]:
  - @tachui/core@0.8.9
  - @tachui/modifiers@0.8.9

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
