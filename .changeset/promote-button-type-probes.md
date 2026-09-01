---
---

No release. Test-only and tooling changes.

Promotes leftover `tsc` scratch files from #266 into a real type test
(`packages/primitives/__tests__/controls/Button.test-d.ts`), and adds the
infrastructure to run it: `vitest.typecheck.config.ts`,
`tsconfig.typecheck-tests.json`, and a `test:types` script chained into
`test:ci`.

Touches `packages/primitives/` and so trips the changeset policy, but nothing
publishable changes: the package ships `"files": ["dist"]`, and `__tests__` is
excluded from both the build and `tsconfig.type-check.json`. No runtime
behaviour and no public type surface is modified.

The one behavioural defect found while writing the test — `ButtonStyles.*`
silently discarding a third argument when passed props second — is pinned as
current behaviour and tracked in #307, not fixed here.
