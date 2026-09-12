---

---

No release. `@tachui/query` is a private, in-development package.

Reserves the pagination surface and lands the one piece of it that could not be
added later (#358). `fetchInfiniteQuery` is a method on the `QueryClient`
interface, and adding a method to a released interface breaks everyone who
implements it — so it ships with the types rather than with the primitive that
will use it. Everything else here is additive: `InfiniteData`,
`FetchDirection`, `InfiniteQueryLoadContext`, `GetPageParam`, the option and
result shapes for both the query and its list projection.

An infinite query is one cache entry holding the whole set, under the base key.
Cursors chain, so per-page entries could refetch with a stale token, be evicted
from the middle of a set, or dehydrate half of one. Because the set is an
ordinary cached value, it inherits dedup, freshness, retention, the generation
guard, and dehydration without any of them being taught about pages.

`maxPages` is typed to require `getPreviousPageParam`: a cap drops pages from
the far end, and with no way to ask for the page before the new head, what was
dropped could never come back. `select` is required exactly when the projection
differs from the set, by the rule a plain query already follows.

`prefetchQueries` takes plain and infinite requests together, told apart by
`initialPageParam` — which `FetchQueryOptions` now declares absent, so the
narrowing is sound rather than a guess.
