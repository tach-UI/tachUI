/**
 * ForEach component for reactive list iteration
 *
 * Reactive implementation that works with TachUI's reactive architecture
 */

import { createEffect, createRoot } from '@tachui/core'
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
  private readonly renderer = new DOMRenderer()
  private itemNodeCache = new Map<
    string | number,
    { item: T; nodes: DOMNode[]; signature: string }
  >()

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
    this.dataSignal = typeof dataSource === 'function'
      ? (dataSource as () => T[])
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
  private getItemKey(item: T, index: number): string | number {
    if (typeof this.props.getItemId === 'function') {
      return this.props.getItemId(item, index)
    }
    return index
  }

  private getItemSignature(item: T): string {
    if (item === null || item === undefined) {
      return String(item)
    }

    if (typeof item !== 'object') {
      return String(item)
    }

    const record = item as Record<string, unknown>
    const keys = Object.keys(record)
    return keys
      .map(key => `${key}:${String(record[key])}`)
      .join('|')
  }

  private renderChildren(): DOMNode[] {
    const data = this.dataSignal()

    // Handle empty data with fallback
    if (!data || data.length === 0) {
      this.itemNodeCache.forEach(entry => this.disposeNodes(entry.nodes))
      this.itemNodeCache.clear()
      if (this.props.fallback) {
        return this.flattenRenderResult(this.props.fallback.render())
      }
      return []
    }

    const nextCache = new Map<
      string | number,
      { item: T; nodes: DOMNode[]; signature: string }
    >()
    const renderedNodes: DOMNode[] = []

    data.forEach((item, index) => {
      const key = this.getItemKey(item, index)
      const cached = this.itemNodeCache.get(key)
      const signature = this.getItemSignature(item)

      if (
        cached &&
        Object.is(cached.item, item) &&
        cached.signature === signature
      ) {
        nextCache.set(key, cached)
        renderedNodes.push(...cached.nodes)
        return
      }

      if (cached) {
        this.disposeNodes(cached.nodes)
      }

      const children = this.props.renderItem(item, index)
      const childArray = Array.isArray(children) ? children : [children]
      const nodes = childArray.flatMap(child =>
        this.flattenRenderResult(child.render())
      ) as DOMNode[]

      nextCache.set(key, { item, nodes, signature })
      renderedNodes.push(...nodes)
    })

    this.itemNodeCache.forEach((entry, key) => {
      if (!nextCache.has(key)) {
        this.disposeNodes(entry.nodes)
      }
    })

    this.itemNodeCache = nextCache
    return renderedNodes
  }

  /**
   * Render ForEach with reactive container pattern like Show component
   */
  render(): DOMNode[] {
    const isReactive = typeof this.props.data === 'function'

    if (!isReactive) {
      // Static data - simple render
      return this.renderChildren()
    }

    // Ensure prior render cleanups do not accumulate across repeated renders.
    this.dispose()

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

    let disposeRoot = () => {}
    createRoot(dispose => {
      disposeRoot = dispose
      createEffect(() => {
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
    })

    this.cleanup = [disposeRoot]

    const cleanup = () => {
      this.disposeNodes(containerNode.children ?? [])
      this.itemNodeCache.clear()
      this.cleanup.forEach(fn => fn())
      this.cleanup = []
    }

    containerNode.dispose = cleanup

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

    children.forEach(child => {
      const element = this.renderer.render(child)
      if (element) {
        container.appendChild(element)
      }
    })
  }

  private disposeNodes(nodes: DOMNode[]): void {
    nodes.forEach(node => {
      if (!node) return

      if (node.children && Array.isArray(node.children)) {
        this.disposeNodes(node.children)
      }

      if (typeof node.dispose === 'function') {
        node.dispose()
      }
    })
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.cleanup.forEach(fn => fn())
    this.itemNodeCache.forEach(entry => this.disposeNodes(entry.nodes))
    this.itemNodeCache.clear()
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
