/**
 * Quick Benchmark Runner
 *
 * Runs essential performance benchmarks for quick feedback
 */

import { test } from 'vitest'
import { runQuickBenchmark } from './index'

test('Quick Performance Benchmark', async () => {
  console.log('\n🚀 Running Quick TachUI Benchmark...\n')

  try {
    const results = await runQuickBenchmark()

    console.log('\n✅ Quick benchmark completed successfully!')
    console.log(`Performance Score: ${results.performanceScore}/100`)

    // Simple performance assertions
    if (results.performanceScore < 50) {
      console.warn('⚠️  Performance score is below 50. Consider optimization.')
    } else if (results.performanceScore >= 80) {
      console.log('🎉 Excellent performance!')
    } else {
      console.log('✅ Good performance!')
    }
  } catch (error) {
    console.error('❌ Quick benchmark failed:', error)
    throw error
  }
}, 60000) // 60 second timeout
