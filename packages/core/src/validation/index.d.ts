/**
 * TachUI Validation System - Complete Implementation (Phases 1A-1D)
 *
 * Complete validation system with smart error recovery, enhanced error reporting,
 * production optimization, lifecycle validation, comprehensive debugging tools,
 * and full developer experience integration.
 */
export * from './plugin-registration'
export * from './production-bypass-core'
export * from './lifecycle-validation'
export * from './debug-tools-stub'
export * from './build-time-stub'
/**
 * Enhanced Development Tools (Phases 1A-1D Complete)
 */
export declare const ValidationDevTools: {
  /**
   * Log all validation rules including all phase enhancements
   */
  logValidationRules(): void
  /**
   * Test complete validation system including Phase 1D
   */
  test(): Promise<void>
  /**
   * Get comprehensive validation statistics including all phases
   */
  getStats(): Promise<
    | {
        phase: string
        features: string[]
        note: string
        movedTo: string
        runtime: {
          note: string
        }
        enhanced: {
          note: string
        }
        debug: {
          available: boolean
          movedTo: string
        }
        performance: {
          enabled: boolean
          targetOverhead: number
          batchSize: number
          cacheStrategy: 'moderate'
          metricsCount: number
          note: string
        }
        production: {
          isProduction: boolean
          mode: 'development' | 'production' | 'test'
          validationDisabled: boolean
        }
        lifecycle: {
          totalComponents: number
          failedValidations: number
          memoryLeakDetections: number
          phaseStats: Record<
            string,
            {
              count: number
              averageTime: number
              maxTime: number
            }
          >
          config: import('./lifecycle-validation').LifecycleValidationConfig
          memoryUsage: {
            current: number
            average: number
            trend: number
          } | null
        }
        error?: undefined
      }
    | {
        error: string
      }
  >
}
/**
 * Quick setup utilities for different validation modes
 */
export declare const ValidationSetup: {
  /**
   * Development mode with full validation
   */
  development(): Promise<
    | {
        note: string
        fallback?: undefined
      }
    | {
        fallback: boolean
        note?: undefined
      }
  >
  /**
   * Production mode with zero overhead
   */
  production(): Promise<
    | {
        optimized: boolean
        fallback?: undefined
      }
    | {
        fallback: boolean
        optimized?: undefined
      }
  >
  /**
   * Testing mode with detailed validation
   */
  testing(): Promise<
    | {
        testMode: boolean
        fallback?: undefined
      }
    | {
        fallback: boolean
        testMode?: undefined
      }
  >
}
//# sourceMappingURL=index.d.ts.map
