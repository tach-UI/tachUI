/**
 * Tests for performance profiling system
 */
import { describe, it, expect } from 'vitest'
import {
  PerformanceProfiler,
  RenderProfiler,
  MemoryProfiler,
  BundleAnalyzer,
} from '../../src/profiler'

describe('Performance Profiler', () => {
  describe('PerformanceProfiler', () => {
    it('should initialize with configuration', () => {
      const config = {
        metrics: ['component-renders', 'memory-usage'],
        thresholds: { renderTime: 16, memoryGrowth: 10 },
      }

      // Mock console.log to avoid output during tests
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      PerformanceProfiler.initialize(config)

      expect(consoleSpy).toHaveBeenCalledWith(
        'PerformanceProfiler initialized with config:',
        config
      )

      consoleSpy.mockRestore()
    })

    it('should handle empty configuration', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      PerformanceProfiler.initialize({})

      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('RenderProfiler', () => {
    it('should wrap components for profiling', () => {
      const mockComponent = { type: 'Button', props: {} }

      const config = {
        name: 'TestComponent',
        warnThreshold: 10,
        trackReRenders: true,
      }

      const wrappedComponent = RenderProfiler.wrap(mockComponent, config)

      // Since this is a placeholder implementation, it should return the original component
      expect(wrappedComponent).toBe(mockComponent)
    })

    it('should handle undefined config', () => {
      const mockComponent = { type: 'Button', props: {} }

      const wrappedComponent = RenderProfiler.wrap(
        mockComponent,
        undefined as any
      )

      expect(wrappedComponent).toBe(mockComponent)
    })
  })

  describe('MemoryProfiler', () => {
    it('should start memory monitoring', () => {
      const config = {
        interval: 10000,
        warnThreshold: 50,
        detectLeaks: true,
      }

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      MemoryProfiler.startMonitoring(config)

      expect(consoleSpy).toHaveBeenCalledWith(
        'MemoryProfiler started with config:',
        config
      )

      consoleSpy.mockRestore()
    })

    it('should handle empty configuration', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      MemoryProfiler.startMonitoring({})

      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('BundleAnalyzer', () => {
    it('should analyze bundle', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      BundleAnalyzer.analyze()

      expect(consoleSpy).toHaveBeenCalledWith('Bundle analysis started')

      consoleSpy.mockRestore()
    })
  })

  describe('Integration scenarios', () => {
    it('should support full profiling workflow', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      // Initialize profiler
      PerformanceProfiler.initialize({
        metrics: ['component-renders', 'reactive-updates', 'memory-usage'],
      })

      // Start memory monitoring
      MemoryProfiler.startMonitoring({
        interval: 5000,
        warnThreshold: 100,
      })

      // Wrap a component
      const mockComponent = { type: 'ExpensiveComponent', props: {} }
      const wrapped = RenderProfiler.wrap(mockComponent, {
        name: 'ExpensiveComponent',
        warnThreshold: 10,
      })

      // Analyze bundle
      BundleAnalyzer.analyze()

      expect(consoleSpy).toHaveBeenCalledTimes(3)
      expect(wrapped).toBe(mockComponent)

      consoleSpy.mockRestore()
    })

    it('should handle development-only usage', () => {
      // These functions should work regardless of NODE_ENV
      expect(() => {
        PerformanceProfiler.initialize({})
        MemoryProfiler.startMonitoring({})
        BundleAnalyzer.analyze()
      }).not.toThrow()
    })
  })
})
