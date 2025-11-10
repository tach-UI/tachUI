---
title: Utility API
---

# Utility API

| Utility | Description |
| --- | --- |
| `createStore` | Proxy-based reactive store for object graphs |
| `batch(fn)` | Batch multiple signal updates |
| `untrack(fn)` | Execute code without tracking dependencies |
| `onMount(fn)` | Run logic when a component is mounted |
| `onCleanup(fn)` | Register teardown logic |
| `nextTick()` | Await DOM flush |

> This section will sync with TypeDoc output once `pnpm docs:api` is wired into CI.
