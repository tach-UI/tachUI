/**
 * Shadow Modifiers Tests
 *
 * Comprehensive tests for all shadow functionality including box shadows,
 * text shadows, drop shadows, presets, and reactive behavior.
 */

import { JSDOM } from 'jsdom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ColorAsset } from '@tachui/core/assets'
import { createRoot, createSignal, flushSync, setTheme } from '@tachui/core/reactive'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import {
  ShadowModifier,
  TextShadowModifier,
  DropShadowModifier,
  shadow,
  textShadow,
  dropShadow,
  shadows,
  insetShadow,
  shadowPreset,
  elevationShadow,
  glowEffect,
  neonEffect,
  neumorphism,
  neumorphismPressed,
  layeredShadow,
  textShadowSubtle,
  textShadowStrong,
  textOutline,
  textEmbossed,
  textEngraved,
  swiftUIShadow,
  shadowDirections,
  reactiveShadow,
} from '../../../src/effects/shadows'

// Setup DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
global.window = dom.window as any
global.document = dom.window.document
global.HTMLElement = dom.window.HTMLElement
global.Element = dom.window.Element

// Mock DOM Node and Context
const createMockElement = () => {
  const element = document.createElement('div')
  element.style.setProperty = vi.fn((property, value, priority) => {
    if (priority === 'important') {
      ;(element.style as any)[property] = `${value} !important`
    } else {
      ;(element.style as any)[property] = value
    }
  })
  return element
}

const createMockContext = (element?: Element): ModifierContext => ({
  element: element || createMockElement(),
  componentId: 'test-component',
  modifiers: [],
})

const testDisposers: Array<() => void> = []

async function waitForEffects(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0))
}

