/**
 * Responsive CSS Generation Engine
 * 
 * Generates optimized CSS media queries from responsive modifier configurations.
 * Supports mobile-first design patterns and advanced media query features.
 */

import {
  BreakpointKey,
  ResponsiveValue,
  ResponsiveStyleConfig,
  MediaQueryConfig,
  GeneratedMediaQuery,
  ResponsiveModifierResult,
  isResponsiveValue
} from './types'
import {
  generateMediaQuery,
  getCurrentBreakpointConfig,
  getSortedBreakpoints
} from './breakpoints'

/**
 * CSS generation options
 */
export interface CSSGenerationOptions {
  selector: string              // CSS selector for the element
  generateMinified?: boolean    // Generate minified CSS
  includeComments?: boolean     // Include helpful comments
  optimizeOutput?: boolean      // Optimize and deduplicate CSS
  mobileFirst?: boolean         // Use mobile-first approach (default: true)
}

/**
 * Main CSS generation class
 */
export class ResponsiveCSSGenerator {
  private options: Required<CSSGenerationOptions>
  
  constructor(options: CSSGenerationOptions) {
    this.options = {
      generateMinified: false,
      includeComments: true,
      optimizeOutput: true,
      mobileFirst: true,
      ...options
    }
  }
  
  /**
   * Generate complete responsive CSS from a style configuration
   */
  generateResponsiveCSS(config: ResponsiveStyleConfig): ResponsiveModifierResult {
    const mediaQueries: GeneratedMediaQuery[] = []
    const cssRules: string[] = []
    const fallbackStyles: Record<string, string | number> = {}
    let hasResponsiveStyles = false
    
    // Process each property in the configuration
    for (const [property, value] of Object.entries(config)) {
      if (isResponsiveValue(value)) {
        hasResponsiveStyles = true
        const result = this.generatePropertyMediaQueries(property, value)
        mediaQueries.push(...result.mediaQueries)
        
        // Add base styles to fallback
        if (result.baseStyles) {
          Object.assign(fallbackStyles, result.baseStyles)
        }
      } else {
        // Non-responsive property - add to fallback styles
        fallbackStyles[this.toCSSPropertyName(property)] = this.formatCSSValue(property, value)
      }
    }
    
    // Generate CSS rules from media queries
    cssRules.push(...this.generateCSSRules(mediaQueries, fallbackStyles))
    
    return {
      cssRules,
      mediaQueries,
      fallbackStyles,
      hasResponsiveStyles
    }
  }
  
  /**
   * Generate media queries for a single property
   */
  private generatePropertyMediaQueries(
    property: string, 
    value: Partial<Record<BreakpointKey, any>>
  ): { mediaQueries: GeneratedMediaQuery[]; baseStyles?: Record<string, string | number> } {
    const mediaQueries: GeneratedMediaQuery[] = []
    const baseStyles: Record<string, string | number> = {}
    const sortedBreakpoints = getSortedBreakpoints()
    
    for (const breakpoint of sortedBreakpoints) {
      const breakpointValue = value[breakpoint]
      if (breakpointValue === undefined) continue
      
      const cssProperty = this.toCSSPropertyName(property)
      const cssValue = this.formatCSSValue(property, breakpointValue)
      
      if (breakpoint === 'base') {
        // Base styles (no media query needed for mobile-first)
        baseStyles[cssProperty] = cssValue
      } else {
        // Generate media query for this breakpoint
        const query = generateMediaQuery(breakpoint)
        const styles = { [cssProperty]: cssValue }
        
        mediaQueries.push({
          breakpoint,
          query,
          styles,
          selector: this.options.selector
        })
      }
    }
    
    return { mediaQueries, baseStyles: Object.keys(baseStyles).length > 0 ? baseStyles : undefined }
  }
  
