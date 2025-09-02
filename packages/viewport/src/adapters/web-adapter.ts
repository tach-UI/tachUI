/**
 * Web Viewport Adapter
 *
 * Handles viewport management for web browsers using modals, portals, and popup windows.
 * Provides fallback strategies for different browser capabilities.
 */

import { createSignal } from '@tachui/core'
import type { Signal } from '@tachui/core'
import type { ComponentInstance } from '@tachui/core'
import { mountComponentTree } from '@tachui/core'
import {
  detectViewportEnvironment,
  type PlatformDetectionConfig,
} from '../platform-detection'
import {
  ViewportAdapter,
  type ViewportEnvironment,
  type ViewportInstance,
  type ViewportState,
  type ViewportType,
  type WindowConfig,
} from '../types'

/**
 * Web-specific viewport adapter
 */
export class WebViewportAdapter extends ViewportAdapter {
  readonly environment: ViewportEnvironment
  private portals = new Map<string, WebPortalInstance>()
  private modals = new Map<string, WebModalInstance>()
  private popups = new Map<string, WebPopupInstance>()
  private portalContainer: HTMLElement | null = null
  private broadcastChannel: BroadcastChannel | null = null

  constructor(config: PlatformDetectionConfig = {}) {
    super()
    this.environment = detectViewportEnvironment(config)
    this.initializePortalContainer()
  }

  /**
   * Check if we can create a window with given config
   */
  canCreateWindow(config: WindowConfig): boolean {
    // Always can create modals and portals
    if (!config.preferNativeWindow) {
      return true
    }

    // Check if we can create popup windows
    try {
      return this.environment.capabilities.multiWindow
    } catch {
      return false
    }
  }

  /**
   * Create a viewport instance
   */
  createWindow(config: WindowConfig): ViewportInstance {
    const windowType = this.determineWindowType(config)

    switch (windowType) {
      case 'window':
        return this.createPopupWindow(config)

      case 'modal':
        return this.createModal(config)

      case 'portal':
        return this.createPortal(config)

      default:
        return this.createModal(config)
    }
  }

  /**
   * Destroy a window
   */
  async destroyWindow(windowId: string): Promise<void> {
    // Try each type
    const portal = this.portals.get(windowId)
    if (portal) {
      portal.dispose()
      this.portals.delete(windowId)
      return
    }

    const modal = this.modals.get(windowId)
    if (modal) {
      modal.dispose()
      this.modals.delete(windowId)
      return
    }

    const popup = this.popups.get(windowId)
    if (popup) {
      popup.dispose()
      this.popups.delete(windowId)
      return
    }
  }

  /**
   * Set up cross-window communication
   */
  setupCrossWindowCommunication(): void {
    if ('BroadcastChannel' in window) {
      // Use BroadcastChannel for same-origin communication
      this.broadcastChannel = new BroadcastChannel('tachui-viewport')

      this.broadcastChannel.addEventListener(
        'message',
        (event: MessageEvent) => {
          this.handleCrossWindowMessage(event.data)
        }
      )
    } else {
      // Fallback to localStorage events
      const handleStorage = (event: StorageEvent) => {
        if (event.key === 'tachui-viewport-message') {
          try {
            const message = JSON.parse(event.newValue || '{}')
            this.handleCrossWindowMessage(message)
          } catch {
            // Ignore malformed messages
          }
        }
      }
      if (typeof window !== 'undefined') {
        ;(window as any).addEventListener('storage', handleStorage)
      }
    }
  }

  /**
   * Broadcast message to other windows
   */
  broadcastMessage(message: any, _excludeWindow?: string): void {
    const messageData = {
      ...message,
      timestamp: Date.now(),
      source: window.location.href,
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(messageData)
    } else {
      // Fallback to localStorage
      localStorage.setItem(
        'tachui-viewport-message',
        JSON.stringify(messageData)
      )
      // Clear after a moment to avoid storage bloat
      setTimeout(() => {
        localStorage.removeItem('tachui-viewport-message')
      }, 100)
    }
  }

