---
'@tachui/modifiers': patch
'@tachui/primitives': patch
---

`.rotationEffect(angle, anchor?)` works on the component chain.

It was declared on the modifier builder and documented, and
`AnimationModifier` already knew how to apply it, but no factory was
registered under the name, so every component threw
`rotationEffect is not a function` at the call. It is now registered next to
`transition`.

The angle is in degrees and may be a signal. The anchor is one of the nine
named points and defaults to `center`. The rotation composes with the other
transforms on the element, such as `scaleEffect`, in either order, and a new
angle replaces the previous rotation rather than stacking on it.

The shape docs now show `.rotationEffect(-90)` for the quarter turn a progress
ring wants, which `.transform('rotate(-90deg)')` still does equally well.
