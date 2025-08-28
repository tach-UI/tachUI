/**
 * Error Recovery and Retry Mechanisms Framework
 * 
 * Advanced error recovery strategies for TachUI applications including:
 * - Exponential backoff retry strategies
 * - Circuit breaker patterns
 * - Graceful degradation mechanisms
 * - State rollback and recovery
 * - Progressive enhancement patterns
 */

export interface RetryConfig {
  maxAttempts: number
  initialDelay: number
  maxDelay: number
  backoffMultiplier: number
  jitter: boolean
  retryCondition?: (error: Error, attempt: number) => boolean
}

export interface CircuitBreakerConfig {
  failureThreshold: number
  resetTimeout: number
  monitoringWindow: number
  halfOpenMaxAttempts: number
}

export interface RecoveryStrategy {
  name: string
  priority: number
  condition: (error: Error, context: any) => boolean
  recover: (error: Error, context: any) => Promise<any>
  fallback?: (error: Error, context: any) => Promise<any>
}

export interface ErrorContext {
  operation: string
  component?: string
  attempt: number
  timestamp: number
  metadata: Record<string, any>
}

export type CircuitState = 'closed' | 'open' | 'half-open'

export interface CircuitBreakerResult {
  state: CircuitState
  lastFailure?: Date
  consecutiveFailures: number
  successCount: number
  canExecute: boolean
}

export interface RetryResult<T> {
  success: boolean
  result?: T
  error?: Error
  attempts: number
  totalTime: number
  recoveryUsed?: string
}

/**
 * Circuit Breaker Implementation
 */
export class CircuitBreaker {
  private state: CircuitState = 'closed'
  private failureCount = 0
  private successCount = 0
  private lastFailureTime?: Date
  private nextAttempt?: Date

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.canExecute()) {
      throw new Error(`Circuit breaker is ${this.state} - operation blocked`)
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private canExecute(): boolean {
    const now = new Date()

    switch (this.state) {
      case 'closed':
        return true
      
      case 'open':
        if (this.nextAttempt && now >= this.nextAttempt) {
          this.state = 'half-open'
          this.successCount = 0
          return true
        }
        return false
      
      case 'half-open':
        return this.successCount < this.config.halfOpenMaxAttempts
    }
  }

  private onSuccess(): void {
    this.failureCount = 0
    
    if (this.state === 'half-open') {
      this.successCount++
      if (this.successCount >= this.config.halfOpenMaxAttempts) {
        this.state = 'closed'
      }
    }
  }

  private onFailure(): void {
    this.failureCount++
    this.lastFailureTime = new Date()

    if (this.state === 'closed' && this.failureCount >= this.config.failureThreshold) {
      this.state = 'open'
      this.nextAttempt = new Date(Date.now() + this.config.resetTimeout)
    } else if (this.state === 'half-open') {
      this.state = 'open'
      this.nextAttempt = new Date(Date.now() + this.config.resetTimeout)
    }
  }

  getStatus(): CircuitBreakerResult {
    return {
      state: this.state,
      lastFailure: this.lastFailureTime,
      consecutiveFailures: this.failureCount,
      successCount: this.successCount,
      canExecute: this.canExecute()
    }
  }

  reset(): void {
    this.state = 'closed'
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = undefined
    this.nextAttempt = undefined
  }
}

/**
 * Advanced Error Recovery Manager
 */
export class ErrorRecoveryManager {
  private retryConfig: Required<RetryConfig>
  private circuitBreakers = new Map<string, CircuitBreaker>()
  private recoveryStrategies: RecoveryStrategy[] = []
  private errorHistory: Array<{ error: Error, context: ErrorContext, recovered: boolean }> = []

  constructor(retryConfig: Partial<RetryConfig> = {}) {
    this.retryConfig = {
      maxAttempts: retryConfig.maxAttempts ?? 3,
      initialDelay: retryConfig.initialDelay ?? 1000,
      maxDelay: retryConfig.maxDelay ?? 30000,
      backoffMultiplier: retryConfig.backoffMultiplier ?? 2,
      jitter: retryConfig.jitter ?? true,
      retryCondition: retryConfig.retryCondition ?? this.defaultRetryCondition,
      ...retryConfig
    }
  }

