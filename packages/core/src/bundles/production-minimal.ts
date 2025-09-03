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

// Components: @tachui/primitives (Text, Button, Image, etc.)
// Flow control: @tachui/flow-control (Show, When, Unless)

// Essential modifiers
export * from '../modifiers/core'

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
// ScrollView moved to @tachui/mobile package

// Constants (for dimensions)
export {
  infinity,
  Layout,
  isInfinity,
  type Dimension,
  type InfinityValue,
} from '../constants'

// No validation imports - completely excluded from production
