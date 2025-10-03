/**
 * ForEach component for reactive list iteration
 *
 * Reactive implementation that works with TachUI's reactive architecture
 */

import { createEffect, isComputed, isSignal } from '@tachui/core'
import type { Signal } from '@tachui/core'
import type {
  ComponentInstance,
  ComponentProps,
  ComponentRef,
  DOMNode,
} from '@tachui/core'
import { DOMRenderer } from '@tachui/core'

/**
 * ForEach component properties
 */
export interface ForEachProps<T = any> {
  data?: T[] | Signal<T[]>
  items?: T[] | Signal<T[]>  // Alternative property name for backward compatibility
  children: (item: T, index: number) => ComponentInstance | ComponentInstance[]
  getItemId?: (item: T, index: number) => string | number
  fallback?: ComponentInstance
  key?: string | number
  ref?: ComponentRef
}

/**
 * ForEach component internal props that satisfy ComponentProps
 */
interface ForEachInternalProps<T = any> extends ComponentProps {
  data: T[] | Signal<T[]>
  renderItem: (
    item: T,
    index: number
  ) => ComponentInstance | ComponentInstance[]
  getItemId?: (item: T, index: number) => string | number
  fallback?: ComponentInstance
}

/**
 * For component alias (SolidJS-style compatibility)
 */
export interface ForProps<T = any> {
  each: T[] | Signal<T[]>
  children: (item: T, index: number) => ComponentInstance | ComponentInstance[]
  fallback?: ComponentInstance
  key?: string | number
  ref?: ComponentRef
}

/**
 * ForEach component implementation with self-contained reactivity
 */
export class ForEachComponent<T = any>
  implements ComponentInstance<ForEachInternalProps<T>>
{
  public readonly type = 'component' as const
  public readonly id: string
  public mounted = false
  public cleanup: (() => void)[] = []
  public props: ForEachInternalProps<T>

  private dataSignal: () => T[]

  constructor(props: ForEachProps<T>) {
    // Determine data source - prefer 'data' property, fallback to 'items'
    const dataSource = props.data !== undefined ? props.data : props.items
    if (dataSource === undefined) {
      throw new Error('ForEach component requires either "data" or "items" property')
    }

    // Convert to internal props format
    this.props = {
      ...props,
      data: dataSource,
      renderItem: props.children,
      children: undefined, // ComponentProps children
    } as ForEachInternalProps<T>
    this.id = `foreach-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Set up reactive data
    this.dataSignal = isSignal(dataSource)
      ? dataSource
      : () => dataSource || []
  }

  /**
   * Helper to flatten render results
   */
  private flattenRenderResult(result: any): any[] {
    return Array.isArray(result) ? result : [result]
  }

  /**
   * Render children for current data
   */
  private renderChildren(): DOMNode[] {
    const data = this.dataSignal()

    // Handle empty data with fallback
    if (!data || data.length === 0) {
      if (this.props.fallback) {
        return this.flattenRenderResult(this.props.fallback.render())
      }
      return []
    }

    return data.flatMap((item, index) => {
      const children = this.props.renderItem(item, index)
      const childArray = Array.isArray(children) ? children : [children]
      return childArray.flatMap(child =>
        this.flattenRenderResult(child.render())
      )
    })
  }

  /**
   * Render ForEach with reactive container pattern like Show component
   */
  render(): DOMNode[] {
    // Check if data source is reactive
    const isReactive = isSignal(this.props.data) || isComputed(this.props.data)

    if (!isReactive) {
      // Static data - simple render
      return this.renderChildren()
    }

    // Reactive data - create reactive container
    const containerNode: DOMNode = {
      type: 'element',
      tag: 'div',
      props: {
        style: { display: 'contents' }, // Make container invisible
      },
      children: [],
      dispose: undefined,
    }

    // Create reactive effect directly - no createRoot isolation (like Show component)
    const effect = createEffect(() => {
      const newChildren = this.renderChildren()
      containerNode.children = newChildren

      // Update DOM if already rendered
      if (
        containerNode.element &&
        containerNode.element instanceof HTMLElement
      ) {
        this.updateContainerDOM(containerNode.element, newChildren)
      }
    })

    // Store cleanup like other components do
    this.cleanup.push(() => effect.dispose())

    const cleanup = () => {
      this.cleanup.forEach(fn => fn())
      this.cleanup = []
    }

    containerNode.dispose = cleanup

    // Initialize with current children
    const initialChildren = this.renderChildren()
    containerNode.children = initialChildren

    return [containerNode]
  }

  /**
   * Update the container DOM element with new children using TachUI's renderer
   */
  private updateContainerDOM(
    container: HTMLElement,
    children: DOMNode[]
  ): void {
    // Clear existing content
    container.innerHTML = ''

    // Use TachUI's renderer to properly handle modifiers and reactivity
    const renderer = new DOMRenderer()

    // Render new content using TachUI's renderer which handles modifiers
    children.forEach(child => {
      try {
        const element = renderer.render(child)
        if (element) {
          container.appendChild(element)
        }
      } catch (error) {
        console.error('Error rendering ForEach component child:', error)
      }
    })
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.cleanup.forEach(fn => {
      try {
        fn()
      } catch (error) {
        console.error('ForEach component cleanup error:', error)
      }
    })
    this.cleanup = []
  }
}

/**
 * Create ForEach component (factory function)
 */
export function ForEach<T = any>(
  props: ForEachProps<T>
): ComponentInstance<ForEachInternalProps<T>> {
  return new ForEachComponent(props)
}

/**
 * For component alias (SolidJS-style compatibility)
 *
 * @example
 * ```typescript
 * For({
 *   each: items,
 *   children: (item, index) => Text(item.name)
 * })
 * ```
 */
export function For<T = any>(
  props: ForProps<T>
): ComponentInstance<ForEachInternalProps<T>> {
  // Convert SolidJS-style props to TachUI ForEach props
  const forEachProps: ForEachProps<T> = {
    data: props.each,
    children: props.children,
    fallback: props.fallback,
    key: props.key,
    ref: props.ref,
  }

  return new ForEachComponent(forEachProps)
}
