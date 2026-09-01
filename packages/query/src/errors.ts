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
 * Deliberately fails open: when the environment cannot be determined the answer
 * is "yes". The checks this gates catch mistakes that otherwise corrupt the cache
 * silently, and a thrown error at the call site is far cheaper to diagnose than a
 * query that mysteriously never hits.
 *
 * `__DEV__` is not used here. It is declared as a global type in `tools/globals.d.ts`
 * but no build or test config defines it, so referencing it would throw a
 * ReferenceError at runtime.
 */
export function isDevelopment(): boolean {
  try {
    if (typeof process === 'undefined' || !process.env) return true
    return process.env.NODE_ENV !== 'production'
  } catch {
    return true
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
