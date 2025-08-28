/**
 * Simplified Plugin Error Handler - Week 3 Performance Enhancement
 * 
 * Enhanced error handling with performance optimizations:
 * - Error rate limiting and circuit breaker patterns
 * - Error aggregation and batch reporting
 * - Performance metrics for error handling
 * - Memory-efficient error tracking
 */

import type { TachUIPlugin } from './simplified-types'
import { PluginError } from './simplified-types'

interface ErrorMetrics {
  count: number
  lastOccurrence: number
  firstOccurrence: number
  errorTypes: Map<string, number>
  resolved: boolean
}

interface CircuitBreakerState {
  isOpen: boolean
  failureCount: number
  lastFailureTime: number
  resetTimeout?: number
}

export class OptimizedPluginErrorHandler {
  private errorMetrics = new Map<string, ErrorMetrics>()
  private circuitBreakers = new Map<string, CircuitBreakerState>()
  private errorQueue: Array<{ type: string; data: any; timestamp: number }> = []
  private batchTimer?: number
  
  // Configuration
  private maxFailuresBeforeCircuitBreak = 3
  private circuitBreakerResetTime = 30000 // 30 seconds
  private errorBatchSize = 10
  private errorBatchTimeout = 1000 // 1 second
  private maxErrorHistory = 100

