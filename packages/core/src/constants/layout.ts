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
 * SUI-compatible export object (SUI = SwiftUI-inspired)
 * Allows usage like: import { SUI } from '@tachui/core'; SUI.infinity
 */
export const SUI = {
  infinity: infinity
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
export function dimensionToCSS(value: Dimension | undefined): string | undefined {
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
    flexBasis: '0%'
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
  const expandWidth = options.width === infinity || options.maxWidth === infinity
  const expandHeight = options.height === infinity || options.maxHeight === infinity
  
  const cssProps: Record<string, string> = {}
  
  // Apply flex properties for infinity dimensions
  if (expandWidth) {
    Object.assign(cssProps, {
      flexGrow: '1 !important',
      flexShrink: '1 !important', 
      flexBasis: '0% !important',
      alignSelf: 'stretch !important'  // Override parent's align-items constraint
    })
  }
  
  if (expandHeight) {
    Object.assign(cssProps, {
      flexGrow: '1 !important',
      flexShrink: '1 !important',
      flexBasis: '0% !important',
      alignSelf: 'stretch !important'  // Override parent's align-items constraint
    })
  }
  
  return {
    expandWidth,
    expandHeight,
    cssProps
  }
}