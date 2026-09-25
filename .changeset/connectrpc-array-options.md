---
---

No release. `@tachui/connectrpc` is a private, in-development package.

`provideConnectTransport` refuses an array passed as its options with a
`ConnectAdapterError`, instead of treating it as omitted and providing the
default transport.
