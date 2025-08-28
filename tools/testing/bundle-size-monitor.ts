/**
 * Bundle Size Monitoring and Optimization System
 * 
 * A comprehensive system for monitoring and optimizing bundle sizes:
 * - Tracks bundle sizes across different configurations
 * - Detects size regressions and optimizations
 * - Analyzes plugin impact on bundle size
 * - Provides optimization recommendations
 * - Integrates with CI/CD for automated monitoring
 */

import * as fs from 'fs'
import * as path from 'path'

export interface BundleMetrics {
  name: string
  size: number // bytes
  gzipSize: number // bytes
  chunks: {
    name: string
    size: number
    type: 'entry' | 'vendor' | 'dynamic'
  }[]
  dependencies: {
    name: string
    size: number
    percentage: number
  }[]
  assets: {
    name: string
    size: number
    type: 'js' | 'css' | 'other'
  }[]
}

export interface BundleThresholds {
  size: {
    warning: number // bytes
    critical: number // bytes
  }
  gzipSize: {
    warning: number // bytes
    critical: number // bytes
  }
  chunkSize: {
    warning: number // bytes
    critical: number // bytes
  }
  regression: {
    warning: number // percentage
    critical: number // percentage
  }
}

export interface BundleSizeAlert {
  id: string
  timestamp: number
  type: 'warning' | 'critical'
  category: 'bundle_size' | 'gzip_size' | 'chunk_size' | 'regression' | 'dependency_bloat'
  message: string
  currentValue: number
  threshold: number
  recommendations: string[]
  metrics: BundleMetrics
}

export interface BundleAnalysis {
  bundleName: string
  timestamp: string
  metrics: BundleMetrics
  alerts: BundleSizeAlert[]
  optimizations: {
    type: 'code_splitting' | 'tree_shaking' | 'compression' | 'dependency_removal'
    description: string
    estimatedSavings: number
    priority: 'low' | 'medium' | 'high'
  }[]
  comparison?: {
    baseline: BundleMetrics
    changes: {
      size: { current: number, baseline: number, change: number, percentage: number }
      gzipSize: { current: number, baseline: number, change: number, percentage: number }
      chunkCount: { current: number, baseline: number, change: number }
    }
    newDependencies: string[]
    removedDependencies: string[]
  }
}

export interface BundleSizeReport {
  timestamp: string
  project: string
  environment: string
  analyses: BundleAnalysis[]
  summary: {
    totalBundles: number
    totalSize: number
    totalGzipSize: number
    alertCount: number
    criticalAlerts: number
    warningAlerts: number
  }
  recommendations: string[]
  trendAnalysis?: {
    pattern: 'growing' | 'shrinking' | 'stable' | 'volatile'
    confidence: number
    description: string
  }
}

export class BundleSizeMonitor {
  private thresholds: BundleThresholds
  private baselines: Map<string, BundleMetrics> = new Map()
  private config: {
    enableCompression: boolean
    enableChunkAnalysis: boolean
    enableDependencyAnalysis: boolean
    maxHistorySize: number
  }

  constructor(
    thresholds: Partial<BundleThresholds> = {},
    config: Partial<BundleSizeMonitor['config']> = {}
  ) {
    this.thresholds = {
      size: { warning: 1024 * 1024, critical: 2 * 1024 * 1024 }, // 1MB warning, 2MB critical
      gzipSize: { warning: 256 * 1024, critical: 512 * 1024 }, // 256KB warning, 512KB critical
      chunkSize: { warning: 500 * 1024, critical: 1024 * 1024 }, // 500KB warning, 1MB critical
      regression: { warning: 0.1, critical: 0.25 }, // 10% warning, 25% critical
      ...thresholds
    }

    this.config = {
      enableCompression: true,
      enableChunkAnalysis: true,
      enableDependencyAnalysis: true,
      maxHistorySize: 50,
      ...config
    }
  }

