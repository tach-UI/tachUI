/**
 * Performance Benchmark Tester
 * 
 * A comprehensive performance testing framework for TachUI that:
 * - Establishes performance baselines for components and workflows
 * - Detects performance regressions across builds
 * - Tracks memory usage, DOM performance, and render times
 * - Provides detailed performance reporting and analytics
 */

export interface PerformanceBenchmark {
  name: string
  description: string
  tags: string[]
  category: 'component' | 'workflow' | 'integration' | 'memory' | 'bundle'
  setup: () => Promise<void> | void
  benchmark: () => Promise<PerformanceResult> | PerformanceResult
  teardown?: () => Promise<void> | void
  expectedMetrics?: {
    renderTime?: { max: number, target: number }
    memoryUsage?: { max: number, target: number }
    domNodes?: { max: number, target: number }
    bundleSize?: { max: number, target: number }
    fps?: { min: number, target: number }
  }
}

export interface PerformanceResult {
  renderTime: number
  memoryUsage: {
    initial: number
    peak: number
    final: number
    leak: number
  }
  domMetrics: {
    nodes: number
    depth: number
    updates: number
  }
  timing: {
    setup: number
    execution: number
    cleanup: number
  }
  fps?: number
  bundleSize?: number
  customMetrics?: Record<string, number>
}

export interface BenchmarkComparison {
  current: PerformanceResult
  baseline: PerformanceResult | null
  regression: {
    renderTime: number
    memoryUsage: number
    domNodes: number
    overall: number
  }
  status: 'pass' | 'warning' | 'fail'
  recommendations: string[]
}

export class PerformanceBenchmarkTester {
  private baselines: Map<string, PerformanceResult> = new Map()
  private results: Map<string, PerformanceResult[]> = new Map()
  private config: {
    enableMemoryTracking: boolean
    enableDOMTracking: boolean
    enableTimingTracking: boolean
    regressionThreshold: number
    iterations: number
  }

  constructor(config: Partial<PerformanceBenchmarkTester['config']> = {}) {
    this.config = {
      enableMemoryTracking: true,
      enableDOMTracking: true,
      enableTimingTracking: true,
      regressionThreshold: 0.2, // 20% regression threshold
      iterations: 5,
      ...config
    }
  }

  /**
   * Load existing baselines from storage or previous runs
   */
  async loadBaselines(baselineData?: Record<string, PerformanceResult>): Promise<void> {
    if (baselineData) {
      Object.entries(baselineData).forEach(([name, result]) => {
        this.baselines.set(name, result)
      })
    }
  }

