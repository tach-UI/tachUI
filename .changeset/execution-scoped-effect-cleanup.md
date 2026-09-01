---
'@tachui/core': minor
---

Give effects execution-scoped cleanup, so a returned disposer runs before the next run (#270).

`createEffect` had no per-execution cleanup. `onCleanup` registered on the **owner**, so it fired only when the root was disposed, and a function returned from an effect body was fed back in as `previousValue` and never invoked. A dependency change could not cancel anything the previous run had started — no aborting an in-flight request, no latest-request-wins, no retry-timer or subscription teardown.

Two changes:

- **A returned function is now a disposer.** It runs before the effect's next execution and again on final disposal, in that order. A returned non-function value still flows into the next run as `previousValue`.
- **`onCleanup` inside a computation body is now execution-scoped.** It runs before that computation's next execution and again on disposal, instead of accumulating one entry per run on the owner and firing them all at the end. Outside a computation body — directly in a `createRoot` body, say — `onCleanup` stays owner-scoped and is unchanged.

Cleanup ordering is deterministic: registration order, with a returned disposer last because it is registered when the body returns. A throwing cleanup is caught and reported, and does not strand the cleanups queued behind it or prevent the rerun.

```typescript
createEffect(() => {
  const controller = new AbortController()
  void fetch(`/api/item/${id()}`, { signal: controller.signal })

  // Aborts the previous request when `id` changes, and on disposal.
  return () => controller.abort()
})
```

**Breaking.** Any effect that returns a function and relies on receiving it back as `previousValue` changes behaviour. The workspace was audited for this population before the change (#269); it found three effects returning a function, all of which returned a teardown closure that was previously swallowed, so all three leaked and none consumed `previousValue`. Two were production leaks that this change fixes: a `keydown` listener in `@tachui/mobile`'s `ActionSheet` and a `resize` listener in `@tachui/navigation`'s tab view.

Behaviour recorded before the change is in `graph-characterization.test.ts`; the new contract is pinned in `effect-cleanup.test.ts`.
