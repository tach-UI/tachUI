/**
 * TachUI Viewport Manager
 *
 * Core viewport management system that coordinates window/modal/portal creation
 * across different platforms with SwiftUI-style APIs.
 */

import type { ComponentInstance } from '../runtime/types'
import { WebViewportAdapter } from './adapters/web-adapter'
import { createCapabilityChecker, detectViewportEnvironment, type PlatformDetectionConfig } from './platform-detection'
import type {
  StateSyncScope,
  ViewportAdapter,
  ViewportEnvironment,
  ViewportInstance,
  ViewportManager,
  ViewportType,
  WindowConfig,
  WindowGroup,
  WindowGroupingStrategy,
  WindowOptions,
  WindowPoolConfig,
  WindowTabConfig,
} from './types'

/**
 * Main viewport manager implementation
 */
export class TachUIViewportManager implements ViewportManager {
  private adapter: ViewportAdapter
  private windows = new Map<string, ViewportInstance>()
  private windowGroups = new Map<string, WindowGroup>()
  private eventHandlers = new Map<string, Set<(...args: any[]) => void>>()

  // Phase 2: Global state management
  private globalState = new Map<string, any>()
  private globalStateCallbacks = new Map<string, Set<(value: any) => void>>()

  readonly environment: ViewportEnvironment
  private platformConfig: PlatformDetectionConfig

  constructor(adapter?: ViewportAdapter, config: PlatformDetectionConfig = {}) {
    this.platformConfig = config
    this.environment = detectViewportEnvironment(config)

    if (adapter) {
      this.adapter = adapter
    } else {
      // Auto-select adapter based on platform
      this.adapter = this.createDefaultAdapter()
    }

    this.adapter.setupCrossWindowCommunication()
    this.adapter.optimizeForPlatform()
  }

  /**
   * Open a new window/viewport
   */
  async openWindow(
    id: string,
    component: ComponentInstance,
    options: WindowOptions = {}
  ): Promise<ViewportInstance> {
    // Check if window already exists
    const existingWindow = this.windows.get(id)
    if (existingWindow) {
      await existingWindow.show()
      await existingWindow.focus()
      return existingWindow
    }

    // Create window configuration
    const config: WindowConfig = {
      id,
      title: options.title || id,
      width: options.width || 800,
      height: options.height || 600,
      ...options,
    }

    // Determine optimal viewport type
    this.getOptimalWindowType(options)

    // Create the viewport instance
    const window = this.adapter.createWindow(config)

    // Store the window
    this.windows.set(id, window)

    // Render the component
    window.render(component)

    // Set up window event handlers
    this.setupWindowEventHandlers(window)

    // Show the window
    await window.show()

    // Emit window opened event
    this.emit('window:opened', { window })

    return window
  }

  /**
   * Dismiss/close a window
   */
  async dismissWindow(id: string): Promise<void> {
    const window = this.windows.get(id)
    if (!window) {
      throw new Error(`Window with id '${id}' not found`)
    }

    // Close the window
    await window.close()

    // Remove from our tracking
    this.windows.delete(id)

    // Emit window closed event
    this.emit('window:closed', { windowId: id })
  }

  /**
   * Get a specific window
   */
  getWindow(id: string): ViewportInstance | null {
    return this.windows.get(id) || null
  }

  /**
   * Get all open windows
   */
  getAllWindows(): ViewportInstance[] {
    return Array.from(this.windows.values())
  }

  /**
   * Create a window group for data-driven window management
   */
  createWindowGroup(groupId: string): WindowGroup {
    if (this.windowGroups.has(groupId)) {
      return this.windowGroups.get(groupId)!
    }

    const group = new TachUIWindowGroup(groupId, this)
    this.windowGroups.set(groupId, group)
    return group
  }

  /**
   * Check if we can open a window with given options
   */
  canOpenWindow(options: WindowOptions = {}): boolean {
    const checker = createCapabilityChecker(this.environment)
    return checker.canOpenWindow(options.preferNativeWindow)
  }

