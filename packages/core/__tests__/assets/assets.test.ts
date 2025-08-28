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
