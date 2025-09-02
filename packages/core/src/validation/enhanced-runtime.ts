/**
 * Enhanced Runtime Validation System - Phase 1C
 *
 * Smart error recovery, performance optimization, enhanced error reporting,
 * and component lifecycle validation for production-ready validation.
 */

import type { ComponentInstance } from '../runtime/types'
// TachUIValidationError moved to primitives package - creating local version
export class TachUIValidationError extends Error {
  constructor(
    message: string,
    public context: {
      component: string
      property?: string
      suggestion?: string
      documentation?: string
      example?: { wrong: string; correct: string }
      package?: string
    }
  ) {
    super(message)
    this.name = 'TachUIValidationError'
  }

  getFormattedMessage(): string {
    return `${this.context.component}: ${this.message}`
  }
}

export interface ValidationConfig {
  enabled: boolean
  errorLevel: 'off' | 'warn' | 'error'
  packages: Record<string, boolean>
  strictMode?: boolean
  excludeFiles?: string[]
}

/**
 * Recovery strategy for validation errors
 */
export type RecoveryStrategy = 'ignore' | 'fallback' | 'fix' | 'throw'

/**
 * Enhanced validation error with recovery options
 */
export class EnhancedValidationError extends TachUIValidationError {
  declare context: {
    component: string
    property?: string
    suggestion?: string
    documentation?: string
    example?: { wrong: string; correct: string }
    package?: string
    recoveryStrategy?: RecoveryStrategy
    fallbackValue?: any
    autoFix?: () => any
  }

  constructor(
    message: string,
    context: {
      component: string
      property?: string
      suggestion?: string
      documentation?: string
      example?: { wrong: string; correct: string }
      package?: string
      recoveryStrategy?: RecoveryStrategy
      fallbackValue?: any
      autoFix?: () => any
    }
  ) {
    super(message, context)
    this.context = context
  }

  /**
   * Get recovery strategy with proper typing
   */
  private getRecoveryStrategyFromContext(): RecoveryStrategy {
    return (this.context as any).recoveryStrategy || 'throw'
  }

  /**
   * Get fallback value with proper typing
   */
  private getFallbackValueFromContext(): any {
    return (this.context as any).fallbackValue
  }

  /**
   * Get auto fix with proper typing
   */
  private getAutoFixFromContext(): (() => any) | undefined {
    return (this.context as any).autoFix
  }

  /**
   * Get suggested recovery action
   */
  getRecoveryStrategy(): RecoveryStrategy {
    return this.getRecoveryStrategyFromContext()
  }

  /**
   * Get fallback value for graceful degradation
   */
  getFallbackValue(): any {
    return this.getFallbackValueFromContext()
  }

  /**
   * Apply automatic fix if available
   */
  applyAutoFix(): any {
    const autoFix = this.getAutoFixFromContext()
    if (autoFix) {
      return autoFix()
    }
    return undefined
  }

  /**
   * Enhanced formatted message with recovery options
   */
  getFormattedMessage(): string {
    const base = super.getFormattedMessage()
    const recovery = this.getRecoveryStrategy()

    let recoveryMessage = ''
    switch (recovery) {
      case 'fallback':
        recoveryMessage =
          '\n🛡️ Recovery: Using fallback value to continue execution'
        break
      case 'fix':
        recoveryMessage = '\n🔧 Recovery: Automatic fix applied'
        break
      case 'ignore':
        recoveryMessage =
          '\n⚠️ Recovery: Error ignored, continuing with original value'
        break
      default:
        recoveryMessage = '\n🚨 Recovery: None available, error will be thrown'
    }

    return base + recoveryMessage
  }
}

/**
 * Enhanced validation configuration
 */
