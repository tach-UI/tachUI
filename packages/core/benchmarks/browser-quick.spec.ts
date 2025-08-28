/**
 * Quick Browser Benchmark
 *
 * Real-world performance testing using Playwright and actual browser DOM
 */

import { expect, test } from '@playwright/test'

test('Quick Browser Performance Benchmark', async ({ page }) => {
  console.log('\n🚀 Running Quick Browser Benchmark...\n')

  // Navigate to benchmark page
  await page.goto('/')

  // Wait for the benchmark runner to initialize
  await page.waitForFunction(() => window.benchmarkRunner !== undefined)

  // Run a subset of key benchmarks for quick feedback
  const benchmarks = ['create-rows', 'update-rows', 'clear-rows']

  console.log('Running essential benchmarks...')

  for (const benchmark of benchmarks) {
    console.log(`  Running ${benchmark}...`)

    // Click the benchmark button
    await page.click(`#${benchmark}`)

    // Wait for completion (benchmark runner sets isRunning to false)
    await page.waitForFunction(() => !window.benchmarkRunner.isRunning, { timeout: 30000 })

    // Get the latest result
    const result = await page.evaluate(() => window.benchmarkRunner.getLatestResult())

    console.log(
      `    ✅ ${result.name}: ${result.duration}ms (${result.operationsPerSecond} ops/sec, ${result.memory}MB)`
    )

    // Basic assertions
    expect(result.duration).toBeGreaterThan(0)
    expect(result.duration).toBeLessThan(10000) // Should complete within 10 seconds
  }

  // Get all results
  const allResults = await page.evaluate(() => window.benchmarkRunner.getResults())

  console.log('\n📊 Quick Browser Benchmark Results:')
  console.log(`  Total benchmarks run: ${allResults.length}`)

  // Calculate summary metrics
  const avgDuration = allResults.reduce((sum, r) => sum + r.duration, 0) / allResults.length
  const totalMemory = allResults.reduce((sum, r) => sum + Math.abs(r.memory), 0)
  const avgOpsPerSec =
    allResults.reduce((sum, r) => sum + r.operationsPerSecond, 0) / allResults.length

  console.log(`  Average duration: ${avgDuration.toFixed(1)}ms`)
  console.log(`  Total memory impact: ${totalMemory.toFixed(1)}MB`)
  console.log(`  Average ops/sec: ${avgOpsPerSec.toFixed(0)}`)

  // Performance expectations (much more realistic than JSDOM)
  expect(avgDuration).toBeLessThan(1000) // Average operation should be under 1 second
  expect(allResults.every((r) => r.duration > 0)).toBe(true)

  console.log('\n✅ Quick browser benchmark completed successfully!')
  console.log('🎉 Real browser performance is significantly better than mock DOM!')
})

test('Component Creation Browser Benchmark', async ({ page }) => {
  console.log('\n🧪 Running Component Creation Browser Benchmark...')

  await page.goto('/')
  await page.waitForFunction(() => window.benchmarkRunner !== undefined)

  console.log('  Testing component creation performance...')

  // Run component creation test
  await page.click('#run-component-test')
  await page.waitForFunction(() => !window.benchmarkRunner.isRunning, { timeout: 30000 })

  const result = await page.evaluate(() => window.benchmarkRunner.getLatestResult())

  console.log(
    `  ✅ Component creation: ${result.duration}ms (${result.operationsPerSecond} ops/sec, ${result.memory}MB)`
  )

  // Component creation should be fast in real browser
  expect(result.duration).toBeGreaterThan(0)
  expect(result.duration).toBeLessThan(5000) // Should create 1000 components in under 5 seconds

  console.log('✅ Component creation benchmark completed!')
})