  /**
   * Generate CSS rules from media queries and base styles
   */
  private generateCSSRules(
    mediaQueries: GeneratedMediaQuery[], 
    baseStyles: Record<string, string | number>
  ): string[] {
    const rules: string[] = []
    
    // Generate base styles rule (mobile-first)
    if (Object.keys(baseStyles).length > 0) {
      const baseRule = this.generateCSSRule(this.options.selector, baseStyles)
      rules.push(baseRule)
    }
    
    // Generate media query rules
    const groupedQueries = this.groupQueriesByMediaQuery(mediaQueries)
    
    for (const [query, queryMediaQueries] of Object.entries(groupedQueries)) {
      if (query === '') continue // Skip empty queries (base styles)
      
      // Combine all styles for this media query
      const combinedStyles: Record<string, string | number> = {}
      for (const mq of queryMediaQueries) {
        Object.assign(combinedStyles, mq.styles)
      }
      
      const mediaRule = this.generateMediaQueryRule(query, this.options.selector, combinedStyles)
      rules.push(mediaRule)
    }
    
    return rules
  }
  
  /**
   * Group media queries by their query string for optimization
   */
  private groupQueriesByMediaQuery(mediaQueries: GeneratedMediaQuery[]): Record<string, GeneratedMediaQuery[]> {
    const grouped: Record<string, GeneratedMediaQuery[]> = {}
    
    for (const mq of mediaQueries) {
      if (!grouped[mq.query]) {
        grouped[mq.query] = []
      }
      grouped[mq.query].push(mq)
    }
    
    return grouped
  }
  
  /**
   * Generate a single CSS rule
   */
  private generateCSSRule(selector: string, styles: Record<string, string | number>): string {
    const { generateMinified, includeComments } = this.options
    const indent = generateMinified ? '' : '  '
    const newline = generateMinified ? '' : '\n'
    const space = generateMinified ? '' : ' '
    
    let rule = `${selector}${space}{${newline}`
    
    for (const [property, value] of Object.entries(styles)) {
      rule += `${indent}${property}:${space}${value};${newline}`
    }
    
    rule += `}${newline}`
    
    if (includeComments && !generateMinified) {
      rule = `/* Base styles (mobile-first) */${newline}${rule}`
    }
    
    return rule
  }
  
  /**
   * Generate a CSS media query rule
   */
  private generateMediaQueryRule(
    query: string, 
    selector: string, 
    styles: Record<string, string | number>
  ): string {
    const { generateMinified, includeComments } = this.options
    const indent = generateMinified ? '' : '  '
    const doubleIndent = generateMinified ? '' : '    '
    const newline = generateMinified ? '' : '\n'
    const space = generateMinified ? '' : ' '
    
    let rule = `@media ${query}${space}{${newline}`
    rule += `${indent}${selector}${space}{${newline}`
    
    for (const [property, value] of Object.entries(styles)) {
      rule += `${doubleIndent}${property}:${space}${value};${newline}`
    }
    
    rule += `${indent}}${newline}`
    rule += `}${newline}`
    
    if (includeComments && !generateMinified) {
      const breakpoint = this.getBreakpointFromQuery(query)
      rule = `/* ${breakpoint} styles */${newline}${rule}`
    }
    
    return rule
  }
  
  /**
   * Convert camelCase property to CSS kebab-case
   */
  private toCSSProperty(property: string): string {
    return property.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)
  }
  
  /**
   * Format CSS value with appropriate units and validation
   */
  private formatCSSValue(property: string, value: any): string {
    if (value === null || value === undefined) {
      return 'inherit'
    }
    
    // Handle numeric values that need units
    if (typeof value === 'number') {
      const unitlessProperties = [
        'opacity', 'z-index', 'font-weight', 'line-height', 
        'flex-grow', 'flex-shrink', 'order', 'grid-column-start',
        'grid-column-end', 'grid-row-start', 'grid-row-end'
      ]
      
      const cssProperty = this.toCSSProperty(property)
      if (unitlessProperties.includes(cssProperty)) {
        return this.addImportantIfNeeded(property, value.toString())
      }
      
      // Add px unit for dimension properties
      const dimensionProperties = [
        'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
        'padding', 'margin', 'border-width', 'border-radius', 'top', 'right', 
        'bottom', 'left', 'font-size', 'letter-spacing', 'text-indent'
      ]
      
      if (dimensionProperties.some(prop => cssProperty.includes(prop))) {
        return this.addImportantIfNeeded(property, `${value}px`)
      }
    }
    
    return this.addImportantIfNeeded(property, value.toString())
  }

  /**
   * Add !important for properties that need to override base component styles
   */
  private addImportantIfNeeded(property: string, value: string): string {
    const conflictingProperties = [
      'flexDirection', 'flex-direction',
      'justifyContent', 'justify-content', 
      'alignItems', 'align-items',
      'display'
    ]
    
    const cssProperty = this.toCSSProperty(property)
    if (conflictingProperties.includes(property) || conflictingProperties.includes(cssProperty)) {
      return `${value} !important`
    }
    
    return value
  }

  /**
   * Convert property name to appropriate CSS property (including custom properties)
   */
  private toCSSPropertyName(property: string): string {
    return this.toCSSProperty(property)
  }
  
  /**
   * Extract breakpoint name from media query for comments
   */
  private getBreakpointFromQuery(query: string): string {
    const breakpointConfig = getCurrentBreakpointConfig()
    
    for (const [breakpoint, value] of Object.entries(breakpointConfig)) {
      if (query.includes(value)) {
        return breakpoint
      }
    }
    
    return 'custom'
  }
}

