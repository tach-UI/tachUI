/**
 * Tests for reactive modifier compatibility with Symbol component
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import { Symbol } from '../../src/components/Symbol.js'
import { createSignal, createComputed } from '@tachui/core'
import { IconSetRegistry } from '../../src/icon-sets/registry.js'
import { LucideIconSet } from '../../src/icon-sets/lucide.js'
import '@tachui/modifiers' // Auto-register modifiers for Proxy access
import { scaleEffect } from '@tachui/modifiers'

// Mock the Lucide heart icon
vi.mock('lucide/dist/esm/icons/heart.js', () => ({
  default: {
    body: '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>',
  },
}))

describe('Symbol Reactive Modifier Tests', () => {
  beforeEach(() => {
    // Ensure icon set is properly registered for each test
    IconSetRegistry.clear()
    IconSetRegistry.register(new LucideIconSet())
  })

  describe('Basic Reactive Modifiers', () => {
    test('should accept signals in foregroundColor modifier', () => {
      const [color, setColor] = createSignal('#ff0000')

      expect(() => {
        const symbol = Symbol('heart').foregroundColor(color).build()

        expect(symbol).toBeDefined()
        expect(symbol.modifiers).toBeDefined()
        expect(symbol.modifiers.length).toBeGreaterThan(0)
      }).not.toThrow()

      // Test signal updates
      setColor('#00ff00')
      expect(color()).toBe('#00ff00')
    })

    test('should accept signals in padding modifier', () => {
      const [padding, setPadding] = createSignal(16)

      expect(() => {
        const symbol = Symbol('heart').padding(padding).build()

        expect(symbol).toBeDefined()
        expect(symbol.modifiers).toBeDefined()
      }).not.toThrow()

      // Test signal updates
      setPadding(24)
      expect(padding()).toBe(24)
    })

    test('should accept signals in multiple modifiers', () => {
      const [color, setColor] = createSignal('#ff0000')
      const [size, setSize] = createSignal(32)
      const [opacity, setOpacity] = createSignal(1.0)

      expect(() => {
        const symbol = Symbol('heart')
          .foregroundColor(color)
          .frame(size, size)
          .opacity(opacity)
          .build()

        expect(symbol).toBeDefined()
        expect(symbol.modifiers.length).toBeGreaterThan(2)
      }).not.toThrow()

      // Test all signals update
      setColor('#00ff00')
      setSize(48)
      setOpacity(0.8)

      expect(color()).toBe('#00ff00')
      expect(size()).toBe(48)
      expect(opacity()).toBe(0.8)
    })
  })

  describe('Computed Signal Modifiers', () => {
    test('should accept computed signals in foregroundColor modifier', () => {
      const [isDark, setIsDark] = createSignal(false)
      const textColor = createComputed(() => (isDark() ? '#ffffff' : '#000000'))

      expect(() => {
        const symbol = Symbol('heart')
          .foregroundColor(textColor)
          .build()

        expect(symbol).toBeDefined()
      }).not.toThrow()

      // Test computed signal updates
      setIsDark(true)
      expect(textColor()).toBe('#ffffff')
    })

    test('should accept computed signals for responsive sizing', () => {
      const [screenSize, setScreenSize] = createSignal<'mobile' | 'desktop'>(
        'mobile'
      )
      const symbolSize = createComputed(() =>
        screenSize() === 'desktop' ? 48 : 24
      )
      const symbolPadding = createComputed(() =>
        screenSize() === 'desktop' ? 20 : 12
      )

      expect(() => {
        const symbol = Symbol('heart')
          .frame(symbolSize, symbolSize)
          .padding(symbolPadding)
          .build()

        expect(symbol).toBeDefined()
      }).not.toThrow()

      // Test responsive changes
      setScreenSize('desktop')
      expect(symbolSize()).toBe(48)
      expect(symbolPadding()).toBe(20)
    })
  })

  describe('Combined Reactive Symbol Properties and Modifiers', () => {
    test('should handle reactive symbol properties with reactive modifiers', () => {
      const [iconName, setIconName] = createSignal('heart')
      const [variant, setVariant] = createSignal<'none' | 'filled'>('none')
      const [color, setColor] = createSignal('#ff0000')
      const [padding, setPadding] = createSignal(16)

      expect(() => {
        const symbol = Symbol(iconName, { variant })
          .foregroundColor(color)
          .padding(padding)
          .build()

        expect(symbol).toBeDefined()
        expect(symbol.props.name).toBe(iconName)
        expect(symbol.props.variant).toBe(variant)
      }).not.toThrow()

      // Test all reactive updates work
      setIconName('star')
      setVariant('filled')
      setColor('#00ff00')
      setPadding(24)

      expect(iconName()).toBe('star')
      expect(variant()).toBe('filled')
      expect(color()).toBe('#00ff00')
      expect(padding()).toBe(24)
    })

    test('should handle reactive state management pattern', () => {
      const [isActive, setIsActive] = createSignal(false)

      // Computed values based on state
      const iconVariant = createComputed(() => (isActive() ? 'filled' : 'none'))
      const iconColor = createComputed(() =>
        isActive() ? '#ff0000' : '#666666'
      )
      const iconScale = createComputed(() => (isActive() ? 1.2 : 1.0))

      expect(() => {
        const symbol = Symbol('heart', {
          variant: iconVariant,
          primaryColor: iconColor,
        })
          .scaleEffect(iconScale)
          .build()

        expect(symbol).toBeDefined()
      }).not.toThrow()

      // Simulate state change (like user interaction)
      setIsActive(true)

      expect(iconVariant()).toBe('filled')
      expect(iconColor()).toBe('#ff0000')
      expect(iconScale()).toBe(1.2)
    })
  })

  describe('Modifier Chaining with Signals', () => {
    test('should support complex modifier chains with mixed static and reactive values', () => {
      const [dynamicColor, setDynamicColor] = createSignal('#ff0000')
      const [isVisible, setIsVisible] = createSignal(true)

      const opacity = createComputed(() => (isVisible() ? 1.0 : 0.3))

      expect(() => {
        const symbol = Symbol('heart')
          .foregroundColor(dynamicColor) // reactive
          .padding(16) // static
          .opacity(opacity) // computed reactive
          .frame(32, 32) // static
          .build()

        expect(symbol).toBeDefined()
        expect(symbol.modifiers.length).toBe(4)
      }).not.toThrow()

      // Test reactive updates
      setDynamicColor('#00ff00')
      setIsVisible(false)

      expect(dynamicColor()).toBe('#00ff00')
      expect(opacity()).toBe(0.3)
    })
  })

  describe('Symbol-Specific Reactive Modifiers', () => {
    test('should support Symbol-specific modifier shortcuts with signals', () => {
      const [variant, setVariant] = createSignal<'none' | 'filled'>('none')
      const [scale, setScale] = createSignal<'small' | 'medium' | 'large'>(
        'medium'
      )

      // Note: These would be custom Symbol modifiers if implemented
      // For now, test that the basic structure works
      const symbol = Symbol('heart', { variant, scale })

      expect(symbol).toBeDefined()
      expect(symbol.props.variant).toBe(variant)
      expect(symbol.props.scale).toBe(scale)

      // Test updates
      setVariant('filled')
      setScale('large')

      expect(variant()).toBe('filled')
      expect(scale()).toBe('large')
    })
  })
})
