---
---

No release. `@tachui/connectrpc` is a private, in-development package.

`@tachui/connectrpc` adds `connectQueryPrefix(method, { transport })`, the prefix of
every unary and infinite entry for a method on one transport (`'default'` when
unnamed). Connect query keys are now deterministic: a request is normalized through
its input schema, written as Protobuf JSON under pinned options, and stably
stringified, so field and map order never split an entry. Infinite keys carry an
`'infinite'` segment and omit the page param; `keyExtension` segments follow the
request. Requests carrying a populated `Any`, extension data, preserved unknown
fields, or a message of the wrong type are refused with a `ConnectAdapterError`.
