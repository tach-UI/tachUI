/**
 * Simplified Component Registry - Phase 1 Implementation
 *
 * Streamlined component registration with basic functionality only.
 * Removes complex lazy loading, chunk management, and metadata tracking.
 */
import type { Component } from '../runtime/types'
export interface ComponentRegistration {
  name: string
  component: Component
  category?: string
  tags?: string[]
  plugin?: string
}
export declare class SimplifiedComponentRegistry {
  private components
  register(registration: ComponentRegistration): void
  get(name: string): ComponentRegistration | undefined
  getComponent(name: string): Component | undefined
  has(name: string): boolean
  list(): ComponentRegistration[]
  listByCategory(category: string): ComponentRegistration[]
  listByPlugin(plugin: string): ComponentRegistration[]
  unregister(name: string): boolean
  unregisterByPlugin(plugin: string): string[]
  clear(): void
  getStats(): {
    totalComponents: number
    categories: {
      [k: string]: number
    }
    plugins: {
      [k: string]: number
    }
    tags: {
      [k: string]: number
    }
  }
}
//# sourceMappingURL=simplified-component-registry.d.ts.map
