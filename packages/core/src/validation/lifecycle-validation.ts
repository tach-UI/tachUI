/**
 * Component Lifecycle Validation - Phase 1C
 *
 * Comprehensive validation throughout component lifecycle including
 * mount, update, unmount, state changes, and prop validation.
 */

import type { ComponentInstance } from '../runtime/types'
import { isSignal } from '../reactive'
import { ProductionModeManager } from './production-bypass-core'

/**
 * Component lifecycle phase
 */
export type LifecyclePhase =
  | 'construct'
  | 'mount'
  | 'update'
  | 'unmount'
  | 'error'

/**
 * Component state snapshot for tracking changes
 */
export interface ComponentSnapshot {
  props: Record<string, any>
  timestamp: number
  phase: LifecyclePhase
  validationPassed: boolean
  errors: string[]
}

/**
 * Lifecycle validation configuration
 */
export interface LifecycleValidationConfig {
  enabled: boolean
  phases: {
    construct: boolean
    mount: boolean
    update: boolean
    unmount: boolean
  }
  validation: {
    propTypes: boolean
    stateConsistency: boolean
    memoryLeaks: boolean
    performanceWarnings: boolean
  }
  monitoring: {
    trackStateChanges: boolean
    detectMemoryLeaks: boolean
    performanceThreshold: number // ms
  }
}

/**
 * Default lifecycle validation configuration
 */
const defaultConfig: LifecycleValidationConfig = {
  enabled:
    process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test',
  phases: {
    construct: true,
    mount: true,
    update: false, // Can be expensive
    unmount: false,
  },
  validation: {
    propTypes: true,
    stateConsistency: true,
    memoryLeaks: true,
    performanceWarnings: true,
  },
  monitoring: {
    trackStateChanges: true,
    detectMemoryLeaks: true,
    performanceThreshold: 16, // One frame at 60fps
  },
}

/**
 * Component lifecycle tracker
 */
export class ComponentLifecycleTracker {
  private components = new WeakMap<ComponentInstance, ComponentSnapshot[]>()
  private mountedComponents = new WeakSet<ComponentInstance>()
  private config = defaultConfig

  // Performance monitoring
  private phaseTimings = new Map<string, number[]>()
  private memoryUsage: number[] = []

  // Statistics
  private totalComponents = 0
  private failedValidations = 0
  private memoryLeakDetections = 0

