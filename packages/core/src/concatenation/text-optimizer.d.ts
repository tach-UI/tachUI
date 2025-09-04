/**
 * Text Concatenation Optimizer (Enhanced - Phase 4.1)
 *
 * Optimizes concatenated text components by merging adjacent text segments
 * with compatible modifiers to improve performance and reduce DOM complexity.
 *
 * Enhanced with caching and advanced optimization strategies.
 */
import type { ComponentSegment } from './types'
/**
 * Text-specific concatenation optimizer
 */
export declare class TextConcatenationOptimizer {
  /**
   * Optimize an array of segments by merging compatible adjacent text segments
   * Enhanced with caching and performance monitoring
   */
  static optimize(segments: ComponentSegment[]): ComponentSegment[]
  /**
   * Core optimization algorithm separated for clarity
   */
  private static performOptimization
  /**
   * Generate a cache key from segments
   */
  private static generateCacheKey
  /**
   * Hash modifiers for cache key generation
   */
  private static hashModifiers
  /**
   * Simple hash function fallback for environments without btoa
   */
  private static simpleHash
  /**
   * Get cached optimization result
   */
  private static getCachedOptimization
  /**
   * Cache optimization result
   */
  private static cacheOptimization
  /**
   * Clear optimization cache (useful for testing)
   */
  static clearCache(): void
  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    size: number
    maxSize: number
    hitRate: number
  }
  /**
   * Check if two segments can be merged
   */
  private static canMergeTextSegments
  /**
   * Check if two modifier arrays are compatible for merging
   */
  private static modifiersCompatible
  /**
   * Check if two modifiers are equal (simplified comparison)
   */
  private static modifierEqual
  /**
   * Merge two text segments into a single segment
   */
  private static mergeTextSegments
  /**
   * Extract text content from a text component
   */
  private static extractTextContent
  /**
   * Create a new merged text component
   */
  private static createMergedTextComponent
  /**
   * Analyze segments and determine if optimization would be beneficial
   */
  static shouldOptimize(segments: ComponentSegment[]): boolean
  /**
   * Get optimization statistics (enhanced for Phase 4.1)
   */
  static getOptimizationStats(
    originalSegments: ComponentSegment[],
    optimizedSegments: ComponentSegment[]
  ): {
    originalCount: number
    optimizedCount: number
    reductionPercent: number
    textSegmentsMerged: number
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
  }
}
//# sourceMappingURL=text-optimizer.d.ts.map
