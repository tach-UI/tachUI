/**
 * Programmatic Navigation Implementation
 *
 * Implements SwiftUI's programmatic navigation patterns with type-safe
 * operations, deep linking, and URL-based navigation support.
 */

import { NavigationPath } from './navigation-path'
import { useNavigationEnvironmentContext } from './navigation-environment'
import type { NavigationDestination, NavigationContext } from './types'

/**
 * Enhanced navigation path with type-safe operations
 */
export class ProgrammaticNavigationPath extends NavigationPath {
  private _destinationRegistry: Map<string, (value: any) => NavigationDestination> = new Map()
  private _urlPattern: string | null = null
  
  /**
   * Register a type-safe destination handler
   * 
   * @param type - The destination type identifier
   * @param handler - Function that creates the destination from a value
   */
  registerDestination<T>(type: string, handler: (value: T) => NavigationDestination): void {
    this._destinationRegistry.set(type, handler)
  }

  /**
   * Navigate to a registered destination with type safety
   * 
   * @param type - The destination type
   * @param value - The value to pass to the destination handler
   */
  navigateTo<T>(type: string, value: T): void {
    const handler = this._destinationRegistry.get(type)
    if (!handler) {
      throw new Error(`No destination registered for type: ${type}`)
    }

    // Create the destination and append to path
    const destination = handler(value)
    this.append(`${type}/${encodeURIComponent(String(value))}`)
    
    // Trigger navigation through environment
    const context = useNavigationEnvironmentContext()
    if (context) {
      const path = this.toString()
      context.push(destination, path, type)
    }
  }

  /**
   * Set URL pattern for deep linking
   * 
   * @param pattern - URL pattern (e.g., "/users/:userId/posts/:postId")
   */
  setURLPattern(pattern: string): void {
    this._urlPattern = pattern
  }

  /**
   * Build URL from current path using pattern
   */
  buildURL(): string {
    if (!this._urlPattern) {
      return this.toString()
    }

    let url = this._urlPattern
    const segments = this.segments
    
    // Replace URL parameters with actual values
    segments.forEach((segment, _index) => {
      const paramPattern = /:(\w+)/g
      url = url.replace(paramPattern, (_match, _paramName) => {
        return segment
      })
    })

    return url
  }

  /**
   * Parse URL and update path
   * 
   * @param url - URL to parse
   */
  parseURL(url: string): void {
    if (!this._urlPattern) {
      // Simple parsing - split by /
      const segments = url.split('/').filter(Boolean)
      this.replaceAll(segments)
      return
    }

    // Advanced parsing with pattern matching
    const patternSegments = this._urlPattern.split('/').filter(Boolean)
    const urlSegments = url.split('/').filter(Boolean)
    
    const extractedSegments: string[] = []
    
    patternSegments.forEach((pattern, index) => {
      if (pattern.startsWith(':')) {
        // Parameter segment
        extractedSegments.push(urlSegments[index] || '')
      }
    })

    this.replaceAll(extractedSegments)
  }
}

/**
 * Deep linking configuration
 */
export interface DeepLinkRoute {
  pattern: string
  handler: (params: Record<string, string>) => NavigationDestination
  metadata?: Record<string, any>
}

/**
 * Deep linking manager
 */
export class DeepLinkManager {
  private _routes: Map<string, DeepLinkRoute> = new Map()
  private _baseURL: string = ''

  constructor(baseURL: string = '') {
    this._baseURL = baseURL
  }

  /**
   * Register a deep link route
   * 
   * @param pattern - URL pattern (e.g., "/users/:userId")
   * @param handler - Function to create destination from parameters
   * @param metadata - Optional metadata
   */
  registerRoute(
    pattern: string,
    handler: (params: Record<string, string>) => NavigationDestination,
    metadata?: Record<string, any>
  ): void {
    this._routes.set(pattern, { pattern, handler, metadata })
  }

  /**
   * Handle a URL and navigate to the corresponding destination
   * 
   * @param url - URL to handle
   * @returns True if route was handled, false otherwise
   */
  handleURL(url: string): boolean {
    const cleanURL = url.replace(this._baseURL, '')
    
    for (const [pattern, route] of this._routes) {
      const params = this.matchPattern(pattern, cleanURL)
      if (params) {
        const destination = route.handler(params)
        
        // Navigate through environment
        const context = useNavigationEnvironmentContext()
        if (context) {
          context.push(destination, cleanURL, 'Deep Link')
        }
        
        return true
      }
    }
    
    return false
  }

