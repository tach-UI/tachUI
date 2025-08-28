/**
 * Memory Leak Testing Framework
 * 
 * Comprehensive memory leak detection and testing utilities for TachUI components.
 * Tracks component lifecycles, memory usage, and detects potential leaks.
 */

import { afterEach, beforeEach } from 'vitest'

export interface MemorySnapshot {
  timestamp: number
  heapUsed: number
  heapTotal: number
  external: number
  arrayBuffers: number
  rss: number
}

export interface MemoryLeakReport {
  leaksDetected: boolean
  memoryGrowth: number
  memoryGrowthPercent: number
  suspiciousPatterns: string[]
  componentLeaks: ComponentLeakInfo[]
  recommendations: string[]
}

export interface ComponentLeakInfo {
  componentType: string
  instanceCount: number
  retainedSize: number
  suspectedLeakType: 'event-listener' | 'timer' | 'closure' | 'dom-reference' | 'unknown'
}

export interface MemoryTestConfig {
  enableGC?: boolean
  maxMemoryGrowthMB?: number
  maxMemoryGrowthPercent?: number
  sampleInterval?: number
  enableDetailedTracking?: boolean
}

export class MemoryLeakTester {
  private config: Required<MemoryTestConfig>
  private initialSnapshot: MemorySnapshot | null = null
  private snapshots: MemorySnapshot[] = []
  private trackedComponents: WeakRef<any>[] = []
  private componentRegistry: Map<string, Set<WeakRef<any>>> = new Map()
  private eventListenerCount: number = 0
  private timerCount: number = 0
  private intervalHandle: NodeJS.Timeout | null = null

  // Track original APIs for monitoring
  private originalAddEventListener = EventTarget.prototype.addEventListener
  private originalRemoveEventListener = EventTarget.prototype.removeEventListener
  private originalSetTimeout = global.setTimeout
  private originalSetInterval = global.setInterval
  private originalClearTimeout = global.clearTimeout
  private originalClearInterval = global.clearInterval

  constructor(config: MemoryTestConfig = {}) {
    this.config = {
      enableGC: config.enableGC ?? true,
      maxMemoryGrowthMB: config.maxMemoryGrowthMB ?? 10,
      maxMemoryGrowthPercent: config.maxMemoryGrowthPercent ?? 50,
      sampleInterval: config.sampleInterval ?? 100,
      enableDetailedTracking: config.enableDetailedTracking ?? true,
      ...config
    }
  }

  /**
   * Start memory leak testing session
   */
  async startTest(): Promise<void> {
    // Force garbage collection if available
    if (this.config.enableGC && global.gc) {
      global.gc()
      // Wait a bit for GC to complete
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    this.initialSnapshot = this.takeMemorySnapshot()
    this.snapshots = [this.initialSnapshot]
    
    if (this.config.enableDetailedTracking) {
      this.setupMemoryTracking()
    }

    // Start periodic memory sampling
    this.startMemorySampling()
  }

  /**
   * Track a component instance for memory leak detection
   */
  trackComponent(component: any, componentType: string = 'unknown'): void {
    const weakRef = new WeakRef(component)
    this.trackedComponents.push(weakRef)

    // Group by component type
    if (!this.componentRegistry.has(componentType)) {
      this.componentRegistry.set(componentType, new Set())
    }
    this.componentRegistry.get(componentType)!.add(weakRef)

    // Add component metadata for tracking
    if (component && typeof component === 'object') {
      (component as any).__memoryTestMetadata = {
        componentType,
        createdAt: Date.now(),
        trackingId: Math.random().toString(36).substr(2, 9)
      }
    }
  }

  /**
   * Force cleanup of tracked components
   */
  cleanupComponents(): void {
    // Clear all component references
    this.trackedComponents = []
    this.componentRegistry.clear()
  }

  /**
   * End memory testing session and generate report
   */
  async endTest(): Promise<MemoryLeakReport> {
    // Stop memory sampling
    this.stopMemorySampling()

    // Clear component references to allow garbage collection
    this.cleanupComponents()

    // Force garbage collection and wait
    if (this.config.enableGC && global.gc) {
      global.gc()
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    const finalSnapshot = this.takeMemorySnapshot()
    this.snapshots.push(finalSnapshot)

    // Restore original APIs
    this.restoreAPIs()

    // Generate comprehensive report
    return this.analyzeMemoryLeaks(this.initialSnapshot!, finalSnapshot)
  }

  /**
   * Take a memory usage snapshot
   */
  takeMemorySnapshot(): MemorySnapshot {
    const memory = process.memoryUsage()
    return {
      timestamp: Date.now(),
      heapUsed: memory.heapUsed,
      heapTotal: memory.heapTotal,
      external: memory.external,
      arrayBuffers: memory.arrayBuffers,
      rss: memory.rss
    }
  }

  /**
   * Get current memory usage statistics
   */
  getMemoryStats(): {
    current: MemorySnapshot
    growth: number
    growthPercent: number
    snapshots: MemorySnapshot[]
  } {
    const current = this.takeMemorySnapshot()
    const initial = this.initialSnapshot || current
    const growth = current.heapUsed - initial.heapUsed
    const growthPercent = (growth / initial.heapUsed) * 100

    return {
      current,
      growth,
      growthPercent,
      snapshots: [...this.snapshots]
    }
  }

  /**
   * Check if there are potential memory leaks
   */
  hasMemoryLeaks(): boolean {
    const stats = this.getMemoryStats()
    const growthMB = stats.growth / (1024 * 1024)
    
    return growthMB > this.config.maxMemoryGrowthMB || 
           stats.growthPercent > this.config.maxMemoryGrowthPercent
  }

  /**
   * Get count of components that should have been garbage collected
   */
  getRetainedComponentCount(): Map<string, number> {
    const retainedCounts = new Map<string, number>()

    this.componentRegistry.forEach((refs, componentType) => {
      let retainedCount = 0
      refs.forEach(ref => {
        if (ref.deref() !== undefined) {
          retainedCount++
        }
      })
      if (retainedCount > 0) {
        retainedCounts.set(componentType, retainedCount)
      }
    })

    return retainedCounts
  }

  private startMemorySampling(): void {
    this.intervalHandle = setInterval(() => {
      this.snapshots.push(this.takeMemorySnapshot())
      
      // Keep only last 100 snapshots to prevent memory growth
      if (this.snapshots.length > 100) {
        this.snapshots = this.snapshots.slice(-100)
      }
    }, this.config.sampleInterval)
  }

  private stopMemorySampling(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle)
      this.intervalHandle = null
    }
  }

