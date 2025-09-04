/**
 * TachUI Framework
 *
 * A SwiftUI-inspired web framework with SolidJS-style reactivity,
 * compile-time optimization, and TypeScript-first design.
 */
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
export * from './compiler'
export * from './components'
export * from './modifiers'
export * from './gradients'
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
} from './plugins'
export type {
  TachUIPlugin,
  TachUIInstance,
  ComponentRegistrationOptions,
  ServiceRegistration,
  ComponentRegistration,
} from './plugins'
export * from './reactive'
export * from './runtime'
export { registerComponentWithLifecycleHooks } from './runtime/dom-bridge'
export type {
  ComponentProps,
  ComponentInstance,
  ComponentChildren,
  DOMNode,
} from './runtime/types'
export * from './css-classes'
export {
  createLazyComponentGroup,
  createVisibilityLazyComponent,
  lazy,
  preloadComponent,
  preloadComponentGroup,
  Suspense,
} from './runtime/lazy-component'
export * from './state'
export {
  ValidationDevTools,
  ValidationSetup,
  LifecycleValidationUtils,
  getComponentValidator,
  ProductionUtils,
} from './validation'
export declare const VERSION = '0.1.0'
//# sourceMappingURL=index.d.ts.map
