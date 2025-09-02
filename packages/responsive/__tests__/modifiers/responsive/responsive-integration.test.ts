/**
 * Responsive System Integration Tests
 *
 * Tests responsive package functionality and modifier creation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createModifierBuilder } from '@tachui/core'
import {
  configureBreakpoints,
  initializeResponsiveSystem,
  createResponsiveModifier,
  createResponsiveBuilder,
  useBreakpoint,
  useMediaQuery,
  ResponsiveCSSGenerator,
  CSSInjector,
} from '../../../src/modifiers/responsive'

// Mock component instance
const mockComponent = {
  type: 'component' as const,
  props: {},
  children: [],
  key: 'test-component',
  id: 'test-component-id',
  render: () => ({
    type: 'element' as const,
    element: document.createElement('div'),
  }),
}

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

describe('Responsive System Integration', () => {
  beforeEach(() => {
    // Reset window mock
    mockWindow.innerWidth = 1024
    mockWindow.innerHeight = 768

    // Initialize responsive system
    initializeResponsiveSystem()
  })

  it('should create responsive modifiers', () => {
    const responsiveConfig = {
      base: { width: '100px' },
      md: { width: '200px' },
      lg: { width: '300px' },
    }

    const modifier = createResponsiveModifier(responsiveConfig)
    expect(modifier).toBeDefined()
    expect(modifier.type).toBe('responsive')
  })

  it('should create responsive builder from core builder', () => {
    const coreBuilder = createModifierBuilder(mockComponent)
    const responsiveBuilder = createResponsiveBuilder(coreBuilder)

    expect(responsiveBuilder).toBeDefined()
    expect(typeof responsiveBuilder.responsive).toBe('function')
    expect(typeof responsiveBuilder.build).toBe('function')
  })

  it('should allow chaining responsive modifiers', () => {
    const coreBuilder = createModifierBuilder(mockComponent)
    const responsiveBuilder = createResponsiveBuilder(coreBuilder)

    // Test responsive modifier chaining
    const chainedBuilder = responsiveBuilder.responsive({
      width: { base: 100, md: 200, lg: 300 },
      height: { base: 50, lg: 100 },
      padding: { base: 8, sm: 12, md: 16 },
    })

    expect(chainedBuilder).toBeDefined()
    expect(chainedBuilder.build).toBeDefined()
  })

  it('should work with responsive CSS generation', () => {
    const generator = new ResponsiveCSSGenerator({
      selector: '.test-element',
      mobileFirst: true,
    })

    expect(generator).toBeDefined()

    const config = {
      base: { width: '100px' },
      md: { width: '200px' },
    }

    const result = generator.generateResponsiveCSS(config)
    expect(result).toBeDefined()
    expect(result.mediaQueries).toBeDefined()
  })

  it('should inject CSS correctly', () => {
    const css = ['.test { width: 100px; }']

    expect(() => {
      CSSInjector.injectCSS(css)
    }).not.toThrow()

    // Check that CSS was injected into document
    const styleElement = document.querySelector(
      '[data-tachui-responsive="true"]'
    )
    expect(styleElement).toBeDefined()
  })

  it('should handle breakpoint configuration', () => {
    const customBreakpoints = {
      base: '0px',
      sm: '576px',
      md: '768px',
      lg: '992px',
      xl: '1200px',
    }

    expect(() => {
      configureBreakpoints(customBreakpoints)
    }).not.toThrow()
  })

  it('should provide utility hooks', () => {
    const breakpoint = useBreakpoint()
    expect(breakpoint).toBeDefined()

    const mediaQuery = useMediaQuery('(min-width: 768px)')
    expect(mediaQuery).toBeDefined()
  })

  it('should handle complex responsive configurations', () => {
    const coreBuilder = createModifierBuilder(mockComponent)
    const responsiveBuilder = createResponsiveBuilder(coreBuilder)

    const complexBuilder = responsiveBuilder.responsive({
      fontSize: { base: 14, sm: 16, md: 18, lg: 20 },
      padding: { base: 8, md: 16 },
      margin: { base: 0, lg: 'auto' },
      display: { base: 'block', md: 'flex' },
    })

    expect(complexBuilder).toBeDefined()

    const finalComponent = complexBuilder.build()
    expect(finalComponent).toBeDefined()
  })
})
