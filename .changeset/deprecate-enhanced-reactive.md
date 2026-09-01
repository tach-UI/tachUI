---
'@tachui/core': patch
---

Deprecate the enhanced reactive branch, which does not track dependencies (#271).

`createEnhancedEffect` never re-runs when a signal it read changes: `EnhancedEffect.execute` resolves `(this as any).setCurrentComputation` — a member that does not exist — and falls back to a no-op. Measured on the same shape:

| | after create | after set |
|---|---|---|
| standard signal + standard effect | 1 | 2 |
| enhanced signal + enhanced effect | 1 | 1 |
| standard signal + enhanced effect | 1 | 1 |

The effect is the broken half; the signal type makes no difference. Reads and writes appear to succeed and nothing downstream updates, which makes this dangerous to build a data or communications layer on.

`createEnhancedSignal` and `createEnhancedEffect` now carry `@deprecated` tags and warn once per symbol at runtime, naming the standard replacement. The migration codemod previously rewrote `createSignal` → `createEnhancedSignal` and `createEffect` → `createEnhancedEffect`, making its output strictly more broken than its input; those two rewrites are removed.

Behaviour is otherwise unchanged — the exports still exist and still do what they did. Removal is scheduled for 0.9.0, gated on the characterization in #269 and the version-line procedure in #264.
