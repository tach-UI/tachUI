/**
 * Cross-Framework Benchmark Comparison
 *
 * Provides benchmark data comparison with other popular frameworks
 * based on js-framework-benchmark results and industry standards.
 */

export interface FrameworkBenchmarkData {
  framework: string
  version: string
  results: {
    create1000: number // Create 1,000 rows (ms)
    replaceAll: number // Replace all rows (ms)
    partialUpdate: number // Update every 10th row (ms)
    selectRow: number // Select row (ms)
    swapRows: number // Swap rows (ms)
    removeRows: number // Remove rows (ms)
    clearRows: number // Clear rows (ms)
    memoryUsage: number // Memory usage (MB)
    bundleSize: number // Bundle size (KB)
  }
}

/**
 * Baseline performance data from js-framework-benchmark and other sources
 * These are representative values for comparison purposes
 */
export const FRAMEWORK_BASELINES: FrameworkBenchmarkData[] = [
  {
    framework: 'React',
    version: '18.2.0',
    results: {
      create1000: 45.2,
      replaceAll: 47.8,
      partialUpdate: 23.1,
      selectRow: 4.2,
      swapRows: 8.7,
      removeRows: 19.3,
      clearRows: 12.1,
      memoryUsage: 8.5,
      bundleSize: 42.2,
    },
  },
  {
    framework: 'Vue',
    version: '3.3.0',
    results: {
      create1000: 38.9,
      replaceAll: 41.2,
      partialUpdate: 19.8,
      selectRow: 3.1,
      swapRows: 7.2,
      removeRows: 16.7,
      clearRows: 9.8,
      memoryUsage: 6.9,
      bundleSize: 34.1,
    },
  },
  {
    framework: 'SolidJS',
    version: '1.7.0',
    results: {
      create1000: 22.1,
      replaceAll: 24.8,
      partialUpdate: 8.9,
      selectRow: 1.8,
      swapRows: 3.2,
      removeRows: 7.1,
      clearRows: 4.2,
      memoryUsage: 4.1,
      bundleSize: 8.9,
    },
  },
  {
    framework: 'Svelte',
    version: '4.0.0',
    results: {
      create1000: 28.7,
      replaceAll: 31.2,
      partialUpdate: 12.4,
      selectRow: 2.3,
      swapRows: 4.8,
      removeRows: 9.8,
      clearRows: 6.1,
      memoryUsage: 5.2,
      bundleSize: 12.3,
    },
  },
  {
    framework: 'Angular',
    version: '16.0.0',
    results: {
      create1000: 52.3,
      replaceAll: 55.7,
      partialUpdate: 28.9,
      selectRow: 5.1,
      swapRows: 11.2,
      removeRows: 24.3,
      clearRows: 15.8,
      memoryUsage: 12.1,
      bundleSize: 58.7,
    },
  },
  {
    framework: 'Preact',
    version: '10.15.0',
    results: {
      create1000: 41.8,
      replaceAll: 44.1,
      partialUpdate: 20.7,
      selectRow: 3.8,
      swapRows: 7.9,
      removeRows: 17.2,
      clearRows: 10.5,
      memoryUsage: 6.3,
      bundleSize: 14.2,
    },
  },
]

/**
 * Convert TachUI benchmark results to comparable format
 */
type BenchmarkResultWithMetadata = {
  name: string
  duration: number
  memory?: number
  metadata?: Record<string, unknown>
}

function selectBaselineResult(
  results: BenchmarkResultWithMetadata[],
  benchmarkName: string
) {
  const normalizedName = benchmarkName.toLowerCase()
  const baseline = results.find(
    result =>
      result.name.toLowerCase().includes(normalizedName) &&
      (result.metadata?.cacheMode === 'baseline' || result.metadata?.cacheMode == null)
  )
  if (baseline) {
    return baseline
  }
  return results.find(result => result.name.toLowerCase().includes(normalizedName))
}

export function convertTachUIResults(results: any[]): FrameworkBenchmarkData {
  const findResult = (name: string) => selectBaselineResult(results, name)
  const toDuration = (name: string) => {
    const value = findResult(name)?.duration
    return typeof value === 'number' && Number.isFinite(value) ? value : Number.NaN
  }
  const createMemoryBytes = findResult('create 1,000')?.memory
  const memoryUsageMb =
    typeof createMemoryBytes === 'number' && createMemoryBytes > 0
      ? createMemoryBytes / 1024 / 1024
      : Number.NaN

  return {
    framework: 'TachUI',
    version: '0.1.0',
    results: {
      create1000: toDuration('create 1,000'),
      replaceAll: toDuration('replace all'),
      partialUpdate: toDuration('partial update'),
      selectRow: toDuration('select row'),
      swapRows: toDuration('swap rows'),
      removeRows: toDuration('remove rows'),
      clearRows: toDuration('clear rows'),
      memoryUsage: memoryUsageMb,
      bundleSize: 15.8, // Estimated based on current implementation
    },
  }
}

