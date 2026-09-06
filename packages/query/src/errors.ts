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
 * Whether this code runs where a module-global cache would be shared across
 * requests — the one condition that makes an implicit client unsafe, because
 * one request's data would leak into the next.
 *
 * The question is isolation, not the presence of a DOM. A browser tab and a
 * Web Worker each have their own global scope and their own module instances,
 * so a module-global client in either is scoped to that one context; a server
 * process serving many requests is the case to refuse. A bare `document`
 * check answers the wrong question for a worker: no `document`, but also no
 * sharing, and the "create one per request" error it produced named a shape
 * that does not exist there.
 *
 * The converse — a server process carrying a DOM shim, jsdom included — reads
 * as a browser here and cannot be told apart from one from the inside: the
 * probe that would separate them (`process.versions.node`) is equally true of
 * every test run, which legitimately wants the browser behaviour. SSR code
 * must therefore create a client per request explicitly (see #291) rather
 * than rely on this probe to catch the mistake; the probe is a backstop for
 * the ordinary case, not a guarantee.
 */
export function isServer(): boolean {
  // A document means a browser main thread.
  if (typeof document !== 'undefined') {
    return false
  }
  // WorkerGlobalScope exists only inside a worker, so this distinguishes one
  // from a server runtime without reaching for `self`, which Node also
  // defines in some versions. Read off globalThis because the DOM lib is not
  // in this package's type-check program.
  if (
    (globalThis as { WorkerGlobalScope?: unknown }).WorkerGlobalScope !==
    undefined
  ) {
    return false
  }
  return true
}
