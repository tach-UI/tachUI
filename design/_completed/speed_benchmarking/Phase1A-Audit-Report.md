# Phase 1A Audit Report: DOM Rendering Analysis

**Date**: 2025-10-31
**Status**: Audit Complete
**Priority**: Critical

---

## Executive Summary

The TachUI renderer already implements sophisticated node reuse logic. However, **the benchmark creates new JavaScript objects for structural nodes (`<table>`, `<tbody>`) on every render**, preventing the renderer from reusing existing DOM elements.

**Root Cause**: Component render functions return new `DOMNode` objects (via `h()` helper) each time, so the renderer's `node.element` check fails even when the underlying structure is identical.

**Recommendation**: Implement **key-based DOM element cache** in `renderComponent()` to persist structural nodes across renders.

---

## Current Implementation Analysis

### 1. Renderer (`renderer.ts`)

#### Strengths ✅

- **`createOrUpdateElement()`** (lines 169-191): Checks if `node.element` exists and reuses:
  ```typescript
  if (node.element && node.element instanceof Element) {
    const element = node.element
    this.updateProps(element, node)
    this.updateChildren(element, node)
    return element  // ✅ Reuses existing element
  }
  ```

- **`updateChildren()`** (lines 238-326): Sophisticated reconciliation:
  - Identity check fast path (lines 242-252)
  - Keyed map diffing (lines 263-269)
  - Positional fallback for unkeyed children (lines 283-291)

- **`adoptNode()`** (lines 783-806): Transfers DOM ownership between old/new nodes:
  ```typescript
  adoptNode(oldNode: DOMNode, newNode: DOMNode): void {
    const element = this.nodeMap.get(oldNode)
    if (!element) return
    this.nodeMap.set(newNode, element)  // ✅ Reuse DOM element
    newNode.element = element
    this.metrics.adopted++
  }
  ```

- **Metrics tracking**: `created`, `adopted`, `removed`, `inserted`, `moved`

#### Limitations ⚠️

- **`createOrUpdateElement()` only reuses if `node.element` is set**
- When component returns new `h()` objects, `node.element` is undefined
- No key-based element cache to persist structural nodes

### 2. Component Rendering (`renderComponent()`, lines 880-1002)

#### Strengths ✅

- Root-level reconciliation with multiple strategies:
  1. **Positional adoption** (lines 897-912): Reuse by index if type/tag/key match
  2. **Key-based adoption** (lines 914-944): Lookup old nodes by key
  3. **Type/tag fallback** (lines 946-959): Match unkeyed nodes by type+tag

#### Limitations ⚠️

- Only adopts **top-level nodes** (direct children of container)
- Does not help with structural parents (`<table>`, `<tbody>`) that are nested

### 3. Benchmark Implementation (`tachui-benchmarks.ts`)

#### Current Pattern

```typescript
const TableComponent = createComponent(() => {
  const data = options.getData()
  const rows = data.map(item => ensureRowNode(item, rowCache, ...))  // ✅ Cached

  return h(  // ⚠️ NEW object every render
    'table',
    { className: '...', key: 'table-root' },
    h('tbody', { key: 'table-body' }, ...rows)  // ⚠️ NEW object every render
  )
})
```

#### Analysis

- **Row nodes**: ✅ Cached via `ensureRowNode()` + `rowCache` Map
- **Table/tbody nodes**: ⚠️ Created new every render (lines 108-112)
- Even with `key` prop, these are new JavaScript objects
- Renderer cannot reuse DOM because `node.element` is undefined on new objects

---

## Performance Impact

Based on the benchmark results (21/100 score):

| Operation | Current Time | Target | Issue |
|-----------|-------------|--------|-------|
| Create 1k rows | 86.8ms | <50ms | Table/tbody recreated |
| Partial update | 104.3ms | <50ms | Table/tbody recreated + props reapplied |
| Select row | 115.3ms | <50ms | Table/tbody recreated + className updates |
| Clear | 180.8ms | <100ms | Full table removal/recreation |

**Estimated Impact of Fix**: 30-40% improvement by eliminating table/tbody recreation

