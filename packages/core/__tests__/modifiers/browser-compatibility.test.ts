/**
 * Cross-Browser Compatibility Test Suite
 * 
 * Validates CSS Features compatibility across different browsers
 * and provides fallback strategies for unsupported features.
 */

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest'
// Transform system
import {
  transform,
  scale,
  rotate,
  translate,
  skew,
  matrix,
  matrix3d,
  rotate3d,
  scale3d,
  translate3d,
} from '../../src/modifiers/transformations'

// Backdrop filter
import {
  backdropFilter,
  glassmorphism,
} from '../../src/modifiers/backdrop'

// CSS filters
import {
  filter,
  blur,
  brightness,
  contrast,
} from '../../src/modifiers/filters'

// Background clip text
import {
  gradientText,
  backgroundClip,
} from '../../src/modifiers/text'

// Pseudo-elements
import {
  before,
  after,
} from '../../src/modifiers/elements'

// Custom properties
import {
  customProperty,
  themeColors,
  designTokens,
} from '../../src/modifiers/attributes'

// Hover effects
import {
  hoverEffect,
  hover,
} from '../../src/modifiers/effects'
import { createMockElement, createMockModifierContext } from './test-utils'

// Browser compatibility test utilities
interface BrowserMock {
  name: string
  userAgent: string
  features: {
    backdropFilter: boolean
    webkitBackdropFilter: boolean
    customProperties: boolean
    transforms3d: boolean
    filters: boolean
    backgroundClip: boolean
    webkitBackgroundClip: boolean
  }
}

const browserMocks: BrowserMock[] = [
  {
    name: 'Chrome 120',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    features: {
      backdropFilter: true,
      webkitBackdropFilter: true,
      customProperties: true,
      transforms3d: true,
      filters: true,
      backgroundClip: true,
      webkitBackgroundClip: true,
    }
  },
  {
    name: 'Firefox 120',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    features: {
      backdropFilter: true,
      webkitBackdropFilter: false,
      customProperties: true,
      transforms3d: true,
      filters: true,
      backgroundClip: true,
      webkitBackgroundClip: false,
    }
  },
  {
    name: 'Safari 17',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    features: {
      backdropFilter: true,
      webkitBackdropFilter: true,
      customProperties: true,
      transforms3d: true,
      filters: true,
      backgroundClip: true,
      webkitBackgroundClip: true,
    }
  },
  {
    name: 'Edge 120',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    features: {
      backdropFilter: true,
      webkitBackdropFilter: true,
      customProperties: true,
      transforms3d: true,
      filters: true,
      backgroundClip: true,
      webkitBackgroundClip: true,
    }
  },
  {
    name: 'Legacy Browser (IE11-like)',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
    features: {
      backdropFilter: false,
      webkitBackdropFilter: false,
      customProperties: false,
      transforms3d: true, // Basic 3D transforms supported
      filters: false,
      backgroundClip: false,
      webkitBackgroundClip: false,
    }
  }
]

