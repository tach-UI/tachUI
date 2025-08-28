/**
 * Performance Regression Detection System
 * 
 * A comprehensive system for detecting performance regressions across builds:
 * - Compares performance metrics against historical baselines
 * - Detects significant performance degradations
 * - Provides detailed regression analysis and reporting
 * - Integrates with CI/CD pipelines for automated performance monitoring
 */

import type { PerformanceResult, BenchmarkComparison } from './performance-benchmark-tester'

export interface RegressionThresholds {
  renderTime: {
    warning: number // percentage increase that triggers warning
    critical: number // percentage increase that triggers failure
  }
  memoryUsage: {
    warning: number
    critical: number
  }
  domNodes: {
    warning: number
    critical: number
  }
  customMetrics?: Record<string, {
    warning: number
    critical: number
  }>
}

export interface RegressionAnalysis {
  testName: string
  status: 'pass' | 'warning' | 'critical' | 'improved'
  regressions: {
    renderTime: {
      current: number
      baseline: number
      change: number
      changePercent: number
      status: 'pass' | 'warning' | 'critical' | 'improved'
    }
    memoryUsage: {
      current: number
      baseline: number
      change: number
      changePercent: number
      status: 'pass' | 'warning' | 'critical' | 'improved'
    }
    domNodes: {
      current: number
      baseline: number
      change: number
      changePercent: number
      status: 'pass' | 'warning' | 'critical' | 'improved'
    }
    customMetrics?: Record<string, {
      current: number
      baseline: number
      change: number
      changePercent: number
      status: 'pass' | 'warning' | 'critical' | 'improved'
    }>
  }
  recommendations: string[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  impactAssessment: string
}

export interface RegressionReport {
  timestamp: string
  buildInfo: {
    branch?: string
    commit?: string
    buildId?: string
    environment: string
  }
  summary: {
    totalTests: number
    passed: number
    warnings: number
    critical: number
    improved: number
  }
  analyses: RegressionAnalysis[]
  overallStatus: 'pass' | 'warning' | 'critical'
  recommendations: string[]
  trendAnalysis?: {
    pattern: 'improving' | 'degrading' | 'stable' | 'volatile'
    confidence: number
    description: string
  }
}

export interface HistoricalData {
  testName: string
  results: Array<{
    timestamp: string
    buildInfo: any
    result: PerformanceResult
  }>
}

export class PerformanceRegressionDetector {
  private thresholds: RegressionThresholds
  private historicalData: Map<string, HistoricalData> = new Map()
  private config: {
    maxHistorySize: number
    trendAnalysisWindow: number
    enableTrendAnalysis: boolean
  }

  constructor(
    thresholds: Partial<RegressionThresholds> = {},
    config: Partial<PerformanceRegressionDetector['config']> = {}
  ) {
    this.thresholds = {
      renderTime: { warning: 0.15, critical: 0.30 }, // 15% warning, 30% critical
      memoryUsage: { warning: 0.20, critical: 0.40 }, // 20% warning, 40% critical
      domNodes: { warning: 0.25, critical: 0.50 }, // 25% warning, 50% critical
      ...thresholds
    }

    this.config = {
      maxHistorySize: 100, // Keep last 100 results per test
      trendAnalysisWindow: 10, // Analyze last 10 results for trends
      enableTrendAnalysis: true,
      ...config
    }
  }

  /**
   * Load historical performance data
   */
  loadHistoricalData(data: Record<string, HistoricalData>): void {
    Object.entries(data).forEach(([testName, histData]) => {
      this.historicalData.set(testName, histData)
    })
  }

  /**
   * Add a new performance result to historical data
   */
  addResult(
    testName: string, 
    result: PerformanceResult, 
    buildInfo: any = {}
  ): void {
    let testHistory = this.historicalData.get(testName)
    
    if (!testHistory) {
      testHistory = {
        testName,
        results: []
      }
      this.historicalData.set(testName, testHistory)
    }

    testHistory.results.push({
      timestamp: new Date().toISOString(),
      buildInfo: {
        environment: process.env.NODE_ENV || 'test',
        ...buildInfo
      },
      result
    })

    // Limit history size
    if (testHistory.results.length > this.config.maxHistorySize) {
      testHistory.results = testHistory.results.slice(-this.config.maxHistorySize)
    }
  }

