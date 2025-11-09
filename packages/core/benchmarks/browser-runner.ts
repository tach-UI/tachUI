import { createSignal, createSignalList, type SignalListControls } from '../src/reactive'
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
  list: SignalListControls<RowData>
  getSelectedId?: () => number | null
  onSelect?: (id: number) => void
}

function createRowNode(
  id: number,  // Row ID (not reactive)
  getRowData: () => RowData,  // Signal getter for this specific row
  getSelectedId: (() => number | null) | null,
  onSelect?: (id: number) => void
) {
  const rowProps: Record<string, unknown> = {
    // Reactive className - updates when selectedId changes
    className: getSelectedId ? () => (id === getSelectedId() ? 'selected' : '') : '',
    'data-id': id,
    key: id,
  }
  if (onSelect) {
    rowProps.onClick = () => onSelect(id)
  }
  return h(
    'tr',
    rowProps,
    h('td', { className: 'col-md-1' }, id.toString()),
    h('td', { className: 'col-md-4' }, h('a', null, () => getRowData().label)),  // Reactive text - updates when label changes
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
  let renderCount = 0
  // Cache row nodes by ID to avoid recreating them on every render
  const rowNodeCache = new Map<number, ReturnType<typeof createRowNode>>()

  return createComponent(() => {
    renderCount++
    console.log(`[TableComponent] Render #${renderCount}`)
    const rowIds = options.list.ids()  // Only tracks array of IDs, not row data
    console.log(`[TableComponent] Row IDs length: ${rowIds.length}`)

    // Reuse cached row nodes - only create new ones for new IDs
    const rows = rowIds.map(id => {
      let rowNode = rowNodeCache.get(id)
      if (!rowNode) {
        const getRowData = options.list.get(id)
        rowNode = createRowNode(id, getRowData, options.getSelectedId || null, options.onSelect)
        rowNodeCache.set(id, rowNode)
      }
      return rowNode
    })

    // Clean up cache for removed IDs
    const currentIdSet = new Set(rowIds)
    for (const cachedId of rowNodeCache.keys()) {
      if (!currentIdSet.has(cachedId)) {
        rowNodeCache.delete(cachedId)
      }
    }

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
  private useAlternateLabels = true
  private rowsCreated = false

  // Fine-grained reactivity using framework's createSignalList
  private readonly rowList: SignalListControls<RowData>
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

    // Create signal list with fine-grained reactivity (framework feature!)
    const [, list] = createSignalList<RowData>([], item => item.id)
    this.rowList = list

    ;[this.getSelectedId, this.setSelectedId] = createSignal<number | null>(null)

    const TableComponent = createTableComponent({
      list: this.rowList,
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
    this.rowList.clear()
    this.setSelectedId(null)
    this.rowsCreated = false
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
    // Use framework's createSignalList.set() - handles everything!
    this.rowList.set(rows)
  }

  private mutateRows(rows: RowData[]) {
    // For data mutations: update individual row signals WITHOUT changing structure
    // This prevents component re-render while still triggering reactive updates
    rows.forEach(row => {
      this.rowList.update(row.id, row)
    })
  }

  private async createRowsBenchmark() {
    await this.measurePerformance('Create 1,000 rows', async () => {
      this.ensureBaselineData()
      this.applyRows(this.baselineRows.map(row => ({ ...row })))
      this.rowsCreated = true
      this.useAlternateLabels = true
    })
  }

  private async replaceAllRowsBenchmark() {
    // Ensure rows exist BEFORE measurement starts
    this.ensureBaselineData()
    // Check if we need to create rows without calling getAll()
    const needsSetup = this.baselineRows.length > 0 && !this.rowsCreated
    if (needsSetup) {
      this.applyRows(this.baselineRows.map(row => ({ ...row })))
      this.rowsCreated = true
      // Wait for initial render to complete
      await Promise.resolve()
      await new Promise(requestAnimationFrame)
    }

    await this.measurePerformance('Replace all 1,000 rows', async () => {
      const labels = this.useAlternateLabels ? this.alternateLabels : this.originalLabels
      // Use baselineRows to avoid tracking signals
      this.baselineRows.forEach((row, index) => {
        this.rowList.update(row.id, { id: row.id, label: labels[index] ?? row.label })
      })
      this.useAlternateLabels = !this.useAlternateLabels
    })
  }

  private async updateEveryTenthRowBenchmark() {
    // Ensure rows exist BEFORE measurement starts
    this.ensureBaselineData()
    // Check if we need to create rows without calling getAll()
    const needsSetup = this.baselineRows.length > 0 && !this.rowsCreated
    if (needsSetup) {
      this.applyRows(this.baselineRows.map(row => ({ ...row })))
      this.rowsCreated = true
      // Wait for initial render to complete
      await Promise.resolve()
      await new Promise(requestAnimationFrame)
    }

    await this.measurePerformance('Partial update (every 10th row)', async () => {
      // Mutate labels and trigger signal to fire reactive text effects
      // The reactive text nodes should update surgically without reconciliation
      // Use baselineRows to avoid tracking signals
      this.baselineRows.forEach((row, index) => {
        if (index % 10 === 0) {
          this.rowList.update(row.id, { id: row.id, label: `${row.label} !!!` })
        }
      })
    })
  }

  private async selectRowBenchmark() {
    // Ensure rows exist BEFORE measurement starts
    this.ensureBaselineData()
    // Check if we need to create rows without calling getAll()
    const needsSetup = this.baselineRows.length > 0 && !this.rowsCreated
    if (needsSetup) {
      this.applyRows(this.baselineRows.map(row => ({ ...row })))
      this.rowsCreated = true
      // Wait for initial render to complete
      await Promise.resolve()
      await new Promise(requestAnimationFrame)
    }

    await this.measurePerformance('Select row', async () => {
      // Use baselineRows to avoid tracking signals
      const middleIndex = Math.floor(this.baselineRows.length / 2)
      const targetId = this.baselineRows[middleIndex]?.id ?? null

      this.setSelectedId(targetId)
    })
  }

  private async swapRowsBenchmark() {
    // Ensure rows exist BEFORE measurement starts
    this.ensureBaselineData()
    // Check if we need to create rows without calling getAll()
    const needsSetup = this.baselineRows.length > 0 && !this.rowsCreated
    if (needsSetup) {
      this.applyRows(this.baselineRows.map(row => ({ ...row })))
      this.rowsCreated = true
      // Wait for initial render to complete
      await Promise.resolve()
      await new Promise(requestAnimationFrame)
    }

    await this.measurePerformance('Swap rows', async () => {
      const ids = this.rowList.ids()
      if (ids.length < 2) return
      const nextIds = [...ids]
      const secondIndex = 1
      const penultimateIndex = nextIds.length - 2
      ;[nextIds[secondIndex], nextIds[penultimateIndex]] = [
        nextIds[penultimateIndex],
        nextIds[secondIndex],
      ]
      this.rowList.reorder(nextIds)
    })
  }

  private async removeRowsBenchmark() {
    // Ensure rows exist BEFORE measurement starts
    this.ensureBaselineData()
    // Check if we need to create rows without calling getAll()
    const needsSetup = this.baselineRows.length > 0 && !this.rowsCreated
    if (needsSetup) {
      this.applyRows(this.baselineRows.map(row => ({ ...row })))
      this.rowsCreated = true
      // Wait for initial render to complete
      await Promise.resolve()
      await new Promise(requestAnimationFrame)
    }

    await this.measurePerformance('Remove rows', async () => {
      const ids = this.rowList.ids()
      if (ids.length === 0) return
      const toRemove = ids.filter((_, index) => index % 10 === 0)
      toRemove.forEach(id => this.rowList.remove(id))
    })
  }

  private async clearRowsBenchmark() {
    await this.measurePerformance('Clear rows', async () => {
      this.rowList.clear()
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

    console.log('[Benchmark] About to run Create rows')
    await this.createRowsBenchmark()
    console.log('[Benchmark] Create rows complete, waiting 50ms')
    await new Promise(resolve => setTimeout(resolve, 50))
    console.log('[Benchmark] About to run Replace all')
    await this.replaceAllRowsBenchmark()
    console.log('[Benchmark] Replace all complete, waiting 50ms')
    await new Promise(resolve => setTimeout(resolve, 50))
    console.log('[Benchmark] About to run Partial update')
    await this.updateEveryTenthRowBenchmark()
    console.log('[Benchmark] Partial update complete, waiting 50ms')
    await new Promise(resolve => setTimeout(resolve, 50))
    console.log('[Benchmark] About to run Select row')
    await this.selectRowBenchmark()
    await new Promise(resolve => setTimeout(resolve, 50))
    console.log('[Benchmark] About to run Swap rows')
    await this.swapRowsBenchmark()
    await new Promise(resolve => setTimeout(resolve, 50))
    console.log('[Benchmark] About to run Remove rows')
    await this.removeRowsBenchmark()
    await new Promise(resolve => setTimeout(resolve, 50))
    console.log('[Benchmark] About to run Clear rows')
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
