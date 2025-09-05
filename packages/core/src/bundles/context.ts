/**
 * @fileoverview TachUI Context Bundle
 *
 * Dedicated entry point for context and component lifecycle functions.
 * Enables tree-shaking for applications that need context/environment management.
 */

// Environment system
export {
  EnvironmentObject,
  createEnvironmentKey,
  provideEnvironmentObject,
} from '../state/environment'

// Component context system
export {
  withComponentContext,
  getCurrentComponentContext,
  createComponentContext,
  setCurrentComponentContext,
} from '../runtime/component-context'

// Reactive context system
export {
  batch,
  createRoot,
  getOwner,
  getReactiveContext,
  runWithOwner,
  untrack,
} from '../reactive/context'

// Ownership utilities
export {
  createDetachedRoot,
  getOwnerChain,
  getRootOwner,
  isReactiveContext,
  runOutsideReactiveContext,
} from '../reactive/ownership'

// Mounting and app lifecycle
export { mountRoot } from '../runtime/dom-bridge'

/**
 * Context Bundle Metadata
 */
export const BUNDLE_INFO = {
  name: '@tachui/core/context',
  version: '0.1.0',
  description:
    'Dedicated context bundle for environment and component lifecycle management',
  targetSize: '~10KB',
  useCase:
    'Applications with complex state management and component hierarchies',
} as const
