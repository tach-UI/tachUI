/**
 * Test for the new registerAsset API with name override functionality
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { ColorAsset, registerAsset, Assets, listAssetNames } from '../../src/assets'

describe('registerAsset with name override', () => {
  beforeEach(() => {
    // Clear any existing assets for clean tests
    const assetCollection = (Assets as any).__assetCollection
    if (assetCollection) {
      assetCollection.assets.clear()
    }
  })

  test('should register asset with automatic name from asset.name', () => {
    const asset = ColorAsset.init({
      default: '#007AFF',
      light: '#007AFF',
      dark: '#0A84FF',
      name: 'autoNameTest'
    })

    registerAsset(asset)
    
    const registeredNames = listAssetNames()
    expect(registeredNames).toContain('autoNameTest')
    expect(Assets.autoNameTest).toBeDefined()
  })

  test('should register asset with override name', () => {
    const asset = ColorAsset.init({
      default: '#FF3B30',
      light: '#FF3B30',
      dark: '#FF453A',
      name: 'originalName'
    })

    registerAsset(asset, 'overriddenName')
    
    const registeredNames = listAssetNames()
    expect(registeredNames).toContain('overriddenName')
    expect(registeredNames).not.toContain('originalName')
    expect(Assets.overriddenName).toBeDefined()
    expect((Assets as any).originalName).toBeUndefined()
  })

  test('should support legacy API with (name, asset)', () => {
    const asset = ColorAsset.init({
      default: '#34C759',
      light: '#34C759',
      dark: '#30D158',
      name: 'internalName'
    })

    registerAsset('legacyName', asset)
    
    const registeredNames = listAssetNames()
    expect(registeredNames).toContain('legacyName')
    expect(registeredNames).not.toContain('internalName')
    expect(Assets.legacyName).toBeDefined()
    expect((Assets as any).internalName).toBeUndefined()
  })

  test('should handle all three API variations correctly', () => {
    // Test 1: Automatic name
    const asset1 = ColorAsset.init({
      default: '#007AFF',
      name: 'blue'
    })
    registerAsset(asset1)

    // Test 2: Override name
    const asset2 = ColorAsset.init({
      default: '#FF3B30',
      name: 'internalRed'
    })
    registerAsset(asset2, 'customRed')

    // Test 3: Legacy API
    const asset3 = ColorAsset.init({
      default: '#34C759',
      name: 'internalGreen'
    })
    registerAsset('legacyGreen', asset3)

    const registeredNames = listAssetNames()
    
    // Check that all expected names are registered
    expect(registeredNames).toContain('blue')        // From asset1.name
    expect(registeredNames).toContain('customRed')   // From override
    expect(registeredNames).toContain('legacyGreen') // From legacy API
    
    // Check that internal names are NOT registered
    expect(registeredNames).not.toContain('internalRed')
    expect(registeredNames).not.toContain('internalGreen')

    // Verify assets are accessible
    expect(Assets.blue).toBeDefined()
    expect(Assets.customRed).toBeDefined()
    expect(Assets.legacyGreen).toBeDefined()
  })

  test('should throw error for invalid arguments', () => {
    expect(() => {
      (registerAsset as any)()
    }).toThrow('registerAsset requires at least one argument')

    expect(() => {
      (registerAsset as any)('string-only')
    }).toThrow('registerAsset requires either (name, asset), (asset), (asset, overrideName), or (...assets)')

    expect(() => {
      (registerAsset as any)(123, 'invalid')
    }).toThrow('registerAsset requires either (name, asset), (asset), (asset, overrideName), or (...assets)')
  })

  test('should register multiple assets in a single variadic call', () => {
    const asset1 = ColorAsset.init({
      default: '#EDEAE9',
      name: 'dazzle'
    })
    const asset2 = ColorAsset.init({
      default: '#679B9C',
      name: 'grayteal'
    })
    const asset3 = ColorAsset.init({
      default: '#332A25',
      name: 'industry'
    })

    registerAsset(asset1, asset2, asset3)

    const registeredNames = listAssetNames()
    expect(registeredNames).toContain('dazzle')
    expect(registeredNames).toContain('grayteal')
    expect(registeredNames).toContain('industry')
  })

  test('should fail fast for invalid entry in variadic call with index in message', () => {
    const firstAsset = ColorAsset.init({
      default: '#679B9C',
      name: 'grayteal'
    })
    const secondAsset = ColorAsset.init({
      default: '#EDEAE9',
      name: 'dazzle'
    })

    const namesBefore = listAssetNames()

    expect(() => {
      (registerAsset as any)(firstAsset, secondAsset, 'not-an-asset')
    }).toThrow('registerAsset variadic argument at index 2 must be an Asset')

    const namesAfter = listAssetNames()
    expect(namesAfter).toEqual(namesBefore)
  })

  test('should support explicit undefined override argument', () => {
    const asset = ColorAsset.init({
      default: '#679B9C',
      name: 'grayteal'
    })

    registerAsset(asset, undefined)

    expect(listAssetNames()).toContain('grayteal')
    expect(Assets.grayteal).toBeDefined()
  })

  test('should preserve duplicate-name overwrite semantics in variadic call', () => {
    const first = ColorAsset.init({
      default: '#000000',
      name: 'sharedName'
    })
    const second = ColorAsset.init({
      default: '#FFFFFF',
      name: 'sharedName'
    })

    registerAsset(first, second)

    expect(listAssetNames()).toContain('sharedName')
    expect(Assets.sharedName.resolve()).toBe('#FFFFFF')
  })
})

describe('registerAsset typed return (Issue #156)', () => {
  beforeEach(() => {
    const assetCollection = (Assets as any).__assetCollection
    if (assetCollection) {
      assetCollection.assets.clear()
    }
  })

  test('should return ColorAssetProxy when registering ColorAsset', () => {
    const myColor = registerAsset(ColorAsset.init({
      default: '#FF0000',
      name: 'typedColor'
    }))

    // The return value should be the ColorAsset itself (which implements ColorAssetProxy)
    expect(myColor).toBeDefined()
    expect(typeof myColor.opacity).toBe('function')
    expect(typeof myColor.resolve).toBe('function')
  })

  test('should allow using returned asset without Assets.x access', () => {
    // This is the key use case: users can export the return value
    const myColor = registerAsset(ColorAsset.init({
      default: '#00FF00',
      light: '#00FF00',
      dark: '#00CC00',
      name: 'exportableColor'
    }))

    // Should be able to use it directly with full type safety
    const resolved = myColor.resolve()
    expect(resolved).toBeDefined()

    // Transform methods work and return ColorAsset (chainable)
    const withOpacity = myColor.opacity(0.5)
    expect(withOpacity).toBeDefined()
    expect(typeof withOpacity.resolve).toBe('function')
    // Now chainable!
    const furtherOpacity = withOpacity.opacity(0.5)
    expect(furtherOpacity).toBeDefined()
  })

  test('should return asset from named registration', () => {
    const myColor = registerAsset('myNamedColor', ColorAsset.init({
      default: '#0000FF',
      name: 'original'
    }))

    expect(myColor).toBeDefined()
    expect(typeof myColor.opacity).toBe('function')
  })
})
