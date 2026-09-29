/**
 * Compatibility entrypoint for applications that still need the legacy
 * root-plus-compiler surface while migrating to explicit tooling imports.
 *
 * Prefer:
 * - @tachui/core for runtime-safe browser code
 * - @tachui/core/compiler for compiler APIs
 */
export * from './index'
export * from './compiler'