/**
 * Utility function to generate responsive CSS for a single property
 */
export function generateResponsiveProperty(
  selector: string,
  property: string,
  value: ResponsiveValue<any>,
  options?: Partial<CSSGenerationOptions>
): string[] {
  if (!isResponsiveValue(value)) {
    // Non-responsive value - return simple CSS rule
    const cssProperty = property.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)
    const cssValue = typeof value === 'number' ? `${value}px` : value.toString()
    return [`${selector} { ${cssProperty}: ${cssValue}; }`]
  }
  
  const generator = new ResponsiveCSSGenerator({ selector, ...options })
  const config = { [property]: value }
  const result = generator.generateResponsiveCSS(config)
  
  return result.cssRules
}

/**
 * Utility function to generate media query for custom conditions
 */
export function generateCustomMediaQuery(
  selector: string,
  mediaQueryConfig: MediaQueryConfig,
  options?: Partial<CSSGenerationOptions>
): string {
  const { generateMinified = false } = options || {}
  const indent = generateMinified ? '' : '  '
  const newline = generateMinified ? '' : '\n'
  const space = generateMinified ? '' : ' '
  
  let rule = `@media ${mediaQueryConfig.query}${space}{${newline}`
  rule += `${indent}${selector}${space}{${newline}`
  
  for (const [property, value] of Object.entries(mediaQueryConfig.styles)) {
    const cssProperty = property.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)
    const cssValue = typeof value === 'number' ? `${value}px` : value.toString()
    rule += `${indent}${indent}${cssProperty}:${space}${cssValue};${newline}`
  }
  
  rule += `${indent}}${newline}`
  rule += `}${newline}`
  
  return rule
}

/**
 * CSS injection utilities for runtime application
 */
export class CSSInjector {
  private static styleSheet: CSSStyleSheet | null = null
  private static injectedRules = new Set<string>()
  
  /**
   * Get or create the tachUI responsive stylesheet
   */
  private static getStyleSheet(): CSSStyleSheet {
    if (this.styleSheet) {
      return this.styleSheet
    }
    
    const style = document.createElement('style')
    style.setAttribute('data-tachui-responsive', 'true')
    document.head.appendChild(style)
    
    this.styleSheet = style.sheet as CSSStyleSheet
    return this.styleSheet
  }

  /**
   * Inject CSS rules into the document
   */
  static injectCSS(rules: string[]): void {
    if (typeof document === 'undefined') {
      return // Skip on server-side
    }
    
    const styleSheet = this.getStyleSheet()
    
    for (const rule of rules) {
      if (this.injectedRules.has(rule)) {
        continue // Skip duplicate rules
      }
      
      try {
        styleSheet.insertRule(rule, styleSheet.cssRules.length)
        this.injectedRules.add(rule)
      } catch (error) {
        console.warn('Failed to inject CSS rule:', rule, error)
      }
    }
  }
  
  /**
   * Clear all injected responsive CSS
   */
  static clearCSS(): void {
    if (this.styleSheet) {
      while (this.styleSheet.cssRules.length > 0) {
        this.styleSheet.deleteRule(0)
      }
      this.injectedRules.clear()
    }
  }
  
  /**
   * Check if a rule has been injected
   */
  static hasRule(rule: string): boolean {
    return this.injectedRules.has(rule)
  }
}