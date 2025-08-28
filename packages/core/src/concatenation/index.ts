/**
 * Component Concatenation System
 * 
 * Exports all concatenation functionality for SwiftUI-style component composition
 * using the + operator.
 */

// Core types and interfaces
export type {
  ComponentSegment,
  ConcatenationMetadata,
  AccessibilityNode,
  ConcatenationResult,
  Concatenatable
} from './types'

export {
  ConcatenationSymbol,
  isConcatenatable,
  isConcatenatedComponent
} from './types'

// Base concatenatable implementation
export {
  ConcatenatableBase,
  makeConcatenatable,
  CONCAT_SYMBOL
} from './concatenatable'

// Main concatenated component class
export {
  ConcatenatedComponent
} from './concatenated-component'

// Text optimization utilities
export {
  TextConcatenationOptimizer
} from './text-optimizer'

// Re-export for convenience
export { ConcatenatedComponent as Concatenated } from './concatenated-component'