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

An observed query now reloads when its entry is invalidated — by its own
`invalidate()`, or by anything invalidating a prefix above it, which is the
shape a mutation's `invalidates` will take (#281). Reloading one query no
longer invalidates the entries beneath its key, `isStale` becomes true when
the freshness window elapses rather than only on the next cache event, and an
observer projects the cached value itself, so class instances keep their
methods and data that cannot be cloned no longer wedges the query. A request
abandoned by its last observer is detached rather than merely aborted, so a
remount fetches instead of waiting on a result that never arrives.

Closes a second review round. A completed load now clears the reload mark
whether it succeeded or not — leaving it set meant a failed reload was
reloaded again the instant it landed, with no delay, until the process ran out
of memory. `cancel()` aborts the request without giving up the observation, so
the result stays usable instead of freezing at `loading`. `clear()` empties
and marks entries that still have observers rather than dropping them, so an
observer sees the reset and reloads instead of reading a value the cache no
longer holds. An observer re-observing an entry that failed retries it even
while the failure is fresh, keeps rendering the value it already had through a
failed refresh, joins an in-flight request rather than starting a second, runs
`select` only when the raw value changes, and starts no work after an explicit
`dispose()`. `FetchQueryOptions` now rejects `retry`/`retryDelay`, which the
imperative path never read.
