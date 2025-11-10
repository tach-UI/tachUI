/**
 * TachUI Benchmark Suite
 *
 * Main entry point for running performance benchmarks
 * aligned with industry standards.
 */

export * from './comparison'
export * from './setup'
export * from './tachui-benchmarks'

import { pathToFileURL } from 'node:url'
import {
  calculatePerformanceScore,
  convertTachUIResults,
  FRAMEWORK_BASELINES,
  generateComparisonReport,
} from './comparison'
import { runTachUIBenchmarks } from './tachui-benchmarks'

/**
 * Run complete benchmark suite with comparison report
 */
export async function runCompleteBenchmarkSuite() {
  console.log('🚀 Starting TachUI Complete Benchmark Suite')
  console.log('='.repeat(50))

  try {
    // Run TachUI benchmarks
    const { results, report } = await runTachUIBenchmarks()

    // Convert to comparable format
    const tachuiData = convertTachUIResults(results)

    // Generate comparison report
    const comparisonReport = generateComparisonReport(tachuiData, FRAMEWORK_BASELINES)

    // Calculate performance score
    const performanceScore = calculatePerformanceScore(tachuiData)

    console.log('\n📊 TachUI Benchmark Results:')
    console.log(report)

    console.log('\n🔍 Framework Comparison:')
    console.log(comparisonReport)

    console.log(`\n🎯 TachUI Performance Score: ${performanceScore}/100`)

    // Summary
    console.log('\n📈 Summary:')
    console.log(`  Framework: TachUI v0.1.0`)
    console.log(`  Total benchmarks: ${results.length}`)
    console.log(`  Performance score: ${performanceScore}/100`)
    console.log(`  Architecture: Direct DOM + Fine-grained Reactivity`)
    console.log(`  Bundle size: ~${tachuiData.results.bundleSize}KB`)
    console.log(`  Memory efficiency: ${tachuiData.results.memoryUsage.toFixed(1)}MB`)

    return {
      tachuiResults: results,
      tachuiData,
      comparisonReport,
      performanceScore,
      summary: {
        totalBenchmarks: results.length,
        performanceScore,
        bundleSize: tachuiData.results.bundleSize,
        memoryUsage: tachuiData.results.memoryUsage,
      },
    }
  } catch (error) {
    console.error('❌ Benchmark suite failed:', error)
    throw error
  }
}

/**
 * Quick benchmark runner for development
 */
export async function runQuickBenchmark() {
  console.log('⚡ Running Quick TachUI Benchmark...')

  const { results } = await runTachUIBenchmarks()
  const tachuiData = convertTachUIResults(results)
  const performanceScore = calculatePerformanceScore(tachuiData)

  console.log('\n📊 Quick Results:')
  console.log(`  Create 1K rows: ${tachuiData.results.create1000.toFixed(1)}ms`)
  console.log(`  Update rows: ${tachuiData.results.partialUpdate.toFixed(1)}ms`)
  console.log(`  Memory usage: ${tachuiData.results.memoryUsage.toFixed(1)}MB`)
  console.log(`  Performance score: ${performanceScore}/100`)

  return {
    ...tachuiData,
    performanceScore,
  }
}

// CLI runner if called directly
const isDirectRun =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  typeof process.argv[1] === 'string' &&
  pathToFileURL(process.argv[1]).href === import.meta.url

if (isDirectRun) {
  runCompleteBenchmarkSuite()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Benchmark failed:', error)
      process.exit(1)
    })
}
