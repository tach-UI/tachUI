import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { registerBasicModifiers } from '@tachui/modifiers'
import type { ModifierRegistry } from '@tachui/registry'
import { h } from '../../src/runtime'
import type { DOMNode } from '../../src/runtime/types'
import { applyModifiersToNode } from '../../src/modifiers'
import type { ModifierContext } from '../../src/modifiers/types'
import { BaseModifier as CoreBaseModifier } from '../../src/modifiers/base'
import {
  createComputed,
  createEffect,
  createRoot,
  createSignal,
  flushSync,
} from '../../src/reactive'
import {
  createTestRegistry,
  disposeComputed,
  getSubscriberCount,
} from '../../tools/testing/reactive-test-helpers'

type ModifierCall = { name: string; args: any[] }
type MountedNode = {
  element: HTMLElement
  dispose: () => void
}

const mountedNodes = new Set<MountedNode>()
let componentIdCounter = 0
const runMemoryTests = process.env.FORCE_MEMORY_TESTS === 'true'
const memoryIt = runMemoryTests ? it : it.skip

class CoreWidthModifier extends CoreBaseModifier<{ value: any }> {
  readonly type = 'coreWidth'
  readonly priority = 100

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    this.applyStyles(context.element, { width: this.properties.value })
    return undefined
  }
}

function mountWithModifiers(
  registry: ModifierRegistry,
  element: HTMLElement,
  calls: ModifierCall[]
): MountedNode {
  let disposeRoot: () => void = () => {}

  createRoot(dispose => {
    disposeRoot = dispose
    const node = h('div')
    // Intentional low-level path for deterministic modifier lifecycle testing.
    node.element = element

    const modifiers = calls.map(call => {
      const factory = registry.get(call.name)
      if (!factory) {
        throw new Error(`Missing modifier factory: ${call.name}`)
      }
      return (factory as (...args: any[]) => any)(...call.args)
    })

    componentIdCounter += 1
    applyModifiersToNode(node, modifiers, {
      componentId: `modifier-lifecycle-test-${componentIdCounter}`,
      element,
      phase: 'creation',
    })
  })

  const mounted: MountedNode = {
    element,
    dispose: () => disposeRoot(),
  }
  mountedNodes.add(mounted)
  return mounted
}

function unmountMountedNode(node: MountedNode): void {
  node.dispose()
  mountedNodes.delete(node)
}

