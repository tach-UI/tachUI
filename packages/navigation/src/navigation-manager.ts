/**
 * Navigation Manager Implementation
 *
 * Central management system for navigation routers, coordinators, and global
 * navigation state. Provides debugging utilities and event management.
 */

import { buildURL, parseURL } from './navigation-router'
// Navigation manager implementation
import type {
  DeepLinkConfig,
  NavigationManager as INavigationManager,
  NavigationCoordinator,
  NavigationEvent,
  NavigationEventListener,
  NavigationRouter,
  URLComponents,
} from './types'

/**
 * Internal navigation coordinator implementation
 */
class NavigationCoordinatorImpl implements NavigationCoordinator {
  private _routes = new Map<string, DeepLinkConfig>()

  constructor(public readonly id: string) {}

  get routes(): Map<string, DeepLinkConfig> {
    return new Map(this._routes)
  }

  registerRoute(path: string, config: DeepLinkConfig): void {
    this._routes.set(path, config)

    // Emit event
    NavigationManagerImpl.getInstance().emitEvent('didNavigate', {
      coordinatorId: this.id,
      path,
      config,
    })
  }

  unregisterRoute(path: string): void {
    const removed = this._routes.delete(path)

    if (removed) {
      // Emit event
      NavigationManagerImpl.getInstance().emitEvent('didPop', {
        coordinatorId: this.id,
        path,
      })
    }
  }

  handleURL(url: string): boolean {
    const urlComponents = parseURL(url)
    const path = urlComponents.path

    // Try exact match first
    const exactMatch = this._routes.get(path)
    if (exactMatch) {
      this.navigateToRoute(exactMatch, urlComponents)
      return true
    }

    // Try pattern matching
    for (const [pattern, config] of this._routes) {
      if (this.matchesPattern(path, pattern)) {
        this.navigateToRoute(config, urlComponents)
        return true
      }
    }

    // Emit route not found event
    NavigationManagerImpl.getInstance().emitEvent('routeNotFound', {
      coordinatorId: this.id,
      url,
      path,
    })

    return false
  }

  buildURL(path: string, params: Record<string, string> = {}): string {
    // Replace parameters in path
    let finalPath = path
    for (const [key, value] of Object.entries(params)) {
      finalPath = finalPath.replace(`:${key}`, encodeURIComponent(value))
    }

    return buildURL({ path: finalPath, query: {} })
  }

  /**
   * Navigate to a specific route configuration
   */
  private navigateToRoute(config: DeepLinkConfig, urlComponents: URLComponents): void {
    // This would integrate with the actual navigation system
    // For now, just emit an event
    NavigationManagerImpl.getInstance().emitEvent('willNavigate', {
      coordinatorId: this.id,
      config,
      urlComponents,
    })

    // Actual navigation would happen here based on the config
    console.log('Navigating to route:', config.pathPattern, urlComponents)

    NavigationManagerImpl.getInstance().emitEvent('didNavigate', {
      coordinatorId: this.id,
      config,
      urlComponents,
    })
  }

  /**
   * Check if path matches pattern
   */
  private matchesPattern(path: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/:[^/]+/g, '([^/]+)')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '\\?')

    const regex = new RegExp(`^${regexPattern}$`)
    return regex.test(path)
  }
}

/**
 * Internal navigation manager implementation
 */
class NavigationManagerImpl implements INavigationManager {
  public static instance: NavigationManagerImpl

  public _routers = new Map<string, NavigationRouter>()
  public _coordinators = new Map<string, NavigationCoordinator>()
  public _eventListeners = new Map<NavigationEvent, Set<NavigationEventListener>>()

  private constructor() {
    // Set up global navigation event handling
    if (typeof window !== 'undefined') {
      // Handle browser back/forward
      window.addEventListener('popstate', this.handlePopState.bind(this))

      // Handle deep links (if in mobile environment)
      this.setupDeepLinkHandling()
    }
  }

  static getInstance(): NavigationManagerImpl {
    if (!NavigationManagerImpl.instance) {
      NavigationManagerImpl.instance = new NavigationManagerImpl()
    }
    return NavigationManagerImpl.instance
  }

  get routers(): Map<string, NavigationRouter> {
    return new Map(this._routers)
  }

  get coordinators(): Map<string, NavigationCoordinator> {
    return new Map(this._coordinators)
  }

