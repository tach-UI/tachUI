/**
 * ForEach component for reactive list iteration
 *
 * Reactive implementation that works with TachUI's reactive architecture
 */

import { untrack } from '@tachui/core'
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
  private container: HTMLElement | undefined
  // Stable across renders so the element it is registered against collects one
  // entry rather than one per render of the enclosing component.
  private readonly disposeSelf = () => this.dispose()
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
   * A reactive collection produces an *owned* container: this component fills
   * it and the renderer mounts it without reconciling its children. That single
   * writer is the whole point. When the container was an ordinary node, both
   * this component (patching the element from an effect) and the mounting
   * renderer (reconciling `children` against its own record of them) wrote to
   * it, and the two records drifted apart the moment the collection changed
   * without a re-render — the next re-render then paired the incoming items
   * against elements that were no longer mounted and left the list scrambled
   * (#318).
   *
   * The subscription goes over as `reactiveElement` rather than being created
   * here. `render()` runs on every render of the enclosing element, so an effect
   * created here is created again per render, and it is parented to that
   * render's execution owner, which disposes it when the pass re-runs. The
   * renderer owns the binding instead: it retires the previous one when it
   * adopts this node's successor, and rebinds one that outlived its pass, so
   * exactly one effect is maintaining the container at any time.
   */
  render(): DOMNode[] {
    const isReactive = typeof this.props.data === 'function'

    if (!isReactive) {
      // Static data - simple render
      return this.renderChildren()
    }

    // No DOM to own. An owned node serializes as its element, so emitting one
    // without a DOM to build it in would serialize as an empty shell (see
    // `DOMNode.owned`); the items go over as ordinary children instead, for the
    // serializer to walk. Untracked because a read here would subscribe the
    // enclosing component's render.
    if (typeof document === 'undefined') {
      return [
        {
          type: 'element',
          tag: 'div',
          props: { style: { display: 'contents' } },
          children: untrack(() => this.renderChildren()),
        },
      ]
    }

    return [
      {
        type: 'element',
        tag: 'div',
        // Describes the shell only: the renderer applies neither props nor
        // children to an owned element, so the container styles itself in
        // `ensureContainer`. Kept so the node still serializes correctly if it
        // ever reaches the empty-shell path.
        props: { style: { display: 'contents' } },
        children: [],
        element: this.ensureContainer(),
        owned: true,
        reactiveElement: () => this.reconcile(),
        dispose: this.disposeSelf,
      },
    ]
  }

  /**
   * The container element, created once and kept for the life of the component.
   *
   * Stable identity is what makes a re-render idempotent: the node handed over
   * on the second render carries the same element as the first, so the
   * reconciler pairs the two and mounts nothing new. It also keeps modifiers
   * applied to this component on the element they were applied to, which a
   * swapped element would lose.
   */
  private ensureContainer(): HTMLElement {
    if (!this.container) {
      const element = document.createElement('div')
      // Owned, so the renderer never applies this node's props.
      element.style.display = 'contents'
      this.container = element
    }
    return this.container
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
  private reconcile(): Element {
    const container = this.ensureContainer()
    this.mountItems(container, this.renderChildren())
    return container
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
      if (element.parentNode !== container || element.nextSibling !== nextSibling) {
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
   * Cleanup resources
   */
  dispose(): void {
    this.cleanup.forEach(fn => fn())
    this.disposeNodes(this.fallbackNodes)
    this.fallbackNodes = []
    this.itemNodeCache.forEach(entry => this.disposeNodes(entry.nodes))
    this.itemNodeCache.clear()
    this.container?.replaceChildren()
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
