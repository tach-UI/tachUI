---
'@tachui/core': minor
'@tachui/types': minor
---

Add `DOMNode.owned` and `DOMNode.reactiveElement`, so a component can hand the renderer an element it built itself — and keep it up to date without re-rendering anything around it.

Some content cannot be expressed as `DOMNode` children. An SVG subtree is the clearest case: node tags are created with `document.createElement`, and there is no namespace support, so `<path>` would come out as `HTMLUnknownElement` and never draw. Third-party widgets that own their own DOM have the same problem.

Components in that position had no option but to patch the DOM behind the renderer's back, from an effect created during `render()`. That does not work, for two reasons that were not obvious:

- `node.element` is assigned *after* `render()` returns, so such an effect has no element on its first run.
- `updateChildren` reconciles the node's declared children on every render and overwrites whatever was patched in.

## `owned`: the renderer mounts an element it did not build

```typescript
const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
// … build the subtree …

wrapper.children = [
  { type: 'element', tag: 'svg', props: {}, children: [], element: svg, owned: true },
]
```

The renderer mounts that element, never adopts a previously rendered element over it, and does not reconcile its children — so the subtree survives re-renders untouched while the surrounding tree updates normally.

To replace the mounted element, supply a different element on a **fresh node object**: the reconciler pairs it with its predecessor and swaps, disposing the element it replaced so a widget's listeners and timers tear down rather than leaking. Mutating `element` on a node object the renderer has already mounted does nothing — that node reaches `updateExistingNode`, which leaves an owned element alone.

Because an owned node's `tag`, `props` and `children` describe an empty shell, the element is the only description of the subtree, and server-side rendering reads `element.outerHTML`. An owner that cannot build an element without a DOM should emit no owned node at all rather than an elementless one.

## `reactiveElement`: the renderer subscribes, the component describes

Replacement-on-a-fresh-node only fires when the parent re-renders, which is the wrong trigger for content that changes on its own schedule — an icon finishing an async load, say. The obvious workaround is worse: a component's `render()` does not run in its own reactive scope, so reading a signal there subscribes the *enclosing* component and the whole surrounding subtree re-renders.

`reactiveElement` closes that gap by giving the renderer an accessor instead:

```typescript
{ type: 'element', tag: 'svg', props: {}, children: [], reactiveElement: buildCurrentIcon }
```

The renderer subscribes at mount and, when the accessor yields a different element, swaps the mounted one for it — running the replaced element's cleanups and keeping its own bookkeeping in step. This is the same mechanism a reactive `className` or `style` prop already uses: a per-element binding created inside the enclosing render pass, which dies with that pass and is rebuilt by the next one. The component reads no signals in `render()`, holds no scope of its own, and never touches the element the renderer built.

`tag` names the slot rather than the current element, and must stay stable across renders so the reconciler pairs the node with its predecessor.

## Reactive props now yield to external writes

Two supporting changes, both needed for modifiers to coexist with content that repaints:

- **`setElementStyles`** compared against the live DOM value, so a reactive style run re-asserted every property a modifier had changed — `frame({ width: 40 })` was clobbered back the moment an unrelated value updated. It now records what it wrote, read back off the element so browser normalisation of colours and lengths is absorbed, and skips a property whose live value it did not write. The reactive prop resumes control once that external value is removed.
- **`applyClassName`** assigned `className`, dropping every class a modifier had added to the same element. It now diffs the class list.

## `DOMRenderer.disposeNode`

Dispose a node and its descendants without removing them from the DOM, for callers that swap a whole subtree out themselves. `Show` and `ForEach` do exactly that and previously called `node.dispose` alone, which reaches only what a component put on the node — leaving the renderer's per-element cleanups running and its rendered-node set growing.
