---
'@tachui/query': patch
---

New package `@tachui/query`: the backend-neutral reactive query layer (#276).

This first release ships the public type surface and the shared defaults, ahead of the runtime that lands across the rest of the `query-core` milestone. Declaring the types first is deliberate — `select` introduces the second type parameter on `QueryResult`, and the `status`/`fetchStatus` split defines what `idle` means, so both are effectively irreversible once anything depends on them.

What is exported now:

- `QueryKey`, `QueryStatus`, `FetchStatus`, `QueryOptions`, `QueryResult`
- `QueryClient`, `CacheEntry`, `DehydratedState`
- `MutationOptions`, `MutationResult`
- `AsyncStreamOptions`, `AsyncStreamListOptions`, and their result types
- `DEFAULT_STALE_TIME` (0), `DEFAULT_GC_TIME` (300000), `DEFAULT_RETRY` (0)
- `QueryError`, `isDevelopment`, `isServer`

The package depends on `@tachui/core` and nothing else, is marked `sideEffects: false`, and ships a single entry point under a 12 KB gzipped budget now asserted in CI by `tools/check-size-budget.mjs`. Any package can opt into that gate by declaring `tachui.sizeBudget` in its manifest.
