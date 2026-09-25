/**
 * Shared defaults for the Connect adapter.
 *
 * Declared once here so every adapter, and the tests that pin them, read the
 * same value.
 */

import { Code } from '@connectrpc/connect'

/**
 * The transport name used when none is given. Always part of a query key, so a
 * default transport's entries never share a namespace with a named one.
 */
export const DEFAULT_TRANSPORT_NAME = 'default'

/** The cap on the delay before a query's first retry, in milliseconds. */
export const RETRY_BASE_DELAY_MS = 100

/** The cap on the delay before any retry, however many came before it. */
export const RETRY_MAX_DELAY_MS = 2_000

/**
 * Whether a failure with this code may be retried, when `retry` asks for it.
 *
 * Only `unavailable` and `resource_exhausted`: both say the server could not
 * take the call right now, so the same call may succeed later. Everything else
 * is an answer about the call itself — retrying `unauthenticated`,
 * `invalid_argument`, or `not_found` repeats a request that cannot succeed,
 * `cancelled` undoes the caller's own decision, and `deadline_exceeded` spends
 * time past a deadline the caller chose.
 *
 * A function rather than a list of codes: a top-level array built from `Code`
 * members is an expression a bundler must keep, and it would drag the Connect
 * runtime into every bundle that imports anything from this package.
 */
export function isRetryableCode(code: Code): boolean {
  return code === Code.Unavailable || code === Code.ResourceExhausted
}
