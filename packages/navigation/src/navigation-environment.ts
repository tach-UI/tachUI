/**
 * Navigation Environment System
 *
 * Implements SwiftUI-style environment-based navigation state management
 * for automatic context sharing and navigation coordination.
 */

import type { ComponentInstance } from '@tachui/core'
import type { NavigationContext, NavigationRouter } from './types'
import { createNavigationRouter } from './navigation-router'

/**
 * Navigation environment state
 */
interface NavigationEnvironmentState {
  context: NavigationContext | null
  router: NavigationRouter | null
  stackId: string | null
}

/**
 * Global navigation environment store
 * TODO: Replace with proper TachUI environment system when available
 */
class NavigationEnvironmentStore {
  private _currentState: NavigationEnvironmentState = {
    context: null,
    router: null,
    stackId: null,
  }

  private _listeners: Set<(state: NavigationEnvironmentState) => void> =
    new Set()
  private _contextStack: NavigationContext[] = []

  /**
   * Get the current navigation state
   */
  get currentState(): NavigationEnvironmentState {
    return { ...this._currentState }
  }

  /**
   * Set the current navigation context
   */
  setContext(context: NavigationContext | null): void {
    if (context) {
      // Push new context onto stack
      this._contextStack.push(context)
    } else if (this._contextStack.length > 0) {
      // Pop current context from stack
      this._contextStack.pop()
    }

    // Update current state to the top of the stack
    const currentContext =
      this._contextStack[this._contextStack.length - 1] || null

    this._currentState = {
      context: currentContext,
      router: currentContext ? createNavigationRouter(currentContext) : null,
      stackId: currentContext?.navigationId || null,
    }

    this._notifyListeners()
  }

  /**
   * Get the current navigation context
   */
  getContext(): NavigationContext | null {
    return this._currentState.context
  }

  /**
   * Get the current navigation router
   */
  getRouter(): NavigationRouter | null {
    return this._currentState.router
  }

  /**
   * Subscribe to navigation state changes
   */
  subscribe(listener: (state: NavigationEnvironmentState) => void): () => void {
    this._listeners.add(listener)
    return () => {
      this._listeners.delete(listener)
    }
  }

  /**
   * Clear all navigation state
   */
  clear(): void {
    this._contextStack = []
    this._currentState = {
      context: null,
      router: null,
      stackId: null,
    }
    this._notifyListeners()
  }

  /**
   * Get debug information
   */
  getDebugInfo(): any {
    return {
      currentStackId: this._currentState.stackId,
      stackDepth: this._contextStack.length,
      hasContext: !!this._currentState.context,
      hasRouter: !!this._currentState.router,
      contextStack: this._contextStack.map(ctx => ({
        id: ctx.navigationId,
        currentPath: ctx.currentPath,
        stackSize: ctx.stack.length,
      })),
    }
  }

  /**
   * Notify all listeners of state changes
   */
  private _notifyListeners(): void {
    const state = this.currentState
    this._listeners.forEach(listener => {
      try {
        listener(state)
      } catch (error) {
        console.error('Navigation environment listener error:', error)
      }
    })
  }
}

// Global instance
const navigationEnvironment = new NavigationEnvironmentStore()

/**
 * Set the current navigation context (internal use)
 * @internal
 */
export function _setNavigationEnvironmentContext(
  context: NavigationContext | null
): void {
  navigationEnvironment.setContext(context)
}

/**
 * Get the current navigation context from environment
 */
export function useNavigationEnvironmentContext(): NavigationContext | null {
  const env = (globalThis as any).__navigationEnvironment
  return env?.context || null
}

/**
 * Get the current navigation router from environment
 */
export function useNavigationEnvironmentRouter(): NavigationRouter | null {
  const env = (globalThis as any).__navigationEnvironment
  return env?.router || null
}

/**
 * Subscribe to navigation environment changes
 */
