# Performance Benchmarks

TachUI includes a comprehensive benchmark suite aligned with industry standards, particularly the [js-framework-benchmark](https://github.com/krausest/js-framework-benchmark) specification.

## Overview

The benchmark suite measures TachUI's performance against other popular frameworks across critical scenarios that impact real-world user experience.

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