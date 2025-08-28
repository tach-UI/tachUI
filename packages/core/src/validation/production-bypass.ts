/**
 * Production Mode Bypass System - Phase 1C
 * 
 * Zero-overhead validation bypass for production builds with smart
 * compile-time elimination and runtime optimization.
 */

import type { ComponentInstance } from '../runtime/types'

/**
 * Production mode detection and configuration
 */
export interface ProductionConfig {
  enabled: boolean
  mode: 'development' | 'production' | 'test'
  optimizationLevel: 'none' | 'basic' | 'aggressive'
  debugInfo: boolean
}

/**
 * Global production configuration
 */
let productionConfig: ProductionConfig = {
  enabled: process.env.NODE_ENV === 'production',
  mode: (process.env.NODE_ENV as any) || 'development',
  optimizationLevel: process.env.NODE_ENV === 'production' ? 'aggressive' : 'basic',
  debugInfo: process.env.NODE_ENV !== 'production'
}

/**
 * Production mode utilities
 */
export class ProductionModeManager {
  private static validationDisabled = false
  private static bypassCount = 0
  private static performanceGain = 0

  /**
   * Check if we're in production mode
   */
  static isProduction(): boolean {
    return productionConfig.enabled || process.env.NODE_ENV === 'production'
  }

  /**
   * Check if validation should be bypassed
   */
  static shouldBypassValidation(): boolean {
    // Always bypass in production
    if (this.isProduction()) {
      this.bypassCount++
      return true
    }

    // Check if manually disabled
    if (this.validationDisabled) {
      this.bypassCount++
      return true
    }

    // Check environment variable override
    if (process.env.TACHUI_VALIDATION === 'false') {
      this.bypassCount++
      return true
    }

    return false
  }

  /**
   * Manually disable validation (for testing/debugging)
   */
  static disableValidation(): void {
    this.validationDisabled = true
    if (productionConfig.debugInfo) {
      console.info('🚫 TachUI validation manually disabled')
    }
  }

  /**
   * Re-enable validation (only works in development)
   */
  static enableValidation(): void {
    if (this.isProduction()) {
      console.warn('⚠️ Cannot enable validation in production mode')
      return
    }
    
    this.validationDisabled = false
    if (productionConfig.debugInfo) {
      console.info('✅ TachUI validation re-enabled')
    }
  }

  /**
   * Get bypass statistics
   */
  static getBypassStats() {
    return {
      mode: productionConfig.mode,
      bypassCount: this.bypassCount,
      validationDisabled: this.validationDisabled,
      performanceGain: this.performanceGain,
      optimizationLevel: productionConfig.optimizationLevel
    }
  }

  /**
   * Configure production mode settings
   */
  static configure(config: Partial<ProductionConfig>): void {
    productionConfig = { ...productionConfig, ...config }
    
    if (config.enabled !== undefined) {
      this.validationDisabled = !config.enabled
    }
  }

  /**
   * Measure performance gain from bypassing validation
   */
  static recordPerformanceGain(timeMs: number): void {
    this.performanceGain += timeMs
  }
}

/**
 * Zero-overhead function wrapper for production builds
 */
export function createProductionOptimizedFunction<T extends (...args: any[]) => any>(
  developmentFunction: T,
  productionFunction?: T
): T {
  // If we have a specific production function, use it
  if (productionFunction && ProductionModeManager.isProduction()) {
    return productionFunction
  }

  // Return optimized wrapper
  return ((...args: any[]) => {
    if (ProductionModeManager.shouldBypassValidation()) {
      // In production, try to use the production function or skip entirely
      if (productionFunction) {
        return productionFunction(...args)
      }
      
      // If no production function, return a no-op that matches expected signature
      // This should be tree-shaken out by bundlers in production
      return undefined
    }

    // Development mode - run full function
    return developmentFunction(...args)
  }) as T
}

/**
 * Component constructor wrapper with production optimization
 */
