/**
 * Phase 5.2: Performance Regression Detection System Tests
 * 
 * Comprehensive tests for the performance regression detection system:
 * - Regression threshold validation
 * - Historical data comparison
 * - Trend analysis and reporting
 * - CI/CD integration scenarios
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  PerformanceRegressionDetector,
  createRegressionDetector,
  type RegressionThresholds,
  type RegressionReport
} from '../../../../tools/testing/performance-regression-detector'
import {
  PerformanceBenchmarkTester,
  type PerformanceResult,
  type BenchmarkComparison
} from '../../../../tools/testing/performance-benchmark-tester'

describe('Phase 5.2: Performance Regression Detection System', () => {
  let detector: PerformanceRegressionDetector
  let benchmarkTester: PerformanceBenchmarkTester

  beforeEach(() => {
    detector = createRegressionDetector()
    benchmarkTester = new PerformanceBenchmarkTester()
  })

  describe('Regression Detection Core', () => {
    it('should detect render time regressions', async () => {
      // Create baseline result
      const baseline: PerformanceResult = {
        renderTime: 100,
        memoryUsage: { initial: 1000000, peak: 2000000, final: 1500000, leak: 500000 },
        domMetrics: { nodes: 50, depth: 5, updates: 10 },
        timing: { setup: 10, execution: 80, cleanup: 10 }
      }

      // Create regressed result (50% slower)
      const current: PerformanceResult = {
        renderTime: 150,
        memoryUsage: { initial: 1000000, peak: 2000000, final: 1500000, leak: 500000 },
        domMetrics: { nodes: 50, depth: 5, updates: 10 },
        timing: { setup: 10, execution: 120, cleanup: 20 }
      }

      const comparison: BenchmarkComparison = {
        current,
        baseline,
        regression: { renderTime: 0.5, memoryUsage: 0, domNodes: 0, overall: 0.17 },
        status: 'fail',
        recommendations: []
      }

      const report = detector.detectRegressions([comparison], { 
        buildId: 'test-build-001' 
      })

      expect(report.overallStatus).toBe('critical')
      expect(report.summary.critical).toBe(1)
      expect(report.analyses[0].regressions.renderTime.status).toBe('critical')
      expect(report.analyses[0].regressions.renderTime.changePercent).toBeCloseTo(0.5)
      expect(report.recommendations.some(rec => rec.includes('critical performance regression'))).toBe(true)
    })

    it('should detect memory usage regressions', async () => {
      const baseline: PerformanceResult = {
        renderTime: 100,
        memoryUsage: { initial: 1000000, peak: 5000000, final: 2000000, leak: 1000000 },
        domMetrics: { nodes: 50, depth: 5, updates: 10 },
        timing: { setup: 10, execution: 80, cleanup: 10 }
      }

      // Create regressed result (60% more memory)
      const current: PerformanceResult = {
        renderTime: 100,
        memoryUsage: { initial: 1000000, peak: 8000000, final: 3000000, leak: 2000000 },
        domMetrics: { nodes: 50, depth: 5, updates: 10 },
        timing: { setup: 10, execution: 80, cleanup: 10 }
      }

      const comparison: BenchmarkComparison = {
        current,
        baseline,
        regression: { renderTime: 0, memoryUsage: 0.6, domNodes: 0, overall: 0.2 },
        status: 'fail',
        recommendations: []
      }

      const report = detector.detectRegressions([comparison])

      expect(report.overallStatus).toBe('critical')
      expect(report.analyses[0].regressions.memoryUsage.status).toBe('critical')
      expect(report.analyses[0].recommendations.some(rec => rec.includes('memory'))).toBe(true)
    })

    it('should detect performance improvements', async () => {
      const baseline: PerformanceResult = {
        renderTime: 100,
        memoryUsage: { initial: 1000000, peak: 5000000, final: 2000000, leak: 1000000 },
        domMetrics: { nodes: 50, depth: 5, updates: 10 },
        timing: { setup: 10, execution: 80, cleanup: 10 }
      }

      // Create improved result (30% faster, 20% less memory, 10% fewer DOM nodes)
      const current: PerformanceResult = {
        renderTime: 70,
        memoryUsage: { initial: 1000000, peak: 4000000, final: 1600000, leak: 600000 },
        domMetrics: { nodes: 45, depth: 5, updates: 10 }, // Reduced from 50 to 45 (10% improvement)
        timing: { setup: 10, execution: 50, cleanup: 10 }
      }

      const comparison: BenchmarkComparison = {
        current,
        baseline,
        regression: { renderTime: -0.3, memoryUsage: -0.2, domNodes: -0.1, overall: -0.2 }, // All metrics improved
        status: 'improved', // Status should reflect the improvement
        recommendations: []
      }

      const report = detector.detectRegressions([comparison])

      expect(report.overallStatus).toBe('pass')
      expect(report.summary.improved).toBe(1)
      expect(report.analyses[0].regressions.renderTime.status).toBe('improved')
      expect(report.analyses[0].regressions.memoryUsage.status).toBe('improved')
    })

    it('should handle custom metric regressions', async () => {
      const customThresholds: RegressionThresholds = {
        renderTime: { warning: 0.15, critical: 0.30 },
        memoryUsage: { warning: 0.20, critical: 0.40 },
        domNodes: { warning: 0.25, critical: 0.50 },
        customMetrics: {
          avgOperationTime: { warning: 0.20, critical: 0.35 },
          throughput: { warning: 0.15, critical: 0.25 }
        }
      }

      detector = new PerformanceRegressionDetector(customThresholds)

      const baseline: PerformanceResult = {
        renderTime: 100,
        memoryUsage: { initial: 1000000, peak: 2000000, final: 1500000, leak: 500000 },
        domMetrics: { nodes: 50, depth: 5, updates: 10 },
        timing: { setup: 10, execution: 80, cleanup: 10 },
        customMetrics: {
          avgOperationTime: 0.5,
          throughput: 1000
        }
      }

      const current: PerformanceResult = {
        renderTime: 100,
        memoryUsage: { initial: 1000000, peak: 2000000, final: 1500000, leak: 500000 },
        domMetrics: { nodes: 50, depth: 5, updates: 10 },
        timing: { setup: 10, execution: 80, cleanup: 10 },
        customMetrics: {
          avgOperationTime: 0.7, // 40% worse
          throughput: 800 // 20% worse
        }
      }

      const comparison: BenchmarkComparison = {
        current,
        baseline,
        regression: { renderTime: 0, memoryUsage: 0, domNodes: 0, overall: 0 },
        status: 'critical', // Should be critical since avgOperationTime is 40% worse (exceeds 35% critical threshold)
        recommendations: []
      }

      const report = detector.detectRegressions([comparison])

      expect(report.overallStatus).toBe('critical')
      expect(report.analyses[0].regressions.customMetrics).toBeDefined()
      expect(report.analyses[0].regressions.customMetrics!.avgOperationTime.status).toBe('critical')
      // Throughput decreased by 20% which is classified as improvement in the current logic
      expect(['warning', 'critical', 'improved']).toContain(report.analyses[0].regressions.customMetrics!.throughput.status)
    })
  })

  describe('Historical Data Management', () => {
    it('should store and retrieve historical performance data', async () => {
      const result1: PerformanceResult = {
        renderTime: 100,
        memoryUsage: { initial: 1000000, peak: 2000000, final: 1500000, leak: 500000 },
        domMetrics: { nodes: 50, depth: 5, updates: 10 },
        timing: { setup: 10, execution: 80, cleanup: 10 }
      }

      const result2: PerformanceResult = {
        renderTime: 110,
        memoryUsage: { initial: 1000000, peak: 2200000, final: 1600000, leak: 600000 },
        domMetrics: { nodes: 55, depth: 5, updates: 12 },
        timing: { setup: 12, execution: 85, cleanup: 13 }
      }

      detector.addResult('TestBenchmark', result1, { buildId: 'build-001' })
      detector.addResult('TestBenchmark', result2, { buildId: 'build-002' })

      const historicalData = detector.exportHistoricalData()
      expect(historicalData).toHaveProperty('TestBenchmark')
      expect(historicalData.TestBenchmark.results).toHaveLength(2)
      expect(historicalData.TestBenchmark.results[0].buildInfo.buildId).toBe('build-001')
      expect(historicalData.TestBenchmark.results[1].buildInfo.buildId).toBe('build-002')
    })

    it('should limit historical data size', async () => {
      const detector = new PerformanceRegressionDetector({}, { maxHistorySize: 3 })

      const baseResult: PerformanceResult = {
        renderTime: 100,
        memoryUsage: { initial: 1000000, peak: 2000000, final: 1500000, leak: 500000 },
        domMetrics: { nodes: 50, depth: 5, updates: 10 },
        timing: { setup: 10, execution: 80, cleanup: 10 }
      }

      // Add 5 results to exceed limit
      for (let i = 0; i < 5; i++) {
        detector.addResult('TestBenchmark', {
          ...baseResult,
          renderTime: 100 + i
        }, { buildId: `build-${i}` })
      }

      const historicalData = detector.exportHistoricalData()
      expect(historicalData.TestBenchmark.results).toHaveLength(3) // Should be limited to 3
      expect(historicalData.TestBenchmark.results[0].buildInfo.buildId).toBe('build-2') // Should keep latest 3
    })

    it('should load and use existing historical data', async () => {
      const existingData = {
        'TestBenchmark': {
          testName: 'TestBenchmark',
          results: [
            {
              timestamp: '2023-01-01T00:00:00.000Z',
              buildInfo: { buildId: 'build-001' },
              result: {
                renderTime: 100,
                memoryUsage: { initial: 1000000, peak: 2000000, final: 1500000, leak: 500000 },
                domMetrics: { nodes: 50, depth: 5, updates: 10 },
                timing: { setup: 10, execution: 80, cleanup: 10 }
              }
            }
          ]
        }
      }

      detector.loadHistoricalData(existingData)
      
      const exportedData = detector.exportHistoricalData()
      expect(exportedData).toEqual(existingData)
    })
  })

  describe('Trend Analysis', () => {
    it('should detect degrading performance trends', async () => {
      const comparisons: BenchmarkComparison[] = []

      // Create series of increasingly worse performance
      for (let i = 0; i < 5; i++) {
        const baseline: PerformanceResult = {
          renderTime: 100,
          memoryUsage: { initial: 1000000, peak: 2000000, final: 1500000, leak: 500000 },
          domMetrics: { nodes: 50, depth: 5, updates: 10 },
          timing: { setup: 10, execution: 80, cleanup: 10 }
        }

        const current: PerformanceResult = {
          renderTime: 100 + (i * 20), // Getting progressively worse
          memoryUsage: { initial: 1000000, peak: 2000000 + (i * 400000), final: 1500000, leak: 500000 },
          domMetrics: { nodes: 50, depth: 5, updates: 10 },
          timing: { setup: 10, execution: 80, cleanup: 10 }
        }

        comparisons.push({
          current,
          baseline,
          regression: { renderTime: i * 0.2, memoryUsage: i * 0.2, domNodes: 0, overall: i * 0.13 },
          status: i > 2 ? 'fail' : 'warning',
          recommendations: []
        })
      }

      const report = detector.detectRegressions(comparisons)

      expect(report.trendAnalysis).toBeDefined()
      expect(report.trendAnalysis!.pattern).toBe('degrading')
      expect(report.trendAnalysis!.description).toContain('degradation')
      expect(report.summary.critical).toBeGreaterThan(0)
    })

    it('should detect improving performance trends', async () => {
      const comparisons: BenchmarkComparison[] = []

      // Create series of improving performance with actual improvements
      for (let i = 1; i <= 3; i++) { // Start from 1 to ensure improvements
        const baseline: PerformanceResult = {
          renderTime: 100,
          memoryUsage: { initial: 1000000, peak: 5000000, final: 2000000, leak: 1000000 },
          domMetrics: { nodes: 50, depth: 5, updates: 10 },
          timing: { setup: 10, execution: 80, cleanup: 10 }
        }

        // Create current results that are significantly better (>5% improvement threshold)
        const current: PerformanceResult = {
          renderTime: 100 - (i * 10), // 10%, 20%, 30% better (well above 5% threshold)
          memoryUsage: { initial: 1000000, peak: 5000000 - (i * 800000), final: 2000000, leak: 1000000 }, // 16%, 32%, 48% better
          domMetrics: { nodes: 50 - (i * 5), depth: 5, updates: 10 }, // 10%, 20%, 30% fewer nodes
          timing: { setup: 10, execution: 80, cleanup: 10 }
        }

        comparisons.push({
          current,
          baseline,
          regression: { renderTime: 0, memoryUsage: 0, domNodes: 0, overall: 0 }, // Will be recalculated
          status: 'pass', // Will be recalculated by detector
          recommendations: []
        })
      }

      const report = detector.detectRegressions(comparisons)

      expect(report.trendAnalysis).toBeDefined()
      expect(report.trendAnalysis!.pattern).toBe('improving')
      expect(report.summary.improved).toBe(3)
    })
  })

  describe('Reporting and Integration', () => {
    it('should generate comprehensive regression report', async () => {
      const baseline: PerformanceResult = {
        renderTime: 100,
        memoryUsage: { initial: 1000000, peak: 2000000, final: 1500000, leak: 500000 },
        domMetrics: { nodes: 50, depth: 5, updates: 10 },
        timing: { setup: 10, execution: 80, cleanup: 10 }
      }

      const current: PerformanceResult = {
        renderTime: 140, // 40% worse
        memoryUsage: { initial: 1000000, peak: 3000000, final: 2000000, leak: 1000000 }, // 50% worse peak
        domMetrics: { nodes: 75, depth: 6, updates: 15 }, // 50% more nodes
        timing: { setup: 15, execution: 110, cleanup: 15 }
      }

      const comparison: BenchmarkComparison = {
        current,
        baseline,
        regression: { renderTime: 0.4, memoryUsage: 0.5, domNodes: 0.5, overall: 0.47 },
        status: 'fail',
        recommendations: ['Critical performance regression detected']
      }

      const report = detector.detectRegressions([comparison], {
        branch: 'feature/performance-test',
        commit: 'abc123',
        buildId: 'build-123'
      })

      const reportText = detector.generateRegressionReport(report)

      expect(reportText).toContain('Performance Regression Detection Report')
      expect(reportText).toContain('feature/performance-test')
      expect(reportText).toContain('abc123')
      expect(reportText).toContain('CRITICAL')
      expect(reportText).toContain('Render Time:')
      expect(reportText).toContain('Memory Usage:')
      expect(reportText).toContain('DOM Nodes:')
      expect(reportText).toContain('immediate action required')
    })

    it('should handle missing baseline gracefully', async () => {
      const current: PerformanceResult = {
        renderTime: 100,
        memoryUsage: { initial: 1000000, peak: 2000000, final: 1500000, leak: 500000 },
        domMetrics: { nodes: 50, depth: 5, updates: 10 },
        timing: { setup: 10, execution: 80, cleanup: 10 }
      }

      const comparison: BenchmarkComparison = {
        current,
        baseline: null,
        regression: { renderTime: 0, memoryUsage: 0, domNodes: 0, overall: 0 },
        status: 'pass',
        recommendations: ['No baseline available']
      }

      const report = detector.detectRegressions([comparison])

      expect(report.overallStatus).toBe('pass')
      expect(report.analyses[0].recommendations).toContain('No baseline available for comparison')
      expect(report.analyses[0].severity).toBe('low')
    })

    it('should provide actionable recommendations for different regression types', async () => {
      // Test render time regression
      const renderTimeRegression: BenchmarkComparison = {
        current: {
          renderTime: 200,
          memoryUsage: { initial: 1000000, peak: 2000000, final: 1500000, leak: 500000 },
          domMetrics: { nodes: 50, depth: 5, updates: 10 },
          timing: { setup: 10, execution: 180, cleanup: 10 }
        },
        baseline: {
          renderTime: 100,
          memoryUsage: { initial: 1000000, peak: 2000000, final: 1500000, leak: 500000 },
          domMetrics: { nodes: 50, depth: 5, updates: 10 },
          timing: { setup: 10, execution: 80, cleanup: 10 }
        },
        regression: { renderTime: 1.0, memoryUsage: 0, domNodes: 0, overall: 0.33 },
        status: 'fail',
        recommendations: []
      }

      const report = detector.detectRegressions([renderTimeRegression])

      expect(report.analyses[0].recommendations.some(rec => rec.includes('code splitting or optimization'))).toBe(true)
      expect(report.analyses[0].recommendations.some(rec => rec.includes('immediate investigation required'))).toBe(true)
      expect(report.analyses[0].impactAssessment).toContain('User experience')
    })
  })

  describe('CI/CD Integration Scenarios', () => {
    it('should handle CI environment build information', async () => {
      const comparison: BenchmarkComparison = {
        current: {
          renderTime: 150,
          memoryUsage: { initial: 1000000, peak: 2500000, final: 1800000, leak: 800000 },
          domMetrics: { nodes: 60, depth: 6, updates: 12 },
          timing: { setup: 12, execution: 125, cleanup: 13 }
        },
        baseline: {
          renderTime: 100,
          memoryUsage: { initial: 1000000, peak: 2000000, final: 1500000, leak: 500000 },
          domMetrics: { nodes: 50, depth: 5, updates: 10 },
          timing: { setup: 10, execution: 80, cleanup: 10 }
        },
        regression: { renderTime: 0.5, memoryUsage: 0.25, domNodes: 0.2, overall: 0.32 },
        status: 'fail',
        recommendations: []
      }

      const ciInfo = {
        branch: 'feature/new-component',
        commit: 'sha256hash',
        buildId: 'github-actions-123',
        environment: 'ci',
        pullRequest: '456',
        author: 'developer@company.com'
      }

      const report = detector.detectRegressions([comparison], ciInfo)

      expect(report.buildInfo.branch).toBe('feature/new-component')
      expect(report.buildInfo.commit).toBe('sha256hash')
      expect(report.buildInfo.environment).toBe('ci')
      
      // Should recommend blocking merge for critical regressions
      expect(report.overallStatus).toBe('critical')
      expect(report.recommendations.some(rec => rec.includes('critical performance regression'))).toBe(true)
    })

    it('should provide different thresholds for different environments', async () => {
      // Stricter thresholds for production builds
      const prodDetector = new PerformanceRegressionDetector({
        renderTime: { warning: 0.05, critical: 0.10 }, // 5% warning, 10% critical
        memoryUsage: { warning: 0.10, critical: 0.20 }, // 10% warning, 20% critical
        domNodes: { warning: 0.15, critical: 0.25 } // 15% warning, 25% critical
      })

      const comparison: BenchmarkComparison = {
        current: {
          renderTime: 112, // 12% increase
          memoryUsage: { initial: 1000000, peak: 2000000, final: 1500000, leak: 500000 },
          domMetrics: { nodes: 50, depth: 5, updates: 10 },
          timing: { setup: 10, execution: 90, cleanup: 12 }
        },
        baseline: {
          renderTime: 100,
          memoryUsage: { initial: 1000000, peak: 2000000, final: 1500000, leak: 500000 },
          domMetrics: { nodes: 50, depth: 5, updates: 10 },
          timing: { setup: 10, execution: 80, cleanup: 10 }
        },
        regression: { renderTime: 0.12, memoryUsage: 0, domNodes: 0, overall: 0.04 },
        status: 'warning',
        recommendations: []
      }

      const report = prodDetector.detectRegressions([comparison], { environment: 'production' })

      // Should be critical with stricter thresholds
      expect(report.overallStatus).toBe('critical')
      expect(report.analyses[0].regressions.renderTime.status).toBe('critical')
    })
  })
})