  createRouter(id: string): NavigationRouter {
    if (this._routers.has(id)) {
      console.warn(`Router with ID "${id}" already exists`)
      return this._routers.get(id)!
    }

    // This would create a router - for now return a placeholder
    throw new Error('createRouter not implemented - use createNavigationRouter directly')
  }

  destroyRouter(id: string): void {
    const router = this._routers.get(id)
    if (router) {
      // Cleanup router resources
      if ((router as any).cleanup) {
        ;(router as any).cleanup()
      }

      this._routers.delete(id)
      this.emitEvent('didPop', { routerId: id })
    }
  }

  getRouter(id: string): NavigationRouter | undefined {
    return this._routers.get(id)
  }

  createCoordinator(id: string): NavigationCoordinator {
    if (this._coordinators.has(id)) {
      console.warn(`Coordinator with ID "${id}" already exists`)
      return this._coordinators.get(id)!
    }

    const coordinator = new NavigationCoordinatorImpl(id)
    this._coordinators.set(id, coordinator)

    this.emitEvent('didNavigate', { coordinatorId: id })
    return coordinator
  }

  destroyCoordinator(id: string): void {
    const removed = this._coordinators.delete(id)
    if (removed) {
      this.emitEvent('didPop', { coordinatorId: id })
    }
  }

  getCoordinator(id: string): NavigationCoordinator | undefined {
    return this._coordinators.get(id)
  }

  addEventListener(event: NavigationEvent, listener: NavigationEventListener): void {
    if (!this._eventListeners.has(event)) {
      this._eventListeners.set(event, new Set())
    }
    this._eventListeners.get(event)!.add(listener)
  }

  removeEventListener(event: NavigationEvent, listener: NavigationEventListener): void {
    const listeners = this._eventListeners.get(event)
    if (listeners) {
      listeners.delete(listener)
      if (listeners.size === 0) {
        this._eventListeners.delete(event)
      }
    }
  }

  /**
   * Register a router with the manager
   */
  registerRouter(id: string, router: NavigationRouter): void {
    this._routers.set(id, router)
    this.emitEvent('didNavigate', { routerId: id })
  }

  /**
   * Unregister a router from the manager
   */
  unregisterRouter(id: string): void {
    this.destroyRouter(id)
  }

  /**
   * Emit a navigation event
   */
  emitEvent(event: NavigationEvent, data: any): void {
    const listeners = this._eventListeners.get(event)
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event, data)
        } catch (error) {
          console.error(`Error in navigation event listener for ${event}:`, error)
        }
      })
    }
  }

  /**
   * Handle global URL changes
   */
  handleURL(url: string): boolean {
    // Try each coordinator until one handles the URL
    for (const coordinator of this._coordinators.values()) {
      if (coordinator.handleURL(url)) {
        return true
      }
    }

    this.emitEvent('routeNotFound', { url })
    return false
  }

  /**
   * Get debugging information
   */
  getDebugInfo(): any {
    return {
      routers: Array.from(this._routers.keys()),
      coordinators: Array.from(this._coordinators.keys()),
      eventListeners: Object.fromEntries(
        Array.from(this._eventListeners.entries()).map(([event, listeners]) => [
          event,
          listeners.size,
        ])
      ),
      totalRoutes: Array.from(this._coordinators.values()).reduce(
        (total, coordinator) => total + coordinator.routes.size,
        0
      ),
    }
  }

  /**
   * Handle browser popstate events
   */
  public handlePopState(_event: PopStateEvent): void {
    const url = window.location.href
    this.handleURL(url)
  }

  /**
   * Set up deep link handling for mobile environments
   */
  public setupDeepLinkHandling(): void {
    // This would set up custom URL scheme handling
    // Implementation would depend on the deployment environment

    // For web, we can listen for custom protocols
    if ('serviceWorker' in navigator) {
      // Service worker can handle custom schemes
    }
  }
}

/**
 * Global navigation manager instance
 */
export const NavigationManager = NavigationManagerImpl

/**
 * Create a navigation coordinator
 *
 * @param id - Unique identifier for the coordinator
 * @returns A NavigationCoordinator instance
 */
export function createNavigationCoordinator(id: string): NavigationCoordinator {
  return NavigationManager.getInstance().createCoordinator(id)
}

/**
 * Global navigation utilities
 */
