/**
 * Error Recovery Mechanisms (Phase 3.2.3)
 *
 * Advanced error recovery strategies and retry logic for TachUI.
 * Provides intelligent error handling, circuit breakers, and recovery patterns.
 */

import { createSignal } from '../reactive'
import { globalErrorManager, type TachUIError } from './error-boundary'

/**
 * Circuit breaker states
 */
export type CircuitBreakerState = 'closed' | 'open' | 'half-open'

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  failureThreshold: number
  resetTimeout: number
  monitoringPeriod: number
  minimumThroughput: number
}

/**
 * Retry policy configuration
 */
export interface RetryPolicyConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  jitter: boolean
  retryableErrors: string[]
  nonRetryableErrors: string[]
}

/**
 * Fallback configuration
 */
export interface FallbackConfig<T> {
  value?: T
  factory?: () => T | Promise<T>
  timeout?: number
  cache?: boolean
  cacheKey?: string
  cacheTimeout?: number
}

/**
 * Circuit breaker implementation
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = 'closed'
  private failureCount = 0
  private lastFailureTime = 0
  private successCount = 0
  private requestCount = 0
  private lastRequestTime = 0

  private config: CircuitBreakerConfig
  private stateSignal: () => CircuitBreakerState
  private setState: (value: CircuitBreakerState) => void

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 300000, // 5 minutes
      minimumThroughput: 10,
      ...config,
    }

    // Initialize reactive state
    const [stateSignal, setState] = createSignal<CircuitBreakerState>('closed')
    this.stateSignal = stateSignal
    this.setState = setState
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<R>(fn: () => Promise<R>): Promise<R> {
    this.updateRequestCount()

    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half-open'
        this.setState('half-open')
      } else {
        throw new Error('Circuit breaker is open')
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.successCount++

    if (this.state === 'half-open') {
      this.reset()
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.shouldTrip()) {
      this.trip()
    }
  }

  /**
   * Check if circuit breaker should trip to open state
   */
  private shouldTrip(): boolean {
    return (
      this.failureCount >= this.config.failureThreshold &&
      this.requestCount >= this.config.minimumThroughput
    )
  }

  /**
   * Trip circuit breaker to open state
   */
  private trip(): void {
    this.state = 'open'
    this.setState('open')

    globalErrorManager.reportError(
      globalErrorManager.createTachUIError(new Error('Circuit breaker tripped'), {
        category: 'component_error',
        severity: 'medium',
        context: {
          failureCount: this.failureCount,
          requestCount: this.requestCount,
        },
      })
    )
  }

  /**
   * Check if should attempt reset from open state
   */
  private shouldAttemptReset(): boolean {
    return Date.now() - this.lastFailureTime >= this.config.resetTimeout
  }

  /**
   * Reset circuit breaker to closed state
   */
  private reset(): void {
    this.state = 'closed'
    this.failureCount = 0
    this.successCount = 0
    this.setState('closed')
  }

  /**
   * Update request count for monitoring period
   */
  private updateRequestCount(): void {
    const now = Date.now()

    if (now - this.lastRequestTime > this.config.monitoringPeriod) {
      this.requestCount = 0
    }

    this.requestCount++
    this.lastRequestTime = now
  }

  /**
   * Get current state
   */
  getState(): CircuitBreakerState {
    return this.state
  }

  /**
   * Get state signal
   */
  getStateSignal(): () => CircuitBreakerState {
    return this.stateSignal
  }

  /**
   * Get metrics
   */
  getMetrics(): {
    state: CircuitBreakerState
    failureCount: number
    successCount: number
    requestCount: number
    failureRate: number
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      requestCount: this.requestCount,
      failureRate: this.requestCount > 0 ? this.failureCount / this.requestCount : 0,
    }
  }
}

/**
 * Retry policy implementation
 */
export class RetryPolicy {
  private config: RetryPolicyConfig