export function useNavigationEnvironmentState():
  | {
      canGoBack: boolean
      canGoForward: boolean
      currentPath: string
    }
  | undefined {
  const env = (globalThis as any).__navigationEnvironment
  if (!env || !env.context) {
    return undefined
  }

  return {
    canGoBack: env.context.canGoBack || false,
    canGoForward: env.context.canGoForward || false,
    currentPath: env.context.currentPath || '/',
  }
}

/**
 * Navigation environment provider component
 *
 * This would ideally integrate with TachUI's environment system,
 * but for now provides a wrapper that ensures child components
 * have access to the navigation context.
 */
export function NavigationEnvironmentProvider({
  children,
  context,
  router,
}: {
  children?: ComponentInstance[]
  context?: NavigationContext
  router?: NavigationRouter
}): ComponentInstance {
  // Set the environment when this provider is active
  if (context || router) {
    ;(globalThis as any).__navigationEnvironment = {
      context: context || null,
      router: router || null,
    }
  }

  // Create a wrapper component that provides the environment
  const provider = {
    id: `nav-env-${Date.now()}`,
    type: 'component',
    props: {
      navigationContext: context,
      navigationRouter: router,
      _environmentProvider: true,
    },
    children: children || [],
    render: () => ({
      type: 'div',
      props: { children: children || [] },
      children: [],
    }),

    // Cleanup when provider is unmounted
    _cleanup: () => {
      delete (globalThis as any).__navigationEnvironment
    },
  }

  return provider as any
}

/**
 * Navigation environment modifier
 *
 * Adds navigation environment capabilities to any component
 */
export function withNavigationEnvironment(
  component: ComponentInstance,
  environment: {
    context?: NavigationContext
    router?: NavigationRouter
  }
): ComponentInstance {
  if (!component) {
    return component
  }

  // Store the navigation environment on the component
  ;(component as any)._navigationEnvironment = {
    context: environment.context || null,
    router: environment.router || null,
    provided: true,
  }

  // Set as current global environment
  ;(globalThis as any).__navigationEnvironment = {
    context: environment.context || null,
    router: environment.router || null,
  }

  return component
}

/**
 * Check if navigation environment exists
 */
export function hasNavigationEnvironment(): boolean {
  return !!(globalThis as any).__navigationEnvironment
}

/**
 * Get navigation environment
 */
export function getNavigationEnvironment(): {
  context: NavigationContext | null
  router: NavigationRouter | null
} | null {
  const env = (globalThis as any).__navigationEnvironment
  return env || null
}

/**
 * Clear all navigation environment state
 */
export function clearNavigationEnvironment(): void {
  navigationEnvironment.clear()
  delete (globalThis as any).__navigationEnvironment
}

/**
 * Get navigation environment debug information
 */
export function getNavigationEnvironmentDebugInfo(): any {
  return navigationEnvironment.getDebugInfo()
}

/**
 * Navigation environment utilities
 */
export const NavigationEnvironmentUtils = {
  /**
   * Find the nearest navigation environment in component tree
   */
  findNearestEnvironment(component: any): NavigationContext | null {
    // Walk up the component tree looking for navigation environment
    let current = component
    while (current) {
      if (current && current._navigationEnvironment) {
        return current._navigationEnvironment.context || null
      }
      current = current.parent || current._parent
    }

    // Fall back to global environment
    return useNavigationEnvironmentContext()
  },

  /**
   * Create a navigation environment scope
   */
  createScope(context: NavigationContext): {
    enter: () => void
    exit: () => void
    context: NavigationContext
  } {
    return {
      context,
      enter: () => _setNavigationEnvironmentContext(context),
      exit: () => _setNavigationEnvironmentContext(null),
    }
  },

  /**
   * Wrap a function with navigation environment context
   */
  withEnvironment<T extends any[], R>(
    context: NavigationContext,
    fn: (...args: T) => R
  ): (...args: T) => R {
    return (...args: T): R => {
      const scope = NavigationEnvironmentUtils.createScope(context)
      scope.enter()
      try {
        return fn(...args)
      } finally {
        scope.exit()
      }
    }
  },
}
