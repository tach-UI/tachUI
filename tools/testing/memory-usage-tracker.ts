/**
 * Memory Usage Tracking and Alerts System
 * 
 * A comprehensive system for tracking and alerting on memory usage patterns:
 * - Real-time memory monitoring during test execution
 * - Memory leak detection and analysis
 * - Automated alerts for memory thresholds
 * - Memory usage pattern analysis and reporting
 */

export interface MemorySnapshot {
  timestamp: number
  heapUsed: number
  heapTotal: number
  external: number
  arrayBuffers: number
  rss?: number // Resident Set Size (Node.js specific)
}

export interface MemoryThresholds {
  heapUsage: {
    warning: number // MB
    critical: number // MB
  }
  heapGrowthRate: {
    warning: number // MB per second
    critical: number // MB per second
  }
  memoryLeak: {
    warning: number // MB accumulated over time
    critical: number // MB accumulated over time
  }
  gcPressure: {
    warning: number // percentage
    critical: number // percentage
  }
}

export interface MemoryAlert {
  id: string
  timestamp: number
  type: 'warning' | 'critical'
  category: 'heap_usage' | 'growth_rate' | 'memory_leak' | 'gc_pressure' | 'pattern_anomaly'
  message: string
  currentValue: number
  threshold: number
  recommendations: string[]
  snapshot: MemorySnapshot
  context?: any
}

export interface MemoryAnalysis {
  testName: string
  duration: number
  snapshots: MemorySnapshot[]
  alerts: MemoryAlert[]
  summary: {
    initialHeap: number
    peakHeap: number
    finalHeap: number
    netGrowth: number
    avgGrowthRate: number
    maxGrowthRate: number
    potentialLeak: boolean
    leakEstimate?: number
    gcEfficiency: number
  }
  patterns: {
    type: 'stable' | 'linear_growth' | 'periodic_spikes' | 'exponential_growth' | 'sawtooth'
    confidence: number
    description: string
  }
  recommendations: string[]
}

export interface MemoryUsageReport {
  timestamp: string
  testSuite: string
  environment: string
  totalTests: number
  testsWithAlerts: number
  criticalAlerts: number
  warningAlerts: number
  overallMemoryHealth: 'good' | 'warning' | 'critical'
  analyses: MemoryAnalysis[]
  globalRecommendations: string[]
  trendAnalysis?: {
    pattern: 'improving' | 'degrading' | 'stable'
    confidence: number
    description: string
  }
}

export class MemoryUsageTracker {
  private thresholds: MemoryThresholds
  private snapshots: MemorySnapshot[] = []
  private alerts: MemoryAlert[] = []
  private monitoringInterval: NodeJS.Timeout | null = null
  private isMonitoring = false
  private config: {
    snapshotInterval: number // ms
    alertCooldown: number // ms
    enableGCTracking: boolean
    maxSnapshots: number
  }
  private lastAlertTime: Map<string, number> = new Map()
  private testContext: { name: string, startTime: number } | null = null

  constructor(
    thresholds: Partial<MemoryThresholds> = {},
    config: Partial<MemoryUsageTracker['config']> = {}
  ) {
    this.thresholds = {
      heapUsage: { warning: 100, critical: 200 }, // 100MB warning, 200MB critical
      heapGrowthRate: { warning: 5, critical: 10 }, // 5MB/s warning, 10MB/s critical
      memoryLeak: { warning: 50, critical: 100 }, // 50MB warning, 100MB critical
      gcPressure: { warning: 70, critical: 90 }, // 70% warning, 90% critical
      ...thresholds
    }

    this.config = {
      snapshotInterval: 500, // Every 500ms
      alertCooldown: 5000, // 5 seconds between same type alerts
      enableGCTracking: true,
      maxSnapshots: 1000, // Keep last 1000 snapshots
      ...config
    }
  }

