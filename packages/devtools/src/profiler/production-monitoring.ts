/**
 * Production Mode Monitoring and Analysis
 *
 * Development tools for monitoring production optimization effectiveness,
 * performance tracking, and bundle analysis.
 *
 * Moved from @tachui/core for proper separation of dev vs production concerns.
 */

/**
 * Enhanced production configuration with debugging
 */
export interface EnhancedProductionConfig {
  enabled: boolean
  mode: 'development' | 'production' | 'test'
  optimizationLevel: 'none' | 'basic' | 'aggressive'
  debugInfo: boolean
}

/**
 * Performance statistics for production optimization
 */
interface PerformanceStats {
  bypassCount: number
  performanceGain: number
  averageOverhead: number
  slowValidations: Array<{ component: string; time: number }>
}

/**
 * Bundle analysis report
 */
interface BundleOptimizationReport {
  validationCodeSize: number
  performanceGain: number
  optimization: string
  recommendations: string[]
}

/**
 * Production monitoring and analysis
 */
export class ProductionMonitor {
  private static instance: ProductionMonitor
  private bypassCount = 0
  private performanceGain = 0
  private validationTimes: number[] = []
  private slowValidations: Array<{ component: string; time: number }> = []

  static getInstance(): ProductionMonitor {
    if (!this.instance) {
      this.instance = new ProductionMonitor()
    }
    return this.instance
  }

  /**
   * Record a validation bypass for performance tracking
   */
  recordBypass(timesSaved: number): void {
    this.bypassCount++
    this.performanceGain += timesSaved
  }

  /**
   * Record validation performance
   */
  recordValidationTime(componentType: string, duration: number): void {
    this.validationTimes.push(duration)

    if (duration > 5) {
      // More than 5ms is concerning
      this.slowValidations.push({ component: componentType, time: duration })
      console.warn(
        `⚠️ Validation overhead: ${duration.toFixed(2)}ms for ${componentType}`
      )
    }

    // Keep only recent measurements
    if (this.validationTimes.length > 100) {
      this.validationTimes = this.validationTimes.slice(-50)
    }

    if (this.slowValidations.length > 20) {
      this.slowValidations = this.slowValidations.slice(-10)
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): PerformanceStats {
    const averageOverhead =
      this.validationTimes.length > 0
        ? this.validationTimes.reduce((sum, time) => sum + time, 0) /
          this.validationTimes.length
        : 0

    return {
      bypassCount: this.bypassCount,
      performanceGain: this.performanceGain,
      averageOverhead,
      slowValidations: [...this.slowValidations],
    }
  }

  /**
   * Reset monitoring statistics
   */
  reset(): void {
    this.bypassCount = 0
    this.performanceGain = 0
    this.validationTimes = []
    this.slowValidations = []
  }

  /**
   * Generate optimization recommendations
   */
  getRecommendations(): string[] {
    const recommendations: string[] = []
    const stats = this.getStats()

    if (stats.averageOverhead > 3) {
      recommendations.push(
        'Consider reducing validation complexity - average overhead is high'
      )
    }

    if (stats.slowValidations.length > 5) {
      recommendations.push(
        'Multiple slow validation operations detected - review component validators'
      )
    }

    if (stats.bypassCount === 0 && process.env.NODE_ENV === 'production') {
      recommendations.push(
        'Validation bypass not working - check production build configuration'
      )
    }

    return recommendations
  }
}

/**
 * Bundle size analysis
 */
export class BundleAnalysis {
  /**
   * Estimate validation code size in bundle
   */
  static getValidationCodeSize(): number {
    // This is a rough estimate - in practice this would be more sophisticated
    if (process.env.NODE_ENV === 'production') {
      return 0 // Should be tree-shaken in production
    }

    // Rough estimate of validation code size in development
    return 15000 // ~15KB estimated validation code size
  }

