/**
 * DOM Rendering Bridge Layer
 *
 * Critical missing piece that connects TachUI components to actual DOM rendering.
 * This bridges the gap between component instances and browser DOM elements.
 */

import type { ModifiableComponent } from '../modifiers/types'
import { createRoot as createReactiveRoot, getOwner } from '../reactive'
import {
  ComponentContextSymbol,
  createComponentContext,
  setCurrentComponentContext,
} from './component-context'
import { DOMRenderer } from './renderer'
import type { ComponentInstance } from './types'

/**
 * Global DOM renderer instance
 */
const globalRenderer = new DOMRenderer()

/**
 * Component mounting registry to track mounted components
 */
const mountedComponents = new Map<Element, ComponentInstance>()
const componentElements = new Map<ComponentInstance, Element[]>()

/**
 * Track component instances with lifecycle hooks for processing
 */
const componentsWithLifecycleHooks = new Set<ComponentInstance>()

/**
 * Register a component that has lifecycle hooks for later processing
 */
export function registerComponentWithLifecycleHooks(
  component: ComponentInstance
): void {
  if ((component as any)._enhancedLifecycle) {
    componentsWithLifecycleHooks.add(component)
  }
}

/**
 * Process pending lifecycle hooks for components that were rendered but not mounted
 */
function processPendingLifecycleHooks(): void {
  for (const component of componentsWithLifecycleHooks) {
    const enhancedLifecycle = (component as any)._enhancedLifecycle
    if (enhancedLifecycle && !component.domReady) {
      // Find DOM elements associated with this component by searching the DOM
      const elements = findDOMElementsForComponent(component)
      if (elements.length > 0) {
        // Set up DOM tracking
        component.domElements = new Map()
        elements.forEach((element, index) => {
          const key = element.id || `element-${index}`
          component.domElements!.set(key, element)
          if (!component.primaryElement) {
            component.primaryElement = element
          }
        })

        component.domReady = true

        // Process lifecycle hooks
        if (enhancedLifecycle.onDOMReady) {
          const cleanup = enhancedLifecycle.onDOMReady(
            component.domElements,
            component.primaryElement
          )
          if (typeof cleanup === 'function') {
            component.cleanup = component.cleanup || []
            component.cleanup.push(cleanup)
          }
        }

        if (enhancedLifecycle.onMount) {
          const cleanup = enhancedLifecycle.onMount()
          if (typeof cleanup === 'function') {
            component.cleanup = component.cleanup || []
            component.cleanup.push(cleanup)
          }
        }
      }
    }
  }

  // Clear the set of processed components
  componentsWithLifecycleHooks.clear()
}

/**
 * Find DOM elements associated with a component by searching the DOM
 * This is a fallback method for components that were rendered but not mounted
 */
function findDOMElementsForComponent(component: ComponentInstance): Element[] {
  // First, check if component already has DOM elements from normal mounting
  const existingElements = componentElements.get(component)
  if (existingElements && existingElements.length > 0) {
    return existingElements
  }

  // Prefer exact DOM association by stable component id marker.
  const elementsWithComponentId = document.querySelectorAll(`[data-component-id="${component.id}"]`)
  if (elementsWithComponentId.length > 0) {
    return Array.from(elementsWithComponentId)
  }

  // No exact element association found - avoid heuristic element stealing.
  return []
}

/**
 * Create a reactive root that can mount component trees to DOM.
 *
 * This is the application-level mounting function for TachUI apps.
 * It creates a reactive context and mounts your component tree to the DOM.
 *
 * @param rootFunction - Function that returns the root component of your app
 *
 * @example
 * ```typescript
 * import { mountRoot } from '@tachui/core'
 * import { MyApp } from './MyApp'
 *
 * mountRoot(() => MyApp())
 * ```
 *
 * Note: This requires a DOM element with id="app" to exist.
 */
/**
 * Roots currently mounted by `mount()`, keyed on their container element, so
 * `unmount(target)` can find and dispose one without the caller holding on to
 * the returned dispose function.
 */
const mountedRoots = new Map<Element, () => void>()

/**
 * Resolve a mount target to an element.
 *
 * Accepts an element directly, or a CSS selector. The error names the selector
 * that missed — the previous behaviour was an undocumented throw referring to
 * `id="app"` regardless of what the caller asked for.
 */
function resolveMountTarget(target: Element | string): Element {
  if (typeof target !== 'string') return target

  if (typeof document === 'undefined') {
    throw new Error(
      `mount(): no DOM available to resolve "${target}". ` +
        'mount() requires a browser environment; use @tachui/ssr to render on the server.'
    )
  }

  const element = document.querySelector(target)
  if (!element) {
    throw new Error(
      `mount(): no element matches "${target}". ` +
        'Add it to your HTML (for the default, `<div id="app"></div>`) ' +
        'or pass a different target, e.g. mount(() => App(), "#root").'
    )
  }
  return element
}

