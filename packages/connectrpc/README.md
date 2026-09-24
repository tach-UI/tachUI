# @tachui/connectrpc

Optional ConnectRPC adapter for tachUI: maps generated Connect service methods onto
`@tachui/query`.

## Overview

Connect already owns Protobuf serialization, service and method descriptors,
generated clients, protocols, transports, interceptors, timeouts, and cancellation.
`@tachui/query` owns request identity, deduplication, caching, invalidation, and the
loading and error state a UI binds to. This package is the thin layer between them:
the generated method descriptor supplies request and response typing, and the adapter
supplies a deterministic query key and a loader.

It does not construct transports, own authentication tokens, replace interceptors,
reimplement Protobuf or a Connect protocol, or persist query data. Applications build
and configure their own transports; authentication, tracing, and metadata stay in
Connect interceptors. See
[ADR 0001](../../docs/reference/adr/0001-data-and-communications-architecture.md).

## Status

**Not yet published.** This package is `private` and develops in-tree against the
workspace `@tachui/query`. It reaches npm at the 0.12.0 line move; until then the
install below will not resolve.

The package currently ships its public type surface and two runtime values:
`DEFAULT_TRANSPORT_NAME` and `isRetryableCode`. The adapters themselves — transport
provision, `connectQueryPrefix`, `createConnectQuery`, `createConnectMutation`,
`createConnectInfiniteQuery`, `createConnectStream`, and `createConnectStreamList` —
land across the 0.12.0 milestone. As with `@tachui/query`, the option and result
types are declared first because they are what every call site is written against.

## Installation

```bash
npm install @tachui/connectrpc @connectrpc/connect @bufbuild/protobuf
# a browser transport, if the application constructs one
npm install @connectrpc/connect-web
```

`@connectrpc/connect` (`^2.0.0`) and `@bufbuild/protobuf` (`^2.2.0`) are peer
dependencies. The adapter accepts Connect's generic `Transport` interface, so it is
independent of which transport package an application uses.

```ts
import { DEFAULT_TRANSPORT_NAME, isRetryableCode } from '@tachui/connectrpc'
import type { ConnectQueryKey, ConnectQueryOptions } from '@tachui/connectrpc'
```

## Design decisions

### Connect and Protobuf are peers, never bundled

The application installs exactly one copy of each, and the adapter shares it. A
bundled or nested copy would carry its own `ConnectError` class, so
`error instanceof ConnectError` in application code would fail for every error this
package surfaced. The build marks both external, and the packed-install check below
asserts that one copy of each is installed and that the built entry imports them
by name.

### Transports are identified by name

A query key contains a transport **name**, never the `Transport` object. The server
and the browser construct different instances for the same logical backend, so a key
derived from object identity would miss on every hydrated entry. The name defaults to
`'default'` and is always part of the key:

```ts
['connect', 'account', 'acme.users.v1.UserService', 'ListUsers', '{"pageSize":50}']
```

Within one `QueryClient`, a name identifies one logical backend and security scope.
Where headers or context values change what the server returns — a tenant, an
account — `keyExtension` adds them to the key.

### Retry is a count, and only two codes qualify

Nothing retries by default. When `retry` is set, only `unavailable` and
`resource_exhausted` are retried, with capped exponential backoff; the option takes an
attempt count rather than a predicate, so no call site can opt `unauthenticated` or
`deadline_exceeded` back in. Mutations never retry. `isRetryableCode` is that
allowlist, and is a function rather than an array of codes: a top-level array built
from Connect's `Code` members is an expression a bundler must keep, and it would pull
the Connect runtime into every bundle that imports anything from this package.

### Optimistic state belongs to the application

Mutation options reuse `@tachui/query`'s pairing: `optimisticUpdate` and `onError` are
supplied together, and `onError` receives whatever `optimisticUpdate` returned to roll
back with. Framework-managed cache writes are not part of the surface.

## Verifying a packed install

`tools/smoke-connectrpc-packed.mjs` installs the package from packed tarballs into a
temporary project, with its peers supplied the way an application would, and checks
that the entry imports, that its declarations type-check against the installed peers,
that one copy of each peer is present, and that importing one constant pulls in no
Connect runtime. CI runs it at both ends of the declared peer ranges:

```bash
node tools/smoke-connectrpc-packed.mjs --peers floor
node tools/smoke-connectrpc-packed.mjs --peers latest
```

The tachUI packages come from local tarballs; the peers come from the registry.

## License

MPL-2.0
