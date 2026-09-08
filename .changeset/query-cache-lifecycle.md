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

Retention is also guarded against entries the cache no longer holds: an
observation released after `clear()`, or a request settling after it, no
longer arms a timer that would later evict whichever entry has taken that
key — and after `dispose()` no timer is armed at all. A `gcTime` first
configured after the entry exists, the shape `hydrate()` then a first fetch
produces, now replaces the default timer instead of leaving it running.
`staleTime` and `gcTime` reject NaN and negative values, which previously
retained forever or never went stale in silence.

The key and data encodings also gained three corrections. A `Date` from
another realm is tagged rather than rendered as a bare ISO string, so it no
longer shares an entry with that string. A `Uint8Array` subclass such as a
Node `Buffer` is refused as snapshot data, since hydration rebuilds a plain
`Uint8Array` and a cache hit would not return the loader's value; a key is
still identified by its bytes. And `dehydrate()` builds its filter view from
the payload it is about to ship rather than a structured clone, which throws
for a `Proxy` the encoding handles fine and would fail a whole snapshot over
one entry.
