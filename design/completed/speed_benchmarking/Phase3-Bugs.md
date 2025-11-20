# Phase 3 (Event Handling Optimization) – Review Notes

Date: 2025-11-04  
Reviewer: Assistant

## Summary
The Phase 3 implementation delivered measurable improvements for event-heavy benchmarks (≈3–5 % faster on create/select/swap). However, several issues prevent it from being production-ready and block further gains. This document captures the findings so they can be addressed quickly.

---

## Findings

### 1. Handler re-registration leaks (`EventDelegator.register`)
- **What happens:** When an element re-renders and we call `register()` again, the previous handler remains tracked because we never call `unregister` first. The handler count in `handlerCounts` grows even though the element only has one active listener.
- **Impact:** Root listeners are never released, metadata grows without bound, an element’s handler map can accumulate stale entries, and dispatch may fire the wrong handler.
- **Fix proposal:** Detect when an element already has a handler for the same event type. Before registering the new handler, call `unregister(container, element, eventType)` or decrement the count and replace the entry.

### 2. Global `delegationContainer` is unsafe
- **What happens:** `DOMRenderer` stores a single `delegationContainer`. Mounting a second component overwrites the pointer. Events in the first tree start using the second tree’s container—or `null` after unmount—which breaks delegation.
- **Impact:** Wrong container dispatch (events silently stop working) once two roots exist.
- **Fix proposal:** Track the active container per render call (e.g., pass it as an argument into `applyEventListener`, or push/pop a stack) instead of using a single renderer-wide field.

### 3. Focus/blur delegation never fires
- **What happens:** `focus` and `blur` don’t bubble. We add their root listeners without `capture:true`, so delegated handlers never run.
- **Impact:** `onFocus`/`onBlur` appear silently broken.
- **Fix proposal:** Use `focusin`/`focusout` instead, or attach with `{ capture: true }` when the event is non-bubbling. Remember to pass the same capture flag to `removeEventListener`.

### 4. Thinner test coverage
- The delegation smoke tests live in `test-event-delegation.js`, but they are not part of the Vitest suite. CI will miss regressions.
- **Fix proposal:** Port the scenarios into `packages/core/__tests__/runtime` under Vitest (or add a dedicated E2E harness).

## Benchmark Context
- Latest run: `pnpm --filter @tachui/core benchmark -- --reporter verbose`
- Metrics confirm the Phase 3 gains:
  - Create 1 000 rows (baseline): 91.5 ms
  - Select row (baseline): 106 ms
  - Swap rows (baseline): 161 ms
  - `attrWrites` steady at 7 001
- Overall compare score remains **21/100** → the improvements are real but incremental; larger gains will come from reducing the ~10 000 create/remove ops and attribute churn in upcoming phases.

## Next Steps
1. Fix handler re-registration and container scoping.
2. Correct focus/blur delegation (or drop them from the delegatable set until ready).
3. Migrate delegation tests into the automated suite.
4. Re-run benchmarks to verify no regressions after fixes.

These changes are prerequisite before leaning on Phase 3 for production workloads. Further score gains (>50) will require tackling the remaining bottlenecks highlighted in Phase 4+.
