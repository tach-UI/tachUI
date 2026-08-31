---
'@tachui/core': patch
---

Fix the quick start so a new user's first code compiles (#236), and clear the post-bun-migration doc rot (#221).

The README told users to import `Text`, `Button` and `VStack` from `@tachui/core`, which stopped exporting them in the 0.8 modular split — every component import in the first sample failed with TS2305. The sample now uses the two-package shape, ends in a real `mount()` call so it actually renders, and carries a version note so pre-0.8 tutorials stop regenerating broken imports.

That sample is now executed as a test (`packages/core/__tests__/integration/readme-quick-start.test.ts`), so it cannot drift from the API again without CI failing.

Docs-only otherwise: no runtime change in this release beyond the accompanying `mount()` work.
