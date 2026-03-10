import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { Text } from '@tachui/primitives'
import { globalModifierRegistry, type ModifierFactory } from '@tachui/registry'
import { registerBasicModifiers } from '@tachui/modifiers'
import { configureCore } from '../../src/config'
import { resetProxyCache, applyModifiersToNode } from '../../src/modifiers'
import { h } from '../../src/runtime'
import { createRoot, createSignal, flushSync } from '../../src/reactive'
import type { ComponentInstance } from '../../src/runtime/types'

const LATE_REACTIVE_PROXY_MODIFIER = 'lateReactiveProxyModifier'
const CACHE_INVALIDATE_MODIFIER = 'cacheInvalidateModifier'

function mountComponentModifiers(
  component: ComponentInstance,
  element: HTMLElement,
): () => void {
  let disposeRoot = () => {}
  createRoot(dispose => {
    disposeRoot = dispose
    const node = h('div')
    node.element = element
    applyModifiersToNode(node, component.modifiers, {
      componentId: component.id,
      componentInstance: component,
      element,
      phase: 'creation',
    })
  })
  return disposeRoot
}

describe('proxy reactive modifier coverage', () => {
  const cleanupDisposers = new Set<() => void>()
  let registryBaseline = new Map<string, ModifierFactory<any>>()

  const restoreRegistryBaseline = (): void => {
    globalModifierRegistry.clear()
    registryBaseline.forEach((factory, name) => {
      globalModifierRegistry.register(name, factory)
    })
  }

  beforeAll(() => {
    registerBasicModifiers({ registry: globalModifierRegistry })
    registryBaseline = new Map(
      globalModifierRegistry
        .list()
        .map(name => [name, globalModifierRegistry.get(name)] as const)
        .filter(
          (
            entry
          ): entry is readonly [string, ModifierFactory<any>] =>
            typeof entry[1] === 'function'
        )
    )
  })

  beforeEach(() => {
    document.body.innerHTML = ''
    configureCore({ proxyModifiers: true })
    restoreRegistryBaseline()
    resetProxyCache()
  })

  afterEach(() => {
    cleanupDisposers.forEach(dispose => {
      dispose()
    })
    cleanupDisposers.clear()
    configureCore({ proxyModifiers: true })
    restoreRegistryBaseline()
    resetProxyCache()
  })

  afterAll(() => {
    restoreRegistryBaseline()
    resetProxyCache()
  })

  describe('proxy resolves modifier names from registry', () => {
    it('resolves padding on proxy and accepts reactive signal argument', () => {
      const [paddingValue] = createSignal(12)
      const component = Text('hi') as ComponentInstance & {
        padding: (value: unknown) => ComponentInstance
      }

      expect(typeof component.padding).toBe('function')
      const chained = component.padding(paddingValue)
      expect(chained).toBe(component)
    })

    it('returns undefined for unknown modifier property access', () => {
      const component = Text('hi') as ComponentInstance & {
        nonExistentModifier?: unknown
      }

      expect(component.nonExistentModifier).toBeUndefined()
    })

    it('finds modifiers registered after proxy creation', () => {
      const component = Text('hi') as ComponentInstance & Record<string, unknown>

      expect(component[LATE_REACTIVE_PROXY_MODIFIER]).toBeUndefined()

      globalModifierRegistry.register(LATE_REACTIVE_PROXY_MODIFIER, () => ({
        type: 'appearance',
        priority: 100,
        properties: {},
        apply: (node: any) => node,
      }))

      expect(typeof component[LATE_REACTIVE_PROXY_MODIFIER]).toBe('function')
    })
  })

  describe('proxy + reactive modifier updates', () => {
    it('updates fontSize when signal changes in direct chain', () => {
      const [size, setSize] = createSignal(14)
      const built = Text('hi').fontSize(size).build() as ComponentInstance
      const element = document.createElement('div')

      const dispose = mountComponentModifiers(built, element)
      cleanupDisposers.add(dispose)
      expect(element.style.fontSize).toBe('14px')

      setSize(20)
      flushSync()
      expect(element.style.fontSize).toBe('20px')
      dispose()
      cleanupDisposers.delete(dispose)
    })

    it('deep chain updates only reactive fontSize property', () => {
      const [size, setSize] = createSignal(13)
      const built = Text('hi')
        .padding(16)
        .fontSize(size)
        .foregroundColor('#000')
        .build() as ComponentInstance
      const element = document.createElement('div')

      const dispose = mountComponentModifiers(built, element)
      cleanupDisposers.add(dispose)
      const initialPadding = element.style.padding
      const initialColor = element.style.color

      expect(element.style.fontSize).toBe('13px')
      expect(initialPadding).toBe('16px')
      expect(initialColor).toBe('rgb(0, 0, 0)')

      setSize(18)
      flushSync()

      expect(element.style.fontSize).toBe('18px')
      expect(element.style.padding).toBe(initialPadding)
      expect(element.style.color).toBe(initialColor)
      dispose()
      cleanupDisposers.delete(dispose)
    })

    it('returns same proxy reference across chained modifier calls', () => {
      const [size] = createSignal(15)
      const component = Text('hi') as ComponentInstance & {
        padding: (value: number) => ComponentInstance
        fontSize: (value: unknown) => ComponentInstance
        foregroundColor: (value: string) => ComponentInstance
      }

      const afterPadding = component.padding(16)
      const afterFontSize = afterPadding.fontSize(size)
      const afterColor = afterFontSize.foregroundColor('#000')

      expect(afterPadding).toBe(component)
      expect(afterFontSize).toBe(component)
      expect(afterColor).toBe(component)
    })

    it('preserves proxy wrapping across clone and reactive updates', () => {
      const [size, setSize] = createSignal(12)
      const original = Text('hi').fontSize(size).build() as ComponentInstance & {
        clone: () => ComponentInstance & { fontSize?: unknown }
      }
      const clone = original.clone()

      expect(typeof clone.fontSize).toBe('function')
      // Clone keeps the same reactive signal source, so updates flow to cloned instances too.
      expect(clone.modifiers[0]).toBe(original.modifiers[0])

      const element = document.createElement('div')
      const dispose = mountComponentModifiers(clone, element)
      cleanupDisposers.add(dispose)

      expect(element.style.fontSize).toBe('12px')
      setSize(22)
      flushSync()
      expect(element.style.fontSize).toBe('22px')
      dispose()
      cleanupDisposers.delete(dispose)
    })
  })

  describe('proxy caching behavior', () => {
    it('returns cached function reference on repeated modifier property access', () => {
      const component = Text('hi') as ComponentInstance & {
        padding: unknown
      }

      const firstRef = component.padding
      const secondRef = component.padding

      expect(firstRef).toBe(secondRef)
    })

    it('invalidates cache when modifier is re-registered', () => {
      globalModifierRegistry.register(CACHE_INVALIDATE_MODIFIER, () => ({
        type: 'appearance',
        priority: 100,
        properties: {},
        apply: (node: any) => node,
      }))

      const component = Text('hi') as ComponentInstance & Record<string, unknown>
      const firstRef = component[CACHE_INVALIDATE_MODIFIER]
      expect(typeof firstRef).toBe('function')

      globalModifierRegistry.register(CACHE_INVALIDATE_MODIFIER, () => ({
        type: 'appearance',
        priority: 100,
        properties: {},
        apply: (node: any) => node,
      }))

      const secondRef = component[CACHE_INVALIDATE_MODIFIER]
      expect(typeof secondRef).toBe('function')
      expect(secondRef).not.toBe(firstRef)
    })
  })

  describe('backwards compatibility', () => {
    it('returns ComponentInstance from .build() on proxy', () => {
      const built = Text('hi').padding(8).build() as ComponentInstance

      expect(built).toBeDefined()
      expect(built.type).toBe('component')
      expect(typeof built.id).toBe('string')
      expect(Array.isArray(built.modifiers)).toBe(true)
    })

    it('applies reactive values set before build to built component', () => {
      const [size, setSize] = createSignal(11)
      const proxy = Text('hi').fontSize(size)
      const built = proxy.build() as ComponentInstance
      const element = document.createElement('div')

      const dispose = mountComponentModifiers(built, element)
      cleanupDisposers.add(dispose)
      expect(element.style.fontSize).toBe('11px')

      setSize(19)
      flushSync()
      expect(element.style.fontSize).toBe('19px')
      dispose()
      cleanupDisposers.delete(dispose)
    })
  })
})