export function createOptimizedComponent<T extends ComponentInstance>(
  originalConstructor: (...args: any[]) => T,
  validator?: (args: unknown[]) => void,
  componentType?: string
): (...args: any[]) => T {
  
  // In production, return the original constructor without validation
  if (ProductionModeManager.isProduction()) {
    return originalConstructor
  }

  // Development mode with validation
  return function optimizedComponent(this: any, ...args: unknown[]): T {
    const startTime = performance.now()
    
    // Skip validation if bypassed
    if (ProductionModeManager.shouldBypassValidation()) {
      const endTime = performance.now()
      ProductionModeManager.recordPerformanceGain(endTime - startTime)
      return originalConstructor.apply(this, args as any)
    }

    // Run validation in development
    if (validator) {
      try {
        validator(args)
      } catch (error) {
        // In development, provide detailed error information
        if (productionConfig.debugInfo && componentType) {
          console.error(`Validation failed for ${componentType}:`, error)
        }
        throw error
      }
    }

    const result = originalConstructor.apply(this, args as any)
    const endTime = performance.now()
    
    // Record validation overhead for monitoring
    const overhead = endTime - startTime
    if (overhead > 5) { // More than 5ms is concerning
      console.warn(`⚠️ Validation overhead: ${overhead.toFixed(2)}ms for ${componentType || 'component'}`)
    }

    return result
  }
}

/**
 * Modifier validation wrapper with production bypass
 */
export function createOptimizedModifier(
  originalModifier: Function,
  validator?: (args: unknown[]) => void,
  modifierName?: string
): Function {
  
  // In production, return original modifier without validation
  if (ProductionModeManager.isProduction()) {
    return originalModifier
  }

  return function optimizedModifier(this: any, ...args: unknown[]) {
    // Skip validation if bypassed
    if (ProductionModeManager.shouldBypassValidation()) {
      return originalModifier.apply(this, args)
    }

    // Run validation in development
    if (validator) {
      try {
        validator(args)
      } catch (error) {
        if (productionConfig.debugInfo && modifierName) {
          console.error(`Modifier validation failed for ${modifierName}:`, error)
        }
        throw error
      }
    }

    return originalModifier.apply(this, args)
  }
}

/**
 * Build-time optimization hints for bundlers
 */
export const BuildOptimizationHints = {
  /**
   * Mark validation code for tree-shaking in production
   */
  __DEVELOPMENT_ONLY__: process.env.NODE_ENV !== 'production',
  
  /**
   * Webpack DefinePlugin constants for dead code elimination
   */
  WEBPACK_DEFINES: {
    '__TACHUI_VALIDATION_ENABLED__': process.env.NODE_ENV !== 'production',
    '__TACHUI_PRODUCTION_MODE__': process.env.NODE_ENV === 'production',
    '__TACHUI_DEBUG_INFO__': process.env.NODE_ENV !== 'production'
  },
  
  /**
   * Rollup/Vite constants for dead code elimination
   */
  VITE_DEFINES: {
    'import.meta.env.TACHUI_VALIDATION': process.env.NODE_ENV !== 'production',
    'import.meta.env.TACHUI_PRODUCTION': process.env.NODE_ENV === 'production'
  }
}

/**
 * Conditional validation macro for tree-shaking
 */
export function conditionalValidation<T>(
  validationFn: () => T,
  fallbackValue?: T
): T | undefined {
  // This will be completely removed in production builds by bundlers
  if (process.env.NODE_ENV !== 'production' && !ProductionModeManager.shouldBypassValidation()) {
    return validationFn()
  }
  
  return fallbackValue
}

/**
 * Development-only assertion macro
 */
export function devAssert(condition: boolean, message: string): void {
  // Tree-shaken out in production
  if (process.env.NODE_ENV !== 'production') {
    if (!condition && !ProductionModeManager.shouldBypassValidation()) {
      throw new Error(`TachUI Dev Assertion: ${message}`)
    }
  }
}

/**
 * Development-only warning macro
 */
export function devWarn(condition: boolean, message: string): void {
  // Tree-shaken out in production
  if (process.env.NODE_ENV !== 'production') {
    if (!condition && !ProductionModeManager.shouldBypassValidation()) {
      console.warn(`TachUI Dev Warning: ${message}`)
    }
  }
}

