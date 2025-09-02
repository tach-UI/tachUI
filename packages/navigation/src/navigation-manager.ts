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
  private _navigations = new Map<string, any>()
  private _strategy: string = 'default'

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
  private navigateToRoute(
    config: DeepLinkConfig,
    urlComponents: URLComponents
  ): void {
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

  /**
   * Coordinate navigation between multiple instances
   */
  coordinateNavigation(event: any): void {
    // Handle navigation coordination based on strategy
    if (event && event.navigationId) {
      const navigation = this._navigations.get(event.navigationId)
      if (navigation) {
        if (event.type === 'push' && event.path) {
          navigation.push(null, event.path)
        } else if (event.type === 'pop') {
          navigation.pop()
        } else if (event.type === 'replace' && event.path) {
          navigation.replace(null, event.path)
        }
      }
    }
  }

  /**
   * Add navigation to coordination
   */
  addNavigation(navigation: any): void {
    if (navigation && navigation.navigationId) {
      this._navigations.set(navigation.navigationId, navigation)
    }
  }

  /**
   * Remove navigation from coordination
   */
  removeNavigation(navigationId: string): void {
    this._navigations.delete(navigationId)
  }

  /**
   * Get all coordinated navigations
   */
  getAllNavigations(): any[] {
    return Array.from(this._navigations.values())
  }

  /**
   * Set coordination strategy
   */
  setCoordinationStrategy(strategy: string): void {
    this._strategy = strategy
  }

  /**
   * Get coordination strategy
   */
  getCoordinationStrategy(): string {
    return this._strategy
  }

  /**
   * Get navigations by priority
   */
  getNavigationsByPriority(): any[] {
    return Array.from(this._navigations.values()).sort((a, b) => {
      const priorityA = a.priority || 0
      const priorityB = b.priority || 0
      return priorityB - priorityA // Higher priority first
    })
  }
}

/**
 * Internal navigation manager implementation
 */
class NavigationManagerImpl implements INavigationManager {
  public static instance: NavigationManagerImpl

  public _routers = new Map<string, NavigationRouter>()
  public _coordinators = new Map<string, NavigationCoordinator>()
  public _eventListeners = new Map<
    NavigationEvent,
    Set<NavigationEventListener>
  >()
  public _navigations = new Map<string, any>()

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
    throw new Error(
      'createRouter not implemented - use createNavigationRouter directly'
    )
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

  addEventListener(
    event: NavigationEvent,
    listener: NavigationEventListener
  ): void {
    if (!this._eventListeners.has(event)) {
      this._eventListeners.set(event, new Set())
    }
    this._eventListeners.get(event)!.add(listener)
  }