/**
 * Generate comparison report
 */
export function generateComparisonReport(
  tachuiData: FrameworkBenchmarkData,
  baselines: FrameworkBenchmarkData[] = FRAMEWORK_BASELINES
): string {
  const formatValue = (value: number): string =>
    Number.isFinite(value) ? value.toFixed(1) : 'N/A'

  const report = [
    'TachUI Performance Comparison Report',
    '='.repeat(50),
    '',
    'Benchmark Results (lower is better, except ops/sec):',
    '',
  ]

  // Table header
  const frameworks = ['Benchmark', 'TachUI', ...baselines.map((b) => b.framework)]
  const colWidths = frameworks.map((f) => Math.max(f.length, 8))

  report.push(frameworks.map((f, i) => f.padEnd(colWidths[i])).join(' | '))
  report.push(colWidths.map((w) => '-'.repeat(w)).join('-|-'))

  // Benchmark rows
  const benchmarks = [
    { name: 'Create 1K rows (ms)', key: 'create1000' },
    { name: 'Replace all (ms)', key: 'replaceAll' },
    { name: 'Partial update (ms)', key: 'partialUpdate' },
    { name: 'Select row (ms)', key: 'selectRow' },
    { name: 'Swap rows (ms)', key: 'swapRows' },
    { name: 'Remove rows (ms)', key: 'removeRows' },
    { name: 'Clear rows (ms)', key: 'clearRows' },
    { name: 'Memory usage (MB)', key: 'memoryUsage' },
    { name: 'Bundle size (KB)', key: 'bundleSize' },
  ]

  benchmarks.forEach((benchmark) => {
    const tachuiValue = tachuiData.results[benchmark.key as keyof typeof tachuiData.results]
    const row = [
      benchmark.name.padEnd(colWidths[0]),
      formatValue(tachuiValue).padEnd(colWidths[1]),
    ]

    baselines.forEach((baseline, i) => {
      const value = baseline.results[benchmark.key as keyof typeof baseline.results]
      row.push(formatValue(value).padEnd(colWidths[i + 2]))
    })

    report.push(row.join(' | '))
  })

  // Performance analysis
  report.push('', 'Performance Analysis:', '')

  const analysis = []

  // Compare against SolidJS (closest architecture)
  const solid = baselines.find((b) => b.framework === 'SolidJS')
  const formatRatio = (ratio: number): string => {
    if (!Number.isFinite(ratio)) {
      return 'N/A'
    }
    return ratio > 1
      ? `${(ratio * 100 - 100).toFixed(1)}% slower`
      : `${(100 - ratio * 100).toFixed(1)}% faster`
  }

  const formatRatioInverse = (ratio: number): string => {
    if (!Number.isFinite(ratio)) {
      return 'N/A'
    }
    return ratio > 1
      ? `${(ratio * 100 - 100).toFixed(1)}% higher`
      : `${(100 - ratio * 100).toFixed(1)}% lower`
  }

  if (solid) {
    const createRatio = tachuiData.results.create1000 / solid.results.create1000
    const updateRatio = tachuiData.results.partialUpdate / solid.results.partialUpdate
    const memoryRatio = tachuiData.results.memoryUsage / solid.results.memoryUsage

    analysis.push(`vs SolidJS (closest architecture):`)
    analysis.push(`  Create performance: ${formatRatio(createRatio)}`)
    analysis.push(`  Update performance: ${formatRatio(updateRatio)}`)
    analysis.push(`  Memory usage: ${formatRatioInverse(memoryRatio)}`)
  }

  // Compare against React (most popular)
  const react = baselines.find((b) => b.framework === 'React')
  if (react) {
    const createRatio = tachuiData.results.create1000 / react.results.create1000
    const updateRatio = tachuiData.results.partialUpdate / react.results.partialUpdate
    const memoryRatio = tachuiData.results.memoryUsage / react.results.memoryUsage

    analysis.push(``, `vs React (most popular):`)
    analysis.push(`  Create performance: ${formatRatio(createRatio)}`)
    analysis.push(`  Update performance: ${formatRatio(updateRatio)}`)
    analysis.push(`  Memory usage: ${formatRatioInverse(memoryRatio)}`)
  }

  // Overall ranking
  analysis.push(``, `Overall Performance Ranking:`)
  const allFrameworks = [tachuiData, ...baselines]
  const avgPerformance = allFrameworks
    .map((f) => {
      const values = [f.results.create1000, f.results.replaceAll, f.results.partialUpdate]
      const validValues = values.filter(value => Number.isFinite(value))
      const avgTime =
        validValues.length > 0
          ? validValues.reduce((sum, value) => sum + value, 0) / validValues.length
          : Number.POSITIVE_INFINITY
      return {
        framework: f.framework,
        avgTime,
      }
    })
    .sort((a, b) => a.avgTime - b.avgTime)

  avgPerformance.forEach((f, i) => {
    const position = i + 1
    const emoji = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '  '
    analysis.push(`  ${emoji} ${position}. ${f.framework}: ${f.avgTime.toFixed(1)}ms avg`)
  })

  report.push(...analysis)

  // Strengths and areas for improvement
  report.push('', 'TachUI Strengths:', '')
  const strengths = []

  if (tachuiData.results.bundleSize < 20) {
    strengths.push('  ✅ Lightweight bundle size')
  }
  if (Number.isFinite(tachuiData.results.memoryUsage) && tachuiData.results.memoryUsage < 8) {
    strengths.push('  ✅ Efficient memory usage')
  }
  if (Number.isFinite(tachuiData.results.create1000) && tachuiData.results.create1000 < 35) {
    strengths.push('  ✅ Fast component creation')
  }
  if (Number.isFinite(tachuiData.results.partialUpdate) && tachuiData.results.partialUpdate < 15) {
    strengths.push('  ✅ Efficient reactive updates')
  }

  if (strengths.length === 0) {
    strengths.push('  📊 Performance baseline established')
  }

  report.push(...strengths)

  return report.join('\n')
}

