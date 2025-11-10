---
title: Core Performance
---

# Core performance

tachUI targets <16 KB gzipped for the core runtime and sub-millisecond reactive updates for typical workloads.

## Baselines

- Text render: **2.44 ms**
- List render (1k rows): **125 ms**
- Reactive updates (500 iterations): **0.38 ms avg**
- Memory leak tests: net **-2.75 MB** (cleanups applied)

## Checklist

1. Prefer signals over derived state inside components.
2. Use upcoming `memo` helper for expensive child trees.
3. Keep console logging behind the new logger to avoid shipping debug noise.
4. Run `pnpm benchmark:quick` before publishing runtime changes.

See [`packages/core/__tests__/performance`](https://github.com/tach-ui/tachUI/tree/main/packages/core/__tests__/performance) for living documentation of the benchmarks.
