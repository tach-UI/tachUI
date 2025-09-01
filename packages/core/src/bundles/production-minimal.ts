/**
 * @fileoverview TachUI Production Minimal Bundle (~45KB)
 *
 * Validation-free minimal bundle optimized for production.
 * No development tools or TypeScript dependencies.
 */

// Core reactive system
export * from '../reactive/signal'
export * from '../reactive/computed'
export * from '../reactive/effect'
export { onCleanup, dispose, createCleanupGroup } from '../reactive/cleanup'
export * from '../reactive/context'

// Essential runtime
export * from '../runtime/dom-bridge'
export * from '../runtime/component'
export * from '../runtime/props'

// Basic components moved to @tachui/primitives
// Import Text, Button, Image, BasicInput, Spacer, HStack, VStack, ZStack from @tachui/primitives
// Show moved to @tachui/flow-control

// Essential modifiers
export * from '../modifiers/core'
export * from '../modifiers/padding'
export * from '../modifiers/margin'
export * from '../modifiers/size'
export * from '../modifiers/typography'
export * from '../modifiers/background'

// State management
export { State, isState, unwrapValue } from '../state/state'
export { createBinding, isBinding } from '../state/binding'

// Assets system (essential for apps)
export {
  Assets,
  Asset,
  ColorAsset,
  ImageAsset,
  FontAsset,
  registerAsset,
  createColorAsset,
  createImageAsset,
  createFontAsset,
  type AssetsInterface,
} from '../assets'

// Gradients (needed by intro app)
export { LinearGradient } from '../gradients'

// Additional components needed by intro
// Divider moved to @tachui/primitives
export { ScrollView } from '../components/ScrollView'

// Constants (for dimensions)
export {
  infinity,
  Layout,
  isInfinity,
  type Dimension,
  type InfinityValue,
} from '../constants'

// No validation imports - completely excluded from production
