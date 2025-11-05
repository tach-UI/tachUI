# Performance Benchmarks

TachUI includes a comprehensive benchmark suite aligned with industry standards, particularly the [js-framework-benchmark](https://github.com/krausest/js-framework-benchmark) specification.

## Overview

The benchmark suite measures TachUI's performance against other popular frameworks across critical scenarios that impact real-world user experience. Earlier documentation referenced a 21/100 score from the legacy JSDOM-only harness; the combined Node + browser workflow supersedes that figure, and the first Chromium-backed run recorded under `benchmarks/history/` should be used as the current baseline.

## Running Benchmarks

### Mock DOM Benchmarks (CI/Testing)

#### Quick Benchmark
```bash
npm run benchmark:quick
```

Shows essential performance metrics in JSDOM environment (~25 seconds):
- Component creation time
- Reactive update performance
- Memory usage
- Overall performance score

#### Complete Benchmark Suite
```bash
npm run benchmark:compare
```

Runs the full benchmark suite with detailed framework comparison (~25 seconds):
- All js-framework-benchmark tests
- Memory usage analysis
- Cross-framework performance comparison
- Detailed performance report

#### Individual Benchmark
```bash
npm run benchmark
```

Runs all benchmarks with detailed timing but no framework comparison (~25 seconds).

Set the environment variable `TACHUI_BENCH_CACHE_MODE` to control manual row caching during the run:

- `baseline` – render without the benchmark-specific row cache
- `row-cache` – force the manual cache for cache-aware workloads
- `both` (default) – execute each table benchmark in both modes for side-by-side metrics

Each run prints the active cache modes and appends renderer metrics (DOM mutations, attribute writes/removals, text updates, modifier invocations, cache hits/misses) so you can quickly gauge the impact of renderer changes.

When both cache modes run together, the suite automatically reduces to 6 iterations and a single warmup per benchmark to keep memory usage manageable. Override via `TACHUI_BENCH_ITERATIONS` / `TACHUI_BENCH_WARMUPS` if you need different sample sizes, or lower them further if your environment still runs out of memory (e.g. set `TACHUI_BENCH_ITERATIONS=3` for extremely tight environments).

#### Browser Benchmark (Chromium)
```bash
npm run benchmark:browser:report
```

Launches Chromium, runs the full benchmark suite against the real DOM, and saves the results as JSON under `packages/core/benchmarks/results/browser/`. Use this when you need apples-to-apples comparisons with js-framework-benchmark or to validate optimizations outside the JSDOM environment.
> Note: The `benchmarks/public/` directory hosts the interactive demo harness used for manual experimentation. The automated `benchmark:browser:report` command executes the full TachUI benchmark suite via Playwright and is the source of the browser metrics consumed by the combined reports.

### Browser Benchmarks (Real Performance) ⚡

#### Quick Browser Benchmark
```bash
npm run benchmark:browser:quick
```

**Real-world performance in Chromium browser (~4 seconds):**
- ⚡ Create 1,000 rows: **~9ms** (vs 9,000ms in mock DOM)
- 🎯 Update every 10th row: **~0.4ms** (vs 400ms in mock DOM)
- 🚀 Component creation: **~1.2ms** for 1,000 components

#### Complete Browser Benchmark
```bash
npm run benchmark:browser
```

Full benchmark suite in real browser environment (~10 seconds) with all operations showing 100-1000x performance improvement over mock DOM testing.

#### Honest Benchmark Summary (Node + Browser + Comparison)
```bash
pnpm benchmark:browser:report    # optional fresh browser run (root command)
pnpm benchmark:report:combined
```

Generates a combined Node/browser summary, stores it under `benchmarks/history/`, and prints an updated TachUI vs React/Solid comparison table. CI runs this nightly via the `honest-benchmark` workflow and uploads the history artefact for traceability.
When a recent browser run is present, the comparison and performance score are based on the Chromium measurements; otherwise the script falls back to the Node (JSDOM) harness. The legacy 21/100 score is kept only for historical reference—always cite the latest browser-backed score emitted by the combined summary.

## Performance Reality Check

**The difference between mock DOM and real browser performance is dramatic:**

| Operation | Mock DOM (JSDOM) | Real Browser | Improvement |
|-----------|------------------|--------------|-------------|
| Create 1,000 rows | ~9,000ms | **~9ms** | **960x faster** |
| Update every 10th row | ~400ms | **~0.4ms** | **1,000x faster** |
| Component creation | ~140ms | **~1.2ms** | **117x faster** |

This demonstrates why:
- **Browser benchmarks** provide accurate performance data
- **Mock DOM benchmarks** are useful for regression detection but not real-world performance
- **TachUI's architecture** shines in real browser environments

## Benchmark Categories

### Standard Benchmarks (js-framework-benchmark aligned)

1. **Create 1,000 rows** - Component creation performance
2. **Replace all 1,000 rows** - Full re-render performance  
3. **Partial update** - Update every 10th row (most important for UX)
4. **Select row** - Single selection performance
5. **Swap rows** - Row reordering performance
6. **Remove rows** - Deletion performance
7. **Clear rows** - Full cleanup performance

### TachUI-Specific Benchmarks

8. **Component creation** - Raw component instantiation speed
9. **Reactive updates** - Signal/effect system performance

### Structural Coverage Benchmarks

10. **Create 1,000 rows (sectioned table)** - Nested `<tbody>` reuse validation  
11. **Unkeyed list partial update** - Positional adoption behaviour without keys

## Framework Comparisons

The benchmark suite compares TachUI against:

| Framework | Version | Architecture | Focus |
|-----------|---------|-------------|-------|
| **React** | 18.2.0 | Virtual DOM | Most popular |
| **Vue** | 3.3.0 | Virtual DOM | Progressive |
| **SolidJS** | 1.7.0 | Fine-grained | Closest to TachUI |
| **Svelte** | 4.0.0 | Compile-time | Zero runtime |
| **Angular** | 16.0.0 | Component-based | Enterprise |
| **Preact** | 10.15.0 | Virtual DOM | Lightweight |

## Measured Metrics

### Performance Metrics
- **Duration** - Time taken to complete operation (ms)
- **Operations per second** - Throughput measurement
- **Memory usage** - Heap memory consumption (MB)
- **Bundle size** - Framework overhead (KB)

### Renderer Metrics
- **DOM mutations** - Created, adopted, inserted, moved, removed counts
- **Cache hits/misses** - Structural node reuse effectiveness
- **Attribute writes/removals** - Prop churn at the DOM boundary
- **Text updates** - Text node mutations per benchmark
- **Modifier applications** - Modifier pipeline invocations

The Node harness aggregates these counters across measured iterations before logging them, and the browser automation now writes the same summaries alongside each JSON artefact. Expect console output similar to:

```
Renderer operation metrics (averages across measured iterations):
  Partial update (every 10th row): iterations=12 | created=avg:0,max:0,total:0, adopted=avg:10002,…
  Swap rows: iterations=12 | created=avg:0,max:0,total:0, moved=avg:996,max:996,total:11952,…
```

Use these heuristics when reviewing runs:
- **Created/Removed > ~50** on update paths (`Partial update`, `Select row`, `Swap rows`) means keyed reuse regressed; a dedicated guard lives in `packages/core/__tests__/runtime/renderer-metrics-guards.test.ts`.
- **Moved** should register for the swap benchmark (≈996 after the Phase 1B diff improvements). A flat zero indicates DOM moves are not being issued.
- **Text updates** should align with the number of rows touched (~100 for “every 10th”). Large spikes suggest redundant writes.
- **Attribute writes** remain high on the select benchmark until Phase 2’s attribute reconciliation work lands; track deltas rather than absolute numbers there.

### Performance Score
The benchmark suite calculates a weighted performance score (0-100):
- **Partial update: 25%** - Most important for UX
- **Create performance: 20%** - Initial load experience
- **Replace all: 15%** - Full refresh scenarios
- **Other operations: 10% each** - User interactions
- **Memory efficiency: 5%** - Resource usage

## Performance Targets

TachUI aims for industry-leading performance:

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| **Component Creation** | <30ms (1K components) | Fast initial load |
| **Reactive Updates** | <15ms (partial updates) | Smooth interactions |
| **Memory Usage** | <8MB (standard ops) | Efficient resource use |
| **Bundle Size** | <20KB (core framework) | Fast downloads |
| **Performance Score** | 80+ | Overall excellence |

## Architecture Benefits

TachUI's performance characteristics come from:

### 1. Direct DOM Manipulation
- No virtual DOM overhead
- Surgical DOM updates only where needed
- Minimal memory allocation

### 2. Fine-grained Reactivity
- Updates only changed values
- No unnecessary re-renders
- Efficient dependency tracking

### 3. Compile-time Optimization
- SwiftUI syntax compiled to optimal code
- Pre-computed operations
- Zero runtime type checking

### 4. Efficient Memory Management
- WeakMap-based cleanup
- Automatic garbage collection
- No memory leaks

## Understanding Results

### Good Performance Indicators
- ✅ Create operations < 35ms
- ✅ Update operations < 15ms  
- ✅ Memory usage < 8MB
- ✅ Bundle size < 20KB
- ✅ Performance score > 75

### Performance Score Ranges
- **90-100**: Exceptional performance
- **80-89**: Excellent performance  
- **70-79**: Good performance
- **60-69**: Acceptable performance
- **<60**: Optimization needed

## Development Integration

### Pre-commit Performance Check
```bash
# Add to your development workflow
pnpm --filter @tachui/core benchmark:quick
```

### CI/CD Integration
```yaml
# GitHub Actions example
- name: Performance Regression Check
  run: |
    cd packages/core
    SCORE=$(npm run benchmark:quick | grep "Performance score" | grep -o '[0-9]*')
    if [ $SCORE -lt 75 ]; then
      echo "Performance regression detected: $SCORE/100"
      exit 1
    fi
```

### Continuous Monitoring
Track performance over time by running benchmarks regularly:
- After major feature additions
- Before releases
- During optimization work

## Programmatic Usage

```typescript
import { runQuickBenchmark, runCompleteBenchmarkSuite } from '@tachui/core/benchmarks'

// Quick performance check
const results = await runQuickBenchmark()
console.log(`Performance score: ${results.performanceScore}/100`)

// Full comparison with report
const { summary, comparisonReport } = await runCompleteBenchmarkSuite()
console.log(comparisonReport)
```

## Benchmark Data

The benchmark suite uses realistic data patterns:
- 1,000 row dataset (standard for framework benchmarks)
- Randomized text content (adjective + color + noun)
- Standard table operations (create, update, select, remove)
- Memory pressure testing

## Contributing

When adding new benchmarks:

1. Follow existing benchmark patterns in `benchmarks/`
2. Use the `BenchmarkRunner` class for consistent measurement
3. Include warmup runs to stabilize results
4. Add corresponding tests in `tests/benchmarks.test.ts`
5. Update documentation

## Performance Philosophy

TachUI's approach to performance:

- **Measure Everything** - No optimization without measurement
- **Real-world Scenarios** - Benchmarks reflect actual usage
- **Comparative Analysis** - Always benchmark against alternatives
- **Continuous Improvement** - Performance is an ongoing commitment

## Next Steps

- Run your first benchmark: `npm run benchmark:quick`
- Compare against other frameworks: `npm run benchmark:compare`
- Integrate into your development workflow
- Share results with the community

---

*For detailed technical implementation, see `packages/core/README-benchmarks.md`*
