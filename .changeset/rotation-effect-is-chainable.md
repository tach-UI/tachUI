---
'@tachui/core': patch
'@tachui/modifiers': patch
'@tachui/primitives': patch
'@tachui/ssr': patch
'@tachui/types': patch
---

`.rotationEffect(angle, anchor?)` works on the component chain.

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
translate, a scale an existing scale, as before.

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
