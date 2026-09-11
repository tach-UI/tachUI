/**
 * Deterministic retention checks.
 *
 * The heap-growth framework in `tools/testing/memory-leak-tester.ts` answers
 * "did this get bigger", which is a statistic: it needs thresholds, it drifts
 * with the runtime, and a real leak fits inside an allowance. This answers a
 * different question — "is this exact object still reachable" — which has a yes
 * or a no. A `WeakRef` plus a forced collection is the whole mechanism.
 *
 * The collector is obtained here rather than asked for from the runner. A
 * `--expose-gc` in the vitest config is not pool-agnostic: Node rejects the
 * flag outright in a `worker_threads` `execArgv`, so a config carrying it kills
 * every run under the threads pool before a file is collected, and the vm pools
 * read a different key again. Taking it in-process works under all of them, and
 * leaves no `globalThis.gc` behind for the heap-growth suites, whose dormant
 * `if (global.gc)` branches would otherwise wake up and change what they
 * measure.
 *
 * Whether a missing collector is fatal depends on who is asking. Under
 * `test:memory-leaks` it is: that tier exists to run these checks, and one that
 * quietly ran none of them would be the disease, not the cure. Everywhere else
 * these files are swept up by the ordinary suite, and `v8.setFlagsFromString`
 * is documented as unsafe and unguaranteed after startup — so a runtime that
 * stops yielding a collector should cost the retention coverage, not every
 * other test in the repository. There it skips instead, which is visible in the
 * run and cannot be mistaken for a pass.
 */

import v8 from 'node:v8'
import vm from 'node:vm'

/** The forced collector, obtained once at import, or null if none can be. */
const collect: (() => void) | null = (() => {
  const existing = (globalThis as { gc?: () => void }).gc
  if (typeof existing === 'function') {
    return existing
  }
  try {
    v8.setFlagsFromString('--expose-gc')
    try {
      const exposed = vm.runInNewContext('gc') as unknown
      return typeof exposed === 'function' ? (exposed as () => void) : null
    } finally {
      // Put the flag back: it is the isolate's, not this module's, and leaving
      // it set is how the collector would reach code that never asked for one.
      v8.setFlagsFromString('--no-expose-gc')
    }
  } catch {
    return null
  }
})()

const MISSING_COLLECTOR =
  'Retention checks need a forced garbage collector, and none could be obtained from v8.setFlagsFromString("--expose-gc") + vm.runInNewContext("gc").'

if (collect === null) {
  if (process.env.FORCE_MEMORY_TESTS === 'true') {
    throw new Error(
      `${MISSING_COLLECTOR} The memory tier is what asked for them, so this is fatal rather than skipped: a tier that runs no checks is the failure it exists to prevent.`
    )
  }
  // Loud, because the alternative to noticing this is retention coverage
  // disappearing from the ordinary suite without anything saying so.
  console.warn(
    `${MISSING_COLLECTOR} Retention suites are skipped here; run \`bun run test:memory-leaks\`, where the same condition fails instead.`
  )
}

/**
 * Whether collection can be forced here.
 *
 * A retention suite gates itself on this — `describe.skipIf(!canForceCollection)`
 * — so a tooling regression costs these checks rather than the whole run. Under
 * the memory tier the condition never reaches a test: importing this module has
 * already failed.
 */
export const canForceCollection = collect !== null

/**
 * Runs collection until weak references have had a chance to clear.
 *
 * More than one cycle, with a macrotask between them: a `WeakRef` is not
 * cleared within the turn that dropped its target, and an object held only by
 * something a previous cycle collected needs the next one to go itself.
 */
async function collectGarbage(cycles = 4): Promise<void> {
  if (collect === null) {
    throw new Error(MISSING_COLLECTOR)
  }
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

/** A uniquely identifiable object to hang a `WeakRef` on. */
export function createSentinel(label: string): object {
  return { label }
}

/**
 * Runs `body`, keeps a weak reference to what it returns, and drops the strong
 * one.
 *
 * The awkward part of a retention test is that the value under test must not
 * survive in a local, a parameter, or a closure the test still holds — V8 is
 * entitled to keep any of those alive. Building it inside a callback that
 * returns nothing to the caller confines it to a frame that has already
 * returned by the time anything is collected.
 */
export async function weaklyHoldAsync<T extends object>(
  body: () => Promise<T>
): Promise<WeakRef<T>> {
  return new WeakRef(await body())
}
