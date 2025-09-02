/**
 * Error Boundary and Error Handling System (Phase 3.2.3)
 *
 * Comprehensive error handling system for TachUI applications.
 * Provides error boundaries, recovery mechanisms, and error reporting.
 */

import { createEffect, createSignal } from '@tachui/core'
// import { globalDevTools } from './dev-tools'
import { globalPerformanceMonitor } from './performance'
import type { ComponentInstance, ComponentProps, DOMNode } from '@tachui/core'

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * Error categories for classification
 */
export type ErrorCategory =
  | 'component_error' // Component rendering/lifecycle errors
  | 'reactive_error' // Signal/computed/effect errors
  | 'render_error' // DOM rendering errors
  | 'lifecycle_error' // Component lifecycle errors
  | 'network_error' // Network/async operation errors
  | 'validation_error' // Props/data validation errors
  | 'unknown_error' // Uncategorized errors

/**
 * Comprehensive error information
 */
export interface TachUIError {
  id: string
  message: string
  stack?: string
  cause?: Error
  timestamp: number
  category: ErrorCategory
  severity: ErrorSeverity
  componentId?: string
  componentName?: string
  phase?: string
  context?: Record<string, any>
  userAgent?: string
  url?: string
  retryCount: number
  recovered: boolean
}

/**
 * Error boundary state
 */
export interface ErrorBoundaryState {
  hasError: boolean
  error: TachUIError | null
  errorInfo: {
    componentStack?: string
    errorBoundary?: string
    retryAttempts: number
  }
}

/**
 * Error recovery strategies
 */
export type ErrorRecoveryStrategy =
  | 'retry' // Retry the failed operation
  | 'fallback' // Show fallback content
  | 'reload' // Reload the component
  | 'redirect' // Navigate away
  | 'ignore' // Ignore the error
  | 'escalate' // Pass error to parent boundary

/**
 * Error recovery configuration
 */
export interface ErrorRecoveryConfig {
  strategy: ErrorRecoveryStrategy
  maxRetries?: number
  retryDelay?: number
  fallbackComponent?: ComponentInstance
  onRecovery?: (error: TachUIError) => void
  condition?: (error: TachUIError) => boolean
}

/**
 * Error boundary props
 */
export interface ErrorBoundaryProps extends ComponentProps {
  fallback?:
    | ComponentInstance
    | ((error: TachUIError, retry: () => void) => ComponentInstance)
  onError?: (
    error: TachUIError,
    errorInfo: ErrorBoundaryState['errorInfo']
  ) => void
  recovery?: ErrorRecoveryConfig[]
  isolate?: boolean // Prevent error propagation to parent boundaries
  resetOnPropsChange?: boolean
  resetKeys?: string[] // Props that trigger error boundary reset
}

/**
 * Error reporter interface
 */
export interface ErrorReporter {
  report(error: TachUIError): void | Promise<void>
}

/**
 * Error handler function type
 */
export type ErrorHandler = (error: TachUIError) => void | Promise<void>

/**
 * Global error handling configuration
 */
export interface ErrorHandlingConfig {
  enabled: boolean
  captureConsoleErrors: boolean
  captureUnhandledPromises: boolean
  captureReactiveErrors: boolean
  captureComponentErrors: boolean
  maxErrorsPerSession: number
  maxErrorAge: number // milliseconds
  reportingThrottle: number // milliseconds
  enableStackTrace: boolean
  enableSourceMap: boolean
  development: boolean
}

/**
 * Error boundary component implementation
 */
