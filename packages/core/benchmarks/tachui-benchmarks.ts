/**
 * TachUI Framework Benchmarks
 *
 * Parity-aligned harness matching js-framework-benchmark operations.
 */

import {
  ComponentManager,
  createComponent,
  createSignal,
  createSignalListControls,
  h,
  renderComponent,
} from '../src'
import type { DOMNode } from '../src/runtime/types'
import type { SignalListControls } from '../src/reactive'
import {
  getRendererMetrics,
  resetRendererMetrics,
  type RendererMetricsSnapshot,
} from '../src/runtime/renderer'
import {
  type BenchmarkConfig,
  type BenchmarkResult,
  type RendererMetricsSummary,
  BenchmarkRunner,
  generateData,
  getBenchmarkContainer,
  getBenchmarkPhase,
  setupMockDOM,
} from './setup'

// Setup DOM for Node-based runs
setupMockDOM()

const iterations = getNumericEnv('TACHUI_BENCH_ITERATIONS', 12)
const warmupRuns = getNumericEnv('TACHUI_BENCH_WARMUPS', 2)

const config: BenchmarkConfig = {
  iterations,
  warmupRuns,
  measureMemory: true,
  framework: 'TachUI',
}

const runner = new BenchmarkRunner(config)
const METRIC_KEYS = [
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
] as const

type MetricKey = (typeof METRIC_KEYS)[number]

const rendererMetricsByBenchmark = new Map<string, RendererMetricsSummary>()

function cloneMetrics(snapshot: RendererMetricsSnapshot): RendererMetricsSnapshot {
  const clone = {} as RendererMetricsSnapshot
  METRIC_KEYS.forEach(key => {
    clone[key] = snapshot[key]
  })
  return clone
}

function accumulateMetrics(target: RendererMetricsSnapshot, source: RendererMetricsSnapshot): void {
  METRIC_KEYS.forEach(key => {
    target[key] += source[key]
  })
}

function updateMaxMetrics(target: RendererMetricsSnapshot, source: RendererMetricsSnapshot): void {
  METRIC_KEYS.forEach(key => {
    target[key] = Math.max(target[key], source[key])
  })
}

function computeAverageMetrics(
  totals: RendererMetricsSnapshot,
  iterations: number
): RendererMetricsSnapshot {
  const average = {} as RendererMetricsSnapshot
  METRIC_KEYS.forEach(key => {
    average[key] = iterations === 0 ? 0 : totals[key] / iterations
  })
  return average
}

