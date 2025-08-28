/**
 * CSS Classes Enhancement - Component Base
 * 
 * Base class for components that support CSS class integration.
 * Provides utilities for processing and applying CSS classes.
 */

import { createComputed, isSignal, isComputed } from '../reactive'
import type { Signal } from '../reactive/types'
import { cssClassManager } from './css-class-manager'
import type { CSSClassesProps } from './types'

/**
 * Base class for components with CSS class support
 */
export abstract class ComponentWithCSSClasses {
  protected cssClassManager = cssClassManager

  /**
   * Process CSS classes from props and integrate with component classes
   */
  protected processComponentClasses(
    props: CSSClassesProps, 
    baseClasses: string[] = []
  ): string[] {
    if (!props.css) {
      return baseClasses
    }

    const userClasses = this.cssClassManager.processClasses(props.css)
    return this.cssClassManager.combineClasses(baseClasses, userClasses)
  }

  /**
   * Create class string for DOM nodes - handles both static and reactive classes
   */
  protected createClassString(
    props: CSSClassesProps,
    baseClasses: string[] = []
  ): Signal<string> | string {
    // If css is reactive, create reactive class string
    if (props.css && (isSignal(props.css) || isComputed(props.css))) {
      return createComputed(() => {
        const processedClasses = this.processComponentClasses(props, baseClasses)
        return processedClasses.join(' ')
      })
    }

    // Static class processing
    const processedClasses = this.processComponentClasses(props, baseClasses)
    return processedClasses.join(' ')
  }

  /**
   * Create class array for components that need array format
   */
  protected createClassArray(
    props: CSSClassesProps,
    baseClasses: string[] = []
  ): Signal<string[]> | string[] {
    // If css is reactive, create reactive class array
    if (props.css && isSignal(props.css)) {
      return createComputed(() => {
        return this.processComponentClasses(props, baseClasses)
      })
    }

    // Static class processing
    return this.processComponentClasses(props, baseClasses)
  }

  /**
   * Validate CSS classes for development warnings
   */
  protected validateCSSClasses(props: CSSClassesProps): void {
    if (process.env.NODE_ENV !== 'development' || !props.css) {
      return
    }

    // Validate that css is the right type
    const classes = props.css
    const isValidType = typeof classes === 'string' || 
                       Array.isArray(classes) || 
                       isSignal(classes)

    if (!isValidType) {
      console.warn('[tachUI] css must be a string, array of strings, or signal. Got:', typeof classes)
    }

    // Validate array contents if it's an array
    if (Array.isArray(classes)) {
      const invalidItems = classes.filter(item => typeof item !== 'string')
      if (invalidItems.length > 0) {
        console.warn('[tachUI] All items in css array must be strings. Invalid items:', invalidItems)
      }
    }
  }

  /**
   * Get debug information about processed classes
   */
  protected getClassDebugInfo(
    props: CSSClassesProps,
    baseClasses: string[] = []
  ): { base: string[], user: string[], processed: string[], final: string } {
    const userClasses = props.css ? 
      this.cssClassManager.processClasses(props.css) : []
    const processedClasses = this.processComponentClasses(props, baseClasses)
    
    return {
      base: baseClasses,
      user: userClasses,
      processed: processedClasses,
      final: processedClasses.join(' ')
    }
  }
}