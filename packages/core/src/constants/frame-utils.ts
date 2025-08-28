/**
 * Frame Utility Functions
 *
 * Convenience functions for common frame operations using infinity
 * Provides SwiftUI-compatible patterns for responsive layouts
 */

import { infinity } from './layout'
import type { Modifier } from '../modifiers/types'
import { LayoutModifier } from '../modifiers/base'

/**
 * Create a frame that fills maximum width
 * Equivalent to SwiftUI's .frame(maxWidth: .infinity)
 */
export function fillMaxWidth(): Modifier {
  return new LayoutModifier({
    frame: {
      maxWidth: infinity
    }
  })
}

/**
 * Create a frame that fills maximum height
 * Equivalent to SwiftUI's .frame(maxHeight: .infinity)
 */
export function fillMaxHeight(): Modifier {
  return new LayoutModifier({
    frame: {
      maxHeight: infinity
    }
  })
}

/**
 * Create a frame that fills both maximum width and height
 * Equivalent to SwiftUI's .frame(maxWidth: .infinity, maxHeight: .infinity)
 */
export function fillMaxSize(): Modifier {
  return new LayoutModifier({
    frame: {
      maxWidth: infinity,
      maxHeight: infinity
    }
  })
}

/**
 * Create a frame that expands to fill available space
 * Sets both width and height to infinity with flex properties
 */
export function expand(): Modifier {
  return new LayoutModifier({
    frame: {
      width: infinity,
      height: infinity
    }
  })
}

/**
 * Create a frame with specific width but infinite height
 * Useful for sidebars or navigation panels
 */
export function fixedWidthExpandHeight(width: number | string): Modifier {
  return new LayoutModifier({
    frame: {
      width,
      maxHeight: infinity
    }
  })
}

/**
 * Create a frame with specific height but infinite width
 * Useful for headers, footers, or horizontal bars
 */
export function fixedHeightExpandWidth(height: number | string): Modifier {
  return new LayoutModifier({
    frame: {
      height,
      maxWidth: infinity
    }
  })
}

/**
 * Create a frame with constrained maximum dimensions
 * Expands within the given constraints
 */
export function constrainedExpand(maxWidth?: number | string, maxHeight?: number | string): Modifier {
  return new LayoutModifier({
    frame: {
      width: infinity,
      height: infinity,
      maxWidth,
      maxHeight
    }
  })
}

/**
 * Create a responsive frame that adapts to container
 * Useful for cards or content areas
 */
export function responsive(
  minWidth?: number | string,
  maxWidth?: number | string,
  minHeight?: number | string,
  maxHeight?: number | string
): Modifier {
  return new LayoutModifier({
    frame: {
      width: infinity,
      height: infinity,
      minWidth,
      maxWidth,
      minHeight,
      maxHeight
    }
  })
}

/**
 * Create a frame for flexible content
 * Grows to fill space but respects content size
 */
export function flexible(): Modifier {
  return new LayoutModifier({
    frame: {
      maxWidth: infinity,
      maxHeight: infinity
    }
  })
}

/**
 * Create a frame for full viewport coverage
 * Useful for overlays, modals, or full-screen components
 */
export function fullScreen(): Modifier {
  return new LayoutModifier({
    frame: {
      width: '100vw',
      height: '100vh'
    }
  })
}

/**
 * Create a frame that takes remaining space in flex containers
 * Combines infinity with flex-grow for optimal space distribution
 */
export function remainingSpace(): Modifier {
  return new LayoutModifier({
    frame: {
      width: infinity,
      height: infinity
    }
  })
}

/**
 * Create a frame for equal distribution in containers
 * Useful for button groups or tab layouts
 */
export function equalShare(): Modifier {
  return new LayoutModifier({
    frame: {
      width: infinity
    }
  })
}