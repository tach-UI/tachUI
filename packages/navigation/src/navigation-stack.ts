/**
 * NavigationStack Component Implementation
 *
 * Implements SwiftUI's NavigationStack component that provides path-based navigation
 * with automatic navigation management and programmatic control.
 */

import type { Binding, ComponentInstance } from '@tachui/core'
import { createEffect, createSignal, isBinding } from '@tachui/core'
import { HStack, HTML, Text, Button, VStack } from '@tachui/primitives'
import { _setCurrentNavigationContext } from './navigation-view'
import { _setNavigationEnvironmentContext } from './navigation-environment'
import { NavigationPath, createNavigationPath } from './navigation-path'
import type {
  NavigationContext,
  NavigationStackEntry,
  NavigationDestination,
  NavigationComponent,
} from './types'

/**
 * Navigation destination registry for type-safe routing
 */
interface NavigationDestinationRegistry {
  [key: string]: (value: any) => ComponentInstance
}

/**
 * NavigationStack context implementation
 */
class NavigationStackContext implements NavigationContext {
  private _stack: NavigationStackEntry[] = []
  private _currentPath = '/'
  private _destinationRegistry: NavigationDestinationRegistry = {}

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
    return false // Future implementation
  }

  /**
   * Register a navigation destination handler
   */
  registerDestination<T>(
    type: string,
    handler: (value: T) => ComponentInstance
  ): void {
    this._destinationRegistry[type] = handler
  }

  /**
   * Navigate to a destination using the registry
   */
  navigateToDestination(type: string, value: any): void {
    const handler = this._destinationRegistry[type]
    if (handler) {
      const component = handler(value)
      this.push(component, `/${type}/${value}`, `${type}`)
    }
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
 * NavigationStack options
 */
export interface NavigationStackOptions {
  path?: Binding<NavigationPath>
  navigationBarHidden?: boolean
  navigationTitle?: string
  onPathChange?: (path: NavigationPath) => void
}

/**
 * NavigationStack component factory
 *
 * SwiftUI API: NavigationStack(path: Binding<NavigationPath>) { RootView() }
 *
 * @param rootView - The root view component
 * @param options - Navigation stack configuration
 * @returns A NavigationStack component
 *
 * @example
 * ```typescript
 * const [navPath, setNavPath] = createSignal(createNavigationPath())
 *
 * NavigationStack(
 *   HomeView(),
 *   {
 *     path: createBinding(() => navPath(), setNavPath),
 *     navigationTitle: 'My App'
 *   }
 * )
 * ```
 */
export function NavigationStack(
  rootView: ComponentInstance,
  options: NavigationStackOptions = {}
): NavigationComponent {
  const navigationId = `nav-stack-${Date.now()}-${Math.random()}`

  // Navigation state
  const [navigationStack, setNavigationStack] = createSignal<
    NavigationStackEntry[]
  >([])
  const [isNavigating, setIsNavigating] = createSignal(false)
  const [currentTitle, setCurrentTitle] = createSignal(
    options?.navigationTitle || ''
  )

  // Path management
  const pathBinding = options.path
  let internalPath = createNavigationPath()

  // Create navigation context
  const navigationContext = new NavigationStackContext(navigationId, stack => {
    setNavigationStack(stack)

    // Update current title
    const currentEntry = stack[stack.length - 1]
    if (currentEntry?.title) {
      setCurrentTitle(currentEntry.title)
    }

    // Update path if binding provided
    if (pathBinding && isBinding(pathBinding)) {
      const newPathSegments = stack
        .slice(1)
        .map(
          entry => entry.path.replace(/^\//, '') // Remove leading slash
        )
        .filter(Boolean)

      internalPath = createNavigationPath(newPathSegments)
      pathBinding.set(internalPath)
    }

    // Call external handler
    if (options.onPathChange) {
      options.onPathChange(internalPath)
    }
  })

  // Set the root view
  navigationContext.setRoot(rootView, '/', options.navigationTitle)

  // Set this as the current navigation context (both old and new systems)
  _setCurrentNavigationContext(navigationContext)
  _setNavigationEnvironmentContext(navigationContext)

  // Handle path changes from external binding
  if (pathBinding && isBinding(pathBinding)) {
    createEffect(() => {
      const newPath = pathBinding.get()

      // Only update if path actually changed
      if (!newPath.equals(internalPath)) {
        // Clear current stack except root
        navigationContext.popToRoot()

        // Navigate to each segment in the new path
        newPath.segments.forEach((segment, index) => {
          // Try to resolve using registered destinations
          // For now, create a simple path-based destination
          const path = '/' + newPath.segments.slice(0, index + 1).join('/')
          navigationContext.push(
            () => Text(`Destination: ${segment}`).modifier.build(),
            path,
            segment
          )
        })

        internalPath = newPath.copy()
      }
    })
  }

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
          ? Button('← Back', () => {
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
          .modifier.fontSize(18)
          .fontWeight('bold')
          .foregroundColor('#1a1a1a')
          .textAlign('center')
          .build(),

        // Spacer for right side
        HTML.div().modifier.frame({ width: 100 }).build(),
      ],
      spacing: 12,
      alignment: 'center',
    })
      .modifier.padding({ top: 12, bottom: 12, left: 16, right: 16 })
      .backgroundColor('#f8f8f8')
      .border(1, '#e0e0e0')
      .build()
  }

  // Navigation content component
  const NavigationContent = () => {
    const stack = navigationStack()
    const currentEntry = stack[stack.length - 1]

    if (!currentEntry) {
      return HTML.div({
        children: [Text('No content').modifier.build()],
      }).modifier.build()
    }

    return HTML.div({
      children: [currentEntry.component],
    })
      .modifier.opacity(isNavigating() ? 0.8 : 1)
      .build()
  }

  // Main navigation stack component
  const navigationComponent: NavigationComponent = VStack({
    children: [NavigationBar(), NavigationContent()],
    spacing: 0,
    alignment: 'leading',
  })
    .modifier.frame({ minHeight: '100vh' })
    .backgroundColor('#ffffff')
    .build() as NavigationComponent

  // Add navigation context to component
  ;(navigationComponent as any).navigationContext = navigationContext
  ;(navigationComponent as any)._navigationStack = {
    type: 'NavigationStack',
    registerDestination:
      navigationContext.registerDestination.bind(navigationContext),
    navigateToDestination:
      navigationContext.navigateToDestination.bind(navigationContext),
  }

  // Set up cleanup
  const cleanup = () => {
    // Clear context if this was the current one
    if (_setCurrentNavigationContext) {
      _setCurrentNavigationContext(null)
    }
    _setNavigationEnvironmentContext(null)
  }

  // Store cleanup function
  ;(navigationComponent as any)._navigationCleanup = cleanup

  return navigationComponent
}

