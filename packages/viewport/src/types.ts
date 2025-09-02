/**
 * Core types for TachUI Viewport Management System
 *
 * Defines the fundamental interfaces and types for window/viewport management
 * across web, desktop, and mobile platforms.
 */

import type { Signal } from '@tachui/core'
import type { ComponentInstance } from '@tachui/core'

/**
 * Platform detection and capabilities
 */
export interface ViewportEnvironment {
  platform: 'web' | 'electron' | 'mobile' | 'embedded'
  capabilities: ViewportCapabilities
  userAgent: string
  screenSize: { width: number; height: number }
  isTouch: boolean
}

export interface ViewportCapabilities {
  multiWindow: boolean
  nativeWindows: boolean
  modalOverlays: boolean
  crossWindowCommunication: boolean
  windowResizing: boolean
  windowMinimizing: boolean
  fullscreenSupport: boolean
  menuBarSupport: boolean
}

/**
 * Window/Viewport configuration
 */
export interface WindowConfig {
  id: string
  title?: string
  width?: number
  height?: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  x?: number
  y?: number
  resizable?: boolean
  minimizable?: boolean
  maximizable?: boolean
  closable?: boolean
  alwaysOnTop?: boolean
  modal?: boolean
  parent?: string // Parent window ID
  preferNativeWindow?: boolean
  backdropDismiss?: boolean
  escapeKeyDismiss?: boolean
  webPreferences?: {
    nodeIntegration?: boolean
    contextIsolation?: boolean
    webSecurity?: boolean
  }
}

/**
 * Viewport instance state
 */
export interface ViewportState {
  id: string
  title: string
  isVisible: boolean
  isMinimized: boolean
  isMaximized: boolean
  isFullscreen: boolean
  isFocused: boolean
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
  zIndex?: number

  // Phase 2: Enhanced state management
  isPooled: boolean // Whether window is in the pool
  lastUsed: number // Timestamp of last interaction
  groupId?: string // Window group this belongs to
  tabIndex?: number // Tab index within group
  parentWindowId?: string // Parent window for modal/child windows
}

/**
 * Viewport instance interface
 */
export interface ViewportInstance {
  readonly id: string
  readonly type: ViewportType
  readonly config: WindowConfig
  state: Signal<ViewportState>

  // Lifecycle methods
  render(component: ComponentInstance): void
  show(): Promise<void>
  hide(): Promise<void>
  focus(): Promise<void>
  minimize(): Promise<void>
  maximize(): Promise<void>
  restore(): Promise<void>
  close(): Promise<void>
  dispose(): void

  // Communication
  postMessage(message: any): void
  onMessage(handler: (message: any) => void): () => void // Returns unsubscribe function

  // Events
  onShow(handler: () => void): () => void
  onHide(handler: () => void): () => void
  onFocus(handler: () => void): () => void
  onBlur(handler: () => void): () => void
  onResize(handler: (bounds: ViewportState['bounds']) => void): () => void
  onClose(handler: () => void): () => void

  // Phase 2: Enhanced capabilities

  // Window pooling and reuse
  prepareForReuse(): Promise<void> // Clean up for reuse
  isReusable(): boolean // Check if window can be reused
  markAsUsed(): void // Update last used timestamp
  returnToPool(): Promise<void> // Return to window pool

  // State synchronization
  syncState<T>(key: string, value: T): void // Sync state within group
  getSharedState<T>(key: string): T | undefined // Get shared state
  onSharedStateChange<T>(key: string, callback: (value: T) => void): () => void

  // Tab grouping (desktop platforms)
  attachToTab(tabContainer: ViewportInstance): Promise<void>
  detachFromTab(): Promise<ViewportInstance> // Returns new standalone window
  getTabContainer(): ViewportInstance | null
  getTabIndex(): number
  setTabIndex(index: number): void

  // Parent-child relationships
  setParentWindow(parent: ViewportInstance): void
  getParentWindow(): ViewportInstance | null
  getChildWindows(): ViewportInstance[]
  addChildWindow(child: ViewportInstance): void
  removeChildWindow(childId: string): void
}

/**
 * Viewport types
 */
export type ViewportType =
  | 'window'
  | 'modal'
  | 'portal'
  | 'route'
  | 'sheet'
  | 'popover'

/**
 * Window options for opening new viewports
 */
export interface WindowOptions extends Partial<WindowConfig> {
  preferNativeWindow?: boolean
  fallbackToModal?: boolean
  animation?: 'none' | 'fade' | 'slide' | 'scale'
  backdropDismiss?: boolean
  escapeKeyDismiss?: boolean
}

/**
 * Viewport manager interface
 */
export interface ViewportManager {
  readonly environment: ViewportEnvironment

  // Window management
  openWindow(
    id: string,
    component: ComponentInstance,
    options?: WindowOptions
  ): Promise<ViewportInstance>
  dismissWindow(id: string): Promise<void>
  getWindow(id: string): ViewportInstance | null
  getAllWindows(): ViewportInstance[]

  // Window groups
  createWindowGroup(groupId: string): WindowGroup
  getWindowGroup(groupId: string): WindowGroup | null

  // Utilities
  canOpenWindow(options?: WindowOptions): boolean
  getOptimalWindowType(options?: WindowOptions): ViewportType

