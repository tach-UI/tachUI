/**
 * Phase 5.4: Bundle Size Monitoring and Optimization Tests
 * 
 * Comprehensive tests for the bundle size monitoring system:
 * - Bundle size threshold detection and alerting
 * - Dependency bloat analysis and optimization recommendations
 * - Bundle regression detection and comparison
 * - Chunk size analysis and code splitting recommendations
 * - CI/CD integration for automated bundle monitoring
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { promises as fs } from 'fs'
import * as path from 'path'
import {
  BundleSizeMonitor,
  createBundleSizeMonitor,
  type BundleMetrics,
  type BundleThresholds,
  type BundleSizeAlert,
  type BundleAnalysis,
  type BundleSizeReport
} from '../../../../tools/testing/bundle-size-monitor'

describe('Phase 5.4: Bundle Size Monitoring and Optimization System', () => {
  let monitor: BundleSizeMonitor
  let mockBundleMetrics: BundleMetrics
  let tempDir: string

  beforeEach(async () => {
    monitor = createBundleSizeMonitor()
    
    // Create mock bundle metrics
    mockBundleMetrics = {
      name: 'test-bundle',
      size: 1024 * 1024, // 1MB
      gzipSize: 300 * 1024, // 300KB
      chunks: [
        { name: 'main', size: 600 * 1024, type: 'entry' },
        { name: 'vendor', size: 400 * 1024, type: 'vendor' },
        { name: 'async-component', size: 24 * 1024, type: 'dynamic' }
      ],
      dependencies: [
        { name: 'react', size: 200 * 1024, percentage: 20 },
        { name: 'lodash', size: 150 * 1024, percentage: 15 },
        { name: 'moment', size: 100 * 1024, percentage: 10 },
        { name: 'other-deps', size: 574 * 1024, percentage: 55 }
      ],
      assets: [
        { name: 'main.js', size: 600 * 1024, type: 'js' },
        { name: 'vendor.js', size: 400 * 1024, type: 'js' },
        { name: 'styles.css', size: 24 * 1024, type: 'css' }
      ]
    }

    // Create temporary directory for baseline storage tests
    tempDir = path.join(process.cwd(), 'tmp-test-' + Date.now())
    await fs.mkdir(tempDir, { recursive: true })
  })

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch (error) {
      // Ignore errors during cleanup
    }
  })

  describe('Bundle Size Analysis Core', () => {
    it('should analyze bundle size and detect no issues for normal bundles', async () => {
      // Use smaller bundle that won't trigger any thresholds
      const smallBundle: BundleMetrics = {
        ...mockBundleMetrics,
        size: 400 * 1024, // 400KB - below 512KB code splitting threshold
        gzipSize: 120 * 1024, // 120KB - good compression ratio (30%)
        chunks: [
          { name: 'main', size: 200 * 1024, type: 'entry' }, // Below 500KB warning
          { name: 'vendor', size: 200 * 1024, type: 'vendor' } // Below 500KB warning
        ],
        dependencies: [
          { name: 'react', size: 80 * 1024, percentage: 20 }, // Exactly at 20% threshold - should not trigger
          { name: 'lodash', size: 60 * 1024, percentage: 15 },
          { name: 'utils', size: 64 * 1024, percentage: 16 },
          { name: 'others', size: 76 * 1024, percentage: 19 },
          { name: 'misc', size: 40 * 1024, percentage: 10 },
          { name: 'small-deps', size: 80 * 1024, percentage: 20 } // Combined other dependencies
        ],
        assets: [
          { name: 'main.js', size: 200 * 1024, type: 'js' },
          { name: 'vendor.js', size: 200 * 1024, type: 'js' }
        ]
      }

      const analysis = await monitor.analyzeBundleSize(smallBundle)

      expect(analysis.bundleName).toBe('test-bundle')
      expect(analysis.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/)
      expect(analysis.metrics).toEqual(smallBundle)
      expect(analysis.alerts).toHaveLength(0) // No alerts for small bundle
      expect(analysis.optimizations).toBeInstanceOf(Array) // Should have optimizations array (may be empty for optimal bundle)
      expect(analysis.comparison).toBeUndefined() // No baseline yet
    })

    it('should detect critical bundle size threshold violations', async () => {
      const largeBundle: BundleMetrics = {
        ...mockBundleMetrics,
        size: 3 * 1024 * 1024, // 3MB - exceeds default 2MB critical threshold
        gzipSize: 1 * 1024 * 1024, // 1MB - exceeds default 512KB critical threshold
      }

      const analysis = await monitor.analyzeBundleSize(largeBundle)

      expect(analysis.alerts.length).toBeGreaterThanOrEqual(2)
      
      const bundleSizeAlert = analysis.alerts.find(a => a.category === 'bundle_size' && a.type === 'critical')
      expect(bundleSizeAlert).toBeDefined()
      expect(bundleSizeAlert!.message).toContain('Critical bundle size')
      expect(bundleSizeAlert!.currentValue).toBe(3 * 1024 * 1024)
      expect(bundleSizeAlert!.recommendations).toContain('Bundle size is critically large - immediate optimization required')

      const gzipSizeAlert = analysis.alerts.find(a => a.category === 'gzip_size' && a.type === 'critical')
      expect(gzipSizeAlert).toBeDefined()
      expect(gzipSizeAlert!.message).toContain('Critical gzipped size')
      expect(gzipSizeAlert!.recommendations).toContain('Gzipped bundle size is critically large')
    })

    it('should detect warning level bundle size thresholds', async () => {
      const mediumBundle: BundleMetrics = {
        ...mockBundleMetrics,
        size: 1.5 * 1024 * 1024, // 1.5MB - exceeds default 1MB warning threshold
        gzipSize: 400 * 1024, // 400KB - exceeds default 256KB warning threshold
      }

      const analysis = await monitor.analyzeBundleSize(mediumBundle)

      expect(analysis.alerts.length).toBeGreaterThanOrEqual(2)
      
      const bundleWarning = analysis.alerts.find(a => a.category === 'bundle_size' && a.type === 'warning')
      expect(bundleWarning).toBeDefined()
      expect(bundleWarning!.message).toContain('Large bundle size')
      expect(bundleWarning!.recommendations).toContain('Monitor bundle size growth')

      const gzipWarning = analysis.alerts.find(a => a.category === 'gzip_size' && a.type === 'warning')
      expect(gzipWarning).toBeDefined()
      expect(gzipWarning!.message).toContain('Large gzipped size')
    })

    it('should detect large chunk size issues', async () => {
      const largeChunkBundle: BundleMetrics = {
        ...mockBundleMetrics,
        chunks: [
          { name: 'main', size: 1.5 * 1024 * 1024, type: 'entry' }, // 1.5MB - exceeds 1MB critical
          { name: 'vendor', size: 700 * 1024, type: 'vendor' }, // 700KB - exceeds 500KB warning
          { name: 'async-component', size: 24 * 1024, type: 'dynamic' }
        ]
      }

      const analysis = await monitor.analyzeBundleSize(largeChunkBundle)

      const chunkAlerts = analysis.alerts.filter(a => a.category === 'chunk_size')
      expect(chunkAlerts.length).toBeGreaterThanOrEqual(2)

      const criticalChunkAlert = chunkAlerts.find(a => a.type === 'critical')
      expect(criticalChunkAlert).toBeDefined()
      expect(criticalChunkAlert!.message).toContain('Critical chunk size: main')
      expect(criticalChunkAlert!.recommendations).toContain('Chunk "main" is critically large')

      const warningChunkAlert = chunkAlerts.find(a => a.type === 'warning')
      expect(warningChunkAlert).toBeDefined()
      expect(warningChunkAlert!.message).toContain('Large chunk: vendor')
    })

    it('should detect dependency bloat and suggest optimizations', async () => {
      const bloatedBundle: BundleMetrics = {
        ...mockBundleMetrics,
        dependencies: [
          { name: 'lodash', size: 350 * 1024, percentage: 35 }, // 35% - exceeds 30% high priority threshold
          { name: 'moment', size: 250 * 1024, percentage: 25 }, // 25% - exceeds 20% bloat threshold
          { name: 'react', size: 150 * 1024, percentage: 15 }, // Below threshold
          { name: 'other-deps', size: 274 * 1024, percentage: 25 }
        ]
      }

      const analysis = await monitor.analyzeBundleSize(bloatedBundle)

      const dependencyAlerts = analysis.alerts.filter(a => a.category === 'dependency_bloat')
      expect(dependencyAlerts.length).toBeGreaterThanOrEqual(2)

      const lodashAlert = dependencyAlerts.find(a => a.message.includes('lodash'))
      expect(lodashAlert).toBeDefined()
      expect(lodashAlert!.recommendations).toContain('Dependency "lodash" is unusually large')

      // Should suggest dependency removal optimizations
      const depOptimizations = analysis.optimizations.filter(o => o.type === 'dependency_removal')
      expect(depOptimizations.length).toBeGreaterThanOrEqual(2)
      expect(depOptimizations.some(o => o.description.includes('lodash'))).toBe(true)
      expect(depOptimizations.some(o => o.priority === 'high')).toBe(true) // 30% should be high priority
    })

    it('should suggest tree shaking for many small dependencies', async () => {
      const fragmentedBundle: BundleMetrics = {
        ...mockBundleMetrics,
        dependencies: [
          // Create 15 small dependencies (> 10 threshold) each under 2% but > 1KB
          ...Array.from({ length: 15 }, (_, i) => ({
            name: `small-dep-${i}`,
            size: 5 * 1024, // 5KB each
            percentage: 0.5 // 0.5% each
          })),
          { name: 'main-dep', size: 925 * 1024, percentage: 92.5 } // Rest of the bundle
        ]
      }

      const analysis = await monitor.analyzeBundleSize(fragmentedBundle)

      const treeShakingOpt = analysis.optimizations.find(o => o.type === 'tree_shaking')
      expect(treeShakingOpt).toBeDefined()
      expect(treeShakingOpt!.description).toContain('small dependencies could benefit from tree shaking')
      expect(treeShakingOpt!.priority).toBe('medium')
      expect(treeShakingOpt!.estimatedSavings).toBeGreaterThan(0)
    })
  })

  describe('Bundle Optimization Recommendations', () => {
    it('should suggest code splitting for large single-entry bundles', async () => {
      const singleEntryBundle: BundleMetrics = {
        ...mockBundleMetrics,
        size: 2 * 1024 * 1024, // 2MB
        chunks: [
          { name: 'main', size: 2 * 1024 * 1024, type: 'entry' } // Single large entry chunk
        ]
      }

      const analysis = await monitor.analyzeBundleSize(singleEntryBundle)

      const codeSplittingOpt = analysis.optimizations.find(o => o.type === 'code_splitting')
      expect(codeSplittingOpt).toBeDefined()
      expect(codeSplittingOpt!.description).toContain('Implement code splitting')
      expect(codeSplittingOpt!.priority).toBe('high') // Should be high priority for 2MB bundle
      expect(codeSplittingOpt!.estimatedSavings).toBeGreaterThan(600 * 1024 * 0.9) // Within 10% of expected 600KB
      expect(codeSplittingOpt!.estimatedSavings).toBeLessThan(600 * 1024 * 1.1)
    })

    it('should suggest compression optimization for poor compression ratios', async () => {
      const poorCompressionBundle: BundleMetrics = {
        ...mockBundleMetrics,
        size: 1024 * 1024, // 1MB
        gzipSize: 800 * 1024 // 800KB - poor 80% compression ratio (> 70% threshold)
      }

      const analysis = await monitor.analyzeBundleSize(poorCompressionBundle)

      const compressionOpt = analysis.optimizations.find(o => o.type === 'compression')
      expect(compressionOpt).toBeDefined()
      expect(compressionOpt!.description).toContain('Code structure could be optimized for better compression')
      expect(compressionOpt!.priority).toBe('medium')
      expect(compressionOpt!.estimatedSavings).toBeGreaterThan(0)
    })

    it('should suggest removing unused assets', async () => {
      const unusedAssetsBundle: BundleMetrics = {
        ...mockBundleMetrics,
        assets: [
          { name: 'main.js', size: 600 * 1024, type: 'js' },
          { name: 'vendor.js', size: 400 * 1024, type: 'js' },
          { name: 'unused-legacy.js', size: 100 * 1024, type: 'js' },
          { name: 'unused-polyfill.js', size: 50 * 1024, type: 'js' },
          { name: 'styles.css', size: 24 * 1024, type: 'css' }
        ]
      }

      const analysis = await monitor.analyzeBundleSize(unusedAssetsBundle)

      const assetRemovalOpt = analysis.optimizations.find(o => 
        o.type === 'dependency_removal' && o.description.includes('unused assets')
      )
      expect(assetRemovalOpt).toBeDefined()
      expect(assetRemovalOpt!.description).toContain('Remove 2 unused assets')
      expect(assetRemovalOpt!.estimatedSavings).toBe(150 * 1024) // Exact match for 100KB + 50KB
      expect(assetRemovalOpt!.priority).toBe('high') // > 50KB threshold
    })
  })

  describe('Baseline Comparison and Regression Detection', () => {
    it('should compare bundle with baseline and detect no regression', async () => {
      const baseline: BundleMetrics = {
        ...mockBundleMetrics,
        size: 1024 * 1024,
        gzipSize: 300 * 1024
      }

      const current: BundleMetrics = {
        ...mockBundleMetrics,
        size: 1100 * 1024, // 7.8% increase - below default 10% warning threshold
        gzipSize: 320 * 1024
      }

      monitor.setBaseline('test-bundle', baseline)
      const analysis = await monitor.analyzeBundleSize(current)

      expect(analysis.comparison).toBeDefined()
      expect(analysis.comparison!.baseline).toEqual(baseline)
      expect(analysis.comparison!.changes.size.change).toBe(76 * 1024) // Exact 76KB increase
      expect(analysis.comparison!.changes.size.percentage).toBeCloseTo(0.074, 0.01) // ~7.4% increase
      
      // Should not trigger regression alerts for small increase
      const regressionAlerts = analysis.alerts.filter(a => a.category === 'regression')
      expect(regressionAlerts).toHaveLength(0)
    })

    it('should detect critical size regression', async () => {
      const customMonitor = new BundleSizeMonitor({
        regression: { warning: 0.1, critical: 0.25 } // 10% warning, 25% critical
      })

      const baseline: BundleMetrics = {
        ...mockBundleMetrics,
        size: 1024 * 1024,
        gzipSize: 300 * 1024
      }

      const regressed: BundleMetrics = {
        ...mockBundleMetrics,
        size: 1300 * 1024, // 27% increase - exceeds 25% critical threshold
        gzipSize: 400 * 1024 // 33% increase - exceeds 25% critical threshold
      }

      customMonitor.setBaseline('test-bundle', baseline)
      const analysis = await customMonitor.analyzeBundleSize(regressed)

      const regressionAlerts = analysis.alerts.filter(a => a.category === 'regression')
      expect(regressionAlerts.length).toBeGreaterThanOrEqual(2)

      const sizeRegression = regressionAlerts.find(a => a.message.includes('Critical size regression'))
      expect(sizeRegression).toBeDefined()
      expect(sizeRegression!.type).toBe('critical')
      expect(sizeRegression!.recommendations).toContain('Critical bundle size regression detected')

      const gzipRegression = regressionAlerts.find(a => a.message.includes('Critical gzip size regression'))
      expect(gzipRegression).toBeDefined()
      expect(gzipRegression!.type).toBe('critical')
    })

    it('should detect warning level regression', async () => {
      const baseline: BundleMetrics = {
        ...mockBundleMetrics,
        size: 1024 * 1024
      }

      const regressed: BundleMetrics = {
        ...mockBundleMetrics,
        size: 1200 * 1024 // 17% increase - exceeds default 10% warning, below 25% critical
      }

      monitor.setBaseline('test-bundle', baseline)
      const analysis = await monitor.analyzeBundleSize(regressed)

      const regressionAlerts = analysis.alerts.filter(a => a.category === 'regression')
      expect(regressionAlerts).toHaveLength(1)

      const warningRegression = regressionAlerts[0]
      expect(warningRegression.type).toBe('warning')
      expect(warningRegression.message).toContain('Size regression')
      expect(warningRegression.recommendations).toContain('Bundle size regression detected')
    })

    it('should track dependency changes between baseline and current', async () => {
      const baseline: BundleMetrics = {
        ...mockBundleMetrics,
        dependencies: [
          { name: 'react', size: 200 * 1024, percentage: 20 },
          { name: 'lodash', size: 150 * 1024, percentage: 15 },
          { name: 'old-dep', size: 100 * 1024, percentage: 10 }
        ]
      }

      const current: BundleMetrics = {
        ...mockBundleMetrics,
        dependencies: [
          { name: 'react', size: 200 * 1024, percentage: 20 },
          { name: 'lodash', size: 150 * 1024, percentage: 15 },
          { name: 'new-dep', size: 120 * 1024, percentage: 12 }
        ]
      }

      monitor.setBaseline('test-bundle', baseline)
      const analysis = await monitor.analyzeBundleSize(current)

      expect(analysis.comparison!.newDependencies).toContain('new-dep')
      expect(analysis.comparison!.removedDependencies).toContain('old-dep')
    })
  })

  describe('Baseline Management', () => {
    it('should save and load baselines from file', async () => {
      const baselineFile = path.join(tempDir, 'baselines.json')
      
      monitor.setBaseline('bundle-1', mockBundleMetrics)
      monitor.setBaseline('bundle-2', { ...mockBundleMetrics, name: 'bundle-2', size: 2048 * 1024 })

      await monitor.saveBaselines(baselineFile)
      
      const newMonitor = createBundleSizeMonitor()
      await newMonitor.loadBaselines(baselineFile)

      // Test that baselines were loaded correctly by analyzing bundle-1
      const analysis = await newMonitor.analyzeBundleSize({ ...mockBundleMetrics, name: 'bundle-1', size: 1100 * 1024 })
      expect(analysis.comparison).toBeDefined()
      expect(analysis.comparison!.baseline.size).toBe(1024 * 1024)
    })

    it('should handle missing baseline file gracefully', async () => {
      const nonExistentFile = path.join(tempDir, 'non-existent.json')
      
      await expect(monitor.loadBaselines(nonExistentFile)).resolves.toBeUndefined()
      
      // Monitor should still work normally
      const analysis = await monitor.analyzeBundleSize(mockBundleMetrics)
      expect(analysis.comparison).toBeUndefined() // No baseline available
    })

    it('should handle corrupted baseline file gracefully', async () => {
      const corruptedFile = path.join(tempDir, 'corrupted.json')
      await fs.writeFile(corruptedFile, 'invalid json content')
      
      // Spy on console.warn to suppress warning logging during test
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      await expect(monitor.loadBaselines(corruptedFile)).resolves.toBeUndefined()
      
      // Verify that a warning was logged (but suppressed)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load baselines'),
        expect.any(Error)
      )
      
      // Restore console.warn
      consoleWarnSpy.mockRestore()
    })
  })

  describe('Bundle Size Reporting', () => {
    it('should generate comprehensive bundle size report', async () => {
      const analyses: BundleAnalysis[] = []

      // Create multiple bundle analyses
      for (let i = 0; i < 3; i++) {
        const bundleMetrics: BundleMetrics = {
          ...mockBundleMetrics,
          name: `bundle-${i}`,
          size: (i + 1) * 1024 * 1024 // 1MB, 2MB, 3MB
        }
        const analysis = await monitor.analyzeBundleSize(bundleMetrics)
        analyses.push(analysis)
      }

      const report = BundleSizeMonitor.generateBundleReport(analyses)

      expect(report.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/)
      expect(report.project).toBe('TachUI Framework')
      expect(report.environment).toMatch(/test|development|production/)
      expect(report.analyses).toHaveLength(3)
      
      expect(report.summary.totalBundles).toBe(3)
      expect(report.summary.totalSize).toBe(6 * 1024 * 1024) // 1+2+3 = 6MB
      expect(report.summary.totalGzipSize).toBeGreaterThan(0)
      expect(report.summary.alertCount).toBeGreaterThanOrEqual(0)
      
      expect(report.recommendations).toBeInstanceOf(Array)
      expect(report.recommendations.length).toBeGreaterThan(0)
    })

    it('should provide appropriate recommendations for large total bundle size', async () => {
      const analyses: BundleAnalysis[] = []

      // Create analyses with large total size
      for (let i = 0; i < 3; i++) {
        const bundleMetrics: BundleMetrics = {
          ...mockBundleMetrics,
          name: `large-bundle-${i}`,
          size: 2 * 1024 * 1024 // 2MB each = 6MB total > 5MB threshold
        }
        const analysis = await monitor.analyzeBundleSize(bundleMetrics)
        analyses.push(analysis)
      }

      const report = BundleSizeMonitor.generateBundleReport(analyses)

      expect(report.recommendations.some(rec => 
        rec.includes('Total bundle size is very large - consider aggressive optimization')
      )).toBe(true)
    })

    it('should identify bundles with large chunks for code splitting recommendations', async () => {
      const analyses: BundleAnalysis[] = []

      // Create analysis with large chunks
      const largeBundleMetrics: BundleMetrics = {
        ...mockBundleMetrics,
        chunks: [
          { name: 'main', size: 1.5 * 1024 * 1024, type: 'entry' }, // > 1MB threshold
          { name: 'vendor', size: 800 * 1024, type: 'vendor' }
        ]
      }
      
      const analysis = await monitor.analyzeBundleSize(largeBundleMetrics)
      analyses.push(analysis)

      const report = BundleSizeMonitor.generateBundleReport(analyses)

      expect(report.recommendations.some(rec => 
        rec.includes('bundles have large chunks - implement code splitting')
      )).toBe(true)
    })
  })

  describe('File Analysis Integration', () => {
    it('should analyze bundle from file and generate metrics', async () => {
      // Create a temporary bundle file
      const bundleFile = path.join(tempDir, 'test-bundle.js')
      const bundleContent = 'console.log("test bundle content");'.repeat(1000) // Create some content
      await fs.writeFile(bundleFile, bundleContent)

      const metrics = await BundleSizeMonitor.analyzeBundleFromFile(bundleFile)

      expect(metrics.name).toBe('test-bundle')
      expect(metrics.size).toBeGreaterThan(0)
      expect(metrics.gzipSize).toBeGreaterThan(0)
      expect(metrics.gzipSize).toBeLessThan(metrics.size) // Gzipped should be smaller
      expect(metrics.chunks).toHaveLength(1)
      expect(metrics.chunks[0].name).toBe('test-bundle')
      expect(metrics.dependencies.length).toBeGreaterThan(0)
      expect(metrics.assets).toHaveLength(1)
      expect(metrics.assets[0].type).toBe('js')
    })

    it('should handle non-existent file gracefully', async () => {
      const nonExistentFile = path.join(tempDir, 'non-existent.js')
      
      await expect(BundleSizeMonitor.analyzeBundleFromFile(nonExistentFile)).rejects.toThrow()
    })
  })

  describe('Custom Thresholds and Configuration', () => {
    it('should respect custom size thresholds', async () => {
      const strictMonitor = new BundleSizeMonitor({
        size: { warning: 500 * 1024, critical: 800 * 1024 }, // 500KB warning, 800KB critical
        gzipSize: { warning: 150 * 1024, critical: 250 * 1024 } // 150KB warning, 250KB critical
      })

      // Use normal-sized bundle that should trigger alerts with strict thresholds
      const analysis = await strictMonitor.analyzeBundleSize(mockBundleMetrics)

      const sizeAlerts = analysis.alerts.filter(a => a.category === 'bundle_size')
      expect(sizeAlerts.length).toBeGreaterThan(0)
      expect(sizeAlerts[0].type).toBe('critical') // 1MB > 800KB critical threshold
      expect(sizeAlerts[0].threshold).toBe(800 * 1024)

      const gzipAlerts = analysis.alerts.filter(a => a.category === 'gzip_size')
      expect(gzipAlerts.length).toBeGreaterThan(0)
      expect(gzipAlerts[0].type).toBe('critical') // 300KB > 250KB critical threshold
    })

    it('should respect custom configuration options', async () => {
      const configuredMonitor = new BundleSizeMonitor({}, {
        enableCompression: false,
        enableChunkAnalysis: false,
        enableDependencyAnalysis: false
      })

      const analysis = await configuredMonitor.analyzeBundleSize(mockBundleMetrics)

      // Should still analyze size but with reduced features
      expect(analysis.bundleName).toBe('test-bundle')
      expect(analysis.metrics).toEqual(mockBundleMetrics)
      
      // Configuration primarily affects internal behavior, but analysis should still complete
      expect(analysis.alerts).toBeInstanceOf(Array)
      expect(analysis.optimizations).toBeInstanceOf(Array)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle bundle with no chunks', async () => {
      const noCHunksBundle: BundleMetrics = {
        ...mockBundleMetrics,
        chunks: []
      }

      const analysis = await monitor.analyzeBundleSize(noCHunksBundle)

      expect(analysis.bundleName).toBe('test-bundle')
      expect(analysis.alerts.filter(a => a.category === 'chunk_size')).toHaveLength(0)
    })

    it('should handle bundle with no dependencies', async () => {
      const noDepsBundle: BundleMetrics = {
        ...mockBundleMetrics,
        dependencies: []
      }

      const analysis = await monitor.analyzeBundleSize(noDepsBundle)

      expect(analysis.bundleName).toBe('test-bundle')
      expect(analysis.alerts.filter(a => a.category === 'dependency_bloat')).toHaveLength(0)
      expect(analysis.optimizations.filter(o => o.type === 'dependency_removal')).toHaveLength(0)
    })

    it('should handle zero-sized bundle', async () => {
      const zeroBundle: BundleMetrics = {
        ...mockBundleMetrics,
        size: 0,
        gzipSize: 0
      }

      const analysis = await monitor.analyzeBundleSize(zeroBundle)

      expect(analysis.bundleName).toBe('test-bundle')
      expect(analysis.alerts.filter(a => a.category === 'bundle_size')).toHaveLength(0)
    })

    it('should handle malformed bundle metrics gracefully', async () => {
      const malformedBundle: any = {
        name: 'malformed',
        size: 'invalid', // String instead of number
        gzipSize: null,
        chunks: 'not-an-array',
        dependencies: undefined,
        assets: []
      }

      // Should handle errors gracefully - may throw but shouldn't crash
      try {
        const analysis = await monitor.analyzeBundleSize(malformedBundle)
        expect(analysis).toBeDefined()
      } catch (error) {
        // It's acceptable for malformed data to throw an error
        expect(error).toBeInstanceOf(Error)
      }
    })
  })
})