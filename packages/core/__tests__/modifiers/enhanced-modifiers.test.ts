/**
 * Enhanced Modifiers Test Suite
 *
 * Comprehensive testing for all enhanced modifiers including
 * backward compatibility validation and new features.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  cornerRadius,
  type CornerRadiusConfig,
} from '../../src/modifiers/border'

import {
  cursor,
} from '../../src/modifiers/effects'

import {
  shadow,
  shadows,
  textShadow,
  shadowPreset,
  createShadowPreset,
  type ShadowConfig,
} from '../../src/modifiers/shadows'

import {
  border,
  type BorderOptions,
} from '../../src/modifiers/border'

import {
  scroll,
  scrollBehavior,
  overscrollBehavior,
  type ScrollConfig,
} from '../../src/modifiers/scroll'
import { createMockElement, createMockModifierContext } from './test-utils'

describe('Enhanced Modifiers', () => {
  let mockElement: HTMLElement
  let mockContext: ReturnType<typeof createMockModifierContext>

  beforeEach(() => {
    mockElement = createMockElement()
    mockContext = createMockModifierContext(mockElement)
  })

  describe('cornerRadius Enhancement', () => {
    describe('backward compatibility', () => {
      test('single number value works unchanged', () => {
        const modifier = cornerRadius(10)
        modifier.apply(null, mockContext)
        
        expect(mockElement.style.borderRadius).toBe('10px')
      })

      test('string value works unchanged', () => {
        const modifier = cornerRadius('1rem')
        modifier.apply(null, mockContext)
        
        expect(mockElement.style.borderRadius).toBe('1rem')
      })
    })

    describe('object configuration', () => {
      test('individual corners work correctly', () => {
        const config: CornerRadiusConfig = {
          topLeft: 10,
          topRight: 5,
          bottomLeft: 8,
          bottomRight: 12
        }
        
        const modifier = cornerRadius(config)
        modifier.apply(null, mockContext)
        
        expect(mockElement.style.borderTopLeftRadius).toBe('10px')
        expect(mockElement.style.borderTopRightRadius).toBe('5px')
        expect(mockElement.style.borderBottomLeftRadius).toBe('8px')
        expect(mockElement.style.borderBottomRightRadius).toBe('12px')
      })

      test('SwiftUI alignment terminology works', () => {
        const config: CornerRadiusConfig = {
          topLeading: 10,
          topTrailing: 5,
          bottomLeading: 8,
          bottomTrailing: 12
        }
        
        const modifier = cornerRadius(config)
        modifier.apply(null, mockContext)
        
        expect(mockElement.style.borderTopLeftRadius).toBe('10px')    // topLeading
        expect(mockElement.style.borderTopRightRadius).toBe('5px')    // topTrailing
        expect(mockElement.style.borderBottomLeftRadius).toBe('8px')  // bottomLeading
        expect(mockElement.style.borderBottomRightRadius).toBe('12px') // bottomTrailing
      })

      test('shorthand properties work', () => {
        const config: CornerRadiusConfig = {
          top: 10,
          bottom: 5
        }
        
        const modifier = cornerRadius(config)
        modifier.apply(null, mockContext)
        
        expect(mockElement.style.borderTopLeftRadius).toBe('10px')
        expect(mockElement.style.borderTopRightRadius).toBe('10px')
        expect(mockElement.style.borderBottomLeftRadius).toBe('5px')
        expect(mockElement.style.borderBottomRightRadius).toBe('5px')
      })

      test('CSS units are supported', () => {
        const config: CornerRadiusConfig = {
          topLeft: '10px',
          topRight: '50%',
          bottomLeft: '2rem',
          bottomRight: '5vh'
        }
        
        const modifier = cornerRadius(config)
        modifier.apply(null, mockContext)
        
        expect(mockElement.style.borderTopLeftRadius).toBe('10px')
        expect(mockElement.style.borderTopRightRadius).toBe('50%')
        expect(mockElement.style.borderBottomLeftRadius).toBe('2rem')
        expect(mockElement.style.borderBottomRightRadius).toBe('5vh')
      })

      test('priority resolution works correctly', () => {
        const config: CornerRadiusConfig = {
          top: 10,
          topLeft: 15, // Should override top for topLeft
          left: 8,
          right: 6,
          bottomLeft: 20 // Should override left for bottomLeft
        }
        
        const modifier = cornerRadius(config)
        modifier.apply(null, mockContext)
        
        expect(mockElement.style.borderTopLeftRadius).toBe('15px') // topLeft overrides top
        expect(mockElement.style.borderTopRightRadius).toBe('10px') // top value
        expect(mockElement.style.borderBottomLeftRadius).toBe('20px') // bottomLeft overrides left
        expect(mockElement.style.borderBottomRightRadius).toBe('6px') // right value
      })
    })
  })

  describe('cursor Enhancement', () => {
    describe('backward compatibility', () => {
      const existingCursors = ['auto', 'default', 'pointer', 'text', 'wait', 'help', 'not-allowed', 'none']
      
      existingCursors.forEach(cursorValue => {
        test(`cursor "${cursorValue}" works unchanged`, () => {
          const modifier = cursor(cursorValue as any)
          modifier.apply(null, mockContext)
          
          expect(mockElement.style.cursor).toBe(cursorValue)
        })
      })
    })

    describe('new cursor values', () => {
      const newCursors = ['grab', 'grabbing', 'zoom-in', 'zoom-out', 'alias', 'cell', 'copy']
      
      newCursors.forEach(cursorValue => {
        test(`new cursor "${cursorValue}" works correctly`, () => {
          const modifier = cursor(cursorValue as any)
          modifier.apply(null, mockContext)
          
          expect(mockElement.style.cursor).toBe(cursorValue)
        })
      })
    })

    describe('custom cursor support', () => {
      test('URL cursor syntax works', () => {
        const customCursor = 'url(custom-cursor.png), auto'
        const modifier = cursor(customCursor)
        modifier.apply(null, mockContext)
        
        expect(mockElement.style.cursor).toBe(customCursor)
      })
    })

    describe('validation', () => {
      beforeEach(() => {
        // Mock console.warn for testing
        vi.spyOn(console, 'warn').mockImplementation(() => {})
      })

      test('warns about unknown cursor values in development', () => {
        // Mock development environment
        const originalEnv = process.env.NODE_ENV
        process.env.NODE_ENV = 'development'

        const modifier = cursor('invalid-cursor' as any)
        modifier.apply(null, mockContext)

        expect(console.warn).toHaveBeenCalledWith(
          'Unknown cursor value: "invalid-cursor". See documentation for valid cursor values.'
        )

        // Restore environment
        process.env.NODE_ENV = originalEnv
      })

      test('does not warn about URL cursors', () => {
        const originalEnv = process.env.NODE_ENV
        process.env.NODE_ENV = 'development'

        const modifier = cursor('url(cursor.png), pointer')
        modifier.apply(null, mockContext)

        expect(console.warn).not.toHaveBeenCalled()

        process.env.NODE_ENV = originalEnv
      })
    })
  })

  describe('shadow Enhancement', () => {
    describe('backward compatibility', () => {
      test('single shadow works unchanged', () => {
        const shadowConfig: ShadowConfig = {
          x: 2,
          y: 4,
          blur: 8,
          color: 'rgba(0,0,0,0.2)'
        }
        
        const modifier = shadow(shadowConfig)
        modifier.apply(null, mockContext)
        
        expect(mockElement.style.boxShadow).toBe('2px 4px 8px rgba(0,0,0,0.2)')
      })
    })

    describe('multiple shadows', () => {
      test('multiple shadows render correctly', () => {
        const shadowConfigs: ShadowConfig[] = [
          { x: 0, y: 1, blur: 3, color: 'rgba(0,0,0,0.1)' },
          { x: 0, y: 4, blur: 6, color: 'rgba(0,0,0,0.1)' },
          { x: 0, y: 8, blur: 25, color: 'rgba(0,0,0,0.12)' }
        ]
        
        const modifier = shadows(shadowConfigs)
        modifier.apply(null, mockContext)
        
        expect(mockElement.style.boxShadow).toBe(
          '0px 1px 3px rgba(0,0,0,0.1), 0px 4px 6px rgba(0,0,0,0.1), 0px 8px 25px rgba(0,0,0,0.12)'
        )
      })

      test('inset shadows work correctly', () => {
        const shadowConfig: ShadowConfig = {
          x: 0,
          y: 2,
          blur: 4,
          color: 'rgba(0,0,0,0.1)',
          inset: true
        }
        
        const modifier = shadow(shadowConfig)
        modifier.apply(null, mockContext)
        
        expect(mockElement.style.boxShadow).toBe('inset 0px 2px 4px rgba(0,0,0,0.1)')
      })

      test('spread parameter works correctly', () => {
        const shadowConfig: ShadowConfig = {
          x: 0,
          y: 4,
          blur: 12,
          spread: 2,
          color: 'rgba(0,122,255,0.3)'
        }
        
        const modifier = shadow(shadowConfig)
        modifier.apply(null, mockContext)
        
        expect(mockElement.style.boxShadow).toBe('0px 4px 12px 2px rgba(0,122,255,0.3)')
      })
    })

    describe('text shadow', () => {
      test('single text shadow works', () => {
        const shadowConfig: ShadowConfig = {
          x: 1,
          y: 1,
          blur: 2,
          color: 'rgba(0,0,0,0.3)'
        }
        
        const modifier = textShadow(shadowConfig)
        modifier.apply(null, mockContext)
        
        expect(mockElement.style.textShadow).toBe('1px 1px 2px rgba(0,0,0,0.3)')
      })

      test('multiple text shadows work', () => {
        const shadowConfigs: ShadowConfig[] = [
          { x: 1, y: 1, blur: 2, color: 'rgba(0,0,0,0.3)' },
          { x: 2, y: 2, blur: 4, color: 'rgba(0,122,255,0.2)' }
        ]
        
        const modifier = textShadow(shadowConfigs)
        modifier.apply(null, mockContext)
        
        expect(mockElement.style.textShadow).toBe(
          '1px 1px 2px rgba(0,0,0,0.3), 2px 2px 4px rgba(0,122,255,0.2)'
        )
      })
    })

    describe('shadow presets', () => {
      test('Material Design elevation presets work', () => {
        const modifier = shadowPreset('elevation-1')
        modifier.apply(null, mockContext)
        
        expect(mockElement.style.boxShadow).toBe(
          '0px 1px 3px rgba(0,0,0,0.12), 0px 1px 2px rgba(0,0,0,0.24)'
        )
      })

      test('custom shadow presets can be created and used', () => {
        const customShadows: ShadowConfig[] = [
          { x: 0, y: 5, blur: 10, color: 'rgba(255,0,0,0.2)' }
        ]
        
        createShadowPreset('custom-red', customShadows)
        
        const modifier = shadowPreset('custom-red')
        modifier.apply(null, mockContext)
        
        expect(mockElement.style.boxShadow).toBe('0px 5px 10px rgba(255,0,0,0.2)')
      })

      test('warns about unknown presets', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        
        const modifier = shadowPreset('unknown-preset')
        modifier.apply(null, mockContext)
        
        expect(console.warn).toHaveBeenCalledWith(
          'Shadow preset "unknown-preset" not found'
        )
      })
    })
  })

  describe('border Enhancement', () => {
    describe('backward compatibility', () => {
      test('simple border works unchanged', () => {
        const modifier = border(1, '#007AFF', 'solid')
        modifier.apply(null, mockContext)
        
        expect(mockElement.style.borderWidth).toBe('1px')
        expect(mockElement.style.borderColor).toBe('#007AFF')
        expect(mockElement.style.borderStyle).toBe('solid')
      })

      test('border with defaults works', () => {
        const modifier = border(2)
        modifier.apply(null, mockContext)
        
        expect(mockElement.style.borderWidth).toBe('2px')
        expect(mockElement.style.borderColor).toBe('currentColor')
        expect(mockElement.style.borderStyle).toBe('solid')
      })
    })

    describe('individual border control', () => {
      test('individual borders work correctly', () => {
        const config: BorderOptions = {
          top: { width: 2, style: 'solid', color: '#007AFF' },
          right: { width: 1, style: 'dashed', color: '#FF3B30' },
          bottom: { width: 3, style: 'dotted', color: '#34C759' },
          left: { width: 1, style: 'solid', color: '#FF9500' }
        }
        
        const modifier = border(config)
        modifier.apply(null, mockContext)
        
        expect(mockElement.style.borderTopWidth).toBe('2px')
        expect(mockElement.style.borderTopStyle).toBe('solid')
        expect(mockElement.style.borderTopColor).toBe('#007AFF')
        
        expect(mockElement.style.borderRightWidth).toBe('1px')
        expect(mockElement.style.borderRightStyle).toBe('dashed')
        expect(mockElement.style.borderRightColor).toBe('#FF3B30')
        
        expect(mockElement.style.borderBottomWidth).toBe('3px')
        expect(mockElement.style.borderBottomStyle).toBe('dotted')
        expect(mockElement.style.borderBottomColor).toBe('#34C759')
        
        expect(mockElement.style.borderLeftWidth).toBe('1px')
        expect(mockElement.style.borderLeftStyle).toBe('solid')
        expect(mockElement.style.borderLeftColor).toBe('#FF9500')
      })

      test('SwiftUI alignment terminology works', () => {
        const config: BorderOptions = {
          leading: { width: 2, style: 'solid', color: '#007AFF' },
          trailing: { width: 1, style: 'dashed', color: '#FF3B30' }
        }
        
        const modifier = border(config)
        modifier.apply(null, mockContext)
        
        expect(mockElement.style.borderLeftWidth).toBe('2px')   // leading
        expect(mockElement.style.borderLeftStyle).toBe('solid')
        expect(mockElement.style.borderLeftColor).toBe('#007AFF')
        
        expect(mockElement.style.borderRightWidth).toBe('1px')  // trailing
        expect(mockElement.style.borderRightStyle).toBe('dashed')
        expect(mockElement.style.borderRightColor).toBe('#FF3B30')
      })

      test('shorthand properties work', () => {
        const config: BorderOptions = {
          horizontal: { width: 2, style: 'solid', color: '#007AFF' },
          vertical: { width: 1, style: 'dashed', color: '#FF3B30' }
        }
        
        const modifier = border(config)
        modifier.apply(null, mockContext)
        
        expect(mockElement.style.borderLeftWidth).toBe('2px')   // horizontal
        expect(mockElement.style.borderRightWidth).toBe('2px')  // horizontal
        expect(mockElement.style.borderTopWidth).toBe('1px')    // vertical
        expect(mockElement.style.borderBottomWidth).toBe('1px') // vertical
      })

      test('CSS border image works', () => {
        const config: BorderOptions = {
          width: 2,
          style: 'solid',
          color: '#007AFF',
          image: 'linear-gradient(45deg, #007AFF, #FF3B30)'
        }
        
        const modifier = border(config)
        modifier.apply(null, mockContext)
        
        expect(mockElement.style.borderImage).toBe('linear-gradient(45deg, #007AFF, #FF3B30)')
      })
    })
  })

  describe('scroll Enhancement', () => {
    describe('scroll configuration', () => {
      test('scroll behavior works', () => {
        const config: ScrollConfig = {
          behavior: 'smooth'
        }
        
        const modifier = scroll(config)
        modifier.apply(null, mockContext)
        
        expect(mockElement.style.scrollBehavior).toBe('smooth')
      })

      test('scroll margin works', () => {
        const config: ScrollConfig = {
          margin: { top: 10, bottom: 20 }
        }
        
        const modifier = scroll(config)
        modifier.apply(null, mockContext)
        
        expect(mockElement.style.scrollMarginTop).toBe('10px')
        expect(mockElement.style.scrollMarginBottom).toBe('20px')
      })

      test('scroll padding works', () => {
        const config: ScrollConfig = {
          padding: { left: 5, right: 10 }
        }
        
        const modifier = scroll(config)
        modifier.apply(null, mockContext)
        
        expect(mockElement.style.scrollPaddingLeft).toBe('5px')
        expect(mockElement.style.scrollPaddingRight).toBe('10px')
      })

      test('scroll snap works', () => {
        const config: ScrollConfig = {
          snap: {
            type: 'y mandatory',
            align: 'start'
          }
        }
        
        const modifier = scroll(config)
        modifier.apply(null, mockContext)
        
        expect(mockElement.style.scrollSnapType).toBe('y mandatory')
        expect(mockElement.style.scrollSnapAlign).toBe('start')
      })

      test('shorthand scroll properties work', () => {
        const config: ScrollConfig = {
          margin: 10,
          padding: 5
        }
        
        const modifier = scroll(config)
        modifier.apply(null, mockContext)
        
        expect(mockElement.style.scrollMargin).toBe('10px')
        expect(mockElement.style.scrollPadding).toBe('5px')
      })
    })

    describe('individual scroll modifiers', () => {
      test('scrollBehavior modifier works', () => {
        const modifier = scrollBehavior('smooth')
        modifier.apply(null, mockContext)
        
        expect(mockElement.style.scrollBehavior).toBe('smooth')
      })

      test('overscrollBehavior modifiers work', () => {
        const modifier1 = overscrollBehavior('contain')
        modifier1.apply(null, mockContext)
        expect(mockElement.style.overscrollBehavior).toBe('contain')

        // Reset for next test
        mockElement = createMockElement()
        mockContext = createMockModifierContext(mockElement)

        const modifier2 = overscrollBehavior('none')
        modifier2.apply(null, mockContext)
        expect(mockElement.style.overscrollBehavior).toBe('none')
      })
    })
  })

  describe('Performance and Integration', () => {
    test('multiple enhanced modifiers can be applied together', () => {
      const cornerMod = cornerRadius({ topLeft: 10, bottomRight: 5 })
      const shadowMod = shadow({ x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,0.1)' })
      const borderMod = border({ top: { width: 1, color: '#007AFF' } })
      
      cornerMod.apply(null, mockContext)
      shadowMod.apply(null, mockContext)
      borderMod.apply(null, mockContext)
      
      expect(mockElement.style.borderTopLeftRadius).toBe('10px')
      expect(mockElement.style.borderBottomRightRadius).toBe('5px')
      expect(mockElement.style.boxShadow).toBe('0px 2px 4px rgba(0,0,0,0.1)')
      expect(mockElement.style.borderTopWidth).toBe('1px')
      expect(mockElement.style.borderTopColor).toBe('#007AFF')
    })

    test('enhanced modifiers have correct priorities', () => {
      const cornerMod = cornerRadius(10)
      const shadowMod = shadow({ x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,0.1)' })
      const borderMod = border(1, '#007AFF')
      
      expect(cornerMod.priority).toBe(35)
      expect(shadowMod.priority).toBe(30)
      expect(borderMod.priority).toBe(40)
    })
  })
})