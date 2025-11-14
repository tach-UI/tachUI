/**
 * Backdrop Filter Modifier Tests
 *
 * Comprehensive tests for the unified backdrop filter implementation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  BackdropFilterModifier,
  backdropFilter,
  glassmorphism,
  customGlassmorphism,
} from '../../src/effects/backdrop'

// Mock CSS.supports for testing
const mockCSSSupports = vi.fn()
Object.defineProperty(global, 'CSS', {
  value: { supports: mockCSSSupports },
  writable: true,
})

// Mock DOM environment
const mockElement = {
  style: {
    setProperty: vi.fn(),
    removeProperty: vi.fn(),
    getPropertyValue: vi.fn(),
  } as any,
  setAttribute: vi.fn(),
  removeAttribute: vi.fn(),
  getAttribute: vi.fn(),
  hasAttribute: vi.fn(),
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn(),
  },
} as any

const mockContext = {
  componentId: 'test-component',
  element: mockElement,
  phase: 'creation' as const,
}

describe('Unified Backdrop Filter System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock element style and simulate CSS property setting
    mockElement.style = {
      setProperty: vi.fn(),
      removeProperty: vi.fn(),
      getPropertyValue: vi.fn(),
    }

    // Simulate style property assignments - capture both kebab-case and camelCase
    mockElement.style.setProperty = vi.fn((property, value) => {
      // Store as the kebab-case property name for assertions
      mockElement.style[property] = value

      // Also store as camelCase for JavaScript access
      const camelCase = property.replace(/-([a-z])/g, g => g[1].toUpperCase())
      mockElement.style[camelCase] = value
    })

    // Mock console methods
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})

    // Default: backdrop-filter is supported
    mockCSSSupports.mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ============================================================================
  // Core Backdrop Filter Functionality
  // ============================================================================

  describe('BackdropFilterModifier', () => {
    it('should apply backdrop-filter with browser support', () => {
      const modifier = new BackdropFilterModifier({
        backdropFilter: { blur: 10, saturate: 1.2, brightness: 1.1 },
      })

      modifier.apply({} as any, mockContext)

      expect(mockElement.style.backdropFilter).toBe(
        'blur(10px) brightness(1.1) saturate(1.2)'
      )
      expect(mockElement.style.webkitBackdropFilter).toBe(
        'blur(10px) brightness(1.1) saturate(1.2)'
      )
    })

    it('should handle CSS string values', () => {
      const modifier = new BackdropFilterModifier({
        backdropFilter: 'blur(15px) saturate(1.5) brightness(1.2)',
      })

      modifier.apply({} as any, mockContext)

      expect(mockElement.style.backdropFilter).toBe(
        'blur(15px) saturate(1.5) brightness(1.2)'
      )
      expect(mockElement.style.webkitBackdropFilter).toBe(
        'blur(15px) saturate(1.5) brightness(1.2)'
      )
    })

    it('should apply fallback color when backdrop-filter is not supported', () => {
      mockCSSSupports.mockReturnValue(false)

      const modifier = new BackdropFilterModifier({
        backdropFilter: { blur: 10 },
        fallbackColor: 'rgba(255, 255, 255, 0.1)',
      })

      modifier.apply({} as any, mockContext)

      expect(mockElement.style.backgroundColor).toBe('rgba(255, 255, 255, 0.1)')
      expect(mockElement.style.backdropFilter).toBeUndefined()
    })

    it('should handle individual filter functions', () => {
      const testCases = [
        { config: { blur: 5 }, expected: 'blur(5px)' },
        { config: { brightness: 0.8 }, expected: 'brightness(0.8)' },
        { config: { contrast: 1.5 }, expected: 'contrast(1.5)' },
        { config: { grayscale: 0.5 }, expected: 'grayscale(0.5)' },
        { config: { hueRotate: 90 }, expected: 'hue-rotate(90deg)' },
        { config: { invert: 1 }, expected: 'invert(1)' },
        { config: { opacity: 0.7 }, expected: 'opacity(0.7)' },
        { config: { saturate: 1.3 }, expected: 'saturate(1.3)' },
        { config: { sepia: 0.3 }, expected: 'sepia(0.3)' },
      ]

      testCases.forEach(({ config, expected }) => {
        const modifier = new BackdropFilterModifier({ backdropFilter: config })
        modifier.apply({} as any, mockContext)
        expect(mockElement.style.backdropFilter).toBe(expected)
      })
    })

    it('should handle drop-shadow with object configuration', () => {
      const modifier = new BackdropFilterModifier({
        backdropFilter: {
          dropShadow: { x: 2, y: 3, blur: 4, color: 'rgba(0,0,0,0.3)' },
        },
      })

      modifier.apply({} as any, mockContext)

      expect(mockElement.style.backdropFilter).toBe(
        'drop-shadow(2px 3px 4px rgba(0,0,0,0.3))'
      )
    })

    it('should handle drop-shadow with string configuration', () => {
      const modifier = new BackdropFilterModifier({
        backdropFilter: {
          dropShadow: '0px 4px 8px rgba(0,0,0,0.2)',
        },
      })

      modifier.apply({} as any, mockContext)

      expect(mockElement.style.backdropFilter).toBe(
        'drop-shadow(0px 4px 8px rgba(0,0,0,0.2))'
      )
    })

    it('should handle multiple filters in correct order', () => {
      const modifier = new BackdropFilterModifier({
        backdropFilter: {
          blur: 8,
          brightness: 1.2,
          contrast: 1.1,
          saturate: 1.3,
          hueRotate: 15,
        },
      })

      modifier.apply({} as any, mockContext)

      expect(mockElement.style.backdropFilter).toBe(
        'blur(8px) brightness(1.2) contrast(1.1) hue-rotate(15deg) saturate(1.3)'
      )
    })

    it('should warn and return "none" for empty config in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const modifier = new BackdropFilterModifier({ backdropFilter: {} })
      modifier.apply({} as any, mockContext)

      expect(mockElement.style.backdropFilter).toBe('none')
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('No filter functions specified')
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should have correct type and priority', () => {
      const modifier = new BackdropFilterModifier({
        backdropFilter: { blur: 10 },
      })

      expect(modifier.type).toBe('backdropFilter')
      expect(modifier.priority).toBeGreaterThan(200) // APPEARANCE + 15
    })
  })

  // ============================================================================
  // Factory Functions
  // ============================================================================

  describe('Factory Functions', () => {
    it('should create modifier with backdropFilter function - config object', () => {
      const modifier = backdropFilter({ blur: 12, saturate: 1.4 })

      expect(modifier).toBeInstanceOf(BackdropFilterModifier)
      expect(modifier.properties.backdropFilter).toEqual({
        blur: 12,
        saturate: 1.4,
      })
    })

    it('should create modifier with backdropFilter function - CSS string', () => {
      const modifier = backdropFilter('blur(20px) contrast(1.3)')

      expect(modifier).toBeInstanceOf(BackdropFilterModifier)
      expect(modifier.properties.backdropFilter).toBe(
        'blur(20px) contrast(1.3)'
      )
    })

    it('should create modifier with backdropFilter function - with fallback', () => {
      const modifier = backdropFilter({ blur: 10 }, 'rgba(255, 255, 255, 0.2)')

      expect(modifier).toBeInstanceOf(BackdropFilterModifier)
      expect(modifier.properties.backdropFilter).toEqual({ blur: 10 })
      expect(modifier.properties.fallbackColor).toBe('rgba(255, 255, 255, 0.2)')
    })
  })

  // ============================================================================
  // Glassmorphism Presets
  // ============================================================================

  describe('Glassmorphism Presets', () => {
    const presetTests = [
      {
        intensity: 'subtle',
        expectedBlur: 3,
        expectedSaturate: 1.05,
        expectedBrightness: 1.05,
      },
      {
        intensity: 'light',
        expectedBlur: 8,
        expectedSaturate: 1.15,
        expectedBrightness: 1.1,
      },
      {
        intensity: 'medium',
        expectedBlur: 16,
        expectedSaturate: 1.3,
        expectedBrightness: 1.15,
      },
      {
        intensity: 'heavy',
        expectedBlur: 24,
        expectedSaturate: 1.5,
        expectedBrightness: 1.2,
      },
    ] as const

    presetTests.forEach(
      ({ intensity, expectedBlur, expectedSaturate, expectedBrightness }) => {
        it(`should create ${intensity} glassmorphism effect`, () => {
          const modifier = glassmorphism(intensity)

          modifier.apply({} as any, mockContext)

          expect(mockElement.style.backdropFilter).toBe(
            `blur(${expectedBlur}px) brightness(${expectedBrightness}) saturate(${expectedSaturate})`
          )
        })
      }
    )

    it('should use medium intensity as default', () => {
      const modifier = glassmorphism()

      modifier.apply({} as any, mockContext)

      expect(mockElement.style.backdropFilter).toBe(
        'blur(16px) brightness(1.15) saturate(1.3)'
      )
    })

    it('should handle custom fallback color', () => {
      mockCSSSupports.mockReturnValue(false)

      const modifier = glassmorphism('light', 'rgba(0, 0, 0, 0.1)')

      modifier.apply({} as any, mockContext)

      expect(mockElement.style.backgroundColor).toBe('rgba(0, 0, 0, 0.1)')
    })

    it('should return BackdropFilterModifier instance', () => {
      const modifier = glassmorphism('medium')

      expect(modifier).toBeInstanceOf(BackdropFilterModifier)
    })
  })

  // ============================================================================
  // Custom Glassmorphism
  // ============================================================================

  describe('Custom Glassmorphism', () => {
    it('should create custom glassmorphism with specified parameters', () => {
      const modifier = customGlassmorphism(12, 1.4, 1.2)

      modifier.apply({} as any, mockContext)

      expect(mockElement.style.backdropFilter).toBe(
        'blur(12px) brightness(1.2) saturate(1.4)'
      )
    })

    it('should use default saturate and brightness values', () => {
      const modifier = customGlassmorphism(15)

      modifier.apply({} as any, mockContext)

      expect(mockElement.style.backdropFilter).toBe(
        'blur(15px) brightness(1.1) saturate(1.2)'
      )
    })

    it('should generate appropriate fallback color based on blur', () => {
      mockCSSSupports.mockReturnValue(false)

      const modifier = customGlassmorphism(20) // Higher blur = higher opacity fallback

      modifier.apply({} as any, mockContext)

      // Should calculate opacity as min(20/200, 0.25) = min(0.1, 0.25) = 0.1
      expect(mockElement.style.backgroundColor).toBe('rgba(255, 255, 255, 0.1)')
    })

    it('should use custom fallback color when provided', () => {
      mockCSSSupports.mockReturnValue(false)

      const modifier = customGlassmorphism(10, 1.2, 1.1, 'rgba(0, 0, 0, 0.05)')

      modifier.apply({} as any, mockContext)

      expect(mockElement.style.backgroundColor).toBe('rgba(0, 0, 0, 0.05)')
    })
  })

  // ============================================================================
  // ColorAsset Support
  // ============================================================================

  describe('ColorAsset Support', () => {
    it('should handle ColorValue string fallbacks', () => {
      mockCSSSupports.mockReturnValue(false)

      const modifier = new BackdropFilterModifier({
        backdropFilter: { blur: 10 },
        fallbackColor: 'rgba(255, 0, 0, 0.1)',
      })

      modifier.apply({} as any, mockContext)

      expect(mockElement.style.backgroundColor).toBe('rgba(255, 0, 0, 0.1)')
    })

    it('should handle ColorAssetProxy fallbacks', () => {
      mockCSSSupports.mockReturnValue(false)

      const mockColorAsset = {
        getValue: vi.fn().mockReturnValue('rgb(0, 255, 0)'),
      }

      const modifier = new BackdropFilterModifier({
        backdropFilter: { blur: 10 },
        fallbackColor: mockColorAsset as any,
      })

      modifier.apply({} as any, mockContext)

      expect(mockColorAsset.getValue).toHaveBeenCalled()
      expect(mockElement.style.backgroundColor).toBe('rgb(0, 255, 0)')
    })

    it('should handle Asset value property fallbacks', () => {
      mockCSSSupports.mockReturnValue(false)

      const mockAsset = {
        value: 'hsl(240, 100%, 50%)',
      }

      const modifier = new BackdropFilterModifier({
        backdropFilter: { blur: 10 },
        fallbackColor: mockAsset as any,
      })

      modifier.apply({} as any, mockContext)

      expect(mockElement.style.backgroundColor).toBe('hsl(240, 100%, 50%)')
    })

    it('should handle Signal<string> fallbacks through resolveColorValue', () => {
      mockCSSSupports.mockReturnValue(false)

      // Create a signal that's detected as a function but not resolved during construction
      const mockSignal = vi.fn().mockReturnValue('#00ff00')
      Object.defineProperty(mockSignal, 'peek', {
        value: vi.fn().mockReturnValue('#00ff00'),
        writable: false,
      })

      // This tests the fallback path in resolveColorValue for when constructor doesn't resolve it
      const modifier = new BackdropFilterModifier({
        backdropFilter: { blur: 10 },
        fallbackColor: mockSignal as any,
      })

      modifier.apply({} as any, mockContext)

      // Should resolve to the color value
      expect(mockElement.style.backgroundColor).toBe('#00ff00')
    })

    it('should handle ColorValue fallbacks in factory functions', () => {
      mockCSSSupports.mockReturnValue(false)

      const mockColorAsset = {
        getValue: vi.fn().mockReturnValue('rgba(128, 128, 128, 0.2)'),
      }

      const modifier = backdropFilter({ blur: 15 }, mockColorAsset as any)
      modifier.apply({} as any, mockContext)

      expect(mockColorAsset.getValue).toHaveBeenCalled()
      expect(mockElement.style.backgroundColor).toBe('rgba(128, 128, 128, 0.2)')
    })

    it('should handle ColorValue fallbacks in glassmorphism presets', () => {
      mockCSSSupports.mockReturnValue(false)

      const mockColorAsset = {
        value: 'rgba(0, 0, 0, 0.15)',
      }

      const modifier = glassmorphism('medium', mockColorAsset as any)
      modifier.apply({} as any, mockContext)

      expect(mockElement.style.backgroundColor).toBe('rgba(0, 0, 0, 0.15)')
    })
  })

  // ============================================================================
  // Browser Compatibility
  // ============================================================================

  describe('Browser Compatibility', () => {
    it('should detect webkit-backdrop-filter support', () => {
      mockCSSSupports.mockImplementation((prop, value) => {
        if (prop === 'backdrop-filter') return false
        if (prop === '-webkit-backdrop-filter') return true
        return false
      })

      const modifier = new BackdropFilterModifier({
        backdropFilter: { blur: 10 },
      })

      modifier.apply({} as any, mockContext)

      expect(mockElement.style.backdropFilter).toBe('blur(10px)')
      expect(mockElement.style.webkitBackdropFilter).toBe('blur(10px)')
    })

    it('should handle missing CSS.supports gracefully', () => {
      // Temporarily remove CSS.supports
      const originalCSS = global.CSS
      ;(global as any).CSS = undefined

      const modifier = new BackdropFilterModifier({
        backdropFilter: { blur: 10 },
        fallbackColor: 'rgba(255, 255, 255, 0.1)',
      })

      modifier.apply({} as any, mockContext)

      // Should fall back to backgroundColor since CSS.supports is not available
      expect(mockElement.style.backgroundColor).toBe('rgba(255, 255, 255, 0.1)')

      // Restore CSS object
      global.CSS = originalCSS
    })

    it('should show info message when using fallback in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      mockCSSSupports.mockReturnValue(false)

      const modifier = new BackdropFilterModifier({
        backdropFilter: { blur: 10 },
        fallbackColor: 'rgba(255, 255, 255, 0.1)',
      })

      modifier.apply({} as any, mockContext)

      expect(console.info).toHaveBeenCalledWith(
        'TachUI: backdrop-filter not supported, using fallback color:',
        'rgba(255, 255, 255, 0.1)'
      )

      process.env.NODE_ENV = originalEnv
    })
  })

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Integration Tests', () => {
    it('should work in complex glassmorphism design patterns', () => {
      const modifier = backdropFilter({
        blur: 15,
        saturate: 1.8,
        brightness: 1.1,
        contrast: 1.2,
        dropShadow: { x: 0, y: 4, blur: 6, color: 'rgba(0, 0, 0, 0.1)' },
      })

      modifier.apply({} as any, mockContext)

      expect(mockElement.style.backdropFilter).toBe(
        'blur(15px) brightness(1.1) contrast(1.2) drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.1)) saturate(1.8)'
      )
      expect(mockElement.style.webkitBackdropFilter).toBe(
        'blur(15px) brightness(1.1) contrast(1.2) drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.1)) saturate(1.8)'
      )
    })

    it('should handle all filter types in single modifier', () => {
      const modifier = backdropFilter({
        blur: 5,
        brightness: 1.1,
        contrast: 1.2,
        dropShadow: { x: 2, y: 2, blur: 4, color: 'rgba(0,0,0,0.3)' },
        grayscale: 0.1,
        hueRotate: 15,
        invert: 0.05,
        opacity: 0.95,
        saturate: 1.3,
        sepia: 0.1,
      })

      modifier.apply({} as any, mockContext)

      const expected =
        'blur(5px) brightness(1.1) contrast(1.2) drop-shadow(2px 2px 4px rgba(0,0,0,0.3)) grayscale(0.1) hue-rotate(15deg) invert(0.05) opacity(0.95) saturate(1.3) sepia(0.1)'
      expect(mockElement.style.backdropFilter).toBe(expected)
    })
  })
})