  private setupMemoryTracking(): void {
    // Track event listeners
    EventTarget.prototype.addEventListener = (...args) => {
      this.eventListenerCount++
      return this.originalAddEventListener.apply(this, args)
    }

    EventTarget.prototype.removeEventListener = (...args) => {
      this.eventListenerCount = Math.max(0, this.eventListenerCount - 1)
      return this.originalRemoveEventListener.apply(this, args)
    }

    // Track timers
    global.setTimeout = ((...args) => {
      this.timerCount++
      const id = this.originalSetTimeout(...args)
      return id
    }) as any

    global.setInterval = ((...args) => {
      this.timerCount++
      const id = this.originalSetInterval(...args)
      return id
    }) as any

    global.clearTimeout = ((id) => {
      this.timerCount = Math.max(0, this.timerCount - 1)
      return this.originalClearTimeout(id)
    }) as any

    global.clearInterval = ((id) => {
      this.timerCount = Math.max(0, this.timerCount - 1)
      return this.originalClearInterval(id)
    }) as any
  }

  private restoreAPIs(): void {
    EventTarget.prototype.addEventListener = this.originalAddEventListener
    EventTarget.prototype.removeEventListener = this.originalRemoveEventListener
    global.setTimeout = this.originalSetTimeout
    global.setInterval = this.originalSetInterval
    global.clearTimeout = this.originalClearTimeout
    global.clearInterval = this.originalClearInterval
  }

