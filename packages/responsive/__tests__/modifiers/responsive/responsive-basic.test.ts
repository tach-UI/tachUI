/**
 * Basic Responsive System Tests
 *
 * Tests for core responsive functionality including breakpoint configuration,
 * CSS generation, and responsive modifier application.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  configureBreakpoints,
  getCurrentBreakpointConfig,
  initializeResponsiveSystem,
  createBreakpointContext,
  generateMediaQuery,
  DEFAULT_BREAKPOINTS,
  BreakpointPresets,
  ResponsiveCSSGenerator,
  createResponsiveModifier,
  isResponsiveValue,
} from '../../../src/modifiers/responsive'

// Mock window and DOM APIs
const mockWindow = {
  innerWidth: 1024,
  innerHeight: 768,
  matchMedia: vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}

Object.defineProperty(global, 'window', {
  writable: true,
  value: mockWindow,
})

describe('Responsive System - Basic Functionality', () => {
  beforeEach(() => {
    // Reset window mock
    mockWindow.innerWidth = 1024
    mockWindow.innerHeight = 768

    // Reset breakpoint configuration
    configureBreakpoints(DEFAULT_BREAKPOINTS)
  })

  describe('Breakpoint Configuration', () => {
    it('should use default Tailwind breakpoints', () => {
      const config = getCurrentBreakpointConfig()

      expect(config).toEqual({
        base: '0px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      })
    })

    it('should allow custom breakpoint configuration', () => {
      configureBreakpoints({
        sm: '480px',
        md: '768px',
        lg: '1200px',
      })

      const config = getCurrentBreakpointConfig()
      expect(config.sm).toBe('480px')
      expect(config.lg).toBe('1200px')
    })

    it('should provide preset configurations', () => {
      expect(BreakpointPresets.bootstrap.sm).toBe('576px')
      expect(BreakpointPresets.material.md).toBe('960px')
      expect(BreakpointPresets.mobileFocus.sm).toBe('480px')
    })

    it('should validate breakpoint configuration', () => {
      expect(() => {
        configureBreakpoints({
          invalid: '768px', // Invalid breakpoint key
        } as any)
      }).toThrow('Invalid breakpoint key')

      expect(() => {
        configureBreakpoints({
          sm: 'invalid-value', // Invalid CSS value
        })
      }).toThrow('Invalid breakpoint value')
    })
  })

  describe('Media Query Generation', () => {
    it('should generate correct media queries for breakpoints', () => {
      expect(generateMediaQuery('base')).toBe('')
      expect(generateMediaQuery('sm')).toBe('(min-width: 640px)')
      expect(generateMediaQuery('md')).toBe('(min-width: 768px)')
      expect(generateMediaQuery('lg')).toBe('(min-width: 1024px)')
    })

    it('should generate media queries with custom breakpoints', () => {
      configureBreakpoints({
        sm: '480px',
        md: '768px',
      })

      expect(generateMediaQuery('sm')).toBe('(min-width: 480px)')
      expect(generateMediaQuery('md')).toBe('(min-width: 768px)')
    })
  })

  describe('Responsive Value Detection', () => {
    it('should correctly identify responsive values', () => {
      expect(isResponsiveValue({ base: 16, md: 18 })).toBe(true)
      expect(isResponsiveValue({ sm: 'center', lg: 'left' })).toBe(true)
      expect(isResponsiveValue(16)).toBe(false)
      expect(isResponsiveValue('center')).toBe(false)
      expect(isResponsiveValue(null)).toBe(false)
      expect(isResponsiveValue(undefined)).toBe(false)
    })
  })

  describe('CSS Generation', () => {
    it('should generate responsive CSS for simple properties', () => {
      const generator = new ResponsiveCSSGenerator({
        selector: '.test-element',
      })

      const result = generator.generateResponsiveCSS({
        fontSize: { base: 14, md: 16, lg: 18 },
      })

      expect(result.hasResponsiveStyles).toBe(true)
      expect(result.fallbackStyles).toEqual({ 'font-size': '14px' })
      expect(result.mediaQueries).toHaveLength(2) // md and lg

      const mdQuery = result.mediaQueries.find(q => q.breakpoint === 'md')
      expect(mdQuery?.query).toBe('(min-width: 768px)')
      expect(mdQuery?.styles).toEqual({ 'font-size': '16px' })
    })

    it('should generate optimized CSS rules', () => {
      const generator = new ResponsiveCSSGenerator({
        selector: '.test-element',
        generateMinified: false,
        includeComments: true,
      })

      const result = generator.generateResponsiveCSS({
        padding: { base: 8, md: 16 },
        fontSize: { base: 14, md: 16 },
      })

      expect(result.cssRules).toHaveLength(2) // base rule + md rule

      const baseRule = result.cssRules[0]
      expect(baseRule).toContain('.test-element')
      expect(baseRule).toContain('padding: 8px')
      expect(baseRule).toContain('font-size: 14px')

      const mdRule = result.cssRules[1]
      expect(mdRule).toContain('@media (min-width: 768px)')
      expect(mdRule).toContain('padding: 16px')
      expect(mdRule).toContain('font-size: 16px')
    })

    it('should handle non-responsive values', () => {
      const generator = new ResponsiveCSSGenerator({
        selector: '.test-element',
      })

      const result = generator.generateResponsiveCSS({
        color: 'blue',
        fontSize: { base: 14, md: 16 },
      })

      expect(result.hasResponsiveStyles).toBe(true)
      expect(result.fallbackStyles).toEqual({
        color: 'blue',
        'font-size': '14px',
      })
    })
  })

  describe('Responsive Modifier Creation', () => {
    it('should create responsive modifiers', () => {
      const modifier = createResponsiveModifier({
        fontSize: { base: 14, md: 16, lg: 18 },
        padding: { base: 8, lg: 16 },
      })

      expect(modifier).toBeDefined()
      expect(modifier.priority).toBe(250) // RESPONSIVE_MODIFIER_PRIORITY
    })

    it('should handle mixed responsive and non-responsive properties', () => {
      const modifier = createResponsiveModifier({
        color: '#333',
        fontSize: { base: 14, md: 16 },
        backgroundColor: 'white',
      })

      expect(modifier).toBeDefined()
    })
  })

  describe('Breakpoint Context', () => {
    beforeEach(() => {
      initializeResponsiveSystem()
    })

    it('should create breakpoint context with current state', () => {
      // Mock viewport at lg breakpoint - note that the context uses the initial mock value
      const context = createBreakpointContext()

      expect(context.width).toBe(1024) // Initial mock window width
      expect(context.height).toBe(768)
      expect(context.current).toBe('lg') // 1024px falls in lg range (1024px+)
    })

    it('should provide breakpoint comparison utilities', () => {
      // Using initial viewport at lg breakpoint (1024px)
      const context = createBreakpointContext()

      expect(context.isAbove('sm')).toBe(true) // lg is above sm
      expect(context.isBelow('xl')).toBe(true) // lg is below xl
      expect(context.isBetween('sm', 'xl')).toBe(true) // lg is between sm and xl
      expect(context.isBetween('xl', '2xl')).toBe(false) // lg is not between xl and 2xl
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid CSS values gracefully', () => {
      const generator = new ResponsiveCSSGenerator({
        selector: '.test-element',
      })

      expect(() => {
        generator.generateResponsiveCSS({
          fontSize: { base: null as any, md: undefined as any },
        })
      }).not.toThrow()
    })

    it('should handle empty responsive configurations', () => {
      const generator = new ResponsiveCSSGenerator({
        selector: '.test-element',
      })

      const result = generator.generateResponsiveCSS({})

      expect(result.hasResponsiveStyles).toBe(false)
      expect(result.cssRules).toHaveLength(0)
      expect(result.mediaQueries).toHaveLength(0)
    })
  })
})

describe('Responsive System - Advanced Features', () => {
  it('should handle complex responsive configurations', () => {
    const generator = new ResponsiveCSSGenerator({
      selector: '.complex-element',
      optimizeOutput: true,
    })

    const result = generator.generateResponsiveCSS({
      // Layout
      display: { base: 'block', md: 'flex' },
      flexDirection: { md: 'row', lg: 'column' },
      gap: { md: 16, lg: 24 },

      // Typography
      fontSize: { base: 14, sm: 16, md: 18, lg: 20 },
      textAlign: { base: 'left', md: 'center' },

      // Spacing
      padding: { base: 8, sm: 12, md: 16, lg: 20 },
      margin: { base: 0, lg: 'auto' },

      // Visual
      backgroundColor: { base: '#f9f9f9', md: 'white' },
      borderRadius: { base: 4, md: 8 },
    })

    expect(result.hasResponsiveStyles).toBe(true)
    expect(result.mediaQueries.length).toBeGreaterThan(0)
    expect(result.cssRules.length).toBeGreaterThan(1)

    // Should have base styles (with !important for conflicting properties)
    expect(result.fallbackStyles).toMatchObject({
      display: 'block !important', // Display gets !important to override component defaults
      'font-size': '14px',
      'text-align': 'left',
      padding: '8px',
      margin: '0px', // CSS generation adds 'px' for numeric values
      'background-color': '#f9f9f9',
      'border-radius': '4px',
    })

    // Should generate media queries for different breakpoints
    const breakpoints = result.mediaQueries.map(mq => mq.breakpoint)
    expect(breakpoints).toContain('sm')
    expect(breakpoints).toContain('md')
    expect(breakpoints).toContain('lg')
  })

  it('should optimize duplicate media queries', () => {
    const generator = new ResponsiveCSSGenerator({
      selector: '.optimized-element',
      optimizeOutput: true,
    })

    const result = generator.generateResponsiveCSS({
      fontSize: { base: 14, md: 16 },
      padding: { base: 8, md: 12 },
      margin: { md: 16 },
    })

    // Should combine md queries into one rule
    const mdQueries = result.mediaQueries.filter(mq => mq.breakpoint === 'md')
    expect(mdQueries).toHaveLength(3) // One for each property with md value

    // But when generated as CSS, should be combined
    const cssRules = result.cssRules
    const mdRules = cssRules.filter(rule =>
      rule.includes('@media (min-width: 768px)')
    )
    expect(mdRules).toHaveLength(1) // Should be combined into one rule
  })
})
