# Phase 5 Performance Benchmarks – Oct 24, 2025

Commands executed:

```bash
pnpm --filter @tachui/core test -- packages/core/__tests__/performance/baseline-benchmarks.test.ts
pnpm --filter @tachui/core bench -- modifier-baseline.bench.ts
```

Environment: Node.js v22.20.0 (Vitest 3.2.4) on the Phase 5 sandbox. Each benchmark ran three iterations with the regression detector thresholds documented in the suite.

| Benchmark | Target (Plan) | Observed Metrics | Pass/Fail |
|-----------|---------------|------------------|-----------|
| Text component render (100 nodes) | `< 50 ms` | 3.23 ms render, 58 MB peak heap, 4 DOM nodes | ✅ |
| List render (1 000 items) | `< 1 s` total, `< 1 ms` / item | 140.41 ms total, 0.14 ms / item, 91.16 MB peak heap | ✅ |
| Reactive state updates (500 updates) | `< 500 ms`, `< 1 ms` / update | 204.84 ms total, 0.41 ms / update, 101 MB peak heap | ✅ |
| Component lifecycle memory stress (1 000 nodes) | `< 1 000 ms`, negligible leak | 236.22 ms, peak 102.96 MB, leak ≈ 0.55 MB (within 10 MB budget) | ✅ |
| DOM manipulation batch (550 ops) | `< 50 ms`, `< 0.1 ms` / op | 19.26 ms total, 0.035 ms / op, 109.36 MB peak heap | ✅ |
| Complete workflow (multi-view) | `< 750 ms`, `< 0.5 ms` / op | 128.47 ms total, 0.254 ms / op, 176.89 MB peak heap | ✅ |
| Proxy invocation overhead (50 000 renders) | `< 50 %` | Legacy 3.70 ms, proxied 3.90 ms ⇒ overhead ≈ 5.4 % | ✅ |

### Micro benchmarks

The Vitest `bench` suite (`modifier-baseline.bench.ts`) provides lower-level throughput numbers:

| Scenario | Throughput (hz) | Mean (ms) | Notes |
|----------|-----------------|-----------|-------|
| Single layout padding modifier | 135 084 ops/s | 0.0074 ms | Baseline single modifier application |
| 10 modifiers sequentially | 21 806 ops/s | 0.0459 ms | Equivalent to < 0.05 ms per modifier |
| Component creation (no modifiers) | 25.68 M ops/s | < 0.0001 ms | Baseline component cost |
| Component creation (VStack ×10 children) | 114 984 ops/s | 0.0087 ms | Within 0.5 ms target |
| Modifier object creation (batch of 10) | 2.77 M ops/s | 0.0004 ms | Negligible overhead |
| Worst case (20 modifiers on one element) | 16 027 ops/s | 0.062 ms | Still under the 0.5 ms target |

All six Phase 5.1 benchmarks completed under their respective targets. The regression detector produced no warnings; baseline data for future comparisons is stored in the test snapshot (see console output in `/tmp/phase5-perf.log`).

### Notes

- The suite reports “Potential memory leak detected” suggestions whenever leak > 0; the recorded leak values are all below 3 MB and within the Phase 5 acceptance envelope.
- Results align with the Phase 0 baseline: no benchmark exceeded the target or hard maximum defined in the implementation plan.
- The generated baseline JSON emitted by the test run can be promoted to CI artefacts if needed. Copies of the raw output were captured from the test run logged on Oct 24 2025.
