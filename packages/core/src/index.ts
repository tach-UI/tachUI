/**
 * TachUI Framework
 *
 * A SwiftUI-inspired web framework with SolidJS-style reactivity,
 * compile-time optimization, and TypeScript-first design.
 */

// Assets system
export {
  Assets,
  Asset,
  ColorAsset,
  ImageAsset,
  FontAsset,
  FontWidth,
  SystemFonts,
  createSystemFont,
  createGoogleFont,
  createVariableFont,
  registerAsset,
  createColorAsset,
  createImageAsset,
  createFontAsset,
  getAssetInfo,
  listAssetNames,
  type FontAssetOptions,
  type FontWeightValue,
  type FontWidthValue,
  type AssetInfo,
  type AssetsInterface,
} from './assets'

// Constants system
export {
  infinity,
  Layout,
  isInfinity,
  dimensionToCSS,
  infinityToFlexCSS,
  shouldExpandForInfinity,
  type Dimension,
  type InfinityValue,
} from './constants'

// Concatenation system
export {
  type ComponentSegment,
  type ConcatenationMetadata,
  type AccessibilityNode,
  type ConcatenationResult,
  type Concatenatable,
  ConcatenationSymbol,
  isConcatenatable,
  isConcatenatedComponent,
  ConcatenatableBase,
  makeConcatenatable,
  CONCAT_SYMBOL,
  ConcatenatedComponent,
  Concatenated,
  TextConcatenationOptimizer,
} from './concatenation'

// Frame utilities and SUI compatibility
export {
  fillMaxWidth,
  fillMaxHeight,
  fillMaxSize,
  expand,
  fixedWidthExpandHeight,
  fixedHeightExpandWidth,
  constrainedExpand,
  responsive,
  flexible,
  fullScreen,
  remainingSpace,
  equalShare,
} from './constants/frame-utils'

// Compiler system (Phase 2)
export * from './compiler'

// Component system (Phase 4-5)
export * from './components'

// Primitives moved to @tachui/primitives - import directly from that package

// Modifier system compatibility layer (will migrate to @tachui/modifiers)
export * from './modifiers-compat'

// Data components (List, Menu, Section) are included in the main components export

// Gradient system
export * from './gradients'
// Simplified Plugin System (Phase 1)
export {
  SimplifiedPluginManager,
  SimplifiedComponentRegistry,
  SimplifiedTachUIInstance,
  globalTachUIInstance,
  installPlugin,
  registerComponent,
  registerService,
  OptimizedLazyPluginLoader,
  createLazyPlugin,
  createLegacyPluginAdapter,
  isLegacyPlugin,
  adaptPlugin,
  PluginError,
  validateSemver,
  compareSemver,
  validatePluginName,
  normalizePluginName,
  PluginDevUtils,
  OptimizedPluginErrorHandler,
  SimplifiedPluginErrorHandler,
  globalPluginErrorHandler,
  ErrorRecoveryUtils,
} from './plugins'
export type {
  TachUIPlugin,
  TachUIInstance,
  ComponentRegistrationOptions,
  ServiceRegistration,
  ComponentRegistration,
} from './plugins'

// Reactive system (Phase 1)
export * from './reactive'
// Runtime system (Phase 3)
export * from './runtime'
export { registerComponentWithLifecycleHooks } from './runtime/dom-bridge'

// CSS Classes system
export * from './css-classes'
// Lazy loading system
export {
  createLazyComponentGroup,
  createVisibilityLazyComponent,
  lazy,
  preloadComponent,
  preloadComponentGroup,
  Suspense,
} from './runtime/lazy-component'
// State management system
export * from './state'

// Debug system
export * from './debug'

// Validation system (Phase 1A - Epic: Greylock)
export {
  ValidationUtils as default,
  ValidationDevTools,
  ValidationSetup,
  CoreComponentValidation,
  ModifierValidation,
  PluginComponentValidation,
  EnhancedValidationUtils,
  ProductionOptimizationUtils,
  ValidationDebugUtils,
  PerformanceOptimizationUtils,
  LifecycleValidationUtils,
} from './validation'

// Version
export const VERSION = '0.1.0'
