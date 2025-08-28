/**
 * Component Management System (Phase 3.1.1)
 *
 * Core component lifecycle management including creation, mounting,
 * updating, and cleanup. Integrates with the reactive system to
 * provide efficient component updates.
 */

import { createEffect, onCleanup } from '../reactive'
import { createComponentContext } from './component-context'
import { ChildrenManager, PropsManager, propsUtils, RefManager } from './props'
import type {
  Component,
  ComponentChildren,
  ComponentContext,
  ComponentInstance,
  ComponentProps,
  DOMNode,
  LifecycleHooks,
  Ref,
  RenderFunction,
  ValidatedProps,
} from './types'

/**
 * Global component registry and lifecycle management
 */
export class ComponentManager {
  private static instance: ComponentManager
  private components = new Map<string, ComponentInstance>()
  private contexts = new Map<string, ComponentContext>()
  private cleanupQueue = new Set<() => void>()
  private updateQueue = new Set<string>()
  private isUpdating = false

  static getInstance(): ComponentManager {
    if (!ComponentManager.instance) {
      ComponentManager.instance = new ComponentManager()
    }
    return ComponentManager.instance
  }

  /**
   * Register a new component instance
   */
  registerComponent(instance: ComponentInstance): void {
    this.components.set(instance.id, instance)

    // Set up cleanup tracking
    if (instance.cleanup) {
      instance.cleanup.forEach((cleanup) => {
        this.cleanupQueue.add(cleanup)
      })
    }
  }

  /**
   * Unregister and cleanup a component
   */
  unregisterComponent(id: string): void {
    const instance = this.components.get(id)
    if (instance) {
      // Run cleanup functions
      if (instance.cleanup) {
        instance.cleanup.forEach((cleanup) => {
          try {
            cleanup()
          } catch (error) {
            console.error(`Cleanup error for component ${id}:`, error)
          }
        })
      }

      // Remove from registry
      this.components.delete(id)

      // Clean up context if exists
      if (instance.context) {
        this.cleanupContext(instance.context.id)
      }
    }
  }

  /**
   * Get component instance by ID
   */
  getComponent(id: string): ComponentInstance | undefined {
    return this.components.get(id)
  }

  /**
   * Schedule component for update
   */
  scheduleUpdate(id: string): void {
    this.updateQueue.add(id)

    if (!this.isUpdating) {
      this.flushUpdates()
    }
  }

  /**
   * Process all scheduled updates
   */
  private async flushUpdates(): Promise<void> {
    if (this.isUpdating) return

    this.isUpdating = true

    // Process updates in next microtask
    await new Promise((resolve) => queueMicrotask(() => resolve(undefined)))

    const toUpdate = Array.from(this.updateQueue)
    this.updateQueue.clear()

    toUpdate.forEach((id) => {
      const instance = this.components.get(id)
      if (instance) {
        try {
          this.updateComponent(instance)
        } catch (error) {
          console.error(`Update error for component ${id}:`, error)
        }
      }
    })

    this.isUpdating = false
  }

  /**
   * Update a specific component instance
   */
  private updateComponent(instance: ComponentInstance): void {
    // Store previous props for comparison
    if (instance.props) {
      instance.prevProps = { ...instance.props }
    }

    // Re-render the component
    instance.render()

    // Mark as mounted after first render
    if (!instance.mounted) {
      instance.mounted = true
    }

    // The actual DOM update will be handled by the reactive system
    // This just triggers the re-render process
  }

  /**
   * Cleanup context by ID
   */
  private cleanupContext(contextId: string): void {
    const context = this.contexts.get(contextId)
    if (context) {
      // Run all cleanup functions
      context.cleanup.forEach((cleanup) => {
        try {
          cleanup()
        } catch (error) {
          console.error(`Context cleanup error for ${contextId}:`, error)
        }
      })

      this.contexts.delete(contextId)
    }
  }

  /**
   * Get all registered components (for debugging)
   */
  getAllComponents(): ComponentInstance[] {
    return Array.from(this.components.values())
  }

