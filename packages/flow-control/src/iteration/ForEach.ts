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

type ListSource<T> = T[] | Signal<T[]> | (() => T[])

/**
 * ForEach component properties
 */
export interface ForEachProps<T = any> {
  data?: ListSource<T>
  /**
   * @deprecated Use `data` instead.
   */
  items?: ListSource<T> // Alternative property name for backward compatibility
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
  data: ListSource<T>
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
  each: ListSource<T>
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
  private disposedNodes = new WeakSet<DOMNode>()
  private fallbackNodes: DOMNode[] = []
  private itemNodeCache = new Map<
    string | number,
    { item: T; nodes: DOMNode[]; snapshot: ReadonlyArray<readonly [string, unknown]> }
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

  private createItemSnapshot(
    item: T
  ): ReadonlyArray<readonly [string, unknown]> {
    if (item === null || item === undefined || typeof item !== 'object') {
      return [['__value', item]]
    }

    const record = item as Record<string, unknown>
    return Object.keys(record).map(key => [key, record[key]] as const)
  }

  private snapshotEquals(
    previous: ReadonlyArray<readonly [string, unknown]>,
    next: ReadonlyArray<readonly [string, unknown]>
  ): boolean {
    if (previous.length !== next.length) return false
    for (let index = 0; index < previous.length; index += 1) {
      const previousEntry = previous[index]
      const nextEntry = next[index]
      if (!previousEntry || !nextEntry) return false
      if (previousEntry[0] !== nextEntry[0]) return false
      if (!Object.is(previousEntry[1], nextEntry[1])) return false
    }
    return true
  }

  private renderChildren(): DOMNode[] {
    const data = this.dataSignal()

    // Handle empty data with fallback
    if (!data || data.length === 0) {
      this.itemNodeCache.forEach(entry => this.disposeNodes(entry.nodes))
      this.itemNodeCache.clear()
      if (this.props.fallback) {
        const nextFallbackNodes = this.flattenRenderResult(
          this.props.fallback.render()
        ) as DOMNode[]
        this.disposeNodes(this.fallbackNodes)
        this.fallbackNodes = nextFallbackNodes
        return nextFallbackNodes
      }
      this.disposeNodes(this.fallbackNodes)
      this.fallbackNodes = []
      return []
    }

    this.disposeNodes(this.fallbackNodes)
    this.fallbackNodes = []

    const nextCache = new Map<
      string | number,
      { item: T; nodes: DOMNode[]; snapshot: ReadonlyArray<readonly [string, unknown]> }
    >()
    const renderedNodes: DOMNode[] = []

    data.forEach((item, index) => {
      const key = this.getItemKey(item, index)
      const cached = this.itemNodeCache.get(key)
      const snapshot = this.createItemSnapshot(item)

      if (
        cached &&
        Object.is(cached.item, item) &&
        this.snapshotEquals(cached.snapshot, snapshot)
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

      nextCache.set(key, { item, nodes, snapshot })
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

    this.cleanup.push(disposeRoot)

    const cleanup = () => {
      this.dispose()
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
    const renderedChildren = children.map(
      child => this.renderer.render(child) as Element | Text | Comment
    )
    container.replaceChildren(...renderedChildren)
  }

  private disposeNodes(nodes: DOMNode[]): void {
    nodes.forEach(node => {
      if (!node) return
      if (this.disposedNodes.has(node)) return
      this.disposedNodes.add(node)

      if (node.children && Array.isArray(node.children)) {
        this.disposeNodes(node.children)
      }

      // An item this renderer mounted goes back through it, so its per-element
      // cleanups run and it leaves the renderer's rendered-node set. Calling
      // `node.dispose` alone leaves reactive prop effects and `reactiveElement`
      // bindings running and the set growing with every collection change.
      if (this.renderer.hasNode(node)) {
        this.renderer.disposeNode(node)
      } else if (typeof node.dispose === 'function') {
        // Never rendered — an item dropped before it was mounted.
        node.dispose()
      }
    })
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.cleanup.forEach(fn => fn())
    this.disposeNodes(this.fallbackNodes)
    this.fallbackNodes = []
    this.itemNodeCache.forEach(entry => this.disposeNodes(entry.nodes))
    this.itemNodeCache.clear()
    this.cleanup = []
    this.disposedNodes = new WeakSet<DOMNode>()
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
