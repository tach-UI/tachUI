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

The package currently ships its public type surface, `DEFAULT_TRANSPORT_NAME`,
`isRetryableCode`, `ConnectAdapterError`, transport provision
(`provideConnectTransport`, `useConnectTransport`), and deterministic query keys with
`connectQueryPrefix`. The adapters themselves — `createConnectQuery`, `createConnectMutation`,
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
import {
  connectQueryPrefix,
  DEFAULT_TRANSPORT_NAME,
  isRetryableCode,
  provideConnectTransport,
  useConnectTransport,
} from '@tachui/connectrpc'
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

### Keys are the request's Protobuf JSON, stably stringified

Equivalent requests share one entry. The request — a partial initializer or a
generated message — is normalized through the method's input schema, written with
`toJson` under pinned options (camelCase names, enum names, implicit zeros omitted),
and stringified with object members sorted at every depth:

```ts
['connect', 'default', 'acme.users.v1.UserService', 'ListUsers', '{"filter":{"labels":{"a":"1","b":"2"}},"pageSize":50}']
```

So field construction order and map insertion order never split an entry, int64 and
bytes take their Protobuf JSON forms, and an explicit implicit zero keys exactly as
its omission, while an explicitly present `optional` or proto2 zero stays distinct. A
generated message never reaches `@tachui/query`'s generic hasher.

An infinite query adds `'infinite'` after the method name and leaves the
`pageParamKey` field out of the request, so every page of one list shares one entry
and none collides with the unary entry for the same request.

Headers and context values never enter the key. When they change what the server
returns, `keyExtension` appends segments after the request:

```ts
{ keyExtension: () => [tenantId()] }
```

What Protobuf JSON cannot carry faithfully is refused with a `ConnectAdapterError`
rather than keyed: a populated `google.protobuf.Any` or extension data (registries are
not yet supported), unknown fields preserved from a binary parse, a map or
`google.protobuf.Struct` key named `__proto__`, a message of the wrong type, and an
input that is not an object or throws. A property that is not a
field of the request is refused in development; in production it is dropped from the
key and the request alike.

### Prefixes target one transport

`connectQueryPrefix(method)` matches every unary and infinite entry for a method on
the default transport; `connectQueryPrefix(method, { transport: 'account' })` matches
them on that transport only. The transport name precedes the method in a key, so no
single prefix reaches two transports' entries: invalidate each by name.

```ts
client.invalidate(connectQueryPrefix(UserService.method.listUsers, { transport: 'account' }))
```

### Transports are provided through the environment

The application constructs its transports and provides them to a component subtree;
there is no global transport. Provide a `QueryClient` first, then each transport once
per scope:

```ts
provideQueryClient(client)
provideConnectTransport(publicTransport)                      // 'default'
provideConnectTransport(accountTransport, { name: 'account' })

useConnectTransport()          // publicTransport
useConnectTransport('account') // accountTransport
```

A lookup resolves the nearest provider in the component's ancestry, so separate
subtrees and concurrent server renders never see each other's transports. Misuse throws
a `ConnectAdapterError` rather than returning `undefined`:

- no transport provided under the name looked up;
- no `QueryClient` provided above `provideConnectTransport` — the browser's ambient
  client does not count, because a name is cache identity within an explicit client;
- a different transport under a name already provided in the same scope (the same
  transport again is a no-op, so a render can run twice);
- a different transport under a name the client has already bound, in any scope and
  for the client's lifetime. Switching accounts or backends under a fixed name would
  otherwise serve entries cached for the previous one: use a new `QueryClient`, or a
  different name;
- a lookup that would resolve a name to a different transport than the consuming
  scope's client has already bound — for example, one child of a nested client
  shadowing an ancestor's transport while its sibling inherits it. A lookup binds
  what it resolves to that client too, so the order does not matter. Provide the
  transport where the client is provided, or give the shadowing scope its own client;
- an empty, whitespace-only, or non-string name, `null` included, whether provided or
  looked up; or options that are not an object, arrays included.

tachUI cannot see a target or credentials change inside one `Transport`; isolate that
with `keyExtension`, a new client, or a new transport.

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
