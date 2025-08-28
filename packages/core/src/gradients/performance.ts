/**
 * Gradient Performance Monitoring and Debugging Utilities
 * 
 * Tools for monitoring gradient performance, debugging rendering issues,
 * and optimizing gradient usage in production applications.
 */

import type { 
  GradientDefinition, 
  StateGradientOptions
} from './types'
import { GradientAnalysis } from './utils'
import { GradientValidation } from './validation'
import { gradientToCSS } from './css-generator'

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
export class GradientPerformanceMonitor {
  private static instance: GradientPerformanceMonitor
  private metrics: Map<string, GradientPerformanceMetrics> = new Map()
  private enabled: boolean = process.env.NODE_ENV === 'development'
  private totalMetrics: {
    totalGradients: number
    totalResolutions: number
    totalCacheHits: number
    totalCacheMisses: number
    averageComplexity: number
    memoryPressure: number
  } = {
    totalGradients: 0,
    totalResolutions: 0,
    totalCacheHits: 0,
    totalCacheMisses: 0,
    averageComplexity: 0,
    memoryPressure: 0
  }

  static getInstance(): GradientPerformanceMonitor {
    if (!GradientPerformanceMonitor.instance) {
      GradientPerformanceMonitor.instance = new GradientPerformanceMonitor()
    }
    return GradientPerformanceMonitor.instance
  }

  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * Track gradient creation
   */
  trackCreation(gradientId: string, gradient: GradientDefinition): void {
    if (!this.enabled) return

    const startTime = performance.now()
    const complexityScore = GradientAnalysis.getComplexityScore(gradient)
    const endTime = performance.now()

    const metrics: GradientPerformanceMetrics = {
      creationTime: endTime - startTime,
      resolutionTime: 0,
      cssGenerationTime: 0,
      memoryUsage: this.estimateMemoryUsage(gradient),
      cacheHits: 0,
      cacheMisses: 0,
      complexityScore,
      renderCount: 0
    }

    this.metrics.set(gradientId, metrics)
    this.updateTotalMetrics()
  }

  /**
   * Track gradient resolution (conversion to CSS)
   */
  trackResolution(gradientId: string, fromCache: boolean = false): void {
    if (!this.enabled) return

    const startTime = performance.now()
    const metrics = this.metrics.get(gradientId)
    
    if (metrics) {
      const endTime = performance.now()
      metrics.resolutionTime += endTime - startTime
      metrics.renderCount++
      
      if (fromCache) {
        metrics.cacheHits++
        this.totalMetrics.totalCacheHits++
      } else {
        metrics.cacheMisses++
        this.totalMetrics.totalCacheMisses++
      }
      
      this.totalMetrics.totalResolutions++
    }
  }

  /**
   * Track CSS generation time
   */
  trackCSSGeneration(gradientId: string, generationTime: number): void {
    if (!this.enabled) return

    const metrics = this.metrics.get(gradientId)
    if (metrics) {
      metrics.cssGenerationTime += generationTime
    }
  }

  /**
   * Get performance metrics for a specific gradient
   */
  getMetrics(gradientId: string): GradientPerformanceMetrics | undefined {
    return this.metrics.get(gradientId)
  }

  /**
   * Get overall performance summary
   */
  getSummary() {
    const gradients = Array.from(this.metrics.entries())
    
    // Sort by efficiency (cache hit ratio and low complexity)
    const sorted = gradients.sort((entryA, entryB) => {
      const [, a] = entryA
      const [, b] = entryB
      const aEfficiency = a.cacheHits / (a.cacheHits + a.cacheMisses + 1)
      const bEfficiency = b.cacheHits / (b.cacheHits + b.cacheMisses + 1)
      return bEfficiency - aEfficiency
    })

    const topPerformers = sorted.slice(0, 5).map(([id, metrics]) => ({ id, metrics }))
    const poorPerformers = sorted.slice(-5).map(([id, metrics]) => ({ id, metrics }))

    return {
      totalMetrics: this.totalMetrics,
      topPerformers,
      poorPerformers,
      recommendations: this.generateRecommendations()
    }
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear()
    this.totalMetrics = {
      totalGradients: 0,
      totalResolutions: 0,
      totalCacheHits: 0,
      totalCacheMisses: 0,
      averageComplexity: 0,
      memoryPressure: 0
    }
  }

