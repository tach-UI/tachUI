---
---

No release. `@tachui/connectrpc` and `@tachui/query` are private, in-development
packages.

`@tachui/connectrpc` adds `provideConnectTransport` and `useConnectTransport`:
application-constructed transports are provided to a component subtree by name,
`'default'` when unnamed, and resolved from the nearest provider. Providing
requires an explicitly provided `QueryClient`, and a name bound to one transport
for a client cannot be rebound to another for that client's lifetime. Misuse
throws the new `ConnectAdapterError`. The package now depends on `@tachui/core`.

`@tachui/query` exports `QueryClientKey`, so an adapter can read the provided
client without the ambient browser fallback.
