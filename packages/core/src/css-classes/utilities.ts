/**
 * CSS Classes Enhancement - Utilities
 * 
 * Utility functions for CSS class processing and common patterns.
 */

import { cssClassManager } from './css-class-manager'
import type { CSSClassesProps } from './types'

/**
 * Utility functions for CSS class operations
 */
export interface CSSClassUtilities {
  /**
   * Combine multiple class sources into a single class string
   */
  combineClasses(...sources: (string | string[] | undefined)[]): string

  /**
   * Create conditional classes based on boolean conditions
   */
  conditionalClasses(conditions: Record<string, boolean>): string[]

  /**
   * Merge CSS class props from multiple sources
   */
  mergeClassProps(...props: (CSSClassesProps | undefined)[]): CSSClassesProps

  /**
   * Extract unique classes from a class string
   */
  extractClasses(classString: string): string[]

  /**
   * Validate CSS class names
   */
  validateClassNames(classes: string[]): { valid: string[], invalid: string[] }
}

/**
 * Create CSS class utilities instance
 */
export function createCSSClassUtilities(): CSSClassUtilities {
  return {
    combineClasses(...sources: (string | string[] | undefined)[]): string {
      const allClasses: string[] = []
      
      sources.forEach(source => {
        if (source) {
          const processed = cssClassManager.processClasses(source)
          allClasses.push(...processed)
        }
      })
      
      return cssClassManager.deduplicateClasses(allClasses).join(' ')
    },

    conditionalClasses(conditions: Record<string, boolean>): string[] {
      return Object.entries(conditions)
        .filter(([_, condition]) => condition)
        .map(([className, _]) => className)
    },

    mergeClassProps(...props: (CSSClassesProps | undefined)[]): CSSClassesProps {
      const allClasses: string[] = []
      
      props.forEach(prop => {
        if (prop?.css) {
          const processed = cssClassManager.processClasses(prop.css)
          allClasses.push(...processed)
        }
      })
      
      if (allClasses.length === 0) {
        return {}
      }
      
      return {
        css: cssClassManager.deduplicateClasses(allClasses)
      }
    },

    extractClasses(classString: string): string[] {
      return cssClassManager.processClasses(classString)
    },

    validateClassNames(classes: string[]): { valid: string[], invalid: string[] } {
      const valid: string[] = []
      const invalid: string[] = []
      
      classes.forEach(className => {
        const sanitized = cssClassManager.sanitizeClassName(className)
        if (sanitized === className.toLowerCase()) {
          valid.push(className)
        } else {
          invalid.push(className)
        }
      })
      
      return { valid, invalid }
    }
  }
}

/**
 * Default CSS class utilities instance
 */
export const cssClassUtils = createCSSClassUtilities()

/**
 * Common CSS class patterns for popular frameworks
 */
export const CSSPatterns = {
  /**
   * Tailwind CSS utility patterns
   */
  tailwind: {
    flexCenter: 'flex items-center justify-center',
    flexBetween: 'flex items-center justify-between',
    absoluteCenter: 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
    srOnly: 'sr-only',
    card: 'bg-white rounded-lg shadow-md p-6',
    btn: {
      primary: 'bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors',
      secondary: 'bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors',
      outline: 'border border-blue-500 text-blue-500 hover:bg-blue-50 px-4 py-2 rounded transition-colors'
    }
  },

  /**
   * Bootstrap component patterns
   */
  bootstrap: {
    flexCenter: 'd-flex align-items-center justify-content-center',
    flexBetween: 'd-flex align-items-center justify-content-between',
    srOnly: 'visually-hidden',
    card: 'card',
    btn: {
      primary: 'btn btn-primary',
      secondary: 'btn btn-secondary',
      outline: 'btn btn-outline-primary'
    }
  }
}

/**
 * Framework-specific class builders
 */
export const FrameworkBuilders = {
  /**
   * Tailwind CSS class builder
   */
  tailwind: {
    spacing: (value: number) => `p-${value}`,
    margin: (value: number) => `m-${value}`,
    textSize: (size: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl') => `text-${size}`,
    backgroundColor: (color: string) => `bg-${color}`,
    textColor: (color: string) => `text-${color}`,
    rounded: (size: 'none' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | 'full' = 'base') => 
      size === 'base' ? 'rounded' : `rounded-${size}`
  },

  /**
   * Bootstrap class builder
   */
  bootstrap: {
    spacing: (value: 1 | 2 | 3 | 4 | 5) => `p-${value}`,
    margin: (value: 1 | 2 | 3 | 4 | 5) => `m-${value}`,
    textSize: (size: 1 | 2 | 3 | 4 | 5 | 6) => `h${size}`,
    backgroundColor: (color: string) => `bg-${color}`,
    textColor: (color: string) => `text-${color}`,
    rounded: (size: 0 | 1 | 2 | 3 | 'circle' | 'pill' = 1) => 
      typeof size === 'number' ? `rounded-${size}` : `rounded-${size}`
  }
}