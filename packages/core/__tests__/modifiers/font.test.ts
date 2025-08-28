/**
 * Tests for Font Modifiers
 */

import { describe, expect, it, vi } from 'vitest'
import { font, system, custom } from '../../src/modifiers/font'
import { fontFamily } from '../../src/modifiers/typography'
import { FontAsset } from '../../src/assets/FontAsset'
import type { DOMNode } from '../../src/runtime/types'

// Mock DOM element
function createMockElement() {
  const style: any = {}
  style.setProperty = vi.fn((prop: string, value: string) => {
    style[prop] = value
  })
  
  return {
    style,
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
    },
  } as any
}

// Mock context
function createMockContext(element: any) {
  return {
    element,
    runtime: {} as any,
    owner: null,
    metadata: {},
  }
}

describe('Font Modifiers', () => {
  describe('fontFamily modifier', () => {
    it('should set font family with string', () => {
      const modifier = fontFamily('Inter, sans-serif')
      const element = createMockElement()
      const context = createMockContext(element)
      const node: DOMNode = { type: 'element', tag: 'div' }

      modifier.apply(node, context)

      expect(element.style["font-family"]).toBe('Inter, sans-serif')
    })

    it('should set font family with FontAsset', () => {
      const fontAsset = new FontAsset('Roboto', ['Arial', 'sans-serif'], 'bodyFont')
      const modifier = fontFamily(fontAsset)
      const element = createMockElement()
      const context = createMockContext(element)
      const node: DOMNode = { type: 'element', tag: 'div' }

      modifier.apply(node, context)

      expect(element.style["font-family"]).toBe('Roboto, Arial, sans-serif')
    })

    it('should trigger font loading for FontAsset', () => {
      const fontAsset = new FontAsset('Inter', [], 'test', {
        fontUrl: 'https://example.com/inter.woff2',
        loading: 'lazy',
      })
      const resolveSpy = vi.spyOn(fontAsset, 'resolve')
      
      const modifier = fontFamily(fontAsset)
      const element = createMockElement()
      const context = createMockContext(element)
      const node: DOMNode = { type: 'element', tag: 'div' }

      modifier.apply(node, context)

      expect(resolveSpy).toHaveBeenCalled()
    })
  })

  describe('font modifier', () => {
    it('should set multiple font properties', () => {
      const modifier = font({
        family: 'Georgia, serif',
        size: 24,
        weight: 'bold',
        style: 'italic',
      })
      const element = createMockElement()
      const context = createMockContext(element)
      const node: DOMNode = { type: 'element', tag: 'div' }

      modifier.apply(node, context)

      expect(element.style["font-family"]).toBe('Georgia, serif')
      expect(element.style["font-size"]).toBe('24px')
      expect(element.style["font-weight"]).toBe('bold')
      expect(element.style["font-style"]).toBe('italic')
    })

    it('should work with FontAsset', () => {
      const fontAsset = new FontAsset('Inter', ['sans-serif'], 'headingFont')
      const modifier = font({
        family: fontAsset,
        size: 32,
        weight: 700,
      })
      const element = createMockElement()
      const context = createMockContext(element)
      const node: DOMNode = { type: 'element', tag: 'div' }

      modifier.apply(node, context)

      expect(element.style["font-family"]).toBe('Inter, sans-serif')
      expect(element.style["font-size"]).toBe('32px')
      expect(element.style["font-weight"]).toBe('700')
    })

    it('should handle numeric font weights', () => {
      const modifier = font({
        size: 16,
        weight: 600,
      })
      const element = createMockElement()
      const context = createMockContext(element)
      const node: DOMNode = { type: 'element', tag: 'div' }

      modifier.apply(node, context)

      expect(element.style["font-weight"]).toBe('600')
    })

    it('should handle string font sizes', () => {
      const modifier = font({
        size: '1.5rem',
        weight: 'normal',
      })
      const element = createMockElement()
      const context = createMockContext(element)
      const node: DOMNode = { type: 'element', tag: 'div' }

      modifier.apply(node, context)

      expect(element.style["font-size"]).toBe('1.5rem')
    })
  })

  describe('font presets', () => {
    it('should apply title preset', () => {
      const modifier = font('.title')
      const element = createMockElement()
      const context = createMockContext(element)
      const node: DOMNode = { type: 'element', tag: 'div' }

      modifier.apply(node, context)

      expect(element.style["font-size"]).toBe('28px')
      expect(element.style["font-weight"]).toBe('400')
    })

    it('should apply headline preset', () => {
      const modifier = font('.headline')
      const element = createMockElement()
      const context = createMockContext(element)
      const node: DOMNode = { type: 'element', tag: 'div' }

      modifier.apply(node, context)

      expect(element.style["font-size"]).toBe('17px')
      expect(element.style["font-weight"]).toBe('600')
    })

    it('should apply body preset', () => {
      const modifier = font('.body')
      const element = createMockElement()
      const context = createMockContext(element)
      const node: DOMNode = { type: 'element', tag: 'div' }

      modifier.apply(node, context)

      expect(element.style["font-size"]).toBe('17px')
      expect(element.style["font-weight"]).toBe('400')
    })

    it('should handle unknown preset with warning', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const modifier = font('.unknown')
      const element = createMockElement()
      const context = createMockContext(element)
      const node: DOMNode = { type: 'element', tag: 'div' }

      modifier.apply(node, context)

      expect(warnSpy).toHaveBeenCalledWith(
        'Unknown font preset: .unknown. Using default body font.'
      )
      // Should fallback to body preset
      expect(element.style["font-size"]).toBe('17px')

      warnSpy.mockRestore()
    })
  })

  describe('system modifier', () => {
    it('should create system font with default design', () => {
      const modifier = system({ size: 18, weight: 'medium' })
      const element = createMockElement()
      const context = createMockContext(element)
      const node: DOMNode = { type: 'element', tag: 'div' }

      modifier.apply(node, context)

      expect(element.style["font-family"]).toContain('system-ui')
      expect(element.style["font-size"]).toBe('18px')
      expect(element.style["font-weight"]).toBe('medium')
    })

    it('should create serif system font', () => {
      const modifier = system({ size: 20, design: 'serif' })
      const element = createMockElement()
      const context = createMockContext(element)
      const node: DOMNode = { type: 'element', tag: 'div' }

      modifier.apply(node, context)

      expect(element.style["font-family"]).toContain('ui-serif')
      expect(element.style["font-family"]).toContain('Georgia')
    })

    it('should create monospaced system font', () => {
      const modifier = system({ size: 14, design: 'monospaced' })
      const element = createMockElement()
      const context = createMockContext(element)
      const node: DOMNode = { type: 'element', tag: 'div' }

      modifier.apply(node, context)

      expect(element.style["font-family"]).toContain('ui-monospace')
      expect(element.style["font-family"]).toContain('Consolas')
    })

    it('should create rounded system font', () => {
      const modifier = system({ design: 'rounded' })
      const element = createMockElement()
      const context = createMockContext(element)
      const node: DOMNode = { type: 'element', tag: 'div' }

      modifier.apply(node, context)

      expect(element.style["font-family"]).toContain('ui-rounded')
    })
  })

  describe('custom modifier', () => {
    it('should create custom font with string', () => {
      const modifier = custom('Avenir Next', { size: 18, weight: 500 })
      const element = createMockElement()
      const context = createMockContext(element)
      const node: DOMNode = { type: 'element', tag: 'div' }

      modifier.apply(node, context)

      expect(element.style["font-family"]).toBe('Avenir Next')
      expect(element.style["font-size"]).toBe('18px')
      expect(element.style["font-weight"]).toBe('500')
    })

    it('should create custom font with FontAsset', () => {
      const fontAsset = new FontAsset('Custom Font', ['fallback'], 'custom')
      const modifier = custom(fontAsset, { size: '2rem', style: 'oblique' })
      const element = createMockElement()
      const context = createMockContext(element)
      const node: DOMNode = { type: 'element', tag: 'div' }

      modifier.apply(node, context)

      expect(element.style["font-family"]).toBe('"Custom Font", fallback')
      expect(element.style["font-size"]).toBe('2rem')
      expect(element.style["font-style"]).toBe('oblique')
    })

    it('should work with minimal options', () => {
      const modifier = custom('Helvetica')
      const element = createMockElement()
      const context = createMockContext(element)
      const node: DOMNode = { type: 'element', tag: 'div' }

      modifier.apply(node, context)

      expect(element.style["font-family"]).toBe('Helvetica')
    })
  })

  describe('Integration tests', () => {
    it('should combine font modifiers with other typography modifiers', () => {
      const fontAsset = new FontAsset('Inter', ['sans-serif'])
      const fontMod = font({
        family: fontAsset,
        size: 16,
        weight: 500,
      })
      
      const element = createMockElement()
      const context = createMockContext(element)
      const node: DOMNode = { type: 'element', tag: 'div' }

      fontMod.apply(node, context)

      expect(element.style["font-family"]).toBe('Inter, sans-serif')
      expect(element.style["font-size"]).toBe('16px')
      expect(element.style["font-weight"]).toBe('500')
    })

    it('should handle all SwiftUI font presets', () => {
      const presets = [
        '.largeTitle', '.title', '.title2', '.title3',
        '.headline', '.subheadline', '.body', '.callout',
        '.footnote', '.caption', '.caption2'
      ]

      presets.forEach(preset => {
        const modifier = font(preset)
        const element = createMockElement()
        const context = createMockContext(element)
        const node: DOMNode = { type: 'element', tag: 'div' }

        modifier.apply(node, context)

        expect(element.style["font-size"]).toBeDefined()
        expect(element.style["font-weight"]).toBeDefined()
      })
    })
  })
})