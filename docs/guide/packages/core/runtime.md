---
title: Runtime Internals
---

# Runtime Internals

The runtime coordinates component creation, scheduling, and DOM updates.

- **Signals** – created via `createSignal` / `createStore`, track subscribers automatically.
- **Effects** – wrap reactive work; dispose via cleanup callbacks.
- **Renderer** – translates declarative component output into DOM instructions with keyed diffing.
- **Lifecycle** – `mount`, `hydrate`, and the upcoming `memo` helpers live in `src/runtime`.

## Elements owned by a component

`DOMNode.owned` lets a component supply an element whose contents it manages,
such as a namespaced SVG or a third-party widget. The renderer mounts that
element and leaves its props and children alone. Ordinary content should use
declarative nodes so the renderer can reconcile it.

There are two supported ways to replace an owned element:

- Return a **fresh node object** with a different `element` during a parent
  render. Reconciliation replaces the previous element and runs its cleanups.
- Supply a **`reactiveElement` accessor**. The renderer subscribes to it and
  replaces the mounted element when the accessor returns a different instance.
  This also works when the component reuses the same node object, and does not
  require the parent to render again. Keep `tag` stable and return the same
  element instance until a replacement is needed.

Assigning a new `element` to an already mounted node object is deliberately
unsupported. A parent render is not a notification that an owned element has
changed. Use one of the two replacement routes above; changing the contents of
the existing element remains the owner's responsibility.

This contract keeps replacement and cleanup on the existing reconciliation or
reactive binding paths. The framework's Symbol, shape, and flow-control
components use `reactiveElement`; none requires an additional replacement path
based on mutating the node object.

Apply modifiers to a wrapper node: modifiers on an owned node do not transfer
to replacements made by its accessor. Owned elements must contain trusted or
sanitized content. Server rendering requires a supplied DOM element (or an
accessor that can produce one); components that cannot create one on the server
must omit the owned node there.

### Key files

| File | Purpose |
| --- | --- |
| `packages/core/src/runtime/index.ts` | Public runtime exports |
| `packages/core/src/runtime/component.ts` | Component factory + lifecycle |
| `packages/core/src/runtime/optimization.ts` | `memo`/`lazy` placeholders to finish in this milestone |

For more detail check the [runtime guide](/guide/runtime) or the tests under `packages/core/__tests__/runtime`.
