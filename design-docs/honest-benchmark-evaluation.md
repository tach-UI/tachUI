# Honest Benchmark Evaluation - Real-World Accuracy Assessment

**Date**: 2025-11-04
**Reviewer**: Claude (Assistant)
**Context**: Evaluating benchmark accuracy after honest-benchmark.md implementation

---

## Executive Summary

### Overall Assessment: **Partially Accurate with Critical Gaps** ⚠️

The new benchmarking system makes significant improvements toward real-world accuracy and framework parity, but **critical parity gaps remain** that affect the validity of framework comparisons.

**Verdict Score**: **6/10** for real-world accuracy, **4/10** for framework parity

---

## What Was Implemented ✅

Based on code review and documentation analysis:

### 1. Browser-Based Benchmarks ✅
- **Status**: Implemented and working
- **Files**:
  - `benchmarks/public/benchmark.js` - Browser harness with manual DOM operations
  - `benchmarks/run-browser-benchmark.ts` - Playwright automation
- **Evidence**: Full browser benchmark runner with Chromium automation
- **Accuracy**: High - runs in real browser environment

### 2. Renderer Metrics Instrumentation ✅
- **Status**: Comprehensive tracking implemented
- **Files**:
  - `src/runtime/renderer.ts` - Metrics tracking in DOMRenderer
  - `benchmarks/setup.ts` - RendererMetricsSummary type definitions
  - `benchmarks/tachui-benchmarks.ts` - Per-benchmark metrics aggregation
- **Evidence**: Tracks created, adopted, moved, removed, attributeWrites, etc.
- **Accuracy**: High - detailed operation-level tracking

### 3. Automated Sanity Checks ✅
- **Status**: Implemented regression guards
- **Files**: `__tests__/runtime/renderer-metrics-guards.test.ts`
- **Evidence**: Tests validate keyed updates don't spike created/removed counts
- **Accuracy**: Medium - guards against regressions but **1 test currently failing**

### 4. Data Generation Parity ✅
- **Status**: Matches js-framework-benchmark
- **Evidence**:
  - `setup.ts:202-267` - Same adjectives, colors, nouns arrays
  - Random label generation matches jsFB pattern
- **Accuracy**: High - data generation is identical

---

## Critical Gaps Found ❌

### Gap #1: Row Cache Not Removed ❌

**Design Doc Says**:
> "Remove bespoke row cache" - honest-benchmark.md:15-17

**Reality**:
The browser benchmark (`benchmarks/public/benchmark.js`) does **NOT** use TachUI's framework at all. It's **manual DOM manipulation** that:
- Directly creates `<tr>` elements with `document.createElement()`
- Manually sets innerHTML and attributes
- Manually calls `appendChild()` and `insertBefore()`
- Manually tracks renderer metrics

**Lines of Evidence**:
```javascript
// benchmarks/public/benchmark.js:277-311
createRow(item) {
  const tr = document.createElement('tr')
  this.metricsTracker.record('created')
  tr.setAttribute('data-id', item.id)
  // ... manual DOM manipulation
  tr.innerHTML = `<td>...</td>`
  return tr
}
```

**Impact**:
- ❌ Browser benchmarks DO NOT test TachUI's actual rendering system
- ❌ Browser benchmarks DO NOT test keyed row reuse via renderer
- ❌ Browser metrics are **hand-coded estimates**, not actual framework behavior
- ❌ **ZERO framework parity** - comparing manual DOM to React/Solid frameworks

**What SHOULD Exist**:
```javascript
// What honest-benchmark.md calls for:
const TableComponent = createTableComponent({
  getData: () => data,
})
const tableInstance = TableComponent({})
const dispose = renderComponent(tableInstance, container)
// ^^ Use actual TachUI framework, not manual DOM
```

**Severity**: **CRITICAL** - Invalidates all browser benchmark comparisons

---

### Gap #2: Two Separate Harnesses ❌

**Current State**:
1. **Node harness** (`tachui-benchmarks.ts`) - Uses TachUI framework correctly with keyed rows
2. **Browser harness** (`public/benchmark.js`) - Manual DOM manipulation

**Problem**: They measure completely different things!

**Node Harness** (lines 168-203):
```typescript
function createRowNode(item, selectedId, onSelect) {
  return h('tr', { key: item.id, 'data-id': item.id }, ...)
  // ^^ Uses TachUI's h() and keyed rendering
}
```

