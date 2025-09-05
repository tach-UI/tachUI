/**
 * ARIA Runtime Concatenation (Phase 2)
 * Mid-level concatenation with essential accessibility support
 * Includes ARIA labels and roles, but not full semantic analysis
 */

import type { ComponentInstance } from './types'

export interface ARIAConcatenationResult extends ComponentInstance {
  type: 'component'
  optimized: true
  concatenationType: 'aria'
}

/**
 * Creates an optimized concatenation with ARIA accessibility support
 */
export function createOptimizedConcatenation(
  left: ComponentInstance,
  right: ComponentInstance,
  level: 'aria'
): ARIAConcatenationResult {
  const concatenatedId = `concat_aria_${left.id}_${right.id}`

  return {
    type: 'component',
    optimized: true,
    concatenationType: 'aria',
    id: concatenatedId,

    render: () => {
      // Create container with basic ARIA support
      const container = document.createElement('span')
      container.className = 'tachui-concat-aria'

      // Add basic ARIA attributes
      container.setAttribute('role', 'group')
      container.setAttribute('aria-label', 'Combined content')

      // Render components with accessibility context
      const leftElement = left.render()
      const rightElement = right.render()

      // Wrap each component if it needs individual ARIA context
      const leftWrapper = wrapWithARIAIfNeeded(leftElement, left)
      const rightWrapper = wrapWithARIAIfNeeded(rightElement, right)

      container.appendChild(leftWrapper)
      container.appendChild(rightWrapper)

      return container
    },

    props: {
      // Merge props with ARIA considerations
      ...left.props,
      ...right.props,
      'aria-expanded': undefined, // Reset conflicting ARIA props
      'aria-selected': undefined,
    },

    cleanup: () => {
      left.cleanup?.forEach(fn => fn())
      right.cleanup?.forEach(fn => fn())
    },
  }
}

/**
 * Wraps an element with ARIA context if the component needs it
 */
function wrapWithARIAIfNeeded(
  element: Element | Element[],
  component: ComponentInstance
): Element {
  const needsWrapper = hasInteractiveProps(component.props)

  if (!needsWrapper) {
    return Array.isArray(element) ? element[0] : element
  }

  // Create wrapper with appropriate ARIA role
  const wrapper = document.createElement('div')
  wrapper.setAttribute('role', getARIARoleForComponent(component))

  if (Array.isArray(element)) {
    element.forEach(el => wrapper.appendChild(el))
  } else {
    wrapper.appendChild(element)
  }

  return wrapper
}

/**
 * Determines if component props suggest interactive behavior
 */
function hasInteractiveProps(props: any): boolean {
  return !!(
    props?.onClick ||
    props?.onTap ||
    props?.href ||
    props?.disabled !== undefined ||
    props?.selected !== undefined
  )
}

/**
 * Gets appropriate ARIA role based on component type and props
 */
function getARIARoleForComponent(component: ComponentInstance): string {
  const props = component.props

  if (props?.href) return 'link'
  if (props?.onClick || props?.onTap) return 'button'
  if (props?.selected !== undefined) return 'option'

  return 'text'
}

/**
 * Analyzes accessibility requirements for concatenation
 */
export function analyzeAccessibilityRequirements(
  left: ComponentInstance,
  right: ComponentInstance
): {
  needsGroupRole: boolean
  needsLabeling: boolean
  conflictingRoles: boolean
} {
  const leftInteractive = hasInteractiveProps(left.props)
  const rightInteractive = hasInteractiveProps(right.props)

  return {
    needsGroupRole: leftInteractive || rightInteractive,
    needsLabeling: leftInteractive && rightInteractive,
    conflictingRoles:
      leftInteractive &&
      rightInteractive &&
      getARIARoleForComponent(left) !== getARIARoleForComponent(right),
  }
}
