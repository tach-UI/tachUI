/**
 * @fileoverview TachUI Minimal Bundle (~60KB)
 *
 * Optimized for calculator-style apps and landing pages.
 * Only includes essential components and modifiers.
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

// Responsive system (needed for landing pages)
export {
  initializeResponsiveSystem,
  configureBreakpoints,
} from '../modifiers/responsive'

// State management
export { State, isState, unwrapValue } from '../state/state'
export { createBinding, isBinding } from '../state/binding'

// Assets system
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
} from '../assets'

// Essential utilities
export { infinity, Layout, isInfinity } from '../constants'

// Basic gradients (needed for landing pages)
export { LinearGradient } from '../gradients'

// Debug system
export {
  enableDebug,
  disableDebug,
  debugManager,
  isDebugEnabled,
} from '../debug'

/**
 * Minimal Bundle Metadata
 */
export const BUNDLE_INFO = {
  name: '@tachui/core/minimal',
  version: '0.1.0',
  description:
    'Minimal TachUI bundle for calculator-style apps and landing pages',
  targetSize: '~60KB',
  recommendedComponents: [
    'Text',
    'Button',
    'Image',
    'HStack',
    'VStack',
    'Spacer',
    // Basic components moved to @tachui/primitives
    // 'Show', // moved to @tachui/flow-control
  ],
  useCase: 'Calculator-style apps, landing pages, simple UIs',
  treeShakingHints: {
    include: ['reactive', 'runtime', 'components/basic', 'modifiers/basic'],
    exclude: [
      'components/advanced',
      'modifiers/advanced',
      'gradients',
      'animations',
    ],
  },
} as const