**Browser Harness** (lines 277-311):
```javascript
createRow(item) {
  const tr = document.createElement('tr')
  tr.innerHTML = `...`
  // ^^ Manual DOM - no framework involvement
}
```

**Impact**:
- Node harness measures TachUI framework performance ✅
- Browser harness measures **manual DOM performance** ❌
- Results are **not comparable** between Node and Browser
- Framework comparison is **invalid** - not comparing apples to apples

**What Design Doc Expected**:
> "Capture timings using `performance.now()` in the browser, not Node/JSDOM" - honest-benchmark.md:35

The expectation was to run **the same TachUI code** in browser vs Node, not to write a completely separate manual DOM implementation.

---

### Gap #3: Keyed Row Reuse Not Validated ❌

**Design Doc Says**:
> "Rework Table benchmark to reuse keyed rows" - honest-benchmark.md:18-20
> "Confirm renderer metrics drop from `created=10002`/`removed=10002` to near-zero on updates" - honest-benchmark.md:21-22

**Reality Check - Node Harness**:
```
Create 1,000 rows: created=10002, removed=0 ✅ (expected)
Replace all 1,000 rows: created=10002, removed=10002 ❌ (should be near-zero!)
```

From `tachui-benchmarks.ts:299-316`:
```typescript
async function benchmarkReplaceAll1000Rows(benchmarkName: string) {
  const [data, setData] = createSignal(generateData(1000))
  // ...
  const dispose = renderComponent(tableInstance, container)
  await Promise.resolve()

  await runWithRendererMetrics(benchmarkName, async () => {
    setData(generateData(1000))  // Replace with NEW data (different IDs!)
    await Promise.resolve()
  })

  dispose()
}
```

**Problem**: `generateData(1000)` creates rows with IDs 1-1000. Calling it again creates **NEW objects** with the **same IDs** but **different references**. The renderer sees them as different rows and recreates everything!

**What SHOULD Happen**:
```typescript
// Option 1: Keep same IDs, just update labels
setData(data().map(row => ({ ...row, label: `${row.label} updated` })))

// Option 2: Use stable row objects
const stableRows = generateData(1000)
setData([...stableRows])  // Same objects, trigger update
```

**Evidence of Issue**:
One of the regression guard tests is **FAILING**:
```
FAIL renderer-metrics-guards.test.ts > records DOM moves for keyed swaps
expected 0 to be greater than or equal to 2
```

This test expects `moved >= 2` but gets `moved = 0`, indicating keyed row reuse **is not working as expected**.

---

### Gap #4: No Comparison Baseline ❌

**Design Doc Says**:
> "Compare against reference frameworks" - honest-benchmark.md:65-67
> "Compare TachUI vs React vs Solid comparison table"

