/**
 * Button Component - Asset Integration Tests
 * Tests for ColorAsset integration and theme-reactive button styling
 */

import { describe, expect, it, beforeEach } from 'vitest'
import { EnhancedButton } from '../../src/components/Button'
import { ColorAsset } from '../../src/assets/ColorAsset'
import { createSignal } from '../../src/reactive'

describe('Button Asset Integration', () => {
  let testColorAsset: ColorAsset
  let brandColorAsset: ColorAsset

  beforeEach(() => {
    // Create test color assets
    testColorAsset = ColorAsset.init({
      default: '#FF0000',
      light: '#FF0000',
      dark: '#FF4444',
      name: 'testColor'
    })

    brandColorAsset = ColorAsset.init({
      default: '#007AFF',
      light: '#007AFF',
      dark: '#0A84FF',
      name: 'brandColor'
    })
  })

  describe('ColorAsset Integration', () => {
    it('should accept ColorAsset as tint color', () => {
      const button = new EnhancedButton({
        title: 'Test Button',
        tint: testColorAsset
      })

      expect(button.props.tint).toBe(testColorAsset)
    })

    it('should resolve ColorAsset tint color correctly', () => {
      const button = new EnhancedButton({
        title: 'Test Button',
        tint: testColorAsset
      })

      const resolvedColor = button['resolveColorValue'](button.props.tint)
      expect(resolvedColor).toBe('#FF0000') // Should resolve to default
    })

    it('should accept ColorAsset as background color', () => {
      const button = new EnhancedButton({
        title: 'Test Button',
        backgroundColor: testColorAsset
      })

      expect(button.props.backgroundColor).toBe(testColorAsset)
    })

    it('should accept ColorAsset as foreground color', () => {
      const button = new EnhancedButton({
        title: 'Test Button',
        foregroundColor: testColorAsset
      })

      expect(button.props.foregroundColor).toBe(testColorAsset)
    })

    it('should resolve multiple ColorAsset properties', () => {
      const bgAsset = ColorAsset.init({
        default: '#000000',
        light: '#000000',
        dark: '#111111',
        name: 'bg'
      })

      const fgAsset = ColorAsset.init({
        default: '#FFFFFF',
        light: '#FFFFFF',
        dark: '#EEEEEE',
        name: 'fg'
      })

      const button = new EnhancedButton({
        title: 'Test Button',
        backgroundColor: bgAsset,
        foregroundColor: fgAsset,
        tint: testColorAsset
      })

      expect(button['resolveColorValue'](button.props.backgroundColor)).toBe('#000000')
      expect(button['resolveColorValue'](button.props.foregroundColor)).toBe('#FFFFFF')
      expect(button['resolveColorValue'](button.props.tint)).toBe('#FF0000')
    })
  })

  describe('Reactive Asset Updates', () => {
    it('should handle signal tint colors alongside ColorAssets', () => {
      const [colorSignal, setColorSignal] = createSignal('#00FF00')
      
      const button = new EnhancedButton({
        title: 'Test Button',
        tint: colorSignal
      })

      expect(button['resolveColorValue'](button.props.tint)).toBe('#00FF00')
      
      setColorSignal('#FF00FF')
      expect(button['resolveColorValue'](button.props.tint)).toBe('#FF00FF')
    })

    it('should resolve ColorAsset values in getButtonStyles', () => {
      const button = new EnhancedButton({
        title: 'Test Button',
        tint: testColorAsset,
        variant: 'filled'
      })

      const styles = button.getButtonStyles()
      expect(styles.backgroundColor).toBe('#FF0000') // Tint color for filled variant
    })

    it('should apply custom background color from asset', () => {
      const button = new EnhancedButton({
        title: 'Test Button',
        backgroundColor: testColorAsset,
        variant: 'plain'
      })

      const styles = button.getButtonStyles()
      expect(styles.backgroundColor).toBe('#FF0000') // Custom background overrides variant
    })

    it('should apply custom foreground color from asset', () => {
      const button = new EnhancedButton({
        title: 'Test Button',
        foregroundColor: testColorAsset,
        variant: 'plain'
      })

      const styles = button.getButtonStyles()
      expect(styles.color).toBe('#FF0000') // Custom foreground color
    })
  })


  describe('Color Resolution Method', () => {
    it('should resolve string colors', () => {
      const button = new EnhancedButton({ title: 'Test' })
      expect(button['resolveColorValue']('#FF0000')).toBe('#FF0000')
    })

    it('should resolve signal colors', () => {
      const [colorSignal] = createSignal('#00FF00')
      const button = new EnhancedButton({ title: 'Test' })
      expect(button['resolveColorValue'](colorSignal)).toBe('#00FF00')
    })

    it('should resolve ColorAsset colors', () => {
      const button = new EnhancedButton({ title: 'Test' })
      expect(button['resolveColorValue'](testColorAsset)).toBe('#FF0000')
    })

    it('should return undefined for invalid values', () => {
      const button = new EnhancedButton({ title: 'Test' })
      expect(button['resolveColorValue'](undefined)).toBeUndefined()
      expect(button['resolveColorValue'](null as any)).toBeUndefined()
    })
  })

  describe('Theme Integration', () => {
    it('should use theme-appropriate colors from assets', () => {
      // Mock different theme
      const originalGetCurrentTheme = (ColorAsset as any).getCurrentTheme
      ;(ColorAsset as any).getCurrentTheme = () => 'dark'

      const button = new EnhancedButton({
        title: 'Test Button',
        tint: testColorAsset
      })

      const resolvedColor = button['resolveColorValue'](button.props.tint)
      expect(resolvedColor).toBe('#FF4444') // Dark theme color

      // Restore original function
      ;(ColorAsset as any).getCurrentTheme = originalGetCurrentTheme
    })

    it('should integrate with button styling system', () => {
      const button = new EnhancedButton({
        title: 'Test Button',
        tint: testColorAsset,
        backgroundColor: brandColorAsset,
        variant: 'outlined'
      })

      const styles = button.getButtonStyles()
      expect(styles.borderColor).toBe('#FF0000') // Tint from testColorAsset
      expect(styles.backgroundColor).toBe('#007AFF') // Background from brandColorAsset
    })
  })
})