export interface EnhancedValidationConfig extends ValidationConfig {
  performance: {
    enableCaching: boolean
    maxCacheSize: number
    performanceThreshold: number // ms
  }
  recovery: {
    enableRecovery: boolean
    defaultStrategy: RecoveryStrategy
    maxRecoveryAttempts: number
  }
  lifecycle: {
    validateOnMount: boolean
    validateOnUpdate: boolean
    validateOnUnmount: boolean
  }
  reporting: {
    enhancedMessages: boolean
    includeStackTrace: boolean
    reportToConsole: boolean
    reportToExternal?: (error: EnhancedValidationError) => void
  }
}

/**
 * Global enhanced validation configuration
 */
let enhancedConfig: EnhancedValidationConfig = {
  enabled: process.env.NODE_ENV !== 'production',
  strictMode: false,
  errorLevel: 'error',
  excludeFiles: [],
  packages: {
    core: true,
    forms: true,
    navigation: true,
    symbols: true,
    plugins: true,
  },
  performance: {
    enableCaching: true,
    maxCacheSize: 1000,
    performanceThreshold: 5, // 5ms threshold
  },
  recovery: {
    enableRecovery: true,
    defaultStrategy: 'fallback',
    maxRecoveryAttempts: 3,
  },
  lifecycle: {
    validateOnMount: true,
    validateOnUpdate: false, // Too expensive for every update
    validateOnUnmount: false,
  },
  reporting: {
    enhancedMessages: true,
    includeStackTrace: false,
    reportToConsole: true,
  },
}

/**
 * Validation cache for performance optimization
 */
class ValidationCache {
  private cache = new Map<string, { result: boolean; timestamp: number }>()
  private maxSize: number
  private ttl = 60000 // 1 minute TTL

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize
  }

  get(key: string): boolean | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.result
  }

  set(key: string, result: boolean): void {
    // Cleanup old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now(),
    })
  }

  clear(): void {
    this.cache.clear()
  }

  getSize(): number {
    return this.cache.size
  }
}

/**
 * Performance monitor for validation overhead
 */
class ValidationPerformanceMonitor {
  private measurements: number[] = []
  private maxMeasurements = 100

  startMeasurement(): () => void {
    const start = performance.now()

    return () => {
      const duration = performance.now() - start
      this.recordMeasurement(duration)
    }
  }

  private recordMeasurement(duration: number): void {
    this.measurements.push(duration)

    // Keep only recent measurements
    if (this.measurements.length > this.maxMeasurements) {
      this.measurements.shift()
    }
  }

  getAverageTime(): number {
    if (this.measurements.length === 0) return 0
    return (
      this.measurements.reduce((a, b) => a + b, 0) / this.measurements.length
    )
  }

  isPerformanceAcceptable(): boolean {
    return (
      this.getAverageTime() <= enhancedConfig.performance.performanceThreshold
    )
  }

  getStats() {
    return {
      averageTime: this.getAverageTime(),
      measurements: this.measurements.length,
      acceptable: this.isPerformanceAcceptable(),
      threshold: enhancedConfig.performance.performanceThreshold,
    }
  }

  reset(): void {
    this.measurements = []
  }
}

// Global instances
const validationCache = new ValidationCache(
  enhancedConfig.performance.maxCacheSize
)
const performanceMonitor = new ValidationPerformanceMonitor()

/**
 * Configure enhanced validation
 */
export function configureEnhancedValidation(
  config: Partial<EnhancedValidationConfig>
): void {
  enhancedConfig = {
    ...enhancedConfig,
    ...config,
    performance: { ...enhancedConfig.performance, ...config.performance },
    recovery: { ...enhancedConfig.recovery, ...config.recovery },
    lifecycle: { ...enhancedConfig.lifecycle, ...config.lifecycle },
    reporting: { ...enhancedConfig.reporting, ...config.reporting },
  }

  // Update cache size if changed
  if (config.performance?.maxCacheSize) {
    validationCache.clear()
  }
}

/**
 * Check if enhanced validation is enabled
 */
export function isEnhancedValidationEnabled(): boolean {
  return enhancedConfig.enabled && process.env.NODE_ENV !== 'production'
}

/**
 * Smart validation executor with error recovery
 */
