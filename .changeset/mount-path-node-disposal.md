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

That mount also renders under a reactive owner of its own now. Without one, a
render there happened in no scope at all, so a memo or effect a component
created while rendering belonged to nothing and held whatever it subscribed to
for good — which components had been working around by not being reactive on
that path. That is most of the reason a control mounted in a sheet behaved
differently from the same control on a page: a `Button` given a signal for
`isEnabled` now follows it inside a sheet, popover or split-view region exactly
as it does elsewhere, and unmounting leaves nothing subscribed.
