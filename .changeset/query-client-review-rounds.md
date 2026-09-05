---

---

No release. `@tachui/query` is a private, in-development package.

Closes review rounds 10-12 on `QueryClient` (#277), a follow-up to #344 which
merged at round 9. Prefix matching now compares per-segment hashes of the key
as supplied rather than the stored wire rendering, so an `undefined` segment no
longer collapses to `null` and escapes `invalidate()`; segments are read
through a `toJSON` hook on the key array itself. `hydrate()` stores the wire
rendering, so hydrated entries face the `dehydrate()` self-consistency gate on
the same terms as inserts, and nothing is emitted that the same client's
`hydrate()` would reject. The key scan and the wire gate reject or skip own
properties `JSON.stringify` drops — non-enumerable members, non-index array
names, symbols enumerable or not — instead of letting distinct keys collide.
Every dispatch-phase failure is tagged whatever its type, so `prefetchQueries`
surfaces misuse rather than swallowing it as a load failure.