  removeEventListener(
    event: NavigationEvent,
    listener: NavigationEventListener
  ): void {
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
   * Register a navigation context
   */
  registerNavigation(id: string, navigation: any): void {
    this._navigations.set(id, navigation)
  }

  /**
   * Unregister a navigation context
   */
  unregisterNavigation(id: string): void {
    this._navigations.delete(id)
  }

  /**
   * Get a navigation context by ID
   */
  getNavigation(id: string): any {
    return this._navigations.get(id)
  }

  /**
   * Get all navigation IDs
   */
  getAllNavigationIds(): string[] {
    return Array.from(this._navigations.keys())
  }

  /**
   * Emit a navigation event
   */
  emitEvent(event: NavigationEvent, data: any): void {
    const listeners = this._eventListeners.get(event)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event, data)
        } catch (error) {
          console.error(
            `Error in navigation event listener for ${event}:`,
            error
          )
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
 * Navigation Manager class for direct instantiation
 */
export class NavigationManager {
  private _navigations = new Map<string, any>()

  registerNavigation(id: string, navigation: any): void {
    this._navigations.set(id, navigation)
  }

  unregisterNavigation(id: string): void {
    this._navigations.delete(id)
  }

  getNavigation(id: string): any {
    return this._navigations.get(id)
  }

  getAllNavigationIds(): string[] {
    return Array.from(this._navigations.keys())
  }
}

/**
 * Global navigation manager instance
 */
export const NavigationManagerSingleton = NavigationManagerImpl

/**
 * Create a navigation coordinator
 *
 * @param id - Unique identifier for the coordinator
 * @returns A NavigationCoordinator instance
 */
export function createNavigationCoordinator(
  id?: string
): NavigationCoordinator {
  const coordinatorId = id || `coordinator-${Date.now()}`
  return NavigationManagerSingleton.getInstance().createCoordinator(
    coordinatorId
  )
}

/**
 * Global navigation utilities
 */
const globalNavigationManager = new NavigationManager()
const globalNavigationEventListeners = new Set<(event: any) => void>()

export const GlobalNavigation = {
  /**
   * Navigate to a URL globally
   */
  navigateToURL(url: string): boolean {
    return NavigationManagerSingleton.getInstance().handleURL(url)
  },

  /**
   * Register a global route
   */
  registerGlobalRoute(path: string, config: DeepLinkConfig): void {
    const globalCoordinator =
      NavigationManagerSingleton.getInstance().getCoordinator('global') ||
      NavigationManagerSingleton.getInstance().createCoordinator('global')
    globalCoordinator.registerRoute(path, config)
  },

  /**
   * Get all registered routes across all coordinators
   */
  getAllRoutes(): Array<{
    coordinatorId: string
    path: string
    config: DeepLinkConfig
  }> {
    const routes: Array<{
      coordinatorId: string
      path: string
      config: DeepLinkConfig
    }> = []

    for (const [
      coordinatorId,
      coordinator,
    ] of NavigationManagerSingleton.getInstance().coordinators) {
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
    const manager = NavigationManagerSingleton.getInstance()

    // Destroy all routers
    for (const routerId of manager.routers.keys()) {
      manager.destroyRouter(routerId)
    }

    // Destroy all coordinators
    for (const coordinatorId of manager.coordinators.keys()) {
      manager.destroyCoordinator(coordinatorId)
    }
  },

  /**
   * Register a navigation context
   */
  registerNavigation(id: string, navigation: any): void {
    globalNavigationManager.registerNavigation(id, navigation)
  },

  /**
   * Unregister a navigation context
   */
  unregisterNavigation(id: string): void {
    globalNavigationManager.unregisterNavigation(id)
  },

  /**
   * Get a navigation context by ID
   */
  getNavigation(id: string): any {
    return globalNavigationManager.getNavigation(id)
  },

  /**
   * Get all navigation IDs
   */
  getAllNavigationIds(): string[] {
    return globalNavigationManager.getAllNavigationIds()
  },

  /**
   * Find navigation by path
   */
  findNavigationByPath(path: string): any {
    for (const navigation of globalNavigationManager
      .getAllNavigationIds()
      .map(id => globalNavigationManager.getNavigation(id))) {
      if (navigation && navigation.currentPath === path) {
        return navigation
      }
    }
    return undefined
  },

  /**
   * Get active navigation
   */
  getActiveNavigation(): any {
    // Return the first registered navigation as active
    const ids = globalNavigationManager.getAllNavigationIds()
    return ids.length > 0
      ? globalNavigationManager.getNavigation(ids[0])
      : undefined
  },

  /**
   * Broadcast navigation event
   */
  broadcastNavigationEvent(event: any): void {
    globalNavigationEventListeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('Error in global navigation listener:', error)
      }
    })
  },

  /**
   * Add navigation listener
   */
  addNavigationListener(listener: (event: any) => void): void {
    globalNavigationEventListeners.add(listener)
  },

  /**
   * Remove navigation listener
   */
  removeNavigationListener(listener: (event: any) => void): void {
    globalNavigationEventListeners.delete(listener)
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
    return NavigationManagerSingleton.getInstance().getDebugInfo()
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

    events.forEach(event => {
      NavigationManagerSingleton.getInstance().addEventListener(
        event,
        (eventName: NavigationEvent, data: any) => {
          console.log(`[NavigationDebug] ${eventName}:`, data)
        }
      )
    })
  },

  /**
   * Test URL routing
   */
  testURL(url: string): boolean {
    console.log(`[NavigationDebug] Testing URL: ${url}`)
    const result = NavigationManagerSingleton.getInstance().handleURL(url)
    console.log(`[NavigationDebug] URL handled: ${result}`)
    return result
  },

  /**
   * List all registered routes
   */
  listRoutes(): void {
    const routes = GlobalNavigation.getAllRoutes()
    console.log('[NavigationDebug] Registered routes:')
    routes.forEach(route => {
      console.log(`  ${route.coordinatorId}: ${route.path}`)
    })
  },