  /**
   * Detect regressions by comparing results against baselines
   */
  detectRegressions(
    comparisons: BenchmarkComparison[],
    buildInfo: any = {}
  ): RegressionReport {
    const analyses: RegressionAnalysis[] = []
    
    for (const comparison of comparisons) {
      const analysis = this.analyzeRegression(comparison)
      analyses.push(analysis)
      
      // Add to historical data for future comparisons
      this.addResult(
        analysis.testName,
        comparison.current,
        buildInfo
      )
    }

    const summary = this.generateSummary(analyses)
    const overallStatus = this.determineOverallStatus(summary)
    const globalRecommendations = this.generateGlobalRecommendations(analyses)

    return {
      timestamp: new Date().toISOString(),
      buildInfo: {
        environment: process.env.NODE_ENV || 'test',
        ...buildInfo
      },
      summary,
      analyses,
      overallStatus,
      recommendations: globalRecommendations,
      trendAnalysis: this.config.enableTrendAnalysis 
        ? this.analyzeTrends(analyses) 
        : undefined
    }
  }

  /**
   * Analyze regression for a single benchmark comparison
   */
  private analyzeRegression(comparison: BenchmarkComparison): RegressionAnalysis {
    const { current, baseline } = comparison
    
    if (!baseline) {
      return {
        testName: 'Unknown Test',
        status: 'pass',
        regressions: {
          renderTime: { current: current.renderTime, baseline: 0, change: 0, changePercent: 0, status: 'pass' },
          memoryUsage: { current: current.memoryUsage.peak, baseline: 0, change: 0, changePercent: 0, status: 'pass' },
          domNodes: { current: current.domMetrics.nodes, baseline: 0, change: 0, changePercent: 0, status: 'pass' }
        },
        recommendations: ['No baseline available for comparison'],
        severity: 'low',
        impactAssessment: 'No impact assessment possible without baseline'
      }
    }

    // Analyze render time regression
    const renderTimeAnalysis = this.analyzeMetricRegression(
      current.renderTime,
      baseline.renderTime,
      this.thresholds.renderTime
    )

    // Analyze memory usage regression
    const memoryAnalysis = this.analyzeMetricRegression(
      current.memoryUsage.peak,
      baseline.memoryUsage.peak,
      this.thresholds.memoryUsage
    )

    // Analyze DOM nodes regression
    const domNodesAnalysis = this.analyzeMetricRegression(
      current.domMetrics.nodes,
      baseline.domMetrics.nodes,
      this.thresholds.domNodes
    )

    // Analyze custom metrics if available
    const customMetricsAnalysis: Record<string, any> = {}
    if (current.customMetrics && baseline.customMetrics && this.thresholds.customMetrics) {
      Object.keys(current.customMetrics).forEach(key => {
        if (baseline.customMetrics![key] !== undefined && this.thresholds.customMetrics![key]) {
          customMetricsAnalysis[key] = this.analyzeMetricRegression(
            current.customMetrics![key],
            baseline.customMetrics![key],
            this.thresholds.customMetrics![key]
          )
        }
      })
    }

    // Determine overall status
    const statuses = [
      renderTimeAnalysis.status,
      memoryAnalysis.status,
      domNodesAnalysis.status,
      ...Object.values(customMetricsAnalysis).map(a => a.status)
    ]

    const overallStatus = this.determineMetricStatus(statuses)
    const severity = this.determineSeverity(overallStatus, renderTimeAnalysis, memoryAnalysis)
    const recommendations = this.generateRecommendations(
      renderTimeAnalysis,
      memoryAnalysis,
      domNodesAnalysis,
      customMetricsAnalysis
    )
    const impactAssessment = this.generateImpactAssessment(
      renderTimeAnalysis,
      memoryAnalysis,
      domNodesAnalysis
    )

    return {
      testName: 'Performance Test', // Would be passed in from benchmark
      status: overallStatus,
      regressions: {
        renderTime: renderTimeAnalysis,
        memoryUsage: memoryAnalysis,
        domNodes: domNodesAnalysis,
        customMetrics: Object.keys(customMetricsAnalysis).length > 0 
          ? customMetricsAnalysis 
          : undefined
      },
      recommendations,
      severity,
      impactAssessment
    }
  }

  /**
   * Analyze regression for a single metric
   */
  private analyzeMetricRegression(
    current: number,
    baseline: number,
    thresholds: { warning: number; critical: number }
  ) {
    const change = current - baseline
    const changePercent = baseline === 0 ? 0 : (change / baseline)
    
    let status: 'pass' | 'warning' | 'critical' | 'improved' = 'pass'
    
    if (changePercent < -0.05) { // 5% improvement
      status = 'improved'
    } else if (changePercent >= thresholds.critical) {
      status = 'critical'
    } else if (changePercent >= thresholds.warning) {
      status = 'warning'
    }

    return {
      current,
      baseline,
      change,
      changePercent,
      status
    }
  }

