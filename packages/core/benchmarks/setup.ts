import { createRequire } from 'node:module'

import { ComponentManager } from '../src/runtime/component'
import type { RendererMetricsSnapshot } from '../src/runtime/renderer'

import { generateData } from './data'

export interface BenchmarkResult {
  name: string
  framework: string
  duration: number
  memory?: number
  operationsPerSecond?: number
  type: 'create' | 'update' | 'select' | 'swap' | 'remove' | 'clear'
  metadata?: Record<string, unknown>
  rendererMetrics?: RendererMetricsSummary
}

export interface BenchmarkConfig {
  iterations: number
  warmupRuns: number
  measureMemory: boolean
  framework: string
}

export type BenchmarkPhase = 'warmup' | 'measurement'

let currentPhase: BenchmarkPhase = 'measurement'

export function setBenchmarkPhase(phase: BenchmarkPhase) {
  currentPhase = phase
}

export function getBenchmarkPhase(): BenchmarkPhase {
  return currentPhase
}

export class BenchmarkRunner {
  private results: BenchmarkResult[] = []

  constructor(private readonly config: BenchmarkConfig) {}

  async run(
    name: string,
    type: BenchmarkResult['type'],
    benchmark: () => Promise<void> | void
  ): Promise<BenchmarkResult> {
    const manager = ComponentManager.getInstance()

    setBenchmarkPhase('warmup')
    for (let i = 0; i < this.config.warmupRuns; i++) {
      await benchmark()
      manager.cleanup()
      this.tryGc()
    }

    this.tryGc()
    setBenchmarkPhase('measurement')

    const iterations = Math.max(1, this.config.iterations)
    const startMemory = this.config.measureMemory ? this.getMemoryUsage() : undefined
    const start = performance.now()

    for (let i = 0; i < iterations; i++) {
      await benchmark()
      manager.cleanup()
      this.tryGc()
    }

    const end = performance.now()
    const endMemory = this.config.measureMemory ? this.getMemoryUsage() : undefined

    const duration = (end - start) / iterations
    const operationsPerSecond = duration > 0 ? 1000 / duration : undefined
    const memory =
      startMemory != null && endMemory != null ? (endMemory - startMemory) / iterations : undefined

    const result: BenchmarkResult = {
      name,
      framework: this.config.framework,
      duration,
      memory,
      operationsPerSecond,
      type,
    }

    this.results.push(result)
    return result
  }

  getResults(): BenchmarkResult[] {
    return this.results
  }

  clearResults() {
    this.results = []
  }

  generateReport(): string {
    const lines = ['TachUI Benchmark Results', '='.repeat(50)]
    const grouped = this.results.reduce<Record<string, BenchmarkResult[]>>((acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = []
      }
      acc[result.type].push(result)
      return acc
    }, {})

    Object.entries(grouped).forEach(([type, results]) => {
      lines.push(`\n${type.toUpperCase()} Operations:`)
      results.forEach(result => {
        lines.push(`  ${result.name}:`)
        lines.push(`    Duration: ${result.duration.toFixed(2)}ms`)
        lines.push(
          `    Ops/sec: ${result.operationsPerSecond != null ? result.operationsPerSecond.toFixed(0) : 'N/A'}`
        )
        if (result.memory != null) {
          lines.push(`    Memory: ${(result.memory / 1024 / 1024).toFixed(2)}MB`)
        }
      })
    })

    return lines.join('\n')
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

  private tryGc() {
    if (typeof (globalThis as any).gc === 'function') {
      try {
        ;(globalThis as any).gc()
      } catch (error) {
        console.warn('gc failed:', error)
      }
    }
  }
}

export interface RendererMetricsSummary {
  iterations: number
  totals: RendererMetricsSnapshot
  average: RendererMetricsSnapshot
  max: RendererMetricsSnapshot
  samples: RendererMetricsSnapshot[]
}

const nodeRequire = typeof createRequire === 'function' ? createRequire(import.meta.url) : null

export function setupMockDOM(): void {
  if (typeof window === 'undefined') {
    if (!nodeRequire) {
      throw new Error('Cannot create mock DOM without createRequire support')
    }
    const { JSDOM } = nodeRequire('jsdom')
    const dom = new JSDOM(
      '<!DOCTYPE html><html><body><div id="benchmark-root"></div></body></html>'
    )

    ;(globalThis as any).window = dom.window
    ;(globalThis as any).document = dom.window.document
    ;(globalThis as any).HTMLElement = dom.window.HTMLElement
    ;(globalThis as any).Element = dom.window.Element
    ;(globalThis as any).Text = dom.window.Text
    ;(globalThis as any).Comment = dom.window.Comment
    ;(globalThis as any).DocumentFragment = dom.window.DocumentFragment
    ;(globalThis as any).Node = dom.window.Node
    if (typeof globalThis.performance === 'undefined') {
      ;(globalThis as any).performance = dom.window.performance
    }
  }
}

export function getBenchmarkContainer(): HTMLElement {
  let container = document.getElementById('benchmark-root')
  if (!container) {
    container = document.createElement('div')
    container.id = 'benchmark-root'
    document.body.appendChild(container)
  }
  container.innerHTML = ''
  return container
}

export { generateData }
