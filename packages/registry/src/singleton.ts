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
  RegistryFeatureFlags,
  ModifierMetadata,
  PluginInfo,
} from "./types";

// Global singleton instance - this is the single source of truth
let globalRegistryInstance: ModifierRegistryImpl | null = null;

/**
 * Internal registry implementation
 */
class ModifierRegistryImpl implements ModifierRegistry {
  private static instanceCount = 0;
  private static readonly FORBIDDEN_NAMES = new Set<string>([
    "__proto__",
    "constructor",
    "prototype",
    "hasOwnProperty",
    "isPrototypeOf",
    "toString",
    "valueOf",
  ]);
  private static readonly NAME_PATTERN = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

  private static validateModifierName(
    name: string,
    options: { strict?: boolean } = {},
  ): void {
    if (ModifierRegistryImpl.FORBIDDEN_NAMES.has(name)) {
      throw new Error(
        `Security Error: Cannot register modifier '${name}' (forbidden name)`,
      );
    }

    if (!ModifierRegistryImpl.NAME_PATTERN.test(name)) {
      if (options.strict) {
        throw new Error(
          `Invalid modifier name '${name}'. Modifier names must match ${ModifierRegistryImpl.NAME_PATTERN}`,
        );
      }

      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `⚠️ Modifier name '${name}' does not match ${ModifierRegistryImpl.NAME_PATTERN}. Prefer alphanumeric names for best tooling support.`,
        );
      }
    }
  }
  private readonly instanceId: string;
  private readonly createdAt: number;
  private modifiers = new Map<string, ModifierFactory<any>>();
  private lazyLoaders = new Map<string, ModifierLoader<any>>();
  private loadingPromises = new Map<string, Promise<ModifierFactory<any>>>();

  // Feature flags
  private featureFlags: RegistryFeatureFlags = {
    proxyModifiers: false, // Disabled by default for safe rollout
    autoTypeGeneration: false,
    hmrCacheInvalidation: false,
    pluginValidation: true,
    performanceMonitoring: false,
    metadataRegistration: true, // Enable for new system
  };

  // Metadata storage for type generation
  private metadata = new Map<string | symbol, ModifierMetadata>();
  private metadataHistory = new Map<string | symbol, ModifierMetadata[]>();
  private conflicts = new Map<string | symbol, ModifierMetadata[]>();

  // Plugin metadata storage
  private plugins = new Map<string, PluginInfo>();

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
    ModifierRegistryImpl.validateModifierName(name);

    this.modifiers.set(name, factory);
    // Remove any lazy loader for this name since we now have the actual factory
    this.lazyLoaders.delete(name);
    this.loadingPromises.delete(name);
  }

  registerLazy<TProps>(name: string, loader: ModifierLoader<TProps>): void {
    ModifierRegistryImpl.validateModifierName(name);

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
    this.metadata.clear();
    this.metadataHistory.clear();
    this.conflicts.clear();
    this.plugins.clear();
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
      featureFlags: this.featureFlags,
      metadataCount: this.metadata.size,
    };
  }

  // ============================================================================
  // Feature Flag Methods
  // ============================================================================

  /**
   * Set feature flags for the registry
   * Allows enabling/disabling features for gradual rollout
   */
  setFeatureFlags(flags: Partial<RegistryFeatureFlags>): void {
    this.featureFlags = {
      ...this.featureFlags,
      ...flags,
    };
  }

  /**
   * Get current feature flags
   */
  getFeatureFlags(): RegistryFeatureFlags {
    return { ...this.featureFlags };
  }

  /**
   * Check if a specific feature is enabled
   */
  isFeatureEnabled(feature: keyof RegistryFeatureFlags): boolean {
    return this.featureFlags[feature] === true;
  }

  // ============================================================================
  // Metadata Methods (for build-time type generation)
  // ============================================================================

  /**
   * Register metadata for a modifier (for type generation)
   */
  registerMetadata(modifierMetadata: ModifierMetadata): void {
    if (!this.isFeatureEnabled("metadataRegistration")) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `⚠️ Metadata registration is disabled. Enable 'metadataRegistration' feature flag.`,
        );
      }
      return;
    }

    if (!modifierMetadata.plugin) {
      throw new Error(
        `Modifier metadata '${String(modifierMetadata.name)}' must include a plugin identifier`,
      );
    }

    if (typeof modifierMetadata.name === "string") {
      ModifierRegistryImpl.validateModifierName(modifierMetadata.name, {
        strict: true,
      });
    }

    const existing = this.metadata.get(modifierMetadata.name);
    const samePlugin = existing?.plugin === modifierMetadata.plugin;

    this.recordMetadataHistoryEntry(modifierMetadata);

    if (!existing) {
      this.metadata.set(modifierMetadata.name, modifierMetadata);
      return;
    }

    if (samePlugin) {
      this.metadata.set(modifierMetadata.name, modifierMetadata);
      return;
    }

    if (modifierMetadata.priority > existing.priority) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `⚠️ Overriding modifier metadata '${String(modifierMetadata.name)}' from ${existing.plugin} (priority ${existing.priority}) with ${modifierMetadata.plugin} (priority ${modifierMetadata.priority})`,
        );
      }
      this.metadata.set(modifierMetadata.name, modifierMetadata);
      return;
    }

    if (
      modifierMetadata.priority === existing.priority &&
      modifierMetadata.plugin !== existing.plugin &&
      process.env.NODE_ENV === "development"
    ) {
      console.error(
        `❌ Metadata conflict for '${String(modifierMetadata.name)}': ${existing.plugin} vs ${modifierMetadata.plugin} (both priority ${modifierMetadata.priority})`,
      );
    }
  }

  private recordMetadataHistoryEntry(metadata: ModifierMetadata): void {
    const entries = this.metadataHistory.get(metadata.name) ?? [];

    const key = `${metadata.plugin}:${metadata.priority}`;
    const existingIndex = entries.findIndex(
      (entry) => `${entry.plugin}:${entry.priority}` === key,
    );

    if (existingIndex >= 0) {
      entries[existingIndex] = metadata;
    } else {
      entries.push(metadata);
    }

    this.metadataHistory.set(metadata.name, entries);
    this.refreshConflictsFor(metadata.name, entries);
  }

  private refreshConflictsFor(
    name: string | symbol,
    entries: ModifierMetadata[],
  ): void {
    const conflictsForName: ModifierMetadata[] = [];
    const byPriority = new Map<number, Map<string, ModifierMetadata>>();

    for (const entry of entries) {
      const priorityMap =
        byPriority.get(entry.priority) ?? new Map<string, ModifierMetadata>();
      priorityMap.set(entry.plugin, entry);
      byPriority.set(entry.priority, priorityMap);
    }

    for (const priorityMap of byPriority.values()) {
      if (priorityMap.size > 1) {
        for (const conflictEntry of priorityMap.values()) {
          conflictsForName.push(conflictEntry);
        }
      }
    }

    if (conflictsForName.length > 0) {
      this.conflicts.set(name, conflictsForName);
    } else {
      this.conflicts.delete(name);
    }
  }

  /**
   * Get metadata for a specific modifier
   */
  getMetadata(name: string | symbol): ModifierMetadata | undefined {
    return this.metadata.get(name);
  }

  /**
   * Get all registered metadata
   */
  getAllMetadata(): ModifierMetadata[] {
    return Array.from(this.metadata.values());
  }

  /**
   * Get metadata filtered by category
   */
  getModifiersByCategory(
    category: ModifierMetadata["category"],
  ): ModifierMetadata[] {
    return this.getAllMetadata().filter((meta) => meta.category === category);
  }

  getMetadataByCategory(
    category: ModifierMetadata["category"],
  ): ModifierMetadata[] {
    return this.getModifiersByCategory(category);
  }

  /**
   * Get conflicts (multiple modifiers with same name but different plugins)
   */
  getConflicts(): Map<string | symbol, ModifierMetadata[]> {
    return new Map(
      Array.from(this.conflicts.entries(), ([key, value]) => [key, [...value]]),
    );
  }

  registerPlugin(metadata: PluginInfo): void {
    if (!metadata.name || !metadata.version) {
      throw new Error("Plugin must define both name and version");
    }

    if (!metadata.author) {
      throw new Error(
        `Plugin '${metadata.name}' must include an author or organization`,
      );
    }

    if (!metadata.verified && process.env.NODE_ENV !== "production") {
      console.warn(
        `⚠️ Registering unverified plugin '${metadata.name}'. Install plugins from trusted sources.`,
      );
    }

    this.plugins.set(metadata.name, metadata);
  }

  getPluginInfo(name: string): PluginInfo | undefined {
    return this.plugins.get(name);
  }

  listPlugins(): PluginInfo[] {
    return Array.from(this.plugins.values());
  }
}

/**
 * Get the global singleton registry instance
 * This is the ONLY way to access the registry
 */
function getGlobalRegistry(): ModifierRegistryImpl {
  if (!globalRegistryInstance) {
    globalRegistryInstance = new ModifierRegistryImpl();

    // if (process.env.NODE_ENV === "development") {
    //   console.log("🌟 Created global TachUI modifier registry singleton");
    // }
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