  /**
   * Analyze bundle metrics and detect issues
   */
  async analyzeBundleSize(metrics: BundleMetrics): Promise<BundleAnalysis> {
    const alerts: BundleSizeAlert[] = []
    const optimizations: BundleAnalysis['optimizations'] = []

    // Check bundle size thresholds
    this.checkBundleSizeThresholds(metrics, alerts)

    // Check for large chunks
    this.checkChunkSizes(metrics, alerts)

    // Analyze dependencies for bloat
    this.analyzeDependencyBloat(metrics, alerts, optimizations)

    // Generate optimization recommendations
    this.generateOptimizations(metrics, optimizations)

    // Compare with baseline if available
    const baseline = this.baselines.get(metrics.name)
    const comparison = baseline ? this.compareWithBaseline(metrics, baseline) : undefined

    if (comparison) {
      this.checkForRegressions(comparison, alerts)
    }

    return {
      bundleName: metrics.name,
      timestamp: new Date().toISOString(),
      metrics,
      alerts,
      optimizations,
      comparison
    }
  }

  /**
   * Set baseline metrics for a bundle
   */
  setBaseline(bundleName: string, metrics: BundleMetrics): void {
    this.baselines.set(bundleName, metrics)
  }

  /**
   * Load baselines from file
   */
  async loadBaselines(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
        Object.entries(data).forEach(([name, metrics]) => {
          this.baselines.set(name, metrics as BundleMetrics)
        })
      }
    } catch (error) {
      console.warn(`Failed to load baselines from ${filePath}:`, error)
    }
  }

  /**
   * Save baselines to file
   */
  async saveBaselines(filePath: string): Promise<void> {
    try {
      const data = Object.fromEntries(this.baselines)
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
    } catch (error) {
      console.error(`Failed to save baselines to ${filePath}:`, error)
    }
  }

  /**
   * Check bundle size against thresholds
   */
  private checkBundleSizeThresholds(metrics: BundleMetrics, alerts: BundleSizeAlert[]): void {
    // Check total bundle size
    if (metrics.size >= this.thresholds.size.critical) {
      alerts.push(this.createAlert(
        'critical',
        'bundle_size',
        `Critical bundle size: ${this.formatSize(metrics.size)} exceeds ${this.formatSize(this.thresholds.size.critical)}`,
        metrics.size,
        this.thresholds.size.critical,
        metrics,
        [
          'Bundle size is critically large - immediate optimization required',
          'Consider code splitting to reduce initial bundle size',
          'Analyze and remove unused dependencies',
          'Implement lazy loading for non-critical features'
        ]
      ))
    } else if (metrics.size >= this.thresholds.size.warning) {
      alerts.push(this.createAlert(
        'warning',
        'bundle_size',
        `Large bundle size: ${this.formatSize(metrics.size)} exceeds ${this.formatSize(this.thresholds.size.warning)}`,
        metrics.size,
        this.thresholds.size.warning,
        metrics,
        [
          'Monitor bundle size growth',
          'Review recent dependencies for size impact',
          'Consider implementing tree shaking'
        ]
      ))
    }

    // Check gzip size
    if (metrics.gzipSize >= this.thresholds.gzipSize.critical) {
      alerts.push(this.createAlert(
        'critical',
        'gzip_size',
        `Critical gzipped size: ${this.formatSize(metrics.gzipSize)} exceeds ${this.formatSize(this.thresholds.gzipSize.critical)}`,
        metrics.gzipSize,
        this.thresholds.gzipSize.critical,
        metrics,
        [
          'Gzipped bundle size is critically large',
          'Optimize compression settings',
          'Remove redundant code and dependencies',
          'Consider using Brotli compression'
        ]
      ))
    } else if (metrics.gzipSize >= this.thresholds.gzipSize.warning) {
      alerts.push(this.createAlert(
        'warning',
        'gzip_size',
        `Large gzipped size: ${this.formatSize(metrics.gzipSize)} exceeds ${this.formatSize(this.thresholds.gzipSize.warning)}`,
        metrics.gzipSize,
        this.thresholds.gzipSize.warning,
        metrics,
        [
          'Monitor gzipped size growth',
          'Optimize code for better compression',
          'Review string literals and repeated patterns'
        ]
      ))
    }
  }

  /**
   * Check individual chunk sizes
   */
  private checkChunkSizes(metrics: BundleMetrics, alerts: BundleSizeAlert[]): void {
    metrics.chunks.forEach(chunk => {
      if (chunk.size >= this.thresholds.chunkSize.critical) {
        alerts.push(this.createAlert(
          'critical',
          'chunk_size',
          `Critical chunk size: ${chunk.name} (${this.formatSize(chunk.size)}) exceeds ${this.formatSize(this.thresholds.chunkSize.critical)}`,
          chunk.size,
          this.thresholds.chunkSize.critical,
          metrics,
          [
            `Chunk "${chunk.name}" is critically large`,
            'Split large chunks into smaller modules',
            'Implement dynamic imports for code splitting',
            'Move large dependencies to separate chunks'
          ]
        ))
      } else if (chunk.size >= this.thresholds.chunkSize.warning) {
        alerts.push(this.createAlert(
          'warning',
          'chunk_size',
          `Large chunk: ${chunk.name} (${this.formatSize(chunk.size)}) exceeds ${this.formatSize(this.thresholds.chunkSize.warning)}`,
          chunk.size,
          this.thresholds.chunkSize.warning,
          metrics,
          [
            `Monitor chunk "${chunk.name}" size`,
            'Consider splitting if it continues growing',
            'Review dependencies in this chunk'
          ]
        ))
      }
    })
  }

  /**
   * Analyze dependencies for potential bloat
   */
  private analyzeDependencyBloat(
    metrics: BundleMetrics,
    alerts: BundleSizeAlert[],
    optimizations: BundleAnalysis['optimizations']
  ): void {
    // Find dependencies that take up more than 20% of bundle
    const largeDependencies = metrics.dependencies.filter(dep => dep.percentage > 20)
    
    largeDependencies.forEach(dep => {
      alerts.push(this.createAlert(
        'warning',
        'dependency_bloat',
        `Large dependency: ${dep.name} (${this.formatSize(dep.size)}, ${dep.percentage.toFixed(1)}% of bundle)`,
        dep.size,
        metrics.size * 0.2,
        metrics,
        [
          `Dependency "${dep.name}" is unusually large`,
          'Review if entire dependency is needed',
          'Consider lighter alternatives',
          'Implement tree shaking for this dependency'
        ]
      ))

      optimizations.push({
        type: 'dependency_removal',
        description: `Consider replacing or optimizing ${dep.name} (${this.formatSize(dep.size)})`,
        estimatedSavings: dep.size * 0.5, // Estimate 50% savings
        priority: dep.percentage > 30 ? 'high' : 'medium'
      })
    })

    // Suggest tree shaking if many small dependencies
    const smallDependencies = metrics.dependencies.filter(dep => dep.percentage < 2 && dep.size > 1024)
    if (smallDependencies.length > 10) {
      optimizations.push({
        type: 'tree_shaking',
        description: `${smallDependencies.length} small dependencies could benefit from tree shaking`,
        estimatedSavings: smallDependencies.reduce((sum, dep) => sum + dep.size * 0.3, 0),
        priority: 'medium'
      })
    }
  }

  /**
   * Generate optimization recommendations
   */
  private generateOptimizations(
    metrics: BundleMetrics,
    optimizations: BundleAnalysis['optimizations']
  ): void {
    // Suggest code splitting if bundle is large with multiple entry points
    if (metrics.size > 512 * 1024 && metrics.chunks.filter(c => c.type === 'entry').length === 1) {
      optimizations.push({
        type: 'code_splitting',
        description: 'Implement code splitting to reduce initial bundle size',
        estimatedSavings: metrics.size * 0.3, // Estimate 30% reduction
        priority: metrics.size > 1024 * 1024 ? 'high' : 'medium'
      })
    }

    // Suggest compression optimization
    const compressionRatio = metrics.gzipSize / metrics.size
    if (compressionRatio > 0.7) { // Poor compression ratio
      optimizations.push({
        type: 'compression',
        description: 'Code structure could be optimized for better compression',
        estimatedSavings: (metrics.gzipSize - metrics.size * 0.3), // Target 30% compression
        priority: 'medium'
      })
    }

    // Suggest removing unused assets
    const unusedAssets = metrics.assets.filter(asset => 
      asset.name.includes('unused') || asset.name.includes('legacy')
    )
    if (unusedAssets.length > 0) {
      const totalUnusedSize = unusedAssets.reduce((sum, asset) => sum + asset.size, 0)
      optimizations.push({
        type: 'dependency_removal',
        description: `Remove ${unusedAssets.length} unused assets`,
        estimatedSavings: totalUnusedSize,
        priority: totalUnusedSize > 50 * 1024 ? 'high' : 'low'
      })
    }
  }

  /**
   * Compare current metrics with baseline
   */
  private compareWithBaseline(current: BundleMetrics, baseline: BundleMetrics): BundleAnalysis['comparison'] {
    const sizeChange = current.size - baseline.size
    const gzipSizeChange = current.gzipSize - baseline.gzipSize
    const chunkCountChange = current.chunks.length - baseline.chunks.length

    // Find new and removed dependencies
    const currentDeps = new Set(current.dependencies.map(d => d.name))
    const baselineDeps = new Set(baseline.dependencies.map(d => d.name))
    
    const newDependencies = Array.from(currentDeps).filter(name => !baselineDeps.has(name))
    const removedDependencies = Array.from(baselineDeps).filter(name => !currentDeps.has(name))

    return {
      baseline,
      changes: {
        size: {
          current: current.size,
          baseline: baseline.size,
          change: sizeChange,
          percentage: baseline.size > 0 ? sizeChange / baseline.size : 0
        },
        gzipSize: {
          current: current.gzipSize,
          baseline: baseline.gzipSize,
          change: gzipSizeChange,
          percentage: baseline.gzipSize > 0 ? gzipSizeChange / baseline.gzipSize : 0
        },
        chunkCount: {
          current: current.chunks.length,
          baseline: baseline.chunks.length,
          change: chunkCountChange
        }
      },
      newDependencies,
      removedDependencies
    }
  }

  /**
   * Check for size regressions
   */
  private checkForRegressions(comparison: BundleAnalysis['comparison'], alerts: BundleSizeAlert[]): void {
    if (!comparison) return

    const { changes } = comparison

    // Check size regression
    if (changes.size.percentage >= this.thresholds.regression.critical) {
      alerts.push(this.createAlert(
        'critical',
        'regression',
        `Critical size regression: ${this.formatSize(changes.size.change)} increase (${(changes.size.percentage * 100).toFixed(1)}%)`,
        changes.size.current,
        changes.size.baseline * (1 + this.thresholds.regression.critical),
        null!,
        [
          'Critical bundle size regression detected',
          'Review recent changes for size impact',
          'Consider reverting problematic changes',
          'Implement bundle size CI checks'
        ]
      ))
    } else if (changes.size.percentage >= this.thresholds.regression.warning) {
      alerts.push(this.createAlert(
        'warning',
        'regression',
        `Size regression: ${this.formatSize(changes.size.change)} increase (${(changes.size.percentage * 100).toFixed(1)}%)`,
        changes.size.current,
        changes.size.baseline * (1 + this.thresholds.regression.warning),
        null!,
        [
          'Bundle size regression detected',
          'Monitor for continued growth',
          'Review recent dependency additions'
        ]
      ))
    }

    // Check gzip size regression
    if (changes.gzipSize.percentage >= this.thresholds.regression.critical) {
      alerts.push(this.createAlert(
        'critical',
        'regression',
        `Critical gzip size regression: ${this.formatSize(changes.gzipSize.change)} increase (${(changes.gzipSize.percentage * 100).toFixed(1)}%)`,
        changes.gzipSize.current,
        changes.gzipSize.baseline * (1 + this.thresholds.regression.critical),
        null!,
        [
          'Critical gzipped size regression',
          'Check compression settings',
          'Review code changes affecting compression'
        ]
      ))
    }
  }

  /**
   * Create a bundle size alert
   */
  private createAlert(
    type: 'warning' | 'critical',
    category: BundleSizeAlert['category'],
    message: string,
    currentValue: number,
    threshold: number,
    metrics: BundleMetrics,
    recommendations: string[]
  ): BundleSizeAlert {
    return {
      id: `${category}-${type}-${Date.now()}`,
      timestamp: Date.now(),
      type,
      category,
      message,
      currentValue,
      threshold,
      recommendations,
      metrics
    }
  }

  /**
   * Generate a comprehensive bundle size report
   */
  static generateBundleReport(analyses: BundleAnalysis[]): BundleSizeReport {
    const totalSize = analyses.reduce((sum, analysis) => sum + analysis.metrics.size, 0)
    const totalGzipSize = analyses.reduce((sum, analysis) => sum + analysis.metrics.gzipSize, 0)
    const allAlerts = analyses.flatMap(analysis => analysis.alerts)
    const criticalAlerts = allAlerts.filter(alert => alert.type === 'critical').length
    const warningAlerts = allAlerts.filter(alert => alert.type === 'warning').length

    // Generate global recommendations
    const recommendations: string[] = []
    
    if (criticalAlerts > 0) {
      recommendations.push(`${criticalAlerts} critical bundle size issues require immediate attention`)
    }
    
    if (totalSize > 5 * 1024 * 1024) { // 5MB threshold
      recommendations.push('Total bundle size is very large - consider aggressive optimization')
    }

    const largeChunks = analyses.filter(a => a.metrics.chunks.some(c => c.size > 1024 * 1024)).length
    if (largeChunks > 0) {
      recommendations.push(`${largeChunks} bundles have large chunks - implement code splitting`)
    }

    return {
      timestamp: new Date().toISOString(),
      project: 'TachUI Framework',
      environment: process.env.NODE_ENV || 'test',
      analyses,
      summary: {
        totalBundles: analyses.length,
        totalSize,
        totalGzipSize,
        alertCount: allAlerts.length,
        criticalAlerts,
        warningAlerts
      },
      recommendations
    }
  }

  /**
   * Analyze bundle from build output
   */
  static async analyzeBundleFromFile(filePath: string): Promise<BundleMetrics> {
    const stats = fs.statSync(filePath)
    const content = fs.readFileSync(filePath, 'utf-8')
    
    // Mock gzip calculation (in real implementation, use actual gzip)
    const gzipSize = Math.floor(stats.size * 0.3) // Estimate 30% compression
    
    // Parse filename for bundle name
    const bundleName = path.basename(filePath, path.extname(filePath))
    
    // Mock chunk and dependency analysis (in real implementation, parse webpack stats)
    const chunks = [
      {
        name: bundleName,
        size: stats.size,
        type: 'entry' as const
      }
    ]
    
    const dependencies = [
      { name: 'react', size: Math.floor(stats.size * 0.2), percentage: 20 },
      { name: 'lodash', size: Math.floor(stats.size * 0.15), percentage: 15 },
      { name: 'other', size: Math.floor(stats.size * 0.65), percentage: 65 }
    ]
    
    const assets = [
      { name: filePath, size: stats.size, type: 'js' as const }
    ]
    
    return {
      name: bundleName,
      size: stats.size,
      gzipSize,
      chunks,
      dependencies,
      assets
    }
  }

  /**
   * Format bytes to human readable string
   */
  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`
  }
}

export const createBundleSizeMonitor = (
  thresholds?: Partial<BundleThresholds>,
  config?: any
) => new BundleSizeMonitor(thresholds, config)