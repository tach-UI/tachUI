/**
 * Grid Responsive Integration (Phase 2)
 *
 * Enhanced responsive integration for Grid components that deeply integrates
 * with tachUI's responsive modifier system for optimal performance and capabilities.
 */

import type { 
  ResponsiveValue, 
  BreakpointKey, 
  ResponsiveStyleConfig,
  ResponsiveModifierResult
} from '../modifiers/responsive/types'
import { ResponsiveCSSGenerator } from '../modifiers/responsive/css-generator'
import { createResponsiveModifier } from '../modifiers/responsive/responsive-modifier'
import type { GridItemConfig, ResponsiveGridItemConfig } from './Grid'

/**
 * Enhanced responsive grid configuration with full modifier integration
 */
export interface EnhancedResponsiveGridConfig {
  columns?: ResponsiveValue<GridItemConfig[]>
  rows?: ResponsiveValue<GridItemConfig[]>
  gap?: ResponsiveValue<string | number>
  columnGap?: ResponsiveValue<string | number>
  rowGap?: ResponsiveValue<string | number>
  autoFlow?: ResponsiveValue<'row' | 'column' | 'row dense' | 'column dense'>
  autoRows?: ResponsiveValue<string>
  autoColumns?: ResponsiveValue<string>
  templateAreas?: ResponsiveValue<string>
  alignItems?: ResponsiveValue<'start' | 'end' | 'center' | 'stretch' | 'baseline'>
  justifyItems?: ResponsiveValue<'start' | 'end' | 'center' | 'stretch'>
  alignContent?: ResponsiveValue<'start' | 'end' | 'center' | 'stretch' | 'space-between' | 'space-around' | 'space-evenly'>
  justifyContent?: ResponsiveValue<'start' | 'end' | 'center' | 'stretch' | 'space-between' | 'space-around' | 'space-evenly'>
}

/**
 * Enhanced GridItem CSS Generator with responsive modifier integration
 */
export class ResponsiveGridCSSGenerator extends ResponsiveCSSGenerator {
  constructor(selector: string) {
    super({
      selector,
      mobileFirst: true,
      optimizeOutput: true,
      includeComments: false,
      generateMinified: true
    })
  }

  /**
   * Generate responsive grid CSS that integrates with tachUI's modifier system
   */
  generateGridCSS(config: EnhancedResponsiveGridConfig): ResponsiveModifierResult {
    const responsiveStyles: ResponsiveStyleConfig = {}
    
    // Process each responsive property
    Object.entries(config).forEach(([property, value]) => {
      if (this.isResponsiveValue(value)) {
        // Handle responsive values
        Object.entries(value).forEach(([breakpoint, breakpointValue]) => {
          if (!responsiveStyles[breakpoint as BreakpointKey]) {
            responsiveStyles[breakpoint as BreakpointKey] = {}
          }
          
          const cssProperty = this.mapGridPropertyToCSS(property, breakpointValue)
          if (cssProperty) {
            Object.assign(responsiveStyles[breakpoint as BreakpointKey]!, cssProperty)
          }
        })
      } else {
        // Handle non-responsive values - add to base styles
        if (!responsiveStyles.base) {
          responsiveStyles.base = {}
        }
        
        const cssProperty = this.mapGridPropertyToCSS(property, value)
        if (cssProperty) {
          Object.assign(responsiveStyles.base, cssProperty)
        }
      }
    })

    return this.generateResponsiveCSS(responsiveStyles)
  }

