---
'@tachui/types': patch
---

Document the deliberate owned-element replacement contract: use a fresh node
or `reactiveElement`, rather than assigning `element` on a mounted node object.
No runtime behavior or public type signatures change.

The prose lands in the published `.d.ts`, so it ships as a patch on
`@tachui/types`. `@tachui/core` is untouched by comparison: its half of the
change is an inline comment, which the bundler strips.