/**
 * Mount an application into the DOM.
 *
 * This is the entry point for a tachUI app. The root is a thunk returning a
 * component instance — `() => App()`, not `App()` — so that component
 * construction happens inside the reactive root that owns it.
 *
 * @param rootFunction Returns the root component instance.
 * @param target Element or CSS selector to mount into. Defaults to `'#app'`.
 * @returns A dispose function that unmounts the app and tears down its
 *          reactive root. Safe to call more than once.
 *
 * @example
 * ```ts
 * import { mount } from '@tachui/core'
 * import { VStack, Text } from '@tachui/primitives'
 *
 * const dispose = mount(() => VStack([Text('Hello')]))
 * // later
 * dispose()
 * ```
 */
export function mount(
  rootFunction: () => ComponentInstance,
  target: Element | string = '#app'
): () => void {
  const container = resolveMountTarget(target)

  // Mounting over a live app disposes it first. Both mounts would otherwise
  // share the container — mountComponentTree clears it — leaving the previous
  // reactive root and its effects alive with no DOM and no way to reach them.
  mountedRoots.get(container)?.()

  let disposeRoot: (() => void) | undefined
  let disposeTree: (() => void) | undefined
  let resetContext: () => void = () => {}

  createReactiveRoot(dispose => {
    disposeRoot = dispose

    // Root component context so State() works throughout the app
    const rootContext = createComponentContext('root-app')
    setCurrentComponentContext(rootContext)

    // Also store context in the reactive owner so State() can find it
    const owner = getOwner()
    if (owner) {
      owner.context.set(ComponentContextSymbol, rootContext)
    }

    resetContext = () => {
      setCurrentComponentContext(null)
      if (owner) {
        owner.context.delete(ComponentContextSymbol)
      }
    }

    try {
      disposeTree = mountComponentTree(rootFunction(), container)
    } catch (error) {
      // Reset the ambient context AND tear down the root we just created —
      // effects and onCleanup callbacks registered before the throw would
      // otherwise outlive a mount that never completed.
      resetContext()
      dispose()
      throw error
    }

    // NOTE: deliberately returns nothing. createRoot hands its callback's
    // return value back to *its caller*; it is not a disposal hook. The
    // previous mountRoot returned a context-reset closure here and it was
    // silently never invoked. Disposal is driven from disposeApp below.
  })

  let disposed = false
  const disposeApp = () => {
    if (disposed) return
    disposed = true

    // Only clear the registry if it still points at this mount — a stale
    // disposer must not evict a newer app mounted at the same container.
    if (mountedRoots.get(container) === disposeApp) {
      mountedRoots.delete(container)
    }

    // Tree first (component cleanup and DOM removal), then the ambient
    // context, then the reactive root.
    disposeTree?.()
    resetContext()
    disposeRoot?.()
  }

  mountedRoots.set(container, disposeApp)
  return disposeApp
}

/**
 * Unmount the application mounted at `target`.
 *
 * Equivalent to calling the dispose function `mount()` returned. Provided for
 * callers that did not keep it.
 *
 * @param target Element or CSS selector. Defaults to `'#app'`.
 * @returns `true` if an app was mounted there and has now been unmounted.
 */
export function unmount(target: Element | string = '#app'): boolean {
  let container: Element
  try {
    container = resolveMountTarget(target)
  } catch {
    return false
  }

  const disposeApp = mountedRoots.get(container)
  if (!disposeApp) return false

  disposeApp()
  return true
}

/**
 * Mount an application into `#app`.
 *
 * @deprecated Use {@link mount}, which takes a configurable target and returns
 * a dispose function. Retained so existing bootstraps keep working.
 */
export function mountRoot(rootFunction: () => ComponentInstance): void {
  mount(rootFunction, '#app')
}

/**
 * Mount a component tree to a DOM container
 */
