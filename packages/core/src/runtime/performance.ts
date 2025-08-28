/**
 * Performance Monitoring System (Phase 3.2.2)
 *
 * Comprehensive performance monitoring and debugging tools for TachUI.
 * Tracks component lifecycle metrics, reactive system performance,
 * and provides detailed debugging information.
 */

import { createSignal } from '../reactive'

/**
 * Performance metric types
 */
export interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count'
  timestamp: number
  category: 'component' | 'reactive' | 'render' | 'memory'
  componentId?: string
  phase?: string
}

/**
 * Component performance data
 */
export interface ComponentMetrics {
  id: string
  name: string
  mountTime: number
  renderTime: number
  updateCount: number
  propsChanges: number
  lastRenderDuration: number
  memoryUsage: number
  children: ComponentMetrics[]
}

/**
 * Reactive system metrics
 */
export interface ReactiveMetrics {
  signalCount: number
  computedCount: number
  effectCount: number
  signalUpdates: number
  computedRecalculations: number
  effectExecutions: number
  averageUpdateTime: number
  memoryFootprint: number
}

/**
 * Performance monitoring options
 */
export interface MonitoringOptions {
  enabled: boolean
  trackComponents: boolean
  trackReactive: boolean
  trackMemory: boolean
  trackRender: boolean
  sampleRate: number
  maxMetrics: number
}

/**
 * Performance event listener
 */
export type PerformanceListener = (metric: PerformanceMetric) => void

