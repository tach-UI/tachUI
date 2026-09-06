---

---

No release. `@tachui/query` is a private, in-development package.

Adds structured query keys with stable hashing and a payload codec (#278). A
single canonical encoding now serves as the cache hash, the SSR wire form, and
the validation pass. Object properties are sorted, so property order can no
longer split one logical key across two entries, and the types plain
`JSON.stringify` gets wrong are carried as tagged wrappers: `bigint` as
`"123n"`, `Uint8Array` as base64, `Date` as ISO 8601, an explicit `undefined`
distinguished from an absent property, and `NaN`, `Infinity`, and `-0` as
tokens. Because the tags carry the type, a `Date` segment and its own ISO
string are no longer the same entry.

The encoding is JSON-safe by construction and decodes back to an equal key, so
`dehydrate`/`hydrate` round-trip keys that previously had to be skipped as
unrepresentable, and `hydrate` validates every tag rather than trusting a
payload that crossed a process boundary. A key that is already plain JSON
encodes to itself, so the common payload is unchanged.

Functions, symbols, and class instances without `toJSON` raise a `QueryError`
naming the path to the offending segment rather than producing an unstable key.
Prefix invalidation matches on the structured form, so `Date`, `bigint`,
`Uint8Array`, and object segments are reachable by value.

Also extends the encoding to snapshot data and to the environment probe. A
`Date`, `bigint`, `Uint8Array`, explicit `undefined`, `-0`, `NaN`, or
`Infinity` inside `data` now survives the SSR boundary instead of costing the
entry its snapshot; data keeps the loader's property order and refuses
`toJSON` carriers, because there the carrier is the value rather than a
spelling of it. `isServer()` keeps failing closed — only a browser main
thread gets the implicit client — because `WorkerGlobalScope` is defined both
by isolated browser workers and by edge runtimes that reuse one isolate
across overlapping requests, and admitting the latter would hand several
users a shared cache. Its error message no longer assumes a server request,
so a worker is told how to proceed rather than pointed at a per-request shape
it does not have.
