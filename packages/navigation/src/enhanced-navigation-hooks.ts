/**
 * Enhanced Navigation Hooks
 *
 * Implements SwiftUI-style navigation hooks with automatic state sharing,
 * environment integration, and reactive updates.
 */

// import type { ComponentInstance } from '@tachui/core'
import { createSignal, createEffect, HTML } from '@tachui/core'
import {
  useNavigationEnvironmentContext,
  useNavigationEnvironmentRouter,
} from './navigation-environment'
import { getCurrentNavigationModifiers, onNavigationModifierChange } from './navigation-modifiers'
import type { NavigationContext, NavigationRouter, NavigationDestination } from './types'

/**
 * Enhanced navigation state interface
 */
export interface EnhancedNavigationState {
  readonly canGoBack: boolean
  readonly canGoForward: boolean
  readonly currentPath: string
  readonly stackSize: number
  readonly isNavigating: boolean
}

/**
 * Navigation actions interface matching SwiftUI patterns
 */
export interface NavigationActions {
  push: (destination: NavigationDestination, animated?: boolean) => void
  pop: (animated?: boolean) => void
  popToRoot: (animated?: boolean) => void
  replace: (destination: NavigationDestination, animated?: boolean) => void
  dismiss: () => void
}

/**
 * Enhanced useNavigation hook matching SwiftUI patterns
 *
 * @returns Navigation actions and state matching SwiftUI's navigation patterns
 *
 * @example
 * ```typescript
 * const navigation = useNavigation()
 *
 * // SwiftUI-style navigation actions
 * navigation.push(UserDetailView({ userId: '123' }))
 * navigation.pop()
 * navigation.popToRoot()
 *
 * // Reactive navigation state
 * const canGoBack = navigation.state.canGoBack
 * ```
 */
export function useNavigation(): NavigationActions & { state: EnhancedNavigationState } {
  // Get navigation context from environment
  const context = useNavigationEnvironmentContext()
  // const router = useNavigationEnvironmentRouter()

  // Internal navigation state
  const [isNavigating, setIsNavigating] = createSignal(false)

  // Create enhanced navigation state
  const createNavigationState = (): EnhancedNavigationState => {
    if (!context) {
      return {
        canGoBack: false,
        canGoForward: false,
        currentPath: '/',
        stackSize: 0,
        isNavigating: isNavigating()
      }
    }

    return {
      canGoBack: context.canGoBack,
      canGoForward: context.canGoForward,
      currentPath: context.currentPath,
      stackSize: context.stack.length,
      isNavigating: isNavigating()
    }
  }

  const [navigationState, setNavigationState] = createSignal(createNavigationState())

  // Update navigation state when context changes
  if (context) {
    // Listen for navigation context changes
    // This would ideally use context's change listener
    const updateState = () => {
      setNavigationState(createNavigationState())
    }

    // Update on context changes (simplified - would need proper listener)
    createEffect(() => {
      updateState()
    })
  }

  // Navigation actions
  const navigationActions: NavigationActions = {
    push: (destination: NavigationDestination, animated: boolean = true) => {
      if (!context) {
        console.warn('useNavigation: No navigation context available')
        return
      }

      if (animated) {
        setIsNavigating(true)
      }

      const path = `/${Date.now()}`
      context.push(destination, path, 'Details')

      if (animated) {
        // Reset navigation state after animation
        setTimeout(() => {
          setIsNavigating(false)
          setNavigationState(createNavigationState())
        }, 300)
      } else {
        setNavigationState(createNavigationState())
      }
    },

    pop: (animated: boolean = true) => {
      if (!context || !context.canGoBack) {
        console.warn('useNavigation: Cannot go back')
        return
      }

      if (animated) {
        setIsNavigating(true)
      }

      context.pop()

      if (animated) {
        setTimeout(() => {
          setIsNavigating(false)
          setNavigationState(createNavigationState())
        }, 300)
      } else {
        setNavigationState(createNavigationState())
      }
    },

    popToRoot: (animated: boolean = true) => {
      if (!context) {
        console.warn('useNavigation: No navigation context available')
        return
      }

      if (animated) {
        setIsNavigating(true)
      }

      context.popToRoot()

      if (animated) {
        setTimeout(() => {
          setIsNavigating(false)
          setNavigationState(createNavigationState())
        }, 300)
      } else {
        setNavigationState(createNavigationState())
      }
    },

    replace: (destination: NavigationDestination, animated: boolean = true) => {
      if (!context) {
        console.warn('useNavigation: No navigation context available')
        return
      }

      if (animated) {
        setIsNavigating(true)
      }

      const path = `/${Date.now()}`
      context.replace(destination, path, 'Details')

      if (animated) {
        setTimeout(() => {
          setIsNavigating(false)
          setNavigationState(createNavigationState())
        }, 300)
      } else {
        setNavigationState(createNavigationState())
      }
    },

    dismiss: () => {
      // For modal/sheet dismissal - simplified implementation
      if (context && context.canGoBack) {
        context.pop()
      }
    }
  }

  return {
    ...navigationActions,
    state: navigationState()
  }
}

/**
 * useNavigationState hook for reactive navigation state
 *
 * @returns Reactive navigation state
 */
export function useNavigationState(): EnhancedNavigationState {
  const { state } = useNavigation()
  return state
}

/**
 * useNavigationContext hook for direct context access
 *
 * @returns Navigation context or null if not in navigation view
 */
export function useNavigationContext(): NavigationContext | null {
  return useNavigationEnvironmentContext()
}

/**
 * useNavigationRouter hook for router access
 *
 * @returns Navigation router or null if not in navigation view
 */
export function useNavigationRouter(): NavigationRouter | null {
  return useNavigationEnvironmentRouter()
}