  /**
   * Map grid property names to CSS properties with appropriate value processing
   */
  private mapGridPropertyToCSS(property: string, value: any): Record<string, string> | null {
    switch (property) {
      case 'columns':
        return { 'grid-template-columns': this.generateGridColumns(value) }
      case 'rows':
        return { 'grid-template-rows': this.generateGridRows(value) }
      case 'gap':
        return { 'gap': this.normalizeSpacing(value) }
      case 'columnGap':
        return { 'column-gap': this.normalizeSpacing(value) }
      case 'rowGap':
        return { 'row-gap': this.normalizeSpacing(value) }
      case 'autoFlow':
        return { 'grid-auto-flow': value }
      case 'autoRows':
        return { 'grid-auto-rows': value }
      case 'autoColumns':
        return { 'grid-auto-columns': value }
      case 'templateAreas':
        return { 'grid-template-areas': value }
      case 'alignItems':
        return { 'align-items': value }
      case 'justifyItems':
        return { 'justify-items': value }
      case 'alignContent':
        return { 'align-content': value }
      case 'justifyContent':
        return { 'justify-content': value }
      default:
        return null
    }
  }

  /**
   * Generate CSS grid-template-columns from GridItem configurations
   */
  private generateGridColumns(items: GridItemConfig[]): string {
    return items.map(item => {
      switch (item.type) {
        case 'fixed':
          return `${item.size}px`
        case 'flexible':
          const minSize = item.minimum || 0
          const maxSize = item.maximum ? `${item.maximum}px` : '1fr'
          return minSize > 0 ? `minmax(${minSize}px, ${maxSize})` : '1fr'
        case 'adaptive':
          const adaptiveMin = item.minimum
          const adaptiveMax = item.maximum ? `${item.maximum}px` : '1fr'
          return `minmax(${adaptiveMin}px, ${adaptiveMax})`
        default:
          return '1fr'
      }
    }).join(' ')
  }

  /**
   * Generate CSS grid-template-rows from GridItem configurations
   */
  private generateGridRows(items: GridItemConfig[]): string {
    return this.generateGridColumns(items) // Same logic applies
  }

  /**
   * Normalize spacing values to CSS
   */
  private normalizeSpacing(value: string | number): string {
    if (typeof value === 'number') {
      return `${value}px`
    }
    return value
  }

  /**
   * Check if a value is responsive (has breakpoint keys)
   */
  private isResponsiveValue(value: any): value is ResponsiveValue<any> {
    return value && typeof value === 'object' && !Array.isArray(value) &&
           Object.keys(value).some(key => ['base', 'sm', 'md', 'lg', 'xl', 'xxl'].includes(key))
  }
}

/**
 * Create responsive grid modifier for LazyVGrid components with caching
 */
export function createResponsiveGridModifier(config: EnhancedResponsiveGridConfig) {
  return createResponsiveModifier((elementId: string) => {
    const selector = `#${elementId}`
    // Use cached CSS generation for improved performance
    return GridCSSCache.getCachedCSS(config, selector)
  })
}

/**
 * CSS caching system for responsive grids (Phase 2)
 */
class GridCSSCache {
  private static cache = new Map<string, ResponsiveModifierResult>()
  private static maxCacheSize = 100
  private static hitCount = 0
  private static missCount = 0

  /**
   * Generate cache key from configuration
   */
  private static generateCacheKey(config: EnhancedResponsiveGridConfig): string {
    return JSON.stringify(config, (_key, value) => {
      // Normalize function references and ensure consistent ordering
      if (typeof value === 'function') {
        return '[Function]'
      }
      return value
    })
  }

  /**
   * Get cached CSS or generate new if not cached
   */
  static getCachedCSS(
    config: EnhancedResponsiveGridConfig,
    selector: string
  ): ResponsiveModifierResult {
    const cacheKey = this.generateCacheKey(config)
    
    if (this.cache.has(cacheKey)) {
      this.hitCount++
      const cachedResult = this.cache.get(cacheKey)!
      
      // Update selector in cached result (selectors may differ between instances)
      return {
        ...cachedResult,
        mediaQueries: cachedResult.mediaQueries.map(mq => ({
          ...mq,
          selector
        }))
      }
    }

    this.missCount++
    
    // Generate new CSS
    const generator = new ResponsiveGridCSSGenerator(selector)
    const result = generator.generateGridCSS(config)
    
    // Cache the result (with generic selector that will be replaced)
    const cacheableResult = {
      ...result,
      mediaQueries: result.mediaQueries.map(mq => ({
        ...mq,
        selector: '.cached-selector' // Placeholder selector for caching
      }))
    }
    
    // Implement LRU cache eviction
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      }
    }
    
    this.cache.set(cacheKey, cacheableResult)
    return result
  }

  /**
   * Get cache statistics for performance monitoring
   */
  static getStats() {
    return {
      cacheSize: this.cache.size,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0
    }
  }

  /**
   * Clear cache (useful for testing or memory management)
   */
  static clearCache() {
    this.cache.clear()
    this.hitCount = 0
    this.missCount = 0
  }
}