  /**
   * Cleanup all components and resources
   */
  cleanup(): void {
    // Cleanup all components
    Array.from(this.components.keys()).forEach((id) => {
      this.unregisterComponent(id)
    })

    // Run remaining cleanup functions
    this.cleanupQueue.forEach((cleanup) => {
      try {
        cleanup()
      } catch (error) {
        console.error('Global cleanup error:', error)
      }
    })

    this.cleanupQueue.clear()
    this.updateQueue.clear()
  }
}

/**
 * Create a new component with enhanced props and children handling
 */
export function createComponent<P extends ComponentProps = ComponentProps>(
  render: (props: P, children?: ComponentChildren) => DOMNode | DOMNode[],
  options: {
    displayName?: string
    defaultProps?: Partial<P>
    lifecycle?: LifecycleHooks<P>
    validation?: ValidatedProps<P>
    shouldUpdate?: (prevProps: P, nextProps: P) => boolean
  } = {}
): Component<P> {
  const component: Component<P> = (props: P) => {
    const componentId = generateComponentId()
    const manager = ComponentManager.getInstance()
    const cleanup: (() => void)[] = []

    // Create component context
    const context = createComponentContext(componentId)

    // Create props manager with validation
    const propsManager = new PropsManager(props, {
      defaults: options.defaultProps || undefined,
      ...options.validation,
    })

    // Create children manager
    const childrenManager = new ChildrenManager(props.children)

    // Create ref manager for component references
    const refManager = new RefManager()

    // Track previous props for lifecycle hooks
    let previousProps: P | undefined
    let mounted = false

    // Create render function with reactive context
    const renderFunction: RenderFunction = () => {
      // Set up lifecycle hooks
      if (options.lifecycle?.onMount && !mounted) {
        const mountCleanup = options.lifecycle.onMount()
        if (typeof mountCleanup === 'function') {
          cleanup.push(mountCleanup)
        }
        mounted = true
      }

      // Set up props change tracking
      createEffect(() => {
        const currentProps = propsManager.getProps()

        if (previousProps && options.lifecycle?.onPropsChange) {
          const changedKeys = propsUtils.compareProps(previousProps, currentProps)
          if (changedKeys.length > 0) {
            options.lifecycle.onPropsChange(previousProps, currentProps, changedKeys)
          }
        }

        if (previousProps && options.lifecycle?.onUpdate) {
          options.lifecycle.onUpdate(previousProps, currentProps)
        }

        previousProps = { ...currentProps }
      })

      // Set up children change tracking
      createEffect(() => {
        const currentChildren = childrenManager.getChildren()
        if (options.lifecycle?.onChildrenChange && previousProps) {
          options.lifecycle.onChildrenChange(previousProps.children, currentChildren)
        }
      })

      // Set up onCleanup for unmount
      onCleanup(() => {
        if (options.lifecycle?.onUnmount) {
          options.lifecycle.onUnmount()
        }

        // Run all cleanup functions
        cleanup.forEach((fn) => fn())

        // Unregister component
        manager.unregisterComponent(componentId)
      })

      // Render the component
      try {
        if (options.lifecycle?.onRender) {
          options.lifecycle.onRender()
        }

        const currentProps = propsManager.getProps()
        const currentChildren = childrenManager.getChildren()

        // Check shouldUpdate if provided
        if (previousProps && options.shouldUpdate) {
          if (!options.shouldUpdate(previousProps, currentProps)) {
            // Skip render if shouldUpdate returns false
            return []
          }
        }

        return render(currentProps, currentChildren)
      } catch (error) {
        if (options.lifecycle?.onError) {
          options.lifecycle.onError(error as Error)
        }
        throw error
      }
    }

    // Create component instance
    const instance: ComponentInstance<P> = {
      type: 'component',
      render: renderFunction,
      props: propsManager.getProps(),
      children: childrenManager.getChildren(),
      context,
      cleanup,
      id: componentId,
      ref: props.ref,
      mounted: false,
    }

    // Apply ref if provided
    if (props.ref) {
      RefManager.applyRef(props.ref, refManager.getRef())
    }

    // Register with manager
    manager.registerComponent(instance)

    return instance
  }

  // Set component metadata
  if (options.displayName) {
    component.displayName = options.displayName
  }

  if (options.defaultProps) {
    component.defaultProps = options.defaultProps
  }

  return component
}

