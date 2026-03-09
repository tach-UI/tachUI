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
import { getComputedImpl } from '../../src/reactive/computed'
import { ColorAsset } from '../../src/assets/ColorAsset'
import { getThemeSignal, setTheme } from '../../src/reactive/theme'
import {
  createModifierApplySpy,
  createTestRegistry,
  getSubscriberCount,
} from '../../tools/testing/reactive-test-helpers'

type RegisteredFactory = (...args: any[]) => any
type ModifierCall = { name: string; args: any[] }

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
      const applySpy = createModifierApplySpy('foregroundColor')
      const color = createComputed(() => {
        const nextColor = count() > 5 ? '#ff0000' : '#0000ff'
        applySpy.track(nextColor)
        return nextColor
      })
      const element = document.createElement('div')

      mountWithModifiers(registry, element, [{ name: 'foregroundColor', args: [color] }])

      expect(element.style.color).toBe('rgb(0, 0, 255)')
      expect(applySpy.callCount).toBe(1)

      setCount(8)
      flushSync()
      await flushAsync()

      expect(element.style.color).toBe('rgb(255, 0, 0)')
      expect(applySpy.callCount).toBe(2)
    })

    it('fontSize updates from computed px string', async () => {
      const [baseFontSize, setBaseFontSize] = createSignal(14)
      const applySpy = createModifierApplySpy('fontSize')
      const fontSize = createComputed(() => {
        const value = `${baseFontSize()}px`
        applySpy.track(value)
        return value
      })
      const element = document.createElement('div')

      mountWithModifiers(registry, element, [{ name: 'fontSize', args: [fontSize] }])
      expect(element.style.fontSize).toBe('14px')
      expect(applySpy.callCount).toBe(1)

      setBaseFontSize(20)
      flushSync()
      await flushAsync()

      expect(element.style.fontSize).toBe('20px')
      expect(applySpy.callCount).toBe(2)
    })

    it('opacity updates from computed active state', async () => {
      const [isActive, setIsActive] = createSignal(false)
      const applySpy = createModifierApplySpy('opacity')
      const opacity = createComputed(() => {
        const value = isActive() ? 1 : 0.5
        applySpy.track(value)
        return value
      })
      const element = document.createElement('div')

      mountWithModifiers(registry, element, [{ name: 'opacity', args: [opacity] }])
      expect(element.style.opacity).toBe('0.5')
      expect(applySpy.callCount).toBe(1)

      setIsActive(true)
      flushSync()
      await flushAsync()

      expect(element.style.opacity).toBe('1')
      expect(applySpy.callCount).toBe(2)
    })
  })

  describe('Chained computed', () => {
    it('signal -> computed A -> computed B propagates to modifier', async () => {
      const [base, setBase] = createSignal(2)
      const applySpy = createModifierApplySpy('fontSize-chain')
      const computedA = createComputed(() => base() * 2)
      const computedB = createComputed(() => {
        const value = `${computedA() * 2}px`
        applySpy.track(value)
        return value
      })
      const element = document.createElement('div')

      mountWithModifiers(registry, element, [{ name: 'fontSize', args: [computedB] }])
      expect(element.style.fontSize).toBe('8px')
      expect(applySpy.callCount).toBe(1)

      setBase(3)
      flushSync()
      await flushAsync()

      expect(element.style.fontSize).toBe('12px')
      expect(applySpy.callCount).toBe(2)
    })

    it('one computed from two signals updates when either source changes', async () => {
      const [a, setA] = createSignal(1)
      const [b, setB] = createSignal(2)
      const applySpy = createModifierApplySpy('fontSize-two-signals')
      const combined = createComputed(() => {
        const value = `${a() + b()}px`
        applySpy.track(value)
        return value
      })
      const element = document.createElement('div')

      mountWithModifiers(registry, element, [{ name: 'fontSize', args: [combined] }])
      expect(element.style.fontSize).toBe('3px')

      setA(4)
      flushSync()
      await flushAsync()
      expect(element.style.fontSize).toBe('6px')

      setB(10)
      flushSync()
      await flushAsync()
      expect(element.style.fontSize).toBe('14px')
      expect(applySpy.callCount).toBe(3)
    })
  })

  describe('Batching with computed', () => {
    it('batching two source updates runs computed once and applies once', async () => {
      const [a, setA] = createSignal(1)
      const [b, setB] = createSignal(3)
      const applySpy = createModifierApplySpy('fontSize-batch')
      const computedSize = createComputed(() => {
        const value = `${a() + b()}px`
        applySpy.track(value)
        return value
      })
      const element = document.createElement('div')

      mountWithModifiers(registry, element, [{ name: 'fontSize', args: [computedSize] }])
      expect(applySpy.callCount).toBe(1)

      batch(() => {
        setA(2)
        setB(4)
      })
      flushSync()
      await flushAsync()

      expect(element.style.fontSize).toBe('6px')
      expect(applySpy.callCount).toBe(2)
    })

    it('changing only one dependency re-runs computed once', async () => {
      const [themeScale, setThemeScale] = createSignal(1)
      const [baseSize] = createSignal(12)
      const applySpy = createModifierApplySpy('fontSize-single-dep')
      const computedSize = createComputed(() => {
        const value = `${baseSize() * themeScale()}px`
        applySpy.track(value)
        return value
      })
      const element = document.createElement('div')

      mountWithModifiers(registry, element, [{ name: 'fontSize', args: [computedSize] }])
      expect(applySpy.callCount).toBe(1)

      setThemeScale(2)
      flushSync()
      await flushAsync()

      expect(element.style.fontSize).toBe('24px')
      expect(applySpy.callCount).toBe(2)
    })
  })

  describe('Computed invalidation', () => {
    it('computed does not re-run for unrelated signal updates', async () => {
      const [source, setSource] = createSignal(10)
      const [unrelated, setUnrelated] = createSignal(0)
      const applySpy = createModifierApplySpy('fontSize-unrelated')
      const computedSize = createComputed(() => {
        const value = `${source()}px`
        applySpy.track(value)
        return value
      })
      const element = document.createElement('div')

      mountWithModifiers(registry, element, [{ name: 'fontSize', args: [computedSize] }])
      expect(applySpy.callCount).toBe(1)

      setUnrelated(1)
      flushSync()
      await flushAsync()
      expect(unrelated()).toBe(1)
      expect(applySpy.callCount).toBe(1)

      setSource(20)
      flushSync()
      await flushAsync()
      expect(applySpy.callCount).toBe(2)
      expect(element.style.fontSize).toBe('20px')
    })

    it('disposed computed stops updating modifier and releases subscribers', async () => {
      const [count, setCount] = createSignal(1)
      const applySpy = createModifierApplySpy('foregroundColor-dispose')
      const color = createComputed(() => {
        const next = count() > 0 ? '#00ff00' : '#ff0000'
        applySpy.track(next)
        return next
      })
      const element = document.createElement('div')

      mountWithModifiers(registry, element, [{ name: 'foregroundColor', args: [color] }])
      const baselineSubscriberCount = getSubscriberCount(count)
      expect(baselineSubscriberCount).toBe(1)
      expect(element.style.color).toBe('rgb(0, 255, 0)')
      expect(applySpy.callCount).toBe(1)

      getComputedImpl(color)?.dispose()
      expect(getSubscriberCount(count)).toBe(0)

      setCount(-1)
      flushSync()
      await flushAsync()

      expect(element.style.color).toBe('rgb(0, 255, 0)')
      expect(applySpy.callCount).toBe(1)
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
      const applySpy = createModifierApplySpy('foregroundColor-colorasset')
      const resolvedColor = createComputed(() => {
        const color = accent.resolve()
        applySpy.track(color)
        return color
      })
      const element = document.createElement('div')

      setTheme('light')
      mountWithModifiers(registry, element, [{ name: 'foregroundColor', args: [resolvedColor] }])
      expect(element.style.color).toBe('rgb(17, 17, 17)')

      setTheme('dark')
      await flushAsync()
      flushSync()

      expect(element.style.color).toBe('rgb(240, 240, 240)')
      expect(applySpy.callCount).toBeGreaterThanOrEqual(2)
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
      const applySpy = createModifierApplySpy('foregroundColor-multistep')

      const token = createComputed(() => (theme() === 'dark' ? 'dark' : 'light'))
      const resolvedColor = createComputed(() => {
        const color = token() === 'dark' ? darkColor.resolve() : lightColor.resolve()
        applySpy.track(color)
        return color
      })

      const element = document.createElement('div')
      setTheme('light')
      mountWithModifiers(registry, element, [{ name: 'foregroundColor', args: [resolvedColor] }])
      expect(element.style.color).toBe('rgb(34, 102, 170)')

      setTheme('dark')
      await flushAsync()
      flushSync()

      expect(element.style.color).toBe('rgb(136, 204, 255)')
      expect(applySpy.callCount).toBeGreaterThanOrEqual(2)
    })
  })
})
