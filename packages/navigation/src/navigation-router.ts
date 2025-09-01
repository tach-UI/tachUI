/**
 * Navigation Router Implementation
 *
 * Provides programmatic navigation capabilities with URL-based routing,
 * history management, and deep linking support for NavigationView components.
 */

import { createSignal } from '@tachui/core'
import type {
  DeepLinkConfig,
  NavigationContext,
  NavigationDestination,
  NavigationHistory,
  NavigationHistoryEntry,
  NavigationRouter,
  URLComponents,
} from './types'

/**
 * Internal navigation history implementation
 */
class NavigationHistoryImpl implements NavigationHistory {
  private _entries: NavigationHistoryEntry[] = []
  private _currentIndex = -1
  private _boundPopStateHandler?: (event: PopStateEvent) => void

  get entries(): NavigationHistoryEntry[] {
    return [...this._entries]
  }

  get currentIndex(): number {
    return this._currentIndex
  }

  get canGoBack(): boolean {
    return this._currentIndex > 0
  }

  get canGoForward(): boolean {
    return this._currentIndex < this._entries.length - 1
  }

  pushState(
    path: string,
    title?: string,
    state?: Record<string, unknown>
  ): void {
    // Remove any forward history when pushing new state
    this._entries = this._entries.slice(0, this._currentIndex + 1)

    const entry: NavigationHistoryEntry = {
      id: `history-${Date.now()}-${Math.random()}`,
      path,
      title,
      state,
      timestamp: Date.now(),
    }

    this._entries.push(entry)
    this._currentIndex++

    // Update browser history if available
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState(state, title || '', path)
    }
  }

  replaceState(
    path: string,
    title?: string,
    state?: Record<string, unknown>
  ): void {
    if (this._currentIndex >= 0) {
      const entry: NavigationHistoryEntry = {
        id: `history-${Date.now()}-${Math.random()}`,
        path,
        title,
        state,
        timestamp: Date.now(),
      }

      this._entries[this._currentIndex] = entry

      // Update browser history if available
      if (typeof window !== 'undefined' && window.history) {
        window.history.replaceState(state, title || '', path)
      }
    } else {
      this.pushState(path, title, state)
    }
  }

  go(delta: number): void {
    const newIndex = this._currentIndex + delta
    if (newIndex >= 0 && newIndex < this._entries.length) {
      this._currentIndex = newIndex

      // Update browser history if available
      if (typeof window !== 'undefined' && window.history) {
        window.history.go(delta)
      }
    }
  }

  back(): void {
    this.go(-1)
  }

  forward(): void {
    this.go(1)
  }

  clear(): void {
    this._entries = []
    this._currentIndex = -1
  }

  /**
   * Get current history entry
   */
  getCurrentEntry(): NavigationHistoryEntry | undefined {
    return this._entries[this._currentIndex]
  }
}

/**
 * Internal navigation router implementation
 */
class NavigationRouterImpl implements NavigationRouter {
  private _history: NavigationHistory
  private _routes = new Map<string, DeepLinkConfig>()
  private _getCurrentPath: () => string
  private _setCurrentPath: (v: string | ((prev: string) => string)) => string
  private _boundPopStateHandler?: (event: PopStateEvent) => void

  constructor(
    private navigationContext: NavigationContext,
    private onRouteChange?: (path: string) => void
  ) {
    this._history = new NavigationHistoryImpl()
    const [getPath, setPath] = createSignal('/')
    this._getCurrentPath = getPath
    this._setCurrentPath = setPath

    // Initialize with current path
    this._setCurrentPath(navigationContext.currentPath)

    // Listen for browser back/forward
    if (typeof window !== 'undefined') {
      this._boundPopStateHandler = this.handlePopState.bind(this)
      window.addEventListener('popstate', this._boundPopStateHandler)
    }
  }

  get currentPath(): string {
    return this._getCurrentPath()
  }

  get canGoBack(): boolean {
    return this._history.canGoBack || this.navigationContext.canGoBack
  }

  get canGoForward(): boolean {
    return this._history.canGoForward
  }

  // Method versions for test compatibility
  getCurrentPath(): string {
    return this._getCurrentPath()
  }

  getCanGoBack(): boolean {
    return this._history.canGoBack || this.navigationContext.canGoBack
  }

  getCanGoForward(): boolean {
    return this._history.canGoForward
  }

  navigate(
    path: string,
    options: { replace?: boolean; animate?: boolean } = {}
  ): void {
    // Find matching route
    const route = this.findMatchingRoute(path)
    if (route) {
      const destination = route.component
      const title = (route.metadata?.title as string) || path

      if (options.replace) {
        this.navigationContext.replace(destination, path, title)
      } else {
        this.navigationContext.push(destination, path, title)
      }
    } else {
      console.warn(`No route found for path: ${path}`)
    }
  }

  goBack(): void {
    if (this.navigationContext.canGoBack) {
      this.navigationContext.pop()
      this._history.back()
      this.updateCurrentPath()
    }
  }

