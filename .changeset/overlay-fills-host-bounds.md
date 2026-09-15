---
'@tachui/modifiers': patch
---

`overlay()` now proposes the host's bounds to its content, as SwiftUI's
`.overlay(alignment:)` does.

The overlay container used to shrink to fit its content and was centered with
`top: 50%; left: 50%; transform: translate(-50%, -50%)`. A child sized to
`100%` resolved to 0x0 inside it and drew nothing unless the host's size was
repeated with `.frame()`. The container is now a layer covering the host: a
grid with one definite `100%` x `100%` cell, with the alignment expressed as
the item's placement in that cell. Content with an intrinsic size sits where it
did before and keeps its size, overflowing the host if larger, as a SwiftUI
proposal is advisory; content sized to `100%` fills the host. Content with
more than one root layers in that one cell, as SwiftUI layers it, instead of
each root taking a row of its own.

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