/**
 * Generate unique component ID
 */
function generateComponentId(): string {
  return `component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Higher-order component for adding lifecycle hooks
 */
export function withLifecycle<P extends ComponentProps>(
  component: Component<P>,
  hooks: LifecycleHooks<P>
): Component<P> {
  const wrappedComponent: Component<P> = (props: P) => {
    const instance = component(props)

    // Merge lifecycle hooks
    const existingCleanup = instance.cleanup || []
    const newCleanup: (() => void)[] = []

    if (hooks.onMount) {
      const mountCleanup = hooks.onMount()
      if (typeof mountCleanup === 'function') {
        newCleanup.push(mountCleanup)
      }
    }

    if (hooks.onUnmount) {
      newCleanup.push(hooks.onUnmount)
    }

    return {
      ...instance,
      cleanup: [...existingCleanup, ...newCleanup],
    }
  }

  wrappedComponent.displayName = `withLifecycle(${component.displayName || 'Component'})`
  return wrappedComponent
}

/**
 * Create a reactive component that updates when props change
 */
export function createReactiveComponent<P extends ComponentProps>(
  render: (props: P, children?: ComponentChildren) => DOMNode | DOMNode[]
): Component<P> {
  return createComponent(render, {
    shouldUpdate: (prevProps, nextProps) => {
      // Always update for reactive components
      return !propsUtils.shallowEqual(prevProps, nextProps)
    },
  })
}

/**
 * Component error boundary
 */
export function createErrorBoundary<P extends ComponentProps>(
  fallback: (error: Error) => DOMNode | DOMNode[]
): Component<P & { children: ComponentChildren }> {
  return createComponent(
    (props, children) => {
      const childrenManager = new ChildrenManager(children || props.children)

      try {
        return childrenManager.renderChildren()
      } catch (error) {
        console.error('Component error caught by boundary:', error)
        return fallback(error as Error)
      }
    },
    {
      displayName: 'ErrorBoundary',
      lifecycle: {
        onError: (error: Error) => {
          console.error('Error boundary caught error:', error)
        },
      },
    }
  )
}

/**
 * Create a component with advanced props handling
 */
export function createAdvancedComponent<P extends ComponentProps>(
  render: (
    props: P,
    children: ComponentChildren,
    helpers: {
      propsManager: PropsManager<P>
      childrenManager: ChildrenManager
      refManager: RefManager
    }
  ) => DOMNode | DOMNode[],
  options: {
    displayName?: string
    defaultProps?: Partial<P>
    validation?: ValidatedProps<P>
    lifecycle?: LifecycleHooks<P>
    shouldUpdate?: (prevProps: P, nextProps: P) => boolean
  } = {}
): Component<P> {
  return createComponent((props, children) => {
    const propsManager = new PropsManager(props, options.validation)
    const childrenManager = new ChildrenManager(children || props.children)
    const refManager = new RefManager()

    return render(props, children || props.children, {
      propsManager,
      childrenManager,
      refManager,
    })
  }, options)
}

/**
 * Create fragment component for multiple children
 */
export function createFragment(children: ComponentChildren[]): ComponentInstance {
  const childrenManager = new ChildrenManager(children)

  return {
    type: 'component',
    render: () => childrenManager.renderChildren(),
    props: { children },
    children,
    id: generateComponentId(),
  }
}

/**
 * Create ref object
 */
export function createRef<T = any>(initialValue: T | null = null): { current: T | null } {
  return RefManager.createRef(initialValue)
}

/**
 * Forward ref to child component
 */
export function forwardRef<T, P extends ComponentProps>(
  render: (props: P, ref: Ref<T> | undefined) => DOMNode | DOMNode[]
): Component<P & { ref?: Ref<T> }> {
  return createComponent<P & { ref?: Ref<T> }>((props) => {
    const { ref, ...restProps } = props
    return render(restProps as P, ref || undefined)
  })
}
