---
title: Runtime API
---

# Runtime API

| Function | Description |
| --- | --- |
| `createSignal<T>(initial: T)` | Returns `[getter, setter]` pair with fine-grained subscriptions |
| `createComputed(fn)` | Derives a value based on signals; memoized until dependencies change |
| `createEffect(fn)` | Runs `fn` reactively and re-runs when dependencies change |
| `onCleanup(fn)` | Register cleanup logic within effects/components |
| `memo(fn)` | (Planned) caches component subtrees |
| `lazy(() => import('./Component'))` | (Planned) lazy-loads components |

See `packages/core/src/runtime` for exact signatures. Full Typedoc tables will be published as part of the automation work.
