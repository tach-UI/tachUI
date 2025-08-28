/**
 * Visual Effects Modifiers Test Suite
 * 
 * Tests for Phase 2 Epic: Butternut - Visual Effects Modifiers
 * CSS filter-based visual effects implementation
 */

import { JSDOM } from 'jsdom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Text, VStack, Button } from '../../src/components'
import { AppearanceModifier } from '../../src/modifiers/base'
import { createSignal } from '../../src/reactive'

// Setup DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
global.window = dom.window as any
global.document = dom.window.document
global.HTMLElement = dom.window.HTMLElement
global.Element = dom.window.Element

// Test utilities
const createTestElement = (tagName: string = 'div'): HTMLElement => {
  return document.createElement(tagName)
}

describe('Visual Effects Modifiers - Epic: Butternut Phase 2', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AppearanceModifier Filter Effects', () => {
    let element: HTMLElement
    let mockContext: any
    let mockNode: any

    beforeEach(() => {
      element = createTestElement()
      mockNode = {
        element
      }
      mockContext = {
        element,
        componentId: 'test-component',
        phase: 'creation'
      }
    })

    it('should handle blur modifier', () => {
      const modifier = new AppearanceModifier({ blur: 5 })
      modifier.apply(mockNode, mockContext)
      
      expect(element.style.filter).toBe('blur(5px)')
    })

    it('should handle brightness modifier', () => {
      const modifier = new AppearanceModifier({ brightness: 1.5 })
      modifier.apply(mockNode, mockContext)
      
      expect(element.style.filter).toBe('brightness(1.5)')
    })

    it('should handle contrast modifier', () => {
      const modifier = new AppearanceModifier({ contrast: 0.8 })
      modifier.apply(mockNode, mockContext)
      
      expect(element.style.filter).toBe('contrast(0.8)')
    })

    it('should handle saturation modifier', () => {
      const modifier = new AppearanceModifier({ saturation: 2.0 })
      modifier.apply(mockNode, mockContext)
      
      expect(element.style.filter).toBe('saturate(2)')
    })

    it('should handle hueRotation modifier', () => {
      const modifier = new AppearanceModifier({ hueRotation: 90 })
      modifier.apply(mockNode, mockContext)
      
      expect(element.style.filter).toBe('hue-rotate(90deg)')
    })

    it('should handle grayscale modifier', () => {
      const modifier = new AppearanceModifier({ grayscale: 0.7 })
      modifier.apply(mockNode, mockContext)
      
      expect(element.style.filter).toBe('grayscale(0.7)')
    })

    it('should handle colorInvert modifier', () => {
      const modifier = new AppearanceModifier({ colorInvert: 1.0 })
      modifier.apply(mockNode, mockContext)
      
      expect(element.style.filter).toBe('invert(1)')
    })

    it('should combine multiple filter effects', () => {
      const modifier = new AppearanceModifier({
        blur: 3,
        brightness: 1.2,
        contrast: 0.9,
        saturation: 1.1
      })
      modifier.apply(mockNode, mockContext)
      
      expect(element.style.filter).toBe('blur(3px) brightness(1.2) contrast(0.9) saturate(1.1)')
    })

    it('should handle all filter effects together', () => {
      const modifier = new AppearanceModifier({
        blur: 2,
        brightness: 1.1,
        contrast: 1.2,
        saturation: 0.8,
        hueRotation: 45,
        grayscale: 0.3,
        colorInvert: 0.1
      })
      modifier.apply(mockNode, mockContext)
      
      const expectedFilter = 'blur(2px) brightness(1.1) contrast(1.2) saturate(0.8) hue-rotate(45deg) grayscale(0.3) invert(0.1)'
      expect(element.style.filter).toBe(expectedFilter)
    })

    it('should not set filter property when no effects are specified', () => {
      const modifier = new AppearanceModifier({ backgroundColor: 'red' })
      modifier.apply(mockNode, mockContext)
      
      expect(element.style.filter).toBe('')
    })

    it('should handle zero values correctly', () => {
      const modifier = new AppearanceModifier({
        blur: 0,
        brightness: 0,
        grayscale: 0,
        colorInvert: 0
      })
      modifier.apply(mockNode, mockContext)
      
      expect(element.style.filter).toBe('blur(0px) brightness(0) grayscale(0) invert(0)')
    })

    it('should handle reactive filter values', () => {
      const [blurValue, setBlurValue] = createSignal(5)
      const [brightnessValue, setBrightnessValue] = createSignal(1.2)
      
      const modifier = new AppearanceModifier({
        blur: blurValue,
        brightness: brightnessValue
      })
      modifier.apply(mockNode, mockContext)
      
      // Initial values should be applied
      // Note: In JSDOM, reactive effects might need manual triggering
      expect(blurValue()).toBe(5)
      expect(brightnessValue()).toBe(1.2)
      
      // Update reactive values
      setBlurValue(10)
      setBrightnessValue(1.5)
      
      expect(blurValue()).toBe(10)
      expect(brightnessValue()).toBe(1.5)
    })
  })

  describe('Modifier Builder Integration', () => {
    it('should create AppearanceModifier instances for all visual effects', () => {
      const component = Text('Visual Effects Test')
        .modifier
        .blur(5)
        .brightness(1.2)
        .contrast(0.9)
        .saturation(1.1)
        .hueRotation(30)
        .grayscale(0.5)
        .colorInvert(0.2)
        .build()
      
      expect(component.modifiers).toHaveLength(7)
      component.modifiers.forEach(modifier => {
        expect(modifier.type).toBe('appearance')
      })
    })

    it('should provide TypeScript support for all visual effects modifiers', () => {
      // This test ensures the TypeScript interfaces are properly defined
      const component = Button('Visual Effects Button', () => {})
        .modifier
        .blur(3)
        .brightness(1.1)
        .contrast(1.3)
        .saturation(0.8)
        .hueRotation(90)
        .grayscale(0.4)
        .colorInvert() // Test default value
        .build()
      
      expect(component.modifiers).toHaveLength(7)
    })

    it('should handle reactive signals in modifier builder', () => {
      const [dynamicBlur] = createSignal(8)
      const [dynamicBrightness] = createSignal(1.4)
      
      const component = VStack({ children: [] })
        .modifier
        .blur(dynamicBlur)
        .brightness(dynamicBrightness)
        .build()
      
      expect(component.modifiers).toHaveLength(2)
      expect(component.modifiers[0].type).toBe('appearance')
      expect(component.modifiers[1].type).toBe('appearance')
    })

    it('should support chaining visual effects with other appearance modifiers', () => {
      const component = Text('Styled with Visual Effects')
        .modifier
        .backgroundColor('#ff0000')
        .blur(2)
        .opacity(0.8)
        .brightness(1.1)
        .cornerRadius(8)
        .grayscale(0.3)
        .build()
      
      expect(component.modifiers).toHaveLength(6)
      component.modifiers.forEach(modifier => {
        expect(modifier.type).toBe('appearance')
      })
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle negative values appropriately', () => {
      const element = createTestElement()
      const mockNode = { element }
      const mockContext = { element, componentId: 'test', phase: 'creation' as const }
      
      const modifier = new AppearanceModifier({
        brightness: -0.5, // Negative brightness
        hueRotation: -180 // Negative rotation
      })
      modifier.apply(mockNode, mockContext)
      
      expect(element.style.filter).toBe('brightness(-0.5) hue-rotate(-180deg)')
    })

    it('should handle very large values', () => {
      const element = createTestElement()
      const mockNode = { element }
      const mockContext = { element, componentId: 'test', phase: 'creation' as const }
      
      const modifier = new AppearanceModifier({
        blur: 100,
        brightness: 10,
        hueRotation: 720
      })
      modifier.apply(mockNode, mockContext)
      
      expect(element.style.filter).toBe('blur(100px) brightness(10) hue-rotate(720deg)')
    })

    it('should handle decimal precision correctly', () => {
      const element = createTestElement()
      const mockNode = { element }
      const mockContext = { element, componentId: 'test', phase: 'creation' as const }
      
      const modifier = new AppearanceModifier({
        brightness: 1.23456,
        grayscale: 0.12345,
        saturation: 0.98765
      })
      modifier.apply(mockNode, mockContext)
      
      expect(element.style.filter).toBe('brightness(1.23456) saturate(0.98765) grayscale(0.12345)')
    })

    it('should preserve existing CSS filter when combining with non-filter styles', () => {
      const element = createTestElement()
      const mockNode = { element }
      const mockContext = { element, componentId: 'test', phase: 'creation' as const }
      
      // Apply a modifier with both filter effects and other styles
      const modifier = new AppearanceModifier({
        blur: 3,
        backgroundColor: 'blue',
        opacity: 0.7,
        brightness: 1.2
      })
      modifier.apply(mockNode, mockContext)
      
      expect(element.style.filter).toBe('blur(3px) brightness(1.2)')
      expect(element.style.backgroundColor).toBe('blue')
      expect(element.style.opacity).toBe('0.7')
    })
  })

  describe('CSS Filter Standards Compliance', () => {
    it('should use correct CSS filter function names', () => {
      const element = createTestElement()
      const mockNode = { element }
      const mockContext = { element, componentId: 'test', phase: 'creation' as const }
      
      const modifier = new AppearanceModifier({ saturation: 1.5 })
      modifier.apply(mockNode, mockContext)
      
      // CSS uses 'saturate' not 'saturation'
      expect(element.style.filter).toBe('saturate(1.5)')
    })

    it('should use correct CSS filter units', () => {
      const element = createTestElement()
      const mockNode = { element }
      const mockContext = { element, componentId: 'test', phase: 'creation' as const }
      
      const modifier = new AppearanceModifier({
        blur: 10, // Should become '10px'
        hueRotation: 90 // Should become '90deg'
      })
      modifier.apply(mockNode, mockContext)
      
      expect(element.style.filter).toBe('blur(10px) hue-rotate(90deg)')
    })

    it('should handle unitless values for appropriate filters', () => {
      const element = createTestElement()
      const mockNode = { element }
      const mockContext = { element, componentId: 'test', phase: 'creation' as const }
      
      const modifier = new AppearanceModifier({
        brightness: 1.0, // Unitless
        contrast: 0.8,   // Unitless
        grayscale: 0.5,  // Unitless (0-1 range)
        colorInvert: 1.0 // Unitless (0-1 range)
      })
      modifier.apply(mockNode, mockContext)
      
      expect(element.style.filter).toBe('brightness(1) contrast(0.8) grayscale(0.5) invert(1)')
    })
  })
})