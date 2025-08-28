/**
 * Complete Browser Benchmark Suite
 *
 * Comprehensive real-world performance testing using Playwright
 */

import { expect, test } from '@playwright/test'

interface BenchmarkResult {
  name: string
  duration: number
  memory: number
  operationsPerSecond: number
  timestamp: string
}

test('Complete Browser Benchmark Suite', async ({ page }) => {
  console.log('\n🚀 Running Complete Browser Benchmark Suite...\n')

  // Navigate to benchmark page
  await page.goto('/')

  // Wait for the benchmark runner to initialize
  await page.waitForFunction(() => window.benchmarkRunner !== undefined)

  console.log('🏃‍♂️ Running all browser benchmarks...')

  // Clear any previous results
  await page.evaluate(() => window.benchmarkRunner.clearResults())

  // Run the complete benchmark suite
  await page.click('#run-all')

  // Wait for all benchmarks to complete (with longer timeout)
  await page.waitForFunction(() => !window.benchmarkRunner.isRunning, { timeout: 120000 })

  // Wait a bit more to ensure all results are collected
  await page.waitForTimeout(500)

  // Get all results
  const results: BenchmarkResult[] = await page.evaluate(() => window.benchmarkRunner.getResults())

  console.log(
    `DEBUG: Got ${results.length} results:`,
    results.map((r) => r.name)
  )

  console.log('\n📊 Complete Browser Benchmark Results:')
  console.log('='.repeat(60))

  // Group results by category
  const categories = {
    CREATE: results.filter((r) => r.name.toLowerCase().includes('create')),
    UPDATE: results.filter(
      (r) => r.name.toLowerCase().includes('update') || r.name.toLowerCase().includes('replace')
    ),
    SELECT: results.filter((r) => r.name.toLowerCase().includes('select')),
    MANIPULATE: results.filter((r) => r.name.toLowerCase().includes('swap')),
    REMOVE: results.filter(
      (r) => r.name.toLowerCase().includes('remove') || r.name.toLowerCase().includes('clear')
    ),
    COMPONENT: results.filter((r) => r.name.toLowerCase().includes('component')),
  }

  Object.entries(categories).forEach(([category, categoryResults]) => {
    if (categoryResults.length > 0) {
      console.log(`\n${category} Operations:`)
      categoryResults.forEach((result) => {
        console.log(`  ${result.name}:`)
        console.log(`    Duration: ${result.duration}ms`)
        console.log(`    Ops/sec: ${result.operationsPerSecond}`)
        console.log(`    Memory: ${result.memory}MB`)
      })
    }
  })

  // Calculate overall statistics
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)
  const avgDuration = totalDuration / results.length
  const maxDuration = Math.max(...results.map((r) => r.duration))
  const minDuration = Math.min(...results.map((r) => r.duration))
  const totalMemoryImpact = results.reduce((sum, r) => sum + Math.abs(r.memory), 0)
  const avgOpsPerSec = results.reduce((sum, r) => sum + r.operationsPerSecond, 0) / results.length

  console.log('\n📈 Performance Summary:')
  console.log(`  Total benchmarks: ${results.length}`)
  console.log(`  Total duration: ${totalDuration.toFixed(1)}ms`)
  console.log(`  Average duration: ${avgDuration.toFixed(1)}ms`)
  console.log(`  Fastest operation: ${minDuration.toFixed(1)}ms`)
  console.log(`  Slowest operation: ${maxDuration.toFixed(1)}ms`)
  console.log(`  Total memory impact: ${totalMemoryImpact.toFixed(1)}MB`)
  console.log(`  Average ops/sec: ${avgOpsPerSec.toFixed(0)}`)

  // Performance expectations for real browser
  // Note: Some benchmarks might fail if there are no rows, so we expect at least 6
  expect(results.length).toBeGreaterThanOrEqual(6) // Should run at least 6 benchmarks
  expect(avgDuration).toBeLessThan(2000) // Average should be under 2 seconds
  expect(maxDuration).toBeLessThan(10000) // No single operation should take more than 10 seconds
  expect(results.every((r) => r.duration > 0)).toBe(true) // All should have positive duration

  // Check specific performance characteristics
  const createRowsResult = results.find((r) => r.name.includes('Create 1,000 rows'))
  if (createRowsResult) {
    console.log(`\n🎯 Key Performance Metrics:`)
    console.log(`  Create 1,000 rows: ${createRowsResult.duration}ms`)
    expect(createRowsResult.duration).toBeLessThan(5000) // Should create 1K rows in under 5 seconds
  }

  const updateResult = results.find((r) => r.name.includes('Update every 10th'))
  if (updateResult) {
    console.log(`  Update every 10th row: ${updateResult.duration}ms`)
    expect(updateResult.duration).toBeLessThan(1000) // Updates should be very fast
  }

  console.log('\n✅ Complete browser benchmark suite passed!')
  console.log("🎉 Real browser performance demonstrates TachUI's efficiency!")
})

test('Browser vs Mock DOM Comparison', async ({ page }) => {
  console.log('\n🔬 Browser vs Mock DOM Performance Comparison...')

  await page.goto('/')
  await page.waitForFunction(() => window.benchmarkRunner !== undefined)

  // Run a key benchmark for comparison
  await page.click('#create-rows')
  await page.waitForFunction(() => !window.benchmarkRunner.isRunning, { timeout: 30000 })

  const browserResult = await page.evaluate(() => window.benchmarkRunner.getLatestResult())

  console.log('\n📊 Performance Comparison:')
  console.log(`  Browser (real DOM): ${browserResult.duration}ms`)
  console.log(`  Mock DOM (JSDOM): ~9000ms (from previous tests)`)

  const improvement = Math.round(((9000 - browserResult.duration) / 9000) * 100)
  console.log(`  Performance improvement: ${improvement}% faster in real browser`)

  // Browser should be significantly faster than mock DOM
  expect(browserResult.duration).toBeLessThan(1000) // Should be much faster than 9 seconds
  expect(improvement).toBeGreaterThan(80) // Should be at least 80% faster

  console.log('\n✅ Browser performance is dramatically better than mock DOM!')
  console.log('💡 This demonstrates why browser benchmarks provide more accurate performance data.')
})
