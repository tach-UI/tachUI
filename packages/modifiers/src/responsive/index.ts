/**
 * Responsive Modifiers Integration
 *
 * Note: Advanced responsive functionality has been moved to @tachui/responsive package.
 * This file maintains basic responsive utility imports for backwards compatibility.
 */

// Re-export commonly used responsive utilities from @tachui/responsive
export {
  useBreakpoint,
  useMediaQuery,
  useResponsiveValue,
} from '@tachui/responsive'

// Basic responsive value type for compatibility
export type ResponsiveValue<T> = T | { [breakpoint: string]: T }
