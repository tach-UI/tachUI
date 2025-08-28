/**
 * Responsive Modifier Implementation
 * 
 * Core responsive modifier that integrates with the existing tachUI modifier system.
 * Provides CSS-native media query generation with backward compatibility.
 */

import { BaseModifier } from '../base'
import type { ModifierContext } from '../types'
import type { DOMNode } from '../../runtime/types'
import {
  ResponsiveValue,
  ResponsiveStyleConfig,
  ResponsiveModifierResult,
  isResponsiveValue,
  BreakpointKey
} from './types'
import { ResponsiveCSSGenerator, CSSInjector } from './css-generator'
import { ResponsivePerformanceMonitor } from './performance'
import { createEffect, isSignal, isComputed } from '../../reactive'
import { getThemeSignal } from '../../reactive/theme'

/**
 * Responsive modifier priority (between appearance and interaction)
 */
export const RESPONSIVE_MODIFIER_PRIORITY = 250

/**
 * Core responsive modifier class
 */
export class ResponsiveModifier extends BaseModifier<ResponsiveStyleConfig> {
  readonly type = 'responsive'
  readonly priority = RESPONSIVE_MODIFIER_PRIORITY
  private generatedCSS: ResponsiveModifierResult | null = null
  private elementSelector: string = ''
  private _config: ResponsiveStyleConfig
  
  constructor(config: ResponsiveStyleConfig) {
    super(config)
    this._config = config
  }
  
  get config(): ResponsiveStyleConfig {
    return this._config
  }
  
  /**
   * Apply responsive styles to the element
   */
  apply(node: DOMNode, _context: ModifierContext): DOMNode | undefined {
    const element = node.element
    
    if (!element || !(element instanceof HTMLElement)) {
      return undefined
    }
    
    // Generate unique selector for this element
    this.elementSelector = this.generateUniqueSelector(element)
    element.classList.add(this.getClassFromSelector(this.elementSelector))
    
    // Generate responsive CSS
    this.generateAndInjectCSS()
    
    // Set up reactive updates for dynamic responsive values
    this.setupReactiveUpdates()
    
    return undefined // No DOM modifications needed
  }
  
  /**
   * Generate and inject responsive CSS
   */
  private generateAndInjectCSS(): void {
    const endMeasurement = ResponsivePerformanceMonitor.startMeasurement('css-generation')
    
    try {
      // Always use immediate CSS generation for responsive modifiers
      // Batching can cause FOUC and layout issues when components need responsive styles immediately
      const generator = new ResponsiveCSSGenerator({
        selector: this.elementSelector,
        generateMinified: process.env.NODE_ENV === 'production',
        includeComments: process.env.NODE_ENV !== 'production',
        optimizeOutput: true
      })
      
      this.generatedCSS = generator.generateResponsiveCSS(this.config)
      
      // Inject CSS rules into the document immediately
      if (this.generatedCSS.cssRules.length > 0) {
        CSSInjector.injectCSS(this.generatedCSS.cssRules)
      }
    } finally {
      endMeasurement()
    }
  }
  
  /**
   * Set up reactive updates for dynamic responsive values
   */
  private setupReactiveUpdates(): void {
    // Check if any values are reactive signals
    const hasReactiveValues = this.hasReactiveValues(this.config)
    
    if (hasReactiveValues) {
      // Create reactive effect to regenerate CSS when values change
      createEffect(() => {
        // Track all reactive dependencies by accessing them
        this.trackReactiveDependencies(this.config)
        
        // Re-evaluate config with current signal values
        const currentConfig = this.resolveReactiveConfig(this.config)
        
        // Update CSS if config changed
        this.updateConfig(currentConfig)
      })
    }
  }
  
