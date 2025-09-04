/**
 * Component Concatenation System
 *
 * Exports all concatenation functionality for SwiftUI-style component composition
 * using the + operator.
 */
export type {
  ComponentSegment,
  ConcatenationMetadata,
  AccessibilityNode,
  ConcatenationResult,
  Concatenatable,
} from './types'
export {
  ConcatenationSymbol,
  isConcatenatable,
  isConcatenatedComponent,
} from './types'
export {
  ConcatenatableBase,
  makeConcatenatable,
  CONCAT_SYMBOL,
} from './concatenatable'
export { ConcatenatedComponent } from './concatenated-component'
export { TextConcatenationOptimizer } from './text-optimizer'
export { ConcatenatedComponent as Concatenated } from './concatenated-component'
//# sourceMappingURL=index.d.ts.map