  handleInstallError(plugin: TachUIPlugin, error: Error): void {
    const errorKey = `install:${plugin.name}`
    
    // Update error metrics
    this.recordError(errorKey, error)
    
    // Check circuit breaker
    if (this.isCircuitOpen(errorKey)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`🚫 Circuit breaker open for plugin ${plugin.name}, skipping detailed error handling`)
      }
      return
    }

    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ Failed to install plugin ${plugin.name}:`, error)
    }
    
    // Simple fallback strategies with performance considerations
    if (error instanceof PluginError) {
      this.recordErrorType(errorKey, `plugin-error-${error.code}`)
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Plugin ${plugin.name} installation failed with code: ${error.code}`)
      }
    }
    
    if (error.message.includes('dependencies')) {
      this.recordErrorType(errorKey, 'dependency-error')
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Plugin ${plugin.name} has unmet dependencies`)
      }
    }
    
    // Queue error for batch emission
    this.queueError('plugin-install-failed', { plugin: { name: plugin.name, version: plugin.version }, error: error.message })
  }

  handleRuntimeError(pluginName: string, error: Error): void {
    const errorKey = `runtime:${pluginName}`
    
    // Update error metrics
    this.recordError(errorKey, error)
    
    // Check circuit breaker
    if (this.isCircuitOpen(errorKey)) {
      return
    }

    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ Runtime error in plugin ${pluginName}:`, error)
    }
    
    // Simple recovery - log error and continue
    if (error instanceof PluginError && error.code === 'CRITICAL') {
      this.recordErrorType(errorKey, 'critical-error')
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Plugin ${pluginName} encountered a critical error`)
      }
      this.queueError('plugin-critical-error', { pluginName, error: error.message })
    } else {
      this.recordErrorType(errorKey, 'runtime-error')
      this.queueError('plugin-runtime-error', { pluginName, error: error.message })
    }
  }

  handleUninstallError(pluginName: string, error: Error): void {
    const errorKey = `uninstall:${pluginName}`
    
    // Update error metrics
    this.recordError(errorKey, error)

    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ Failed to uninstall plugin ${pluginName}:`, error)
      console.warn(`Plugin ${pluginName} may not have cleaned up properly`)
    }
    
    this.queueError('plugin-uninstall-error', { pluginName, error: error.message })
  }

  private recordError(errorKey: string, _error: Error): void {
    const now = performance.now()
    
    if (!this.errorMetrics.has(errorKey)) {
      this.errorMetrics.set(errorKey, {
        count: 0,
        lastOccurrence: now,
        firstOccurrence: now,
        errorTypes: new Map(),
        resolved: false
      })
    }
    
    const metrics = this.errorMetrics.get(errorKey)!
    metrics.count++
    metrics.lastOccurrence = now
    metrics.resolved = false
    
    // Update circuit breaker
    this.updateCircuitBreaker(errorKey)
  }

  private recordErrorType(errorKey: string, errorType: string): void {
    const metrics = this.errorMetrics.get(errorKey)
    if (metrics) {
      const currentCount = metrics.errorTypes.get(errorType) || 0
      metrics.errorTypes.set(errorType, currentCount + 1)
    }
  }

  private updateCircuitBreaker(errorKey: string): void {
    if (!this.circuitBreakers.has(errorKey)) {
      this.circuitBreakers.set(errorKey, {
        isOpen: false,
        failureCount: 0,
        lastFailureTime: 0
      })
    }
    
    const breaker = this.circuitBreakers.get(errorKey)!
    breaker.failureCount++
    breaker.lastFailureTime = performance.now()
    
    // Open circuit if too many failures
    if (breaker.failureCount >= this.maxFailuresBeforeCircuitBreak && !breaker.isOpen) {
      breaker.isOpen = true
      
      if (process.env.NODE_ENV === 'development') {
        console.warn(`🚫 Circuit breaker opened for ${errorKey} after ${breaker.failureCount} failures`)
      }
      
      // Schedule circuit reset
      breaker.resetTimeout = window.setTimeout(() => {
        this.resetCircuitBreaker(errorKey)
      }, this.circuitBreakerResetTime)
    }
  }

  private isCircuitOpen(errorKey: string): boolean {
    const breaker = this.circuitBreakers.get(errorKey)
    return breaker ? breaker.isOpen : false
  }

  private resetCircuitBreaker(errorKey: string): void {
    const breaker = this.circuitBreakers.get(errorKey)
    if (breaker) {
      breaker.isOpen = false
      breaker.failureCount = 0
      
      if (breaker.resetTimeout) {
        clearTimeout(breaker.resetTimeout)
        breaker.resetTimeout = undefined
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 Circuit breaker reset for ${errorKey}`)
      }
    }
  }

  private queueError(type: string, data: any): void {
    // Add to queue with memory management
    this.errorQueue.push({
      type,
      data,
      timestamp: performance.now()
    })
    
    // Limit queue size
    if (this.errorQueue.length > this.maxErrorHistory) {
      this.errorQueue = this.errorQueue.slice(-this.maxErrorHistory)
    }
    
    // Batch process errors
    if (this.errorQueue.length >= this.errorBatchSize) {
      this.flushErrorQueue()
    } else if (!this.batchTimer) {
      this.batchTimer = window.setTimeout(() => {
        this.flushErrorQueue()
      }, this.errorBatchTimeout)
    }
  }

  private flushErrorQueue(): void {
    if (this.errorQueue.length === 0) return
    
    // Process batched errors
    const errors = [...this.errorQueue]
    this.errorQueue = []
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = undefined
    }
    
    // Emit batched errors
    for (const error of errors) {
      this.emitError(error.type, error.data)
    }
    
    if (process.env.NODE_ENV === 'development' && errors.length > 1) {
      console.log(`📦 Processed ${errors.length} batched errors`)
    }
  }

  private emitError(type: string, data: any): void {
    // Simple event emission for application error handling
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(`tachui:${type}`, { detail: data }))
    } else if (typeof process !== 'undefined' && process.emit) {
      process.emit(`tachui:${type}` as any, data)
    }
  }

  // Performance monitoring methods
  
  getErrorMetrics(errorKey?: string): ErrorMetrics | Map<string, ErrorMetrics> {
    if (errorKey) {
      return this.errorMetrics.get(errorKey) || {
        count: 0,
        lastOccurrence: 0,
        firstOccurrence: 0,
        errorTypes: new Map(),
        resolved: true
      }
    }
    return new Map(this.errorMetrics)
  }

  getCircuitBreakerStatus(errorKey?: string): CircuitBreakerState | Map<string, CircuitBreakerState> {
    if (errorKey) {
      return this.circuitBreakers.get(errorKey) || {
        isOpen: false,
        failureCount: 0,
        lastFailureTime: 0
      }
    }
    return new Map(this.circuitBreakers)
  }

  getPerformanceStats() {
    const allErrors = Array.from(this.errorMetrics.entries())
    const totalErrors = allErrors.reduce((sum, [, metrics]) => sum + metrics.count, 0)
    const activeCircuits = Array.from(this.circuitBreakers.values()).filter(cb => cb.isOpen).length
    
    const errorsByType = new Map<string, number>()
    for (const [, metrics] of allErrors) {
      for (const [type, count] of metrics.errorTypes) {
        errorsByType.set(type, (errorsByType.get(type) || 0) + count)
      }
    }
    
    return {
      totalErrors,
      uniqueErrorKeys: this.errorMetrics.size,
      activeCircuitBreakers: activeCircuits,
      queuedErrors: this.errorQueue.length,
      errorsByType: Object.fromEntries(errorsByType),
      memoryUsage: {
        errorMetrics: this.errorMetrics.size,
        circuitBreakers: this.circuitBreakers.size,
        queuedErrors: this.errorQueue.length,
        estimatedMemoryKB: (this.errorMetrics.size * 2) + (this.circuitBreakers.size * 1) + (this.errorQueue.length * 0.5)
      }
    }
  }

  markErrorResolved(errorKey: string): void {
    const metrics = this.errorMetrics.get(errorKey)
    if (metrics) {
      metrics.resolved = true
      
      // Reset circuit breaker if error is resolved
      this.resetCircuitBreaker(errorKey)
    }
  }

  clearErrorHistory(errorKey?: string): void {
    if (errorKey) {
      this.errorMetrics.delete(errorKey)
      this.circuitBreakers.delete(errorKey)
    } else {
      this.errorMetrics.clear()
      this.circuitBreakers.clear()
      this.errorQueue = []
      
      if (this.batchTimer) {
        clearTimeout(this.batchTimer)
        this.batchTimer = undefined
      }
    }
  }
}

// Global error handler instance
export const globalPluginErrorHandler = new OptimizedPluginErrorHandler()

// Maintain backward compatibility alias
export const SimplifiedPluginErrorHandler = OptimizedPluginErrorHandler

/**
 * Simple error recovery utilities
 */
export const ErrorRecoveryUtils = {
  /**
   * Safely execute plugin operation with error handling
   */
  async safeExecute<T>(
    pluginName: string,
    operation: string,
    fn: () => Promise<T> | T
  ): Promise<T | undefined> {
    try {
      return await fn()
    } catch (error) {
      console.error(`❌ [${pluginName}] ${operation} failed:`, error)
      globalPluginErrorHandler.handleRuntimeError(pluginName, error as Error)
      return undefined
    }
  },

  /**
   * Create an error boundary for plugin operations
   */
  createErrorBoundary(pluginName: string) {
    return {
      async exec<T>(fn: () => Promise<T> | T): Promise<T | undefined> {
        return ErrorRecoveryUtils.safeExecute(pluginName, 'operation', fn)
      }
    }
  }
}