  /**
   * Track reactive dependencies by accessing all reactive values
   */
  private trackReactiveDependencies(config: ResponsiveStyleConfig): void {
    // Track theme signal for any Assets that might be present
    let hasAssets = false
    
    for (const [_key, value] of Object.entries(config)) {
      if (this.isReactiveValue(value)) {
        if (isSignal(value) || isComputed(value)) {
          value() // Access to establish dependency tracking
        } else if (this.isAsset(value)) {
          hasAssets = true
          value.resolve() // Access to establish theme dependency tracking
        }
      } else if (isResponsiveValue(value)) {
        for (const [_breakpoint, breakpointValue] of Object.entries(value)) {
          if (this.isReactiveValue(breakpointValue)) {
            if (isSignal(breakpointValue) || isComputed(breakpointValue)) {
              breakpointValue() // Access to establish dependency tracking
            } else if (this.isAsset(breakpointValue)) {
              hasAssets = true
              breakpointValue.resolve() // Access to establish theme dependency tracking
            }
          }
        }
      }
    }
    
    // If we have Assets, explicitly track the theme signal to ensure theme changes trigger updates
    if (hasAssets) {
      const themeSignal = getThemeSignal()
      themeSignal() // Access theme signal to establish dependency
    }
  }
  
  /**
   * Update configuration and regenerate CSS
   */
  private updateConfig(newConfig: ResponsiveStyleConfig): void {
    this._config = newConfig
    
    // Clear old CSS rules (if we had a way to track them individually)
    // For now, we'll rely on CSS override behavior
    
    // Generate new CSS
    this.generateAndInjectCSS()
  }
  
  /**
   * Generate unique CSS selector for this element
   */
  private generateUniqueSelector(_element: HTMLElement): string {
    const uniqueId = this.generateUniqueId()
    const className = `tachui-responsive-${uniqueId}`
    return `.${className}`
  }
  
  /**
   * Extract class name from CSS selector
   */
  private getClassFromSelector(selector: string): string {
    return selector.replace(/^\./, '') // Remove leading dot
  }
  
  /**
   * Generate unique ID for CSS class names
   */
  private generateUniqueId(): string {
    return Math.random().toString(36).substr(2, 9)
  }
  
  /**
   * Check if configuration contains reactive values (signals)
   */
  private hasReactiveValues(config: ResponsiveStyleConfig): boolean {
    for (const value of Object.values(config)) {
      if (this.isReactiveValue(value)) {
        return true
      }
      
      if (isResponsiveValue(value)) {
        for (const breakpointValue of Object.values(value)) {
          if (this.isReactiveValue(breakpointValue)) {
            return true
          }
        }
      }
    }
    
    return false
  }
  
  /**
   * Check if a value is a reactive signal, computed, or Asset
   */
  private isReactiveValue(value: any): boolean {
    // Check for TachUI signals and computed values
    if (isSignal(value) || isComputed(value)) {
      return true
    }
    
    // Check for Assets (have a resolve method and are theme-reactive)
    if (this.isAsset(value)) {
      return true
    }
    
    return false
  }
  
  /**
   * Check if a value is an Asset object
   */
  private isAsset(value: any): boolean {
    return (
      value !== null &&
      value !== undefined &&
      typeof value === 'object' &&
      'resolve' in value &&
      typeof value.resolve === 'function'
    )
  }
  
  /**
   * Resolve configuration with current signal values
   */
  private resolveReactiveConfig(config: ResponsiveStyleConfig): ResponsiveStyleConfig {
    const resolved: ResponsiveStyleConfig = {}
    
    for (const [key, value] of Object.entries(config)) {
      if (this.isReactiveValue(value)) {
        // Handle different types of reactive values
        if (isSignal(value) || isComputed(value)) {
          resolved[key] = value() // Call signal/computed to get current value
        } else if (this.isAsset(value)) {
          resolved[key] = value.resolve() // Resolve Asset to current theme value
        }
      } else if (isResponsiveValue(value)) {
        const resolvedBreakpoints: Partial<Record<BreakpointKey, any>> = {}
        
        for (const [breakpoint, breakpointValue] of Object.entries(value)) {
          if (this.isReactiveValue(breakpointValue)) {
            // Handle different types of reactive values at breakpoint level
            if (isSignal(breakpointValue) || isComputed(breakpointValue)) {
              resolvedBreakpoints[breakpoint as BreakpointKey] = breakpointValue()
            } else if (this.isAsset(breakpointValue)) {
              resolvedBreakpoints[breakpoint as BreakpointKey] = breakpointValue.resolve()
            }
          } else {
            resolvedBreakpoints[breakpoint as BreakpointKey] = breakpointValue
          }
        }
        
        resolved[key] = resolvedBreakpoints
      } else {
        resolved[key] = value
      }
    }
    
    return resolved
  }
  
