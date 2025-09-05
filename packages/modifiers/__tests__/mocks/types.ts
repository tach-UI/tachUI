/**
 * Mock types for testing without core dependencies
 */

export interface ModifierContext {
  element?: HTMLElement | any
  componentId?: string
  instanceId?: string
}

export type ReactiveModifierProps<T> = T

export interface Modifier {
  type: string
  priority: number
  apply(node: any, context: ModifierContext): any
}
