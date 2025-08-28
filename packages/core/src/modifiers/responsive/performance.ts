/**
 * Responsive System Performance Optimizations
 * 
 * Optimizes CSS generation, caching, and runtime performance for the responsive system.
 */

import { ResponsiveStyleConfig, BreakpointKey } from './types'

/**
 * CSS rule cache for deduplication
 */
class CSSRuleCache {
  private cache = new Map<string, string>()
  private hitCount = 0
  private missCount = 0
  
  get(key: string): string | undefined {
    const result = this.cache.get(key)
    if (result) {
      this.hitCount++
    } else {
      this.missCount++
    }
    return result
  }
  
  set(key: string, value: string): void {
    this.cache.set(key, value)
  }
  
  clear(): void {
    this.cache.clear()
    this.hitCount = 0
    this.missCount = 0
  }
  
  getStats() {
    return {
      size: this.cache.size,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0,
      hits: this.hitCount,
      misses: this.missCount
    }
  }
}

/**
 * Global CSS rule cache instance
 */
export const cssRuleCache = new CSSRuleCache()

/**
 * Performance-optimized CSS generation
 */
export class OptimizedCSSGenerator {
  private static readonly BATCH_SIZE = 50
  private static ruleQueue: string[] = []
  private static flushTimer: number | null = null
  
  /**
   * Generate CSS with caching and batching
   */
  static generateOptimizedCSS(
    selector: string,
    config: ResponsiveStyleConfig,
    options: {
      minify?: boolean
      batch?: boolean
      deduplicate?: boolean
    } = {}
  ): string {
    const {
      minify = process.env.NODE_ENV === 'production',
      batch = true,
      deduplicate = true
    } = options
    
    // Create cache key
    const cacheKey = this.createCacheKey(selector, config, { minify })
    
    // Check cache first
    if (deduplicate) {
      const cached = cssRuleCache.get(cacheKey)
      if (cached) {
        return cached
      }
    }
    
    // Generate CSS
    const css = this.generateCSS(selector, config, { minify })
    
    // Cache result
    if (deduplicate) {
      cssRuleCache.set(cacheKey, css)
    }
    
    // Handle batching
    if (batch && css.trim()) {
      this.addToBatch(css)
      return '' // Return empty since we're batching
    }
    
    return css
  }
  
  /**
   * Create cache key for CSS rule
   */
  private static createCacheKey(
    selector: string,
    config: ResponsiveStyleConfig,
    options: { minify?: boolean }
  ): string {
    return JSON.stringify({ selector, config, options })
  }
  
  /**
   * Generate CSS without optimizations (for comparison)
   */
  private static generateCSS(
    selector: string,
    config: ResponsiveStyleConfig,
    options: { minify?: boolean }
  ): string {
    const { minify = false } = options
    const indent = minify ? '' : '  '
    const newline = minify ? '' : '\n'
    const space = minify ? '' : ' '
    
    let css = ''
    const processedBreakpoints = new Set<string>()
    
    // Base styles first
    const baseStyles = this.extractBaseStyles(config)
    if (Object.keys(baseStyles).length > 0) {
      css += `${selector}${space}{${newline}`
      css += this.generateProperties(baseStyles, indent, newline, space)
      css += `}${newline}`
    }
    
    // Responsive styles
    for (const [property, value] of Object.entries(config)) {
      if (typeof value === 'object' && value !== null) {
        for (const [breakpoint, breakpointValue] of Object.entries(value)) {
          if (breakpoint === 'base') continue
          
          const mediaQuery = this.getMediaQuery(breakpoint as BreakpointKey)
          const breakpointKey = `${mediaQuery}:${property}`
          
          if (!processedBreakpoints.has(breakpointKey)) {
            css += `@media ${mediaQuery}${space}{${newline}`
            css += `${indent}${selector}${space}{${newline}`
            css += `${indent}${indent}${this.propertyToCSS(property)}:${space}${this.valueToCSS(breakpointValue)};${newline}`
            css += `${indent}}${newline}`
            css += `}${newline}`
            
            processedBreakpoints.add(breakpointKey)
          }
        }
      }
    }
    
    return css
  }
  
  /**
   * Add CSS to batch queue
   */
  private static addToBatch(css: string): void {
    this.ruleQueue.push(css)
    
    if (this.ruleQueue.length >= this.BATCH_SIZE) {
      this.flushBatch()
    } else if (!this.flushTimer) {
      this.flushTimer = window.setTimeout(() => this.flushBatch(), 16) // Next frame
    }
  }
  
