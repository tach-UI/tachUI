---
'@tachui/ssr': patch
---

Serialize an owned node from its element rather than as an empty tag.

An owned node's `tag`, `props` and `children` describe an empty shell — the element is the only description of the subtree — so `serializeNode` emitted `<svg></svg>` for content that had been built correctly. It now reads `element.outerHTML` where an element is present, which is the DOM-shimmed server case.

A node carrying a `reactiveElement` accessor has no `element` until the renderer mounts it, so the accessor is resolved instead, under `untrack` to keep the read out of whatever computation is serializing.

Where no DOM exists, the owner builds no element at all and nothing reaches this path. `DOMNode.owned` documents both halves of that contract: SSR reads the element, and an owner that cannot build one without a DOM — an accessor reaching for `createElementNS`, say — must emit no owned node rather than an elementless one.