  /**
   * Optimize for web platform
   */
  optimizeForPlatform(): void {
    // Set up CSS custom properties for theming
    document.documentElement.style.setProperty(
      '--tachui-modal-backdrop-blur',
      '8px'
    )
    document.documentElement.style.setProperty(
      '--tachui-modal-animation-duration',
      '200ms'
    )
    document.documentElement.style.setProperty('--tachui-modal-z-index', '1000')

    // Set up global styles for modals if needed
    this.injectGlobalStyles()
  }

  /**
   * Create popup window (native browser window)
   */
  private createPopupWindow(config: WindowConfig): WebPopupInstance {
    const popup = new WebPopupInstance(config)
    this.popups.set(config.id, popup)
    return popup
  }

  /**
   * Create modal overlay
   */
  protected createModal(config: WindowConfig): WebModalInstance {
    const modal = new WebModalInstance(config)
    this.modals.set(config.id, modal)
    return modal
  }

  /**
   * Create portal
   */
  protected createPortal(config: WindowConfig): WebPortalInstance {
    const portal = new WebPortalInstance(config, this.portalContainer!)
    this.portals.set(config.id, portal)
    return portal
  }

  /**
   * Determine optimal window type
   */
  private determineWindowType(config: WindowConfig): ViewportType {
    if (
      config.preferNativeWindow &&
      this.environment.capabilities.multiWindow
    ) {
      return 'window'
    }

    if (config.modal !== false) {
      return 'modal'
    }

    return 'portal'
  }

  /**
   * Initialize portal container
   */
  private initializePortalContainer(): void {
    // For single-page apps, try to use the existing app container first
    let container = document.getElementById('app')

    if (container) {
      this.portalContainer = container
      return
    }

    // Fallback to creating a separate portal container
    container = document.getElementById('tachui-portals')

    if (!container) {
      container = document.createElement('div')
      container.id = 'tachui-portals'
      container.style.position = 'relative'
      container.style.zIndex = '999'
      document.body.appendChild(container)
    }

    this.portalContainer = container
  }

  /**
   * Handle cross-window messages
   */
  private handleCrossWindowMessage(message: any): void {
    // Forward to all viewport instances
    this.portals.forEach(portal => portal.receiveMessage(message))
    this.modals.forEach(modal => modal.receiveMessage(message))
    this.popups.forEach(popup => popup.receiveMessage(message))
  }

  /**
   * Inject global CSS styles
   */
  private injectGlobalStyles(): void {
    const styleId = 'tachui-viewport-styles'

    if (document.getElementById(styleId)) {
      return // Already injected
    }

    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .tachui-modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(var(--tachui-modal-backdrop-blur, 8px));
        z-index: var(--tachui-modal-z-index, 1000);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: tachui-fade-in var(--tachui-modal-animation-duration, 200ms) ease-out;
      }

      .tachui-modal-content {
        background: white;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        max-width: 90vw;
        max-height: 90vh;
        overflow: auto;
        animation: tachui-scale-in var(--tachui-modal-animation-duration, 200ms) ease-out;
      }

      .tachui-portal {
        position: relative;
      }

