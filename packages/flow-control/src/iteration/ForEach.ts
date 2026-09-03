/**
 * ForEach component for reactive list iteration
 *
 * Reactive implementation that works with TachUI's reactive architecture
 */

import type { Signal } from '@tachui/core'
import type {
  ComponentInstance,
  ComponentProps,
  ComponentRef,
  DOMNode,
} from '@tachui/core'
import { DOMRenderer } from '@tachui/core'
import { OwnedContainer } from '../owned-container'

type ListSource<T> = T[] | Signal<T[]> | (() => T[])

/** Already this container's child, and already the one before `nextSibling`. */
function isInPlace(
  element: Node,
  container: Node,
  nextSibling: Node | null
): boolean {
  return element.parentNode === container && element.nextSibling === nextSibling
}

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
  private readonly container = new OwnedContainer({
    fill: element => this.reconcile(element),
    serverChildren: () => this.renderChildren(),
    teardown: () => this.teardown(),
  })
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
    // Scoped to this pass. It guards against disposing the same node twice
    // while working through the fallback and the item cache, not against
    // disposing it again in a later pass: a node this component still has
    // cached can be disposed from outside — a `Show` tears down the branch it
    // is in — and then mounted again, and it has to be disposable a second
    // time or its new element's cleanups never run.
    this.disposedNodes = new WeakSet<DOMNode>()

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
   * Render the collection.
   *
   * A reactive collection produces an owned container: this component fills it
   * and the renderer mounts it without reconciling its children, which is what
   * keeps the two from writing to the same element behind each other's backs
   * (#318). See `OwnedContainer` for the contract.
   */
  render(): DOMNode[] {
    if (typeof this.props.data !== 'function') {
      // Static data - simple render
      return this.renderChildren()
    }

    return this.container.render()
  }

  /**
   * Render the current collection and put it in the container.
   *
   * Runs inside the renderer's binding for this node, so its reads — the
   * collection, and whatever an item reads while rendering — are the
   * dependencies that bring it back. `renderChildren` reuses the nodes of items
   * that have not changed, so a run triggered by the renderer re-creating the
   * binding rather than by a change re-mounts the same elements, and
   * `mountItems` leaves them where they are.
   */
  private reconcile(container: HTMLElement): void {
    this.mountItems(container, this.renderChildren())
  }

  /**
   * Put the rendered items in the container, in order.
   *
   * Written as a removal pass and an ordering pass rather than
   * `replaceChildren`, which re-inserts every element and so drops focus and
   * resets scroll inside items that did not change. `renderChildren` already
   * reuses the nodes of unchanged items, so their elements come back
   * identical; an element already in the right place is left where it is.
   *
   * Items dropped from the collection have been disposed by the time this runs,
   * which leaves their elements in place — disposal is not removal — so the
   * removal pass is what actually takes them out of the DOM.
   */
  private mountItems(container: HTMLElement, nodes: DOMNode[]): void {
    const elements = nodes.map(
      node => this.renderer.render(node) as Element | Text | Comment
    )
    const mounted = new Set<Node>(elements)

    Array.from(container.childNodes).forEach(child => {
      if (!mounted.has(child)) {
        container.removeChild(child)
      }
    })

    let nextSibling: Node | null = null
    for (let index = elements.length - 1; index >= 0; index -= 1) {
      const element = elements[index]!
      if (!isInPlace(element, container, nextSibling)) {
        container.insertBefore(element, nextSibling)
      }
      nextSibling = element
    }
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
   * Cleanup resources.
   *
   * Routed through the container so that disposing a *mounted* component
   * retires the renderer's binding as well. Clearing the items alone would
   * leave that subscription live, and the next change to the collection would
   * refill the element this just emptied.
   */
  dispose(): void {
    this.container.dispose()
  }

  private teardown(): void {
    this.cleanup.forEach(fn => fn())
    this.disposeNodes(this.fallbackNodes)
    this.fallbackNodes = []
    this.itemNodeCache.forEach(entry => this.disposeNodes(entry.nodes))
    this.itemNodeCache.clear()
    this.container.peek()?.replaceChildren()
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
