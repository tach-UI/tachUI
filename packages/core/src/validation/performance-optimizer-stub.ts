/**
 * Performance Optimizer Stub - Lightweight Production Version
 *
 * Minimal performance optimizer for production builds.
 * Full implementation moved to @tachui/devtools package.
 */

export interface PerformanceOptimizerConfig {
  enabled: boolean
  targetOverhead: number
  batchSize: number
  cacheStrategy: 'aggressive' | 'moderate' | 'conservative'
  asyncValidation: boolean
  throttleMs: number
  skipFrames: number
}

export interface ValidationMetrics {
  operationCount: number
  totalTime: number
  averageTime: number
  maxTime: number
  cacheHitRate: number
  skipRate: number
}

/**
 * Lightweight performance optimizer stub for production
 */
class PerformanceOptimizerStub {
  private static instance: PerformanceOptimizerStub

  static getInstance(): PerformanceOptimizerStub {
    if (!this.instance) {
      this.instance = new PerformanceOptimizerStub()
    }
    return this.instance
  }

  configure(_config: Partial<PerformanceOptimizerConfig>): void {
    // No-op in production stub
  }

  optimizeValidation<T>(_key: string, validationFn: () => T): T {
    // In production, just execute the function directly
    return validationFn()
  }

  getMetrics(
    _key?: string
  ): ValidationMetrics | Map<string, ValidationMetrics> | undefined {
    // Return empty metrics in production
    if (_key) {
      return undefined
    }
    return new Map()
  }

  resetMetrics(): void {
    // No-op in production stub
  }
}

export const performanceOptimizer = PerformanceOptimizerStub.getInstance()

export const PerformanceOptimizationUtils = {
  configure: (_config: Partial<PerformanceOptimizerConfig>) => {},
  getMetrics: (_key?: string) =>
    _key ? undefined : new Map<string, ValidationMetrics>(),
  resetMetrics: () => {},
  getStats: () => ({
    enabled: false,
    targetOverhead: 5,
    batchSize: 10,
    cacheStrategy: 'moderate' as const,
    metricsCount: 0,
    note: 'Production stub - full implementation available in @tachui/devtools',
  }),
}
