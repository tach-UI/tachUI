/**
 * Button Component - States Integration Tests
 * Tests for button state management, style computation, and asset integration
 */

import { describe, expect, it, beforeEach } from 'vitest'
import { EnhancedButton } from '../../src/controls/Button'
import { ColorAsset } from '@tachui/core'
import { createSignal } from '@tachui/core'

describe('Button States Integration', () => {
  let button: EnhancedButton

  beforeEach(() => {
    button = new EnhancedButton({
      title: 'Test Button',
      variant: 'filled',
    })
  })

  describe('State Signal Management', () => {
    it('should initialize with normal state', () => {
      expect(button.stateSignal()).toBe('normal')
    })

    it('should allow state transitions', () => {
      // Test manual state changes (simulating what DOM events would do)
      button['setState']('pressed')
      expect(button.stateSignal()).toBe('pressed')

      button['setState']('normal')
      expect(button.stateSignal()).toBe('normal')

      button['setState']('focused')
      expect(button.stateSignal()).toBe('focused')
    })

    it('should have unique button IDs', () => {
      const button1 = new EnhancedButton({ title: 'Button 1' })
      const button2 = new EnhancedButton({ title: 'Button 2' })

      expect(button1.id).not.toBe(button2.id)
      expect(button1.id).toMatch(/^button-\d+-[a-z0-9]+$/)
    })
  })

  describe('Style Computation with States', () => {
    it('should compute different styles for different states', () => {
      // Normal state
      button['setState']('normal')
      const normalStyles = button.getButtonStyles()

      // Pressed state
      button['setState']('pressed')
      const pressedStyles = button.getButtonStyles()

      // Focused state
      button['setState']('focused')
      const focusedStyles = button.getButtonStyles()

      // States should produce different styles
      expect(normalStyles.transform).toBe('none') // Normal state should explicitly clear transforms
      expect(pressedStyles.transform).toBe('scale(0.95)')
      expect(focusedStyles.boxShadow).toContain('#007AFF40')
      expect(normalStyles.boxShadow).toBe('none')
    })

    it('should apply disabled styles correctly', () => {
      const disabledButton = new EnhancedButton({
        title: 'Disabled Button',
        isEnabled: false,
      })

      const styles = disabledButton.getButtonStyles()

      expect(styles.opacity).toBe('0.6')
      expect(styles.pointerEvents).toBe('none')
    })

    it('should apply loading styles correctly', () => {
      const loadingButton = new EnhancedButton({
        title: 'Loading Button',
        isLoading: true,
      })

      const styles = loadingButton.getButtonStyles()

      expect(styles.opacity).toBe('0.6')
      expect(styles.pointerEvents).toBe('none')
    })

    it('should handle state precedence correctly', () => {
      // Disabled should override state
      const disabledButton = new EnhancedButton({
        title: 'Disabled Button',
        isEnabled: false,
      })

      disabledButton['setState']('pressed')
      const styles = disabledButton.getButtonStyles()

      // Should still be disabled styles, not pressed
      expect(styles.opacity).toBe('0.6')
      expect(styles.pointerEvents).toBe('none')
    })
  })

  describe('Asset Integration with States', () => {
    it('should resolve ColorAsset tint colors correctly', () => {
      const tintAsset = ColorAsset.init({
        default: '#FF0000',
        light: '#FF0000',
        dark: '#FF4444',
        name: 'tintAsset',
      })

      const assetButton = new EnhancedButton({
        title: 'Asset Button',
        tint: tintAsset,
        variant: 'filled',
      })

      const styles = assetButton.getButtonStyles()
      expect(styles.backgroundColor).toBe('#FF0000') // Should use resolved tint
    })

    it('should resolve ColorAsset background colors correctly', () => {
      const bgAsset = ColorAsset.init({
        default: '#000000',
        light: '#000000',
        dark: '#111111',
        name: 'bgAsset',
      })

      const assetButton = new EnhancedButton({
        title: 'Asset Button',
        backgroundColor: bgAsset,
        variant: 'plain', // Plain to not override with variant background
      })

      const styles = assetButton.getButtonStyles()
      expect(styles.backgroundColor).toBe('#000000')
    })

    it('should resolve ColorAsset foreground colors correctly', () => {
      const fgAsset = ColorAsset.init({
        default: '#FFFFFF',
        light: '#FFFFFF',
        dark: '#EEEEEE',
        name: 'fgAsset',
      })

      const assetButton = new EnhancedButton({
        title: 'Asset Button',
        foregroundColor: fgAsset,
      })

      const styles = assetButton.getButtonStyles()
      expect(styles.color).toBe('#FFFFFF')
    })

    it('should handle reactive signal colors', () => {
      const [colorSignal, setColor] = createSignal('#00FF00')

      const signalButton = new EnhancedButton({
        title: 'Signal Button',
        tint: colorSignal,
        variant: 'filled',
      })

      let styles = signalButton.getButtonStyles()
      expect(styles.backgroundColor).toBe('#00FF00')

      // Change signal value
      setColor('#0000FF')
      styles = signalButton.getButtonStyles()
      expect(styles.backgroundColor).toBe('#0000FF')
    })

    it('should darken colors in pressed state', () => {
      const button = new EnhancedButton({
        title: 'Test Button',
        variant: 'filled',
      })

      // Normal state
      button['setState']('normal')
      const normalStyles = button.getButtonStyles()
      const normalBg = normalStyles.backgroundColor

      // Pressed state
      button['setState']('pressed')
      const pressedStyles = button.getButtonStyles()
      const pressedBg = pressedStyles.backgroundColor

      // Pressed background should be different (darkened)
      expect(pressedBg).not.toBe(normalBg)
    })
  })

  describe('Color Resolution Utilities', () => {
    it('should resolve string colors', () => {
      const resolved = button['resolveColorValue']('#123456')
      expect(resolved).toBe('#123456')
    })

    it('should resolve signal colors', () => {
      const [colorSignal] = createSignal('#ABCDEF')
      const resolved = button['resolveColorValue'](colorSignal)
      expect(resolved).toBe('#ABCDEF')
    })

    it('should resolve ColorAsset colors', () => {
      const asset = ColorAsset.init({
        default: '#654321',
        name: 'testAsset',
      })
      const resolved = button['resolveColorValue'](asset)
      expect(resolved).toBe('#654321')
    })

    it('should return undefined for invalid values', () => {
      expect(button['resolveColorValue'](undefined)).toBeUndefined()
      expect(button['resolveColorValue'](null as any)).toBeUndefined()
    })
  })

  describe('CSS Property Conversion', () => {
    it('should convert camelCase to kebab-case correctly', () => {
      const conversions = [
        ['backgroundColor', 'background-color'],
        ['borderColor', 'border-color'],
        ['borderWidth', 'border-width'],
        ['fontSize', 'font-size'],
        ['fontWeight', 'font-weight'],
        ['minHeight', 'min-height'],
        ['borderRadius', 'border-radius'],
        ['boxShadow', 'box-shadow'],
        ['pointerEvents', 'pointer-events'],
      ]

      conversions.forEach(([camelCase, kebabCase]) => {
        expect(button['camelToKebabCase'](camelCase)).toBe(kebabCase)
      })
    })

    it('should handle single word properties', () => {
      expect(button['camelToKebabCase']('color')).toBe('color')
      expect(button['camelToKebabCase']('opacity')).toBe('opacity')
      expect(button['camelToKebabCase']('transform')).toBe('transform')
    })
  })

  describe('Button Variants with Assets', () => {
    it('should combine variant styles with asset colors', () => {
      const customTint = ColorAsset.init({
        default: '#FF00FF',
        name: 'customTint',
      })

      const button = new EnhancedButton({
        title: 'Test',
        tint: customTint,
        variant: 'outlined',
      })

      const styles = button.getButtonStyles()
      expect(styles.borderColor).toBe('#FF00FF') // Tint color for border
      expect(styles.color).toBe('#FF00FF') // Tint color for text
      expect(styles.borderWidth).toBe('1px') // From outlined variant
    })

    it('should prioritize custom colors over variant defaults', () => {
      const customBg = ColorAsset.init({
        default: '#123456',
        name: 'customBg',
      })

      const button = new EnhancedButton({
        title: 'Test',
        backgroundColor: customBg,
        variant: 'filled', // Would normally set its own background
      })

      const styles = button.getButtonStyles()
      expect(styles.backgroundColor).toBe('#123456') // Custom should override variant
    })
  })

  describe('Theme Integration', () => {
    it('should handle theme changes with ColorAssets', () => {
      const themeAsset = ColorAsset.init({
        default: '#FF0000',
        light: '#FF0000',
        dark: '#FF4444',
        name: 'themeAsset',
      })

      const button = new EnhancedButton({
        title: 'Theme Button',
        tint: themeAsset,
        variant: 'filled',
      })

      // Mock light theme
      const originalGetCurrentTheme = (ColorAsset as any).getCurrentTheme
      ;(ColorAsset as any).getCurrentTheme = () => 'light'

      let styles = button.getButtonStyles()
      const lightColor = styles.backgroundColor

      // Mock dark theme
      ;(ColorAsset as any).getCurrentTheme = () => 'dark'

      styles = button.getButtonStyles()
      const darkColor = styles.backgroundColor

      // Should resolve to different colors
      expect(lightColor).toBe('#FF0000')
      expect(darkColor).toBe('#FF4444')

      // Restore original function
      ;(ColorAsset as any).getCurrentTheme = originalGetCurrentTheme
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing action gracefully', () => {
      const button = new EnhancedButton({
        title: 'No Action Button',
        // No action provided
      })

      expect(button.props.action).toBeUndefined()
      expect(() => button.getButtonStyles()).not.toThrow()
    })

    it('should handle malformed ColorAssets gracefully', () => {
      const button = new EnhancedButton({
        title: 'Test',
      })

      // Test with malformed inputs
      expect(() => button['resolveColorValue']({} as any)).not.toThrow()
      expect(button['resolveColorValue']({} as any)).toBeUndefined()
    })

    it('should handle extreme state changes', () => {
      // Rapid state changes
      button['setState']('pressed')
      button['setState']('focused')
      button['setState']('normal')
      button['setState']('pressed')

      expect(button.stateSignal()).toBe('pressed')
      expect(() => button.getButtonStyles()).not.toThrow()
    })
  })
})
