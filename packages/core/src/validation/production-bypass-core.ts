/**
 * Production Mode Bypass - Core Utilities
 *
 * Essential production detection and optimization utilities.
 * Development/debugging functionality moved to @tachui/devtools.
 */

/**
 * Production mode configuration (minimal)
 */
export interface ProductionConfig {
  enabled: boolean
  mode: 'development' | 'production' | 'test'
}

/**
 * Global production configuration
 */
let productionConfig: ProductionConfig = {
  enabled: process.env.NODE_ENV === 'production',
  mode: (process.env.NODE_ENV as any) || 'development',
}

/**
 * Core production mode utilities
 */
export class ProductionModeManager {
  private static validationDisabled = false

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
    return this.isProduction() || this.validationDisabled
  }

  /**
   * Configure production mode
   */
  static configure(config: Partial<ProductionConfig>): void {
    productionConfig = { ...productionConfig, ...config }
  }

  /**
   * Manually disable validation (minimal implementation)
   */
  static disableValidation(): void {
    this.validationDisabled = true
  }

  /**
   * Re-enable validation (minimal implementation)
   */
  static enableValidation(): void {
    if (!this.isProduction()) {
      this.validationDisabled = false
    }
  }

  /**
   * Get basic production info
   */
  static getInfo() {
    return {
      isProduction: this.isProduction(),
      mode: productionConfig.mode,
      validationDisabled: this.validationDisabled,
    }
  }
}

/**
 * Create production-optimized function
 */
export function createProductionOptimizedFunction<
  T extends (...args: any[]) => any,
>(developmentFunction: T, productionFunction?: T): T {
  return function optimizedFunction(...args: any[]): ReturnType<T> {
    if (ProductionModeManager.shouldBypassValidation() && productionFunction) {
      return productionFunction(...args)
    }

    // Development mode - run full function
    return developmentFunction(...args)
  } as T
}

/**
 * Production-optimized component wrapper (minimal version)
 */
export function withProductionOptimization<T extends (...args: any[]) => any>(
  originalConstructor: T,
  validator?: (args: unknown[]) => void
): T {
  // In production, just return the constructor without validation
  if (ProductionModeManager.isProduction()) {
    return originalConstructor
  }

  // Development mode - run validation if provided
  return function optimizedComponent(this: any, ...args: unknown[]): T {
    if (validator) {
      validator(args)
    }

    return originalConstructor.apply(this, args as any)
  } as T
}

/**
 * Production-optimized modifier wrapper (minimal version)
 */
export function withProductionOptimizedModifier<
  T extends (...args: any[]) => any,
>(originalModifier: T, validator?: (args: unknown[]) => void): T {
  // In production, skip validation
  if (ProductionModeManager.isProduction()) {
    return originalModifier
  }

  // Development mode with validation
  return function optimizedModifier(this: any, ...args: unknown[]): T {
    if (validator) {
      validator(args)
    }

    return originalModifier.apply(this, args as any)
  } as T
}

/**
 * Essential production utilities
 */
export const ProductionUtils = {
  isProduction: ProductionModeManager.isProduction,
  shouldBypassValidation: ProductionModeManager.shouldBypassValidation,
  configure: ProductionModeManager.configure,
  getInfo: ProductionModeManager.getInfo,
}
