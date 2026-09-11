---

---

No release. Test tier and tooling only; `@tachui/query` is a private,
in-development package.

Repairs `bun run test:memory-leaks` (#283), which pointed at four files that no
longer exist and so could not run at all (#229). It now runs the component and
modifier-lifecycle suites that survived the move, plus a new retention tier for
`@tachui/query`.

That tier asks a different question from the heap-growth framework beside it.
Heap growth is a statistic — it needs thresholds, it drifts with the runtime,
and a real leak fits inside an allowance. These tests park a sentinel where only
the thing under test can reach it, drop every other reference, force a
collection, and ask whether it survived: a yes or a no. Covered are an
unobserved entry ageing out, an observed one released when its owner is
disposed, an abandoned request letting go of its controller and entry, a
stream's iterator released when its owner is disposed, and a client that lets go
of everything on `dispose()`.

Each cleanup case is paired with the state before that cleanup, where the
sentinel is expected to survive, and one test leaks an observer deliberately and
requires the tier to notice. Verified against real regressions rather than only
against itself: removing `createQuery`'s observation release fails two of them,
and removing the stream's owner cleanup fails another.

The checks are deterministic and fast, so they run in the normal suite and in CI
rather than only in the manual tier. They need `globalThis.gc`, which the vitest
configs now supply through `poolOptions.<pool>.execArgv`; the harness treats it
as required and fails loudly when it is missing, because a retention suite that
skips is a green suite that checks nothing.

`test:long` is still broken and stays with #229.
