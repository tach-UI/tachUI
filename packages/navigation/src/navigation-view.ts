/**
 * NavigationView Component Implementation
 *
 * Implements SwiftUI's NavigationView component that provides a navigation stack
 * with automatic back button handling, navigation bar, and push/pop animations.
 */

import type { ComponentInstance } from '@tachui/core'
import { createSignal } from '@tachui/core'
import { Button, HStack, HTML, Text, VStack } from '@tachui/primitives'
import { NavigationManager } from './navigation-manager'
import { createNavigationRouter } from './navigation-router'
import { _setNavigationEnvironmentContext } from './navigation-environment'
import type {
  NavigationBarConfig,
  NavigationComponent,
  NavigationContext,
  NavigationDestination,
  NavigationRouter,
  NavigationStackEntry,
  NavigationViewOptions,
} from './types'

/**
 * Internal navigation context implementation
 */
class NavigationContextImpl implements NavigationContext {
  private _stack: NavigationStackEntry[] = []
  private _currentPath = '/'

  constructor(
    public readonly navigationId: string,
    private onStackChange?: (stack: NavigationStackEntry[]) => void
  ) {}

  get stack(): NavigationStackEntry[] {
    return [...this._stack]
  }

  get currentPath(): string {
    return this._currentPath
  }

  get canGoBack(): boolean {
    return this._stack.length > 1
  }

  get canGoForward(): boolean {
    // For future implementation of forward navigation
    return false
  }

  push(destination: NavigationDestination, path: string, title?: string): void {
    const component =
      typeof destination === 'function' ? destination() : destination

    const entry: NavigationStackEntry = {
      id: `nav-${Date.now()}-${Math.random()}`,
      path,
      component,
      title,
      timestamp: Date.now(),
    }

    this._stack.push(entry)
    this._currentPath = path

    if (this.onStackChange) {
      this.onStackChange([...this._stack])
    }
  }

  pop(): void {
    if (this._stack.length > 1) {
      this._stack.pop()
      const previousEntry = this._stack[this._stack.length - 1]
      this._currentPath = previousEntry?.path || '/'

      if (this.onStackChange) {
        this.onStackChange([...this._stack])
      }
    }
  }

  popToRoot(): void {
    if (this._stack.length > 1) {
      const rootEntry = this._stack[0]
      this._stack = [rootEntry]
      this._currentPath = rootEntry.path

      if (this.onStackChange) {
        this.onStackChange([...this._stack])
      }
    }
  }

  popTo(path: string): void {
    const targetIndex = this._stack.findIndex(entry => entry.path === path)
    if (targetIndex >= 0) {
      this._stack = this._stack.slice(0, targetIndex + 1)
      this._currentPath = path

      if (this.onStackChange) {
        this.onStackChange([...this._stack])
      }
    }
  }

  replace(
    destination: NavigationDestination,
    path: string,
    title?: string
  ): void {
    if (this._stack.length > 0) {
      const component =
        typeof destination === 'function' ? destination() : destination

      const entry: NavigationStackEntry = {
        id: `nav-${Date.now()}-${Math.random()}`,
        path,
        component,
        title,
        timestamp: Date.now(),
      }

      this._stack[this._stack.length - 1] = entry
      this._currentPath = path

      if (this.onStackChange) {
        this.onStackChange([...this._stack])
      }
    } else {
      this.push(destination, path, title)
    }
  }

  /**
   * Set the root component
   */
  setRoot(
    component: ComponentInstance,
    path: string = '/',
    title?: string
  ): void {
    const entry: NavigationStackEntry = {
      id: `nav-root-${Date.now()}`,
      path,
      component,
      title,
      timestamp: Date.now(),
    }

    this._stack = [entry]
    this._currentPath = path

    if (this.onStackChange) {
      this.onStackChange([...this._stack])
    }
  }
}

