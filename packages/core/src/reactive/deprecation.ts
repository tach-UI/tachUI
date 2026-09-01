/**
 * Deprecation notices for the enhanced reactive branch.
 *
 * `@tachui/core` exports two reactive runtimes. The enhanced one does not
 * track dependencies: `EnhancedEffect.execute` resolves
 * `(this as any).setCurrentComputation` — a member that does not exist — and
 * falls back to a no-op, so an enhanced effect never re-runs when a signal it
 * read changes. Measured, standard vs enhanced, same shape:
 *
 *   standard signal + standard effect   1 run -> 2 after set
 *   enhanced signal + enhanced effect   1 run -> 1 after set
 *   standard signal + enhanced effect   1 run -> 1 after set
 *
 * The failure is silent, which is the dangerous part: reads work, writes
 * appear to succeed, and nothing downstream updates.
 *
 * These warn rather than throw because the branch is publicly exported and
 * removal is scheduled for 0.9.0 (#271), under the version-line procedure in
 * #264. Which graph becomes canonical is decided by #269.
 */

const warned = new Set<string>()

/**
 * Warn once per symbol, per process. Deliberately not gated on NODE_ENV: the
 * failure this describes is silent in production too, and a single line on
 * first use is cheaper than the bug it prevents.
 */
export function warnEnhancedReactiveDeprecated(
  symbol: string,
  replacement: string
): void {
  if (warned.has(symbol)) return
  warned.add(symbol)

  console.warn(
    `[@tachui/core] ${symbol}() is deprecated and DOES NOT WORK: the enhanced ` +
      `reactive graph never tracks dependencies, so enhanced effects do not ` +
      `re-run when their signals change. Use ${replacement} instead. ` +
      `This export is scheduled for removal in 0.9.0 — see ` +
      `https://github.com/tach-UI/tachUI/issues/271`
  )
}

/** Test seam: forget which symbols have already warned. */
export function __resetEnhancedReactiveWarningsForTests(): void {
  warned.clear()
}