/**
 * Enhanced responsive utilities for grid components
 */
export class GridResponsiveUtils {
  /**
   * Convert legacy ResponsiveGridItemConfig to enhanced format
   */
  static convertLegacyConfig(
    legacyConfig: ResponsiveGridItemConfig
  ): ResponsiveValue<GridItemConfig[]> {
    const responsiveValue: ResponsiveValue<GridItemConfig[]> = {}
    
    Object.entries(legacyConfig).forEach(([breakpoint, items]) => {
      if (items) {
        responsiveValue[breakpoint as BreakpointKey] = items
      }
    })
    
    return responsiveValue
  }

  /**
   * Create responsive grid configuration from simple column/row definitions
   */
  static createResponsiveGridConfig(options: {
    columns?: ResponsiveValue<GridItemConfig[]> | ResponsiveGridItemConfig
    rows?: ResponsiveValue<GridItemConfig[]> | ResponsiveGridItemConfig
    spacing?: ResponsiveValue<string | number | { horizontal?: number; vertical?: number }>
    alignment?: ResponsiveValue<'topLeading' | 'top' | 'topTrailing' | 'leading' | 'center' | 'trailing' | 'bottomLeading' | 'bottom' | 'bottomTrailing'>
  }): EnhancedResponsiveGridConfig {
    const config: EnhancedResponsiveGridConfig = {}

    // Handle columns
    if (options.columns) {
      if (this.isLegacyResponsiveGridConfig(options.columns)) {
        config.columns = this.convertLegacyConfig(options.columns)
      } else {
        config.columns = options.columns
      }
    }

    // Handle rows
    if (options.rows) {
      if (this.isLegacyResponsiveGridConfig(options.rows)) {
        config.rows = this.convertLegacyConfig(options.rows)
      } else {
        config.rows = options.rows
      }
    }

    // Handle spacing
    if (options.spacing) {
      if (this.isResponsiveValue(options.spacing)) {
        const processedSpacing: ResponsiveValue<string> = {}
        Object.entries(options.spacing).forEach(([breakpoint, value]) => {
          processedSpacing[breakpoint as BreakpointKey] = this.normalizeSpacing(value)
        })
        config.gap = processedSpacing
      } else {
        config.gap = { base: this.normalizeSpacing(options.spacing) }
      }
    }

    // Handle alignment
    if (options.alignment) {
      if (this.isResponsiveValue(options.alignment)) {
        const alignItems: ResponsiveValue<'start' | 'end' | 'center' | 'stretch'> = {}
        const justifyItems: ResponsiveValue<'start' | 'end' | 'center' | 'stretch'> = {}
        
        Object.entries(options.alignment).forEach(([breakpoint, alignment]) => {
          const { alignItems: ai, justifyItems: ji } = this.convertAlignment(alignment)
          alignItems[breakpoint as BreakpointKey] = ai
          justifyItems[breakpoint as BreakpointKey] = ji
        })
        
        config.alignItems = alignItems
        config.justifyItems = justifyItems
      } else {
        const { alignItems, justifyItems } = this.convertAlignment(options.alignment)
        config.alignItems = { base: alignItems }
        config.justifyItems = { base: justifyItems }
      }
    }

    return config
  }

