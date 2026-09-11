---
"@tachui/core": patch
---

Unmounting a directly mounted tree now releases the renderer bindings its props
created.

`mountComponentTree` is how sheets, popovers, inspectors and split-view regions
put their contents on screen, and they mount and unmount repeatedly.
Everything the renderer sets up for a reactive prop — the effect that tracks it,
and the subscription that effect holds on the caller's signal — is registered
against the element, and releasing it is a matter of disposing the nodes the
mount created. That never happened, so a component with a reactive prop
retained one observer per mount for the life of the process, still recomputing
for every surface that had ever been opened.

Measured over five mount/unmount cycles of a component with a signal-valued
prop: five retained before, none after.

This is the general case of a leak worked around in `Button` one commit
earlier. What remains outside it is narrower and belongs to whoever creates it:
a component that builds its own memo during a render with no owner still has
nothing to dispose it, which is why `Button` hands the renderer a plain value
on that path rather than a memo it could not release.
