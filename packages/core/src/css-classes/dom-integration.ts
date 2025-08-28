/**
 * CSS Classes Enhancement - DOM Integration
 * 
 * Enhanced DOM node types and utilities for CSS class integration
 */

import type { Signal } from '../reactive/types'
import type { DOMNode } from '../runtime/types'

/**
 * Enhanced DOM node with CSS class support
 */
export interface DOMNodeWithClasses extends DOMNode {
  cssClasses?: string[]
  reactiveClasses?: Signal<string>
}

/**
 * CSS class application utilities for DOM elements
 */
export interface CSSClassDOMApplicator {
  /**
   * Apply CSS classes to a DOM element
   */
  applyCSSClasses(element: Element, classes: string[] | string): void
  
  /**
   * Apply reactive CSS classes to a DOM element
   */
  applyReactiveCSSClasses(element: Element, classSignal: Signal<string>): (() => void)
  
  /**
   * Update CSS classes on an existing element
   */
  updateCSSClasses(element: Element, newClasses: string[] | string): void
  
  /**
   * Remove CSS classes from an element
   */
  removeCSSClasses(element: Element, classes: string[] | string): void
}

/**
 * DOM CSS class applicator implementation
 */
export class DOMCSSClassApplicator implements CSSClassDOMApplicator {
  /**
   * Apply CSS classes to a DOM element
   */
  applyCSSClasses(element: Element, classes: string[] | string): void {
    if (!classes) return
    
    const classArray = Array.isArray(classes) ? classes : [classes]
    const validClasses = classArray.filter(Boolean)
    
    if (validClasses.length > 0) {
      element.className = validClasses.join(' ')
    }
  }

  /**
   * Apply reactive CSS classes to a DOM element
   */
  applyReactiveCSSClasses(element: Element, classSignal: Signal<string>): (() => void) {
    // Import createEffect dynamically to avoid circular dependencies
    const createEffect = require('../reactive').createEffect
    
    // Create effect to update classes when signal changes
    const dispose = createEffect(() => {
      const classString = classSignal()
      element.className = classString
    })
    
    return dispose
  }

  /**
   * Update CSS classes on an existing element
   */
  updateCSSClasses(element: Element, newClasses: string[] | string): void {
    this.applyCSSClasses(element, newClasses)
  }

  /**
   * Remove CSS classes from an element
   */
  removeCSSClasses(element: Element, classes: string[] | string): void {
    if (!classes) return
    
    const classArray = Array.isArray(classes) ? classes : [classes]
    const currentClasses = element.className.split(' ')
    const filteredClasses = currentClasses.filter(cls => !classArray.includes(cls))
    
    element.className = filteredClasses.join(' ')
  }

  /**
   * Merge CSS classes with existing classes on an element
   */
  mergeCSSClasses(element: Element, newClasses: string[] | string): void {
    if (!newClasses) return
    
    const classArray = Array.isArray(newClasses) ? newClasses : [newClasses]
    const currentClasses = element.className ? element.className.split(' ') : []
    const mergedClasses = [...currentClasses, ...classArray.filter(Boolean)]
    
    // Deduplicate classes
    const uniqueClasses = [...new Set(mergedClasses)]
    element.className = uniqueClasses.join(' ')
  }
}

/**
 * Global DOM CSS class applicator instance
 */
export const domCSSClassApplicator = new DOMCSSClassApplicator()

/**
 * Helper function to create DOM nodes with CSS classes
 */
export function createDOMNodeWithClasses(
  tag: string,
  props: Record<string, any> = {},
  children: DOMNode[] = [],
  cssClasses?: string[] | Signal<string>
): DOMNodeWithClasses {
  const baseNode: DOMNode = {
    type: 'element',
    tag,
    props,
    children
  }

  const enhancedNode: DOMNodeWithClasses = {
    ...baseNode
  }

  // Add CSS class support
  if (cssClasses) {
    if (Array.isArray(cssClasses)) {
      enhancedNode.cssClasses = cssClasses
    } else {
      // Assume it's a signal
      enhancedNode.reactiveClasses = cssClasses as Signal<string>
    }
  }

  return enhancedNode
}

/**
 * Utility to extract CSS classes from a DOMNodeWithClasses
 */
export function extractCSSClasses(node: DOMNodeWithClasses): {
  static: string[]
  reactive: Signal<string> | undefined
} {
  return {
    static: node.cssClasses || [],
    reactive: node.reactiveClasses
  }
}