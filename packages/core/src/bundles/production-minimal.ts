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

// Basic components only
export * from '../components/Text'
export * from '../components/Button' 
export * from '../components/Image'
export * from '../components/BasicInput'
export * from '../components/Spacer'
export * from '../components/Show'

// Layout containers (from wrapper)
export { HStack, VStack, ZStack } from '../components/wrapper'

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
  type AssetsInterface
} from '../assets'

// Gradients (needed by intro app)
export { LinearGradient } from '../gradients'

// Additional components needed by intro
export { Divider } from '../components/Divider'
export { ScrollView } from '../components/ScrollView'

// Constants (for dimensions)
export { infinity, SUI, isInfinity, type Dimension, type InfinityValue } from '../constants'

// No validation imports - completely excluded from production