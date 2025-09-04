/**
 * Responsive Modifiers Integration
 *
 * Note: Advanced responsive functionality has been moved to @tachui/responsive package.
 * Users should import directly from @tachui/responsive for responsive utilities.
 */

// Basic responsive value type for compatibility
export type ResponsiveValue<T> = T | { [breakpoint: string]: T }

// Note: For responsive utilities like useBreakpoint, useMediaQuery, useResponsiveValue
// please import directly from '@tachui/responsive'
