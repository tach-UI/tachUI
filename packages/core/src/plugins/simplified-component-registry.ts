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

export class SimplifiedComponentRegistry {
  private components = new Map<string, ComponentRegistration>()

  register(registration: ComponentRegistration): void {
    // Simple validation
    if (!registration.name || typeof registration.name !== 'string') {
      throw new Error('Component registration must have a valid name')
    }
    
    if (!registration.component || typeof registration.component !== 'function') {
      throw new Error('Component registration must have a valid component function')
    }

    // Warn about overwrites but allow them
    if (this.components.has(registration.name)) {
      console.warn(`Component ${registration.name} already registered, overwriting`)
    }
    
    this.components.set(registration.name, registration)
    console.log(`📦 Component "${registration.name}" registered${registration.category ? ` (${registration.category})` : ''}`)
  }

  get(name: string): ComponentRegistration | undefined {
    return this.components.get(name)
  }

  getComponent(name: string): Component | undefined {
    return this.components.get(name)?.component
  }

  has(name: string): boolean {
    return this.components.has(name)
  }

  list(): ComponentRegistration[] {
    return Array.from(this.components.values())
  }

  listByCategory(category: string): ComponentRegistration[] {
    return this.list().filter(reg => reg.category === category)
  }

  listByPlugin(plugin: string): ComponentRegistration[] {
    return this.list().filter(reg => reg.plugin === plugin)
  }

  unregister(name: string): boolean {
    const existed = this.components.has(name)
    this.components.delete(name)
    
    if (existed) {
      console.log(`🗑️ Component "${name}" unregistered`)
    }
    
    return existed
  }

  unregisterByPlugin(plugin: string): string[] {
    const unregistered: string[] = []
    
    for (const [name, registration] of this.components.entries()) {
      if (registration.plugin === plugin) {
        this.components.delete(name)
        unregistered.push(name)
      }
    }
    
    if (unregistered.length > 0) {
      console.log(`🗑️ Unregistered ${unregistered.length} components from plugin "${plugin}": ${unregistered.join(', ')}`)
    }
    
    return unregistered
  }

  clear(): void {
    const count = this.components.size
    this.components.clear()
    console.log(`🗑️ Cleared ${count} registered components`)
  }

  getStats() {
    const stats = {
      totalComponents: this.components.size,
      categories: new Map<string, number>(),
      plugins: new Map<string, number>(),
      tags: new Map<string, number>()
    }

    for (const registration of this.components.values()) {
      // Count by category
      const category = registration.category || 'uncategorized'
      stats.categories.set(category, (stats.categories.get(category) || 0) + 1)
      
      // Count by plugin
      const plugin = registration.plugin || 'core'
      stats.plugins.set(plugin, (stats.plugins.get(plugin) || 0) + 1)
      
      // Count by tags
      if (registration.tags) {
        for (const tag of registration.tags) {
          stats.tags.set(tag, (stats.tags.get(tag) || 0) + 1)
        }
      }
    }

    return {
      totalComponents: stats.totalComponents,
      categories: Object.fromEntries(stats.categories),
      plugins: Object.fromEntries(stats.plugins),
      tags: Object.fromEntries(stats.tags)
    }
  }
}