  /**
   * Build URL from pattern and parameters
   * 
   * @param pattern - URL pattern
   * @param params - Parameters to substitute
   * @returns Built URL
   */
  buildURL(pattern: string, params: Record<string, string>): string {
    let url = pattern
    
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, encodeURIComponent(value))
    })
    
    return this._baseURL + url
  }

  /**
   * Get all registered routes
   */
  getRoutes(): DeepLinkRoute[] {
    return Array.from(this._routes.values())
  }

  /**
   * Clear all routes
   */
  clearRoutes(): void {
    this._routes.clear()
  }

  /**
   * Match a URL pattern and extract parameters
   * 
   * @param pattern - URL pattern
   * @param url - URL to match
   * @returns Parameters object or null if no match
   */
  private matchPattern(pattern: string, url: string): Record<string, string> | null {
    const patternSegments = pattern.split('/').filter(Boolean)
    const urlSegments = url.split('/').filter(Boolean)
    
    if (patternSegments.length !== urlSegments.length) {
      return null
    }
    
    const params: Record<string, string> = {}
    
    for (let i = 0; i < patternSegments.length; i++) {
      const patternSegment = patternSegments[i]
      const urlSegment = urlSegments[i]
      
      if (patternSegment.startsWith(':')) {
        // Parameter segment
        const paramName = patternSegment.slice(1)
        params[paramName] = decodeURIComponent(urlSegment)
      } else if (patternSegment !== urlSegment) {
        // Literal segment doesn't match
        return null
      }
    }
    
    return params
  }
}

/**
 * Navigation persistence manager
 */
export class NavigationPersistenceManager {
  private _storageKey: string
  private _maxHistorySize: number

  constructor(storageKey: string = 'tachui-navigation', maxHistorySize: number = 50) {
    this._storageKey = storageKey
    this._maxHistorySize = maxHistorySize
    
    // Listen for browser navigation events
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', this.handlePopState.bind(this))
    }
  }

  /**
   * Save navigation state to storage
   * 
   * @param context - Navigation context to save
   */
  saveState(context: NavigationContext): void {
    if (typeof window === 'undefined') return

    const state = {
      navigationId: context.navigationId,
      currentPath: context.currentPath,
      stack: context.stack.map(entry => ({
        id: entry.id,
        path: entry.path,
        title: entry.title,
        timestamp: entry.timestamp
      })),
      timestamp: Date.now()
    }

    try {
      const history = this.getHistory()
      history.push(state)
      
      // Limit history size
      if (history.length > this._maxHistorySize) {
        history.splice(0, history.length - this._maxHistorySize)
      }
      
      localStorage.setItem(this._storageKey, JSON.stringify(history))
      
      // Update browser history
      window.history.pushState(state, '', context.currentPath)
    } catch (error) {
      console.error('Failed to save navigation state:', error)
    }
  }

  /**
   * Restore navigation state from storage
   * 
   * @param navigationId - Navigation ID to restore
   * @returns Restored state or null
   */
  restoreState(navigationId?: string): any | null {
    if (typeof window === 'undefined') return null

    try {
      const history = this.getHistory()
      
      if (navigationId) {
        // Find specific navigation state
        return history.find(state => state.navigationId === navigationId) || null
      } else {
        // Return most recent state
        return history[history.length - 1] || null
      }
    } catch (error) {
      console.error('Failed to restore navigation state:', error)
      return null
    }
  }

  /**
   * Clear navigation history
   */
  clearHistory(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(this._storageKey)
    } catch (error) {
      console.error('Failed to clear navigation history:', error)
    }
  }

  /**
   * Handle browser back/forward navigation
   */
  private handlePopState(event: PopStateEvent): void {
    const state = event.state
    if (state && state.navigationId) {
      // Restore navigation state
      const context = useNavigationEnvironmentContext()
      if (context && context.navigationId === state.navigationId) {
        // This would restore the navigation stack to the previous state
        // Implementation would depend on how context restoration is handled
        console.log('Restoring navigation state:', state)
      }
    }
  }

  /**
   * Get navigation history from storage
   */
  private getHistory(): any[] {
    try {
      const stored = localStorage.getItem(this._storageKey)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to get navigation history:', error)
      return []
    }
  }
}

/**
 * Navigation animation manager
 */
export class NavigationAnimationManager {
  private _animationDuration: number = 300
  private _defaultEasing: string = 'ease-in-out'

  /**
   * Set animation configuration
   * 
   * @param duration - Animation duration in milliseconds
   * @param easing - CSS easing function
   */
  configure(duration: number = 300, easing: string = 'ease-in-out'): void {
    this._animationDuration = duration
    this._defaultEasing = easing
  }

