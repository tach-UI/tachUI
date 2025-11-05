import { createSignal } from '../src/reactive'
import { createComponent } from '../src/runtime/component'
import { h, renderComponent, resetRendererMetrics, getRendererMetrics, type RendererMetricsSnapshot } from '../src/runtime/renderer'
import { generateData } from './data'

type RowData = { id: number; label: string }

type BrowserBenchmarkResult = {
  name: string
  duration: number
  memory: number | null
  operationsPerSecond: number
  timestamp: string
}

type RendererMetricsSummary = {
  iterations: number
  totals: RendererMetricsSnapshot
  average: RendererMetricsSnapshot
  max: RendererMetricsSnapshot
  samples: RendererMetricsSnapshot[]
}

const METRIC_KEYS: Array<keyof RendererMetricsSnapshot> = [
  'created',
  'adopted',
  'removed',
  'inserted',
  'moved',
  'cacheHits',
  'cacheMisses',
  'attributeWrites',
  'attributeRemovals',
  'textUpdates',
  'modifierApplications',
]

function cloneMetrics(snapshot: RendererMetricsSnapshot): RendererMetricsSnapshot {
  const clone: RendererMetricsSnapshot = {} as RendererMetricsSnapshot
  METRIC_KEYS.forEach(key => {
    clone[key] = snapshot[key]
  })
  return clone
}

function createEmptyMetrics(): RendererMetricsSnapshot {
  const metrics: RendererMetricsSnapshot = {} as RendererMetricsSnapshot
  METRIC_KEYS.forEach(key => {
    metrics[key] = 0
  })
  return metrics
}

function accumulateMetrics(target: RendererMetricsSnapshot, source: RendererMetricsSnapshot) {
  METRIC_KEYS.forEach(key => {
    target[key] += source[key]
  })
}

function updateMaxMetrics(target: RendererMetricsSnapshot, source: RendererMetricsSnapshot) {
  METRIC_KEYS.forEach(key => {
    target[key] = Math.max(target[key], source[key])
  })
}

function computeAverageMetrics(totals: RendererMetricsSnapshot, iterations: number): RendererMetricsSnapshot {
  const average: RendererMetricsSnapshot = {} as RendererMetricsSnapshot
  METRIC_KEYS.forEach(key => {
    average[key] = iterations === 0 ? 0 : totals[key] / iterations
  })
  return average
}

class RendererMetricsCollector {
  private summaries = new Map<string, RendererMetricsSummary>()

  addSnapshot(name: string, snapshot: RendererMetricsSnapshot) {
    const summary = this.summaries.get(name)
    if (!summary) {
      this.summaries.set(name, {
        iterations: 1,
        totals: cloneMetrics(snapshot),
        average: cloneMetrics(snapshot),
        max: cloneMetrics(snapshot),
        samples: [cloneMetrics(snapshot)],
      })
      return
    }
    summary.iterations += 1
    accumulateMetrics(summary.totals, snapshot)
    updateMaxMetrics(summary.max, snapshot)
    summary.samples.push(cloneMetrics(snapshot))
    summary.average = computeAverageMetrics(summary.totals, summary.iterations)
  }

  reset() {
    this.summaries.clear()
  }

  toJSON(): Record<string, RendererMetricsSummary> {
    const output: Record<string, RendererMetricsSummary> = {}
    this.summaries.forEach((summary, name) => {
      output[name] = {
        iterations: summary.iterations,
        totals: cloneMetrics(summary.totals),
        average: cloneMetrics(summary.average),
        max: cloneMetrics(summary.max),
        samples: summary.samples.map(cloneMetrics),
      }
    })
    return output
  }
}

interface TableOptions {
  getData: () => RowData[]
  getSelectedId?: () => number | null
  onSelect?: (id: number) => void
}

function createRowNode(item: RowData, selectedId: number | null, onSelect?: (id: number) => void) {
  const isSelected = item.id === selectedId
  const rowProps: Record<string, unknown> = {
    className: isSelected ? 'selected' : '',
    'data-id': item.id,
    key: item.id,
  }
  if (onSelect) {
    rowProps.onClick = () => onSelect(item.id)
  }
  return h(
    'tr',
    rowProps,
    h('td', { className: 'col-md-1' }, item.id.toString()),
    h('td', { className: 'col-md-4' }, h('a', null, item.label)),
    h(
      'td',
      { className: 'col-md-1' },
      h(
        'button',
        {
          className: 'btn btn-sm btn-danger',
          type: 'button',
        },
        'x'
      )
    ),
    h('td', { className: 'col-md-6' })
  )
}

