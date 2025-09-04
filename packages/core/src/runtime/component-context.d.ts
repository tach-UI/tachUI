/**
 * Component Context System
 *
 * Provides proper context injection for component state management,
 * environment objects, and dependency injection. This fixes the broken
 * @State, @Binding, and @EnvironmentObject implementations.
 */
import type {
  ComponentContext,
  ComponentInstance,
  ComponentProps,
} from './types'
/**
 * Symbol for component context storage in reactive owner
 */
export declare const ComponentContextSymbol: unique symbol
/**
 * Symbol for environment object storage
 */
export declare const EnvironmentSymbol: unique symbol
/**
 * Create a new component context
 */
export declare function createComponentContext(
  componentId: string,
  parent?: ComponentContext
): ComponentContext
/**
 * Get the current component context
 */
export declare function getCurrentComponentContext(): ComponentContext
/**
 * Set the current component context (used during rendering)
 */
export declare function setCurrentComponentContext(
  context: ComponentContext | null
): void
/**
 * Run a function with a specific component context
 */
export declare function runWithComponentContext<T>(
  context: ComponentContext,
  fn: () => T
): T
/**
 * Enhanced component wrapper that provides context injection
 */
export declare function withComponentContext<P extends ComponentProps>(
  component: (props: P) => ComponentInstance<P>,
  contextId?: string
): (props: P) => ComponentInstance<P>
/**
 * Environment object key type
 */
export interface EnvironmentKey<T> {
  readonly symbol: symbol
  readonly defaultValue?: T
  readonly name: string
}
/**
 * Create an environment key
 */
export declare function createEnvironmentKey<T>(
  name: string,
  defaultValue?: T
): EnvironmentKey<T>
/**
 * Provide environment value
 */
export declare function provideEnvironmentValue<T>(
  key: EnvironmentKey<T>,
  value: T
): void
/**
 * Consume environment value
 */
export declare function consumeEnvironmentValue<T>(key: EnvironmentKey<T>): T
/**
 * Debug utilities
 */
export declare const ComponentContextDebug: {
  getCurrentContext: () => ComponentContext | null
  getContextHierarchy: () => ComponentContext[]
  getContextMetrics: (context?: ComponentContext) => {
    id: string
    createdAt: number
    updateCount: number
    stateCount: number
    bindingCount: number
    providerCount: number
    consumerCount: number
  } | null
}
//# sourceMappingURL=component-context.d.ts.map
