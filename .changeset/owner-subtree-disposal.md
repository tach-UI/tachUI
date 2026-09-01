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

`Owner` in `@tachui/types` gains `childOwners: Set<Owner>` and `dispose(): void`. `dispose` was already assumed by `@tachui/core`'s `dispose(owner)` helper behind a runtime guard; both are now part of the declared shape. `OwnerImpl` is the only implementation in the workspace.

**Known limit, unchanged by this fix and characterized in `owner-subtree-disposal.test.ts`:** `ComputationImpl.execute()` restores `currentComputation` but not `currentOwner`, so an effect rerunning from a flush outside the enclosing `createRoot` call stack sees a null owner, and a root created during that rerun still has no parent to dispose it. Closing that means making a computation establish an owner scope for its own execution, which is a larger change.
