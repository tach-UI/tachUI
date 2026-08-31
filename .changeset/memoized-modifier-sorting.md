---
'@tachui/core': patch
---

Stop copying and priority-sorting modifier arrays on every node render (#220): `applyModifiersSequential`, the batch group path, and the per-render `node.modifiers` population now share a `WeakMap`-memoized sorted array keyed on the source array identity. Modifier ordering is static after construction and every append path (modifier builder, proxy, `updateComponentModifiers`) replaces the array with a new identity — so stable renders hit the cache and pay neither the array copy nor the O(n log n) sort.
