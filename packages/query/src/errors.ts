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
 * This is a runtime probe and nothing more. It is **not** erased from a
 * production bundle, and neither is anything it guards: a bundler replaces
 * `process.env.NODE_ENV` textually, but it will not propagate the result through
 * a function call or a module-level constant into the branch. Measured against
 * esbuild with `--minify --define:process.env.NODE_ENV="production"`, a call
 * here, a `const` holding the same expression, and an IIFE all leave the guarded
 * body in the output; only the comparison written inline at the guard site is
 * eliminated. So if a later phase needs dev-only code genuinely stripped from
 * production, it needs an inline expression or a dedicated build-time define,
 * with a bundle assertion to prove it - not this function.
 *
 * What it reports: a `process` with no `NODE_ENV` - a bare `node server.js`, or
 * a browser bundle carrying a `process.env = {}` shim - reads as development, on
 * the grounds that an unconfigured environment belongs to a developer far more
 * often than to an end user. It reads as production only where there is no
 * `process` binding at all, or where reading it throws.
 *
 * `__DEV__` is not used here. It is not a build-time define anywhere in this
 * repo; its only assignment is the module-level `globalThis.__DEV__` fallback at
 * the foot of `@tachui/core`'s `reactive/cleanup.ts`, so it arrives only as an
 * import side effect, and this package declares `sideEffects: false` - relying on
 * another module having been evaluated is exactly the assumption a bundler may
 * break. It would not compile here either: `tools/globals.d.ts` is not in this
 * package's type-check program, so `__DEV__` raises TS2304.
 */
export function isDevelopment(): boolean {
  try {
    return typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production'
  } catch {
    // A hardened runtime can expose `process` and refuse to hand over `env`.
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
