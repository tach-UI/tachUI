/**
 * Error Handling System Tests (Phase 3.2.3)
 *
 * Comprehensive tests for error boundaries, error recovery, and error reporting.
 * Tests all error handling functionality including boundaries, recovery mechanisms,
 * reporting, and debugging utilities.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createErrorBoundary,
  ErrorBoundary,
  ErrorManager,
  errorUtils,
  globalErrorManager,
  type TachUIError,
} from '../../src/runtime/error-boundary'
import {
  CircuitBreaker,
  RetryPolicy,
  recoveryUtils,
} from '../../src/runtime/error-recovery'
import {
  ErrorAggregator,
  StructuredLogger,
} from '../../src/runtime/error-reporting'
import {
  ErrorPatternDetector,
  errorDebugUtils,
  StackTraceAnalyzer,
} from '../../src/runtime/error-utils'

describe('ErrorManager', () => {
  let errorManager: ErrorManager

  beforeEach(() => {
    errorManager = ErrorManager.getInstance()
    errorManager.clear()
  })

  afterEach(() => {
    errorManager.clear()
  })

  describe('Basic Error Management', () => {
    it('should create singleton instance', () => {
      const instance1 = ErrorManager.getInstance()
      const instance2 = ErrorManager.getInstance()
      expect(instance1).toBe(instance2)
    })

    it('should configure error handling', () => {
      errorManager.configure({
        enabled: false,
        maxErrorsPerSession: 50,
      })

      const error = errorManager.createTachUIError(new Error('test'))
      errorManager.reportError(error)

      // Should not record error when disabled
      expect(errorManager.getErrors()).toHaveLength(0)
    })

    it('should create standardized TachUI errors', () => {
      const originalError = new Error('Test error')
      const tachUIError = errorManager.createTachUIError(originalError, {
        category: 'component_error',
        severity: 'high',
        componentId: 'test-component',
      })

      expect(tachUIError.message).toBe('Test error')
      expect(tachUIError.category).toBe('component_error')
      expect(tachUIError.severity).toBe('high')
      expect(tachUIError.componentId).toBe('test-component')
      expect(tachUIError.cause).toBe(originalError)
      expect(tachUIError.id).toMatch(/^error_/)
      expect(tachUIError.timestamp).toBeTypeOf('number')
    })
  })

  describe('Error Reporting', () => {
    beforeEach(() => {
      errorManager.configure({
        enabled: true,
        reportingThrottle: 0, // Disable throttling for tests
      })
    })

    it('should report errors', () => {
      const error = errorManager.createTachUIError(new Error('Test error'))
      errorManager.reportError(error)

      const errors = errorManager.getErrors()
      expect(errors).toHaveLength(1)
      expect(errors[0]).toEqual(error)
    })

    it('should limit errors array size', () => {
      errorManager.configure({ maxErrorsPerSession: 3 })

      for (let i = 0; i < 5; i++) {
        const error = errorManager.createTachUIError(new Error(`Error ${i}`))
        errorManager.reportError(error)
      }

      const errors = errorManager.getErrors()
      expect(errors).toHaveLength(3)
      expect(errors[0].message).toBe('Error 2')
    })

    it('should throttle error reporting', () => {
      errorManager.configure({ reportingThrottle: 100 })

      const error1 = errorManager.createTachUIError(new Error('Same error'))
      const error2 = errorManager.createTachUIError(new Error('Same error'))

      errorManager.reportError(error1)
      errorManager.reportError(error2) // Should be throttled

      expect(errorManager.getErrors()).toHaveLength(1)
    })

    it('should add and remove error handlers', () => {
      const handler = vi.fn()
      const unsubscribe = errorManager.addHandler(handler)

      const error = errorManager.createTachUIError(new Error('Test'))
      errorManager.reportError(error)

      expect(handler).toHaveBeenCalledWith(error)

      unsubscribe()

      const error2 = errorManager.createTachUIError(new Error('Test 2'))
      errorManager.reportError(error2)

      expect(handler).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Analysis', () => {
    beforeEach(() => {
      errorManager.configure({
        enabled: true,
        reportingThrottle: 0, // Disable throttling for tests
      })
    })

    it('should get errors by category', () => {
      const componentError = errorManager.createTachUIError(
        new Error('Component error'),
        {
          category: 'component_error',
        }
      )
      const networkError = errorManager.createTachUIError(
        new Error('Network error'),
        {
          category: 'network_error',
        }
      )

      errorManager.reportError(componentError)
      errorManager.reportError(networkError)

      const componentErrors =
        errorManager.getErrorsByCategory('component_error')
      expect(componentErrors).toHaveLength(1)
      expect(componentErrors[0].category).toBe('component_error')
    })

    it('should get errors by severity', () => {
      const highError = errorManager.createTachUIError(
        new Error('High error'),
        {
          severity: 'high',
        }
      )
      const lowError = errorManager.createTachUIError(new Error('Low error'), {
        severity: 'low',
      })

      errorManager.reportError(highError)
      errorManager.reportError(lowError)

      const highErrors = errorManager.getErrorsBySeverity('high')
      expect(highErrors).toHaveLength(1)
      expect(highErrors[0].severity).toBe('high')
    })

    it('should generate error statistics', () => {
      const errors = [
        { category: 'component_error', severity: 'high' },
        { category: 'component_error', severity: 'low' },
        { category: 'network_error', severity: 'medium' },
      ]

      errors.forEach(({ category, severity }) => {
        const error = errorManager.createTachUIError(new Error('Test'), {
          category: category as any,
          severity: severity as any,
        })
        errorManager.reportError(error)
      })

      const stats = errorManager.getStatistics()
      expect(stats.totalErrors).toBe(3)
      expect(stats.errorsByCategory.component_error).toBe(2)
      expect(stats.errorsByCategory.network_error).toBe(1)
      expect(stats.errorsBySeverity.high).toBe(1)
      expect(stats.errorsBySeverity.medium).toBe(1)
      expect(stats.errorsBySeverity.low).toBe(1)
    })
  })
})

describe('ErrorBoundary', () => {
  let errorManager: ErrorManager

  beforeEach(() => {
    errorManager = ErrorManager.getInstance()
    errorManager.clear()
    errorManager.configure({ enabled: true })
  })

  afterEach(() => {
    errorManager.clear()
  })

  describe('Error Boundary Creation', () => {
    it('should create error boundary with default props', () => {
      const mockChild = {
        type: 'component' as const,
        render: () => [{ type: 'text', content: 'Child content' }],
      }

      const boundary = createErrorBoundary({}, [mockChild])

      expect(boundary).toBeInstanceOf(ErrorBoundary)
      expect(boundary.getState().hasError).toBe(false)
    })

    it('should create error boundary with custom fallback', () => {
      const fallback = {
        type: 'component' as const,
        render: () => [{ type: 'text', content: 'Error occurred' }],
      }

      const mockChild = {
        type: 'component' as const,
        render: () => {
          throw new Error('Child error')
        },
      }

      const boundary = createErrorBoundary({ fallback }, [mockChild])

      // Trigger error
      try {
        boundary.render()
      } catch (error) {
        boundary.componentDidCatch(error as Error, {})
      }

      expect(boundary.getState().hasError).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should catch and handle component errors', () => {
      const onError = vi.fn()
      const boundary = createErrorBoundary({ onError }, [])

      const error = new Error('Component error')
      boundary.componentDidCatch(error, { componentStack: 'test stack' })

      const state = boundary.getState()
      expect(state.hasError).toBe(true)
      expect(state.error?.message).toBe('Component error')
      expect(onError).toHaveBeenCalled()
    })

    it('should retry failed operations', () => {
      const boundary = createErrorBoundary({}, [])

      const error = new Error('Test error')
      boundary.componentDidCatch(error, {})

      expect(boundary.getState().hasError).toBe(true)

      boundary.retry()

      expect(boundary.getState().hasError).toBe(false)
      expect(boundary.getState().errorInfo.retryAttempts).toBe(1)
    })

    it('should handle recovery strategies', () => {
      const onRecovery = vi.fn()
      const boundary = createErrorBoundary(
        {
          recovery: [
            {
              strategy: 'retry',
              maxRetries: 2,
              onRecovery,
            },
          ],
        },
        []
      )

      const error = new Error('Test error')
      boundary.componentDidCatch(error, {})

      // Should attempt recovery
      expect(onRecovery).toHaveBeenCalled()
    })
  })

  describe('Error Boundary Rendering', () => {
    it('should render children when no error', () => {
      const mockChild = {
        type: 'component' as const,
        render: () => [{ type: 'text', content: 'Normal content' }],
      }

      const boundary = createErrorBoundary({}, [mockChild])
      const result = boundary.render()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({ type: 'text', content: 'Normal content' })
    })

    it('should render fallback UI when error occurs', () => {
      const boundary = createErrorBoundary({}, [])

      // Simulate error
      const error = new Error('Test error')
      boundary.componentDidCatch(error, {})

      const result = boundary.render()

      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('element')
      expect(result[0].tag).toBe('div')
    })

    it('should render custom fallback when provided', () => {
      const fallback = (error: TachUIError, _retry: () => void) => ({
        type: 'component' as const,
        render: () => [
          { type: 'text', content: `Custom error: ${error.message}` },
        ],
      })

      const boundary = createErrorBoundary({ fallback }, [])

      const error = new Error('Custom test error')
      boundary.componentDidCatch(error, {})

      const result = boundary.render()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        type: 'text',
        content: 'Custom error: Custom test error',
      })
    })
  })
})

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker<string>

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 1000,
      minimumThroughput: 2,
    })
  })

  describe('Circuit Breaker States', () => {
    it('should start in closed state', () => {
      expect(circuitBreaker.getState()).toBe('closed')
    })

    it('should trip to open state after failures', async () => {
      const failingFn = () => Promise.reject(new Error('Test error'))

      // Trigger enough failures
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingFn)
        } catch (_error) {
          // Expected
        }
      }

      expect(circuitBreaker.getState()).toBe('open')
    })

    it('should transition to half-open after reset timeout', async () => {
      const failingFn = () => Promise.reject(new Error('Test error'))

      // Trip the circuit breaker
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingFn)
        } catch (_error) {
          // Expected
        }
      }

      expect(circuitBreaker.getState()).toBe('open')

      // Wait for reset timeout (mocked)
      vi.useFakeTimers()
      vi.advanceTimersByTime(1000)

      const successFn = () => Promise.resolve('success')
      await circuitBreaker.execute(successFn)

      expect(circuitBreaker.getState()).toBe('closed')

      vi.useRealTimers()
    })
  })

  describe('Circuit Breaker Execution', () => {
    it('should execute function when closed', async () => {
      const successFn = () => Promise.resolve('success')
      const result = await circuitBreaker.execute(successFn)

      expect(result).toBe('success')
    })

    it('should reject immediately when open', async () => {
      const failingFn = () => Promise.reject(new Error('Test error'))

      // Trip the circuit breaker
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingFn)
        } catch (_error) {
          // Expected
        }
      }

      // Should reject immediately
      await expect(circuitBreaker.execute(failingFn)).rejects.toThrow(
        'Circuit breaker is open'
      )
    })
  })

  describe('Circuit Breaker Metrics', () => {
    it('should track metrics correctly', async () => {
      const successFn = () => Promise.resolve('success')
      const failingFn = () => Promise.reject(new Error('Test error'))

      await circuitBreaker.execute(successFn)
      try {
        await circuitBreaker.execute(failingFn)
      } catch (_error) {
        // Expected
      }

      const metrics = circuitBreaker.getMetrics()
      expect(metrics.successCount).toBe(1)
      expect(metrics.failureCount).toBe(1)
      expect(metrics.requestCount).toBe(2)
      expect(metrics.failureRate).toBe(0.5)
    })
  })
})

describe('RetryPolicy', () => {
  let retryPolicy: RetryPolicy

  beforeEach(() => {
    retryPolicy = new RetryPolicy({
      maxAttempts: 3,
      baseDelay: 10, // Faster for tests
      backoffMultiplier: 1.5,
      retryableErrors: [], // Empty means retry all errors by default
    })
  })

  describe('Retry Execution', () => {
    it('should retry failed operations', async () => {
      let attempts = 0
      const flakyFn = () => {
        attempts++
        if (attempts < 3) {
          return Promise.reject(new Error('Temporary error'))
        }
        return Promise.resolve('success')
      }

      const result = await retryPolicy.execute(flakyFn)

      expect(result).toBe('success')
      expect(attempts).toBe(3)
    })

    it('should respect max attempts', async () => {
      const failingFn = () => Promise.reject(new Error('Always fails'))

      await expect(retryPolicy.execute(failingFn)).rejects.toThrow(
        'Always fails'
      )
    })

    it('should not retry non-retryable errors', async () => {
      const policy = new RetryPolicy({
        maxAttempts: 3,
        nonRetryableErrors: ['ValidationError'],
      })

      class ValidationError extends Error {
        constructor(message: string) {
          super(message)
          this.name = 'ValidationError'
        }
      }

      const failingFn = () =>
        Promise.reject(new ValidationError('Invalid input'))

      await expect(policy.execute(failingFn)).rejects.toThrow('Invalid input')
    })
  })
})

describe('StructuredLogger', () => {
  let logger: StructuredLogger
  let consoleSpy: {
    debug: any
    info: any
    warn: any
    error: any
    log: any
  }

  beforeEach(() => {
    // Mock console methods to prevent output during tests
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    }

    logger = new StructuredLogger({
      logLevel: 'debug',
      batchSize: 10,
      batchTimeout: 1000,
    })
  })

  afterEach(() => {
    logger.clear()

    // Restore console methods
    consoleSpy.debug.mockRestore()
    consoleSpy.info.mockRestore()
    consoleSpy.warn.mockRestore()
    consoleSpy.error.mockRestore()
    consoleSpy.log.mockRestore()
  })

  describe('Basic Logging', () => {
    it('should log messages at different levels', () => {
      logger.debug('Debug message')
      logger.info('Info message')
      logger.warn('Warning message')
      logger.error('Error message')
      logger.fatal('Fatal message')

      const entries = logger.getEntries()
      expect(entries).toHaveLength(5)
      expect(entries.map(e => e.level)).toEqual([
        'debug',
        'info',
        'warn',
        'error',
        'fatal',
      ])
    })

    it('should respect log level threshold', () => {
      const logger = new StructuredLogger({ logLevel: 'warn' })

      logger.debug('Debug message')
      logger.info('Info message')
      logger.warn('Warning message')
      logger.error('Error message')

      const entries = logger.getEntries()
      expect(entries).toHaveLength(2)
      expect(entries.map(e => e.level)).toEqual(['warn', 'error'])
    })

    it('should include context in log entries', () => {
      const context = { userId: '123', action: 'test' }
      logger.info('Test message', context)

      const entries = logger.getEntries()
      expect(entries[0].context).toEqual(context)
    })

    it('should sanitize sensitive data', () => {
      const context = { username: 'john', password: 'secret123' }
      logger.info('Login attempt', context)

      const entries = logger.getEntries()
      expect(entries[0].context?.password).toBe('[REDACTED]')
      expect(entries[0].context?.username).toBe('john')
    })
  })

  describe('Log Destinations', () => {
    it('should add and remove destinations', () => {
      const destination = {
        name: 'test',
        send: vi.fn().mockResolvedValue(undefined),
        isEnabled: () => true,
      }

      logger.addDestination(destination)
      logger.info('Test message')

      // Force flush
      logger.flushBatch()

      expect(destination.send).toHaveBeenCalled()

      logger.removeDestination('test')
    })
  })
})

describe('ErrorAggregator', () => {
  let aggregator: ErrorAggregator

  beforeEach(() => {
    aggregator = new ErrorAggregator()
  })

  afterEach(() => {
    aggregator.clear()
  })

  describe('Error Aggregation', () => {
    it('should aggregate similar errors', () => {
      const error1 = globalErrorManager.createTachUIError(
        new Error('Same error')
      )
      const error2 = globalErrorManager.createTachUIError(
        new Error('Same error')
      )

      aggregator.aggregateError(error1)
      aggregator.aggregateError(error2)

      const aggregations = aggregator.getAggregations()
      expect(aggregations).toHaveLength(1)
      expect(aggregations[0].count).toBe(2)
      expect(aggregations[0].message).toBe('Same error')
    })

    it('should track affected components', () => {
      const error1 = globalErrorManager.createTachUIError(
        new Error('Test error'),
        {
          componentId: 'component1',
        }
      )
      const error2 = globalErrorManager.createTachUIError(
        new Error('Test error'),
        {
          componentId: 'component2',
        }
      )

      aggregator.aggregateError(error1)
      aggregator.aggregateError(error2)

      const aggregations = aggregator.getAggregations()
      expect(aggregations[0].affectedComponents).toEqual([
        'component1',
        'component2',
      ])
    })

    it('should get top errors by count', () => {
      // Create errors with different frequencies
      for (let i = 0; i < 5; i++) {
        const error = globalErrorManager.createTachUIError(
          new Error('Frequent error')
        )
        aggregator.aggregateError(error)
      }

      for (let i = 0; i < 2; i++) {
        const error = globalErrorManager.createTachUIError(
          new Error('Less frequent error')
        )
        aggregator.aggregateError(error)
      }

      const topErrors = aggregator.getTopErrors(1)
      expect(topErrors).toHaveLength(1)
      expect(topErrors[0].message).toBe('Frequent error')
      expect(topErrors[0].count).toBe(5)
    })
  })
})

describe('Error Pattern Detection', () => {
  let detector: ErrorPatternDetector

  beforeEach(() => {
    detector = new ErrorPatternDetector()
  })

  describe('Pattern Analysis', () => {
    it('should detect error patterns', () => {
      const errors = [
        globalErrorManager.createTachUIError(new Error('Network timeout'), {
          category: 'network_error',
          componentName: 'ApiComponent',
        }),
        globalErrorManager.createTachUIError(new Error('Network timeout'), {
          category: 'network_error',
          componentName: 'ApiComponent',
        }),
        globalErrorManager.createTachUIError(new Error('Validation failed'), {
          category: 'validation_error',
          componentName: 'FormComponent',
        }),
      ]

      const analysis = detector.analyzePatterns(errors)

      expect(analysis.patterns.length).toBeGreaterThanOrEqual(2)

      // Find the network error pattern
      const networkPattern = analysis.patterns.find(p =>
        p.pattern.includes('network_error')
      )
      expect(networkPattern).toBeDefined()
      expect(networkPattern!.count).toBe(2)
    })

    it('should detect cascading errors', () => {
      const now = Date.now()
      const errors = [
        {
          ...globalErrorManager.createTachUIError(new Error('First error')),
          timestamp: now,
        },
        {
          ...globalErrorManager.createTachUIError(new Error('Second error')),
          timestamp: now + 500,
        },
        {
          ...globalErrorManager.createTachUIError(new Error('Third error')),
          timestamp: now + 800,
        },
      ]

      const analysis = detector.analyzePatterns(errors)

      expect(analysis.cascadingErrors).toHaveLength(1)
      expect(analysis.cascadingErrors[0]).toHaveLength(3)
    })
  })
})

describe('Stack Trace Analysis', () => {
  let analyzer: StackTraceAnalyzer

  beforeEach(() => {
    analyzer = new StackTraceAnalyzer()
  })

  describe('Stack Trace Parsing', () => {
    it('should analyze stack trace', () => {
      const error = globalErrorManager.createTachUIError(
        new Error('Test error'),
        {
          category: 'component_error',
        }
      )

      error.stack = `Error: Test error
    at TestComponent.render (test-component.js:15:10)
    at renderComponent (tachui-runtime.js:42:5)
    at main (app.js:10:3)`

      const analysis = analyzer.analyzeStackTrace(error)

      expect(analysis.frames).toHaveLength(3)
      expect(analysis.frames[0].function).toBe('TestComponent.render')
      expect(analysis.frames[0].file).toBe('test-component.js')
      expect(analysis.frames[0].line).toBe(15)
      expect(analysis.suggestedFixes).toContain(
        'Check component props and state'
      )
    })

    it('should generate category-specific suggestions', () => {
      const networkError = globalErrorManager.createTachUIError(
        new Error('Network error'),
        {
          category: 'network_error',
        }
      )

      const analysis = analyzer.analyzeStackTrace(networkError)

      expect(analysis.suggestedFixes).toContain('Check network connectivity')
      expect(analysis.suggestedFixes).toContain(
        'Verify API endpoints and request format'
      )
    })
  })
})

describe('Error Debug Utils', () => {
  beforeEach(() => {
    globalErrorManager.clear()
    globalErrorManager.configure({
      enabled: true,
      reportingThrottle: 0, // Disable throttling for tests
    })
  })

  afterEach(() => {
    globalErrorManager.clear()
  })

  describe('Error Analysis', () => {
    it('should generate comprehensive error report', () => {
      // Add some test errors
      const errors = [
        { category: 'component_error', severity: 'high' },
        { category: 'network_error', severity: 'medium' },
        { category: 'component_error', severity: 'low' },
      ]

      errors.forEach(({ category, severity }) => {
        const error = globalErrorManager.createTachUIError(
          new Error('Test error'),
          {
            category: category as any,
            severity: severity as any,
          }
        )
        globalErrorManager.reportError(error)
      })

      const report = errorDebugUtils.generateErrorReport()

      expect(report.totalErrors).toBe(3)
      expect(report.errorsByCategory.component_error).toBe(2)
      expect(report.errorsByCategory.network_error).toBe(1)
      expect(report.recommendations).toBeInstanceOf(Array)
    })

    it('should debug specific errors', () => {
      const error = globalErrorManager.createTachUIError(
        new Error('Test error'),
        {
          componentId: 'test-component',
        }
      )
      globalErrorManager.reportError(error)

      const debugInfo = errorDebugUtils.debugError(error.id)

      expect(debugInfo).toBeDefined()
      expect(debugInfo?.error).toEqual(error)
      expect(debugInfo?.stackTrace).toBeDefined()
      expect(debugInfo?.suggestions).toBeInstanceOf(Array)
    })

    it('should export error data', () => {
      const error = globalErrorManager.createTachUIError(
        new Error('Test error')
      )
      globalErrorManager.reportError(error)

      const exportData = errorDebugUtils.exportErrorData()

      expect(exportData.errors).toHaveLength(1)
      expect(exportData.analysis).toBeDefined()
      expect(exportData.timestamp).toBeTypeOf('number')
    })
  })

  describe('Error Simulation', () => {
    it('should simulate errors for testing', () => {
      errorDebugUtils.simulateError(
        'component_error',
        'high',
        'Simulated error'
      )

      const errors = globalErrorManager.getErrors()
      expect(errors).toHaveLength(1)
      expect(errors[0].message).toBe('Simulated error')
      expect(errors[0].category).toBe('component_error')
      expect(errors[0].severity).toBe('high')
    })
  })
})

describe('Recovery Utils', () => {
  describe('Function Wrappers', () => {
    it('should create robust function with all recovery mechanisms', async () => {
      let attempts = 0
      const flakyFn = async () => {
        attempts++
        if (attempts < 2) {
          // Succeed on 2nd attempt, within retry limit
          throw new Error('Temporary failure')
        }
        return 'success'
      }

      const robustFn = recoveryUtils.createRobustFunction(flakyFn, {
        retryPolicy: { maxAttempts: 3, baseDelay: 10, retryableErrors: [] },
        fallback: { value: 'fallback-value' },
      })

      const result = await robustFn()
      expect(result).toBe('success')
      expect(attempts).toBe(2)
    })

    it('should use fallback when all retries fail', async () => {
      const alwaysFailingFn = async () => {
        throw new Error('Always fails')
      }

      const robustFn = recoveryUtils.createRobustFunction(alwaysFailingFn, {
        retryPolicy: { maxAttempts: 2, baseDelay: 10 },
        fallback: { value: 'fallback-value' },
      })

      const result = await robustFn()
      expect(result).toBe('fallback-value')
    })

    it('should create simple retry wrapper', async () => {
      let attempts = 0
      const flakyFn = async () => {
        attempts++
        if (attempts < 2) {
          throw new Error('Temporary failure')
        }
        return 'success'
      }

      // Create retry policy that allows all errors to be retried
      const retryFn = recoveryUtils.withRetry(flakyFn, 3, 10)
      const result = await retryFn()

      expect(result).toBe('success')
      expect(attempts).toBe(2)
    })

    it('should create circuit breaker wrapper', async () => {
      const circuitBreakerFn = recoveryUtils.withCircuitBreaker(
        async () => 'success',
        {
          failureThreshold: 2,
        }
      )

      const result = await circuitBreakerFn()
      expect(result).toBe('success')
    })

    it('should create fallback wrapper', async () => {
      const fallbackFn = recoveryUtils.withFallback(async () => {
        throw new Error('Failed')
      }, 'fallback-value')

      const result = await fallbackFn()
      expect(result).toBe('fallback-value')
    })
  })
})

describe('Error Utils', () => {
  describe('Function Wrapping', () => {
    it('should wrap function with error handling', () => {
      const onError = vi.fn()
      const wrappedFn = errorUtils.withErrorHandling(
        () => {
          throw new Error('Test error')
        },
        { onError, fallback: 'fallback' }
      )

      const result = wrappedFn()

      expect(result).toBe('fallback')
      expect(onError).toHaveBeenCalled()
    })

    it('should wrap async function with error handling', async () => {
      const onError = vi.fn()
      const wrappedFn = errorUtils.withAsyncErrorHandling(
        async () => {
          throw new Error('Async error')
        },
        { onError, fallback: 'async-fallback' }
      )

      const result = await wrappedFn()

      expect(result).toBe('async-fallback')
      expect(onError).toHaveBeenCalled()
    })
  })
})