  /**
   * Export metrics to JSON for analysis
   */
  exportMetrics(): string {
    return JSON.stringify({
      totalMetrics: this.totalMetrics,
      gradientMetrics: Object.fromEntries(this.metrics),
      timestamp: Date.now(),
      environment: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js',
        memory: typeof performance !== 'undefined' && 'memory' in performance 
          ? (performance as any).memory 
          : null
      }
    }, null, 2)
  }

  private estimateMemoryUsage(gradient: GradientDefinition): number {
    let size = 0
    
    // Base gradient object
    size += 100
    
    if ('colors' in gradient.options) {
      size += gradient.options.colors.length * 20 // ~20 bytes per color string
      size += gradient.options.stops ? gradient.options.stops.length * 8 : 0 // 8 bytes per number
    }
    
    // Additional complexity overhead
    const complexity = GradientAnalysis.getComplexityScore(gradient)
    size += complexity * 10
    
    return size
  }

  private updateTotalMetrics(): void {
    this.totalMetrics.totalGradients = this.metrics.size
    
    const complexities = Array.from(this.metrics.values()).map(m => m.complexityScore)
    this.totalMetrics.averageComplexity = complexities.length > 0
      ? complexities.reduce((a, b) => a + b, 0) / complexities.length
      : 0
    
    const totalMemory = Array.from(this.metrics.values()).reduce((sum, m) => sum + m.memoryUsage, 0)
    this.totalMetrics.memoryPressure = totalMemory
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = []
    
    // Cache efficiency
    const cacheHitRatio = this.totalMetrics.totalCacheHits / 
      (this.totalMetrics.totalCacheHits + this.totalMetrics.totalCacheMisses)
    
    if (cacheHitRatio < 0.7) {
      recommendations.push('Consider using StateGradientAsset for frequently used gradients to improve caching')
    }
    
    // Complexity analysis
    if (this.totalMetrics.averageComplexity > 8) {
      recommendations.push('Average gradient complexity is high. Consider simplifying gradients or using presets')
    }
    
    // Memory pressure
    if (this.totalMetrics.memoryPressure > 50000) {
      recommendations.push('High memory usage detected. Consider cleanup of unused gradients')
    }
    
    // High render count gradients
    const highRenderGradients = Array.from(this.metrics.entries())
      .filter(([, metrics]) => metrics.renderCount > 100)
    
    if (highRenderGradients.length > 0) {
      recommendations.push(`${highRenderGradients.length} gradients are rendered frequently. Ensure they use caching`)
    }
    
    return recommendations
  }
}

/**
 * Gradient debugging utilities
 */
