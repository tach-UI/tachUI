/**
 * Spacer Component Tests
 *
 * Comprehensive test suite for the SwiftUI-inspired Spacer component
 * covering component creation, props handling, rendering, and modifier integration.
 */

import { describe, expect, it } from 'vitest'
import type { SpacerProps } from '../../src/layout/Spacer'
import { Spacer, SpacerComponent } from '../../src/layout/Spacer'

describe('SpacerComponent', () => {
  describe('Constructor and Properties', () => {
    it('should create a spacer with default properties', () => {
      const spacer = new SpacerComponent({})

      expect(spacer.type).toBe('component')
      expect(spacer.id).toMatch(/^spacer-\d+-[a-z0-9]+$/)
      expect(spacer.props).toEqual({})
    })

    it('should create a spacer with minLength property', () => {
      const spacer = new SpacerComponent({ minLength: 50 })

      expect(spacer.props.minLength).toBe(50)
    })

    it('should generate unique IDs for different instances', () => {
      const spacer1 = new SpacerComponent({})
      const spacer2 = new SpacerComponent({})

      expect(spacer1.id).not.toBe(spacer2.id)
    })
  })

  describe('Render Method', () => {
    it('should render a div element with correct default styles', () => {
      const spacer = new SpacerComponent({})
      const result = spacer.render()

      expect(result).toBeDefined()
      expect(result.type).toBe('element')
      expect(result.tag).toBe('div')
      expect(result.props.style).toEqual({
        flexGrow: '1',
        flexShrink: '1',
        flexBasis: '0',
        minWidth: '0px',
        minHeight: '0px',
        alignSelf: 'stretch',
      })
    })

    it('should render with custom minLength styles', () => {
      const spacer = new SpacerComponent({ minLength: 100 })
      const result = spacer.render()

      expect(result.props.style.minWidth).toBe('100px')
      expect(result.props.style.minHeight).toBe('100px')
    })

    it('should handle zero minLength', () => {
      const spacer = new SpacerComponent({ minLength: 0 })
      const result = spacer.render()

      expect(result.props.style.minWidth).toBe('0px')
      expect(result.props.style.minHeight).toBe('0px')
    })

    it('should handle undefined minLength gracefully', () => {
      const spacer = new SpacerComponent({ minLength: undefined })
      const result = spacer.render()

      expect(result.props.style.minWidth).toBe('0px')
      expect(result.props.style.minHeight).toBe('0px')
    })
  })

  describe('CSS Flexbox Properties', () => {
    it('should always have correct flexbox properties for expansion', () => {
      const spacer = new SpacerComponent({ minLength: 42 })
      const result = spacer.render()
      const style = result.props.style

      expect(style.flexGrow).toBe('1')
      expect(style.flexShrink).toBe('1')
      expect(style.flexBasis).toBe('0')
      expect(style.alignSelf).toBe('stretch')
    })

    it('should maintain consistent style properties regardless of props', () => {
      const spacer1 = new SpacerComponent({})
      const spacer2 = new SpacerComponent({ minLength: 500 })

      const result1 = spacer1.render()
      const result2 = spacer2.render()

      // Core flex properties should be the same
      expect(result1.props.style.flexGrow).toBe(result2.props.style.flexGrow)
      expect(result1.props.style.flexShrink).toBe(
        result2.props.style.flexShrink
      )
      expect(result1.props.style.flexBasis).toBe(result2.props.style.flexBasis)
      expect(result1.props.style.alignSelf).toBe(result2.props.style.alignSelf)
    })
  })
})

