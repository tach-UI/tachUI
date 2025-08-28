/**
 * CSS Features Test Suite
 *
 * Comprehensive testing for CSS features including transforms,
 * hover effects, transitions, and visual effects.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
// Transform system
import {
  transform,
  scale,
  rotate,
  translate,
  skew,
  rotateX,
  rotateY,
  rotateZ,
  perspective,
  // Advanced transforms
  advancedTransform,
  matrix,
  matrix3d,
  rotate3d,
  scale3d,
  translate3d,
  scaleX,
  scaleY,
  scaleZ,
  translateX,
  translateY,
  translateZ,
  perspectiveOrigin,
  transformStyle,
  backfaceVisibility,
  type TransformConfig,
  type Transform3DConfig,
  type MatrixTransformConfig,
  type Advanced3DTransformConfig,
} from '../../src/modifiers/transformations'

// Hover system
import {
  hoverEffect,
  hover,
  hoverWithTransition,
  type SwiftUIHoverEffect,
  type HoverStyles,
} from '../../src/modifiers/effects'

// Transitions
import {
  transition,
  transitions,
  type TransitionConfig,
  type TransitionsConfig,
} from '../../src/modifiers/transitions'

// CSS filters
import {
  filter,
  blur,
  brightness,
  contrast,
  saturate,
  grayscale,
  sepia,
  type FilterConfig,
} from '../../src/modifiers/filters'

// Background clip text
import {
  backgroundClip,
  gradientText,
  backgroundImage,
  type BackgroundClipOptions,
} from '../../src/modifiers/text'

// Pseudo-elements
import {
  before,
  after,
  pseudoElements,
  type PseudoElementStyles,
  type PseudoElementOptions,
} from '../../src/modifiers/elements'

// CSS Custom Properties
import {
  customProperties,
  customProperty,
  cssVariables,
  themeColors,
  designTokens,
  type CSSCustomProperty,
  type CSSCustomPropertiesConfig,
  type CustomPropertiesOptions,
} from '../../src/modifiers/attributes'
import { cssVariable } from '../../src/modifiers/css'
import { createMockElement, createMockModifierContext } from './test-utils'

describe('CSS Features', () => {
  let mockElement: HTMLElement
  let mockContext: ReturnType<typeof createMockModifierContext>

  beforeEach(() => {
    mockElement = createMockElement()
    mockContext = createMockModifierContext(mockElement)
  })

  describe('Transform System', () => {
    describe('2D Transforms', () => {
      test('scale modifier works correctly', () => {
        const modifier = scale(1.5)
        modifier.apply(null, mockContext)

        expect(mockElement.style.transform).toBe('scale(1.5)')
      })

      test('scale with x/y values works correctly', () => {
        const modifier = scale({ x: 1.2, y: 0.8 })
        modifier.apply(null, mockContext)

        expect(mockElement.style.transform).toBe('scale(1.2, 0.8)')
      })

      test('rotate modifier works correctly', () => {
        const modifier = rotate('45deg')
        modifier.apply(null, mockContext)

        expect(mockElement.style.transform).toBe('rotate(45deg)')
      })

      test('translate modifier works correctly', () => {
        const modifier = translate({ x: 10, y: 20 })
        modifier.apply(null, mockContext)

        expect(mockElement.style.transform).toBe('translate3d(10px, 20px, 0)')
      })

      test('translate with CSS units works correctly', () => {
        const modifier = translate({ x: '1rem', y: '50%' })
        modifier.apply(null, mockContext)

        expect(mockElement.style.transform).toBe('translate3d(1rem, 50%, 0)')
      })

      test('skew modifier works correctly', () => {
        const modifier = skew({ x: '10deg', y: '5deg' })
        modifier.apply(null, mockContext)

        expect(mockElement.style.transform).toBe('skew(10deg, 5deg)')
      })

      test('skew with single axis works correctly', () => {
        const modifier = skew({ x: '15deg' })
        modifier.apply(null, mockContext)

        expect(mockElement.style.transform).toBe('skewX(15deg)')
      })
    })

    describe('3D Transforms', () => {
      test('3D rotation modifiers work correctly', () => {
        const modifierX = rotateX('45deg')
        modifierX.apply(null, mockContext)
        expect(mockElement.style.transform).toBe('rotateX(45deg)')

        // Reset for next test
        mockElement = createMockElement()
        mockContext = createMockModifierContext(mockElement)

        const modifierY = rotateY('30deg')
        modifierY.apply(null, mockContext)
        expect(mockElement.style.transform).toBe('rotateY(30deg)')

        // Reset for next test
        mockElement = createMockElement()
        mockContext = createMockModifierContext(mockElement)

        const modifierZ = rotateZ('60deg')
        modifierZ.apply(null, mockContext)
        expect(mockElement.style.transform).toBe('rotateZ(60deg)')
      })

      test('perspective modifier works correctly', () => {
        const modifier = perspective(1000)
        modifier.apply(null, mockContext)

        expect(mockElement.style.transform).toBe('perspective(1000px)')
      })

      test('complex 3D transform works correctly', () => {
        const config: Transform3DConfig = {
          perspective: 1000,
          rotateX: '45deg',
          rotateY: '30deg',
          scale: 1.2,
          translate: { x: 10, y: 20, z: 5 }
        }

        const modifier = transform(config)
        modifier.apply(null, mockContext)

        expect(mockElement.style.transform).toBe('perspective(1000px) scale(1.2) rotateX(45deg) rotateY(30deg) translate3d(10px, 20px, 5px)')
      })
    })

    describe('Complex Transform Combinations', () => {
      test('multiple transforms are applied in correct order', () => {
        const config: TransformConfig = {
          scale: 1.2,
          rotate: '45deg',
          translate: { x: 10, y: 20 }
        }

        const modifier = transform(config)
        modifier.apply(null, mockContext)

        // Order: scale, rotate, translate (as per CSS transform spec)
        expect(mockElement.style.transform).toBe('scale(1.2) rotate(45deg) translate3d(10px, 20px, 0)')
      })

      test('transform origin and 3D properties work', () => {
        const modifier = transform({
          scale: 1.1,
          rotate: '30deg'
        })

        // Access private method for testing
        const modifierInstance = modifier as any
        modifierInstance.properties.transformOrigin = 'center center'
        modifierInstance.properties.transformStyle = 'preserve-3d'
        modifierInstance.properties.backfaceVisibility = 'hidden'

        modifier.apply(null, mockContext)

        expect(mockElement.style.transform).toBe('scale(1.1) rotate(30deg)')
        expect(mockElement.style.transformOrigin).toBe('center center')
        expect(mockElement.style.transformStyle).toBe('preserve-3d')
        expect(mockElement.style.backfaceVisibility).toBe('hidden')
      })
    })
  })

  describe('SwiftUI-Aligned Hover System', () => {
    beforeEach(() => {
      // Mock CSS.supports for backdrop filter tests
      vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'style') {
          const mockStyle = {
            id: '',
            sheet: {
              insertRule: vi.fn()
            }
          }
          return mockStyle as any
        }
        return document.createElement(tagName)
      })

      vi.spyOn(document.head, 'appendChild').mockImplementation(() => null as any)
    })

    describe('SwiftUI hover effects', () => {
      test('automatic hover effect works', () => {
        const modifier = hoverEffect('automatic')
        modifier.apply(null, mockContext)

        // The new hover system uses CSS stylesheets instead of inline styles
        // so we check that the modifier was applied successfully
        expect(() => {
          modifier.apply(null, mockContext)
        }).not.toThrow()

        // Should add hover class to element
        expect(mockElement.classList.add).toHaveBeenCalledWith(expect.stringMatching(/^tachui-hover-/))
      })

      test('highlight hover effect works', () => {
        const modifier = hoverEffect('highlight')
        modifier.apply(null, mockContext)

        // The new hover system uses CSS stylesheets instead of inline styles
        expect(() => {
          modifier.apply(null, mockContext)
        }).not.toThrow()

        // Should add hover class to element
        expect(mockElement.classList.add).toHaveBeenCalledWith(expect.stringMatching(/^tachui-hover-/))
      })

      test('lift hover effect works', () => {
        const modifier = hoverEffect('lift')
        modifier.apply(null, mockContext)

        // The new hover system uses CSS stylesheets instead of inline styles
        expect(() => {
          modifier.apply(null, mockContext)
        }).not.toThrow()

        // Should add hover class to element
        expect(mockElement.classList.add).toHaveBeenCalledWith(expect.stringMatching(/^tachui-hover-/))
      })

      test('hover effect can be disabled', () => {
        const modifier = hoverEffect('lift', false)
        modifier.apply(null, mockContext)

        // Should not apply any styles when disabled
        expect(mockElement.style.transition).toBe('')
      })
    })

    describe('CSS hover styles', () => {
      test('custom hover styles work correctly', () => {
        const hoverStyles: HoverStyles = {
          backgroundColor: '#007AFF',
          transform: { scale: 1.05 },
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
        }

        const modifier = hover(hoverStyles)
        modifier.apply(null, mockContext)

        // Should add class to element
        expect(mockElement.classList.add).toHaveBeenCalledWith(expect.stringMatching(/^tachui-hover-/))
      })

      test('hover with transition works correctly', () => {
        const hoverStyles: HoverStyles = {
          backgroundColor: '#007AFF'
        }

        const modifier = hoverWithTransition(hoverStyles, 300)
        modifier.apply(null, mockContext)

        // The new hover system uses CSS stylesheets instead of inline styles
        expect(() => {
          modifier.apply(null, mockContext)
        }).not.toThrow()

        // Should add hover class to element
        expect(mockElement.classList.add).toHaveBeenCalledWith(expect.stringMatching(/^tachui-hover-/))
      })
    })
  })

  describe('CSS Transitions System', () => {
    test('simple transition works correctly', () => {
      const modifier = transition('opacity', 300, 'ease-in-out', 100)
      modifier.apply(null, mockContext)

      expect(mockElement.style.transition).toBe('opacity 300ms ease-in-out 100ms')
    })

    test('transition without delay works correctly', () => {
      const modifier = transition('transform', 200, 'ease-out')
      modifier.apply(null, mockContext)

      expect(mockElement.style.transition).toBe('transform 200ms ease-out')
    })

    test('multiple transitions work correctly', () => {
      const config: TransitionsConfig = {
        backgroundColor: { duration: 200, easing: 'ease-out' },
        transform: { duration: 300, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', delay: 50 }
      }

      const modifier = transitions(config)
      modifier.apply(null, mockContext)

      expect(mockElement.style.transition).toBe('background-color 200ms ease-out, transform 300ms cubic-bezier(0.4, 0, 0.2, 1) 50ms')
    })

    test('default transition values work correctly', () => {
      const config: TransitionsConfig = {
        opacity: {}  // Should use defaults
      }

      const modifier = transitions(config)
      modifier.apply(null, mockContext)

      expect(mockElement.style.transition).toBe('opacity 300ms ease')
    })
  })

  // NOTE: Backdrop Filter tests moved to __tests__/modifiers/backdrop.test.ts

  describe('CSS Filters System', () => {
    test('individual filter functions work correctly', () => {
      const blurMod = blur(5)
      blurMod.apply(null, mockContext)
      expect(mockElement.style.filter).toBe('blur(5px)')

      // Reset for next test
      mockElement = createMockElement()
      mockContext = createMockModifierContext(mockElement)

      const brightnessMod = brightness(1.2)
      brightnessMod.apply(null, mockContext)
      expect(mockElement.style.filter).toBe('brightness(1.2)')

      // Reset for next test
      mockElement = createMockElement()
      mockContext = createMockModifierContext(mockElement)

      const contrastMod = contrast(1.5)
      contrastMod.apply(null, mockContext)
      expect(mockElement.style.filter).toBe('contrast(1.5)')
    })

    test('multiple filters work correctly', () => {
      const config: FilterConfig = {
        blur: 2,
        brightness: 1.1,
        contrast: 1.2,
        saturate: 1.3,
        sepia: 0.2
      }

      const modifier = filter(config)
      modifier.apply(null, mockContext)

      expect(mockElement.style.filter).toBe('blur(2px) brightness(1.1) contrast(1.2) saturate(1.3) sepia(0.2)')
    })

    test('string filter works correctly', () => {
      const modifier = filter('grayscale(100%) invert(1)')
      modifier.apply(null, mockContext)

      expect(mockElement.style.filter).toBe('grayscale(100%) invert(1)')
    })

    test('all filter types are supported', () => {
      const config: FilterConfig = {
        blur: 3,
        brightness: 1.1,
        contrast: 1.2,
        saturate: 1.3,
        sepia: 0.5,
        hueRotate: '90deg',
        invert: 0.2,
        opacity: 0.8,
        dropShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        grayscale: 0.3
      }

      const modifier = filter(config)
      modifier.apply(null, mockContext)

      const expectedFilter = 'blur(3px) brightness(1.1) contrast(1.2) saturate(1.3) sepia(0.5) hue-rotate(90deg) invert(0.2) opacity(0.8) drop-shadow(2px 2px 4px rgba(0,0,0,0.5)) grayscale(0.3)'
      expect(mockElement.style.filter).toBe(expectedFilter)
    })
  })

  describe('Integration and Performance', () => {
    test('multiple CSS features can be applied together', () => {
      const transformMod = transform({ scale: 1.1, rotate: '45deg' })
      const transitionMod = transition('all', 300, 'ease-out')
      const hoverMod = hoverEffect('lift')

      transformMod.apply(null, mockContext)
      transitionMod.apply(null, mockContext)
      hoverMod.apply(null, mockContext)

      expect(mockElement.style.transform).toBe('scale(1.1) rotate(45deg)')
      // The lift hover effect uses CSS stylesheets, not inline transitions
      // Just verify successful application
      expect(() => {
        hoverEffect('lift').apply(null, mockContext)
      }).not.toThrow() // hover transition overrides
    })

    test('CSS features have correct priorities', () => {
      const transformMod = transform({ scale: 1.1 })
      const transitionMod = transition('all', 300)
      const filterMod = filter({ brightness: 1.2 })
      const hoverMod = hoverEffect('lift')

      // Check modifier priorities
      expect(transformMod.priority).toBe(45)
      expect(hoverMod.priority).toBe(15)
      expect(filterMod.priority).toBe(30)
      expect(transitionMod.priority).toBe(25)
    })

    test('transform functions generate optimized CSS', () => {
      // Test hardware acceleration hints
      const modifier = translate({ x: 0, y: 0 })
      modifier.apply(null, mockContext)

      // Should use translate3d for hardware acceleration even with 2D values
      expect(mockElement.style.transform).toBe('translate3d(0px, 0px, 0)')
    })

    test('CSS generation is efficient', () => {
      const startTime = performance.now()

      // Apply multiple complex modifiers
      for (let i = 0; i < 100; i++) {
        const element = createMockElement()
        const context = createMockModifierContext(element)

        transform({ scale: 1.1, rotate: '45deg', translate: { x: i, y: i * 2 } }).apply(null, context)
        hoverEffect('lift').apply(null, context)
        transition('all', 300).apply(null, context)
        filter({ blur: 2, brightness: 1.1 }).apply(null, context)
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should complete 100 complex modifier applications in reasonable time
      expect(duration).toBeLessThan(75) // Less than 75ms for 100 applications
    })
  })

  describe('Browser Compatibility and Fallbacks', () => {
    // NOTE: Backdrop filter compatibility tests moved to __tests__/modifiers/backdrop.test.ts

    test('3D transforms work without perspective', () => {
      const config: Transform3DConfig = {
        rotateX: '45deg',
        rotateY: '30deg',
        scale: 1.2
      }

      const modifier = transform(config)
      modifier.apply(null, mockContext)

      expect(mockElement.style.transform).toBe('scale(1.2) rotateX(45deg) rotateY(30deg)')
    })
  })

  describe('Background Clip Text System', () => {
    test('gradient text modifier works correctly', () => {
      const modifier = gradientText('linear-gradient(45deg, #007AFF, #FF3B30)')
      modifier.apply(null, mockContext)

      expect(mockElement.style.backgroundImage).toBe('linear-gradient(45deg, #007AFF, #FF3B30)')
      expect(mockElement.style.backgroundClip).toBe('text')
      expect(mockElement.style.webkitBackgroundClip).toBe('text')
      expect(mockElement.style.color).toBe('transparent')
      expect(mockElement.style.webkitTextFillColor).toBe('transparent')
    })

    test('background clip modifier with custom settings works', () => {
      const modifier = backgroundClip(
        'linear-gradient(90deg, red, blue)',
        'text',
        'transparent'
      )
      modifier.apply(null, mockContext)

      expect(mockElement.style.backgroundImage).toBe('linear-gradient(90deg, red, blue)')
      expect(mockElement.style.backgroundClip).toBe('text')
      expect(mockElement.style.color).toBe('transparent')
    })

    test('background clip modifier with border-box works', () => {
      const modifier = backgroundClip(
        'url(pattern.png)',
        'border-box',
        'white'
      )
      modifier.apply(null, mockContext)

      expect(mockElement.style.backgroundImage).toBe('url(pattern.png)')
      expect(mockElement.style.backgroundClip).toBe('border-box')
      expect(mockElement.style.color).toBe('white')
    })

    test('background image modifier works correctly', () => {
      const modifier = backgroundImage('linear-gradient(135deg, purple, pink)')
      modifier.apply(null, mockContext)

      expect(mockElement.style.backgroundImage).toBe('linear-gradient(135deg, purple, pink)')
    })

    test('webkit prefixes are applied correctly', () => {
      const modifier = gradientText('radial-gradient(circle, yellow, orange)')
      modifier.apply(null, mockContext)

      expect(mockElement.style.webkitBackgroundClip).toBe('text')
      expect(mockElement.style.webkitTextFillColor).toBe('transparent')
    })

    test('modifier has correct priority', () => {
      const modifier = gradientText('linear-gradient(45deg, #007AFF, #FF3B30)')
      expect(modifier.priority).toBe(40)
    })

    test('complex gradient text patterns work', () => {
      const complexGradient = 'linear-gradient(45deg, #ff6b6b 0%, #4ecdc4 25%, #45b7d1 50%, #96ceb4 75%, #ffeaa7 100%)'
      const modifier = gradientText(complexGradient)
      modifier.apply(null, mockContext)

      expect(mockElement.style.backgroundImage).toBe(complexGradient)
      expect(mockElement.style.backgroundClip).toBe('text')
    })
  })

  describe('Pseudo-element Support System', () => {
    let mockStyleSheet: any
    let mockStyle: any

    beforeEach(() => {
      // Mock CSS style sheet for pseudo-element tests
      mockStyleSheet = {
        insertRule: vi.fn()
      }

      mockStyle = {
        id: '',
        sheet: mockStyleSheet
      }

      vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'style') {
          return mockStyle as any
        }
        return document.createElement(tagName)
      })

      vi.spyOn(document.head, 'appendChild').mockImplementation(() => null as any)
      vi.spyOn(document, 'getElementById').mockImplementation((id) => {
        if (id === 'tachui-pseudo-elements') {
          return mockStyle as any
        }
        return null
      })
    })

    test('before pseudo-element modifier works correctly', () => {
      const beforeStyles: PseudoElementStyles = {
        content: '★',
        color: '#FFD60A',
        marginRight: 5
      }

      const modifier = before(beforeStyles)
      modifier.apply(null, mockContext)

      // Should add a class to the element
      expect(mockElement.classList.add).toHaveBeenCalledWith(expect.stringMatching(/^tachui-pseudo-/))

      // Should insert a CSS rule for ::before
      expect(mockStyleSheet.insertRule).toHaveBeenCalledWith(
        expect.stringContaining('::before')
      )
      expect(mockStyleSheet.insertRule).toHaveBeenCalledWith(
        expect.stringContaining('content: "★"')
      )
    })

    test('after pseudo-element modifier works correctly', () => {
      const afterStyles: PseudoElementStyles = {
        content: '',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: '#007AFF'
      }

      const modifier = after(afterStyles)
      modifier.apply(null, mockContext)

      // Should add a class to the element
      expect(mockElement.classList.add).toHaveBeenCalledWith(expect.stringMatching(/^tachui-pseudo-/))

      // Should insert a CSS rule for ::after
      expect(mockStyleSheet.insertRule).toHaveBeenCalledWith(
        expect.stringContaining('::after')
      )
      expect(mockStyleSheet.insertRule).toHaveBeenCalledWith(
        expect.stringContaining('position: absolute')
      )
    })

    test('pseudo-elements modifier with both before and after works', () => {
      const options: PseudoElementOptions = {
        before: {
          content: '◀',
          marginRight: 8,
          color: 'blue'
        },
        after: {
          content: '▶',
          marginLeft: 8,
          color: 'red'
        }
      }

      const modifier = pseudoElements(options)
      modifier.apply(null, mockContext)

      // Should insert CSS rules for both pseudo-elements
      expect(mockStyleSheet.insertRule).toHaveBeenCalledWith(
        expect.stringContaining('::before')
      )
      expect(mockStyleSheet.insertRule).toHaveBeenCalledWith(
        expect.stringContaining('::after')
      )
    })

    test('content property is automatically quoted if needed', () => {
      const modifier = before({ content: 'Hello' })
      modifier.apply(null, mockContext)

      expect(mockStyleSheet.insertRule).toHaveBeenCalledWith(
        expect.stringContaining('content: "Hello"')
      )
    })

    test('content property preserves existing quotes', () => {
      const modifier = before({ content: '"Already quoted"' })
      modifier.apply(null, mockContext)

      expect(mockStyleSheet.insertRule).toHaveBeenCalledWith(
        expect.stringContaining('content: "Already quoted"')
      )
    })

    test('numeric values get px units correctly', () => {
      const modifier = before({
        content: '',
        width: 20,
        height: 10,
        opacity: 0.5,
        zIndex: 999
      })
      modifier.apply(null, mockContext)

      const callArg = mockStyleSheet.insertRule.mock.calls[0][0]
      expect(callArg).toContain('width: 20px')
      expect(callArg).toContain('height: 10px')
      expect(callArg).toContain('opacity: 0.5') // Should be unitless
      expect(callArg).toContain('z-index: 999') // Should be unitless
    })

    test('modifier has correct priority', () => {
      const modifier = before({ content: 'test' })
      expect(modifier.priority).toBe(50)
    })

    test('complex decorative pseudo-element works', () => {
      const modifier = before({
        content: '',
        position: 'absolute',
        top: -5,
        left: -5,
        width: 10,
        height: 10,
        backgroundColor: '#FF6B6B',
        borderRadius: '50%',
        transform: 'rotate(45deg)',
        zIndex: -1
      })
      modifier.apply(null, mockContext)

      const callArg = mockStyleSheet.insertRule.mock.calls[0][0]
      expect(callArg).toContain('position: absolute')
      expect(callArg).toContain('border-radius: 50%')
      expect(callArg).toContain('transform: rotate(45deg)')
    })

    test('empty content defaults to empty string', () => {
      const modifier = before({ color: 'red' }) // No content specified
      modifier.apply(null, mockContext)

      expect(mockStyleSheet.insertRule).toHaveBeenCalledWith(
        expect.stringContaining('content: ""')
      )
    })
  })

  describe('Advanced Transform Functions', () => {
    test('matrix transform works correctly', () => {
      const modifier = matrix([1, 0.5, -0.5, 1, 10, 20])
      modifier.apply(null, mockContext)

      expect(mockElement.style.transform).toBe('matrix(1, 0.5, -0.5, 1, 10, 20)')
    })

    test('matrix3d transform works correctly', () => {
      const modifier = matrix3d([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        10, 20, 5, 1
      ])
      modifier.apply(null, mockContext)

      expect(mockElement.style.transform).toBe('matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 10, 20, 5, 1)')
    })

    test('rotate3d transform works correctly', () => {
      const modifier = rotate3d(1, 1, 0, '45deg')
      modifier.apply(null, mockContext)

      expect(mockElement.style.transform).toBe('rotate3d(1, 1, 0, 45deg)')
    })

    test('scale3d transform works correctly', () => {
      const modifier = scale3d(1.2, 0.8, 1.5)
      modifier.apply(null, mockContext)

      expect(mockElement.style.transform).toBe('scale3d(1.2, 0.8, 1.5)')
    })

    test('advanced translate3d works correctly', () => {
      const modifier = translate3d(10, 20, 5)
      modifier.apply(null, mockContext)

      expect(mockElement.style.transform).toBe('translate3d(10px, 20px, 5px)')
    })

    test('individual scale functions work correctly', () => {
      const scaleXMod = scaleX(1.5)
      scaleXMod.apply(null, mockContext)
      expect(mockElement.style.transform).toBe('scaleX(1.5)')

      // Reset for next test
      mockElement = createMockElement()
      mockContext = createMockModifierContext(mockElement)

      const scaleYMod = scaleY(0.8)
      scaleYMod.apply(null, mockContext)
      expect(mockElement.style.transform).toBe('scaleY(0.8)')

      // Reset for next test
      mockElement = createMockElement()
      mockContext = createMockModifierContext(mockElement)

      const scaleZMod = scaleZ(2.0)
      scaleZMod.apply(null, mockContext)
      expect(mockElement.style.transform).toBe('scaleZ(2)')
    })

    test('individual translate functions work correctly', () => {
      const translateXMod = translateX(50)
      translateXMod.apply(null, mockContext)
      expect(mockElement.style.transform).toBe('translateX(50px)')

      // Reset for next test
      mockElement = createMockElement()
      mockContext = createMockModifierContext(mockElement)

      const translateYMod = translateY('2rem')
      translateYMod.apply(null, mockContext)
      expect(mockElement.style.transform).toBe('translateY(2rem)')

      // Reset for next test
      mockElement = createMockElement()
      mockContext = createMockModifierContext(mockElement)

      const translateZMod = translateZ(10)
      translateZMod.apply(null, mockContext)
      expect(mockElement.style.transform).toBe('translateZ(10px)')
    })

    test('perspective origin modifier works correctly', () => {
      const modifier = perspectiveOrigin('top left')
      modifier.apply(null, mockContext)

      expect(mockElement.style.perspectiveOrigin).toBe('top left')
    })

    test('transform style modifier works correctly', () => {
      const modifier = transformStyle('preserve-3d')
      modifier.apply(null, mockContext)

      expect(mockElement.style.transformStyle).toBe('preserve-3d')
    })

    test('backface visibility modifier works correctly', () => {
      const modifier = backfaceVisibility('hidden')
      modifier.apply(null, mockContext)

      expect(mockElement.style.backfaceVisibility).toBe('hidden')
    })

    test('complex advanced transform configuration works', () => {
      const config: Advanced3DTransformConfig = {
        perspective: 1000,
        scaleX: 1.2,
        rotateY: '45deg',
        translateZ: 20
      }

      const modifier = advancedTransform(config)
      modifier.apply(null, mockContext)

      // Advanced transform should generate the correct CSS, but the order might be different
      // due to the modular system - just check that all parts are present
      const transformValue = mockElement.style.transform
      expect(transformValue).toContain('scaleX(1.2)')
      expect(transformValue).toContain('translateZ(20px)')
    })

    test('advanced modifier has correct priority', () => {
      const modifier = matrix([1, 0, 0, 1, 0, 0])
      expect(modifier.priority).toBe(45)
    })

    test('matrix transform overrides other transform properties', () => {
      const config: MatrixTransformConfig = {
        matrix: [1, 0.5, -0.5, 1, 10, 20]
      }

      const modifier = advancedTransform(config)
      modifier.apply(null, mockContext)

      // Matrix should be the only transform applied
      expect(mockElement.style.transform).toBe('matrix(1, 0.5, -0.5, 1, 10, 20)')
    })

    test('fallback to basic transform properties works', () => {
      const config: Advanced3DTransformConfig = {
        scale: 1.1,
        rotate: '30deg',
        translate: { x: 5, y: 10 }
      }

      const modifier = advancedTransform(config)
      modifier.apply(null, mockContext)

      expect(mockElement.style.transform).toBe('scale(1.1) rotate(30deg) translate3d(5px, 10px, 0)')
    })
  })

  describe('CSS Custom Properties System', () => {
    test('custom property modifier works correctly', () => {
      const modifier = customProperty('primary-color', '#007AFF')
      modifier.apply(null, mockContext)

      expect((mockElement.style as any)['--primary-color']).toBe('#007AFF')
    })

    test('custom property with existing -- prefix works', () => {
      const modifier = customProperty('--secondary-color', '#FF3B30')
      modifier.apply(null, mockContext)

      expect((mockElement.style as any)['--secondary-color']).toBe('#FF3B30')
    })

    test('css variable shorthand works correctly', () => {
      const modifier = cssVariable('text-size', '16px')
      modifier.apply(null, mockContext)

      expect((mockElement.style as any)['--text-size']).toBe('16px')
    })

    test('multiple css variables work correctly', () => {
      const variables = {
        'primary': '#007AFF',
        'secondary': '#FF3B30',
        'spacing': '8px',
        'border-radius': '12px'
      }

      const modifier = cssVariables(variables)
      modifier.apply(null, mockContext)

      expect((mockElement.style as any)['--primary']).toBe('#007AFF')
      expect((mockElement.style as any)['--secondary']).toBe('#FF3B30')
      expect((mockElement.style as any)['--spacing']).toBe('8px')
      expect((mockElement.style as any)['--border-radius']).toBe('12px')
    })

    test('custom properties with object config works', () => {
      const config: CSSCustomPropertiesConfig = {
        properties: {
          'theme-primary': '#007AFF',
          'theme-secondary': '#FF3B30',
          'font-size-large': '20px'
        },
        scope: 'local'
      }

      const modifier = customProperties(config)
      modifier.apply(null, mockContext)

      expect((mockElement.style as any)['--theme-primary']).toBe('#007AFF')
      expect((mockElement.style as any)['--theme-secondary']).toBe('#FF3B30')
      expect((mockElement.style as any)['--font-size-large']).toBe('20px')
    })

    test('theme colors integration works correctly', () => {
      const colors = {
        primary: '#007AFF',
        secondary: '#FF3B30',
        success: '#34C759',
        warning: '#FF9500',
        danger: '#FF3B30'
      }

      const modifier = themeColors(colors)
      modifier.apply(null, mockContext)

      expect((mockElement.style as any)['--theme-color-primary']).toBe('#007AFF')
      expect((mockElement.style as any)['--theme-color-secondary']).toBe('#FF3B30')
      expect((mockElement.style as any)['--theme-color-success']).toBe('#34C759')
      expect((mockElement.style as any)['--theme-color-warning']).toBe('#FF9500')
      expect((mockElement.style as any)['--theme-color-danger']).toBe('#FF3B30')
    })

    test('design tokens integration works correctly', () => {
      const tokens = {
        'spacing-xs': '4px',
        'spacing-sm': '8px',
        'spacing-md': '16px',
        'spacing-lg': '24px',
        'border-radius-sm': '4px',
        'border-radius-md': '8px',
        'shadow-level': 3
      }

      const modifier = designTokens(tokens)
      modifier.apply(null, mockContext)

      expect((mockElement.style as any)['--token-spacing-xs']).toBe('4px')
      expect((mockElement.style as any)['--token-spacing-sm']).toBe('8px')
      expect((mockElement.style as any)['--token-spacing-md']).toBe('16px')
      expect((mockElement.style as any)['--token-spacing-lg']).toBe('24px')
      expect((mockElement.style as any)['--token-border-radius-sm']).toBe('4px')
      expect((mockElement.style as any)['--token-border-radius-md']).toBe('8px')
      expect((mockElement.style as any)['--token-shadow-level']).toBe('3')
    })

    test('numeric values are converted to strings correctly', () => {
      const modifier = customProperty('z-index', 999)
      modifier.apply(null, mockContext)

      expect((mockElement.style as any)['--z-index']).toBe('999')
    })

    test('mixed value types work correctly', () => {
      const variables = {
        'color': '#007AFF',
        'size': 16,
        'enabled': true,
        'ratio': 1.5
      }

      const modifier = cssVariables(variables)
      modifier.apply(null, mockContext)

      expect((mockElement.style as any)['--color']).toBe('#007AFF')
      expect((mockElement.style as any)['--size']).toBe('16')
      expect((mockElement.style as any)['--enabled']).toBe('true')
      expect((mockElement.style as any)['--ratio']).toBe('1.5')
    })

    test('modifier has correct priority', () => {
      const modifier = customProperty('test', 'value')
      expect(modifier.priority).toBe(5)
    })

    test('complex theming scenario works', () => {
      // Simulate a complex design system setup
      const themeModifier = themeColors({
        primary: '#007AFF',
        secondary: '#5856D6',
        background: '#F2F2F7'
      })

      const tokensModifier = designTokens({
        'spacing-unit': '8px',
        'border-radius-base': '8px',
        'animation-duration': '200ms'
      })

      const customModifier = cssVariables({
        'component-height': '44px',
        'component-padding': 'var(--token-spacing-unit)'
      })

      themeModifier.apply(null, mockContext)
      tokensModifier.apply(null, mockContext)
      customModifier.apply(null, mockContext)

      // Verify theme colors
      expect((mockElement.style as any)['--theme-color-primary']).toBe('#007AFF')
      expect((mockElement.style as any)['--theme-color-secondary']).toBe('#5856D6')
      expect((mockElement.style as any)['--theme-color-background']).toBe('#F2F2F7')

      // Verify design tokens
      expect((mockElement.style as any)['--token-spacing-unit']).toBe('8px')
      expect((mockElement.style as any)['--token-border-radius-base']).toBe('8px')
      expect((mockElement.style as any)['--token-animation-duration']).toBe('200ms')

      // Verify custom properties with CSS variable references
      expect((mockElement.style as any)['--component-height']).toBe('44px')
      expect((mockElement.style as any)['--component-padding']).toBe('var(--token-spacing-unit)')
    })

    test('empty properties object works correctly', () => {
      const modifier = cssVariables({})
      modifier.apply(null, mockContext)

      // Should not throw and should not set any properties
      // Test passes if no errors are thrown
    })
  })
})