function createTableComponent(options: TableOptions) {
  return createComponent(() => {
    const data = options.getData()
    const selectedId = options.getSelectedId ? options.getSelectedId() : null
    const rows = data.map(item => createRowNode(item, selectedId, options.onSelect))
    return h(
      'table',
      { className: 'table table-hover table-striped test-data', key: 'table-root' },
      h('tbody', { key: 'table-body' }, ...rows)
    )
  })
}

type RendererMetricsMap = Record<string, RendererMetricsSummary>

declare global {
  interface Window {
    benchmarkRunner?: BrowserBenchmarkRunner
    gc?: () => void
  }
}

class BrowserBenchmarkRunner {
  private results: BrowserBenchmarkResult[] = []
  private metricsCollector = new RendererMetricsCollector()
  private isRunning = false

  private baselineRows: RowData[] = []
  private alternateLabels: string[] = []
  private originalLabels: string[] = []
  private currentRows: RowData[] = []
  private useAlternateLabels = true

  private readonly rows: () => RowData[]
  private readonly setRows: (rows: RowData[]) => void
  private readonly getSelectedId: () => number | null
  private readonly setSelectedId: (id: number | null) => void
  private readonly disposeTable: () => void

  private readonly statusDiv: HTMLElement
  private readonly resultsDiv: HTMLElement
  private readonly outputDiv: HTMLElement

  constructor() {
    this.statusDiv = document.getElementById('status') as HTMLElement
    this.resultsDiv = document.getElementById('results') as HTMLElement
    this.outputDiv = document.getElementById('benchmark-output') as HTMLElement

    ;[this.rows, this.setRows] = createSignal<RowData[]>([])
    ;[this.getSelectedId, this.setSelectedId] = createSignal<number | null>(null)

    const TableComponent = createTableComponent({
      getData: () => this.rows(),
      getSelectedId: () => this.getSelectedId(),
      onSelect: id => this.setSelectedId(id),
    })

    const root = document.getElementById('tachui-root')
    if (!root) {
      throw new Error('Missing #tachui-root container')
    }
    const tableInstance = TableComponent({})
    this.disposeTable = renderComponent(tableInstance, root)

    this.setupEventListeners()
    window.benchmarkRunner = this
  }

  destroy() {
    this.disposeTable()
    window.benchmarkRunner = undefined
  }

  private setupEventListeners() {
    document.getElementById('create-rows')?.addEventListener('click', () => {
      void this.createRowsBenchmark()
    })
    document.getElementById('replace-rows')?.addEventListener('click', () => {
      void this.replaceAllRowsBenchmark()
    })
    document.getElementById('update-rows')?.addEventListener('click', () => {
      void this.updateEveryTenthRowBenchmark()
    })
    document.getElementById('select-row')?.addEventListener('click', () => {
      void this.selectRowBenchmark()
    })
    document.getElementById('swap-rows')?.addEventListener('click', () => {
      void this.swapRowsBenchmark()
    })
    document.getElementById('remove-rows')?.addEventListener('click', () => {
      void this.removeRowsBenchmark()
    })
    document.getElementById('clear-rows')?.addEventListener('click', () => {
      void this.clearRowsBenchmark()
    })
    document.getElementById('run-all')?.addEventListener('click', () => {
      void this.runAllBenchmarks()
    })
    document.getElementById('run-component-test')?.addEventListener('click', () => {
      void this.componentCreationBenchmark()
    })
  }

  clearResults() {
    this.results = []
    this.metricsCollector.reset()
    this.resultsDiv.style.display = 'none'
    this.outputDiv.innerHTML = ''
    this.setRows([])
    this.currentRows = []
    this.setSelectedId(null)
  }

  getResults(): BrowserBenchmarkResult[] {
    return this.results
  }