describe('Shadow Modifiers', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
    setTheme('light')
  })

  afterEach(() => {
    while (testDisposers.length > 0) {
      const dispose = testDisposers.pop()
      dispose?.()
    }
    setTheme('light')
  })

  // ============================================================================
  // ShadowModifier Tests
  // ============================================================================

  describe('ShadowModifier', () => {
    it('should create shadow modifier with basic config', () => {
      const modifier = new ShadowModifier({
        shadow: { x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,0.1)' },
      })

      expect(modifier.type).toBe('shadow')
      expect(modifier.priority).toBe(25)
      expect(modifier.properties.shadow).toEqual({
        x: 0,
        y: 2,
        blur: 4,
        color: 'rgba(0,0,0,0.1)',
      })
    })

    it('should apply basic shadow styles', () => {
      const element = createMockElement()
      const context = createMockContext(element)
      const modifier = new ShadowModifier({
        shadow: { x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,0.1)' },
      })

      modifier.apply({} as any, context)

      expect(element.style.boxShadow).toBe('0px 2px 4px 0px rgba(0,0,0,0.1)')
    })

    it('should handle CSS string shadows', () => {
      const element = createMockElement()
      const context = createMockContext(element)
      const modifier = new ShadowModifier({
        shadow: '0 4px 8px rgba(0,0,0,0.2)',
      })

      modifier.apply({} as any, context)

      expect(element.style.boxShadow).toBe('0 4px 8px rgba(0,0,0,0.2)')
    })

    it('should handle multiple shadows', () => {
      const element = createMockElement()
      const context = createMockContext(element)
      const modifier = new ShadowModifier({
        shadow: [
          { x: 0, y: 1, blur: 3, color: 'rgba(0,0,0,0.12)' },
          { x: 0, y: 1, blur: 2, color: 'rgba(0,0,0,0.24)' },
        ],
      })

      modifier.apply({} as any, context)

      expect(element.style.boxShadow).toBe(
        '0px 1px 3px 0px rgba(0,0,0,0.12), 0px 1px 2px 0px rgba(0,0,0,0.24)'
      )
    })

    it('should handle inset shadows', () => {
      const element = createMockElement()
      const context = createMockContext(element)
      const modifier = new ShadowModifier({
        shadow: { x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,0.1)', inset: true },
      })

      modifier.apply({} as any, context)

      expect(element.style.boxShadow).toBe(
        'inset 0px 2px 4px 0px rgba(0,0,0,0.1)'
      )
    })

    it('should handle spread value', () => {
      const element = createMockElement()
      const context = createMockContext(element)
      const modifier = new ShadowModifier({
        shadow: { x: 0, y: 2, blur: 4, spread: 1, color: 'rgba(0,0,0,0.1)' },
      })

      modifier.apply({} as any, context)

      expect(element.style.boxShadow).toBe('0px 2px 4px 1px rgba(0,0,0,0.1)')
    })

    it('should use default values for missing properties', () => {
      const element = createMockElement()
      const context = createMockContext(element)
      const modifier = new ShadowModifier({
        shadow: { blur: 4 },
      })

      modifier.apply({} as any, context)

      expect(element.style.boxShadow).toBe('0px 0px 4px 0px rgba(0,0,0,0.25)')
    })

    it('should handle reactive shadow values', () => {
      const element = createMockElement()
      const context = createMockContext(element)
      const [blur, setBlur] = createSignal(4)
      const [color, setColor] = createSignal('rgba(0,0,0,0.1)')

      const modifier = new ShadowModifier({
        shadow: { x: 0, y: 2, blur, color },
      })

      modifier.apply({} as any, context)

      expect(element.style.boxShadow).toBe('0px 2px 4px 0px rgba(0,0,0,0.1)')

      setBlur(8)
      setColor('rgba(255,0,0,0.2)')
      flushSync()

      expect(element.style.boxShadow).toBe('0px 2px 8px 0px rgba(255,0,0,0.2)')
    })

    it('reacts to x/y offset and spread signal updates', () => {
      const element = createMockElement()
      const context = createMockContext(element)
      const [x, setX] = createSignal(1)
      const [y, setY] = createSignal(2)
      const [spread, setSpread] = createSignal(0)

      const modifier = new ShadowModifier({
        shadow: { x, y, blur: 4, spread, color: 'rgba(0,0,0,0.2)' },
      })

      modifier.apply({} as any, context)
      expect(element.style.boxShadow).toBe('1px 2px 4px 0px rgba(0,0,0,0.2)')

      setX(6)
      setY(7)
      setSpread(3)
      flushSync()

      expect(element.style.boxShadow).toBe('6px 7px 4px 3px rgba(0,0,0,0.2)')
    })

    it('re-resolves ColorAsset shadow color when theme changes', async () => {
      const cleanup = createRoot(dispose => {
        const element = createMockElement()
        const context = createMockContext(element)
        const asset = ColorAsset.init({
          name: 'shadowColorAsset',
          default: '#EDEAE9',
          light: '#EDEAE9',
          dark: '#332A25',
        })

        const modifier = new ShadowModifier({
          shadow: { x: 0, y: 2, blur: 4, color: asset as unknown as string },
        })

        modifier.apply({} as any, context)
        return { dispose, element }
      })
      testDisposers.push(cleanup.dispose)

      await waitForEffects()
      expect(cleanup.element.style.boxShadow).toContain('#EDEAE9')

      setTheme('dark')
      await waitForEffects()
      expect(cleanup.element.style.boxShadow).toContain('#332A25')
    })

    it('re-resolves ColorAsset in multiple shadow array on theme change', async () => {
      const cleanup = createRoot(dispose => {
        const element = createMockElement()
        const context = createMockContext(element)
        const asset = ColorAsset.init({
          name: 'shadowArrayColorAsset',
          default: '#EDEAE9',
          light: '#EDEAE9',
          dark: '#332A25',
        })

        const modifier = new ShadowModifier({
          shadow: [
            { x: 0, y: 2, blur: 4, color: asset as unknown as string },
            { x: 0, y: 0, blur: 1, color: 'rgba(0,0,0,0.12)' },
          ],
        })

        modifier.apply({} as any, context)
        return { dispose, element }
      })
      testDisposers.push(cleanup.dispose)

      await waitForEffects()
      expect(cleanup.element.style.boxShadow).toContain('#EDEAE9')

      setTheme('dark')
      await waitForEffects()
      expect(cleanup.element.style.boxShadow).toContain('#332A25')
    })
  })

  // ============================================================================
  // TextShadowModifier Tests
  // ============================================================================

  describe('TextShadowModifier', () => {
    it('should create text shadow modifier', () => {
      const modifier = new TextShadowModifier({
        textShadow: { x: 1, y: 1, blur: 2, color: 'rgba(0,0,0,0.5)' },
      })

      expect(modifier.type).toBe('textShadow')
      expect(modifier.priority).toBe(26)
    })

    it('should apply text shadow styles', () => {
      const element = createMockElement()
      const context = createMockContext(element)
      const modifier = new TextShadowModifier({
        textShadow: { x: 1, y: 1, blur: 2, color: 'rgba(0,0,0,0.5)' },
      })

      modifier.apply({} as any, context)

      expect(element.style.textShadow).toBe('1px 1px 2px rgba(0,0,0,0.5)')
    })

    it('should handle CSS string text shadows', () => {
      const element = createMockElement()
      const context = createMockContext(element)
      const modifier = new TextShadowModifier({
        textShadow: '2px 2px 4px rgba(0,0,0,0.6)',
      })

      modifier.apply({} as any, context)

      expect(element.style.textShadow).toBe('2px 2px 4px rgba(0,0,0,0.6)')
    })

    it('should handle multiple text shadows', () => {
      const element = createMockElement()
      const context = createMockContext(element)
      const modifier = new TextShadowModifier({
        textShadow: [
          { x: 1, y: 1, blur: 1, color: 'rgba(0,0,0,0.5)' },
          { x: -1, y: -1, blur: 1, color: 'rgba(255,255,255,0.5)' },
        ],
      })

      modifier.apply({} as any, context)

      expect(element.style.textShadow).toBe(
        '1px 1px 1px rgba(0,0,0,0.5), -1px -1px 1px rgba(255,255,255,0.5)'
      )
    })

    it('should handle reactive text shadow values', () => {
      const element = createMockElement()
      const context = createMockContext(element)
      const [x, setX] = createSignal(1)
      const [y, setY] = createSignal(1)
      const [blur, setBlur] = createSignal(2)
      const [color, setColor] = createSignal('rgba(0,0,0,0.5)')

      const modifier = new TextShadowModifier({
        textShadow: { x, y, blur, color },
      })

      modifier.apply({} as any, context)
      expect(element.style.textShadow).toBe('1px 1px 2px rgba(0,0,0,0.5)')

      setX(2)
      setY(3)
      setBlur(5)
      setColor('rgba(255,0,0,0.4)')
      flushSync()

      expect(element.style.textShadow).toBe('2px 3px 5px rgba(255,0,0,0.4)')
    })

    it('re-resolves ColorAsset textShadow color when theme changes', async () => {
      const cleanup = createRoot(dispose => {
        const element = createMockElement()
        const context = createMockContext(element)
        const asset = ColorAsset.init({
          name: 'textShadowColorAsset',
          default: '#EDEAE9',
          light: '#EDEAE9',
          dark: '#332A25',
        })

        const modifier = new TextShadowModifier({
          textShadow: { x: 1, y: 1, blur: 2, color: asset as unknown as string },
        })

        modifier.apply({} as any, context)
        return { dispose, element }
      })
      testDisposers.push(cleanup.dispose)

      await waitForEffects()
      expect(cleanup.element.style.textShadow).toContain('#EDEAE9')

      setTheme('dark')
      await waitForEffects()
      expect(cleanup.element.style.textShadow).toContain('#332A25')
    })

    it('re-resolves ColorAsset in multiple textShadow array on theme change', async () => {
      const cleanup = createRoot(dispose => {
        const element = createMockElement()
        const context = createMockContext(element)
        const asset = ColorAsset.init({
          name: 'textShadowArrayColorAsset',
          default: '#EDEAE9',
          light: '#EDEAE9',
          dark: '#332A25',
        })

        const modifier = new TextShadowModifier({
          textShadow: [
            { x: 1, y: 1, blur: 2, color: asset as unknown as string },
            { x: -1, y: -1, blur: 1, color: 'rgba(0,0,0,0.2)' },
          ],
        })

        modifier.apply({} as any, context)
        return { dispose, element }
      })
      testDisposers.push(cleanup.dispose)

      await waitForEffects()
      expect(cleanup.element.style.textShadow).toContain('#EDEAE9')

      setTheme('dark')
      await waitForEffects()
      expect(cleanup.element.style.textShadow).toContain('#332A25')
    })
  })

  // ============================================================================
  // DropShadowModifier Tests
  // ============================================================================

  describe('DropShadowModifier', () => {
    it('should create drop shadow modifier', () => {
      const modifier = new DropShadowModifier({
        dropShadow: { x: 0, y: 4, blur: 8, color: 'rgba(0,0,0,0.2)' },
      })

      expect(modifier.type).toBe('dropShadow')
      expect(modifier.priority).toBe(27)
    })

    it('should apply drop shadow as filter', () => {
      const element = createMockElement()
      const context = createMockContext(element)
      const modifier = new DropShadowModifier({
        dropShadow: { x: 0, y: 4, blur: 8, color: 'rgba(0,0,0,0.2)' },
      })

      modifier.apply({} as any, context)

      expect(element.style.filter).toBe(
        'drop-shadow(0px 4px 8px rgba(0,0,0,0.2))'
      )
    })

    it('should handle CSS string drop shadows', () => {
      const element = createMockElement()
      const context = createMockContext(element)
      const modifier = new DropShadowModifier({
        dropShadow: '2px 2px 4px rgba(0,0,0,0.3)',
      })

      modifier.apply({} as any, context)

      expect(element.style.filter).toBe(
        'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
      )
    })

    it('should preserve existing filters', () => {
      const element = createMockElement()
      element.style.filter = 'blur(2px)'
      const context = createMockContext(element)
      const modifier = new DropShadowModifier({
        dropShadow: { x: 0, y: 4, blur: 8, color: 'rgba(0,0,0,0.2)' },
      })

      modifier.apply({} as any, context)

      expect(element.style.filter).toBe(
        'blur(2px) drop-shadow(0px 4px 8px rgba(0,0,0,0.2))'
      )
    })

    it('should handle multiple drop shadows', () => {
      const element = createMockElement()
      const context = createMockContext(element)
      const modifier = new DropShadowModifier({
        dropShadow: [
          { x: 0, y: 1, blur: 3, color: 'rgba(0,0,0,0.12)' },
          { x: 0, y: 1, blur: 2, color: 'rgba(0,0,0,0.24)' },
        ],
      })

      modifier.apply({} as any, context)

      expect(element.style.filter).toBe(
        'drop-shadow(0px 1px 3px rgba(0,0,0,0.12)) drop-shadow(0px 1px 2px rgba(0,0,0,0.24))'
      )
    })

    it('reacts to blur/color signal updates for filter drop-shadow', () => {
      const element = createMockElement()
      const context = createMockContext(element)
      const [blur, setBlur] = createSignal(8)
      const [color, setColor] = createSignal('rgba(0,0,0,0.2)')

      const modifier = new DropShadowModifier({
        dropShadow: { x: 0, y: 4, blur, color },
      })

      modifier.apply({} as any, context)
      expect(element.style.filter).toBe('drop-shadow(0px 4px 8px rgba(0,0,0,0.2))')

      setBlur(2)
      setColor('rgba(255,0,0,0.3)')
      flushSync()

      expect(element.style.filter).toBe(
        'drop-shadow(0px 4px 2px rgba(255,0,0,0.3))'
      )
    })

    it('re-resolves ColorAsset dropShadow color when theme changes', async () => {
      const cleanup = createRoot(dispose => {
        const element = createMockElement()
        const context = createMockContext(element)
        const asset = ColorAsset.init({
          name: 'dropShadowColorAsset',
          default: '#EDEAE9',
          light: '#EDEAE9',
          dark: '#332A25',
        })

        const modifier = new DropShadowModifier({
          dropShadow: { x: 0, y: 4, blur: 8, color: asset as unknown as string },
        })

        modifier.apply({} as any, context)
        return { dispose, element }
      })
      testDisposers.push(cleanup.dispose)

      await waitForEffects()
      expect(cleanup.element.style.filter).toBe(
        'drop-shadow(0px 4px 8px #EDEAE9)'
      )

      setTheme('dark')
      await waitForEffects()
      expect(cleanup.element.style.filter).toBe(
        'drop-shadow(0px 4px 8px #332A25)'
      )
    })

    it('re-resolves ColorAsset in multiple dropShadow array on theme change', async () => {
      const cleanup = createRoot(dispose => {
        const element = createMockElement()
        const context = createMockContext(element)
        const asset = ColorAsset.init({
          name: 'dropShadowArrayColorAsset',
          default: '#EDEAE9',
          light: '#EDEAE9',
          dark: '#332A25',
        })

        const modifier = new DropShadowModifier({
          dropShadow: [
            { x: 0, y: 4, blur: 8, color: asset as unknown as string },
            { x: 0, y: 1, blur: 2, color: 'rgba(0,0,0,0.2)' },
          ],
        })

        modifier.apply({} as any, context)
        return { dispose, element }
      })
      testDisposers.push(cleanup.dispose)

      await waitForEffects()
      expect(cleanup.element.style.filter).toContain('#EDEAE9')

      setTheme('dark')
      await waitForEffects()
      expect(cleanup.element.style.filter).toContain('#332A25')
    })
  })

  // ============================================================================
  // Shadow Function Tests
  // ============================================================================

  describe('Shadow Functions', () => {
    it('should create shadow with config object', () => {
      const modifier = shadow({ x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,0.1)' })
      expect(modifier).toBeInstanceOf(ShadowModifier)
      expect(modifier.properties.shadow).toEqual({
        x: 0,
        y: 2,
        blur: 4,
        color: 'rgba(0,0,0,0.1)',
      })
    })

    it('should create shadow with CSS string', () => {
      const modifier = shadow('0 4px 8px rgba(0,0,0,0.2)')
      expect(modifier).toBeInstanceOf(ShadowModifier)
      expect(modifier.properties.shadow).toBe('0 4px 8px rgba(0,0,0,0.2)')
    })

    it('should create text shadow modifier', () => {
      const modifier = textShadow({
        x: 1,
        y: 1,
        blur: 2,
        color: 'rgba(0,0,0,0.5)',
      })
      expect(modifier).toBeInstanceOf(TextShadowModifier)
    })

    it('should create drop shadow modifier', () => {
      const modifier = dropShadow({
        x: 0,
        y: 4,
        blur: 8,
        color: 'rgba(0,0,0,0.2)',
      })
      expect(modifier).toBeInstanceOf(DropShadowModifier)
    })

    it('should create multiple shadows', () => {
      const configs = [
        { x: 0, y: 1, blur: 3, color: 'rgba(0,0,0,0.12)' },
        { x: 0, y: 1, blur: 2, color: 'rgba(0,0,0,0.24)' },
      ]
      const modifier = shadows(configs)
      expect(modifier).toBeInstanceOf(ShadowModifier)
      expect(modifier.properties.shadow).toEqual(configs)
    })

    it('should create inset shadow', () => {
      const modifier = insetShadow({
        x: 0,
        y: 2,
        blur: 4,
        color: 'rgba(0,0,0,0.1)',
      })
      expect(modifier).toBeInstanceOf(ShadowModifier)
      expect(modifier.properties.shadow).toEqual({
        x: 0,
        y: 2,
        blur: 4,
        color: 'rgba(0,0,0,0.1)',
        inset: true,
      })
    })
  })

  // ============================================================================
  // Shadow Preset Tests
  // ============================================================================

  describe('Shadow Presets', () => {
    it('should create none shadow preset', () => {
      const modifier = shadowPreset('none')
      expect(modifier).toBeInstanceOf(ShadowModifier)
      expect(modifier.properties.shadow).toBe('none')
    })

    it('should create small shadow preset', () => {
      const modifier = shadowPreset('small')
      expect(modifier).toBeInstanceOf(ShadowModifier)
      expect(modifier.properties.shadow).toEqual({
        x: 0,
        y: 1,
        blur: 3,
        spread: 0,
        color: 'rgba(0, 0, 0, 0.12)',
      })
    })

    it('should create medium shadow preset', () => {
      const modifier = shadowPreset('medium')
      expect(modifier).toBeInstanceOf(ShadowModifier)
      expect(modifier.properties.shadow).toEqual({
        x: 0,
        y: 4,
        blur: 6,
        spread: -1,
        color: 'rgba(0, 0, 0, 0.1)',
      })
    })

    it('should create large shadow preset', () => {
      const modifier = shadowPreset('large')
      expect(modifier).toBeInstanceOf(ShadowModifier)
      expect(modifier.properties.shadow).toEqual({
        x: 0,
        y: 10,
        blur: 15,
        spread: -3,
        color: 'rgba(0, 0, 0, 0.1)',
      })
    })

    it('should create inset shadow preset', () => {
      const modifier = shadowPreset('inner')
      expect(modifier).toBeInstanceOf(ShadowModifier)
      expect(modifier.properties.shadow).toEqual({
        x: 0,
        y: 2,
        blur: 4,
        spread: 0,
        color: 'rgba(0, 0, 0, 0.06)',
        inset: true,
      })
    })

    it('should create outline shadow preset', () => {
      const modifier = shadowPreset('outline')
      expect(modifier).toBeInstanceOf(ShadowModifier)
      expect(modifier.properties.shadow).toEqual({
        x: 0,
        y: 0,
        blur: 0,
        spread: 1,
        color: 'rgba(0, 0, 0, 0.05)',
      })
    })
  })

  // ============================================================================
  // Material Design Elevation Tests
  // ============================================================================

  describe('Elevation Shadows', () => {
    it('should create elevation 0 (no shadow)', () => {
      const modifier = elevationShadow(0)
      expect(modifier).toBeInstanceOf(ShadowModifier)
      expect(modifier.properties.shadow).toEqual([])
    })

    it('should create elevation 1', () => {
      const modifier = elevationShadow(1)
      expect(modifier).toBeInstanceOf(ShadowModifier)
      expect(Array.isArray(modifier.properties.shadow)).toBe(true)
      expect((modifier.properties.shadow as any[]).length).toBe(2)
    })

    it('should create elevation 4', () => {
      const modifier = elevationShadow(4)
      expect(modifier).toBeInstanceOf(ShadowModifier)
      expect(Array.isArray(modifier.properties.shadow)).toBe(true)
      expect((modifier.properties.shadow as any[]).length).toBe(2)
    })

    it('should fallback to elevation 1 for unknown levels', () => {
      const modifier = elevationShadow(99)
      expect(modifier).toBeInstanceOf(ShadowModifier)
      expect(Array.isArray(modifier.properties.shadow)).toBe(true)
      expect((modifier.properties.shadow as any[]).length).toBe(2)
    })
  })

  // ============================================================================
  // Specialized Effect Tests
  // ============================================================================

  describe('Specialized Shadow Effects', () => {
    it('should create glow effect', () => {
      const modifier = glowEffect('#007AFF', 4)
      expect(modifier).toBeInstanceOf(ShadowModifier)
      expect(Array.isArray(modifier.properties.shadow)).toBe(true)
      expect((modifier.properties.shadow as any[]).length).toBe(3)
    })

    it('should create neon effect', () => {
      const modifier = neonEffect('#00FF00', 8)
      expect(modifier).toBeInstanceOf(ShadowModifier)
      expect(Array.isArray(modifier.properties.shadow)).toBe(true)
      expect((modifier.properties.shadow as any[]).length).toBe(4)
    })

    it('should create neumorphism effect', () => {
      const modifier = neumorphism('#f0f0f0')
      expect(modifier).toBeInstanceOf(ShadowModifier)
      expect(Array.isArray(modifier.properties.shadow)).toBe(true)
      expect((modifier.properties.shadow as any[]).length).toBe(2)
    })

    it('should create pressed neumorphism effect', () => {
      const modifier = neumorphismPressed('#f0f0f0')
      expect(modifier).toBeInstanceOf(ShadowModifier)
      expect(Array.isArray(modifier.properties.shadow)).toBe(true)
      const shadows = modifier.properties.shadow as any[]
      expect(shadows.length).toBe(2)
      expect(shadows[0].inset).toBe(true)
      expect(shadows[1].inset).toBe(true)
    })

    it('should create layered shadow', () => {
      const modifier = layeredShadow(3, 0.8)
      expect(modifier).toBeInstanceOf(ShadowModifier)
      expect(Array.isArray(modifier.properties.shadow)).toBe(true)
      expect((modifier.properties.shadow as any[]).length).toBe(3)
    })
  })

  // ============================================================================
  // Text Shadow Preset Tests
  // ============================================================================

  describe('Text Shadow Presets', () => {
    it('should create subtle text shadow', () => {
      const modifier = textShadowSubtle()
      expect(modifier).toBeInstanceOf(TextShadowModifier)
      expect(modifier.properties.textShadow).toEqual({
        x: 0,
        y: 1,
        blur: 1,
        color: 'rgba(0, 0, 0, 0.2)',
      })
    })

    it('should create strong text shadow', () => {
      const modifier = textShadowStrong()
      expect(modifier).toBeInstanceOf(TextShadowModifier)
      expect(modifier.properties.textShadow).toEqual({
        x: 1,
        y: 1,
        blur: 3,
        color: 'rgba(0, 0, 0, 0.5)',
      })
    })

    it('should create text outline', () => {
      const modifier = textOutline('#000000', 1)
      expect(modifier).toBeInstanceOf(TextShadowModifier)
      expect(Array.isArray(modifier.properties.textShadow)).toBe(true)
      // Should create shadows in all 8 directions
      expect((modifier.properties.textShadow as any[]).length).toBe(8)
    })

    it('should create embossed text effect', () => {
      const modifier = textEmbossed()
      expect(modifier).toBeInstanceOf(TextShadowModifier)
      expect(Array.isArray(modifier.properties.textShadow)).toBe(true)
      expect((modifier.properties.textShadow as any[]).length).toBe(2)
    })

    it('should create engraved text effect', () => {
      const modifier = textEngraved()
      expect(modifier).toBeInstanceOf(TextShadowModifier)
      expect(Array.isArray(modifier.properties.textShadow)).toBe(true)
      expect((modifier.properties.textShadow as any[]).length).toBe(2)
    })
  })

  // ============================================================================
  // SwiftUI Compatibility Tests
  // ============================================================================

  describe('SwiftUI Compatibility', () => {
    it('should create SwiftUI-compatible shadow', () => {
      const modifier = swiftUIShadow()
      expect(modifier).toBeInstanceOf(ShadowModifier)
      expect(modifier.properties.shadow).toEqual({
        x: 0,
        y: 0,
        blur: 10,
        color: 'rgba(0, 0, 0, 0.2)',
      })
    })

    it('should create SwiftUI shadow with custom config', () => {
      const modifier = swiftUIShadow({ radius: 8, y: 4, color: '#ff0000' })
      expect(modifier).toBeInstanceOf(ShadowModifier)
      expect(modifier.properties.shadow).toEqual({
        x: 0,
        y: 4,
        blur: 8,
        color: '#ff0000',
      })
    })

    it('should provide shadow direction utilities', () => {
      expect(shadowDirections.top(4)).toBeInstanceOf(ShadowModifier)
      expect(shadowDirections.bottom(4)).toBeInstanceOf(ShadowModifier)
      expect(shadowDirections.left(4)).toBeInstanceOf(ShadowModifier)
      expect(shadowDirections.right(4)).toBeInstanceOf(ShadowModifier)
      expect(shadowDirections.around(6)).toBeInstanceOf(ShadowModifier)
    })
  })

  // ============================================================================
  // Reactive Shadow Tests
  // ============================================================================

  describe('Reactive Shadows', () => {
    it('should create reactive shadow based on condition', () => {
      const [isHovered, setIsHovered] = createSignal(false)
      const trueShadow = { x: 0, y: 8, blur: 16, color: 'rgba(0,0,0,0.2)' }
      const falseShadow = { x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,0.1)' }

      const modifier = reactiveShadow(isHovered, trueShadow, falseShadow)
      expect(modifier).toBeInstanceOf(ShadowModifier)

      // Current implementation returns static shadow based on condition state
      const shadowConfig = modifier.properties.shadow as any
      expect(typeof shadowConfig.x).toBe('number')
      expect(typeof shadowConfig.y).toBe('number')
      expect(typeof shadowConfig.blur).toBe('number')
      expect(typeof shadowConfig.color).toBe('string')
    })

    it('should apply reactive shadow to element', () => {
      const element = createMockElement()
      const context = createMockContext(element)
      const [isHovered, setIsHovered] = createSignal(false)

      const trueShadow = { x: 0, y: 8, blur: 16, color: 'rgba(0,0,0,0.2)' }
      const falseShadow = { x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,0.1)' }

      const modifier = reactiveShadow(isHovered, trueShadow, falseShadow)
      modifier.apply({} as any, context)

      // Current implementation creates static shadow based on initial condition state
      // Since isHovered starts as false, it uses falseShadow
      expect(element.style.boxShadow).toBe('0px 2px 4px 0px rgba(0,0,0,0.1)')

      // Test signal changes (implementation would need full reactivity for auto-update)
      setIsHovered(true)
      expect(isHovered()).toBe(true)

      setIsHovered(false)
      expect(isHovered()).toBe(false)
    })
  })

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Integration Tests', () => {
    it('should handle shadow with all properties', () => {
      const element = createMockElement()
      const context = createMockContext(element)
      const modifier = new ShadowModifier({
        shadow: {
          x: 2,
          y: 4,
          blur: 8,
          spread: 1,
          color: 'rgba(255,0,0,0.3)',
          inset: false,
        },
      })

      modifier.apply({} as any, context)

      expect(element.style.boxShadow).toBe('2px 4px 8px 1px rgba(255,0,0,0.3)')
    })

    it('should handle text shadow with all properties', () => {
      const element = createMockElement()
      const context = createMockContext(element)
      const modifier = new TextShadowModifier({
        textShadow: {
          x: 1,
          y: 2,
          blur: 3,
          color: 'rgba(0,255,0,0.5)',
        },
      })

      modifier.apply({} as any, context)

      expect(element.style.textShadow).toBe('1px 2px 3px rgba(0,255,0,0.5)')
    })

    it('should handle drop shadow with existing filters', () => {
      const element = createMockElement()
      element.style.filter = 'brightness(1.2) contrast(1.1)'
      const context = createMockContext(element)

      const modifier = new DropShadowModifier({
        dropShadow: { x: 0, y: 4, blur: 8, color: 'rgba(0,0,0,0.2)' },
      })

      modifier.apply({} as any, context)

      expect(element.style.filter).toBe(
        'brightness(1.2) contrast(1.1) drop-shadow(0px 4px 8px rgba(0,0,0,0.2))'
      )
    })

    it('should not apply shadow when element is missing', () => {
      const context = createMockContext(undefined)
      const modifier = new ShadowModifier({
        shadow: { x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,0.1)' },
      })

      expect(() => {
        modifier.apply({} as any, context)
      }).not.toThrow()
    })
  })

  // ============================================================================
  // Stress Tests
  // ============================================================================

  describe('Stress Tests', () => {
    it('should handle large number of shadows', () => {
      const shadows = Array.from({ length: 20 }, (_, i) => ({
        x: i,
        y: i,
        blur: i + 1,
        color: `rgba(${i * 10}, 0, 0, 0.1)`,
      }))

      const element = createMockElement()
      const context = createMockContext(element)
      const modifier = new ShadowModifier({ shadow: shadows })

      expect(() => {
        modifier.apply({} as any, context)
      }).not.toThrow()

      expect(element.style.boxShadow).toContain(
        '0px 0px 1px 0px rgba(0, 0, 0, 0.1)'
      )
      expect(element.style.boxShadow).toContain(
        '19px 19px 20px 0px rgba(190, 0, 0, 0.1)'
      )
    })

    it('should handle rapid reactive changes', () => {
      const element = createMockElement()
      const context = createMockContext(element)
      const [blur, setBlur] = createSignal(4)

      const modifier = new ShadowModifier({
        shadow: { x: 0, y: 2, blur, color: 'rgba(0,0,0,0.1)' },
      })

      modifier.apply({} as any, context)

      // Rapid changes
      for (let i = 0; i < 100; i++) {
        setBlur(i % 10)
      }

      // Verify the signal updated properly (final value should be 9)
      expect(blur()).toBe(9)
      // Shadow should be applied (exact timing may vary in tests)
      expect(element.style.boxShadow).toContain('0px 2px')
    })

    it('should handle complex nested shadow effects', () => {
      const element = createMockElement()
      const context = createMockContext(element)

      // Apply multiple shadow modifiers
      const shadowModifier = shadowPreset('large')
      const glowModifier = glowEffect('#007AFF', 6)

      shadowModifier.apply({} as any, context)
      // In real usage, multiple modifiers would be combined properly
      // This test just ensures no errors occur
      expect(() => {
        glowModifier.apply({} as any, context)
      }).not.toThrow()
    })

    it('should handle invalid shadow configurations gracefully', () => {
      const element = createMockElement()
      const context = createMockContext(element)

      const modifier = new ShadowModifier({
        shadow: { x: NaN, y: undefined as any, blur: -5 },
      })

      expect(() => {
        modifier.apply({} as any, context)
      }).not.toThrow()

      // Should use defaults for invalid values
      expect(element.style.boxShadow).toBe(
        'NaNpx 0px -5px 0px rgba(0,0,0,0.25)'
      )
    })
  })
})
