---
"@tachui/core": patch
---

`createSignalList` gains `track(key)`, a stable per-key accessor that answers
whether or not the list holds the key.

`get` throws for a key the list does not hold and hands back a different
accessor if the key leaves and returns, because removal deletes the row's
signal. That makes it a lookup rather than a subscription: a consumer rendering
one row cannot be told the row arrived, and one holding an accessor across a
removal is silently orphaned. Both callers in `@tachui/query` had grown the same
guard — a membership set consulted before every lookup — which answered the
first problem by waking every row whenever membership changed anywhere.

`track` keeps the row's signal alive past removal, writing `undefined` instead
of deleting, so the accessor stays live and reactive and reports the row
leaving and returning. Retained accessors are bounded by `trackedKeys`
(default 256, least-recently-used evicted first); an accessor whose key is
evicted reads `undefined` even if the row returns, which is the bound's stated
cost.

`get` is unchanged. A reorder through `set()` is now a structural change: it had
been treated as no change at all, so `ids` kept describing the previous order
while every row held current data.
