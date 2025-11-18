/**
 * TachUI Layout Types
 *
 * Type definitions for layout and sizing operations.
 * These types are extracted from @tachui/core to enable shared usage.
 */

/**
 * Type definition for the infinity constant
 */
export type InfinityValue = symbol

/**
 * Dimension type that accepts numbers, strings, or infinity
 * Used throughout the modifier system for size-related properties
 */
export type Dimension = number | string | InfinityValue
