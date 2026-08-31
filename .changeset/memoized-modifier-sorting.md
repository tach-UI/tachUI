---
'@tachui/core': patch
---

Stop copying and priority-sorting modifier arrays on every node render (#220): `applyModifiersSequential` and the batch path now share a `WeakMap`-memoized sorted array keyed on the source array identity, so stable renders pay neither the array copy nor the O(n log n) sort.

Modifier arrays are appended to in place after construction — by the modifier builder, and post-construction by `Image.scaledToFit`/`scaledToFill` and `Grid`'s item animations — so identity alone is not a sufficient cache key. The cache also records the source length and re-sorts when it changes; every modifier-array mutation in the tree is an append, so this is sound and O(1). Without it a warm cache silently drops modifiers pushed between renders.

The batch path no longer re-sorts each type group. Group arrays are allocated fresh per call and could never hit the cache, so grouping now fills from the memoized sorted array instead. Application order is unchanged in both dimensions: groups are still applied in the order their type first appears in the caller's array, and modifiers within a group are still applied in priority order.