export function mountComponentTree(
  component: ComponentInstance,
  container: Element,
  clearContainer: boolean = true
): () => void {
  try {
    // Clear container only if requested (typically only for root components)
    if (clearContainer) {
      container.innerHTML = ''
    }

    // Render component to DOM nodes - auto-build if it's a ModifierBuilder
    let componentToRender = component
    if ('build' in component && typeof component.build === 'function') {
      // This is a ModifierBuilder that hasn't been built yet - build it automatically
      componentToRender = component.build()
    }

    const domNodes = componentToRender.render()
    const nodeArray = Array.isArray(domNodes) ? domNodes : [domNodes]

    // Convert DOM nodes to actual DOM elements
    const elements: Element[] = []
    for (const node of nodeArray) {
      const element = globalRenderer.render(node, container)

      if (element instanceof DocumentFragment) {
        // Handle fragments by adding all child nodes
        const children = Array.from(element.childNodes)
        for (const child of children) {
          if (child instanceof Element) {
            elements.push(child)
            container.appendChild(child)
          }
        }
      } else if (element instanceof Element) {
        elements.push(element)
        container.appendChild(element)
      }
    }

    // ENHANCED: Set up DOM element tracking for lifecycle hooks
    if (elements.length > 0) {
      component.domElements = new Map()

      elements.forEach((element, index) => {
        const key = element.id || `element-${index}`
        component.domElements!.set(key, element)

        // Enhanced: Add component ID to DOM element for proper cleanup tracking
        if (element instanceof HTMLElement) {
          (element as any)._componentId = component.id
        }

        // Set primary element (first element with ID or index 0)
        if (!component.primaryElement) {
          component.primaryElement = element
        }
      })

      // Mark DOM as ready
      component.domReady = true

      // ENHANCED: Trigger onDOMReady with guaranteed DOM elements
      const enhancedLifecycle = (component as any)._enhancedLifecycle

      if (enhancedLifecycle?.onDOMReady) {
        const cleanup = enhancedLifecycle.onDOMReady(
          component.domElements,
          component.primaryElement
        )
        if (typeof cleanup === 'function') {
          component.cleanup = component.cleanup || []
          component.cleanup.push(cleanup)
        }
      }

      // Trigger legacy onMount for backwards compatibility
      if (enhancedLifecycle?.onMount) {
        const cleanup = enhancedLifecycle.onMount()
        if (typeof cleanup === 'function') {
          component.cleanup = component.cleanup || []
          component.cleanup.push(cleanup)
        }
      }
    }

    // ARCHITECTURAL FIX: Removed duplicate modifier application
    // Modifiers are now handled exclusively by the renderer during element creation
    // This eliminates the dangerous dual-system approach that was causing conflicts

    // Bind event handlers
    for (const element of elements) {
      bindEventHandlers(element, component)
    }

    // REMOVED: Recursive child mounting - children are rendered as part of parent's render() method
    // This was causing duplicate mounting where child components were being mounted individually
    // instead of being rendered as part of their parent's DOM structure
    const childCleanupFunctions: (() => void)[] = []

    // Register component
    mountedComponents.set(container, component)
    componentElements.set(component, elements)
    component.mounted = true

    // Process any pending lifecycle hooks for components that were rendered but not mounted
    // Execute synchronously to stay within the reactive update cycle
    processPendingLifecycleHooks()

    // Return cleanup function
    return () => {
      // Clean up child components first
      childCleanupFunctions.forEach(cleanup => cleanup())
      // Then clean up this component
      unmountComponentEnhanced(component, container)
    }
  } catch (error) {
    // ENHANCED: Better error handling with DOM context
    const domError = Object.assign(new Error(), error, {
      code: 'MOUNT_FAILED',
      context: 'mountComponentTree',
    }) as any

    const enhancedLifecycle = (component as any)._enhancedLifecycle
    if (enhancedLifecycle?.onDOMError) {
      enhancedLifecycle.onDOMError(domError, 'mount')
    } else if (enhancedLifecycle?.onError) {
      enhancedLifecycle.onError(domError)
    } else {
      console.error('Failed to mount component tree:', error)
    }
    throw error
  }
}

/**
 * Unmount a component from DOM
 */
export function unmountComponent(
  component: ComponentInstance,
  container: Element
): void {
  const elements = componentElements.get(component)
  if (elements) {
    elements.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element)
      }
    })
    componentElements.delete(component)
  }

  mountedComponents.delete(container)
  component.mounted = false

  // Run cleanup functions
  if (component.cleanup) {
    component.cleanup.forEach(cleanup => cleanup())
    component.cleanup = []
  }
}

/**
 * Enhanced unmount component with lifecycle hooks
 */
export function unmountComponentEnhanced(
  component: ComponentInstance,
  container: Element
): void {
  try {
    // Trigger onUnmount lifecycle
    const enhancedLifecycle = (component as any)._enhancedLifecycle
    if (enhancedLifecycle?.onUnmount) {
      enhancedLifecycle.onUnmount()
    }

    // Run cleanup functions
    if (component.cleanup) {
      component.cleanup.forEach(cleanup => {
        try {
          cleanup()
        } catch (error) {
          console.error(`Cleanup error for component ${component.id}:`, error)
        }
      })
      component.cleanup = []
    }

    // Remove DOM elements
    const elements = componentElements.get(component)
    if (elements) {
      elements.forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element)
        }
      })
      componentElements.delete(component)
    }

    // Clear enhanced DOM tracking
    if (component.domElements) {
      // Clean up component ID references from DOM elements
      for (const element of component.domElements.values()) {
        if (element instanceof HTMLElement) {
          delete (element as any)._componentId
        }
      }
      component.domElements.clear()
    }

    // Clear references
    component.primaryElement = undefined
    component.domReady = false
    component.mounted = false

    mountedComponents.delete(container)
  } catch (error) {
    const domError = Object.assign(new Error(), error, {
      code: 'UNMOUNT_FAILED',
      context: 'unmountComponentEnhanced',
    }) as any

    const enhancedLifecycle = (component as any)._enhancedLifecycle
    if (enhancedLifecycle?.onDOMError) {
      enhancedLifecycle.onDOMError(domError, 'unmount')
    } else {
      console.error('Component unmounting failed:', error)
    }
  }
}


