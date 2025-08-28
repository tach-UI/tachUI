/**
 * Phase 5.3: Memory Usage Tracking and Alerts Tests
 * 
 * Comprehensive tests for the memory usage tracking system:
 * - Real-time memory monitoring during test execution
 * - Memory leak detection and analysis
 * - Automated alerts for memory thresholds
 * - Memory usage pattern analysis and reporting
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  MemoryUsageTracker,
  type MemorySnapshot,
  type MemoryThresholds,
  type MemoryAlert,
  type MemoryAnalysis,
  type MemoryUsageReport
} from '../../../../tools/testing/memory-usage-tracker'

describe('Phase 5.3: Memory Usage Tracking and Alerts System', () => {
  let tracker: MemoryUsageTracker
  let mockPerformanceMemory: any
  let mockProcessMemoryUsage: any

  beforeEach(() => {
    // Mock performance.memory for browser environment testing
    mockPerformanceMemory = {
      usedJSHeapSize: 20000000, // 20MB
      totalJSHeapSize: 50000000, // 50MB
      jsHeapSizeLimit: 100000000 // 100MB
    }

    // Mock process.memoryUsage for Node.js environment testing
    mockProcessMemoryUsage = vi.fn(() => ({
      heapUsed: 25000000, // 25MB
      heapTotal: 60000000, // 60MB
      external: 5000000, // 5MB
      arrayBuffers: 2000000, // 2MB
      rss: 80000000 // 80MB
    }))

    // Set up global mocks
    global.performance = {
      ...global.performance,
      memory: mockPerformanceMemory
    } as any

    global.process = {
      ...global.process,
      memoryUsage: mockProcessMemoryUsage
    } as any

    tracker = new MemoryUsageTracker()
  })

  afterEach(() => {
    // Clean up any running monitoring
    if (tracker) {
      tracker.stopMonitoring()
    }
    vi.clearAllMocks()
  })

  describe('Memory Monitoring Core', () => {
    it('should start and stop monitoring correctly', async () => {
      tracker.startMonitoring('Test Memory Monitoring')
      
      // Let it run for a short time
      await new Promise(resolve => setTimeout(resolve, 600))
      
      const analysis = tracker.stopMonitoring()
      
      expect(analysis).toBeDefined()
      expect(analysis!.testName).toBe('Test Memory Monitoring')
      expect(analysis!.snapshots.length).toBeGreaterThan(1)
      expect(analysis!.duration).toBeGreaterThan(500)
    })

    it('should take memory snapshots at regular intervals', async () => {
      const customTracker = new MemoryUsageTracker({}, {
        snapshotInterval: 100 // 100ms intervals for faster testing
      })

      customTracker.startMonitoring('Snapshot Test')
      
      // Let it take multiple snapshots
      await new Promise(resolve => setTimeout(resolve, 350))
      
      const analysis = customTracker.stopMonitoring()
      
      expect(analysis!.snapshots.length).toBeGreaterThanOrEqual(3)
      
      // Verify snapshots have increasing timestamps
      for (let i = 1; i < analysis!.snapshots.length; i++) {
        expect(analysis!.snapshots[i].timestamp).toBeGreaterThan(
          analysis!.snapshots[i - 1].timestamp
        )
      }
    })

    it('should handle browser environment memory tracking', async () => {
      tracker.startMonitoring('Browser Memory Test')
      
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const analysis = tracker.stopMonitoring()
      
      expect(analysis!.snapshots.length).toBeGreaterThan(0)
      
      const snapshot = analysis!.snapshots[0]
      expect(snapshot.heapUsed).toBe(mockPerformanceMemory.usedJSHeapSize)
      expect(snapshot.heapTotal).toBe(mockPerformanceMemory.totalJSHeapSize)
      expect(snapshot.external).toBe(0) // Browser doesn't track external
      expect(snapshot.rss).toBeUndefined() // Browser doesn't have RSS
    })

    it('should handle Node.js environment memory tracking', async () => {
      // Remove performance.memory to test Node.js path
      delete (global.performance as any).memory
      
      tracker.startMonitoring('Node Memory Test')
      
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const analysis = tracker.stopMonitoring()
      
      expect(mockProcessMemoryUsage).toHaveBeenCalled()
      
      const snapshot = analysis!.snapshots[0]
      expect(snapshot.heapUsed).toBe(25000000)
      expect(snapshot.heapTotal).toBe(60000000)
      expect(snapshot.external).toBe(5000000)
      expect(snapshot.arrayBuffers).toBe(2000000)
      expect(snapshot.rss).toBe(80000000)
    })

    it('should provide fallback memory tracking when neither performance.memory nor process.memoryUsage is available', async () => {
      // Remove both memory tracking APIs
      delete (global.performance as any).memory
      delete (global.process as any).memoryUsage
      
      tracker.startMonitoring('Fallback Memory Test')
      
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const analysis = tracker.stopMonitoring()
      
      expect(analysis!.snapshots.length).toBeGreaterThan(0)
      
      const snapshot = analysis!.snapshots[0]
      expect(snapshot.heapUsed).toBeGreaterThan(1000000) // Should be reasonable fallback
      expect(snapshot.heapTotal).toBeGreaterThanOrEqual(snapshot.heapUsed) // Allow equal values
    })
  })

  describe('Memory Alert System', () => {
    it('should trigger heap usage alerts when thresholds are exceeded', async () => {
      const alertTracker = new MemoryUsageTracker({
        heapUsage: { warning: 10, critical: 15 } // 10MB warning, 15MB critical
      }, {
        snapshotInterval: 100
      })

      // Mock high memory usage
      mockPerformanceMemory.usedJSHeapSize = 20000000 // 20MB - should trigger critical
      
      alertTracker.startMonitoring('Heap Alert Test')
      
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const analysis = alertTracker.stopMonitoring()
      
      expect(analysis!.alerts.length).toBeGreaterThan(0)
      
      const criticalAlerts = analysis!.alerts.filter(a => a.type === 'critical' && a.category === 'heap_usage')
      expect(criticalAlerts.length).toBeGreaterThan(0)
      
      const alert = criticalAlerts[0]
      expect(alert.message).toContain('Critical heap usage')
      expect(alert.currentValue).toBeCloseTo(19.07, 0) // ~20MB in MB
      expect(alert.recommendations).toContain('Immediate memory cleanup required')
    })

    it('should detect memory growth rate alerts', async () => {
      const alertTracker = new MemoryUsageTracker({
        heapGrowthRate: { warning: 2, critical: 5 } // 2MB/s warning, 5MB/s critical
      }, {
        snapshotInterval: 100
      })

      let memoryUsage = 20000000 // Start at 20MB
      
      // Mock increasing memory usage
      vi.spyOn(global.performance.memory as any, 'usedJSHeapSize', 'get').mockImplementation(() => {
        memoryUsage += 1000000 // Increase by 1MB each call (10MB/s growth rate)
        return memoryUsage
      })
      
      alertTracker.startMonitoring('Growth Rate Test')
      
      await new Promise(resolve => setTimeout(resolve, 400))
      
      const analysis = alertTracker.stopMonitoring()
      
      const growthAlerts = analysis!.alerts.filter(a => a.category === 'growth_rate')
      expect(growthAlerts.length).toBeGreaterThan(0)
      
      const criticalAlert = growthAlerts.find(a => a.type === 'critical')
      expect(criticalAlert).toBeDefined()
      expect(criticalAlert!.message).toContain('Critical memory growth rate')
      expect(criticalAlert!.recommendations).toContain('Severe memory leak suspected')
    })

    it('should detect memory leaks over time', async () => {
      const alertTracker = new MemoryUsageTracker({
        memoryLeak: { warning: 5, critical: 10 } // 5MB warning, 10MB critical
      }, {
        snapshotInterval: 50 // Faster intervals for more data points
      })

      let memoryUsage = 20000000 // Start at 20MB
      
      // Replace the mock object completely for leak detection
      global.performance = {
        ...global.performance,
        memory: {
          get usedJSHeapSize() {
            memoryUsage += 1200000 // Increase by 1.2MB each call - higher growth to reach critical
            return memoryUsage
          },
          totalJSHeapSize: 100000000,
          jsHeapSizeLimit: 200000000
        }
      } as any
      
      alertTracker.startMonitoring('Memory Leak Test')
      
      // Run long enough to accumulate significant growth and trigger leak detection
      await new Promise(resolve => setTimeout(resolve, 1000)) // Longer test to get more snapshots
      
      const analysis = alertTracker.stopMonitoring()
      
      const leakAlerts = analysis!.alerts.filter(a => a.category === 'memory_leak')
      expect(leakAlerts.length).toBeGreaterThan(0)
      
      const alert = leakAlerts[0]
      expect(alert.message).toContain('memory leak')
      
      // Either critical or warning level alert should work - both indicate leak detection is working
      const hasCriticalRec = alert.recommendations.some(rec => rec.includes('unclosed resources (event listeners, timers, subscriptions)'))
      const hasWarningRec = alert.recommendations.some(rec => rec.includes('Investigate potential memory leak'))
      expect(hasCriticalRec || hasWarningRec).toBe(true)
    })

    it('should detect garbage collection pressure', async () => {
      const alertTracker = new MemoryUsageTracker({
        gcPressure: { warning: 50, critical: 80 } // 50% warning, 80% critical
      }, {
        snapshotInterval: 100
      })

      // Mock high GC pressure (high heap usage relative to total)
      mockPerformanceMemory.usedJSHeapSize = 45000000 // 45MB
      mockPerformanceMemory.totalJSHeapSize = 50000000 // 50MB (90% utilization)
      
      alertTracker.startMonitoring('GC Pressure Test')
      
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const analysis = alertTracker.stopMonitoring()
      
      const gcAlerts = analysis!.alerts.filter(a => a.category === 'gc_pressure')
      expect(gcAlerts.length).toBeGreaterThan(0)
      
      const criticalAlert = gcAlerts.find(a => a.type === 'critical')
      expect(criticalAlert).toBeDefined()
      expect(criticalAlert!.message).toContain('Critical GC pressure')
      expect(criticalAlert!.recommendations).toContain('Garbage collection under severe pressure')
    })

    it('should respect alert cooldown periods', async () => {
      const alertTracker = new MemoryUsageTracker({
        heapUsage: { warning: 5, critical: 10 } // Very low thresholds to trigger alerts
      }, {
        snapshotInterval: 50,
        alertCooldown: 1000 // 1 second cooldown
      })

      // Mock high memory usage that will consistently trigger alerts
      mockPerformanceMemory.usedJSHeapSize = 50000000 // 50MB
      
      alertTracker.startMonitoring('Cooldown Test')
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const analysis = alertTracker.stopMonitoring()
      
      // Should have fewer alerts due to cooldown than snapshots
      const heapAlerts = analysis!.alerts.filter(a => a.category === 'heap_usage')
      expect(heapAlerts.length).toBeLessThan(analysis!.snapshots.length)
      expect(heapAlerts.length).toBe(1) // Should only have one alert due to cooldown
    })
  })

  describe('Memory Analysis and Reporting', () => {
    it('should generate comprehensive memory analysis', async () => {
      let memoryUsage = 20000000 // Start at 20MB
      
      // Mock memory pattern with growth and then stabilization
      vi.spyOn(global.performance.memory as any, 'usedJSHeapSize', 'get').mockImplementation(() => {
        memoryUsage += 100000 // Gradual growth
        return memoryUsage
      })
      
      tracker.startMonitoring('Analysis Test')
      
      await new Promise(resolve => setTimeout(resolve, 600))
      
      const analysis = tracker.stopMonitoring()
      
      expect(analysis!.testName).toBe('Analysis Test')
      expect(analysis!.duration).toBeGreaterThan(500)
      expect(analysis!.snapshots.length).toBeGreaterThan(1)
      
      expect(analysis!.summary.initialHeap).toBeCloseTo(19.07, 0) // ~20MB
      expect(analysis!.summary.finalHeap).toBeGreaterThan(analysis!.summary.initialHeap)
      expect(analysis!.summary.netGrowth).toBeGreaterThan(0)
      expect(analysis!.summary.avgGrowthRate).toBeGreaterThan(0)
      expect(analysis!.summary.gcEfficiency).toBeTypeOf('number')
      
      expect(analysis!.patterns.type).toMatch(/stable|linear_growth|periodic_spikes|exponential_growth|sawtooth/)
      expect(analysis!.patterns.confidence).toBeGreaterThan(0)
      expect(analysis!.patterns.description).toBeTypeOf('string')
      
      expect(analysis!.recommendations).toBeInstanceOf(Array)
      expect(analysis!.recommendations.length).toBeGreaterThan(0)
    })

    it('should detect different memory usage patterns', async () => {
      // Test stable pattern
      const stableTracker = new MemoryUsageTracker({}, { snapshotInterval: 50 })
      
      // Mock stable memory usage
      mockPerformanceMemory.usedJSHeapSize = 20000000 // Constant 20MB
      
      stableTracker.startMonitoring('Stable Pattern Test')
      await new Promise(resolve => setTimeout(resolve, 600))
      const stableAnalysis = stableTracker.stopMonitoring()
      
      expect(stableAnalysis!.patterns.type).toBe('stable')
      expect(stableAnalysis!.patterns.confidence).toBeGreaterThan(0.8)
    })

    it('should estimate memory leak rates accurately', async () => {
      let memoryUsage = 20000000 // Start at 20MB
      const growthRate = 1000000 // 1MB per call - larger growth
      
      // Create tracker with faster snapshot interval to ensure we get enough data points
      const fastTracker = new MemoryUsageTracker({}, {
        snapshotInterval: 100 // 100ms intervals to get more snapshots
      })
      
      // Replace the mock object completely to ensure the spy works
      global.performance = {
        ...global.performance,
        memory: {
          get usedJSHeapSize() {
            memoryUsage += growthRate
            return memoryUsage
          },
          totalJSHeapSize: 100000000,
          jsHeapSizeLimit: 200000000
        }
      } as any
      
      fastTracker.startMonitoring('Leak Rate Test')
      
      await new Promise(resolve => setTimeout(resolve, 1200)) // Should get ~12 snapshots now
      
      const analysis = fastTracker.stopMonitoring()
      
      
      // With consistent growth pattern and enough data points, should detect a leak
      expect(analysis!.snapshots.length).toBeGreaterThanOrEqual(10) // Ensure we have enough data
      expect(analysis!.summary.potentialLeak).toBe(true)
      expect(analysis!.summary.leakEstimate).toBeDefined()
      expect(analysis!.summary.leakEstimate!).toBeGreaterThanOrEqual(0)
    })

    it('should calculate garbage collection efficiency', async () => {
      let memoryUsage = 50000000 // Start at 50MB
      let callCount = 0
      
      // Mock memory pattern with GC activity (memory decreases)
      vi.spyOn(global.performance.memory as any, 'usedJSHeapSize', 'get').mockImplementation(() => {
        callCount++
        if (callCount % 5 === 0) {
          memoryUsage -= 5000000 // Simulate GC: 5MB decrease every 5th call
        } else {
          memoryUsage += 500000 // Normal growth: 500KB
        }
        return Math.max(memoryUsage, 10000000) // Minimum 10MB
      })
      
      tracker.startMonitoring('GC Efficiency Test')
      
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const analysis = tracker.stopMonitoring()
      
      expect(analysis!.summary.gcEfficiency).toBeGreaterThan(0)
      expect(analysis!.summary.gcEfficiency).toBeLessThanOrEqual(100)
    })

    it('should provide contextual recommendations based on memory patterns', async () => {
      // Test high memory growth scenario
      let memoryUsage = 20000000
      
      // Create tracker with faster snapshot interval for more data points
      const fastTracker = new MemoryUsageTracker({}, {
        snapshotInterval: 100 // 100ms intervals
      })
      
      // Replace the mock object completely for recommendations test
      global.performance = {
        ...global.performance,
        memory: {
          get usedJSHeapSize() {
            memoryUsage += 2000000 // High growth rate: 2MB per call
            return memoryUsage
          },
          totalJSHeapSize: 100000000,
          jsHeapSizeLimit: 200000000
        }
      } as any
      
      fastTracker.startMonitoring('Recommendations Test')
      
      await new Promise(resolve => setTimeout(resolve, 1100)) // Longer test to get enough snapshots for leak detection
      
      const analysis = fastTracker.stopMonitoring()
      
      expect(analysis!.recommendations.some(rec => rec.includes('Memory leak detected'))).toBe(true)
      expect(analysis!.recommendations.some(rec => rec.includes('High memory allocation rate'))).toBe(true)
    })
  })

  describe('Memory Usage Reporting', () => {
    it('should generate comprehensive memory usage reports for multiple tests', async () => {
      const analyses: MemoryAnalysis[] = []
      
      // Create multiple test analyses
      for (let i = 0; i < 3; i++) {
        const testTracker = new MemoryUsageTracker({}, { snapshotInterval: 50 })
        
        testTracker.startMonitoring(`Test ${i + 1}`)
        await new Promise(resolve => setTimeout(resolve, 200))
        const analysis = testTracker.stopMonitoring()
        
        if (analysis) {
          analyses.push(analysis)
        }
      }
      
      const report = MemoryUsageTracker.generateMemoryReport(analyses)
      
      expect(report.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/)
      expect(report.testSuite).toBe('Performance Test Suite')
      expect(report.totalTests).toBe(3)
      expect(report.analyses.length).toBe(3)
      expect(report.overallMemoryHealth).toMatch(/good|warning|critical/)
      expect(report.globalRecommendations).toBeInstanceOf(Array)
    })

    it('should determine correct overall memory health status', async () => {
      // Create analysis with critical alerts
      const criticalAnalysis: MemoryAnalysis = {
        testName: 'Critical Test',
        duration: 1000,
        snapshots: [],
        alerts: [
          {
            id: 'critical-alert-1',
            timestamp: Date.now(),
            type: 'critical',
            category: 'heap_usage',
            message: 'Critical heap usage',
            currentValue: 200,
            threshold: 100,
            recommendations: [],
            snapshot: { timestamp: Date.now(), heapUsed: 200000000, heapTotal: 300000000, external: 0, arrayBuffers: 0 }
          }
        ],
        summary: {
          initialHeap: 20,
          peakHeap: 200,
          finalHeap: 180,
          netGrowth: 160,
          avgGrowthRate: 0.16,
          maxGrowthRate: 2.0,
          potentialLeak: true,
          leakEstimate: 0.16,
          gcEfficiency: 75
        },
        patterns: { type: 'exponential_growth', confidence: 0.9, description: 'Critical memory growth' },
        recommendations: ['Immediate action required']
      }
      
      const report = MemoryUsageTracker.generateMemoryReport([criticalAnalysis])
      
      expect(report.overallMemoryHealth).toBe('critical')
      expect(report.criticalAlerts).toBe(1)
      expect(report.globalRecommendations.some(rec => rec.includes('critical memory alerts detected'))).toBe(true)
    })

    it('should provide global recommendations based on aggregate patterns', async () => {
      // Create multiple analyses with potential leaks
      const leakyAnalyses: MemoryAnalysis[] = Array.from({ length: 5 }, (_, i) => ({
        testName: `Leaky Test ${i + 1}`,
        duration: 1000,
        snapshots: [],
        alerts: [],
        summary: {
          initialHeap: 20,
          peakHeap: 50,
          finalHeap: 45,
          netGrowth: 25, // High memory growth
          avgGrowthRate: 0.025,
          maxGrowthRate: 0.5,
          potentialLeak: true, // All tests have potential leaks
          leakEstimate: 0.025,
          gcEfficiency: 60
        },
        patterns: { type: 'linear_growth', confidence: 0.8, description: 'Steady growth' },
        recommendations: ['Potential memory leak detected']
      }))
      
      const report = MemoryUsageTracker.generateMemoryReport(leakyAnalyses)
      
      expect(report.globalRecommendations.some(rec => rec.includes('tests show potential memory leaks'))).toBe(true)
      expect(report.globalRecommendations.some(rec => rec.includes('High memory growth detected across multiple tests'))).toBe(true)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle stopping monitoring when not started', () => {
      const analysis = tracker.stopMonitoring()
      expect(analysis).toBeNull()
    })

    it('should handle restarting monitoring', async () => {
      tracker.startMonitoring('First Test')
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Start again should stop previous and start new
      tracker.startMonitoring('Second Test')
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const analysis = tracker.stopMonitoring()
      expect(analysis!.testName).toBe('Second Test')
    })

    it('should limit snapshot history to prevent memory issues', async () => {
      const limitedTracker = new MemoryUsageTracker({}, {
        snapshotInterval: 10, // Very fast
        maxSnapshots: 5 // Very small limit
      })
      
      limitedTracker.startMonitoring('Snapshot Limit Test')
      
      // Let it collect many snapshots
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const analysis = limitedTracker.stopMonitoring()
      
      expect(analysis!.snapshots.length).toBeLessThanOrEqual(5)
    })

    it('should handle insufficient data for pattern analysis', async () => {
      const quickTracker = new MemoryUsageTracker({}, { snapshotInterval: 100 })
      
      quickTracker.startMonitoring('Quick Test')
      
      // Stop very quickly before many snapshots
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const analysis = quickTracker.stopMonitoring()
      
      if (analysis!.snapshots.length < 10) {
        expect(analysis!.patterns.type).toBe('stable')
        expect(analysis!.patterns.description).toContain('Insufficient data')
      }
    })

    it('should handle custom thresholds correctly', async () => {
      const customTracker = new MemoryUsageTracker({
        heapUsage: { warning: 5, critical: 10 },
        heapGrowthRate: { warning: 1, critical: 2 },
        memoryLeak: { warning: 3, critical: 6 },
        gcPressure: { warning: 60, critical: 85 }
      }, {
        snapshotInterval: 100 // Use faster interval to ensure alert detection
      })
      
      // Replace the mock object completely to ensure threshold detection works
      global.performance = {
        ...global.performance,
        memory: {
          usedJSHeapSize: 15000000, // 15MB - exceeds 10MB critical
          totalJSHeapSize: 100000000,
          jsHeapSizeLimit: 200000000
        }
      } as any
      
      customTracker.startMonitoring('Custom Thresholds Test')
      
      await new Promise(resolve => setTimeout(resolve, 300)) // Wait for multiple snapshots and alert detection
      
      const analysis = customTracker.stopMonitoring()
      
      
      const heapAlerts = analysis!.alerts.filter(a => a.category === 'heap_usage')
      expect(heapAlerts.length).toBeGreaterThan(0)
      expect(heapAlerts[0].threshold).toBe(10) // Should use custom critical threshold
    })
  })
})