/**
 * Full Runtime Concatenation (Phase 2)
 * Complete concatenation with full accessibility, semantic analysis, and ARIA support
 * Fallback for complex cases that can't be statically optimized
 */

import type { ComponentInstance } from './types'
import { ConcatenatedComponent } from '../concatenation/concatenated-component'
import type {
  ConcatenationMetadata,
  ComponentSegment,
} from '../concatenation/types'

export interface FullConcatenationResult extends ComponentInstance {
  type: 'component'
  optimized: true
  concatenationType: 'full'
}

/**
 * Creates an optimized concatenation with full accessibility support
 * Uses the existing ConcatenatedComponent but with optimized creation path
 */
export function createOptimizedConcatenation(
  left: ComponentInstance,
  right: ComponentInstance,
  level: 'full'
): FullConcatenationResult {
  // Create segments for the existing concatenation system
  const leftSegment: ComponentSegment = {
    id: left.id,
    component: left,
    modifiers: (left as any).modifiers || [],
    render: () => {
      const rendered = left.render()
      return Array.isArray(rendered) ? rendered[0] : rendered
    },
  }

  const rightSegment: ComponentSegment = {
    id: right.id,
    component: right,
    modifiers: (right as any).modifiers || [],
    render: () => {
      const rendered = right.render()
      return Array.isArray(rendered) ? rendered[0] : rendered
    },
  }

  // Analyze the concatenation for optimal metadata
  const metadata: ConcatenationMetadata = analyzeOptimalMetadata(left, right)

  // Use existing ConcatenatedComponent but mark as optimized
  const concatenatedComponent = new ConcatenatedComponent(
    [leftSegment, rightSegment],
    metadata
  )

  return {
    ...concatenatedComponent,
    optimized: true,
    concatenationType: 'full',
  } as FullConcatenationResult
}

/**
 * Analyzes components to determine optimal concatenation metadata
 */
function analyzeOptimalMetadata(
  left: ComponentInstance,
  right: ComponentInstance
): ConcatenationMetadata {
  // Determine semantic structure
  const leftIsText = isTextComponent(left)
  const rightIsText = isTextComponent(right)
  const leftIsInteractive = isInteractiveComponent(left)
  const rightIsInteractive = isInteractiveComponent(right)

  let accessibilityRole: ConcatenationMetadata['accessibilityRole']
  let semanticStructure: ConcatenationMetadata['semanticStructure']

  // Determine optimal accessibility role
  if (leftIsText && rightIsText) {
    accessibilityRole = 'text'
    semanticStructure = 'inline'
  } else if (leftIsInteractive || rightIsInteractive) {
    accessibilityRole = 'composite'
    semanticStructure =
      leftIsInteractive && rightIsInteractive ? 'block' : 'inline'
  } else {
    accessibilityRole = 'group'
    semanticStructure = 'inline'
  }

  return {
    totalSegments: 2,
    accessibilityRole,
    semanticStructure,
    // Add optimization hints
    optimizationHints: {
      canFlatten: leftIsText && rightIsText,
      needsGroupWrapper: leftIsInteractive || rightIsInteractive,
      hasConflictingRoles: leftIsInteractive && rightIsInteractive,
    },
  }
}

/**
 * Determines if a component is primarily text-based
 */
function isTextComponent(component: ComponentInstance): boolean {
  // Heuristic: check component type or props
  return !!(
    component.id?.includes('text') ||
    component.props?.textContent ||
    (component as any).textContent
  )
}

/**
 * Determines if a component has interactive behavior
 */
function isInteractiveComponent(component: ComponentInstance): boolean {
  return !!(
    component.props?.onClick ||
    component.props?.onTap ||
    component.props?.href ||
    (component as any).interactive ||
    component.id?.includes('button') ||
    component.id?.includes('link')
  )
}

/**
 * Provides fallback to existing concatenation system for unsupported cases
 */
export function fallbackToRuntimeConcatenation(
  left: ComponentInstance,
  right: ComponentInstance
): ComponentInstance {
  // Use the existing .concat() method as fallback
  if (typeof (left as any).concat === 'function') {
    return (left as any).concat(right)
  }

  // Ultimate fallback - create basic concatenation
  return createOptimizedConcatenation(left, right, 'full')
}

// Extend ConcatenationMetadata type to include optimization hints
declare module '../concatenation/types' {
  interface ConcatenationMetadata {
    optimizationHints?: {
      canFlatten: boolean
      needsGroupWrapper: boolean
      hasConflictingRoles: boolean
    }
  }
}
