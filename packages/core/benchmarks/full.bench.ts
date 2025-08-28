/**
 * Full Benchmark Runner
 *
 * Runs all TachUI benchmarks without framework comparison
 */

import { test } from 'vitest'
import { runTachUIBenchmarks } from './tachui-benchmarks'

test('Full TachUI Benchmark Suite', async () => {
  console.log('\n🏃‍♂️ Running Full TachUI Benchmark Suite...\n')

  try {
    const { results, report } = await runTachUIBenchmarks()

    console.log(report)

    console.log('\n✅ Full benchmark suite completed successfully!')
    console.log(`Total benchmarks executed: ${results.length}`)

    // Show summary of each benchmark
    results.forEach((result) => {
      console.log(
        `  ${result.name}: ${result.duration.toFixed(1)}ms (${result.operationsPerSecond?.toFixed(0)} ops/sec)`
      )
    })
  } catch (error) {
    console.error('❌ Full benchmark suite failed:', error)
    throw error
  }
}, 90000) // 90 second timeout