  /**
   * Convert GridAlignment to CSS alignment properties
   */
  private static convertAlignment(alignment: string): { alignItems: 'start' | 'end' | 'center' | 'stretch'; justifyItems: 'start' | 'end' | 'center' | 'stretch' } {
    const alignmentMap: Record<string, { alignItems: 'start' | 'end' | 'center' | 'stretch'; justifyItems: 'start' | 'end' | 'center' | 'stretch' }> = {
      'topLeading': { alignItems: 'start', justifyItems: 'start' },
      'top': { alignItems: 'start', justifyItems: 'center' },
      'topTrailing': { alignItems: 'start', justifyItems: 'end' },
      'leading': { alignItems: 'center', justifyItems: 'start' },
      'center': { alignItems: 'center', justifyItems: 'center' },
      'trailing': { alignItems: 'center', justifyItems: 'end' },
      'bottomLeading': { alignItems: 'end', justifyItems: 'start' },
      'bottom': { alignItems: 'end', justifyItems: 'center' },
      'bottomTrailing': { alignItems: 'end', justifyItems: 'end' }
    }
    
    return alignmentMap[alignment] || alignmentMap.center
  }

  /**
   * Normalize spacing values to CSS
   */
  private static normalizeSpacing(value: string | number | { horizontal?: number; vertical?: number }): string {
    if (typeof value === 'number') {
      return `${value}px`
    }
    if (typeof value === 'string') {
      return value
    }
    if (value && typeof value === 'object') {
      const horizontal = value.horizontal ?? 0
      const vertical = value.vertical ?? 0
      return `${vertical}px ${horizontal}px`
    }
    return '0'
  }

  /**
   * Check if value is a responsive value
   */
  private static isResponsiveValue(value: any): value is ResponsiveValue<any> {
    return value && typeof value === 'object' && !Array.isArray(value) &&
           Object.keys(value).some(key => ['base', 'sm', 'md', 'lg', 'xl', 'xxl'].includes(key))
  }

  /**
   * Check if value is legacy ResponsiveGridItemConfig
   */
  private static isLegacyResponsiveGridConfig(value: any): value is ResponsiveGridItemConfig {
    return value && typeof value === 'object' && !Array.isArray(value) &&
           Object.keys(value).some(key => ['base', 'sm', 'md', 'lg', 'xl', 'xxl'].includes(key)) &&
           Object.values(value).every(v => Array.isArray(v))
  }
}

/**
 * Enhanced debugging tools for responsive grids (Phase 2)
 */
export class GridDebugger {
  private static debugMode = false
  private static instances = new Map<string, {
    config: EnhancedResponsiveGridConfig
    selector: string
    timestamp: number
  }>()

  /**
   * Enable/disable grid debugging
   */
  static setDebugMode(enabled: boolean) {
    this.debugMode = enabled
    if (enabled) {
      console.log('🔍 tachUI Grid debugging enabled')
    }
  }

  /**
   * Register a grid instance for debugging
   */
  static registerGrid(elementId: string, config: EnhancedResponsiveGridConfig, selector: string) {
    if (!this.debugMode) return

    this.instances.set(elementId, {
      config,
      selector,
      timestamp: Date.now()
    })

    console.group(`🏗️ Grid registered: ${elementId}`)
    console.log('Configuration:', config)
    console.log('Selector:', selector)
    console.log('Cache stats:', GridCSSCache.getStats())
    console.groupEnd()
  }

  /**
   * Log responsive grid performance metrics
   */
  static logPerformanceMetrics() {
    if (!this.debugMode) return

    console.group('📊 Grid Performance Metrics')
    
    const cacheStats = GridCSSCache.getStats()
    console.log(`Cache efficiency: ${(cacheStats.hitRate * 100).toFixed(1)}%`)
    console.log(`Cache size: ${cacheStats.cacheSize}/${100}`)
    console.log(`Cache hits: ${cacheStats.hitCount}, misses: ${cacheStats.missCount}`)
    
    console.log(`Active grid instances: ${this.instances.size}`)
    console.groupEnd()
  }

