---
'@tachui/modifiers': patch
---

Two corrections to the overlay layer.

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
