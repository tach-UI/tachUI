/**
 * Cache and lifecycle defaults for @tachui/query.
 *
 * These are deliberately conservative. Nothing refetches in the background and
 * nothing retries unless the caller asks for it, so a query does exactly the
 * number of requests the developer can predict from reading the call site.
 */

/**
 * Freshness window, in milliseconds. Zero means a cached value is considered
 * stale the moment it is written, so the next observer refetches.
 *
 * Distinct from {@link DEFAULT_GC_TIME}: `staleTime` decides when data is worth
 * refetching, `gcTime` decides how long an unobserved entry is kept at all.
 */
export const DEFAULT_STALE_TIME = 0

/**
 * How long an entry with zero observers is retained before eviction, in
 * milliseconds. Five minutes: long enough that navigating away and back reuses
 * the entry, short enough that an abandoned cache does not grow without bound.
 */
export const DEFAULT_GC_TIME = 300_000

/**
 * Retry attempts after a failed load. Zero: retries are an explicit policy
 * decision, because a blind retry on a validation or permission error is just a
 * slower failure.
 */
export const DEFAULT_RETRY = 0

/**
 * Whether a query fetches at all. Overridden per query by `enabled`.
 */
export const DEFAULT_ENABLED = true

/**
 * Whether a query's data is serialized into an SSR snapshot. Opt-in, because
 * most cached data is either not needed for first paint or not safe to ship.
 */
export const DEFAULT_SNAPSHOT = false