  constructor(config: Partial<RetryPolicyConfig> = {}) {
    this.config = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitter: true,
      retryableErrors: [], // Empty means retry all errors by default (except non-retryable)
      nonRetryableErrors: ['ValidationError', 'AuthenticationError'],
      ...config,
    }
  }

  /**
   * Execute function with retry policy
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error

        if (!this.shouldRetry(error as Error, attempt)) {
          throw error
        }

        if (attempt < this.config.maxAttempts) {
          const delay = this.calculateDelay(attempt)
          await this.sleep(delay)

          // Report retry attempt
          globalErrorManager.reportError(
            globalErrorManager.createTachUIError(error as Error, {
              category: 'network_error',
              severity: 'low',
              context: {
                attempt,
                nextDelay: delay,
                retryPolicy: true,
              },
            })
          )
        }
      }
    }

    throw lastError!
  }

  /**
   * Check if error should be retried
   */
  private shouldRetry(error: Error, attempt: number): boolean {
    if (attempt >= this.config.maxAttempts) {
      return false
    }

    const errorName = error.constructor.name

    // Check non-retryable errors first
    if (this.config.nonRetryableErrors.includes(errorName)) {
      return false
    }

    // Check retryable errors - if empty, allow retries by default
    if (this.config.retryableErrors.length > 0) {
      return this.config.retryableErrors.includes(errorName)
    }

    // Default: retry most errors except validation/auth
    return !['ValidationError', 'AuthenticationError', 'AuthorizationError'].includes(errorName)
  }

  /**
   * Calculate delay for next retry
   */
  private calculateDelay(attempt: number): number {
    const exponentialDelay = this.config.baseDelay * this.config.backoffMultiplier ** (attempt - 1)
    let delay = Math.min(exponentialDelay, this.config.maxDelay)

    // Add jitter to prevent thundering herd
    if (this.config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5)
    }

    return Math.floor(delay)
  }

  /**
   * Sleep for specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Get configuration
   */
  getConfig(): RetryPolicyConfig {
    return { ...this.config }
  }
}

/**
 * Fallback manager
 */
export class FallbackManager<T> {
  private cache = new Map<string, { value: T; timestamp: number }>()

  /**
   * Execute with fallback
   */
  async executeWithFallback<R>(
    fn: () => Promise<R>,
    fallbackConfig: FallbackConfig<R>
  ): Promise<R> {
    try {
      // Try with timeout if specified
      if (fallbackConfig.timeout) {
        return await this.withTimeout(fn(), fallbackConfig.timeout)
      } else {
        return await fn()
      }
    } catch (error) {
      return this.getFallbackValue(fallbackConfig, error as Error)
    }
  }

  /**
   * Get fallback value
   */
  private async getFallbackValue<R>(config: FallbackConfig<R>, error: Error): Promise<R> {
    // Check cache first
    if (config.cache && config.cacheKey) {
      const cached = this.getCachedValue<R>(config.cacheKey, config.cacheTimeout || 300000)
      if (cached !== null) {
        return cached
      }
    }

    let fallbackValue: R

    // Get fallback value
    if (config.factory) {
      fallbackValue = await config.factory()
    } else if (config.value !== undefined) {
      fallbackValue = config.value
    } else {
      throw error // No fallback available
    }

    // Cache the fallback value
    if (config.cache && config.cacheKey) {
      this.setCachedValue(config.cacheKey, fallbackValue)
    }

    return fallbackValue
  }

