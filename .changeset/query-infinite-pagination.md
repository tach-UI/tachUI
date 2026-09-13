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
creates row signals only for the new rows and leaves the rows already on screen
untouched. A refetch writes every row and the signals discard the writes that
changed nothing, so "only what changed notifies" holds as far as the source's
row identities are stable — a loader that rebuilds equal-but-new objects
notifies every row. `ids` is rewritten when membership or order changes, and a
key that repeats across pages updates the row it already has rather than adding
a second one with the same identity.

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

Review follow-ups, each reproduced before it was fixed:

- A pagination loader was handed the value from the *observer's* published
  state rather than from the entry the execution was about to write. The effect
  that follows a key change is scheduled, so an append in the same tick wrote
  three pages of the previous feed under the new key. The same gap let a gated
  observer's `refetch()` truncate a shared three-page set to one page.
- `fetchQuery` returned the in-flight promise before looking at the loader it
  had been handed, which was sound only while every execution of a key ran the
  same loader. A pull-to-refresh fired during a load-more reloaded nothing and
  reported success. Executions are named now, and a name that differs from the
  one in flight queues behind it.
- `cancel()` left the reload mark it had set, so the abort's own notification
  found the entry marked and idle and restarted the work — a sequential reload
  of every page held.
- `ids` was not a signal core recognises, so `List` would have rendered it
  empty forever and never subscribed.
- `null` now ends a set alongside `undefined`, which is how a JSON cursor API
  spells it; a reorder reaches `ids`; both page loops stop on an abort; a
  throwing page-param function is not retried and no longer outranks a real
  load failure; `maxPages` and `pages` are validated; and `fetchNextPage`
  declares `Promise<TData | undefined>`, which is the truth.

Row accessors are reactive and stable. `get(key)` returns an accessor that
answers whether or not the row is held, subscribes to that row alone, and is
the same accessor across the row leaving and coming back — so a row dropped by
`maxPages` and re-fetched is not orphaned, and a key asked for before its page
lands is told when it arrives. It subscribes per key rather than to membership,
which is what keeps an append from waking every row on screen.

This needed `createSignalList` to stop deleting a row's signal on removal, so
the retained accessors are bounded and the bound is the developer's to set:
`trackedRows` on the list options, `trackedKeys` on the core primitive, 256 by
default. `createAsyncStreamList` gets the same treatment, having carried the
identical lookup.

Three more from review, each reproduced first:

- Two observers of one key both asking for the next page loaded two pages
  rather than joining one request. Neither can see the other's bookkeeping, so
  the entry decides: an append joins whatever append is already running in the
  same direction.
- A `fetchPreviousPage()` parked behind an in-flight `fetchNextPage()` started
  after `cancel()` released it, loading the page the cancel existed to stop.
  Waiters now notice that the ground moved while they waited.
- `client.observe(key, undefined, { maxPages: 0 })` claimed a zero cap through
  the public policy path, and the next append spliced the whole set away and
  left it successful, empty and unextendable. The bound is validated where it is
  claimed, so every path that can set one is covered.

A further round, each reproduced first:

- A request that queued behind a different execution started anyway when its
  caller cancelled or disposed while it waited — the cousin of the cancel
  finding, reintroduced by the dedup fix. Queuing is the one window where a
  caller can be cancelled after dispatch and before its loader runs, so that is
  where the check goes. A queued caller also stops waiting when the execution
  ahead is abandoned, rather than waiting on a loader that is not obliged to
  settle once aborted.
- A reload mark is named rather than remembered. The observer tracked "I marked
  something", which could not tell its own mark from a prefix invalidation that
  landed in between — so a cancel discarded someone else's reload — and did not
  record marks set through the transient path at all.
- `cancel()` on a gated query reached nothing: there is no observation to abort
  through when the gate is shut, so the refetch it was asked to stop kept
  running.
- `initialPageParam` is validated at construction, beside `maxPages`, rather
  than per execution inside the loaders, so a configuration mistake throws where
  it was written instead of arriving as an async error state.
