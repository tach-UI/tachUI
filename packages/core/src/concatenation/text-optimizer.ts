/**
 * Text Concatenation Optimizer (Enhanced - Phase 4.1)
 * 
 * Optimizes concatenated text components by merging adjacent text segments
 * with compatible modifiers to improve performance and reduce DOM complexity.
 * 
 * Enhanced with caching and advanced optimization strategies.
 */

import type { ComponentSegment } from './types'
import type { Modifier } from '../modifiers/types'

/**
 * Optimization cache for storing processed segment combinations
 */
interface OptimizationCacheEntry {
  optimizedSegments: ComponentSegment[]
  stats: OptimizationStats
  timestamp: number
}

/**
 * Optimization statistics interface
 */
interface OptimizationStats {
  originalCount: number
  optimizedCount: number
  reductionPercent: number
  textSegmentsMerged: number
  processingTimeMs: number
}

/**
 * Cache for segment optimization results
 */
const optimizationCache = new Map<string, OptimizationCacheEntry>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const MAX_CACHE_SIZE = 100

/**
 * Text-specific concatenation optimizer
 */
export class TextConcatenationOptimizer {
  /**
   * Optimize an array of segments by merging compatible adjacent text segments
   * Enhanced with caching and performance monitoring
   */
  static optimize(segments: ComponentSegment[]): ComponentSegment[] {
    const startTime = performance.now()
    
    if (segments.length < 2) return segments
    
    // Generate cache key from segments
    const cacheKey = this.generateCacheKey(segments)
    
    // Check cache first
    const cached = this.getCachedOptimization(cacheKey)
    if (cached) {
      return cached.optimizedSegments
    }
    
    // Perform optimization
    const optimized = this.performOptimization(segments)
    const processingTime = performance.now() - startTime
    
    // Cache the result
    const stats: OptimizationStats = {
      ...this.getOptimizationStats(segments, optimized),
      processingTimeMs: processingTime
    }
    
    this.cacheOptimization(cacheKey, optimized, stats)
    
    // Log performance in development
    if (process.env.NODE_ENV === 'development' && processingTime > 5) {
      console.log(`TachUI Concatenation: Optimization took ${processingTime.toFixed(2)}ms for ${segments.length} segments`)
    }
    
    return optimized
  }
  
  /**
   * Core optimization algorithm separated for clarity
   */
  private static performOptimization(segments: ComponentSegment[]): ComponentSegment[] {
    const optimized: ComponentSegment[] = []
    
    for (const segment of segments) {
      const lastSegment = optimized[optimized.length - 1]
      
      if (lastSegment && this.canMergeTextSegments(lastSegment, segment)) {
        // Merge the segments
        optimized[optimized.length - 1] = this.mergeTextSegments(lastSegment, segment)
      } else {
        // Add segment as-is
        optimized.push(segment)
      }
    }
    
    return optimized
  }
  
  /**
   * Generate a cache key from segments
   */
  private static generateCacheKey(segments: ComponentSegment[]): string {
    const keyParts = segments.map(segment => {
      const component = segment.component as any
      const content = this.extractTextContent(component)
      const modifierHash = this.hashModifiers(segment.modifiers)
      return `${component.constructor.name}:${content}:${modifierHash}`
    })
    
    return keyParts.join('|')
  }
  
  /**
   * Hash modifiers for cache key generation
   */
  private static hashModifiers(modifiers: Modifier[]): string {
    if (modifiers.length === 0) return 'none'
    
    try {
      const modifierData = modifiers.map(m => ({
        type: m.type,
        props: m.properties
      }))
      const jsonString = JSON.stringify(modifierData)
      
      // Use btoa safely by checking for undefined/null
      if (typeof btoa === 'function') {
        return btoa(jsonString).substring(0, 8)
      } else {
        // Fallback hash function for environments without btoa
        return this.simpleHash(jsonString).toString(16).substring(0, 8)
      }
    } catch {
      return 'hash-error'
    }
  }
  