/**
 * Bind component event handlers to DOM events
 */
function bindEventHandlers(
  element: Element,
  component: ComponentInstance
): void {
  const htmlElement = element as HTMLElement

  // Handle component-level events from props
  if (component.props) {
    const props = component.props

    // Bind common event handlers
    if (props.onClick && typeof props.onClick === 'function') {
      htmlElement.addEventListener('click', props.onClick)
    }

    if (props.onMouseEnter && typeof props.onMouseEnter === 'function') {
      htmlElement.addEventListener('mouseenter', props.onMouseEnter)
    }

    if (props.onMouseLeave && typeof props.onMouseLeave === 'function') {
      htmlElement.addEventListener('mouseleave', props.onMouseLeave)
    }

    if (props.onFocus && typeof props.onFocus === 'function') {
      htmlElement.addEventListener('focus', props.onFocus)
    }

    if (props.onBlur && typeof props.onBlur === 'function') {
      htmlElement.addEventListener('blur', props.onBlur)
    }
  }

  // Handle modifier-based events if this is a modifiable component
  if (isModifiableComponent(component) && component.modifiers) {
    for (const modifier of component.modifiers) {
      if (modifier && 'eventHandlers' in modifier && modifier.eventHandlers) {
        for (const [eventType, handler] of Object.entries(
          modifier.eventHandlers
        )) {
          if (typeof handler === 'function') {
            htmlElement.addEventListener(
              eventType as keyof HTMLElementEventMap,
              handler as EventListener
            )
          }
        }
      }
    }
  }
}

/**
 * Type guard to check if component is modifiable
 */
function isModifiableComponent(
  component: any
): component is ModifiableComponent<any> {
  return (
    component &&
    typeof component === 'object' &&
    ('modifiers' in component || 'modifier' in component)
  )
}

/**
 * Recursively mount component children
 */
export function mountComponentChildren(
  children: ComponentInstance[],
  container: Element
): (() => void)[] {
  const cleanupFunctions: (() => void)[] = []

  for (const child of children) {
    const childCleanup = mountComponentTree(child, container)
    cleanupFunctions.push(childCleanup)
  }

  return cleanupFunctions
}

/**
 * Update a mounted component with new props
 */
export function updateComponent(
  component: ComponentInstance,
  newProps: any
): void {
  const elements = componentElements.get(component)
  if (!elements) {
    console.warn('Attempted to update unmounted component')
    return
  }

  // Update props
  component.prevProps = component.props
  component.props = { ...component.props, ...newProps }

  // Re-render if needed
  const container = elements[0]?.parentElement
  if (container) {
    unmountComponent(component, container)
    mountComponentTree(component, container)
  }
}

/**
 * Get mounted component from DOM element
 */
export function getComponentFromElement(
  element: Element
): ComponentInstance | undefined {
  let current: Element | null = element
  while (current) {
    const component = mountedComponents.get(current)
    if (component) {
      return component
    }
    current = current.parentElement
  }
  return undefined
}

/**
 * Debug utilities for DOM bridge
 */
export interface DOMBridgeDebugAPI {
  getMountedComponents(): Array<[Element, ComponentInstance]>
  getComponentElements(component: ComponentInstance): Element[] | undefined
  isComponentMounted(component: ComponentInstance): boolean
  validateMounting(): { valid: boolean; issues: string[] }
}

export const DOMBridgeDebug: DOMBridgeDebugAPI = {
  getMountedComponents: (): Array<[Element, ComponentInstance]> =>
    Array.from(mountedComponents.entries()),
  getComponentElements: (component: ComponentInstance) =>
    componentElements.get(component),
  isComponentMounted: (component: ComponentInstance) =>
    component.mounted || false,

  /**
   * Validate that all components are properly mounted
   */
  validateMounting(): { valid: boolean; issues: string[] } {
    const issues: string[] = []

    for (const [container, component] of mountedComponents.entries()) {
      if (!document.contains(container)) {
        issues.push(`Container for component ${component.id} is not in DOM`)
      }

      if (!component.mounted) {
        issues.push(
          `Component ${component.id} marked as unmounted but still registered`
        )
      }

      const elements = componentElements.get(component)
      if (!elements || elements.length === 0) {
        issues.push(`Component ${component.id} has no associated DOM elements`)
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    }
  },
}
