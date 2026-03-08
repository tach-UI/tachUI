---
title: Runtime Internals
---

# Runtime Internals

The runtime coordinates component creation, scheduling, and DOM updates.

- **Signals** – created via `createSignal` / `createStore`, track subscribers automatically.
- **Effects** – wrap reactive work; dispose via cleanup callbacks.
- **Renderer** – translates declarative component output into DOM instructions with keyed diffing.
- **Lifecycle** – `mount`, `hydrate`, and the upcoming `memo` helpers live in `src/runtime`.

### Key files

| File | Purpose |
| --- | --- |
| `packages/core/src/runtime/index.ts` | Public runtime exports |
| `packages/core/src/runtime/component.ts` | Component factory + lifecycle |
| `packages/core/src/runtime/optimization.ts` | `memo`/`lazy` placeholders to finish in this milestone |

For more detail check the [runtime guide](/guide/runtime) or the tests under `packages/core/__tests__/runtime`.
