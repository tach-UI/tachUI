import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { registerBasicModifiers } from '@tachui/modifiers'
import type { ModifierRegistry } from '@tachui/registry'
import { h } from '../../src/runtime'
import { applyModifiersToNode } from '../../src/modifiers'
import {
  batch,
  createComputed,
  createRoot,
  createSignal,
  flushSync,
} from '../../src/reactive'
import { ColorAsset } from '../../src/assets/ColorAsset'
import { getThemeSignal, setTheme } from '../../src/reactive/theme'
import {
  createTestRegistry,
  disposeComputed,
  getSubscriberCount,
} from '../../tools/testing/reactive-test-helpers'

type RegisteredFactory = (...args: any[]) => any
type ModifierCall = {
  name: string
  args: any[]
}

const mountedElements = new Set<HTMLElement>()
let componentIdCounter = 0

function mountWithModifiers(
  registry: ModifierRegistry,
  element: HTMLElement,
  modifierCalls: ModifierCall[]
): void {
  createRoot(dispose => {
    const node = h('div')
    // Intentional low-level path: this suite targets direct modifier application behavior.
    node.element = element

    const modifiers = modifierCalls.map(({ name, args }) => {
      const factory = registry.get(name) as RegisteredFactory | undefined
      if (!factory) {
        throw new Error(`Missing modifier factory in test registry: ${name}`)
      }
      return factory(...args)
    })

    componentIdCounter += 1
    applyModifiersToNode(node, modifiers, {
      componentId: `computed-updates-test-${componentIdCounter}`,
      element,
      phase: 'creation',
    })

    ;(element as any).__testDisposer = dispose
  })

  mountedElements.add(element)
}

