---
---

No release. `@tachui/connectrpc` and `@tachui/query` are private, in-development
packages.

`@tachui/connectrpc` adds `createConnectQuery(method, input, options)` and
`createConnectMutation(method, options)` for unary methods. A query sends the
request its key was built from on every attempt, shares one call among the
observers of a key, and bounds each observer's wait by its own signal and
`timeoutMs` without cutting the call off for the others. Opt-in query retries
cover only `unavailable` and `resource_exhausted`, with full-jitter backoff capped
from 100 ms doubling to 2,000 ms; mutations never retry. Transport `ConnectError`s
keep their identity; cancellation and local deadlines settle as `canceled` and
`deadline_exceeded`. Query and mutation error types are now `unknown`, since local
failures keep their own values. A `client` option that is not the client the
transport is bound to is refused with a `ConnectAdapterError`.

`@tachui/query` exports `hashQueryKey`, so an adapter can tell when its observers
share an entry.