/**
 * NavigationDestination modifier for type-safe routing
 *
 * SwiftUI API: view.navigationDestination(for: UserID.self) { userID in UserDetailView(userID) }
 *
 * @param component - The component to add the modifier to
 * @param type - The type identifier for the destination
 * @param builder - Function that creates the destination component
 * @returns The component with the navigation destination modifier
 *
 * @example
 * ```typescript
 * const rootView = VStack([
 *   NavigationLink('View User', () => userNavigation('user-123')),
 *   NavigationLink('View Settings', () => settingsNavigation())
 * ]).navigationDestination('user', (userId: string) =>
 *   UserDetailView({ userId })
 * )
 * ```
 */
export function navigationDestination<T>(
  component: ComponentInstance,
  type: string,
  builder: (value: T) => ComponentInstance
): ComponentInstance {
  // Find the nearest NavigationStack and register the destination
  // For now, store the destination registration on the component
  ;(component as any)._navigationDestinations = {
    ...(component as any)._navigationDestinations,
    [type]: builder,
  }

  return component
}

/**
 * Helper to trigger navigation to a registered destination
 */
export function navigateToDestination(type: string, value: any): void {
  // This would be called from NavigationLink or programmatically
  // Implementation would find the current NavigationStack context
  // and call navigateToDestination on it

  // For now, this is a placeholder that would be enhanced with proper context lookup
  console.log(`Navigate to ${type} with value:`, value)
}

/**
 * Enhanced NavigationLink that works with NavigationStack destinations
 */
export function NavigationLinkForDestination<T>(
  label: ComponentInstance | string,
  destinationType: string,
  value: T,
  options: { tag?: string; disabled?: boolean; onTap?: () => void } = {}
): ComponentInstance {
  // Import NavigationLink from navigation-link.ts
  // Create a simple navigation link without requiring the module
  const simpleNavLink = HTML.div({
    children: [
      typeof label === 'string'
        ? HTML.span({ children: label }).modifier.build()
        : label,
    ],
  }).modifier.build()

  // Add navigation metadata
  ;(simpleNavLink as any)._navigationLink = {
    destinationType,
    value,
    options,
  }

  return simpleNavLink
}
