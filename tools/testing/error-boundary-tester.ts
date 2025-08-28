/**
 * Error Boundary Testing Framework
 * 
 * Comprehensive error testing utilities for TachUI components and applications.
 * Tests error boundaries, component error recovery, and graceful degradation.
 */

import { beforeEach, afterEach } from 'vitest'

export interface ErrorTestScenario {
  name: string
  description: string
  errorType: 'runtime' | 'render' | 'async' | 'network' | 'validation' | 'custom'
  severity: 'low' | 'medium' | 'high' | 'critical'
  expectedRecovery: boolean
  timeout?: number
}

export interface ErrorBoundaryConfig {
  enableConsoleCapture?: boolean
  enableStackTraceAnalysis?: boolean
  enableRetryMechanisms?: boolean
  maxRetries?: number
  retryDelay?: number
  enableErrorReporting?: boolean
}

export interface ErrorTestReport {
  scenario: ErrorTestScenario
  errorCaught: boolean
  errorType: string
  errorMessage: string
  stackTrace: string
  recoverySuccessful: boolean
  retryAttempts: number
  performanceImpact: {
    errorHandlingTime: number
    recoveryTime: number
    totalTime: number
  }
  degradationLevel: 'none' | 'partial' | 'full'
  userExperienceImpact: 'minimal' | 'moderate' | 'severe'
  recoveryMessages: string[] // Captured recovery status messages
}

export interface ErrorBoundaryTestResults {
  totalTests: number
  passed: number
  failed: number
  recovered: number
  criticalFailures: number
  reports: ErrorTestReport[]
  overallHealth: 'excellent' | 'good' | 'concerning' | 'critical'
}

/**
 * Advanced Error Boundary Tester
 */
export class ErrorBoundaryTester {
  private config: Required<ErrorBoundaryConfig>
  private capturedErrors: Error[] = []
  private capturedConsole: string[] = []
  private recoveryMessages: string[] = []
  private originalConsoleError = console.error
  private originalConsoleWarn = console.warn
  private originalConsoleLog = console.log
  private testStartTime: number = 0
  private retryQueue: Array<() => Promise<any>> = []

  constructor(config: ErrorBoundaryConfig = {}) {
    this.config = {
      enableConsoleCapture: config.enableConsoleCapture ?? true,
      enableStackTraceAnalysis: config.enableStackTraceAnalysis ?? true,
      enableRetryMechanisms: config.enableRetryMechanisms ?? true,
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 100,
      enableErrorReporting: config.enableErrorReporting ?? true,
      ...config
    }
  }

  /**
   * Start error boundary testing session
   */
  async startTest(): Promise<void> {
    this.testStartTime = Date.now()
    this.capturedErrors = []
    this.capturedConsole = []
    this.retryQueue = []

    if (this.config.enableConsoleCapture) {
      this.setupConsoleCapture()
    }

    // Set up global error handlers
    this.setupGlobalErrorHandlers()
  }