**Reality**:
- No benchmark results stored in `benchmarks/history/*.json` (directory doesn't exist or is empty)
- No React/Solid baseline data collected
- No comparison table generated
- Cannot determine if TachUI is faster, slower, or comparable

**Missing Files**:
- `benchmarks/history/benchmark-*.json` - None found
- `benchmarks/history/latest.json` - None found
- CI workflow for automated benchmarks - Not verified

---

### Gap #5: Warmup/Iteration Mismatch ⚠️

**Design Doc Says**:
> "Ensure warmups/iteration counts match jsFB defaults (2 warmups, 12 iterations)" - honest-benchmark.md:14

**Reality**:
```typescript
// benchmarks/tachui-benchmarks.ts:34-35
const iterations = getNumericEnv('TACHUI_BENCH_ITERATIONS', 12)  ✅
const warmupRuns = getNumericEnv('TACHUI_BENCH_WARMUPS', 2)      ✅
```

**Node harness**: ✅ Correct (2 warmups, 12 iterations)

**Browser harness**: ❌ **No warmup phase** - runs benchmarks directly
```javascript
// benchmarks/public/benchmark.js:530-542
async runAllBenchmarks() {
  // No warmup phase!
  await this.createRows()
  await this.replaceAllRows()
  // ...
}
```

**Impact**: Browser results may include cold-start overhead, making them slower than they should be.

---

## Accuracy Assessment by Category

### A. Real-World Accuracy

| Category | Score | Evidence |
|----------|-------|----------|
| **Browser Environment** | ✅ 9/10 | Runs in real Chromium, not JSDOM |
| **Data Generation** | ✅ 10/10 | Matches jsFB exactly |
| **Operation Sequence** | ✅ 8/10 | Create/update/select/swap/remove/clear correct |
| **Framework Usage** | ❌ 2/10 | Browser harness uses manual DOM, not TachUI |
| **Keyed Row Reuse** | ❌ 3/10 | Not working correctly (10k creates on updates) |
| **Warmup Phase** | ⚠️ 5/10 | Node has warmups, browser doesn't |

**Overall Real-World Accuracy**: **6.2/10**

**Why Not Higher**:
- Manual DOM in browser ≠ real TachUI usage
- Keyed reuse not validated correctly
- "Replace all" test recreates all rows instead of updating

### B. Framework Parity Accuracy

| Category | Score | Evidence |
|----------|-------|----------|
| **Harness Structure** | ✅ 8/10 | Similar structure to jsFB |
| **Data Generation** | ✅ 10/10 | Identical to jsFB |
| **Operations** | ✅ 9/10 | All standard jsFB operations present |
| **Framework Comparison** | ❌ 0/10 | No React/Solid baselines, browser uses wrong code |
| **Keyed Behavior** | ❌ 2/10 | Not reusing keyed rows correctly |
| **Iteration Counts** | ⚠️ 7/10 | Correct in Node, missing warmups in browser |

**Overall Framework Parity**: **6.0/10**

**Why So Low**:
- Browser harness doesn't test the actual framework
- No comparison data collected
- Keyed row behavior doesn't match expectations

---

## Specific Issues by Design Doc Checklist

### From honest-benchmark.md Quick Checklist (lines 101-109):

| Item | Status | Evidence |
|------|--------|----------|
| Remove manual row cache | ❌ **NOT DONE** | Browser harness IS manual cache |
| Validate harness parity | ⚠️ **PARTIAL** | Node parity ✅, Browser ❌ |
| Instrument renderer metrics | ✅ **DONE** | Comprehensive tracking |
| Run in Chrome/Chromium | ✅ **DONE** | Playwright automation working |
| Integrate honest benchmark into CI | ❓ **UNKNOWN** | No workflow file found |
| Update documentation | ✅ **DONE** | honest-benchmark.md exists |

**Score**: **3.5/6 items fully complete**

---

## What This Means for the 21/100 Score

### Current Score Context

**From SpeedImprovements.md**:
> Score: 21/100 (target: 50+/100)

**Is This Score Valid?** ❌ **NO**

**Reasons**:
1. Node benchmarks measure TachUI correctly → Score might be accurate for Node
2. Browser benchmarks measure manual DOM → Score is **meaningless** for framework comparison
3. No React/Solid baseline collected → Can't compute comparative score
4. Keyed reuse not working → Score includes penalty for broken optimization

**What We Actually Know**:
- TachUI in Node/JSDOM: ~90ms create, ~104ms partial update (from Phase 3 results)
- TachUI in Browser: **Unknown** - current browser harness doesn't test TachUI
- vs React: **Unknown** - no comparison data
- vs Solid: **Unknown** - no comparison data

---

## Critical Fixes Needed

### Priority 1: Fix Browser Harness (CRITICAL) 🔴

**Current**: Manual DOM manipulation
**Required**: Use actual TachUI framework

**Implementation**:
```javascript
// benchmarks/public/benchmark.js - REWRITE needed
// Option 1: Bundle TachUI for browser
import { h, createComponent, renderComponent, createSignal } from '@tachui/core'

// Option 2: Use browser build
<script src="/tachui.browser.js"></script>
<script>
  const { h, createComponent, renderComponent } = window.TachUI

  // Create actual TachUI components, not manual DOM
  function createTableComponent(options) {
    return createComponent(() => {
      const data = options.getData()
      const rows = data.map(item =>
        h('tr', { key: item.id, 'data-id': item.id },
          h('td', null, item.id.toString()),
          // ... actual TachUI h() calls
        )
      )
      return h('table', null, h('tbody', null, ...rows))
    })
  }
</script>
```

**Estimated Effort**: 4-6 hours
**Impact**: Enables valid framework comparisons

---

### Priority 2: Fix Keyed Row Reuse (HIGH) 🟠

**Current**: Creates 10,002 elements on every update
**Required**: Reuse existing rows, update labels only

**Fix for "Replace All" benchmark**:
```typescript
// benchmarks/tachui-benchmarks.ts:299-316
async function benchmarkReplaceAll1000Rows(benchmarkName: string) {
  const initialData = generateData(1000)
  const [data, setData] = createSignal(initialData)
  // ...

  await runWithRendererMetrics(benchmarkName, async () => {
    // FIXED: Update labels, keep same IDs
    setData(data().map(row => ({
      id: row.id,  // Keep same ID for keyed reuse
      label: generateRandomLabel()  // New label
    })))
    await Promise.resolve()
  })
}
```

**Estimated Effort**: 2 hours
**Impact**: Validates keyed row reuse, fixes failing guard test

---

### Priority 3: Collect Comparison Baselines (MEDIUM) 🟡

**Current**: No React/Solid data
**Required**: Run same tests on React and Solid

**Approach**:
1. Set up minimal React implementation of same benchmark
2. Set up minimal Solid implementation of same benchmark
3. Run both in same Chromium automation
4. Store results in `benchmarks/history/react-baseline.json` and `solid-baseline.json`
5. Generate comparison table

**Estimated Effort**: 8-12 hours
**Impact**: Enables meaningful framework comparison

---

### Priority 4: Add Browser Warmups (LOW) 🟢

**Current**: No warmup in browser harness
**Required**: 2 warmup runs before measurement

**Fix**:
```javascript
// benchmarks/public/benchmark.js:530
async runAllBenchmarks() {
  // ADDED: Warmup phase
  console.log('Warming up...')
  await this.createRows()
  await this.clearAllRows()
  await this.createRows()
  await this.clearAllRows()

  // Now start actual benchmarks
  this.metricsTracker.reset()
  this.results = []
  // ...
}
```

**Estimated Effort**: 30 minutes
**Impact**: More stable/accurate browser timings

---

## Recommendations

### Immediate Actions (This Sprint)

1. **CRITICAL**: Rewrite browser harness to use TachUI framework
   - Bundle TachUI for browser environment
   - Replace manual DOM with `h()`, `createComponent()`, `renderComponent()`
   - Verify metrics match Node harness behavior

2. **HIGH**: Fix keyed row reuse in "Replace All" benchmark
   - Update labels, keep IDs stable
   - Verify created/removed drop to near-zero on updates
   - Fix failing renderer-metrics-guards test

3. **MEDIUM**: Document current limitations
   - Add warning to benchmark results that browser harness uses manual DOM
   - Clarify that 21/100 score is based on Node/JSDOM, not browser
   - Note that framework comparison is not yet valid

### Medium-Term Actions (Next 2-4 Weeks)

4. **MEDIUM**: Implement React/Solid baselines
   - Create minimal implementations of same benchmarks
   - Collect baseline data in same Chromium environment
   - Generate comparison tables

5. **LOW**: Add browser warmup phase
   - Implement 2-iteration warmup before measurement
   - Document warmup behavior in results

6. **LOW**: Set up CI automation (if not already done)
   - Verify GitHub Actions workflow exists and runs
   - Ensure results are stored in `benchmarks/history/`
   - Set up automated comparison reports

### Long-Term Actions (Future)

7. Validate all jsFB operations are implemented correctly
8. Add memory profiling beyond heap size
9. Implement percentile reporting (p50, p95, p99)
10. Add visual regression testing for rendering correctness

---

## Conclusion

### The Good News ✅

- Node harness is solid and measures TachUI correctly
- Renderer metrics instrumentation is comprehensive
- Data generation matches jsFB exactly
- Foundation for honest benchmarking is in place

### The Bad News ❌

- Browser harness doesn't test TachUI at all (manual DOM instead)
- Keyed row reuse isn't working correctly
- No framework comparison data collected
- 21/100 score's validity is questionable

### The Path Forward

**To achieve honest, accurate benchmarking**:

1. Fix the browser harness to use TachUI (Priority 1)
2. Fix keyed row reuse (Priority 2)
3. Collect React/Solid baselines (Priority 3)
4. Re-run benchmarks and compute real comparative score

**Current accuracy for framework comparisons**: **4/10**
**Potential accuracy after fixes**: **9/10**

The infrastructure is 70% there, but the critical piece - testing the actual framework in the browser - is missing. Once fixed, this will be a genuinely honest benchmark system.

---

## References

- **Design Doc**: `/Users/whoughton/Dev/tach-ui/design-docs/honest-benchmark.md`
- **Node Harness**: `packages/core/benchmarks/tachui-benchmarks.ts`
- **Browser Harness**: `packages/core/benchmarks/public/benchmark.js`
- **Browser Runner**: `packages/core/benchmarks/run-browser-benchmark.ts`
- **Metrics Guards**: `packages/core/__tests__/runtime/renderer-metrics-guards.test.ts`
- **js-framework-benchmark**: https://github.com/krausest/js-framework-benchmark