export const GradientDebugger = {
  /**
   * Validate and debug a gradient configuration
   */
  debugGradient: (gradient: GradientDefinition): {
    isValid: boolean
    errors: string[]
    warnings: string[]
    performance: {
      complexity: number
      impact: 'low' | 'medium' | 'high'
      recommendations: string[]
    }
    cssOutput: string
  } => {
    // Validation
    const validation = GradientValidation.validateGradient(gradient)
    
    // Performance analysis
    const complexity = GradientAnalysis.getComplexityScore(gradient)
    const impact = GradientAnalysis.getPerformanceImpact(gradient)
    
    // Warnings
    const warnings: string[] = []
    if (complexity > 10) {
      warnings.push('High complexity gradient may impact performance')
    }
    if (GradientAnalysis.hasTransparency(gradient)) {
      warnings.push('Gradient uses transparency which may affect compositing performance')
    }
    if (GradientAnalysis.getColorCount(gradient) > 5) {
      warnings.push('Many colors in gradient may cause banding on some devices')
    }
    
    // Performance recommendations
    const recommendations: string[] = []
    if (impact === 'high') {
      recommendations.push('Consider simplifying the gradient or using a preset')
      recommendations.push('Cache this gradient if used frequently')
    }
    if (complexity > 15) {
      recommendations.push('Consider breaking complex gradient into simpler components')
    }
    
    // CSS generation (with error handling)
    let cssOutput = ''
    try {
      cssOutput = gradientToCSS(gradient)
    } catch (error) {
      cssOutput = `Error generating CSS: ${(error as Error).message}`
    }
    
    return {
      isValid: validation.valid,
      errors: validation.errors,
      warnings,
      performance: {
        complexity,
        impact,
        recommendations
      },
      cssOutput
    }
  },

  /**
   * Debug state gradient configuration
   */
  debugStateGradient: (stateGradient: StateGradientOptions): {
    isValid: boolean
    errors: string[]
    warnings: string[]
    stateAnalysis: Record<string, any>
  } => {
    const validation = GradientValidation.validateStateGradientOptions(stateGradient)
    const warnings: string[] = []
    const stateAnalysis: Record<string, any> = {}
    
    // Analyze each state
    Object.entries(stateGradient).forEach(([state, value]) => {
      if (state === 'animation') return
      
      stateAnalysis[state] = {
        type: typeof value === 'string' ? 'string' : 
              value && 'type' in value ? 'gradient' : 'asset',
        complexity: value && typeof value === 'object' && 'type' in value
          ? GradientAnalysis.getComplexityScore(value as GradientDefinition)
          : 1
      }
    })
    
    // Check animation settings
    if (stateGradient.animation) {
      if (stateGradient.animation.duration && stateGradient.animation.duration > 500) {
        warnings.push('Long animation duration may feel sluggish')
      }
      if (stateGradient.animation.duration && stateGradient.animation.duration < 50) {
        warnings.push('Very short animation duration may not be noticeable')
      }
    }
    
    return {
      isValid: validation.valid,
      errors: validation.errors,
      warnings,
      stateAnalysis
    }
  },

  /**
   * Performance profiler for gradient operations
   */
  profileOperation: <T>(name: string, operation: () => T): T => {
    if (process.env.NODE_ENV !== 'development') {
      return operation()
    }
    
    const startTime = performance.now()
    const result = operation()
    const endTime = performance.now()
    
    console.log(`Gradient operation "${name}" took ${(endTime - startTime).toFixed(2)}ms`)
    
    return result
  },

  /**
   * CSS analyzer for generated gradients
   */
  analyzeCSS: (css: string): {
    browserSupport: string[]
    fallbackRecommended: boolean
    performanceNotes: string[]
  } => {
    const browserSupport: string[] = []
    const performanceNotes: string[] = []
    let fallbackRecommended = false
    
    // Check for advanced CSS features
    if (css.includes('conic-gradient')) {
      browserSupport.push('Chrome 69+', 'Firefox 83+', 'Safari 12.1+')
      fallbackRecommended = true
    }
    
    if (css.includes('linear-gradient')) {
      browserSupport.push('All modern browsers')
    }
    
    if (css.includes('radial-gradient')) {
      browserSupport.push('All modern browsers')
    }
    
    // Performance analysis
    const colorMatches = css.match(/#[0-9a-f]{6}|rgb\([^)]+\)|hsl\([^)]+\)/gi) || []
    if (colorMatches.length > 5) {
      performanceNotes.push('Many colors may cause performance impact on low-end devices')
    }
    
    if (css.includes('repeating-')) {
      performanceNotes.push('Repeating gradients can be GPU-intensive')
    }
    
    return {
      browserSupport,
      fallbackRecommended,
      performanceNotes
    }
  }
} as const

/**
 * Development-time gradient inspector
 */
export const GradientInspector = {
  /**
   * Log gradient information to console (development only)
   */
  inspect: (gradient: GradientDefinition | StateGradientOptions, label?: string): void => {
    if (process.env.NODE_ENV !== 'development') return
    
    console.group(`🎨 Gradient Inspector${label ? ` - ${label}` : ''}`)
    
    if ('type' in gradient) {
      // Regular gradient
      const debug = GradientDebugger.debugGradient(gradient)
      console.log('Type:', gradient.type)
      console.log('Valid:', debug.isValid)
      console.log('Complexity:', debug.performance.complexity)
      console.log('Performance Impact:', debug.performance.impact)
      console.log('CSS:', debug.cssOutput)
      
      if (debug.errors.length > 0) {
        console.error('Errors:', debug.errors)
      }
      if (debug.warnings.length > 0) {
        console.warn('Warnings:', debug.warnings)
      }
    } else {
      // State gradient
      const debug = GradientDebugger.debugStateGradient(gradient)
      console.log('Type: State Gradient')
      console.log('Valid:', debug.isValid)
      console.log('States:', Object.keys(debug.stateAnalysis))
      console.table(debug.stateAnalysis)
      
      if (debug.errors.length > 0) {
        console.error('Errors:', debug.errors)
      }
      if (debug.warnings.length > 0) {
        console.warn('Warnings:', debug.warnings)
      }
    }
    
    console.groupEnd()
  },

  /**
   * Track gradient usage in components
   */
  trackUsage: (componentName: string, gradientType: string): void => {
    if (process.env.NODE_ENV !== 'development') return
    
    const monitor = GradientPerformanceMonitor.getInstance()
    monitor.trackCreation(`${componentName}-${gradientType}`, {
      type: 'linear',
      options: { colors: ['#000', '#fff'], startPoint: 'top', endPoint: 'bottom' }
    } as GradientDefinition)
  },

  /**
   * Generate performance report
   */
  generateReport: (): void => {
    if (process.env.NODE_ENV !== 'development') return
    
    const monitor = GradientPerformanceMonitor.getInstance()
    const summary = monitor.getSummary()
    
    console.group('📊 Gradient Performance Report')
    console.table(summary.totalMetrics)
    
    if (summary.recommendations.length > 0) {
      console.group('💡 Recommendations')
      summary.recommendations.forEach(rec => console.log(`• ${rec}`))
      console.groupEnd()
    }
    
    if (summary.poorPerformers.length > 0) {
      console.group('⚠️ Poor Performers')
      console.table(summary.poorPerformers.map(p => ({ id: p.id, ...p.metrics })))
      console.groupEnd()
    }
    
    console.groupEnd()
  }
} as const

/**
 * Export performance monitoring singleton
 */
export const gradientPerformanceMonitor = GradientPerformanceMonitor.getInstance()