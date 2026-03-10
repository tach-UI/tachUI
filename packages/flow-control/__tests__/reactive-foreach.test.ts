import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  createSignal,
  flushSync,
  type ComponentInstance,
  type DOMNode,
  type Signal,
  DOMRenderer,
} from '@tachui/core'
import { Text } from '@tachui/primitives'
import { registerBasicModifiers } from '@tachui/modifiers'
import type { ModifierRegistry } from '@tachui/registry'
import { getSubscriberCount } from '../../core/tools/testing/reactive-test-helpers'
import { createTestRegistry } from '../../core/tools/testing/reactive-test-helpers'
import { setExternalModifierRegistry } from '../../core/src/modifiers'
import { ForEach } from '../src/iteration/ForEach'

type ItemModel = {
  id: number
  label: string
}
type DisposableComponent = ComponentInstance & { dispose?: () => void }

function asSignal<T>(accessor: () => T): Signal<T> {
  return accessor as Signal<T>
}

function trackedTextComponent(
  label: string,
  onRender: () => void
): ComponentInstance {
  return {
    type: 'component',
    id: `tracked-${label}-${Math.random().toString(36).slice(2)}`,
    mounted: false,
    cleanup: [],
    props: { label },
    render: () => {
      onRender()
      return Text(label).build().render() as DOMNode[]
    },
  }
}

function disposableFallbackComponent(
  label: string,
  onDispose: () => void
): ComponentInstance {
  return {
    type: 'component',
    id: `fallback-${label}-${Math.random().toString(36).slice(2)}`,
    mounted: false,
    cleanup: [],
    props: { label },
    render: () => [
      {
        type: 'element',
        tag: 'span',
        props: {},
        children: [{ type: 'text', text: label }],
        dispose: onDispose,
      } as DOMNode,
    ],
  }
}

