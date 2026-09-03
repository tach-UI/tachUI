---
'@tachui/flow-control': patch
'@tachui/core': patch
---

Fix `Show` and `ForEach` corrupting their output when the element they live in re-renders.

A `Show` sitting on its fallback rendered `NONO` the next time its parent re-rendered, and a two-item `ForEach` rendered `bab`. The wrong content stayed on screen until the condition or the collection changed again, at which point it silently corrected itself.

Two writers, and neither knew about the other. Both components built a container node in `render()` and then patched that node's element directly from an effect created in the same call. `render()` runs on every render of the node, not only the first, so each one left another live effect writing into the same element — and the mounting renderer went on reconciling the node's declared `children` against its own record of what it had put there. The moment the branch changed without a re-render, the two records disagreed: the renderer still believed the *previous* branch was mounted, and the next re-render paired the incoming branch against elements that had been swapped out, leaving both in the DOM.

The container is now an owned node (`DOMNode.owned`), so the component fills it and the renderer mounts it without reconciling its children — one writer, one record. The subscription goes over as `reactiveElement` rather than being created in `render()`, so the renderer owns it: it retires the previous binding when it adopts the node's successor and rebinds one that outlived its render pass, which means exactly one effect maintains the container however many times the node is rendered.

The container element is created once and kept for the life of the component. That is what makes a re-render idempotent — the node handed over on the second render carries the same element as the first, so the reconciler pairs the two and mounts nothing new — and it keeps modifiers applied to a `Show` or `ForEach` on the element they were applied to.

Both now update rather than rebuild. `Show` reconciles the re-rendered branch against the mounted one, so a re-render that produces the same shape updates elements in place; a genuine branch swap is still a teardown, since reconciling one branch against the other would pair elements by position with no regard for what they are. `ForEach` inserts and removes rather than calling `replaceChildren`, which re-inserted every element and so dropped focus and reset scroll inside items that had not changed.

Where there is no DOM, both emit an ordinary node carrying the current content as children, as `DOMNode.owned` requires of an owner that cannot build its element server-side.

Two supporting fixes in `@tachui/core`'s renderer, both only reachable once a node outlives a single render:

- Registering the same cleanup function against an element twice now registers it once. A node's `dispose` is registered on every render of that node, so a component handing over a stable disposer — as one holding DOM across renders must, to be disposed at all — collected one entry per render of the enclosing element for the life of the mount.
- Disposing a node now clears what it remembers about the render that mounted it. A node object can outlive its element, since a component that caches the nodes it built hands the same objects back later; kept, those records were diffed against children whose elements were gone, and an identical child list took the update path, found nothing mounted, and rendered nothing.

Fixes #318.
