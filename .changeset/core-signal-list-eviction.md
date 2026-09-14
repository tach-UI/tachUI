---
"@tachui/core": patch
---

`createSignalList` no longer rescans its whole tracked set for every released
row. `evictTracked` recomputed the number of tracked-but-departed keys by
walking the tracked map, and it ran on every release, so `clear()` over an
n-row list was O(n^2). At 16,000 rows that was 2311ms of blocked main thread;
it is now 58ms. `createInfiniteQueryList.get` tracks every rendered row, so
tearing down a long feed is exactly that shape.

The count is maintained as rows come and go instead, and the common case —
nothing over the bound — is now a single comparison rather than a full scan
that concludes there is nothing to do.

One access order is unimproved and the code says so: the eviction walk skips
keys the list still holds, so when rows are asked for in the reverse of the
order they are released, each call walks the held set and the teardown is
quadratic as before. Rendering and tearing down a feed top to bottom, which is
what `createInfiniteQueryList` produces, is the fast case. Making the reversed
one linear would mean ordering candidates by when they departed rather than by
when they were last asked for, which is the eviction order the `trackedKeys`
bound is specified in terms of.
