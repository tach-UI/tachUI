/**
 * Tests for LayoutModifier infinity handling
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { LayoutModifier } from '../../src/modifiers/base'
import { infinity } from '../../src/constants/layout'
import { setupModifierTest } from './test-utils'

describe('LayoutModifier Infinity Handling', () => {
  let mockElement: HTMLElement
  let mockNode: any
  let mockContext: any

  beforeEach(() => {
    const setup = setupModifierTest()
    mockElement = setup.mockElement
    mockNode = setup.mockNode
    mockContext = setup.mockContext
  })

  describe('frame with infinity values', () => {
    it('should handle maxWidth: infinity', () => {
      const modifier = new LayoutModifier({
        frame: {
          maxWidth: infinity
        }
      })
      
      modifier.apply(mockNode, mockContext)

      // Should apply flexbox expansion properties
      expect(mockElement.style.flexGrow).toBe('1')
      expect(mockElement.style.flexShrink).toBe('1')
      expect(mockElement.style.flexBasis).toBe('0%')
      expect(mockElement.style.alignSelf).toBe('stretch')
      
      // Should apply with !important priority
      expect(mockElement.style.getPropertyPriority('flex-grow')).toBe('important')
      expect(mockElement.style.getPropertyPriority('flex-shrink')).toBe('important')
      expect(mockElement.style.getPropertyPriority('flex-basis')).toBe('important')
      expect(mockElement.style.getPropertyPriority('align-self')).toBe('important')
      expect(mockElement.style.maxWidth).toBe('none')
      // Should not set explicit width - uses flex properties for expansion
      expect(mockElement.style.width).toBe('')
    })

    it('should handle maxHeight: infinity', () => {
      const modifier = new LayoutModifier({
        frame: {
          maxHeight: infinity
        }
      })
      
      modifier.apply(mockNode, mockContext)

      // Should apply flexbox expansion properties
      expect(mockElement.style.flexGrow).toBe('1')
      expect(mockElement.style.flexShrink).toBe('1')
      expect(mockElement.style.flexBasis).toBe('0%')
      expect(mockElement.style.alignSelf).toBe('stretch')
      
      // Should apply with !important priority
      expect(mockElement.style.getPropertyPriority('flex-grow')).toBe('important')
      expect(mockElement.style.getPropertyPriority('flex-shrink')).toBe('important')
      expect(mockElement.style.getPropertyPriority('flex-basis')).toBe('important')
      expect(mockElement.style.getPropertyPriority('align-self')).toBe('important')
      expect(mockElement.style.maxHeight).toBe('none')
      // Should not set explicit height - uses flex properties for expansion
      expect(mockElement.style.height).toBe('')
    })

    it('should handle width: infinity', () => {
      const modifier = new LayoutModifier({
        frame: {
          width: infinity
        }
      })
      
      modifier.apply(mockNode, mockContext)

      // Should apply flexbox expansion properties
      expect(mockElement.style.flexGrow).toBe('1')
      expect(mockElement.style.flexShrink).toBe('1')
      expect(mockElement.style.flexBasis).toBe('0%')
      expect(mockElement.style.alignSelf).toBe('stretch')
      
      // Should apply with !important priority
      expect(mockElement.style.getPropertyPriority('flex-grow')).toBe('important')
      expect(mockElement.style.getPropertyPriority('flex-shrink')).toBe('important')
      expect(mockElement.style.getPropertyPriority('flex-basis')).toBe('important')
      expect(mockElement.style.getPropertyPriority('align-self')).toBe('important')
    })

    it('should handle height: infinity', () => {
      const modifier = new LayoutModifier({
        frame: {
          height: infinity
        }
      })
      
      modifier.apply(mockNode, mockContext)

      // Should apply flexbox expansion properties
      expect(mockElement.style.flexGrow).toBe('1')
      expect(mockElement.style.flexShrink).toBe('1')
      expect(mockElement.style.flexBasis).toBe('0%')
      expect(mockElement.style.alignSelf).toBe('stretch')
      
      // Should apply with !important priority
      expect(mockElement.style.getPropertyPriority('flex-grow')).toBe('important')
      expect(mockElement.style.getPropertyPriority('flex-shrink')).toBe('important')
      expect(mockElement.style.getPropertyPriority('flex-basis')).toBe('important')
      expect(mockElement.style.getPropertyPriority('align-self')).toBe('important')
    })

    it('should handle both maxWidth and maxHeight infinity', () => {
      const modifier = new LayoutModifier({
        frame: {
          maxWidth: infinity,
          maxHeight: infinity
        }
      })
      
      modifier.apply(mockNode, mockContext)

      // Should apply flexbox expansion properties for both dimensions
      expect(mockElement.style.flexGrow).toBe('1')
      expect(mockElement.style.flexShrink).toBe('1')
      expect(mockElement.style.flexBasis).toBe('0%')
      expect(mockElement.style.alignSelf).toBe('stretch')
      
      // Should apply with !important priority
      expect(mockElement.style.getPropertyPriority('flex-grow')).toBe('important')
      expect(mockElement.style.getPropertyPriority('flex-shrink')).toBe('important')
      expect(mockElement.style.getPropertyPriority('flex-basis')).toBe('important')
      expect(mockElement.style.getPropertyPriority('align-self')).toBe('important')
      expect(mockElement.style.maxWidth).toBe('none')
      expect(mockElement.style.maxHeight).toBe('none')
      // Should not set explicit dimensions - uses flex properties for expansion
      expect(mockElement.style.width).toBe('')
      expect(mockElement.style.height).toBe('')
    })

    it('should combine infinity with other frame properties', () => {
      const modifier = new LayoutModifier({
        frame: {
          maxWidth: infinity,
          minHeight: 80,
          width: 200 // This should be overridden by infinity expansion
        }
      })
      
      modifier.apply(mockNode, mockContext)

      // Should apply infinity expansion
      expect(mockElement.style.flexGrow).toBe('1')
      expect(mockElement.style.flexShrink).toBe('1')
      expect(mockElement.style.flexBasis).toBe('0%')
      expect(mockElement.style.alignSelf).toBe('stretch')
      
      // Should apply with !important priority
      expect(mockElement.style.getPropertyPriority('flex-grow')).toBe('important')
      expect(mockElement.style.getPropertyPriority('flex-shrink')).toBe('important')
      expect(mockElement.style.getPropertyPriority('flex-basis')).toBe('important')
      expect(mockElement.style.getPropertyPriority('align-self')).toBe('important')
      expect(mockElement.style.maxWidth).toBe('none')
      // Should apply regular constraints
      expect(mockElement.style.minHeight).toBe('80px')
    })

    it('should handle non-infinity frame properties normally', () => {
      const modifier = new LayoutModifier({
        frame: {
          width: 200,
          height: 100,
          maxWidth: 500,
          minHeight: 50
        }
      })
      
      modifier.apply(mockNode, mockContext)

      // Should not apply infinity expansion
      expect(mockElement.style.flexGrow).toBe('')
      // Should apply regular CSS values
      expect(mockElement.style.width).toBe('200px')
      expect(mockElement.style.height).toBe('100px')
      expect(mockElement.style.maxWidth).toBe('500px')
      expect(mockElement.style.minHeight).toBe('50px')
    })

    it('should handle string dimension values', () => {
      const modifier = new LayoutModifier({
        frame: {
          width: '100%',
          maxHeight: '80vh',
          maxWidth: infinity
        }
      })
      
      modifier.apply(mockNode, mockContext)

      // Should apply infinity expansion for maxWidth
      expect(mockElement.style.flexGrow).toBe('1')
      expect(mockElement.style.flexShrink).toBe('1')
      expect(mockElement.style.flexBasis).toBe('0%')
      expect(mockElement.style.alignSelf).toBe('stretch')
      
      // Should apply with !important priority
      expect(mockElement.style.getPropertyPriority('flex-grow')).toBe('important')
      expect(mockElement.style.getPropertyPriority('flex-shrink')).toBe('important')
      expect(mockElement.style.getPropertyPriority('flex-basis')).toBe('important')
      expect(mockElement.style.getPropertyPriority('align-self')).toBe('important')
      expect(mockElement.style.maxWidth).toBe('none')
      // Should apply string values as-is
      expect(mockElement.style.maxHeight).toBe('80vh')
      // Note: width gets overridden by infinity expansion (flexbox)
    })
  })

  describe('HStack scenario', () => {
    it('should properly expand HStack with maxWidth: infinity', () => {
      // This simulates the specific issue from the calculator app
      const modifier = new LayoutModifier({
        frame: {
          maxWidth: infinity
        }
      })
      
      modifier.apply(mockNode, mockContext)

      // Verify the element gets the proper expansion styles for flexbox
      expect(mockElement.style.flexGrow).toBe('1')
      expect(mockElement.style.flexShrink).toBe('1')
      expect(mockElement.style.flexBasis).toBe('0%')
      expect(mockElement.style.alignSelf).toBe('stretch')
      
      // Should apply with !important priority
      expect(mockElement.style.getPropertyPriority('flex-grow')).toBe('important')
      expect(mockElement.style.getPropertyPriority('flex-shrink')).toBe('important')
      expect(mockElement.style.getPropertyPriority('flex-basis')).toBe('important')
      expect(mockElement.style.getPropertyPriority('align-self')).toBe('important')
      expect(mockElement.style.maxWidth).toBe('none')
      
      // These are the key properties that make Spacer work inside HStack
      const hasFlexExpansion = mockElement.style.flexGrow === '1' && mockElement.style.getPropertyPriority('flex-grow') === 'important'
      const hasFlexBasis = mockElement.style.flexBasis === '0%' && mockElement.style.getPropertyPriority('flex-basis') === 'important'
      
      expect(hasFlexExpansion && hasFlexBasis).toBe(true)
    })
  })

  describe('modifier properties', () => {
    it('should have correct type and priority', () => {
      const modifier = new LayoutModifier({
        frame: { maxWidth: infinity }
      })

      expect(modifier.type).toBe('layout')
      expect(modifier.priority).toBe(100) // Layout priority
    })
  })

  describe('edge cases', () => {
    it('should handle empty frame object', () => {
      const modifier = new LayoutModifier({
        frame: {}
      })
      
      modifier.apply(mockNode, mockContext)

      // Should not apply any styles
      expect(mockElement.style.width).toBe('')
      expect(mockElement.style.flexGrow).toBe('')
    })

    it('should handle missing frame property', () => {
      const modifier = new LayoutModifier({})
      
      modifier.apply(mockNode, mockContext)

      // Should not crash and not apply any styles
      expect(mockElement.style.width).toBe('')
      expect(mockElement.style.flexGrow).toBe('')
    })

    it('should handle undefined values in frame', () => {
      const modifier = new LayoutModifier({
        frame: {
          width: undefined,
          maxWidth: infinity,
          height: undefined
        }
      })
      
      modifier.apply(mockNode, mockContext)

      // Should only apply the infinity expansion
      expect(mockElement.style.flexGrow).toBe('1')
      expect(mockElement.style.flexShrink).toBe('1')
      expect(mockElement.style.flexBasis).toBe('0%')
      expect(mockElement.style.alignSelf).toBe('stretch')
      
      // Should apply with !important priority
      expect(mockElement.style.getPropertyPriority('flex-grow')).toBe('important')
      expect(mockElement.style.getPropertyPriority('flex-shrink')).toBe('important')
      expect(mockElement.style.getPropertyPriority('flex-basis')).toBe('important')
      expect(mockElement.style.getPropertyPriority('align-self')).toBe('important')
      expect(mockElement.style.height).toBe('')
    })
  })
})