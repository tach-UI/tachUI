/**
 * Real-World Scenario Testing Framework
 * 
 * Comprehensive testing utilities for simulating production user workflows
 * and complex application scenarios with TachUI components.
 */

import { beforeEach, afterEach } from 'vitest'
import type { ComponentInstance } from '../../packages/core/src/types'

export interface UserAction {
  type: 'click' | 'input' | 'navigate' | 'wait' | 'submit' | 'select' | 'scroll' | 'hover'
  target: string | Element
  value?: string | number
  delay?: number
  options?: Record<string, any>
}

export interface ScenarioStep {
  name: string
  description: string
  actions: UserAction[]
  assertions: Array<{
    type: 'element-exists' | 'element-contains' | 'url-matches' | 'state-equals' | 'custom'
    selector?: string
    expected?: any
    customAssertion?: () => boolean | Promise<boolean>
  }>
  timeout?: number
}

export interface RealWorldScenario {
  name: string
  description: string
  setup?: () => Promise<void> | void
  cleanup?: () => Promise<void> | void
  steps: ScenarioStep[]
  successCriteria: string[]
  tags: string[]
  estimatedDuration?: number
}

export interface ScenarioResult {
  scenario: RealWorldScenario
  success: boolean
  completedSteps: number
  totalSteps: number
  duration: number
  errors: Array<{
    step: string
    error: Error
    timestamp: number
  }>
  performance: {
    stepDurations: Array<{ step: string; duration: number }>
    memoryUsage: { initial: number; final: number; peak: number }
    domNodes: { initial: number; final: number; peak: number }
  }
}

export interface ApplicationState {
  user?: {
    id: string
    name: string
    email: string
    authenticated: boolean
  }
  cart?: {
    items: Array<{ id: string; name: string; price: number; quantity: number }>
    total: number
  }
  navigation?: {
    currentPath: string
    history: string[]
  }
  form?: {
    data: Record<string, any>
    errors: Record<string, string[]>
    isSubmitting: boolean
    isDirty: boolean
  }
  [key: string]: any
}

/**
 * Real-World Scenario Tester
 * 
 * Comprehensive testing framework for complex user workflows
 */
export class RealWorldScenarioTester {
  private applicationState: ApplicationState = {}
  private componentInstances: Map<string, ComponentInstance> = new Map()
  private startTime: number = 0
  private stepStartTime: number = 0
  private memorySnapshots: number[] = []
  private domNodeCounts: number[] = []

  constructor(
    private config: {
      enableMemoryTracking?: boolean
      enablePerformanceTracking?: boolean
      defaultTimeout?: number
      enableStateTracking?: boolean
    } = {}
  ) {
    this.config = {
      enableMemoryTracking: true,
      enablePerformanceTracking: true,
      defaultTimeout: 30000,
      enableStateTracking: true,
      ...config
    }
  }

  /**
   * Execute a complete real-world scenario
   */
  async executeScenario(scenario: RealWorldScenario): Promise<ScenarioResult> {
    this.startTime = Date.now()
    const result: ScenarioResult = {
      scenario,
      success: false,
      completedSteps: 0,
      totalSteps: scenario.steps.length,
      duration: 0,
      errors: [],
      performance: {
        stepDurations: [],
        memoryUsage: { initial: 0, final: 0, peak: 0 },
        domNodes: { initial: 0, final: 0, peak: 0 }
      }
    }

    try {
      // Setup scenario
      if (scenario.setup) {
        await scenario.setup()
      }

      // Initial performance snapshot
      if (this.config.enableMemoryTracking) {
        result.performance.memoryUsage.initial = this.getMemoryUsage()
        result.performance.domNodes.initial = this.getDOMNodeCount()
        this.memorySnapshots.push(result.performance.memoryUsage.initial)
        this.domNodeCounts.push(result.performance.domNodes.initial)
      }

      // Execute steps
      for (let i = 0; i < scenario.steps.length; i++) {
        const step = scenario.steps[i]
        this.stepStartTime = Date.now()

        try {
          await this.executeStep(step)
          result.completedSteps++
          
          const stepDuration = Date.now() - this.stepStartTime
          result.performance.stepDurations.push({
            step: step.name,
            duration: stepDuration
          })

          // Track peak memory usage
          if (this.config.enableMemoryTracking) {
            const currentMemory = this.getMemoryUsage()
            const currentNodes = this.getDOMNodeCount()
            this.memorySnapshots.push(currentMemory)
            this.domNodeCounts.push(currentNodes)
          }

        } catch (error) {
          result.errors.push({
            step: step.name,
            error: error as Error,
            timestamp: Date.now() - this.startTime
          })
          // Continue with remaining steps unless it's a critical failure
          if (step.name.includes('critical') || step.name.includes('required')) {
            break
          }
        }
      }

      // Final performance snapshot
      if (this.config.enableMemoryTracking) {
        result.performance.memoryUsage.final = this.getMemoryUsage()
        result.performance.memoryUsage.peak = Math.max(...this.memorySnapshots)
        result.performance.domNodes.final = this.getDOMNodeCount()
        result.performance.domNodes.peak = Math.max(...this.domNodeCounts)
      }

      result.success = result.errors.length === 0 && result.completedSteps === result.totalSteps
      result.duration = Date.now() - this.startTime

      // Cleanup scenario
      if (scenario.cleanup) {
        await scenario.cleanup()
      }

    } catch (error) {
      result.errors.push({
        step: 'scenario-setup',
        error: error as Error,
        timestamp: Date.now() - this.startTime
      })
    }

    return result
  }

