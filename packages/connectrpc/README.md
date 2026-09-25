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
(`provideConnectTransport`, `useConnectTransport`), deterministic query keys with
`connectQueryPrefix`, and the unary adapters `createConnectQuery` and
`createConnectMutation`. The remaining adapters — `createConnectInfiniteQuery`,
`createConnectStream`, and `createConnectStreamList` — land across the 0.12.0
milestone. As with `@tachui/query`, the option and result types are declared first
because they are what every call site is written against.

## Usage

```ts
import { connectQueryPrefix, createConnectMutation, createConnectQuery } from '@tachui/connectrpc'

// In a component, below provideQueryClient() and provideConnectTransport().
const user = createConnectQuery(UserService.method.getUser, () => ({ id: userId() }), {
  transport: 'account',
  staleTime: 30_000,
  retry: 2,
  callOptions: { timeoutMs: 5_000 },
})
user.data()   // the GetUserResponse message, or undefined
user.error()  // unknown: narrow with `instanceof ConnectError`

const rename = createConnectMutation(UserService.method.renameUser, {
  transport: 'account',
  invalidates: [connectQueryPrefix(UserService.method.getUser, { transport: 'account' })],
})
await rename.mutate({ id: userId(), name: 'Ada' })
```

Both resolve their transport when they are created, so a missing provider, a name
bound to another transport, or a `client` option that is not the client the transport
is bound to throws a `ConnectAdapterError` before anything is called or cached. Only
unary methods are accepted; a server-streaming descriptor is a type error.

The input function is reactive, and each time it runs it produces both the key and
the request sent for it: every attempt for that key, retries included, sends that
request, whatever happens to the caller's object or its signals afterwards.

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

### A query's call is shared; its signal and deadline are not

Observers of one key share one call, so a query's `callOptions.signal` and
`callOptions.timeoutMs` bound only that observer's wait on it. When either ends the
wait, that observer's `error` and pending `refetch()` settle with a `ConnectError` —
`canceled` or `deadline_exceeded` — while any other observer keeps waiting. The
deadline covers the whole wait, retries and backoff included. The call itself stops
only once no observer is waiting any longer, and no retry starts after that. A
query's `timeoutMs` is therefore never handed to the transport, where it would cut
the call off for everyone; a mutation's call is its own, so its `timeoutMs` is.

`headers` and `contextValues` travel with the call of whichever observer started it
and never enter the key. So does `retry`: observers that join a running call share its
attempts, which follow the retry count of the observer that started it. **If a header or context value changes what the server
returns — a tenant, an account, a locale — the application must put an identifier
for it in `keyExtension`**, or observers with different values share one entry. Put
identifiers there, never credentials: keys are visible in devtools and can travel in
a server-rendered snapshot. Authentication belongs in the transport's interceptors,
which the adapter never reads.

`cancel()` and owner disposal also settle with `canceled`, promptly, even when a
transport ignores its signal. `cancel()` stops the entry's call for every observer,
as it does in `@tachui/query`.

### Errors keep their identity, and are typed `unknown`

A `ConnectError` the transport rejects with reaches `error`, the rejected
`refetch()` or `mutate()`, and a mutation's `onError` as the same instance, code and
all. Only what the adapter decides itself — a cancellation, a local deadline — is a
new `ConnectError`. Other failures keep their own values: a request that cannot be
keyed is a `ConnectAdapterError`, and a throwing `onSuccess` or `optimisticUpdate`
surfaces whatever it threw. So the error types are `unknown`, and a consumer narrows
with `instanceof ConnectError` before reading a code.

### Retry is a count, and only two codes qualify

Nothing retries by default. When `retry` is set, only `unavailable` and
`resource_exhausted` are retried, up to that many times; the option takes an attempt
count rather than a predicate, so no call site can opt `unauthenticated` or
`deadline_exceeded` back in, and anything but a whole number of 0 or more is refused.
The delay before retry *n* is drawn uniformly (full jitter) from 0 up to
`min(2000, 100 × 2^(n-1))` ms. Retry exhaustion exposes the final attempt's error.
A query's call is shared, so observers of one key that ask for different counts get
the count of whichever observer started the call. Mutations never retry.
`isRetryableCode` is that
allowlist, and is a function rather than an array of codes: a top-level array built
from Connect's `Code` members is an expression a bundler must keep, and it would pull
the Connect runtime into every bundle that imports anything from this package.

### Optimistic state belongs to the application

Mutation options reuse `@tachui/query`'s pairing: `optimisticUpdate` and `onError` are
supplied together, and `onError` receives whatever `optimisticUpdate` returned to roll
back with — after a failure, a cancellation, a `reset()`, or a newer call superseding
it. The adapter never writes query cache data itself and offers no `rollbackOnError`;
a successful write refreshes what it changed through `invalidates`.

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
