# ADR 0001: Data and Communications Architecture

- **Status:** Accepted
- **Date:** 2026-08-31
- **Supersedes:** none
- **Detailed working reference:** `planning/data-architecture.md` (untracked; `planning/` is gitignored)

## Context

tachUI has signals, computed values, effects, environment injection, and a fine-grained
`createSignalList`, but no standard way to talk to a backend. Async data is composed by hand
around raw `fetch()` in the docs, with no request identity, cancellation, deduplication,
cache freshness, invalidation, pagination, streaming, or SSR story.

Two directions were considered. The first was a client-side persistence and object-graph
layer comparable to SwiftData - schemas, relationships, migrations, transactions, and
synchronization owned by the framework. The second was a reactive layer at the
communications and UI boundary, with durable state left to developer-owned backends.

Two defects in the reactive core were also verified during the assessment, both of which
would silently break any communications layer built on top of them.

## Decision

### Scope

1. tachUI does not build a persistence layer, client-side ORM, object graph, schema
   migration system, or synchronization engine. Backends own durable state.
2. tachUI provides a reactive communications layer: request lifecycle, cache, mutation
   state, streams, and SSR snapshots.
3. ConnectRPC is the first official typed integration, as an optional adapter.

### Packages

4. `@tachui/core` keeps signals, effects, ownership, bindings, and environment. It gains
   execution-scoped effect cleanup and a single canonical reactive graph.
5. `@tachui/query` is new and backend-neutral. It knows nothing about Protobuf, Connect,
   REST, or GraphQL.
6. `@tachui/connectrpc` is new and optional, mapping generated Connect descriptors onto
   `@tachui/query`. Peer dependencies: `@connectrpc/connect`, `@bufbuild/protobuf`.
7. `@tachui/data` stays presentation-only and transport-independent.

### Core API contracts

8. Cache state is owned by an explicit `QueryClient` provided through the environment. An
   implicit module-global client is refused on the server, because module-global cache
   state leaks between requests - the same defect class as issue #224.
9. `status` describes the data (`idle | loading | success | error`) and `fetchStatus`
   describes the request (`idle | fetching`). `refreshing` is not a status value; a
   background refresh is `success` plus `fetching`.
10. `enabled` and `select` ship in the first released type surface. `select` adds the
    second type parameter to `QueryResult`, so retrofitting it later would rewrite every
    generic signature.
11. `select` runs per observer, outside the cache, so one cached response serves many
    projections.
12. `staleTime` (freshness) and `gcTime` (unobserved retention) are distinct and separately
    documented.
13. Async streams have two modes: bounded reduction for aggregate state, and a collection
    mode over `createSignalList` for anything feeding a List. Unbounded array accumulation
    is not the documented default.

### Connect adapter contracts

14. Applications construct and provide `Transport` objects. Authentication, tracing, and
    metadata stay in Connect interceptors. tachUI never reads tokens or reimplements
    Protobuf, protocols, or transports.
15. Query keys are structured arrays - `['connect', transportName, service, method,
    canonicalInput]` - hashed for lookup and compared by prefix for invalidation.
16. Transport identity in a key is a **name**, never object identity, because the server and
    browser build different instances for the same logical backend.
17. Connect request messages are canonicalized with `toJson` plus a stable stringify, which
    resolves int64, bytes, and oneof through the schema and stays deterministic for maps.
18. `ConnectError` instances and standardized codes are preserved, never flattened.
19. Nothing retries automatically by default. When retry is enabled, only `unavailable` and
    `resource_exhausted` are eligible, with capped exponential backoff. Mutations never
    auto-retry.
20. Unary and server streaming are the browser baseline; other stream cardinalities are
    capability-gated on the selected transport.

### SSR

21. `renderToString` is synchronous with no async render path, so SSR is an explicit
    prefetch phase before a synchronous render. There is no streaming SSR and no
    render-triggered fetching.
22. Snapshot serialization is opt-in per query (`snapshot: true`, default false) and
    success-only. Transports, headers, tokens, interceptor context, and error stacks are
    never serialized.
23. The cache is restored before `hydrateFragments()`.

### Sequencing

24. The reactive correctness gate (Phase 0) lands before any communications work. A
    communications layer built on the exported enhanced reactive branch would silently stop
    propagating updates.

## Consequences

**Accepted costs.** Offline-first applications must supply their own storage on top of
public query and cache interfaces. There is no framework-owned conflict resolution. SSR
requires route-level declaration of what to prefetch rather than transparent data fetching
during render. The Connect adapter is only as good as the generated code it consumes.

**Breaking changes.** The duplicate enhanced reactive graph is deprecated with runtime
warnings in 0.8.x and removed in 0.9.0, under the version-line procedure in issue #264. It
has no internal consumers outside `migration.ts`. Making `createEffect` treat a returned
function as a disposer changes behavior for any effect that returns a function and relies
on receiving it back as `previousValue`; Phase 0 audits for this before the change.

**New names.** `createAsyncResource`, `createQuery`, `createMutation`, `createAsyncStream`,
and `createAsyncStreamList` avoid colliding with the existing `createResource`, which means
"create a disposable and register its cleanup".

**Deferred.** Pagination and infinite queries have no designed API yet and are scheduled
separately. Persistent cache storage does not ship in the first release. Server-stream
reconnection policy is unresolved.

## References

- Connect-ES: https://github.com/connectrpc/connect-es
- Connect-Query (identity model, not the React/TanStack implementation): https://connectrpc.com/docs/query/getting-started/
- Related issues: #224 (global environment cross-request bleed), #229 (memory-leak tier is
  non-functional), #232 (SSR and fragments hydration spike), #264 (version-line procedure)
