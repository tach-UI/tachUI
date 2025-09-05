/**
 * Minimal Runtime Concatenation (Phase 2)
 * Ultra-lightweight concatenation for simple text-only components
 * No ARIA support, no complex accessibility - just DOM manipulation
 */

import type {
  ComponentInstance,
  DOMNode,
  RenderFunction,
  LifecycleCleanup,
} from './types'

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
  _level: 'minimal'
): MinimalConcatenationResult {
  const concatenatedId = `concat_${left.id}_${right.id}`

  return {
    type: 'component',
    optimized: true,
    concatenationType: 'minimal',
    id: concatenatedId,

    render: (() => {
      // Create a single container element
      const domNode: DOMNode = {
        type: 'element',
        tag: 'span',
        props: { className: 'tachui-concat-minimal' },
        children: [],
      }

      // Render both components and add to children
      const leftElement = left.render()
      const rightElement = right.render()

      const children: DOMNode[] = []
      if (Array.isArray(leftElement)) {
        children.push(...leftElement)
      } else {
        children.push(leftElement)
      }

      if (Array.isArray(rightElement)) {
        children.push(...rightElement)
      } else {
        children.push(rightElement)
      }

      domNode.children = children
      return domNode
    }) as RenderFunction,

    props: {
      // Merge props from both components (simplified)
      ...left.props,
      ...right.props,
    },

    cleanup: [
      () => {
        // Cleanup both components
        left.cleanup?.forEach(fn => fn())
        right.cleanup?.forEach(fn => fn())
      },
    ] as LifecycleCleanup[],
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
