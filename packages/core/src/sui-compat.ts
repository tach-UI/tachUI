/**
 * SUI Compatibility Layer (SUI = SwiftUI-inspired)
 *
 * Provides SwiftUI-style APIs and constants for familiar development experience.
 * Enables easy migration from SwiftUI to TachUI with minimal syntax changes.
 */

import { infinity } from './constants/layout'
import type { Dimension } from './constants/layout'

/**
 * SUI-style constant exports (SUI = SwiftUI-inspired)
 * Allows usage like: import { SUI } from '@tachui/core'; SUI.infinity
 */
export const SUI = {
  infinity: infinity
} as const

/**
 * Direct infinity export for convenience
 * Allows usage like: import { infinity } from '@tachui/core'
 */
export { infinity }

/**
 * Type exports for SwiftUI compatibility
 */
export type { Dimension }

/**
 * Frame utility exports for convenience
 */
export {
  fillMaxWidth,
  fillMaxHeight,
  fillMaxSize,
  expand,
  fixedWidthExpandHeight,
  fixedHeightExpandWidth,
  constrainedExpand,
  responsive,
  flexible,
  fullScreen,
  remainingSpace,
  equalShare
} from './constants/frame-utils'

// Import frame utilities for internal use
import {
  fillMaxWidth,
  fillMaxHeight,
  fillMaxSize,
  expand,
  fixedWidthExpandHeight,
  fixedHeightExpandWidth,
  constrainedExpand,
  responsive,
  flexible,
  fullScreen,
  remainingSpace,
  equalShare
} from './constants/frame-utils'

/**
 * SUI-style frame helpers namespace (SUI = SwiftUI-inspired)
 * Provides organized access to frame utilities
 */
export const Frame = {
  fillMaxWidth,
  fillMaxHeight,
  fillMaxSize,
  expand,
  flexible,
  fullScreen,
  remainingSpace,
  equalShare
} as const

/**
 * Common SUI layout patterns (SUI = SwiftUI-inspired)
 */
export const LayoutPatterns = {
  /**
   * Full-width button pattern
   * Common in forms and action sheets
   */
  fullWidthButton: fillMaxWidth,
  
  /**
   * Sidebar layout pattern
   * Fixed width with full height
   */
  sidebar: (width: number | string = 250) => fixedWidthExpandHeight(width),
  
  /**
   * Header/footer pattern
   * Fixed height with full width
   */
  header: (height: number | string = 60) => fixedHeightExpandWidth(height),
  
  /**
   * Content area pattern
   * Fills remaining space with constraints
   */
  content: (maxWidth?: number | string) => constrainedExpand(maxWidth),
  
  /**
   * Card layout pattern
   * Responsive with sensible constraints
   */
  card: responsive(320, 800, 200),
  
  /**
   * Modal overlay pattern
   * Full screen coverage
   */
  overlay: fullScreen
} as const

/**
 * Migration helpers for SUI developers (SUI = SwiftUI-inspired)
 * Common patterns mapped to TachUI equivalents
 */
export const SuiMigration = {
  /**
   * Pattern: .frame(maxWidth: .infinity)
   * TachUI: fillMaxWidth()
   */
  'frame(maxWidth: .infinity)': fillMaxWidth,
  
  /**
   * Pattern: .frame(maxHeight: .infinity)
   * TachUI: fillMaxHeight()
   */
  'frame(maxHeight: .infinity)': fillMaxHeight,
  
  /**
   * Pattern: .frame(maxWidth: .infinity, maxHeight: .infinity)
   * TachUI: fillMaxSize()
   */
  'frame(maxWidth: .infinity, maxHeight: .infinity)': fillMaxSize,
  
  /**
   * Pattern: .frame(width: .infinity, height: .infinity)
   * TachUI: expand()
   */
  'frame(width: .infinity, height: .infinity)': expand
} as const

/**
 * Debug helper for SUI compatibility (SUI = SwiftUI-inspired)
 * Logs equivalencies for learning purposes
 */
export function logSuiEquivalent(suiCode: string): void {
  if (process.env.NODE_ENV === 'development') {
    const equivalent = (SuiMigration as any)[suiCode]
    if (equivalent) {
      console.info(`SUI Pattern: ${suiCode} → TachUI: ${equivalent.name}()`)
    } else {
      console.warn(`No TachUI equivalent found for: ${suiCode}`)
    }
  }
}