  /**
   * Animate navigation transition
   * 
   * @param type - Animation type
   * @param fromElement - Element to animate from
   * @param toElement - Element to animate to
   * @param direction - Animation direction
   */
  async animateTransition(
    type: 'push' | 'pop' | 'replace',
    fromElement: HTMLElement | null,
    toElement: HTMLElement | null,
    direction: 'forward' | 'backward' = 'forward'
  ): Promise<void> {
    if (!fromElement || !toElement) return

    const animations = this.getAnimationConfig(type, direction)
    
    // Apply initial states
    if (animations.from.initial) {
      Object.assign(fromElement.style, animations.from.initial)
    }
    if (animations.to.initial) {
      Object.assign(toElement.style, animations.to.initial)
    }

    // Force reflow
    fromElement.offsetHeight
    toElement.offsetHeight

    // Create animation promises
    const promises: Promise<void>[] = []

    // Animate from element
    if (animations.from.final) {
      const promise = new Promise<void>((resolve) => {
        fromElement.style.transition = `all ${this._animationDuration}ms ${this._defaultEasing}`
        Object.assign(fromElement.style, animations.from.final)
        setTimeout(resolve, this._animationDuration)
      })
      promises.push(promise)
    }

    // Animate to element
    if (animations.to.final) {
      const promise = new Promise<void>((resolve) => {
        toElement.style.transition = `all ${this._animationDuration}ms ${this._defaultEasing}`
        Object.assign(toElement.style, animations.to.final)
        setTimeout(resolve, this._animationDuration)
      })
      promises.push(promise)
    }

    // Wait for all animations to complete
    await Promise.all(promises)

    // Clean up transition styles
    fromElement.style.transition = ''
    toElement.style.transition = ''
  }

  /**
   * Get animation configuration for transition type
   */
  private getAnimationConfig(
    type: 'push' | 'pop' | 'replace',
    direction: 'forward' | 'backward'
  ): {
    from: { initial?: Record<string, string>; final?: Record<string, string> }
    to: { initial?: Record<string, string>; final?: Record<string, string> }
  } {
    const slideDistance = '100%'
    
    switch (type) {
      case 'push':
        return direction === 'forward'
          ? {
              from: { final: { transform: `translateX(-${slideDistance})`, opacity: '0.8' } },
              to: { initial: { transform: `translateX(${slideDistance})` }, final: { transform: 'translateX(0)' } }
            }
          : {
              from: { final: { transform: `translateX(${slideDistance})`, opacity: '0.8' } },
              to: { initial: { transform: `translateX(-${slideDistance})` }, final: { transform: 'translateX(0)' } }
            }
      
      case 'pop':
        return direction === 'forward'
          ? {
              from: { final: { transform: `translateX(${slideDistance})`, opacity: '0' } },
              to: { initial: { transform: `translateX(-${slideDistance})`, opacity: '0.8' }, final: { transform: 'translateX(0)', opacity: '1' } }
            }
          : {
              from: { final: { transform: `translateX(-${slideDistance})`, opacity: '0' } },
              to: { initial: { transform: `translateX(${slideDistance})`, opacity: '0.8' }, final: { transform: 'translateX(0)', opacity: '1' } }
            }
      
      case 'replace':
      default:
        return {
          from: { final: { opacity: '0' } },
          to: { initial: { opacity: '0' }, final: { opacity: '1' } }
        }
    }
  }
}

// Global instances
export const deepLinkManager = new DeepLinkManager()
export const navigationPersistenceManager = new NavigationPersistenceManager()
export const navigationAnimationManager = new NavigationAnimationManager()

/**
 * Create a programmatic navigation path
 */
export function createProgrammaticNavigationPath(initialSegments?: string[]): ProgrammaticNavigationPath {
  return new ProgrammaticNavigationPath(initialSegments)
}

/**
 * Programmatic navigation utilities
 */
export const ProgrammaticNavigationUtils = {
  /**
   * Register a deep link route
   */
  registerDeepLink(
    pattern: string,
    handler: (params: Record<string, string>) => NavigationDestination,
    metadata?: Record<string, any>
  ): void {
    deepLinkManager.registerRoute(pattern, handler, metadata)
  },

  /**
   * Handle a deep link URL
   */
  handleDeepLink(url: string): boolean {
    return deepLinkManager.handleURL(url)
  },

  /**
   * Build a deep link URL
   */
  buildDeepLink(pattern: string, params: Record<string, string>): string {
    return deepLinkManager.buildURL(pattern, params)
  },

  /**
   * Enable navigation persistence
   */
  enablePersistence(_options?: { storageKey?: string; maxHistorySize?: number }): void {
    // This would set up automatic persistence
    const context = useNavigationEnvironmentContext()
    if (context) {
      // Save state on navigation changes
      // This is simplified - would need proper integration
    }
  },

  /**
   * Restore navigation state
   */
  restoreNavigation(navigationId?: string): boolean {
    const state = navigationPersistenceManager.restoreState(navigationId)
    if (state) {
      // Restore navigation context state
      // Implementation would depend on context restoration
      return true
    }
    return false
  },

  /**
   * Configure navigation animations
   */
  configureAnimations(duration: number = 300, easing: string = 'ease-in-out'): void {
    navigationAnimationManager.configure(duration, easing)
  }
}