  /**
   * Flush batched CSS rules
   */
  private static flushBatch(): void {
    if (this.ruleQueue.length === 0) return
    
    const batchedCSS = this.ruleQueue.join('')
    this.ruleQueue = []
    
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
    
    // Inject batched CSS
    this.injectCSS(batchedCSS)
  }
  
  /**
   * Inject CSS into document
   */
  private static injectCSS(css: string): void {
    if (typeof document === 'undefined') return
    
    let styleElement = document.getElementById('tachui-responsive-styles') as HTMLStyleElement
    
    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = 'tachui-responsive-styles'
      styleElement.type = 'text/css'
      document.head.appendChild(styleElement)
    }
    
    // Use standard approach (legacy IE support removed)
    styleElement.appendChild(document.createTextNode(css))
  }
  
  /**
   * Extract base (non-responsive) styles
   */
  private static extractBaseStyles(config: ResponsiveStyleConfig): Record<string, any> {
    const baseStyles: Record<string, any> = {}
    
    for (const [property, value] of Object.entries(config)) {
      if (typeof value !== 'object' || value === null) {
        baseStyles[property] = value
      } else if ('base' in value) {
        baseStyles[property] = value.base
      }
    }
    
    return baseStyles
  }
  
  /**
   * Generate CSS properties
   */
  private static generateProperties(
    styles: Record<string, any>,
    indent: string,
    newline: string,
    space: string
  ): string {
    let css = ''
    
    for (const [property, value] of Object.entries(styles)) {
      if (value !== undefined) {
        css += `${indent}${this.propertyToCSS(property)}:${space}${this.valueToCSS(value)};${newline}`
      }
    }
    
    return css
  }
  
  /**
   * Convert property name to CSS
   */
  private static propertyToCSS(property: string): string {
    return property.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)
  }
  
  /**
   * Convert value to CSS
   */
  private static valueToCSS(value: any): string {
    if (typeof value === 'number') {
      return `${value}px`
    }
    return value.toString()
  }
  
  /**
   * Get media query for breakpoint
   */
  private static getMediaQuery(breakpoint: BreakpointKey): string {
    const queries: Record<BreakpointKey, string> = {
      base: '',
      sm: '(min-width: 640px)',
      md: '(min-width: 768px)',
      lg: '(min-width: 1024px)',
      xl: '(min-width: 1280px)',
      '2xl': '(min-width: 1536px)'
    }
    
    return queries[breakpoint] || breakpoint
  }
  
  /**
   * Force flush any pending batched CSS
   */
  static flush(): void {
    this.flushBatch()
  }
  
  /**
   * Get performance statistics
   */
  static getStats() {
    return {
      cache: cssRuleCache.getStats(),
      batch: {
        queueSize: this.ruleQueue.length,
        batchSize: this.BATCH_SIZE
      }
    }
  }
  
  /**
   * Clear all caches and reset performance counters
   */
  static reset(): void {
    cssRuleCache.clear()
    this.ruleQueue = []
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
  }
}

/**
 * Performance monitoring for responsive system
 */
export class ResponsivePerformanceMonitor {
  private static measurements = new Map<string, number[]>()
  
  /**
   * Start performance measurement
   */
  static startMeasurement(name: string): () => number {
    const startTime = performance.now()
    
    return () => {
      const duration = performance.now() - startTime
      this.recordMeasurement(name, duration)
      return duration
    }
  }
  
  /**
   * Record measurement
   */
  private static recordMeasurement(name: string, duration: number): void {
    if (!this.measurements.has(name)) {
      this.measurements.set(name, [])
    }
    
    const measurements = this.measurements.get(name)!
    measurements.push(duration)
    
    // Keep only last 100 measurements
    if (measurements.length > 100) {
      measurements.shift()
    }
  }
  
  /**
   * Get performance statistics
   */
  static getStats() {
    const stats: Record<string, any> = {}
    
    for (const [name, measurements] of this.measurements) {
      const sorted = [...measurements].sort((a, b) => a - b)
      const avg = measurements.reduce((sum, val) => sum + val, 0) / measurements.length
      
      stats[name] = {
        count: measurements.length,
        average: avg,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)]
      }
    }
    
    return stats
  }
  
  /**
   * Clear all performance data
   */
  static reset(): void {
    this.measurements.clear()
  }
}