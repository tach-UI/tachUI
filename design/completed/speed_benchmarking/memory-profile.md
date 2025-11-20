# Phase 5 Memory Profile – Oct 24, 2025

Commands executed:

```bash
pnpm --filter @tachui/core test -- packages/core/__tests__/performance/baseline-benchmarks.test.ts
pnpm --filter @tachui/core test -- packages/core/__tests__/performance/memory-usage-tracking.test.ts
```

### Component Lifecycle Memory Benchmark

| Metric | Observed | Plan Expectation |
|--------|----------|------------------|
| Peak heap usage | 102.96 MB | ≤ 150 MB |
| Final leak (final − initial) | 0.55 MB | ≤ 10 MB |
| Total components created | 1 000 | — |
| Execution time | 236.22 ms | ≤ 1 000 ms |

The benchmark creates/destroys 20 components across 50 cycles. Garbage collection hints are honoured and the measured leak stays well below the 10 MB ceiling.

### Memory Usage Tracker Validations

The dedicated tracker tests (`memory-usage-tracking.test.ts`) exercise the Phase 5.3 monitoring utilities:

- **Heap alerts:** critical/warning thresholds fire when simulated usage crosses configured limits.
- **GC pressure detection:** synthetic GC pressure triggers the expected alerts.
- **Long-running monitoring:** one-minute stress loops maintain stable snapshots without timer drift.
- **Fallback behaviour:** when neither `performance.memory` nor `process.memoryUsage` is available, the tracker estimates usage from Node’s heap statistics without crashing.

Summary of alert assertions:

| Scenario | Result |
|----------|--------|
| Warning threshold (heap) | Warning raised at 10 MB, critical at 15 MB |
| Memory growth rate | Alert issued when growth > 20 % per sample window |
| Leak detection | Deemed critical once leak exceeded 25 MB |
| GC pressure | Warning emitted when GC frequency doubled baseline |

All tracker APIs returned structured analyses and recommendations, satisfying the Phase 5 memory monitoring deliverable.
