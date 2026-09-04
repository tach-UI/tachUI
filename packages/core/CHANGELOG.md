# @tachui/core

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

- [#305](https://github.com/tach-UI/tachUI/pull/305) [`5cd2e02`](https://github.com/tach-UI/tachUI/commit/5cd2e0236f0336bf86d71744cb4b557145462c5d) Thanks [@whoughton](https://github.com/whoughton)! - Give effects execution-scoped cleanup, so a returned disposer runs before the next run (#270).

  `createEffect` had no per-execution cleanup. `onCleanup` registered on the **owner**, so it fired only when the root was disposed, and a function returned from an effect body was fed back in as `previousValue` and never invoked. A dependency change could not cancel anything the previous run had started — no aborting an in-flight request, no latest-request-wins, no retry-timer or subscription teardown.

  Two changes:

  - **A returned function is now a disposer.** It runs before the effect's next execution and again on final disposal, in that order. A returned non-function value still flows into the next run as `previousValue`.
  - **`onCleanup` inside a computation body is now execution-scoped.** It runs before that computation's next execution and again on disposal, instead of accumulating one entry per run on the owner and firing them all at the end. Outside a computation body — directly in a `createRoot` body, say — `onCleanup` stays owner-scoped and is unchanged.

  Cleanup ordering is deterministic: registration order, with a returned disposer last because it is registered when the body returns. A throwing cleanup is caught and reported, and does not strand the cleanups queued behind it or prevent the rerun.

  ```typescript
  createEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/item/${id()}`, { signal: controller.signal });

    // Aborts the previous request when `id` changes, and on disposal.
    return () => controller.abort();
  });
  ```

  **Breaking.** Any effect that returns a function and relies on receiving it back as `previousValue` changes behaviour: the function is now invoked as teardown before the next run and on disposal, and the next run receives `undefined` instead of it.

  The workspace was audited for this population before the change (#269). It found three effects returning a function, all of which returned a teardown closure that was previously swallowed, so all three leaked and none consumed `previousValue`. Two were production leaks that this change fixes: a `keydown` listener in `@tachui/mobile`'s `ActionSheet` and a `resize` listener in `@tachui/navigation`'s tab view.

  That audit covers this workspace only and cannot see published consumers. If you carry a function _as state_ through `previousValue`, wrap it so the return value is not itself callable:

  ```typescript
  // Before — the function is now treated as a disposer.
  createEffect((prev) => {
    const handler = prev ?? makeHandler();
    return handler;
  });

  // After — box it, so the effect returns a value rather than a function.
  createEffect<{ handler: Handler }>((prev) => {
    const handler = prev?.handler ?? makeHandler();
    return { handler };
  });
  ```

  There is no opt-out. Treating a returned function as a disposer is the decision recorded in ADR 0001, and a sentinel or branded return would leave the leaking-by-default shape reachable.

  Behaviour recorded before the change is in `graph-characterization.test.ts`; the new contract is pinned in `effect-cleanup.test.ts`.

### Patch Changes

- [#327](https://github.com/tach-UI/tachUI/pull/327) [`11a792d`](https://github.com/tach-UI/tachUI/commit/11a792db9d51db5182bc7877f5a8719c15fae11f) Thanks [@whoughton](https://github.com/whoughton)! - Name animation keyframes from their content, so they stop accumulating and SSR agrees with the client.

  `AnimationModifier` derived its `@keyframes` name from `componentId` and `Date.now()`, which minted a fresh name on every apply. Because `addKeyframesToStylesheet` appended to the shared `<style id="tachui-animations">` without deduping or cleanup, every re-render of an animated component left another block behind — five renders of one component produced five blocks — and the element moved to the newest name, so the earlier blocks were dead weight the browser still parsed. Nothing removed them on unmount.

  The same scheme also made the prerendered CSS unusable: `getStaticCSS` named from the selector while `apply` named from the clock, so the server's `@keyframes` was always orphaned and the client always re-injected its own.

  Names are now a hash of the keyframes' own content, via the new `createAnimationKeyframeRule` and `ensureAnimationKeyframes` exports on `@tachui/core/modifiers/base`. Identical keyframes resolve to one name and one block across renders, across components, and across server and client. Duration, easing, iteration count and direction are excluded from the hash — they belong to the element's `animation` shorthand rather than the keyframes block — so components sharing a keyframes object at different speeds share one block. The set of injected names is tracked on the stylesheet element under a registered symbol, so it is discarded exactly when the element is and is shared by all three `AnimationModifier` copies (`@tachui/core` plus both `@tachui/modifiers` builds) that write to it.

  Because content hashing makes a name a reliable statement about a block's contents, the client now also adopts animation keyframes it finds already in the document rather than duplicating them. `@tachui/ssr` emits each static rule in its own anonymous `<style>` rather than into `#tachui-animations`, so prerendered blocks were still being re-injected on hydration even once the names agreed.

  **Breaking for deep importers of `@tachui/core/modifiers/base`**, which is a published subpath export and so reaches beyond this repo: `collectStaticAnimationCSSRules` no longer takes a `createKeyframeRule` callback, deriving the name itself. Emitted keyframe names also change shape, from `tachui-animation-<componentId>-<timestamp>` and `tachui-animation-<selector>` to `tachui-animation-<hash>`. Nothing should depend on the old spelling — the client's was unpredictable by construction — but anything asserting on a literal keyframe name needs updating.

