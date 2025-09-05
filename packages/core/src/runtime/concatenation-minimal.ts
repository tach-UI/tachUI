/**
 * Minimal Runtime Concatenation (Phase 2)
 * Ultra-lightweight concatenation for simple text-only components
 * No ARIA support, no complex accessibility - just DOM manipulation
 */

import type { ComponentInstance } from './types'

export interface MinimalConcatenationResult extends ComponentInstance {
  type: 'component'
  optimized: true
  concatenationType: 'minimal'
}

/**
 * Creates an optimized concatenation with minimal overhead
 * Eliminates the ConcatenatedComponent runtime system for static cases
 */
export function createOptimizedConcatenation(
  left: ComponentInstance,
  right: ComponentInstance,
  level: 'minimal'
): MinimalConcatenationResult {
  const concatenatedId = `concat_${left.id}_${right.id}`

  return {
    type: 'component',
    optimized: true,
    concatenationType: 'minimal',
    id: concatenatedId,

    render: () => {
      // Create a single container element
      const container = document.createElement('span')
      container.className = 'tachui-concat-minimal'

      // Render both components directly into the container
      const leftElement = left.render()
      const rightElement = right.render()

      // Append both elements - no wrapper divs, no accessibility overhead
      if (Array.isArray(leftElement)) {
        leftElement.forEach(el => container.appendChild(el))
      } else {
        container.appendChild(leftElement)
      }

      if (Array.isArray(rightElement)) {
        rightElement.forEach(el => container.appendChild(el))
      } else {
        container.appendChild(rightElement)
      }

      return container
    },

    props: {
      // Merge props from both components (simplified)
      ...left.props,
      ...right.props,
    },

    cleanup: () => {
      // Cleanup both components
      left.cleanup?.forEach(fn => fn())
      right.cleanup?.forEach(fn => fn())
    },
  }
}

/**
 * Static concatenation analyzer - determines if concatenation can be pre-computed
 */
export function canOptimizeStatically(
  leftComponent: string,
  rightComponent: string
): boolean {
  // Simple heuristic: if both components are Text with string literals, optimize
  const textWithLiteral = /^Text\s*\(\s*["']([^"']+)["']\s*\)/

  return (
    textWithLiteral.test(leftComponent) && textWithLiteral.test(rightComponent)
  )
}

/**
 * Pre-computes static concatenation at build time
 */
export function precomputeStaticConcatenation(
  leftComponent: string,
  rightComponent: string
): string {
  const leftMatch = leftComponent.match(/^Text\s*\(\s*["']([^"']+)["']\s*\)/)
  const rightMatch = rightComponent.match(/^Text\s*\(\s*["']([^"']+)["']\s*\)/)

  if (leftMatch && rightMatch) {
    const combined = leftMatch[1] + rightMatch[1]
    return `Text("${combined}")`
  }

  // Fallback to runtime concatenation
  return `createOptimizedConcatenation(${leftComponent}.build(), ${rightComponent}.build(), 'minimal')`
}