describe('Cross-Browser Compatibility', () => {
  let mockElement: HTMLElement
  let mockContext: ReturnType<typeof createMockModifierContext>
  let originalCSS: any
  let originalUserAgent: string

  beforeEach(() => {
    mockElement = createMockElement()
    mockContext = createMockModifierContext(mockElement)
    originalUserAgent = navigator.userAgent
    
    // Store original CSS.supports
    originalCSS = global.CSS
  })

  afterEach(() => {
    // Restore original CSS.supports
    global.CSS = originalCSS
    
    // Restore original user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      writable: true
    })
  })

  describe('Transform System Browser Compatibility', () => {
    browserMocks.forEach(browser => {
      test(`transforms work correctly in ${browser.name}`, () => {
        // Mock browser environment
        mockBrowserEnvironment(browser)
        
        // Test basic 2D transforms
        const scaleModifier = scale(1.2)
        scaleModifier.apply(null, mockContext)
        expect(mockElement.style.transform).toBe('scale(1.2)')
        
        // Reset
        mockElement = createMockElement()
        mockContext = createMockModifierContext(mockElement)
        
        // Test complex transforms
        const complexTransform = transform({
          scale: 1.1,
          rotate: '45deg',
          translate: { x: 10, y: 20 }
        })
        complexTransform.apply(null, mockContext)
        expect(mockElement.style.transform).toBe('scale(1.1) rotate(45deg) translate3d(10px, 20px, 0)')
      })

      if (browser.features.transforms3d) {
        test(`3D transforms work correctly in ${browser.name}`, () => {
          mockBrowserEnvironment(browser)
          
          // Test 3D transforms
          const matrix3dModifier = matrix3d([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            10, 20, 5, 1
          ])
          matrix3dModifier.apply(null, mockContext)
          expect(mockElement.style.transform).toBe('matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 10, 20, 5, 1)')
        })
      }
    })
  })

  describe('Backdrop Filter Browser Compatibility', () => {
    browserMocks.forEach(browser => {
      test(`backdrop filter behaves correctly in ${browser.name}`, () => {
        mockBrowserEnvironment(browser)
        
        if (browser.features.backdropFilter) {
          // Should work with full backdrop filter support
          const modifier = backdropFilter({ blur: 10, brightness: 1.2 })
          modifier.apply(null, mockContext)
          
          expect(mockElement.style.backdropFilter).toBe('blur(10px) brightness(1.2)')
          if (browser.features.webkitBackdropFilter) {
            expect(mockElement.style.webkitBackdropFilter).toBe('blur(10px) brightness(1.2)')
          }
        } else {
          // Should fall back gracefully
          const fallbackColor = 'rgba(255,255,255,0.8)'
          const modifier = backdropFilter({ blur: 10 }, fallbackColor)
          modifier.apply(null, mockContext)
          
          expect(mockElement.style.backgroundColor).toBe(fallbackColor)
          expect(mockElement.style.backdropFilter).toBe('')
        }
      })
    })
  })

  describe('CSS Filters Browser Compatibility', () => {
    browserMocks.forEach(browser => {
      test(`CSS filters work correctly in ${browser.name}`, () => {
        mockBrowserEnvironment(browser)
        
        if (browser.features.filters) {
          const modifier = filter({ blur: 5, brightness: 1.2, contrast: 1.1 })
          modifier.apply(null, mockContext)
          
          expect(mockElement.style.filter).toBe('blur(5px) brightness(1.2) contrast(1.1)')
        } else {
          // Legacy browsers might not support filters
          // Test that modifier doesn't crash
          expect(() => {
            const modifier = filter({ blur: 5 })
            modifier.apply(null, mockContext)
          }).not.toThrow()
        }
      })
    })
  })

  describe('Background Clip Text Browser Compatibility', () => {
    browserMocks.forEach(browser => {
      test(`background clip text works correctly in ${browser.name}`, () => {
        mockBrowserEnvironment(browser)
        
        if (browser.features.backgroundClip || browser.features.webkitBackgroundClip) {
          const modifier = gradientText('linear-gradient(45deg, #007AFF, #FF3B30)')
          modifier.apply(null, mockContext)
          
          expect(mockElement.style.backgroundImage).toBe('linear-gradient(45deg, #007AFF, #FF3B30)')
          expect(mockElement.style.color).toBe('transparent')
          
          if (browser.features.backgroundClip) {
            expect(mockElement.style.backgroundClip).toBe('text')
          }
          if (browser.features.webkitBackgroundClip) {
            expect(mockElement.style.webkitBackgroundClip).toBe('text')
            expect(mockElement.style.webkitTextFillColor).toBe('transparent')
          }
        } else {
          // Legacy browsers - should not crash
          expect(() => {
            const modifier = gradientText('linear-gradient(45deg, #007AFF, #FF3B30)')
            modifier.apply(null, mockContext)
          }).not.toThrow()
        }
      })
    })
  })

  describe('CSS Custom Properties Browser Compatibility', () => {
    browserMocks.forEach(browser => {
      test(`custom properties work correctly in ${browser.name}`, () => {
        mockBrowserEnvironment(browser)
        
        if (browser.features.customProperties) {
          const modifier = customProperty('primary-color', '#007AFF')
          modifier.apply(null, mockContext)
          
          expect((mockElement.style as any)['--primary-color']).toBe('#007AFF')
        } else {
          // Legacy browsers might not support custom properties
          // Test that modifier doesn't crash
          expect(() => {
            const modifier = customProperty('primary-color', '#007AFF')
            modifier.apply(null, mockContext)
          }).not.toThrow()
        }
      })
    })
  })

  describe('Hover Effects Browser Compatibility', () => {
    browserMocks.forEach(browser => {
      test(`hover effects work correctly in ${browser.name}`, () => {
        mockBrowserEnvironment(browser)
        
        // Mock CSS.supports for hover tests
        global.CSS = {
          supports: vi.fn((property: string, value: string) => {
            // All modern browsers support basic hover
            return true
          })
        } as any
        
        // Mock document methods for hover tests
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
        
        // Test SwiftUI hover effects - just verify modifier can be created and applied
        const hoverModifier = hoverEffect('lift')
        expect(hoverModifier).toBeDefined()
        expect(hoverModifier.type).toBe('hover')
        
        // Apply modifier should not throw
        expect(() => {
          hoverModifier.apply(null, mockContext)
        }).not.toThrow()
      })
    })
  })

  describe('Pseudo-elements Browser Compatibility', () => {
    browserMocks.forEach(browser => {
      test(`pseudo-elements work correctly in ${browser.name}`, () => {
        mockBrowserEnvironment(browser)
        
        // Mock CSS rule insertion for pseudo-element tests
        const mockStyleSheet = {
          insertRule: vi.fn()
        }
        
        const mockStyle = {
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
        
        // All browsers support pseudo-elements
        const beforeModifier = before({
          content: '★',
          color: '#FFD60A',
          marginRight: 5
        })
        beforeModifier.apply(null, mockContext)
        
        // Should add class and insert CSS rule
        expect(mockElement.classList.add).toHaveBeenCalledWith(expect.stringMatching(/^tachui-pseudo-/))
        expect(mockStyleSheet.insertRule).toHaveBeenCalledWith(
          expect.stringContaining('::before')
        )
      })
    })
  })

  describe('Feature Detection and Graceful Degradation', () => {
    test('should detect browser capabilities correctly', () => {
      // Test Chrome-like browser
      mockBrowserEnvironment(browserMocks[0]) // Chrome 120
      
      global.CSS = {
        supports: vi.fn((property: string, value: string) => {
          return property === 'backdrop-filter' || property === '-webkit-backdrop-filter'
        })
      } as any
      
      const modifier = backdropFilter({ blur: 10 })
      modifier.apply(null, mockContext)
      
      expect(mockElement.style.backdropFilter).toBe('blur(10px)')
    })

    test('should fall back gracefully when features are not supported', () => {
      // Test legacy browser
      mockBrowserEnvironment(browserMocks[4]) // Legacy Browser
      
      global.CSS = {
        supports: vi.fn(() => false)
      } as any
      
      const fallbackColor = 'rgba(255,255,255,0.8)'
      const modifier = backdropFilter({ blur: 10 }, fallbackColor)
      modifier.apply(null, mockContext)
      
      expect(mockElement.style.backgroundColor).toBe(fallbackColor)
      expect(mockElement.style.backdropFilter).toBe('')
    })
  })

  describe('Performance Characteristics Across Browsers', () => {
    browserMocks.forEach(browser => {
      test(`performance remains acceptable in ${browser.name}`, () => {
        mockBrowserEnvironment(browser)
        
        const startTime = performance.now()
        
        // Apply multiple complex modifiers
        for (let i = 0; i < 50; i++) {
          const element = createMockElement()
          const context = createMockModifierContext(element)
          
          // Apply various modifiers
          transform({ scale: 1.1, rotate: '45deg', translate: { x: i, y: i * 2 } }).apply(null, context)
          
          if (browser.features.backdropFilter) {
            backdropFilter({ blur: 5 }).apply(null, context)
          }
          
          if (browser.features.filters) {
            filter({ brightness: 1.1 }).apply(null, context)
          }
          
          if (browser.features.customProperties) {
            customProperty('test-var', i.toString()).apply(null, context)
          }
        }
        
        const endTime = performance.now()
        const duration = endTime - startTime
        
        // Should complete 50 complex applications in reasonable time
        expect(duration).toBeLessThan(100) // Less than 100ms for 50 applications
      })
    })
  })
})

// Helper function to mock browser environment
function mockBrowserEnvironment(browser: BrowserMock) {
  // Mock user agent
  Object.defineProperty(navigator, 'userAgent', {
    value: browser.userAgent,
    writable: true
  })
  
  // Mock CSS.supports based on browser features
  global.CSS = {
    supports: vi.fn((property: string, value?: string) => {
      switch (property) {
        case 'backdrop-filter':
          return browser.features.backdropFilter
        case '-webkit-backdrop-filter':
          return browser.features.webkitBackdropFilter
        case 'filter':
          return browser.features.filters
        case 'background-clip':
          return browser.features.backgroundClip
        case '-webkit-background-clip':
          return browser.features.webkitBackgroundClip
        case 'transform':
          return browser.features.transforms3d
        default:
          return true // Default to supported for other properties
      }
    })
  } as any
}