  /**
   * Generate optimization report
   */
  static getOptimizationReport(): BundleOptimizationReport {
    const monitor = ProductionMonitor.getInstance()
    const stats = monitor.getStats()
    const codeSize = this.getValidationCodeSize()

    return {
      validationCodeSize: codeSize,
      performanceGain: stats.performanceGain,
      optimization:
        codeSize === 0 ? 'Fully optimized (tree-shaken)' : 'Development mode',
      recommendations: monitor.getRecommendations(),
    }
  }
}

/**
 * Development-only assertion macro with detailed reporting
 */
export function devAssert(
  condition: boolean,
  message: string,
  context?: any
): void {
  if (typeof window !== 'undefined' && (window as any).__TACHUI_DEV_MODE__) {
    if (!condition) {
      console.error('TachUI Dev Assertion Failed:', message, context)
      if (context) {
        console.trace('Assertion context:', context)
      }
      throw new Error(`TachUI Dev Assertion: ${message}`)
    }
  }
}

/**
 * Development-only warning macro with enhanced reporting
 */
export function devWarn(
  condition: boolean,
  message: string,
  context?: any
): void {
  if (typeof window !== 'undefined' && (window as any).__TACHUI_DEV_MODE__) {
    if (!condition) {
      console.warn(`TachUI Dev Warning: ${message}`, context)
      if (context) {
        console.trace('Warning context:', context)
      }
    }
  }
}

/**
 * Enhanced performance monitoring wrapper
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => any>(
  fn: T,
  name: string,
  options: {
    threshold?: number
    logSlow?: boolean
    trackStats?: boolean
  } = {}
): T {
  const { threshold = 10, logSlow = true, trackStats = true } = options

  return function monitoredFunction(...args: any[]): ReturnType<T> {
    const start = performance.now()
    const result = fn(...args)
    const end = performance.now()

    const duration = end - start

    if (trackStats) {
      ProductionMonitor.getInstance().recordValidationTime(name, duration)
    }

    if (logSlow && duration > threshold) {
      console.info(`⏱️ ${name}: ${duration.toFixed(2)}ms`)
    }

    return result
  } as T
}

/**
 * Component validation wrapper with performance monitoring
 */
export function withMonitoredValidation<T extends (...args: any[]) => any>(
  originalConstructor: T,
  componentType: string,
  validator?: (args: unknown[]) => void
): T {
  return function monitoredComponent(this: any, ...args: unknown[]): T {
    const startTime = performance.now()

    // Run validation with monitoring
    if (validator) {
      try {
        validator(args)
      } catch (error) {
        console.error(`Validation failed for ${componentType}:`, error)
        throw error
      }
    }

    const result = originalConstructor.apply(this, args as any)
    const endTime = performance.now()

    // Record performance
    const duration = endTime - startTime
    ProductionMonitor.getInstance().recordValidationTime(
      componentType,
      duration
    )

    return result
  } as T
}

/**
 * Development build constants (for tree-shaking)
 */
export const DevConstants = {
  __DEVELOPMENT_ONLY__: process.env.NODE_ENV !== 'production',
  __TACHUI_VERSION__: '0.1.0',

  // Define globals for bundlers to replace
  defineGlobals: {
    __TACHUI_PRODUCTION_MODE__: process.env.NODE_ENV === 'production',
    __TACHUI_DEBUG_INFO__: process.env.NODE_ENV !== 'production',
  },
}

/**
 * Production optimization utilities with monitoring
 */
export const ProductionOptimizationUtils = {
  /**
   * Get detailed performance statistics
   */
  getDetailedStats: () => {
    const monitor = ProductionMonitor.getInstance()
    return {
      ...monitor.getStats(),
      recommendations: monitor.getRecommendations(),
      bundleReport: BundleAnalysis.getOptimizationReport(),
    }
  },

  /**
   * Reset monitoring data
   */
  resetStats: () => ProductionMonitor.getInstance().reset(),

  /**
   * Get bundle optimization report
   */
  getBundleReport: BundleAnalysis.getOptimizationReport,

  /**
   * Test production optimization with detailed reporting
   */
  test(): void {
    console.group('🚀 Production Optimization Analysis')

    const stats = ProductionMonitor.getInstance().getStats()
    const report = BundleAnalysis.getOptimizationReport()

    console.info('📊 Performance Statistics:')
    console.info('  • Validation bypasses:', stats.bypassCount)
    console.info(
      '  • Performance gain:',
      `${stats.performanceGain.toFixed(2)}ms`
    )
    console.info(
      '  • Average overhead:',
      `${stats.averageOverhead.toFixed(2)}ms`
    )
    console.info('  • Slow validations:', stats.slowValidations.length)

    console.info('📦 Bundle Optimization:')
    console.info('  • Bundle status:', report.optimization)
    console.info(
      '  • Validation code size:',
      report.validationCodeSize === 0
        ? 'Tree-shaken ✅'
        : `${report.validationCodeSize} bytes`
    )

    if (report.recommendations.length > 0) {
      console.info('💡 Optimization Recommendations:')
      report.recommendations.forEach(rec => console.info(`   • ${rec}`))
    } else {
      console.info(
        '✅ No optimization recommendations - system is running efficiently'
      )
    }

    if (stats.slowValidations.length > 0) {
      console.info('⚠️ Slow Validations:')
      stats.slowValidations.forEach(slow =>
        console.info(`   • ${slow.component}: ${slow.time.toFixed(2)}ms`)
      )
    }

    console.groupEnd()
  },

  /**
   * Start continuous monitoring
   */
  startMonitoring(intervalMs = 30000): () => void {
    const monitor = ProductionMonitor.getInstance()

    const interval = setInterval(() => {
      const stats = monitor.getStats()
      if (stats.slowValidations.length > 0) {
        console.warn(
          '⚠️ TachUI Performance Alert: Slow validation operations detected'
        )
      }
    }, intervalMs)

    console.info('🔍 TachUI production monitoring started')

    return () => {
      clearInterval(interval)
      console.info('🔍 TachUI production monitoring stopped')
    }
  },
}