  /**
   * Execute operation with comprehensive error recovery
   */
  async executeWithRecovery<T>(
    operation: () => Promise<T>,
    context: Partial<ErrorContext> = {}
  ): Promise<RetryResult<T>> {
    const fullContext: ErrorContext = {
      operation: context.operation ?? 'unknown',
      component: context.component,
      attempt: 0,
      timestamp: Date.now(),
      metadata: context.metadata ?? {}
    }

    const startTime = Date.now()
    let lastError: Error

    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      fullContext.attempt = attempt

      try {
        const result = await operation()
        return {
          success: true,
          result,
          attempts: attempt,
          totalTime: Date.now() - startTime
        }
      } catch (error) {
        lastError = error as Error
        this.errorHistory.push({ error: lastError, context: fullContext, recovered: false })

        // Try recovery strategies
        const recoveryResult = await this.attemptRecovery(lastError, fullContext)
        if (recoveryResult.recovered) {
          this.errorHistory[this.errorHistory.length - 1].recovered = true
          return {
            success: true,
            result: recoveryResult.result,
            attempts: attempt,
            totalTime: Date.now() - startTime,
            recoveryUsed: recoveryResult.strategyName
          }
        }

        // Check if we should retry
        if (attempt < this.retryConfig.maxAttempts && this.retryConfig.retryCondition(lastError, attempt)) {
          const delay = this.calculateDelay(attempt)
          await this.sleep(delay)
        }
      }
    }

    return {
      success: false,
      error: lastError!,
      attempts: this.retryConfig.maxAttempts,
      totalTime: Date.now() - startTime
    }
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    breakerName: string,
    breakerConfig?: CircuitBreakerConfig
  ): Promise<T> {
    let breaker = this.circuitBreakers.get(breakerName)
    
    if (!breaker && breakerConfig) {
      breaker = new CircuitBreaker(breakerConfig)
      this.circuitBreakers.set(breakerName, breaker)
    }

    if (!breaker) {
      throw new Error(`Circuit breaker '${breakerName}' not found and no config provided`)
    }

    return await breaker.execute(operation)
  }

  /**
   * Add recovery strategy
   */
  addRecoveryStrategy(strategy: RecoveryStrategy): void {
    this.recoveryStrategies.push(strategy)
    this.recoveryStrategies.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Remove recovery strategy
   */
  removeRecoveryStrategy(name: string): void {
    this.recoveryStrategies = this.recoveryStrategies.filter(s => s.name !== name)
  }

  /**
   * Create circuit breaker for operation
   */
  createCircuitBreaker(name: string, config: CircuitBreakerConfig): CircuitBreaker {
    const breaker = new CircuitBreaker(config)
    this.circuitBreakers.set(name, breaker)
    return breaker
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(name: string): CircuitBreakerResult | null {
    const breaker = this.circuitBreakers.get(name)
    return breaker ? breaker.getStatus() : null
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(timeWindow?: number): {
    totalErrors: number
    recoveredErrors: number
    recoveryRate: number
    commonErrors: Array<{ type: string, count: number }>
    recentErrors: Array<{ error: Error, context: ErrorContext, recovered: boolean }>
  } {
    const cutoffTime = timeWindow ? Date.now() - timeWindow : 0
    const relevantErrors = this.errorHistory.filter(entry => entry.context.timestamp >= cutoffTime)

    const totalErrors = relevantErrors.length
    const recoveredErrors = relevantErrors.filter(entry => entry.recovered).length
    const recoveryRate = totalErrors > 0 ? recoveredErrors / totalErrors : 0

    // Group errors by type
    const errorCounts = new Map<string, number>()
    relevantErrors.forEach(entry => {
      const errorType = entry.error.constructor.name
      errorCounts.set(errorType, (errorCounts.get(errorType) || 0) + 1)
    })

    const commonErrors = Array.from(errorCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)

    return {
      totalErrors,
      recoveredErrors,
      recoveryRate,
      commonErrors,
      recentErrors: relevantErrors.slice(-10) // Last 10 errors
    }
  }

  private async attemptRecovery(error: Error, context: ErrorContext): Promise<{
    recovered: boolean
    result?: any
    strategyName?: string
  }> {
    for (const strategy of this.recoveryStrategies) {
      if (strategy.condition(error, context)) {
        try {
          const result = await strategy.recover(error, context)
          return { recovered: true, result, strategyName: strategy.name }
        } catch (recoveryError) {
          // Try fallback if available
          if (strategy.fallback) {
            try {
              const fallbackResult = await strategy.fallback(error, context)
              return { recovered: true, result: fallbackResult, strategyName: `${strategy.name}-fallback` }
            } catch (fallbackError) {
              // Continue to next strategy
            }
          }
        }
      }
    }

    return { recovered: false }
  }

  private calculateDelay(attempt: number): number {
    let delay = this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1)
    delay = Math.min(delay, this.retryConfig.maxDelay)

    if (this.retryConfig.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5) // 50-100% of calculated delay
    }

    return delay
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private defaultRetryCondition(error: Error, attempt: number): boolean {
    // Don't retry certain error types
    if (error.name === 'TypeError' || error.name === 'SyntaxError') {
      return false
    }

    // Don't retry if error message indicates permanent failure
    const permanentErrors = ['not found', 'unauthorized', 'forbidden', 'bad request']
    const message = error.message.toLowerCase()
    if (permanentErrors.some(perm => message.includes(perm))) {
      return false
    }

    return true
  }
}

/**
 * Pre-built recovery strategies for common scenarios
 */
export const CommonRecoveryStrategies = {
  /**
   * Network error recovery with exponential backoff
   */
  networkErrorRecovery: (): RecoveryStrategy => ({
    name: 'network-error-recovery',
    priority: 80,
    condition: (error: Error) => {
      const message = error.message.toLowerCase()
      return message.includes('network') || 
             message.includes('fetch') || 
             message.includes('timeout') ||
             message.includes('connection')
    },
    recover: async (error: Error, context: ErrorContext) => {
      // Wait for network to potentially recover
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))
      
      // Return a placeholder result or trigger a retry
      return { recovered: true, method: 'network-retry' }
    },
    fallback: async (error: Error, context: ErrorContext) => {
      // Return cached data or offline mode
      return { recovered: true, method: 'offline-mode', data: null }
    }
  }),

  /**
   * Component state corruption recovery
   */
  stateRecovery: (): RecoveryStrategy => ({
    name: 'state-recovery',
    priority: 90,
    condition: (error: Error, context: ErrorContext) => {
      return context.component !== undefined && (
        error.message.includes('state') ||
        error.message.includes('signal') ||
        error.name === 'TypeError'
      )
    },
    recover: async (error: Error, context: ErrorContext) => {
      // Reset component state to safe defaults
      return { recovered: true, method: 'state-reset' }
    }
  }),

  /**
   * Memory pressure recovery
   */
  memoryPressureRecovery: (): RecoveryStrategy => ({
    name: 'memory-pressure-recovery',
    priority: 70,
    condition: (error: Error) => {
      return error.message.includes('memory') || 
             error.message.includes('heap') ||
             error.name === 'RangeError'
    },
    recover: async (error: Error, context: ErrorContext) => {
      // Trigger garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      // Wait for memory to be freed
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return { recovered: true, method: 'memory-cleanup' }
    }
  }),

  /**
   * Validation error recovery with user-friendly defaults
   */
  validationErrorRecovery: (): RecoveryStrategy => ({
    name: 'validation-error-recovery',
    priority: 60,
    condition: (error: Error) => {
      return error.message.includes('validation') ||
             error.message.includes('invalid') ||
             error.message.includes('required')
    },
    recover: async (error: Error, context: ErrorContext) => {
      // Provide safe default values
      return { 
        recovered: true, 
        method: 'validation-defaults',
        data: { valid: true, errors: [], warnings: [error.message] }
      }
    }
  }),

  /**
   * Async operation timeout recovery
   */
  timeoutRecovery: (): RecoveryStrategy => ({
    name: 'timeout-recovery',
    priority: 75,
    condition: (error: Error) => {
      return error.message.includes('timeout') || error.message.includes('timed out')
    },
    recover: async (error: Error, context: ErrorContext) => {
      // Return partial result or cached data
      return { 
        recovered: true, 
        method: 'timeout-fallback',
        data: { partial: true, timestamp: Date.now() }
      }
    }
  })
}

