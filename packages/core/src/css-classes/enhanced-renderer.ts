/**
 * CSS Classes Enhancement - Enhanced Renderer
 * 
 * Enhanced DOM renderer that supports CSS class integration
 * while maintaining compatibility with existing functionality.
 */

import { createEffect, isSignal } from '../reactive'
import type { Signal } from '../reactive/types'
import type { DOMNode } from '../runtime/types'
import type { DOMNodeWithClasses } from './dom-integration'

/**
 * Enhanced renderer mixin for CSS class support
 * This can be mixed into the existing DirectDOMRenderer
 */
export interface CSSClassRendererMixin {
  /**
   * Apply CSS classes to an element during creation
   */
  applyCSSClasses(element: Element, node: DOMNodeWithClasses): void

  /**
   * Process className prop and CSS classes together
   */
  processElementClasses(element: Element, node: DOMNodeWithClasses): void
}

/**
 * CSS class renderer mixin implementation
 */
export const cssClassRendererMixin: CSSClassRendererMixin = {
  /**
   * Apply CSS classes to an element during creation
   */
  applyCSSClasses(element: Element, node: DOMNodeWithClasses): void {
    // Handle static CSS classes
    if (node.cssClasses && node.cssClasses.length > 0) {
      const classString = node.cssClasses.join(' ')
      element.className = classString
    }

    // Handle reactive CSS classes
    if (node.reactiveClasses) {
      if (isSignal(node.reactiveClasses)) {
        // Set initial value
        const initialClasses = node.reactiveClasses()
        element.className = initialClasses

        // Create reactive effect for updates
        createEffect(() => {
          const classString = node.reactiveClasses!()
          element.className = classString
        })
      }
    }
  },

  /**
   * Process className prop and CSS classes together
   */
  processElementClasses(element: Element, node: DOMNodeWithClasses): void {
    let finalClasses: string[] = []

    // Start with existing className prop if it exists
    if (node.props?.className) {
      const existingClasses = typeof node.props.className === 'string' 
        ? node.props.className.split(' ').filter(Boolean)
        : []
      finalClasses.push(...existingClasses)
    }

    // Add CSS classes from cssClasses property
    if (node.cssClasses) {
      finalClasses.push(...node.cssClasses)
    }

    // Deduplicate and apply classes
    if (finalClasses.length > 0) {
      const uniqueClasses = [...new Set(finalClasses)]
      element.className = uniqueClasses.join(' ')
    }

    // Handle reactive classes separately (they override static classes)
    if (node.reactiveClasses && isSignal(node.reactiveClasses)) {
      createEffect(() => {
        const reactiveClassString = node.reactiveClasses!()
        
        // Combine with static classes if needed
        if (finalClasses.length > 0) {
          const staticClassString = finalClasses.join(' ')
          element.className = `${staticClassString} ${reactiveClassString}`.trim()
        } else {
          element.className = reactiveClassString
        }
      })
    }
  }
}

/**
 * Function to enhance any renderer with CSS class support
 */
export function enhanceRendererWithCSSClasses<T extends { createElement: (node: DOMNode) => Element }>(
  renderer: T
): T & CSSClassRendererMixin {
  // Store original createElement method
  const originalCreateElement = renderer.createElement.bind(renderer)

  // Enhanced createElement that supports CSS classes
  const enhancedCreateElement = (node: DOMNode): Element => {
    // Call original createElement to create the element
    const element = originalCreateElement(node)

    // Check if this is a CSS-enhanced node
    const cssNode = node as DOMNodeWithClasses
    
    // Apply CSS classes if present
    if (cssNode.cssClasses || cssNode.reactiveClasses) {
      cssClassRendererMixin.processElementClasses(element, cssNode)
    }

    return element
  }

  // Replace createElement with enhanced version
  ;(renderer as any).createElement = enhancedCreateElement

  // Mix in CSS class methods
  return Object.assign(renderer, cssClassRendererMixin)
}

/**
 * Utility function to create a CSS class-aware DOM node
 */
export function createCSSClassDOMNode(
  tag: string,
  props: Record<string, any> = {},
  children: DOMNode[] = [],
  cssClasses?: string[] | Signal<string>
): DOMNodeWithClasses {
  const node: DOMNodeWithClasses = {
    type: 'element',
    tag,
    props,
    children
  }

  if (cssClasses) {
    if (Array.isArray(cssClasses)) {
      node.cssClasses = cssClasses
    } else {
      node.reactiveClasses = cssClasses
    }
  }

  return node
}

/**
 * Helper to check if a DOMNode has CSS class support
 */
export function hasCSSClassSupport(node: DOMNode): node is DOMNodeWithClasses {
  const cssNode = node as DOMNodeWithClasses
  return !!(cssNode.cssClasses || cssNode.reactiveClasses)
}