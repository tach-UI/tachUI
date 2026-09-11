import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { ModifierRegistry } from '@tachui/registry'
import { h } from '../../src/runtime'
import { applyModifiersToNode } from '../../src/modifiers'
import {
  createComputed,
  createEffect,
  createRoot,
  createSignal,
  flushSync,
} from '../../src/reactive'
import {
  disposeComputed,
  getSubscriberCount,
} from '../../tools/testing/reactive-test-helpers'
import {
  createLifecycleRegistry,
  mountWithModifiers,
  unmountAll,
  unmountMountedNode,
} from './support/modifier-lifecycle-harness'

type ModifierCall = { name: string; args: any[] }
type MountedNode = {
  element: HTMLElement
  dispose: () => void
}

const mountedNodes = new Set<MountedNode>()
let componentIdCounter = 0
function flushAsync(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

describe('modifier lifecycle cleanup', () => {
  let registry: ModifierRegistry

  beforeEach(() => {
    registry = createLifecycleRegistry()
  })

  afterEach(() => {
    unmountAll()
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

    it('non-root path cleans never-connected elements after grace period', async () => {
      const [opacity] = createSignal(0.5)
      const baseline = getSubscriberCount(opacity)
      const element = document.createElement('div')

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
          componentId: 'non-root-never-connected-test',
          element,
          phase: 'creation',
        }
      )

      expect(getSubscriberCount(opacity)).toBe(baseline + 1)

      const deadline = Date.now() + 1000
      while (Date.now() < deadline && getSubscriberCount(opacity) !== baseline) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }

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