export class ErrorBoundary {
  private state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: {
      retryAttempts: 0,
    },
  }

  private props: ErrorBoundaryProps
  private children: ComponentInstance[]
  private errorManager: ErrorManager

  // Reactive state
  private stateSignal: () => ErrorBoundaryState
  private setState: (value: ErrorBoundaryState) => void

  constructor(
    props: ErrorBoundaryProps,
    children: ComponentInstance[],
    errorManager: ErrorManager
  ) {
    this.props = props
    this.children = children
    this.errorManager = errorManager

    // Initialize reactive state
    const [stateSignal, setState] = createSignal<ErrorBoundaryState>(this.state)
    this.stateSignal = stateSignal
    this.setState = setState

    // Reset error boundary when specific props change
    if (props.resetOnPropsChange || props.resetKeys) {
      this.setupPropsWatcher()
    }
  }

  /**
   * Catch and handle errors in child components
   */
  componentDidCatch(error: Error, errorInfo: any): void {
    const tachUIError = this.errorManager.createTachUIError(error, {
      category: 'component_error',
      severity: 'high',
      componentId: this.props.id,
      componentName: 'ErrorBoundary',
      phase: 'render',
      context: errorInfo,
    })

    this.handleError(tachUIError, errorInfo)
  }

  /**
   * Handle error and determine recovery strategy
   */
  private handleError(error: TachUIError, errorInfo: any): void {
    const newState: ErrorBoundaryState = {
      hasError: true,
      error,
      errorInfo: {
        componentStack: errorInfo?.componentStack,
        errorBoundary: this.props.id || 'ErrorBoundary',
        retryAttempts: this.state.errorInfo.retryAttempts,
      },
    }

    this.state = newState
    this.setState(newState)

    // Report error
    if (this.props.onError) {
      this.props.onError(error, newState.errorInfo)
    }

    // Register with error manager
    this.errorManager.reportError(error)

    // Attempt recovery
    this.attemptRecovery(error)

    // Add to dev tools if enabled
    if (process.env.NODE_ENV !== 'production') {
      const errorObj = new Error(error.message)
      errorObj.stack = error.stack
      console.error('TachUI Error:', error.componentId || 'unknown', errorObj)
    }
  }

  /**
   * Attempt error recovery based on configured strategies
   */
  private attemptRecovery(error: TachUIError): void {
    if (!this.props.recovery) return

    for (const config of this.props.recovery) {
      if (config.condition && !config.condition(error)) continue

      switch (config.strategy) {
        case 'retry':
          this.retryWithConfig(config)
          break
        case 'fallback':
          // Fallback is handled in render method
          break
        case 'reload':
          this.reloadComponent()
          break
        case 'ignore':
          this.resetErrorBoundary()
          break
        case 'escalate':
          if (!this.props.isolate) {
            throw error.cause || new Error(error.message)
          }
          break
      }

      if (config.onRecovery) {
        config.onRecovery(error)
      }

      break // Use first matching strategy
    }
  }

  /**
   * Retry failed operation with configuration
   */
  private retryWithConfig(config: ErrorRecoveryConfig): void {
    const maxRetries = config.maxRetries || 3
    const retryDelay = config.retryDelay || 1000

    if (this.state.errorInfo.retryAttempts >= maxRetries) {
      console.warn(
        `Max retry attempts (${maxRetries}) reached for error boundary`
      )
      return
    }

    setTimeout(() => {
      this.retry()
    }, retryDelay)
  }

  /**
   * Retry the failed operation
   */
  retry(): void {
    this.state.errorInfo.retryAttempts++
    this.resetErrorBoundary()
  }

  /**
   * Reset error boundary to normal state
   */
  resetErrorBoundary(): void {
    this.state = {
      hasError: false,
      error: null,
      errorInfo: {
        retryAttempts: this.state.errorInfo.retryAttempts,
      },
    }
    this.setState(this.state)
  }

  /**
   * Reload the component
   */
  private reloadComponent(): void {
    this.resetErrorBoundary()
    // Force re-render of children
    // This would need integration with the component system
  }

  /**
   * Setup props watcher for error boundary reset
   */
  private setupPropsWatcher(): void {
    if (this.props.resetKeys) {
      // Watch specific prop keys
      createEffect(() => {
        const currentProps = this.props
        if (this.state.hasError && this.shouldResetOnProps(currentProps)) {
          this.resetErrorBoundary()
        }
      })
    }
  }

  /**
   * Check if error boundary should reset based on props
   */
  private shouldResetOnProps(props: ErrorBoundaryProps): boolean {
    if (!this.props.resetKeys) return false

    // This is simplified - in real implementation would track previous props
    return this.props.resetKeys.some(
      key =>
        key in props && props[key as keyof ErrorBoundaryProps] !== undefined
    )
  }

  /**
   * Render error boundary content
   */
  render(): DOMNode[] {
    if (this.state.hasError && this.state.error) {
      // Render fallback UI
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          const fallbackInstance = this.props.fallback(this.state.error, () =>
            this.retry()
          )
          const result = fallbackInstance.render
            ? fallbackInstance.render()
            : []
          return Array.isArray(result) ? result : [result]
        } else {
          const result = this.props.fallback.render
            ? this.props.fallback.render()
            : []
          return Array.isArray(result) ? result : [result]
        }
      }

      // Default error UI
      return this.renderDefaultErrorUI()
    }

    // Render children normally
    try {
      return this.children.flatMap(child => {
        const result = child.render()
        return Array.isArray(result) ? result : [result]
      })
    } catch (error) {
      this.componentDidCatch(error as Error, {
        componentStack: 'children rendering',
      })
      return this.renderDefaultErrorUI()
    }
  }

  /**
   * Render default error UI
   */
  private renderDefaultErrorUI(): DOMNode[] {
    const error = this.state.error!

    return [
      {
        type: 'element',
        tag: 'div',
        props: {
          className: 'tachui-error-boundary',
          style: {
            padding: '20px',
            border: '2px solid #ff6b6b',
            borderRadius: '8px',
            backgroundColor: '#fff5f5',
            color: '#c92a2a',
            fontFamily: 'monospace',
          },
        },
        children: [
          {
            type: 'element',
            tag: 'h3',
            props: { style: { margin: '0 0 10px 0' } },
            children: [
              {
                type: 'text',
                text: '🚨 Something went wrong',
              },
            ],
          },
          {
            type: 'element',
            tag: 'p',
            props: { style: { margin: '0 0 15px 0' } },
            children: [
              {
                type: 'text',
                text: error.message,
              },
            ],
          },
          {
            type: 'element',
            tag: 'button',
            props: {
              onClick: () => this.retry(),
              style: {
                padding: '8px 16px',
                backgroundColor: '#4c6ef5',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              },
            },
            children: [
              {
                type: 'text',
                text: `Retry (${this.state.errorInfo.retryAttempts} attempts)`,
              },
            ],
          },
        ],
      },
    ]
  }

  /**
   * Get current error boundary state
   */
  getState(): ErrorBoundaryState {
    return this.state
  }

  /**
   * Get reactive state signal
   */
  getStateSignal(): () => ErrorBoundaryState {
    return this.stateSignal
  }
}