  /**
   * Get optimal window type for given options
   */
  getOptimalWindowType(options: WindowOptions = {}): ViewportType {
    const checker = createCapabilityChecker(this.environment)

    if (options.preferNativeWindow && this.environment.capabilities.nativeWindows) {
      return 'window'
    }

    if (options.modal !== false && this.environment.capabilities.modalOverlays) {
      return 'modal'
    }

    return checker.getOptimalViewportType(options.preferNativeWindow)
  }

  /**
   * Event handling
   */
  onWindowOpened(handler: (window: ViewportInstance) => void): () => void {
    return this.on('window:opened', ({ window }) => handler(window))
  }

  onWindowClosed(handler: (windowId: string) => void): () => void {
    return this.on('window:closed', ({ windowId }) => handler(windowId))
  }

  /**
   * Generic event subscription
   */
  private on(event: string, handler: (...args: any[]) => void): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }

    this.eventHandlers.get(event)!.add(handler)

    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(event)?.delete(handler)
    }
  }

  /**
   * Emit an event to all handlers
   */
  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach((handler) => handler(data))
    }
  }

  /**
   * Set up event handlers for a window
   */
  private setupWindowEventHandlers(window: ViewportInstance): void {
    // Window focus events
    window.onFocus(() => {
      this.emit('window:focused', { windowId: window.id })
    })

    // Window resize events
    window.onResize((bounds) => {
      this.emit('window:resized', { windowId: window.id, bounds })
    })

    // Window close events
    window.onClose(() => {
      this.windows.delete(window.id)
      this.emit('window:closed', { windowId: window.id })
    })
  }

  /**
   * Create default adapter based on platform
   */
  private createDefaultAdapter(): ViewportAdapter {
    switch (this.environment.platform) {
      case 'electron':
        // TODO: Import ElectronViewportAdapter when implemented
        return new WebViewportAdapter(this.platformConfig)
      default:
        return new WebViewportAdapter(this.platformConfig)
    }
  }

  // ==================== Phase 2: Global State Management ====================

  /**
   * Synchronize state globally across all windows
   */
  syncGlobalState<T>(key: string, value: T, originGroupId?: string): void {
    this.globalState.set(key, value)

    // Notify global callbacks
    const callbacks = this.globalStateCallbacks.get(key)
    if (callbacks) {
      callbacks.forEach((callback) => callback(value))
    }

    // Propagate to all windows
    this.windows.forEach((window) => {
      window.syncState(key, value)
    })

    // Propagate to all window groups (except the origin to prevent recursion)
    this.windowGroups.forEach((group, groupId) => {
      if (groupId !== originGroupId) {
        // Use internal sync method to prevent recursion
        ;(group as any).syncStateInternal(key, value)
      }
    })
  }

  /**
   * Get global shared state
   */
  getGlobalState<T>(key: string): T | undefined {
    return this.globalState.get(key)
  }

  /**
   * Listen for global state changes
   */
  onGlobalStateChange<T>(key: string, callback: (value: T) => void): () => void {
    if (!this.globalStateCallbacks.has(key)) {
      this.globalStateCallbacks.set(key, new Set())
    }

    this.globalStateCallbacks.get(key)!.add(callback)

    return () => {
      this.globalStateCallbacks.get(key)?.delete(callback)
    }
  }

  /**
   * Get window group by ID
   */
  getWindowGroup(groupId: string): WindowGroup | null {
    return this.windowGroups.get(groupId) || null
  }

  /**
   * Get all window groups
   */
  getAllWindowGroups(): WindowGroup[] {
    return Array.from(this.windowGroups.values())
  }

  /**
   * Window group management utilities
   */
  configureWindowGroupDefaults(
    groupId: string,
    options: {
      groupingStrategy?: WindowGroupingStrategy
      tabConfig?: WindowTabConfig
      poolConfig?: WindowPoolConfig
      stateSyncScope?: StateSyncScope
    }
  ): void {
    const group = this.windowGroups.get(groupId)
    if (!group) return

    if (options.groupingStrategy) {
      group.setGroupingStrategy(options.groupingStrategy)
    }
    if (options.tabConfig) {
      group.configureTabbing(options.tabConfig)
    }
    if (options.poolConfig) {
      group.configurePool(options.poolConfig)
    }
    if (options.stateSyncScope) {
      group.enableStateSync(options.stateSyncScope)
    }
  }

  /**
   * Cleanup all resources
   */
  dispose(): void {
    // Clean up global state
    this.globalState.clear()
    this.globalStateCallbacks.clear()

    // Close all windows
    const windowPromises = Array.from(this.windows.values()).map(
      (window) => window.close().catch(() => {}) // Ignore errors during cleanup
    )

    Promise.all(windowPromises).finally(() => {
      this.windows.clear()
      this.windowGroups.clear()
      this.eventHandlers.clear()
    })
  }
}