  /**
   * Monitor navigation performance
   */
  enablePerformanceMonitoring(): void {
    NavigationManagerSingleton.getInstance().addEventListener(
      'willNavigate',
      (_: NavigationEvent, data: any) => {
        ;(data as any)._startTime = performance.now()
      }
    )

    NavigationManagerSingleton.getInstance().addEventListener(
      'didNavigate',
      (_: NavigationEvent, data: any) => {
        if ((data as any)._startTime) {
          const duration = performance.now() - (data as any)._startTime
          console.log(
            `[NavigationDebug] Navigation took ${duration.toFixed(2)}ms`
          )
        }
      }
    )
  },
}

/**
 * Initialize global navigation debugging (development only)
 */
export function initializeNavigationDebugging(): void {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const globalDebug = (window as any).__TACHUI_DEBUG__ || {}

    globalDebug.navigation = {
      manager: NavigationManagerSingleton.getInstance(),
      global: GlobalNavigation,
      debug: NavigationDebug,
      getState: () => NavigationDebug.getState(),
      testURL: (url: string) => NavigationDebug.testURL(url),
    }
    ;(window as any).__TACHUI_DEBUG__ = globalDebug

    console.log(
      'TachUI Navigation debugging enabled. Use window.__TACHUI_DEBUG__.navigation'
    )
  }
}

/**
 * Navigation event emitter for custom events
 */
export class NavigationEventEmitter {
  private listeners = new Map<
    string,
    Set<{ listener: (data: any) => void; filter?: (data: any) => boolean }>
  >()
  private eventHistory: any[] = []

  on(event: string, listener: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add({ listener })
  }

  off(event: string, listener: (data: any) => void): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      for (const item of eventListeners) {
        if (item.listener === listener) {
          eventListeners.delete(item)
          break
        }
      }
      if (eventListeners.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  emit(event: string, data: any): void {
    // Add to history - merge event and data for simpler structure
    this.eventHistory.push({ ...data, event })

    // Emit to specific event listeners
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(({ listener, filter }) => {
        try {
          if (!filter || filter(data)) {
            listener(data)
          }
        } catch (error) {
          console.error(
            `Error in navigation event listener for ${event}:`,
            error
          )
        }
      })
    }

    // Also emit to general navigation listeners only for namespaced events like 'navigation:push'
    if (event.includes(':')) {
      const baseEvent = event.split(':')[0]
      const baseListeners = this.listeners.get(baseEvent)
      if (baseListeners) {
        baseListeners.forEach(({ listener, filter }) => {
          try {
            if (!filter || filter(data)) {
              listener(data)
            }
          } catch (error) {
            console.error(
              `Error in navigation event listener for ${baseEvent}:`,
              error
            )
          }
        })
      }
    }
  }

  /**
   * Emit event with class interface (bypasses double emission)
   */
  emitEvent(event: string, data: any): void {
    // Add to history - merge event and data for simpler structure
    this.eventHistory.push({ ...data, event })

    // Only emit to specific event listeners (avoid double emission)
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(({ listener, filter }) => {
        try {
          if (!filter || filter(data)) {
            listener(data)
          }
        } catch (error) {
          console.error(
            `Error in navigation event listener for ${event}:`,
            error
          )
        }
      })
    }
  }

  /**
   * Add listener with class interface
   */
  addListener(
    event: string,
    listener: (data: any) => void,
    filter?: (data: any) => boolean,
    bufferPrevious?: boolean
  ): { unsubscribe: () => void } {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }

    const listenerItem = { listener, filter }
    this.listeners.get(event)!.add(listenerItem)

    // If buffering is enabled, replay previous events
    if (bufferPrevious) {
      const previousEvents = this.eventHistory.filter(
        item => item.event === event
      )
      previousEvents.forEach(item => {
        if (!filter || filter(item)) {
          listener(item)
        }
      })
    }

    return {
      unsubscribe: () => {
        const eventListeners = this.listeners.get(event)
        if (eventListeners) {
          eventListeners.delete(listenerItem)
          if (eventListeners.size === 0) {
            this.listeners.delete(event)
          }
        }
      },
    }
  }

  /**
   * Remove listener with class interface
   */
  removeListener(event: string, listener: (data: any) => void): void {
    this.off(event, listener)
  }

  /**
   * Get event history
   */
  getEventHistory(): any[] {
    return [...this.eventHistory]
  }

  clear(): void {
    this.listeners.clear()
    this.eventHistory = []
  }
}

/**
 * Create a scoped navigation event emitter
 */
export function createNavigationEventEmitter(): NavigationEventEmitter {
  return new NavigationEventEmitter()
}
