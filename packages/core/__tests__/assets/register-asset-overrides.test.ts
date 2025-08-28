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
    }).toThrow()

    expect(() => {
      (registerAsset as any)('string-only')
    }).toThrow()

    expect(() => {
      (registerAsset as any)(123, 'invalid')
    }).toThrow()
  })
})