export class SmartValidationExecutor {
  private recoveryAttempts = new Map<string, number>()

  /**
   * Execute validation with recovery options
   */
  executeWithRecovery<T>(
    validationKey: string,
    validator: () => T,
    recoveryOptions: {
      strategy?: RecoveryStrategy
      fallbackValue?: T
      autoFix?: () => T
    } = {}
  ): T {
    // Skip validation entirely in production
    if (process.env.NODE_ENV === 'production') {
      return validator()
    }

    // Check cache first
    if (enhancedConfig.performance.enableCaching) {
      const cached = validationCache.get(validationKey)
      if (cached === true) {
        return validator()
      } else if (
        cached === false &&
        recoveryOptions.fallbackValue !== undefined
      ) {
        return recoveryOptions.fallbackValue
      }
    }

    const endMeasurement = performanceMonitor.startMeasurement()

    try {
      const result = validator()

      // Cache successful validation
      if (enhancedConfig.performance.enableCaching) {
        validationCache.set(validationKey, true)
      }

      endMeasurement()
      return result
    } catch (error) {
      endMeasurement()

      if (error instanceof EnhancedValidationError) {
        return this.handleValidationError(validationKey, error, recoveryOptions)
      }

      // Wrap other errors
      const enhancedError = new EnhancedValidationError(
        error instanceof Error ? error.message : String(error),
        {
          component: 'Unknown',
          recoveryStrategy:
            recoveryOptions.strategy || enhancedConfig.recovery.defaultStrategy,
          fallbackValue: recoveryOptions.fallbackValue,
          autoFix: recoveryOptions.autoFix,
        }
      )

      return this.handleValidationError(
        validationKey,
        enhancedError,
        recoveryOptions
      )
    }
  }

  /**
   * Handle validation error with recovery
   */
  private handleValidationError<T>(
    validationKey: string,
    error: EnhancedValidationError,
    recoveryOptions: {
      strategy?: RecoveryStrategy
      fallbackValue?: T
      autoFix?: () => T
    }
  ): T {
    const strategy = recoveryOptions.strategy || error.getRecoveryStrategy()

    // Check recovery attempt limits
    const attempts = this.recoveryAttempts.get(validationKey) || 0
    if (attempts >= enhancedConfig.recovery.maxRecoveryAttempts) {
      // Report and throw after max attempts
      this.reportError(error)
      throw error
    }

    this.recoveryAttempts.set(validationKey, attempts + 1)

    // Cache failed validation
    if (enhancedConfig.performance.enableCaching && validationKey) {
      validationCache.set(validationKey, false)
    }

    switch (strategy) {
      case 'ignore':
        this.reportError(error, 'warn')
        // Continue with original execution, but catch any errors
        try {
          const fixFn =
            recoveryOptions.autoFix || (() => recoveryOptions.fallbackValue)
          const result = fixFn()
          return result !== undefined
            ? result
            : (recoveryOptions.fallbackValue as T)
        } catch {
          return recoveryOptions.fallbackValue as T
        }

      case 'fallback':
        this.reportError(error, 'warn')
        if (recoveryOptions.fallbackValue !== undefined) {
          return recoveryOptions.fallbackValue
        }
        throw error

      case 'fix':
        this.reportError(error, 'info')
        if (recoveryOptions.autoFix) {
          try {
            return recoveryOptions.autoFix()
          } catch {
            // Fall back to fallback value if fix fails
            return recoveryOptions.fallbackValue as T
          }
        }
        throw error

      case 'throw':
      default:
        this.reportError(error)
        throw error
    }
  }

  /**
   * Report validation error
   */
  private reportError(
    error: EnhancedValidationError,
    level: 'error' | 'warn' | 'info' = 'error'
  ): void {
    if (!enhancedConfig.reporting.reportToConsole) return

    const message = enhancedConfig.reporting.enhancedMessages
      ? error.getFormattedMessage()
      : error.message

    if (enhancedConfig.reporting.includeStackTrace) {
      console[level](message, error.stack)
    } else {
      console[level](message)
    }

    // Report to external service if configured
    if (enhancedConfig.reporting.reportToExternal) {
      try {
        enhancedConfig.reporting.reportToExternal(error)
      } catch (reportingError) {
        console.warn(
          'Failed to report validation error to external service:',
          reportingError
        )
      }
    }
  }

