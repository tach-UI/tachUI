---
title: '@tachui/core'
---

# @tachui/core

`@tachui/core` is the runtime that powers everything else—signals, scheduler, DOM renderer, hydration, and diagnostic utilities.

## Install

```bash
pnpm add @tachui/core@0.8.0-alpha
```

## Highlights

- Fine-grained signals with automatic dependency tracking
- DOM renderer with keyed diffing and zero VDOM overhead
- Built-in scheduling + batching for predictable updates
- Hooks for memoization (`memo`, `lazy`) landing this cycle

## Next steps

- [Runtime internals](/packages/core/runtime)
- [Performance guidance](/packages/core/performance)
- [API reference](/api/runtime)
