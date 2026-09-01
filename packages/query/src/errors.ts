/**
 * Errors and environment probes for @tachui/query.
 */

/**
 * Error raised for programming mistakes in query usage - an unserializable key,
 * a missing client, a misconfigured option.
 *
 * A dedicated class rather than a bare `Error` so applications can distinguish a
 * framework misuse from a failed request in an error boundary, and so the message
 * prefix stays consistent.
 */
export class QueryError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(`[@tachui/query] ${message}`, options)
    this.name = 'QueryError'
  }
}

/**
 * Whether development-time diagnostics should run.
 *
 * A module constant rather than a function call, so a bundler can erase the
 * branches that depend on it. Every bundler replaces `process.env.NODE_ENV`
 * textually, which folds this to a literal `false` in a production build and
 * lets `if (DEV)` bodies drop out entirely. Wrapping the same expression in a
 * function with a `try`/`catch` does not survive that: esbuild folds the
 * comparison but will not inline across the `catch`, so the guarded code ships.
 *
 * What it does NOT do is guarantee production semantics from an unhelpful
 * environment. A `process` with no `NODE_ENV` - a bare `node server.js`, or a
 * browser bundle carrying a `process.env = {}` shim - reads as development, on
 * the grounds that an unconfigured environment is far more often a developer's
 * than an end user's. It reads as production only where there is no `process`
 * binding at all, or where reading it throws.
 *
 * `__DEV__` is not used here. It is not a build-time define anywhere in this
 * repo; its only assignment is an import side effect of `@tachui/core`'s
 * `reactive/cleanup.ts:246-249`. This package declares `sideEffects: false`, so
 * relying on another module having been evaluated is exactly the assumption a
 * bundler may break. It would not even compile here: `tools/globals.d.ts` is not
 * in this package's type-check program, so `__DEV__` raises TS2304.
 */
export const DEV: boolean = (() => {
  try {
    return typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production'
  } catch {
    // A hardened runtime can expose `process` and refuse to hand over `env`.
    return false
  }
})()

/**
 * Function form of {@link DEV}, for callers that need to observe the environment
 * after module evaluation - notably tests, which stub `process` per case.
 *
 * Prefer `DEV` in library code: a call here is opaque to a bundler and will keep
 * whatever it guards in the output.
 */
export function isDevelopment(): boolean {
  try {
    return typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production'
  } catch {
    return false
  }
}

/**
 * Whether this code is running outside a browser document.
 *
 * Used to refuse an implicit module-global query client on the server, where a
 * shared cache would leak one request's data into the next.
 */
export function isServer(): boolean {
  return typeof document === 'undefined'
}
