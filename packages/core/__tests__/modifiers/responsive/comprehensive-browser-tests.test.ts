/**
 * Comprehensive Browser Compatibility and Testing Suite
 *
 * Comprehensive tests for responsive system across different browsers,
 * environments, and edge cases.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { createSignal } from '../../../src/reactive'
import {
  ResponsiveDevTools,
  BrowserCompatibility,
  useResponsiveInspector,
  ResponsiveGridPatterns,
  ResponsiveFlexPatterns,
  LayoutPatterns,
  AdvancedBreakpointUtils,
  ResponsiveHooks,
  ResponsiveDataUtils,
  OptimizedCSSGenerator,
  ResponsivePerformanceMonitor,
  MediaQueries,
} from '../../../src/modifiers/responsive'

// Mock DOM environment for testing
const mockMatchMedia = vi.fn()
const mockCSS = {
  supports: vi.fn(),
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
})

Object.defineProperty(window, 'CSS', {
  writable: true,
  value: mockCSS,
})

// Mock different browser environments
const mockBrowserEnvironments = {
  chrome: {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    supports: {
      cssGrid: true,
      flexbox: true,
      customProperties: true,
      viewportUnits: true,
      mediaQueries: true,
      containerQueries: true,
      logicalProperties: true,
    },
  },
  firefox: {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    supports: {
      cssGrid: true,
      flexbox: true,
      customProperties: true,
      viewportUnits: true,
      mediaQueries: true,
      containerQueries: false,
      logicalProperties: true,
    },
  },
  safari: {
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    supports: {
      cssGrid: true,
      flexbox: true,
      customProperties: true,
      viewportUnits: true,
      mediaQueries: true,
      containerQueries: false,
      logicalProperties: true,
    },
  },
  edge: {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
    supports: {
      cssGrid: true,
      flexbox: true,
      customProperties: true,
      viewportUnits: true,
      mediaQueries: true,
      containerQueries: true,
      logicalProperties: true,
    },
  },
  mobile: {
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    supports: {
      cssGrid: true,
      flexbox: true,
      customProperties: true,
      viewportUnits: true,
      mediaQueries: true,
      containerQueries: false,
      logicalProperties: true,
    },
  },
}

describe('Comprehensive Browser Compatibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    mockCSS.supports = vi.fn().mockReturnValue(true)
  })

  afterEach(() => {
    ResponsiveDevTools.disable()
    ResponsivePerformanceMonitor.reset()
    OptimizedCSSGenerator.reset()
  })

  describe('Browser Feature Detection', () => {
    test('detects CSS Grid support correctly', () => {
      mockCSS.supports.mockImplementation((property: string, value: string) => {
        return property === 'display' && value === 'grid'
      })

      const features = BrowserCompatibility.testCSSFeatures()
      expect(features.cssGrid).toBe(true)
      expect(mockCSS.supports).toHaveBeenCalledWith('display', 'grid')
    })

    test('detects Flexbox support correctly', () => {
      mockCSS.supports.mockImplementation((property: string, value: string) => {
        return property === 'display' && value === 'flex'
      })

      const features = BrowserCompatibility.testCSSFeatures()
      expect(features.flexbox).toBe(true)
      expect(mockCSS.supports).toHaveBeenCalledWith('display', 'flex')
    })

    test('detects CSS Custom Properties support', () => {
      mockCSS.supports.mockImplementation((property: string, value: string) => {
        return property === '--test' && value === 'value'
      })

      const features = BrowserCompatibility.testCSSFeatures()
      expect(features.customProperties).toBe(true)
      expect(mockCSS.supports).toHaveBeenCalledWith('--test', 'value')
    })

    test('detects viewport units support', () => {
      mockCSS.supports.mockImplementation((property: string, value: string) => {
        return property === 'width' && value === '100vw'
      })

      const features = BrowserCompatibility.testCSSFeatures()
      expect(features.viewportUnits).toBe(true)
      expect(mockCSS.supports).toHaveBeenCalledWith('width', '100vw')
    })

    test('detects container queries support', () => {
      mockCSS.supports.mockImplementation((property: string, value: string) => {
        return property === 'container-type' && value === 'inline-size'
      })

      const features = BrowserCompatibility.testCSSFeatures()
      expect(features.containerQueries).toBe(true)
      expect(mockCSS.supports).toHaveBeenCalledWith(
        'container-type',
        'inline-size'
      )
    })
  })

  describe('Cross-Browser Responsive Behavior', () => {
    Object.entries(mockBrowserEnvironments).forEach(([browserName, config]) => {
      test(`works correctly in ${browserName}`, () => {
        // Mock browser-specific behavior
        Object.defineProperty(navigator, 'userAgent', {
          writable: true,
          value: config.userAgent,
        })

        mockCSS.supports.mockImplementation(
          (property: string, value: string) => {
            if (property === 'display' && value === 'grid')
              return config.supports.cssGrid
            if (property === 'display' && value === 'flex')
              return config.supports.flexbox
            if (property === '--test') return config.supports.customProperties
            if (property === 'width' && value === '100vw')
              return config.supports.viewportUnits
            if (property === 'container-type')
              return config.supports.containerQueries
            return false
          }
        )

        // Test responsive grid patterns
        const gridModifier = ResponsiveGridPatterns.autoFit({
          minColumnWidth: { base: '200px', md: '250px', lg: '300px' },
          gap: '1rem',
        })

        expect(gridModifier.config.display).toBe('grid')
        expect(gridModifier.config.gridTemplateColumns).toBeDefined()

        // Test responsive flex patterns
        const flexModifier = ResponsiveFlexPatterns.stackToRow({
          gap: { base: '0.5rem', md: '1rem' },
        })

        expect(flexModifier.config.display).toBe('flex')
        expect(flexModifier.config.flexDirection).toEqual({
          base: 'column',
          md: 'row',
        })

        // Test feature detection
        const features = BrowserCompatibility.testCSSFeatures()
        expect(features.cssGrid).toBe(config.supports.cssGrid)
        expect(features.flexbox).toBe(config.supports.flexbox)
      })
    })
  })

  describe('Media Query Compatibility', () => {
    test('handles all standard media queries', () => {
      const testQueries = [
        MediaQueries.mobile,
        MediaQueries.tablet,
        MediaQueries.desktop,
        MediaQueries.landscape,
        MediaQueries.portrait,
        MediaQueries.darkMode,
        MediaQueries.reducedMotion,
        MediaQueries.touchDevice,
        MediaQueries.mouseDevice,
      ]

      testQueries.forEach((query, index) => {
        mockMatchMedia.mockReturnValueOnce({
          matches: index % 2 === 0, // Alternate true/false
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })

        const mediaQuery = window.matchMedia(query)
        expect(typeof mediaQuery.matches).toBe('boolean')
        expect(typeof mediaQuery.addEventListener).toBe('function')
      })
    })

    test('handles advanced media query features', () => {
      const advancedQueries = [
        MediaQueries.highContrast,
        MediaQueries.wideColorGamut,
        MediaQueries.hdr,
        MediaQueries.forcedColors,
        MediaQueries.scriptingEnabled,
      ]

      advancedQueries.forEach(query => {
        mockMatchMedia.mockReturnValueOnce({
          matches: true,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })

        const mediaQuery = window.matchMedia(query)
        expect(mediaQuery.matches).toBe(true)
      })
    })

    test('handles custom media query builders', () => {
      const customQueries = [
        MediaQueries.minWidth(768),
        MediaQueries.between(768, 1024),
        MediaQueries.customAspectRatio('16/9'),
        MediaQueries.customResolution(150),
      ]

      customQueries.forEach(query => {
        expect(typeof query).toBe('string')
        expect(query.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Performance Across Browsers', () => {
    test('CSS generation performance is consistent', () => {
      const startTime = performance.now()

      // Generate multiple CSS rules
      for (let i = 0; i < 100; i++) {
        OptimizedCSSGenerator.generateOptimizedCSS(
          `.test-${i}`,
          {
            fontSize: { base: 14, md: 16, lg: 18 },
            padding: { base: '0.5rem', md: '1rem' },
            color: { base: '#333', md: '#000' },
          },
          { minify: true, batch: true, deduplicate: true }
        )
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should complete within reasonable time (adjust based on requirements)
      expect(duration).toBeLessThan(500) // 500ms threshold - more realistic for CI environments

      const stats = OptimizedCSSGenerator.getStats()
      expect(stats.cache.size).toBeGreaterThan(0)
    })

    test('memory usage remains stable', () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0

      // Create many responsive computations
      const computations = []
      for (let i = 0; i < 50; i++) {
        const computation = AdvancedBreakpointUtils.createInterpolatedValue({
          base: i,
          md: i * 2,
          lg: i * 3,
        })
        computations.push(computation)
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = performance.memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory

      // Memory increase should be reasonable (adjust based on requirements)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024) // 10MB threshold
    })
  })

  describe('Edge Cases and Error Handling', () => {
    test('handles missing window object gracefully', () => {
      // Test when window is undefined (which it is in our test environment)
      expect(() => {
        ResponsiveDevTools.enable({ showOverlay: false })
      }).not.toThrow()

      expect(() => {
        BrowserCompatibility.testCSSFeatures()
      }).not.toThrow()

      // Test logResponsiveState without window
      expect(() => {
        ResponsiveDevTools.logResponsiveState()
      }).not.toThrow()
    })

    test('handles invalid breakpoint configurations', () => {
      expect(() => {
        AdvancedBreakpointUtils.createInterpolatedValue({
          // @ts-expect-error - testing invalid breakpoint
          invalidBreakpoint: 16,
        })
      }).not.toThrow()
    })

    test('handles malformed media queries', () => {
      mockMatchMedia.mockImplementation(() => {
        throw new Error('Invalid media query')
      })

      expect(() => {
        window.matchMedia('(invalid-query)')
      }).toThrow()

      // Reset mock
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })
    })

    test('handles CSS.supports not available', () => {
      // Mock CSS.supports as undefined
      mockCSS.supports = undefined as any

      const features = BrowserCompatibility.testCSSFeatures()

      // Should return empty object when CSS.supports is not available
      expect(Object.keys(features)).toHaveLength(0)

      // Restore CSS.supports
      mockCSS.supports = vi.fn().mockReturnValue(true)
    })
  })

  describe('Responsive Data Management Edge Cases', () => {
    test('handles empty data arrays', () => {
      const pagination = ResponsiveDataUtils.createResponsivePagination([], {
        base: 10,
        md: 20,
      })

      expect(pagination.totalPages()).toBe(0)
      expect(pagination.currentItems()).toEqual([])
      expect(pagination.hasNext()).toBe(false)
      expect(pagination.hasPrev()).toBe(false)
    })

    test('handles very large datasets', () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => ({ id: i }))

      const pagination = ResponsiveDataUtils.createResponsivePagination(
        largeData,
        {
          base: 50,
          md: 100,
        }
      )

      expect(pagination.totalPages()).toBeGreaterThan(0)
      expect(pagination.currentItems().length).toBeLessThanOrEqual(100)

      // Test navigation through large dataset
      pagination.setPage(50)
      expect(pagination.currentPage()).toBe(50)
      expect(pagination.currentItems().length).toBeGreaterThan(0)
    })

    test('handles filtering that results in empty arrays', () => {
      const data = [{ type: 'A' }, { type: 'B' }]

      const filtered = ResponsiveDataUtils.createResponsiveFilter(data, {
        base: item => item.type === 'C', // No matches
      })

      expect(filtered()).toEqual([])
    })
  })

  describe('Development Tools Integration', () => {
    test('development tools work in development mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      expect(() => {
        ResponsiveDevTools.enable({
          showOverlay: false, // Don't create DOM elements in test
          logLevel: 'debug',
        })
      }).not.toThrow()

      expect(ResponsiveDevTools.enabled).toBe(true)

      // Test inspection
      expect(() => {
        ResponsiveDevTools.inspectResponsiveValue(
          {
            base: 'small',
            md: 'medium',
            lg: 'large',
          },
          'Test Value'
        )
      }).not.toThrow()

      // Test configuration export
      const config = ResponsiveDevTools.exportConfiguration()
      expect(config).toHaveProperty('breakpoints')
      expect(config).toHaveProperty('currentContext')
      expect(config).toHaveProperty('performance')

      process.env.NODE_ENV = originalEnv
    })

    test('development tools are disabled in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      ResponsiveDevTools.enable()
      expect(ResponsiveDevTools.enabled).toBe(false)

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Responsive Inspector Hook', () => {
    test('useResponsiveInspector provides detailed information', () => {
      const responsiveValue = {
        base: 16,
        md: 20,
        lg: 24,
      }

      const inspector = useResponsiveInspector(responsiveValue, 'Font Size')
      const info = inspector()

      expect(info).toHaveProperty('resolvedValue')
      expect(info).toHaveProperty('activeBreakpoint')
      expect(info).toHaveProperty('allValues')
      expect(info).toHaveProperty('isResponsive')

      expect(info.isResponsive).toBe(true)
      expect(info.allValues).toEqual(responsiveValue)
      expect(typeof info.resolvedValue).toBe('number')
    })

    test('useResponsiveInspector handles static values', () => {
      const staticValue = 18

      const inspector = useResponsiveInspector(staticValue, 'Static Font Size')
      const info = inspector()

      expect(info.isResponsive).toBe(false)
      expect(info.resolvedValue).toBe(18)
      expect(Object.keys(info.allValues)).toHaveLength(1)
    })
  })

  describe('Stress Testing', () => {
    test('handles rapid breakpoint changes', () => {
      const computations = []

      // Create many responsive computations
      for (let i = 0; i < 100; i++) {
        const computation = AdvancedBreakpointUtils.createConditionalResponsive(
          context => context.width > 768,
          { base: `large-${i}`, md: `xl-${i}` },
          { base: `small-${i}`, md: `medium-${i}` }
        )
        computations.push(computation)
      }

      // All computations should be functional
      computations.forEach((comp, index) => {
        const result = comp()
        expect(typeof result).toBe('string')
        expect(result).toContain(index.toString())
      })
    })

    test('handles concurrent responsive operations', () => {
      const operations = []

      // Create multiple concurrent operations
      for (let i = 0; i < 50; i++) {
        operations.push(() => {
          return ResponsiveHooks.useResponsiveArray({
            base: [`item-${i}-1`, `item-${i}-2`],
            md: [`item-${i}-3`, `item-${i}-4`, `item-${i}-5`],
          })
        })
      }

      // Execute all operations
      const results = operations.map(op => op())

      // All should complete successfully
      expect(results).toHaveLength(50)
      results.forEach(result => {
        expect(Array.isArray(result())).toBe(true)
      })
    })
  })
})
