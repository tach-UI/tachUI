# Performance Benchmarks

TachUI includes a comprehensive benchmark suite aligned with industry standards, particularly the [js-framework-benchmark](https://github.com/krausest/js-framework-benchmark) specification.

## Running Benchmarks

### Mock DOM Benchmarks (CI/Testing)

#### Quick Benchmark
```bash
npm run benchmark:quick
```
Runs essential performance tests in JSDOM environment (~25 seconds).

#### Complete Benchmark Suite
```bash
npm run benchmark:compare
```
Runs all benchmarks and generates detailed comparison report (~25 seconds).

#### Individual Benchmark
```bash
npm run benchmark
```
Runs full benchmark suite without framework comparison (~25 seconds).

### Browser Benchmarks (Real Performance) ⚡

#### Quick Browser Benchmark (Recommended)
```bash
npm run benchmark:browser:quick
```
Real-world performance in Chromium browser (~2 seconds).
**Results**: Create 1K rows in ~9ms, Update every 10th row in ~0.4ms!

#### Complete Browser Benchmark
```bash
npm run benchmark:browser
```
Full benchmark suite in real browser environment (~10 seconds).

#### Running from Root Directory
```bash
# From project root (works anywhere)
npm run benchmark:browser:quick
npm run benchmark:browser
npm run benchmark:quick
npm run benchmark:compare
```

## Performance Comparison

| Environment | Create 1K Rows | Update 10th Row | Component Creation |
|-------------|-----------------|-----------------|-------------------|
| **Mock DOM (JSDOM)** | ~9,000ms | ~400ms | ~140ms |
| **Real Browser** | **~9ms** | **~0.4ms** | **~1.2ms** |
| **Improvement** | **~960x faster** | **~1,000x faster** | **~117x faster** |

## Important Notes ⚠️

- **Mock Environment**: JSDOM benchmarks (~10,000ms) for CI/testing compatibility only
- **Browser Environment**: Playwright benchmarks (~9ms) show real-world performance
- **Dramatic Difference**: Real browser is **1,000x faster** than mock DOM
- **Development Recommendation**: **Always use browser benchmarks** for performance evaluation
- **CI/Documentation**: JSDOM results should be ignored for performance claims

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

## Measured Metrics

- **Duration** - Time taken to complete operation (ms)
- **Operations per second** - Throughput measurement
- **Memory usage** - Heap memory consumption (MB)
- **Bundle size** - Framework overhead (KB)

## Framework Comparisons

The benchmark suite compares TachUI against:

- **React 18.2.0** - Most popular framework
- **Vue 3.3.0** - Progressive framework
- **SolidJS 1.7.0** - Fine-grained reactivity (closest architecture)
- **Svelte 4.0.0** - Compile-time optimized
- **Angular 16.0.0** - Enterprise framework
- **Preact 10.15.0** - Lightweight React alternative

## Performance Targets

TachUI aims for:

- **Sub-30ms** component creation (1K components)
- **Sub-15ms** reactive updates (partial updates)
- **<8MB** memory usage for standard operations
- **<20KB** bundle size for core framework

## Architecture Benefits

TachUI's performance characteristics come from:

1. **Direct DOM Manipulation** - No virtual DOM overhead
2. **Fine-grained Reactivity** - Surgical updates like SolidJS
3. **Compile-time Optimization** - Pre-computed operations
4. **Efficient Memory Management** - WeakMap-based cleanup
5. **TypeScript-first** - Zero runtime type checking

## Understanding Results

### Good Performance Indicators
- Create operations < 35ms
- Update operations < 15ms  
- Memory usage < 8MB
- Bundle size < 20KB

### Performance Score
The benchmark suite calculates a weighted performance score (0-100):
- Partial update: 25% weight (most important for UX)
- Create performance: 20% weight
- Replace all: 15% weight
- Other operations: 10% each
- Memory efficiency: 5% weight

## Development Usage

```typescript
import { runQuickBenchmark, runCompleteBenchmarkSuite } from '@tachui/core/benchmarks'

// Quick performance check
const results = await runQuickBenchmark()
console.log(`Performance score: ${results.performanceScore}/100`)

// Full comparison
const { summary, comparisonReport } = await runCompleteBenchmarkSuite()
console.log(comparisonReport)
```

## Continuous Monitoring

Benchmarks can be integrated into CI/CD pipelines to track performance regressions:

```yaml
# GitHub Actions example
- name: Run Performance Benchmarks
  run: npm run benchmark:compare
  
- name: Check Performance Regression
  run: |
    SCORE=$(npm run benchmark:quick | grep "Performance score" | grep -o '[0-9]*')
    if [ $SCORE -lt 75 ]; then
      echo "Performance regression detected: $SCORE/100"
      exit 1
    fi
```

## Contributing Benchmarks

When adding new benchmarks:

1. Follow the existing benchmark patterns
2. Use the `BenchmarkRunner` class for consistent measurement
3. Include warmup runs to stabilize results
4. Add corresponding tests in `tests/benchmarks.test.ts`
5. Update this documentation

## Interpreting Results

- **Lower is better** for duration/time measurements
- **Higher is better** for operations per second
- **Lower is better** for memory usage and bundle size
- **Scores 80+** indicate excellent performance
- **Scores 60-79** indicate good performance  
- **Scores <60** may indicate optimization opportunities

## Phase 5 Results Snapshot

As part of the Phase 5 security & performance validation we recorded the following metrics (see `benchmarks/performance-results.md` for the full table):

| Scenario | Observed |
|----------|----------|
| Text component render (100 nodes) | 3.23 ms total, peak heap 58 MB |
| List render (1 000 items) | 140 ms total, 0.14 ms/item |
| Reactive state updates (500 updates) | 205 ms total, 0.41 ms/update |
| Component lifecycle memory stress | 236 ms runtime, ~0.55 MB leak |
| DOM manipulation batch (550 ops) | 19 ms total, 0.035 ms/op |
| Complete workflow simulation | 128 ms total, 0.25 ms/op |
| Proxy vs builder render overhead | ~5.4 % |

Security audits (summarised in `benchmarks/security-audit.md`) confirmed:

- Forbidden modifier names (`__proto__`, `constructor`, etc.) are rejected by the registry.
- Unverified plugins trigger the documented console warning.
- HTML sanitisation strips script blocks, inline handlers, and `javascript:` URLs before modifiers run.
- No production use of `eval`/`Function` was found (limited to test harnesses).
- `pnpm audit` could not run inside the sandbox (IPC blocked); dependency scanning should continue in CI outside the restricted environment.