/**
 * NavigationView component factory
 *
 * Creates a navigation container that manages a stack of views with automatic
 * navigation bar, back button, and push/pop animations.
 *
 * @param rootView - The initial view to display
 * @param options - Configuration options for the navigation view
 * @returns A NavigationView component
 *
 * @example
 * ```typescript
 * const navigation = NavigationView(
 *   HomeScreen(),
 *   {
 *     navigationTitle: 'My App',
 *     navigationBarTitleDisplayMode: 'large'
 *   }
 * )
 * ```
 */
export function NavigationView(
  rootView: ComponentInstance,
  options: NavigationViewOptions = {}
): NavigationComponent {
  const navigationId = `nav-${Date.now()}-${Math.random()}`

  // Create navigation state
  const [navigationStack, setNavigationStack] = createSignal<
    NavigationStackEntry[]
  >([])
  const [isNavigating, setIsNavigating] = createSignal(false)
  const [currentTitle, setCurrentTitle] = createSignal(
    options.navigationTitle || ''
  )

  // Create navigation context
  const navigationContext = new NavigationContextImpl(navigationId, stack => {
    setNavigationStack(stack)

    // Update current title
    const currentEntry = stack[stack.length - 1]
    if (currentEntry?.title) {
      setCurrentTitle(currentEntry.title)
    }

    // Call external handler
    if (options.onNavigationChange) {
      options.onNavigationChange(navigationContext)
    }
  })

  // Set the root view
  navigationContext.setRoot(
    rootView,
    '/',
    typeof options.navigationTitle === 'string'
      ? options.navigationTitle
      : 'Home'
  )

  // Create navigation router
  const router = createNavigationRouter(navigationContext)

  // Register with navigation manager
  NavigationManager.getInstance().registerRouter(navigationId, router)

  // Navigation bar component
  const NavigationBar = () => {
    const stack = navigationStack()
    const canGoBack = stack.length > 1
    const title = currentTitle()

    if (options.navigationBarHidden) {
      return HTML.div().modifier.build()
    }

    return HStack({
      children: [
        // Back button
        canGoBack
          ? Button(options.backButtonTitle || '← Back', () => {
              setIsNavigating(true)
              navigationContext.pop()
              // Reset navigating state after animation
              setTimeout(() => {
                setIsNavigating(false)
              }, 300)
            })
              .modifier.backgroundColor('transparent')
              .foregroundColor('#007AFF')
              .padding({ top: 8, bottom: 8, left: 12, right: 12 })
              .fontSize(16)
              .build()
          : HTML.div().modifier.frame({ width: 100 }).build(),

        // Title
        Text(title)
          .modifier.fontSize(
            options.navigationBarTitleDisplayMode === 'large' ? 24 : 18
          )
          .fontWeight('bold')
          .foregroundColor('#1a1a1a')
          .build(),

        // Spacer for balance
        HTML.div().modifier.frame({ width: 100 }).build(),
      ],
      alignment: 'center',
    })
      .modifier.backgroundColor(options.toolbarBackground || '#f8f9fa')
      .border(1, '#e0e0e0')
      .padding({ top: 12, bottom: 12, left: 16, right: 16 })
      .frame({ height: 60 })
      .build()
  }

  // Content area with navigation animations
  const NavigationContent = () => {
    const stack = navigationStack()
    const currentEntry = stack[stack.length - 1]

    if (!currentEntry) {
      return Text('No content')
        .modifier.padding(20)
        .foregroundColor('#999')
        .build()
    }

    return HTML.div({
      children: [currentEntry.component],
    })
      .modifier.opacity(isNavigating() ? 0.8 : 1)
      .build()
  }

  // Main navigation view component
  const navigationComponent: NavigationComponent = VStack({
    children: [NavigationBar(), NavigationContent()],
    spacing: 0,
    alignment: 'leading',
  })
    .modifier.frame({ minHeight: '100vh' })
    .backgroundColor('#ffffff')
    .build() as NavigationComponent

  // Add navigation context and router to component
  ;(navigationComponent as any).navigationContext = navigationContext
  ;(navigationComponent as any).router = router

  // Set this as the current navigation context for child components (both systems)
  _setCurrentNavigationContext(navigationContext)
  _setNavigationEnvironmentContext(navigationContext)

  // Set up cleanup
  const cleanup = () => {
    NavigationManager.getInstance().unregisterRouter(navigationId)
    // Clear context if this was the current one
    if (_currentNavigationContext === navigationContext) {
      _setCurrentNavigationContext(null)
    }
    _setNavigationEnvironmentContext(null)
  }

  // Store cleanup function (would be called by component lifecycle)
  ;(navigationComponent as any)._navigationCleanup = cleanup

  return navigationComponent
}

