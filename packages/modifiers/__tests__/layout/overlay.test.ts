/**
 * Overlay Modifier Tests
 *
 * Comprehensive tests for the overlay modifier including all alignment options,
 * content rendering, DOM manipulation, and positioning calculations.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  OverlayModifier,
  overlay,
  type OverlayAlignment,
} from '../../src/layout/overlay'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'

// Mock DOM element that matches HTMLElement interface
class MockElement {
  style: {
    [key: string]: string
    setProperty: (property: string, value: string) => void
  }
  children: MockElement[] = []
  _appendChild: (child: MockElement) => void

  constructor() {
    this.style = new Proxy({} as any, {
      set: (target, prop, value) => {
        target[prop] = value
        return true
      },
      get: (target, prop) => {
        if (prop === 'setProperty') {
          return (property: string, value: string) => {
            target[property] = value
          }
        }
        return target[prop] || ''
      },
    })

    this._appendChild = (child: MockElement) => {
      this.children.push(child)
    }
  }

  appendChild(child: MockElement) {
    this._appendChild(child)
    return child
  }
}

// Mock component instance
const createMockComponent = (elementType = 'span') => ({
  type: 'component' as const,
  id: 'mock-component',
  render: vi.fn().mockReturnValue({
    element: new MockElement(),
    children: [],
  }),
})

// Mock console methods
const mockConsole = {
  warn: vi.fn(),
  error: vi.fn(),
}

describe('Overlay Modifier', () => {
  let mockElement: MockElement
  let mockContext: ModifierContext
  let mockComponent: ReturnType<typeof createMockComponent>
  let originalConsole: any

  beforeEach(() => {
    mockElement = new MockElement()
    mockContext = {
      componentId: 'test-component',
      element: mockElement as any,
      phase: 'creation',
    }
    mockComponent = createMockComponent()

    // Mock console methods
    originalConsole = {
      warn: console.warn,
      error: console.error,
    }
    console.warn = mockConsole.warn
    console.error = mockConsole.error
  })

  afterEach(() => {
    // Restore console methods
    console.warn = originalConsole.warn
    console.error = originalConsole.error

    vi.clearAllMocks()
  })

  describe('Constructor and Factory Function', () => {
    it('should create OverlayModifier with default center alignment', () => {
      const modifier = overlay(mockComponent)

      expect(modifier).toBeInstanceOf(OverlayModifier)
      expect(modifier.type).toBe('overlay')
      expect(modifier.priority).toBe(10)
      expect(modifier.properties.content).toBe(mockComponent)
      expect(modifier.properties.alignment).toBe('center')
    })

    it('should create OverlayModifier with custom alignment', () => {
      const modifier = overlay(mockComponent, 'topLeading')

      expect(modifier.properties.content).toBe(mockComponent)
      expect(modifier.properties.alignment).toBe('topLeading')
    })

    it('should create OverlayModifier instance directly', () => {
      const options = {
        content: mockComponent,
        alignment: 'bottom' as OverlayAlignment,
      }
      const modifier = new OverlayModifier(options)

      expect(modifier.properties.content).toBe(mockComponent)
      expect(modifier.properties.alignment).toBe('bottom')
      expect(modifier.type).toBe('overlay')
      expect(modifier.priority).toBe(10)
    })
  })

  describe('DOM Positioning Setup', () => {
    it('should set element position to relative when static', () => {
      mockElement.style.position = 'static'
      const modifier = overlay(mockComponent)

      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.position).toBe('relative')
    })

    it('should set element position to relative when empty', () => {
      mockElement.style.position = ''
      const modifier = overlay(mockComponent)

      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.position).toBe('relative')
    })

    it('should not change position when already positioned', () => {
      const positions = ['absolute', 'relative', 'fixed', 'sticky']

      positions.forEach(position => {
        mockElement.style.position = position
        const modifier = overlay(mockComponent)

        modifier.apply({} as DOMNode, mockContext)

        expect(mockElement.style.position).toBe(position)
      })
    })
  })

  describe('Overlay Container Creation', () => {
    it('should create overlay container with correct styles', () => {
      const modifier = overlay(mockComponent)

      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.children).toHaveLength(1)

      const overlayContainer = mockElement.children[0]
      expect(overlayContainer.style.position).toBe('absolute')
      expect(overlayContainer.style.pointerEvents).toBe('none')
    })

    it('should apply center alignment styles by default', () => {
      const modifier = overlay(mockComponent)

      modifier.apply({} as DOMNode, mockContext)

      const overlayContainer = mockElement.children[0]
      expect(overlayContainer.style.top).toBe('50%')
      expect(overlayContainer.style.left).toBe('50%')
      expect(overlayContainer.style.transform).toBe('translate(-50%, -50%)')
    })
  })

  describe('Alignment Positioning', () => {
    const alignmentTests: Array<{
      alignment: OverlayAlignment
      expectedStyles: Record<string, string>
    }> = [
      {
        alignment: 'center',
        expectedStyles: {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        },
      },
      {
        alignment: 'top',
        expectedStyles: {
          top: '0px',
          left: '50%',
          transform: 'translateX(-50%)',
        },
      },
      {
        alignment: 'bottom',
        expectedStyles: {
          bottom: '0px',
          left: '50%',
          transform: 'translateX(-50%)',
        },
      },
      {
        alignment: 'leading',
        expectedStyles: {
          top: '50%',
          left: '0px',
          transform: 'translateY(-50%)',
        },
      },
      {
        alignment: 'trailing',
        expectedStyles: {
          top: '50%',
          right: '0px',
          transform: 'translateY(-50%)',
        },
      },
      {
        alignment: 'topLeading',
        expectedStyles: {
          top: '0px',
          left: '0px',
        },
      },
      {
        alignment: 'topTrailing',
        expectedStyles: {
          top: '0px',
          right: '0px',
        },
      },
      {
        alignment: 'bottomLeading',
        expectedStyles: {
          bottom: '0px',
          left: '0px',
        },
      },
      {
        alignment: 'bottomTrailing',
        expectedStyles: {
          bottom: '0px',
          right: '0px',
        },
      },
    ]

    alignmentTests.forEach(({ alignment, expectedStyles }) => {
      it(`should apply correct styles for ${alignment} alignment`, () => {
        const modifier = overlay(mockComponent, alignment)

        modifier.apply({} as DOMNode, mockContext)

        const overlayContainer = mockElement.children[0]

        Object.entries(expectedStyles).forEach(([property, expectedValue]) => {
          expect(overlayContainer.style[property]).toBe(expectedValue)
        })
      })
    })
  })

  describe('Content Rendering', () => {
    it('should render component instance content', () => {
      const modifier = overlay(mockComponent)

      modifier.apply({} as DOMNode, mockContext)

      expect(mockComponent.render).toHaveBeenCalled()
      expect(mockElement.children).toHaveLength(1)

      const overlayContainer = mockElement.children[0]
      expect(overlayContainer.children).toHaveLength(1)
    })

    it('should render function content', () => {
      const contentFunction = vi.fn().mockReturnValue(mockComponent)
      const modifier = overlay(contentFunction)

      modifier.apply({} as DOMNode, mockContext)

      expect(contentFunction).toHaveBeenCalled()
      expect(mockComponent.render).toHaveBeenCalled()

      const overlayContainer = mockElement.children[0]
      expect(overlayContainer.children).toHaveLength(1)
    })

    it('should render HTMLElement content', () => {
      const htmlElement = new MockElement()
      const modifier = overlay(htmlElement)

      modifier.apply({} as DOMNode, mockContext)

      const overlayContainer = mockElement.children[0]
      expect(overlayContainer.children).toContain(htmlElement)
    })

    it('should handle component without render method gracefully', () => {
      const invalidComponent = { type: 'component', id: 'invalid' }
      const modifier = overlay(invalidComponent)

      expect(() => {
        modifier.apply({} as DOMNode, mockContext)
      }).not.toThrow()

      const overlayContainer = mockElement.children[0]
      expect(overlayContainer.children).toHaveLength(0)
    })

    it('should handle function returning invalid component', () => {
      const contentFunction = vi.fn().mockReturnValue(null)
      const modifier = overlay(contentFunction)

      expect(() => {
        modifier.apply({} as DOMNode, mockContext)
      }).not.toThrow()

      expect(contentFunction).toHaveBeenCalled()

      const overlayContainer = mockElement.children[0]
      expect(overlayContainer.children).toHaveLength(0)
    })

    it('should handle render method returning null element', () => {
      const componentWithNullElement = {
        ...mockComponent,
        render: vi.fn().mockReturnValue({
          element: null,
          children: [],
        }),
      }

      const modifier = overlay(componentWithNullElement)

      expect(() => {
        modifier.apply({} as DOMNode, mockContext)
      }).not.toThrow()

      const overlayContainer = mockElement.children[0]
      expect(overlayContainer.children).toHaveLength(0)
    })
  })

  describe('Multiple Overlay Handling', () => {
    it('should support multiple overlays on same element', () => {
      const modifier1 = overlay(mockComponent, 'topLeading')
      const modifier2 = overlay(createMockComponent(), 'bottomTrailing')

      modifier1.apply({} as DOMNode, mockContext)
      modifier2.apply({} as DOMNode, mockContext)

      expect(mockElement.children).toHaveLength(2)

      // First overlay
      const overlay1 = mockElement.children[0]
      expect(overlay1.style.top).toBe('0px')
      expect(overlay1.style.left).toBe('0px')

      // Second overlay
      const overlay2 = mockElement.children[1]
      expect(overlay2.style.bottom).toBe('0px')
      expect(overlay2.style.right).toBe('0px')
    })

    it('should handle overlays with different alignments efficiently', () => {
      const alignments: OverlayAlignment[] = [
        'center',
        'top',
        'bottom',
        'leading',
        'trailing',
        'topLeading',
        'topTrailing',
        'bottomLeading',
        'bottomTrailing',
      ]

      alignments.forEach((alignment, index) => {
        const modifier = overlay(createMockComponent(), alignment)
        modifier.apply({} as DOMNode, mockContext)
      })

      expect(mockElement.children).toHaveLength(alignments.length)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing element gracefully', () => {
      const modifier = overlay(mockComponent)
      const contextWithoutElement = {
        ...mockContext,
        element: undefined,
      }

      expect(() => {
        modifier.apply({} as DOMNode, contextWithoutElement)
      }).not.toThrow()
    })

    it('should handle null element gracefully', () => {
      const modifier = overlay(mockComponent)
      const contextWithNullElement = {
        ...mockContext,
        element: null,
      }

      expect(() => {
        modifier.apply({} as DOMNode, contextWithNullElement)
      }).not.toThrow()
    })

    it('should handle non-HTMLElement gracefully', () => {
      const modifier = overlay(mockComponent)
      const contextWithTextNode = {
        ...mockContext,
        element: { nodeType: 3 } as any, // Text node
      }

      expect(() => {
        modifier.apply({} as DOMNode, contextWithTextNode)
      }).not.toThrow()
    })

    it('should return undefined (no DOM tree modification)', () => {
      const modifier = overlay(mockComponent)

      const result = modifier.apply({} as DOMNode, mockContext)

      expect(result).toBeUndefined()
    })

    it('should handle invalid alignment by defaulting to center', () => {
      const modifier = new OverlayModifier({
        content: mockComponent,
        alignment: 'invalid' as any,
      })

      modifier.apply({} as DOMNode, mockContext)

      const overlayContainer = mockElement.children[0]
      expect(overlayContainer.style.top).toBe('50%')
      expect(overlayContainer.style.left).toBe('50%')
      expect(overlayContainer.style.transform).toBe('translate(-50%, -50%)')
    })
  })

  describe('Performance', () => {
    it('should perform multiple overlay applications efficiently', () => {
      const modifier = overlay(mockComponent)
      const iterations = 100 // Reduced for DOM operations

      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        // Create fresh element for each iteration to avoid accumulation
        const freshElement = new MockElement()
        const freshContext = { ...mockContext, element: freshElement as any }
        modifier.apply({} as DOMNode, freshContext)
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(100) // Should complete within 100ms
    })

    it('should handle multiple different overlays efficiently', () => {
      const overlays = Array.from({ length: 50 }, (_, i) =>
        overlay(createMockComponent(), 'center')
      )

      const start = performance.now()

      overlays.forEach(modifier => {
        modifier.apply({} as DOMNode, mockContext)
      })

      const duration = performance.now() - start

      expect(duration).toBeLessThan(150) // Should complete within 150ms
      expect(mockElement.children).toHaveLength(overlays.length)
    })

    it('should handle complex content rendering efficiently', () => {
      const complexComponent = {
        type: 'component' as const,
        id: 'complex-component',
        render: vi.fn().mockImplementation(() => {
          // Simulate complex rendering
          const element = new MockElement()
          for (let i = 0; i < 10; i++) {
            element.appendChild(new MockElement())
          }
          return { element, children: [] }
        }),
      }

      const modifier = overlay(complexComponent, 'center')
      const iterations = 20

      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        const freshElement = new MockElement()
        const freshContext = { ...mockContext, element: freshElement as any }
        modifier.apply({} as DOMNode, freshContext)
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(50) // Should complete within 50ms
      expect(complexComponent.render).toHaveBeenCalledTimes(iterations)
    })
  })
})