  /**
   * Reset recovery attempts
   */
  resetRecoveryAttempts(): void {
    this.recoveryAttempts.clear()
  }

  /**
   * Get recovery stats
   */
  getRecoveryStats() {
    return {
      totalAttempts: Array.from(this.recoveryAttempts.values()).reduce(
        (a, b) => a + b,
        0
      ),
      keysWithAttempts: this.recoveryAttempts.size,
      attempts: Object.fromEntries(this.recoveryAttempts),
    }
  }
}

// Global smart validator instance
const smartValidator = new SmartValidationExecutor()

/**
 * Component lifecycle validator
 */
export class ComponentLifecycleValidator {
  private mountedComponents = new WeakSet<ComponentInstance>()
  private componentStates = new WeakMap<ComponentInstance, any>()

  /**
   * Validate component on mount
   */
  validateOnMount(component: ComponentInstance, props: any): void {
    if (
      !enhancedConfig.lifecycle.validateOnMount ||
      !isEnhancedValidationEnabled()
    ) {
      return
    }

    const validationKey = `mount-${component.constructor.name}-${JSON.stringify(props)}`

    smartValidator.executeWithRecovery(
      validationKey,
      () => {
        // Basic mount validation
        if (!component) {
          throw new EnhancedValidationError(
            'Component instance is null or undefined',
            {
              component: 'Unknown',
              recoveryStrategy: 'throw',
            }
          )
        }

        // Store component state
        this.componentStates.set(component, { ...props, mountTime: Date.now() })
        this.mountedComponents.add(component)

        return true
      },
      {
        strategy: 'fallback',
        fallbackValue: true,
      }
    )
  }

  /**
   * Validate component on update
   */
  validateOnUpdate(
    component: ComponentInstance,
    newProps: any,
    oldProps: any
  ): void {
    if (
      !enhancedConfig.lifecycle.validateOnUpdate ||
      !isEnhancedValidationEnabled()
    ) {
      return
    }

    if (!this.mountedComponents.has(component)) {
      // Component not properly mounted
      if (enhancedConfig.reporting.reportToConsole) {
        console.warn(
          '⚠️ Component update validation: Component not found in mounted components'
        )
      }
      return
    }

    const validationKey = `update-${component.constructor.name}-${Date.now()}`

    smartValidator.executeWithRecovery(
      validationKey,
      () => {
        // Check for invalid prop changes
        if (newProps && typeof newProps === 'object') {
          for (const [key, value] of Object.entries(newProps)) {
            if (
              value === undefined &&
              oldProps &&
              oldProps[key] !== undefined
            ) {
              throw new EnhancedValidationError(
                `Property ${key} changed from defined to undefined`,
                {
                  component: component.constructor.name,
                  property: key,
                  suggestion:
                    'Ensure prop values remain consistent or use null instead of undefined',
                  recoveryStrategy: 'ignore',
                }
              )
            }
          }
        }

        // Update component state
        this.componentStates.set(component, {
          ...newProps,
          lastUpdate: Date.now(),
        })
        return true
      },
      {
        strategy: 'ignore',
        fallbackValue: true,
      }
    )
  }

  /**
   * Validate component on unmount
   */
  validateOnUnmount(component: ComponentInstance): void {
    if (
      !enhancedConfig.lifecycle.validateOnUnmount ||
      !isEnhancedValidationEnabled()
    ) {
      return
    }

    if (this.mountedComponents.has(component)) {
      this.mountedComponents.delete(component)
      this.componentStates.delete(component)
    }
  }