  /**
   * Execute a performance benchmark
   */
  async executeBenchmark(benchmark: PerformanceBenchmark): Promise<BenchmarkComparison> {
    const iterations: PerformanceResult[] = []
    
    for (let i = 0; i < this.config.iterations; i++) {
      const result = await this.runSingleIteration(benchmark)
      iterations.push(result)
      
      // Clean up between iterations
      if (benchmark.teardown) {
        await benchmark.teardown()
      }
      
      // Force garbage collection if available
      if ((global as any).gc) {
        (global as any).gc()
      }
      
      // Wait between iterations
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Calculate average results
    const averageResult = this.calculateAverageResult(iterations)
    
    // Store results
    if (!this.results.has(benchmark.name)) {
      this.results.set(benchmark.name, [])
    }
    this.results.get(benchmark.name)!.push(averageResult)

    // Compare with baseline
    const baseline = this.baselines.get(benchmark.name)
    const comparison = this.compareWithBaseline(averageResult, baseline, benchmark.expectedMetrics)

    return comparison
  }

  /**
   * Run a single benchmark iteration
   */
  private async runSingleIteration(benchmark: PerformanceBenchmark): Promise<PerformanceResult> {
    const startTime = performance.now()
    const initialMemory = this.getMemoryUsage()
    const initialNodes = this.getDOMNodeCount()

    // Setup phase
    const setupStart = performance.now()
    await benchmark.setup()
    const setupTime = performance.now() - setupStart

    // Benchmark execution
    const executionStart = performance.now()
    let result: PerformanceResult

    if (typeof benchmark.benchmark === 'function') {
      const benchmarkResult = await benchmark.benchmark()
      if (this.isPerformanceResult(benchmarkResult)) {
        result = benchmarkResult
      } else {
        // If benchmark doesn't return result, measure automatically
        result = await this.measurePerformance(benchmark.benchmark)
      }
    } else {
      result = await this.measurePerformance(benchmark.benchmark)
    }

    const executionTime = performance.now() - executionStart

    // Cleanup phase
    const cleanupStart = performance.now()
    if (benchmark.teardown) {
      await benchmark.teardown()
    }
    const cleanupTime = performance.now() - cleanupStart

    const finalMemory = this.getMemoryUsage()
    const finalNodes = this.getDOMNodeCount()
    const totalTime = performance.now() - startTime

    // Merge with measured metrics
    return {
      renderTime: result.renderTime || totalTime,
      memoryUsage: {
        initial: initialMemory,
        peak: result.memoryUsage?.peak || finalMemory,
        final: finalMemory,
        leak: finalMemory - initialMemory
      },
      domMetrics: {
        nodes: finalNodes,
        depth: this.getDOMDepth(),
        updates: result.domMetrics?.updates || 0
      },
      timing: {
        setup: setupTime,
        execution: executionTime,
        cleanup: cleanupTime
      },
      fps: result.fps,
      bundleSize: result.bundleSize,
      customMetrics: result.customMetrics
    }
  }

  /**
   * Measure performance of a function automatically
   */
  private async measurePerformance(fn: () => Promise<PerformanceResult> | PerformanceResult): Promise<PerformanceResult> {
    const startTime = performance.now()
    const initialMemory = this.getMemoryUsage()
    let peakMemory = initialMemory

    // Monitor memory during execution
    const memoryMonitor = setInterval(() => {
      const currentMemory = this.getMemoryUsage()
      if (currentMemory > peakMemory) {
        peakMemory = currentMemory
      }
    }, 10)

    try {
      const result = await fn()
      const endTime = performance.now()
      
      clearInterval(memoryMonitor)
      
      return {
        renderTime: endTime - startTime,
        memoryUsage: {
          initial: initialMemory,
          peak: peakMemory,
          final: this.getMemoryUsage(),
          leak: this.getMemoryUsage() - initialMemory
        },
        domMetrics: {
          nodes: this.getDOMNodeCount(),
          depth: this.getDOMDepth(),
          updates: 0
        },
        timing: {
          setup: 0,
          execution: endTime - startTime,
          cleanup: 0
        },
        ...result
      }
    } finally {
      clearInterval(memoryMonitor)
    }
  }

  /**
   * Calculate average result from multiple iterations
   */
  private calculateAverageResult(iterations: PerformanceResult[]): PerformanceResult {
    const count = iterations.length
    
    return {
      renderTime: iterations.reduce((sum, r) => sum + r.renderTime, 0) / count,
      memoryUsage: {
        initial: iterations.reduce((sum, r) => sum + r.memoryUsage.initial, 0) / count,
        peak: Math.max(...iterations.map(r => r.memoryUsage.peak)),
        final: iterations.reduce((sum, r) => sum + r.memoryUsage.final, 0) / count,
        leak: iterations.reduce((sum, r) => sum + r.memoryUsage.leak, 0) / count
      },
      domMetrics: {
        nodes: Math.round(iterations.reduce((sum, r) => sum + r.domMetrics.nodes, 0) / count),
        depth: Math.round(iterations.reduce((sum, r) => sum + r.domMetrics.depth, 0) / count),
        updates: Math.round(iterations.reduce((sum, r) => sum + r.domMetrics.updates, 0) / count)
      },
      timing: {
        setup: iterations.reduce((sum, r) => sum + r.timing.setup, 0) / count,
        execution: iterations.reduce((sum, r) => sum + r.timing.execution, 0) / count,
        cleanup: iterations.reduce((sum, r) => sum + r.timing.cleanup, 0) / count
      },
      fps: iterations[0].fps ? iterations.reduce((sum, r) => sum + (r.fps || 0), 0) / count : undefined,
      bundleSize: iterations[0].bundleSize,
      customMetrics: this.averageCustomMetrics(iterations)
    }
  }

  /**
   * Compare current result with baseline
   */
  private compareWithBaseline(
    current: PerformanceResult, 
    baseline: PerformanceResult | null,
    expectedMetrics?: PerformanceBenchmark['expectedMetrics']
  ): BenchmarkComparison {
    const regression = {
      renderTime: 0,
      memoryUsage: 0,
      domNodes: 0,
      overall: 0
    }

    const recommendations: string[] = []
    let status: 'pass' | 'warning' | 'fail' = 'pass'

    if (baseline) {
      // Calculate regression percentages
      regression.renderTime = (current.renderTime - baseline.renderTime) / baseline.renderTime
      regression.memoryUsage = (current.memoryUsage.peak - baseline.memoryUsage.peak) / baseline.memoryUsage.peak
      regression.domNodes = (current.domMetrics.nodes - baseline.domMetrics.nodes) / baseline.domMetrics.nodes
      regression.overall = (regression.renderTime + regression.memoryUsage + regression.domNodes) / 3

      // Check for significant regressions
      if (regression.renderTime > this.config.regressionThreshold) {
        status = 'fail'
        recommendations.push(`Render time regression of ${(regression.renderTime * 100).toFixed(1)}% detected`)
      }

      if (regression.memoryUsage > this.config.regressionThreshold) {
        status = 'fail'
        recommendations.push(`Memory usage regression of ${(regression.memoryUsage * 100).toFixed(1)}% detected`)
      }

      if (regression.domNodes > this.config.regressionThreshold) {
        status = status === 'fail' ? 'fail' : 'warning'
        recommendations.push(`DOM node count increased by ${(regression.domNodes * 100).toFixed(1)}%`)
      }
    }

    // Check against expected metrics
    if (expectedMetrics) {
      if (expectedMetrics.renderTime && current.renderTime > expectedMetrics.renderTime.max) {
        status = 'fail'
        recommendations.push(`Render time ${current.renderTime.toFixed(2)}ms exceeds maximum ${expectedMetrics.renderTime.max}ms`)
      }

      if (expectedMetrics.memoryUsage && current.memoryUsage.peak > expectedMetrics.memoryUsage.max) {
        status = 'fail'
        recommendations.push(`Memory usage ${this.formatMemory(current.memoryUsage.peak)} exceeds maximum ${this.formatMemory(expectedMetrics.memoryUsage.max)}`)
      }

      if (expectedMetrics.domNodes && current.domMetrics.nodes > expectedMetrics.domNodes.max) {
        status = status === 'fail' ? 'fail' : 'warning'
        recommendations.push(`DOM node count ${current.domMetrics.nodes} exceeds maximum ${expectedMetrics.domNodes.max}`)
      }
    }

    // Performance recommendations
    if (current.memoryUsage.leak > 1048576) { // 1MB leak
      recommendations.push('Potential memory leak detected - investigate cleanup logic')
    }

    if (current.domMetrics.depth > 20) {
      recommendations.push('Deep DOM nesting detected - consider flattening component structure')
    }

    if (current.renderTime > 100) {
      recommendations.push('Slow render time - consider code splitting or virtualization')
    }

    return {
      current,
      baseline,
      regression,
      status,
      recommendations
    }
  }

  /**
   * Set baseline for a benchmark
   */
  setBaseline(name: string, result: PerformanceResult): void {
    this.baselines.set(name, result)
  }

  /**
   * Get all baselines
   */
  getBaselines(): Record<string, PerformanceResult> {
    return Object.fromEntries(this.baselines)
  }

  /**
   * Generate performance report
   */
  generateReport(comparisons: BenchmarkComparison[]): string {
    const report = ['=== Performance Benchmark Report ===\n']
    
    const passed = comparisons.filter(c => c.status === 'pass').length
    const warnings = comparisons.filter(c => c.status === 'warning').length
    const failed = comparisons.filter(c => c.status === 'fail').length

    report.push(`Summary: ${passed} passed, ${warnings} warnings, ${failed} failed\n`)

    comparisons.forEach(comparison => {
      const { current, baseline, regression, status, recommendations } = comparison
      
      report.push(`\n--- Benchmark Results ---`)
      report.push(`Status: ${status.toUpperCase()}`)
      report.push(`Render Time: ${current.renderTime.toFixed(2)}ms`)
      report.push(`Memory Peak: ${this.formatMemory(current.memoryUsage.peak)}`)
      report.push(`DOM Nodes: ${current.domMetrics.nodes}`)
      
      if (baseline) {
        report.push(`\nRegression Analysis:`)
        report.push(`  Render Time: ${regression.renderTime > 0 ? '+' : ''}${(regression.renderTime * 100).toFixed(1)}%`)
        report.push(`  Memory Usage: ${regression.memoryUsage > 0 ? '+' : ''}${(regression.memoryUsage * 100).toFixed(1)}%`)
        report.push(`  DOM Nodes: ${regression.domNodes > 0 ? '+' : ''}${(regression.domNodes * 100).toFixed(1)}%`)
      }

      if (recommendations.length > 0) {
        report.push(`\nRecommendations:`)
        recommendations.forEach(rec => report.push(`  - ${rec}`))
      }
    })

    return report.join('\n')
  }

  // Utility methods
  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize
    }
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed
    }
    // Fallback: estimate based on DOM node count and time
    const nodeCount = this.getDOMNodeCount()
    return nodeCount * 1000 + Date.now() % 10000000 // Simple estimation
  }

  private getDOMNodeCount(): number {
    if (typeof document !== 'undefined') {
      return document.querySelectorAll('*').length
    }
    return 0
  }

  private getDOMDepth(): number {
    if (typeof document !== 'undefined') {
      let maxDepth = 0
      const walker = document.createTreeWalker(document.body || document.documentElement)
      let depth = 0
      
      while (walker.nextNode()) {
        const parentCount = walker.currentNode.parentElement ? 
          walker.currentNode.parentElement.querySelectorAll('*').length : 0
        depth = Math.max(depth, parentCount)
      }
      
      return depth
    }
    return 0
  }

  private formatMemory(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`
  }

  private isPerformanceResult(obj: any): obj is PerformanceResult {
    return obj && typeof obj === 'object' && 'renderTime' in obj
  }

  private averageCustomMetrics(iterations: PerformanceResult[]): Record<string, number> | undefined {
    const firstCustomMetrics = iterations[0].customMetrics
    if (!firstCustomMetrics) return undefined

    const result: Record<string, number> = {}
    Object.keys(firstCustomMetrics).forEach(key => {
      result[key] = iterations.reduce((sum, iteration) => 
        sum + (iteration.customMetrics?.[key] || 0), 0) / iterations.length
    })

    return result
  }
}

export const BenchmarkCategories = {
  COMPONENT_RENDER: 'component',
  WORKFLOW_PERFORMANCE: 'workflow', 
  INTEGRATION_PERFORMANCE: 'integration',
  MEMORY_USAGE: 'memory',
  BUNDLE_SIZE: 'bundle'
} as const

export const BenchmarkPatterns = {
  /**
   * Standard component render benchmark
   */
  componentRender: (componentFn: () => void, iterations = 100): PerformanceBenchmark => ({
    name: 'Component Render Performance',
    description: 'Measures component render performance',
    tags: ['component', 'render'],
    category: 'component',
    setup: async () => {
      document.body.innerHTML = '<div id="benchmark-root"></div>'
    },
    benchmark: async () => {
      const start = performance.now()
      
      for (let i = 0; i < iterations; i++) {
        componentFn()
      }
      
      const end = performance.now()
      
      return {
        renderTime: end - start,
        memoryUsage: { initial: 0, peak: 0, final: 0, leak: 0 },
        domMetrics: { nodes: 0, depth: 0, updates: iterations },
        timing: { setup: 0, execution: end - start, cleanup: 0 },
        customMetrics: { iterations }
      }
    },
    teardown: async () => {
      document.body.innerHTML = ''
    },
    expectedMetrics: {
      renderTime: { max: 100, target: 50 },
      memoryUsage: { max: 10485760, target: 5242880 }, // 10MB max, 5MB target
      domNodes: { max: 1000, target: 500 }
    }
  }),

  /**
   * Memory stress test benchmark
   */
  memoryStress: (stressFn: () => void, iterations = 1000): PerformanceBenchmark => ({
    name: 'Memory Stress Test',
    description: 'Tests memory usage under stress conditions',
    tags: ['memory', 'stress'],
    category: 'memory',
    setup: async () => {
      // Force garbage collection before test
      if ((global as any).gc) {
        (global as any).gc()
      }
    },
    benchmark: async () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0
      let peakMemory = initialMemory
      
      const start = performance.now()
      
      for (let i = 0; i < iterations; i++) {
        stressFn()
        
        const currentMemory = performance.memory?.usedJSHeapSize || 0
        if (currentMemory > peakMemory) {
          peakMemory = currentMemory
        }
      }
      
      const end = performance.now()
      const finalMemory = performance.memory?.usedJSHeapSize || 0
      
      return {
        renderTime: end - start,
        memoryUsage: {
          initial: initialMemory,
          peak: peakMemory,
          final: finalMemory,
          leak: finalMemory - initialMemory
        },
        domMetrics: { nodes: 0, depth: 0, updates: 0 },
        timing: { setup: 0, execution: end - start, cleanup: 0 },
        customMetrics: { iterations, memoryGrowth: peakMemory - initialMemory }
      }
    },
    expectedMetrics: {
      memoryUsage: { max: 52428800, target: 20971520 }, // 50MB max, 20MB target
      renderTime: { max: 1000, target: 500 }
    }
  })
}