async function waitForUpdate(frames = 2): Promise<void> {
  for (let i = 0; i < frames; i += 1) {
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

describe('ForEach reactive rendering depth', () => {
  let container: HTMLElement
  let renderer: DOMRenderer
  let registry: ModifierRegistry
  const componentsWithDispose = new Set<DisposableComponent>()

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    renderer = new DOMRenderer()
    registry = createTestRegistry()
    registerBasicModifiers({ registry })
    setExternalModifierRegistry(registry)
  })

  afterEach(() => {
    componentsWithDispose.forEach(component => component.dispose?.())
    componentsWithDispose.clear()
    renderer.cleanup()
    container.remove()
    setExternalModifierRegistry(null)
  })

  function renderToDOM(component: DisposableComponent): HTMLElement {
    if (typeof component.dispose === 'function') {
      componentsWithDispose.add(component)
    }
    const nodes = component.render()
    const nodeArray = Array.isArray(nodes) ? nodes : [nodes]
    const element = renderer.render(nodeArray[0]) as HTMLElement
    container.appendChild(element)
    return element
  }

  describe('Basic signal-driven list', () => {
    it('adds and removes list items via signal updates', async () => {
      const [items, setItems] = createSignal<ItemModel[]>([
        { id: 1, label: 'Alpha' },
        { id: 2, label: 'Beta' },
      ])

      const list = ForEach({
        data: items,
        getItemId: item => item.id,
        children: item => Text(item.label).build(),
      })

      const element = renderToDOM(list)
      expect(element.textContent).toContain('Alpha')
      expect(element.textContent).toContain('Beta')

      setItems([...items(), { id: 3, label: 'Gamma' }])
      flushSync()
      await waitForUpdate()
      expect(element.textContent).toContain('Gamma')

      setItems(items().filter(item => item.id !== 2))
      flushSync()
      await waitForUpdate()
      expect(element.textContent).toContain('Alpha')
      expect(element.textContent).toContain('Gamma')
      expect(element.textContent).not.toContain('Beta')
    })

    it('reorders without re-rendering unchanged keyed rows', async () => {
      const a = { id: 1, label: 'A' }
      const b = { id: 2, label: 'B' }
      const c = { id: 3, label: 'C' }
      const [items, setItems] = createSignal<ItemModel[]>([a, b, c])

      const renderCounts = new Map<number, number>([
        [1, 0],
        [2, 0],
        [3, 0],
      ])

      const list = ForEach({
        data: items,
        getItemId: item => item.id,
        children: item =>
          trackedTextComponent(item.label, () => {
            renderCounts.set(item.id, (renderCounts.get(item.id) ?? 0) + 1)
          }),
      })

      const element = renderToDOM(list)
      const labels = Array.from(element.querySelectorAll('span')).map(
        span => span.textContent
      )
      expect(labels).toEqual(['A', 'B', 'C'])

      const baseline = new Map(renderCounts)
      setItems([c, a, b])
      flushSync()
      await waitForUpdate()

      const reorderedLabels = Array.from(element.querySelectorAll('span')).map(
        span => span.textContent
      )
      expect(reorderedLabels).toEqual(['C', 'A', 'B'])
      expect(renderCounts.get(1)).toBe(baseline.get(1))
      expect(renderCounts.get(2)).toBe(baseline.get(2))
      expect(renderCounts.get(3)).toBe(baseline.get(3))
    })
  })

  describe('Item-level reactivity', () => {
    it('updates only the changed item when one keyed item object changes', async () => {
      const [items, setItems] = createSignal<ItemModel[]>([
        { id: 0, label: 'Row-0' },
        { id: 1, label: 'Row-1' },
        { id: 2, label: 'Row-2' },
        { id: 3, label: 'Row-3' },
        { id: 4, label: 'Row-4' },
      ])

      const renderCounts = new Map<number, number>(
        items().map(item => [item.id, 0])
      )

      const list = ForEach({
        data: items,
        getItemId: item => item.id,
        children: item =>
          trackedTextComponent(item.label, () => {
            renderCounts.set(item.id, (renderCounts.get(item.id) ?? 0) + 1)
          }),
      })

      const element = renderToDOM(list)
      expect(element.textContent).toContain('Row-3')

      const baseline = new Map(renderCounts)
      setItems(
        items().map(item =>
          item.id === 3 ? { ...item, label: 'Row-3-updated' } : item
        )
      )
      flushSync()
      await waitForUpdate()

      expect(element.textContent).toContain('Row-3-updated')
      expect(renderCounts.get(0)).toBe(baseline.get(0))
      expect(renderCounts.get(1)).toBe(baseline.get(1))
      expect(renderCounts.get(2)).toBe(baseline.get(2))
      expect(renderCounts.get(4)).toBe(baseline.get(4))
      expect(renderCounts.get(3)).toBe((baseline.get(3) ?? 0) + 1)
    })

    it('propagates shared signal updates to all rows', async () => {
      const [sharedSize, setSharedSize] = createSignal(12)
      const [items] = createSignal<ItemModel[]>([
        { id: 1, label: 'One' },
        { id: 2, label: 'Two' },
        { id: 3, label: 'Three' },
      ])

      const list = ForEach({
        data: items,
        getItemId: item => item.id,
        children: item => Text(item.label).fontSize(asSignal(sharedSize)).build(),
      })

      const element = renderToDOM(list)
      const spansBefore = Array.from(element.querySelectorAll('span'))
      expect(spansBefore).toHaveLength(3)
      spansBefore.forEach(span => expect(span.style.fontSize).toBe('12px'))

      setSharedSize(20)
      flushSync()
      await waitForUpdate()

      const spansAfter = Array.from(element.querySelectorAll('span'))
      expect(spansAfter).toHaveLength(3)
      spansAfter.forEach(span => expect(span.style.fontSize).toBe('20px'))
    })
  })

  describe('Cleanup', () => {
    it('cleans subscriptions when item removed, list cleared, and unmounted', async () => {
      const [size0] = createSignal(10)
      const [size1] = createSignal(11)
      const [size2] = createSignal(12)
      const [items, setItems] = createSignal([
        { id: 0, label: 'Row-0', size: size0 },
        { id: 1, label: 'Row-1', size: size1 },
        { id: 2, label: 'Row-2', size: size2 },
      ])

      const list = ForEach({
        data: items,
        getItemId: item => item.id,
        children: item => Text(item.label).fontSize(asSignal(item.size)).build(),
      }) as DisposableComponent

      renderToDOM(list)
      await waitForUpdate()
      expect(getSubscriberCount(size0)).toBeGreaterThan(0)
      expect(getSubscriberCount(size1)).toBeGreaterThan(0)
      expect(getSubscriberCount(size2)).toBeGreaterThan(0)

      setItems(items().filter(item => item.id !== 1))
      flushSync()
      await waitForUpdate()
      expect(getSubscriberCount(size1)).toBe(0)

      setItems([])
      flushSync()
      await waitForUpdate()
      expect(getSubscriberCount(size0)).toBe(0)
      expect(getSubscriberCount(size2)).toBe(0)

      list.dispose?.()
      componentsWithDispose.delete(list)
      expect(getSubscriberCount(size0)).toBe(0)
      expect(getSubscriberCount(size1)).toBe(0)
      expect(getSubscriberCount(size2)).toBe(0)
    })

    it('disposes fallback nodes when swapping and rerendering empty branches', async () => {
      const [items, setItems] = createSignal<ItemModel[]>([])
      let fallbackDisposeCount = 0
      const list = ForEach({
        data: items,
        getItemId: item => item.id,
        children: item => Text(item.label).build(),
        fallback: disposableFallbackComponent('No items', () => {
          fallbackDisposeCount += 1
        }),
      }) as DisposableComponent

      const element = renderToDOM(list)
      expect(element.textContent).toContain('No items')

      setItems([{ id: 1, label: 'Row-1' }])
      flushSync()
      await waitForUpdate()
      expect(fallbackDisposeCount).toBe(1)
      expect(element.textContent).toContain('Row-1')

      setItems([])
      flushSync()
      await waitForUpdate()
      expect(element.textContent).toContain('No items')

      setItems([])
      flushSync()
      await waitForUpdate()
      expect(fallbackDisposeCount).toBe(2)

      list.dispose?.()
      componentsWithDispose.delete(list)
      expect(fallbackDisposeCount).toBe(3)
    })
  })

  describe('Scale', () => {
    it('500-item single update stays cheaper than full replacement rerender', async () => {
      const rows = Array.from({ length: 500 }, (_, id) => ({
        id,
        label: `Row-${id}`,
      }))
      const [items, setItems] = createSignal(rows)
      const renderCounts = new Map<number, number>(rows.map(row => [row.id, 0]))

      const list = ForEach({
        data: items,
        getItemId: item => item.id,
        children: item =>
          trackedTextComponent(item.label, () => {
            renderCounts.set(item.id, (renderCounts.get(item.id) ?? 0) + 1)
          }),
      })

      renderToDOM(list)
      const baseline = new Map(renderCounts)

      const start = performance.now()
      setItems(
        items().map(item =>
          item.id === 333 ? { ...item, label: 'Row-333-updated' } : item
        )
      )
      flushSync()
      await waitForUpdate()
      const singleUpdateDuration = performance.now() - start

      const rerendered = Array.from(renderCounts.entries()).filter(
        ([id, count]) => count > (baseline.get(id) ?? 0)
      )
      expect(rerendered).toHaveLength(1)
      expect(rerendered[0]?.[0]).toBe(333)

      const fullReplaceStart = performance.now()
      setItems(
        items().map(item => ({
          ...item,
          label: `${item.label}-all`,
        }))
      )
      flushSync()
      await waitForUpdate()
      const fullReplaceDuration = performance.now() - fullReplaceStart

      expect(singleUpdateDuration).toBeLessThan(fullReplaceDuration)
      expect(singleUpdateDuration).toBeLessThan(250)
    })

    it('replacing 100 items cleans old subscriptions and wires new ones', async () => {
      const initial = Array.from({ length: 100 }, (_, id) => {
        const [size] = createSignal(10 + id)
        return { id, label: `Old-${id}`, size }
      })
      const replacement = Array.from({ length: 100 }, (_, id) => {
        const [size] = createSignal(20 + id)
        return { id: id + 1000, label: `New-${id}`, size }
      })

      const [items, setItems] = createSignal(initial)
      const list = ForEach({
        data: items,
        getItemId: item => item.id,
        children: item => Text(item.label).fontSize(asSignal(item.size)).build(),
      })

      renderToDOM(list)
      await waitForUpdate()
      expect(initial.every(item => getSubscriberCount(item.size) > 0)).toBe(true)

      setItems(replacement)
      flushSync()
      await waitForUpdate()

      expect(initial.every(item => getSubscriberCount(item.size) === 0)).toBe(true)
      expect(
        replacement.every(item => getSubscriberCount(item.size) > 0)
      ).toBe(true)
    })
  })
})
