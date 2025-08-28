/**
 * Viewport Environment System
 *
 * Provides SwiftUI-style environment values for viewport operations.
 * Enables components to access viewport management through @Environment.
 */

import { createContext, useContext } from '../runtime/context'
import type { ComponentInstance } from '../runtime/types'
import type {
  ViewportEnvironment,
  ViewportEnvironmentValues,
  ViewportInstance,
  ViewportManager,
  WindowOptions,
} from './types'
import { getViewportManager } from './viewport-manager'

/**
 * Viewport environment context
 */
const ViewportEnvironmentContext = createContext<ViewportEnvironmentValues | null>(null)

/**
 * Provider component for viewport environment
 */
export function ViewportEnvironmentProvider({
  children,
  manager,
}: {
  children: ComponentInstance | ComponentInstance[]
  manager?: ViewportManager
}) {
  const viewportManager = manager || getViewportManager()

  const environmentValues: ViewportEnvironmentValues = {
    openWindow: async (id: string, component: ComponentInstance, options?: WindowOptions) => {
      return await viewportManager.openWindow(id, component, options)
    },

    dismissWindow: async (id: string) => {
      return await viewportManager.dismissWindow(id)
    },

    viewportEnvironment: viewportManager.environment,

    currentWindow: null, // This would be set based on current context
  }

  return {
    type: 'context-provider' as const,
    context: ViewportEnvironmentContext,
    value: environmentValues,
    children: Array.isArray(children) ? children : [children],
  }
}

/**
 * Hook to access viewport environment values
 */
export function useViewportEnvironment(): ViewportEnvironmentValues {
  const context = useContext(ViewportEnvironmentContext)

  if (!context) {
    throw new Error('useViewportEnvironment must be used within a ViewportEnvironmentProvider')
  }

  return context() as ViewportEnvironmentValues
}

/**
 * Hook for opening windows (SwiftUI-style @Environment(\.openWindow))
 */
export function useOpenWindow(): (
  id: string,
  component: ComponentInstance,
  options?: WindowOptions
) => Promise<ViewportInstance> {
  const { openWindow } = useViewportEnvironment()
  return openWindow
}

/**
 * Hook for dismissing windows (SwiftUI-style @Environment(\.dismissWindow))
 */
export function useDismissWindow(): (id: string) => Promise<void> {
  const { dismissWindow } = useViewportEnvironment()
  return dismissWindow
}

/**
 * Hook to get the viewport environment info
 */
export function useViewportInfo(): ViewportEnvironment {
  const { viewportEnvironment } = useViewportEnvironment()
  return viewportEnvironment
}

/**
 * Hook to get the current window (if any)
 */
export function useCurrentWindow(): ViewportInstance | null {
  const { currentWindow } = useViewportEnvironment()
  return currentWindow
}

/**
 * Hook to access the viewport manager directly
 */
export function useViewportManager(): ViewportManager {
  return getViewportManager()
}

/**
 * Higher-order component that provides viewport environment
 */
export function withViewportEnvironment<T>(
  Component: (props: T) => ComponentInstance,
  manager?: ViewportManager
) {
  return (props: T) => {
    return ViewportEnvironmentProvider({
      children: Component(props),
      manager,
    })
  }
}

/**
 * Utility to create a window-aware component
 */
export function createWindowAwareComponent<T>(
  Component: (
    props: T & {
      openWindow: ViewportEnvironmentValues['openWindow']
      dismissWindow: ViewportEnvironmentValues['dismissWindow']
      viewportEnvironment: ViewportEnvironment
    }
  ) => ComponentInstance
) {
  return (props: T) => {
    const openWindow = useOpenWindow()
    const dismissWindow = useDismissWindow()
    const viewportEnvironment = useViewportInfo()

    return Component({
      ...props,
      openWindow,
      dismissWindow,
      viewportEnvironment,
    })
  }
}

/**
 * Environment key constants (SwiftUI-style)
 */
export const EnvironmentKeys = {
  openWindow: 'openWindow' as const,
  dismissWindow: 'dismissWindow' as const,
  viewportEnvironment: 'viewportEnvironment' as const,
  currentWindow: 'currentWindow' as const,
}

/**
 * Type-safe environment value getter
 */
export function getEnvironmentValue<K extends keyof ViewportEnvironmentValues>(
  key: K
): ViewportEnvironmentValues[K] {
  const environment = useViewportEnvironment()
  return environment[key]
}
