/**
 * Plugin System Performance Tests - Week 3 Implementation
 *
 * Tests for the Week 3 performance optimizations:
 * - Lazy loading performance and caching
 * - Error handling circuit breaker and batching
 * - Memory management and resource cleanup
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { OptimizedLazyPluginLoader } from '../../src/plugins/simplified-lazy-loader'
import { OptimizedPluginErrorHandler } from '@tachui/devtools'
import type { TachUIPlugin, TachUIInstance } from '@tachui/core'

// PluginError class for testing
class PluginError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'PluginError'
  }
}

// Mock plugin for testing
const createMockPlugin = (name: string = 'test-plugin'): TachUIPlugin => ({
  name,
  version: '1.0.0',
  install: vi.fn().mockResolvedValue(undefined),
  uninstall: vi.fn().mockResolvedValue(undefined),
})

// Mock TachUI instance
const createMockInstance = (): TachUIInstance => ({
  plugins: {} as any,
  components: {} as any,
  services: new Map(),
  registerComponent: vi.fn(),
  registerService: vi.fn(),
})

describe('Week 3: Runtime Performance Optimization', () => {
  describe('OptimizedLazyPluginLoader', () => {
    let loader: OptimizedLazyPluginLoader

    beforeEach(() => {
      loader = new OptimizedLazyPluginLoader()
      vi.clearAllMocks()
      // Clear performance timing
      vi.spyOn(performance, 'now').mockReturnValue(0)
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    test('caches loaded plugins for performance', async () => {
      const mockPlugin = createMockPlugin()

      // Mock the dynamic import by directly calling the loader's internal method
      vi.spyOn(loader as any, 'doLoadPlugin').mockImplementation(
        async (pluginName: string) => {
          if (pluginName === 'test-plugin') {
            return mockPlugin
          }
          throw new Error(`Plugin ${pluginName} not found`)
        }
      )

      // First load
      const plugin1 = await loader.loadPlugin('test-plugin')
      expect(loader['doLoadPlugin']).toHaveBeenCalledTimes(1)

      // Second load should use cache
      const plugin2 = await loader.loadPlugin('test-plugin')
      expect(loader['doLoadPlugin']).toHaveBeenCalledTimes(1) // Still only called once
      expect(plugin1).toBe(plugin2) // Same instance

      // Verify loading status
      expect(loader.isLoaded('test-plugin')).toBe(true)
    })

    test('handles concurrent loading requests efficiently', async () => {
      const mockPlugin = createMockPlugin('concurrent-plugin')
      let callCount = 0

      // Mock the dynamic import with delay
      vi.spyOn(loader as any, 'doLoadPlugin').mockImplementation(
        async (pluginName: string) => {
          callCount++
          if (pluginName === 'concurrent-plugin') {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 10))
            return mockPlugin
          }
          throw new Error(`Plugin ${pluginName} not found`)
        }
      )

      // Start multiple concurrent loads
      const loadPromises = [
        loader.loadPlugin('concurrent-plugin'),
        loader.loadPlugin('concurrent-plugin'),
        loader.loadPlugin('concurrent-plugin'),
      ]

      const results = await Promise.all(loadPromises)

      // Should only call doLoadPlugin once despite concurrent requests
      expect(callCount).toBe(1)
      // All should return the same instance
      expect(results[0]).toBe(results[1])
      expect(results[1]).toBe(results[2])
    })

    test('retry logic with exponential backoff', async () => {
      let attempts = 0
      const mockPlugin = createMockPlugin('retry-plugin')

      // Mock the dynamic import with failures then success
      vi.spyOn(loader as any, 'doLoadPlugin').mockImplementation(
        async (pluginName: string) => {
          attempts++
          if (pluginName === 'retry-plugin') {
            if (attempts < 3) {
              throw new Error('Network error')
            }
            return mockPlugin
          }
          throw new Error(`Plugin ${pluginName} not found`)
        }
      )

      const plugin = await loader.loadPlugin('retry-plugin')

      expect(plugin).toBeDefined()
      expect(attempts).toBe(3)

      // Verify metrics show multiple attempts
      const metrics = loader.getLoadMetrics('retry-plugin')
      expect(metrics?.attempts).toBe(3)
      expect(metrics?.success).toBe(true)
    })

    test('performance metrics tracking', async () => {
      const mockPlugin = createMockPlugin('perf-plugin')

      // Mock the dynamic import
      vi.spyOn(loader as any, 'doLoadPlugin').mockImplementation(
        async (pluginName: string) => {
          if (pluginName === 'perf-plugin') {
            return mockPlugin
          }
          throw new Error(`Plugin ${pluginName} not found`)
        }
      )

      const startTime = 100
      const endTime = 150
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(startTime)
        .mockReturnValueOnce(endTime)

      await loader.loadPlugin('perf-plugin')

      const stats = loader.getPerformanceStats()
      expect(stats.totalPlugins).toBe(1)
      expect(stats.successful).toBe(1)
      expect(stats.failed).toBe(0)
      expect(stats.averageLoadTime).toBe(50)
      expect(stats.cached).toBe(1)
    })

    test('memory management and cleanup', () => {
      const plugin = createMockPlugin('memory-test')

      // Load plugin to cache
      loader['loadedPlugins'].set('memory-test', plugin)
      loader['loadMetrics'].set('memory-test', {
        startTime: 0,
        endTime: 100,
        duration: 100,
        attempts: 1,
        success: true,
        cacheHit: false,
      })

      expect(loader.isLoaded('memory-test')).toBe(true)

      // Unload plugin
      loader.unloadPlugin('memory-test')

      expect(loader.isLoaded('memory-test')).toBe(false)

      // Verify memory usage calculation
      const memoryUsage = loader.getMemoryUsage()
      expect(memoryUsage.loadedPlugins).toBe(0)
      expect(memoryUsage.estimatedMemoryKB).toBeGreaterThanOrEqual(0)
    })
  })

  describe('OptimizedPluginErrorHandler', () => {
    let errorHandler: OptimizedPluginErrorHandler
    let mockPlugin: TachUIPlugin

    beforeEach(() => {
      errorHandler = new OptimizedPluginErrorHandler()
      mockPlugin = createMockPlugin('error-test-plugin')
      vi.clearAllMocks()
      vi.spyOn(performance, 'now').mockReturnValue(1000)
    })

    afterEach(() => {
      vi.restoreAllMocks()
      errorHandler.clearErrorHistory()
    })

    test('circuit breaker pattern prevents excessive error handling', () => {
      // Set development environment for console warnings
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const error = new PluginError('Test error', 'TEST_ERROR')

      // Trigger errors to open circuit breaker (3 failures by default)
      errorHandler.handleInstallError(mockPlugin, error)
      errorHandler.handleInstallError(mockPlugin, error)
      errorHandler.handleInstallError(mockPlugin, error)

      const circuitStatus = errorHandler.getCircuitBreakerStatus(
        'install:error-test-plugin'
      ) as any
      expect(circuitStatus.isOpen).toBe(true)
      expect(circuitStatus.failureCount).toBe(3)

      // Further errors should be short-circuited
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      errorHandler.handleInstallError(mockPlugin, error)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Circuit breaker open for plugin error-test-plugin'
        )
      )

      // Restore environment
      process.env.NODE_ENV = originalEnv
    })

    test('error metrics tracking and aggregation', () => {
      // Clear any previous state
      errorHandler.clearErrorHistory()

      const error1 = new PluginError('First error', 'ERROR_1')
      const error2 = new Error('Second error')

      errorHandler.handleInstallError(mockPlugin, error1)
      errorHandler.handleRuntimeError('error-test-plugin', error2)

      const stats = errorHandler.getPerformanceStats()
      expect(stats.totalErrors).toBe(2)
      expect(stats.uniqueErrorKeys).toBe(2)
      expect(stats.errorsByType['plugin-error-ERROR_1']).toBe(1)
      expect(stats.errorsByType['runtime-error']).toBeGreaterThanOrEqual(1)
    })

    test('error batching reduces event emission overhead', done => {
      const eventSpy = vi.spyOn(window, 'dispatchEvent')

      // Generate multiple errors quickly
      const errors = Array.from(
        { length: 5 },
        (_, i) => new Error(`Batch error ${i}`)
      )

      errors.forEach(error => {
        errorHandler.handleRuntimeError('batch-test', error)
      })

      // Errors should be queued, not immediately emitted
      expect(eventSpy).not.toHaveBeenCalled()

      // Wait for batch processing
      setTimeout(() => {
        // Should emit 5 separate error events after batching
        expect(eventSpy).toHaveBeenCalledTimes(5)

        errors.forEach((_, i) => {
          expect(eventSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              type: 'tachui:plugin-runtime-error',
            })
          )
        })

        done()
      }, 1100) // Slightly longer than batch timeout (1000ms)
    })

    test('memory-efficient error history management', () => {
      // Generate more errors than the max history limit (100)
      for (let i = 0; i < 120; i++) {
        errorHandler.handleRuntimeError(`plugin-${i}`, new Error(`Error ${i}`))
      }

      const stats = errorHandler.getPerformanceStats()

      // Should not exceed memory limits
      expect(stats.memoryUsage.estimatedMemoryKB).toBeLessThan(1000) // Reasonable memory usage

      // Error history should be trimmed
      expect(stats.queuedErrors).toBeLessThanOrEqual(100)
    })

    test('error resolution and circuit breaker reset', () => {
      const error = new PluginError('Test error', 'TEST')

      // Open circuit breaker
      errorHandler.handleInstallError(mockPlugin, error)
      errorHandler.handleInstallError(mockPlugin, error)
      errorHandler.handleInstallError(mockPlugin, error)

      let circuitStatus = errorHandler.getCircuitBreakerStatus(
        'install:error-test-plugin'
      ) as any
      expect(circuitStatus.isOpen).toBe(true)

      // Mark error as resolved
      errorHandler.markErrorResolved('install:error-test-plugin')

      // Circuit should be reset
      circuitStatus = errorHandler.getCircuitBreakerStatus(
        'install:error-test-plugin'
      ) as any
      expect(circuitStatus.isOpen).toBe(false)
      expect(circuitStatus.failureCount).toBe(0)

      // Error metrics should show resolution
      const metrics = errorHandler.getErrorMetrics(
        'install:error-test-plugin'
      ) as any
      expect(metrics.resolved).toBe(true)
    })

    test('performance impact measurement', () => {
      const startTime = performance.now()

      // Handle multiple errors and measure performance
      const errors = Array.from(
        { length: 100 },
        () => new Error('Performance test')
      )

      const start = performance.now()
      errors.forEach(error => {
        errorHandler.handleRuntimeError('perf-test', error)
      })
      const end = performance.now()

      const processingTime = end - start

      // Error handling should be fast (less than 50ms for 100 errors)
      expect(processingTime).toBeLessThan(50)

      const stats = errorHandler.getPerformanceStats()
      expect(stats.totalErrors).toBe(100)
      expect(stats.memoryUsage.estimatedMemoryKB).toBeLessThan(100)
    })
  })

  describe('Integration Performance Tests', () => {
    test('combined lazy loading and error handling performance', async () => {
      const loader = new OptimizedLazyPluginLoader()
      const errorHandler = new OptimizedPluginErrorHandler()
      const mockPlugin = createMockPlugin('integration-test')

      // Mock the dynamic import for testing
      vi.spyOn(loader as any, 'doLoadPlugin').mockImplementation(
        async (pluginName: string) => {
          if (pluginName === 'integration-test') {
            return mockPlugin
          }
          throw new Error(`Plugin ${pluginName} not found`)
        }
      )

      const startTime = performance.now()

      try {
        const plugin = await loader.loadPlugin('integration-test')
        expect(plugin).toBeDefined()
      } catch (error) {
        errorHandler.handleRuntimeError('integration-test', error as Error)
      }

      const endTime = performance.now()
      const totalTime = endTime - startTime

      // Total integration time should be reasonable (increased threshold for test environment)
      expect(totalTime).toBeLessThan(1000) // 1 second is generous for tests

      // Verify both systems are working
      expect(loader.isLoaded('integration-test')).toBe(true)

      const loaderStats = loader.getPerformanceStats()
      const errorStats = errorHandler.getPerformanceStats()

      expect(loaderStats.successful).toBe(1)
      expect(errorStats.totalErrors).toBe(0) // No errors in successful case
    })
  })
})
