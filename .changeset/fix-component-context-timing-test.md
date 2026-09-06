---

---

No release. Test-only change.

Fixes a flaky assertion in `packages/core/__tests__/state/component-context.test.ts`.
`createdAt` is stamped in the `ComponentContext` constructor, but the test read
its lower bound *after* constructing, so `createdAt >= startTime` only held
while both landed in the same millisecond and failed whenever a millisecond
boundary fell between the two lines. The test now brackets the construction
with readings on both sides, which is deterministic and also stronger: it
proves the stamp came from this construction rather than from some earlier
instant.
