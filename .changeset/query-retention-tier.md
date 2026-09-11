---

---

No release. Test tier and tooling only; `@tachui/query` is a private,
in-development package.

Repairs `bun run test:memory-leaks` (#283), which pointed at a file that no
longer exists and so could not run at all (#229; the other three missing paths
belong to `test:long`, which this leaves alone). It now runs through
`vitest.memory.config.ts`, which globs the memory suites rather than naming
them — the naming is what rotted last time — and covers the component and
modifier-lifecycle suites plus a new retention tier for `@tachui/query`.

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
rather than only in the manual tier. The collector is obtained in-process rather
than asked for from the runner: `--expose-gc` in a vitest config is not
pool-agnostic — Node rejects the flag in a `worker_threads` `execArgv`, so a
config carrying it kills every threads-pool run before a file is collected, and
the vm pools read a different key again. Taking it in-process works under all of
them, leaves no `globalThis.gc` behind to wake the heap-growth suites' dormant
collection branches, and fails at import when no collector can be had, because a
retention suite that skips is a green suite that checks nothing.

`detachFlight` now drops the aborted controller from the client's active set,
which only the settle path did before. A loader that ignores its abort and never
settles therefore kept its controller — and every listener registered on its
signal, with everything those close over — for the life of the client. The
flights `markForReload` releases without aborting stay in the set, which is what
keeps those cancellable. The retention test for it is the one an earlier draft
dropped as unprovable: the sentinel has to be held by an abort listener, not by
the loader closure, which is collectible on its own.

Detaching also leaves the entry in its detached state before the abort fires.
`abort()` runs its listeners synchronously, and a listener is entitled to call
`clear()` or `dispose()` — which re-enters the same detach and empties the slot
the outer one is still working through, so anything read back from the entry
afterwards is whatever that nested call left.

`test:long` is still broken and stays with #229.
