/**
 * Simplified Plugin System - Phase 1 Implementation
 *
 * Main exports for the streamlined plugin system.
 * Removes over-engineered security, performance monitoring, and complex preloading.
 */

// Core simplified plugin system
export { SimplifiedPluginManager } from './simplified-plugin-manager'
export { SimplifiedComponentRegistry } from './simplified-component-registry'
export {
  SimplifiedTachUIInstance,
  globalTachUIInstance,
  installPlugin,
  registerComponent,
  registerService,
} from './simplified-tachui-instance'

// Simplified types
export type {
  TachUIPlugin,
  TachUIInstance,
  ComponentRegistrationOptions,
  ServiceRegistration,
} from './simplified-types'
export { PluginError } from './simplified-types'

// Component registration types
export type { ComponentRegistration } from './simplified-component-registry'

// Essential utilities
export {
  validateSemver,
  compareSemver,
  validatePluginName,
  normalizePluginName,
  PluginDevUtils,
} from './simplified-utils'

// Optimized lazy loading (Week 3 performance enhancement)
export {
  OptimizedLazyPluginLoader,
  createLazyPlugin,
  // Backward compatibility alias
  OptimizedLazyPluginLoader as SimplifiedLazyPluginLoader,
} from './simplified-lazy-loader'

// Plugin error handling moved to @tachui/devtools - import from that package

// Legacy adapter for backward compatibility
export {
  createLegacyPluginAdapter,
  isLegacyPlugin,
  adaptPlugin,
} from './legacy-adapter'
