/**
 * TachUI Benchmark Setup
 *
 * Standard benchmark setup aligned with js-framework-benchmark
 * and other industry benchmarking tools.
 */

import { ComponentManager } from '../src/runtime/component'

export interface BenchmarkResult {
  name: string
  framework: string
  duration: number
  memory?: number
  operationsPerSecond?: number
  type: 'create' | 'update' | 'select' | 'swap' | 'remove' | 'clear'
}

export interface BenchmarkConfig {
  iterations: number
  warmupRuns: number
  measureMemory: boolean
  framework: string
}

export class BenchmarkRunner {
  private results: BenchmarkResult[] = []
  private config: BenchmarkConfig

  constructor(config: BenchmarkConfig) {
    this.config = config
  }

  async run(
    name: string,
    type: BenchmarkResult['type'],
    benchmark: () => Promise<void> | void
  ): Promise<BenchmarkResult> {
    const manager = ComponentManager.getInstance()

    // Warmup runs
    for (let i = 0; i < this.config.warmupRuns; i++) {
      await benchmark()
      manager.cleanup()
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }

    const startMemory = this.config.measureMemory ? this.getMemoryUsage() : undefined
    const iterations = Math.max(1, this.config.iterations)
    const startTime = performance.now()

    // Run actual benchmark
    for (let i = 0; i < iterations; i++) {
      await benchmark()
      manager.cleanup()
    }

    const endTime = performance.now()
    const endMemory = this.config.measureMemory ? this.getMemoryUsage() : undefined

    const totalDuration = endTime - startTime
    const perIterationDuration = totalDuration / iterations
    const memoryDelta =
      endMemory && startMemory ? (endMemory - startMemory) / iterations : undefined
    const operationsPerSecond = perIterationDuration > 0 ? 1000 / perIterationDuration : undefined

    const result: BenchmarkResult = {
      name,
      framework: this.config.framework,
      duration: perIterationDuration,
      memory: memoryDelta,
      operationsPerSecond,
      type,
    }

    this.results.push(result)
    return result
  }

  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed
    }
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize
    }
    return 0
  }

  getResults(): BenchmarkResult[] {
    return this.results
  }

  clearResults(): void {
    this.results = []
  }

  generateReport(): string {
    const report = ['TachUI Benchmark Results', '='.repeat(50)]

    const grouped = this.results.reduce(
      (acc, result) => {
        if (!acc[result.type]) {
          acc[result.type] = []
        }
        acc[result.type].push(result)
        return acc
      },
      {} as Record<string, BenchmarkResult[]>
    )

    Object.entries(grouped).forEach(([type, results]) => {
      report.push(`\n${type.toUpperCase()} Operations:`)
      results.forEach((result) => {
        report.push(`  ${result.name}:`)
        report.push(`    Duration: ${result.duration.toFixed(2)}ms`)
        report.push(`    Ops/sec: ${result.operationsPerSecond?.toFixed(0) || 'N/A'}`)
        if (result.memory) {
          report.push(`    Memory: ${(result.memory / 1024 / 1024).toFixed(2)}MB`)
        }
      })
    })

    return report.join('\n')
  }
}

// Mock DOM for Node.js environment
export function setupMockDOM(): void {
  if (typeof window === 'undefined') {
    const { JSDOM } = require('jsdom')
    const dom = new JSDOM(
      '<!DOCTYPE html><html><body><div id="benchmark-root"></div></body></html>'
    )

    global.window = dom.window as any
    global.document = dom.window.document
    global.HTMLElement = dom.window.HTMLElement
    global.Text = dom.window.Text
    global.Comment = dom.window.Comment
    global.DocumentFragment = dom.window.DocumentFragment
    global.Node = dom.window.Node
    global.performance = dom.window.performance
  }
}

export function getBenchmarkContainer(): HTMLElement {
  let container = document.getElementById('benchmark-root')
  if (!container) {
    // Create container if it doesn't exist
    container = document.createElement('div')
    container.id = 'benchmark-root'
    document.body.appendChild(container)
  }
  container.innerHTML = '' // Clear previous content
  return container
}

// Standard benchmark data (aligned with js-framework-benchmark)
export function generateData(count: number = 1000) {
  const adjectives = [
    'pretty',
    'large',
    'big',
    'small',
    'tall',
    'short',
    'long',
    'handsome',
    'plain',
    'quaint',
    'clean',
    'elegant',
    'easy',
    'angry',
    'crazy',
    'helpful',
    'mushy',
    'odd',
    'unsightly',
    'adorable',
    'important',
    'inexpensive',
    'cheap',
    'expensive',
    'fancy',
  ]
  const colours = [
    'red',
    'yellow',
    'blue',
    'green',
    'pink',
    'brown',
    'purple',
    'brown',
    'white',
    'black',
    'orange',
  ]
  const nouns = [
    'table',
    'chair',
    'house',
    'bbq',
    'desk',
    'car',
    'pony',
    'cookie',
    'sandwich',
    'burger',
    'pizza',
    'mouse',
    'keyboard',
  ]

  const data = []
  for (let i = 0; i < count; i++) {
    data.push({
      id: i + 1,
      label: `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${colours[Math.floor(Math.random() * colours.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`,
    })
  }
  return data
}