  /**
   * Determine overall status from multiple metric statuses
   */
  private determineMetricStatus(statuses: string[]): 'pass' | 'warning' | 'critical' | 'improved' {
    if (statuses.includes('critical')) return 'critical'
    if (statuses.includes('warning')) return 'warning'
    if (statuses.every(s => s === 'improved')) return 'improved'
    return 'pass'
  }

  /**
   * Determine severity level
   */
  private determineSeverity(
    status: string,
    renderTime: any,
    memory: any
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (status === 'critical') return 'critical'
    
    // High severity if both render time and memory are degraded
    if (renderTime.status === 'warning' && memory.status === 'warning') {
      return 'high'
    }
    
    if (status === 'warning') return 'medium'
    return 'low'
  }

  /**
   * Generate specific recommendations based on regressions
   */
  private generateRecommendations(
    renderTime: any,
    memory: any,
    domNodes: any,
    customMetrics: any
  ): string[] {
    const recommendations: string[] = []

    if (renderTime.status === 'critical' || renderTime.status === 'warning') {
      recommendations.push(
        `Render time increased by ${(renderTime.changePercent * 100).toFixed(1)}% - consider code splitting or optimization`
      )
      
      if (renderTime.changePercent > 0.5) { // 50% increase
        recommendations.push('Critical render time regression - immediate investigation required')
      }
    }

    if (memory.status === 'critical' || memory.status === 'warning') {
      recommendations.push(
        `Memory usage increased by ${(memory.changePercent * 100).toFixed(1)}% - check for memory leaks`
      )
      
      if (memory.changePercent > 0.3) { // 30% increase
        recommendations.push('Significant memory regression - review object lifecycle and cleanup')
      }
    }

    if (domNodes.status === 'critical' || domNodes.status === 'warning') {
      recommendations.push(
        `DOM node count increased by ${(domNodes.changePercent * 100).toFixed(1)}% - optimize DOM structure`
      )
    }

    // Check for correlated regressions
    if (renderTime.status !== 'pass' && memory.status !== 'pass') {
      recommendations.push('Multiple performance metrics degraded - comprehensive performance audit recommended')
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance metrics within acceptable ranges')
    }

    return recommendations
  }

