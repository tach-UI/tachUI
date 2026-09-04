# @tachui/types

## 0.9.0

### Minor Changes

- [#317](https://github.com/tach-UI/tachUI/pull/317) [`1fe6910`](https://github.com/tach-UI/tachUI/commit/1fe69104fadafa3663163b2d749e963b84620427) Thanks [@whoughton](https://github.com/whoughton)! - Add `DOMNode.owned` and `DOMNode.reactiveElement`, so a component can hand the renderer an element it built itself — and keep it up to date without re-rendering anything around it.

  Some content cannot be expressed as `DOMNode` children. An SVG subtree is the clearest case: node tags are created with `document.createElement`, and there is no namespace support, so `<path>` would come out as `HTMLUnknownElement` and never draw. Third-party widgets that own their own DOM have the same problem.

  Components in that position had no option but to patch the DOM behind the renderer's back, from an effect created during `render()`. That does not work, for two reasons that were not obvious:

  - `node.element` is assigned _after_ `render()` returns, so such an effect has no element on its first run.
  - `updateChildren` reconciles the node's declared children on every render and overwrites whatever was patched in.

  ## `owned`: the renderer mounts an element it did not build

  ```typescript
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  // … build the subtree …

  wrapper.children = [
    {
      type: "element",
      tag: "svg",
      props: {},
      children: [],
      element: svg,
      owned: true,
    },
  ];
  ```

  The renderer mounts that element, never adopts a previously rendered element over it, and does not reconcile its children — so the subtree survives re-renders untouched while the surrounding tree updates normally.

  To replace the mounted element, supply a different element on a **fresh node object**: the reconciler pairs it with its predecessor and swaps, disposing the element it replaced so a widget's listeners and timers tear down rather than leaking. Mutating `element` on a node object the renderer has already mounted does nothing — that node reaches `updateExistingNode`, which leaves an owned element alone.

  Because an owned node's `tag`, `props` and `children` describe an empty shell, the element is the only description of the subtree, and server-side rendering reads `element.outerHTML`. An owner that cannot build an element without a DOM should emit no owned node at all rather than an elementless one.

  **The owned element is a trust boundary, and it points at the caller.** The framework's escaping covers `props`, `children` and text — none of which describe an owned element. It is mounted as built on the client and serialized as `outerHTML` on the server, so whatever nodes it holds become markup. Nothing sanitizes it in between, and nothing can: escaping would emit the owner's DOM as visible text, and sanitizing would corrupt legitimate widget output. Never build an owned element from unsanitized HTML — construct it node-by-node, or sanitize before it reaches an `innerHTML` sink, as `@tachui/symbols` does with icon bodies from pluggable icon sets.

  Two further limits, both now documented on `DOMNode.owned` and pinned by tests. **Modifiers on an owned node are client-only**: the element is the markup server-side, so the modifier pass never runs over it, which also means an owned node cannot be a fragment island and contributes no extracted CSS. And client-side they apply to the first mounted element only, since a `reactiveElement` swap disposes that element's cleanups and nothing re-applies them. Put modifiers on a wrapper instead — which is what `Symbol` does, and why it is unaffected by either.

  An owned swap also tears down the replaced node's _subtree_, not just its element. Keyless child matching is positional with no tag check, so a regular node carrying children can be paired against an owned one; without this its descendants' effects and listeners kept running on detached DOM and their nodes lingered in the renderer's maps.

  ## `reactiveElement`: the renderer subscribes, the component describes

  Replacement-on-a-fresh-node only fires when the parent re-renders, which is the wrong trigger for content that changes on its own schedule — an icon finishing an async load, say. The obvious workaround is worse: a component's `render()` does not run in its own reactive scope, so reading a signal there subscribes the _enclosing_ component and the whole surrounding subtree re-renders.

  `reactiveElement` closes that gap by giving the renderer an accessor instead:

  ```typescript
  { type: 'element', tag: 'svg', props: {}, children: [], reactiveElement: buildCurrentIcon }
  ```

  The renderer subscribes at mount and, when the accessor yields a different element, swaps the mounted one for it — running the replaced element's cleanups and keeping its own bookkeeping in step. This is the same mechanism a reactive `className` or `style` prop already uses: a per-element binding created inside the enclosing render pass, which dies with that pass and is rebuilt by the next one. The component reads no signals in `render()`, holds no scope of its own, and never touches the element the renderer built.

  `tag` names the slot rather than the current element, and must stay stable across renders so the reconciler pairs the node with its predecessor.

  A binding never survives adoption, whatever replaces the node. Left live it stays subscribed to its accessor, and the next change swaps against the element its _successor_ is now mounted on — detaching the successor and stranding its `nodeMap` entry. That is reachable in ordinary reconciliation, since keyless child matching is positional with no tag check.

  The binding is parented to the render pass that created it, so it dies when that pass re-runs and the next pass builds a fresh one. A caller that reuses the _same node object_ across passes outlives its own binding, and the reconciler's identity fast path routes that node to `updateExistingNode`, which leaves an owned element alone — so the renderer checks for a dead binding there and rebinds rather than leaving a slot nothing maintains.

  ## Reactive props now yield to external writes

  Two supporting changes, both needed for modifiers to coexist with content that repaints:

  - **`setElementStyles`** compared against the live DOM value, so a reactive style run re-asserted every property a modifier had changed — `frame({ width: 40 })` was clobbered back the moment an unrelated value updated. It now records what it wrote, read back off the element so browser normalisation of colours and lengths is absorbed, and skips a property whose live value it did not write. The reactive prop resumes control once that external value is removed.
  - **`applyClassName`** assigned `className`, dropping every class a modifier had added to the same element. It now diffs the class list.

  ## `DOMRenderer.disposeNode`

  Dispose a node and its descendants without removing them from the DOM, for callers that swap a whole subtree out themselves. `Show` and `ForEach` do exactly that and previously called `node.dispose` alone, which reaches only what a component put on the node — leaving the renderer's per-element cleanups running and its rendered-node set growing.

### Patch Changes

- [#325](https://github.com/tach-UI/tachUI/pull/325) [`d5cd030`](https://github.com/tach-UI/tachUI/commit/d5cd030464dee0be84b8a2c6013fed716e53f551) Thanks [@whoughton](https://github.com/whoughton)! - Accept CSS Color 4 syntax in `ColorAsset.validateColor` and gradient stop validation.

  `oklch()`, `oklab()`, `lab()`, `lch()`, `hwb()`, `color()` and the space-separated / slash-alpha forms of `rgb()` and `hsl()` no longer throw from the `ColorAsset` constructor. The legacy comma forms keep their range checks; the new forms are validated against a per-function grammar (angle units only in a hue slot: first in `hsl()`/`hwb()`, last in `lch()`/`oklch()`, never in `rgb()`, `lab()`, `oklab()` or `color()`) and otherwise left to the browser. `ColorValidationResult.format` gains the corresponding values.

  The space-separated `rgb()` / `hsl()` forms are also parsed by the transforms and by `opacity()`, so `rgb(255 0 0 / 50%)` brightens, saturates, rotates and re-alphas exactly like `rgba(255, 0, 0, 0.5)`; `none` channels (alpha included) compute as 0 per CSS Color 4 §4.4, percentage channels and `deg` / `grad` / `rad` / `turn` hues are converted, a bare S or L number reads as a percentage per §7.1, and out-of-range rgb channels clamp. `opacity()` on a modern `hsl()` emits the modern form (`hsl(359.9 33.33% 50% / 0.5)`) so fractional and out-of-range hues survive revalidation. Values the transforms cannot convert to sRGB (`oklch()`, `color()`, `var()`, …) pass through unchanged, as `var()` tokens already did. `GradientValidation.validateColor` defers to the same validator so the new syntax is accepted as a gradient stop too.

- [#325](https://github.com/tach-UI/tachUI/pull/325) [`7245d29`](https://github.com/tach-UI/tachUI/commit/7245d29aaf569483c16ff9d51788fb4815895caf) Thanks [@whoughton](https://github.com/whoughton)! - Add a gradient `interpolation` option and emit an sRGB fallback pair for it.

  `GradientColors` gains `interpolation?: 'srgb' | 'oklab' | 'oklch'`, emitted as an `in <space>` hint (`linear-gradient(in oklab to right, …)`). A browser that cannot parse the hint drops the whole declaration and the element gets no background at all, so anything other than `'srgb'` is written as a pair: the plain sRGB gradient first, the hinted one second. CSSOM rejects a value it cannot parse as a no-op, so the browser keeps whichever it understood.

  - `gradientToDeclarations(def)` returns that pair (length 1 for `'srgb'`); `gradientToCSS` keeps returning the single preferred string.
  - `GradientAsset`, `StateGradientAsset` and `ReactiveGradientAsset` gain `resolveDeclarations()`; `resolve()` is unchanged. The reactive option types accept `interpolation` too.
  - The background modifier writes every declaration in order at all three of its paths (static value, theme-reactive asset, stateful hover/active/focus/disabled), preferring `resolveDeclarations()` on an asset when present.
  - The SSR style shim appends repeated writes to a property instead of overwriting, and the serializer emits one entry per write, so `renderToString` output carries the same pair in one `style` attribute. A property genuinely overridden by a later modifier now emits both values; the cascade keeps the last, as it does on the client. A write whose `!important` priority differs from the stored value still overwrites, matching `setProperty`, so an inline `red !important` followed by a normal gradient renders the gradient on both server and client.
  - `CSSUtils.withFallback` emits the solid color, then the sRGB gradient, then the hinted one. `CSSUtils.toCustomProperties` always emits the sRGB form: a custom property cannot carry the pair, because an unsupported gradient only fails at `var()` substitution, where the using declaration becomes `unset` rather than falling back. It warns in development when the gradient explicitly asked for a non-sRGB interpolation.
  - A stateful background (`{ default, hover, … }`) rendered where there is no DOM element to attach listeners to, such as `renderToString`, now emits its resting `default` state. Previously the modifier threw a `ReferenceError` on the bare `HTMLElement` check under Node.

  The default interpolation is unchanged in this release step.

- [#305](https://github.com/tach-UI/tachUI/pull/305) [`985a84b`](https://github.com/tach-UI/tachUI/commit/985a84b800dab2413ca563bac943f9ca3efc41db) Thanks [@whoughton](https://github.com/whoughton)! - Fix nested reactive roots surviving their parent's disposal.

  Ownership was tracked through a single child registry, `OwnerImpl.sources`, typed `Set<Computation>`. Computations registered themselves into it from their constructor; owners never did. `createRoot` stored `this.parent` on the new owner, so the link was one-directional — a child knew its parent, a parent had no idea its child existed.

  A nested `createRoot` was therefore orphaned. Disposing the enclosing root never reached it, so its cleanups never ran **and its computations were never disposed**: they kept their signal subscriptions and kept executing after their owner was gone. Measured on a nested pair of effects reading one signal, disposing the outer root and then setting the signal twice:

  |              | runs recorded |
  | ------------ | ------------- |
  | outer effect | `[0]`         |
  | inner effect | `[0, 1, 2]`   |

  `OwnerImpl.dispose` ended with `this.parent.sources.delete(this as any)` — the deregistration half, written against a registration that did not exist, cast past the type error that would have caught it. It could never match.

  Owners now register with their parent through a dedicated `childOwners` set, and disposal walks the whole owner subtree deepest-first before disposing the owner's own computations and running its cleanups. Sibling roots dispose in creation order. Self-disposal deregisters from the parent, and a second dispose is still a no-op.

  Two consequences worth noting:

  - `createDetachedRoot` now means something. It clears the current owner so the new root has no parent; previously parentage conferred nothing, so a plain nested `createRoot` was already detached.
  - `createRoot` and `runWithOwner` now close any enclosing execution cleanup scope, so an `onCleanup` written directly in their body belongs to that owner rather than to whichever effect happened to be running.

  `Owner` in `@tachui/types` gains **optional** `childOwners?: Set<Owner>` and `dispose?(): void`. Both are optional so an `Owner` from an older runtime, a hand-rolled JS object, or a downstream structural implementation still satisfies the interface — `runWithOwner` is public and accepts any `Owner`. The core guards both members at runtime and degrades such an owner to the previous unparented behaviour rather than throwing before the root body runs. `dispose` was already assumed by `@tachui/core`'s `dispose(owner)` helper behind exactly such a guard.

  **Computations now open an owner scope for each execution.** Previously `ComputationImpl.execute()` restored `currentComputation` but not `currentOwner`, so once the flush arrived on a later microtask — the normal asynchronous case — `getOwner()` was null during a rerun and any root or nested effect created there was orphaned, surviving disposal of the enclosing root with its subscriptions live and its cleanups unrun.

  Each run now gets its own owner, parented to the computation's owner and disposed as part of that run's teardown. So anything created during a run dies with that run:

  ```typescript
  createEffect(() => {
    outer();
    // Disposed automatically when this effect reruns — no explicit disposer.
    createEffect(() => inner());
  });
  ```

  Parenting these children to the computation's own owner instead would have traded the orphan leak for an unbounded one, piling every rerun's children onto the root until the root died.

- [#328](https://github.com/tach-UI/tachUI/pull/328) [`2984b3c`](https://github.com/tach-UI/tachUI/commit/2984b3ccd461f7126acc9286f145d322d190373e) Thanks [@whoughton](https://github.com/whoughton)! - Bridge theme state to the DOM, so stylesheet theming and `Asset` theming stay in step.

  `setTheme()` wrote a signal and nothing else — no attribute, no class — and nothing in tachUI read one. `ColorAsset` theming and CSS-custom-property theming were therefore two independent systems: `setTheme('dark')` did not flip a stylesheet's variables, writing `data-theme="dark"` did not flip any `ColorAsset`, and an app using both had to drive them in lockstep by hand, with any divergence showing as a half-themed UI.

  The bridge now runs both ways through `data-theme` on `<html>`, exported as `THEME_ATTRIBUTE`. The name matches the convention CSS-side design systems already key off (`:root[data-theme="dark"]`), so an existing stylesheet and an existing pre-paint script work against tachUI unmodified — which is the point.

  - **Reflect**: `setTheme('light' | 'dark')` writes the attribute. `setTheme('system')` _removes_ it rather than writing `data-theme="system"`, because the attribute is an override and its absence is what lets `@media (prefers-color-scheme: dark)` apply.
  - **Observe**: the attribute is read at load, so an explicit choice a pre-paint script wrote is honoured from the first `getCurrentTheme()` with no boot-time `setTheme()` call, and a `MutationObserver` makes later external writes a reactive theme change that already-rendered components re-resolve in place. A `'system'` choice writes no attribute, so it still needs one `setTheme('system')` at boot until #309 changes the default preference.
  - **Follow the OS**: a `prefers-color-scheme` listener makes `'system'` live for rendered components. `getCurrentTheme()` always re-read the media query, but `getThemeSignal()` is a computed and `prefers-color-scheme` is not a signal, so anything already rendered cached the appearance it first painted with and never followed an OS flip.
  - **Native controls**: the CSS `color-scheme` property is written on `<html>` too, so scrollbars and form controls follow the theme rather than staying light under a dark UI (`'system'` maps to `light dark`). It is an inline style and so outranks author CSS, so it is written only once the theme system has actually been used — a `setTheme()` call, or a `data-theme` attribute already on the page; importing the package writes nothing. `configureTheme({ reflectColorScheme: false })` turns it off and clears what was written, for apps that declare `color-scheme` themselves.
  - **Precedence**, highest first: an explicit `data-theme` on `<html>` > the preference passed to `setTheme()` > `prefers-color-scheme` (consulted when the preference is `'system'`). The DOM outranks the preference so that an app already setting the attribute gets tachUI following along without calling a tachUI API at all.

  New: `THEME_ATTRIBUTE`, `configureTheme()` and the `ThemeConfiguration` type, `getThemePreference()` (the preference as stated, which a settings UI needs in order to show `system` as selected rather than what it resolved to), `startObservingThemeAttribute()` / `stopObservingThemeAttribute()` for hosts that tear down an instance without tearing down the document, and the `ResolvedTheme` type. Starting is idempotent and re-syncs from the attribute, since a write made while not observing leaves no mutation record to catch up on. `getCurrentTheme()`'s declared return type narrows from `Theme` to `ResolvedTheme` — it never could return `'system'`, so this only removes a branch that was already unreachable. The docs gain the attribute name, the precedence chain, and a pre-paint recipe for avoiding a flash of the wrong theme.

  Separately, `ColorAsset.validateColor()` now reports `format: 'custom-property'` for `var(--token)` and `format: 'color-mix'` for `color-mix(…)`, instead of bucketing both as `'named'`. Both are accepted as before; what changes is that a caller can now tell a literal colour apart from one only the browser can resolve, which `'named'` made indistinguishable.

## 0.8.32

### Patch Changes

- [#299](https://github.com/tach-UI/tachUI/pull/299) [`9ae49e0`](https://github.com/tach-UI/tachUI/commit/9ae49e04ebeaf6d5363d1f5cb85230010f9905c2) Thanks [@whoughton](https://github.com/whoughton)! - Remove `.transitions()`, which never did anything (#297).

  It was chainable, declared in the modifier types, and registered in the modifier registry — so calls resolved without error — but `AnimationModifier.apply` never read `props.transitions`. `Text('x').transitions({ opacity: { duration: 500 } })` left `element.style.transition` empty while the singular `.transition('opacity', 500, 'ease-in')` produced `opacity 500ms ease-in 0ms` on the same render.

  Removing it turns a silent no-op into a compile error. No capability is lost: `.transition()` is the working API and there was never a defined shape for `.transitions()`'s config, which was typed `any`. If a multi-property form is wanted it should be designed and implemented, not inherited from a placeholder.

## 0.8.31

## 0.8.30

## 0.8.29

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

## 0.8.25

## 0.8.24

## 0.8.23

### Patch Changes

- [#173](https://github.com/tach-UI/tachUI/pull/173) [`97ad059`](https://github.com/tach-UI/tachUI/commit/97ad059fd80122b84f938aeba5847b7984bacc5f) Thanks [@whoughton](https://github.com/whoughton)! - Fix SSR serialization recursion for component inputs that also expose `build()` by prioritizing component render dispatch and guarding against cyclic builder chains.

  Improve asset typing ergonomics by adding declaration-merging support for custom `Assets` keys via `CustomAssets`.

  Add `.compositingGroup()` modifier mapped to `isolation: isolate`, with non-colliding priority so isolation is applied before blend-mode modifiers.

  Make `FontAsset` loading SSR-safe by no-oping DOM-dependent load paths when `document`/`window` are unavailable (prevents eager Google font crashes during prerender).

## 0.8.22

### Patch Changes

- [#170](https://github.com/tach-UI/tachUI/pull/170) [`6fc0c1c`](https://github.com/tach-UI/tachUI/commit/6fc0c1cd732eb0a18a7886cb1666833542a0abc5) Thanks [@whoughton](https://github.com/whoughton)! - Fix SSR serialization recursion for component inputs that also expose a `build()` method by prioritizing component rendering and adding cyclic builder-chain detection. Adds regression coverage for mixed component/builder inputs and cyclic builder cases.

  Also add declaration-merging support for custom asset names via `CustomAssets` so consumers can strongly type known runtime-registered keys (for example declaring `sand: ColorAssetProxy` and then calling `Assets.sand.opacity(...)` with full type safety).

  Add a new `.compositingGroup()` modifier that maps to CSS `isolation: isolate`, including modifier registry wiring, blend-mode integration coverage, and an explicit non-colliding priority (`91`) so isolation is applied before blend-mode modifiers.

## 0.8.21

### Patch Changes

- [#163](https://github.com/tach-UI/tachUI/pull/163) [`711187b`](https://github.com/tach-UI/tachUI/commit/711187b7efa5820f05d6b8bcb396147e90b83d9d) Thanks [@whoughton](https://github.com/whoughton)! - Fixes sheet background scroll locking behavior with an explicit opt-out, resolves dynamic asset typing ergonomics for custom color assets, and adds new background/blend appearance modifier capabilities with follow-up type/export improvements.

## 0.8.20

### Patch Changes

- [#159](https://github.com/tach-UI/tachUI/pull/159) [`859a15a`](https://github.com/tach-UI/tachUI/commit/859a15a245cbde879a6dba2f74568d8881d74a4c) Thanks [@whoughton](https://github.com/whoughton)! - Fix and enhance navigation and asset behavior across the branch scope:

  - add directional sheet edge/size support (`top|bottom|left|right`, axis-aware sizing and drag)
  - add swipe-back gesture support and spring transition improvements in navigation
  - add tab badge support and fix badge reactivity/overlay behavior
  - add `.inspector()` support and dismissal correctness updates
  - fix navigation ComponentInstance compatibility issues and related modal mounting behavior
  - improve typed asset registration and make ColorAsset transforms chainable/theme-adaptive

## 0.8.19

### Patch Changes

- [#148](https://github.com/tach-UI/tachUI/pull/148) [`b2f2522`](https://github.com/tach-UI/tachUI/commit/b2f25224d7d33e249653f90a94091287c3506f47) Thanks [@whoughton](https://github.com/whoughton)! - Ship current ready work on this branch:

  - add the new `@tachui/ssr` package with `renderToString` and `prerender`
  - resolve SSR review findings around attribute serialization, route metadata, and test coverage
  - improve release dependency guard validation with semver-accurate peer range checks plus tools test coverage
  - include current navigation, data, and modifier/type fixes from linked issue work
  - add navigation modal enhancements: `confirmationDialog(...)` and environment `dismiss` support for sheet/full-screen/popover presentations

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

### Minor Changes

- [#102](https://github.com/tach-UI/tachUI/pull/102) [`078b01e`](https://github.com/tach-UI/tachUI/commit/078b01e574325d6d3e5eb6d90b81c7fad2cf39cf) Thanks [@whoughton](https://github.com/whoughton)! - Ship color-asset transform APIs and scaffold updates.

  - Add `ColorAsset` transform helpers: `opacity`, `saturate`, `brighten`, `rotateHue`, and `contrast` with deterministic range semantics and expanded format handling.
  - Add variadic `registerAsset(...)` batch registration support and tighten overload typing.
  - Update `@tachui/types` asset proxy typing to include the new color transform methods.
  - Update `@tachui/cli` starter templates to current TachUI APIs (`mountRoot`, modifiers preload, and `@tachui/primitives` button usage) and include required template dependencies.
  - Expand tests and docs for transform behavior, output normalization, and edge-case handling.

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