  /**
   * Visualize breakpoint behavior in browser console
   */
  static visualizeBreakpoints(config: EnhancedResponsiveGridConfig) {
    if (!this.debugMode) return

    console.group('📱 Responsive Grid Breakpoints')
    
    if (config.columns) {
      console.log('Column configuration:')
      Object.entries(config.columns).forEach(([breakpoint, cols]) => {
        const description = Array.isArray(cols) 
          ? cols.map(c => `${c.type}(${c.size || c.minimum || 'auto'})`).join(' ')
          : String(cols || 'auto')
        console.log(`  ${breakpoint}: ${description}`)
      })
    }
    
    if (config.gap) {
      console.log('Gap configuration:')
      Object.entries(config.gap).forEach(([breakpoint, gap]) => {
        console.log(`  ${breakpoint}: ${gap}`)
      })
    }
    
    console.groupEnd()
  }

  /**
   * Get debugging information for all registered grids
   */
  static getDebugInfo() {
    return {
      debugMode: this.debugMode,
      instances: Array.from(this.instances.entries()).map(([id, info]) => ({
        id,
        ...info,
        age: Date.now() - info.timestamp
      })),
      cacheStats: GridCSSCache.getStats()
    }
  }

  /**
   * Clear debugging data
   */
  static clear() {
    this.instances.clear()
    GridCSSCache.clearCache()
    if (this.debugMode) {
      console.log('🧹 Grid debugging data cleared')
    }
  }
}

/**
 * Performance monitoring for responsive grid layouts (Phase 2)
 */
export class GridPerformanceMonitor {
  private static measurements = new Map<string, number[]>()
  private static enabled = false

  /**
   * Enable performance monitoring
   */
  static enable() {
    this.enabled = true
    console.log('⏱️ Grid performance monitoring enabled')
  }

  /**
   * Disable performance monitoring
   */
  static disable() {
    this.enabled = false
  }

  /**
   * Start measuring a performance metric
   */
  static startMeasurement(operation: string): () => void {
    if (!this.enabled) return () => {}

    const startTime = performance.now()
    
    return () => {
      const duration = performance.now() - startTime
      
      if (!this.measurements.has(operation)) {
        this.measurements.set(operation, [])
      }
      
      this.measurements.get(operation)!.push(duration)
      
      // Log slow operations (>10ms)
      if (duration > 10) {
        console.warn(`🐌 Slow grid operation: ${operation} took ${duration.toFixed(2)}ms`)
      }
    }
  }

  /**
   * Get performance statistics
   */
  static getStats() {
    const stats: Record<string, {
      count: number
      averageTime: number
      minTime: number
      maxTime: number
      totalTime: number
    }> = {}

    for (const [operation, times] of this.measurements) {
      const count = times.length
      const totalTime = times.reduce((sum, time) => sum + time, 0)
      const averageTime = totalTime / count
      const minTime = Math.min(...times)
      const maxTime = Math.max(...times)

      stats[operation] = {
        count,
        averageTime: Number(averageTime.toFixed(2)),
        minTime: Number(minTime.toFixed(2)),
        maxTime: Number(maxTime.toFixed(2)),
        totalTime: Number(totalTime.toFixed(2))
      }
    }

    return stats
  }

  /**
   * Log performance report
   */
  static logReport() {
    if (!this.enabled) return

    console.group('📈 Grid Performance Report')
    const stats = this.getStats()
    
    for (const [operation, data] of Object.entries(stats)) {
      console.log(`${operation}:`, data)
    }
    
    console.groupEnd()
  }

  /**
   * Clear performance data
   */
  static clear() {
    this.measurements.clear()
    if (this.enabled) {
      console.log('🧹 Grid performance data cleared')
    }
  }
}

export type { ResponsiveGridItemConfig }

// Export debugging and performance utilities (declared above as classes)
export { GridCSSCache }