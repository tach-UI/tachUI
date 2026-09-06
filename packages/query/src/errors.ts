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
 * Whether an implicit module-global client would be unsafe here.
 *
 * The question is isolation — one global scope serving many requests leaks
 * one request's data into the next — but isolation cannot be probed for
 * directly, so this fails closed: only a browser main thread, identified by
 * its `document`, gets the implicit client. Everything else must be handed a
 * client explicitly.
 *
 * That deliberately refuses some contexts that would in fact be safe. A Web
 * Worker in a browser has its own global scope and its own module instances,
 * so a module-global client there would be scoped to that one worker. But
 * `WorkerGlobalScope` is also defined by edge runtimes that reuse an isolate
 * across overlapping requests — Cloudflare's workerd among them — where the
 * same probe would hand several users one shared cache. No available signal
 * separates the two reliably, and the two failure modes are not comparable:
 * refusing a safe worker costs one explicit `provideQueryClient` call, while
 * admitting a shared isolate leaks data between users. So workers are
 * refused, and {@link useQueryClient}'s message says how to proceed rather
 * than assuming a server request.
 *
 * The converse — a server process carrying a DOM shim, jsdom included —
 * reads as a browser and cannot be told apart from one from the inside: the
 * probe that would separate them (`process.versions.node`) is equally true of
 * every test run, which legitimately wants the browser behaviour. SSR code
 * must therefore create a client per request explicitly (see #291) rather
 * than rely on this probe to catch the mistake; it is a backstop for the
 * ordinary case, not a guarantee.
 */
export function isServer(): boolean {
  return typeof document === 'undefined'
}
