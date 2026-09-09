---

---

No release. `@tachui/query` is a private, in-development package.

Adds `createQuery`, the reactive query primitive (#280). An observer sits
between a component and one cache entry: the cache owns `TRaw` and the request
lifecycle, while the observer owns what is per consumer — the projection
through `select`, the placeholder shown before there is data, and the decision
of when observing should fetch.

`status` and `fetchStatus` stay independent, so a background refresh is
`success` while `fetching` and `status === 'success'` never blinks off.
`select` runs outside the cache and is memoized per observer, so two observers
of one key with different projections share a single entry and a single
request. `key` is memoized, so a key change triggers exactly once; the
abandoned entry loses its observer, and the last one to leave takes any
in-flight request with it. `enabled: false` fetches nothing and reads `idle`.
`retry` and `retryDelay` run inside one cache execution, so intermediate
failures never reach the entry and the prior value keeps rendering.

This also settles the refetch policy #279 deferred: observing a stale entry
revalidates in the background while the cached value keeps rendering, except
on the first observation of an entry restored by `hydrate()` — the server
produced that value moments ago as part of the same page load, so refetching
it would double every server-rendered page (#291).

`QueryClient.observe` grows an optional change callback, and a `QueryObservation`
now exposes the entry state an observer renders plus the one-shot hydration
allowance.
