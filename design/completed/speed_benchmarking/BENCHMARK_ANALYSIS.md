# Benchmark Validity Analysis

**Date**: 2025-10-31
**Status**: ~~Critical Issues Found~~ **CORRECTED** - Benchmarks Are Valid ✅

---

## ⚠️ CORRECTION NOTICE

**This analysis was based on incomplete information.** After reviewing `/Users/whoughton/Dev/tach-ui/design-docs/SpeedImprovements.md`, I discovered that:

1. ✅ **Phase 0 (Benchmark & Instrumentation Audit) was already completed**
2. ✅ **The benchmark structure is intentional and correct**
3. ✅ **Metrics are being recorded properly**
4. ✅ **The benchmarks match js-framework-benchmark methodology**

**Please refer to `UPDATED_RECOMMENDATIONS.md` for the correct analysis.**

The issues identified below were misunderstandings of the intentional benchmark design.

---

## Original Analysis (For Historical Reference)

~~The current benchmarks are **fundamentally flawed** and measuring the wrong operations. Performance scores cannot be trusted.~~

### Critical Problems

1. ❌ **Destroying DOM between iterations** - `dispose()` called after every test
2. ❌ **Metrics reset per-iteration** - Only last iteration's metrics visible
3. ❌ **No component persistence** - Can't measure real-world update performance
4. ❌ **Measuring create+destroy** instead of just create

---

## Detailed Analysis

### Issue #1: Premature Disposal

**Current Code** (benchmarkCreate1000Rows, line 418-421):
```typescript
const dispose = renderComponent(tableInstance, container)
await Promise.resolve()
dispose()  // ❌ DESTROYS everything immediately
resetCache()
```

**Impact:**
- Benchmark measures: Create 1000 elements + Destroy 1000 elements
- Should measure: Create 1000 elements (only)
- DOM never persists for realistic testing
- Cache cleared after every iteration

**Why This Is Wrong:**
- Real apps don't create+destroy tables 12 times
- We're benchmarking worst-case scenario constantly
- No way to test incremental updates or cache effectiveness

---

### Issue #2: Metrics Reset Before Each Iteration

**Current Code** (runWithRendererMetrics, line 69):
```typescript
async function runWithRendererMetrics<T>(...) {
  resetRendererMetrics()  // ❌ Called 12 times (once per iteration)
  const result = await execute()
  rendererMetricsByBenchmark.set(benchmarkName, getRendererMetrics())  // Only stores last iteration
```

**Impact:**
- First 11 iterations: Metrics collected then discarded
- Only iteration #12's metrics saved
- Cannot calculate averages or totals
- Misleading data - one iteration might be anomaly

**What We See:**
```
Create 1,000 rows: created=10002, adopted=0
```