/**
 * Global error manager
 */
export class ErrorManager {
  private static instance: ErrorManager

  private config: ErrorHandlingConfig = {
    enabled: true,
    captureConsoleErrors: true,
    captureUnhandledPromises: true,
    captureReactiveErrors: true,
    captureComponentErrors: true,
    maxErrorsPerSession: 100,
    maxErrorAge: 30 * 60 * 1000, // 30 minutes
    reportingThrottle: 1000, // 1 second
    enableStackTrace: true,
    enableSourceMap: false,
    development: false,
  }

  private errors: TachUIError[] = []
  private reporters: ErrorReporter[] = []
  private handlers: ErrorHandler[] = []
  private throttleMap = new Map<string, number>()

  // Reactive state
  private errorsSignal: () => TachUIError[]
  private setErrors: (value: TachUIError[]) => void

  constructor() {
    // Initialize reactive state
    const [errorsSignal, setErrors] = createSignal<TachUIError[]>([])
    this.errorsSignal = errorsSignal
    this.setErrors = setErrors

    this.setupGlobalErrorHandlers()
  }

  static getInstance(): ErrorManager {
    if (!ErrorManager.instance) {
      ErrorManager.instance = new ErrorManager()
    }
    return ErrorManager.instance
  }

  /**
   * Configure error handling
   */
  configure(config: Partial<ErrorHandlingConfig>): void {
    this.config = { ...this.config, ...config }

    if (config.development !== undefined) {
      // globalDevTools.configure({ enableErrors: config.development })
    }
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    if (typeof window === 'undefined') return

    // Capture unhandled errors
    window.addEventListener('error', event => {
      if (!this.config.captureConsoleErrors) return

      const error = this.createTachUIError(
        event.error || new Error(event.message),
        {
          category: 'unknown_error',
          severity: 'medium',
          context: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        }
      )

      this.reportError(error)
    })

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', event => {
      if (!this.config.captureUnhandledPromises) return

      const error = this.createTachUIError(
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason)),
        {
          category: 'network_error',
          severity: 'medium',
          context: { type: 'unhandled_promise_rejection' },
        }
      )

      this.reportError(error)
    })
  }

  /**
   * Create standardized TachUI error
   */
  createTachUIError(
    error: Error,
    options: {
      category?: ErrorCategory
      severity?: ErrorSeverity
      componentId?: string
      componentName?: string
      phase?: string
      context?: Record<string, any>
    } = {}
  ): TachUIError {
    return {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: error.message,
      stack: this.config.enableStackTrace ? error.stack : undefined,
      cause: error,
      timestamp: Date.now(),
      category: options.category || 'unknown_error',
      severity: options.severity || 'medium',
      componentId: options.componentId,
      componentName: options.componentName,
      phase: options.phase,
      context: options.context,
      userAgent:
        typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      retryCount: 0,
      recovered: false,
    }
  }

  /**
   * Report error to all registered reporters
   */
  reportError(error: TachUIError): void {
    if (!this.config.enabled) return

    // Throttle reporting to prevent spam
    const throttleKey = `${error.category}_${error.message}`
    const lastReport = this.throttleMap.get(throttleKey) || 0
    const now = Date.now()

    if (now - lastReport < this.config.reportingThrottle) {
      return
    }

    this.throttleMap.set(throttleKey, now)

    // Add to errors array
    this.errors.push(error)

    // Limit errors array size
    if (this.errors.length > this.config.maxErrorsPerSession) {
      this.errors.shift()
    }

    // Clean old errors
    this.cleanOldErrors()

    // Update reactive signal
    this.setErrors([...this.errors])

    // Track with performance monitor
    if (globalPerformanceMonitor.isEnabled()) {
      globalPerformanceMonitor.recordMetric({
        name: 'error_reported',
        value: 1,
        unit: 'count',
        timestamp: error.timestamp,
        category: 'component',
        componentId: error.componentId,
      })
    }

    // Call reporters
    this.reporters.forEach(reporter => {
      try {
        reporter.report(error)
      } catch (reporterError) {
        console.error('Error reporter failed:', reporterError)
      }
    })

    // Call handlers
    this.handlers.forEach(handler => {
      try {
        handler(error)
      } catch (handlerError) {
        console.error('Error handler failed:', handlerError)
      }
    })

    // Log to console in development
    if (this.config.development) {
      console.group(`🚨 TachUI Error [${error.category}]`)
      console.error(error.message)
      if (error.stack) console.error(error.stack)
      if (error.context) console.log('Context:', error.context)
      console.groupEnd()
    }
  }

  /**
   * Clean old errors based on max age
   */
  private cleanOldErrors(): void {
    const cutoff = Date.now() - this.config.maxErrorAge
    this.errors = this.errors.filter(error => error.timestamp > cutoff)
  }

  /**
   * Add error reporter
   */
  addReporter(reporter: ErrorReporter): () => void {
    this.reporters.push(reporter)

    return () => {
      const index = this.reporters.indexOf(reporter)
      if (index !== -1) {
        this.reporters.splice(index, 1)
      }
    }
  }

  /**
   * Add error handler
   */
  addHandler(handler: ErrorHandler): () => void {
    this.handlers.push(handler)

    return () => {
      const index = this.handlers.indexOf(handler)
      if (index !== -1) {
        this.handlers.splice(index, 1)
      }
    }
  }

  /**
   * Get all errors
   */
  getErrors(): TachUIError[] {
    return [...this.errors]
  }

  /**
   * Get errors signal
   */
  getErrorsSignal(): () => TachUIError[] {
    return this.errorsSignal
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: ErrorCategory): TachUIError[] {
    return this.errors.filter(error => error.category === category)
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): TachUIError[] {
    return this.errors.filter(error => error.severity === severity)
  }

  /**
   * Get errors by component
   */
  getErrorsByComponent(componentId: string): TachUIError[] {
    return this.errors.filter(error => error.componentId === componentId)
  }

  /**
   * Mark error as recovered
   */
  markErrorRecovered(errorId: string): void {
    const error = this.errors.find(e => e.id === errorId)
    if (error) {
      error.recovered = true
      this.setErrors([...this.errors])
    }
  }

  /**
   * Clear all errors
   */
  clear(): void {
    this.errors.length = 0
    this.throttleMap.clear()
    this.setErrors([])
  }

  /**
   * Get error statistics
   */
  getStatistics(): {
    totalErrors: number
    errorsByCategory: Record<ErrorCategory, number>
    errorsBySeverity: Record<ErrorSeverity, number>
    recoveredErrors: number
    recentErrors: number
  } {
    const errorsByCategory = {} as Record<ErrorCategory, number>
    const errorsBySeverity = {} as Record<ErrorSeverity, number>

    for (const error of this.errors) {
      errorsByCategory[error.category] =
        (errorsByCategory[error.category] || 0) + 1
      errorsBySeverity[error.severity] =
        (errorsBySeverity[error.severity] || 0) + 1
    }

    const recoveredErrors = this.errors.filter(e => e.recovered).length
    const recentErrors = this.errors.filter(
      e => Date.now() - e.timestamp < 5 * 60 * 1000 // Last 5 minutes
    ).length

    return {
      totalErrors: this.errors.length,
      errorsByCategory,
      errorsBySeverity,
      recoveredErrors,
      recentErrors,
    }
  }
}