  /**
   * Simple hash function fallback for environments without btoa
   */
  private static simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }
  
  /**
   * Get cached optimization result
   */
  private static getCachedOptimization(cacheKey: string): OptimizationCacheEntry | null {
    const cached = optimizationCache.get(cacheKey)
    
    if (!cached) return null
    
    // Check if cache entry is still valid
    const now = Date.now()
    if (now - cached.timestamp > CACHE_TTL) {
      optimizationCache.delete(cacheKey)
      return null
    }
    
    return cached
  }
  
  /**
   * Cache optimization result
   */
  private static cacheOptimization(
    cacheKey: string, 
    optimizedSegments: ComponentSegment[], 
    stats: OptimizationStats
  ): void {
    // Implement LRU eviction if cache is full
    if (optimizationCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = optimizationCache.keys().next().value
      if (oldestKey) {
        optimizationCache.delete(oldestKey)
      }
    }
    
    optimizationCache.set(cacheKey, {
      optimizedSegments,
      stats,
      timestamp: Date.now()
    })
  }
  
  /**
   * Clear optimization cache (useful for testing)
   */
  static clearCache(): void {
    optimizationCache.clear()
  }
  
  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    size: number
    maxSize: number
    hitRate: number
  } {
    return {
      size: optimizationCache.size,
      maxSize: MAX_CACHE_SIZE,
      hitRate: 0 // Would need to track hits/misses to calculate this
    }
  }
  
  /**
   * Check if two segments can be merged
   */
  private static canMergeTextSegments(a: ComponentSegment, b: ComponentSegment): boolean {
    // Both must be text components
    if (a.component.constructor.name !== 'EnhancedText' || 
        b.component.constructor.name !== 'EnhancedText') {
      return false
    }
    
    // Check if modifiers are compatible
    return this.modifiersCompatible(a.modifiers, b.modifiers)
  }
  
  /**
   * Check if two modifier arrays are compatible for merging
   */
  private static modifiersCompatible(modifiersA: Modifier[], modifiersB: Modifier[]): boolean {
    // If lengths differ, they're not compatible
    if (modifiersA.length !== modifiersB.length) return false
    
    // Check each modifier for compatibility
    for (let i = 0; i < modifiersA.length; i++) {
      if (!this.modifierEqual(modifiersA[i], modifiersB[i])) {
        return false
      }
    }
    
    return true
  }
  
  /**
   * Check if two modifiers are equal (simplified comparison)
   */
  private static modifierEqual(a: Modifier, b: Modifier): boolean {
    // Basic type check
    if (a.type !== b.type) return false
    
    // For now, we'll be conservative and only merge if modifiers are exactly the same
    // This could be expanded to allow compatible modifiers in the future
    try {
      return JSON.stringify(a.properties) === JSON.stringify(b.properties)
    } catch {
      return false
    }
  }
  
  /**
   * Merge two text segments into a single segment
   */
  private static mergeTextSegments(a: ComponentSegment, b: ComponentSegment): ComponentSegment {
    const componentA = a.component as any
    const componentB = b.component as any
    
    // Extract text content from both components
    const textA = this.extractTextContent(componentA)
    const textB = this.extractTextContent(componentB)
    
    // Create a new merged text component
    const mergedContent = textA + textB
    
    // Create merged segment
    return {
      id: `merged-${a.id}-${b.id}`,
      component: this.createMergedTextComponent(mergedContent, componentA.props, a.modifiers),
      modifiers: a.modifiers, // Use modifiers from first segment (they're identical)
      render: () => {
        // Create a merged render function
        const mergedComponent = this.createMergedTextComponent(mergedContent, componentA.props, a.modifiers)
        return mergedComponent.render()[0]
      }
    }
  }
  
  /**
   * Extract text content from a text component
   */
  private static extractTextContent(component: any): string {
    const content = component.props?.content
    
    if (typeof content === 'string') return content
    if (typeof content === 'function') return content()
    if (content && typeof content === 'object' && 'peek' in content) {
      return content.peek() || ''
    }
    
    return ''
  }
  
  /**
   * Create a new merged text component
   */
  private static createMergedTextComponent(content: string, baseProps: any, modifiers: Modifier[]): any {
    // Create a simplified text component to avoid circular dependencies
    // Instead of importing EnhancedText, create a minimal compatible component
    
    // Create new text component with merged content
    const mergedProps = {
      ...baseProps,
      content: content
    }
    
    // Return a minimal component-like object that can be rendered
    return {
      type: 'Text' as const,
      id: `merged-text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      props: mergedProps,
      mounted: false,
      cleanup: [],
      modifiers: modifiers,
      render() {
        // Simple text rendering - import at runtime to avoid circular deps
        const runtime = (globalThis as any).__tachui_runtime
        if (runtime && runtime.h && runtime.text) {
          const textNode = runtime.text(content)
          return [runtime.h('span', {}, [textNode])]
        }
        // Fallback if runtime not available
        return []
      }
    }
  }
  
  /**
   * Analyze segments and determine if optimization would be beneficial
   */
  static shouldOptimize(segments: ComponentSegment[]): boolean {
    if (segments.length < 2) return false
    
    // Count adjacent text segments
    let adjacentTextPairs = 0
    
    for (let i = 0; i < segments.length - 1; i++) {
      const current = segments[i]
      const next = segments[i + 1]
      
      if (current.component.constructor.name === 'EnhancedText' &&
          next.component.constructor.name === 'EnhancedText') {
        adjacentTextPairs++
      }
    }
    
    // Optimize if we have at least one pair of adjacent text segments
    return adjacentTextPairs > 0
  }
  
  /**
   * Get optimization statistics (enhanced for Phase 4.1)
   */
  static getOptimizationStats(originalSegments: ComponentSegment[], optimizedSegments: ComponentSegment[]): {
    originalCount: number
    optimizedCount: number
    reductionPercent: number
    textSegmentsMerged: number
  } {
    const reduction = originalSegments.length - optimizedSegments.length
    const reductionPercent = originalSegments.length > 0 
      ? Math.round((reduction / originalSegments.length) * 100) 
      : 0
    
    return {
      originalCount: originalSegments.length,
      optimizedCount: optimizedSegments.length,
      reductionPercent,
      textSegmentsMerged: reduction
    }
  }
  
  /**
   * Advanced optimization analysis for performance monitoring
   */
  static analyzeOptimizationOpportunities(segments: ComponentSegment[]): {
    totalSegments: number
    textSegments: number
    imageSegments: number
    interactiveSegments: number
    optimizableTextPairs: number
    estimatedReductionPercent: number
  } {
    let textSegments = 0
    let imageSegments = 0
    let interactiveSegments = 0
    let optimizableTextPairs = 0
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      const componentType = segment.component.constructor.name
      
      switch (componentType) {
        case 'EnhancedText':
          textSegments++
          // Check if next segment is also text and compatible
          if (i < segments.length - 1) {
            const nextSegment = segments[i + 1]
            if (this.canMergeTextSegments(segment, nextSegment)) {
              optimizableTextPairs++
            }
          }
          break
        case 'EnhancedImage':
          imageSegments++
          break
        case 'EnhancedButton':
        case 'EnhancedLinkComponent':
          interactiveSegments++
          break
      }
    }
    
    const estimatedReductionPercent = segments.length > 0
      ? Math.round((optimizableTextPairs / segments.length) * 100)
      : 0
    
    return {
      totalSegments: segments.length,
      textSegments,
      imageSegments,
      interactiveSegments,
      optimizableTextPairs,
      estimatedReductionPercent
    }
  }
}