/**
 * Comprehensive performance monitoring system
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor

  private options: MonitoringOptions = {
    enabled: false,
    trackComponents: true,
    trackReactive: true,
    trackMemory: true,
    trackRender: true,
    sampleRate: 1.0,
    maxMetrics: 1000,
  }

  private metrics: PerformanceMetric[] = []
  private componentMetrics = new Map<string, ComponentMetrics>()
  private reactiveMetrics: ReactiveMetrics = {
    signalCount: 0,
    computedCount: 0,
    effectCount: 0,
    signalUpdates: 0,
    computedRecalculations: 0,
    effectExecutions: 0,
    averageUpdateTime: 0,
    memoryFootprint: 0,
  }

  private listeners: PerformanceListener[] = []
  private timers = new Map<string, number>()

  // Reactive signals for real-time monitoring
  private metricsSignal: () => PerformanceMetric[]
  private setMetrics: (value: PerformanceMetric[]) => void
  private componentMetricsSignal: () => Map<string, ComponentMetrics>
  private setComponentMetrics: (value: Map<string, ComponentMetrics>) => void

  constructor() {
    // Initialize reactive signals
    const [metricsSignal, setMetrics] = createSignal<PerformanceMetric[]>([])
    const [componentMetricsSignal, setComponentMetrics] = createSignal<
      Map<string, ComponentMetrics>
    >(new Map())

    this.metricsSignal = metricsSignal
    this.setMetrics = setMetrics
    this.componentMetricsSignal = componentMetricsSignal
    this.setComponentMetrics = setComponentMetrics
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * Configure monitoring options
   */
  configure(options: Partial<MonitoringOptions>): void {
    // Don't directly set enabled state through configuration
    const { enabled: _enabled, ...otherOptions } = options
    this.options = { ...this.options, ...otherOptions }

    // Store the enabled preference but don't auto-enable
    // Use enable()/disable() methods explicitly instead
  }

  /**
   * Enable performance monitoring
   */
  enable(): void {
    this.options.enabled = true
    // Record the enable metric after enabling
    this.recordMetric({
      name: 'monitoring_enabled',
      value: 1,
      unit: 'count',
      timestamp: performance.now(),
      category: 'component',
    })
  }

  /**
   * Disable performance monitoring
   */
  disable(): void {
    // Record the disable metric before disabling
    if (this.options.enabled) {
      this.recordMetric({
        name: 'monitoring_disabled',
        value: 1,
        unit: 'count',
        timestamp: performance.now(),
        category: 'component',
      })
    }
    this.options.enabled = false
  }

  /**
   * Check if monitoring is enabled
   */
  isEnabled(): boolean {
    return this.options.enabled
  }

  /**
   * Start timing an operation
   */
  startTimer(name: string): void {
    if (!this.options.enabled) return
    this.timers.set(name, performance.now())
  }

  /**
   * End timing and record metric
   */
  endTimer(
    name: string,
    category: PerformanceMetric['category'] = 'component',
    componentId?: string
  ): number {
    if (!this.options.enabled) return 0

    const startTime = this.timers.get(name)
    if (startTime === undefined) {
      console.warn(`Timer ${name} was not started`)
      return 0
    }

    const duration = performance.now() - startTime
    this.timers.delete(name)

    this.recordMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: performance.now(),
      category,
      componentId,
    })

    return duration
  }

  /**
   * Record a custom metric
   */
  recordMetric(metric: PerformanceMetric): void {
    if (!this.options.enabled) return
    if (Math.random() > this.options.sampleRate) return

    // Add to metrics array
    this.metrics.push(metric)

    // Limit metrics array size
    if (this.metrics.length > this.options.maxMetrics) {
      this.metrics.shift()
    }

    // Update reactive signal
    this.setMetrics([...this.metrics])

    // Notify listeners
    this.listeners.forEach((listener) => listener(metric))
  }

  /**
   * Track component mount
   */
  trackComponentMount(componentId: string, componentName: string): void {
    if (!this.options.enabled || !this.options.trackComponents) return

    const mountTime = performance.now()
    const metrics: ComponentMetrics = {
      id: componentId,
      name: componentName,
      mountTime,
      renderTime: 0,
      updateCount: 0,
      propsChanges: 0,
      lastRenderDuration: 0,
      memoryUsage: this.estimateMemoryUsage(),
      children: [],
    }

    this.componentMetrics.set(componentId, metrics)
    this.setComponentMetrics(new Map(this.componentMetrics))

    this.recordMetric({
      name: 'component_mount',
      value: 1,
      unit: 'count',
      timestamp: mountTime,
      category: 'component',
      componentId,
      phase: 'mount',
    })
  }

  /**
   * Track component unmount
   */
  trackComponentUnmount(componentId: string): void {
    if (!this.options.enabled || !this.options.trackComponents) return

    const metrics = this.componentMetrics.get(componentId)
    if (metrics) {
      const lifetime = performance.now() - metrics.mountTime

      this.recordMetric({
        name: 'component_unmount',
        value: lifetime,
        unit: 'ms',
        timestamp: performance.now(),
        category: 'component',
        componentId,
        phase: 'unmount',
      })

      this.componentMetrics.delete(componentId)
      this.setComponentMetrics(new Map(this.componentMetrics))
    }
  }

  /**
   * Track component render
   */
  trackComponentRender(componentId: string, duration: number): void {
    if (!this.options.enabled || !this.options.trackRender) return

    const metrics = this.componentMetrics.get(componentId)
    if (metrics) {
      metrics.renderTime += duration
      metrics.lastRenderDuration = duration
      metrics.updateCount++
      this.setComponentMetrics(new Map(this.componentMetrics))
    }

    this.recordMetric({
      name: 'component_render',
      value: duration,
      unit: 'ms',
      timestamp: performance.now(),
      category: 'render',
      componentId,
      phase: 'render',
    })
  }

  /**
   * Track props changes
   */
  trackPropsChange(componentId: string, changedKeys: string[]): void {
    if (!this.options.enabled || !this.options.trackComponents) return

    const metrics = this.componentMetrics.get(componentId)
    if (metrics) {
      metrics.propsChanges++
      this.setComponentMetrics(new Map(this.componentMetrics))
    }

    this.recordMetric({
      name: 'props_change',
      value: changedKeys.length,
      unit: 'count',
      timestamp: performance.now(),
      category: 'component',
      componentId,
      phase: 'update',
    })
  }

  /**
   * Track reactive system metrics
   */
  trackReactiveOperation(
    type: 'signal' | 'computed' | 'effect',
    operation: 'create' | 'update' | 'execute',
    duration?: number
  ): void {
    if (!this.options.enabled || !this.options.trackReactive) return

    // Update reactive metrics
    switch (type) {
      case 'signal':
        if (operation === 'create') this.reactiveMetrics.signalCount++
        if (operation === 'update') this.reactiveMetrics.signalUpdates++
        break
      case 'computed':
        if (operation === 'create') this.reactiveMetrics.computedCount++
        if (operation === 'execute') this.reactiveMetrics.computedRecalculations++
        break
      case 'effect':
        if (operation === 'create') this.reactiveMetrics.effectCount++
        if (operation === 'execute') this.reactiveMetrics.effectExecutions++
        break
    }

    if (duration !== undefined) {
      this.reactiveMetrics.averageUpdateTime =
        (this.reactiveMetrics.averageUpdateTime + duration) / 2
    }

    this.recordMetric({
      name: `reactive_${type}_${operation}`,
      value: duration || 1,
      unit: duration ? 'ms' : 'count',
      timestamp: performance.now(),
      category: 'reactive',
    })
  }

  /**
   * Track memory usage
   */
  trackMemoryUsage(): void {
    if (!this.options.enabled || !this.options.trackMemory) return

    const memoryUsage = this.estimateMemoryUsage()
    this.reactiveMetrics.memoryFootprint = memoryUsage

    this.recordMetric({
      name: 'memory_usage',
      value: memoryUsage,
      unit: 'bytes',
      timestamp: performance.now(),
      category: 'memory',
    })
  }

  /**
   * Estimate memory usage (simplified)
   */
  private estimateMemoryUsage(): number {
    if (
      typeof window !== 'undefined' &&
      'performance' in window &&
      'memory' in window.performance
    ) {
      return (window.performance as any).memory.usedJSHeapSize
    }

    // Fallback estimation
    return this.metrics.length * 200 + this.componentMetrics.size * 500
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  /**
   * Get reactive metrics signal
   */
  getMetricsSignal(): () => PerformanceMetric[] {
    return this.metricsSignal
  }

  /**
   * Get component metrics
   */
  getComponentMetrics(): Map<string, ComponentMetrics> {
    return new Map(this.componentMetrics)
  }

  /**
   * Get component metrics signal
   */
  getComponentMetricsSignal(): () => Map<string, ComponentMetrics> {
    return this.componentMetricsSignal
  }

  /**
   * Get reactive system metrics
   */
  getReactiveMetrics(): ReactiveMetrics {
    return { ...this.reactiveMetrics }
  }

  /**
   * Get metrics by category
   */
  getMetricsByCategory(category: PerformanceMetric['category']): PerformanceMetric[] {
    return this.metrics.filter((metric) => metric.category === category)
  }

  /**
   * Get metrics by component
   */
  getMetricsByComponent(componentId: string): PerformanceMetric[] {
    return this.metrics.filter((metric) => metric.componentId === componentId)
  }

  /**
   * Get average metric value
   */
  getAverageMetric(name: string): number {
    const metrics = this.metrics.filter((metric) => metric.name === name)
    if (metrics.length === 0) return 0

    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0)
    return sum / metrics.length
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    totalMetrics: number
    componentCount: number
    reactive: ReactiveMetrics
    averageRenderTime: number
    averageMemoryUsage: number
    mostActiveComponent: string | null
  } {
    const renderMetrics = this.getMetricsByCategory('render')
    const memoryMetrics = this.getMetricsByCategory('memory')

    const averageRenderTime =
      renderMetrics.length > 0
        ? renderMetrics.reduce((sum, m) => sum + m.value, 0) / renderMetrics.length
        : 0

    const averageMemoryUsage =
      memoryMetrics.length > 0
        ? memoryMetrics.reduce((sum, m) => sum + m.value, 0) / memoryMetrics.length
        : 0

    // Find most active component
    const componentActivity = new Map<string, number>()
    this.metrics.forEach((metric) => {
      if (metric.componentId) {
        componentActivity.set(
          metric.componentId,
          (componentActivity.get(metric.componentId) || 0) + 1
        )
      }
    })

    let mostActiveComponent: string | null = null
    let maxActivity = 0
    for (const [componentId, activity] of componentActivity) {
      if (activity > maxActivity) {
        maxActivity = activity
        mostActiveComponent = componentId
      }
    }

    return {
      totalMetrics: this.metrics.length,
      componentCount: this.componentMetrics.size,
      reactive: this.getReactiveMetrics(),
      averageRenderTime,
      averageMemoryUsage,
      mostActiveComponent,
    }
  }

  /**
   * Add performance listener
   */
  addListener(listener: PerformanceListener): () => void {
    this.listeners.push(listener)

    return () => {
      const index = this.listeners.indexOf(listener)
      if (index !== -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.length = 0
    this.componentMetrics.clear()
    this.timers.clear()
    this.reactiveMetrics = {
      signalCount: 0,
      computedCount: 0,
      effectCount: 0,
      signalUpdates: 0,
      computedRecalculations: 0,
      effectExecutions: 0,
      averageUpdateTime: 0,
      memoryFootprint: 0,
    }

    // Reset configuration to defaults
    this.options = {
      enabled: false,
      trackComponents: true,
      trackReactive: true,
      trackMemory: true,
      trackRender: true,
      sampleRate: 1.0,
      maxMetrics: 1000,
    }

    this.setMetrics([])
    this.setComponentMetrics(new Map())
  }

  /**
   * Export metrics to JSON
   */
  exportMetrics(): string {
    return JSON.stringify(
      {
        metrics: this.metrics,
        componentMetrics: Array.from(this.componentMetrics.entries()),
        reactiveMetrics: this.reactiveMetrics,
        timestamp: Date.now(),
      },
      null,
      2
    )
  }

  /**
   * Import metrics from JSON
   */
  importMetrics(json: string): void {
    try {
      const data = JSON.parse(json)

      if (data.metrics) {
        this.metrics = data.metrics
        this.setMetrics([...this.metrics])
      }

      if (data.componentMetrics) {
        this.componentMetrics = new Map(data.componentMetrics)
        this.setComponentMetrics(new Map(this.componentMetrics))
      }

      if (data.reactiveMetrics) {
        this.reactiveMetrics = data.reactiveMetrics
      }
    } catch (error) {
      console.error('Failed to import metrics:', error)
    }
  }
}

/**
 * Global performance monitor instance
 */
export const globalPerformanceMonitor = PerformanceMonitor.getInstance()

/**
 * Performance monitoring decorators and utilities
 */
export const performanceUtils = {
  /**
   * Measure function execution time
   */
  measure<T>(name: string, fn: () => T, category: PerformanceMetric['category'] = 'component'): T {
    const monitor = PerformanceMonitor.getInstance()
    monitor.startTimer(name)

    try {
      const result = fn()
      monitor.endTimer(name, category)
      return result
    } catch (error) {
      monitor.endTimer(name, category)
      throw error
    }
  },

  /**
   * Async function measurement
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    category: PerformanceMetric['category'] = 'component'
  ): Promise<T> {
    const monitor = PerformanceMonitor.getInstance()
    monitor.startTimer(name)

    try {
      const result = await fn()
      monitor.endTimer(name, category)
      return result
    } catch (error) {
      monitor.endTimer(name, category)
      throw error
    }
  },

  /**
   * Create a performance tracking wrapper for components
   */
  withPerformanceTracking<T extends (...args: any[]) => any>(
    componentFn: T,
    componentName: string
  ): T {
    return ((...args: any[]) => {
      const monitor = PerformanceMonitor.getInstance()
      const componentId = `${componentName}_${Date.now()}`

      monitor.trackComponentMount(componentId, componentName)

      const startTime = performance.now()
      const result = componentFn(...args)
      const duration = performance.now() - startTime

      monitor.trackComponentRender(componentId, duration)

      return result
    }) as T
  },
}
