/**
 * TachUI Registry
 *
 * Singleton registry management for TachUI modifiers.
 * This package provides the single source of truth for modifier registration
 * and ensures all packages use the same registry instance.
 */

export { 
  globalModifierRegistry,
  createIsolatedRegistry,
  resetGlobalRegistry 
} from './singleton'

export type {
  ModifierRegistry,
  ModifierFactory,
  ModifierLoader,
  Modifier,
  ModifierContext,
  RegistryHealth,
  ReactiveModifierProps,
  Signal
} from './types'

// Developer convenience API
import { globalModifierRegistry } from './singleton'
import type { ModifierFactory, ModifierLoader, RegistryHealth } from './types'

/**
 * Register a custom modifier with the global registry
 */
export function registerModifier<T>(name: string, factory: ModifierFactory<T>): void {
  globalModifierRegistry.register(name, factory)
}

/**
 * Register a lazy-loaded modifier with the global registry
 */
export function registerLazyModifier<T>(name: string, loader: ModifierLoader<T>): void {
  globalModifierRegistry.registerLazy(name, loader)
}

/**
 * Check if a modifier is registered
 */
export function hasModifier(name: string): boolean {
  return globalModifierRegistry.has(name)
}

/**
 * Get a list of all registered modifier names
 */
export function listModifiers(): string[] {
  return globalModifierRegistry.list()
}

/**
 * Validate the registry and get health information
 */
export function validateRegistry(): RegistryHealth {
  return globalModifierRegistry.validateRegistry()
}

/**
 * Get a modifier factory by name
 */
export function getModifier<T>(name: string): ModifierFactory<T> | undefined {
  return globalModifierRegistry.get<T>(name)
}

/**
 * Get a modifier factory by name (async version for lazy loading)
 */
export function getModifierAsync<T>(name: string): Promise<ModifierFactory<T> | undefined> {
  return globalModifierRegistry.get<T>(name, { async: true })
}

/**
 * Clear all modifiers from the registry (development/testing only)
 */
export function clearRegistry(): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('clearRegistry() not available in production environment')
  }
  globalModifierRegistry.clear()
}

/**
 * Reset the registry (test-only)
 */
export function resetRegistry(): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('resetRegistry() only available in test environment')
  }
  globalModifierRegistry.reset()
}