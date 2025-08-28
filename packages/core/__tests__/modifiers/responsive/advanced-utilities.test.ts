/**
 * Advanced Responsive Utilities Tests
 *
 * Tests for programmatic responsive access, advanced hooks,
 * and complex responsive logic utilities.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { createSignal } from '../../../src/reactive'
import {
  AdvancedBreakpointUtils,
  ResponsiveHooks,
  ResponsiveTargeting,
  ResponsiveDataUtils,
  ResponsiveAdvanced,
} from '../../../src/modifiers/responsive'

// Mock breakpoint system
vi.mock('../../../src/modifiers/responsive/breakpoints', () => {
  const currentBreakpoint = createSignal('md')
  return {
    getCurrentBreakpoint: vi.fn(() => currentBreakpoint[0]),
    getBreakpointIndex: vi.fn((bp: string) => {
      const order = ['base', 'sm', 'md', 'lg', 'xl', '2xl']
      return order.indexOf(bp)
    }),
    createBreakpointContext: vi.fn(() => ({
      current: 'md',
      width: 768,
      height: 1024,
      isTouch: false,
      userAgent: 'test',
    })),
    getCurrentBreakpointConfig: vi.fn(() => ({
      base: '0px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    })),
  }
})

describe('Advanced Responsive Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AdvancedBreakpointUtils', () => {
    test('createResponsiveResolver works with custom logic', () => {
      const resolver = AdvancedBreakpointUtils.createResponsiveResolver(
        (breakpoint, context) => {
          return breakpoint === 'md' ? 'medium' : 'other'
        }
      )

      expect(resolver()).toBe('medium')
    })

    test('createInterpolatedValue interpolates between breakpoints', () => {
      const interpolated = AdvancedBreakpointUtils.createInterpolatedValue({
        base: 16,
        md: 24,
        lg: 32,
      })

      // Should return interpolated value based on current context
      expect(typeof interpolated()).toBe('number')
    })

    test('createInterpolatedValue handles edge cases', () => {
      const interpolated = AdvancedBreakpointUtils.createInterpolatedValue({
        md: 20,
      })

      expect(interpolated()).toBe(20)
    })

    test('createInterpolatedValue with smoothing options', () => {
      const interpolated = AdvancedBreakpointUtils.createInterpolatedValue(
        { base: 10, lg: 30 },
        { smoothing: 'ease', clamp: true }
      )

      expect(typeof interpolated()).toBe('number')
    })

    test('createConditionalResponsive switches based on condition', () => {
      const conditional = AdvancedBreakpointUtils.createConditionalResponsive(
        context => context.width > 800,
        { base: 'large', md: 'very-large' },
        { base: 'small', md: 'medium' }
      )

      expect(typeof conditional()).toBe('string')
    })
  })

  describe('ResponsiveHooks', () => {
    test('useResponsiveArray resolves responsive arrays', () => {
      const arrays = {
        base: ['a', 'b'],
        md: ['c', 'd', 'e'],
        lg: ['f', 'g', 'h', 'i'],
      }

      const responsiveArray = ResponsiveHooks.useResponsiveArray(arrays)
      const result = responsiveArray()

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })

    test('useResponsiveObject resolves responsive objects', () => {
      const objects = {
        base: { layout: 'stack' },
        md: { layout: 'grid', columns: 2 },
        lg: { layout: 'grid', columns: 3 },
      }

      const responsiveObject = ResponsiveHooks.useResponsiveObject(objects)
      const result = responsiveObject()

      expect(result).toBeTruthy()
      expect(typeof result).toBe('object')
    })

    test('useResponsiveFunction resolves responsive functions', () => {
      const functions = {
        base: (x: number) => x * 2,
        md: (x: number) => x * 3,
        lg: (x: number) => x * 4,
      }

      const responsiveFunction =
        ResponsiveHooks.useResponsiveFunction(functions)
      const fn = responsiveFunction()

      expect(typeof fn).toBe('function')
      if (fn) {
        expect(fn(5)).toBe(15) // md breakpoint: x * 3
      }
    })

    test('useResponsiveState manages responsive state', () => {
      const [state, setState] = ResponsiveHooks.useResponsiveState({
        base: 'initial',
        md: 'medium',
      })

      expect(typeof state()).toBe('string')

      // Test state setting
      setState('updated')
      expect(state()).toBe('updated')

      // Test responsive state setting
      setState({ base: 'new-base', lg: 'new-large' })
      expect(typeof state()).toBe('string')
    })

    test('useResponsiveComputation handles computations with dependencies', () => {
      const [dependency, setDependency] = createSignal(1)

      const computation = ResponsiveHooks.useResponsiveComputation(
        context => context.width * dependency(),
        [dependency]
      )

      const initialResult = computation()
      expect(typeof initialResult).toBe('number')

      setDependency(2)
      const updatedResult = computation()
      expect(updatedResult).toBe(initialResult * 2)
    })

    test('useResponsiveEffect runs effects on breakpoint changes', () => {
      const effectFn = vi.fn()

      ResponsiveHooks.useResponsiveEffect(effectFn)

      expect(effectFn).toHaveBeenCalled()
    })
  })

  describe('ResponsiveTargeting', () => {
    test('onBreakpoints executes callback only on specific breakpoints', () => {
      const callback = vi.fn()

      const dispose = ResponsiveTargeting.onBreakpoints(['md', 'lg'], callback)

      expect(callback).toHaveBeenCalled()
      dispose()
    })

    test('onBreakpointChange detects breakpoint changes', () => {
      const callback = vi.fn()

      const dispose = ResponsiveTargeting.onBreakpointChange(callback)

      // Initial call doesn't trigger change callback
      expect(callback).not.toHaveBeenCalled()

      dispose()
    })

    test('onBreakpointRange handles range entry/exit', () => {
      const callbacks = {
        onEnter: vi.fn(),
        onLeave: vi.fn(),
        onWithin: vi.fn(),
      }

      const dispose = ResponsiveTargeting.onBreakpointRange(
        'sm',
        'lg',
        callbacks
      )

      // Should be within range (md is between sm and lg)
      expect(callbacks.onEnter).toHaveBeenCalled()
      expect(callbacks.onWithin).toHaveBeenCalled()

      dispose()
    })
  })

  describe('ResponsiveDataUtils', () => {
    test('createResponsivePagination handles responsive pagination', () => {
      const data = Array.from({ length: 50 }, (_, i) => i)
      const itemsPerPage = { base: 5, md: 10, lg: 20 }

      const pagination = ResponsiveDataUtils.createResponsivePagination(
        data,
        itemsPerPage
      )

      expect(pagination.currentPage()).toBe(1)
      expect(pagination.totalPages()).toBeGreaterThan(0)
      expect(Array.isArray(pagination.currentItems())).toBe(true)
      expect(pagination.hasNext()).toBeTruthy()
      expect(pagination.hasPrev()).toBeFalsy()

      // Test navigation
      pagination.nextPage()
      expect(pagination.currentPage()).toBe(2)
      expect(pagination.hasPrev()).toBeTruthy()

      pagination.prevPage()
      expect(pagination.currentPage()).toBe(1)

      pagination.setPage(5)
      expect(pagination.currentPage()).toBe(5)
    })

    test('createResponsiveFilter filters data responsively', () => {
      const data = [
        { id: 1, category: 'A' },
        { id: 2, category: 'B' },
        { id: 3, category: 'A' },
        { id: 4, category: 'C' },
      ]

      const filters = {
        base: (item: (typeof data)[0]) => item.category === 'A',
        md: (item: (typeof data)[0]) => item.category === 'B',
        lg: (item: (typeof data)[0]) => item.id > 2,
      }

      const filtered = ResponsiveDataUtils.createResponsiveFilter(data, filters)
      const result = filtered()

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      // At md breakpoint, should filter for category 'B'
      expect(result[0].category).toBe('B')
    })

    test('createResponsiveSort sorts data responsively', () => {
      const data = [
        { id: 3, name: 'Charlie' },
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]

      const sorters = {
        base: (a: (typeof data)[0], b: (typeof data)[0]) => a.id - b.id,
        md: (a: (typeof data)[0], b: (typeof data)[0]) =>
          a.name.localeCompare(b.name),
        lg: (a: (typeof data)[0], b: (typeof data)[0]) => b.id - a.id,
      }

      const sorted = ResponsiveDataUtils.createResponsiveSort(data, sorters)
      const result = sorted()

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(3)
      // At md breakpoint, should sort by name
      expect(result[0].name).toBe('Alice')
    })
  })

  describe('ResponsiveAdvanced aggregated exports', () => {
    test('exports all utility classes', () => {
      expect(ResponsiveAdvanced.Breakpoints).toBe(AdvancedBreakpointUtils)
      expect(ResponsiveAdvanced.Hooks).toBe(ResponsiveHooks)
      expect(ResponsiveAdvanced.Targeting).toBe(ResponsiveTargeting)
      expect(ResponsiveAdvanced.Data).toBe(ResponsiveDataUtils)
    })
  })

  describe('Integration scenarios', () => {
    test('complex responsive layout with multiple utilities', () => {
      // Simulate a responsive dashboard layout
      const [selectedTab, setSelectedTab] = ResponsiveHooks.useResponsiveState({
        base: 'overview',
        md: 'details',
        lg: 'analytics',
      })

      const data = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        type: i % 3 === 0 ? 'important' : 'normal',
      }))

      const pagination = ResponsiveDataUtils.createResponsivePagination(data, {
        base: 5,
        md: 15,
        lg: 25,
      })

      const filtered = ResponsiveDataUtils.createResponsiveFilter(data, {
        base: item => item.type === 'important',
        md: () => true, // Show all
        lg: () => true,
      })

      expect(typeof selectedTab()).toBe('string')
      expect(pagination.totalPages()).toBeGreaterThan(0)
      expect(Array.isArray(filtered())).toBe(true)

      // Test state interaction
      setSelectedTab('custom')
      expect(selectedTab()).toBe('custom')
    })

    test('responsive interpolation with live data', () => {
      const interpolated = AdvancedBreakpointUtils.createInterpolatedValue(
        {
          base: 12,
          sm: 14,
          md: 16,
          lg: 18,
          xl: 20,
          '2xl': 24,
        },
        {
          smoothing: 'ease-out',
          clamp: true,
        }
      )

      const result = interpolated()
      expect(typeof result).toBe('number')
      expect(result).toBeGreaterThanOrEqual(12)
      expect(result).toBeLessThanOrEqual(24)
    })

    test('conditional responsive behavior with complex logic', () => {
      const conditional = AdvancedBreakpointUtils.createConditionalResponsive(
        context => context.isTouch && context.width < 768,
        // Mobile touch values
        { base: 'touch-mobile', sm: 'touch-tablet' },
        // Desktop/non-touch values
        { base: 'desktop-small', md: 'desktop-large' }
      )

      expect(typeof conditional()).toBe('string')
    })
  })
})
