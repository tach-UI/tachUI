---
'@tachui/core': patch
'@tachui/types': patch
---

Fix nested reactive roots surviving their parent's disposal.

Ownership was tracked through a single child registry, `OwnerImpl.sources`, typed `Set<Computation>`. Computations registered themselves into it from their constructor; owners never did. `createRoot` stored `this.parent` on the new owner, so the link was one-directional — a child knew its parent, a parent had no idea its child existed.

A nested `createRoot` was therefore orphaned. Disposing the enclosing root never reached it, so its cleanups never ran **and its computations were never disposed**: they kept their signal subscriptions and kept executing after their owner was gone. Measured on a nested pair of effects reading one signal, disposing the outer root and then setting the signal twice:

| | runs recorded |
|---|---|
| outer effect | `[0]` |
| inner effect | `[0, 1, 2]` |

`OwnerImpl.dispose` ended with `this.parent.sources.delete(this as any)` — the deregistration half, written against a registration that did not exist, cast past the type error that would have caught it. It could never match.

Owners now register with their parent through a dedicated `childOwners` set, and disposal walks the whole owner subtree deepest-first before disposing the owner's own computations and running its cleanups. Sibling roots dispose in creation order. Self-disposal deregisters from the parent, and a second dispose is still a no-op.

Two consequences worth noting:

- `createDetachedRoot` now means something. It clears the current owner so the new root has no parent; previously parentage conferred nothing, so a plain nested `createRoot` was already detached.
- `createRoot` and `runWithOwner` now close any enclosing execution cleanup scope, so an `onCleanup` written directly in their body belongs to that owner rather than to whichever effect happened to be running.

`Owner` in `@tachui/types` gains **optional** `childOwners?: Set<Owner>` and `dispose?(): void`. Both are optional so an `Owner` from an older runtime, a hand-rolled JS object, or a downstream structural implementation still satisfies the interface — `runWithOwner` is public and accepts any `Owner`. The core guards both members at runtime and degrades such an owner to the previous unparented behaviour rather than throwing before the root body runs. `dispose` was already assumed by `@tachui/core`'s `dispose(owner)` helper behind exactly such a guard.

**Computations now open an owner scope for each execution.** Previously `ComputationImpl.execute()` restored `currentComputation` but not `currentOwner`, so once the flush arrived on a later microtask — the normal asynchronous case — `getOwner()` was null during a rerun and any root or nested effect created there was orphaned, surviving disposal of the enclosing root with its subscriptions live and its cleanups unrun.

Each run now gets its own owner, parented to the computation's owner and disposed as part of that run's teardown. So anything created during a run dies with that run:

```typescript
createEffect(() => {
  outer()
  // Disposed automatically when this effect reruns — no explicit disposer.
  createEffect(() => inner())
})
```

Parenting these children to the computation's own owner instead would have traded the orphan leak for an unbounded one, piling every rerun's children onto the root until the root died.