  /**
   * Test a specific error scenario
   */
  async testErrorScenario(
    scenario: ErrorTestScenario,
    testFn: () => Promise<any> | any,
    errorBoundaryFn?: (error: Error) => Promise<boolean> | boolean
  ): Promise<ErrorTestReport> {
    const startTime = Date.now()
    let errorCaught = false
    let caughtError: Error | null = null
    let recoverySuccessful = false
    let retryAttempts = 0
    
    // Clear previous recovery messages
    this.recoveryMessages = []

    const report: ErrorTestReport = {
      scenario,
      errorCaught: false,
      errorType: 'unknown',
      errorMessage: '',
      stackTrace: '',
      recoverySuccessful: false,
      retryAttempts: 0,
      performanceImpact: {
        errorHandlingTime: 0,
        recoveryTime: 0,
        totalTime: 0
      },
      degradationLevel: 'none',
      userExperienceImpact: 'minimal',
      recoveryMessages: []
    }

    try {
      // Execute the test function that should trigger an error
      await this.executeWithTimeout(testFn, scenario.timeout || 5000)
    } catch (error) {
      errorCaught = true
      caughtError = error as Error
      
      const errorHandlingStartTime = Date.now()
      
      // Classify error type
      report.errorType = this.classifyError(error as Error)
      report.errorMessage = (error as Error).message
      report.stackTrace = (error as Error).stack || ''
      
      report.performanceImpact.errorHandlingTime = Date.now() - errorHandlingStartTime

      // Attempt error boundary recovery if provided
      if (errorBoundaryFn) {
        const recoveryStartTime = Date.now()
        
        try {
          recoverySuccessful = await this.attemptRecovery(
            errorBoundaryFn,
            error as Error,
            this.config.maxRetries
          )
          retryAttempts = this.config.maxRetries
        } catch (recoveryError) {
          recoverySuccessful = false
        }
        
        report.performanceImpact.recoveryTime = Date.now() - recoveryStartTime
      }
    }

    const endTime = Date.now()
    
    // Update report
    report.errorCaught = errorCaught
    report.recoverySuccessful = recoverySuccessful
    report.retryAttempts = retryAttempts
    report.performanceImpact.totalTime = endTime - startTime
    
    // Analyze degradation and UX impact
    report.degradationLevel = this.analyzeDegradationLevel(scenario, errorCaught, recoverySuccessful)
    report.userExperienceImpact = this.analyzeUXImpact(scenario, report.degradationLevel)
    
    // Include captured recovery messages
    report.recoveryMessages = [...this.recoveryMessages]

    return report
  }

  /**
   * Test multiple error scenarios
   */
  async testErrorScenarios(
    scenarios: Array<{
      scenario: ErrorTestScenario
      testFn: () => Promise<any> | any
      errorBoundaryFn?: (error: Error) => Promise<boolean> | boolean
    }>
  ): Promise<ErrorBoundaryTestResults> {
    const reports: ErrorTestReport[] = []
    
    for (const { scenario, testFn, errorBoundaryFn } of scenarios) {
      const report = await this.testErrorScenario(scenario, testFn, errorBoundaryFn)
      reports.push(report)
    }

    return this.analyzeTestResults(reports)
  }

  /**
   * End error boundary testing session
   */
  async endTest(): Promise<void> {
    // Restore original console methods
    this.restoreConsole()
    
    // Clear retry queue
    this.retryQueue = []
    
    // Restore global error handlers
    this.restoreGlobalErrorHandlers()
  }

  /**
   * Get captured errors and console output
   */
  getCapturedData(): {
    errors: Error[]
    console: string[]
    testDuration: number
  } {
    return {
      errors: [...this.capturedErrors],
      console: [...this.capturedConsole],
      testDuration: Date.now() - this.testStartTime
    }
  }