  // Events
  onWindowOpened(handler: (window: ViewportInstance) => void): () => void
  onWindowClosed(handler: (windowId: string) => void): () => void
}

/**
 * Window group for data-driven window management
 */
/**
 * Window grouping strategy
 */
export type WindowGroupingStrategy =
  | 'tabs' // Group windows as tabs (desktop)
  | 'stack' // Stack windows (mobile/web)
  | 'cascade' // Cascade windows (desktop)
  | 'tile' // Tile windows (desktop)

/**
 * Window state synchronization scope
 */
export type StateSyncScope =
  | 'none' // No synchronization
  | 'group' // Sync within window group
  | 'global' // Sync across all windows

/**
 * Window tab grouping configuration
 */
export interface WindowTabConfig {
  enabled: boolean
  maxTabs?: number
  tabPosition: 'top' | 'bottom' | 'left' | 'right'
  allowDetach: boolean
  allowReorder: boolean
}

/**
 * Window pool configuration
 */
export interface WindowPoolConfig {
  enabled: boolean
  maxPoolSize: number
  reuseThreshold: number // Reuse windows if idle for X milliseconds
  keepAliveTime: number // Keep pooled windows alive for X milliseconds
}

/**
 * Enhanced window group interface with Phase 2 features
 */
export interface WindowGroup {
  readonly id: string
  readonly dataType: string // For type safety with data-driven windows

  // Window management
  openWindow<T>(
    data: T,
    component: (data: T) => ComponentInstance
  ): Promise<ViewportInstance>
  getWindowForData<T>(data: T): ViewportInstance | null
  getAllWindows(): ViewportInstance[]
  closeAllWindows(): Promise<void>

  // Configuration
  setDefaultOptions(options: WindowOptions): void
  setMaxInstances(max: number): void

  // Phase 2: Enhanced features

  // Window grouping and tabbing
  setGroupingStrategy(strategy: WindowGroupingStrategy): void
  getGroupingStrategy(): WindowGroupingStrategy
  configureTabbing(config: WindowTabConfig): void
  getTabConfig(): WindowTabConfig

  // Window pooling and reuse
  configurePool(config: WindowPoolConfig): void
  getPoolConfig(): WindowPoolConfig
  getPooledWindows(): ViewportInstance[]
  returnToPool(window: ViewportInstance): void

  // State synchronization
  enableStateSync(scope: StateSyncScope): void
  syncState<T>(key: string, value: T): void
  getSharedState<T>(key: string): T | undefined
  onStateChange<T>(key: string, callback: (value: T) => void): () => void

  // Window lifecycle events
  onWindowCreated(callback: (window: ViewportInstance) => void): () => void
  onWindowDestroyed(callback: (windowId: string) => void): () => void
  onWindowReused(
    callback: (window: ViewportInstance, previousData: any) => void
  ): () => void

  // Group-level events
  onGroupEmpty(callback: () => void): () => void
  onGroupFull(callback: () => void): () => void
}

/**
 * Environment values for viewport operations (SwiftUI-style)
 */
export interface ViewportEnvironmentValues {
  openWindow: (
    id: string,
    component: ComponentInstance,
    options?: WindowOptions
  ) => Promise<ViewportInstance>
  dismissWindow: (id: string) => Promise<void>
  viewportEnvironment: ViewportEnvironment
  currentWindow: ViewportInstance | null
}

/**
 * Viewport adapter for platform-specific implementations
 */
export abstract class ViewportAdapter {
  abstract readonly environment: ViewportEnvironment

  // Core viewport operations
  abstract canCreateWindow(config: WindowConfig): boolean
  abstract createWindow(config: WindowConfig): ViewportInstance
  abstract destroyWindow(windowId: string): Promise<void>

  // Communication
  abstract setupCrossWindowCommunication(): void
  abstract broadcastMessage(message: any, excludeWindow?: string): void

  // Platform-specific optimizations
  abstract optimizeForPlatform(): void

  // Fallback strategies
  protected createModal(_config: WindowConfig): ViewportInstance {
    throw new Error('Modal fallback not implemented')
  }

  protected createPortal(_config: WindowConfig): ViewportInstance {
    throw new Error('Portal fallback not implemented')
  }
}

/**
 * Cross-window communication message types
 */
export interface WindowMessage {
  type: string
  payload: any
  source: string
  target?: string
  timestamp: number
}

/**
 * Viewport events
 */
export interface ViewportEvents {
  'window:opened': { window: ViewportInstance }
  'window:closed': { windowId: string }
  'window:focused': { windowId: string }
  'window:minimized': { windowId: string }
  'window:maximized': { windowId: string }
  'window:resized': { windowId: string; bounds: ViewportState['bounds'] }
  message: { message: WindowMessage }
}

/**
 * Viewport configuration for different platforms
 */
export interface ViewportPlatformConfig {
  web: {
    modalBackdropBlur: boolean
    portalContainerId: string
    animationDuration: number
    zIndexBase: number
  }
  electron: {
    enableNodeIntegration: boolean
    contextIsolation: boolean
    webSecurity: boolean
    preloadScript?: string
  }
  mobile: {
    swipeGestures: boolean
    statusBarHandling: 'auto' | 'hide' | 'overlay'
    orientationLock?: 'portrait' | 'landscape' | 'auto'
  }
}
