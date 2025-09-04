/**
 * Gradient Performance Monitoring and Debugging Utilities
 *
 * Tools for monitoring gradient performance, debugging rendering issues,
 * and optimizing gradient usage in production applications.
 */
import type { GradientDefinition, StateGradientOptions } from './types'
/**
 * Performance metrics for gradient operations
 */
interface GradientPerformanceMetrics {
  creationTime: number
  resolutionTime: number
  cssGenerationTime: number
  memoryUsage: number
  cacheHits: number
  cacheMisses: number
  complexityScore: number
  renderCount: number
}
/**
 * Performance monitoring for gradients
 */
export declare class GradientPerformanceMonitor {
  private static instance
  private metrics
  private enabled
  private totalMetrics
  static getInstance(): GradientPerformanceMonitor
  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled: boolean): void
  /**
   * Track gradient creation
   */
  trackCreation(gradientId: string, gradient: GradientDefinition): void
  /**
   * Track gradient resolution (conversion to CSS)
   */
  trackResolution(gradientId: string, fromCache?: boolean): void
  /**
   * Track CSS generation time
   */
  trackCSSGeneration(gradientId: string, generationTime: number): void
  /**
   * Get performance metrics for a specific gradient
   */
  getMetrics(gradientId: string): GradientPerformanceMetrics | undefined
  /**
   * Get overall performance summary
   */
  getSummary(): {
    totalMetrics: {
      totalGradients: number
      totalResolutions: number
      totalCacheHits: number
      totalCacheMisses: number
      averageComplexity: number
      memoryPressure: number
    }
    topPerformers: {
      id: string
      metrics: GradientPerformanceMetrics
    }[]
    poorPerformers: {
      id: string
      metrics: GradientPerformanceMetrics
    }[]
    recommendations: string[]
  }
  /**
   * Reset all metrics
   */
  reset(): void
  /**
   * Export metrics to JSON for analysis
   */
  exportMetrics(): string
  private estimateMemoryUsage
  private updateTotalMetrics
  private generateRecommendations
}
/**
 * Gradient debugging utilities
 */
export declare const GradientDebugger: {
  /**
   * Validate and debug a gradient configuration
   */
  readonly debugGradient: (gradient: GradientDefinition) => {
    isValid: boolean
    errors: string[]
    warnings: string[]
    performance: {
      complexity: number
      impact: 'low' | 'medium' | 'high'
      recommendations: string[]
    }
    cssOutput: string
  }
  /**
   * Debug state gradient configuration
   */
  readonly debugStateGradient: (stateGradient: StateGradientOptions) => {
    isValid: boolean
    errors: string[]
    warnings: string[]
    stateAnalysis: Record<string, any>
  }
  /**
   * Performance profiler for gradient operations
   */
  readonly profileOperation: <T>(name: string, operation: () => T) => T
  /**
   * CSS analyzer for generated gradients
   */
  readonly analyzeCSS: (css: string) => {
    browserSupport: string[]
    fallbackRecommended: boolean
    performanceNotes: string[]
  }
}
/**
 * Development-time gradient inspector
 */
export declare const GradientInspector: {
  /**
   * Log gradient information to console (development only)
   */
  readonly inspect: (
    gradient: GradientDefinition | StateGradientOptions,
    label?: string
  ) => void
  /**
   * Track gradient usage in components
   */
  readonly trackUsage: (componentName: string, gradientType: string) => void
  /**
   * Generate performance report
   */
  readonly generateReport: () => void
}
/**
 * Export performance monitoring singleton
 */
export declare const gradientPerformanceMonitor: GradientPerformanceMonitor

//# sourceMappingURL=performance.d.ts.map