  goForward(): void {
    if (this._history.canGoForward) {
      this._history.forward()
      // Navigation context doesn't support forward navigation yet
      console.warn(
        'Forward navigation not yet implemented in NavigationContext'
      )
    }
  }

  push(destination: NavigationDestination, path?: string): void {
    const navigationPath = path || `/destination-${Date.now()}`
    const title = this.extractTitleFromDestination(destination)

    this.navigationContext.push(destination, navigationPath, title)
    this._history.pushState(navigationPath, title)
    this.updateCurrentPath()
  }

  pop(): void {
    this.navigationContext.pop()
    this._history.back()
    this.updateCurrentPath()
  }

  popToRoot(): void {
    this.navigationContext.popToRoot()
    // Clear history to root
    this._history.clear()
    this._history.pushState('/', 'Home')
    this._setCurrentPath('/')
    this.navigationContext.currentPath = '/'
    if (this.onRouteChange) {
      this.onRouteChange('/')
    }
  }

  replace(destination: NavigationDestination, path?: string): void {
    const navigationPath = path || `/destination-${Date.now()}`
    const title = this.extractTitleFromDestination(destination)

    this.navigationContext.replace(destination, navigationPath, title)
    this._history.replaceState(navigationPath, title)
    this.updateCurrentPath()
  }

  /**
   * Register a route for deep linking
   */
  registerRoute(path: string, config: DeepLinkConfig): void {
    this._routes.set(path, config)
  }

  /**
   * Unregister a route
   */
  unregisterRoute(path: string): void {
    this._routes.delete(path)
  }

  /**
   * Get navigation history
   */
  getHistory(): NavigationHistory {
    return this._history
  }

  /**
   * Handle browser popstate events
   */
  private handlePopState(_event: PopStateEvent): void {
    const path = window.location.pathname
    this.updateCurrentPath(path)

    if (this.onRouteChange) {
      this.onRouteChange(path)
    }
  }

  /**
   * Find matching route for a path
   */
  private findMatchingRoute(path: string): DeepLinkConfig | undefined {
    // First try exact match
    const exactMatch = this._routes.get(path)
    if (exactMatch) return exactMatch

    // Try pattern matching
    for (const [pattern, config] of this._routes) {
      if (this.matchesPattern(path, pattern)) {
        return config
      }
    }

    return undefined
  }

  /**
   * Check if path matches pattern
   */
  private matchesPattern(path: string, pattern: string): boolean {
    // Convert pattern to regex (simple implementation)
    let regexPattern = pattern
      .replace(/:[^/]+/g, '([^/]+)') // :param -> capture group
      .replace(/\?/g, '\\?') // escape ?

    // Handle wildcard patterns - /admin/* should match /admin and /admin/anything
    if (regexPattern.endsWith('/*')) {
      regexPattern = regexPattern.slice(0, -2) + '(/.*)?'
    } else {
      regexPattern = regexPattern.replace(/\*/g, '.*') // * -> match anything
    }

    const regex = new RegExp(`^${regexPattern}$`)
    return regex.test(path)
  }

  /**
   * Extract title from destination component
   */
  private extractTitleFromDestination(
    destination: NavigationDestination
  ): string {
    if (typeof destination === 'function') {
      // Can't extract title from function until it's executed
      return 'Page'
    }

    // Try to extract title from component metadata
    if (typeof destination === 'object' && destination) {
      const metadata = (destination as { metadata?: { title?: string } })
        .metadata
      if (metadata?.title) {
        return metadata.title
      }

      // Try to extract from component type or props
      const type = (destination as { type?: string }).type
      if (type) {
        return type.charAt(0).toUpperCase() + type.slice(1)
      }
    }

    return 'Page'
  }

  /**
   * Update current path state
   */
  private updateCurrentPath(path?: string): void {
    const newPath = path || this.navigationContext.currentPath
    this._setCurrentPath(newPath)

    if (this.onRouteChange) {
      this.onRouteChange(newPath)
    }
  }

  /**
   * Cleanup router resources
   */
  cleanup(): void {
    if (typeof window !== 'undefined' && this._boundPopStateHandler) {
      window.removeEventListener('popstate', this._boundPopStateHandler)
      this._boundPopStateHandler = undefined
    }
  }
}

/**
 * Create a navigation router for a navigation context
 *
 * @param navigationContext - The navigation context to control
 * @param onRouteChange - Optional callback for route changes
 * @returns A NavigationRouter instance
 */
export function createNavigationRouter(
  navigationContext: NavigationContext,
  onRouteChange?: (path: string) => void
): NavigationRouter {
  return new NavigationRouterImpl(navigationContext, onRouteChange)
}

/**
 * Parse URL into components
 *
 * @param url - The URL to parse
 * @returns URLComponents object
 */
export function parseURL(url: string): URLComponents {
  try {
    const urlObj = new URL(url, window?.location?.origin || 'http://localhost')

    const query: Record<string, string> = {}
    urlObj.searchParams.forEach((value, key) => {
      query[key] = value
    })

    return {
      scheme: urlObj.protocol.replace(':', ''),
      host: urlObj.host,
      path: urlObj.pathname,
      query,
      fragment: urlObj.hash.replace('#', '') || undefined,
    }
  } catch (_error) {
    // Fallback for invalid URLs
    // const _parts = url.split('/')
    return {
      path: url.startsWith('/') ? url : `/${url}`,
      query: {},
    }
  }
}

