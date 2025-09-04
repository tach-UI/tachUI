/**
 * Unit tests for SizeModifier
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { height, size, width } from '@tachui/modifiers'
import { createComputed, createSignal } from '../../src/reactive'
import { setupModifierTest } from './test-utils'

describe('SizeModifier', () => {
  let mockElement: HTMLElement
  let mockNode: any
  let mockContext: any

  beforeEach(() => {
    const setup = setupModifierTest()
    mockElement = setup.mockElement
    mockNode = setup.mockNode
    mockContext = setup.mockContext
  })

  describe('basic functionality', () => {
    it('should apply width and height', () => {
      const modifier = size({ width: 200, height: 100 })
      modifier.apply(mockNode, mockContext)

      expect(mockElement.style.width).toBe('200px')
      expect(mockElement.style.height).toBe('100px')
    })

    it('should handle string values', () => {
      const modifier = size({ width: '100%', height: '50vh' })
      modifier.apply(mockNode, mockContext)

      expect(mockElement.style.width).toBe('100%')
      expect(mockElement.style.height).toBe('50vh')
    })

    it('should apply min and max constraints', () => {
      const modifier = size({
        width: '100%',
        minWidth: 320,
        maxWidth: '1200px',
        height: 'auto',
        minHeight: '200px',
        maxHeight: 800,
      })
      modifier.apply(mockNode, mockContext)

      expect(mockElement.style.width).toBe('100%')
      expect(mockElement.style.minWidth).toBe('320px')
      expect(mockElement.style.maxWidth).toBe('1200px')
      expect(mockElement.style.height).toBe('auto')
      expect(mockElement.style.minHeight).toBe('200px')
      expect(mockElement.style.maxHeight).toBe('800px')
    })

    it('should only apply defined properties', () => {
      const modifier = size({ width: 100 })
      modifier.apply(mockNode, mockContext)

      expect(mockElement.style.width).toBe('100px')
      expect(mockElement.style.height).toBe('')
      expect(mockElement.style.minWidth).toBe('')
    })
  })

  describe('convenience functions', () => {
    it('should support width convenience function', () => {
      const modifier = width(280)
      modifier.apply(mockNode, mockContext)

      expect(mockElement.style.width).toBe('280px')
      expect(mockElement.style.height).toBe('')
    })

    it('should support height convenience function', () => {
      const modifier = height('100vh')
      modifier.apply(mockNode, mockContext)

      expect(mockElement.style.height).toBe('100vh')
      expect(mockElement.style.width).toBe('')
    })

    it('should support string values in convenience functions', () => {
      const widthModifier = width('calc(100% - 64px)')
      const heightModifier = height('fit-content')

      widthModifier.apply(mockNode, mockContext)
      expect(mockElement.style.width).toBe('calc(100% - 64px)')

      // Reset style for second test
      mockElement.style.width = ''

      heightModifier.apply(mockNode, mockContext)
      expect(mockElement.style.height).toBe('fit-content')
    })
  })

  describe('reactive values', () => {
    it('should support signals for width and height', async () => {
      const [elementWidth, setElementWidth] = createSignal(100)
      const [elementHeight, setElementHeight] = createSignal(50)

      const modifier = size({ width: elementWidth, height: elementHeight })

      // Initial application
      modifier.apply(mockNode, mockContext)

      // Wait for reactive effects
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(mockElement.style.width).toBe('100px')
      expect(mockElement.style.height).toBe('50px')

      // Update signals
      setElementWidth(200)
      setElementHeight(150)

      // Re-apply to simulate reactive update
      modifier.apply(mockNode, mockContext)
      expect(mockElement.style.width).toBe('200px')
      expect(mockElement.style.height).toBe('150px')
    })

    it('should support reactive string values', async () => {
      const [isFullWidth, setIsFullWidth] = createSignal(false)
      const computedWidth = createComputed(() =>
        isFullWidth() ? '100%' : '50%'
      )

      const modifier = size({ width: computedWidth })

      modifier.apply(mockNode, mockContext)

      // Wait for reactive effects
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(mockElement.style.width).toBe('50%')

      setIsFullWidth(true)
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(mockElement.style.width).toBe('100%')
    })
  })

  describe('edge cases', () => {
    it('should handle zero values', () => {
      const modifier = size({ width: 0, height: 0 })
      modifier.apply(mockNode, mockContext)

      expect(mockElement.style.width).toBe('0px')
      expect(mockElement.style.height).toBe('0px')
    })

    it('should handle empty options object', () => {
      const modifier = size({})
      modifier.apply(mockNode, mockContext)

      expect(mockElement.style.width).toBe('')
      expect(mockElement.style.height).toBe('')
    })

    it('should preserve existing styles not managed by the modifier', () => {
      // Set some existing styles
      mockElement.style.color = 'red'
      mockElement.style.fontSize = '16px'

      const modifier = size({ width: 100 })
      modifier.apply(mockNode, mockContext)

      expect(mockElement.style.width).toBe('100px')
      expect(mockElement.style.color).toBe('red')
      expect(mockElement.style.fontSize).toBe('16px')
    })
  })

  describe('modifier properties', () => {
    it('should have correct type and priority', () => {
      const modifier = size({ width: 100 })

      expect(modifier.type).toBe('size')
      expect(modifier.priority).toBe(80)
    })
  })
})