  private async executeWithTimeout<T>(
    fn: () => T | Promise<T>,
    timeout: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Test timed out after ${timeout}ms`))
      }, timeout)

      Promise.resolve(fn())
        .then(result => {
          clearTimeout(timer)
          resolve(result)
        })
        .catch(error => {
          clearTimeout(timer)
          reject(error)
        })
    })
  }

  private async attemptRecovery(
    recoveryFn: (error: Error) => Promise<boolean> | boolean,
    error: Error,
    maxRetries: number
  ): Promise<boolean> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const recovered = await recoveryFn(error)
        if (recovered) {
          return true
        }
        
        // Wait before next retry
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay))
        }
      } catch (recoveryError) {
        // Recovery function itself failed
        if (attempt === maxRetries - 1) {
          throw recoveryError
        }
      }
    }
    
    return false
  }

  private classifyError(error: Error): string {
    const message = error.message.toLowerCase()
    const stack = error.stack?.toLowerCase() || ''
    
    if (error.name === 'TypeError') return 'type-error'
    if (error.name === 'ReferenceError') return 'reference-error'
    if (error.name === 'RangeError') return 'range-error'
    if (error.name === 'SyntaxError') return 'syntax-error'
    if (message.includes('network') || message.includes('fetch')) return 'network-error'
    if (message.includes('timeout')) return 'timeout-error'
    if (message.includes('permission')) return 'permission-error'
    if (stack.includes('render') || stack.includes('component')) return 'render-error'
    
    return 'runtime-error'
  }

  private analyzeDegradationLevel(
    scenario: ErrorTestScenario,
    errorCaught: boolean,
    recoverySuccessful: boolean
  ): 'none' | 'partial' | 'full' {
    if (!errorCaught) return 'none'
    if (recoverySuccessful) return 'partial'
    if (scenario.severity === 'critical') return 'full'
    if (scenario.severity === 'high') return 'partial'
    return 'none'
  }

  private analyzeUXImpact(
    scenario: ErrorTestScenario,
    degradationLevel: 'none' | 'partial' | 'full'
  ): 'minimal' | 'moderate' | 'severe' {
    if (degradationLevel === 'none') return 'minimal'
    if (degradationLevel === 'full' || scenario.severity === 'critical') return 'severe'
    return 'moderate'
  }

  private analyzeTestResults(reports: ErrorTestReport[]): ErrorBoundaryTestResults {
    const totalTests = reports.length
    const passed = reports.filter(r => r.errorCaught && r.recoverySuccessful).length
    const failed = reports.filter(r => r.errorCaught && !r.recoverySuccessful).length
    const recovered = reports.filter(r => r.recoverySuccessful).length
    const criticalFailures = reports.filter(r => 
      r.scenario.severity === 'critical' && !r.recoverySuccessful
    ).length

    let overallHealth: 'excellent' | 'good' | 'concerning' | 'critical'
    
    if (criticalFailures > 0) {
      overallHealth = 'critical'
    } else if (failed > totalTests * 0.3) {
      overallHealth = 'concerning'
    } else if (recovered > totalTests * 0.8) {
      overallHealth = 'excellent'
    } else {
      overallHealth = 'good'
    }

    return {
      totalTests,
      passed,
      failed,
      recovered,
      criticalFailures,
      reports,
      overallHealth
    }
  }

  private setupConsoleCapture(): void {
    console.error = (...args) => {
      this.capturedConsole.push(`ERROR: ${args.join(' ')}`)
      if (!this.config.enableConsoleCapture) {
        this.originalConsoleError(...args)
      }
    }

    console.warn = (...args) => {
      this.capturedConsole.push(`WARN: ${args.join(' ')}`)
      if (!this.config.enableConsoleCapture) {
        this.originalConsoleWarn(...args)
      }
    }

    console.log = (...args) => {
      this.recoveryMessages.push(args.join(' '))
      // Don't display recovery messages, just capture them
    }
  }

  private restoreConsole(): void {
    console.error = this.originalConsoleError
    console.warn = this.originalConsoleWarn
    console.log = this.originalConsoleLog
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    if (typeof process !== 'undefined') {
      process.on('unhandledRejection', (reason) => {
        this.capturedErrors.push(
          reason instanceof Error ? reason : new Error(String(reason))
        )
      })
    }

    // Handle uncaught exceptions
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.capturedErrors.push(event.error || new Error(event.message))
      })
    }
  }

  private restoreGlobalErrorHandlers(): void {
    // Clean up global handlers
    if (typeof process !== 'undefined') {
      process.removeAllListeners('unhandledRejection')
    }
  }
}

/**
 * Pre-defined error scenarios for common testing
 */
export const commonErrorScenarios: ErrorTestScenario[] = [
  {
    name: 'Component Render Error',
    description: 'Component throws error during render phase',
    errorType: 'render',
    severity: 'high',
    expectedRecovery: true,
    timeout: 2000
  },
  {
    name: 'Async Operation Failure',
    description: 'Async operation fails with network error',
    errorType: 'async',
    severity: 'medium',
    expectedRecovery: true,
    timeout: 5000
  },
  {
    name: 'State Update Error',
    description: 'Error occurs during state update',
    errorType: 'runtime',
    severity: 'medium',
    expectedRecovery: true,
    timeout: 1000
  },
  {
    name: 'Critical System Failure',
    description: 'Critical system component fails',
    errorType: 'runtime',
    severity: 'critical',
    expectedRecovery: false,
    timeout: 3000
  },
  {
    name: 'Validation Error',
    description: 'Data validation fails with user input',
    errorType: 'validation',
    severity: 'low',
    expectedRecovery: true,
    timeout: 1000
  },
  {
    name: 'Network Timeout',
    description: 'Network request times out',
    errorType: 'network',
    severity: 'medium',
    expectedRecovery: true,
    timeout: 6000
  }
]

/**
 * Auto-setup for error boundary testing
 */
export function setupErrorBoundaryTesting(config?: ErrorBoundaryConfig): ErrorBoundaryTester {
  const tester = new ErrorBoundaryTester(config)

  beforeEach(async () => {
    await tester.startTest()
  })

  afterEach(async () => {
    await tester.endTest()
  })

  return tester
}

/**
 * Error testing utilities
 */
export const errorTestUtils = {
  /**
   * Create a test function that throws a specific error type
   */
  createErrorThrower(errorType: string, message: string = 'Test error'): () => void {
    return () => {
      switch (errorType) {
        case 'reference':
          throw new ReferenceError(message)
        case 'type':
          throw new TypeError(message)
        case 'range':
          throw new RangeError(message)
        case 'syntax':
          throw new SyntaxError(message)
        case 'network':
          throw new Error(`Network error: ${message}`)
        case 'timeout':
          throw new Error(`Timeout error: ${message}`)
        default:
          throw new Error(message)
      }
    }
  },

  /**
   * Create an async function that rejects with an error
   */
  createAsyncErrorThrower(errorType: string, message: string = 'Async test error', delay: number = 100): () => Promise<never> {
    return async () => {
      await new Promise(resolve => setTimeout(resolve, delay))
      const thrower = errorTestUtils.createErrorThrower(errorType, message)
      thrower()
      return Promise.reject() // TypeScript satisfaction
    }
  },

  /**
   * Create a recovery function that attempts to handle errors
   */
  createErrorRecoveryHandler(
    successRate: number = 0.8,
    recoveryDelay: number = 50
  ): (error: Error) => Promise<boolean> {
    return async (error: Error) => {
      await new Promise(resolve => setTimeout(resolve, recoveryDelay))
      
      // Simulate recovery success/failure based on success rate
      const recovered = Math.random() < successRate
      
      // Capture recovery messages internally without displaying them
      if (recovered) {
        // Recovery successful - message captured internally
        return true
      } else {
        // Recovery failed - message captured internally
        return false
      }
    }
  },

  /**
   * Create a flaky function that sometimes works, sometimes fails
   */
  createFlakyFunction(
    failureRate: number = 0.3,
    errorMessage: string = 'Flaky function failed'
  ): () => string {
    return () => {
      if (Math.random() < failureRate) {
        throw new Error(errorMessage)
      }
      return 'Success'
    }
  },

  /**
   * Simulate network errors
   */
  simulateNetworkError(
    type: 'timeout' | 'connection' | 'server' | 'dns' = 'timeout'
  ): () => Promise<never> {
    const messages = {
      timeout: 'Request timeout after 5000ms',
      connection: 'Connection refused - server not available',
      server: 'Internal server error (500)',
      dns: 'DNS resolution failed for hostname'
    }
    
    return errorTestUtils.createAsyncErrorThrower('network', messages[type], 200)
  }
}