      @keyframes tachui-fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes tachui-scale-in {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .tachui-modal-backdrop,
        .tachui-modal-content {
          animation: none;
        }
      }
    `

    document.head.appendChild(style)
  }
}

/**
 * Web popup window instance (using window.open)
 */
class WebPopupInstance implements ViewportInstance {
  readonly id: string
  readonly type: ViewportType = 'window'
  readonly config: WindowConfig
  state: Signal<ViewportState>

  private nativeWindow: Window | null = null
  private messageHandlers = new Set<(message: any) => void>()
  private eventHandlers = new Map<string, Set<() => void>>()
  private setState: (
    value: ViewportState | ((prev: ViewportState) => ViewportState)
  ) => ViewportState

  constructor(config: WindowConfig) {
    this.id = config.id
    this.config = config

    const [state, setState] = createSignal<ViewportState>({
      id: config.id,
      title: config.title || config.id,
      isVisible: false,
      isMinimized: false,
      isMaximized: false,
      isFullscreen: false,
      isFocused: false,
      bounds: {
        x: config.x || 100,
        y: config.y || 100,
        width: config.width || 800,
        height: config.height || 600,
      },
      // Phase 2: Enhanced state properties
      isPooled: false,
      lastUsed: Date.now(),
      groupId: undefined,
      tabIndex: undefined,
      parentWindowId: undefined,
    })

    this.state = state as Signal<ViewportState>
    this.setState = setState
  }

  render(_component: ComponentInstance): void {
    // For popup windows, we need to render the component in the popup's document
    if (!this.nativeWindow) return

    // This would need integration with TachUI's rendering system
    // For now, just set basic content
    this.nativeWindow.document.title = this.config.title || this.config.id
  }

  async show(): Promise<void> {
    if (this.nativeWindow && !this.nativeWindow.closed) {
      this.nativeWindow.focus()
      return
    }

    const features = this.buildWindowFeatures()
    this.nativeWindow = window.open('', this.config.id, features)

    if (!this.nativeWindow) {
      throw new Error(
        'Failed to open popup window (likely blocked by popup blocker)'
      )
    }

    this.setupPopupEventHandlers()

    // Update state
    this.setState(prevState => ({
      ...prevState,
      isVisible: true,
      isFocused: true,
    }))
  }

  async hide(): Promise<void> {
    if (this.nativeWindow && !this.nativeWindow.closed) {
      this.nativeWindow.blur()
    }
  }

  async focus(): Promise<void> {
    if (this.nativeWindow && !this.nativeWindow.closed) {
      this.nativeWindow.focus()
    }
  }

  async minimize(): Promise<void> {
    // Not supported in web popups
  }

  async maximize(): Promise<void> {
    // Not supported in web popups
  }

  async restore(): Promise<void> {
    // Not supported in web popups
  }

  async close(): Promise<void> {
    if (this.nativeWindow && !this.nativeWindow.closed) {
      this.nativeWindow.close()
    }
    this.dispose()
  }

  dispose(): void {
    this.messageHandlers.clear()
    this.eventHandlers.clear()
    this.nativeWindow = null
  }

  postMessage(message: any): void {
    if (this.nativeWindow && !this.nativeWindow.closed) {
      this.nativeWindow.postMessage(message, '*')
    }
  }

  onMessage(handler: (message: any) => void): () => void {
    this.messageHandlers.add(handler)
    return () => this.messageHandlers.delete(handler)
  }

  receiveMessage(message: any): void {
    this.messageHandlers.forEach(handler => handler(message))
  }

  onShow(handler: () => void): () => void {
    return this.addEventListener('show', handler)
  }

  onHide(handler: () => void): () => void {
    return this.addEventListener('hide', handler)
  }

  onFocus(handler: () => void): () => void {
    return this.addEventListener('focus', handler)
  }

  onBlur(handler: () => void): () => void {
    return this.addEventListener('blur', handler)
  }

  onResize(_handler: (bounds: ViewportState['bounds']) => void): () => void {
    // Web popups don't provide reliable resize events
    return () => {}
  }

  onClose(handler: () => void): () => void {
    return this.addEventListener('close', handler)
  }

  private addEventListener(event: string, handler: () => void): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }

    this.eventHandlers.get(event)!.add(handler)

    return () => {
      this.eventHandlers.get(event)?.delete(handler)
    }
  }

  private emit(event: string): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => handler())
    }
  }

  private buildWindowFeatures(): string {
    const features = []

    if (this.config.width) features.push(`width=${this.config.width}`)
    if (this.config.height) features.push(`height=${this.config.height}`)
    if (this.config.x) features.push(`left=${this.config.x}`)
    if (this.config.y) features.push(`top=${this.config.y}`)

    features.push(`resizable=${this.config.resizable !== false ? 'yes' : 'no'}`)
    features.push('scrollbars=yes')
    features.push('status=no')
    features.push('toolbar=no')
    features.push('menubar=no')
    features.push('location=no')

    return features.join(',')
  }

  private setupPopupEventHandlers(): void {
    if (!this.nativeWindow) return

    // Check if window is closed
    const checkClosed = () => {
      if (this.nativeWindow?.closed) {
        this.emit('close')
        return
      }
      setTimeout(checkClosed, 1000)
    }
    checkClosed()

    // Listen for messages
    window.addEventListener('message', event => {
      if (event.source === this.nativeWindow) {
        this.messageHandlers.forEach(handler => handler(event.data))
      }
    })
  }

  // ==================== Phase 2: Enhanced Methods ====================

  /**
   * Window pooling and reuse
   */
  async prepareForReuse(): Promise<void> {
    // Clear current content and reset state for reuse
    if (this.nativeWindow && !this.nativeWindow.closed) {
      this.nativeWindow.document.body.innerHTML = ''
      this.nativeWindow.document.title = ''
    }
    this.messageHandlers.clear()
  }

  isReusable(): boolean {
    return this.nativeWindow != null && !this.nativeWindow.closed
  }

  markAsUsed(): void {
    this.setState(prev => ({
      ...prev,
      lastUsed: Date.now(),
    }))
  }

  async returnToPool(): Promise<void> {
    await this.hide()
    this.setState(prev => ({
      ...prev,
      isPooled: true,
      lastUsed: Date.now(),
    }))
  }

  /**
   * State synchronization (limited in popup windows due to cross-origin restrictions)
   */
  syncState<T>(_key: string, _value: T): void {
    // Store locally for this window
    if (!this.nativeWindow || this.nativeWindow.closed) return

    try {
      // Try to sync via postMessage (may fail due to CORS)
      this.nativeWindow.postMessage(
        { type: 'sync_state', key: _key, value: _value },
        '*'
      )
    } catch (error) {
      console.warn('Failed to sync state to popup window:', error)
    }
  }

  getSharedState<T>(_key: string): T | undefined {
    // Cannot access shared state from popup due to security restrictions
    return undefined
  }

  onSharedStateChange<T>(
    _key: string,
    _callback: (value: T) => void
  ): () => void {
    // Limited implementation due to popup security restrictions
    return () => {} // No-op unsubscribe
  }

  /**
   * Tab grouping (not supported for popup windows)
   */
  async attachToTab(_tabContainer: ViewportInstance): Promise<void> {
    throw new Error('Tab grouping not supported for popup windows')
  }

  async detachFromTab(): Promise<ViewportInstance> {
    return this // Already detached
  }

  getTabContainer(): ViewportInstance | null {
    return null
  }

  getTabIndex(): number {
    return this.state().tabIndex || 0
  }

  setTabIndex(index: number): void {
    this.setState(prev => ({
      ...prev,
      tabIndex: index,
    }))
  }

  /**
   * Parent-child relationships (limited for popup windows)
   */
  setParentWindow(parent: ViewportInstance): void {
    this.setState(prev => ({
      ...prev,
      parentWindowId: parent.id,
    }))
  }

  getParentWindow(): ViewportInstance | null {
    // Cannot access parent window reference due to security
    return null
  }

  getChildWindows(): ViewportInstance[] {
    // Cannot track child windows from popup
    return []
  }

  addChildWindow(_child: ViewportInstance): void {
    // Not supported for popup windows
  }

  removeChildWindow(_childId: string): void {
    // Not supported for popup windows
  }
}

/**
 * Web modal instance (overlay on current page)
 */
class WebModalInstance implements ViewportInstance {
  readonly id: string
  readonly type: ViewportType = 'modal'
  readonly config: WindowConfig
  state: Signal<ViewportState>

  private backdropElement: HTMLElement | null = null
  private contentElement: HTMLElement | null = null
  private messageHandlers = new Set<(message: any) => void>()
  private eventHandlers = new Map<string, Set<() => void>>()
  private setState: (
    value: ViewportState | ((prev: ViewportState) => ViewportState)
  ) => ViewportState

  constructor(config: WindowConfig) {
    this.id = config.id
    this.config = config

    const [state, setState] = createSignal<ViewportState>({
      id: config.id,
      title: config.title || config.id,
      isVisible: false,
      isMinimized: false,
      isMaximized: false,
      isFullscreen: false,
      isFocused: false,
      bounds: {
        x: 0,
        y: 0,
        width: config.width || 600,
        height: config.height || 400,
      },
      zIndex: 1000,
      // Phase 2: Enhanced state properties
      isPooled: false,
      lastUsed: Date.now(),
      groupId: undefined,
      tabIndex: undefined,
      parentWindowId: undefined,
    })

    this.state = state as Signal<ViewportState>
    this.setState = setState
    this.createElement()
  }

  render(_component: ComponentInstance): void {
    if (!this.contentElement) return

    // This would integrate with TachUI's renderer
    // For now, just set basic content
    this.contentElement.innerHTML = `<div>Modal: ${this.config.title}</div>`
  }

  async show(): Promise<void> {
    if (!this.backdropElement) return

    document.body.appendChild(this.backdropElement)

    // Update state
    this.setState(prevState => ({
      ...prevState,
      isVisible: true,
      isFocused: true,
    }))

    this.emit('show')
  }

  async hide(): Promise<void> {
    if (this.backdropElement?.parentNode) {
      this.backdropElement.parentNode.removeChild(this.backdropElement)
    }

    // Update state
    this.setState(prevState => ({
      ...prevState,
      isVisible: false,
      isFocused: false,
    }))

    this.emit('hide')
  }

  async focus(): Promise<void> {
    if (this.contentElement) {
      this.contentElement.focus()
    }
    this.emit('focus')
  }

  async minimize(): Promise<void> {
    await this.hide()
  }

  async maximize(): Promise<void> {
    // Could implement fullscreen modal
  }

  async restore(): Promise<void> {
    await this.show()
  }

  async close(): Promise<void> {
    await this.hide()
    this.emit('close')
    this.dispose()
  }

  dispose(): void {
    if (this.backdropElement?.parentNode) {
      this.backdropElement.parentNode.removeChild(this.backdropElement)
    }
    this.messageHandlers.clear()
    this.eventHandlers.clear()
  }

  postMessage(_message: any): void {
    // Broadcast to other modals/windows
  }

  onMessage(handler: (message: any) => void): () => void {
    this.messageHandlers.add(handler)
    return () => this.messageHandlers.delete(handler)
  }

  receiveMessage(message: any): void {
    this.messageHandlers.forEach(handler => handler(message))
  }

  onShow(handler: () => void): () => void {
    return this.addEventListener('show', handler)
  }
  onHide(handler: () => void): () => void {
    return this.addEventListener('hide', handler)
  }
  onFocus(handler: () => void): () => void {
    return this.addEventListener('focus', handler)
  }
  onBlur(handler: () => void): () => void {
    return this.addEventListener('blur', handler)
  }
  onResize(_handler: (bounds: ViewportState['bounds']) => void): () => void {
    return () => {}
  }
  onClose(handler: () => void): () => void {
    return this.addEventListener('close', handler)
  }

  private addEventListener(event: string, handler: () => void): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }

    this.eventHandlers.get(event)!.add(handler)

    return () => {
      this.eventHandlers.get(event)?.delete(handler)
    }
  }

  private emit(event: string): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => handler())
    }
  }

  private createElement(): void {
    // Create backdrop
    this.backdropElement = document.createElement('div')
    this.backdropElement.className = 'tachui-modal-backdrop'

    // Create content container
    this.contentElement = document.createElement('div')
    this.contentElement.className = 'tachui-modal-content'
    this.contentElement.style.width = `${this.config.width || 600}px`
    this.contentElement.style.height = `${this.config.height || 400}px`

    this.backdropElement.appendChild(this.contentElement)

    // Handle backdrop clicks
    this.backdropElement.addEventListener('click', e => {
      if (
        e.target === this.backdropElement &&
        this.config.backdropDismiss !== false
      ) {
        this.close()
      }
    })

    // Handle escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.config.escapeKeyDismiss !== false) {
        this.close()
      }
    })
  }

  // ==================== Phase 2: Enhanced Methods ====================

  private sharedState = new Map<string, any>()
  private stateChangeCallbacks = new Map<string, Set<(value: any) => void>>()
  private childWindows = new Map<string, ViewportInstance>()
  private parentWindow: ViewportInstance | null = null
  private tabContainer: ViewportInstance | null = null

  /**
   * Window pooling and reuse
   */
  async prepareForReuse(): Promise<void> {
    // Clear current content and reset for reuse
    if (this.contentElement) {
      this.contentElement.innerHTML = ''
    }
    this.messageHandlers.clear()
    this.sharedState.clear()
    this.stateChangeCallbacks.clear()
  }

  isReusable(): boolean {
    return this.backdropElement != null && this.contentElement != null
  }

  markAsUsed(): void {
    this.setState(prev => ({
      ...prev,
      lastUsed: Date.now(),
    }))
  }

  async returnToPool(): Promise<void> {
    await this.hide()
    this.setState(prev => ({
      ...prev,
      isPooled: true,
      lastUsed: Date.now(),
    }))
  }

  /**
   * State synchronization (full support for modals)
   */
  syncState<T>(key: string, value: T): void {
    this.sharedState.set(key, value)

    // Notify local callbacks
    const callbacks = this.stateChangeCallbacks.get(key)
    if (callbacks) {
      callbacks.forEach(callback => callback(value))
    }

    // Sync to child windows
    this.childWindows.forEach(child => {
      child.syncState(key, value)
    })
  }

  getSharedState<T>(key: string): T | undefined {
    return this.sharedState.get(key)
  }

  onSharedStateChange<T>(
    key: string,
    callback: (value: T) => void
  ): () => void {
    if (!this.stateChangeCallbacks.has(key)) {
      this.stateChangeCallbacks.set(key, new Set())
    }

    this.stateChangeCallbacks.get(key)!.add(callback)

    return () => {
      this.stateChangeCallbacks.get(key)?.delete(callback)
    }
  }

  /**
   * Tab grouping (web modal tab simulation)
   */
  async attachToTab(tabContainer: ViewportInstance): Promise<void> {
    this.tabContainer = tabContainer
    // For web modals, we can simulate tabs by adding tab headers
    this.createTabInterface()
  }

  async detachFromTab(): Promise<ViewportInstance> {
    this.tabContainer = null
    this.removeTabInterface()
    return this
  }

  getTabContainer(): ViewportInstance | null {
    return this.tabContainer
  }

  getTabIndex(): number {
    return this.state().tabIndex || 0
  }

  setTabIndex(index: number): void {
    this.setState(prev => ({
      ...prev,
      tabIndex: index,
    }))
  }

  /**
   * Parent-child relationships (full support for modals)
   */
  setParentWindow(parent: ViewportInstance): void {
    this.parentWindow = parent
    this.setState(prev => ({
      ...prev,
      parentWindowId: parent.id,
    }))
  }

  getParentWindow(): ViewportInstance | null {
    return this.parentWindow
  }

  getChildWindows(): ViewportInstance[] {
    return Array.from(this.childWindows.values())
  }

  addChildWindow(child: ViewportInstance): void {
    this.childWindows.set(child.id, child)
    child.setParentWindow(this)
  }

  removeChildWindow(childId: string): void {
    this.childWindows.delete(childId)
  }

  /**
   * Tab interface helpers
   */
  private createTabInterface(): void {
    if (!this.contentElement || !this.tabContainer) return

    // Create tab header
    const tabHeader = document.createElement('div')
    tabHeader.className = 'tachui-modal-tab-header'
    tabHeader.style.cssText = `
      display: flex;
      border-bottom: 1px solid #e0e0e0;
      background: #f5f5f5;
      min-height: 40px;
    `

    // Insert tab header
    this.contentElement.insertBefore(tabHeader, this.contentElement.firstChild)
  }

  private removeTabInterface(): void {
    if (!this.contentElement) return

    const tabHeader = this.contentElement.querySelector(
      '.tachui-modal-tab-header'
    )
    if (tabHeader) {
      tabHeader.remove()
    }
  }
}

/**
 * Web portal instance (renders in portal container)
 */
class WebPortalInstance implements ViewportInstance {
  readonly id: string
  readonly type: ViewportType = 'portal'
  readonly config: WindowConfig
  state: Signal<ViewportState>

  private portalElement: HTMLElement | null = null
  private messageHandlers = new Set<(message: any) => void>()
  private eventHandlers = new Map<string, Set<() => void>>()
  private cleanupFunction: (() => void) | null = null
  private setState: (
    value: ViewportState | ((prev: ViewportState) => ViewportState)
  ) => ViewportState

  constructor(
    config: WindowConfig,
    private container: HTMLElement
  ) {
    this.id = config.id
    this.config = config

    const [state, setState] = createSignal<ViewportState>({
      id: config.id,
      title: config.title || config.id,
      isVisible: false,
      isMinimized: false,
      isMaximized: false,
      isFullscreen: false,
      isFocused: false,
      bounds: {
        x: config.x || 0,
        y: config.y || 0,
        width: config.width || 400,
        height: config.height || 300,
      },
      // Phase 2: Enhanced state properties
      isPooled: false,
      lastUsed: Date.now(),
      groupId: undefined,
      tabIndex: undefined,
      parentWindowId: undefined,
    })

    this.state = state as Signal<ViewportState>
    this.setState = setState
    this.createElement()
  }

  render(component: ComponentInstance): void {
    if (!this.portalElement) {
      return
    }

    // Clear existing content
    this.portalElement.innerHTML = ''

    try {
      // Use enhanced DOM bridge mounting to ensure lifecycle hooks are called
      const cleanup = mountComponentTree(component, this.portalElement)

      // Store cleanup function for later disposal
      this.cleanupFunction = cleanup
    } catch (error) {
      console.error('Error during mountComponentTree:', error)
    }
  }

  async show(): Promise<void> {
    if (!this.portalElement) {
      return
    }

    // For single-page apps, replace the loading content instead of appending
    if (this.container.id === 'app') {
      this.container.innerHTML = ''
    }

    this.container.appendChild(this.portalElement)
    this.portalElement.style.display = 'block'

    this.setState(prevState => ({
      ...prevState,
      isVisible: true,
    }))

    this.emit('show')
  }

  async hide(): Promise<void> {
    if (this.portalElement) {
      this.portalElement.style.display = 'none'
    }

    this.setState(prevState => ({
      ...prevState,
      isVisible: false,
    }))

    this.emit('hide')
  }

  async focus(): Promise<void> {
    this.emit('focus')
  }
  async minimize(): Promise<void> {
    await this.hide()
  }
  async maximize(): Promise<void> {}
  async restore(): Promise<void> {
    await this.show()
  }

  async close(): Promise<void> {
    if (this.portalElement?.parentNode) {
      this.portalElement.parentNode.removeChild(this.portalElement)
    }
    this.emit('close')
    this.dispose()
  }

  dispose(): void {
    // Call component cleanup function first
    if (this.cleanupFunction) {
      this.cleanupFunction()
      this.cleanupFunction = null
    }

    if (this.portalElement?.parentNode) {
      this.portalElement.parentNode.removeChild(this.portalElement)
    }
    this.messageHandlers.clear()
    this.eventHandlers.clear()
  }

  postMessage(_message: any): void {}
  onMessage(handler: (message: any) => void): () => void {
    this.messageHandlers.add(handler)
    return () => this.messageHandlers.delete(handler)
  }

  receiveMessage(message: any): void {
    this.messageHandlers.forEach(handler => handler(message))
  }

  onShow(handler: () => void): () => void {
    return this.addEventListener('show', handler)
  }
  onHide(handler: () => void): () => void {
    return this.addEventListener('hide', handler)
  }
  onFocus(handler: () => void): () => void {
    return this.addEventListener('focus', handler)
  }
  onBlur(handler: () => void): () => void {
    return this.addEventListener('blur', handler)
  }
  onResize(_handler: (bounds: ViewportState['bounds']) => void): () => void {
    return () => {}
  }
  onClose(handler: () => void): () => void {
    return this.addEventListener('close', handler)
  }

  private addEventListener(event: string, handler: () => void): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }

    this.eventHandlers.get(event)!.add(handler)

    return () => {
      this.eventHandlers.get(event)?.delete(handler)
    }
  }

  private emit(event: string): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => handler())
    }
  }

  private createElement(): void {
    this.portalElement = document.createElement('div')
    this.portalElement.className = 'tachui-portal'

    // For single-page apps using the #app container, render transparently
    if (this.container && this.container.id === 'app') {
      // No positioning, background, or borders - just a transparent container
      this.portalElement.style.position = 'static'
      this.portalElement.style.width = '100%'
      this.portalElement.style.height = 'auto'
      this.portalElement.style.background = 'transparent'
      this.portalElement.style.border = 'none'
      this.portalElement.style.display = 'block'
    } else {
      // Traditional portal with positioning and styling
      this.portalElement.style.position = 'absolute'
      this.portalElement.style.left = `${this.config.x || 0}px`
      this.portalElement.style.top = `${this.config.y || 0}px`
      this.portalElement.style.width = `${this.config.width || 400}px`
      this.portalElement.style.height = `${this.config.height || 300}px`
      this.portalElement.style.background = 'white'
      this.portalElement.style.border = '1px solid #ccc'
      this.portalElement.style.borderRadius = '8px'
      this.portalElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
      this.portalElement.style.display = 'none'
    }
  }

  // ==================== Phase 2: Enhanced Methods ====================

  private sharedState = new Map<string, any>()
  private stateChangeCallbacks = new Map<string, Set<(value: any) => void>>()
  private childWindows = new Map<string, ViewportInstance>()
  private parentWindow: ViewportInstance | null = null
  private tabContainer: ViewportInstance | null = null

  /**
   * Window pooling and reuse (excellent for portals)
   */
  async prepareForReuse(): Promise<void> {
    // Clear current content and reset for reuse
    if (this.portalElement) {
      this.portalElement.innerHTML = ''
    }
    this.messageHandlers.clear()
    this.sharedState.clear()
    this.stateChangeCallbacks.clear()
  }

  isReusable(): boolean {
    return this.portalElement != null
  }

  markAsUsed(): void {
    this.setState(prev => ({
      ...prev,
      lastUsed: Date.now(),
    }))
  }

  async returnToPool(): Promise<void> {
    await this.hide()
    this.setState(prev => ({
      ...prev,
      isPooled: true,
      lastUsed: Date.now(),
    }))
  }

  /**
   * State synchronization (full support for portals)
   */
  syncState<T>(key: string, value: T): void {
    this.sharedState.set(key, value)

    // Notify local callbacks
    const callbacks = this.stateChangeCallbacks.get(key)
    if (callbacks) {
      callbacks.forEach(callback => callback(value))
    }

    // Sync to child windows
    this.childWindows.forEach(child => {
      child.syncState(key, value)
    })
  }

  getSharedState<T>(key: string): T | undefined {
    return this.sharedState.get(key)
  }

  onSharedStateChange<T>(
    key: string,
    callback: (value: T) => void
  ): () => void {
    if (!this.stateChangeCallbacks.has(key)) {
      this.stateChangeCallbacks.set(key, new Set())
    }

    this.stateChangeCallbacks.get(key)!.add(callback)

    return () => {
      this.stateChangeCallbacks.get(key)?.delete(callback)
    }
  }

  /**
   * Tab grouping (portal-based tab simulation)
   */
  async attachToTab(tabContainer: ViewportInstance): Promise<void> {
    this.tabContainer = tabContainer
    // Create visual tab interface for portals
    this.createPortalTabInterface()
  }

  async detachFromTab(): Promise<ViewportInstance> {
    this.tabContainer = null
    this.removePortalTabInterface()
    return this
  }

  getTabContainer(): ViewportInstance | null {
    return this.tabContainer
  }

  getTabIndex(): number {
    return this.state().tabIndex || 0
  }

  setTabIndex(index: number): void {
    this.setState(prev => ({
      ...prev,
      tabIndex: index,
    }))
  }

  /**
   * Parent-child relationships (full support for portals)
   */
  setParentWindow(parent: ViewportInstance): void {
    this.parentWindow = parent
    this.setState(prev => ({
      ...prev,
      parentWindowId: parent.id,
    }))
  }

  getParentWindow(): ViewportInstance | null {
    return this.parentWindow
  }

  getChildWindows(): ViewportInstance[] {
    return Array.from(this.childWindows.values())
  }

  addChildWindow(child: ViewportInstance): void {
    this.childWindows.set(child.id, child)
    child.setParentWindow(this)
  }

  removeChildWindow(childId: string): void {
    this.childWindows.delete(childId)
  }

  /**
   * Portal tab interface helpers
   */
  private createPortalTabInterface(): void {
    if (!this.portalElement || !this.tabContainer) return

    // Create tab header for portals
    const tabHeader = document.createElement('div')
    tabHeader.className = 'tachui-portal-tab-header'
    tabHeader.style.cssText = `
      display: flex;
      background: #f8f9fa;
      border-bottom: 1px solid #dee2e6;
      min-height: 36px;
      padding: 0 8px;
      align-items: center;
    `

    // Insert tab header
    this.portalElement.insertBefore(tabHeader, this.portalElement.firstChild)
  }

  private removePortalTabInterface(): void {
    if (!this.portalElement) return

    const tabHeader = this.portalElement.querySelector(
      '.tachui-portal-tab-header'
    )
    if (tabHeader) {
      tabHeader.remove()
    }
  }
}