  /**
   * Execute with timeout
   */
  private withTimeout<R>(promise: Promise<R>, timeout: number): Promise<R> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`))
      }, timeout)

      promise
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timer))
    })
  }

  /**
   * Get cached value
   */
  private getCachedValue<R>(key: string, maxAge: number): R | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > maxAge) {
      this.cache.delete(key)
      return null
    }

    return cached.value as unknown as R
  }

  /**
   * Set cached value
   */
  private setCachedValue<R>(key: string, value: R): void {
    this.cache.set(key, { value: value as any, timestamp: Date.now() })
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }
}

/**
 * Composite recovery strategy
 */
export class RecoveryOrchestrator {
  private circuitBreaker?: CircuitBreaker
  private retryPolicy?: RetryPolicy
  private fallbackManager = new FallbackManager()

  constructor(
    circuitBreakerConfig?: Partial<CircuitBreakerConfig>,
    retryPolicyConfig?: Partial<RetryPolicyConfig>
  ) {
    if (circuitBreakerConfig) {
      this.circuitBreaker = new CircuitBreaker(circuitBreakerConfig)
    }

    if (retryPolicyConfig) {
      this.retryPolicy = new RetryPolicy(retryPolicyConfig)
    }
  }

  /**
   * Execute with all recovery mechanisms
   */
  async execute<T>(fn: () => Promise<T>, fallbackConfig?: FallbackConfig<T>): Promise<T> {
    const wrappedFn = this.wrapWithRecovery(fn)

    if (fallbackConfig) {
      return this.fallbackManager.executeWithFallback(wrappedFn, fallbackConfig)
    } else {
      return wrappedFn()
    }
  }

  /**
   * Wrap function with recovery mechanisms
   */
  private wrapWithRecovery<T>(fn: () => Promise<T>): () => Promise<T> {
    let wrappedFn = fn

    // Apply retry policy
    if (this.retryPolicy) {
      const retryFn = wrappedFn
      wrappedFn = () => this.retryPolicy!.execute(retryFn)
    }

    // Apply circuit breaker
    if (this.circuitBreaker) {
      const circuitFn = wrappedFn
      wrappedFn = () => this.circuitBreaker!.execute(circuitFn)
    }

    return wrappedFn
  }

  /**
   * Get circuit breaker metrics
   */
  getCircuitBreakerMetrics() {
    return this.circuitBreaker?.getMetrics()
  }

  /**
   * Get retry policy configuration
   */
  getRetryPolicyConfig() {
    return this.retryPolicy?.getConfig()
  }
}

/**
 * Error recovery utilities
 */
export const recoveryUtils = {
  /**
   * Create a robust function wrapper with all recovery mechanisms
   */
  createRobustFunction<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options: {
      circuitBreaker?: Partial<CircuitBreakerConfig>
      retryPolicy?: Partial<RetryPolicyConfig>
      fallback?: FallbackConfig<Awaited<ReturnType<T>>>
      onError?: (error: TachUIError) => void
    } = {}
  ): T {
    const orchestrator = new RecoveryOrchestrator(options.circuitBreaker, options.retryPolicy)

    return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
      try {
        return await orchestrator.execute(() => fn(...args), options.fallback)
      } catch (error) {
        if (options.onError) {
          const tachUIError = globalErrorManager.createTachUIError(error as Error, {
            category: 'network_error',
          })
          options.onError(tachUIError)
        }
        throw error
      }
    }) as T
  },

  /**
   * Create simple retry wrapper
   */
  withRetry<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    maxAttempts: number = 3,
    baseDelay: number = 1000
  ): T {
    const retryPolicy = new RetryPolicy({
      maxAttempts,
      baseDelay,
    })

    return ((...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
      return retryPolicy.execute(() => fn(...args))
    }) as T
  },

  /**
   * Create circuit breaker wrapper
   */
  withCircuitBreaker<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    config?: Partial<CircuitBreakerConfig>
  ): T {
    const circuitBreaker = new CircuitBreaker(config)

    return ((...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
      return circuitBreaker.execute(() => fn(...args))
    }) as T
  },

  /**
   * Create fallback wrapper
   */
  withFallback<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    fallbackValue: Awaited<ReturnType<T>> | (() => Awaited<ReturnType<T>>)
  ): T {
    const fallbackManager = new FallbackManager()

    return ((...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
      return fallbackManager.executeWithFallback(() => fn(...args), {
        factory:
          typeof fallbackValue === 'function'
            ? (fallbackValue as () => Awaited<ReturnType<T>>)
            : undefined,
        value: typeof fallbackValue !== 'function' ? fallbackValue : undefined,
      })
    }) as T
  },
}

/**
 * Global recovery configurations
 */
export const recoveryPresets = {
  /**
   * Configuration for network requests
   */
  network: {
    circuitBreaker: {
      failureThreshold: 5,
      resetTimeout: 60000,
      monitoringPeriod: 300000,
    },
    retryPolicy: {
      maxAttempts: 3,
      baseDelay: 1000,
      backoffMultiplier: 2,
      jitter: true,
      retryableErrors: ['NetworkError', 'TimeoutError', 'ServiceUnavailable'],
    },
  },

  /**
   * Configuration for component rendering
   */
  component: {
    retryPolicy: {
      maxAttempts: 2,
      baseDelay: 100,
      backoffMultiplier: 1.5,
      jitter: false,
      retryableErrors: ['RenderError', 'ComponentError'],
    },
  },

  /**
   * Configuration for reactive operations
   */
  reactive: {
    retryPolicy: {
      maxAttempts: 1,
      baseDelay: 0,
      retryableErrors: [],
    },
  },
}
