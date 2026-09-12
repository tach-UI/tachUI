---

---

No release. `@tachui/query` is a private, in-development package.

Adds the two pagination primitives the reserved surface was for:
`createInfiniteQuery` and `createInfiniteQueryList`.

`createInfiniteQuery` is built on `createQuery`'s observer rather than beside
it, so retention, cancellation, freshness, the hydration grace and key changes
are shared rather than written twice. To make that possible the observer gained
a per-execution loader intent, bound into the closure handed to `fetchQuery` so
it survives the retry loop: an append that fails and retries is still an append.
The public `createQuery` passes none.

Everything the primitive writes goes through the loader path. Appending a page
is an ordinary cache execution whose loader fetches one page and returns the
merged set, so the entry's generation guard drops an append an invalidation
overtook and no cache-write primitive has to exist. A refetch reloads the pages
currently held, front to back from the first held param, and swaps the set in
one write — the old pages keep rendering while it runs. A next-page request
joins an identical one already in flight and waits out a refresh instead of
racing it. `maxPages` trims from the end opposite the one that grew, so
`fetchPreviousPage` can recover a dropped head. `isFetchingNextPage` and
`isFetchingPreviousPage` are per observer: two observers share the entry and
both see `isFetching`, only the one that asked sees the direction.

`createInfiniteQueryList` projects that into `createSignalList`, so an append
creates row signals only for the new rows and a refetch writes only the rows
whose data changed. `ids` is rewritten only when membership changes, and a key
that repeats across pages updates the row it already has rather than adding a
second one with the same identity.

Two fixes fell out of building it. `markForReload` notifies synchronously, and
every observer reloads what it finds marked and idle — so the notification could
front-run the caller that marked the entry, and the caller's own fetch would
then join the reload that beat it to the slot. With no intent in play that cost
a redundant call the cache dedups; with one it dropped the intent and turned an
append into a refetch. And `InfiniteQueryListOptions` now carries the same
`maxPages`/`getPreviousPageParam` pairing as `InfiniteQueryOptions`, because a
list result offers `fetchPreviousPage` and could not previously be given the
function that makes it work.

ADR 0001 records the pagination decisions and drops pagination from its
deferred list.
