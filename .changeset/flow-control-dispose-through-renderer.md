---
'@tachui/flow-control': patch
---

Dispose `Show` branches and `ForEach` items through the renderer that mounted them.

Both components own a private `DOMRenderer`, but dropped content by calling `node.dispose` alone. That reaches only what a component put on the node — everything the renderer registered against the element stayed live: reactive prop effects, reactive `style`/`className` effects, event delegation, and the `reactiveElement` bindings added in this release.

The renderer's `renderedNodes` is a strong `Set`, so the discarded nodes were retained as well. Twelve tracked nodes after five add/remove cycles of a single `ForEach` item, where two is correct; `Show` grew the same way per toggle.

Both now route through the new `DOMRenderer.disposeNode` for content that renderer has, keeping `node.dispose` for nodes dropped before they were ever mounted.

This is not the `Show`/`ForEach` defect in #318, where each `render()` spawns another `createRoot` and the stale effects keep writing into the same element. That one is untouched.