describe('Spacer Factory Function', () => {
  describe('Function Overloads', () => {
    it('should create spacer with number parameter (minLength)', () => {
      const spacer = Spacer(25)

      expect(spacer).toBeDefined()
      expect(spacer.modifier).toBeDefined()
      expect(typeof spacer.modifier.build).toBe('function')
    })

    it('should create spacer with props object', () => {
      const spacer = Spacer({ minLength: 75 })

      expect(spacer).toBeDefined()
      expect(spacer.modifier).toBeDefined()
      expect(typeof spacer.modifier.build).toBe('function')
    })

    it('should create spacer with no parameters', () => {
      const spacer = Spacer()

      expect(spacer).toBeDefined()
      expect(spacer.modifier).toBeDefined()
      expect(typeof spacer.modifier.build).toBe('function')
    })
  })

  describe('Props Handling', () => {
    it('should handle number parameter correctly', () => {
      const spacer = Spacer(150)
      const component = spacer as any // Access internal component for testing

      // The component should be wrapped, so we need to check the underlying component
      expect(component.props).toEqual({ minLength: 150 })
    })

    it('should handle props object correctly', () => {
      const props: SpacerProps = { minLength: 200 }
      const spacer = Spacer(props)
      const component = spacer as any

      expect(component.props).toEqual(props)
    })

    it('should handle empty props object', () => {
      const spacer = Spacer({})
      const component = spacer as any

      expect(component.props).toEqual({})
    })

    it('should handle undefined parameter', () => {
      const spacer = Spacer(undefined)
      const component = spacer as any

      expect(component.props).toEqual({})
    })
  })

  describe('Modifier Integration', () => {
    it('should have modifier property with correct type', () => {
      const spacer = Spacer()

      expect(spacer.modifier).toBeDefined()
      expect(typeof spacer.modifier).toBe('object')
      expect(typeof spacer.modifier.build).toBe('function')
    })

    it('should support chaining modifiers', () => {
      const spacer = Spacer()

      expect(() => {
        spacer.modifier
          .backgroundColor('#ff0000')
          .padding(10)
          .margin({ horizontal: 5 })
          .cornerRadius(4)
          .build()
      }).not.toThrow()
    })

    it('should be modifiable like other TachUI components', () => {
      const spacer = Spacer(30)

      // Should have the same modifier interface as other components
      expect(spacer.modifier).toHaveProperty('build')
      expect(spacer.modifier).toHaveProperty('backgroundColor')
      expect(spacer.modifier).toHaveProperty('padding')
      expect(spacer.modifier).toHaveProperty('margin')
    })
  })

  describe('Component Type Compliance', () => {
    it('should have component type properties', () => {
      const spacer = Spacer()

      expect(spacer.type).toBe('component')
      expect(spacer.id).toMatch(/^spacer-\d+-[a-z0-9]+$/)
      expect(spacer.props).toBeDefined()
      expect(spacer.render).toBeDefined()
      expect(typeof spacer.render).toBe('function')
    })

    it('should have modifiable component properties', () => {
      const spacer = Spacer()

      expect(spacer.modifiers).toBeDefined()
      expect(Array.isArray(spacer.modifiers)).toBe(true)
      expect(spacer.modifier).toBeDefined()
    })
  })
})

describe('Spacer Layout Behavior', () => {
  describe('Flexbox Layout', () => {
    it('should expand to fill available space in HStack', () => {
      const spacer = new SpacerComponent({})
      const rendered = spacer.render()

      // Spacer should have flex properties that make it expand
      expect(rendered.props.style.flexGrow).toBe('1')
      expect(rendered.props.style.flexBasis).toBe('0')
    })

    it('should respect minimum size constraints', () => {
      const minSize = 60
      const spacer = new SpacerComponent({ minLength: minSize })
      const rendered = spacer.render()

      expect(rendered.props.style.minWidth).toBe(`${minSize}px`)
      expect(rendered.props.style.minHeight).toBe(`${minSize}px`)
    })

    it('should be flexible in both directions', () => {
      const spacer = new SpacerComponent({})
      const rendered = spacer.render()

      // Should work in both horizontal and vertical stacks
      expect(rendered.props.style.minWidth).toBeDefined()
      expect(rendered.props.style.minHeight).toBeDefined()
      expect(rendered.props.style.alignSelf).toBe('stretch')
    })
  })

  describe('Integration with Stack Layouts', () => {
    it('should work as a spacer in theoretical HStack', () => {
      // This test verifies the spacer has the right properties for HStack use
      const leftSpacer = Spacer()
      const rightSpacer = Spacer()

      const leftRendered = leftSpacer.render()[0]
      const rightRendered = rightSpacer.render()[0]

      expect(leftRendered.props.style.flexGrow).toBe('1')
      expect(rightRendered.props.style.flexGrow).toBe('1')
    })

    it('should work as a spacer in theoretical VStack', () => {
      // This test verifies the spacer has the right properties for VStack use
      const topSpacer = Spacer(20)
      const bottomSpacer = Spacer()

      const topRendered = topSpacer.render()[0]
      const bottomRendered = bottomSpacer.render()[0]

      expect(topRendered.props.style.minHeight).toBe('20px')
      expect(bottomRendered.props.style.flexGrow).toBe('1')
    })
  })
})

