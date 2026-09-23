# @tachui/primitives

## 0.11.5

### Patch Changes

- [#402](https://github.com/tach-UI/tachUI/pull/402) [`1022871`](https://github.com/tach-UI/tachUI/commit/10228719ef36ad902f73b0034bc9f7e74cbef02f) Thanks [@whoughton](https://github.com/whoughton)! - `BasicInput` takes `name` and `required`, so it can take part in a form.

  Neither existed. A form reads its fields through `FormData`, which skips
  anything unnamed, so `BasicForm` submitted `{}` for a form built out of
  `BasicInput` controls no matter what was typed into them — and with no
  `required` to check, the validation sweep had nothing to find, so
  `validateOnSubmit` passed every empty form and `validateOnChange` never
  reported an error. Only a raw `<input>` dropped into the form worked.

  `name` is a plain string, since it is the field's identity rather than its
  state. `required` takes a signal the way `disabled` and `readonly` do. The
  native `required` attribute already tells assistive technology what
  `aria-required` would, so it is not duplicated.

- [#404](https://github.com/tach-UI/tachUI/pull/404) [`a312f2e`](https://github.com/tach-UI/tachUI/commit/a312f2eb5fcdae20aea4206adb83f13640a62fcf) Thanks [@whoughton](https://github.com/whoughton)! - `Image` renders the sizing and presentation props it declares.

  `width`, `height`, `contentMode` and `resizeMode` were all in `ImageProps`,
  all type-checked, and none of them reached the DOM — the rendered `<img>` had
  no dimensions and no `object-fit`. The same was true of `aspectRatio`,
  `opacity`, `blur`, `grayscale` and `sepia`, which no report had named but
  which were dropped in the same place.

  They are written as styles rather than attributes, because the dimensions are
  typed to take a CSS length — `100%` is as valid as `246` — and a bare number
  is read as pixels. A modifier setting the same property still wins, so
  `.css({ height: '400px' })` over a `height` prop behaves the way `.css()`
  already does over a stack's own styles.

  `contentMode` maps to `object-fit`: `fit` to `contain`, `fill` to `cover`,
  `stretch` to `fill`, `center` to `none`, `scaleDown` to `scale-down`.
  `resizeMode` is named for the CSS values themselves, so it is the more
  specific of the two and wins where both are set. `blur`, `grayscale` and
  `sepia` compose into one `filter`.

  A placeholder or error image is sized the same way. Sizing only the final
  image makes the box jump the moment it loads, and leaves an error placeholder
  unsized for good.

  Template mode is sized too, and the span becomes an `inline-block` when it is
  given a dimension — a span is `display: inline`, where a width is simply
  ignored. It keeps its existing warning that `contentMode` and `resizeMode` do
  nothing there: it paints an inline SVG into the span, where `object-fit` has
  no replaced content to act on.

  Template mode also builds its class list the way every other path does, so a
  reactive `css` prop stays reactive instead of being flattened into the text of
  its own accessor.

- [#402](https://github.com/tach-UI/tachUI/pull/402) [`2a74331`](https://github.com/tach-UI/tachUI/commit/2a7433188cdab609639baff45c665d871aa9f35a) Thanks [@whoughton](https://github.com/whoughton)! - `Toggle`, `Slider` and `BasicForm` respond to interaction again.

  All three wired their DOM listeners from inside a `ref` callback on an
  intrinsic element. The renderer has no `ref` support for intrinsic elements —
  it treats the prop like any other and stringifies the function into a `ref`
  attribute — so the callback never ran, no listener was ever attached, and the
  components rendered correctly but were inert. `Toggle`'s `onToggle` never
  fired for a click, a label click, a keyboard Space or a dispatched `change`;
  `Slider`'s `onValueChange` never fired, so the value could not be dragged and
  the track fill stayed at zero; `BasicForm` never saw `submit`, `change` or
  `input`, so `onSubmit`, `validateOnSubmit` and `validateOnChange` all did
  nothing. The stray `ref="(el) => {...}"` attribute is gone from the rendered
  markup as well.

  Each component now declares its handlers in element props the way
  `BasicInput` and `Picker` already do. Two pieces of state that the ref
  callback existed to capture went with it:

  `Slider`'s track fill is a style rather than an imperative write —
  `--slider-progress` is derived from the current value on every render, so it
  follows the binding the way the thumb does. The drag-tracking signal that
  guarded the old write is gone with the write it guarded; the input is
  controlled by `value`, and a value written back mid-drag is the value the
  handler just reported.

  `BasicForm` resolves its form element from the event that reaches a handler,
  which is what `FormData` and the validation sweep read.

  `Toggle` also puts its hidden checkbox back in step with `isOn` after a
  change. The browser flips that checkbox before the handler runs, so a toggle
  whose binding is constant, or whose `onToggle` declines the change, used to
  submit as checked while the track read off.

- [#404](https://github.com/tach-UI/tachUI/pull/404) [`b182031`](https://github.com/tach-UI/tachUI/commit/b1820313170287eac33dbab3b0a9078a3aebdbd5) Thanks [@whoughton](https://github.com/whoughton)! - `Link` merges the `css` prop into the rendered anchor.

  `Link` accepted `css` and type-checked, and the `<a>` came out with no `class`
  attribute at all — the prop went nowhere. `Text` and `Button` have merged the
  same prop for a while; `EnhancedLinkComponent` was the one render path that
  never picked up `ComponentWithCSSClasses`.

  The anchor now carries `tachui-link` plus whatever `css` asks for, static,
  array or reactive, the way the other primitives do. Anything styling a link by
  its tag or its position is unaffected; the new base class only adds a hook
  that was not there before.

  Classes matter here in a way modifiers cannot cover: a stylesheet `:hover`
  rule loses to an inline style, so a class is the only way to reach one.

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

- [#385](https://github.com/tach-UI/tachUI/pull/385) [`3f061b5`](https://github.com/tach-UI/tachUI/commit/3f061b54bb6096fb4555282ece8f5dd9e7fb495c) Thanks [@whoughton](https://github.com/whoughton)! - Add `Circle`, the first shape primitive, and the engine behind it.

  A shape fills its frame and is styled with methods on the shape rather than
  general modifiers: `.fill(style)`, `.stroke(style, lineWidth)`,
  `.strokeBorder(style, lineWidth)` and `.inset(by)`. Every style and length
  accepts a signal or a color asset. Shape methods chain with modifiers in
  either order.

  ```ts
  import { Circle } from "@tachui/primitives";

  Circle().fill(color);
  Circle().inset(1).stroke(tint, 2); // a ring 1px inside the edge
  Circle().strokeBorder(tint, 2); // a stroke fully inside the frame
  ```

  Shapes render as inline SVG: a wrapper that takes modifiers, and inside it an
  `<svg>` with one `<path>` computed from the shape's measured frame, so a
  circle in a non-square frame is inscribed in the short side and a stroke is
  independent of the layout box. The svg is updated in place when a signal
  changes, never replaced, so a CSS transition on it survives the update. It is
  `aria-hidden`; a shape is decorative.

  New subpath `@tachui/primitives/shapes`. Server-side the wrapper is emitted
  and the shape is drawn on hydration.

- [#385](https://github.com/tach-UI/tachUI/pull/385) [`0dbe5ac`](https://github.com/tach-UI/tachUI/commit/0dbe5acab11b9597ffa9a3926b5bc66472f1769f) Thanks [@whoughton](https://github.com/whoughton)! - Two shape geometry corrections.

  - A negative `strokeBorder` line width no longer pushes the shape outside its
    frame. The width was floored at zero for painting but used raw for the
    inset, so `Circle().fill('red').strokeBorder('blue', -4)` _outset_ the path
    by 2px — the fill spilling past the frame `strokeBorder` promises to stay
    inside, with no stroke drawn to hint at why. The inset now comes from the
    same floored width the stroke does.
  - A shape that is unmounted and remounted measures its new host. The frame
    kept from the previous mount suppressed the fallback measurement, so a
    shape brought back by a toggled `Show` kept its old path. `ResizeObserver`
    corrected that where it exists; in the explicitly supported path where it
    does not, the stale geometry was permanent.

- [#385](https://github.com/tach-UI/tachUI/pull/385) [`5d89ea0`](https://github.com/tach-UI/tachUI/commit/5d89ea017b43cb890d8cd6f7d838d88cc1d889f1) Thanks [@whoughton](https://github.com/whoughton)! - `Circle()` has a usable type again for TypeScript consumers.

  The component held its measured rect in a private field named `frame`, which
  collides with the public `frame()` modifier on the surface the shape's type is
  intersected with. TypeScript reduces an intersection to `never` when a private
  member meets a public one of the same name, so a consumer's `Circle()` had no
  usable type at all and even `Circle().fill('red')` failed to compile. Nothing
  inside the package saw it, because the collapse only happens where the two
  halves are intersected.

  The field is renamed, and a type test now asserts the public surface is
  neither `never` nor `any`. The `@tachui/primitives/shapes` subpath is mapped
  in the type-test config, without which such a test resolves to `any` and
  passes having checked nothing.

- [#385](https://github.com/tach-UI/tachUI/pull/385) [`e8ae51c`](https://github.com/tach-UI/tachUI/commit/e8ae51ca35ea0dc5dd7c2be5dc14e0a17a671cdf) Thanks [@whoughton](https://github.com/whoughton)! - Shape rendering and API corrections.

  - A shape measures its own box once on a microtask after mount, so it draws on
    the first frame instead of waiting for the observer's first asynchronous
    delivery. It is also the only measurement where `ResizeObserver` is missing,
    which previously meant the shape never drew at all. A zero box is treated as
    the absence of a measurement rather than a measurement of zero, so it never
    overwrites a real size.
  - `path()` now reports the geometry the shape actually draws. It applied only
    the explicit insets while the renderer additionally applied half the line
    width for `strokeBorder`, so a bordered shape reported a path larger than the
    one on screen. Both go through one code path now, which matters because the
    `Shape` contract exists for `clipShape` to consume.
  - `.stroke()` clears an inset left by an earlier `.strokeBorder()`. Replacing a
    border stroke with a plain one kept the half-line inset, so the new stroke was
    drawn inside the edge rather than centered on it.
  - Shape methods work with `configureCore({ proxyModifiers: false })`. `fill` and
    `stroke` are not modifiers, so with the proxy disabled they existed nowhere
    and the shape API was unusable there.
  - A line width goes through the same formatter as the path data, so a computed
    width no longer serializes as `0.30000000000000004`.
  - A style that is neither a color string, a signal of one, nor a color asset
    warns and draws nothing, instead of painting `[object Object]`.

  Shape methods are documented as chain-time: the modifier builder renders a
  clone of the component, so calling `.fill()` on an already-mounted shape changes
  nothing visible. Signals are the supported way to change a shape after mount.

- [#398](https://github.com/tach-UI/tachUI/pull/398) [`360ef97`](https://github.com/tach-UI/tachUI/commit/360ef973b8abd879f9cc0485d283d7866edeee95) Thanks [@whoughton](https://github.com/whoughton)! - `trim()` and `strokeStyle()` on shapes.

  `.trim(from, to)` draws only the part of the path between two fractions of its
  length, which is what progress rings and spinners are made of — and the reason
  the engine emits an SVG `<path>` rather than CSS. It works through
  `pathLength="1"`, so the browser rescales every path to the same length and the
  same fractions give the same result on any shape.

  ```ts
  Circle().trim(0, 0.75).stroke(tint, 4);
  Circle()
    .trim(0, progress)
    .strokeStyle({ lineWidth: 4, lineCap: "round" })
    .stroke(tint);
  ```

  The path starts where SwiftUI's does — a circle at three o'clock, running
  clockwise — so a ring that fills from the top wants a quarter turn on top, as
  it does in SwiftUI. Use `.transform('rotate(-90deg)')`: the `rotationEffect`
  modifier is typed but not implemented at runtime.

  Fractions are clamped to 0...1, and a `to` at or below `from` draws nothing
  rather than wrapping, so a progress value arriving out of order shows an empty
  ring instead of a full one — except under `lineCap: 'round'`, where a
  zero-length dash renders as a dot, which is SVG's behaviour for any dashed
  path. A signal-driven trim updates attributes on the element the shape already
  has, so a CSS transition on `stroke-dasharray` runs rather than restarting.

  **Trim strokes; it does not shorten the path.** SVG ignores a dash pattern when
  filling, so `Circle().trim(0, 0.5).fill(color)` fills the whole circle, and
  `path()` — what `clipShape` reads — is the untrimmed one. SwiftUI's `trim`
  returns a shape whose path really is trimmed and so applies to fill and
  clipping too. Closing that gap means trimming the path itself; progress rings,
  which is what this is for, are stroked.

  `.strokeStyle({ lineWidth, lineCap, lineJoin, dash, dashPhase })` is SwiftUI's
  `StrokeStyle`. Only the keys passed are changed, so repeated calls accumulate.
  Its `lineWidth` does the same job as `stroke()`'s second argument, and the two
  now combine in either order: `stroke()` only sets a width it was actually
  given, so a bare `.stroke(tint)` after `.strokeStyle({ lineWidth: 4 })` keeps
  the 4 where before it reset to 1.

  Trim and a dash pattern are exclusive. Both are `stroke-dasharray`, and trim
  rescales the units a dash length is measured in, so a shape carrying both draws
  the trim, ignores the dash, and warns once — `dashPhase` included, since the
  trim owns `stroke-dashoffset` as much as `stroke-dasharray`. An empty
  `dash: []` is no pattern and so conflicts with nothing. A full-range
  `trim(0, 1)` is not trimming and sets no `pathLength`, so a dash still applies
  there and nothing is warned about. Dashing a trimmed path means
  computing the dash sequence for the trimmed segment, which is not implemented.

- [#393](https://github.com/tach-UI/tachUI/pull/393) [`f66f716`](https://github.com/tach-UI/tachUI/commit/f66f71610a5feac66a3cd5a29e8abf9cb458821c) Thanks [@whoughton](https://github.com/whoughton)! - `Rectangle`, `RoundedRectangle`, `Ellipse` and `Capsule` on the shape engine.

  Each is a path-in-rect function on the existing engine, so all four take
  `.fill()`, `.stroke()`, `.strokeBorder()` and `.inset()`, chain with modifiers
  in either order, and implement the `Shape` contract's `clipPath()`.

  - `Rectangle()` — the frame itself.
  - `RoundedRectangle(cornerRadius)`, also `RoundedRectangle({ cornerRadius })`.
    The radius accepts a signal, and is clamped to half the short side as SwiftUI
    clamps it: an over-large radius draws a capsule rather than the elliptical
    corners an SVG `<rect rx ry>` would give, which is one of the reasons shapes
    are drawn as a `<path>`. Per-corner radii are a later addition; the options
    form is what will carry them.
  - `Ellipse()` — fills the frame, one radius per axis, where `Circle()`
    inscribes in the short side. The two agree in a square frame.
  - `Capsule()` — the largest radius the frame allows, in either orientation.

  `.inset()` and `.strokeBorder()` move a `RoundedRectangle`'s edges without
  changing its corner radius, so neither is concentric with a host of the same
  radius: `RoundedRectangle(12).strokeBorder(tint, 4)` has an outer stroke edge
  of radius 14. Subtract from the radius to land flush. `Capsule` and `Circle`
  recompute their curvature from the inset rect and need no such help. `Ellipse`
  stays inside its frame but is not flush with an elliptical host either: the
  parallel curve of an ellipse is not an ellipse, so its border bulges between
  the axis extremes.

- [#397](https://github.com/tach-UI/tachUI/pull/397) [`4cbcb15`](https://github.com/tach-UI/tachUI/commit/4cbcb15c19eacfb9b50f7b77509cafa4904296a6) Thanks [@whoughton](https://github.com/whoughton)! - Shapes serialize as an `<svg>` shell instead of nothing.

  A shape's geometry comes from measuring its frame, which no server can do, so
  the server used to emit the wrapper alone and leave a hole until scripts ran.
  Everything else about the element is known ahead of time, and is now emitted:
  the `<svg>` with its sizing, `display: block`, `overflow: visible` and
  `aria-hidden`, wrapping an empty `<path>`. The shape has its layout box in the
  first paint, and only the path data arrives with the client.

  The shell is described as an ordinary node rather than an owned one, so no DOM
  shim is needed to serialize it — an owned node's element _is_ its markup, and
  needs a DOM to exist. Where a shim is present the owned path still runs and
  emits the built element, which carries the same shell.

  The `<path>` is left bare. Its fill and stroke would resolve server-side, but
  with no `d` there is nothing for them to paint, so emitting them would run a
  caller's signals and assets during serialization to no visible end.

- Updated dependencies [[`3c7d240`](https://github.com/tach-UI/tachUI/commit/3c7d24003bac08f32d1131620c5320dea3448d4a), [`42e2555`](https://github.com/tach-UI/tachUI/commit/42e2555028b3bb8d9b121da8a849e4c06dd3b258), [`59a1495`](https://github.com/tach-UI/tachUI/commit/59a149583c907d37954f557921e9634f17c874db), [`0597547`](https://github.com/tach-UI/tachUI/commit/0597547f699efab16648906a4c8132b02093df36), [`adb81be`](https://github.com/tach-UI/tachUI/commit/adb81be8830ba8de02d4c53d02689ff3a2d97280), [`0597547`](https://github.com/tach-UI/tachUI/commit/0597547f699efab16648906a4c8132b02093df36), [`6a5f04a`](https://github.com/tach-UI/tachUI/commit/6a5f04a175e853c9924bdd791f554c4a7265b209), [`2593ced`](https://github.com/tach-UI/tachUI/commit/2593ced011ce4148199028edf401156888865660), [`e8607d0`](https://github.com/tach-UI/tachUI/commit/e8607d02a149147226c38d4545c432fa34624693), [`3242516`](https://github.com/tach-UI/tachUI/commit/3242516a36ef4456652791e1d27f33a87a972b11), [`1f9de1f`](https://github.com/tach-UI/tachUI/commit/1f9de1fc374c166668b73575c244e565f6a0fb7d), [`51cee06`](https://github.com/tach-UI/tachUI/commit/51cee060d97f5172bf2f00888cef2570efbb7171), [`818d1aa`](https://github.com/tach-UI/tachUI/commit/818d1aac5e3f0e68e073ca9fe5930ffcef5ff8b2), [`3f061b5`](https://github.com/tach-UI/tachUI/commit/3f061b54bb6096fb4555282ece8f5dd9e7fb495c), [`6d787ba`](https://github.com/tach-UI/tachUI/commit/6d787ba6658cc640548133dac94938a1d7d75a49), [`5c4eddb`](https://github.com/tach-UI/tachUI/commit/5c4eddbb5a1af5a0283268249a20f093c6dc0b11), [`3f061b5`](https://github.com/tach-UI/tachUI/commit/3f061b54bb6096fb4555282ece8f5dd9e7fb495c), [`ecf7ed0`](https://github.com/tach-UI/tachUI/commit/ecf7ed02d0a7b8708e7eba04cb2bfe6ca267f5a9), [`9d47ded`](https://github.com/tach-UI/tachUI/commit/9d47dedfcffe259abd1d07407512761e29dca0a3)]:
  - @tachui/core@0.11.5
  - @tachui/modifiers@0.11.5
  - @tachui/types@0.11.5

## 0.11.1

### Patch Changes

- Updated dependencies [[`23c5c26`](https://github.com/tach-UI/tachUI/commit/23c5c26e90085bb665d3e18b75b5763dbf2709fa), [`e58bce2`](https://github.com/tach-UI/tachUI/commit/e58bce248829451c8e89a9af5ab19705dd806f57)]:
  - @tachui/core@0.11.1
  - @tachui/modifiers@0.11.1

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
  - @tachui/modifiers@0.11.0

## 0.10.0

### Patch Changes

- [#342](https://github.com/tach-UI/tachUI/pull/342) [`d067ce9`](https://github.com/tach-UI/tachUI/commit/d067ce91ae4ed537a3ec3848c05addf8a5f45a1d) Thanks [@whoughton](https://github.com/whoughton)! - Reject `ButtonStyles.*` calls that pass a props object and a third argument.

  `ButtonStyles.Filled('a', { css: 'x' }, { disabled: true })` type-checked, then discarded `{ disabled: true }` at runtime with no error and no warning. The helpers were single signatures — `(title, actionOrProps?, props?)` — admitting both an object second and a third argument, while the implementation branched on `typeof actionOrProps === 'function'`, took the object path, and forwarded only the second. `Button` itself already rejected the same call, being overloaded.

  Every helper — `Filled`, `Outlined`, `Plain`, `Bordered`, `Destructive`, `Cancel` — now carries the same two overloads `Button` has: the action form takes `(title, action?, props?)`, the props form takes `(title, props?)` and no third argument. That call now fails to compile rather than losing props. All documented forms still resolve, including `helper(title, undefined, props)`, and the helpers remain assignable to their previous three-argument shape.

  Note the `Omit` in these signatures documents which prop each helper owns without enforcing it: `ButtonProps` inherits `[key: string]: any` from `ComponentProps`, so the index signature still admits the key `Omit` removed, and `ButtonStyles.Filled('a', { variant: 'plain' })` compiles. The helper's own value wins at runtime, so the button is still filled.

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

- [#267](https://github.com/tach-UI/tachUI/pull/267) [`80ebe36`](https://github.com/tach-UI/tachUI/commit/80ebe366c5e64bd6ebe3419744f5bff3605e51be) Thanks [@whoughton](https://github.com/whoughton)! - `Button` now accepts props as its second argument, matching every other primitive (#266).

  `Button(title, props)` previously landed the whole props object in the `action` parameter, so everything on it — `css` included — was dropped at runtime with no signal. `Image(src, props)`, `Toggle(isOn, props)` and `Text(content, props)` all take props second, so this was the natural call to write and the only primitive that punished it.

  Both forms now work, on `Button` and on all six `ButtonStyles` variants:

  ```ts
  Button("Go", () => {}, { css: "my-class" }); // action second, props third
  Button("Go", { css: "my-class", action }); // props second
  ```

  Purely additive — existing three-argument calls, including `Button(title, undefined, props)`, are unchanged.

## 0.8.32

### Patch Changes

- Updated dependencies [[`fae8633`](https://github.com/tach-UI/tachUI/commit/fae86338af75e0cfcc37f9f74b494a11092b29a2), [`fae8633`](https://github.com/tach-UI/tachUI/commit/fae86338af75e0cfcc37f9f74b494a11092b29a2), [`fae8633`](https://github.com/tach-UI/tachUI/commit/fae86338af75e0cfcc37f9f74b494a11092b29a2)]:
  - @tachui/core@0.8.31
  - @tachui/modifiers@0.8.32

## 0.8.31

### Patch Changes

- Updated dependencies [[`de58dac`](https://github.com/tach-UI/tachUI/commit/de58dac18bc26c1d1c0a3cc15472e3d2cde92bf7), [`4a8d3a8`](https://github.com/tach-UI/tachUI/commit/4a8d3a8aa5293ddd5e4698c0cfe21a52327fe972)]:
  - @tachui/core@0.8.30
  - @tachui/modifiers@0.8.31

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

- [#145](https://github.com/tach-UI/tachUI/pull/145) [`b3ca77c`](https://github.com/tach-UI/tachUI/commit/b3ca77c89cfcf75994f32ca7c2245bf579f71a82) Thanks [@whoughton](https://github.com/whoughton)! - Patch release for recent bug fixes and typing/reactivity improvements:

  - Fix transform modifier composition/reactive update behavior and add stronger regression coverage.
  - Harden responsive breakpoint reactivity test support and singleton reset behavior.
  - Fix `Spacer()` typing so direct modifier chains (for example `.maxHeight()`) are available.
  - Apply core SVG sanitization lint fix and include related renderer/runtime refinements.

- Updated dependencies [[`b3ca77c`](https://github.com/tach-UI/tachUI/commit/b3ca77c89cfcf75994f32ca7c2245bf579f71a82)]:
  - @tachui/core@0.8.18
  - @tachui/modifiers@0.8.18

## 0.8.17

### Patch Changes

- [#138](https://github.com/tach-UI/tachUI/pull/138) [`e982ab2`](https://github.com/tach-UI/tachUI/commit/e982ab26f9012c610b9cb0bff78840dc26771d40) Thanks [@whoughton](https://github.com/whoughton)! - Add template SVG rendering mode to `Image` with secure inline SVG sanitization, reactive themed source updates, and accessibility parity for template-rendered images.

- Updated dependencies [[`e982ab2`](https://github.com/tach-UI/tachUI/commit/e982ab26f9012c610b9cb0bff78840dc26771d40)]:
  - @tachui/core@0.8.17
  - @tachui/modifiers@0.8.17

## 0.8.16

### Patch Changes

- [#136](https://github.com/tach-UI/tachUI/pull/136) [`a8a1103`](https://github.com/tach-UI/tachUI/commit/a8a1103ebe68d7052f95995db5d1b3dc89bb3b49) Thanks [@whoughton](https://github.com/whoughton)! - Fix reactive update consistency across modifiers, primitives, forms, navigation, and viewport, and add deterministic test coverage for review feedback items.

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

## 0.8.14

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

## 0.8.12

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

- [#90](https://github.com/tach-UI/tachUI/pull/90) [`5d3fb03`](https://github.com/tach-UI/tachUI/commit/5d3fb03c5ec91e344c0625bab8c48a2ea5bcee34) Thanks [@whoughton](https://github.com/whoughton)! - Ship semantic/accessibility and metadata fixes across navigation, primitives, mobile, and core.

  - `@tachui/navigation`: make `NavigationLink` crawlable anchors with safer client-navigation interception; add per-view `DocumentHead` metadata APIs and runtime fixes for multi-stack behavior, cleanup, template warnings, and tests.
  - `@tachui/primitives`: add semantic heading support (`Heading`, `Text.H1..H6`), improve toggle label/input associations, and hide spacer from accessibility tree.
  - `@tachui/mobile`: improve `ActionSheet` dialog semantics/focus behavior and related test coverage.
  - `@tachui/core`: remove CommonJS-style runtime access in CSS class DOM integration and cover reactive class cleanup behavior.

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
