---

---

No release. `@tachui/query` is a private, in-development package.

Adds `QueryClient` with environment provision (`createQueryClient`,
`provideQueryClient`, `useQueryClient`) and the server global-client guard
(#277). Cache state is owned by an explicit client rooted in a detached
reactive root — never by module-global state — with baseline `fetchQuery`,
`prefetchQueries`, `invalidate`, `dehydrate`, `hydrate`, `clear`, and
`dispose`. Key canonicalization (#278), cache lifecycle policy (#279), and
SSR payload rules (#291) build on this in follow-ups.