/**
 * Window group implementation for data-driven window management
 */
class TachUIWindowGroup implements WindowGroup {
  private windows = new Map<string, ViewportInstance>()
  private defaultOptions: WindowOptions = {}
  private maxInstances = Infinity

  // Phase 2: Enhanced features
  private groupingStrategy: WindowGroupingStrategy = 'stack'
  private tabConfig: WindowTabConfig = {
    enabled: false,
    tabPosition: 'top',
    allowDetach: true,
    allowReorder: true,
  }
  private poolConfig: WindowPoolConfig = {
    enabled: false,
    maxPoolSize: 5,
    reuseThreshold: 30000, // 30 seconds
    keepAliveTime: 300000, // 5 minutes
  }
  private stateSyncScope: StateSyncScope = 'none'
  private sharedState = new Map<string, any>()
  private stateCallbacks = new Map<string, Set<(value: any) => void>>()
  private windowPool = new Map<string, ViewportInstance>()
  private eventCallbacks = new Map<string, Set<(...args: any[]) => void>>()
  private windowMetadata = new Map<string, any>()

  constructor(
    readonly id: string,
    private manager: TachUIViewportManager,
    readonly dataType: string = 'any'
  ) {
    // Start pool cleanup timer if pooling is enabled
    this.startPoolCleanup()
  }

  /**
   * Open a window for specific data (Enhanced with pooling and reuse)
   */
  async openWindow<T>(
    data: T,
    component: (data: T) => ComponentInstance
  ): Promise<ViewportInstance> {
    // Create unique ID for this data
    const dataKey = this.createDataKey(data)
    const windowId = `${this.id}:${dataKey}`

    // Check if window already exists for this data
    const existingWindow = this.windows.get(dataKey)
    if (existingWindow) {
      await existingWindow.show()
      await existingWindow.focus()
      existingWindow.markAsUsed()
      return existingWindow
    }

    // Try to get a pooled window for reuse
    let window = await this.getPooledWindow()

    if (window) {
      // Reuse pooled window
      const componentInstance = component(data)
      window.render(componentInstance)

      // Update window metadata
      this.setWindowGroupMetadata(window, {
        id: windowId,
        groupId: this.id,
        isPooled: false,
        lastUsed: Date.now(),
      })

      await window.show()
      await window.focus()

      // Track the window
      this.windows.set(dataKey, window)

      // Emit reuse event
      this.emitEvent('window:reused', window, data)

      return window
    }

    // Check max instances limit
    if (this.windows.size >= this.maxInstances) {
      // Return oldest window to pool instead of closing
      const oldestWindow = this.windows.values().next().value
      if (oldestWindow) {
        if (this.poolConfig.enabled) {
          await this.returnToPool(oldestWindow)
        } else {
          await oldestWindow.close()
        }
      }
    }

    // Create new window
    const componentInstance = component(data)
    window = await this.manager.openWindow(windowId, componentInstance, this.defaultOptions)

    // Set up window state for group management - need to access setState from window
    // Note: This is a limitation of the current architecture - signals don't expose setters
    // For now, we'll track group metadata separately
    this.setWindowGroupMetadata(window, {
      groupId: this.id,
      isPooled: false,
      lastUsed: Date.now(),
      tabIndex: this.tabConfig.enabled ? this.windows.size : undefined,
    })

    // Track the window
    this.windows.set(dataKey, window)

    // Handle window closure
    window.onClose(() => {
      if (this.poolConfig.enabled && window.isReusable()) {
        this.returnToPool(window)
      } else {
        this.windows.delete(dataKey)
        this.emitEvent('window:destroyed', window.id)

        // Check if group is now empty
        if (this.windows.size === 0) {
          this.emitEvent('group:empty')
        }
      }
    })

    // Apply grouping strategy if needed
    if (this.groupingStrategy !== 'stack') {
      this.applyGroupingStrategy()
    }

    // Emit creation event
    this.emitEvent('window:created', window)

    // Check if group is now full
    if (this.windows.size >= this.maxInstances) {
      this.emitEvent('group:full')
    }

    return window
  }

