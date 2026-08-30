/**
 * Performance Monitoring System Tests
 *
 * Relocated from packages/core/__tests__/runtime/performance.test.ts (re-enabled
 * as part of #219): the PerformanceMonitor implementation now lives in
 * @tachui/devtools (src/runtime/performance.ts). The former DevTools/DevUtils
 * sections tested the removed core `runtime/dev-tools` module and were dropped.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  PerformanceMonitor,
  globalPerformanceMonitor,
  performanceUtils,
  type PerformanceMetric,
  type MonitoringOptions
} from '../../src/runtime/performance'

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor

  beforeEach(() => {
    monitor = PerformanceMonitor.getInstance()
    monitor.clear()
    monitor.disable()
  })

  afterEach(() => {
    monitor.clear()
    monitor.disable()
  })

  describe('Basic Configuration', () => {
    it('should create singleton instance', () => {
      const instance1 = PerformanceMonitor.getInstance()
      const instance2 = PerformanceMonitor.getInstance()
      expect(instance1).toBe(instance2)
    })

    it('should configure monitoring options', () => {
      const options: Partial<MonitoringOptions> = {
        enabled: true,
        trackComponents: false,
        sampleRate: 0.5
      }

      monitor.configure(options)
      expect(monitor.isEnabled()).toBe(false) // Not enabled until enable() is called
    })

    it('should enable and disable monitoring', () => {
      expect(monitor.isEnabled()).toBe(false)

      monitor.enable()
      expect(monitor.isEnabled()).toBe(true)

      monitor.disable()
      expect(monitor.isEnabled()).toBe(false)
    })
  })

  describe('Timer Operations', () => {
    beforeEach(() => {
      monitor.enable()
    })

    it('should start and end timers', () => {
      monitor.startTimer('test-operation')

      // Simulate some work
      const start = performance.now()
      while (performance.now() - start < 10) {
        // Wait ~10ms
      }

      const duration = monitor.endTimer('test-operation')
      expect(duration).toBeGreaterThan(5)
      expect(duration).toBeLessThan(50)
    })

    it('should handle missing timer gracefully', () => {
      const duration = monitor.endTimer('non-existent-timer')
      expect(duration).toBe(0)
    })

    it('should record metrics when timer ends', () => {
      monitor.startTimer('metric-test')
      monitor.endTimer('metric-test', 'component', 'comp-123')

      const metrics = monitor.getMetrics()
      // enable() (in beforeEach) emits a 'monitoring_enabled' metric
      // (src/runtime/performance.ts:144-153), so the timer metric is second
      expect(metrics).toHaveLength(2)
      expect(metrics[1].name).toBe('metric-test')
      expect(metrics[1].category).toBe('component')
      expect(metrics[1].componentId).toBe('comp-123')
      expect(metrics[1].unit).toBe('ms')
    })
  })

  describe('Metric Recording', () => {
    beforeEach(() => {
      monitor.enable()
    })

    it('should record custom metrics', () => {
      const metric: PerformanceMetric = {
        name: 'custom-metric',
        value: 42,
        unit: 'count',
        timestamp: performance.now(),
        category: 'reactive'
      }

      monitor.recordMetric(metric)

      const metrics = monitor.getMetrics()
      expect(metrics).toHaveLength(2) // monitoring_enabled + custom-metric
      expect(metrics[1]).toEqual(metric) // custom metric is second
    })

    it('should limit metrics array size', () => {
      // Configure small limit for testing
      monitor.configure({ maxMetrics: 5 })

      // Add more metrics than the limit
      for (let i = 0; i < 10; i++) {
        monitor.recordMetric({
          name: `metric-${i}`,
          value: i,
          unit: 'count',
          timestamp: performance.now(),
          category: 'component'
        })
      }

      const metrics = monitor.getMetrics()
      expect(metrics).toHaveLength(5)
      expect(metrics[0].name).toBe('metric-5') // Oldest removed
    })

    it('should respect sample rate', () => {
      monitor.configure({ sampleRate: 0 }) // No sampling

      monitor.recordMetric({
        name: 'sampled-metric',
        value: 1,
        unit: 'count',
        timestamp: performance.now(),
        category: 'component'
      })

      // Sampled out — only the 'monitoring_enabled' metric from enable() remains
      expect(monitor.getMetrics().find(m => m.name === 'sampled-metric')).toBeUndefined()
    })
  })

  describe('Component Tracking', () => {
    beforeEach(() => {
      monitor.enable()
    })

    it('should track component mount', () => {
      monitor.trackComponentMount('comp-1', 'TestComponent')

      const componentMetrics = monitor.getComponentMetrics()
      expect(componentMetrics.has('comp-1')).toBe(true)

      const metrics = componentMetrics.get('comp-1')!
      expect(metrics.id).toBe('comp-1')
      expect(metrics.name).toBe('TestComponent')
      expect(metrics.updateCount).toBe(0)
    })

    it('should track component unmount', () => {
      monitor.trackComponentMount('comp-1', 'TestComponent')
      monitor.trackComponentUnmount('comp-1')

      const componentMetrics = monitor.getComponentMetrics()
      expect(componentMetrics.has('comp-1')).toBe(false)

      const metrics = monitor.getMetrics()
      const unmountMetric = metrics.find(m => m.name === 'component_unmount')
      expect(unmountMetric).toBeDefined()
      expect(unmountMetric!.componentId).toBe('comp-1')
    })

    it('should track component renders', () => {
      monitor.trackComponentMount('comp-1', 'TestComponent')
      monitor.trackComponentRender('comp-1', 15.5)

      const componentMetrics = monitor.getComponentMetrics()
      const metrics = componentMetrics.get('comp-1')!

      expect(metrics.renderTime).toBe(15.5)
      expect(metrics.lastRenderDuration).toBe(15.5)
      expect(metrics.updateCount).toBe(1)
    })

    it('should track props changes', () => {
      monitor.trackComponentMount('comp-1', 'TestComponent')
      monitor.trackPropsChange('comp-1', ['prop1', 'prop2'])

      const componentMetrics = monitor.getComponentMetrics()
      const metrics = componentMetrics.get('comp-1')!

      expect(metrics.propsChanges).toBe(1)

      const allMetrics = monitor.getMetrics()
      const propsMetric = allMetrics.find(m => m.name === 'props_change')
      expect(propsMetric).toBeDefined()
      expect(propsMetric!.value).toBe(2) // Number of changed keys
    })
  })

  describe('Reactive System Tracking', () => {
    beforeEach(() => {
      monitor.enable()
    })

    it('should track reactive operations', () => {
      monitor.trackReactiveOperation('signal', 'create')
      monitor.trackReactiveOperation('signal', 'update', 5.2)
      monitor.trackReactiveOperation('computed', 'execute', 3.1)

      const reactiveMetrics = monitor.getReactiveMetrics()
      expect(reactiveMetrics.signalCount).toBe(1)
      expect(reactiveMetrics.signalUpdates).toBe(1)
      expect(reactiveMetrics.computedRecalculations).toBe(1)
      expect(reactiveMetrics.averageUpdateTime).toBeGreaterThan(0)
    })

    it('should update average update time correctly', () => {
      monitor.trackReactiveOperation('signal', 'update', 10)
      monitor.trackReactiveOperation('signal', 'update', 20)

      const reactiveMetrics = monitor.getReactiveMetrics()
      // Exponential moving average: avg = (avg + duration) / 2
      // (src/runtime/performance.ts:375-376) → (0+10)/2 = 5, then (5+20)/2 = 12.5
      expect(reactiveMetrics.averageUpdateTime).toBe(12.5)
    })
  })

  describe('Memory Tracking', () => {
    beforeEach(() => {
      monitor.enable()
    })

    it('should track memory usage', () => {
      monitor.trackMemoryUsage()

      const metrics = monitor.getMetrics()
      const memoryMetric = metrics.find(m => m.name === 'memory_usage')

      expect(memoryMetric).toBeDefined()
      expect(memoryMetric!.category).toBe('memory')
      expect(memoryMetric!.unit).toBe('bytes')
      expect(memoryMetric!.value).toBeGreaterThan(0)
    })
  })

  describe('Metrics Analysis', () => {
    beforeEach(() => {
      monitor.enable()

      // Add test data
      monitor.recordMetric({
        name: 'test-metric',
        value: 10,
        unit: 'ms',
        timestamp: performance.now(),
        category: 'render',
        componentId: 'comp-1'
      })

      monitor.recordMetric({
        name: 'test-metric',
        value: 20,
        unit: 'ms',
        timestamp: performance.now(),
        category: 'render',
        componentId: 'comp-2'
      })
    })

    it('should get metrics by category', () => {
      const renderMetrics = monitor.getMetricsByCategory('render')
      expect(renderMetrics).toHaveLength(2)
      expect(renderMetrics.every(m => m.category === 'render')).toBe(true)
    })

    it('should get metrics by component', () => {
      const comp1Metrics = monitor.getMetricsByComponent('comp-1')
      expect(comp1Metrics).toHaveLength(1)
      expect(comp1Metrics[0].componentId).toBe('comp-1')
    })

    it('should calculate average metric value', () => {
      const average = monitor.getAverageMetric('test-metric')
      expect(average).toBe(15) // (10 + 20) / 2
    })

    it('should generate performance summary', () => {
      monitor.trackComponentMount('comp-1', 'TestComponent')

      const summary = monitor.getSummary()
      expect(summary.totalMetrics).toBeGreaterThan(0)
      expect(summary.componentCount).toBe(1)
      expect(summary.averageRenderTime).toBeGreaterThan(0)
      expect(summary.mostActiveComponent).toBeDefined()
    })
  })

  describe('Data Export/Import', () => {
    beforeEach(() => {
      monitor.enable()
    })

    it('should export metrics to JSON', () => {
      monitor.recordMetric({
        name: 'export-test',
        value: 123,
        unit: 'count',
        timestamp: performance.now(),
        category: 'component'
      })

      const exported = monitor.exportMetrics()
      const data = JSON.parse(exported)

      // enable() (in beforeEach) emits 'monitoring_enabled', so export-test is second
      expect(data.metrics).toHaveLength(2)
      expect(data.metrics[1].name).toBe('export-test')
      expect(data.timestamp).toBeTypeOf('number')
    })

    it('should import metrics from JSON', () => {
      const testData = {
        metrics: [{
          name: 'imported-metric',
          value: 456,
          unit: 'ms',
          timestamp: performance.now(),
          category: 'reactive'
        }],
        componentMetrics: [['comp-1', {
          id: 'comp-1',
          name: 'ImportedComponent',
          mountTime: performance.now(),
          renderTime: 0,
          updateCount: 0,
          propsChanges: 0,
          lastRenderDuration: 0,
          memoryUsage: 1024,
          children: []
        }]]
      }

      monitor.importMetrics(JSON.stringify(testData))

      const metrics = monitor.getMetrics()
      expect(metrics).toHaveLength(1)
      expect(metrics[0].name).toBe('imported-metric')

      const componentMetrics = monitor.getComponentMetrics()
      expect(componentMetrics.has('comp-1')).toBe(true)
    })
  })

  describe('Performance Listeners', () => {
    beforeEach(() => {
      monitor.enable()
    })

    it('should add and remove performance listeners', () => {
      const listener = vi.fn()
      const unsubscribe = monitor.addListener(listener)

      monitor.recordMetric({
        name: 'listener-test',
        value: 1,
        unit: 'count',
        timestamp: performance.now(),
        category: 'component'
      })

      expect(listener).toHaveBeenCalledOnce()

      unsubscribe()

      monitor.recordMetric({
        name: 'listener-test-2',
        value: 2,
        unit: 'count',
        timestamp: performance.now(),
        category: 'component'
      })

      expect(listener).toHaveBeenCalledOnce() // Should not be called again
    })
  })
})

describe('Performance Utils', () => {
  beforeEach(() => {
    globalPerformanceMonitor.enable()
  })

  afterEach(() => {
    globalPerformanceMonitor.clear()
    globalPerformanceMonitor.disable()
  })

  it('should measure function execution', () => {
    const result = performanceUtils.measure('test-function', () => {
      // Simulate work
      let sum = 0
      for (let i = 0; i < 1000; i++) {
        sum += i
      }
      return sum
    })

    expect(result).toBe(499500) // Sum of 0..999

    const metrics = globalPerformanceMonitor.getMetrics()
    const measureMetric = metrics.find(m => m.name === 'test-function')
    expect(measureMetric).toBeDefined()
    expect(measureMetric!.unit).toBe('ms')
  })

  it('should measure async function execution', async () => {
    const result = await performanceUtils.measureAsync('async-test', async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
      return 'done'
    })

    expect(result).toBe('done')

    const metrics = globalPerformanceMonitor.getMetrics()
    const measureMetric = metrics.find(m => m.name === 'async-test')
    expect(measureMetric).toBeDefined()
    expect(measureMetric!.value).toBeGreaterThan(8)
  })

  it('should handle errors in measured functions', () => {
    expect(() => {
      performanceUtils.measure('error-test', () => {
        throw new Error('Test error')
      })
    }).toThrow('Test error')

    // Should still record the metric
    const metrics = globalPerformanceMonitor.getMetrics()
    const measureMetric = metrics.find(m => m.name === 'error-test')
    expect(measureMetric).toBeDefined()
  })

  it('should create performance tracking wrapper', () => {
    const testFn = vi.fn(() => 'result')
    const wrappedFn = performanceUtils.withPerformanceTracking(testFn, 'TestComponent')

    const result = wrappedFn('arg1', 'arg2')

    expect(result).toBe('result')
    expect(testFn).toHaveBeenCalledWith('arg1', 'arg2')

    // Should track component mount and render
    const componentMetrics = globalPerformanceMonitor.getComponentMetrics()
    expect(componentMetrics.size).toBe(1)
  })
})
