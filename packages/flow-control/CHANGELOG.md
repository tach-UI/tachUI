# @tachui/flow-control

## 0.8.33

### Patch Changes

- [#317](https://github.com/tach-UI/tachUI/pull/317) [`603a6f7`](https://github.com/tach-UI/tachUI/commit/603a6f720c43b69c9bfb72cea14f9aafca9eab01) Thanks [@whoughton](https://github.com/whoughton)! - Dispose `Show` branches and `ForEach` items through the renderer that mounted them.

  Both components own a private `DOMRenderer`, but dropped content by calling `node.dispose` alone. That reaches only what a component put on the node — everything the renderer registered against the element stayed live: reactive prop effects, reactive `style`/`className` effects, event delegation, and the `reactiveElement` bindings added in this release.

  The renderer's `renderedNodes` is a strong `Set`, so the discarded nodes were retained as well. Twelve tracked nodes after five add/remove cycles of a single `ForEach` item, where two is correct; `Show` grew the same way per toggle.

  Both now route through the new `DOMRenderer.disposeNode` for content that renderer has, keeping `node.dispose` for nodes dropped before they were ever mounted.

  This is not the `Show`/`ForEach` defect in #318, where each `render()` spawns another `createRoot` and the stale effects keep writing into the same element. That one is untouched.

- [#324](https://github.com/tach-UI/tachUI/pull/324) [`327e8de`](https://github.com/tach-UI/tachUI/commit/327e8dea132e3a2f26d6afa724cc130b323413fa) Thanks [@whoughton](https://github.com/whoughton)! - Fix `Show` and `ForEach` corrupting their output when the element they live in re-renders.

  A `Show` sitting on its fallback rendered `NONO` the next time its parent re-rendered, and a two-item `ForEach` rendered `bab`. The wrong content stayed on screen until the condition or the collection changed again, at which point it silently corrected itself.

  Two writers, and neither knew about the other. Both components built a container node in `render()` and then patched that node's element directly from an effect created in the same call, while the mounting renderer went on reconciling the node's declared `children` into that same element.

  That leaves two records of what is mounted. The renderer's names the branch that was there at the last render; the element holds whatever the effect has patched in since. They agree until the branch changes without a re-render — and then the next re-render diffs the incoming branch against the stale record, pairs it positionally with an element that is no longer mounted, and adopts it, leaving the branch that _is_ mounted where it was.

  Note that stale effects were not the cause, despite being the obvious suspect: `render()` disposed its previous root before creating the next, so only one was ever live. Fixing it that way is what made an ancestor's re-render tear the branch down and rebuild it.

  The container is now an owned node (`DOMNode.owned`), so the component fills it and the renderer mounts it without reconciling its children — one writer, one record. The subscription goes over as `reactiveElement` rather than being created in `render()`, so the renderer owns it: it retires the previous binding when it adopts the node's successor and rebinds one that outlived its render pass, which means exactly one effect maintains the container however many times the node is rendered.

  The container element is created once and kept for the life of the component. That is what makes a re-render idempotent — the node handed over on the second render carries the same element as the first, so the reconciler pairs the two and mounts nothing new — and it keeps modifiers applied to a `Show` or `ForEach` on the element they were applied to.

  Both now update rather than rebuild. `Show` reconciles the re-rendered branch against the mounted one, so a re-render that produces the same shape updates elements in place; a genuine branch swap is still a teardown, since reconciling one branch against the other would pair elements by position with no regard for what they are. `ForEach` inserts and removes rather than calling `replaceChildren`, which re-inserted every element and so dropped focus and reset scroll inside items that had not changed.

  Server-side rendering takes one of two paths. Where there is no DOM, both emit an ordinary node carrying the current content as children, as `DOMNode.owned` requires of an owner that cannot build its element. Where a DOM shim is present they emit the owned node, and the serializer reaches the content by calling the accessor — which it does only for a node with no `element` of its own, since an element is preferred over an accessor and an unfilled one would serialize as an empty shell. Neither node carries an element for that reason.

  Disposal goes through the container too. The subscription belongs to the renderer now, so a component can no longer end it by dropping its own state: `show.dispose()` on a mounted component emptied the element, left the binding subscribed, and the next change to the condition refilled it. `dispose()` retires the binding first, through the composite disposer the renderer installs on an owned node.

  The shared piece is `OwnedContainer`, which both components use rather than each keeping its own copy of the element, the node, the server-render fallback and the disposal handshake — the duplication is how #318 came to exist in two places at once.

  The renderer's own per-node bookkeeping — the children and props it last wrote — is reached through a typed `recordOf(node)` rather than sixteen separate `as any` casts. It stays off `DOMNode`, which is the type every package builds its output against: this is the renderer's working state, not a description of the node.

  Two supporting fixes in `@tachui/core`'s renderer, both only reachable once a node outlives a single render:

  - Registering the same cleanup function against an element twice now registers it once. A node's `dispose` is registered on every render of that node, so a component handing over a stable disposer — as one holding DOM across renders must, to be disposed at all — collected one entry per render of the enclosing element for the life of the mount.
  - Disposing a node now clears what it remembers about the render that mounted it. A node object can outlive its element, since a component that caches the nodes it built hands the same objects back later; kept, those records were diffed against children whose elements were gone, and an identical child list took the update path, found nothing mounted, and rendered nothing.

  Fixes #318.

- Updated dependencies [[`11a792d`](https://github.com/tach-UI/tachUI/commit/11a792db9d51db5182bc7877f5a8719c15fae11f), [`d5cd030`](https://github.com/tach-UI/tachUI/commit/d5cd030464dee0be84b8a2c6013fed716e53f551), [`0da0398`](https://github.com/tach-UI/tachUI/commit/0da03983bd74252a0ad917e7443b52781980b0bb), [`746b2be`](https://github.com/tach-UI/tachUI/commit/746b2bed20d71335f04e47097b135196d9f2caad), [`1fe6910`](https://github.com/tach-UI/tachUI/commit/1fe69104fadafa3663163b2d749e963b84620427), [`5cd2e02`](https://github.com/tach-UI/tachUI/commit/5cd2e0236f0336bf86d71744cb4b557145462c5d), [`327e8de`](https://github.com/tach-UI/tachUI/commit/327e8dea132e3a2f26d6afa724cc130b323413fa), [`7245d29`](https://github.com/tach-UI/tachUI/commit/7245d29aaf569483c16ff9d51788fb4815895caf), [`df5c539`](https://github.com/tach-UI/tachUI/commit/df5c5390072163b73ef16509f569b517ce916ea4), [`985a84b`](https://github.com/tach-UI/tachUI/commit/985a84b800dab2413ca563bac943f9ca3efc41db), [`2984b3c`](https://github.com/tach-UI/tachUI/commit/2984b3ccd461f7126acc9286f145d322d190373e)]:
  - @tachui/core@0.9.0

## 0.8.32

### Patch Changes

- Updated dependencies [[`9ae49e0`](https://github.com/tach-UI/tachUI/commit/9ae49e04ebeaf6d5363d1f5cb85230010f9905c2), [`9ae49e0`](https://github.com/tach-UI/tachUI/commit/9ae49e04ebeaf6d5363d1f5cb85230010f9905c2)]:
  - @tachui/core@0.8.32

## 0.8.31

### Patch Changes

- Updated dependencies [[`fae8633`](https://github.com/tach-UI/tachUI/commit/fae86338af75e0cfcc37f9f74b494a11092b29a2), [`fae8633`](https://github.com/tach-UI/tachUI/commit/fae86338af75e0cfcc37f9f74b494a11092b29a2)]:
  - @tachui/core@0.8.31

## 0.8.30

### Patch Changes

- Updated dependencies [[`de58dac`](https://github.com/tach-UI/tachUI/commit/de58dac18bc26c1d1c0a3cc15472e3d2cde92bf7), [`4a8d3a8`](https://github.com/tach-UI/tachUI/commit/4a8d3a8aa5293ddd5e4698c0cfe21a52327fe972)]:
  - @tachui/core@0.8.30

## 0.8.29

### Patch Changes

- Updated dependencies [[`6a45ba3`](https://github.com/tach-UI/tachUI/commit/6a45ba3e75bbde9f0fa6e2636f5a6e7d7e7a2019)]:
  - @tachui/core@0.8.29

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

## 0.8.26

### Patch Changes

- Updated dependencies [[`ea92165`](https://github.com/tach-UI/tachUI/commit/ea921651953ac5edaefe410ac7c08730634f869f)]:
  - @tachui/core@0.8.26

## 0.8.25

### Patch Changes

- Updated dependencies [[`2e43673`](https://github.com/tach-UI/tachUI/commit/2e43673d98067daf54af8b7a7f31cc125a53ab34)]:
  - @tachui/core@0.8.25

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

- Updated dependencies [[`97ad059`](https://github.com/tach-UI/tachUI/commit/97ad059fd80122b84f938aeba5847b7984bacc5f)]:
  - @tachui/core@0.8.23

## 0.8.22

### Patch Changes

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

- Updated dependencies [[`b2f2522`](https://github.com/tach-UI/tachUI/commit/b2f25224d7d33e249653f90a94091287c3506f47)]:
  - @tachui/core@0.8.19

## 0.8.18

### Patch Changes

- Updated dependencies [[`b3ca77c`](https://github.com/tach-UI/tachUI/commit/b3ca77c89cfcf75994f32ca7c2245bf579f71a82)]:
  - @tachui/core@0.8.18

## 0.8.17

### Patch Changes

- Updated dependencies [[`e982ab2`](https://github.com/tach-UI/tachUI/commit/e982ab26f9012c610b9cb0bff78840dc26771d40)]:
  - @tachui/core@0.8.17

## 0.8.16

### Patch Changes

- Updated dependencies [[`a8a1103`](https://github.com/tach-UI/tachUI/commit/a8a1103ebe68d7052f95995db5d1b3dc89bb3b49)]:
  - @tachui/core@0.8.16

## 0.8.15

### Patch Changes

- Updated dependencies [[`8afda39`](https://github.com/tach-UI/tachUI/commit/8afda390d9ced5da657318a78535c9fac8f22819)]:
  - @tachui/core@0.8.15

## 0.8.14

### Patch Changes

- Updated dependencies [[`8f5eeaa`](https://github.com/tach-UI/tachUI/commit/8f5eeaaa513e0ea581212599b2c115b149de71a8)]:
  - @tachui/core@0.9.0

## 0.8.13

### Patch Changes

- [#109](https://github.com/tach-UI/tachUI/pull/109) [`e02aee1`](https://github.com/tach-UI/tachUI/commit/e02aee14d816b6ccd78684528fdf4ce95e47714a) Thanks [@whoughton](https://github.com/whoughton)! - Release patch versions across all publishable TachUI packages to recover from broken cross-version dependency metadata and restore a coherent single-runtime install graph.

- Updated dependencies [[`e02aee1`](https://github.com/tach-UI/tachUI/commit/e02aee14d816b6ccd78684528fdf4ce95e47714a)]:
  - @tachui/core@0.8.13

## 0.8.12

### Patch Changes

- Updated dependencies [[`078b01e`](https://github.com/tach-UI/tachUI/commit/078b01e574325d6d3e5eb6d90b81c7fad2cf39cf)]:
  - @tachui/core@0.9.0

## 0.8.10-alpha.0

### Patch Changes

- [#93](https://github.com/tach-UI/tachUI/pull/93) [`143c53c`](https://github.com/tach-UI/tachUI/commit/143c53c3c7e3c6e7a4eea1871d1c9f07c72d30b5) Thanks [@whoughton](https://github.com/whoughton)! - Start the 0.8.10-alpha prerelease train across all publishable @tachui packages.

- Updated dependencies [[`143c53c`](https://github.com/tach-UI/tachUI/commit/143c53c3c7e3c6e7a4eea1871d1c9f07c72d30b5)]:
  - @tachui/core@0.8.10-alpha.0

## 0.8.9

### Patch Changes

- Updated dependencies [[`5d3fb03`](https://github.com/tach-UI/tachUI/commit/5d3fb03c5ec91e344c0625bab8c48a2ea5bcee34)]:
  - @tachui/core@0.8.9

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
