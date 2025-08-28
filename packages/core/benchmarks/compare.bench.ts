/**
 * Complete Benchmark Suite Runner
 *
 * Runs full benchmark suite with framework comparison
 */

import { test } from 'vitest'
import { runCompleteBenchmarkSuite } from './index'

test('Complete Benchmark Suite with Framework Comparison', async () => {
  console.log('\n🚀 Running Complete TachUI Benchmark Suite...\n')

  try {
    const results = await runCompleteBenchmarkSuite()

    console.log('\n✅ Complete benchmark suite completed successfully!')
    console.log(`Total benchmarks: ${results.summary.totalBenchmarks}`)
    console.log(`Performance Score: ${results.summary.performanceScore}/100`)
    console.log(`Bundle Size: ~${results.summary.bundleSize}KB`)
    console.log(`Memory Usage: ${results.summary.memoryUsage.toFixed(1)}MB`)

    // Performance feedback
    if (results.summary.performanceScore >= 85) {
      console.log('🎉 Exceptional performance! TachUI is performing excellently.')
    } else if (results.summary.performanceScore >= 75) {
      console.log('🌟 Great performance! TachUI is competitive with leading frameworks.')
    } else if (results.summary.performanceScore >= 65) {
      console.log('✅ Good performance! Consider optimizations for better results.')
    } else {
      console.log('⚠️  Performance could be improved. Review optimization opportunities.')
    }
  } catch (error) {
    console.error('❌ Complete benchmark suite failed:', error)
    throw error
  }
}, 120000) // 2 minute timeout
