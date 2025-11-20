# Honest Benchmark Action Plan

Goal: align TachUI's local benchmark harness and methodology with the official js-framework-benchmark (jsFB) so that our performance score (21/100 today) reflects real framework improvements instead of harness artifacts.

Last updated: 2025-11-04

**Status**: **95% Complete** 🎉
- ✅ **Priority 1 (CRITICAL)**: Browser harness rewritten to use TachUI framework - **RESOLVED**
- ✅ **Priority 2 (HIGH)**: Keyed row reuse working correctly - **RESOLVED**
- ⚠️ **Priority 3 (MEDIUM)**: React/Solid comparison baselines - NOT YET COLLECTED
- ⚠️ **Priority 4 (LOW)**: Browser warmup iterations - PARTIALLY ADDRESSED

**See**: [honest-benchmark-re-evaluation.md](./honest-benchmark-re-evaluation.md) for detailed verification and scoring.

---

## 0. Baseline & Parity Validation

1. **Audit harness parity with jsFB**
   - Compare data generation (`generateData`) with jsFB `createRows`.
   - Verify operations (create/replace/partial/select/swap/remove/clear) perform the same mutations and sequence.
   - Ensure warmups/iteration counts match jsFB defaults (2 warmups, 12 iterations, or documented overrides).
2. **Remove bespoke row cache**
   - Delete the custom `rowCache`/manual DOM mutation layer from `tachUI-benchmarks.ts`.
   - Ensure keyed `<tr>` elements are produced directly by the renderer so Phase 1B can do the reuse.
3. **Rework Table benchmark to reuse keyed rows**
   - Use stable keyed row components; avoid creating new row objects unnecessarily.
   - Confirm renderer metrics drop from `created=10002`/`removed=10002` to near-zero on updates.
4. **Verify DOM operation parity**
   - Instrument renderer metrics (created/adopted/moved/attrWrites) and compare with React/Solid when running the same operations.

Deliverable: parity checklist documenting all differences and a signed-off “matching jsFB” harness.

---

## 1. Browser-based Benchmark Support

- [x] `benchmark:browser:report` (Chromium automation writing JSON results)
- [x] Replace manual DOM demo with a bundled TachUI benchmark harness (Priority 1)
- [ ] Document any remaining prerequisites (Playwright install step)

1. **Set up Chrome/Chromium runner**
  - ✅ Script exists and captures timings via `performance.now()` in Chromium.
2. **Serve TachUI benchmark bundle (New)**
  - Replace `benchmarks/public/benchmark.js` manual DOM implementation with a bundle that renders the TachUI table benchmark via `renderComponent`.
  - Ensure the Playwright runner drives the same TachUI codepath as the Node harness.
3. **Update docs with browser run instructions**
  - Document prerequisites (Chrome, headless options).
  - Provide commands for quick runs (`pnpm benchmark:browser` or equivalent).
4. **Store raw results**
   - Output JSON/CSV with per-operation timings and DOM metrics for later comparison.

Deliverable: reproducible browser benchmark run with results stored under `tachUI/benchmarks/`, using the actual TachUI renderer in both Node and browser environments.

---

## 2. Harness & Renderer Instrumentation

- [x] **Standardize renderer metrics logging**
  - Node harness now aggregates per-iteration metrics before logging and embeds summaries in the `BenchmarkResult`.
  - Browser runner (`run-browser-benchmark.ts`) captures the same structure via Playwright and persists it in the JSON artefact.
- [x] **Add automated sanity checks**
  - `packages/core/__tests__/runtime/renderer-metrics-guards.test.ts` fails when `created`/`removed` spike on keyed updates or when `moved` drops to zero on swaps.
- [x] **Integrate metrics into docs**
  - `benchmarks/performance-results.md` and `docs/guide/guide/benchmarks.md` now document the new metric columns and interpretation guidance.

Deliverable: ✅ metrics consistently logged and validated after each benchmark run.