/**
 * Calculate performance score (0-100, higher is better)
 */
export function calculatePerformanceScore(data: FrameworkBenchmarkData): number {
  // Weighted scoring based on importance
  const weights = {
    create1000: 0.18,
    replaceAll: 0.12,
    partialUpdate: 0.25, // Most important for UX
    selectRow: 0.08,
    swapRows: 0.08,
    removeRows: 0.08,
    clearRows: 0.06,
    memoryUsage: 0.08,
    bundleSize: 0.07, // Include bundle size in scoring
  }

  // Baseline "excellent" scores (based on best-in-class performance)
  const excellentScores = {
    create1000: 18, // SolidJS-level performance
    replaceAll: 22,
    partialUpdate: 7,
    selectRow: 1.5,
    swapRows: 2.5,
    removeRows: 6,
    clearRows: 3.5,
    memoryUsage: 4, // MB
    bundleSize: 12, // KB
  }

  // Maximum acceptable scores (performance threshold)
  const acceptableScores = {
    create1000: 50, // React-level performance
    replaceAll: 55,
    partialUpdate: 25,
    selectRow: 5,
    swapRows: 10,
    removeRows: 22,
    clearRows: 14,
    memoryUsage: 10, // MB
    bundleSize: 45, // KB
  }

  // (et al repeated revert)

  let totalScore = 0
  let totalWeight = 0

  Object.entries(weights).forEach(([key, weight]) => {
    const actual = data.results[key as keyof typeof data.results]
    const excellent = excellentScores[key as keyof typeof excellentScores]
    const acceptable = acceptableScores[key as keyof typeof acceptableScores]

    // Handle missing/zero values
    if (!actual || actual <= 0) {
      totalScore += 0 * weight // 0 score for missing data
      totalWeight += weight
      return
    }

    let score: number

    if (actual <= excellent) {
      // Excellent performance: assign perfect score
      score = 100
    } else if (actual <= acceptable) {
      // Good performance: 50-85 score
      const range = acceptable - excellent
      const position = (actual - excellent) / range
      score = 85 - 35 * position
    } else {
      // Poor performance: 0-50 score
      const excess = actual - acceptable
      const penalty = Math.min(50, (excess / acceptable) * 30)
      score = Math.max(0, 50 - penalty)
    }

    totalScore += score * weight
    totalWeight += weight
  })

  // Ensure we have valid weights
  if (totalWeight === 0) {
    return 0
  }

  return Math.round(Math.max(0, Math.min(100, totalScore / totalWeight)))
}

// FRAMEWORK_BASELINES already exported above
