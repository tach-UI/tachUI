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

// Theme system (commonly needed)
export { setTheme, detectSystemTheme, getCurrentTheme } from '../reactive/theme'

// Essential runtime
export * from '../runtime/dom-bridge'
export * from '../runtime/component'
export * from '../runtime/props'
export type { ComponentInstance } from '../runtime/types'

// Context system (commonly needed for apps)
export {
  EnvironmentObject,
  createEnvironmentKey,
  provideEnvironmentObject,
} from '../state/environment'

export {
  withComponentContext,
  getCurrentComponentContext,
  createComponentContext,
  setCurrentComponentContext,
} from '../runtime/component-context'

// Components are in separate packages:
// @tachui/primitives - Text, Button, Image, BasicInput, Spacer, HStack, VStack, ZStack
// @tachui/flow-control - Show, When, Unless

// Essential modifiers infrastructure only
export * from '../modifiers/core'

// Concrete modifiers are available in @tachui/modifiers:
// import { padding, margin, size, typography } from '@tachui/modifiers'

// Responsive system: @tachui/responsive

// State management
export { State, isState, unwrapValue } from '../state/state'
export { createBinding, isBinding } from '../state/binding'
export { ObservableObjectBase } from '../state/observed-object'

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
  // Add commonly needed font functions
  createGoogleFont,
} from '../assets'

// Essential utilities
export { infinity, Layout, isInfinity } from '../constants'

// Basic gradients (needed for landing pages)
export { LinearGradient, StateGradient } from '../gradients'

// Debug system: @tachui/devtools

// Package Information - consistent across all TachUI packages
export { TACHUI_PACKAGE, TACHUI_PACKAGE_VERSION, VERSION } from '../version'

/**
 * Minimal Bundle Metadata
 */
export const BUNDLE_INFO = {
  name: '@tachui/core/minimal',
  version: '0.1.0',
  description:
    'Minimal TachUI bundle for calculator-style apps and landing pages',
  targetSize: '~60KB',
  recommendedComponents: ['Text', 'Button', 'HStack', 'VStack'],
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
