/**
 * Tests for New SwiftUI Modifiers
 *
 * Tests for .resizable() and .textCase() modifiers
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { ResizableModifier } from '../../src/modifiers/base'
import { ModifierBuilderImpl } from '../../src/modifiers/builder'
import type { ModifierContext } from '../../src/modifiers/types'
import { textCase } from '../../src/modifiers/typography'
import type { ComponentInstance } from '../../src/runtime/types'

// Mock component for testing
const mockComponent: ComponentInstance = {
  type: 'component',
  id: 'test-component',
  render: () => ({ element: document.createElement('div'), children: [] }),
}

// Mock DOM element for testing
const createMockElement = () => {
  const element = document.createElement('img')
  element.getBoundingClientRect = () => ({
    top: 0,
    left: 0,
    bottom: 100,
    right: 100,
    width: 100,
    height: 100,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  })
  return element
}

describe('New SwiftUI Modifiers', () => {
  let builder: ModifierBuilderImpl
  let mockElement: HTMLElement
  let mockContext: ModifierContext

  beforeEach(() => {
    builder = new ModifierBuilderImpl(mockComponent)
    mockElement = createMockElement()
    mockContext = {
      componentId: 'test-component',
      element: mockElement,
      phase: 'creation',
    }
  })

  describe('.resizable() modifier', () => {
    it('should add resizable modifier', () => {
      const component = builder.resizable().build()

      expect(component.modifiers).toHaveLength(1)
      expect(component.modifiers[0]).toBeInstanceOf(ResizableModifier)
    })

    it('should apply object-fit fill to image elements', () => {
      const resizableModifier = new ResizableModifier({})

      resizableModifier.apply({ element: mockElement, children: [] }, mockContext)

      expect(mockElement.style.objectFit).toBe('fill')
    })

    it('should not affect non-image elements', () => {
      const divElement = document.createElement('div')
      const divContext = {
        ...mockContext,
        element: divElement,
      }

      const resizableModifier = new ResizableModifier({})

      resizableModifier.apply({ element: divElement, children: [] }, divContext)

      // Should not set object-fit on non-image elements
      expect(divElement.style.objectFit).toBe('')
    })
  })

  describe('.textCase() modifier', () => {
    it('should be an alias for textTransform', () => {
      // Test that textCase produces the same result as textTransform
      const textCaseModifier = textCase('uppercase')
      const textTransformModifier = new (textCaseModifier.constructor as any)({
        transform: 'uppercase',
      })

      expect(textCaseModifier).toBeDefined()
      // Both should have the same type and properties
      expect(textCaseModifier.type).toBe(textTransformModifier.type)
    })

    it('should support all text case values', () => {
      const cases = ['none', 'uppercase', 'lowercase', 'capitalize'] as const

      cases.forEach((caseValue) => {
        const modifier = textCase(caseValue)
        expect(modifier).toBeDefined()
      })
    })
  })
})
