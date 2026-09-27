---
---

No release. `@tachui/connectrpc` is a private, in-development package.

`@tachui/connectrpc` adds `createConnectStream(method, input, options)` and
`createConnectStreamList(method, input, options)` for server-streaming methods,
feeding the response messages into `@tachui/query`'s async stream and signal-list
primitives. Each connection sends the request its key was built from, through the
provided transport, and a changed key replaces the call. `cancel()` and owner
disposal abort the Connect call and report `cancelled`; an application signal or
deadline ending it reports `error` with a `canceled` or `deadline_exceeded`
`ConnectError`. Nothing retries or reconnects on its own, `connect()` starts a
fresh call with fresh state, and a server render opens no stream unless asked.
Unary, client-streaming, and bidirectional descriptors are refused before any
call. Stream error types are now `unknown`, since local failures keep their own
values.
