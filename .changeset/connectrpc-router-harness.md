---
---

No release. `@tachui/connectrpc` is a private, in-development package, and this
changes only its tests.

`@tachui/connectrpc`'s suites now share an in-memory `UserService` served by
Connect's `createRouterTransport`, typed as generated code types it, and fail any
test that reaches for the network. Over that router they cover unary queries and
mutations end to end: typed responses, the keyed request snapshot across retries,
`ConnectError` identity for every failure code, local cancellation, retry and
backoff, call options, deterministic keys, shared calls, invalidation, optimistic
state, and provider and client scoping. Server streams are covered through the
router for every ending, and through `@connectrpc/connect-web`'s
`createGrpcWebTransport` over a controlled `fetch`. Compositions with List
(query rows refreshed through `onRefresh`, and `createConnectStreamList` rows) and
Form (a submission mapped to a mutation) are rendered and checked in the DOM.
