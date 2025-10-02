/**
 * TachUI Registry Singleton
 *
 * Provides a single, globally shared modifier registry instance.
 * This ensures all packages use the same registry regardless of import path.
 */

import type {
  ModifierRegistry,
  ModifierFactory,
  ModifierLoader,
  RegistryHealth,
} from "./types";

// Global singleton instance - this is the single source of truth
let globalRegistryInstance: ModifierRegistryImpl | null = null;

/**
 * Internal registry implementation
 */
class ModifierRegistryImpl implements ModifierRegistry {
  private static instanceCount = 0;
  private readonly instanceId: string;
  private readonly createdAt: number;
  private modifiers = new Map<string, ModifierFactory<any>>();
  private lazyLoaders = new Map<string, ModifierLoader<any>>();
  private loadingPromises = new Map<string, Promise<ModifierFactory<any>>>();

  constructor() {
    ModifierRegistryImpl.instanceCount++;
    this.instanceId = Math.random().toString(36).substr(2, 9);
    this.createdAt = Date.now();

    if (process.env.NODE_ENV === "development") {
      console.log(
        `🏗️ ModifierRegistry instance created: ${this.instanceId} (total: ${ModifierRegistryImpl.instanceCount})`,
      );
    }
  }

  register<TProps>(name: string, factory: ModifierFactory<TProps>): void {
    this.modifiers.set(name, factory);
    // Remove any lazy loader for this name since we now have the actual factory
    this.lazyLoaders.delete(name);
    this.loadingPromises.delete(name);

    if (process.env.NODE_ENV === "development") {
      console.log(
        `✅ Registered modifier '${name}' in registry ${this.instanceId} (total: ${this.modifiers.size})`,
      );
    }
  }