- [#325](https://github.com/tach-UI/tachUI/pull/325) [`d5cd030`](https://github.com/tach-UI/tachUI/commit/d5cd030464dee0be84b8a2c6013fed716e53f551) Thanks [@whoughton](https://github.com/whoughton)! - Accept CSS Color 4 syntax in `ColorAsset.validateColor` and gradient stop validation.

  `oklch()`, `oklab()`, `lab()`, `lch()`, `hwb()`, `color()` and the space-separated / slash-alpha forms of `rgb()` and `hsl()` no longer throw from the `ColorAsset` constructor. The legacy comma forms keep their range checks; the new forms are validated against a per-function grammar (angle units only in a hue slot: first in `hsl()`/`hwb()`, last in `lch()`/`oklch()`, never in `rgb()`, `lab()`, `oklab()` or `color()`) and otherwise left to the browser. `ColorValidationResult.format` gains the corresponding values.

  The space-separated `rgb()` / `hsl()` forms are also parsed by the transforms and by `opacity()`, so `rgb(255 0 0 / 50%)` brightens, saturates, rotates and re-alphas exactly like `rgba(255, 0, 0, 0.5)`; `none` channels (alpha included) compute as 0 per CSS Color 4 §4.4, percentage channels and `deg` / `grad` / `rad` / `turn` hues are converted, a bare S or L number reads as a percentage per §7.1, and out-of-range rgb channels clamp. `opacity()` on a modern `hsl()` emits the modern form (`hsl(359.9 33.33% 50% / 0.5)`) so fractional and out-of-range hues survive revalidation. Values the transforms cannot convert to sRGB (`oklch()`, `color()`, `var()`, …) pass through unchanged, as `var()` tokens already did. `GradientValidation.validateColor` defers to the same validator so the new syntax is accepted as a gradient stop too.

- [#325](https://github.com/tach-UI/tachUI/pull/325) [`0da0398`](https://github.com/tach-UI/tachUI/commit/0da03983bd74252a0ad917e7443b52781980b0bb) Thanks [@whoughton](https://github.com/whoughton)! - Run the `ColorAsset` numeric transforms in OKLab / OKLCH.

  `brighten`, `saturate`, `contrast` and `rotateHue` used to lerp gamma-encoded sRGB channels or round-trip through HSL, neither of which is perceptually uniform: the same nominal `brighten(0.3)` produced a 5x larger lightness step on maroon than on yellow, `rotateHue` swung OKLab lightness by 0.25 across a full wheel, and `saturate(-1)` turned yellow into a mid-gray far darker than the input. They now convert to OKLab, operate on L (brightness, contrast), C (saturation) or H (hue), and convert back. A result outside the sRGB gamut has its chroma reduced at constant lightness and hue rather than having channels clipped, so hue never drifts.

  Output format is unchanged (uppercase hex, or `rgba()` when alpha is present) and the anchors hold: `brighten(1)` / `brighten(-1)` reach white / black, `saturate(-1)` is the gray of the same lightness, `saturate(1)` is the most chromatic sRGB color at that lightness and hue, and `rotateHue(360)` and every zero-amount call are exact identities. The numeric result of every non-trivial call changes, so snapshots pinned to the old outputs need re-recording. Two anchors move: `contrast(-1)` now collapses to OKLab mid-gray `#636363` instead of `#808080`, and `saturate(1)` no longer jumps to the HSL-saturated (much lighter) color.

  Accepted-but-untransformable values (`var()`, `oklch()`, `color()`, and so on) still pass through unchanged.

- [#343](https://github.com/tach-UI/tachUI/pull/343) [`746b2be`](https://github.com/tach-UI/tachUI/commit/746b2bed20d71335f04e47097b135196d9f2caad) Thanks [@whoughton](https://github.com/whoughton)! - **Behaviour change:** the default theme now follows the OS. Apps that never call `setTheme()` will render their dark `ColorAsset` variants for users whose system prefers dark, where they previously always rendered light.

  The theme preference defaulted to `'light'`, and `getCurrentTheme()` consulted `prefers-color-scheme` only when the preference held the literal `'system'` — which nothing ever set. So a fresh app ignored the OS entirely:

  ```ts
  const hex = ColorAsset.init({
    name: "p",
    default: "#2A9D8F",
    light: "#2A9D8F",
    dark: "#5FD0C1",
  });

  detectSystemTheme(); // 'dark'   — correct
  getCurrentTheme(); // 'light'  — ignored it
  hex.resolve(); // '#2A9D8F', the LIGHT value, for a user who prefers dark
  ```

  Respecting the OS was effectively opt-in through an undocumented sentinel value, and the failure was silent — the app simply rendered in the wrong theme.

  The preference now defaults to `'system'`. Nothing else about resolution changes: an explicit `data-theme` on `<html>` still outranks it, `setTheme('light' | 'dark')` still pins an appearance, and `getThemePreference()` reports `'system'` unresolved so a settings UI can show it as selected.

  **What to check when upgrading.** If your app renders literal-valued `ColorAsset`s and has never called `setTheme()`, it will now render dark for dark-OS users. That is the intended behaviour, but it is a visible change. To keep the old behaviour, call `setTheme('light')` at startup.

  Note that this is invisible to most test suites: jsdom provides no `matchMedia`, so `detectSystemTheme()` reports light there regardless. Stub `matchMedia` if you want to exercise the dark path.

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

- [#325](https://github.com/tach-UI/tachUI/pull/325) [`7245d29`](https://github.com/tach-UI/tachUI/commit/7245d29aaf569483c16ff9d51788fb4815895caf) Thanks [@whoughton](https://github.com/whoughton)! - Add a gradient `interpolation` option and emit an sRGB fallback pair for it.

  `GradientColors` gains `interpolation?: 'srgb' | 'oklab' | 'oklch'`, emitted as an `in <space>` hint (`linear-gradient(in oklab to right, …)`). A browser that cannot parse the hint drops the whole declaration and the element gets no background at all, so anything other than `'srgb'` is written as a pair: the plain sRGB gradient first, the hinted one second. CSSOM rejects a value it cannot parse as a no-op, so the browser keeps whichever it understood.

  - `gradientToDeclarations(def)` returns that pair (length 1 for `'srgb'`); `gradientToCSS` keeps returning the single preferred string.
  - `GradientAsset`, `StateGradientAsset` and `ReactiveGradientAsset` gain `resolveDeclarations()`; `resolve()` is unchanged. The reactive option types accept `interpolation` too.
  - The background modifier writes every declaration in order at all three of its paths (static value, theme-reactive asset, stateful hover/active/focus/disabled), preferring `resolveDeclarations()` on an asset when present.
  - The SSR style shim appends repeated writes to a property instead of overwriting, and the serializer emits one entry per write, so `renderToString` output carries the same pair in one `style` attribute. A property genuinely overridden by a later modifier now emits both values; the cascade keeps the last, as it does on the client. A write whose `!important` priority differs from the stored value still overwrites, matching `setProperty`, so an inline `red !important` followed by a normal gradient renders the gradient on both server and client.
  - `CSSUtils.withFallback` emits the solid color, then the sRGB gradient, then the hinted one. `CSSUtils.toCustomProperties` always emits the sRGB form: a custom property cannot carry the pair, because an unsupported gradient only fails at `var()` substitution, where the using declaration becomes `unset` rather than falling back. It warns in development when the gradient explicitly asked for a non-sRGB interpolation.
  - A stateful background (`{ default, hover, … }`) rendered where there is no DOM element to attach listeners to, such as `renderToString`, now emits its resting `default` state. Previously the modifier threw a `ReferenceError` on the bare `HTMLElement` check under Node.

  The default interpolation is unchanged in this release step.

- [#325](https://github.com/tach-UI/tachUI/pull/325) [`df5c539`](https://github.com/tach-UI/tachUI/commit/df5c5390072163b73ef16509f569b517ce916ea4) Thanks [@whoughton](https://github.com/whoughton)! - Default gradient interpolation to OKLab. **This changes how existing gradients render.**

  Every gradient built from `LinearGradient`, `RadialGradient`, `AngularGradient`, `ConicGradient`, the repeating and elliptical variants, gradient presets and the reactive / state / theme gradient assets now interpolates `in oklab` unless it sets `interpolation` itself. The legacy sRGB default routes hue-distant stops through a desaturated gray midpoint; OKLab takes the perceptually straight path and, unlike OKLCH, never introduces a hue neither stop has.

  The rendered pixels move. The shift scales with how far apart the endpoints are in hue: a same-hue-family gradient is unchanged to within one 8-bit step, a teal → sand pair moves by up to 21 per channel at the midpoint. A gradient that is the visual spec of a design system should get a visual-regression pass, or pin `interpolation: 'srgb'` per gradient to keep its previous rendering exactly. No error, warning or deprecation is emitted for the change.

  Because the default is no longer `'srgb'`, every gradient now emits the sRGB fallback declaration ahead of the hinted one at each emission site, so browsers without OKLab gradient support (before Chrome 111, Firefox 113 and Safari 16.2) keep rendering the sRGB gradient. Server-rendered output carries the same pair.

  `gradientToCSS` now returns the hinted string for an unhinted definition. `CSSUtils.toCustomProperties` is the one helper that stays sRGB-only: a custom property cannot carry a fallback past `var()` substitution.

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

- Updated dependencies [[`d5cd030`](https://github.com/tach-UI/tachUI/commit/d5cd030464dee0be84b8a2c6013fed716e53f551), [`1fe6910`](https://github.com/tach-UI/tachUI/commit/1fe69104fadafa3663163b2d749e963b84620427), [`7245d29`](https://github.com/tach-UI/tachUI/commit/7245d29aaf569483c16ff9d51788fb4815895caf), [`985a84b`](https://github.com/tach-UI/tachUI/commit/985a84b800dab2413ca563bac943f9ca3efc41db), [`2984b3c`](https://github.com/tach-UI/tachUI/commit/2984b3ccd461f7126acc9286f145d322d190373e)]:
  - @tachui/types@0.9.0
  - @tachui/registry@0.9.0

## 0.8.32

### Patch Changes

- [#299](https://github.com/tach-UI/tachUI/pull/299) [`9ae49e0`](https://github.com/tach-UI/tachUI/commit/9ae49e04ebeaf6d5363d1f5cb85230010f9905c2) Thanks [@whoughton](https://github.com/whoughton)! - Deprecate the enhanced reactive branch, which does not track dependencies (#271).

  `createEnhancedEffect` never re-runs when a signal it read changes: `EnhancedEffect.execute` resolves `(this as any).setCurrentComputation` — a member that does not exist — and falls back to a no-op. Measured on the same shape:

  |                                   | after create | after set |
  | --------------------------------- | ------------ | --------- |
  | standard signal + standard effect | 1            | 2         |
  | enhanced signal + enhanced effect | 1            | 1         |
  | standard signal + enhanced effect | 1            | 1         |

  The effect is the broken half; the signal type makes no difference. Reads and writes appear to succeed and nothing downstream updates, which makes this dangerous to build a data or communications layer on.

  `createEnhancedSignal` and `createEnhancedEffect` now carry `@deprecated` tags and warn once per symbol at runtime, naming the standard replacement. The migration codemod previously rewrote `createSignal` → `createEnhancedSignal` and `createEffect` → `createEnhancedEffect`, making its output strictly more broken than its input; those two rewrites are removed.

  Behaviour is otherwise unchanged — the exports still exist and still do what they did. Removal is scheduled for 0.9.0, gated on the characterization in #269 and the version-line procedure in #264.

- [#299](https://github.com/tach-UI/tachUI/pull/299) [`9ae49e0`](https://github.com/tach-UI/tachUI/commit/9ae49e04ebeaf6d5363d1f5cb85230010f9905c2) Thanks [@whoughton](https://github.com/whoughton)! - Remove `.transitions()`, which never did anything (#297).

  It was chainable, declared in the modifier types, and registered in the modifier registry — so calls resolved without error — but `AnimationModifier.apply` never read `props.transitions`. `Text('x').transitions({ opacity: { duration: 500 } })` left `element.style.transition` empty while the singular `.transition('opacity', 500, 'ease-in')` produced `opacity 500ms ease-in 0ms` on the same render.

  Removing it turns a silent no-op into a compile error. No capability is lost: `.transition()` is the working API and there was never a defined shape for `.transitions()`'s config, which was typed `any`. If a multi-property form is wanted it should be designed and implemented, not inherited from a placeholder.

- Updated dependencies [[`9ae49e0`](https://github.com/tach-UI/tachUI/commit/9ae49e04ebeaf6d5363d1f5cb85230010f9905c2)]:
  - @tachui/types@0.8.32
  - @tachui/registry@0.8.32

## 0.8.31

### Patch Changes

- [#263](https://github.com/tach-UI/tachUI/pull/263) [`fae8633`](https://github.com/tach-UI/tachUI/commit/fae86338af75e0cfcc37f9f74b494a11092b29a2) Thanks [@whoughton](https://github.com/whoughton)! - Fix the quick start so a new user's first code compiles (#236), and clear the post-bun-migration doc rot (#221).

  The README told users to import `Text`, `Button` and `VStack` from `@tachui/core`, which stopped exporting them in the 0.8 modular split — every component import in the first sample failed with TS2305. The sample now uses the two-package shape, ends in a real `mount()` call so it actually renders, and carries a version note so pre-0.8 tutorials stop regenerating broken imports.

  That sample is now executed as a test (`packages/core/__tests__/integration/readme-quick-start.test.ts`), so it cannot drift from the API again without CI failing.

  Docs-only otherwise: no runtime change in this release beyond the accompanying `mount()` work.

- [#263](https://github.com/tach-UI/tachUI/pull/263) [`fae8633`](https://github.com/tach-UI/tachUI/commit/fae86338af75e0cfcc37f9f74b494a11092b29a2) Thanks [@whoughton](https://github.com/whoughton)! - Retire the "Phase 3.1.2" placeholder exports and ship a real application entry point (#237, #226).

  **`@tachui/core` — `mount()` is now real.** `mount(root, target?)` renders the app and returns a dispose function that unmounts it and tears down its reactive root. The target accepts an element or a CSS selector and defaults to `'#app'`. A missing target now throws naming the selector that missed, instead of rendering nothing. `unmount(target?)` disposes the app mounted at a target for callers that did not keep the dispose function.

  `mountRoot()` still works and now delegates to `mount()`, so existing bootstraps are unaffected. It is deprecated in favour of `mount()`.

  **Breaking:** `mount`, `unmount`, `updateProps`, `memo` and `lazy` were previously exported from `@tachui/core` as empty functions. `mount` and `unmount` are now real; `updateProps` and `memo` are removed rather than left as silent no-ops, and importing them is now a compile error instead of a call that does nothing. `lazy` is unaffected in practice — the real implementation in `runtime/lazy-component` already shadowed the placeholder at the package root.

  `updateProps` has no replacement yet: `PropsManager.setProps` exists but is unreachable from a `ComponentInstance`. Tracked on #237.

  **`@tachui/forms` — breaking:** `useFormState()` and `useFormValidation()` returned `{}`. They shadowed the real form-state engine in the same package and are removed; use `createFormState`, `createField` or `createMultiStepFormState`. The `FormStateManager` and `FormUtilOptions` type aliases, both `any`, are removed with them.

  **`@tachui/cli`:** `analyze-imports --fix` printed per-optimization success ticks and "Applied N optimizations successfully!" without modifying a single file. It now reports the optimizations it would make and states plainly that nothing was written and the changes are manual.

- Updated dependencies []:
  - @tachui/types@0.8.31
  - @tachui/registry@0.8.31

## 0.8.30

### Patch Changes

- [#251](https://github.com/tach-UI/tachUI/pull/251) [`de58dac`](https://github.com/tach-UI/tachUI/commit/de58dac18bc26c1d1c0a3cc15472e3d2cde92bf7) Thanks [@whoughton](https://github.com/whoughton)! - Stop copying and priority-sorting modifier arrays on every node render (#220): `applyModifiersSequential` and the batch path now share a `WeakMap`-memoized sorted array keyed on the source array identity, so stable renders pay neither the array copy nor the O(n log n) sort.

  Modifier arrays are appended to in place after construction — by the modifier builder, and post-construction by `Image.scaledToFit`/`scaledToFill` and `Grid`'s item animations — so identity alone is not a sufficient cache key. The cache also records the source length and re-sorts when it changes; every modifier-array mutation in the tree is an append, so this is sound and O(1). Without it a warm cache silently drops modifiers pushed between renders.

  The batch path no longer re-sorts each type group. Group arrays are allocated fresh per call and could never hit the cache, so grouping now fills from the memoized sorted array instead. Application order is unchanged in both dimensions: groups are still applied in the order their type first appears in the caller's array, and modifiers within a group are still applied in priority order.

- [#251](https://github.com/tach-UI/tachUI/pull/251) [`4a8d3a8`](https://github.com/tach-UI/tachUI/commit/4a8d3a8aa5293ddd5e4698c0cfe21a52327fe972) Thanks [@whoughton](https://github.com/whoughton)! - Fix `createReactiveComponent` skipping its first render (#238): the props-tracking effects were created _inside_ the render function, so they re-ran on every pass and re-captured `previousProps` before the `shouldUpdate` guard evaluated. The guard therefore compared the props to themselves and returned an empty render result.

  The lifecycle tracking effects are now created once per instance, and `previousProps` is snapshotted after a successful render rather than mid-pass. `previousProps` is `undefined` on the first pass, so the guard naturally applies to re-renders only and the first render always executes.

  This also fixes two consequences of the per-render effect creation: effects accumulated on every render pass without ever being disposed, and each new effect fired `onUpdate` against the snapshot the previous one had just written — so `onUpdate` was called on every render even when no prop had changed.

- Updated dependencies []:
  - @tachui/types@0.8.30
  - @tachui/registry@0.8.30

## 0.8.29

### Patch Changes

- [#246](https://github.com/tach-UI/tachUI/pull/246) [`6a45ba3`](https://github.com/tach-UI/tachUI/commit/6a45ba3e75bbde9f0fa6e2636f5a6e7d7e7a2019) Thanks [@whoughton](https://github.com/whoughton)! - Fix reactive error isolation (#217): a single throwing effect no longer aborts the update flush (remaining computations in the batch now complete, matching the `MicrotaskScheduler`'s per-task isolation), and a throwing computation is no longer permanently disposed — it stays subscribed to the sources it read before throwing and re-runs on their next change, so a transient error is recoverable. Errors are reported via `console.error` at both isolation layers; synchronous callers (computed reads, initial effect runs) still receive the thrown error. Note: this supersedes the v2.0 semantics where effect errors propagated out of `flushSync()` — they are now isolated and reported instead.

- Updated dependencies []:
  - @tachui/types@0.8.29
  - @tachui/registry@0.8.29

## 0.8.28

### Patch Changes

- [#240](https://github.com/tach-UI/tachUI/pull/240) [`d4c6f85`](https://github.com/tach-UI/tachUI/commit/d4c6f85f8a706076cfc47e0e58f76ac39b346513) Thanks [@whoughton](https://github.com/whoughton)! - Fix state subsystem bugs surfaced by re-enabling the core state-management suite (#219): `@ObservedObject` and `@EnvironmentObject` factories now resolve the component context through the canonical `ComponentContextSymbol` instead of duplicate locally-defined symbols (their runtime path previously always threw); `ObservableObjectBase.objectWillChange` now exposes the callable `Signal` getter its consumers expect; the `makeObservable` proxy answers `in` checks so `isObservableObject()` recognizes its own output; `useEnvironmentObject` and `EnvironmentObjectImpl.resolveEnvironmentObject` invoke the accessor returned by `useContext` instead of returning it as the value (fixes #239); and the `isState` type guard no longer matches bindings.

- [#241](https://github.com/tach-UI/tachUI/pull/241) [`547c82e`](https://github.com/tach-UI/tachUI/commit/547c82e61e9f92da31b0cdceece66fe65da7283a) Thanks [@whoughton](https://github.com/whoughton)! - Fix interaction modifier listener leaks (#216): `onHover`, `onContinuousHover`, `onLongPressGesture`, and `InteractionModifier` (`.onTap()`, `.onHover()`, gestures, keyboard, scroll, etc.) now return a `ModifierResult` whose `cleanup` removes every registered DOM event listener — including document-level keyboard shortcut listeners — when the component unmounts. The modifier registry (`applyModifiersSequential`, batch path, and `combineModifiers`) now harvests `ModifierResult` returns and chains their cleanup onto `node.dispose`, which the renderer already drains on teardown. Listener teardown is double-dispose safe.

- [#242](https://github.com/tach-UI/tachUI/pull/242) [`112d9c5`](https://github.com/tach-UI/tachUI/commit/112d9c551cc71669591678c32ef55ffe9c410fd2) Thanks [@whoughton](https://github.com/whoughton)! - fix(release): publish versioned internal dependency ranges

  Rewrites the `workspace:*` internal dependency ranges to concrete
  versioned ranges so published manifests are installable from npm.
  `@tachui/core@0.8.27` and `@tachui/primitives@0.8.28` (the current
  `latest` tags) shipped `workspace:*` dependencies and are uninstallable
  outside the monorepo (#235). The release pipeline now rewrites workspace
  ranges during versioning and rejects non-publishable protocols before
  any future publish.

- Updated dependencies [[`112d9c5`](https://github.com/tach-UI/tachUI/commit/112d9c551cc71669591678c32ef55ffe9c410fd2)]:
  - @tachui/registry@0.8.28
  - @tachui/types@0.8.28

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
  - @tachui/registry@0.8.27
  - @tachui/types@0.8.27

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