  private analyzeMemoryLeaks(initial: MemorySnapshot, final: MemorySnapshot): MemoryLeakReport {
    const memoryGrowth = final.heapUsed - initial.heapUsed
    const memoryGrowthPercent = (memoryGrowth / initial.heapUsed) * 100
    const growthMB = memoryGrowth / (1024 * 1024)

    const suspiciousPatterns: string[] = []
    const recommendations: string[] = []

    // Analyze growth patterns
    if (memoryGrowthPercent > this.config.maxMemoryGrowthPercent) {
      suspiciousPatterns.push(`High memory growth: ${memoryGrowthPercent.toFixed(2)}%`)
    }

    if (growthMB > this.config.maxMemoryGrowthMB) {
      suspiciousPatterns.push(`Large memory growth: ${growthMB.toFixed(2)}MB`)
    }

    // Check for retained components
    const retainedComponents = this.getRetainedComponentCount()
    const componentLeaks: ComponentLeakInfo[] = []

    retainedComponents.forEach((count, componentType) => {
      componentLeaks.push({
        componentType,
        instanceCount: count,
        retainedSize: 0, // Would need more sophisticated analysis
        suspectedLeakType: 'unknown'
      })
      suspiciousPatterns.push(`${count} retained ${componentType} instances`)
    })

    // Check for excessive event listeners or timers
    if (this.eventListenerCount > 50) {
      suspiciousPatterns.push(`High event listener count: ${this.eventListenerCount}`)
      recommendations.push('Check for event listeners not being removed on component cleanup')
    }

    if (this.timerCount > 20) {
      suspiciousPatterns.push(`High timer count: ${this.timerCount}`)
      recommendations.push('Check for timers/intervals not being cleared on component cleanup')
    }

    // Analyze memory growth trend
    if (this.snapshots.length > 10) {
      const recentGrowth = this.analyzeGrowthTrend()
      if (recentGrowth.isIncreasing) {
        suspiciousPatterns.push('Continuous memory growth detected')
        recommendations.push('Memory usage is trending upward - investigate for memory leaks')
      }
    }

    // Generate recommendations based on patterns
    if (componentLeaks.length > 0) {
      recommendations.push('Ensure all component cleanup methods are called')
      recommendations.push('Check for circular references in component state')
    }

    if (memoryGrowth > 0) {
      recommendations.push('Consider implementing object pooling for frequently created objects')
      recommendations.push('Review usage of closures that might capture large objects')
    }

    return {
      leaksDetected: suspiciousPatterns.length > 0,
      memoryGrowth,
      memoryGrowthPercent,
      suspiciousPatterns,
      componentLeaks,
      recommendations
    }
  }

  private analyzeGrowthTrend(): { isIncreasing: boolean; slope: number } {
    if (this.snapshots.length < 5) {
      return { isIncreasing: false, slope: 0 }
    }

    // Simple linear regression to detect trend
    const recent = this.snapshots.slice(-10)
    const n = recent.length
    
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0
    
    recent.forEach((snapshot, i) => {
      const x = i
      const y = snapshot.heapUsed
      sumX += x
      sumY += y
      sumXY += x * y
      sumXX += x * x
    })

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    
    return {
      isIncreasing: slope > 0,
      slope
    }
  }
}

/**
 * Auto-setup for memory leak testing
 */
export function setupMemoryLeakTesting(config?: MemoryTestConfig): MemoryLeakTester {
  const tester = new MemoryLeakTester(config)

  beforeEach(async () => {
    await tester.startTest()
  })

  afterEach(async () => {
    const report = await tester.endTest()
    
    // Fail test if memory leaks detected
    if (report.leaksDetected) {
      const errorMessage = [
        'Memory leak detected!',
        `Memory growth: ${(report.memoryGrowth / (1024 * 1024)).toFixed(2)}MB (${report.memoryGrowthPercent.toFixed(2)}%)`,
        'Suspicious patterns:',
        ...report.suspiciousPatterns.map(p => `  - ${p}`),
        'Recommendations:',
        ...report.recommendations.map(r => `  - ${r}`)
      ].join('\n')
      
      throw new Error(errorMessage)
    }
  })

  return tester
}

/**
 * Memory testing utilities
 */
export const memoryTestUtils = {
  /**
   * Run a function multiple times and check for memory growth
   */
  async testRepeatedExecution<T>(
    fn: () => T | Promise<T>,
    iterations: number = 100,
    config?: MemoryTestConfig
  ): Promise<MemoryLeakReport> {
    const tester = new MemoryLeakTester(config)
    await tester.startTest()

    for (let i = 0; i < iterations; i++) {
      await fn()
      
      // Occasional manual GC during long tests
      if (i % 25 === 0 && global.gc) {
        global.gc()
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }

    const report = await tester.endTest()
    return report
  },

  /**
   * Simulate long-running application scenario
   */
  async simulateLongRunningApp(
    scenario: () => Promise<void>,
    duration: number = 10000 // 10 seconds
  ): Promise<MemoryLeakReport> {
    const tester = new MemoryLeakTester({ sampleInterval: 50 })
    await tester.startTest()

    const startTime = Date.now()
    const endTime = startTime + duration

    while (Date.now() < endTime) {
      await scenario()
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return await tester.endTest()
  },

  /**
   * Create a memory stress test
   */
  async stressTest(
    createComponent: () => any,
    destroyComponent: (component: any) => void,
    cycles: number = 1000
  ): Promise<MemoryLeakReport> {
    const tester = new MemoryLeakTester()
    await tester.startTest()

    for (let i = 0; i < cycles; i++) {
      const component = createComponent()
      tester.trackComponent(component, 'stress-test')
      
      // Let component exist for a bit
      await new Promise(resolve => setTimeout(resolve, 1))
      
      destroyComponent(component)
      
      // Periodic cleanup
      if (i % 100 === 0) {
        if (global.gc) global.gc()
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }

    return await tester.endTest()
  }
}