**Renderer Metrics** (from benchmark output):
```
Create 1,000 rows: created=3003, adopted=0, inserted=1002, moved=0, removed=0
```
- 3003 creates = 1000 rows × 3 elements + table + tbody + text nodes
- 0 adopted = No reuse happening at structural level

---

## Proposed Solution

### Option 1: Renderer-Level Key Cache (Recommended)

Enhance `renderComponent()` to maintain a **key-based element cache**:

```typescript
// In renderComponent()
const keyToElementCache = new Map<unknown, Element | Text | Comment>()

// When rendering nodes with keys:
if (node.key != null) {
  const cached = keyToElementCache.get(node.key)
  if (cached && cached.tagName === node.tag?.toUpperCase()) {
    node.element = cached  // ✅ Reuse cached element
    globalRenderer.adoptNode(oldNodeFromCache, node)
  }
}
```

**Pros**:
- Fixes issue at framework level
- Works for all components automatically
- Minimal code changes (~50 lines)

**Cons**:
- Adds memory overhead for cache
- Requires cache invalidation logic

### Option 2: Component-Level Caching

Update benchmark to cache table/tbody nodes:

```typescript
let tableNode: DOMNode | null = null
let tbodyNode: DOMNode | null = null

const TableComponent = createComponent(() => {
  const rows = data.map(...)

  if (!tableNode) {
    tableNode = h('table', { key: 'table-root' })
  }
  if (!tbodyNode) {
    tbodyNode = h('tbody', { key: 'table-body' })
  }

  tbodyNode.children = rows
  tableNode.children = [tbodyNode]
  return tableNode
})
```

**Pros**:
- Simple, no framework changes
- Component has full control

**Cons**:
- Requires manual caching in every component
- Not DRY, hard to maintain
- Doesn't fix underlying issue

### Option 3: Hybrid Approach

Implement both:
1. Add key-based cache in renderer for structural nodes
2. Document best practices for component authors
3. Update benchmark to demonstrate proper caching

**Recommended**: Start with Option 1 (renderer-level fix)

---

## Implementation Plan

### Phase 1A Implementation Tasks

1. **Add key-based element cache to `renderComponent()`**
   - Create `keyToElementCache` Map
   - Check cache before creating new elements
   - Store elements by key after rendering
   - Add cache cleanup on component unmount

2. **Enhance `DOMRenderer.createOrUpdateElement()`**
   - Add optional `keyCache` parameter
   - Check key cache if `node.element` is undefined
   - Set `node.element` from cache if found

3. **Add cache metrics**
   - Track cache hits/misses
   - Add to `RendererMetrics` type
   - Log in benchmark output

4. **Write tests**
   - Test: Parent node reused when key matches (DOM identity check)
   - Test: Cache cleared on component unmount
   - Test: Metrics show increased `adopted` count

5. **Validate with benchmarks**
   - Run full benchmark suite
   - Verify `created` count decreases
   - Verify `adopted` count increases
   - Document before/after metrics

### Success Criteria

- [ ] Benchmark metrics show:
  - `adopted` > 0 for structural nodes
  - `created` reduced by ~50% (table + tbody per render)
- [ ] Create 1k rows: 86.8ms → <70ms (20% improvement minimum)
- [ ] All operations show 15-30% improvement
- [ ] Tests pass with parent nodes remaining stable (DOM identity)

### Complexity Estimate

- **Difficulty**: Medium
- **Risk**: Low (incremental enhancement, doesn't break existing behavior)
- **LOC**: ~100-150 lines
- **Files Modified**: 2-3 (`renderer.ts`, `renderer.test.ts`, `types.ts`)

---

## Next Steps

1. ✅ Audit complete - findings documented
2. ⏭️ Implement key-based element cache in `renderComponent()`
3. Add tests for parent node stability
4. Run benchmarks and document improvements
5. Move to Phase 1B (child reconciliation enhancements)

---

## References

- **Main Renderer**: `tachUI/packages/core/src/runtime/renderer.ts`
- **Benchmarks**: `tachUI/packages/core/benchmarks/tachui-benchmarks.ts`
- **Performance Plan**: `design/SpeedImprovements.md`