  /**
   * Get window for specific data
   */
  getWindowForData<T>(data: T): ViewportInstance | null {
    const dataKey = this.createDataKey(data)
    return this.windows.get(dataKey) || null
  }

  /**
   * Get all windows in this group
   */
  getAllWindows(): ViewportInstance[] {
    return Array.from(this.windows.values())
  }

  /**
   * Close all windows in this group
   */
  async closeAllWindows(): Promise<void> {
    const closePromises = Array.from(this.windows.values()).map(
      (window) => window.close().catch(() => {}) // Ignore errors
    )

    await Promise.all(closePromises)
    this.windows.clear()
  }

  /**
   * Set default options for windows in this group
   */
  setDefaultOptions(options: WindowOptions): void {
    this.defaultOptions = { ...options }
  }

  /**
   * Set maximum number of instances
   */
  setMaxInstances(max: number): void {
    this.maxInstances = Math.max(1, max)
  }

  // ==================== Phase 2: Enhanced Features ====================

  /**
   * Window grouping and tabbing
   */
  setGroupingStrategy(strategy: WindowGroupingStrategy): void {
    this.groupingStrategy = strategy
    this.applyGroupingStrategy()
  }

  getGroupingStrategy(): WindowGroupingStrategy {
    return this.groupingStrategy
  }

  configureTabbing(config: WindowTabConfig): void {
    this.tabConfig = { ...config }
    if (config.enabled && this.manager.environment.platform === 'electron') {
      this.enableTabGrouping()
    }
  }

  getTabConfig(): WindowTabConfig {
    return { ...this.tabConfig }
  }

  /**
   * Window pooling and reuse
   */
  configurePool(config: WindowPoolConfig): void {
    this.poolConfig = { ...config }
    if (config.enabled) {
      this.startPoolCleanup()
    }
  }

  getPoolConfig(): WindowPoolConfig {
    return { ...this.poolConfig }
  }

  getPooledWindows(): ViewportInstance[] {
    return Array.from(this.windowPool.values())
  }

  async returnToPool(window: ViewportInstance): Promise<void> {
    if (!this.poolConfig.enabled) {
      await window.close()
      return
    }

    // Prepare window for reuse
    await window.prepareForReuse()
    await window.hide()

    // Update window metadata
    this.setWindowGroupMetadata(window, {
      isPooled: true,
      lastUsed: Date.now(),
    })

    // Add to pool
    this.windowPool.set(window.id, window)
    this.windows.delete(this.getDataKeyForWindow(window))

    // Emit event
    this.emitEvent('window:pooled', window)
  }

  /**
   * State synchronization
   */
  enableStateSync(scope: StateSyncScope): void {
    this.stateSyncScope = scope
  }

  syncState<T>(key: string, value: T): void {
    this.syncStateInternal(key, value)

    // Sync to other windows based on scope
    if (this.stateSyncScope === 'group') {
      this.syncStateToGroupWindows(key, value)
    } else if (this.stateSyncScope === 'global') {
      this.manager.syncGlobalState(key, value, this.id)
    }
  }

  /**
   * Internal state sync without propagation (prevents recursion)
   */
  private syncStateInternal<T>(key: string, value: T): void {
    this.sharedState.set(key, value)

    // Notify callbacks
    const callbacks = this.stateCallbacks.get(key)
    if (callbacks) {
      callbacks.forEach((callback) => callback(value))
    }
  }

  getSharedState<T>(key: string): T | undefined {
    return this.sharedState.get(key)
  }

  onStateChange<T>(key: string, callback: (value: T) => void): () => void {
    if (!this.stateCallbacks.has(key)) {
      this.stateCallbacks.set(key, new Set())
    }

    this.stateCallbacks.get(key)!.add(callback)

    // Return unsubscribe function
    return () => {
      this.stateCallbacks.get(key)?.delete(callback)
    }
  }

