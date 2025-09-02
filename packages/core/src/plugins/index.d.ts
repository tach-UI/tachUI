/**
 * Simplified Plugin System - Phase 1 Implementation
 *
 * Main exports for the streamlined plugin system.
 * Removes over-engineered security, performance monitoring, and complex preloading.
 */
export { SimplifiedPluginManager } from './simplified-plugin-manager'
export { SimplifiedComponentRegistry } from './simplified-component-registry'
export {
  SimplifiedTachUIInstance,
  globalTachUIInstance,
  installPlugin,
  registerComponent,
  registerService,
} from './simplified-tachui-instance'
export type {
  TachUIPlugin,
  TachUIInstance,
  ComponentRegistrationOptions,
  ServiceRegistration,
} from './simplified-types'
export { PluginError } from './simplified-types'
export type { ComponentRegistration } from './simplified-component-registry'
export {
  validateSemver,
  compareSemver,
  validatePluginName,
  normalizePluginName,
  PluginDevUtils,
} from './simplified-utils'
export {
  OptimizedLazyPluginLoader,
  createLazyPlugin,
  OptimizedLazyPluginLoader as SimplifiedLazyPluginLoader,
} from './simplified-lazy-loader'
export {
  createLegacyPluginAdapter,
  isLegacyPlugin,
  adaptPlugin,
} from './legacy-adapter'
//# sourceMappingURL=index.d.ts.map
