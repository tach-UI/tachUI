/**
 * Tests for FontAsset
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  FontAsset,
  FontWeightPreset as FontWeight,
  FontWidth,
  SystemFonts,
  createSystemFont,
  createGoogleFont,
  createVariableFont,
  type FontAssetOptions,
} from '../../src/assets/FontAsset'

// Mock document for font loading tests
beforeEach(() => {
  // Mock document.head
  const head = {
    appendChild: vi.fn(),
  }

  // Mock document.fonts
  const fonts = {
    ready: Promise.resolve(),
    check: vi.fn(() => true),
    add: vi.fn(),
  }

  // Mock FontFace constructor
  global.FontFace = vi.fn().mockImplementation((family, source, descriptors) => ({
    family,
    source,
    descriptors,
    load: vi.fn().mockResolvedValue(undefined),
  }))

  global.document = {
    head,
    fonts,
    querySelector: vi.fn(() => null),
    createElement: vi.fn((tagName: string) => {
      if (tagName === 'link') {
        const link = {
          rel: '',
          href: '',
          crossOrigin: '',
          onload: null,
          onerror: null,
        }
        // Simulate immediate load
        setTimeout(() => link.onload && link.onload(), 0)
        return link
      }
      if (tagName === 'style') {
        return { textContent: '' }
      }
      return {}
    }),
  } as any

  global.window = { FontFace: global.FontFace } as any
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('FontAsset', () => {
  describe('Basic Functionality', () => {
    it('should create font asset with family and fallbacks', () => {
      const font = new FontAsset('Inter', ['system-ui', 'sans-serif'], 'bodyFont')
      
      expect(font.family).toBe('Inter')
      expect(font.fallbacks).toEqual(['system-ui', 'sans-serif'])
      expect(font.name).toBe('bodyFont')
    })

    it('should generate correct CSS font-family value', () => {
      const font = new FontAsset('Inter', ['system-ui', 'sans-serif'])
      expect(font.value).toBe('Inter, system-ui, sans-serif')
    })

    it('should quote font families with spaces', () => {
      const font = new FontAsset('Helvetica Neue', ['Arial', 'sans-serif'])
      expect(font.value).toBe('"Helvetica Neue", Arial, sans-serif')
    })

    it('should use family as default name', () => {
      const font = new FontAsset('Roboto', [])
      expect(font.name).toBe('Roboto')
    })

    it('should support static init method', () => {
      const font = FontAsset.init('Inter', ['sans-serif'], 'myFont')
      expect(font).toBeInstanceOf(FontAsset)
      expect(font.family).toBe('Inter')
    })
  })

  describe('Font Loading', () => {
    it('should not load fonts eagerly by default', () => {
      const font = new FontAsset('Inter', [], 'test', {
        fontUrl: 'https://example.com/inter.woff2',
      })

      // Should not have created any elements yet
      expect(document.createElement).not.toHaveBeenCalled()
    })

    it('should load fonts eagerly when specified', async () => {
      const font = new FontAsset('Inter', [], 'test', {
        fontUrl: 'https://example.com/inter.woff2',
        loading: 'eager',
      })

      // Wait for async loading
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(document.createElement).toHaveBeenCalled()
    })

    it('should load CSS files containing @font-face', async () => {
      const font = new FontAsset('Inter', [], 'test', {
        fontUrl: 'https://fonts.googleapis.com/css2?family=Inter',
      })

      await font.load()

      expect(document.createElement).toHaveBeenCalledWith('link')
      expect(document.head.appendChild).toHaveBeenCalled()
    })

    it('should load font files directly', async () => {
      const font = new FontAsset('Inter', [], 'test', {
        fontUrl: 'https://example.com/inter.woff2',
      })

      await font.load()

      expect(document.createElement).toHaveBeenCalledWith('style')
      expect(global.FontFace).toHaveBeenCalled()
    })

    it('should add preconnect hints when enabled', async () => {
      const font = new FontAsset('Inter', [], 'test', {
        fontUrl: 'https://fonts.googleapis.com/css2?family=Inter',
        preconnect: true,
      })

      await font.load()

      expect(document.createElement).toHaveBeenCalledWith('link')
      expect(document.head.appendChild).toHaveBeenCalled()
    })

    it('should not load multiple times', async () => {
      const font = new FontAsset('Inter', [], 'test', {
        fontUrl: 'https://example.com/inter.woff2',
      })

      await font.load()
      await font.load()

      // Should only create style element once
      const styleCalls = (document.createElement as any).mock.calls
        .filter((call: any[]) => call[0] === 'style').length
      expect(styleCalls).toBe(1)
    })
  })

  describe('Variable Fonts', () => {
    it('should support weight ranges', async () => {
      const font = new FontAsset('Inter', [], 'test', {
        fontUrl: 'https://example.com/inter-var.woff2',
        weightRange: [100, 900],
      })

      await font.load()

      const fontFaceCall = (global.FontFace as any).mock.calls[0]
      expect(fontFaceCall[2].weight).toBe('100 900')
    })

    it('should support width ranges', async () => {
      const font = new FontAsset('Inter', [], 'test', {
        fontUrl: 'https://example.com/inter-var.woff2',
        widthRange: [75, 125],
      })

      await font.load()

      const fontFaceCall = (global.FontFace as any).mock.calls[0]
      expect(fontFaceCall[2].stretch).toBe('75% 125%')
    })
  })

  describe('Font Weight Constants', () => {
    it('should provide SwiftUI-compatible weight constants', () => {
      expect(FontWeight.ultraLight).toBe(100)
      expect(FontWeight.regular).toBe(400)
      expect(FontWeight.bold).toBe(700)
      expect(FontWeight.black).toBe(900)
    })
  })

  describe('Font Width Constants', () => {
    it('should provide width constants for variable fonts', () => {
      expect(FontWidth.condensed).toBe(75)
      expect(FontWidth.normal).toBe(100)
      expect(FontWidth.expanded).toBe(125)
    })
  })

  describe('System Font Stacks', () => {
    it('should provide system font stacks', () => {
      expect(SystemFonts.sansSerif).toContain('system-ui')
      expect(SystemFonts.serif).toContain('Georgia')
      expect(SystemFonts.monospace).toContain('ui-monospace')
    })
  })

  describe('Factory Functions', () => {
    it('should create system fonts', () => {
      const font = createSystemFont('sansSerif')
      expect(font.family).toBe('')
      expect(font.fallbacks).toEqual(SystemFonts.sansSerif)
      expect(font.name).toBe('system-sansSerif')
    })

    it('should create Google fonts', () => {
      const font = createGoogleFont('Roboto', [400, 700])
      expect(font.family).toBe('Roboto')
      expect(font.options.fontUrl).toContain('fonts.googleapis.com')
      expect(font.options.fontUrl).toContain('wght@400;700')
    })

    it('should create variable fonts', () => {
      const font = createVariableFont(
        'Inter Variable',
        'https://example.com/inter-var.woff2',
        {
          weight: [100, 900],
          width: [75, 125],
        }
      )
      expect(font.family).toBe('Inter Variable')
      expect(font.options.weightRange).toEqual([100, 900])
      expect(font.options.widthRange).toEqual([75, 125])
    })
  })

  describe('CSS Variable Generation', () => {
    it('should generate CSS variables', () => {
      const font = new FontAsset('Inter', ['sans-serif'], 'bodyFont')
      expect(font.toCSSVariable()).toBe('--font-bodyfont: Inter, sans-serif;')
    })

    it('should use custom variable names', () => {
      const font = new FontAsset('Inter', ['sans-serif'])
      expect(font.toCSSVariable('--my-font')).toBe('--my-font: Inter, sans-serif;')
    })
  })

  describe('Integration with Asset System', () => {
    it('should implement resolve method', () => {
      const font = new FontAsset('Inter', ['sans-serif'])
      expect(font.resolve()).toBe('Inter, sans-serif')
    })

    it('should trigger lazy loading on resolve', () => {
      const font = new FontAsset('Inter', [], 'test', {
        fontUrl: 'https://example.com/inter.woff2',
        loading: 'lazy',
      })

      // First resolve should trigger load
      font.resolve()
      
      // Check that load was initiated (async)
      expect(font['loadPromise']).toBeTruthy()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing fontUrl gracefully', async () => {
      const font = new FontAsset('Inter', [])
      await expect(font.load()).resolves.not.toThrow()
    })

    it('should warn when font check fails', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      ;(document.fonts.check as any).mockReturnValue(false)

      const font = new FontAsset('Inter', [], 'test', {
        fontUrl: 'https://example.com/inter.woff2',
      })

      await font.load()

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('may not have loaded correctly')
      )

      warnSpy.mockRestore()
    })
  })
})