  /**
   * Window lifecycle events
   */
  onWindowCreated(callback: (window: ViewportInstance) => void): () => void {
    return this.addEventCallback('window:created', callback)
  }

  onWindowDestroyed(callback: (windowId: string) => void): () => void {
    return this.addEventCallback('window:destroyed', callback)
  }

  onWindowReused(callback: (window: ViewportInstance, previousData: any) => void): () => void {
    return this.addEventCallback('window:reused', callback)
  }

  /**
   * Group-level events
   */
  onGroupEmpty(callback: () => void): () => void {
    return this.addEventCallback('group:empty', callback)
  }

  onGroupFull(callback: () => void): () => void {
    return this.addEventCallback('group:full', callback)
  }

  // ==================== Private Implementation ====================

  /**
   * Apply grouping strategy to existing windows
   */
  private applyGroupingStrategy(): void {
    const windows = this.getAllWindows()

    switch (this.groupingStrategy) {
      case 'tabs':
        this.arrangeWindowsAsTabs(windows)
        break
      case 'cascade':
        this.arrangeWindowsAsCascade(windows)
        break
      case 'tile':
        this.arrangeWindowsAsTiles(windows)
        break
      default:
        this.arrangeWindowsAsStack(windows)
        break
    }
  }

  /**
   * Enable tab grouping for windows
   */
  private enableTabGrouping(): void {
    if (!this.tabConfig.enabled || this.manager.environment.platform !== 'electron') {
      return
    }

    // Implementation depends on Electron BrowserView API
    // This would create a tabbed interface for windows in the group
  }

  /**
   * Start pool cleanup timer
   */
  private startPoolCleanup(): void {
    if (!this.poolConfig.enabled) return

    setInterval(() => {
      this.cleanupPool()
    }, 60000) // Check every minute
  }

  /**
   * Clean up expired pooled windows
   */
  private cleanupPool(): void {
    const now = Date.now()
    const toRemove: string[] = []

    this.windowPool.forEach((window, id) => {
      const metadata = this.getWindowGroupMetadata(window)
      if (now - (metadata.lastUsed || 0) > this.poolConfig.keepAliveTime) {
        toRemove.push(id)
      }
    })

    toRemove.forEach(async (id) => {
      const window = this.windowPool.get(id)
      if (window) {
        await window.dispose()
        this.windowPool.delete(id)
      }
    })
  }

  /**
   * Try to get a pooled window for reuse
   */
  private async getPooledWindow(): Promise<ViewportInstance | null> {
    if (!this.poolConfig.enabled || this.windowPool.size === 0) {
      return null
    }

    // Find the most recently used pooled window
    let bestWindow: ViewportInstance | null = null
    let bestScore = 0

    this.windowPool.forEach((window) => {
      const metadata = this.getWindowGroupMetadata(window)
      const age = Date.now() - (metadata.lastUsed || 0)
      if (age < this.poolConfig.reuseThreshold) {
        const score = this.poolConfig.reuseThreshold - age
        if (score > bestScore) {
          bestWindow = window
          bestScore = score
        }
      }
    })

    if (bestWindow) {
      this.windowPool.delete((bestWindow as ViewportInstance).id)
      // Reset pooled metadata
      this.setWindowGroupMetadata(bestWindow as ViewportInstance, {
        isPooled: false,
        lastUsed: Date.now(),
      })
    }

    return bestWindow
  }

  /**
   * Sync state to all windows in group (with recursion prevention)
   */
  private syncStateToGroupWindows<T>(key: string, value: T): void {
    // Prevent infinite recursion by only calling syncState on window's local storage
    this.windows.forEach((window) => {
      // Only sync to window's local state, not trigger further group syncs
      const windowState = this.getWindowGroupMetadata(window)
      this.setWindowGroupMetadata(window, {
        ...windowState,
        [`shared:${key}`]: value,
      })
    })
  }

  /**
   * Get data key for a window instance
   */
  private getDataKeyForWindow(window: ViewportInstance): string {
    // Find the data key that maps to this window
    for (const [dataKey, win] of this.windows.entries()) {
      if (win.id === window.id) {
        return dataKey
      }
    }
    return ''
  }