---

## 3. CI Integration & Comparison

- [x] **Add CI job for honest benchmark**
  - `/.github/workflows/ci.yml` now runs `pnpm benchmark:browser:report` and `pnpm benchmark:report:combined` on every push/PR (with `TACHUI_BENCH_ITERATIONS=4`, `TACHUI_BENCH_WARMUPS=1` to keep runtimes reasonable) and publishes the comparison table to the job summary while archiving the history JSONs for triage.
  - `/.github/workflows/honest-benchmark.yml` still runs nightly (and on demand), installs Playwright, executes the browser report, then generates the combined summary via `pnpm benchmark:report:combined`.
  - Both workflows upload `benchmarks/history/*.json` as artefacts so timing + renderer metrics are preserved per run.
- [x] **Compare against reference frameworks**
  - `tools/benchmarks/honest-benchmark.ts` now prefers the latest Chromium benchmark data when emitting the TachUI vs React vs Solid comparison table (falling back to the Node harness only if no browser payload is present).
- [x] **Track score history**
  - Each invocation writes `benchmarks/history/honest-benchmark-<timestamp>.json` plus `latest.json`, keeping performance scores and renderer metrics under version control for trend analysis.

Deliverable: ✅ consistent CI benchmark runs with comparison data stored under `tachUI/benchmarks/history/`.

---

## 4. Documentation & Communication

1. **Update docs/guide/benchmarks.md** ✅
   - Honest benchmark workflow is now documented with clear Node vs browser guidance and a note that the legacy 21/100 score is historical only.
2. **Document methodology in DESIGN** ✅
   - Added methodology summary (below) outlining parity validation, instrumentation, and comparison logic.
3. **Communicate score meaning** ✅
   - Design doc and guide both explain the legacy score context and point to the first Chromium-backed report stored under `benchmarks/history/` (the file includes the computed performance score alongside browser timings).

Deliverable: ✅ documentation clearly describes the new benchmark process and results.

### Methodology Summary (November 2025)

- **Parity validation** – `packages/core/benchmarks/tachui-benchmarks.ts` mirrors jsFB data generation and operations; the combined workflow records both Node (JSDOM) and Chromium runs so parity checks can be reviewed in `benchmarks/history/latest.json`.
- **Renderer instrumentation** – Each benchmark emits aggregated metrics (created/adopted/moved/etc.) and the regression guards fail if keyed reuse regresses.
- **Comparison strategy** – Combined reports prefer Chromium timings for TachUI when available, using jsFB baselines for React/Solid. If no browser payload exists, the script falls back to Node timings and explicitly logs the source.
- **Published score** – The initial honest benchmark summary (see `benchmarks/history/honest-benchmark-*.json`) records the browser-backed performance score alongside the legacy JSDOM numbers for reference.

---

## 5. Blockers & Dependencies

- Phase 3 follow-ups (handler re-registration, delegation container scoping, focus/blur capture) must land before Phase 4 and before relying on delegation metrics.
- Ensure Phase 4 (batching/virtualization) works against the parity harness; otherwise improvements will be masked.

---

## Quick Checklist

- [x] **Remove manual row cache & ensure keyed rows reuse DOM** ✅ (Priority 2 - RESOLVED)
- [x] **Validate harness parity (data, ops, iteration counts) with jsFB** ✅ (Node & Browser harnesses validated)
- [x] Instrument and log renderer metrics in Node & browser runs.
- [x] Run benchmarks in Chrome/Chromium, store results.
- [x] Integrate honest benchmark into CI with React/Solid comparisons.
- [x] Update documentation with new workflow and score meaning.
- [ ] Run React/Solid jsFB harnesses through the same Playwright workflow so comparison data comes from the exact environment (Priority 3).
- [x] **Bundle TachUI benchmarks for the browser harness so Playwright measures the framework rather than the demo script** ✅ (Priority 1 - RESOLVED)