export const GlobalNavigation = {
  /**
   * Navigate to a URL globally
   */
  navigateToURL(url: string): boolean {
    return NavigationManager.getInstance().handleURL(url)
  },

  /**
   * Register a global route
   */
  registerGlobalRoute(path: string, config: DeepLinkConfig): void {
    const globalCoordinator =
      NavigationManager.getInstance().getCoordinator('global') ||
      NavigationManager.getInstance().createCoordinator('global')
    globalCoordinator.registerRoute(path, config)
  },

  /**
   * Get all registered routes across all coordinators
   */
  getAllRoutes(): Array<{ coordinatorId: string; path: string; config: DeepLinkConfig }> {
    const routes: Array<{ coordinatorId: string; path: string; config: DeepLinkConfig }> = []

    for (const [coordinatorId, coordinator] of NavigationManager.getInstance().coordinators) {
      for (const [path, config] of coordinator.routes) {
        routes.push({ coordinatorId, path, config })
      }
    }

    return routes
  },

  /**
   * Clear all navigation state (useful for testing)
   */
  clearAll(): void {
    const manager = NavigationManager.getInstance()

    // Destroy all routers
    for (const routerId of manager.routers.keys()) {
      manager.destroyRouter(routerId)
    }

    // Destroy all coordinators
    for (const coordinatorId of manager.coordinators.keys()) {
      manager.destroyCoordinator(coordinatorId)
    }
  },
}

/**
 * Navigation debugging utilities
 */
export const NavigationDebug = {
  /**
   * Get comprehensive navigation state
   */
  getState(): any {
    return NavigationManager.getInstance().getDebugInfo()
  },

  /**
   * Log all navigation events
   */
  enableEventLogging(): void {
    const events: NavigationEvent[] = [
      'willNavigate',
      'didNavigate',
      'willPop',
      'didPop',
      'tabDidChange',
      'routeNotFound',
    ]

    events.forEach((event) => {
      NavigationManager.getInstance().addEventListener(event, (eventName, data) => {
        console.log(`[NavigationDebug] ${eventName}:`, data)
      })
    })
  },

  /**
   * Test URL routing
   */
  testURL(url: string): boolean {
    console.log(`[NavigationDebug] Testing URL: ${url}`)
    const result = NavigationManager.getInstance().handleURL(url)
    console.log(`[NavigationDebug] URL handled: ${result}`)
    return result
  },

  /**
   * List all registered routes
   */
  listRoutes(): void {
    const routes = GlobalNavigation.getAllRoutes()
    console.log('[NavigationDebug] Registered routes:')
    routes.forEach((route) => {
      console.log(`  ${route.coordinatorId}: ${route.path}`)
    })
  },

  /**
   * Monitor navigation performance
   */
  enablePerformanceMonitoring(): void {
    NavigationManager.getInstance().addEventListener('willNavigate', (_, data) => {
      ;(data as any)._startTime = performance.now()
    })

    NavigationManager.getInstance().addEventListener('didNavigate', (_, data) => {
      if ((data as any)._startTime) {
        const duration = performance.now() - (data as any)._startTime
        console.log(`[NavigationDebug] Navigation took ${duration.toFixed(2)}ms`)
      }
    })
  },
}

/**
 * Initialize global navigation debugging (development only)
 */
export function initializeNavigationDebugging(): void {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const globalDebug = (window as any).__TACHUI_DEBUG__ || {}

    globalDebug.navigation = {
      manager: NavigationManager.getInstance(),
      global: GlobalNavigation,
      debug: NavigationDebug,
      getState: () => NavigationDebug.getState(),
      testURL: (url: string) => NavigationDebug.testURL(url),
    }

    ;(window as any).__TACHUI_DEBUG__ = globalDebug

    console.log('TachUI Navigation debugging enabled. Use window.__TACHUI_DEBUG__.navigation')
  }
}

/**
 * Navigation event emitter for custom events
 */
export class NavigationEventEmitter {
  private listeners = new Map<string, Set<(data: any) => void>>()

  on(event: string, listener: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(listener)
  }

  off(event: string, listener: (data: any) => void): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.delete(listener)
      if (eventListeners.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach((listener) => {
        try {
          listener(data)
        } catch (error) {
          console.error(`Error in navigation event listener for ${event}:`, error)
        }
      })
    }
  }

  clear(): void {
    this.listeners.clear()
  }
}

/**
 * Create a scoped navigation event emitter
 */
export function createNavigationEventEmitter(): NavigationEventEmitter {
  return new NavigationEventEmitter()
}