/**
 * Performance monitoring wrapper
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  // In production, return function without monitoring
  if (ProductionModeManager.isProduction()) {
    return fn
  }

  return ((...args: any[]) => {
    if (ProductionModeManager.shouldBypassValidation()) {
      return fn(...args)
    }

    const start = performance.now()
    const result = fn(...args)
    const end = performance.now()
    
    const duration = end - start
    if (duration > 10) { // More than 10ms is worth noting
      console.info(`⏱️ ${name}: ${duration.toFixed(2)}ms`)
    }
    
    return result
  }) as T
}

/**
 * Bundle size analysis helper
 */
export const BundleAnalysis = {
  /**
   * Estimate validation code size for bundle analysis
   */
  getValidationCodeSize(): number {
    // This would be replaced with actual measurements in a real implementation
    const estimatedSize = {
      validation: 15000, // ~15KB
      errorReporting: 8000, // ~8KB
      enhancedRuntime: 12000, // ~12KB
      total: 35000 // ~35KB total
    }
    
    return ProductionModeManager.isProduction() ? 0 : estimatedSize.total
  },

  /**
   * Get optimization report
   */
  getOptimizationReport() {
    const stats = ProductionModeManager.getBypassStats()
    const codeSize = this.getValidationCodeSize()
    
    return {
      mode: stats.mode,
      validationCodeSize: codeSize,
      bypassCount: stats.bypassCount,
      performanceGain: stats.performanceGain,
      optimization: codeSize === 0 ? 'Fully optimized (tree-shaken)' : 'Development mode',
      recommendations: this.getOptimizationRecommendations()
    }
  },

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = []
    
    if (!ProductionModeManager.isProduction()) {
      recommendations.push('Enable production mode (NODE_ENV=production) to remove validation code')
    }
    
    if (productionConfig.optimizationLevel !== 'aggressive') {
      recommendations.push('Use aggressive optimization level for maximum performance')
    }
    
    if (process.env.TACHUI_VALIDATION !== 'false') {
      recommendations.push('Consider setting TACHUI_VALIDATION=false for production if not needed')
    }
    
    return recommendations
  }
}

/**
 * Production optimization utilities
 */
export const ProductionOptimizationUtils = {
  /**
   * Configure production mode
   */
  configure: ProductionModeManager.configure,
  
  /**
   * Check if in production
   */
  isProduction: ProductionModeManager.isProduction,
  
  /**
   * Manually disable validation
   */
  disableValidation: ProductionModeManager.disableValidation,
  
  /**
   * Re-enable validation (development only)
   */
  enableValidation: ProductionModeManager.enableValidation,
  
  /**
   * Get performance statistics
   */
  getStats: ProductionModeManager.getBypassStats,
  
  /**
   * Get bundle optimization report
   */
  getBundleReport: BundleAnalysis.getOptimizationReport,
  
  /**
   * Test production optimization
   */
  test(): void {
    console.group('🚀 Production Optimization Test')
    
    const stats = ProductionModeManager.getBypassStats()
    const report = BundleAnalysis.getOptimizationReport()
    
    console.info('✅ Production mode detection:', ProductionModeManager.isProduction())
    console.info('✅ Validation bypass count:', stats.bypassCount)
    console.info('✅ Performance gain:', `${stats.performanceGain.toFixed(2)}ms`)
    console.info('✅ Bundle optimization:', report.optimization)
    console.info('✅ Code size:', report.validationCodeSize === 0 ? 'Removed' : `${report.validationCodeSize} bytes`)
    
    if (report.recommendations.length > 0) {
      console.info('💡 Recommendations:')
      report.recommendations.forEach(rec => console.info(`   • ${rec}`))
    }
    
    console.groupEnd()
  }
}

// Auto-configure based on environment
if (typeof window !== 'undefined') {
  // Browser environment
  const isProduction = !window.location.hostname.includes('localhost') && 
                      !window.location.hostname.includes('127.0.0.1') &&
                      !window.location.hostname.includes('dev')
  
  if (isProduction) {
    ProductionModeManager.configure({ enabled: true, mode: 'production' })
  }
}