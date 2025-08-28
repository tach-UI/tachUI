/**
 * CSS Classes Enhancement - Class Manager
 *
 * Core CSS class processing system that handles sanitization,
 * deduplication, and integration with tachUI components.
 */

import { isSignal, isComputed } from '../reactive'
import type { Signal } from '../reactive/types'
import type {
  CSSClassProcessor,
  CSSClassConfig,
  ClassProcessingResult
} from './types'

/**
 * Default configuration for CSS class processing
 */
const DEFAULT_CONFIG: CSSClassConfig = {
  sanitizeClassNames: true,
  sanitizationRules: {
    allowNumbers: true,
    allowUnderscores: true,
    customReplacements: {}
  },
  enableCaching: true,
  maxCacheSize: 1000,
  warnDuplicateClasses: process.env.NODE_ENV === 'development',
  warnInvalidClasses: process.env.NODE_ENV === 'development'
}

/**
 * CSS Class Manager - Core processing system
 */
export class CSSClassManager implements CSSClassProcessor {
  private config: CSSClassConfig
  private classCache: Map<string, string[]> | { [key: string]: string[] }
  private processingCache: Map<string, ClassProcessingResult> | { [key: string]: ClassProcessingResult }

  constructor(config: Partial<CSSClassConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }

    // Initialize caches with Map if available, otherwise use plain objects
    // Use safe check for Map availability to handle all edge cases
    const mapAvailable = (() => {
      try {
        return typeof Map !== 'undefined' && typeof Map === 'function'
      } catch (_e) {
        return false
      }
    })()

