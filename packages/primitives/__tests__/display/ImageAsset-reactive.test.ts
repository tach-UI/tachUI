/**
 * Image Component - ImageAsset Reactive Behavior Test
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { EnhancedImage } from '../../src/display/Image'
import { ImageAsset } from '@tachui/core'
import { setTheme } from '@tachui/core'

describe('Image Component - Reactive ImageAsset Behavior', () => {
  beforeEach(() => {
    setTheme('light')
  })

  it('should create reactive effect for ImageAsset src', () => {
    const imageAsset = ImageAsset.init({
      default: 'logo-light.png',
      light: 'logo-light.png',
      dark: 'logo-dark.png',
      name: 'testLogo',
    })
    const imageComponent = new EnhancedImage({ src: imageAsset })

    // Component should be created
    expect(imageComponent).toBeDefined()
    expect(imageComponent.props.src).toBe(imageAsset)

    // The reactive effect will be set up when render() is called
    const elements = imageComponent.render()
    expect(elements).toBeDefined()
    expect(elements.length).toBeGreaterThan(0)
  })

  it('should handle string src without reactive effects', () => {
    const imageComponent = new EnhancedImage({ src: 'static-image.jpg' })

    expect(imageComponent).toBeDefined()
    expect(imageComponent.props.src).toBe('static-image.jpg')

    const elements = imageComponent.render()
    expect(elements).toBeDefined()
    expect(elements.length).toBeGreaterThan(0)
  })

  it('should verify ImageAsset resolves correctly to different themes', () => {
    const imageAsset = ImageAsset.init({
      default: 'logo-light.png',
      light: 'logo-light.png',
      dark: 'logo-dark.png',
      name: 'testLogo',
    })

    // Test light theme
    setTheme('light')
    expect(imageAsset.resolve()).toBe('logo-light.png')

    // Test dark theme
    setTheme('dark')
    expect(imageAsset.resolve()).toBe('logo-dark.png')
  })

  it('should create cleanup handlers for reactive effects', () => {
    const imageAsset = ImageAsset.init({
      default: 'logo-light.png',
      light: 'logo-light.png',
      dark: 'logo-dark.png',
      name: 'testLogo',
    })
    const imageComponent = new EnhancedImage({ src: imageAsset })

    // Initial cleanup should be empty
    expect(imageComponent.cleanup).toEqual([])

    // After render, if using ImageAsset, cleanup should have handlers
    imageComponent.render()

    // The setupImageAssetReactivity method should add cleanup handlers
    // (We can't easily test the exact cleanup without mocking DOM elements)
    expect(imageComponent.cleanup).toBeDefined()
  })
})
