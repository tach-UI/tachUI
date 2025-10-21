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

// Modifier system infrastructure (concrete modifiers in @tachui/modifiers)
export * from './modifiers'

// Responsive system moved to @tachui/responsive - import directly from that package

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
  // Plugin error handling moved to @tachui/devtools - import from that package
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

// Essential runtime types - explicitly exported for plugin packages
export type {
  ComponentProps,
  ComponentInstance,
  ComponentChildren,
  DOMNode,
} from './runtime/types'

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
// Debug system moved to @tachui/devtools
// Import from @tachui/devtools instead

// Validation system (Phase 1A - Epic: Greylock)
// Enhanced validation moved to @tachui/devtools - import from that package
export {
  ValidationDevTools,
  ValidationSetup,
  LifecycleValidationUtils,
  getComponentValidator,
  ProductionUtils,
} from './validation'

// Version and Package Information
export { TACHUI_PACKAGE, TACHUI_PACKAGE_VERSION, VERSION } from './version'
