/**
 * Deterministic retention checks.
 *
 * The heap-growth framework in `tools/testing/memory-leak-tester.ts` answers "did
 * this get bigger", which is a statistic: it needs thresholds, it drifts with
 * the runtime, and a real leak can hide inside an allowance. This answers a
 * different question — "is this exact object still reachable" — which has a
 * yes or a no. A `WeakRef` plus a forced collection is the whole mechanism.
 *
 * It depends on `--expose-gc`, which the vitest configs supply through their
 * pool's `execArgv`. That dependency is deliberately fatal rather than
 * skippable: a retention suite that quietly turns into a no-op when the flag
 * goes missing is the exact failure this tier exists to end (#229).
 */

/** Returns the forced collector, or explains how to get one. */
function forcedCollector(): () => void {
  const collect = (globalThis as { gc?: () => void }).gc
  if (typeof collect !== 'function') {
    throw new Error(
      'Retention checks need a forced garbage collector, and globalThis.gc is missing. The vitest configs pass --expose-gc through poolOptions.<pool>.execArgv; a runner that bypasses them needs NODE_OPTIONS=--expose-gc. Skipping instead would leave the suite green while checking nothing.'
    )
  }
  return collect
}

/**
 * Runs collection until weak references have had a chance to clear.
 *
 * More than one cycle, with a macrotask between them: a `WeakRef` is cleared
 * at the end of a turn rather than the instant its target becomes garbage, and
 * an object held only by something that a previous cycle collected needs the
 * next one to go itself.
 */
export async function collectGarbage(cycles = 4): Promise<void> {
  const collect = forcedCollector()
  for (let cycle = 0; cycle < cycles; cycle += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0))
    collect()
  }
}

/**
 * Whether `ref`'s target is still reachable after a forced collection.
 *
 * Read it as the question the test is actually asking. A cleanup test asserts
 * `false`; the control that proves the check can fail asserts `true`.
 */
export async function isRetained(ref: WeakRef<object>): Promise<boolean> {
  await collectGarbage()
  return ref.deref() !== undefined
}

/**
 * A uniquely identifiable object to hang a `WeakRef` on.
 *
 * Sized so it is never a candidate for whatever small-object optimisations a
 * runtime may apply, and labelled so a failure says which sentinel survived.
 */
export function createSentinel(label: string): object {
  return { label, ballast: new Uint8Array(64 * 1024) }
}

/**
 * Runs `body`, keeps a weak reference to what it returns, and drops the
 * strong one.
 *
 * The awkward part of a retention test is that the value under test must not
 * survive in a local, a parameter, or a closure the test still holds — V8 is
 * entitled to keep any of those alive. Building it inside a callback that
 * returns nothing to the caller confines it to a frame that has already
 * returned by the time anything is collected.
 */
export function weaklyHold<T extends object>(body: () => T): WeakRef<T> {
  return new WeakRef(body())
}

/**
 * The asynchronous form of {@link weaklyHold}.
 *
 * Most things worth a retention check — a cache entry, an observed query, an
 * open stream — only exist after something has been awaited.
 */
export async function weaklyHoldAsync<T extends object>(
  body: () => Promise<T>
): Promise<WeakRef<T>> {
  return new WeakRef(await body())
}