// Global navigation context store (until proper environment system is implemented)
let _currentNavigationContext: NavigationContext | null = null

/**
 * Set the current navigation context (internal use)
 * @internal
 */
export function _setCurrentNavigationContext(
  context: NavigationContext | null
): void {
  _currentNavigationContext = context
}

/**
 * Get navigation context from current component tree
 *
 * @returns The current navigation context or null if not in navigation view
 */
export function useNavigationContext(): NavigationContext | null {
  // TODO: Replace with proper TachUI environment system when available
  // For now, use global context store
  return _currentNavigationContext
}

/**
 * Get navigation router from current component tree
 *
 * @returns The current navigation router or null if not in navigation view
 */
export function useNavigationRouter(): NavigationRouter | null {
  // TODO: Replace with proper TachUI environment system when available
  // For now, create router from current context
  const context = useNavigationContext()
  if (!context) return null

  return createNavigationRouter(context)
}

/**
 * Navigation bar configuration hook
 *
 * @param config - Navigation bar configuration
 */
export function useNavigationBar(config: NavigationBarConfig): void {
  // This would be implemented to configure the navigation bar from child components
  // For now, this is a placeholder
  console.log('Navigation bar config:', config)
}

/**
 * Programmatic navigation hook
 *
 * @returns Navigation functions
 */
export function useNavigation() {
  const context = useNavigationContext()
  const router = useNavigationRouter()

  return {
    push: (
      destination: NavigationDestination,
      path?: string,
      title?: string
    ) => {
      if (context) {
        context.push(destination, path || '/unknown', title)
      }
    },
    pop: () => {
      if (context) {
        context.pop()
      }
    },
    popToRoot: () => {
      if (context) {
        context.popToRoot()
      }
    },
    replace: (
      destination: NavigationDestination,
      path?: string,
      title?: string
    ) => {
      if (context) {
        context.replace(destination, path || '/unknown', title)
      }
    },
    navigate: (path: string, options?: { replace?: boolean }) => {
      if (router) {
        router.navigate(path, options)
      }
    },
    canGoBack: context?.canGoBack || false,
    currentPath: context?.currentPath || '/',
  }
}

/**
 * Create a navigation view with specific configuration
 *
 * @param config - Navigation configuration
 * @returns A configured NavigationView factory
 */
export function createNavigationView(config: NavigationViewOptions) {
  return (rootView: ComponentInstance) => NavigationView(rootView, config)
}

/**
 * Navigation view builder for declarative API
 */
export const NavigationViewBuilder = {
  /**
   * Create a navigation view with root content
   */
  root(content: ComponentInstance): NavigationComponent {
    return NavigationView(content)
  },

  /**
   * Set navigation title
   */
  navigationTitle(title: string) {
    return {
      root: (content: ComponentInstance) =>
        NavigationView(content, { navigationTitle: title }),
    }
  },

  /**
   * Configure navigation bar
   */
  navigationBarTitleDisplayMode(mode: 'automatic' | 'inline' | 'large') {
    return {
      root: (content: ComponentInstance) =>
        NavigationView(content, { navigationBarTitleDisplayMode: mode }),
    }
  },

  /**
   * Hide navigation bar
   */
  navigationBarHidden(hidden: boolean = true) {
    return {
      root: (content: ComponentInstance) =>
        NavigationView(content, { navigationBarHidden: hidden }),
    }
  },
}

/**
 * Type guard for NavigationComponent
 */
export function isNavigationComponent(
  component: unknown
): component is NavigationComponent {
  return Boolean(
    component &&
      typeof component === 'object' &&
      'navigationContext' in component &&
      'router' in component
  )
}
