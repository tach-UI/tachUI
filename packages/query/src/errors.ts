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
 * Fails closed: an environment that does not report itself as development is
 * treated as production. A browser bundle has no `process` binding, so a fail-open
 * check would leave every dev-only throw live in shipped applications and would
 * keep the guarded code statically reachable, defeating tree-shaking. Matching the
 * repo-wide `typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'`
 * shape also lets a consumer's bundler fold the whole condition to `false`.
 *
 * `__DEV__` is not used here, even though the type is declared globally in
 * `tools/globals.d.ts`. No build defines it; its only assignment is an import
 * side effect of `@tachui/core`'s `reactive/cleanup.ts:246-249`. This package
 * declares `sideEffects: false`, so depending on another module having been
 * evaluated is exactly the assumption a bundler is entitled to break, and the
 * ambient declaration gives no compile-time warning if it does. A self-contained
 * check has no such ordering requirement.
 */
export function isDevelopment(): boolean {
  try {
    return typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production'
  } catch {
    // A hardened runtime can make reading `process.env` throw; that is not a
    // development environment either.
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