function flushAsync(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

describe('computed modifier updates', () => {
  let registry: ModifierRegistry

  beforeEach(() => {
    document.body.innerHTML = ''
    componentIdCounter = 0
    registry = createTestRegistry()
    registerBasicModifiers({ registry })
    setTheme('light')
  })

  afterEach(() => {
    mountedElements.forEach(element => {
      ;(element as any).__testDisposer?.()
      delete (element as any).__testDisposer
    })
    mountedElements.clear()
    setTheme('light')
  })

  describe('Computed -> modifier -> DOM', () => {
    it('foregroundColor updates when computed threshold changes', async () => {
      const [count, setCount] = createSignal(2)
      const color = createComputed(() => (count() > 5 ? '#ff0000' : '#0000ff'))
      const element = document.createElement('div')

      mountWithModifiers(registry, element, [
        { name: 'foregroundColor', args: [color] },
      ])

      expect(element.style.color).toBe('rgb(0, 0, 255)')

      setCount(8)
      flushSync()
      await flushAsync()

      expect(element.style.color).toBe('rgb(255, 0, 0)')
    })

    it('fontSize updates from computed px string', async () => {
      const [baseFontSize, setBaseFontSize] = createSignal(14)
      const fontSize = createComputed(() => `${baseFontSize()}px`)
      const element = document.createElement('div')

      mountWithModifiers(registry, element, [
        { name: 'fontSize', args: [fontSize] },
      ])
      expect(element.style.fontSize).toBe('14px')

      setBaseFontSize(20)
      flushSync()
      await flushAsync()

      expect(element.style.fontSize).toBe('20px')
    })

    it('opacity updates from computed active state', async () => {
      const [isActive, setIsActive] = createSignal(false)
      const opacity = createComputed(() => (isActive() ? 1 : 0.5))
      const element = document.createElement('div')

      mountWithModifiers(registry, element, [
        { name: 'opacity', args: [opacity] },
      ])
      expect(element.style.opacity).toBe('0.5')

      setIsActive(true)
      flushSync()
      await flushAsync()

      expect(element.style.opacity).toBe('1')
    })
  })

  describe('Chained computed', () => {
    it('signal -> computed A -> computed B propagates to modifier', async () => {
      const [base, setBase] = createSignal(2)
      const computedA = createComputed(() => base() * 2)
      const computedB = createComputed(() => `${computedA() * 2}px`)
      const element = document.createElement('div')

      mountWithModifiers(registry, element, [
        { name: 'fontSize', args: [computedB] },
      ])
      expect(element.style.fontSize).toBe('8px')

      setBase(3)
      flushSync()
      await flushAsync()

      expect(element.style.fontSize).toBe('12px')
    })

    it('one computed from two signals updates when either source changes', async () => {
      const [a, setA] = createSignal(1)
      const [b, setB] = createSignal(2)
      const combined = createComputed(() => `${a() + b()}px`)
      const element = document.createElement('div')

      mountWithModifiers(registry, element, [
        { name: 'fontSize', args: [combined] },
      ])
      expect(element.style.fontSize).toBe('3px')

      setA(4)
      flushSync()
      await flushAsync()
      expect(element.style.fontSize).toBe('6px')

      setB(10)
      flushSync()
      await flushAsync()
      expect(element.style.fontSize).toBe('14px')
    })
  })

  describe('Batching with computed', () => {
    it('batching two source updates produces the correct final DOM value', async () => {
      const [a, setA] = createSignal(1)
      const [b, setB] = createSignal(3)
      const computedSize = createComputed(() => `${a() + b()}px`)
      const element = document.createElement('div')

      mountWithModifiers(registry, element, [
        { name: 'fontSize', args: [computedSize] },
      ])
      expect(element.style.fontSize).toBe('4px')

      batch(() => {
        setA(2)
        setB(4)
      })
      flushSync()
      await flushAsync()

      expect(element.style.fontSize).toBe('6px')
    })

    it('changing one dependency updates the final DOM value', async () => {
      const [themeScale, setThemeScale] = createSignal(1)
      const [baseSize] = createSignal(12)
      const computedSize = createComputed(() => `${baseSize() * themeScale()}px`)
      const element = document.createElement('div')

      mountWithModifiers(registry, element, [
        { name: 'fontSize', args: [computedSize] },
      ])
      expect(element.style.fontSize).toBe('12px')

      setThemeScale(2)
      flushSync()
      await flushAsync()

      expect(element.style.fontSize).toBe('24px')
    })
  })

  describe('Computed invalidation', () => {
    it('computed does not re-run for unrelated signal updates', async () => {
      const [source, setSource] = createSignal(10)
      const [unrelated, setUnrelated] = createSignal(0)
      const computedSize = createComputed(() => `${source()}px`)
      const element = document.createElement('div')

      mountWithModifiers(registry, element, [
        { name: 'fontSize', args: [computedSize] },
      ])
      expect(element.style.fontSize).toBe('10px')

      setUnrelated(1)
      flushSync()
      await flushAsync()
      expect(unrelated()).toBe(1)
      expect(element.style.fontSize).toBe('10px')

      setSource(20)
      flushSync()
      await flushAsync()
      expect(element.style.fontSize).toBe('20px')
    })

    it('disposed computed stops updating modifier and releases subscribers', async () => {
      const [count, setCount] = createSignal(1)
      const color = createComputed(() => (count() > 0 ? '#00ff00' : '#ff0000'))
      const element = document.createElement('div')

      mountWithModifiers(registry, element, [
        { name: 'foregroundColor', args: [color] },
      ])
      const baselineSubscriberCount = getSubscriberCount(count)
      expect(baselineSubscriberCount).toBeGreaterThanOrEqual(1)
      expect(element.style.color).toBe('rgb(0, 255, 0)')

      disposeComputed(color)
      expect(getSubscriberCount(count)).toBe(0)

      setCount(-1)
      flushSync()
      await flushAsync()

      expect(element.style.color).toBe('rgb(0, 255, 0)')
    })
  })

  describe('Computed with ColorAsset', () => {
    it('theme changes update ColorAsset-driven computed foreground color', async () => {
      const accent = ColorAsset.init({
        name: 'accent',
        default: '#111111',
        light: '#111111',
        dark: '#f0f0f0',
      })
      const resolvedColor = createComputed(() => accent.resolve())
      const element = document.createElement('div')

      setTheme('light')
      mountWithModifiers(registry, element, [
        { name: 'foregroundColor', args: [resolvedColor] },
      ])
      expect(element.style.color).toBe('rgb(17, 17, 17)')

      setTheme('dark')
      flushSync()
      await flushAsync()

      expect(element.style.color).toBe('rgb(240, 240, 240)')
    })

    it('theme -> computed token -> ColorAsset -> modifier -> DOM updates correctly', async () => {
      const lightColor = ColorAsset.init({
        name: 'token-light',
        default: '#2266aa',
      })
      const darkColor = ColorAsset.init({
        name: 'token-dark',
        default: '#88ccff',
      })
      const theme = getThemeSignal()

      const token = createComputed(() => (theme() === 'dark' ? 'dark' : 'light'))
      const resolvedColor = createComputed(() => {
        return token() === 'dark' ? darkColor.resolve() : lightColor.resolve()
      })

      const element = document.createElement('div')
      setTheme('light')
      mountWithModifiers(registry, element, [
        { name: 'foregroundColor', args: [resolvedColor] },
      ])
      expect(element.style.color).toBe('rgb(34, 102, 170)')

      setTheme('dark')
      flushSync()
      await flushAsync()

      expect(element.style.color).toBe('rgb(136, 204, 255)')
    })
  })
})