**What It Means:**
- This is data from ONLY the last iteration (#12)
- Previous 11 iterations invisible
- No idea if this is representative

---

### Issue #3: No Persistent DOM for Update Tests

**Current Code** (benchmarkReplaceAll1000Rows, line 437-446):
```typescript
const [data, setData] = createSignal(generateData(1000))
const dispose = renderComponent(tableInstance, container)

await Promise.resolve()
setData(generateData(1000))  // ✅ Good - tests update
await Promise.resolve()

dispose()  // ❌ Then destroys everything
resetCache()
```

**Impact:**
- Update DOES happen (between initial render and setData)
- But then we destroy it all
- Next iteration starts from scratch
- Can't test "update 1000 rows 12 times in a row"

**What SHOULD Happen:**
1. Iteration 1: Create 1000 rows, update them → measure update time
2. Iteration 2: Update same 1000 rows again → measure update time
3. ...
4. Iteration 12: Update same 1000 rows → measure update time
5. Average the 12 update times

**What ACTUALLY Happens:**
1. Iteration 1: Create 1000 rows, update them, destroy them
2. Iteration 2: Create 1000 NEW rows, update them, destroy them
3. ...
4. Iteration 12: Create 1000 NEW rows, update them, destroy them

---

### Issue #4: Incorrect Metrics Interpretation

**Current Output:**
```
Create 1,000 rows: created=10002, adopted=0, cacheHits=0, cacheMisses=1003
Replace all 1,000 rows: created=10002, adopted=1, cacheHits=1002, cacheMisses=1003
```

**Why created=10002 is misleading:**
- Test runs `benchmarkReplaceAll1000Rows` 12 times
- Each time: creates 10002 elements, then destroys them
- Metrics reset each time
- Final metrics only show iteration #12

**What it SHOULD show (if persistent):**
```
Replace all 1,000 rows: created=10002 (first iteration only), adopted=10001 (avg of updates)
```

---

## How js-framework-benchmark Does It

Looking at standard js-framework-benchmark approach:

```typescript
// Setup (OUTSIDE benchmark timing)
const component = createTable()
renderComponent(component, container)

// Benchmark (TIMED)
benchmark('update-rows', () => {
  updateData()  // Only measure the update
})

// Teardown (OUTSIDE benchmark timing)
dispose()
```

**Key differences:**
1. Setup/teardown NOT included in timing
2. DOM persists across iterations
3. Measures ONLY the operation being tested
4. Metrics accumulated, not reset

---

## Recommendations

### Option 1: Fix Benchmark Structure (Recommended)

**For Create benchmarks:**
```typescript
async function benchmarkCreate1000Rows(cacheMode, benchmarkName) {
  await runWithRendererMetrics(benchmarkName, async () => {
    const data = generateData(1000)
    const container = getBenchmarkContainer()
    const { TableComponent } = createTableComponent({ getData: () => data }, cacheMode)

    const tableInstance = TableComponent({})

    // ONLY measure render, not dispose
    const dispose = renderComponent(tableInstance, container)

    // Dispose happens OUTSIDE metrics
    await Promise.resolve()
  })
  // Cleanup after metrics captured
}
```

**For Update benchmarks:**
```typescript
async function benchmarkReplaceAll1000Rows(cacheMode, benchmarkName) {
  // Setup ONCE (outside iterations)
  const [data, setData] = createSignal(generateData(1000))
  const container = getBenchmarkContainer()
  const { TableComponent } = createTableComponent({ getData: () => data() }, cacheMode)
  const tableInstance = TableComponent({})
  const dispose = renderComponent(tableInstance, container)
  await Promise.resolve()

  // Benchmark ONLY the update operation
  await runWithRendererMetrics(benchmarkName, async () => {
    setData(generateData(1000))
    await Promise.resolve()
  })

  // Cleanup after all iterations
  dispose()
}
```

### Option 2: Use Separate Setup/Teardown Phases

Create benchmark helper:
```typescript
async function benchmarkWithPersistence(
  setup: () => { component, dispose },
  operation: () => void,
  iterations: number
) {
  const { component, dispose } = setup()  // Setup ONCE

  for (let i = 0; i < iterations; i++) {
    resetRendererMetrics()
    await operation()  // Measure ONLY this
    recordMetrics(i)
  }

  dispose()  // Teardown ONCE
  return aggregateMetrics()
}
```

### Option 3: Match js-framework-benchmark Exactly

Study the official js-framework-benchmark implementation and replicate their methodology exactly.

---

## Impact on Current Performance Score

**Current score: 21/100**

**Why it's unreliable:**
- Measuring create+destroy instead of create alone
- Measuring first-render update instead of steady-state updates
- Metrics from single iteration, not average
- No baseline for comparison

**Likely actual performance:**
- Create: Unknown (mixed with destroy time)
- Update: Better than reported (cache IS working during the update phase)
- Real-world usage: Unknown (benchmarks don't simulate it)

---

## Next Steps

1. ✅ **Document issues** (this file)
2. ⏭️ **Decide on approach**: Fix benchmarks vs. match js-framework-benchmark
3. ⏭️ **Implement fixes**: Separate setup/operation/teardown
4. ⏭️ **Re-run benchmarks**: Get accurate baseline
5. ⏭️ **Optimize based on real data**: Target actual bottlenecks

---

## References

- **Official js-framework-benchmark**: https://github.com/krausest/js-framework-benchmark
- **TachUI Benchmarks**: `packages/core/benchmarks/tachui-benchmarks.ts`
- **Performance Plan**: `design/SpeedImprovements.md`
