/**
 * TachUI Layout Constants
 *
 * Provides SwiftUI-style constants for layout and sizing operations.
 * Enables familiar APIs like `.frame(maxWidth: infinity)` for responsive layouts.
 */

/**
 * Infinity constant representing unlimited space availability
 * Equivalent to SwiftUI's .infinity for frame dimensions
 */
export const infinity = Symbol.for('tachui.infinity')

/**
 * Type definition for the infinity constant
 */
export type InfinityValue = typeof infinity

/**
 * Dimension type that accepts numbers, strings, or infinity
 * Used throughout the modifier system for size-related properties
 */
export type Dimension = number | string | InfinityValue

/**
 * Layout patterns namespace for common SwiftUI-style layouts
 */
export const Layout = {
  /**
   * Full-width button pattern - common in forms and action sheets
   */
  fullWidthButton: { maxWidth: infinity },

  /**
   * Sidebar layout pattern - fixed width with full height
   */
  sidebar: (width: number | string = 250) => ({
    width,
    maxHeight: infinity,
  }),

  /**
   * Header/footer pattern - fixed height with full width
   */
  header: (height: number | string = 60) => ({
    height,
    maxWidth: infinity,
  }),

  /**
   * Content area pattern - fills remaining space with constraints
   */
  content: (maxWidth?: number | string) => ({
    width: infinity,
    height: infinity,
    maxWidth,
  }),

  /**
   * Card layout pattern - responsive with sensible constraints
   */
  card: {
    width: infinity,
    height: infinity,
    minWidth: 320,
    maxWidth: 800,
    minHeight: 200,
  },

  /**
   * Modal overlay pattern - full screen coverage
   */
  overlay: { width: '100vw', height: '100vh' },
} as const

/**
 * Helper function to check if a value is the infinity constant
 */
export function isInfinity(value: any): value is InfinityValue {
  return value === infinity
}

/**
 * Convert a Dimension value to appropriate CSS value
 *
 * @param value - The dimension value to convert
 * @returns CSS-compatible string or undefined
 */
export function dimensionToCSS(
  value: Dimension | undefined
): string | undefined {
  if (value === undefined) {
    return undefined
  }

  if (value === infinity) {
    return '100%'
  }

  if (typeof value === 'number') {
    return `${value}px`
  }

  // String values are passed through as-is (allows for custom units)
  return value
}

/**
 * Convert infinity to flexbox properties for proper expansion
 * Used when width/height is set to infinity to ensure proper flex behavior
 */
export function infinityToFlexCSS(): Record<string, string> {
  return {
    flexGrow: '1',
    flexShrink: '1',
    flexBasis: '0%',
  }
}

/**
 * Helper to determine if a frame constraint should expand to fill
 * Takes precedence of constraints into account
 */
export function shouldExpandForInfinity(options: {
  width?: Dimension
  height?: Dimension
  maxWidth?: Dimension
  maxHeight?: Dimension
  minWidth?: Dimension
  minHeight?: Dimension
}): {
  expandWidth: boolean
  expandHeight: boolean
  cssProps: Record<string, string>
} {
  const expandWidth =
    options.width === infinity || options.maxWidth === infinity
  const expandHeight =
    options.height === infinity || options.maxHeight === infinity

  const cssProps: Record<string, string> = {}

  // Apply flex properties for infinity dimensions
  if (expandWidth) {
    Object.assign(cssProps, {
      flexGrow: '1 !important',
      flexShrink: '1 !important',
      flexBasis: '0% !important',
      alignSelf: 'stretch !important', // Override parent's align-items constraint
    })
  }

  if (expandHeight) {
    Object.assign(cssProps, {
      flexGrow: '1 !important',
      flexShrink: '1 !important',
      flexBasis: '0% !important',
      alignSelf: 'stretch !important', // Override parent's align-items constraint
    })
  }

  return {
    expandWidth,
    expandHeight,
    cssProps,
  }
}
