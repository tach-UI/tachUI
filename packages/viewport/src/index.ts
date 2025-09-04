/**
 * TachUI Viewport Management System
 *
 * SwiftUI-inspired window and viewport management for web, desktop, and mobile platforms.
 * Provides consistent APIs across different runtime environments.
 */

import {
  App,
  ExampleScenes,
  Window,
  WindowGroup,
  WindowUtils,
} from './components'
import { useDismissWindow, useOpenWindow, useViewportInfo } from './environment'
// Import everything we need for re-export
import {
  disposeViewportManager,
  getViewportManager,
  setViewportManager,
  TachUIViewportManager,
} from './viewport-manager'

// Platform detection utilities
export {
  checkFeatureSupport,
  createCapabilityChecker,
  detectViewportEnvironment,
  getBrowserInfo,
  getOSInfo,
} from './platform-detection'
// Core types and interfaces
export type {
  ViewportAdapter,
  ViewportCapabilities,
  ViewportEnvironment,
  ViewportEnvironmentValues,
  ViewportEvents,
  ViewportInstance,
  ViewportManager,
  ViewportPlatformConfig,
  ViewportState,
  ViewportType,
  WindowConfig,
  WindowMessage,
  WindowOptions,
} from './types'

// Core viewport manager
export {
  TachUIViewportManager,
  getViewportManager,
  setViewportManager,
  disposeViewportManager,
}

// Platform adapters
export { WebViewportAdapter } from './adapters/web-adapter'
export type {
  AppComponent,
  AppSceneProps,
  WindowGroupComponent,
  WindowGroupProps,
  WindowProps,
  WindowScene,
  WindowSceneComponent,
} from './components'

// SwiftUI-style components
export {
  App,
  ExampleScenes,
  Window,
  WindowGroup,
  WindowUtils,
} from './components'
// Environment context system
export {
  createWindowAwareComponent,
  EnvironmentKeys,
  getEnvironmentValue,
  useCurrentWindow,
  useDismissWindow,
  useOpenWindow,
  useViewportEnvironment,
  useViewportInfo,
  useViewportManager,
  ViewportEnvironmentProvider,
  withViewportEnvironment,
} from './environment'

// Viewport modifiers
export * from './modifiers'

/**
 * Convenience re-exports for common usage patterns
 */

// Environment hooks (SwiftUI-style)
export {
  useDismissWindow as useEnvironmentDismissWindow,
  useOpenWindow as useEnvironmentOpenWindow,
} from './environment'

/**
 * Default exports for common scenarios
 */
export const Viewport = {
  // Manager
  getManager: getViewportManager,

  // Environment
  useOpenWindow,
  useDismissWindow,
  useViewportInfo,

  // Components
  Window,
  WindowGroup,
  App,

  // Utilities
  Utils: WindowUtils,
  Examples: ExampleScenes,
}

/**
 * Initialize TachUI Viewport System
 *
 * Call this once during app initialization to set up the viewport management system.
 */
export function initializeViewportSystem(options?: {
  customAdapter?: import('./types').ViewportAdapter
  platformConfig?: Partial<import('./types').ViewportPlatformConfig>
}): TachUIViewportManager {
  const manager = new TachUIViewportManager(options?.customAdapter)
  setViewportManager(manager)
  return manager
}

/**
 * Type guards for viewport instances
 */
export const ViewportTypeGuards = {
  isWindow: (
    viewport: import('./types').ViewportInstance
  ): viewport is import('./types').ViewportInstance & { type: 'window' } =>
    viewport.type === 'window',

  isModal: (
    viewport: import('./types').ViewportInstance
  ): viewport is import('./types').ViewportInstance & { type: 'modal' } =>
    viewport.type === 'modal',

  isPortal: (
    viewport: import('./types').ViewportInstance
  ): viewport is import('./types').ViewportInstance & { type: 'portal' } =>
    viewport.type === 'portal',

  isSheet: (
    viewport: import('./types').ViewportInstance
  ): viewport is import('./types').ViewportInstance & { type: 'sheet' } =>
    viewport.type === 'sheet',

  isPopover: (
    viewport: import('./types').ViewportInstance
  ): viewport is import('./types').ViewportInstance & { type: 'popover' } =>
    viewport.type === 'popover',
}

/**
 * Platform-specific utilities
 */
export const PlatformUtils = {
  /**
   * Check if running in Electron
   */
  isElectron: () => {
    const manager = getViewportManager()
    return manager.environment.platform === 'electron'
  },

  /**
   * Check if on mobile
   */
  isMobile: () => {
    const manager = getViewportManager()
    return manager.environment.platform === 'mobile'
  },

  /**
   * Check if multi-window is supported
   */
  supportsMultiWindow: () => {
    const manager = getViewportManager()
    return manager.environment.capabilities.multiWindow
  },

  /**
   * Check if native windows are supported
   */
  supportsNativeWindows: () => {
    const manager = getViewportManager()
    return manager.environment.capabilities.nativeWindows
  },

  /**
   * Get optimal window type for current platform
   */
  getOptimalWindowType: (
    preferNative = false
  ): import('./types').ViewportType => {
    const manager = getViewportManager()
    return manager.getOptimalWindowType({ preferNativeWindow: preferNative })
  },
}

/**
 * Common window configurations
 */
export const WindowConfigs = {
  /**
   * Standard document window
   */
  document: (title?: string): import('./types').WindowOptions => ({
    title: title || 'Document',
    width: 800,
    height: 600,
    resizable: true,
    minimizable: true,
    maximizable: true,
  }),

  /**
   * Settings/preferences window
   */
  settings: (title?: string): import('./types').WindowOptions => ({
    title: title || 'Settings',
    width: 600,
    height: 400,
    resizable: false,
    minimizable: false,
    maximizable: false,
    modal: true,
  }),

  /**
   * Inspector/sidebar window
   */
  inspector: (title?: string): import('./types').WindowOptions => ({
    title: title || 'Inspector',
    width: 300,
    height: 500,
    resizable: true,
    alwaysOnTop: true,
  }),

  /**
   * Palette/tool window
   */
  palette: (title?: string): import('./types').WindowOptions => ({
    title: title || 'Palette',
    width: 250,
    height: 400,
    resizable: false,
    alwaysOnTop: true,
  }),

  /**
   * Dialog/alert window
   */
  dialog: (title?: string): import('./types').WindowOptions => ({
    title: title || 'Dialog',
    width: 400,
    height: 200,
    resizable: false,
    modal: true,
    minimizable: false,
    maximizable: false,
  }),

  /**
   * Fullscreen window
   */
  fullscreen: (title?: string): import('./types').WindowOptions => ({
    title: title || 'Fullscreen',
    width: (typeof window !== 'undefined' && window.screen?.width) || 1920,
    height: (typeof window !== 'undefined' && window.screen?.height) || 1080,
    resizable: false,
    minimizable: false,
    maximizable: false,
  }),
}

/**
 * Viewport management constants
 */
export const ViewportConstants = {
  DEFAULT_WINDOW_WIDTH: 800,
  DEFAULT_WINDOW_HEIGHT: 600,
  MIN_WINDOW_WIDTH: 300,
  MIN_WINDOW_HEIGHT: 200,
  MODAL_Z_INDEX: 1000,
  PORTAL_Z_INDEX: 999,
  ANIMATION_DURATION: 200,
}