    this.classCache = mapAvailable ? new Map() : {}
    this.processingCache = mapAvailable ? new Map() : {}
  }

  /**
   * Cache helper methods to work with both Map and plain object fallbacks
   */
  private cacheHas(cache: Map<string, any> | { [key: string]: any }, key: string): boolean {
    try {
      return cache instanceof Map ? cache.has(key) : key in cache
    } catch (_e) {
      // Fallback if Map check fails
      return key in cache
    }
  }

  private cacheGet<T>(cache: Map<string, T> | { [key: string]: T }, key: string): T | undefined {
    try {
      return cache instanceof Map ? cache.get(key) : cache[key]
    } catch (_e) {
      return (cache as { [key: string]: T })[key]
    }
  }

  private cacheSet<T>(cache: Map<string, T> | { [key: string]: T }, key: string, value: T): void {
    try {
      if (cache instanceof Map) {
        cache.set(key, value)
      } else {
        cache[key] = value
      }
    } catch (_e) {
      ;(cache as { [key: string]: T })[key] = value
    }
  }

  private cacheDelete<T>(cache: Map<string, T> | { [key: string]: T }, key: string): void {
    try {
      if (cache instanceof Map) {
        cache.delete(key)
      } else {
        delete cache[key]
      }
    } catch (_e) {
      delete (cache as { [key: string]: T })[key]
    }
  }

  private cacheClear<T>(cache: Map<string, T> | { [key: string]: T }): void {
    try {
      if (cache instanceof Map) {
        cache.clear()
      } else {
        Object.keys(cache).forEach(key => delete cache[key])
      }
    } catch (_e) {
      Object.keys(cache as { [key: string]: T }).forEach(key => delete (cache as { [key: string]: T })[key])
    }
  }

  private cacheSize<T>(cache: Map<string, T> | { [key: string]: T }): number {
    try {
      return cache instanceof Map ? cache.size : Object.keys(cache).length
    } catch (_e) {
      return Object.keys(cache).length
    }
  }

  private cacheKeys<T>(cache: Map<string, T> | { [key: string]: T }): IterableIterator<string> | string[] {
    try {
      return cache instanceof Map ? cache.keys() : Object.keys(cache)
    } catch (_e) {
      return Object.keys(cache)
    }
  }

  /**
   * Process CSS classes from various input formats
   */
  processClasses(input: string | string[] | Signal<string | string[]>): string[] {
    if (!input) return []

    // Handle reactive signals and computed values - no caching for dynamic values
    if (isSignal(input) || isComputed(input)) {
      const resolved = input()
      return this.processClasses(resolved)
    }

    // Check cache for static inputs
    const cacheKey = this.getCacheKey(input)
    if (this.config.enableCaching && this.cacheHas(this.classCache, cacheKey)) {
      return this.cacheGet(this.classCache, cacheKey)!
    }

    let classes: string[] = []

    // Handle string input - split on whitespace
    if (typeof input === 'string') {
      classes = input.trim().split(/\s+/).filter(Boolean)
    }
    // Handle array input - flatten and filter, convert non-strings to strings
    else if (Array.isArray(input)) {
      classes = input
        .flatMap(cls => {
          if (cls === null || cls === undefined || cls === '') {
            return [] // Skip null, undefined, and empty strings
          }
          // Convert non-strings to strings
          const stringified = typeof cls === 'string' ? cls : String(cls)
          const trimmed = stringified.trim()

          // For non-string values that have been stringified, treat as single class name
          // to preserve object representations like "[object Object]"
          if (typeof cls !== 'string' && trimmed) {
            return [trimmed]
          }

          // For strings, split on whitespace as normal
          return trimmed.split(/\s+/)
        })
        .filter(Boolean)
    }
    // Handle other types by converting to string (for edge case testing)
    // Treat the entire stringified value as a single class name to preserve object representations
    else {
      const stringified = String(input).trim()
      classes = stringified ? [stringified] : []
    }

    // Process classes through sanitization and deduplication
    const processed = this.processClassArray(classes)

    // Cache the result if caching is enabled
    if (this.config.enableCaching) {
      this.setCachedClasses(cacheKey, processed)
    }

    return processed
  }

  /**
   * Process an array of class names
   */
  private processClassArray(classes: string[]): string[] {
    let processed = classes

    // Sanitize class names if enabled
    if (this.config.sanitizeClassNames) {
      processed = processed.map(cls => this.sanitizeClassName(cls))
    }

    // Remove duplicates while preserving order
    processed = this.deduplicateClasses(processed)

    // Development warnings
    if (this.config.warnDuplicateClasses && classes.length !== processed.length) {
      console.warn('[tachUI] Duplicate CSS classes detected and removed:',
        classes.filter((cls, i) => classes.indexOf(cls) !== i))
    }

    return processed
  }

  /**
   * Sanitize class name to be valid CSS identifier
   */
  sanitizeClassName(className: string): string {
    if (!className || typeof className !== 'string') return ''

    const rules = this.config.sanitizationRules!
    let sanitized = className.trim()

    // Handle spaces in class names
    // CSS class names cannot contain spaces - convert them to hyphens to create valid single class names
    if (sanitized.includes(' ')) {
      sanitized = sanitized.replace(/\s+/g, '-')
      if (this.config.warnInvalidClasses) {
        console.warn(`[tachUI] CSS class names cannot contain spaces. Converted "${className}" to "${sanitized}"`)
      }
    }

    // Apply custom replacements first
    Object.entries(rules.customReplacements || {}).forEach(([from, to]) => {
      sanitized = sanitized.replace(new RegExp(from, 'g'), to)
    })

    // Build character allowlist - be more permissive for modern CSS frameworks
    let allowedChars = 'a-zA-Z\\-\\.'  // Basic CSS characters
    if (rules.allowNumbers) allowedChars += '0-9'
    if (rules.allowUnderscores) allowedChars += '_'

    // Allow modern CSS framework characters (Tailwind, CSS modules, etc.)
    // : for pseudo-classes (hover:bg-blue-500)
    // [ ] for arbitrary values ([10px])
    // / for opacity modifiers (bg-black/50)
    // % for percentages
    allowedChars += ':\\[\\]/%'

    // Only replace characters that are truly invalid in CSS class names
    // Keep most characters as-is since modern CSS frameworks use many special chars
    sanitized = sanitized.replace(new RegExp(`[^${allowedChars}]`, 'g'), '-')

    // Ensure doesn't start with number (invalid CSS)
    if (/^[0-9]/.test(sanitized)) {
      sanitized = 'cls-' + sanitized
    }

    // Collapse excessive hyphens (3 or more) but preserve CSS custom property prefixes (--)
    sanitized = sanitized.replace(/---+/g, '--')

    // Keep leading/trailing hyphens - they are valid in CSS class names
    // Only remove if they result from excessive collapsing (e.g., "---" became "--" then "-" at edges)

    // Keep original case - many frameworks use camelCase and mixed case
    // Do not convert to lowercase to preserve modern CSS framework conventions

    // Warn about invalid classes in development
    if (this.config.warnInvalidClasses && sanitized !== className.trim()) {
      console.warn(`[tachUI] CSS class "${className}" sanitized to "${sanitized}"`)
    }

    return sanitized
  }

  /**
   * Deduplicate classes while preserving first occurrence order
   */
  deduplicateClasses(classes: string[]): string[] {
    return [...new Set(classes.filter(Boolean))]
  }

  /**
   * Combine tachUI classes with user-provided CSS classes
   * User classes come AFTER tachUI classes for proper CSS cascade
   */
  combineClasses(tachuiClasses: string[], userClasses: string[]): string[] {
    const processedUserClasses = this.processClasses(userClasses)
    const combined = [...tachuiClasses, ...processedUserClasses]
    return this.deduplicateClasses(combined)
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<CSSClassConfig>): void {
    this.config = { ...this.config, ...config }

    // Clear caches when config changes
    this.clearCaches()
  }

  /**
   * Get current configuration
   */
  getConfig(): CSSClassConfig {
    return { ...this.config }
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.cacheClear(this.classCache)
    this.cacheClear(this.processingCache)
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cacheSize(this.classCache),
      maxSize: this.config.maxCacheSize,
      hitRate: 0 // TODO: Implement hit rate tracking if needed
    }
  }

  /**
   * Generate cache key for input
   */
  private getCacheKey(input: string | string[]): string {
    return Array.isArray(input) ? input.join('|') : input
  }

  /**
   * Set cached classes with LRU eviction
   */
  private setCachedClasses(key: string, classes: string[]): void {
    // Implement LRU cache eviction
    if (this.cacheSize(this.classCache) >= this.config.maxCacheSize) {
      const keys = this.cacheKeys(this.classCache)
      // const firstKey = keys instanceof Array ? keys[0] : keys.next().value
      const firstKey = Array.isArray(keys) ? keys[0] : keys.next().value
      if (firstKey !== undefined) {
        this.cacheDelete(this.classCache, firstKey)
      }
    }

    this.cacheSet(this.classCache, key, classes)
  }
}

/**
 * Global CSS class manager instance
 */
export const cssClassManager = new CSSClassManager()

/**
 * Configure global CSS class processing
 */
export function configureCSSClasses(config: Partial<CSSClassConfig>): void {
  cssClassManager.updateConfig(config)
}

/**
 * Get current CSS class configuration
 */
export function getCSSClassConfig(): CSSClassConfig {
  return cssClassManager.getConfig()
}
