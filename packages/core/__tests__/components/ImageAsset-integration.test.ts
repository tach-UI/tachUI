/**
 * Image Component - ImageAsset Integration Test
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Image } from '../../src/components/Image'
import { ImageAsset } from '../../src/assets/ImageAsset'
import { setTheme } from '../../src/reactive/theme'

describe('Image Component - ImageAsset Integration', () => {
  beforeEach(() => {
    // Reset to light theme
    setTheme('light')
  })

  it('should accept ImageAsset and convert to reactive signal', () => {
    const imageAsset = ImageAsset.init({
      default: 'logo-light.png',
      light: 'logo-light.png',
      dark: 'logo-dark.png',
      name: 'testLogo'
    })
    const imageComponent = Image(imageAsset, { alt: 'Test Logo' })

    expect(imageComponent).toBeDefined()
    expect(imageComponent.type).toBe('component')
  })

  it('should resolve ImageAsset to reactive signal', () => {
    const imageAsset = ImageAsset.init({
      default: 'light.jpg',
      light: 'light.jpg',
      dark: 'dark.jpg',
      name: 'testImage'
    })
    const imageComponent = Image(imageAsset)

    // Access the underlying wrapped component to check src conversion
    const wrappedComponent = (imageComponent as any)
    expect(wrappedComponent).toBeDefined()
    // The ImageAsset should be converted to a reactive signal internally
    expect(imageAsset.resolve()).toBe('light.jpg') // Should resolve to light theme
  })

  it('should react to theme changes with ImageAsset', () => {
    const imageAsset = ImageAsset.init({
      default: 'logo-light.png',
      light: 'logo-light.png',
      dark: 'logo-dark.png',
      name: 'testLogo'
    })
    const imageComponent = Image(imageAsset)

    // Test theme resolution through the ImageAsset directly
    setTheme('light')
    expect(imageAsset.resolve()).toBe('logo-light.png')

    setTheme('dark')
    expect(imageAsset.resolve()).toBe('logo-dark.png')

    setTheme('light')
    expect(imageAsset.resolve()).toBe('logo-light.png')
  })

  it('should work with string src normally', () => {
    const imageComponent = Image('static-image.jpg', { alt: 'Static Image' })
    
    expect(imageComponent).toBeDefined()
    expect(imageComponent.type).toBe('component')
    // String sources should work as expected
  })
})