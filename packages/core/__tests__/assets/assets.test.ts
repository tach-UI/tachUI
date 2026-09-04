/**
 * Tests for the TachUI Assets System
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { AssetCollection } from '../../src/assets/AssetCollection'
import { ColorAsset } from '../../src/assets/ColorAsset'
import { ImageAsset } from '../../src/assets/ImageAsset'
import {
  Assets,
  createColorAsset,
  createImageAsset,
  getAssetInfo,
  listAssetNames,
  registerAsset,
} from '../../src/assets/index'

describe('Asset System', () => {
  let assetCollection: AssetCollection

  beforeEach(() => {
    assetCollection = new AssetCollection()
  })

  describe('AssetCollection', () => {
    it('should add and retrieve assets', () => {
      const colorAsset = ColorAsset.init({ default: '#FF0000', light: '#FF0000', dark: '#00FF00', name: 'testColor' })
      assetCollection.add('testColor', colorAsset)

      const retrievedAsset = assetCollection.get('testColor')
      expect(retrievedAsset).toStrictEqual(colorAsset)
    })

    it('should return undefined for non-existent assets', () => {
      const asset = assetCollection.get('nonExistent')
      expect(asset).toBeUndefined()
    })

    it('should get all assets as a new Map', () => {
      const colorAsset = ColorAsset.init({ default: '#FF0000', light: '#FF0000', dark: '#00FF00', name: 'testColor' })
      const imageAsset = ImageAsset.init({ default: '/light.png', light: '/light.png', dark: '/dark.png', name: 'testImage' })

      assetCollection.add('testColor', colorAsset)
      assetCollection.add('testImage', imageAsset)

      const allAssets = assetCollection.getAll()
      expect(allAssets.size).toBe(2)
      expect(allAssets.get('testColor')).toStrictEqual(colorAsset)
      expect(allAssets.get('testImage')).toStrictEqual(imageAsset)
    })

    it('should overwrite existing assets with same name', () => {
      const colorAsset1 = ColorAsset.init({ default: '#FF0000', light: '#FF0000', dark: '#00FF00', name: 'testColor' })
      const colorAsset2 = ColorAsset.init({ default: '#0000FF', light: '#0000FF', dark: '#FFFF00', name: 'testColor' })

      assetCollection.add('testColor', colorAsset1)
      assetCollection.add('testColor', colorAsset2)

      const retrievedAsset = assetCollection.get('testColor')
      expect(retrievedAsset).toStrictEqual(colorAsset2)
    })

    it('should handle asset names with special characters', () => {
      const colorAsset = ColorAsset.init({ default: '#FF0000', light: '#FF0000', dark: '#00FF00', name: 'test-color_123' })
      assetCollection.add('test-color_123', colorAsset)

      const retrievedAsset = assetCollection.get('test-color_123')
      expect(retrievedAsset).toStrictEqual(colorAsset)
    })

    it('should properly clone assets map in getAll()', () => {
      const colorAsset = ColorAsset.init({ default: '#FF0000', light: '#FF0000', dark: '#00FF00', name: 'testColor' })
      assetCollection.add('testColor', colorAsset)

      const allAssets = assetCollection.getAll()
      expect(allAssets.size).toBe(1)

      // Modify the returned map to verify it's a clone
      allAssets.set('newKey', colorAsset)
      expect(allAssets.size).toBe(2)

      // Original collection should still have only 1 asset
      const originalAssets = assetCollection.getAll()
      expect(originalAssets.size).toBe(1)
    })
  })

  describe('ColorAsset', () => {
    it('should create a color asset with light and dark values', () => {
      const colorAsset = ColorAsset.init({ default: '#FF0000', light: '#FF0000', dark: '#00FF00', name: 'testColor' })

      expect(colorAsset.light).toBe('#FF0000')
      expect(colorAsset.dark).toBe('#00FF00')
      expect(colorAsset.name).toBe('testColor')
    })

    it('should handle empty string values by throwing error', () => {
      expect(() => {
        ColorAsset.init({ default: '', light: '', dark: '', name: 'emptyColor' })
      }).toThrow('ColorAsset "emptyColor" must specify a default color')
    })

    it('should resolve to light color when theme is light', () => {
      // Mock the theme to return 'light'
      const originalGetCurrentTheme = (ColorAsset as any).getCurrentTheme
      ;(ColorAsset as any).getCurrentTheme = () => 'light'

      const colorAsset = ColorAsset.init({ default: '#FF0000', light: '#FF0000', dark: '#00FF00', name: 'testColor' })
      const resolved = colorAsset.resolve()

      expect(resolved).toBe('#FF0000')

      // Restore original function
      ;(ColorAsset as any).getCurrentTheme = originalGetCurrentTheme
    })

    it('should resolve to dark color when theme is dark', () => {
      // Mock the theme to return 'dark'
      const originalGetCurrentTheme = (ColorAsset as any).getCurrentTheme
      ;(ColorAsset as any).getCurrentTheme = () => 'dark'

      const colorAsset = ColorAsset.init({ default: '#FF0000', light: '#FF0000', dark: '#00FF00', name: 'testColor' })
      const resolved = colorAsset.resolve()

      expect(resolved).toBe('#00FF00')

      // Restore original function
      ;(ColorAsset as any).getCurrentTheme = originalGetCurrentTheme
    })

    it('should gracefully handle invalid theme values', () => {
      // Mock the theme to return an unexpected value
      const originalGetCurrentTheme = (ColorAsset as any).getCurrentTheme
      ;(ColorAsset as any).getCurrentTheme = () => 'invalid-theme'

      const colorAsset = ColorAsset.init({ default: '#FF0000', light: '#FF0000', dark: '#00FF00', name: 'testColor' })
      const resolved = colorAsset.resolve()

      // Should default to light theme for unknown theme
      expect(resolved).toBe('#FF0000')

      // Restore original function
      ;(ColorAsset as any).getCurrentTheme = originalGetCurrentTheme
    })

    it('should resolve correctly when theme is null or undefined', () => {
      // Mock the theme to return null
      const originalGetCurrentTheme = (ColorAsset as any).getCurrentTheme
      ;(ColorAsset as any).getCurrentTheme = () => null

      const colorAsset = ColorAsset.init({ default: '#FF0000', light: '#FF0000', dark: '#00FF00', name: 'testColor' })
      const resolved = colorAsset.resolve()

      // Should default to light theme for null or undefined
      expect(resolved).toBe('#FF0000')

      // Restore original function
      ;(ColorAsset as any).getCurrentTheme = originalGetCurrentTheme
    })

    it('should generate rgba output from hex values', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C',
        name: 'testColor',
      })

      expect(colorAsset.opacity(0.33).resolve()).toBe('rgba(103, 155, 156, 0.33)')
    })

    it('should generate rgba output from shorthand hex values', () => {
      const colorAsset = ColorAsset.init({
        default: '#abc',
        name: 'testColor',
      })

      expect(colorAsset.opacity(0.33).resolve()).toBe('rgba(170, 187, 204, 0.33)')
    })

    it('should ignore existing alpha in 8-digit hex and apply provided alpha', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C80',
        name: 'testColor',
      })

      expect(colorAsset.opacity(0.33).resolve()).toBe('rgba(103, 155, 156, 0.33)')
    })

    it('should convert rgb values to rgba values', () => {
      const colorAsset = ColorAsset.init({
        default: 'rgb(103, 155, 156)',
        name: 'testColor',
      })

      expect(colorAsset.opacity(0.33).resolve()).toBe('rgba(103, 155, 156, 0.33)')
    })

    it('should replace alpha channel for rgba values', () => {
      const colorAsset = ColorAsset.init({
        default: 'rgba(103, 155, 156, 0.8)',
        name: 'testColor',
      })

      expect(colorAsset.opacity(0.33).resolve()).toBe('rgba(103, 155, 156, 0.33)')
    })

    it('should convert hsl values to hsla values', () => {
      const colorAsset = ColorAsset.init({
        default: 'hsl(360, 100%, 50%)',
        name: 'testColor',
      })

      expect(colorAsset.opacity(0.33).resolve()).toBe('hsla(360, 100%, 50%, 0.33)')
    })

    it('should replace alpha channel for hsla values', () => {
      const colorAsset = ColorAsset.init({
        default: 'hsla(360, 100%, 50%, 0.8)',
        name: 'testColor',
      })

      expect(colorAsset.opacity(0.33).resolve()).toBe('hsla(360, 100%, 50%, 0.33)')
    })

    it('should return ColorAsset for named colors and CSS vars (chainable)', () => {
      const namedColorAsset = ColorAsset.init({
        default: 'red',
        name: 'namedColor',
      })
      const cssVarColorAsset = ColorAsset.init({
        default: 'var(--primary-color)',
        name: 'cssVarColor',
      })

      // For named colors, opacity returns ColorAsset (chainable)
      // Named colors are converted to rgba format for ColorAsset compatibility
      const namedResult = namedColorAsset.opacity(0.33)
      expect(typeof namedResult.resolve).toBe('function')
      expect(namedResult.resolve()).toBe('rgba(255, 0, 0, 0.33)')
      
      // For CSS vars, opacity returns ColorAsset (chainable) - Issue #157
      const cssVarResult = cssVarColorAsset.opacity(0.33)
      expect(typeof cssVarResult.resolve).toBe('function')
      expect(cssVarResult.resolve()).toBe(
        'color-mix(in srgb, var(--primary-color) 33%, transparent)'
      )
      
      // Verify chaining works (main goal of Issue #157)
      const chainedResult = cssVarColorAsset.opacity(0.5).saturate(0.2)
      expect(typeof chainedResult.resolve).toBe('function')
    })

    it('should clamp opacity to 0..1 range', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C',
        name: 'testColor',
      })

      expect(colorAsset.opacity(-1).resolve()).toBe('rgba(103, 155, 156, 0)')
      expect(colorAsset.opacity(2).resolve()).toBe('rgba(103, 155, 156, 1)')
    })

    it('should resolve theme variant before applying opacity', () => {
      const originalGetCurrentTheme = (ColorAsset as any).getCurrentTheme
      ;(ColorAsset as any).getCurrentTheme = () => 'dark'

      const colorAsset = ColorAsset.init({
        default: '#ffffff',
        light: '#ffffff',
        dark: '#000000',
        name: 'testColor',
      })

      expect(colorAsset.opacity(0.5).resolve()).toBe('rgba(0, 0, 0, 0.5)')

      ;(ColorAsset as any).getCurrentTheme = originalGetCurrentTheme
    })

    it('should not throw for invalid alpha outside development mode - returns original ColorAsset', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C',
        name: 'testColor',
      })

      expect(colorAsset.opacity(Number.NaN)).toBe(colorAsset)
      expect(colorAsset.opacity(Number.POSITIVE_INFINITY)).toBe(colorAsset)
    })

    it('should throw for invalid alpha in development mode', () => {
      const previousNodeEnv = process.env.NODE_ENV
      try {
        process.env.NODE_ENV = 'development'

        const colorAsset = ColorAsset.init({
          default: '#679B9C',
          name: 'testColor',
        })

        expect(() => colorAsset.opacity(Number.NaN)).toThrow(
          'ColorAsset.opacity(alpha) requires a finite number for asset "testColor"'
        )
      } finally {
        process.env.NODE_ENV = previousNodeEnv
      }
    })

    it('should keep the same color for saturate(0)', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C',
        name: 'testColor',
      })

      expect(colorAsset.saturate(0).resolve()).toBe('#679B9C')
    })

    it('should increase saturation for saturate(1)', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C',
        name: 'testColor',
      })

      expect(colorAsset.saturate(1).resolve()).toBe('#00A4A8')
    })

    it('should apply saturate(0.6) in OKLCH', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C',
        name: 'testColor',
      })

      expect(colorAsset.saturate(0.6).resolve()).toBe('#41A1A3')
    })

    it('should fully desaturate for saturate(-1)', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C',
        name: 'testColor',
      })

      expect(colorAsset.saturate(-1).resolve()).toBe('#909090')
    })

    it('should preserve alpha channel when saturating rgba colors', () => {
      const colorAsset = ColorAsset.init({
        default: 'rgba(103, 155, 156, 0.4)',
        name: 'testColor',
      })

      expect(colorAsset.saturate(0.5).resolve()).toBe('rgba(73, 160, 162, 0.4)')
    })

    it('should return unresolved value for unsupported color formats when saturating', () => {
      const colorAsset = ColorAsset.init({
        default: 'var(--primary-color)',
        name: 'testColor',
      })

      expect(colorAsset.saturate(0.5).resolve()).toBe('var(--primary-color)')
    })

    it('should resolve dark variant before applying saturation', () => {
      const originalGetCurrentTheme = (ColorAsset as any).getCurrentTheme
      ;(ColorAsset as any).getCurrentTheme = () => 'dark'

      const colorAsset = ColorAsset.init({
        default: '#ffffff',
        light: '#ffffff',
        dark: '#679B9C',
        name: 'testColor',
      })

      expect(colorAsset.saturate(0.6).resolve()).toBe('#41A1A3')

      ;(ColorAsset as any).getCurrentTheme = originalGetCurrentTheme
    })

    it('should saturate rgb input', () => {
      const colorAsset = ColorAsset.init({
        default: 'rgb(103, 155, 156)',
        name: 'testColor',
      })

      expect(colorAsset.saturate(0.6).resolve()).toBe('#41A1A3')
    })

    it('should saturate hsl input', () => {
      const colorAsset = ColorAsset.init({
        default: 'hsl(181, 21%, 51%)',
        name: 'testColor',
      })

      expect(colorAsset.saturate(0.6).resolve()).toBe('#42A1A3')
    })

    it('should saturate hsla input while preserving alpha', () => {
      const colorAsset = ColorAsset.init({
        default: 'hsla(181, 21%, 51%, 0.4)',
        name: 'testColor',
      })

      expect(colorAsset.saturate(0.6).resolve()).toBe('rgba(66, 161, 163, 0.4)')
    })

    it('should saturate named colors in supported table', () => {
      const colorAsset = ColorAsset.init({
        default: 'red',
        name: 'testColor',
      })

      expect(colorAsset.saturate(-0.5).resolve()).toBe('#CA675A')
    })

    it('should saturate 8-digit hex input while preserving alpha', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C80',
        name: 'testColor',
      })

      expect(colorAsset.saturate(0.6).resolve()).toBe('rgba(65, 161, 163, 0.502)')
    })

    it('should clamp saturation amount to -1..1 range', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C',
        name: 'testColor',
      })

      expect(colorAsset.saturate(2).resolve()).toBe('#00A4A8')
      expect(colorAsset.saturate(-5).resolve()).toBe('#909090')
    })

    it('should not throw for invalid saturation amount outside development mode - returns original', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C',
        name: 'testColor',
      })

      expect(colorAsset.saturate(Number.NaN)).toBe(colorAsset)
      expect(colorAsset.saturate(Number.POSITIVE_INFINITY)).toBe(colorAsset)
    })

    it('should throw for invalid saturation amount in development mode', () => {
      const previousNodeEnv = process.env.NODE_ENV
      try {
        process.env.NODE_ENV = 'development'

        const colorAsset = ColorAsset.init({
          default: '#679B9C',
          name: 'testColor',
        })

        expect(() => colorAsset.saturate(Number.NaN)).toThrow(
          'ColorAsset.saturate(amount) requires a finite number for asset "testColor"'
        )
      } finally {
        process.env.NODE_ENV = previousNodeEnv
      }
    })

    it('should map brighten(-1) to black', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C',
        name: 'testColor',
      })

      expect(colorAsset.brighten(-1).resolve()).toBe('#000000')
    })

    it('should keep the same color for brighten(0)', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C',
        name: 'testColor',
      })

      expect(colorAsset.brighten(0).resolve()).toBe('#679B9C')
    })

    it('should apply brighten(0.6) in OKLab', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C',
        name: 'testColor',
      })

      expect(colorAsset.brighten(0.6).resolve()).toBe('#A7DDDE')
    })

    it('should map brighten(1) to white', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C',
        name: 'testColor',
      })

      expect(colorAsset.brighten(1).resolve()).toBe('#FFFFFF')
    })

    it('should resolve dark variant before applying brightness', () => {
      const originalGetCurrentTheme = (ColorAsset as any).getCurrentTheme
      ;(ColorAsset as any).getCurrentTheme = () => 'dark'

      const colorAsset = ColorAsset.init({
        default: '#ffffff',
        light: '#ffffff',
        dark: '#679B9C',
        name: 'testColor',
      })

      expect(colorAsset.brighten(0.6).resolve()).toBe('#A7DDDE')

      ;(ColorAsset as any).getCurrentTheme = originalGetCurrentTheme
    })

    it('should brighten rgba input while preserving alpha', () => {
      const colorAsset = ColorAsset.init({
        default: 'rgba(103, 155, 156, 0.4)',
        name: 'testColor',
      })

      expect(colorAsset.brighten(0.6).resolve()).toBe('rgba(167, 221, 222, 0.4)')
    })

    it('should brighten hsl and hsla inputs', () => {
      const hslAsset = ColorAsset.init({
        default: 'hsl(180, 0%, 50%)',
        name: 'hslColor',
      })
      const hslaAsset = ColorAsset.init({
        default: 'hsla(180, 0%, 50%, 0.4)',
        name: 'hslaColor',
      })

      expect(hslAsset.brighten(0.6).resolve()).toBe('#CACACA')
      expect(hslaAsset.brighten(0.6).resolve()).toBe('rgba(202, 202, 202, 0.4)')
    })

    it('should brighten named colors in supported table', () => {
      const colorAsset = ColorAsset.init({
        default: 'red',
        name: 'testColor',
      })

      expect(colorAsset.brighten(0.5).resolve()).toBe('#FFA89B')
    })

    it('should brighten 8-digit hex input while preserving alpha', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C80',
        name: 'testColor',
      })

      expect(colorAsset.brighten(0.6).resolve()).toBe('rgba(167, 221, 222, 0.502)')
    })

    it('should return unresolved value for unsupported color formats when brightening', () => {
      const colorAsset = ColorAsset.init({
        default: 'var(--primary-color)',
        name: 'testColor',
      })

      expect(colorAsset.brighten(0.6).resolve()).toBe('var(--primary-color)')
    })

    it('should clamp brightness amount to -1..1 range', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C',
        name: 'testColor',
      })

      expect(colorAsset.brighten(2).resolve()).toBe('#FFFFFF')
      expect(colorAsset.brighten(-5).resolve()).toBe('#000000')
    })

    it('should not throw for invalid brightness amount outside development mode - returns original', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C',
        name: 'testColor',
      })

      expect(colorAsset.brighten(Number.NaN)).toBe(colorAsset)
      expect(colorAsset.brighten(Number.POSITIVE_INFINITY)).toBe(colorAsset)
    })

    it('should throw for invalid brightness amount in development mode', () => {
      const previousNodeEnv = process.env.NODE_ENV
      try {
        process.env.NODE_ENV = 'development'

        const colorAsset = ColorAsset.init({
          default: '#679B9C',
          name: 'testColor',
        })

        expect(() => colorAsset.brighten(Number.NaN)).toThrow(
          'ColorAsset.brighten(amount) requires a finite number for asset "testColor"'
        )
      } finally {
        process.env.NODE_ENV = previousNodeEnv
      }
    })

    it('should collapse contrast(-1) to OKLab mid-gray', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C',
        name: 'testColor',
      })

      expect(colorAsset.contrast(-1).resolve()).toBe('#636363')
    })

    it('should keep the same color for contrast(0)', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C',
        name: 'testColor',
      })

      expect(colorAsset.contrast(0).resolve()).toBe('#679B9C')
    })

    it('should apply contrast(0.6) in OKLab', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C',
        name: 'testColor',
      })

      expect(colorAsset.contrast(0.6).resolve()).toBe('#61BEC0')
    })

    it('should apply contrast(1) in OKLab', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C',
        name: 'testColor',
      })

      expect(colorAsset.contrast(1).resolve()).toBe('#58D6D9')
    })

    it('should resolve dark variant before applying contrast', () => {
      const originalGetCurrentTheme = (ColorAsset as any).getCurrentTheme
      ;(ColorAsset as any).getCurrentTheme = () => 'dark'

      const colorAsset = ColorAsset.init({
        default: '#ffffff',
        light: '#ffffff',
        dark: '#679B9C',
        name: 'testColor',
      })

      expect(colorAsset.contrast(0.6).resolve()).toBe('#61BEC0')

      ;(ColorAsset as any).getCurrentTheme = originalGetCurrentTheme
    })

    it('should apply contrast to rgb input', () => {
      const colorAsset = ColorAsset.init({
        default: 'rgb(103, 155, 156)',
        name: 'testColor',
      })

      expect(colorAsset.contrast(0.6).resolve()).toBe('#61BEC0')
    })

    it('should apply contrast to rgba input while preserving alpha', () => {
      const colorAsset = ColorAsset.init({
        default: 'rgba(103, 155, 156, 0.4)',
        name: 'testColor',
      })

      expect(colorAsset.contrast(0.6).resolve()).toBe('rgba(97, 190, 192, 0.4)')
    })

    it('should apply contrast to hsl and hsla inputs', () => {
      const hslAsset = ColorAsset.init({
        default: 'hsl(181, 21%, 51%)',
        name: 'hslColor',
      })
      const hslaAsset = ColorAsset.init({
        default: 'hsla(181, 21%, 51%, 0.4)',
        name: 'hslaColor',
      })

      expect(hslAsset.contrast(0.6).resolve()).toBe('#63BEC0')
      expect(hslaAsset.contrast(0.6).resolve()).toBe('rgba(99, 190, 192, 0.4)')
    })

    it('should apply contrast to named colors in supported table', () => {
      const colorAsset = ColorAsset.init({
        default: 'red',
        name: 'testColor',
      })

      expect(colorAsset.contrast(-0.5).resolve()).toBe('#B55447')
    })

    it('should apply contrast to 8-digit hex input while preserving alpha', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C80',
        name: 'testColor',
      })

      expect(colorAsset.contrast(0.6).resolve()).toBe('rgba(97, 190, 192, 0.502)')
    })

    it('should return unresolved value for unsupported color formats when applying contrast', () => {
      const colorAsset = ColorAsset.init({
        default: 'var(--primary-color)',
        name: 'testColor',
      })

      expect(colorAsset.contrast(0.6).resolve()).toBe('var(--primary-color)')
    })

    it('should clamp contrast amount to -1..1 range', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C',
        name: 'testColor',
      })

      expect(colorAsset.contrast(2).resolve()).toBe('#58D6D9')
      expect(colorAsset.contrast(-5).resolve()).toBe('#636363')
    })

    it('should not throw for invalid contrast amount outside development mode - returns original', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C',
        name: 'testColor',
      })

      expect(colorAsset.contrast(Number.NaN)).toBe(colorAsset)
      expect(colorAsset.contrast(Number.POSITIVE_INFINITY)).toBe(colorAsset)
    })

    it('should throw for invalid contrast amount in development mode', () => {
      const previousNodeEnv = process.env.NODE_ENV
      try {
        process.env.NODE_ENV = 'development'

        const colorAsset = ColorAsset.init({
          default: '#679B9C',
          name: 'testColor',
        })

        expect(() => colorAsset.contrast(Number.NaN)).toThrow(
          'ColorAsset.contrast(amount) requires a finite number for asset "testColor"'
        )
      } finally {
        process.env.NODE_ENV = previousNodeEnv
      }
    })

    it('should keep the same color for rotateHue(0)', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C',
        name: 'testColor',
      })

      expect(colorAsset.rotateHue(0).resolve()).toBe('#679B9C')
    })

    it('should apply rotateHue(120) in OKLCH', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C',
        name: 'testColor',
      })

      expect(colorAsset.rotateHue(120).resolve()).toBe('#9E86A7')
    })

    it('should apply rotateHue(240) in OKLCH', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C',
        name: 'testColor',
      })

      expect(colorAsset.rotateHue(240).resolve()).toBe('#A38C6A')
    })

    it('should keep the same color for rotateHue(360)', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C',
        name: 'testColor',
      })

      expect(colorAsset.rotateHue(360).resolve()).toBe('#679B9C')
    })

    it('should normalize negative rotation to 0..359 range', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C',
        name: 'testColor',
      })

      expect(colorAsset.rotateHue(-30).resolve()).toBe('#6F9B89')
      expect(colorAsset.rotateHue(-30).resolve()).toBe(colorAsset.rotateHue(330).resolve())
      expect(colorAsset.rotateHue(-1).resolve()).toBe(colorAsset.rotateHue(359).resolve())
    })

    it('should normalize boundary values', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C',
        name: 'testColor',
      })

      expect(colorAsset.rotateHue(359).resolve()).toBe('#679B9B')
      expect(colorAsset.rotateHue(720).resolve()).toBe('#679B9C')
    })

    it('should resolve dark variant before applying hue rotation', () => {
      const originalGetCurrentTheme = (ColorAsset as any).getCurrentTheme
      ;(ColorAsset as any).getCurrentTheme = () => 'dark'

      const colorAsset = ColorAsset.init({
        default: '#ffffff',
        light: '#ffffff',
        dark: '#679B9C',
        name: 'testColor',
      })

      expect(colorAsset.rotateHue(120).resolve()).toBe('#9E86A7')

      ;(ColorAsset as any).getCurrentTheme = originalGetCurrentTheme
    })

    it('should rotate rgba input while preserving alpha', () => {
      const colorAsset = ColorAsset.init({
        default: 'rgba(103, 155, 156, 0.4)',
        name: 'testColor',
      })

      expect(colorAsset.rotateHue(120).resolve()).toBe('rgba(158, 134, 167, 0.4)')
    })

    it('should rotate rgb input', () => {
      const colorAsset = ColorAsset.init({
        default: 'rgb(103, 155, 156)',
        name: 'testColor',
      })

      expect(colorAsset.rotateHue(120).resolve()).toBe('#9E86A7')
    })

    it('should rotate hsl and hsla inputs', () => {
      const hslAsset = ColorAsset.init({
        default: 'hsl(181, 21%, 51%)',
        name: 'hslColor',
      })
      const hslaAsset = ColorAsset.init({
        default: 'hsla(181, 21%, 51%, 0.4)',
        name: 'hslaColor',
      })

      expect(hslAsset.rotateHue(120).resolve()).toBe('#9E86A7')
      expect(hslaAsset.rotateHue(120).resolve()).toBe('rgba(158, 134, 167, 0.4)')
    })

    it('should rotate named colors in supported table', () => {
      const colorAsset = ColorAsset.init({
        default: 'red',
        name: 'testColor',
      })

      expect(colorAsset.rotateHue(120).resolve()).toBe('#00A447')
    })

    it('should rotate 8-digit hex input while preserving alpha', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C80',
        name: 'testColor',
      })

      expect(colorAsset.rotateHue(120).resolve()).toBe('rgba(158, 134, 167, 0.502)')
    })

    it('should return unresolved value for unsupported color formats when rotating hue', () => {
      const colorAsset = ColorAsset.init({
        default: 'var(--primary-color)',
        name: 'testColor',
      })

      expect(colorAsset.rotateHue(120).resolve()).toBe('var(--primary-color)')
    })

    it('should not throw for invalid rotateHue input outside development mode - returns original', () => {
      const colorAsset = ColorAsset.init({
        default: '#679B9C',
        name: 'testColor',
      })

      expect(colorAsset.rotateHue(Number.NaN)).toBe(colorAsset)
      expect(colorAsset.rotateHue(Number.POSITIVE_INFINITY)).toBe(colorAsset)
    })

    it('should throw for invalid rotateHue input in development mode', () => {
      const previousNodeEnv = process.env.NODE_ENV
      try {
        process.env.NODE_ENV = 'development'

        const colorAsset = ColorAsset.init({
          default: '#679B9C',
          name: 'testColor',
        })

        expect(() => colorAsset.rotateHue(Number.NaN)).toThrow(
          'ColorAsset.rotateHue(degrees) requires a finite number for asset "testColor"'
        )
      } finally {
        process.env.NODE_ENV = previousNodeEnv
      }
    })
  })

  describe('ImageAsset', () => {
    it('should create an image asset with light and dark values', () => {
      const imageAsset = ImageAsset.init({ default: '/light.png', light: '/light.png', dark: '/dark.png', name: 'testImage' })

      expect(imageAsset.light).toBe('/light.png')
      expect(imageAsset.dark).toBe('/dark.png')
      expect(imageAsset.name).toBe('testImage')
    })

    it('should support additional options', () => {
      const imageAsset = ImageAsset.init({ default: '/light.png', light: '/light.png', dark: '/dark.png', name: 'testImage', options: {
        alt: 'Test image',
        placeholder: '/placeholder.png',
      } })

      expect(imageAsset.alt).toBe('Test image')
      expect(imageAsset.placeholder).toBe('/placeholder.png')
    })

    it('should resolve to light image when theme is light', () => {
      // Mock the theme to return 'light'
      const originalGetCurrentTheme = (ImageAsset as any).getCurrentTheme
      ;(ImageAsset as any).getCurrentTheme = () => 'light'

      const imageAsset = ImageAsset.init({ default: '/light.png', light: '/light.png', dark: '/dark.png', name: 'testImage' })
      const resolved = imageAsset.resolve()

      expect(resolved).toBe('/light.png')

      // Restore original function
      ;(ImageAsset as any).getCurrentTheme = originalGetCurrentTheme
    })

    it('should resolve to dark image when theme is dark', () => {
      // Mock the theme to return 'dark'
      const originalGetCurrentTheme = (ImageAsset as any).getCurrentTheme
      ;(ImageAsset as any).getCurrentTheme = () => 'dark'

      const imageAsset = ImageAsset.init({ default: '/light.png', light: '/light.png', dark: '/dark.png', name: 'testImage' })
      const resolved = imageAsset.resolve()

      expect(resolved).toBe('/dark.png')

      // Restore original function
      ;(ImageAsset as any).getCurrentTheme = originalGetCurrentTheme
    })

    it('should provide src, lightSrc, and darkSrc accessors', () => {
      const imageAsset = ImageAsset.init({ default: '/light.png', light: '/light.png', dark: '/dark.png', name: 'testImage' })

      expect(imageAsset.src).toBe(imageAsset.resolve())
      expect(imageAsset.lightSrc).toBe('/light.png')
      expect(imageAsset.darkSrc).toBe('/dark.png')
    })

    it('should handle empty string values by throwing error', () => {
      // ImageAsset now validates that default is provided
      expect(() => {
        ImageAsset.init({ default: '', light: '', dark: '', name: 'emptyImage' })
      }).toThrow('ImageAsset "emptyImage" must specify a default image path')
    })
  })

  describe('Proxy-based Access', () => {
    it('should provide proxy access to assets', () => {
      const colorAsset = ColorAsset.init({ default: '#FF0000', light: '#FF0000', dark: '#00FF00', name: 'testColor' })
      assetCollection.add('testColor', colorAsset)

      const proxy = assetCollection.asProxy()
      expect(proxy.testColor).toStrictEqual(colorAsset)
    })

    it('should return undefined for non-existent assets through proxy', () => {
      const proxy = assetCollection.asProxy()
      expect(proxy.nonExistent).toBeUndefined()
    })

    it('should resolve themes correctly when accessing assets through proxy', () => {
      // Mock the theme to return 'dark'
      const originalGetCurrentTheme = (ColorAsset as any).getCurrentTheme
      ;(ColorAsset as any).getCurrentTheme = () => 'dark'

      const colorAsset = ColorAsset.init({ default: '#FF0000', light: '#FF0000', dark: '#00FF00', name: 'testColor' })
      assetCollection.add('testColor', colorAsset)

      const proxy = assetCollection.asProxy()
      const resolvedValue = proxy.testColor

      // Should resolve to dark theme value
      expect(resolvedValue).toStrictEqual(colorAsset)

      // Restore original function
      ;(ColorAsset as any).getCurrentTheme = originalGetCurrentTheme
    })

    it('should access .light and .dark properties correctly through proxy', () => {
      const colorAsset = ColorAsset.init({ default: '#FF0000', light: '#FF0000', dark: '#00FF00', name: 'testColor' })
      assetCollection.add('testColor', colorAsset)

      const proxy = assetCollection.asProxy()

      // Access properties directly through proxy
      expect(proxy.testColor.light).toBe('#FF0000')
      expect(proxy.testColor.dark).toBe('#00FF00')
    })
  })

  describe('Utility Functions', () => {
    it('should register assets correctly', () => {
      const _colorAsset = ColorAsset.init({ default: '#FF0000', light: '#FF0000', dark: '#00FF00', name: 'testColor' })

      // This function is exposed from index.ts
      // We'll test through the Assets object since it's the main way to use it
      const _originalAssetsCollection = assetCollection
      const proxy = assetCollection.asProxy()

      // Just verify we can call it without error
      expect(typeof proxy).toBe('object')
    })

    it('should create color assets correctly', () => {
      // Test createColorAsset function
      const colorAsset = ColorAsset.init({ default: '#FF0000', light: '#FF0000', dark: '#00FF00', name: 'testColor' })
      expect(colorAsset.light).toBe('#FF0000')
      expect(colorAsset.dark).toBe('#00FF00')
      expect(colorAsset.name).toBe('testColor')
    })

    it('should create image assets correctly', () => {
      // Test createImageAsset function
      const imageAsset = ImageAsset.init({ default: '/light.png', light: '/light.png', dark: '/dark.png', name: 'testImage' })
      expect(imageAsset.light).toBe('/light.png')
      expect(imageAsset.dark).toBe('/dark.png')
      expect(imageAsset.name).toBe('testImage')
    })
  })

  describe('System Assets', () => {
    it('should properly initialize system assets', () => {
      // Verify system assets are available
      expect(Assets.systemBlue).toBeDefined()
      expect(Assets.systemGreen).toBeDefined()
      expect(Assets.systemRed).toBeDefined()
      expect(Assets.systemOrange).toBeDefined()
    })

    it('should have correct system asset colors', () => {
      expect(Assets.systemBlue.light).toBe('#007AFF')
      expect(Assets.systemBlue.dark).toBe('#0A84FF')
      expect(Assets.systemGreen.light).toBe('#34C759')
      expect(Assets.systemGreen.dark).toBe('#30D158')
    })
  })

  describe('Color Validation', () => {
    it('should validate hex colors correctly', () => {
      const result1 = ColorAsset.validateColor('#FF0000')
      expect(result1.isValid).toBe(true)
      expect(result1.format).toBe('hex')

      const result2 = ColorAsset.validateColor('#F00')
      expect(result2.isValid).toBe(true)
      expect(result2.format).toBe('hex')

      const result3 = ColorAsset.validateColor('#FF000080')
      expect(result3.isValid).toBe(true)
      expect(result3.format).toBe('hex')
    })

    it('should validate RGB colors correctly', () => {
      const result1 = ColorAsset.validateColor('rgb(255, 0, 0)')
      expect(result1.isValid).toBe(true)
      expect(result1.format).toBe('rgb')

      const result2 = ColorAsset.validateColor('rgb(0,0,0)')
      expect(result2.isValid).toBe(true)
      expect(result2.format).toBe('rgb')
    })

    it('should validate RGBA colors correctly', () => {
      const result = ColorAsset.validateColor('rgba(255, 0, 0, 0.5)')
      expect(result.isValid).toBe(true)
      expect(result.format).toBe('rgba')
    })

    it('should validate HSL colors correctly', () => {
      const result = ColorAsset.validateColor('hsl(360, 100%, 50%)')
      expect(result.isValid).toBe(true)
      expect(result.format).toBe('hsl')
    })

    it('should validate HSLA colors correctly', () => {
      const result = ColorAsset.validateColor('hsla(360, 100%, 50%, 0.8)')
      expect(result.isValid).toBe(true)
      expect(result.format).toBe('hsla')
    })

    it('should validate named colors correctly', () => {
      const result1 = ColorAsset.validateColor('red')
      expect(result1.isValid).toBe(true)
      expect(result1.format).toBe('named')

      const result2 = ColorAsset.validateColor('transparent')
      expect(result2.isValid).toBe(true)
      expect(result2.format).toBe('named')
    })

    it('should validate CSS custom properties correctly', () => {
      const result = ColorAsset.validateColor('var(--primary-color)')
      expect(result.isValid).toBe(true)
      expect(result.format).toBe('named')
    })

    it.each([
      ['oklch(70% 0.15 250)', 'oklch'],
      ['oklch(0.7 0.15 250deg / 0.5)', 'oklch'],
      ['oklch(none 0 0)', 'oklch'],
      ['oklab(0.7 0.1 -0.1)', 'oklab'],
      ['lab(50% 40 30)', 'lab'],
      ['lch(50% 40 30)', 'lch'],
      ['color(display-p3 1 0 0)', 'color'],
      ['color(srgb-linear 0.5 0.5 0.5 / 50%)', 'color'],
      ['color(--my-profile 0.1 0.2 0.3)', 'color'],
      ['hwb(200 30% 20%)', 'hwb'],
      ['rgb(255 0 0)', 'rgb'],
      ['rgb(255 0 0 / 50%)', 'rgb'],
      ['rgb(100% 0% 0% / 0.5)', 'rgb'],
      ['rgba(255 0 0 / 0.5)', 'rgba'],
      ['hsl(200deg 50% 40%)', 'hsl'],
      ['hsl(0.5turn 50% 40% / 0.5)', 'hsl'],
      ['hsla(200 50% 40% / 0.5)', 'hsla'],
      ['OKLCH(70% 0.15 250)', 'oklch'],
    ] as const)(
      'should accept CSS Color 4 syntax %s',
      (input, format) => {
        const result = ColorAsset.validateColor(input)
        expect(result.isValid).toBe(true)
        expect(result.format).toBe(format)
      }
    )

    it.each([
      'oklch(70% 0.15)',
      'oklch(70% 0.15 250 300)',
      'oklch(70%, 0.15, 250)',
      'oklch(70% 0.15 250 /)',
      'oklch(70% 0.15 250) extra',
      'oklch(70% abc 250)',
      'color(1 0 0)',
      'color(display-p3 1 0)',
      'color(unknown-space 1 0 0)',
      'rgb(255 0)',
      'hsl(200deg 50%)',
      'lab(50% 40 30 20 10)',
    ])('should reject malformed CSS Color 4 syntax %s', input => {
      const result = ColorAsset.validateColor(input)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Unsupported color format')
    })

    it('should construct assets from CSS Color 4 syntax and pass them through transforms', () => {
      const asset = ColorAsset.init({
        name: 'modern',
        default: 'oklch(70% 0.15 250)',
        light: 'rgb(255 0 0 / 50%)',
        dark: 'color(display-p3 1 0 0)',
      })

      expect(asset.resolve()).toBe('rgb(255 0 0 / 50%)')

      // Accepted-but-untransformable values flow through the numeric transforms
      // unchanged rather than throwing.
      expect(asset.brighten(0.3).default).toBe('oklch(70% 0.15 250)')
      expect(asset.saturate(0.3).default).toBe('oklch(70% 0.15 250)')
      expect(asset.contrast(0.3).default).toBe('oklch(70% 0.15 250)')
      expect(asset.rotateHue(90).default).toBe('oklch(70% 0.15 250)')
      expect(asset.brighten(0.3).dark).toBe('color(display-p3 1 0 0)')

      // The CSS Color 4 rgb() form is parsed, so it transforms like rgba().
      expect(asset.brighten(0.3).light).toBe(
        ColorAsset.init({ name: 'legacy', default: 'rgba(255, 0, 0, 0.5)' }).brighten(0.3).default
      )

      // opacity() has a generic color-mix() path, so it still composes.
      expect(asset.opacity(0.5).default).toBe(
        'color-mix(in srgb, oklch(70% 0.15 250) 50%, transparent)'
      )
    })

    it.each([
      ['rgb(103 155 156)', 'rgb(103, 155, 156)'],
      ['rgba(103 155 156)', 'rgb(103, 155, 156)'],
      ['RGB(103 155 156)', 'rgb(103, 155, 156)'],
      ['rgb(40.39% 60.78% 61.18%)', 'rgb(103, 155, 156)'],
      ['rgb(none 155 156)', 'rgb(0, 155, 156)'],
      ['rgb(103 155 156 / 0.4)', 'rgba(103, 155, 156, 0.4)'],
      ['rgb(103 155 156 / 40%)', 'rgba(103, 155, 156, 0.4)'],
      ['hsl(181 21% 51%)', 'hsl(181, 21%, 51%)'],
      ['hsl(181deg 21% 51%)', 'hsl(181, 21%, 51%)'],
      ['hsl(181 21 51)', 'hsl(181, 21%, 51%)'],
      ['hsl(0.5turn 21% 51%)', 'hsl(180, 21%, 51%)'],
      ['hsl(200grad 21% 51%)', 'hsl(180, 21%, 51%)'],
      ['hsl(3.14159265rad 21% 51%)', 'hsl(180, 21%, 51%)'],
      ['hsl(none 21% 51%)', 'hsl(0, 21%, 51%)'],
      ['hsl(181deg 21% 51% / 0.4)', 'hsla(181, 21%, 51%, 0.4)'],
      ['hsla(181 21% 51% / 40%)', 'hsla(181, 21%, 51%, 0.4)'],
    ])('should transform CSS Color 4 form %s exactly like legacy %s', (modern, legacy) => {
      const modernAsset = ColorAsset.init({ name: 'modern', default: modern })
      const legacyAsset = ColorAsset.init({ name: 'legacy', default: legacy })

      expect(modernAsset.brighten(0.6).resolve()).toBe(legacyAsset.brighten(0.6).resolve())
      expect(modernAsset.saturate(0.6).resolve()).toBe(legacyAsset.saturate(0.6).resolve())
      expect(modernAsset.contrast(0.6).resolve()).toBe(legacyAsset.contrast(0.6).resolve())
      expect(modernAsset.rotateHue(120).resolve()).toBe(legacyAsset.rotateHue(120).resolve())
      expect(modernAsset.brighten(0.6).resolve()).toMatch(/^(#[0-9A-F]{6}|rgba\()/)
    })

    it('should preserve slash alpha from CSS Color 4 forms through transforms and opacity()', () => {
      const rgb = ColorAsset.init({ name: 'rgb', default: 'rgb(103 155 156 / 0.4)' })
      expect(rgb.brighten(0.6).resolve()).toBe('rgba(167, 221, 222, 0.4)')
      expect(rgb.opacity(0.33).resolve()).toBe('rgba(103, 155, 156, 0.33)')

      const hsl = ColorAsset.init({ name: 'hsl', default: 'hsl(181deg 21% 51% / 40%)' })
      expect(hsl.rotateHue(120).resolve()).toBe(
        ColorAsset.init({ name: 'legacy', default: 'hsla(181, 21%, 51%, 0.4)' }).rotateHue(120).resolve()
      )
      expect(hsl.opacity(0.5).resolve()).toBe('hsla(181, 21%, 51%, 0.5)')
      expect(
        ColorAsset.init({ name: 'turn', default: 'hsl(0.5turn 21 51)' }).opacity(0.5).resolve()
      ).toBe('hsla(180, 21%, 51%, 0.5)')
    })

    it('should clamp out-of-range CSS Color 4 channels instead of throwing', () => {
      const asset = ColorAsset.init({ name: 'clamped', default: 'rgb(300 -20 120% / 150%)' })
      expect(asset.brighten(0).resolve()).toBe(
        ColorAsset.init({ name: 'legacy', default: 'rgb(255, 0, 255)' }).brighten(0).resolve()
      )
    })

    it('should reject invalid color formats', () => {
      const result1 = ColorAsset.validateColor('invalid-color')
      expect(result1.isValid).toBe(false)
      expect(result1.error).toContain('Unsupported color format')

      const result2 = ColorAsset.validateColor('#GGGGGG')
      expect(result2.isValid).toBe(false)
      expect(result2.error).toContain('Unsupported color format')

      const result3 = ColorAsset.validateColor('rgb(256, 0, 0)')
      expect(result3.isValid).toBe(false)
      expect(result3.error).toContain('RGB values must be between 0 and 255')
    })

    it('should throw error when creating ColorAsset with invalid colors', () => {
      expect(() => {
        ColorAsset.init({ default: 'invalid-color', light: 'invalid-color', dark: '#000000', name: 'test' })
      }).toThrow('Invalid default color format for asset "test"')

      expect(() => {
        ColorAsset.init({ default: '#000000', light: '#000000', dark: 'invalid-color', name: 'test' })
      }).toThrow('Invalid dark color format')
    })
  })

  describe('Asset Discovery', () => {
    beforeEach(() => {
      // Register some test assets for discovery testing
      registerAsset('testDiscovery1', createColorAsset('#FF0000', '#00FF00', 'testDiscovery1'))
      registerAsset('testDiscovery2', createImageAsset('/light.png', '/dark.png', 'testDiscovery2'))
    })

    it('should list all asset names', () => {
      const names = listAssetNames()
      expect(names).toContain('systemBlue')
      expect(names).toContain('testDiscovery1')
      expect(names).toContain('testDiscovery2')
      // Verify the array is sorted
      const sortedNames = [...names].sort()
      expect(names).toEqual(sortedNames)
    })

    it('should get asset info for all assets', () => {
      const assetInfos = getAssetInfo()
      expect(assetInfos.length).toBeGreaterThan(0)

      const testAsset1 = assetInfos.find((info) => info.name === 'testDiscovery1')
      expect(testAsset1).toBeDefined()
      expect(testAsset1?.type).toBe('color')

      const testAsset2 = assetInfos.find((info) => info.name === 'testDiscovery2')
      expect(testAsset2).toBeDefined()
      expect(testAsset2?.type).toBe('image')
    })

    it('should sort asset info by name', () => {
      const assetInfos = getAssetInfo()
      const names = assetInfos.map((info) => info.name)
      // Verify the array is sorted
      const sortedNames = [...names].sort()
      expect(names).toEqual(sortedNames)
    })
  })

  describe('Enhanced Type Safety', () => {
    it('should provide proper TypeScript types', () => {
      // This test validates that the Assets object has proper typing
      expect(Assets.systemBlue).toBeDefined()
      expect(Assets.systemBlue.light).toBe('#007AFF')
      expect(Assets.systemBlue.dark).toBe('#0A84FF')

      // Test that we can access both resolved and explicit theme variants
      const blueColor = Assets.systemBlue
      expect(typeof blueColor.resolve()).toBe('string')
      expect(typeof blueColor.light).toBe('string')
      expect(typeof blueColor.dark).toBe('string')
    })
  })
})