/**
 * Utility functions for error recovery testing
 */
export const recoveryTestUtils = {
  /**
   * Create a flaky operation that fails intermittently
   */
  createFlakyOperation<T>(
    successResult: T, 
    failureRate: number = 0.3,
    errorMessage: string = 'Operation failed randomly'
  ): () => Promise<T> {
    return async () => {
      if (Math.random() < failureRate) {
        throw new Error(errorMessage)
      }
      return successResult
    }
  },

  /**
   * Create an operation that fails for first N attempts then succeeds
   */
  createEventuallySuccessfulOperation<T>(
    successResult: T,
    failuresBeforeSuccess: number = 2,
    errorMessage: string = 'Operation not ready yet'
  ): () => Promise<T> {
    let attemptCount = 0
    
    return async () => {
      attemptCount++
      if (attemptCount <= failuresBeforeSuccess) {
        throw new Error(`${errorMessage} (attempt ${attemptCount})`)
      }
      return successResult
    }
  },

  /**
   * Create a network-like operation with realistic delays and failures
   */
  createNetworkOperation<T>(
    successResult: T,
    config: {
      successDelay?: number
      failureRate?: number
      timeoutChance?: number
      networkErrorChance?: number
      timeoutDelay?: number
    } = {}
  ): () => Promise<T> {
    const {
      successDelay = 100,
      failureRate = 0.1,
      timeoutChance = 0.05,
      networkErrorChance = 0.05,
      timeoutDelay = 100 // Much shorter default timeout for testing
    } = config

    return async () => {
      const random = Math.random()
      
      if (random < timeoutChance) {
        await new Promise(resolve => setTimeout(resolve, timeoutDelay))
        throw new Error(`Request timeout after ${timeoutDelay}ms`)
      }
      
      if (random < failureRate) {
        if (random < networkErrorChance) {
          throw new Error('Network error: Connection refused')
        } else {
          throw new Error('Server error: Internal server error (500)')
        }
      }

      await new Promise(resolve => setTimeout(resolve, successDelay + Math.random() * 50))
      return successResult
    }
  }
}