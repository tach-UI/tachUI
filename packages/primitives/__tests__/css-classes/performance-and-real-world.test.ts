/**
 * CSS Classes Enhancement - Performance and Real-World Usage Tests
 *
 * Tests for performance benchmarks and realistic usage scenarios
 */

import { describe, it, expect } from 'vitest'
import { createSignal, createComputed } from '@tachui/core'
import { CSSClassManager } from '@tachui/core/css-classes'
import { Text, Button, VStack, HStack } from '../../src'

describe('CSS Classes Enhancement - Performance and Real-World Usage', () => {
  describe('Performance Benchmarks', () => {
    it('should process simple classes quickly', () => {
      const manager = new CSSClassManager()
      const iterations = 10000

      const start = performance.now()
      for (let i = 0; i < iterations; i++) {
        manager.processClasses('btn primary active')
      }
      const end = performance.now()

      const timePerOperation = (end - start) / iterations
      expect(timePerOperation).toBeLessThan(0.1) // Less than 0.1ms per operation
    })

    it('should handle complex class strings efficiently', () => {
      const manager = new CSSClassManager()
      const complexClasses =
        'bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-white font-bold py-2 px-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out'
      const iterations = 1000

      const start = performance.now()
      for (let i = 0; i < iterations; i++) {
        manager.processClasses(complexClasses)
      }
      const end = performance.now()

      const timePerOperation = (end - start) / iterations
      expect(timePerOperation).toBeLessThan(0.5) // Less than 0.5ms per complex operation
    })

    it('should benefit from caching on repeated operations', () => {
      const manager = new CSSClassManager()
      const classes = 'btn primary large active responsive'

      // Warm up cache
      manager.processClasses(classes)

      // Measure cached operations
      const iterations = 10000
      const start = performance.now()
      for (let i = 0; i < iterations; i++) {
        manager.processClasses(classes)
      }
      const end = performance.now()

      const timePerOperation = (end - start) / iterations
      expect(timePerOperation).toBeLessThan(0.01) // Should be very fast with caching
    })

    it('should handle large arrays of classes efficiently', () => {
      const manager = new CSSClassManager()
      const largeArray = Array.from({ length: 1000 }, (_, i) => `class-${i}`)
      const iterations = 100

      const start = performance.now()
      for (let i = 0; i < iterations; i++) {
        manager.processClasses([...largeArray]) // Spread to avoid reference caching
      }
      const end = performance.now()

      const timePerOperation = (end - start) / iterations
      expect(timePerOperation).toBeLessThan(10) // Less than 10ms per large array
    })

    it('should handle rapid signal updates efficiently', () => {
      const [signal, setSignal] = createSignal('initial-class')
      const iterations = 1000

      const start = performance.now()
      for (let i = 0; i < iterations; i++) {
        setSignal(`class-${i}`)
        // Signal update overhead is what we're measuring
      }
      const end = performance.now()

      const timePerUpdate = (end - start) / iterations
      expect(timePerUpdate).toBeLessThan(0.1) // Should update quickly
    })
  })

  describe('Real-World Usage Scenarios', () => {
    it('should handle a typical e-commerce product card', () => {
      const productCard = VStack({
        css: 'bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden',
        children: [
          // Product image placeholder
          VStack({ css: 'w-full h-48 bg-gray-200' }),

          // Product info
          VStack({
            css: 'p-4 space-y-2',
            children: [
              Text('Product Name', {
                css: 'text-lg font-semibold text-gray-900 truncate',
              }),
              Text('$29.99', {
                css: 'text-xl font-bold text-green-600',
              }),
              Button({
                title: 'Add to Cart',
                css: 'w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors duration-200',
              }),
            ],
          }),
        ],
      })

      const start = performance.now()
      const elements = productCard.render()
      const end = performance.now()

      expect(elements).toHaveLength(1)
      expect(end - start).toBeLessThan(10) // Should render quickly
    })

    it('should handle a responsive navigation bar', () => {
      const [isMobileMenuOpen, setMobileMenuOpen] = createSignal(false)

      const navbar = HStack({
        css: 'bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 lg:px-8',
        children: [
          // Logo
          Text('Logo', {
            css: 'text-2xl font-bold text-gray-900',
          }),

          // Desktop menu
          HStack({
            css: 'hidden md:flex space-x-8 ml-10',
            children: [
              Text('Home', {
                css: 'text-gray-900 hover:text-gray-700 px-3 py-2 text-sm font-medium',
              }),
              Text('Products', {
                css: 'text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium',
              }),
              Text('About', {
                css: 'text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium',
              }),
            ],
          }),

          // Mobile menu button
          Button({
            title: '☰',
            css: createComputed(
              () =>
                `md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isMobileMenuOpen() ? 'bg-gray-100' : ''
                }`
            ),
          }),
        ],
      })

      const elements = navbar.render()
      expect(elements).toHaveLength(1)
      expect(elements[0].props?.className).toContain('bg-white shadow-sm')
    })

    it('should handle a dashboard with multiple widgets', () => {
      const createWidget = (
        title: string,
        value: string,
        trend: 'up' | 'down' | 'neutral'
      ) => {
        const trendColor =
          trend === 'up'
            ? 'text-green-600'
            : trend === 'down'
              ? 'text-red-600'
              : 'text-gray-600'

        return VStack({
          css: 'bg-white rounded-lg shadow p-6 border border-gray-200',
          children: [
            Text(title, {
              css: 'text-sm font-medium text-gray-500 uppercase tracking-wide',
            }),
            Text(value, { css: 'text-3xl font-bold text-gray-900 mt-2' }),
            Text(
              trend === 'up' ? '↑ 12%' : trend === 'down' ? '↓ 5%' : '→ 0%',
              {
                css: `text-sm font-medium ${trendColor} mt-1`,
              }
            ),
          ],
        })
      }

      const dashboard = VStack({
        css: 'min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8',
        children: [
          Text('Dashboard', { css: 'text-3xl font-bold text-gray-900 mb-8' }),

          // Metrics grid
          HStack({
            css: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8',
            children: [
              createWidget('Total Sales', '$54,239', 'up'),
              createWidget('New Customers', '2,842', 'up'),
              createWidget('Conversion Rate', '3.24%', 'down'),
              createWidget('Average Order', '$67.91', 'neutral'),
            ],
          }),
        ],
      })

      const start = performance.now()
      const elements = dashboard.render()
      const end = performance.now()

      expect(elements).toHaveLength(1)
      expect(end - start).toBeLessThan(20) // Complex dashboard should still render quickly
    })

    it('should handle dynamic theming across components', () => {
      const [theme, setTheme] = createSignal('light')

      const getThemeClasses = (component: 'button' | 'text' | 'card') => {
        return createComputed(() => {
          const isDark = theme() === 'dark'

          switch (component) {
            case 'button':
              return isDark
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            case 'text':
              return isDark ? 'text-gray-100' : 'text-gray-900'
            case 'card':
              return isDark
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            default:
              return ''
          }
        })
      }

      const themedCard = VStack({
        css: createComputed(
          () => `rounded-lg shadow-md p-6 border ${getThemeClasses('card')()}`
        ),
        children: [
          Text('Themed Content', {
            css: createComputed(
              () => `text-xl font-bold ${getThemeClasses('text')()}`
            ),
          }),
          Button({
            title: 'Toggle Theme',
            css: getThemeClasses('button'),
            action: () => setTheme(theme() === 'light' ? 'dark' : 'light'),
          }),
        ],
      })

      // Test both themes
      const lightElements = themedCard.render()
      expect(lightElements).toHaveLength(1)

      setTheme('dark')
      const darkElements = themedCard.render()
      expect(darkElements).toHaveLength(1)

      // Should handle theme switching efficiently
      const start = performance.now()
      for (let i = 0; i < 100; i++) {
        setTheme(i % 2 === 0 ? 'light' : 'dark')
      }
      const end = performance.now()

      expect(end - start).toBeLessThan(50) // Theme switching should be fast
    })
  })

  describe('Memory Usage and Cleanup', () => {
    it('should not accumulate memory with temporary components', () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0

      // Create many temporary components with complex CSS classes
      for (let batch = 0; batch < 10; batch++) {
        const components = Array.from({ length: 100 }, (_, i) => {
          const complexClasses = `component-${batch}-${i} bg-gradient-to-r from-blue-400 to-purple-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200`

          return VStack({
            css: complexClasses,
            children: [
              Text(`Content ${i}`, {
                css: 'text-center text-lg font-semibold',
              }),
              Button({
                title: `Action ${i}`,
                css: 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-medium py-1 px-3 rounded',
              }),
            ],
          })
        })

        // Render all components
        components.forEach(component => component.render())

        // Components go out of scope at end of loop
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = performance.memory?.usedJSHeapSize || 0
      const memoryGrowth = finalMemory - initialMemory

      // Memory growth should be reasonable (allowing for test framework overhead)
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024) // Less than 10MB growth
    })

    it('should handle cache cleanup properly', () => {
      const manager = new CSSClassManager()
      manager.updateConfig({ maxCacheSize: 100 })

      // Fill cache beyond capacity multiple times
      for (let cycle = 0; cycle < 5; cycle++) {
        for (let i = 0; i < 200; i++) {
          manager.processClasses(`cycle-${cycle}-class-${i} additional-${i}`)
        }
      }

      // Cache should still work efficiently
      const start = performance.now()
      const result = manager.processClasses('test-after-cleanup')
      const end = performance.now()

      expect(result).toEqual(['test-after-cleanup'])
      expect(end - start).toBeLessThan(1) // Should still be fast
    })
  })

  describe('Framework Integration Performance', () => {
    it('should handle Tailwind CSS utility classes efficiently', () => {
      const tailwindClasses = [
        // Layout
        'flex',
        'flex-col',
        'grid',
        'grid-cols-12',
        'gap-4',
        'space-y-2',
        // Sizing
        'w-full',
        'h-screen',
        'min-h-0',
        'max-w-md',
        'mx-auto',
        // Colors
        'bg-blue-500',
        'text-white',
        'border-gray-300',
        'ring-blue-500',
        // Typography
        'text-lg',
        'font-bold',
        'leading-tight',
        'tracking-wide',
        // Effects
        'shadow-lg',
        'rounded-lg',
        'opacity-75',
        'transform',
        'scale-105',
        // Interactive
        'hover:bg-blue-600',
        'focus:ring-2',
        'transition-colors',
        'duration-200',
      ]

      const manager = new CSSClassManager()
      const iterations = 1000

      const start = performance.now()
      for (let i = 0; i < iterations; i++) {
        manager.processClasses(tailwindClasses.join(' '))
      }
      const end = performance.now()

      const timePerOperation = (end - start) / iterations
      expect(timePerOperation).toBeLessThan(0.2) // Should handle Tailwind efficiently
    })

    it('should handle mixed framework classes without conflicts', () => {
      const mixedClasses = [
        // Tailwind
        'bg-blue-500',
        'text-white',
        'p-4',
        'rounded-lg',
        // Bootstrap
        'btn',
        'btn-primary',
        'mb-3',
        'd-flex',
        'justify-content-center',
        // Custom
        'custom-component',
        'theme-dark',
        'animation-fade-in',
      ]

      const manager = new CSSClassManager()
      const result = manager.processClasses(mixedClasses)

      // Should include all classes
      expect(result).toHaveLength(mixedClasses.length)
      mixedClasses.forEach(className => {
        expect(result).toContain(className)
      })
    })
  })
})
