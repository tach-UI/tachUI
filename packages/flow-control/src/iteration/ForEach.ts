/**
 * ForEach component for reactive list iteration
 *
 * Reactive implementation that works with TachUI's reactive architecture
 */

import {
  createEffect,
  createRoot,
  isComputed,
  isSignal,
} from '@tachui/core/reactive'
import type { Signal } from '@tachui/core/reactive/types'
import type {
  ComponentInstance,
  ComponentProps,
  ComponentRef,
  DOMNode,
} from '@tachui/core/runtime/types'
import { DOMRenderer } from '@tachui/core/runtime/renderer'

/**
 * ForEach component properties
 */
export interface ForEachProps<T = any> {
  data: T[] | Signal<T[]>
  children: (item: T, index: number) => ComponentInstance | ComponentInstance[]
  getItemId?: (item: T, index: number) => string | number
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
export class ForEach<T = any>
  implements ComponentInstance<ForEachInternalProps<T>>
{
  public readonly type = 'component' as const
  public readonly id: string
  public mounted = false
  public cleanup: (() => void)[] = []
  public props: ForEachInternalProps<T>

  private dataSignal: () => T[]

  constructor(props: ForEachProps<T>) {
    // Convert to internal props format
    this.props = {
      ...props,
      renderItem: props.children,
      children: undefined, // ComponentProps children
    } as ForEachInternalProps<T>
    this.id = `foreach-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Set up reactive data
    this.dataSignal = isSignal(props.data)
      ? props.data
      : () => props.data as T[]
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

    // Create reactive effect that updates the container
    const cleanup = createRoot(() => {
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

      return () => effect.dispose()
    })

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
 * Create ForEach component
 */
export function ForEachComponent<T = any>(
  props: ForEachProps<T>
): ComponentInstance<ForEachInternalProps<T>> {
  return new ForEach(props)
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
    key: props.key,
    ref: props.ref,
  }

  return new ForEach(forEachProps)
}