  /**
   * Configure lifecycle validation
   */
  configure(config: Partial<LifecycleValidationConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      phases: { ...this.config.phases, ...config.phases },
      validation: { ...this.config.validation, ...config.validation },
      monitoring: { ...this.config.monitoring, ...config.monitoring },
    }
  }

  /**
   * Validate component construction
   */
  validateConstruction(
    component: ComponentInstance,
    componentType: string,
    args: unknown[]
  ): void {
    if (!this.shouldValidate('construct')) return

    this.totalComponents++
    const startTime = performance.now()

    try {
      // Create initial snapshot
      const snapshot: ComponentSnapshot = {
        props: this.extractProps(args),
        timestamp: Date.now(),
        phase: 'construct',
        validationPassed: false,
        errors: [],
      }

      // Validate construction parameters
      this.validateConstructionParams(componentType, args, snapshot)

      // Validate component structure
      this.validateComponentStructure(component, componentType, snapshot)

      // Record successful validation
      snapshot.validationPassed = true
      this.recordSnapshot(component, snapshot)
    } catch (error) {
      this.failedValidations++

      throw new Error(
        `Lifecycle validation failed for ${componentType}: ${error instanceof Error ? error.message : String(error)}`
      )
    } finally {
      this.recordPhaseTime('construct', performance.now() - startTime)
    }
  }

  /**
   * Validate component mounting
   */
  validateMount(component: ComponentInstance, componentType: string): void {
    if (!this.shouldValidate('mount')) return

    const startTime = performance.now()

    try {
      // Check if component is already mounted
      if (this.mountedComponents.has(component)) {
        throw new Error('Component is already mounted')
      }

      // Create mount snapshot
      const snapshot: ComponentSnapshot = {
        props: this.getCurrentProps(component),
        timestamp: Date.now(),
        phase: 'mount',
        validationPassed: false,
        errors: [],
      }

      // Validate mount preconditions
      this.validateMountPreconditions(component, componentType, snapshot)

      // Check for potential memory leaks
      if (this.config.monitoring.detectMemoryLeaks) {
        this.checkMemoryUsage()
      }

      // Mark as mounted
      this.mountedComponents.add(component)
      snapshot.validationPassed = true
      this.recordSnapshot(component, snapshot)
    } catch (error) {
      this.failedValidations++

      throw new Error(
        `Mount validation failed for ${componentType}: ${error instanceof Error ? error.message : String(error)}`
      )
    } finally {
      this.recordPhaseTime('mount', performance.now() - startTime)
    }
  }

  /**
   * Validate component update
   */
  validateUpdate(
    component: ComponentInstance,
    componentType: string,
    newProps: any,
    oldProps: any
  ): void {
    if (!this.shouldValidate('update')) return

    const startTime = performance.now()

    try {
      // Check if component is mounted
      if (!this.mountedComponents.has(component)) {
        throw new Error('Cannot update unmounted component')
      }

      // Create update snapshot
      const snapshot: ComponentSnapshot = {
        props: newProps || {},
        timestamp: Date.now(),
        phase: 'update',
        validationPassed: false,
        errors: [],
      }

      // Validate prop changes
      this.validatePropChanges(newProps, oldProps, componentType, snapshot)

      // Validate state consistency
      if (this.config.validation.stateConsistency) {
        this.validateStateConsistency(component, componentType, snapshot)
      }

      snapshot.validationPassed = true
      this.recordSnapshot(component, snapshot)
    } catch (error) {
      this.failedValidations++

      // For updates, we typically want to warn rather than throw
      const errorMessage = `Update validation failed for ${componentType}: ${error instanceof Error ? error.message : String(error)}`

      if (this.config.validation.stateConsistency) {
        throw new Error(errorMessage)
      } else {
        console.warn(errorMessage)
      }
    } finally {
      this.recordPhaseTime('update', performance.now() - startTime)
    }
  }

  /**
   * Validate component unmounting
   */
  validateUnmount(component: ComponentInstance, componentType: string): void {
    if (!this.shouldValidate('unmount')) return

    const startTime = performance.now()

    try {
      // Check if component was mounted
      if (!this.mountedComponents.has(component)) {
        console.warn(
          `Component ${componentType} was not mounted, but unmount was called`
        )
      }

      // Create unmount snapshot
      const snapshot: ComponentSnapshot = {
        props: this.getCurrentProps(component),
        timestamp: Date.now(),
        phase: 'unmount',
        validationPassed: false,
        errors: [],
      }

      // Check for cleanup requirements
      this.validateUnmountCleanup(component, componentType, snapshot)

      // Remove from tracking
      this.mountedComponents.delete(component)
      snapshot.validationPassed = true
      this.recordSnapshot(component, snapshot)
    } catch (error) {
      this.failedValidations++

      console.warn(
        `Unmount validation failed for ${componentType}: ${error instanceof Error ? error.message : String(error)}`
      )
    } finally {
      this.recordPhaseTime('unmount', performance.now() - startTime)
    }
  }

  /**
   * Validate construction parameters
   */
  private validateConstructionParams(
    componentType: string,
    args: unknown[],
    snapshot: ComponentSnapshot
  ): void {
    if (!this.config.validation.propTypes) return

    // Basic parameter validation
    if (args.length === 0 && this.requiresParameters(componentType)) {
      snapshot.errors.push('Missing required parameters')
      throw new Error(`${componentType} component requires parameters`)
    }

    // Type validation for known components
    this.validateParameterTypes(componentType, args, snapshot)
  }

  /**
   * Validate component structure
   */
  private validateComponentStructure(
    component: ComponentInstance,
    componentType: string,
    snapshot: ComponentSnapshot
  ): void {
    // Check if component has required methods/properties
    const requiredProperties = ['type', 'render']
    const missingProperties = requiredProperties.filter(
      prop => !(prop in component)
    )

    if (missingProperties.length > 0) {
      snapshot.errors.push(
        `Missing properties: ${missingProperties.join(', ')}`
      )
      throw new Error(
        `Component ${componentType} missing required properties: ${missingProperties.join(', ')}`
      )
    }

    // Validate component type matches
    if ('type' in component && component.type !== componentType) {
      snapshot.errors.push(
        `Type mismatch: expected ${componentType}, got ${component.type}`
      )
      throw new Error(
        `Component type mismatch: expected ${componentType}, got ${component.type}`
      )
    }
  }

  /**
   * Validate mount preconditions
   */
  private validateMountPreconditions(
    component: ComponentInstance,
    componentType: string,
    snapshot: ComponentSnapshot
  ): void {
    // Check if component is in valid state for mounting
    if (
      'element' in component &&
      component.element &&
      !(component.element instanceof HTMLElement)
    ) {
      snapshot.errors.push('Invalid element type for mounting')
      throw new Error('Component element must be an HTMLElement for mounting')
    }

    // Check for required context/dependencies
    this.validateMountDependencies(component, componentType, snapshot)
  }

  /**
   * Validate prop changes during updates
   */
  private validatePropChanges(
    newProps: any,
    oldProps: any,
    componentType: string,
    snapshot: ComponentSnapshot
  ): void {
    if (!newProps || !oldProps) return

    // Check for invalid prop transitions
    for (const [key, newValue] of Object.entries(newProps)) {
      const oldValue = oldProps[key]

      // Check for type changes (usually problematic)
      if (oldValue !== undefined && newValue !== undefined) {
        const oldType = typeof oldValue
        const newType = typeof newValue

        if (
          oldType !== newType &&
          !this.isAllowedTypeChange(oldType, newType)
        ) {
          snapshot.errors.push(
            `Prop ${key} type changed from ${oldType} to ${newType}`
          )
          throw new Error(
            `Invalid prop type change: ${key} from ${oldType} to ${newType}`
          )
        }
      }

      // Check for null/undefined transitions
      if (oldValue !== undefined && newValue === undefined) {
        snapshot.errors.push(`Prop ${key} changed from defined to undefined`)
        // This is often a warning rather than an error
        console.warn(
          `⚠️ Prop ${key} in ${componentType} changed from defined to undefined`
        )
      }
    }
  }

  /**
   * Validate state consistency
   */
  private validateStateConsistency(
    component: ComponentInstance,
    componentType: string,
    snapshot: ComponentSnapshot
  ): void {
    // Check for common state consistency issues
    if ('state' in component && component.state) {
      const state = component.state

      // Check for circular references
      try {
        JSON.stringify(state)
      } catch (_error) {
        snapshot.errors.push('State contains circular references')
        throw new Error(
          `Component ${componentType} state contains circular references`
        )
      }

      // Check for invalid state values
      this.validateStateValues(state, componentType, snapshot)
    }
  }

  /**
   * Validate unmount cleanup
   */
  private validateUnmountCleanup(
    component: ComponentInstance,
    _componentType: string,
    snapshot: ComponentSnapshot
  ): void {
    // Check for potential memory leaks
    if ('element' in component && component.element) {
      // Check if element has event listeners that should be cleaned up
      this.checkEventListenerCleanup(component, snapshot)
    }

    // Check for timers/intervals that should be cleared
    // This would require integration with timer tracking
  }

  /**
   * Helper methods
   */
  private shouldValidate(phase: LifecyclePhase): boolean {
    return (
      this.config.enabled &&
      !ProductionModeManager.shouldBypassValidation() &&
      this.config.phases[phase as keyof typeof this.config.phases]
    )
  }

  private requiresParameters(componentType: string): boolean {
    const parametersRequired = [
      'Text',
      'Button',
      'Image',
      'Toggle',
      'VStack',
      'HStack',
      'ZStack',
    ]
    return parametersRequired.includes(componentType)
  }

  private validateParameterTypes(
    componentType: string,
    args: unknown[],
    snapshot: ComponentSnapshot
  ): void {
    // Component-specific parameter validation
    switch (componentType) {
      case 'Text':
        if (
          args.length > 0 &&
          typeof args[0] !== 'string' &&
          !isSignal(args[0])
        ) {
          snapshot.errors.push('Text content must be string or Signal')
          throw new Error('Text component requires string or Signal content')
        }
        break

      case 'Button':
        if (
          args.length > 0 &&
          typeof args[0] !== 'string' &&
          !isSignal(args[0])
        ) {
          snapshot.errors.push('Button title must be string or Signal')
          throw new Error('Button component requires string or Signal title')
        }
        break

      // Add more component-specific validations as needed
    }
  }

  private validateMountDependencies(
    _component: ComponentInstance,
    _componentType: string,
    _snapshot: ComponentSnapshot
  ): void {
    // Check for required context providers, themes, etc.
    // This would be expanded based on actual dependencies
  }

  private isAllowedTypeChange(oldType: string, newType: string): boolean {
    // Define allowed type transitions
    const allowedTransitions = new Set([
      'string-number',
      'number-string', // Common conversions
      'undefined-string',
      'undefined-number',
      'undefined-boolean', // Initial value setting
    ])

    return allowedTransitions.has(`${oldType}-${newType}`)
  }

  private validateStateValues(
    state: any,
    componentType: string,
    _snapshot: ComponentSnapshot
  ): void {
    // Check for common problematic state values
    for (const [key, value] of Object.entries(state)) {
      if (value === null) {
        console.warn(`⚠️ State property ${key} in ${componentType} is null`)
      }

      if (typeof value === 'function') {
        console.warn(
          `⚠️ State property ${key} in ${componentType} contains function (may cause serialization issues)`
        )
      }
    }
  }

  private checkEventListenerCleanup(
    _component: ComponentInstance,
    _snapshot: ComponentSnapshot
  ): void {
    // This would require integration with event tracking system
    // For now, just a placeholder
  }

  private extractProps(args: unknown[]): Record<string, any> {
    if (args.length === 0) return {}
    if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
      return args[0] as Record<string, any>
    }
    return { content: args[0] } // Simple case for string content
  }

  private getCurrentProps(component: ComponentInstance): Record<string, any> {
    if ('props' in component) {
      return component.props as Record<string, any>
    }
    return {}
  }

  private recordSnapshot(
    component: ComponentInstance,
    snapshot: ComponentSnapshot
  ): void {
    if (!this.components.has(component)) {
      this.components.set(component, [])
    }

    const snapshots = this.components.get(component)!
    snapshots.push(snapshot)

    // Limit snapshot history to prevent memory leaks
    if (snapshots.length > 10) {
      snapshots.shift()
    }
  }

  private recordPhaseTime(phase: string, time: number): void {
    if (!this.phaseTimings.has(phase)) {
      this.phaseTimings.set(phase, [])
    }

    const times = this.phaseTimings.get(phase)!
    times.push(time)

    // Limit timing history
    if (times.length > 100) {
      times.shift()
    }

    // Performance warning
    if (time > this.config.monitoring.performanceThreshold) {
      console.warn(
        `⚠️ Slow ${phase} phase: ${time.toFixed(2)}ms (threshold: ${this.config.monitoring.performanceThreshold}ms)`
      )
    }
  }

  private checkMemoryUsage(): void {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory
      this.memoryUsage.push(memory.usedJSHeapSize)

      // Limit memory history
      if (this.memoryUsage.length > 50) {
        this.memoryUsage.shift()
      }

      // Simple memory leak detection
      if (this.memoryUsage.length > 10) {
        const recent = this.memoryUsage.slice(-10)
        const average = recent.reduce((a, b) => a + b, 0) / recent.length
        const current = recent[recent.length - 1]

        if (current > average * 1.5) {
          this.memoryLeakDetections++
          console.warn(
            '⚠️ Potential memory leak detected - memory usage increased significantly'
          )
        }
      }
    }
  }

  /**
   * Get lifecycle validation statistics
   */
  getStats() {
    const phaseStats: Record<
      string,
      { count: number; averageTime: number; maxTime: number }
    > = {}

    for (const [phase, times] of this.phaseTimings) {
      phaseStats[phase] = {
        count: times.length,
        averageTime: times.reduce((a, b) => a + b, 0) / times.length,
        maxTime: Math.max(...times),
      }
    }

    return {
      totalComponents: this.totalComponents,
      failedValidations: this.failedValidations,
      memoryLeakDetections: this.memoryLeakDetections,
      phaseStats,
      config: this.config,
      memoryUsage:
        this.memoryUsage.length > 0
          ? {
              current: this.memoryUsage[this.memoryUsage.length - 1],
              average:
                this.memoryUsage.reduce((a, b) => a + b, 0) /
                this.memoryUsage.length,
              trend:
                this.memoryUsage.length > 1
                  ? this.memoryUsage[this.memoryUsage.length - 1] -
                    this.memoryUsage[0]
                  : 0,
            }
          : null,
    }
  }

  /**
   * Reset all tracking data
   */
  reset(): void {
    this.components = new WeakMap()
    this.mountedComponents = new WeakSet()
    this.phaseTimings.clear()
    this.memoryUsage = []
    this.totalComponents = 0
    this.failedValidations = 0
    this.memoryLeakDetections = 0
  }
}

// Global lifecycle tracker instance
export const lifecycleTracker = new ComponentLifecycleTracker()

// Export utilities
export const LifecycleValidationUtils = {
  configure: (config: Partial<LifecycleValidationConfig>) =>
    lifecycleTracker.configure(config),
  getStats: () => lifecycleTracker.getStats(),
  reset: () => lifecycleTracker.reset(),

  // Convenience methods for component integration
  validateConstruction: (
    component: ComponentInstance,
    type: string,
    args: unknown[]
  ) => lifecycleTracker.validateConstruction(component, type, args),

  validateMount: (component: ComponentInstance, type: string) =>
    lifecycleTracker.validateMount(component, type),

  validateUpdate: (
    component: ComponentInstance,
    type: string,
    newProps: any,
    oldProps: any
  ) => lifecycleTracker.validateUpdate(component, type, newProps, oldProps),

  validateUnmount: (component: ComponentInstance, type: string) =>
    lifecycleTracker.validateUnmount(component, type),
}
