/**
 * Error Handling Utilities and Debugging Tools (Phase 3.2.3)
 *
 * Comprehensive utilities for error handling, debugging, and development tools.
 * Provides helper functions, debugging aids, and error analysis tools.
 */

import { createComputed, createSignal } from '../reactive'
import type { ErrorCategory, ErrorSeverity, TachUIError } from './error-boundary'
import { globalErrorManager } from './error-boundary'
import type { ErrorAggregation, LogEntry } from './error-reporting'
import { globalErrorAggregator, globalLogger } from './error-reporting'

/**
 * Error analysis result
 */
export interface ErrorAnalysis {
  totalErrors: number
  errorsByCategory: Record<ErrorCategory, number>
  errorsBySeverity: Record<ErrorSeverity, number>
  topErrors: ErrorAggregation[]
  recentErrors: TachUIError[]
  errorTrends: {
    category: ErrorCategory
    trend: 'increasing' | 'decreasing' | 'stable'
    change: number
  }[]
  recommendations: string[]
}

/**
 * Stack trace analysis
 */
export interface StackTraceAnalysis {
  frames: {
    function: string
    file: string
    line: number
    column: number
    source?: string
  }[]
  rootCause?: string
  affectedComponents: string[]
  suggestedFixes: string[]
}

/**
 * Performance impact analysis
 */
export interface PerformanceImpact {
  errorCount: number
  averageRenderTime: number
  memoryUsage: number
  affectedComponents: string[]
  performanceDegradation: number
}

/**
 * Error pattern detector
 */
export class ErrorPatternDetector {
  private windowSize = 100 // Number of recent errors to analyze

  /**
   * Analyze error patterns
   */
  analyzePatterns(errors: TachUIError[]): {
    patterns: { pattern: string; count: number; severity: 'low' | 'medium' | 'high' }[]
    cascadingErrors: TachUIError[][]
    correlations: { error1: string; error2: string; correlation: number }[]
  } {
    const recentErrors = errors.slice(-this.windowSize)

    // Detect patterns
    const errorPatterns = this.detectErrorPatterns(recentErrors)

    // Detect cascading errors
    const cascadingErrors = this.detectCascadingErrors(recentErrors)

    // Detect correlations
    const correlations = this.detectErrorCorrelations(recentErrors)

    return { patterns: errorPatterns, cascadingErrors, correlations }
  }

