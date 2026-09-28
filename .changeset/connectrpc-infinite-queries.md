---
---

No release. `@tachui/connectrpc` and `@tachui/query` are private, in-development
packages.

`@tachui/connectrpc` adds `createConnectInfiniteQuery(method, input, options)` for
unary list methods. `pageParamKey` names the request field carrying the continuation
token, as a dotted path to a singular scalar or enum field; other paths are refused
by the types and at creation. Every page lives in one entry under the method's
`'infinite'` key with the token left out, the first page starts from the token in
each key's own input, and each later page is the key's request snapshot with the
returned token written in. `getNextPageParam` alone decides where the list ends;
the README shows the AIP-158 mapping. Calls, call options, and retry follow the unary
query's rules per page, and the error type is `ConnectError | ConnectAdapterError |
QueryError`. `ConnectPageParamKey` now admits only scalar and enum leaves, and
`ConnectInfiniteQueryResult` omits the backward-pagination controls.

`@tachui/query`'s `createInfiniteQuery` accepts `initialPageParamFor(key)` in place
of `initialPageParam`, for a source whose first page depends on the key being loaded.
