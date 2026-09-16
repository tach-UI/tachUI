---
'@tachui/modifiers': patch
---

Test-only: the overlay suites run against a real DOM in the package's own
runner.

`__tests__/setup-enhanced.ts` replaces `global.document` with a hand-rolled
mock whose `appendChild` is a no-op spy and which exposes no `children`. The
overlay modifier builds a layer element and walks the resulting tree, so it
cannot work against a mock of that shape: `bun run --filter @tachui/modifiers
test` failed 82 of 1128, and the package's `valid` script with it, while the
root runner — which uses the shared jsdom setup — passed all of them.

The overlay suites now run as their own project on that shared setup, so the
package-local run agrees with the root one. No source or behaviour change.
