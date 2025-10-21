/**
 * TachUI Registry Types
 *
 * Type definitions for the TachUI modifier registry system.
 */

// Signal type will be inlined to avoid circular dependencies

/**
 * Basic Signal interface for reactive values
 */
export interface Signal<T> {
  (): T
  set(value: T): void
}

/**
 * Reactive modifier properties that can contain signals
 */
export type ReactiveModifierProps<T> = {
  [K in keyof T]: T[K] | Signal<T[K]>
}

/**
 * Modifier factory function type
 */
export type ModifierFactory<TProps = {}> = (
  props: ReactiveModifierProps<TProps>
) => Modifier<TProps>

/**
 * Lazy loader function type for on-demand modifier registration
 */
export type ModifierLoader<TProps = {}> = () => ModifierFactory<TProps> | Promise<ModifierFactory<TProps>>

/**
 * Base modifier interface that all modifiers must implement
 */
export interface Modifier<TProps = {}> {
  readonly type: string
  readonly priority: number
  readonly properties: TProps
  apply(node: any, context: ModifierContext): any | undefined
}

/**
 * Context passed to modifiers during application
 */
export interface ModifierContext {
  componentId: string
  componentInstance?: any
  element?: Element
  parentElement?: Element
  phase: 'creation' | 'update' | 'cleanup'
  previousModifiers?: Modifier[]
}

/**
 * Registry health diagnostic information
 */
export interface RegistryHealth {
  totalModifiers: number
  duplicateNames: string[]
  orphanedReferences: string[]
  instanceId: string
  createdAt: number
  instanceCount: number
}

/**
 * Modifier registry for registering custom modifiers
 */
export interface ModifierRegistry {
  register<TProps>(name: string, factory: ModifierFactory<TProps>): void
  registerLazy<TProps>(name: string, loader: ModifierLoader<TProps>): void
  get<TProps>(name: string): ModifierFactory<TProps> | undefined
  get<TProps>(name: string, options: { async: true }): Promise<ModifierFactory<TProps> | undefined>
  has(name: string): boolean
  list(): string[]
  clear(): void
  reset(): void
  validateRegistry(): RegistryHealth
}