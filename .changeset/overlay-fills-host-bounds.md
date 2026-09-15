---
'@tachui/modifiers': patch
---

`overlay()` now proposes the host's bounds to its content, as SwiftUI's
`.overlay(alignment:)` does.

The overlay container used to shrink to fit its content and was centered with
`top: 50%; left: 50%; transform: translate(-50%, -50%)`. Content that expands
to fill (a shape, a `ZStack`, a `Color`) resolved to 0x0 inside it and drew
nothing unless the host's size was repeated with `.frame()`. The container is
now a layer covering the host (`inset: 0; display: flex`) and the alignment is
expressed on the flex axes, so content with an intrinsic size sits where it
did before and content that fills the host now fills it.

Offset semantics are pinned down at the same time. A numeric offset is an
inset from the anchored side, applied as padding on the layer, so the layer's
own edge stays on the host. An `{ x, y }` offset translates the layer by that
amount, positive `x` rightward and positive `y` downward; previously it was
added to whichever of `left` or `right` happened to be set, so its direction
depended on the alignment.
