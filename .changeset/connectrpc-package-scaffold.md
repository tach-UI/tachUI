---
---

No release. `@tachui/connectrpc` and `@tachui/query` are private, in-development
packages.

Adds the `@tachui/connectrpc` scaffold: the package, its Connect and Protobuf
peer dependencies, its public type surface, and a packed-install check that runs
against both the lowest and the highest peer versions the declared ranges admit.
It stays `private` until 0.13.0 ships, and is published with `@tachui/query` after that.

`@tachui/query` re-exports its `SelectRequirement` type, for the adapter to
build on, and its emitted declarations no longer name `QueryClientKey`'s type by
a `@tachui/core` path outside core's exports map, which a consumer type-checking
its dependencies could not resolve.