function flushAsync(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

describe('modifier lifecycle cleanup', () => {
  let registry: ModifierRegistry

  beforeEach(() => {
    document.body.innerHTML = ''
    componentIdCounter = 0
    registry = createTestRegistry()
    registerBasicModifiers({ registry })
    registry.register('coreWidth', (value: any) => new CoreWidthModifier({ value }))
  })

  afterEach(() => {
    mountedNodes.forEach(node => {
      node.dispose()
    })
    mountedNodes.clear()
  })

  describe('Subscription setup', () => {
    it('signal-based modifier creates exactly one subscription', () => {
      const [color] = createSignal('#ff0000')
      const baseline = getSubscriberCount(color)
      const element = document.createElement('div')

      mountWithModifiers(registry, element, [{ name: 'foregroundColor', args: [color] }])
      expect(getSubscriberCount(color)).toBe(baseline + 1)
    })

    it('same signal across two modifiers on one component creates one subscription', () => {
      const [value] = createSignal(12)
      const baseline = getSubscriberCount(value)
      const element = document.createElement('div')

      mountWithModifiers(registry, element, [
        { name: 'fontSize', args: [value] },
        { name: 'fontWeight', args: [value] },
      ])

      expect(getSubscriberCount(value)).toBe(baseline + 1)
    })

    it('same signal across core and package modifiers creates one subscription', () => {
      const [value] = createSignal(12)
      const baseline = getSubscriberCount(value)
      const element = document.createElement('div')

      mountWithModifiers(registry, element, [
        { name: 'coreWidth', args: [value] },
        { name: 'fontSize', args: [value] },
      ])

      expect(getSubscriberCount(value)).toBe(baseline + 1)
    })

    it('applying signal modifiers to N components creates N subscriptions', () => {
      const [color] = createSignal('#00ff00')
      const baseline = getSubscriberCount(color)
      const components = Array.from({ length: 5 }, () => document.createElement('div'))

      components.forEach(element => {
        mountWithModifiers(registry, element, [{ name: 'foregroundColor', args: [color] }])
      })

      expect(getSubscriberCount(color)).toBe(baseline + components.length)
    })
  })

  describe('Subscription cleanup on unmount', () => {
    it('component removal cleans up signal subscription', () => {
      const [opacity] = createSignal(1)
      const baseline = getSubscriberCount(opacity)
      const element = document.createElement('div')
      const mounted = mountWithModifiers(registry, element, [{ name: 'opacity', args: [opacity] }])

      expect(getSubscriberCount(opacity)).toBe(baseline + 1)
      unmountMountedNode(mounted)
      expect(getSubscriberCount(opacity)).toBe(baseline)
    })

    it('signal updates after removal do not throw and keep baseline subscriptions', () => {
      const [width, setWidth] = createSignal(100)
      const baseline = getSubscriberCount(width)
      const mounted = mountWithModifiers(registry, document.createElement('div'), [
        { name: 'width', args: [width] },
      ])

      unmountMountedNode(mounted)
      expect(() => {
        setWidth(150)
        flushSync()
      }).not.toThrow()
      expect(getSubscriberCount(width)).toBe(baseline)
    })

    it('ForEach-style item removal cleans up only removed item subscriptions', () => {
      const [itemA] = createSignal('#aa0000')
      const [itemB] = createSignal('#00aa00')
      const baselineA = getSubscriberCount(itemA)
      const baselineB = getSubscriberCount(itemB)

      const mountedA = mountWithModifiers(registry, document.createElement('div'), [
        { name: 'foregroundColor', args: [itemA] },
      ])
      const mountedB = mountWithModifiers(registry, document.createElement('div'), [
        { name: 'foregroundColor', args: [itemB] },
      ])

      expect(getSubscriberCount(itemA)).toBe(baselineA + 1)
      expect(getSubscriberCount(itemB)).toBe(baselineB + 1)

      unmountMountedNode(mountedA)

      expect(getSubscriberCount(itemA)).toBe(baselineA)
      expect(getSubscriberCount(itemB)).toBe(baselineB + 1)

      unmountMountedNode(mountedB)
      expect(getSubscriberCount(itemB)).toBe(baselineB)
    })

    it('non-root applyModifiersToNode path cleans subscriptions on DOM removal', async () => {
      const [opacity] = createSignal(0.5)
      const baseline = getSubscriberCount(opacity)
      const element = document.createElement('div')
      document.body.appendChild(element)

      const node = h('div')
      node.element = element
      const factory = registry.get('opacity')
      if (!factory) {
        throw new Error('Missing modifier factory: opacity')
      }

      applyModifiersToNode(
        node,
        [(factory as (...args: any[]) => any)(opacity)],
        {
          componentId: 'non-root-cleanup-test',
          element,
          phase: 'creation',
        }
      )

      expect(getSubscriberCount(opacity)).toBe(baseline + 1)

      element.remove()
      await flushAsync()

      expect(getSubscriberCount(opacity)).toBe(baseline)
    })
  })

  describe('Effect cleanup', () => {
    it('createEffect inside component owner stops after component removal', () => {
      const [count, setCount] = createSignal(0)
      let effectRuns = 0
      let dispose: () => void = () => {}

      createRoot(disposeRoot => {
        dispose = disposeRoot
        createEffect(() => {
          count()
          effectRuns += 1
        })
      })

      expect(effectRuns).toBe(1)
      dispose()
      setCount(1)
      flushSync()
      expect(effectRuns).toBe(1)
    })

    it('rapid mount/unmount cycles do not produce post-cleanup effect errors', () => {
      const [value, setValue] = createSignal(0)
      expect(() => {
        for (let i = 0; i < 50; i += 1) {
          const mounted = mountWithModifiers(registry, document.createElement('div'), [
            { name: 'width', args: [value] },
          ])
          unmountMountedNode(mounted)
        }
        for (let i = 0; i < 25; i += 1) {
          setValue(i)
          flushSync()
        }
      }).not.toThrow()
      expect(getSubscriberCount(value)).toBe(0)
    })
  })

  describe('Re-mounting', () => {
    it('re-mounting re-establishes subscriptions correctly', () => {
      const [width] = createSignal(120)
      const baseline = getSubscriberCount(width)
      const first = mountWithModifiers(registry, document.createElement('div'), [
        { name: 'width', args: [width] },
      ])

      expect(getSubscriberCount(width)).toBe(baseline + 1)
      unmountMountedNode(first)
      expect(getSubscriberCount(width)).toBe(baseline)

      const second = mountWithModifiers(registry, document.createElement('div'), [
        { name: 'width', args: [width] },
      ])
      expect(getSubscriberCount(width)).toBe(baseline + 1)
      unmountMountedNode(second)
      expect(getSubscriberCount(width)).toBe(baseline)
    })

    it('re-mounted component reflects current signal value (not stale value)', () => {
      const [opacity, setOpacity] = createSignal(0.4)
      const firstElement = document.createElement('div')
      const first = mountWithModifiers(registry, firstElement, [
        { name: 'opacity', args: [opacity] },
      ])
      expect(firstElement.style.opacity).toBe('0.4')

      unmountMountedNode(first)
      setOpacity(0.9)
      flushSync()

      const secondElement = document.createElement('div')
      const second = mountWithModifiers(registry, secondElement, [
        { name: 'opacity', args: [opacity] },
      ])
      expect(secondElement.style.opacity).toBe('0.9')

      unmountMountedNode(second)
    })
  })

  describe('Memory leak validation', () => {
    memoryIt('100 components created then removed return to baseline subscriptions', () => {
      const [color] = createSignal('#123456')
      const baseline = getSubscriberCount(color)
      const mounts = Array.from({ length: 100 }, () =>
        mountWithModifiers(registry, document.createElement('div'), [
          { name: 'foregroundColor', args: [color] },
        ])
      )

      expect(getSubscriberCount(color)).toBe(baseline + 100)

      mounts.forEach(mounted => {
        unmountMountedNode(mounted)
      })

      expect(getSubscriberCount(color)).toBe(baseline)
    })

    memoryIt('1000 updates on removed component keep subscription count at baseline', () => {
      const [size, setSize] = createSignal(10)
      const baseline = getSubscriberCount(size)
      const mounted = mountWithModifiers(registry, document.createElement('div'), [
        { name: 'fontSize', args: [size] },
      ])

      unmountMountedNode(mounted)

      for (let i = 0; i < 1000; i += 1) {
        setSize(10 + i)
      }
      flushSync()

      expect(getSubscriberCount(size)).toBe(baseline)
    })
  })

  describe('Computed disposal', () => {
    it('computed disposal removes upstream signal subscription', () => {
      const [count] = createSignal(1)
      const baseline = getSubscriberCount(count)
      const doubled = createComputed(() => count() * 2)
      doubled()

      expect(getSubscriberCount(count)).toBe(baseline + 1)
      disposeComputed(doubled)
      expect(getSubscriberCount(count)).toBe(baseline)
    })

    it('disposing component using computed also cleans computed subscriptions', () => {
      const [count, setCount] = createSignal(2)
      const baseline = getSubscriberCount(count)
      const computedSize = createComputed(() => `${count() * 10}px`, {
        releaseOnNoObservers: true,
      })
      const mounted = mountWithModifiers(registry, document.createElement('div'), [
        { name: 'fontSize', args: [computedSize] },
      ])

      expect(getSubscriberCount(count)).toBe(baseline + 1)
      unmountMountedNode(mounted)

      expect(getSubscriberCount(count)).toBe(baseline)
      setCount(4)
      flushSync()
      expect(getSubscriberCount(count)).toBe(baseline)
    })
  })
})
