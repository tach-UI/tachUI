/**
 * Tests for Symbol integration with TachUI modifier system
 * Verifies that modifiers are properly applied and stored
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import { Symbol } from '../../src/components/Symbol.js'
import { createSignal } from '@tachui/core'
import { IconSetRegistry } from '../../src/icon-sets/registry.js'
import { LucideIconSet } from '../../src/icon-sets/lucide.js'
import { scaleEffect } from '@tachui/modifiers'

// Mock the Lucide heart icon
vi.mock('lucide/dist/esm/icons/heart.js', () => ({
  default: {
    body: '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>',
  },
}))

describe('Symbol Modifier Integration', () => {
  beforeEach(() => {
    // Ensure icon set is properly registered for each test
    IconSetRegistry.clear()
    IconSetRegistry.register(new LucideIconSet())
  })

  describe('Modifier Storage and Application', () => {
    test('should store applied modifiers in component', () => {
      const symbol = Symbol('heart')
        .modifier.padding(16)
        .foregroundColor('#ff0000')
        .build()

      expect(symbol.modifiers).toBeDefined()
      expect(Array.isArray(symbol.modifiers)).toBe(true)
      expect(symbol.modifiers.length).toBeGreaterThan(0)

      // Check that modifiers have the expected structure
      symbol.modifiers.forEach(modifier => {
        expect(modifier).toHaveProperty('type')
        expect(modifier).toHaveProperty('priority')
        expect(modifier).toHaveProperty('apply')
        expect(typeof modifier.apply).toBe('function')
      })
    })

    test('should preserve modifier order based on priority', () => {
      const symbol = Symbol('heart')
        .modifier.padding(16) // Layout modifier
        .foregroundColor('#ff0000') // Appearance modifier
        .opacity(0.8) // Appearance modifier
        .build()

      expect(symbol.modifiers.length).toBeGreaterThan(2)

      // Modifiers should be sorted by priority
      for (let i = 1; i < symbol.modifiers.length; i++) {
        expect(symbol.modifiers[i].priority).toBeGreaterThanOrEqual(
          symbol.modifiers[i - 1].priority
        )
      }
    })

    test('should handle complex modifier combinations', () => {
      const [color, setColor] = createSignal('#ff0000')
      const [padding, setPadding] = createSignal(16)

      const symbol = Symbol('heart')
        .modifier.foregroundColor(color)
        .padding(padding)
        .frame(32, 32)
        .opacity(0.9)
        .build()

      expect(symbol.modifiers.length).toBe(4)

      // Test that all modifier types are present
      const modifierTypes = symbol.modifiers.map(m => m.type)
      expect(modifierTypes).toContain('appearance')
      expect(modifierTypes).toContain('layout')
    })
  })

  describe('ModifiableComponent Interface', () => {
    test('should implement ModifiableComponent interface correctly', () => {
      const symbol = Symbol('heart')

      // Test that Symbol returns a ModifiableComponent
      expect(symbol).toHaveProperty('type')
      expect(symbol).toHaveProperty('id')
      expect(symbol).toHaveProperty('props')
      expect(symbol).toHaveProperty('modifiers')
      expect(symbol).toHaveProperty('modifier')
      expect(symbol).toHaveProperty('render')

      // Test modifier builder interface
      expect(symbol.modifier).toHaveProperty('build')
      expect(typeof symbol.modifier.build).toBe('function')
      expect(typeof symbol.modifier.padding).toBe('function')
      expect(typeof symbol.modifier.foregroundColor).toBe('function')
    })

    test('should maintain component identity after modifier application', () => {
      const originalSymbol = Symbol('heart')
      const modifiedSymbol = originalSymbol.modifier.padding(16).build()

      // Original component properties should be preserved
      expect(modifiedSymbol.props.name).toBe(originalSymbol.props.name)
      expect(modifiedSymbol.type).toBe(originalSymbol.type)

      // But should have additional modifiers
      expect(modifiedSymbol.modifiers.length).toBeGreaterThan(
        originalSymbol.modifiers.length
      )
    })
  })

  describe('Reactive Modifier Updates', () => {
    test('should handle modifier value changes through signals', () => {
      const [color, setColor] = createSignal('#ff0000')
      const [opacity, setOpacity] = createSignal(1.0)

      const symbol = Symbol('heart')
        .modifier.foregroundColor(color)
        .opacity(opacity)
        .build()

      // Initial values
      expect(color()).toBe('#ff0000')
      expect(opacity()).toBe(1.0)

      // Update signals
      setColor('#00ff00')
      setOpacity(0.5)

      // Signals should update (modifier system will handle DOM updates)
      expect(color()).toBe('#00ff00')
      expect(opacity()).toBe(0.5)

      // Modifiers should still be present
      expect(symbol.modifiers.length).toBe(2)
    })

    test('should work with computed signals for dynamic styling', () => {
      const [isActive, setIsActive] = createSignal(false)
      const [isHovered, setIsHovered] = createSignal(false)

      // Computed styling based on state
      const color = () => {
        if (isActive() && isHovered()) return '#ff0000'
        if (isActive()) return '#ff6666'
        if (isHovered()) return '#666666'
        return '#999999'
      }

      const scale = () => {
        if (isHovered()) return 1.1
        if (isActive()) return 1.05
        return 1.0
      }

      const symbol = Symbol('heart')
        .modifier.foregroundColor(color)
        .scaleEffect(scale)
        .build()

      // Test different state combinations
      expect(color()).toBe('#999999')
      expect(scale()).toBe(1.0)

      setIsActive(true)
      expect(color()).toBe('#ff6666')
      expect(scale()).toBe(1.05)

      setIsHovered(true)
      expect(color()).toBe('#ff0000')
      expect(scale()).toBe(1.1)

      setIsActive(false)
      expect(color()).toBe('#666666')
      expect(scale()).toBe(1.1)
    })
  })

  describe('Symbol-Specific Properties with Modifiers', () => {
    test('should combine Symbol properties with TachUI modifiers', () => {
      const [variant, setVariant] = createSignal<'none' | 'filled'>('none')
      const [color, setColor] = createSignal('#ff0000')

      const symbol = Symbol('heart', {
        variant,
        scale: 'large',
        effect: 'pulse',
      })
        .modifier.foregroundColor(color)
        .padding(16)
        .build()

      // Symbol-specific properties
      expect(symbol.props.variant).toBe(variant)
      expect(symbol.props.scale).toBe('large')
      expect(symbol.props.effect).toBe('pulse')

      // TachUI modifiers
      expect(symbol.modifiers.length).toBeGreaterThan(0)

      // Test updates work for both
      setVariant('filled')
      setColor('#00ff00')

      expect(variant()).toBe('filled')
      expect(color()).toBe('#00ff00')
    })
  })
})