  /**
   * Start monitoring memory usage for a test
   */
  startMonitoring(testName: string): void {
    if (this.isMonitoring) {
      this.stopMonitoring()
    }

    this.testContext = {
      name: testName,
      startTime: Date.now()
    }

    this.snapshots = []
    this.alerts = []
    this.lastAlertTime.clear()
    this.isMonitoring = true

    // Take initial snapshot
    this.takeSnapshot()

    // Start periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.takeSnapshot()
      this.analyzeCurrentState()
    }, this.config.snapshotInterval)
  }

  /**
   * Stop monitoring and return analysis
   */
  stopMonitoring(): MemoryAnalysis | null {
    if (!this.isMonitoring || !this.testContext) {
      return null
    }

    this.isMonitoring = false
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    // Take final snapshot
    this.takeSnapshot()

    const analysis = this.generateAnalysis()
    this.testContext = null

    return analysis
  }

  /**
   * Take a memory snapshot
   */
  private takeSnapshot(): void {
    let snapshot: MemorySnapshot

    if (typeof performance !== 'undefined' && (performance as any).memory) {
      // Browser environment
      const memory = (performance as any).memory
      snapshot = {
        timestamp: Date.now(),
        heapUsed: memory.usedJSHeapSize,
        heapTotal: memory.totalJSHeapSize,
        external: 0,
        arrayBuffers: 0
      }
    } else if (typeof process !== 'undefined' && process.memoryUsage) {
      // Node.js environment
      const memory = process.memoryUsage()
      snapshot = {
        timestamp: Date.now(),
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
        external: memory.external,
        arrayBuffers: memory.arrayBuffers,
        rss: memory.rss
      }
    } else {
      // Fallback for test environments - use deterministic values
      const baseHeap = 25000000 // 25MB base heap
      const totalHeap = 60000000 // 60MB total heap
      const snapshotCount = this.snapshots.length
      
      snapshot = {
        timestamp: Date.now(),
        heapUsed: baseHeap + (snapshotCount * 100000), // Slight growth pattern: 25MB + 100KB per snapshot
        heapTotal: totalHeap, // Stable total heap
        external: 5000000, // 5MB external
        arrayBuffers: 2000000 // 2MB array buffers
      }
    }

    this.snapshots.push(snapshot)

    // Limit snapshots to prevent memory issues in the tracker itself
    if (this.snapshots.length > this.config.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.config.maxSnapshots)
    }
  }

  /**
   * Analyze current memory state for alerts
   */
  private analyzeCurrentState(): void {
    if (this.snapshots.length < 2) return

    const current = this.snapshots[this.snapshots.length - 1]
    const previous = this.snapshots[this.snapshots.length - 2]

    // Check heap usage threshold
    this.checkHeapUsageThreshold(current)

    // Check growth rate
    this.checkGrowthRate(current, previous)

    // Check for memory leaks (requires more history)
    if (this.snapshots.length >= 10) {
      this.checkMemoryLeak()
    }

    // Check GC pressure
    this.checkGCPressure(current)
  }

  /**
   * Check if heap usage exceeds thresholds
   */
  private checkHeapUsageThreshold(snapshot: MemorySnapshot): void {
    const heapMB = snapshot.heapUsed / 1024 / 1024

    if (heapMB >= this.thresholds.heapUsage.critical) {
      this.createAlert('critical', 'heap_usage', 
        `Critical heap usage: ${heapMB.toFixed(1)}MB exceeds ${this.thresholds.heapUsage.critical}MB threshold`,
        heapMB, this.thresholds.heapUsage.critical, snapshot,
        [
          'Immediate memory cleanup required',
          'Check for memory leaks in component lifecycle',
          'Consider reducing data payload sizes',
          'Implement object pooling for frequently created objects'
        ]
      )
    } else if (heapMB >= this.thresholds.heapUsage.warning) {
      this.createAlert('warning', 'heap_usage',
        `High heap usage: ${heapMB.toFixed(1)}MB exceeds ${this.thresholds.heapUsage.warning}MB threshold`,
        heapMB, this.thresholds.heapUsage.warning, snapshot,
        [
          'Monitor memory usage closely',
          'Review recent code changes for memory implications',
          'Consider implementing lazy loading'
        ]
      )
    }
  }

  /**
   * Check memory growth rate
   */
  private checkGrowthRate(current: MemorySnapshot, previous: MemorySnapshot): void {
    const timeDelta = (current.timestamp - previous.timestamp) / 1000 // seconds
    const memoryDelta = (current.heapUsed - previous.heapUsed) / 1024 / 1024 // MB
    const growthRate = memoryDelta / timeDelta // MB/second

    if (growthRate >= this.thresholds.heapGrowthRate.critical) {
      this.createAlert('critical', 'growth_rate',
        `Critical memory growth rate: ${growthRate.toFixed(2)}MB/s exceeds ${this.thresholds.heapGrowthRate.critical}MB/s`,
        growthRate, this.thresholds.heapGrowthRate.critical, current,
        [
          'Severe memory leak suspected',
          'Stop test execution if possible',
          'Review object creation patterns',
          'Check for infinite loops or recursion'
        ]
      )
    } else if (growthRate >= this.thresholds.heapGrowthRate.warning) {
      this.createAlert('warning', 'growth_rate',
        `High memory growth rate: ${growthRate.toFixed(2)}MB/s exceeds ${this.thresholds.heapGrowthRate.warning}MB/s`,
        growthRate, this.thresholds.heapGrowthRate.warning, current,
        [
          'Potential memory leak detected',
          'Monitor for sustained growth',
          'Check event listener cleanup',
          'Review component unmounting logic'
        ]
      )
    }
  }

  /**
   * Check for memory leaks over time
   */
  private checkMemoryLeak(): void {
    const windowSize = Math.min(20, this.snapshots.length)
    const recentSnapshots = this.snapshots.slice(-windowSize)
    
    if (recentSnapshots.length < 10) return

    const first = recentSnapshots[0]
    const last = recentSnapshots[recentSnapshots.length - 1]
    const totalGrowth = (last.heapUsed - first.heapUsed) / 1024 / 1024 // MB
    const timeSpan = (last.timestamp - first.timestamp) / 1000 // seconds

    // Calculate trend to see if memory is consistently growing
    let growthCount = 0
    for (let i = 1; i < recentSnapshots.length; i++) {
      if (recentSnapshots[i].heapUsed > recentSnapshots[i - 1].heapUsed) {
        growthCount++
      }
    }

    const growthRatio = growthCount / (recentSnapshots.length - 1)

    // Memory leak indicators: consistent growth over time
    if (totalGrowth >= this.thresholds.memoryLeak.critical && growthRatio > 0.7) {
      this.createAlert('critical', 'memory_leak',
        `Critical memory leak: ${totalGrowth.toFixed(1)}MB growth over ${timeSpan.toFixed(1)}s (${growthRatio.toFixed(2)} growth ratio)`,
        totalGrowth, this.thresholds.memoryLeak.critical, last,
        [
          'Memory leak confirmed - immediate action required',
          'Check for unclosed resources (event listeners, timers, subscriptions)',
          'Review component cleanup in componentWillUnmount/onCleanup',
          'Use memory profiler to identify leak sources'
        ]
      )
    } else if (totalGrowth >= this.thresholds.memoryLeak.warning && growthRatio > 0.6) {
      this.createAlert('warning', 'memory_leak',
        `Potential memory leak: ${totalGrowth.toFixed(1)}MB growth over ${timeSpan.toFixed(1)}s (${growthRatio.toFixed(2)} growth ratio)`,
        totalGrowth, this.thresholds.memoryLeak.warning, last,
        [
          'Investigate potential memory leak',
          'Monitor for continued growth',
          'Review recent code changes',
          'Check garbage collection patterns'
        ]
      )
    }
  }

  /**
   * Check garbage collection pressure
   */
  private checkGCPressure(snapshot: MemorySnapshot): void {
    // GC pressure estimation based on heap usage vs total
    const gcPressure = (snapshot.heapUsed / snapshot.heapTotal) * 100

    if (gcPressure >= this.thresholds.gcPressure.critical) {
      this.createAlert('critical', 'gc_pressure',
        `Critical GC pressure: ${gcPressure.toFixed(1)}% heap utilization`,
        gcPressure, this.thresholds.gcPressure.critical, snapshot,
        [
          'Garbage collection under severe pressure',
          'Reduce object allocations',
          'Force garbage collection if possible',
          'Consider increasing heap size'
        ]
      )
    } else if (gcPressure >= this.thresholds.gcPressure.warning) {
      this.createAlert('warning', 'gc_pressure',
        `High GC pressure: ${gcPressure.toFixed(1)}% heap utilization`,
        gcPressure, this.thresholds.gcPressure.warning, snapshot,
        [
          'Monitor garbage collection performance',
          'Consider optimizing object lifecycle',
          'Review large object allocations'
        ]
      )
    }
  }

  /**
   * Create a memory alert with cooldown
   */
  private createAlert(
    type: 'warning' | 'critical',
    category: MemoryAlert['category'],
    message: string,
    currentValue: number,
    threshold: number,
    snapshot: MemorySnapshot,
    recommendations: string[],
    context?: any
  ): void {
    const alertKey = `${category}-${type}`
    const now = Date.now()
    const lastAlert = this.lastAlertTime.get(alertKey)

    // Apply cooldown to prevent spam
    if (lastAlert && (now - lastAlert) < this.config.alertCooldown) {
      return
    }

    const alert: MemoryAlert = {
      id: `${alertKey}-${now}`,
      timestamp: now,
      type,
      category,
      message,
      currentValue,
      threshold,
      recommendations,
      snapshot,
      context
    }

    this.alerts.push(alert)
    this.lastAlertTime.set(alertKey, now)
  }

  /**
   * Generate analysis from collected data
   */
  private generateAnalysis(): MemoryAnalysis {
    if (!this.testContext || this.snapshots.length === 0) {
      throw new Error('No monitoring data available for analysis')
    }

    const duration = Date.now() - this.testContext.startTime
    const initial = this.snapshots[0]
    const final = this.snapshots[this.snapshots.length - 1]

    // Calculate peak heap usage
    const peakHeap = Math.max(...this.snapshots.map(s => s.heapUsed))

    // Calculate growth metrics
    const netGrowth = (final.heapUsed - initial.heapUsed) / 1024 / 1024 // MB
    const avgGrowthRate = netGrowth / (duration / 1000) // MB/s

    // Calculate max growth rate
    let maxGrowthRate = 0
    for (let i = 1; i < this.snapshots.length; i++) {
      const timeDelta = (this.snapshots[i].timestamp - this.snapshots[i - 1].timestamp) / 1000
      const memoryDelta = (this.snapshots[i].heapUsed - this.snapshots[i - 1].heapUsed) / 1024 / 1024
      const growthRate = memoryDelta / timeDelta
      maxGrowthRate = Math.max(maxGrowthRate, growthRate)
    }

    // Detect potential memory leaks
    const potentialLeak = this.detectMemoryLeakPattern()
    const leakEstimate = potentialLeak ? this.estimateLeakRate() : undefined

    // Calculate GC efficiency (simplified)
    const gcEfficiency = this.calculateGCEfficiency()

    // Analyze usage patterns
    const patterns = this.analyzeMemoryPatterns()

    // Generate recommendations
    const recommendations = this.generateRecommendations(netGrowth, maxGrowthRate, potentialLeak)

    return {
      testName: this.testContext.name,
      duration,
      snapshots: [...this.snapshots],
      alerts: [...this.alerts],
      summary: {
        initialHeap: initial.heapUsed / 1024 / 1024,
        peakHeap: peakHeap / 1024 / 1024,
        finalHeap: final.heapUsed / 1024 / 1024,
        netGrowth,
        avgGrowthRate,
        maxGrowthRate,
        potentialLeak,
        leakEstimate,
        gcEfficiency
      },
      patterns,
      recommendations
    }
  }

  /**
   * Detect memory leak patterns
   */
  private detectMemoryLeakPattern(): boolean {
    if (this.snapshots.length < 10) return false

    let consecutiveGrowth = 0
    let maxConsecutiveGrowth = 0

    for (let i = 1; i < this.snapshots.length; i++) {
      if (this.snapshots[i].heapUsed > this.snapshots[i - 1].heapUsed) {
        consecutiveGrowth++
        maxConsecutiveGrowth = Math.max(maxConsecutiveGrowth, consecutiveGrowth)
      } else {
        consecutiveGrowth = 0
      }
    }

    // If we see consecutive growth for more than 50% of samples, likely a leak
    return maxConsecutiveGrowth > this.snapshots.length * 0.5
  }

  /**
   * Estimate memory leak rate
   */
  private estimateLeakRate(): number | undefined {
    if (this.snapshots.length < 5) return undefined

    const first = this.snapshots[0]
    const last = this.snapshots[this.snapshots.length - 1]
    const timeSpan = (last.timestamp - first.timestamp) / 1000 // seconds
    const memoryGrowth = (last.heapUsed - first.heapUsed) / 1024 / 1024 // MB

    return memoryGrowth / timeSpan // MB/s
  }

  /**
   * Calculate garbage collection efficiency
   */
  private calculateGCEfficiency(): number {
    if (this.snapshots.length < 5) return 100

    // Look for memory decreases (indicating GC activity)
    let gcEvents = 0
    let totalReleased = 0

    for (let i = 1; i < this.snapshots.length; i++) {
      const memoryChange = this.snapshots[i].heapUsed - this.snapshots[i - 1].heapUsed
      if (memoryChange < -1024 * 1024) { // > 1MB decrease
        gcEvents++
        totalReleased += Math.abs(memoryChange)
      }
    }

    // Simple efficiency metric: how much memory was released relative to allocations
    const totalGrowth = this.snapshots[this.snapshots.length - 1].heapUsed - this.snapshots[0].heapUsed
    if (totalGrowth <= 0) return 100

    return Math.min(100, (totalReleased / totalGrowth) * 100)
  }

  /**
   * Analyze memory usage patterns
   */
  private analyzeMemoryPatterns(): MemoryAnalysis['patterns'] {
    if (this.snapshots.length < 10) {
      return {
        type: 'stable',
        confidence: 0.5,
        description: 'Insufficient data for pattern analysis'
      }
    }

    const values = this.snapshots.map(s => s.heapUsed)
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)

    // Calculate trend
    let upTrend = 0
    let downTrend = 0
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i - 1]) upTrend++
      else if (values[i] < values[i - 1]) downTrend++
    }

    const trendRatio = upTrend / (values.length - 1)

    // Pattern classification
    if (stdDev / mean < 0.1) {
      return {
        type: 'stable',
        confidence: 0.9,
        description: 'Memory usage remains relatively stable'
      }
    } else if (trendRatio > 0.8) {
      const growth = (values[values.length - 1] - values[0]) / values[0]
      if (growth > 0.5) {
        return {
          type: 'exponential_growth',
          confidence: 0.8,
          description: 'Memory shows exponential growth pattern - likely memory leak'
        }
      } else {
        return {
          type: 'linear_growth',
          confidence: 0.7,
          description: 'Memory shows steady linear growth'
        }
      }
    } else if (stdDev / mean > 0.3) {
      return {
        type: 'periodic_spikes',
        confidence: 0.6,
        description: 'Memory shows periodic spikes - possibly from batch operations'
      }
    } else {
      return {
        type: 'sawtooth',
        confidence: 0.7,
        description: 'Memory shows sawtooth pattern - allocate/garbage collect cycles'
      }
    }
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    netGrowth: number,
    maxGrowthRate: number,
    potentialLeak: boolean
  ): string[] {
    const recommendations: string[] = []

    if (potentialLeak) {
      recommendations.push('Memory leak detected - review component cleanup and event listener removal')
      recommendations.push('Use browser/Node.js memory profiler to identify leak sources')
    }

    if (netGrowth > 50) { // > 50MB growth
      recommendations.push('Significant memory growth detected - consider implementing object pooling')
      recommendations.push('Review large data structures and implement pagination if applicable')
    }

    if (maxGrowthRate > 5) { // > 5MB/s growth rate
      recommendations.push('High memory allocation rate - optimize object creation patterns')
      recommendations.push('Consider using WeakMap/WeakSet for temporary object references')
    }

    if (this.alerts.some(a => a.category === 'gc_pressure')) {
      recommendations.push('High GC pressure detected - reduce object allocations and reuse objects')
      recommendations.push('Consider using object pools for frequently created/destroyed objects')
    }

    if (recommendations.length === 0) {
      recommendations.push('Memory usage appears healthy - no immediate action required')
    }

    return recommendations
  }

  /**
   * Generate a memory usage report for multiple tests
   */
  static generateMemoryReport(analyses: MemoryAnalysis[]): MemoryUsageReport {
    const timestamp = new Date().toISOString()
    const totalTests = analyses.length
    const testsWithAlerts = analyses.filter(a => a.alerts.length > 0).length
    
    let criticalAlerts = 0
    let warningAlerts = 0
    
    analyses.forEach(analysis => {
      criticalAlerts += analysis.alerts.filter(a => a.type === 'critical').length
      warningAlerts += analysis.alerts.filter(a => a.type === 'warning').length
    })

    // Determine overall health
    let overallMemoryHealth: 'good' | 'warning' | 'critical' = 'good'
    if (criticalAlerts > 0) {
      overallMemoryHealth = 'critical'
    } else if (warningAlerts > 0 || testsWithAlerts > totalTests * 0.3) {
      overallMemoryHealth = 'warning'
    }

    // Generate global recommendations
    const globalRecommendations: string[] = []
    
    if (criticalAlerts > 0) {
      globalRecommendations.push(`${criticalAlerts} critical memory alerts detected - immediate investigation required`)
    }
    
    const leakTests = analyses.filter(a => a.summary.potentialLeak).length
    if (leakTests > 0) {
      globalRecommendations.push(`${leakTests} tests show potential memory leaks - review component lifecycle management`)
    }
    
    const highGrowthTests = analyses.filter(a => a.summary.netGrowth > 20).length
    if (highGrowthTests > totalTests * 0.3) {
      globalRecommendations.push('High memory growth detected across multiple tests - consider global optimization strategies')
    }

    return {
      timestamp,
      testSuite: 'Performance Test Suite',
      environment: process.env.NODE_ENV || 'test',
      totalTests,
      testsWithAlerts,
      criticalAlerts,
      warningAlerts,
      overallMemoryHealth,
      analyses,
      globalRecommendations
    }
  }
}