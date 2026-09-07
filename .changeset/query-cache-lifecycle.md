---

---

No release. `@tachui/query` is a private, in-development package.

Adds the cache entry lifecycle (#279). An entry now tracks live observations,
and one with none is evicted `gcTime` after it settles — a timer that
`observe()` cancels outright and releasing the last observation restarts.
Retention measures time spent unobserved rather than time since last use, an
in-flight request suspends it so a load slower than `gcTime` cannot resolve
into an evicted entry, and `clear()`/`dispose()` cancel every pending timer so
no entry outlives the client that owned it.

`QueryClient.observe(key)` returns a `QueryObservation` whose `release()` is
idempotent; this is the retention mechanism `createQuery` (#280) builds on,
and it starts no request of its own.

Freshness is a calculation rather than a trigger: `CacheEntry.isStale` reports
whether a value has aged past its `staleTime`, `fetchQuery` still serves a
stale entry, and nothing refetches in the background. What acts on staleness
is an observer's policy (#280) and explicit `invalidate()` — which is what
keeps a hydrated SSR snapshot from refetching on first paint (#291).