  /**
   * Execute a single scenario step
   */
  private async executeStep(step: ScenarioStep): Promise<void> {
    const timeout = step.timeout || this.config.defaultTimeout || 30000
    const stepPromise = this.performStepActions(step)

    // Add timeout wrapper
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Step "${step.name}" timed out after ${timeout}ms`)), timeout)
    })

    await Promise.race([stepPromise, timeoutPromise])
  }

  /**
   * Perform all actions in a step
   */
  private async performStepActions(step: ScenarioStep): Promise<void> {
    // Execute actions
    for (const action of step.actions) {
      await this.executeAction(action)
    }

    // Wait for any async operations to complete
    await this.waitForStable()

    // Run assertions
    for (const assertion of step.assertions) {
      await this.executeAssertion(assertion)
    }
  }

  /**
   * Execute a single user action
   */
  private async executeAction(action: UserAction): Promise<void> {
    const element = typeof action.target === 'string' 
      ? document.querySelector(action.target)
      : action.target

    if (!element && action.type !== 'wait' && action.type !== 'navigate') {
      throw new Error(`Element not found: ${action.target}`)
    }

    // Add delay before action if specified
    if (action.delay) {
      await new Promise(resolve => setTimeout(resolve, action.delay))
    }

    switch (action.type) {
      case 'click':
        (element as HTMLElement).click()
        break

      case 'input':
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
          element.value = String(action.value || '')
          element.dispatchEvent(new Event('input', { bubbles: true }))
          element.dispatchEvent(new Event('change', { bubbles: true }))
        }
        break

      case 'submit':
        if (element instanceof HTMLFormElement) {
          element.dispatchEvent(new Event('submit', { bubbles: true }))
        } else {
          // Look for submit button in form
          const submitButton = element?.querySelector('button[type="submit"], input[type="submit"]')
          if (submitButton instanceof HTMLElement) {
            submitButton.click()
          }
        }
        break

      case 'select':
        if (element instanceof HTMLSelectElement) {
          element.value = String(action.value || '')
          element.dispatchEvent(new Event('change', { bubbles: true }))
        }
        break

      case 'navigate':
        if (typeof action.target === 'string') {
          // Simulate navigation
          window.history.pushState({}, '', action.target)
          window.dispatchEvent(new PopStateEvent('popstate'))
        }
        break

      case 'wait':
        await new Promise(resolve => setTimeout(resolve, Number(action.value) || 100))
        break

      case 'scroll':
        if (element) {
          element.scrollTop = Number(action.value) || 0
        } else {
          window.scrollTo(0, Number(action.value) || 0)
        }
        break

      case 'hover':
        if (element) {
          element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
          element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
        }
        break
    }

    // Small delay after action for DOM updates
    await new Promise(resolve => setTimeout(resolve, 10))
  }

  /**
   * Execute an assertion
   */
  private async executeAssertion(assertion: any): Promise<void> {
    switch (assertion.type) {
      case 'element-exists':
        const element = document.querySelector(assertion.selector)
        if (!element) {
          throw new Error(`Element does not exist: ${assertion.selector}`)
        }
        break

      case 'element-contains':
        const containerElement = document.querySelector(assertion.selector)
        if (!containerElement?.textContent?.includes(assertion.expected)) {
          throw new Error(`Element does not contain "${assertion.expected}": ${assertion.selector}`)
        }
        break

      case 'url-matches':
        if (!window.location.pathname.includes(assertion.expected)) {
          throw new Error(`URL does not match "${assertion.expected}", current: ${window.location.pathname}`)
        }
        break

      case 'state-equals':
        const currentValue = this.getNestedValue(this.applicationState, assertion.selector)
        if (currentValue !== assertion.expected) {
          throw new Error(`State mismatch: expected ${assertion.expected}, got ${currentValue}`)
        }
        break

      case 'custom':
        if (assertion.customAssertion) {
          const result = await assertion.customAssertion()
          if (!result) {
            throw new Error('Custom assertion failed')
          }
        }
        break
    }
  }

  /**
   * Wait for DOM and application to stabilize
   */
  private async waitForStable(timeout: number = 1000): Promise<void> {
    const start = Date.now()
    let lastNodeCount = this.getDOMNodeCount()
    let stableCount = 0

    while (Date.now() - start < timeout) {
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const currentNodeCount = this.getDOMNodeCount()
      if (currentNodeCount === lastNodeCount) {
        stableCount++
        if (stableCount >= 3) { // Stable for 150ms
          break
        }
      } else {
        stableCount = 0
        lastNodeCount = currentNodeCount
      }
    }
  }

  /**
   * Update application state
   */
  updateState(path: string, value: any): void {
    if (this.config.enableStateTracking) {
      this.setNestedValue(this.applicationState, path, value)
    }
  }

  /**
   * Get current application state
   */
  getState(path?: string): any {
    if (!path) return this.applicationState
    return this.getNestedValue(this.applicationState, path)
  }

  /**
   * Register component instance for tracking
   */
  registerComponent(name: string, instance: ComponentInstance): void {
    this.componentInstances.set(name, instance)
  }

  /**
   * Get component instance
   */
  getComponent(name: string): ComponentInstance | undefined {
    return this.componentInstances.get(name)
  }

  /**
   * Get memory usage (if available)
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed
    }
    return 0
  }

  /**
   * Get DOM node count
   */
  private getDOMNodeCount(): number {
    return document.querySelectorAll('*').length
  }

  /**
   * Get nested object value by path
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * Set nested object value by path
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {}
      return current[key]
    }, obj)
    target[lastKey] = value
  }

  /**
   * Generate scenario report
   */
  generateReport(result: ScenarioResult): string {
    const successRate = (result.completedSteps / result.totalSteps) * 100
    const avgStepDuration = result.performance.stepDurations.reduce((sum, step) => sum + step.duration, 0) / result.performance.stepDurations.length

    return `
=== Real-World Scenario Report ===
Scenario: ${result.scenario.name}
Success: ${result.success ? '✅' : '❌'}
Completion Rate: ${successRate.toFixed(1)}% (${result.completedSteps}/${result.totalSteps})
Total Duration: ${result.duration}ms
Average Step Duration: ${avgStepDuration.toFixed(1)}ms

Performance:
- Memory Usage: ${result.performance.memoryUsage.initial} → ${result.performance.memoryUsage.final} (Peak: ${result.performance.memoryUsage.peak})
- DOM Nodes: ${result.performance.domNodes.initial} → ${result.performance.domNodes.final} (Peak: ${result.performance.domNodes.peak})

${result.errors.length > 0 ? `
Errors:
${result.errors.map(error => `- ${error.step}: ${error.error.message}`).join('\n')}
` : ''}

Step Performance:
${result.performance.stepDurations.map(step => `- ${step.step}: ${step.duration}ms`).join('\n')}
`
  }
}

/**
 * Common scenario patterns and utilities
 */
export const ScenarioPatterns = {
  /**
   * E-commerce checkout flow pattern
   */
  ecommerceCheckout: {
    addToCart: (productId: string): UserAction[] => [
      { type: 'click', target: `[data-product-id="${productId}"] .add-to-cart` },
      { type: 'wait', value: 500 }
    ],
    proceedToCheckout: (): UserAction[] => [
      { type: 'click', target: '.cart-checkout-btn' },
      { type: 'wait', value: 300 }
    ],
    fillShippingInfo: (info: Record<string, string>): UserAction[] => 
      Object.entries(info).map(([field, value]) => ({ 
        type: 'input' as const, 
        target: `[name="${field}"]`, 
        value 
      })),
    fillPaymentInfo: (info: Record<string, string>): UserAction[] =>
      Object.entries(info).map(([field, value]) => ({ 
        type: 'input' as const, 
        target: `[name="${field}"]`, 
        value 
      }))
  },

  /**
   * Multi-step form pattern
   */
  multiStepForm: {
    nextStep: (): UserAction => ({ type: 'click', target: '.next-step-btn' }),
    prevStep: (): UserAction => ({ type: 'click', target: '.prev-step-btn' }),
    fillStep: (fields: Record<string, string>): UserAction[] =>
      Object.entries(fields).map(([field, value]) => ({ 
        type: 'input' as const, 
        target: `[name="${field}"]`, 
        value 
      }))
  },

  /**
   * Authentication pattern
   */
  authentication: {
    login: (email: string, password: string): UserAction[] => [
      { type: 'input', target: '[name="email"]', value: email },
      { type: 'input', target: '[name="password"]', value: password },
      { type: 'click', target: '.login-btn' },
      { type: 'wait', value: 1000 }
    ],
    logout: (): UserAction[] => [
      { type: 'click', target: '.user-menu' },
      { type: 'click', target: '.logout-btn' },
      { type: 'wait', value: 500 }
    ]
  }
}

/**
 * Auto-setup for real-world scenario testing
 */
export function setupRealWorldScenarioTesting(config?: {
  enableMemoryTracking?: boolean
  enablePerformanceTracking?: boolean
  defaultTimeout?: number
}): RealWorldScenarioTester {
  const tester = new RealWorldScenarioTester(config)

  beforeEach(async () => {
    // Clear DOM
    document.body.innerHTML = '<div id="test-app-root"></div>'
    // Reset application state
    tester.updateState('', {})
  })

  afterEach(async () => {
    // Cleanup after each test
    document.body.innerHTML = ''
  })

  return tester
}