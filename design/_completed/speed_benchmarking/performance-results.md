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

---

# Phase 1A Renderer Benchmarks – Nov 4, 2025

Commands executed:

```bash
pnpm --filter @tachui/core benchmark -- --reporter verbose
```

Environment: Node.js v22.20.0 (Vitest 3.2.4). Benchmark harness now auto-scales to **6 iterations / 1 warmup** when both cache modes run, with explicit `global.gc()` calls after each warmup/iteration to avoid OOM (see `packages/core/benchmarks/{setup,tachui-benchmarks}.ts`).

## Results (baseline mode)

| Operation | Duration (avg) | Renderer Metrics (created/adopted/removed) | Notes |
|-----------|----------------|-------------------------------------------|-------|
| Create 1 000 rows | 90.6 ms | 10 002 / 0 / 10 002 | Parent nodes now persist; child churn remains |
| Replace 1 000 rows | 86.0 ms | 10 002 / 1 / 1 | First adoption hit now retained |
| Partial update (every 10th) | 96.6 ms | 10 002 / 1 / 1 | Still rebuilding row nodes; to be addressed in Phase 1B |
| Select row | 98.3 ms | 10 002 / 1 / 1 | Class mutations dominate attr writes (8 001) |
| Swap rows | 97.1 ms | 10 002 / 1 / 1 | No DOM moves yet (child diff work pending) |
| Remove rows | 101.5 ms | 10 002 / 1 / 1 | Removal counts now match expected single delete |
| Clear rows | 97.9 ms | 10 002 / 1 / 1 | Parent nodes survive final clear |

### Structural coverage

- **Create 1 000 rows (sectioned table)**: 142.3 ms, metrics 10 006 / 0 / 10 006 – confirms nested `<tbody>` sections still churn and motivates Phase 1B row reuse.
- **Unkeyed list partial update**: 18.3 ms, metrics 2 001 / 1 / 1 – positional adoption path behaves as expected.

### Row-cache mode (for comparison)

Row cache remains slower (e.g., `Replace 1 000 rows` → 124.2 ms, `Partial update` → 174.7 ms) because the manual cache performs synchronous text/class mutations in addition to renderer work. Parent nodes now remain stable even when the external cache reuses row definitions.

## Observations

- Parent `<table>/<tbody>` elements are no longer re-created; DOM identity assertions via the new `parent-reuse.test.ts` integration test plus a JSDOM runtime probe both pass.
- Renderer metrics still show ~10 000 creates/removes per benchmark, highlighting Phase 1B’s focus: keyed child diff improvements to eliminate row churn.
- Attribute writes remain high (≈8 001 per run), reinforcing Phase 2’s attribute reconciliation priorities once child reuse is in place.

## Renderer metrics aggregation (Nov 2025 update)

Phase 2’s instrumentation work standardised how renderer counters are captured and reported:

- `packages/core/benchmarks/tachui-benchmarks.ts` now aggregates counters across measured iterations before logging them and attaches the summary to each `BenchmarkResult`. Warmups are excluded, so averages reflect only timed samples.
- The browser harness (`run-browser-benchmark.ts`) captures the same structure via Playwright. Each JSON artefact now ships a `rendererMetrics` object with the per-benchmark averages, maxima, totals, and per-iteration samples.
- Guardrails live in `packages/core/__tests__/runtime/renderer-metrics-guards.test.ts`. The suite fails if a keyed partial update ever reports more than a couple of creations/removals, or if the swap benchmark stops recording DOM moves.

Example console excerpt (Node harness with 12 iterations):

```
Renderer operation metrics (averages across measured iterations):
  Partial update (every 10th row): iterations=12 | created=avg:0,max:0,total:0, adopted=avg:10002,max:10002,total:120024, removed=avg:0,max:0,total:0, textUpdates=avg:100,max:100,total:1200
  Swap rows: iterations=12 | created=avg:0,max:0,total:0, adopted=avg:10002,max:10002,total:120024, moved=avg:996,max:996,total:11952, removed=avg:0,max:0,total:0
```

When reading these numbers:

- **Created / Removed** above ~50 on an update path (`Partial update`, `Select row`, `Swap rows`) means keyed reuse regressed and the new guards will fail.
- **Moved** should sit near 996 for the swap benchmark; a flat zero indicates the keyed diff is no longer issuing DOM moves.
- **Text updates** for partial updates should stay at ~100 (one per modified row). Any large spike suggests duplicate DOM writes.
- **Attribute writes** on the select benchmark will remain high (~8 001) until Phase 2 completes the attribute reconciliation project.