  /**
   * Window arrangement strategies
   */
  private arrangeWindowsAsTabs(windows: ViewportInstance[]): void {
    // Tab arrangement logic - platform specific
    if (this.manager.environment.platform === 'electron') {
      // Use Electron BrowserView for true tabs
      // Implementation would depend on Electron main process
    } else {
      // Fallback to modal tabs for web
      this.arrangeWindowsAsModalTabs(windows)
    }
  }

  private arrangeWindowsAsCascade(windows: ViewportInstance[]): void {
    windows.forEach((window, index) => {
      const offset = index * 30
      // For now, just track the intended position in metadata
      // Actual positioning would need window-specific setState access
      this.setWindowGroupMetadata(window, {
        cascadeOffset: offset,
        arrangementStyle: 'cascade',
      })
    })
  }

  private arrangeWindowsAsTiles(windows: ViewportInstance[]): void {
    const screenWidth = typeof window !== 'undefined' ? window.screen.width : 1920
    const screenHeight = typeof window !== 'undefined' ? window.screen.height : 1080

    const cols = Math.ceil(Math.sqrt(windows.length))
    const rows = Math.ceil(windows.length / cols)
    const windowWidth = screenWidth / cols
    const windowHeight = screenHeight / rows

    windows.forEach((win, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)

      // Track tile positioning in metadata
      this.setWindowGroupMetadata(win, {
        tilePosition: {
          col,
          row,
          x: col * windowWidth,
          y: row * windowHeight,
          width: windowWidth,
          height: windowHeight,
        },
        arrangementStyle: 'tile',
      })
    })
  }

  private arrangeWindowsAsStack(_windows: ViewportInstance[]): void {
    // Default behavior - no special arrangement
    // Windows use their natural positioning
  }

  private arrangeWindowsAsModalTabs(_windows: ViewportInstance[]): void {
    // Web fallback for tab grouping using modal overlays
    // Create a tab container modal that hosts the windows
  }

  /**
   * Window metadata management (workaround for signal setter access)
   */
  private setWindowGroupMetadata(window: ViewportInstance, metadata: any): void {
    this.windowMetadata.set(window.id, {
      ...this.windowMetadata.get(window.id),
      ...metadata,
    })
  }

  private getWindowGroupMetadata(window: ViewportInstance): any {
    return this.windowMetadata.get(window.id) || {}
  }

  /**
   * Event management helpers
   */
  private addEventCallback(event: string, callback: (...args: any[]) => void): () => void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, new Set())
    }

    this.eventCallbacks.get(event)!.add(callback)

    return () => {
      this.eventCallbacks.get(event)?.delete(callback)
    }
  }

  private emitEvent(event: string, ...args: any[]): void {
    const callbacks = this.eventCallbacks.get(event)
    if (callbacks) {
      callbacks.forEach((callback) => callback(...args))
    }
  }

  /**
   * Create a unique key for data
   */
  private createDataKey<T>(data: T): string {
    if (data === null || data === undefined) {
      return 'null'
    }

    if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
      return String(data)
    }

    if (typeof data === 'object' && 'id' in data) {
      return String((data as any).id)
    }

    // Fallback to JSON serialization (not ideal for complex objects)
    try {
      return JSON.stringify(data)
    } catch {
      return String(data)
    }
  }
}

/**
 * Global viewport manager instance
 */
let globalViewportManager: TachUIViewportManager | null = null

/**
 * Get or create the global viewport manager
 */
export function getViewportManager(config: PlatformDetectionConfig = {}): TachUIViewportManager {
  if (!globalViewportManager) {
    globalViewportManager = new TachUIViewportManager(undefined, config)
  }
  return globalViewportManager
}

/**
 * Set a custom viewport manager
 */
export function setViewportManager(manager: TachUIViewportManager): void {
  globalViewportManager?.dispose()
  globalViewportManager = manager
}

/**
 * Dispose the global viewport manager
 */
export function disposeViewportManager(): void {
  globalViewportManager?.dispose()
  globalViewportManager = null
}
