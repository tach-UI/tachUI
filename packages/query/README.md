# @tachui/query

Backend-neutral reactive query layer for tachUI: request lifecycle, an in-memory
cache, mutations, and async streams, built on `@tachui/core` signals and ownership.

## Overview

`@tachui/query` sits between your application and whatever you talk to. It owns the
parts of remote data that every application rewrites by hand — request identity,
cancellation, deduplication, freshness, invalidation, and the loading/error state a
UI actually binds to — and nothing else.

It knows nothing about Protobuf, ConnectRPC, REST, or GraphQL. Transport adapters
such as `@tachui/connectrpc` layer on top of these interfaces rather than replacing
them, and an application using plain `fetch` is a first-class consumer.

It is not a persistence layer. There is no client-side ORM, object graph, schema
migration, or synchronization engine here; durable state belongs to your backend.
See [ADR 0001](../../docs/reference/adr/0001-data-and-communications-architecture.md)
for the reasoning.

## Installation

```bash
npm install @tachui/query
# or
bun add @tachui/query
```

## Status

The package currently ships its public type surface and shared defaults. The
runtime — `QueryClient`, the cache, `createQuery`, `createMutation`,
`createAsyncStream`, and `createAsyncStreamList` — lands across the `query-core`
milestone. The types are declared ahead of their implementations on purpose:
several of these shapes are effectively irreversible once released, so they are
fixed before anything depends on them.

## Two concepts that are easy to conflate

**`status` describes the data. `fetchStatus` describes the request.** They move
independently:

| Situation | `status` | `fetchStatus` |
| --- | --- | --- |
| Never fetched, or `enabled: false` | `idle` | `idle` |
| First fetch, nothing to show yet | `loading` | `fetching` |
| Background refresh over existing data | `success` | `fetching` |
| Retry after a failure | `error` | `fetching` |

There is deliberately no `refreshing` status. Folding it into `status` would make
`status === 'success'` false during a background refetch, so every consumer that
branches on success would flicker back to its loading state for no reason.

**`staleTime` is freshness. `gcTime` is retention.** `staleTime` (default `0`)
decides when a cached value is worth refetching. `gcTime` (default `300000`)
decides how long an entry with zero observers is kept before eviction. A value can
be stale but still cached, and refetching it is cheap because the old data keeps
rendering meanwhile.

## Design decisions

### Query types live in this package

Shared cross-package definitions live in `@tachui/types`. These do not: nothing
outside `@tachui/query` and its future adapters refers to a `QueryOptions` or a
`CacheEntry`, and pushing them into the shared package would couple every consumer
of `@tachui/types` to a release cadence they have no stake in. Adapters import from
`@tachui/query` directly.

### One entry point, no subpath exports

`@tachui/core` splits into subpaths because it is large and consumers want slices
of it. This package is small — the whole surface has a 12 KB gzipped budget — and
is marked `sideEffects: false`, so a bundler already drops whatever an application
does not import. Subpath exports would add permanent release surface and a way to
get import paths wrong, in exchange for no bundle savings. Revisit if the budget
ever has to rise substantially.

### Size budget

The budget is declared in `package.json` under `tachui.sizeBudget` and asserted in
CI by `tools/check-size-budget.mjs`, which measures the gzipped built entry point.
Run it locally with:

```bash
bun run --filter @tachui/query build
bun run --filter @tachui/query size
```

## License

MPL-2.0
