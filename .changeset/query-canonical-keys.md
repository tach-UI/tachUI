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
