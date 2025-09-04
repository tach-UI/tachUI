/**
 * Component Lifecycle Validation - Phase 1C
 *
 * Comprehensive validation throughout component lifecycle including
 * mount, update, unmount, state changes, and prop validation.
 */
import type { ComponentInstance } from '../runtime/types'
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
    performanceThreshold: number
  }
}
/**
 * Component lifecycle tracker
 */
export declare class ComponentLifecycleTracker {
  private components
  private mountedComponents
  private config
  private phaseTimings
  private memoryUsage
  private totalComponents
  private failedValidations
  private memoryLeakDetections
  /**
   * Configure lifecycle validation
   */
  configure(config: Partial<LifecycleValidationConfig>): void
  /**
   * Validate component construction
   */
  validateConstruction(
    component: ComponentInstance,
    componentType: string,
    args: unknown[]
  ): void
  /**
   * Validate component mounting
   */
  validateMount(component: ComponentInstance, componentType: string): void
  /**
   * Validate component update
   */
  validateUpdate(
    component: ComponentInstance,
    componentType: string,
    newProps: any,
    oldProps: any
  ): void
  /**
   * Validate component unmounting
   */
  validateUnmount(component: ComponentInstance, componentType: string): void
  /**
   * Validate construction parameters
   */
  private validateConstructionParams
  /**
   * Validate component structure
   */
  private validateComponentStructure
  /**
   * Validate mount preconditions
   */
  private validateMountPreconditions
  /**
   * Validate prop changes during updates
   */
  private validatePropChanges
  /**
   * Validate state consistency
   */
  private validateStateConsistency
  /**
   * Validate unmount cleanup
   */
  private validateUnmountCleanup
  /**
   * Helper methods
   */
  private shouldValidate
  private requiresParameters
  private validateParameterTypes
  private validateMountDependencies
  private isAllowedTypeChange
  private validateStateValues
  private checkEventListenerCleanup
  private extractProps
  private getCurrentProps
  private recordSnapshot
  private recordPhaseTime
  private checkMemoryUsage
  /**
   * Get lifecycle validation statistics
   */
  getStats(): {
    totalComponents: number
    failedValidations: number
    memoryLeakDetections: number
    phaseStats: Record<
      string,
      {
        count: number
        averageTime: number
        maxTime: number
      }
    >
    config: LifecycleValidationConfig
    memoryUsage: {
      current: number
      average: number
      trend: number
    } | null
  }
  /**
   * Reset all tracking data
   */
  reset(): void
}
export declare const lifecycleTracker: ComponentLifecycleTracker
export declare const LifecycleValidationUtils: {
  configure: (config: Partial<LifecycleValidationConfig>) => void
  getStats: () => {
    totalComponents: number
    failedValidations: number
    memoryLeakDetections: number
    phaseStats: Record<
      string,
      {
        count: number
        averageTime: number
        maxTime: number
      }
    >
    config: LifecycleValidationConfig
    memoryUsage: {
      current: number
      average: number
      trend: number
    } | null
  }
  reset: () => void
  validateConstruction: (
    component: ComponentInstance,
    type: string,
    args: unknown[]
  ) => void
  validateMount: (component: ComponentInstance, type: string) => void
  validateUpdate: (
    component: ComponentInstance,
    type: string,
    newProps: any,
    oldProps: any
  ) => void
  validateUnmount: (component: ComponentInstance, type: string) => void
}
//# sourceMappingURL=lifecycle-validation.d.ts.map