  /**
   * Get generated CSS information (for debugging)
   */
  getGeneratedCSS(): ResponsiveModifierResult | null {
    return this.generatedCSS
  }
  
  /**
   * Get configuration (for debugging)
   */
  getConfig(): ResponsiveStyleConfig {
    return this.config
  }
}

/**
 * Factory function to create responsive modifiers
 */
export function createResponsiveModifier(config: ResponsiveStyleConfig): ResponsiveModifier {
  return new ResponsiveModifier(config)
}

/**
 * Media query modifier for custom media queries
 */
export class MediaQueryModifier extends BaseModifier<{ query: string; styles: Record<string, any> }> {
  readonly type = 'media-query'
  readonly priority = RESPONSIVE_MODIFIER_PRIORITY + 1 // Slightly higher than responsive
  private elementSelector: string = ''
  
  constructor(query: string, styles: Record<string, any>) {
    super({ query, styles })
  }
  
  get query(): string {
    return this.properties.query
  }
  
  get styles(): Record<string, any> {
    return this.properties.styles
  }
  
  apply(node: DOMNode, _context: ModifierContext): DOMNode | undefined {
    const element = node.element
    
    if (!element || !(element instanceof HTMLElement)) {
      return undefined
    }
    
    // Generate unique selector
    this.elementSelector = this.generateUniqueSelector(element)
    element.classList.add(this.getClassFromSelector(this.elementSelector))
    
    // Generate and inject media query CSS
    this.generateMediaQueryCSS()
    
    return undefined
  }
  
  private generateMediaQueryCSS(): void {
    const { generateMinified = process.env.NODE_ENV === 'production' } = {}
    const indent = generateMinified ? '' : '  '
    const doubleIndent = generateMinified ? '' : '    '
    const newline = generateMinified ? '' : '\n'
    const space = generateMinified ? '' : ' '
    
    let rule = `@media ${this.query}${space}{${newline}`
    rule += `${indent}${this.elementSelector}${space}{${newline}`
    
    for (const [property, value] of Object.entries(this.styles)) {
      const cssProperty = property.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)
      const cssValue = typeof value === 'number' ? `${value}px` : value.toString()
      rule += `${doubleIndent}${cssProperty}:${space}${cssValue};${newline}`
    }
    
    rule += `${indent}}${newline}`
    rule += `}${newline}`
    
    CSSInjector.injectCSS([rule])
  }
  
  private generateUniqueSelector(_element: HTMLElement): string {
    const uniqueId = Math.random().toString(36).substr(2, 9)
    const className = `tachui-mq-${uniqueId}`
    return `.${className}`
  }
  
  private getClassFromSelector(selector: string): string {
    return selector.replace(/^\./, '')
  }
}

/**
 * Factory function to create media query modifiers
 */
export function createMediaQueryModifier(query: string, styles: Record<string, any>): MediaQueryModifier {
  return new MediaQueryModifier(query, styles)
}

/**
 * Utility to create responsive property modifier
 */
export function createResponsivePropertyModifier<T>(
  property: string, 
  value: ResponsiveValue<T>
): ResponsiveModifier {
  const config = { [property]: value } as ResponsiveStyleConfig
  return new ResponsiveModifier(config)
}

/**
 * Create a responsive layout modifier
 */
export function createResponsiveLayoutModifier(config: {
  direction?: ResponsiveValue<'row' | 'column' | 'row-reverse' | 'column-reverse'>
  wrap?: ResponsiveValue<'nowrap' | 'wrap' | 'wrap-reverse'>
  justify?: ResponsiveValue<'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'>
  align?: ResponsiveValue<'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'>
  gap?: ResponsiveValue<number | string>
}): ResponsiveModifier {
  const styleConfig: ResponsiveStyleConfig = {}
  
  if (config.direction) styleConfig.flexDirection = config.direction
  if (config.wrap) styleConfig.flexWrap = config.wrap
  if (config.justify) styleConfig.justifyContent = config.justify
  if (config.align) styleConfig.alignItems = config.align
  if (config.gap) styleConfig.gap = config.gap
  
  return new ResponsiveModifier(styleConfig)
}