/**
 * Global error manager instance
 */
export const globalErrorManager = ErrorManager.getInstance()

/**
 * Create error boundary component
 */
export function createErrorBoundary(
  props: ErrorBoundaryProps,
  children: ComponentInstance[]
): ErrorBoundary {
  return new ErrorBoundary(props, children, globalErrorManager)
}

/**
 * Built-in error reporters
 */
export const errorReporters = {
  /**
   * Console reporter
   */
  console: {
    report(error: TachUIError): void {
      console.error(`[${error.category}] ${error.message}`, error)
    },
  } as ErrorReporter,

  /**
   * Local storage reporter
   */
  localStorage: {
    report(error: TachUIError): void {
      try {
        const stored = JSON.parse(localStorage.getItem('tachui_errors') || '[]')
        stored.push(error)

        // Keep only last 50 errors
        if (stored.length > 50) {
          stored.splice(0, stored.length - 50)
        }

        localStorage.setItem('tachui_errors', JSON.stringify(stored))
      } catch (e) {
        console.error('Failed to store error in localStorage:', e)
      }
    },
  } as ErrorReporter,

  /**
   * Remote API reporter
   */
  createRemoteReporter(endpoint: string, apiKey?: string): ErrorReporter {
    return {
      async report(error: TachUIError): Promise<void> {
        try {
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          }

          if (apiKey) {
            headers.Authorization = `Bearer ${apiKey}`
          }

          await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(error),
          })
        } catch (e) {
          console.error('Failed to report error to remote endpoint:', e)
        }
      },
    }
  },
}