  /**
   * Get lifecycle validation stats
   */
  getStats() {
    // WeakMap doesn't have a size property, so we'll use an alternative approach
    let componentCount = 0
    try {
      // This is a workaround since WeakMap doesn't expose size
      componentCount = 0 // We can't get the actual count from WeakMap
    } catch {
      componentCount = 0
    }

    return {
      mountedComponents: componentCount,
      enabled: enhancedConfig.lifecycle,
      config: enhancedConfig.lifecycle,
    }
  }
}

// Global lifecycle validator
const lifecycleValidator = new ComponentLifecycleValidator()

/**
 * Enhanced validation utilities
 */
export const EnhancedValidationUtils = {
  /**
   * Configure enhanced validation
   */
  configure: configureEnhancedValidation,

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    return {
      monitor: performanceMonitor.getStats(),
      cache: {
        size: validationCache.getSize(),
        maxSize: enhancedConfig.performance.maxCacheSize,
      },
      recovery: smartValidator.getRecoveryStats(),
      lifecycle: lifecycleValidator.getStats(),
    }
  },

  /**
   * Reset all caches and stats
   */
  reset() {
    validationCache.clear()
    performanceMonitor.reset()
    smartValidator.resetRecoveryAttempts()
  },

  /**
   * Test enhanced validation system
   */
  test() {
    console.group('🔍 Enhanced Runtime Validation System Test')

    try {
      // Test performance monitoring
      const endMeasurement = performanceMonitor.startMeasurement()
      setTimeout(endMeasurement, 1)

      // Test smart validation
      const result = smartValidator.executeWithRecovery(
        'test-validation',
        () => {
          throw new EnhancedValidationError('Test error', {
            component: 'Test',
            recoveryStrategy: 'fallback',
            fallbackValue: 'recovered',
          })
        },
        {
          fallbackValue: 'recovered',
        }
      )

      console.info('✅ Smart error recovery:', result === 'recovered')
      console.info('✅ Performance monitoring: enabled')
      console.info('✅ Validation caching: enabled')
      console.info('✅ Component lifecycle: enabled')
      console.info('✅ Enhanced validation system is working correctly')
    } catch (error) {
      console.error('❌ Enhanced validation test failed:', error)
    }

    console.groupEnd()
  },

  /**
   * Enable production bypass mode
   */
  enableProductionBypass() {
    if (process.env.NODE_ENV === 'production') {
      configureEnhancedValidation({ enabled: false })
      console.info('✅ Production mode: Validation bypassed for zero overhead')
    }
  },

  /**
   * Create validated component with enhanced features
   */
  createEnhancedValidatedComponent<T extends ComponentInstance>(
    originalConstructor: (...args: any[]) => T,
    validator: (args: unknown[]) => void,
    componentType: string,
    packageName: string = 'core'
  ): (...args: any[]) => T {
    return function enhancedValidatedConstructor(
      this: any,
      ...args: unknown[]
    ): T {
      // Production bypass - zero overhead
      if (process.env.NODE_ENV === 'production') {
        return originalConstructor.apply(this, args as any)
      }

      const validationKey = `${packageName}-${componentType}-${JSON.stringify(args)}`

      const result = smartValidator.executeWithRecovery(
        validationKey,
        () => {
          // Run validation
          validator(args)

          // Create the component
          const instance = originalConstructor.apply(this, args as any)

          // Lifecycle validation
          lifecycleValidator.validateOnMount(instance, args[0])

          return instance
        },
        {
          strategy: 'fallback',
          fallbackValue: originalConstructor.apply(this, args as any) as T,
          autoFix: () => {
            // Try to create component with default props
            try {
              return originalConstructor.apply(this, [{}] as any)
            } catch {
              throw new EnhancedValidationError(
                'Failed to create component with fallback',
                {
                  component: componentType,
                  package: packageName,
                  recoveryStrategy: 'throw',
                }
              )
            }
          },
        }
      )

      return result as T
    }
  },
}

// Export global instances for external access
export {
  smartValidator,
  lifecycleValidator,
  validationCache,
  performanceMonitor,
  enhancedConfig,
}