function recordRendererMetrics(benchmarkName: string, snapshot: RendererMetricsSnapshot): void {
  const summary = rendererMetricsByBenchmark.get(benchmarkName)
  if (!summary) {
    rendererMetricsByBenchmark.set(benchmarkName, {
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

function cloneSummary(summary: RendererMetricsSummary): RendererMetricsSummary {
  return {
    iterations: summary.iterations,
    totals: cloneMetrics(summary.totals),
    average: cloneMetrics(summary.average),
    max: cloneMetrics(summary.max),
    samples: summary.samples.map(cloneMetrics),
  }
}

const LOG_METRICS: MetricKey[] = [
  'created',
  'adopted',
  'moved',
  'removed',
  'attributeWrites',
  'attributeRemovals',
  'textUpdates',
]

function formatMetricSummary(summary: RendererMetricsSummary, key: MetricKey): string {
  const average = summary.average[key]
  const max = summary.max[key]
  const total = summary.totals[key]
  const avgDisplay = Number.isInteger(average) ? average.toString() : average.toFixed(1)
  return `${key}=avg:${avgDisplay},max:${Math.round(max)},total:${Math.round(total)}`
}

type RowData = { id: number; label: string }

interface TableOptions {
  getData: () => RowData[]
  getSelectedId?: () => number | null
  onSelect?: (id: number) => void
}

type RowListControls = SignalListControls<RowData, number>

interface SignalListTableOptions {
  list: RowListControls
  getSelectedId?: () => number | null
  onSelect?: (id: number) => void
}

function cloneRows(rows: RowData[]): RowData[] {
  return rows.map(row => ({ ...row }))
}

function getNumericEnv(name: string, fallback: number): number {
  if (typeof process === 'undefined' || !process.env) {
    return fallback
  }
  const raw = process.env[name]
  if (raw == null || raw === '') {
    return fallback
  }
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    console.warn(
      `[tachUI benchmarks] Ignoring invalid ${name} value "${raw}", using fallback ${fallback}`
    )
    return fallback
  }
  return parsed
}

function createRowNode(
  item: RowData,
  selectedId: number | null,
  onSelect?: (id: number) => void
): DOMNode {
  const className = item.id === selectedId ? 'selected' : ''
  const rowProps: Record<string, unknown> = {
    className,
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

function createSectionedTableComponent(options: TableOptions & { groupSize: number }) {
  return createComponent(() => {
    const data = options.getData()
    const selectedId = options.getSelectedId ? options.getSelectedId() : null

    const bodies: DOMNode[] = []
    for (let index = 0; index < data.length; index += options.groupSize) {
      const sectionRows = data
        .slice(index, index + options.groupSize)
        .map(item => createRowNode(item, selectedId, options.onSelect))
      bodies.push(h('tbody', { key: `section-${index / options.groupSize}` }, ...sectionRows))
    }

    return h(
      'table',
      { className: 'table table-hover table-striped test-data', key: 'table-root' },
      ...bodies
    )
  })
}

function createUnkeyedListComponent(options: {
  getData: () => RowData[]
  getSelectedId?: () => number | null
  onSelect?: (id: number) => void
}) {
  return createComponent(() => {
    const data = options.getData()
    const selectedId = options.getSelectedId ? options.getSelectedId() : null

    const items = data.map(item => {
      const isSelected = selectedId === item.id
      const props: Record<string, unknown> = {
        className: isSelected ? 'selected list-item' : 'list-item',
        'data-id': item.id,
      }
      if (options.onSelect) {
        props.onClick = () => options.onSelect!(item.id)
      }
      return h('li', props, `${item.id}: ${item.label}`)
    })

    return h('ul', { className: 'test-data-list' }, ...items)
  })
}

function createReactiveRowNode(
  id: number,
  getRowData: () => RowData,
  getSelectedId?: () => number | null,
  onSelect?: (id: number) => void
): DOMNode {
  const rowProps: Record<string, unknown> = {
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
    h('td', { className: 'col-md-4' }, h('a', null, () => getRowData().label)),
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

function createSignalListTableComponent(options: SignalListTableOptions) {
  const rowCache = new Map<number, DOMNode>()
  return createComponent(() => {
    const rowIds = options.list.ids()
    const rows = rowIds.map(id => {
      let cached = rowCache.get(id)
      if (!cached) {
        const getRowData = options.list.get(id)
        cached = createReactiveRowNode(id, getRowData, options.getSelectedId, options.onSelect)
        rowCache.set(id, cached)
      }
      return cached
    })

    const idSet = new Set(rowIds)
    rowCache.forEach((_node, id) => {
      if (!idSet.has(id)) {
        rowCache.delete(id)
      }
    })

    return h(
      'table',
      { className: 'table table-hover table-striped test-data', key: 'table-root' },
      h('tbody', { key: 'table-body' }, ...rows)
    )
  })
}

function setupSignalListTable(
  container: Element,
  options: {
    initialRows?: RowData[]
    getSelectedId?: () => number | null
    onSelect?: (id: number) => void
  } = {}
) {
  const initialRows = options.initialRows ? cloneRows(options.initialRows) : []
  const list = createSignalListControls<RowData, number>(initialRows, row => row.id)
  const TableComponent = createSignalListTableComponent({
    list,
    getSelectedId: options.getSelectedId,
    onSelect: options.onSelect,
  })

  const tableInstance = TableComponent({})
  const dispose = renderComponent(tableInstance, container)
  return { list, dispose }
}

async function runWithRendererMetrics<T>(
  benchmarkName: string,
  execute: () => Promise<T> | T
): Promise<T> {
  const shouldRecordMetrics = getBenchmarkPhase() === 'measurement'
  resetRendererMetrics()
  const result = await execute()
  const snapshot = getRendererMetrics()
  if (shouldRecordMetrics) {
    recordRendererMetrics(benchmarkName, snapshot)
  }
  if (typeof globalThis !== 'undefined' && typeof (globalThis as any).gc === 'function') {
    ;(globalThis as any).gc()
  }
  return result
}

async function benchmarkCreate1000Rows(benchmarkName: string) {
  const container = getBenchmarkContainer()
  const { list, dispose } = setupSignalListTable(container)

  await runWithRendererMetrics(benchmarkName, async () => {
    list.set(cloneRows(generateData(1000)))
    await Promise.resolve()
  })

  dispose()
}

async function benchmarkReplaceAll1000Rows(benchmarkName: string) {
  const baselineRows = generateData(1000)
  const alternateLabels = generateData(1000).map(row => row.label)
  const originalLabels = baselineRows.map(row => row.label)
  const container = getBenchmarkContainer()

  const { list, dispose } = setupSignalListTable(container, {
    initialRows: baselineRows,
  })
  await Promise.resolve()

  let useAlternateLabels = true

  await runWithRendererMetrics(benchmarkName, async () => {
    const labels = useAlternateLabels ? alternateLabels : originalLabels
    baselineRows.forEach((row, index) => {
      list.update(row.id, {
        id: row.id,
        label: labels[index] ?? row.label,
      })
    })
    useAlternateLabels = !useAlternateLabels
    await Promise.resolve()
  })

  dispose()
}

async function benchmarkPartialUpdate(benchmarkName: string) {
  const initialRows = generateData(1000)
  const container = getBenchmarkContainer()
  const { list, dispose } = setupSignalListTable(container, {
    initialRows,
  })
  await Promise.resolve()

  let toggle = true

  await runWithRendererMetrics(benchmarkName, async () => {
    const currentRows = list.getAll()
    currentRows.forEach((row, index) => {
      if (index % 10 === 0) {
        const suffix = toggle ? ' !!!' : ''
        const base = row.label.replace(/ !!!$/, '')
        list.update(row.id, {
          id: row.id,
          label: `${base}${suffix}`,
        })
      }
    })
    toggle = !toggle
    await Promise.resolve()
  })

  dispose()
}

async function benchmarkSelectRow(benchmarkName: string) {
  const data = generateData(1000)
  const [selectedId, setSelectedId] = createSignal<number | null>(null)
  const container = getBenchmarkContainer()

  const { list, dispose } = setupSignalListTable(container, {
    initialRows: data,
    getSelectedId: () => selectedId(),
    onSelect: setSelectedId,
  })
  await Promise.resolve()

  await runWithRendererMetrics(benchmarkName, async () => {
    setSelectedId(500)
    await Promise.resolve()
  })

  list.clear()
  dispose()
}

async function benchmarkSwapRows(benchmarkName: string) {
  const initialRows = generateData(1000)
  const container = getBenchmarkContainer()
  const { list, dispose } = setupSignalListTable(container, {
    initialRows,
  })
  await Promise.resolve()

  await runWithRendererMetrics(benchmarkName, async () => {
    const ids = list.ids()
    if (ids.length < 2) return
    const nextIds = [...ids]
    const secondIndex = 1
    const penultimateIndex = nextIds.length - 2
    ;[nextIds[secondIndex], nextIds[penultimateIndex]] = [
      nextIds[penultimateIndex],
      nextIds[secondIndex],
    ]
    list.reorder(nextIds)
    await Promise.resolve()
  })

  dispose()
}

async function benchmarkRemoveRows(benchmarkName: string) {
  const initialRows = generateData(1000)
  const container = getBenchmarkContainer()
  const { list, dispose } = setupSignalListTable(container, {
    initialRows,
  })
  await Promise.resolve()

  await runWithRendererMetrics(benchmarkName, async () => {
    const ids = list.ids()
    if (ids.length === 0) return
    const toRemove = ids.filter((_, index) => index % 10 === 0)
    toRemove.forEach(id => list.remove(id))
    await Promise.resolve()
  })

  dispose()
}

async function benchmarkClearRows(benchmarkName: string) {
  const initialRows = generateData(1000)
  const container = getBenchmarkContainer()
  const { list, dispose } = setupSignalListTable(container, {
    initialRows,
  })
  await Promise.resolve()

  await runWithRendererMetrics(benchmarkName, async () => {
    list.clear()
    await Promise.resolve()
  })

  dispose()
}

async function benchmarkSectionedTableCreate(benchmarkName: string) {
  await runWithRendererMetrics(benchmarkName, async () => {
    const data = generateData(1000)
    const container = getBenchmarkContainer()

    const TableComponent = createSectionedTableComponent({
      getData: () => data,
      groupSize: 200,
    })

    const tableInstance = TableComponent({})
    const dispose = renderComponent(tableInstance, container)
    await Promise.resolve()
    dispose()
  })
}

async function benchmarkUnkeyedListPartialUpdate(benchmarkName: string) {
  const [data, setData] = createSignal(generateData(1000))
  const container = getBenchmarkContainer()

  const ListComponent = createUnkeyedListComponent({
    getData: () => data(),
  })

  const listInstance = ListComponent({})
  const dispose = renderComponent(listInstance, container)
  await Promise.resolve()

  await runWithRendererMetrics(benchmarkName, async () => {
    const updatedData = data().map((item, index) => {
      if (index % 10 === 0) {
        return {
          ...item,
          label: `${item.label} !!!`,
        }
      }
      return item
    })

    setData(updatedData)
    await Promise.resolve()
  })

  dispose()
}

async function benchmarkComponentCreation(benchmarkName: string) {
  await runWithRendererMetrics(benchmarkName, async () => {
    const SimpleComponent = createComponent<{ text: string }>((props) => {
      return h('div', null, props.text)
    })

    for (let i = 0; i < 1000; i++) {
      SimpleComponent({ text: `Component ${i}` })
    }
  })
}

async function benchmarkReactiveUpdates(benchmarkName: string) {
  await runWithRendererMetrics(benchmarkName, async () => {
    const signals = []

    for (let i = 0; i < 100; i++) {
      const [signal, setSignal] = createSignal(i)
      signals.push({ signal, setSignal })
    }

    for (let update = 0; update < 10; update++) {
      signals.forEach(({ setSignal }, index) => {
        setSignal(index + update * 100)
      })
    }
  })
}

async function runBenchmark(
  name: string,
  type: BenchmarkResult['type'],
  benchmark: (benchmarkName: string) => Promise<void>
): Promise<BenchmarkResult> {
  const result = await runner.run(name, type, () => benchmark(name))
  result.metadata = {
    ...result.metadata,
    benchmark: name,
  }
  const metrics = rendererMetricsByBenchmark.get(name)
  if (metrics) {
    result.rendererMetrics = cloneSummary(metrics)
  }
  return result
}

/**
 * Run all benchmarks
 */
export async function runTachUIBenchmarks() {
  console.log('🏃‍♂️ Running TachUI Performance Benchmarks...\n')
  console.log(`Iterations per benchmark: ${iterations} (override via TACHUI_BENCH_ITERATIONS)`)
  console.log(`Warmup runs: ${warmupRuns} (override via TACHUI_BENCH_WARMUPS)`)

  rendererMetricsByBenchmark.clear()

  const results: BenchmarkResult[] = []

  results.push(await runBenchmark('Create 1,000 rows', 'create', benchmarkCreate1000Rows))
  results.push(await runBenchmark('Replace all 1,000 rows', 'update', benchmarkReplaceAll1000Rows))
  results.push(
    await runBenchmark('Partial update (every 10th row)', 'update', benchmarkPartialUpdate)
  )
  results.push(await runBenchmark('Select row', 'select', benchmarkSelectRow))
  results.push(await runBenchmark('Swap rows', 'swap', benchmarkSwapRows))
  results.push(await runBenchmark('Remove rows', 'remove', benchmarkRemoveRows))
  results.push(await runBenchmark('Clear rows', 'clear', benchmarkClearRows))
  results.push(
    await runBenchmark(
      'Create 1,000 rows (sectioned table)',
      'create',
      benchmarkSectionedTableCreate
    )
  )
  results.push(
    await runBenchmark('Unkeyed list partial update', 'update', benchmarkUnkeyedListPartialUpdate)
  )
  results.push(
    await runBenchmark('Component creation (1,000 components)', 'create', benchmarkComponentCreation)
  )
  results.push(
    await runBenchmark(
      'Reactive updates (100 signals × 10 updates)',
      'update',
      benchmarkReactiveUpdates
    )
  )

  ComponentManager.getInstance().cleanup()

  if (rendererMetricsByBenchmark.size > 0) {
    console.log('\nRenderer operation metrics (averages across measured iterations):')
    rendererMetricsByBenchmark.forEach((summary, name) => {
      const formattedMetrics = LOG_METRICS.map(key => formatMetricSummary(summary, key)).join(', ')
      console.log(`  ${name}: iterations=${summary.iterations} | ${formattedMetrics}`)
    })
    console.log('')
  }

  return {
    results,
    report: runner.generateReport(),
  }
}

// Export individual benchmarks for testing
export {
  benchmarkCreate1000Rows,
  benchmarkReplaceAll1000Rows,
  benchmarkPartialUpdate,
  benchmarkSelectRow,
  benchmarkSwapRows,
  benchmarkRemoveRows,
  benchmarkClearRows,
  benchmarkSectionedTableCreate,
  benchmarkUnkeyedListPartialUpdate,
  benchmarkComponentCreation,
  benchmarkReactiveUpdates,
}
