/**
 * Navigation Environment System
 *
 * Implements SwiftUI-style environment-based navigation state management
 * for automatic context sharing and navigation coordination.
 */

import type { ComponentInstance } from '@tachui/core'
import { createSignal } from '@tachui/core'
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
  return navigationEnvironment.getContext()
}

/**
 * Get the current navigation router from environment
 */
export function useNavigationEnvironmentRouter(): NavigationRouter | null {
  return navigationEnvironment.getRouter()
}

/**
 * Subscribe to navigation environment changes
 */
export function useNavigationEnvironmentState(): [
  () => NavigationEnvironmentState,
  (listener: (state: NavigationEnvironmentState) => void) => () => void,
] {
  const [state, setState] = createSignal(navigationEnvironment.currentState)

  const subscribe = (listener: (state: NavigationEnvironmentState) => void) => {
    return navigationEnvironment.subscribe(newState => {
      setState(newState)
      listener(newState)
    })
  }

  return [state, subscribe]
}

/**
 * Navigation environment provider component
 *
 * This would ideally integrate with TachUI's environment system,
 * but for now provides a wrapper that ensures child components
 * have access to the navigation context.
 */
export function NavigationEnvironmentProvider(
  children: ComponentInstance[],
  context: NavigationContext
): ComponentInstance {
  // Set the context when this provider is active
  _setNavigationEnvironmentContext(context)

  // Create a wrapper component that provides the environment
  const provider = {
    id: `nav-env-${Date.now()}`,
    type: 'component',
    props: {
      navigationContext: context,
      _environmentProvider: true,
    },
    children,
    render: () => ({
      type: 'div',
      props: { children },
      children: [],
    }),

    // Cleanup when provider is unmounted
    _cleanup: () => {
      _setNavigationEnvironmentContext(null)
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
  context: NavigationContext
): ComponentInstance {
  // Store the navigation context on the component
  ;(component as any)._navigationEnvironment = {
    context,
    router: createNavigationRouter(context),
    provided: true,
  }

  // Set as current context when this component is active
  _setNavigationEnvironmentContext(context)

  return component
}

/**
 * Check if a component provides navigation environment
 */
export function hasNavigationEnvironment(component: any): boolean {
  return !!(component && component._navigationEnvironment?.provided)
}

/**
 * Get navigation environment from a component
 */
export function getNavigationEnvironment(component: any): {
  context: NavigationContext
  router: NavigationRouter
} | null {
  const env = component?._navigationEnvironment
  return env?.provided ? { context: env.context, router: env.router } : null
}

/**
 * Clear all navigation environment state
 */
export function clearNavigationEnvironment(): void {
  navigationEnvironment.clear()
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
      if (hasNavigationEnvironment(current)) {
        return getNavigationEnvironment(current)?.context || null
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