  /**
   * Detect error patterns
   */
  private detectErrorPatterns(errors: TachUIError[]): {
    pattern: string
    count: number
    severity: 'low' | 'medium' | 'high'
  }[] {
    const patterns = new Map<string, number>()

    for (const error of errors) {
      // Pattern by category + component
      const categoryPattern = `${error.category}:${error.componentName || 'unknown'}`
      patterns.set(categoryPattern, (patterns.get(categoryPattern) || 0) + 1)

      // Pattern by message similarity
      const messagePattern = this.extractMessagePattern(error.message)
      patterns.set(messagePattern, (patterns.get(messagePattern) || 0) + 1)
    }

    return Array.from(patterns.entries())
      .map(([pattern, count]) => ({
        pattern,
        count,
        severity: (count > 10 ? 'high' : count > 5 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
      }))
      .sort((a, b) => b.count - a.count)
  }

  /**
   * Extract pattern from error message
   */
  private extractMessagePattern(message: string): string {
    return message
      .replace(/\d+/g, 'N') // Replace numbers
      .replace(/['"]/g, '') // Remove quotes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .toLowerCase()
  }

  /**
   * Detect cascading errors (errors that happen close together)
   */
  private detectCascadingErrors(errors: TachUIError[]): TachUIError[][] {
    const cascades: TachUIError[][] = []
    const timeWindow = 1000 // 1 second

    for (let i = 0; i < errors.length; i++) {
      const cascade = [errors[i]]

      for (let j = i + 1; j < errors.length; j++) {
        if (errors[j].timestamp - errors[i].timestamp <= timeWindow) {
          cascade.push(errors[j])
        } else {
          break
        }
      }

      if (cascade.length > 1) {
        cascades.push(cascade)
        i += cascade.length - 1 // Skip processed errors
      }
    }

    return cascades
  }

  /**
   * Detect error correlations
   */
  private detectErrorCorrelations(errors: TachUIError[]): {
    error1: string
    error2: string
    correlation: number
  }[] {
    const correlations: { error1: string; error2: string; correlation: number }[] = []
    const errorTypes = new Set(errors.map((e) => e.message))

    for (const type1 of errorTypes) {
      for (const type2 of errorTypes) {
        if (type1 >= type2) continue

        const correlation = this.calculateCorrelation(errors, type1, type2)
        if (correlation > 0.5) {
          correlations.push({ error1: type1, error2: type2, correlation })
        }
      }
    }

    return correlations.sort((a, b) => b.correlation - a.correlation)
  }

  /**
   * Calculate correlation between two error types
   */
  private calculateCorrelation(errors: TachUIError[], type1: string, type2: string): number {
    const windows = 5000 // 5 second windows
    const timeSlots = new Map<number, { type1: boolean; type2: boolean }>()

    for (const error of errors) {
      const slot = Math.floor(error.timestamp / windows)
      const existing = timeSlots.get(slot) || { type1: false, type2: false }

      if (error.message === type1) existing.type1 = true
      if (error.message === type2) existing.type2 = true

      timeSlots.set(slot, existing)
    }

    const slots = Array.from(timeSlots.values())
    const both = slots.filter((s) => s.type1 && s.type2).length
    const either = slots.filter((s) => s.type1 || s.type2).length

    return either > 0 ? both / either : 0
  }
}

/**
 * Stack trace analyzer
 */
export class StackTraceAnalyzer {
  /**
   * Analyze stack trace
   */
  analyzeStackTrace(error: TachUIError): StackTraceAnalysis {
    if (!error.stack) {
      return {
        frames: [],
        affectedComponents: [],
        suggestedFixes: [],
      }
    }

    const frames = this.parseStackTrace(error.stack)
    const rootCause = this.identifyRootCause(frames, error)
    const affectedComponents = this.extractAffectedComponents(frames)
    const suggestedFixes = this.generateSuggestedFixes(error, frames)

    return {
      frames,
      rootCause,
      affectedComponents,
      suggestedFixes,
    }
  }

  /**
   * Parse stack trace into frames
   */
  private parseStackTrace(stack: string): StackTraceAnalysis['frames'] {
    const lines = stack.split('\n').slice(1) // Skip error message
    const frames: StackTraceAnalysis['frames'] = []

    for (const line of lines) {
      const match =
        line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/) || line.match(/at\s+(.+?):(\d+):(\d+)/)

      if (match) {
        if (match.length === 5) {
          frames.push({
            function: match[1] || 'anonymous',
            file: match[2],
            line: parseInt(match[3]),
            column: parseInt(match[4]),
          })
        } else if (match.length === 4) {
          frames.push({
            function: 'anonymous',
            file: match[1],
            line: parseInt(match[2]),
            column: parseInt(match[3]),
          })
        }
      }
    }

    return frames
  }

  /**
   * Identify root cause from stack trace
   */
  private identifyRootCause(
    frames: StackTraceAnalysis['frames'],
    _error: TachUIError
  ): string | undefined {
    // Look for TachUI-specific frames
    const tachUIFrames = frames.filter(
      (f) =>
        f.file.includes('tachui') ||
        f.function.includes('Component') ||
        f.function.includes('render')
    )

    if (tachUIFrames.length > 0) {
      const firstFrame = tachUIFrames[0]
      return `Error in ${firstFrame.function} at ${firstFrame.file}:${firstFrame.line}`
    }

    // Fallback to first frame
    if (frames.length > 0) {
      const firstFrame = frames[0]
      return `Error in ${firstFrame.function}`
    }

    return undefined
  }

  /**
   * Extract affected components from stack trace
   */
  private extractAffectedComponents(frames: StackTraceAnalysis['frames']): string[] {
    const components = new Set<string>()

    for (const frame of frames) {
      // Extract component names from function names
      const match = frame.function.match(/(\w+Component)|(\w+\.render)/)
      if (match) {
        components.add(match[1] || match[2].replace('.render', ''))
      }
    }

    return Array.from(components)
  }

  /**
   * Generate suggested fixes
   */
  private generateSuggestedFixes(
    error: TachUIError,
    frames: StackTraceAnalysis['frames']
  ): string[] {
    const fixes: string[] = []

    // Category-specific suggestions
    switch (error.category) {
      case 'component_error':
        fixes.push('Check component props and state')
        fixes.push('Verify component lifecycle methods')
        if (frames.some((f) => f.function.includes('render'))) {
          fixes.push('Review render method for potential null/undefined values')
        }
        break

      case 'reactive_error':
        fixes.push('Check signal dependencies and computed values')
        fixes.push('Verify effect cleanup functions')
        break

      case 'render_error':
        fixes.push('Check DOM element references')
        fixes.push('Verify element properties and attributes')
        break

      case 'validation_error':
        fixes.push('Review input validation logic')
        fixes.push('Check data types and required fields')
        break

      case 'network_error':
        fixes.push('Check network connectivity')
        fixes.push('Verify API endpoints and request format')
        fixes.push('Implement proper error handling for network requests')
        break
    }

    // Message-specific suggestions
    if (error.message.includes('null') || error.message.includes('undefined')) {
      fixes.push('Add null/undefined checks before accessing properties')
    }

    if (error.message.includes('TypeError')) {
      fixes.push('Verify variable types and method availability')
    }

    return fixes
  }
}

/**
 * Performance impact analyzer
 */
export class PerformanceImpactAnalyzer {
  /**
   * Analyze performance impact of errors
   */
  analyzePerformanceImpact(errors: TachUIError[]): PerformanceImpact {
    const errorCount = errors.length
    const affectedComponents = [...new Set(errors.map((e) => e.componentId).filter(Boolean))]

    // This would integrate with performance monitoring in a real implementation
    const averageRenderTime = this.calculateAverageRenderTime(affectedComponents)
    const memoryUsage = this.calculateMemoryUsage(affectedComponents)
    const performanceDegradation = this.calculatePerformanceDegradation(errors)

    return {
      errorCount,
      averageRenderTime,
      memoryUsage,
      affectedComponents: affectedComponents as string[],
      performanceDegradation,
    }
  }

  /**
   * Calculate average render time for affected components
   */
  private calculateAverageRenderTime(componentIds: (string | undefined)[]): number {
    // Simplified calculation - would integrate with performance monitor
    return componentIds.length * 2.5 // Estimated overhead per component
  }

  /**
   * Calculate memory usage impact
   */
  private calculateMemoryUsage(componentIds: (string | undefined)[]): number {
    // Simplified calculation - would integrate with performance monitor
    return componentIds.length * 1024 * 10 // Estimated 10KB per affected component
  }

  /**
   * Calculate performance degradation percentage
   */
  private calculatePerformanceDegradation(errors: TachUIError[]): number {
    const severityWeights = { low: 1, medium: 3, high: 5, critical: 10 }
    const totalWeight = errors.reduce((sum, error) => sum + severityWeights[error.severity], 0)

    // Convert to percentage degradation (capped at 100%)
    return Math.min(totalWeight * 2, 100)
  }
}

/**
 * Error debugging utilities
 */
export const errorDebugUtils = {
  /**
   * Generate comprehensive error report
   */
  generateErrorReport(): ErrorAnalysis {
    const errors = globalErrorManager.getErrors()
    const aggregations = globalErrorAggregator.getAggregations()
    const statistics = globalErrorManager.getStatistics()

    const patternDetector = new ErrorPatternDetector()
    const patterns = patternDetector.analyzePatterns(errors)

    // Calculate trends (simplified)
    const errorTrends = Object.entries(statistics.errorsByCategory).map(([category, _count]) => ({
      category: category as ErrorCategory,
      trend: 'stable' as const, // Would calculate from historical data
      change: 0,
    }))

    // Generate recommendations
    const recommendations = this.generateRecommendations(errors, aggregations, patterns)

    return {
      totalErrors: statistics.totalErrors,
      errorsByCategory: statistics.errorsByCategory,
      errorsBySeverity: statistics.errorsBySeverity,
      topErrors: aggregations.slice(0, 10),
      recentErrors: errors.slice(-10),
      errorTrends,
      recommendations,
    }
  },

  /**
   * Generate recommendations based on error analysis
   */
  generateRecommendations(
    errors: TachUIError[],
    _aggregations: ErrorAggregation[],
    patterns: any
  ): string[] {
    const recommendations: string[] = []

    // High error count recommendations
    if (errors.length > 50) {
      recommendations.push('Consider implementing error boundaries to contain errors')
      recommendations.push('Review error handling strategies across components')
    }

    // Component-specific recommendations
    const componentErrors = errors.filter((e) => e.category === 'component_error')
    if (componentErrors.length > 10) {
      recommendations.push('Review component lifecycle methods and state management')
      recommendations.push('Add prop validation to prevent runtime errors')
    }

    // Network error recommendations
    const networkErrors = errors.filter((e) => e.category === 'network_error')
    if (networkErrors.length > 5) {
      recommendations.push('Implement retry logic for network requests')
      recommendations.push('Add proper error handling for API calls')
    }

    // Performance recommendations
    if (patterns.cascadingErrors.length > 0) {
      recommendations.push('Investigate cascading errors that may indicate systemic issues')
    }

    return recommendations
  },

  /**
   * Debug specific error
   */
  debugError(errorId: string): {
    error: TachUIError | null
    stackTrace: StackTraceAnalysis
    relatedErrors: TachUIError[]
    performanceImpact: PerformanceImpact
    suggestions: string[]
  } | null {
    const error = globalErrorManager.getErrors().find((e) => e.id === errorId)
    if (!error) return null

    const stackTraceAnalyzer = new StackTraceAnalyzer()
    const performanceAnalyzer = new PerformanceImpactAnalyzer()

    const stackTrace = stackTraceAnalyzer.analyzeStackTrace(error)
    const relatedErrors = this.findRelatedErrors(error)
    const performanceImpact = performanceAnalyzer.analyzePerformanceImpact([
      error,
      ...relatedErrors,
    ])
    const suggestions = this.generateErrorSuggestions(error, stackTrace, relatedErrors)

    return {
      error,
      stackTrace,
      relatedErrors,
      performanceImpact,
      suggestions,
    }
  },

  /**
   * Find related errors
   */
  findRelatedErrors(error: TachUIError): TachUIError[] {
    const allErrors = globalErrorManager.getErrors()
    const timeWindow = 5000 // 5 seconds

    return allErrors.filter(
      (e) =>
        e.id !== error.id &&
        Math.abs(e.timestamp - error.timestamp) <= timeWindow &&
        (e.componentId === error.componentId || e.category === error.category)
    )
  },

  /**
   * Generate error-specific suggestions
   */
  generateErrorSuggestions(
    error: TachUIError,
    stackTrace: StackTraceAnalysis,
    relatedErrors: TachUIError[]
  ): string[] {
    const suggestions = [...stackTrace.suggestedFixes]

    if (relatedErrors.length > 0) {
      suggestions.push('Multiple related errors detected - check for common root cause')
    }

    if (error.retryCount > 0) {
      suggestions.push('Error has been retried - consider implementing circuit breaker')
    }

    return suggestions
  },

  /**
   * Log error analysis to console
   */
  logErrorAnalysis(): void {
    const analysis = this.generateErrorReport()

    console.group('🚨 TachUI Error Analysis')
    console.log(`Total Errors: ${analysis.totalErrors}`)
    console.log('Errors by Category:', analysis.errorsByCategory)
    console.log('Errors by Severity:', analysis.errorsBySeverity)

    if (analysis.topErrors.length > 0) {
      console.group('Top Errors')
      analysis.topErrors.forEach((error) => {
        console.log(`${error.message} (${error.count} times)`)
      })
      console.groupEnd()
    }

    if (analysis.recommendations.length > 0) {
      console.group('Recommendations')
      analysis.recommendations.forEach((rec) => console.log(`• ${rec}`))
      console.groupEnd()
    }

    console.groupEnd()
  },

  /**
   * Export error data for external analysis
   */
  exportErrorData(): {
    errors: TachUIError[]
    logs: LogEntry[]
    aggregations: ErrorAggregation[]
    analysis: ErrorAnalysis
    timestamp: number
  } {
    return {
      errors: globalErrorManager.getErrors(),
      logs: globalLogger.getEntries(),
      aggregations: globalErrorAggregator.getAggregations(),
      analysis: this.generateErrorReport(),
      timestamp: Date.now(),
    }
  },

  /**
   * Simulate error for testing
   */
  simulateError(
    category: ErrorCategory = 'component_error',
    severity: ErrorSeverity = 'medium',
    message: string = 'Test error'
  ): void {
    const error = globalErrorManager.createTachUIError(new Error(message), {
      category,
      severity,
      componentId: 'test-component',
    })

    globalErrorManager.reportError(error)
  },

  /**
   * Clear all error data
   */
  clearAllErrorData(): void {
    globalErrorManager.clear()
    globalLogger.clear()
    globalErrorAggregator.clear()
    console.log('All error data cleared')
  },
}

/**
 * Development mode error utilities
 */
export const devErrorUtils = {
  /**
   * Enable enhanced error debugging
   */
  enableEnhancedDebugging(): void {
    // Enable all debugging features
    globalErrorManager.configure({
      development: true,
      captureConsoleErrors: true,
      captureUnhandledPromises: true,
      enableStackTrace: true,
    })

    // Add console reporter for immediate feedback
    globalLogger.addDestination({
      name: 'enhanced-console',
      async send(data): Promise<void> {
        data.forEach((entry) => {
          if ('level' in entry && ['error', 'fatal'].includes(entry.level)) {
            console.error(`🚨 [${entry.level.toUpperCase()}]`, entry.message, entry.context)
          }
        })
      },
      isEnabled: () => true,
    })

    console.log('🛠️ Enhanced error debugging enabled')
  },

  /**
   * Setup error monitoring dashboard
   */
  setupErrorDashboard(): void {
    const errorCountSignal = createSignal(0)
    const recentErrorsSignal = createSignal<TachUIError[]>([])
    const [errorCount, setErrorCount] = errorCountSignal
    const [recentErrors, setRecentErrors] = recentErrorsSignal

    // Update dashboard when errors change
    globalErrorManager.addHandler((_error) => {
      const errors = globalErrorManager.getErrors()
      setErrorCount(errors.length)
      setRecentErrors(errors.slice(-5))
    })

    // Log dashboard updates
    createComputed(() => {
      const count = errorCount()
      const recent = recentErrors()

      if (count > 0) {
        console.group(`📊 Error Dashboard (${count} total errors)`)
        recent.forEach((error) => {
          console.log(`${error.category}: ${error.message}`)
        })
        console.groupEnd()
      }
    })
  },
}