/**
 * Error handling utilities
 */
export const errorUtils = {
  /**
   * Wrap function with error handling
   */
  withErrorHandling<T extends (...args: any[]) => any>(
    fn: T,
    options: {
      category?: ErrorCategory
      onError?: (error: TachUIError) => void
      fallback?: ReturnType<T>
    } = {}
  ): T {
    return ((...args: Parameters<T>): ReturnType<T> => {
      try {
        return fn(...args)
      } catch (error) {
        const tachUIError = globalErrorManager.createTachUIError(
          error as Error,
          {
            category: options.category || 'unknown_error',
          }
        )

        globalErrorManager.reportError(tachUIError)

        if (options.onError) {
          options.onError(tachUIError)
        }

        if (options.fallback !== undefined) {
          return options.fallback
        }

        throw error
      }
    }) as T
  },

  /**
   * Wrap async function with error handling
   */
  withAsyncErrorHandling<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options: {
      category?: ErrorCategory
      onError?: (error: TachUIError) => void
      fallback?: Awaited<ReturnType<T>>
    } = {}
  ): T {
    return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
      try {
        return await fn(...args)
      } catch (error) {
        const tachUIError = globalErrorManager.createTachUIError(
          error as Error,
          {
            category: options.category || 'network_error',
          }
        )

        globalErrorManager.reportError(tachUIError)

        if (options.onError) {
          options.onError(tachUIError)
        }

        if (options.fallback !== undefined) {
          return options.fallback
        }

        throw error
      }
    }) as T
  },

  /**
   * Create error boundary with common configurations
   */
  createSimpleErrorBoundary(
    fallbackMessage: string = 'Something went wrong'
  ): (children: ComponentInstance[]) => ErrorBoundary {
    return (children: ComponentInstance[]) =>
      createErrorBoundary(
        {
          fallback: (_error, _retry) => ({
            type: 'component',
            id: 'error-fallback',
            props: {},
            render: () => [
              {
                type: 'element',
                tag: 'div',
                props: { className: 'simple-error-boundary' },
                children: [
                  {
                    type: 'text',
                    text: fallbackMessage,
                  },
                ],
              },
            ],
          }),
          recovery: [{ strategy: 'retry', maxRetries: 3, retryDelay: 1000 }],
        },
        children
      )
  },
}