  getLatestResult(): BrowserBenchmarkResult | undefined {
    return this.results[this.results.length - 1]
  }

  getRendererMetrics(): RendererMetricsMap {
    return this.metricsCollector.toJSON()
  }

  private async measurePerformance(
    name: string,
    operation: () => Promise<void> | void
  ): Promise<BrowserBenchmarkResult | null> {
    if (this.isRunning) {
      return null
    }

    this.setStatus(`Running: ${name}...`, 'info')
    this.isRunning = true

    try {
      this.runGcIfAvailable()
      resetRendererMetrics()

      const startTime = performance.now()
      await operation()
      await Promise.resolve()
      await new Promise(requestAnimationFrame)
      const endTime = performance.now()

      const duration = endTime - startTime
      const memory = this.readHeapSize()
      const operationsPerSecond = duration > 0 ? Math.round((1000 / duration) * 100) : 0

      const metricsSnapshot = getRendererMetrics()
      this.metricsCollector.addSnapshot(name, metricsSnapshot)

      const result: BrowserBenchmarkResult = {
        name,
        duration: Math.round(duration * 100) / 100,
        memory,
        operationsPerSecond,
        timestamp: new Date().toISOString(),
      }

      this.results.push(result)
      this.updateResults()
      this.setStatus(`✅ ${name}: ${result.duration}ms`, 'success')
      return result
    } catch (error: unknown) {
      this.setStatus(`❌ ${name} failed: ${(error as Error).message}`, 'error')
      throw error
    } finally {
      this.isRunning = false
    }
  }

  private setStatus(message: string, type: 'success' | 'error' | 'info') {
    this.statusDiv.innerHTML = `<div class="status ${type}">${message}</div>`
  }

  private updateResults() {
    if (this.results.length === 0) {
      return
    }

    this.resultsDiv.style.display = 'block'
    const latest = this.getLatestResult()
    const rows = this.results
      .map(
        result => `
        <tr>
          <td>${result.name}</td>
          <td>${result.duration}</td>
          <td>${result.memory ?? 'n/a'}</td>
          <td>${result.operationsPerSecond}</td>
        </tr>`
      )
      .join('')

    this.outputDiv.innerHTML = `
      <h4>Latest Result: ${latest?.name}</h4>
      <p><strong>Duration:</strong> ${latest?.duration ?? 'n/a'}ms</p>
      <p><strong>Memory:</strong> ${latest?.memory ?? 'n/a'}MB</p>
      <p><strong>Ops/sec:</strong> ${latest?.operationsPerSecond ?? 'n/a'}</p>
      
      <h4>All Results (${this.results.length} tests)</h4>
      <table style="width: 100%; font-size: 12px;">
        <thead>
          <tr>
            <th>Test</th>
            <th>Duration (ms)</th>
            <th>Memory (MB)</th>
            <th>Ops/sec</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `
  }

  private readHeapSize(): number | null {
    const perf = (performance as any).memory
    if (perf && typeof perf.usedJSHeapSize === 'number') {
      return Math.round((perf.usedJSHeapSize / 1024 / 1024) * 100) / 100
    }
    return null
  }

  private runGcIfAvailable() {
    try {
      if (typeof window.gc === 'function') {
        window.gc()
      }
    } catch {
      // Ignore
    }
    try {
      if (typeof globalThis.gc === 'function') {
        ;(globalThis as any).gc()
      }
    } catch {
      // Ignore
    }
  }

  private ensureBaselineData() {
    if (this.baselineRows.length === 0) {
      this.baselineRows = generateData(1000)
      this.originalLabels = this.baselineRows.map(row => row.label)
      this.alternateLabels = generateData(1000).map(row => row.label)
    }
  }

  private applyRows(rows: RowData[]) {
    this.currentRows = rows
    this.setRows([...this.currentRows])
  }

  private mutateRows(mutator: (rows: RowData[]) => void) {
    mutator(this.currentRows)
    this.setRows([...this.currentRows])
  }

  private async createRowsBenchmark() {
    await this.measurePerformance('Create 1,000 rows', async () => {
      this.ensureBaselineData()
      this.applyRows(this.baselineRows.map(row => ({ ...row })))
      this.useAlternateLabels = true
    })
  }

