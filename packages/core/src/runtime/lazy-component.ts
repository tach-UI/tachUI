/**
 * Lazy Component System
 *
 * Provides runtime component resolution with dynamic imports for
 * true component-level lazy loading.
 */

// No reactive imports needed - using simple state management to avoid memory leaks
import type { ComponentInstance, DOMNode } from './types'

export interface LazyComponentOptions {
  /** Fallback to show while loading */
  fallback?: DOMNode
  /** Error fallback when import fails */
  errorFallback?: (error: Error) => DOMNode
  /** Timeout in milliseconds before showing error */
  timeout?: number
  /** Preload strategy */
  preload?: 'never' | 'idle' | 'hover' | 'visible' | 'immediate'
}

export type LazyComponentLoader<T = any> = () => Promise<{ default: T } | T>

export interface LazyComponentState {
  loading: boolean
  loaded: boolean
  error: Error | null
  component: any
}

/**
 * Create a lazy-loaded component that imports on-demand
 */
export function lazy<T extends ComponentInstance>(
  loader: LazyComponentLoader<T>,
  options: LazyComponentOptions = {}
): (props: any) => ComponentInstance {
  const { fallback, errorFallback, timeout = 10000, preload = 'never' } = options

  // Simple state management without reactive effects to prevent memory leaks
  let loadTriggered = false
  let componentLoaded: any = null
  let isLoading = false
  let loadError: Error | null = null
  let loadingPromise: Promise<any> | null = null

  // Manual loading function to avoid reactive loops
  const triggerLoad = async () => {
    if (loadTriggered || isLoading || componentLoaded || loadingPromise) {
      return
    }

    loadTriggered = true
    isLoading = true
    loadError = null

    loadingPromise = (async () => {
      try {
        const module = await Promise.race([
          loader(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Component load timeout')), timeout)
          ),
        ])

        // Handle both default exports and direct exports
        componentLoaded = 'default' in module ? module.default : module
      } catch (error) {
        const errorObj = error as Error
        // Only log in non-test environments to avoid polluting test output
        if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
          console.error('Failed to load lazy component:', errorObj)
        }
        loadError = errorObj
      } finally {
        isLoading = false
        loadingPromise = null
      }
    })()

    await loadingPromise
  }

  // Preload strategies
  if (preload === 'idle' && typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => {
      triggerLoad().catch(() => {})
    })
  } else if (preload === 'idle') {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      triggerLoad().catch(() => {})
    }, 100)
  } else if (preload === 'immediate') {
    // Start loading immediately but don't await
    triggerLoad().catch(() => {})
  }

  return (props: any) => {
    // Trigger loading if not already started
    if (!loadTriggered && !isLoading && !componentLoaded) {
      triggerLoad().catch(() => {})
    }

    // Handle error state
    if (loadError) {
      if (errorFallback) {
        return errorFallback(loadError)
      }
      return createErrorComponent(loadError)
    }

    // Handle loading state
    if (isLoading || !componentLoaded) {
      if (fallback) {
        return fallback
      }
      return createLoadingComponent()
    }

    // Render loaded component
    try {
      return typeof componentLoaded === 'function' ? componentLoaded(props) : componentLoaded
    } catch (renderError) {
      const errorObj = renderError as Error
      // Only log in non-test environments to avoid polluting test output
      if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
        console.error('Error rendering lazy component:', errorObj)
      }
      return createErrorComponent(errorObj)
    }
  }
}

/**
 * Create a suspense boundary for lazy components
 */
export function Suspense(props: {
  fallback: DOMNode
  children: ComponentInstance[]
}): ComponentInstance {
  // This would integrate with the actual rendering system
  // For now, just return children directly
  return {
    type: 'component',
    render: () => ({
      type: 'element',
      tag: 'div',
      props: { class: 'tachui-suspense' },
      children: props.children.map(() => ({
        type: 'element' as const,
        tag: 'div',
        children: [],
      })),
    }),
    props: props,
    id: `suspense-${Math.random().toString(36).substr(2, 9)}`,
  }
}

/**
 * Preload a lazy component without rendering
 */
export function preloadComponent<T>(loader: LazyComponentLoader<T>): Promise<T> {
  return loader().then((module) => {
    if (module && typeof module === 'object' && 'default' in module) {
      return (module as { default: T }).default
    }
    return module as T
  })
}

/**
 * Create multiple lazy components with shared preloading
 */
export function createLazyComponentGroup<T extends Record<string, LazyComponentLoader>>(
  loaders: T,
  options: LazyComponentOptions = {}
): { [K in keyof T]: ReturnType<typeof lazy> } {
  const components = {} as { [K in keyof T]: ReturnType<typeof lazy> }

  for (const [name, loader] of Object.entries(loaders)) {
    components[name as keyof T] = lazy(loader as LazyComponentLoader, options)
  }

  return components
}

/**
 * Preload all components in a group
 */
export function preloadComponentGroup<T extends Record<string, LazyComponentLoader>>(
  loaders: T
): Promise<{ [K in keyof T]: any }> {
  const promises = Object.entries(loaders).map(
    async ([name, loader]) => [name, await preloadComponent(loader as LazyComponentLoader)] as const
  )

  return Promise.all(promises).then((results) => {
    const resultMap: Record<string, any> = {}
    for (const [name, component] of results) {
      resultMap[name] = component
    }
    return resultMap as { [K in keyof T]: any }
  })
}

// Helper functions for default fallback components
function createLoadingComponent(): DOMNode {
  return {
    type: 'element',
    tag: 'div',
    props: {
      class: 'tachui-lazy-loading',
      style: 'padding: 16px; color: #666; text-align: center;',
    },
    children: [
      {
        type: 'text',
        text: 'Loading component...',
      },
    ],
  }
}

function createErrorComponent(error: Error): DOMNode {
  return {
    type: 'element',
    tag: 'div',
    props: {
      class: 'tachui-lazy-error',
      style:
        'padding: 16px; color: #d32f2f; border: 1px solid #d32f2f; border-radius: 4px; background: #ffeaea;',
    },
    children: [
      {
        type: 'text',
        text: `Failed to load component: ${error.message}`,
      },
    ],
  }
}

// Advanced lazy loading with intersection observer for "visible" preload
export function createVisibilityLazyComponent<T extends ComponentInstance>(
  loader: LazyComponentLoader<T>,
  options: LazyComponentOptions & { rootMargin?: string; threshold?: number } = {}
): (props: any) => ComponentInstance {
  const { rootMargin: _rootMargin = '50px', threshold: _threshold = 0.1, ...lazyOptions } = options

  if (lazyOptions.preload === 'visible' && typeof IntersectionObserver !== 'undefined') {
    return (props: any) => {
      const lazyComponent = lazy(loader, { ...lazyOptions, preload: 'never' })

      // In a real implementation, this would observe the actual DOM element
      // For now, just trigger after a short delay to simulate visibility
      setTimeout(() => {
        // Trigger the lazy loading by calling the component once
        lazyComponent(props)
      }, 100)

      return lazyComponent(props)
    }
  }

  // Fallback to regular lazy loading
  return lazy(loader, lazyOptions)
}