  registerLazy<TProps>(name: string, loader: ModifierLoader<TProps>): void {
    // Don't overwrite if already registered
    if (this.modifiers.has(name)) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `⚠️ Modifier '${name}' already registered, skipping lazy registration`,
        );
      }
      return;
    }

    this.lazyLoaders.set(name, loader);

    // if (process.env.NODE_ENV === 'development') {
    //   console.log(`📦 Registered lazy loader for modifier '${name}' in registry ${this.instanceId}`)
    // }
  }

  get<TProps>(name: string): ModifierFactory<TProps> | undefined;
  get<TProps>(
    name: string,
    options?: { async: true },
  ): Promise<ModifierFactory<TProps> | undefined>;
  get<TProps>(
    name: string,
    options?: { async?: boolean },
  ):
    | ModifierFactory<TProps>
    | undefined
    | Promise<ModifierFactory<TProps> | undefined> {
    // First check if already loaded
    const cached = this.modifiers.get(name) as
      | ModifierFactory<TProps>
      | undefined;
    if (cached) {
      return cached;
    }

    // Check if there's a lazy loader
    const loader = this.lazyLoaders.get(name);
    if (!loader) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `⚠️ Modifier '${name}' not found in registry ${this.instanceId}`,
        );
      }
      return undefined;
    }

    // If async is explicitly requested, return a promise
    if (options?.async) {
      return this.getAsync<TProps>(name);
    }

    // For synchronous access, try to load immediately if possible
    try {
      const factory = loader();
      if (factory instanceof Promise) {
        // If loader returns a promise, we need to handle it
        return factory
          .then((resolvedFactory) => {
            this.modifiers.set(name, resolvedFactory);
            this.lazyLoaders.delete(name);
            return resolvedFactory;
          })
          .catch((error) => {
            if (process.env.NODE_ENV === "development") {
              console.warn(`⚠️ Failed to load modifier '${name}':`, error);
            }
            return undefined;
          });
      } else {
        // Synchronous loading
        this.modifiers.set(name, factory);
        this.lazyLoaders.delete(name);
        return factory;
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `⚠️ Failed to load modifier '${name}' synchronously:`,
          error,
        );
      }
      return undefined;
    }
  }

  private async getAsync<TProps>(
    name: string,
  ): Promise<ModifierFactory<TProps> | undefined> {
    // Check if already loading
    const existingPromise = this.loadingPromises.get(name) as
      | Promise<ModifierFactory<TProps>>
      | undefined;
    if (existingPromise) {
      return existingPromise;
    }

    // Check if there's a lazy loader
    const loader = this.lazyLoaders.get(name);
    if (!loader) {
      return undefined;
    }

    // Start loading
    const loadPromise = this.loadModifier<TProps>(name, loader);
    this.loadingPromises.set(name, loadPromise);

    try {
      const factory = await loadPromise;
      this.loadingPromises.delete(name);
      return factory;
    } catch (error) {
      this.loadingPromises.delete(name);
      if (process.env.NODE_ENV === "development") {
        console.error(`❌ Failed to load modifier '${name}':`, error);
      }
      throw error;
    }
  }

  private async loadModifier<TProps>(
    name: string,
    loader: ModifierLoader<TProps>,
  ): Promise<ModifierFactory<TProps>> {
    try {
      const factory = await loader();

      // Cache the loaded factory
      this.modifiers.set(name, factory);
      this.lazyLoaders.delete(name);

      return factory;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(`❌ Error loading modifier '${name}':`, error);
      }
      throw error;
    }
  }

  has(name: string): boolean {
    return this.modifiers.has(name) || this.lazyLoaders.has(name);
  }

  list(): string[] {
    const loaded = Array.from(this.modifiers.keys());
    const lazy = Array.from(this.lazyLoaders.keys());
    return [...loaded, ...lazy];
  }

  clear(): void {
    this.modifiers.clear();
    this.lazyLoaders.clear();
    this.loadingPromises.clear();
    if (process.env.NODE_ENV === "development") {
      console.log(
        `🧹 Cleared all modifiers and lazy loaders from registry ${this.instanceId}`,
      );
    }
  }

  reset(): void {
    this.clear();
    // Reset instance counter for testing
    if (process.env.NODE_ENV === "test") {
      ModifierRegistryImpl.instanceCount = 0;
    }
  }

  validateRegistry(): RegistryHealth {
    const modifierNames = this.list();
    const duplicates = modifierNames.filter(
      (name, index) => modifierNames.indexOf(name) !== index,
    );

    return {
      totalModifiers: this.modifiers.size + this.lazyLoaders.size,
      duplicateNames: duplicates,
      orphanedReferences: [], // Could be enhanced to scan for broken references
      instanceId: this.instanceId,
      createdAt: this.createdAt,
      instanceCount: ModifierRegistryImpl.instanceCount,
    };
  }

  /**
   * Get diagnostic information about this registry instance
   */
  getDiagnostics() {
    return {
      instanceId: this.instanceId,
      createdAt: this.createdAt,
      modifierCount: this.modifiers.size,
      lazyLoaderCount: this.lazyLoaders.size,
      modifiers: this.list(),
      loadedModifiers: Array.from(this.modifiers.keys()),
      lazyModifiers: Array.from(this.lazyLoaders.keys()),
    };
  }
}

/**
 * Get the global singleton registry instance
 * This is the ONLY way to access the registry
 */
function getGlobalRegistry(): ModifierRegistryImpl {
  if (!globalRegistryInstance) {
    globalRegistryInstance = new ModifierRegistryImpl();

    if (process.env.NODE_ENV === "development") {
      console.log("🌟 Created global TachUI modifier registry singleton");
    }
  }

  return globalRegistryInstance;
}

/**
 * The global modifier registry - this is what all packages should import
 */
export const globalModifierRegistry = getGlobalRegistry();

/**
 * Create an isolated registry instance for testing
 */
export function createIsolatedRegistry(): ModifierRegistryImpl {
  if (process.env.NODE_ENV !== "test") {
    throw new Error(
      "createIsolatedRegistry() only available in test environment",
    );
  }
  return new ModifierRegistryImpl();
}

/**
 * Reset the global registry (test-only)
 */
export function resetGlobalRegistry(): void {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("resetGlobalRegistry() only available in test environment");
  }
  if (globalRegistryInstance) {
    globalRegistryInstance.reset();
    globalRegistryInstance = null;
  }
}

/**
 * Development utility to check registry health
 */
if (process.env.NODE_ENV === "development") {
  // Expose diagnostics on the registry for debugging
  (globalModifierRegistry as any).getDiagnostics = () =>
    globalRegistryInstance?.getDiagnostics();

  console.log("📤 Exported globalModifierRegistry from @tachui/registry");
}
