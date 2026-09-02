---
'@tachui/core': minor
'@tachui/types': minor
---

Add `DOMNode.owned`, so a component can hand the renderer an element it built itself.

Some content cannot be expressed as `DOMNode` children. An SVG subtree is the clearest case: node tags are created with `document.createElement`, and there is no namespace support, so `<path>` would come out as `HTMLUnknownElement` and never draw. Third-party widgets that own their own DOM have the same problem.

Components in that position had no option but to patch the DOM behind the renderer's back, from an effect created during `render()`. That does not work, for two reasons that were not obvious:

- `node.element` is assigned *after* `render()` returns, so such an effect has no element on its first run.
- `updateChildren` reconciles the node's declared children on every render and overwrites whatever was patched in.

`DOMNode.owned` marks a node whose element the caller supplies and owns:

```typescript
const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
// … build the subtree …

wrapper.children = [
  { type: 'element', tag: 'svg', props: {}, children: [], element: svg, owned: true },
]
```

The renderer mounts that element, never adopts a previously rendered element over it, and does not reconcile its children — so the subtree survives re-renders untouched while the surrounding tree updates normally. Supplying a *different* element on a later render replaces the mounted one, which is how owned content changes.

Content that can be expressed as children still should be; this is for the cases that genuinely cannot.

Two of the three guarantees held incidentally before — an empty child list happens to reconcile to a no-op — and would have broken silently the next time `updateChildren` changed. The third, replacement, did not work at all: `adoptNode` unconditionally overwrote a caller-supplied `element`, so owned content could be mounted but never updated. All three are now pinned by tests in `packages/core/__tests__/runtime/owned-elements.test.ts`.
