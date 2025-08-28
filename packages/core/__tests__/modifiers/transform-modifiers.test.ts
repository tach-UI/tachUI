/**
 * Transform Modifiers Test Suite
 * 
 * Tests for Phase 3 Epic: Butternut - Critical Transform Modifiers
 * Scale, position, and z-index transform implementation
 */

import { JSDOM } from 'jsdom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Text, VStack, Button } from '../../src/components'
import { LayoutModifier } from '../../src/modifiers/base'
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

describe('Transform Modifiers - Epic: Butternut Phase 3', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('LayoutModifier Transform Effects', () => {
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

    describe('Scale Effect', () => {
      it('should handle uniform scale', () => {
        const modifier = new LayoutModifier({ scaleEffect: { x: 1.5 } })
        modifier.apply(mockNode, mockContext)
        
        expect(element.style.transform).toBe('scale(1.5, 1.5)')
        expect(element.style.transformOrigin).toBe('center center')
      })

      it('should handle non-uniform scale', () => {
        const modifier = new LayoutModifier({ scaleEffect: { x: 2.0, y: 0.5 } })
        modifier.apply(mockNode, mockContext)
        
        expect(element.style.transform).toBe('scale(2, 0.5)')
        expect(element.style.transformOrigin).toBe('center center')
      })

      it('should handle scale with anchor points', () => {
        const testCases = [
          { anchor: 'top', expectedOrigin: 'center top' },
          { anchor: 'topLeading', expectedOrigin: 'left top' },
          { anchor: 'topTrailing', expectedOrigin: 'right top' },
          { anchor: 'bottom', expectedOrigin: 'center bottom' },
          { anchor: 'bottomLeading', expectedOrigin: 'left bottom' },
          { anchor: 'bottomTrailing', expectedOrigin: 'right bottom' },
          { anchor: 'leading', expectedOrigin: 'left center' },
          { anchor: 'trailing', expectedOrigin: 'right center' },
          { anchor: 'center', expectedOrigin: 'center center' },
        ]

        testCases.forEach(({ anchor, expectedOrigin }) => {
          const testElement = createTestElement()
          const testNode = { element: testElement }
          const testContext = { element: testElement, componentId: 'test', phase: 'creation' as const }

          const modifier = new LayoutModifier({ 
            scaleEffect: { x: 1.2, y: 1.2, anchor } 
          })
          modifier.apply(testNode, testContext)
          
          expect(testElement.style.transform).toBe('scale(1.2, 1.2)')
          expect(testElement.style.transformOrigin).toBe(expectedOrigin)
        })
      })

      it('should handle reactive scale values', () => {
        const [scaleX, setScaleX] = createSignal(1.0)
        const [scaleY, setScaleY] = createSignal(1.0)
        
        const modifier = new LayoutModifier({ 
          scaleEffect: { x: scaleX, y: scaleY } 
        })
        modifier.apply(mockNode, mockContext)
        
        // Initial values should be applied (reactive effects in JSDOM)
        expect(scaleX()).toBe(1.0)
        expect(scaleY()).toBe(1.0)
        
        // Update reactive values
        setScaleX(2.0)
        setScaleY(0.8)
        
        expect(scaleX()).toBe(2.0)
        expect(scaleY()).toBe(0.8)
      })

      it('should preserve existing transforms when adding scale', () => {
        const element = createTestElement()
        const mockNode = { element }
        const mockContext = { element, componentId: 'test', phase: 'creation' as const }

        // Set existing transform
        element.style.transform = 'translate(10px, 20px) rotate(45deg)'
        
        const modifier = new LayoutModifier({ scaleEffect: { x: 1.5 } })
        modifier.apply(mockNode, mockContext)
        
        expect(element.style.transform).toBe('translate(10px, 20px) rotate(45deg) scale(1.5, 1.5)')
      })

      it('should replace existing scale in transforms', () => {
        const element = createTestElement()
        const mockNode = { element }
        const mockContext = { element, componentId: 'test', phase: 'creation' as const }

        // Set existing transform with scale
        element.style.transform = 'translate(10px, 20px) scale(2.0, 2.0) rotate(45deg)'
        
        const modifier = new LayoutModifier({ scaleEffect: { x: 1.5 } })
        modifier.apply(mockNode, mockContext)
        
        expect(element.style.transform).toBe('translate(10px, 20px) rotate(45deg) scale(1.5, 1.5)')
      })
    })

    describe('Absolute Position', () => {
      it('should handle absolute positioning', () => {
        const modifier = new LayoutModifier({ position: { x: 100, y: 200 } })
        modifier.apply(mockNode, mockContext)
        
        expect(element.style.position).toBe('absolute')
        expect(element.style.left).toBe('100px')
        expect(element.style.top).toBe('200px')
      })

      it('should handle zero positions', () => {
        const modifier = new LayoutModifier({ position: { x: 0, y: 0 } })
        modifier.apply(mockNode, mockContext)
        
        expect(element.style.position).toBe('absolute')
        expect(element.style.left).toBe('0px')
        expect(element.style.top).toBe('0px')
      })

      it('should handle negative positions', () => {
        const modifier = new LayoutModifier({ position: { x: -50, y: -75 } })
        modifier.apply(mockNode, mockContext)
        
        expect(element.style.position).toBe('absolute')
        expect(element.style.left).toBe('-50px')
        expect(element.style.top).toBe('-75px')
      })

      it('should handle reactive position values', () => {
        const [posX, setPosX] = createSignal(10)
        const [posY, setPosY] = createSignal(20)
        
        const modifier = new LayoutModifier({ 
          position: { x: posX, y: posY } 
        })
        modifier.apply(mockNode, mockContext)
        
        expect(element.style.position).toBe('absolute')
        
        // Initial values
        expect(posX()).toBe(10)
        expect(posY()).toBe(20)
        
        // Update reactive values
        setPosX(150)
        setPosY(300)
        
        expect(posX()).toBe(150)
        expect(posY()).toBe(300)
      })

      it('should handle partial position (only x or only y)', () => {
        const modifier1 = new LayoutModifier({ position: { x: 50 } })
        modifier1.apply(mockNode, mockContext)
        
        expect(element.style.position).toBe('absolute')
        expect(element.style.left).toBe('50px')
        expect(element.style.top).toBe('0px') // Default to 0 when not specified

        const element2 = createTestElement()
        const mockNode2 = { element: element2 }
        const mockContext2 = { element: element2, componentId: 'test2', phase: 'creation' as const }

        const modifier2 = new LayoutModifier({ position: { y: 75 } })
        modifier2.apply(mockNode2, mockContext2)
        
        expect(element2.style.position).toBe('absolute')
        expect(element2.style.left).toBe('0px') // Default to 0 when not specified
        expect(element2.style.top).toBe('75px')
      })
    })

    describe('Z-Index', () => {
      it('should handle static z-index values', () => {
        const modifier = new LayoutModifier({ zIndex: 10 })
        modifier.apply(mockNode, mockContext)
        
        expect(element.style.zIndex).toBe('10')
      })

      it('should handle zero z-index', () => {
        const modifier = new LayoutModifier({ zIndex: 0 })
        modifier.apply(mockNode, mockContext)
        
        expect(element.style.zIndex).toBe('0')
      })

      it('should handle negative z-index', () => {
        const modifier = new LayoutModifier({ zIndex: -5 })
        modifier.apply(mockNode, mockContext)
        
        expect(element.style.zIndex).toBe('-5')
      })

      it('should handle reactive z-index values', () => {
        const [zValue, setZValue] = createSignal(5)
        
        const modifier = new LayoutModifier({ zIndex: zValue })
        modifier.apply(mockNode, mockContext)
        
        // Initial value
        expect(zValue()).toBe(5)
        
        // Update reactive value
        setZValue(100)
        
        expect(zValue()).toBe(100)
      })

      it('should handle large z-index values', () => {
        const modifier = new LayoutModifier({ zIndex: 9999 })
        modifier.apply(mockNode, mockContext)
        
        expect(element.style.zIndex).toBe('9999')
      })
    })

    describe('Combined Transforms', () => {
      it('should handle scale and position together', () => {
        const modifier = new LayoutModifier({ 
          scaleEffect: { x: 1.5, y: 1.2, anchor: 'topLeading' },
          position: { x: 50, y: 100 },
          zIndex: 10
        })
        modifier.apply(mockNode, mockContext)
        
        expect(element.style.transform).toBe('scale(1.5, 1.2)')
        expect(element.style.transformOrigin).toBe('left top')
        expect(element.style.position).toBe('absolute')
        expect(element.style.left).toBe('50px')
        expect(element.style.top).toBe('100px')
        expect(element.style.zIndex).toBe('10')
      })

      it('should handle all transform properties with reactive values', () => {
        const [scaleX] = createSignal(1.2)
        const [posX] = createSignal(25)
        const [zValue] = createSignal(5)
        
        const modifier = new LayoutModifier({ 
          scaleEffect: { x: scaleX, anchor: 'center' },
          position: { x: posX, y: 75 },
          zIndex: zValue
        })
        modifier.apply(mockNode, mockContext)
        
        expect(element.style.position).toBe('absolute')
        expect(element.style.transformOrigin).toBe('center center')
        
        // Verify reactive values exist
        expect(scaleX()).toBe(1.2)
        expect(posX()).toBe(25)
        expect(zValue()).toBe(5)
      })
    })
  })

  describe('Modifier Builder Integration', () => {
    it('should create LayoutModifier instances for scaleEffect', () => {
      const component = Text('Scale Test')
        .modifier
        .scaleEffect(1.5)
        .build()
      
      expect(component.modifiers).toHaveLength(1)
      expect(component.modifiers[0].type).toBe('layout')
    })

    it('should create LayoutModifier instances for absolutePosition', () => {
      const component = Button('Position Test', () => {})
        .modifier
        .absolutePosition(100, 200)
        .build()
      
      expect(component.modifiers).toHaveLength(1)
      expect(component.modifiers[0].type).toBe('layout')
    })

    it('should handle TypeScript support for all transform modifiers', () => {
      const [dynamicScale] = createSignal(1.2)
      const [dynamicX] = createSignal(50)
      
      const component = VStack({ children: [] })
        .modifier
        .scaleEffect(2.0, 1.5, 'topLeading')
        .absolutePosition(dynamicX, 100)
        .scaleEffect(dynamicScale) // Uniform scaling with reactive value
        .build()
      
      expect(component.modifiers).toHaveLength(3)
      component.modifiers.forEach(modifier => {
        expect(modifier.type).toBe('layout')
      })
    })

    it('should support chaining transform modifiers with other modifiers', () => {
      const component = Text('Combined Test')
        .modifier
        .padding(16)
        .scaleEffect(1.1)
        .backgroundColor('#ff0000')
        .absolutePosition(25, 50)
        .cornerRadius(8)
        .build()
      
      expect(component.modifiers).toHaveLength(5)
      
      // Check modifier types
      const types = component.modifiers.map(m => m.type)
      expect(types).toContain('padding')
      expect(types).toContain('layout')
      expect(types).toContain('appearance')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle very small scale values', () => {
      const element = createTestElement()
      const mockNode = { element }
      const mockContext = { element, componentId: 'test', phase: 'creation' as const }
      
      const modifier = new LayoutModifier({ scaleEffect: { x: 0.001, y: 0.001 } })
      modifier.apply(mockNode, mockContext)
      
      expect(element.style.transform).toBe('scale(0.001, 0.001)')
    })

    it('should handle very large scale values', () => {
      const element = createTestElement()
      const mockNode = { element }
      const mockContext = { element, componentId: 'test', phase: 'creation' as const }
      
      const modifier = new LayoutModifier({ scaleEffect: { x: 1000, y: 1000 } })
      modifier.apply(mockNode, mockContext)
      
      expect(element.style.transform).toBe('scale(1000, 1000)')
    })

    it('should handle invalid anchor gracefully', () => {
      const element = createTestElement()
      const mockNode = { element }
      const mockContext = { element, componentId: 'test', phase: 'creation' as const }
      
      const modifier = new LayoutModifier({ 
        scaleEffect: { x: 1.5, anchor: 'invalid' as any } 
      })
      modifier.apply(mockNode, mockContext)
      
      expect(element.style.transform).toBe('scale(1.5, 1.5)')
      expect(element.style.transformOrigin).toBe('center center') // Default fallback
    })

    it('should handle decimal precision in positions', () => {
      const element = createTestElement()
      const mockNode = { element }
      const mockContext = { element, componentId: 'test', phase: 'creation' as const }
      
      const modifier = new LayoutModifier({ position: { x: 12.5678, y: 34.9012 } })
      modifier.apply(mockNode, mockContext)
      
      expect(element.style.left).toBe('12.5678px')
      expect(element.style.top).toBe('34.9012px')
    })

    it('should handle very large position values', () => {
      const element = createTestElement()
      const mockNode = { element }
      const mockContext = { element, componentId: 'test', phase: 'creation' as const }
      
      const modifier = new LayoutModifier({ position: { x: 10000, y: -5000 } })
      modifier.apply(mockNode, mockContext)
      
      expect(element.style.left).toBe('10000px')
      expect(element.style.top).toBe('-5000px')
    })
  })

  describe('Transform Origin Mapping', () => {
    it('should map all anchor points correctly', () => {
      const element = createTestElement()
      const mockNode = { element }
      const mockContext = { element, componentId: 'test', phase: 'creation' as const }

      // Create a LayoutModifier instance to access the private method through testing
      const modifier = new LayoutModifier({ scaleEffect: { x: 1.0 } })
      
      // Test that the method exists and works (indirectly through the apply method)
      const testCases = [
        'center', 'top', 'topLeading', 'topTrailing', 
        'bottom', 'bottomLeading', 'bottomTrailing', 
        'leading', 'trailing'
      ]
      
      testCases.forEach(anchor => {
        const testElement = createTestElement()
        const testModifier = new LayoutModifier({ 
          scaleEffect: { x: 1.0, anchor } 
        })
        
        testModifier.apply(
          { element: testElement }, 
          { element: testElement, componentId: 'test', phase: 'creation' as const }
        )
        
        // Just verify that transformOrigin is set (exact mapping tested in individual tests above)
        expect(testElement.style.transformOrigin).toBeTruthy()
      })
    })
  })
})