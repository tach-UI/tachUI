# @tachui/modifiers

## 0.11.7

### Patch Changes

- Updated dependencies [[`1e8bf73`](https://github.com/tach-UI/tachUI/commit/1e8bf73780e3ae779ca4e6d679409b98f1cd619d)]:
  - @tachui/core@0.11.7
  - @tachui/registry@0.11.7
  - @tachui/types@0.11.7

## 0.11.6

### Patch Changes

- [#416](https://github.com/tach-UI/tachUI/pull/416) [`25c07ae`](https://github.com/tach-UI/tachUI/commit/25c07ae8bb15bb3bc35e786dd2ee5bfbfc70b83a) Thanks [@whoughton](https://github.com/whoughton)! - `.fontWeight()` and `.font({ weight })` typecheck with any numeric weight, such
  as `590`.

  CSS `font-weight` takes any number from 1 to 1000, and the `fontWeight` factory
  and the runtime already did, but the chain and the font options were typed for
  the named weights and the hundreds, so a variable-font weight needed a cast.
  The `weight` field of the font options, in `@tachui/types` and in
  `@tachui/modifiers/types`, now takes `FontWeight | number`. The `FontWeight`
  alias itself is unchanged, and unknown string weights are still rejected.

- [#415](https://github.com/tach-UI/tachUI/pull/415) [`68dfd91`](https://github.com/tach-UI/tachUI/commit/68dfd9177f417ea11265574c230c82b7e2f009a8) Thanks [@whoughton](https://github.com/whoughton)! - `.offset(x, y)` typechecks with a numeric signal on either axis.

  The runtime already followed a signal, and the factory's own example showed
  one, but the factory, `OffsetOptions` and the layout `offset` prop were typed
  for numbers only, so `Text('x').offset(xSignal, 0)` needed a cast. Each now
  takes `number | Signal<number>`. Strings and non-numeric signals are still
  rejected, and the `offset(x, y)` factory in `effects/transforms` is unchanged.

- Updated dependencies [[`a5016c8`](https://github.com/tach-UI/tachUI/commit/a5016c8f94ad4409e439600c6ba538d8707a63c8), [`25c07ae`](https://github.com/tach-UI/tachUI/commit/25c07ae8bb15bb3bc35e786dd2ee5bfbfc70b83a), [`68dfd91`](https://github.com/tach-UI/tachUI/commit/68dfd9177f417ea11265574c230c82b7e2f009a8), [`cdc34b2`](https://github.com/tach-UI/tachUI/commit/cdc34b2be48a3979da71d40c18756e467b932b07)]:
  - @tachui/core@0.11.6
  - @tachui/types@0.11.6
  - @tachui/registry@0.11.6

## 0.11.5

### Patch Changes

- [#394](https://github.com/tach-UI/tachUI/pull/394) [`42e2555`](https://github.com/tach-UI/tachUI/commit/42e2555028b3bb8d9b121da8a849e4c06dd3b258) Thanks [@whoughton](https://github.com/whoughton)! - `clipShape()` accepts a shape instance, and `'circle'` clips to the inscribed
  circle.

  `.clipShape(Circle())` now works as written in SwiftUI, alongside the existing
  string names. A shape serializes itself through the `Shape` contract's
  `clipPath()`, so the modifier stays ignorant of shape kinds and no SVG clip
  machinery is involved — and the dependency edge keeps pointing the right way,
  since `@tachui/primitives` depends on `@tachui/modifiers` rather than the
  reverse. Anything implementing `Shape` clips, including a user-supplied one.

  `clipShape('circle')` emits `circle()` where it used to emit `circle(50%)`.
  CSS resolves a percentage circle radius against the box's normalized diagonal
  rather than its short side, so the old value overshot in any box that was not
  square; the two agree in a square box, which is why it went unnoticed. This is
  a visual change for a non-square clipped box, in the direction of what SwiftUI
  draws and what `Circle()` itself renders.

  Insets do not carry into the clip: `.clipShape(Circle().inset(4))` clips as
  though uninset, because CSS basic shapes have no inset form. `Shape.clipPath`
  records why and how to add it later. A signal-driven radius does carry, though
  — the modifier applies in a tracked scope, so `.clipShape(RoundedRectangle(r))`
  restyles the clipped element when `r` changes, keeping the clip in step with
  the drawn path.

  The props form (`{ clipShape: { shape } }`) accepts an instance too, and both
  paths now share one serializer rather than carrying a copy of the switch each.

- [#408](https://github.com/tach-UI/tachUI/pull/408) [`59a1495`](https://github.com/tach-UI/tachUI/commit/59a149583c907d37954f557921e9634f17c874db) Thanks [@whoughton](https://github.com/whoughton)! - `.css()` takes a `Signal` for any value and updates that property in place,
  as `CSSStyleProperties` already declared. `.cssProperty()` and
  `.cssVariable()` take one too.

  The builder published at `@tachui/modifiers/types` typed each `.css()` value
  as `string | number | undefined`, so a reactive value was a type error, and
  the modifier read every signal once in its constructor, so one passed anyway
  froze at its first value. Signals are now kept and bound like the typed
  modifiers bind theirs. That matters most for values with no typed modifier:
  a layered `background`, `text-decoration`, `outline`, `box-shadow`.

  Numbers are also converted the same way for static and reactive values: a
  number becomes pixels except on unitless properties. Before, `.css()` turned
  every static number into pixels itself, so `.css({ opacity: 0.5 })` wrote
  `0.5px`, which the browser ignores. The list of unitless properties is now
  complete and shared by every modifier. It covers the grid lines (`gridRow: 2`),
  `scale`, `zoom`, `aspect-ratio`, `animation-iteration-count`, the SVG
  opacities and the rest, which used to get `px` and be dropped.

  A signal of `string | number` is accepted too, for values such as `16` that
  become `'1rem'`, and so is one that can be empty. A signal that yields `null`
  or `undefined` clears the property instead of writing the text `"undefined"`. That text is stored by a
  custom property, which passes it to every `var()` that reads it, and ignored
  by a standard one, which leaves the old value in place. This applies to every
  modifier's reactive styles, not only `.css()`.

  `.css()` copies the object it is given, so changing the object afterwards no
  longer changes the modifier. It skips a key that is a rule (`@media`,
  `@supports`, `:hover`, `&::before`) and a value that is an object or an array,
  since no inline style can hold either, and warns about them in development.
  A browser dropped the rules anyway. A custom property would have stored an
  object as `[object Object]`.
  A vendor-prefixed name written in lowercase, the usual CSSOM spelling, now gets
  its leading dash: `webkitLineClamp` becomes `-webkit-line-clamp`, and
  `msFilter` becomes `-ms-filter`. Only a capital (`WebkitFilter`) used to add
  it, and a browser drops a prefixed property that has no dash. Every modifier
  converts names this way, and several write lowercase `webkit` names
  themselves. Those declarations never reached the element:
  `.lineClamp()`'s `-webkit-line-clamp` and `-webkit-box-orient`, gradient text's
  `-webkit-background-clip` and `-webkit-text-fill-color`, Safari's
  `-webkit-backdrop-filter`, and `-webkit-hyphens`.
  `cssVendor()` takes a signal like the other CSS modifiers.

- [#408](https://github.com/tach-UI/tachUI/pull/408) [`6a5f04a`](https://github.com/tach-UI/tachUI/commit/6a5f04a175e853c9924bdd791f554c4a7265b209) Thanks [@whoughton](https://github.com/whoughton)! - Chain methods are now type-checked. `ModifierBuilder` ended in
  `[key: string]: any`, so every chain call typechecked as `any`, including a
  misspelled method, wrong arguments, or a modifier no package had typed. That
  fallback is gone.

  A method is now typed if core declares it or if the package that registers it
  adds it. Each registering module adds its modifiers to `ModifierBuilder` by
  augmenting `@tachui/types/modifiers`, with signatures derived from the
  registered factories through the new `ModifierMethodsOf` and
  `ModifierFactoriesOf` helpers. A method is therefore typed exactly when
  importing its package registers it, and its parameters can't drift from its
  factory. About 150 registered modifiers had no declaration anywhere, including
  the aria helpers, `role`, most padding and margin sides, the touch handlers,
  and the whole effects set. They are all typed now. The separate
  `ModifierBuilder` that `@tachui/modifiers/types` declared is replaced by a
  re-export of the one interface.

  A chain on a component returns that component, as the runtime does, so a
  modified component can be a child: `VStack({ children: [Text('a').padding(4)] })`.
  A chain on `.modifier` returns the builder until `.build()`.

  Typing them exposed some runtime bugs:

  - `margin(signal)` treated the signal as its options object and set no margin.
    It now follows the signal, as `padding(signal)` does.
  - Navigation's tab views, stacks, links and split view called basic modifiers
    without loading them, so they only worked if the app had. They now import
    `@tachui/modifiers/preload/basic`, and navigation's build keeps every
    `@tachui/*` import external. It used to bundle what it imported beyond
    `@tachui/core` and `@tachui/primitives`, which would have given it a private
    registry that the app's builder never reads.
  - Navigation's builder methods (`.navigationTitle()`, `.toolbarBackground()`
    and the rest) were missing from the published build: they were a module
    side effect, and the bundler dropped them. They are now installed by an
    explicit call from the package's entry points, on the app's builder from
    `@tachui/core/modifiers`. A `dist` check in `test:ci` covers all of this.

  Typing also required two small changes in navigation. A tab view now
  normalizes a tab button's render result to an array before mapping it, as the
  declared return type requires. The split view now applies the detail column's
  `maxWidth` only when one is configured, so an unset width still writes nothing
  inline.

  Navigation's own builder augmentation targeted `@tachui/core`, which re-exports
  the interface through `export *`, a path augmentation cannot reach. It now
  targets `@tachui/types/modifiers`. Grid, responsive, viewport, mobile, forms,
  fragments and navigation now depend on `@tachui/types` directly, because their
  published declarations reference it.

  The size modifiers (`width`, `height`, `minWidth`, `maxWidth`, `minHeight`,
  `maxHeight`) and the `padding` and `margin` families accept a signal in their
  types, as they already did at runtime.

  Some typed signatures change where the old ones were wrong:

  - `refreshable` takes its options object, `{ onRefresh, … }`. The old type
    took a bare function, which failed at runtime on the first pull.
  - `transition` also takes its object form, `{ property, duration, easing,
delay }`, which the runtime always accepted.
  - `.transform()` is typed for a string. The basic and effects modifiers both
    register `transform`, and whichever loads first is what the chain calls. The
    effects version now also takes a string (it used to throw during render),
    so a string works in either order. Its configuration form is available by
    calling the factory directly, or through `.scale()`, `.rotate()` and the
    other transform modifiers.
  - `.asHTML()` is written out, not derived, so its security notice appears
    where it is called.

  The error for a modifier missing from the registry now names the right
  imports: it used to suggest `@tachui/modifiers` even for grid, navigation or
  forms modifiers.

  Six chain methods that are registered, and now typed, used to throw when
  called: `.onAppear()`, `.onDisappear()`, `.refreshable()`,
  `.customProperty()`, `.customProperties()` and `.cssVariables()`. Each had a
  leftover "moved to another package" stub on the builder, which the chain
  finds before the registry. The stubs are gone, so these resolve from the
  registry like every other registered modifier. Ten transition presets
  (`fadeTransition`, `buttonTransition` and the rest) were declared on the
  builder but never implemented anywhere, so calling one threw a `TypeError`.
  They are no longer declared.

- [#397](https://github.com/tach-UI/tachUI/pull/397) [`2593ced`](https://github.com/tach-UI/tachUI/commit/2593ced011ce4148199028edf401156888865660) Thanks [@whoughton](https://github.com/whoughton)! - Test-only: the overlay suites run against a real DOM in the package's own
  runner.

  `__tests__/setup-enhanced.ts` replaces `global.document` with a hand-rolled
  mock whose `appendChild` is a no-op spy and which exposes no `children`. The
  overlay modifier builds a layer element and walks the resulting tree, so it
  cannot work against a mock of that shape: `bun run --filter @tachui/modifiers
test` failed 82 of 1128, and the package's `valid` script with it, while the
  root runner — which uses the shared jsdom setup — passed all of them.

  The overlay suites now run as their own project on that shared setup, so the
  package-local run agrees with the root one. No source or behaviour change.

- [#384](https://github.com/tach-UI/tachUI/pull/384) [`e8607d0`](https://github.com/tach-UI/tachUI/commit/e8607d02a149147226c38d4545c432fa34624693) Thanks [@whoughton](https://github.com/whoughton)! - `overlay()` now proposes the host's bounds to its content, as SwiftUI's
  `.overlay(alignment:)` does.

  The overlay container used to shrink to fit its content and was centered with
  `top: 50%; left: 50%; transform: translate(-50%, -50%)`. A child sized to
  `100%` resolved to 0x0 inside it and drew nothing unless the host's size was
  repeated with `.frame()`. The container is now a layer covering the host: a
  grid with one definite `100%` x `100%` cell, with the alignment expressed as
  the item's placement in that cell. Content with an intrinsic size sits where it
  did before and keeps its size, overflowing the host if larger, as a SwiftUI
  proposal is advisory; content sized to `100%` fills the host. Content with
  more than one item layers in that one cell, as SwiftUI layers an overlay's
  views, instead of each item taking a row of its own and the later ones
  landing outside the host. That includes a `ForEach` or `Show`, whose items
  sit inside a `display: contents` shell that generates no box of its own, and
  it keeps up with a list that changes size after it is mounted.

  Alignment follows the writing direction, so a `trailing` badge lands on the
  inline end rather than always on the right. Offsets stay physical.

  Offset semantics are pinned down at the same time, and both forms move the
  content by adjusting the layer's edges rather than translating it, so a
  negative value is honoured and an inward move never pushes a host-sized box
  past the host.

  - A numeric offset insets the content from every edge it is anchored to, so a
    corner alignment is inset on both axes; previously only the vertical edge
    moved. Negative moves outward.
  - An `{ x, y }` offset moves the content right and down, negative left and up.
    Previously it was added to whichever of `left` or `right` happened to be
    set, so its direction depended on the alignment.

  `overlay(content, alignmentSignal)` is now accepted by the types; it already
  worked at runtime. An alignment string that names an inherited object key no
  longer bypasses the center fallback.

  The unused `overlay` prop on `AnimationModifierProps` is removed, along with
  the two private copies of the old container logic behind it. Nothing
  constructed it, and the copies never rendered their content.

- [#385](https://github.com/tach-UI/tachUI/pull/385) [`3242516`](https://github.com/tach-UI/tachUI/commit/3242516a36ef4456652791e1d27f33a87a972b11) Thanks [@whoughton](https://github.com/whoughton)! - Two corrections to the overlay layer.

  **Items that arrive after mount are layered however they arrive.** The layer
  watched its content only when that content could obviously grow, meaning a
  `Show` or `ForEach` shell, or more than one item already present. A component
  whose `render()` returns one root and later two appends its second item
  straight to the layer, which the check could not see coming, so that item
  auto-placed into a row below the host instead of layering. The layer is
  watched unconditionally now. The saving the check bought was illusory: the
  cost that had prompted it was a `getComputedStyle` call, since removed.

  **Inline-axis offsets follow the writing direction, as alignment already
  did.** Alignment is expressed logically, so `trailing` lands on the physical
  left in a right-to-left host, but offsets were written to the physical `left`
  and `right`. A numeric inset therefore moved the opposite edge from the one
  the content was anchored to, and an `{ x }` offset moved it the wrong way.
  Both now use logical inset properties, so positive `x` is rightward in a
  left-to-right host and leftward in a right-to-left one. Nothing changes for
  left-to-right content.

- [#397](https://github.com/tach-UI/tachUI/pull/397) [`1f9de1f`](https://github.com/tach-UI/tachUI/commit/1f9de1fc374c166668b73575c244e565f6a0fb7d) Thanks [@whoughton](https://github.com/whoughton)! - The server overlay keeps a content node's declared style whatever shape it is
  in.

  Placing two or more overlay items in the layer's one cell spread
  `props.style` as though it were always an object. It is not: the serializer
  and the client renderer both accept a CSS string or a signal of either, and
  core ships string-styled nodes. Spreading a string enumerated its character
  indices and spreading a signal enumerated its own properties, so the
  declaration was replaced with garbage:

  ```html
  <span style="0:c;1:o;2:l;3:o;4:r;5::;6:r;7:e;8:d;grid-area:1 / 1"></span>
  ```

  A string style is now kept and the placement appended to it, and a signal is
  resolved with the same untracked read the rest of the path uses. The
  `display: contents` shell check reads the declared style the same way, so a
  shell styled with a string is recognised — missing it left the items unlayered
  on the server while the client, reading `display` off the applied element,
  still descended into them.

- [#397](https://github.com/tach-UI/tachUI/pull/397) [`51cee06`](https://github.com/tach-UI/tachUI/commit/51cee060d97f5172bf2f00888cef2570efbb7171) Thanks [@whoughton](https://github.com/whoughton)! - `overlay()` serializes its layer and content server-side.

  The overlay built its layer as DOM, so on a server it emitted nothing at all —
  for every content form, not just components. Static markup carried the host
  with no overlay, and the overlay appeared only once scripts ran.

  With no DOM to build into, the modifier now describes the layer as nodes
  instead: the host is marked a positioned container, and the layer, its
  alignment and offset styles, and the content are appended as children. The
  base styles and the alignment/offset resolution are shared with the DOM path
  rather than restated, so the two cannot disagree about placement, writing
  direction or an offset — a disagreement would show as the overlay jumping when
  the client takes over. Multiple items still share the layer's one grid cell,
  descending through a `display: contents` shell as the DOM walk does.

  What the server path leaves out: the content observer, which watches for items
  appearing later and has nothing to watch here, and the mount bookkeeping,
  which exists to tear DOM down. A raw DOM element as content describes as
  nothing, since there is no DOM server-side to describe.

- [#405](https://github.com/tach-UI/tachUI/pull/405) [`5c4eddb`](https://github.com/tach-UI/tachUI/commit/5c4eddbb5a1af5a0283268249a20f093c6dc0b11) Thanks [@whoughton](https://github.com/whoughton)! - `.rotationEffect(angle, anchor?)` works on the component chain.

  It was declared on the modifier builder and documented, and
  `AnimationModifier` already knew how to apply it, but no factory was
  registered under the name, so every component threw
  `rotationEffect is not a function` at the call. It is now registered next to
  `transition`.

  The angle is in degrees and may be a signal. The anchor is one of the nine
  named points and defaults to `center`. A new angle replaces the previous
  rotation rather than stacking on it.

  `offset`, `rotationEffect`, `scaleEffect` and a raw `.transform()` string now
  compose into one `transform`. Each owns a part of it, recorded per element, so
  none erases another: a raw `.transform()` used to replace the whole value, so
  `.scaleEffect(2).transform('translateX(10px)')` lost the scale, and a
  signal-driven transform erased it again on every update. The
  parts apply in a fixed order, since modifiers run in priority order rather
  than chain order: the view rotates and scales in place, then the offset moves
  it by the amount given, unscaled. Previously a scale followed by an offset
  scaled the offset too.

  Each effect keeps its own anchor. The anchor is written into the effect's own
  part, around the element's center, rather than into `transform-origin`, which
  holds one value per element and so could honor only one effect's anchor: a
  scale around `topLeading` and a rotation around `bottomTrailing` both hold.
  `scaleEffect` therefore no longer sets `transform-origin`.

  A transform already on the element when an effect is first applied is kept,
  except functions of the same kind: an offset still replaces an existing
  translate, a scale an existing scale, as before. An existing `none` is
  treated as no transform. A raw `.transform()` string is kept as written, so a
  function inside it is not replaced by an effect of the same kind:
  `.transform('rotate(10deg)').rotationEffect(20)` applies both rotations,
  where before whichever wrote last replaced the other.

  The composer lives in `@tachui/core/modifiers` (`setTransformPart`,
  `anchorTransform`), so every writer shares one record per element. That
  includes the `AnimationModifier` and `LayoutModifier` classes constructed
  directly, from core or from either `@tachui/modifiers` entry: their
  `transform`, `offset` and `scaleEffect` branches compose the same way, and
  core's `AnimationModifier` now applies `rotationEffect`, which it ignored.
  `AnimationModifierProps` in `@tachui/types` declares `rotationEffect`, and the
  nine anchor names are one `TransformAnchor` type there.

  Server rendering emits a composed transform as one declaration. Each
  transform modifier writes the whole composed value, and the SSR style shim
  kept every write, so an element with four transform modifiers carried four
  `transform` declarations. The result was right, since the last wins, but three
  were dead weight; a `transform` write now replaces the previous one.

  The shape docs now show `.rotationEffect(-90)` for the quarter turn a progress
  ring wants, which `.transform('rotate(-90deg)')` still does equally well.

- [#408](https://github.com/tach-UI/tachUI/pull/408) [`ecf7ed0`](https://github.com/tach-UI/tachUI/commit/ecf7ed02d0a7b8708e7eba04cb2bfe6ca267f5a9) Thanks [@whoughton](https://github.com/whoughton)! - A size signal that becomes `infinity` now behaves like a static `infinity`.
  `.width(signal)`, `.maxWidth(signal)` and the other size modifiers resolve a
  signal's current value before computing styles. A width or height of
  `infinity` therefore expands the element with the same flex styles, and a max
  size of `infinity` removes the constraint, instead of the sentinel being
  written as a CSS value. Styles a previous value set are cleared when the
  signal moves on, and a signal yielding `null` unsets the size as `undefined`
  does. The update runs through the same reactive style binding as every other
  modifier's, so it is disposed with its owner or when the element is gone, and
  applying the modifier to the same element again reuses it.

  `margin` and `padding` pass a string through as written and give only a
  number pixels, as the reactive path already did. A unit used to be appended to
  any string that wasn't a single length, so `'0 auto'` became `'0 autopx'` and
  `'calc(100% - 8px)'` became `'calc(100% - 8px)px'`, both invalid. The
  exception was a unitless numeric string: `'16'` became `'16px'`. It now passes
  through as `'16'`, which is not a valid margin. Pass the number `16`, or a
  string with its unit. In development, a non-zero unitless string logs a
  warning saying so.

  `margin`, `padding` and the size modifiers copy the object they are given, so
  changing it after the call no longer changes the modifier.

- Updated dependencies [[`3c7d240`](https://github.com/tach-UI/tachUI/commit/3c7d24003bac08f32d1131620c5320dea3448d4a), [`59a1495`](https://github.com/tach-UI/tachUI/commit/59a149583c907d37954f557921e9634f17c874db), [`0597547`](https://github.com/tach-UI/tachUI/commit/0597547f699efab16648906a4c8132b02093df36), [`adb81be`](https://github.com/tach-UI/tachUI/commit/adb81be8830ba8de02d4c53d02689ff3a2d97280), [`0597547`](https://github.com/tach-UI/tachUI/commit/0597547f699efab16648906a4c8132b02093df36), [`6a5f04a`](https://github.com/tach-UI/tachUI/commit/6a5f04a175e853c9924bdd791f554c4a7265b209), [`818d1aa`](https://github.com/tach-UI/tachUI/commit/818d1aac5e3f0e68e073ca9fe5930ffcef5ff8b2), [`3f061b5`](https://github.com/tach-UI/tachUI/commit/3f061b54bb6096fb4555282ece8f5dd9e7fb495c), [`6d787ba`](https://github.com/tach-UI/tachUI/commit/6d787ba6658cc640548133dac94938a1d7d75a49), [`5c4eddb`](https://github.com/tach-UI/tachUI/commit/5c4eddbb5a1af5a0283268249a20f093c6dc0b11), [`3f061b5`](https://github.com/tach-UI/tachUI/commit/3f061b54bb6096fb4555282ece8f5dd9e7fb495c), [`9d47ded`](https://github.com/tach-UI/tachUI/commit/9d47dedfcffe259abd1d07407512761e29dca0a3), [`5a6ac09`](https://github.com/tach-UI/tachUI/commit/5a6ac0904f6e4b22af8239a1ebbac8395708db74)]:
  - @tachui/core@0.11.5
  - @tachui/types@0.11.5
  - @tachui/registry@0.11.5

## 0.11.1

### Patch Changes

- Updated dependencies [[`23c5c26`](https://github.com/tach-UI/tachUI/commit/23c5c26e90085bb665d3e18b75b5763dbf2709fa), [`e58bce2`](https://github.com/tach-UI/tachUI/commit/e58bce248829451c8e89a9af5ab19705dd806f57)]:
  - @tachui/core@0.11.1
  - @tachui/registry@0.11.1
  - @tachui/types@0.11.1

## 0.11.0

### Patch Changes

- [#365](https://github.com/tach-UI/tachUI/pull/365) [`1c3099d`](https://github.com/tach-UI/tachUI/commit/1c3099d059b03af704ed91ead50079bc36e92007) Thanks [@whoughton](https://github.com/whoughton)! - `isSignal` now recognises a computed, and `Button`'s `isEnabled` follows a
  signal.

  `createSignal` marks its accessor `tachui.signal` and `createComputed` marks
  its own `tachui.computed`, but `isSignal` looked only for the first — so a
  computed failed the guard for the `Signal` type it satisfies. That is not a
  narrow miss. The standard `isSignal(x) ? x() : x` split then passes the
  _function_ on as if it were a value, so a prop reads as permanently truthy, a
  style is set to a function, and nothing subscribes.

  **This changes runtime behaviour wherever that split appears, which is roughly a
  hundred call sites** — `Stepper`, `DatePicker`, `Picker`, `TextField` and
  `Slider` in forms; `tab-view`, `navigation-link` and the navigation modifiers;
  `List` and `Menu` in data; `Alert` and `ActionSheet` in mobile; and reactive
  class handling in modifiers and grid. A prop that accepts `boolean | Signal`
  and was handed a computed now honours it. `isSignal` is public API and this
  widens what it accepts deliberately, hence a minor rather than a patch on core.

  `NavigationLink` is the one place where widening did more than fix a split. Its
  `isActive` handling intercepts the _write_ that sets the value true, navigates,
  and sets it back to false. A computed has no write to intercept, and the
  fallback path it now reaches would navigate the moment the value was truthy —
  on mount, and again on every recomputation, with nothing able to reset it. A
  source with no settable implementation behind it is no longer driven from
  there.

  `Button.isEnabled()` returned the signal itself rather than its value, which
  made every consumer wrong the same way: `if (!isEnabled)` on a function is
  never true, so the press guard never fired and `getButtonStyles` computed its
  disabled appearance from a truthy function. It resolves now, the way
  `isLoading` already did.

  `disabled` reaches the renderer as an inverted signal, built fresh on each
  render. Identity matters as much as value: a render runs inside an effect, so
  an enclosing component re-rendering for any reason disposes that scope and
  takes the renderer's subscription with it, and the renderer diffs props by
  identity — a cached accessor would be recognised, skipped, and never
  resubscribed. Where a render has no owner at all, which is the direct mount
  path behind sheets, popovers and split views, `disabled` is a plain value
  instead: nothing there disposes what a render creates, so a subscription made
  in that path would be held for the life of the process, one per mount.

  Button's reactive style effect no longer subscribes to anything a caller owns.
  It is created on DOM ready, a path where nothing disposes it — the component's
  cleanup array is copied by `build()` before a render can add to it, and the
  renderer's element cleanup does not run there either — so every signal it read
  was held for the life of the process, one observer per mount, and those signals
  are shared across every component handed the same one. It now reads the enabled
  and loading state, `tint`, `backgroundColor`, `foregroundColor`, and the theme a
  `ColorAsset` resolves against as snapshots, and depends only on the component's
  own state signal.

  That removes reactivity as well as the leak: a caller's colour or loading signal
  changing no longer restyles through this effect. Nothing observable changes
  today, because the style application skips any property that already has a
  value and so only the first pass ever reaches the DOM — but when that skip is
  fixed, or when the mount path learns to dispose what a render creates, the
  subscriptions belong back here and not before.

  The click handler also declines while disabled **or loading**. A disabled
  button suppresses clicks natively in a browser but not in every environment,
  and `handlePress` has always refused a press while loading — so a click and a
  press could disagree about whether a loading button acts. They no longer do.

  A disabled Button also _looks_ disabled now, which it did not before and does
  not on the released version either. Its styles travel with the element as a
  prop the renderer owns, rather than being written onto the element afterwards
  by an effect that ran on DOM ready — an effect the ordinary render path never
  fires, so a Button rendered that way had no styles at all, disabled or
  otherwise. Applying them before modifiers rather than after also makes modifier
  precedence a matter of ordering rather than of inspecting what is already on
  the element: the component no longer has to guess whether a value it finds
  there was a modifier's or its own from a previous pass, which it guessed wrong,
  so every pass after the first stood down and a button that became disabled kept
  the appearance of one that was not.

  The other half of the report — signal-driven style modifier values reading once
  — was not reproducible: effects flush on a microtask, so a read in the same
  task as the write is stale by design. Nothing pinned it either way, which is
  why it was plausible enough to report, so `foregroundColor` and
  `backgroundColor` now carry signal-update tests.

  `clone-helpers` drops a local `isSignal` that tested for a `.set` no signal
  accessor has ever had. It matched nothing, and signals reached the generic
  branch that passes functions through by reference — the right answer for no
  reason.

- Updated dependencies [[`a6d0668`](https://github.com/tach-UI/tachUI/commit/a6d06680e3212b5e5dfe11c60d43ad04ae7e131a), [`9864d4c`](https://github.com/tach-UI/tachUI/commit/9864d4cab381e92abfc365f7749b9608636e4bb5), [`b30f4a3`](https://github.com/tach-UI/tachUI/commit/b30f4a3c80a816398ed644fe2f489c1ca532318b), [`a2e553b`](https://github.com/tach-UI/tachUI/commit/a2e553b39c649240e5f361c6d925394ccba17d2b), [`0c10b49`](https://github.com/tach-UI/tachUI/commit/0c10b4945aefaf290a2779fa44c0a12ff2fc0d8a), [`eabe555`](https://github.com/tach-UI/tachUI/commit/eabe55501766e5da320e42e65420dbd64e71e616), [`1c3099d`](https://github.com/tach-UI/tachUI/commit/1c3099d059b03af704ed91ead50079bc36e92007), [`b2335fe`](https://github.com/tach-UI/tachUI/commit/b2335fe0c43a9704b6544af48a54071529d2f441), [`eabe555`](https://github.com/tach-UI/tachUI/commit/eabe55501766e5da320e42e65420dbd64e71e616)]:
  - @tachui/core@0.11.0
  - @tachui/registry@0.11.0
  - @tachui/types@0.11.0

## 0.10.0

### Patch Changes

- [#327](https://github.com/tach-UI/tachUI/pull/327) [`11a792d`](https://github.com/tach-UI/tachUI/commit/11a792db9d51db5182bc7877f5a8719c15fae11f) Thanks [@whoughton](https://github.com/whoughton)! - Name animation keyframes from their content, so they stop accumulating and SSR agrees with the client.

  `AnimationModifier` derived its `@keyframes` name from `componentId` and `Date.now()`, which minted a fresh name on every apply. Because `addKeyframesToStylesheet` appended to the shared `<style id="tachui-animations">` without deduping or cleanup, every re-render of an animated component left another block behind — five renders of one component produced five blocks — and the element moved to the newest name, so the earlier blocks were dead weight the browser still parsed. Nothing removed them on unmount.

  The same scheme also made the prerendered CSS unusable: `getStaticCSS` named from the selector while `apply` named from the clock, so the server's `@keyframes` was always orphaned and the client always re-injected its own.

  Names are now a hash of the keyframes' own content, via the new `createAnimationKeyframeRule` and `ensureAnimationKeyframes` exports on `@tachui/core/modifiers/base`. Identical keyframes resolve to one name and one block across renders, across components, and across server and client. Duration, easing, iteration count and direction are excluded from the hash — they belong to the element's `animation` shorthand rather than the keyframes block — so components sharing a keyframes object at different speeds share one block. The set of injected names is tracked on the stylesheet element under a registered symbol, so it is discarded exactly when the element is and is shared by all three `AnimationModifier` copies (`@tachui/core` plus both `@tachui/modifiers` builds) that write to it.

  Because content hashing makes a name a reliable statement about a block's contents, the client now also adopts animation keyframes it finds already in the document rather than duplicating them. `@tachui/ssr` emits each static rule in its own anonymous `<style>` rather than into `#tachui-animations`, so prerendered blocks were still being re-injected on hydration even once the names agreed.

  **Breaking for deep importers of `@tachui/core/modifiers/base`**, which is a published subpath export and so reaches beyond this repo: `collectStaticAnimationCSSRules` no longer takes a `createKeyframeRule` callback, deriving the name itself. Emitted keyframe names also change shape, from `tachui-animation-<componentId>-<timestamp>` and `tachui-animation-<selector>` to `tachui-animation-<hash>`. Nothing should depend on the old spelling — the client's was unpredictable by construction — but anything asserting on a literal keyframe name needs updating.

- [#325](https://github.com/tach-UI/tachUI/pull/325) [`7245d29`](https://github.com/tach-UI/tachUI/commit/7245d29aaf569483c16ff9d51788fb4815895caf) Thanks [@whoughton](https://github.com/whoughton)! - Add a gradient `interpolation` option and emit an sRGB fallback pair for it.

  `GradientColors` gains `interpolation?: 'srgb' | 'oklab' | 'oklch'`, emitted as an `in <space>` hint (`linear-gradient(in oklab to right, …)`). A browser that cannot parse the hint drops the whole declaration and the element gets no background at all, so anything other than `'srgb'` is written as a pair: the plain sRGB gradient first, the hinted one second. CSSOM rejects a value it cannot parse as a no-op, so the browser keeps whichever it understood.

  - `gradientToDeclarations(def)` returns that pair (length 1 for `'srgb'`); `gradientToCSS` keeps returning the single preferred string.
  - `GradientAsset`, `StateGradientAsset` and `ReactiveGradientAsset` gain `resolveDeclarations()`; `resolve()` is unchanged. The reactive option types accept `interpolation` too.
  - The background modifier writes every declaration in order at all three of its paths (static value, theme-reactive asset, stateful hover/active/focus/disabled), preferring `resolveDeclarations()` on an asset when present.
  - The SSR style shim appends repeated writes to a property instead of overwriting, and the serializer emits one entry per write, so `renderToString` output carries the same pair in one `style` attribute. A property genuinely overridden by a later modifier now emits both values; the cascade keeps the last, as it does on the client. A write whose `!important` priority differs from the stored value still overwrites, matching `setProperty`, so an inline `red !important` followed by a normal gradient renders the gradient on both server and client.
  - `CSSUtils.withFallback` emits the solid color, then the sRGB gradient, then the hinted one. `CSSUtils.toCustomProperties` always emits the sRGB form: a custom property cannot carry the pair, because an unsupported gradient only fails at `var()` substitution, where the using declaration becomes `unset` rather than falling back. It warns in development when the gradient explicitly asked for a non-sRGB interpolation.
  - A stateful background (`{ default, hover, … }`) rendered where there is no DOM element to attach listeners to, such as `renderToString`, now emits its resting `default` state. Previously the modifier threw a `ReferenceError` on the bare `HTMLElement` check under Node.

  The default interpolation is unchanged in this release step.

- [#316](https://github.com/tach-UI/tachUI/pull/316) [`850d557`](https://github.com/tach-UI/tachUI/commit/850d557b19c763c296f9457e4401b0c4b822cc68) Thanks [@whoughton](https://github.com/whoughton)! - Render `overlay()` content instead of an empty container (#302).

  `overlay()` built its absolutely-positioned container, positioned it correctly, and then rendered nothing inside it. Every content form was dropped: a plain string, a `ComponentInstance`, a `.build()`-ed component, and a content closure all produced `<div style="position: absolute; ...">` with no children.

  The cause was `renderContent` reading `component.render().element`. A component's `render()` returns DOMNode _descriptions_; `element` is populated by the renderer when the node is mounted, so it is always `undefined` on a freshly rendered node. Strings were never handled at all. Content now goes through `renderComponent`, which materializes the nodes, builds an unbuilt modifier chain, and keeps the content reactive.

  ```typescript
  Text("base").overlay(Text("D"), "bottomTrailing");
  // before: <div style="position: absolute; bottom: 0px; right: 0px;"></div>
  // after:  <div style="position: absolute; bottom: 0px; right: 0px;"><span>D</span></div>
  ```

  Accepted content, matching SwiftUI's `.overlay(alignment:content:)`:

  - a `ComponentInstance`, built or not
  - a content closure, `() => Text('D')`
  - a `string` or `number`, rendered as text
  - a `Signal<string | number>`, rendered as reactive text
  - a DOM `Element`

  `OverlayOptions['content']` and the `overlay()` parameter were typed `any`; they are now `OverlayContent`, so an unsupported form is a compile error rather than a silent empty overlay.

  `apply()` now returns a `ModifierResult` carrying cleanup. The positioning effect was previously created and never disposed, and the overlay container was never removed; both are now torn down with the modifier.

  Overlays are also reconciled per render pass. `renderSingle` applies modifiers on every render of a node, not only when the element is created, so a base component that re-renders drives `apply()` again on the same element — and the pipeline's cleanup does not run until unmount. Each pass therefore appended another container and left the previous one behind. That accumulation predates this change, but was invisible while the containers were empty; now that they hold content it would have shown as duplicate, stale layers.

  Bookkeeping is owned by the element rather than the modifier, because a component that builds its chain inline — `Text(label()).overlay(badge)` inside a parent's render — produces a fresh modifier instance on every pass while the renderer reuses the element. A pass boundary is detected from the `ModifierContext` identity, which `applyModifiersToNode` creates once per element render and shares across that pass's modifiers. Entering a new pass disposes what the previous one mounted; the modifiers still in the chain re-mount.

  A pass in which _no_ overlay modifier runs — the last overlay leaving the chain — cannot be seen that way, since the reconciliation is only ever driven from `apply()`. Modifiers are applied inside the render effect's body, so each mount also registers an execution-scoped cleanup (#270), which runs just before that effect's next execution whether or not an overlay applies on it. Outside a computation this degrades to owner-scoped and then to a no-op, and the pass reconciliation covers those paths; both routes end at the same idempotent disposer.

  Cleanup is handed back once per element rather than once per apply. The pipeline chains every returned cleanup onto `node.dispose` and pushes it onto the element's cleanup list without dropping the previous one, so a long-lived reactive overlay would otherwise accumulate stale teardowns and replay them all at unmount.

  `@tachui/core/runtime` was added to the package's Rollup externals. Without it the renderer was inlined into the modifiers bundle, which would have given the package its own `globalRenderer` separate from the app's.

- Updated dependencies [[`11a792d`](https://github.com/tach-UI/tachUI/commit/11a792db9d51db5182bc7877f5a8719c15fae11f), [`d5cd030`](https://github.com/tach-UI/tachUI/commit/d5cd030464dee0be84b8a2c6013fed716e53f551), [`0da0398`](https://github.com/tach-UI/tachUI/commit/0da03983bd74252a0ad917e7443b52781980b0bb), [`746b2be`](https://github.com/tach-UI/tachUI/commit/746b2bed20d71335f04e47097b135196d9f2caad), [`1fe6910`](https://github.com/tach-UI/tachUI/commit/1fe69104fadafa3663163b2d749e963b84620427), [`5cd2e02`](https://github.com/tach-UI/tachUI/commit/5cd2e0236f0336bf86d71744cb4b557145462c5d), [`327e8de`](https://github.com/tach-UI/tachUI/commit/327e8dea132e3a2f26d6afa724cc130b323413fa), [`7245d29`](https://github.com/tach-UI/tachUI/commit/7245d29aaf569483c16ff9d51788fb4815895caf), [`df5c539`](https://github.com/tach-UI/tachUI/commit/df5c5390072163b73ef16509f569b517ce916ea4), [`985a84b`](https://github.com/tach-UI/tachUI/commit/985a84b800dab2413ca563bac943f9ca3efc41db), [`2984b3c`](https://github.com/tach-UI/tachUI/commit/2984b3ccd461f7126acc9286f145d322d190373e)]:
  - @tachui/core@0.10.0
  - @tachui/types@0.10.0
  - @tachui/registry@0.10.0

## 0.8.33

### Patch Changes

- [#299](https://github.com/tach-UI/tachUI/pull/299) [`9ae49e0`](https://github.com/tach-UI/tachUI/commit/9ae49e04ebeaf6d5363d1f5cb85230010f9905c2) Thanks [@whoughton](https://github.com/whoughton)! - Remove `.transitions()`, which never did anything (#297).

  It was chainable, declared in the modifier types, and registered in the modifier registry — so calls resolved without error — but `AnimationModifier.apply` never read `props.transitions`. `Text('x').transitions({ opacity: { duration: 500 } })` left `element.style.transition` empty while the singular `.transition('opacity', 500, 'ease-in')` produced `opacity 500ms ease-in 0ms` on the same render.

  Removing it turns a silent no-op into a compile error. No capability is lost: `.transition()` is the working API and there was never a defined shape for `.transitions()`'s config, which was typed `any`. If a multi-property form is wanted it should be designed and implemented, not inherited from a placeholder.

- Updated dependencies [[`9ae49e0`](https://github.com/tach-UI/tachUI/commit/9ae49e04ebeaf6d5363d1f5cb85230010f9905c2), [`9ae49e0`](https://github.com/tach-UI/tachUI/commit/9ae49e04ebeaf6d5363d1f5cb85230010f9905c2)]:
  - @tachui/core@0.8.32
  - @tachui/types@0.8.32
  - @tachui/registry@0.8.32

## 0.8.32

### Patch Changes

- [#263](https://github.com/tach-UI/tachUI/pull/263) [`fae8633`](https://github.com/tach-UI/tachUI/commit/fae86338af75e0cfcc37f9f74b494a11092b29a2) Thanks [@whoughton](https://github.com/whoughton)! - Fix modifier registration being tree-shaken out of consumer bundles (#260).

  Importing `@tachui/modifiers/preload/basic` — the documented way to register the basic modifiers — had no effect in any production build. Every modifier call then threw `Modifier 'fontSize' not found in registry`, while the same code worked unbundled.

  `registerBasicModifiers()` runs at module scope in `src/basic/index.ts`, but the build forces that module into a hashed `modifiers-basic-<hash>` chunk which matches none of the package's `sideEffects` globs. Rollup treated the chunk as side-effect-free and dropped the call, leaving `dist/preload/basic.js` as a pure re-export that registered nothing.

  `preload/basic` and `preload/effects` now call their registration functions directly, matching `preload/filters`, `shadows`, `transforms` and `backdrop`, which already did this and were never affected. `registerEffectModifiers()` is newly exported from `@tachui/modifiers/effects` for that purpose.

  Segmentation is unchanged: a basic-only import still pulls in no effects code.

  The tree-shaking verifier now also builds fixtures against the published `dist`. Its existing fixtures import from `src`, where the preload entries _are_ covered by `sideEffects` — which is why this never showed up in CI.

- Updated dependencies [[`fae8633`](https://github.com/tach-UI/tachUI/commit/fae86338af75e0cfcc37f9f74b494a11092b29a2), [`fae8633`](https://github.com/tach-UI/tachUI/commit/fae86338af75e0cfcc37f9f74b494a11092b29a2)]:
  - @tachui/core@0.8.31
  - @tachui/types@0.8.31
  - @tachui/registry@0.8.31

## 0.8.31

### Patch Changes

- Updated dependencies [[`de58dac`](https://github.com/tach-UI/tachUI/commit/de58dac18bc26c1d1c0a3cc15472e3d2cde92bf7), [`4a8d3a8`](https://github.com/tach-UI/tachUI/commit/4a8d3a8aa5293ddd5e4698c0cfe21a52327fe972)]:
  - @tachui/core@0.8.30
  - @tachui/types@0.8.30
  - @tachui/registry@0.8.30

## 0.8.30

### Patch Changes

- Updated dependencies [[`6a45ba3`](https://github.com/tach-UI/tachUI/commit/6a45ba3e75bbde9f0fa6e2636f5a6e7d7e7a2019)]:
  - @tachui/core@0.8.29
  - @tachui/types@0.8.29
  - @tachui/registry@0.8.29

## 0.8.29

### Patch Changes

- [#241](https://github.com/tach-UI/tachUI/pull/241) [`547c82e`](https://github.com/tach-UI/tachUI/commit/547c82e61e9f92da31b0cdceece66fe65da7283a) Thanks [@whoughton](https://github.com/whoughton)! - Fix interaction modifier listener leaks (#216): `onHover`, `onContinuousHover`, `onLongPressGesture`, and `InteractionModifier` (`.onTap()`, `.onHover()`, gestures, keyboard, scroll, etc.) now return a `ModifierResult` whose `cleanup` removes every registered DOM event listener — including document-level keyboard shortcut listeners — when the component unmounts. The modifier registry (`applyModifiersSequential`, batch path, and `combineModifiers`) now harvests `ModifierResult` returns and chains their cleanup onto `node.dispose`, which the renderer already drains on teardown. Listener teardown is double-dispose safe.

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
  - @tachui/registry@0.8.28
  - @tachui/types@0.8.28

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
  - @tachui/registry@0.8.27
  - @tachui/types@0.8.27

## 0.8.27

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
  - @tachui/core@0.8.26
  - @tachui/types@0.8.26
  - @tachui/registry@0.8.26

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