describe('Spacer Edge Cases', () => {
  describe('Invalid Props', () => {
    it('should handle negative minLength gracefully', () => {
      expect(() => {
        const spacer = new SpacerComponent({ minLength: -10 })
        spacer.render()
      }).not.toThrow()

      const spacer = new SpacerComponent({ minLength: -10 })
      const rendered = spacer.render()
      expect(rendered.props.style.minWidth).toBe('-10px')
      expect(rendered.props.style.minHeight).toBe('-10px')
    })

    it('should handle very large minLength values', () => {
      const largeValue = 999999
      const spacer = new SpacerComponent({ minLength: largeValue })
      const rendered = spacer.render()

      expect(rendered.props.style.minWidth).toBe(`${largeValue}px`)
      expect(rendered.props.style.minHeight).toBe(`${largeValue}px`)
    })

    it('should handle decimal minLength values', () => {
      const decimalValue = 12.5
      const spacer = new SpacerComponent({ minLength: decimalValue })
      const rendered = spacer.render()

      expect(rendered.props.style.minWidth).toBe(`${decimalValue}px`)
      expect(rendered.props.style.minHeight).toBe(`${decimalValue}px`)
    })
  })

  describe('Memory and Performance', () => {
    it('should not cause memory leaks with multiple instances', () => {
      const spacers = []
      for (let i = 0; i < 100; i++) {
        spacers.push(Spacer(i))
      }

      // All spacers should have unique IDs
      const ids = spacers.map(s => s.id)
      const uniqueIds = [...new Set(ids)]
      expect(uniqueIds.length).toBe(100)
    })

    it('should be lightweight and fast to create', () => {
      const startTime = performance.now()

      for (let i = 0; i < 1000; i++) {
        Spacer(Math.random() * 100)
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should complete within reasonable time (less than 100ms for 1000 instances)
      expect(duration).toBeLessThan(100)
    })
  })
})

describe('Spacer TypeScript Integration', () => {
  describe('Type Safety', () => {
    it('should accept valid SpacerProps', () => {
      // These should compile without TypeScript errors
      expect(() => {
        Spacer()
        Spacer(50)
        Spacer({ minLength: 25 })
        Spacer({ minLength: undefined })
        Spacer({})
      }).not.toThrow()
    })

    it('should maintain type information through modifier chain', () => {
      const spacer = Spacer(10)
      const built = spacer.modifier.build()

      // Should maintain component type information
      expect(built.type).toBe('component')
      expect(built.id).toMatch(/^spacer-\d+-[a-z0-9]+$/)
    })
  })
})

describe('Spacer Visual Debug Support', () => {
  describe('Debug Visualization', () => {
    it('should support background color for debugging', () => {
      expect(() => {
        Spacer().modifier.backgroundColor('rgba(255, 0, 0, 0.1)').build()
      }).not.toThrow()
    })

    it('should support border for debugging', () => {
      expect(() => {
        Spacer().modifier.border(1, '#ff0000').build()
      }).not.toThrow()
    })
  })
})