/**
 * useNavigationBar hook for navigation bar customization
 *
 * @returns Navigation bar configuration and update functions
 */
export function useNavigationBar(): {
  configuration: any
  setTitle: (title: string) => void
  setTitleDisplayMode: (mode: 'automatic' | 'inline' | 'large') => void
  setBackButtonHidden: (hidden: boolean) => void
  setBackButtonTitle: (title: string) => void
  setBarHidden: (hidden: boolean) => void
} {
  const [configuration, setConfiguration] = createSignal(getCurrentNavigationModifiers())

  // Listen for navigation modifier changes
  const _unsubscribe = onNavigationModifierChange((config) => {
    setConfiguration({ ...config })
  })

  // Cleanup listener (would need proper lifecycle management)
  // This is simplified - in real implementation would use proper cleanup

  return {
    configuration: configuration(),
    setTitle: (title: string) => {
      // Would update navigation context with new title
      const context = useNavigationEnvironmentContext()
      if (context) {
        ;(context as any).setTitle?.(title)
      }
    },
    setTitleDisplayMode: (mode: 'automatic' | 'inline' | 'large') => {
      const context = useNavigationEnvironmentContext()
      if (context) {
        ;(context as any).setTitleDisplayMode?.(mode)
      }
    },
    setBackButtonHidden: (hidden: boolean) => {
      const context = useNavigationEnvironmentContext()
      if (context) {
        ;(context as any).setBackButtonHidden?.(hidden)
      }
    },
    setBackButtonTitle: (title: string) => {
      const context = useNavigationEnvironmentContext()
      if (context) {
        ;(context as any).setBackButtonTitle?.(title)
      }
    },
    setBarHidden: (hidden: boolean) => {
      const context = useNavigationEnvironmentContext()
      if (context) {
        ;(context as any).setBarHidden?.(hidden)
      }
    }
  }
}

/**
 * useNavigationAnimation hook for navigation animations
 *
 * @returns Animation utilities and state
 */
export function useNavigationAnimation(): {
  isAnimating: boolean
  startAnimation: () => void
  endAnimation: () => void
  withAnimation: <T>(action: () => T) => Promise<T>
} {
  const [isAnimating, setIsAnimating] = createSignal(false)

  return {
    isAnimating: isAnimating(),
    startAnimation: () => setIsAnimating(true),
    endAnimation: () => setIsAnimating(false),
    withAnimation: async <T>(action: () => T): Promise<T> => {
      setIsAnimating(true)
      try {
        const result = action()

        // Wait for animation duration
        await new Promise(resolve => setTimeout(resolve, 300))

        return result
      } finally {
        setIsAnimating(false)
      }
    }
  }
}

/**
 * useNavigationPath hook for programmatic path management
 *
 * @returns Path management utilities
 */
export function useNavigationPath(): {
  currentPath: string
  push: (segment: string) => void
  pop: () => void
  popTo: (segment: string) => void
  clear: () => void
} {
  const context = useNavigationEnvironmentContext()

  if (!context) {
    return {
      currentPath: '/',
      push: () => console.warn('useNavigationPath: No navigation context'),
      pop: () => console.warn('useNavigationPath: No navigation context'),
      popTo: () => console.warn('useNavigationPath: No navigation context'),
      clear: () => console.warn('useNavigationPath: No navigation context')
    }
  }

  return {
    currentPath: context.currentPath,
    push: (segment: string) => {
      // This would use NavigationPath to manage segments
      const destination = () => HTML.div({ children: `Segment: ${segment}` }).modifier.build()
      context.push(destination, `${context.currentPath}/${segment}`)
    },
    pop: () => context.pop(),
    popTo: (segment: string) => {
      // Find the path that contains the segment and pop to it
      const targetPath = `/${segment}`
      context.popTo(targetPath)
    },
    clear: () => context.popToRoot()
  }
}

/**
 * Navigation hook utilities
 */
export const NavigationHookUtils = {
  /**
   * Check if navigation is available
   */
  isNavigationAvailable(): boolean {
    return !!useNavigationEnvironmentContext()
  },

  /**
   * Get current navigation depth
   */
  getNavigationDepth(): number {
    const context = useNavigationEnvironmentContext()
    return context?.stack.length || 0
  },

  /**
   * Check if can perform navigation action
   */
  canNavigate(action: 'push' | 'pop' | 'popToRoot'): boolean {
    const context = useNavigationEnvironmentContext()
    if (!context) return false

    switch (action) {
      case 'push':
        return true // Can always push
      case 'pop':
        return context.canGoBack
      case 'popToRoot':
        return context.stack.length > 1
      default:
        return false
    }
  },

  /**
   * Create navigation action with validation
   */
  createSafeAction<T extends any[]>(
    action: (...args: T) => void,
    validator?: () => boolean
  ): (...args: T) => void {
    return (...args: T) => {
      if (validator && !validator()) {
        console.warn('Navigation action blocked by validator')
        return
      }

      if (!NavigationHookUtils.isNavigationAvailable()) {
        console.warn('Navigation not available')
        return
      }

      action(...args)
    }
  }
}

/**
 * Navigation hook for component cleanup
 */
export function useNavigationCleanup(): {
  onCleanup: (callback: () => void) => void
  cleanup: () => void
} {
  const cleanupCallbacks: (() => void)[] = []

  return {
    onCleanup: (callback: () => void) => {
      cleanupCallbacks.push(callback)
    },
    cleanup: () => {
      cleanupCallbacks.forEach(callback => {
        try {
          callback()
        } catch (error) {
          console.error('Navigation cleanup error:', error)
        }
      })
      cleanupCallbacks.length = 0
    }
  }
}