  private async replaceAllRowsBenchmark() {
    await this.measurePerformance('Replace all 1,000 rows', async () => {
      this.ensureBaselineData()
      if (this.currentRows.length === 0) {
        this.applyRows(this.baselineRows.map(row => ({ ...row })))
      }
      const labels = this.useAlternateLabels ? this.alternateLabels : this.originalLabels
      this.mutateRows(rows => {
        rows.forEach((row, index) => {
          row.label = labels[index] ?? row.label
        })
      })
      this.useAlternateLabels = !this.useAlternateLabels
    })
  }

  private async updateEveryTenthRowBenchmark() {
    await this.measurePerformance('Partial update (every 10th row)', async () => {
      this.ensureBaselineData()
      if (this.currentRows.length === 0) {
        this.applyRows(this.baselineRows.map(row => ({ ...row })))
      }
      this.mutateRows(rows => {
        rows.forEach((row, index) => {
          if (index % 10 === 0) {
            row.label = `${row.label} !!!`
          }
        })
      })
    })
  }

  private async selectRowBenchmark() {
    await this.measurePerformance('Select row', async () => {
      this.ensureBaselineData()
      if (this.currentRows.length === 0) {
        this.applyRows(this.baselineRows.map(row => ({ ...row })))
      }
      const middleIndex = Math.floor(this.currentRows.length / 2)
      const targetId = this.currentRows[middleIndex]?.id ?? null
      this.setSelectedId(targetId)
    })
  }

  private async swapRowsBenchmark() {
    await this.measurePerformance('Swap rows', async () => {
      this.ensureBaselineData()
      if (this.currentRows.length === 0) {
        this.applyRows(this.baselineRows.map(row => ({ ...row })))
      }
      this.mutateRows(rows => {
        if (rows.length >= 2) {
          const secondIndex = 1
          const penultimateIndex = rows.length - 2
          const temp = rows[secondIndex]
          rows[secondIndex] = rows[penultimateIndex]
          rows[penultimateIndex] = temp
        }
      })
    })
  }

  private async removeRowsBenchmark() {
    await this.measurePerformance('Remove rows', async () => {
      this.ensureBaselineData()
      if (this.currentRows.length === 0) {
        this.applyRows(this.baselineRows.map(row => ({ ...row })))
      }
      this.currentRows = this.currentRows.filter((_, index) => index % 10 !== 0)
      this.setRows([...this.currentRows])
    })
  }

  private async clearRowsBenchmark() {
    await this.measurePerformance('Clear rows', async () => {
      this.currentRows = []
      this.setRows([])
      this.setSelectedId(null)
    })
  }

  private async componentCreationBenchmark() {
    await this.measurePerformance('Component creation (1,000 components)', async () => {
      const SimpleComponent = createComponent<{ text: string }>((props) =>
        h('div', null, props.text)
      )
      for (let i = 0; i < 1000; i++) {
        SimpleComponent({ text: `Component ${i}` })
      }
    })
  }

  async runAllBenchmarks() {
    if (this.isRunning) {
      return
    }
    this.metricsCollector.reset()
    this.results = []
    this.resultsDiv.style.display = 'none'
    this.outputDiv.innerHTML = ''

    await this.createRowsBenchmark()
    await new Promise(resolve => setTimeout(resolve, 50))
    await this.replaceAllRowsBenchmark()
    await new Promise(resolve => setTimeout(resolve, 50))
    await this.updateEveryTenthRowBenchmark()
    await new Promise(resolve => setTimeout(resolve, 50))
    await this.selectRowBenchmark()
    await new Promise(resolve => setTimeout(resolve, 50))
    await this.swapRowsBenchmark()
    await new Promise(resolve => setTimeout(resolve, 50))
    await this.removeRowsBenchmark()
    await new Promise(resolve => setTimeout(resolve, 50))
    await this.clearRowsBenchmark()
    await new Promise(resolve => setTimeout(resolve, 50))
    await this.componentCreationBenchmark()

    this.setStatus(`✅ All benchmarks completed! ${this.results.length} tests run.`, 'success')
  }

  async runAll() {
    await this.runAllBenchmarks()
    return this.results
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new BrowserBenchmarkRunner()
})
