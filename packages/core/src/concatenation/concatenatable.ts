/**
 * Concatenatable Interface Implementation
 * 
 * Provides the base implementation for components that support concatenation
 * using the SwiftUI-style + operator syntax.
 */

import type { ComponentInstance } from '../runtime/types'
import type { Concatenatable, ComponentSegment } from './types'
import { ConcatenatedComponent } from './concatenated-component'

/**
 * Symbol for concatenation operations - matches the one used in types
 */
export const CONCAT_SYMBOL = Symbol.for('tachui.concat')

/**
 * Base implementation for concatenatable functionality
 * This can be mixed into component classes
 */
export abstract class ConcatenatableBase<T = any> implements Concatenatable<T> {
  abstract readonly id: string
  abstract readonly type: string
  
  /**
   * Concatenate this component with another concatenatable component
   */
  concat<U extends Concatenatable<any>>(other: U): ConcatenatedComponent<T | U> {
    const thisSegment = this.toSegment()
    const otherSegment = other.toSegment()
    
    // If other is already a concatenated component, merge segments
    if (other instanceof ConcatenatedComponent) {
      return new ConcatenatedComponent(
        [thisSegment, ...other.segments],
        this.mergeMetadata(other.metadata, other.segments.length + 1)
      )
    }
    
    // Create new concatenated component with both segments
    return new ConcatenatedComponent(
      [thisSegment, otherSegment],
      this.createMetadata(2)
    )
  }
  
  /**
   * Convert this component to a segment for concatenation
   */
  abstract toSegment(): ComponentSegment
  
  /**
   * Check if this component supports concatenation
   */
  isConcatenatable(): boolean {
    return true
  }
  
  /**
   * Create metadata for a new concatenated component
   */
  protected createMetadata(totalSegments: number): import('./types').ConcatenationMetadata {
    return {
      totalSegments,
      accessibilityRole: this.determineAccessibilityRole(),
      semanticStructure: this.determineSemanticStructure()
    }
  }
  
  /**
   * Merge metadata when concatenating with existing concatenated component
   */
  protected mergeMetadata(
    existing: import('./types').ConcatenationMetadata, 
    newTotal: number
  ): import('./types').ConcatenationMetadata {
    return {
      totalSegments: newTotal,
      accessibilityRole: this.mergeAccessibilityRoles(existing.accessibilityRole),
      semanticStructure: this.mergeSemanticStructures(existing.semanticStructure)
    }
  }
  
  /**
   * Determine the accessibility role for this component
   */
  protected determineAccessibilityRole(): 'text' | 'group' | 'composite' {
    // Default implementation - subclasses should override
    const componentType = this.constructor.name
    
    if (componentType === 'EnhancedText') return 'text'
    if (componentType === 'EnhancedImage') return 'group'
    if (componentType === 'EnhancedButton' || componentType === 'EnhancedLink') return 'group'
    
    return 'composite'
  }
  
  /**
   * Determine the semantic structure for this component
   */
  protected determineSemanticStructure(): 'inline' | 'block' | 'mixed' {
    // Default implementation - subclasses should override
    const componentType = this.constructor.name
    
    if (componentType === 'EnhancedText') return 'inline'
    if (componentType === 'EnhancedImage') return 'inline'
    
    return 'mixed'
  }
  
  /**
   * Merge accessibility roles when combining components
   */
  protected mergeAccessibilityRoles(
    existing: 'text' | 'group' | 'composite'
  ): 'text' | 'group' | 'composite' {
    const thisRole = this.determineAccessibilityRole()
    
    // If both are text, keep text
    if (thisRole === 'text' && existing === 'text') return 'text'
    
    // If either is composite, result is composite
    if (thisRole === 'composite' || existing === 'composite') return 'composite'
    
    // Otherwise, it's a group
    return 'group'
  }
  
  /**
   * Merge semantic structures when combining components
   */
  protected mergeSemanticStructures(
    existing: 'inline' | 'block' | 'mixed'
  ): 'inline' | 'block' | 'mixed' {
    const thisStructure = this.determineSemanticStructure()
    
    // If both are inline, keep inline
    if (thisStructure === 'inline' && existing === 'inline') return 'inline'
    
    // If both are block, keep block
    if (thisStructure === 'block' && existing === 'block') return 'block'
    
    // Otherwise, it's mixed
    return 'mixed'
  }
}

/**
 * Utility function to make any component concatenatable
 * This can be used as a mixin for existing components
 */
export function makeConcatenatable<T extends ComponentInstance>(
  component: T
): T & Concatenatable {
  const concatenatable = component as T & Concatenatable
  
  // Add concatenation method
  concatenatable.concat = function<U extends Concatenatable<any>>(
    other: U
  ): ConcatenatedComponent<any> {
    const thisSegment: ComponentSegment = {
      id: this.id,
      component: this,
      modifiers: (this as any).modifiers || [],
      render: () => {
        const rendered = this.render()
        return Array.isArray(rendered) ? rendered[0] : rendered
      }
    }
    
    const otherSegment = other.toSegment()
    
    if (other instanceof ConcatenatedComponent) {
      return new ConcatenatedComponent(
        [thisSegment, ...other.segments],
        {
          totalSegments: other.segments.length + 1,
          accessibilityRole: 'group',
          semanticStructure: 'mixed'
        }
      )
    }
    
    return new ConcatenatedComponent(
      [thisSegment, otherSegment],
      {
        totalSegments: 2,
        accessibilityRole: 'group',
        semanticStructure: 'mixed'
      }
    )
  }
  
  concatenatable.toSegment = function(): ComponentSegment {
    return {
      id: this.id,
      component: this,
      modifiers: (this as any).modifiers || [],
      render: () => {
        const rendered = this.render()
        return Array.isArray(rendered) ? rendered[0] : rendered
      }
    }
  }
  
  concatenatable.isConcatenatable = function(): boolean {
    return true
  }
  
  return concatenatable
}