  /**
   * Generate impact assessment
   */
  private generateImpactAssessment(
    renderTime: any,
    memory: any,
    domNodes: any
  ): string {
    const impacts: string[] = []

    if (renderTime.changePercent > 0.2) {
      impacts.push('User experience may be noticeably affected by slower render times')
    }

    if (memory.changePercent > 0.3) {
      impacts.push('Increased memory usage may cause issues on low-memory devices')
    }

    if (domNodes.changePercent > 0.4) {
      impacts.push('Larger DOM may impact scrolling performance and memory usage')
    }

    if (impacts.length === 0) {
      return 'No significant user impact expected'
    }

    return impacts.join('. ')
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(analyses: RegressionAnalysis[]) {
    return {
      totalTests: analyses.length,
      passed: analyses.filter(a => a.status === 'pass').length,
      warnings: analyses.filter(a => a.status === 'warning').length,
      critical: analyses.filter(a => a.status === 'critical').length,
      improved: analyses.filter(a => a.status === 'improved').length
    }
  }

  /**
   * Determine overall status from summary
   */
  private determineOverallStatus(summary: any): 'pass' | 'warning' | 'critical' {
    if (summary.critical > 0) return 'critical'
    if (summary.warnings > 0) return 'warning'
    return 'pass'
  }

  /**
   * Generate global recommendations
   */
  private generateGlobalRecommendations(analyses: RegressionAnalysis[]): string[] {
    const recommendations: string[] = []
    
    const criticalCount = analyses.filter(a => a.status === 'critical').length
    const warningCount = analyses.filter(a => a.status === 'warning').length
    
    if (criticalCount > 0) {
      recommendations.push(`${criticalCount} critical performance regression(s) detected - immediate action required`)
    }
    
    if (warningCount > 0) {
      recommendations.push(`${warningCount} performance warning(s) - monitor closely in future builds`)
    }
    
    if (criticalCount === 0 && warningCount === 0) {
      recommendations.push('All performance metrics within acceptable ranges')
    }

    // Check for patterns across tests
    const renderTimeIssues = analyses.filter(a => 
      a.regressions.renderTime.status === 'warning' || a.regressions.renderTime.status === 'critical'
    ).length

    const memoryIssues = analyses.filter(a => 
      a.regressions.memoryUsage.status === 'warning' || a.regressions.memoryUsage.status === 'critical'
    ).length

    if (renderTimeIssues > analyses.length * 0.5) {
      recommendations.push('Widespread render time regressions detected - review recent changes affecting DOM rendering')
    }

    if (memoryIssues > analyses.length * 0.5) {
      recommendations.push('Widespread memory regressions detected - audit for memory leaks and cleanup issues')
    }

    return recommendations
  }

  /**
   * Analyze performance trends over time
   */
  private analyzeTrends(analyses: RegressionAnalysis[]) {
    // This is a simplified trend analysis
    const recentRegressions = analyses.filter(a => a.status === 'warning' || a.status === 'critical').length
    const improvements = analyses.filter(a => a.status === 'improved').length
    
    let pattern: 'improving' | 'degrading' | 'stable' | 'volatile' = 'stable'
    let confidence = 0.7
    let description = 'Performance appears stable'

    if (recentRegressions > improvements * 2) {
      pattern = 'degrading'
      description = 'Performance trend shows degradation over recent builds'
    } else if (improvements > recentRegressions * 2) {
      pattern = 'improving'
      description = 'Performance trend shows improvement over recent builds'
    } else if (recentRegressions > 0 && improvements > 0) {
      pattern = 'volatile'
      confidence = 0.5
      description = 'Performance shows mixed results with both improvements and regressions'
    }

    return {
      pattern,
      confidence,
      description
    }
  }

  /**
   * Export historical data for persistence
   */
  exportHistoricalData(): Record<string, HistoricalData> {
    return Object.fromEntries(this.historicalData)
  }

  /**
   * Generate a comprehensive regression report
   */
  generateRegressionReport(report: RegressionReport): string {
    const lines: string[] = []
    
    lines.push('=== Performance Regression Detection Report ===')
    lines.push(`Generated: ${report.timestamp}`)
    lines.push(`Environment: ${report.buildInfo.environment}`)
    
    if (report.buildInfo.branch) {
      lines.push(`Branch: ${report.buildInfo.branch}`)
    }
    if (report.buildInfo.commit) {
      lines.push(`Commit: ${report.buildInfo.commit}`)
    }
    
    lines.push('')
    lines.push('=== Summary ===')
    lines.push(`Overall Status: ${report.overallStatus.toUpperCase()}`)
    lines.push(`Total Tests: ${report.summary.totalTests}`)
    lines.push(`Passed: ${report.summary.passed}`)
    lines.push(`Warnings: ${report.summary.warnings}`)
    lines.push(`Critical: ${report.summary.critical}`)
    lines.push(`Improved: ${report.summary.improved}`)
    
    lines.push('')
    lines.push('=== Global Recommendations ===')
    report.recommendations.forEach(rec => {
      lines.push(`- ${rec}`)
    })
    
    if (report.trendAnalysis) {
      lines.push('')
      lines.push('=== Trend Analysis ===')
      lines.push(`Pattern: ${report.trendAnalysis.pattern}`)
      lines.push(`Confidence: ${(report.trendAnalysis.confidence * 100).toFixed(0)}%`)
      lines.push(`Description: ${report.trendAnalysis.description}`)
    }
    
    lines.push('')
    lines.push('=== Detailed Analysis ===')
    
    report.analyses.forEach((analysis, index) => {
      lines.push(`\n--- Test ${index + 1}: ${analysis.testName} ---`)
      lines.push(`Status: ${analysis.status.toUpperCase()}`)
      lines.push(`Severity: ${analysis.severity.toUpperCase()}`)
      lines.push(`Impact: ${analysis.impactAssessment}`)
      
      lines.push('\nMetric Regressions:')
      lines.push(`  Render Time: ${this.formatMetricChange(analysis.regressions.renderTime)}`)
      lines.push(`  Memory Usage: ${this.formatMetricChange(analysis.regressions.memoryUsage)}`)
      lines.push(`  DOM Nodes: ${this.formatMetricChange(analysis.regressions.domNodes)}`)
      
      if (analysis.regressions.customMetrics) {
        Object.entries(analysis.regressions.customMetrics).forEach(([key, metric]) => {
          lines.push(`  ${key}: ${this.formatMetricChange(metric)}`)
        })
      }
      
      lines.push('\nRecommendations:')
      analysis.recommendations.forEach(rec => {
        lines.push(`  - ${rec}`)
      })
    })
    
    return lines.join('\n')
  }

  /**
   * Format metric change for display
   */
  private formatMetricChange(metric: any): string {
    const sign = metric.changePercent >= 0 ? '+' : ''
    const status = metric.status.toUpperCase()
    return `${metric.current.toFixed(2)} (${sign}${(metric.changePercent * 100).toFixed(1)}%) [${status}]`
  }
}

export const createRegressionDetector = (
  thresholds?: Partial<RegressionThresholds>,
  config?: any
) => new PerformanceRegressionDetector(thresholds, config)