/**
 * ConcatenatedComponent Implementation
 *
 * The main class that represents a concatenated component composed of multiple
 * component segments. Handles rendering, accessibility, and further concatenation.
 */
import type { ComponentInstance, DOMNode } from '../runtime/types'
import type {
  Concatenatable,
  ComponentSegment,
  ConcatenationMetadata,
  AccessibilityNode,
} from './types'
/**
 * A component that represents the concatenation of multiple components
 */
export declare class ConcatenatedComponent<T = any>
  implements ComponentInstance<any>, Concatenatable<T>
{
  metadata: ConcatenationMetadata
  readonly type: 'component'
  readonly id: string
  mounted: boolean
  cleanup: (() => void)[]
  props: any
  segments: ComponentSegment[]
  constructor(
    segments: ComponentSegment[],
    metadata: ConcatenationMetadata,
    _enableOptimization?: boolean
  )
  /**
   * Render the concatenated component to DOM nodes (Enhanced - Phase 4.2)
   */
  render(): DOMNode[]
  /**
   * Build comprehensive accessibility attributes
   */
  private buildAccessibilityAttributes
  /**
   * Generate description for grouped content
   */
  private generateGroupDescription
  /**
   * Generate flow targets for reading order
   */
  private generateFlowTargets
  /**
   * Check if concatenated content contains interactive elements
   */
  private hasInteractiveContent
  /**
   * Get unique component types in this concatenation
   */
  private getUniqueComponentTypes
  /**
   * Concatenate this component with another concatenatable component
   */
  concat<U extends Concatenatable<any>>(other: U): ConcatenatedComponent<T | U>
  /**
   * Convert this concatenated component to a segment (for further concatenation)
   */
  toSegment(): ComponentSegment
  /**
   * Check if this component supports concatenation
   */
  isConcatenatable(): boolean
  /**
   * Determine the appropriate CSS class for the container
   */
  private determineContainerClass
  /**
   * Build comprehensive accessibility label for screen readers (Enhanced - Phase 4.2)
   */
  private buildAccessibilityLabel
  /**
   * Intelligently join accessibility labels based on content and structure
   */
  private joinAccessibilityLabels
  /**
   * Context-aware label joining for mixed content
   */
  private smartJoinLabels
  /**
   * Determine if two accessibility labels need explicit separation
   */
  private needsExplicitSeparator
  /**
   * Extract accessibility text from a component segment
   */
  private extractAccessibilityText
  /**
   * Merge metadata from two concatenation operations
   */
  private mergeMetadata
  /**
   * Merge accessibility roles from two components
   */
  private mergeAccessibilityRoles
  /**
   * Merge semantic structures from two components
   */
  private mergeSemanticStructures
  /**
   * Determine accessibility role for a single component
   */
  private determineComponentAccessibilityRole
  /**
   * Determine semantic structure for a single component
   */
  private determineComponentSemanticStructure
  /**
   * Generate comprehensive accessibility tree for this concatenated component
   */
  generateAccessibilityTree(): AccessibilityNode
  /**
   * Convert a component segment to an accessibility node
   */
  private segmentToAccessibilityNode
}
//# sourceMappingURL=concatenated-component.d.ts.map