/**
 * Build URL from components
 *
 * @param components - URL components
 * @returns Complete URL string
 */
export function buildURL(components: URLComponents): string {
  let url = ''

  if (components.scheme && components.host) {
    url = `${components.scheme}://${components.host}`
  }

  url += components.path

  if (components.query && Object.keys(components.query).length > 0) {
    const queryString = Object.entries(components.query)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join('&')
    url += `?${queryString}`
  }

  if (components.fragment) {
    url += `#${components.fragment}`
  }

  return url
}

/**
 * Extract route parameters from path using pattern
 *
 * @param path - The actual path
 * @param pattern - The route pattern with parameters
 * @returns Object with extracted parameters
 *
 * @example
 * ```typescript
 * const params = extractRouteParams('/users/123/posts/456', '/users/:userId/posts/:postId')
 * // { userId: '123', postId: '456' }
 * ```
 */
export function extractRouteParams(
  path: string,
  pattern: string
): Record<string, string> {
  const params: Record<string, string> = {}

  const pathSegments = path.split('/').filter(Boolean)
  const patternSegments = pattern.split('/').filter(Boolean)

  for (let i = 0; i < patternSegments.length; i++) {
    const patternSegment = patternSegments[i]
    const pathSegment = pathSegments[i]

    if (patternSegment.startsWith(':')) {
      const paramName = patternSegment.slice(1)
      params[paramName] = pathSegment || ''
    }
  }

  return params
}

/**
 * Create a route matcher function
 *
 * @param pattern - Route pattern to match against
 * @returns Function that tests if a path matches the pattern
 */
export function createRouteMatcher(pattern: string): (path: string) => boolean {
  let regexPattern = pattern.replace(/:[^/]+/g, '([^/]+)').replace(/\?/g, '\\?')

  // Handle wildcard patterns - /admin/* should match /admin and /admin/anything
  if (regexPattern.endsWith('/*')) {
    regexPattern = regexPattern.slice(0, -2) + '(/.*)?'
  } else {
    regexPattern = regexPattern.replace(/\*/g, '.*')
  }

  const regex = new RegExp(`^${regexPattern}$`)

  return (path: string) => regex.test(path)
}

/**
 * Navigation router builder for declarative route configuration
 */
export const NavigationRouterBuilder = {
  /**
   * Create a router with routes
   */
  create(navigationContext: NavigationContext) {
    const router = createNavigationRouter(navigationContext)

    return {
      /**
       * Add a route to the router
       */
      route(
        path: string,
        component: NavigationDestination,
        metadata?: Record<string, unknown>
      ) {
        // TODO: Implement route registration
        console.log('Route registered:', path, component, metadata)
        return this
      },

      /**
       * Add multiple routes
       */
      routes(
        routes: Array<{
          path: string
          component: NavigationDestination
          metadata?: Record<string, unknown>
        }>
      ) {
        routes.forEach(route => {
          // TODO: Implement route registration
          console.log(
            'Route registered:',
            route.path,
            route.component,
            route.metadata
          )
        })
        return this
      },

      /**
       * Get the configured router
       */
      build(): NavigationRouter {
        return router
      },
    }
  },
}

/**
 * Create a simple hash-based router
 *
 * @param routes - Route configurations
 * @returns A hash router instance
 */
export function createHashRouter(
  _routes: Record<string, NavigationDestination>
): NavigationRouter {
  // This would be a simplified router that uses hash-based navigation
  // Implementation would go here
  throw new Error('Hash router not yet implemented')
}

/**
 * Create a memory router for testing
 *
 * @param initialPath - Initial route path
 * @returns A memory-based router instance
 */
export function createMemoryRouter(
  _initialPath: string = '/'
): NavigationRouter {
  // This would be a router that doesn't interact with browser history
  // Implementation would go here
  throw new Error('Memory router not yet implemented')
}

/**
 * Router utilities
 */
export const RouterUtils = {
  /**
   * Check if current environment supports browser routing
   */
  isBrowserRoutingSupported(): boolean {
    // In test environment, return false to disable browser routing
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
      return false
    }

    return (
      typeof window !== 'undefined' &&
      typeof window.history !== 'undefined' &&
      typeof window.history.pushState === 'function'
    )
  },

  /**
   * Get current browser path
   */
  getCurrentPath(): string {
    // In test environment, return root path
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
      return '/'
    }

    if (typeof window !== 'undefined') {
      return (
        window.location.pathname + window.location.search + window.location.hash
      )
    }
    return '/'
  },

  /**
   * Navigate using browser API
   */
  browserNavigate(path: string, replace: boolean = false): void {
    if (this.isBrowserRoutingSupported()) {
      if (replace) {
        window.history.replaceState(null, '', path)
      } else {
        window.history.pushState(null, '', path)
      }
    }
  },
}
