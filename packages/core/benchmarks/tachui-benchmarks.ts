/**
 * TachUI Framework Benchmarks
 *
 * Industry-aligned performance benchmarks covering the key operations
 * measured by js-framework-benchmark and similar tools.
 */

import {
  ComponentManager,
  createComponent,
  createSignal,
  h,
  renderComponent,
} from '../src'
import type { DOMNode } from '../src/runtime/types'
import {
  getRendererMetrics,
  resetRendererMetrics,
  type RendererMetricsSnapshot,
} from '../src/runtime/renderer'
import {
  type BenchmarkConfig,
  type BenchmarkResult,
  BenchmarkRunner,
  generateData,
  getBenchmarkContainer,
  setupMockDOM,
} from './setup'

// Setup DOM environment for benchmarks
setupMockDOM()

type CacheMode = 'baseline' | 'row-cache'

const cacheModeEnv =
  typeof process !== 'undefined' && process.env?.TACHUI_BENCH_CACHE_MODE
    ? process.env.TACHUI_BENCH_CACHE_MODE
    : ''

const cacheModes: CacheMode[] = resolveCacheModes(cacheModeEnv)
const hasMultipleModes = cacheModes.length > 1
const DEFAULT_ITERATIONS = hasMultipleModes ? 6 : 12
const DEFAULT_WARMUPS = hasMultipleModes ? 1 : 2

const CACHE_MODE_LABEL: Record<CacheMode, string> = {
  baseline: ' (baseline)',
  'row-cache': ' (row-cache)',
}

const SECTION_GROUP_SIZE = 200

const iterations = getNumericEnv('TACHUI_BENCH_ITERATIONS', DEFAULT_ITERATIONS)
const warmupRuns = getNumericEnv('TACHUI_BENCH_WARMUPS', DEFAULT_WARMUPS)

const config: BenchmarkConfig = {
  iterations,
  warmupRuns,
  measureMemory: true,
  framework: 'TachUI',
}

const runner = new BenchmarkRunner(config)
const rendererMetricsByBenchmark = new Map<string, RendererMetricsSnapshot>()

async function runWithRendererMetrics<T>(
  benchmarkName: string,
  execute: () => Promise<T> | T
): Promise<T> {
  resetRendererMetrics()
  const result = await execute()
  rendererMetricsByBenchmark.set(benchmarkName, getRendererMetrics())
  if (typeof globalThis !== 'undefined' && typeof (globalThis as any).gc === 'function') {
    ;(globalThis as any).gc()
  }
  return result
}

type RowData = { id: number; label: string }

interface TableOptions {
  getData: () => RowData[]
  getSelectedId?: () => number | null
  onSelect?: (id: number) => void
}

interface CachedRow {
  node: DOMNode
  idText?: DOMNode
  labelText?: DOMNode
  idString: string
  currentLabel: string
  selected: boolean
}

interface SelectionContext {
  selectedId: number | null
  shouldUpdateSelection: boolean
  onSelect?: (id: number) => void
}

function resolveCacheModes(value: string): CacheMode[] {
  const normalized = value.trim().toLowerCase()
  if (!normalized || normalized === 'both') {
    return ['baseline', 'row-cache']
  }

  if (normalized === 'baseline' || normalized === 'row-cache') {
    return [normalized]
  }

  if (normalized.includes(',')) {
    const modes = Array.from(
      new Set(
        normalized
          .split(',')
          .map(mode => mode.trim())
          .filter((mode): mode is CacheMode => mode === 'baseline' || mode === 'row-cache')
      )
    )
    if (modes.length > 0) {
      return modes
    }
  }

  console.warn(
    `[tachUI benchmarks] Unknown cache mode "${value}", defaulting to baseline + row-cache`
  )
  return ['baseline', 'row-cache']
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

function createRowNode(item: RowData, selectionContext: SelectionContext): DOMNode {
  const className = selectionContext.selectedId === item.id ? 'selected' : ''

  const rowProps: Record<string, any> = {
    className,
    'data-id': item.id,
    key: item.id,
  }

  if (selectionContext.onSelect) {
    rowProps.onClick = () => selectionContext.onSelect!(item.id)
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

function pruneRowCache(cache: Map<number, CachedRow>, data: RowData[]): void {
  if (cache.size <= data.length) {
    return
  }

  const active = new Set(data.map(item => item.id))
  cache.forEach((_value, id) => {
    if (!active.has(id)) {
      cache.delete(id)
    }
  })
}

function buildTableRows(
  data: RowData[],
  cacheMode: CacheMode,
  cache: Map<number, CachedRow> | null,
  selectionChanged: boolean,
  selectedId: number | null,
  previousSelectedId: number | null,
  onSelect?: (id: number) => void
): DOMNode[] {
  return data.map(item => {
    const selectionContext: SelectionContext = {
      selectedId,
      shouldUpdateSelection:
        selectionChanged && (item.id === selectedId || item.id === previousSelectedId),
      onSelect,
    }

    if (cacheMode === 'row-cache' && cache) {
      return ensureRowNode(item, cache, selectionContext)
    }

    return createRowNode(item, selectionContext)
  })
}

function createTableComponent(options: TableOptions, cacheMode: CacheMode) {
  const rowCache = cacheMode === 'row-cache' ? new Map<number, CachedRow>() : null
  let previousSelectedId: number | null = null

  const TableComponent = createComponent(() => {
    const data = options.getData()
    const selectedId = options.getSelectedId ? options.getSelectedId() : null
    const selectionChanged = selectedId !== previousSelectedId

    const rows = buildTableRows(
      data,
      cacheMode,
      rowCache,
      selectionChanged,
      selectedId,
      previousSelectedId,
      options.onSelect
    )

    if (rowCache) {
      pruneRowCache(rowCache, data)
    }

    previousSelectedId = selectedId

    return h(
      'table',
      { className: 'table table-hover table-striped test-data', key: 'table-root' },
      h('tbody', { key: 'table-body' }, ...rows)
    )
  })

  return {
    TableComponent,
    resetCache: () => {
      if (rowCache) {
        rowCache.clear()
      }
      previousSelectedId = null
    },
  }
}

function createSectionedTableComponent(
  options: TableOptions & { groupSize: number },
  cacheMode: CacheMode
) {
  const rowCache = cacheMode === 'row-cache' ? new Map<number, CachedRow>() : null
  let previousSelectedId: number | null = null

  const TableComponent = createComponent(() => {
    const data = options.getData()
    const selectedId = options.getSelectedId ? options.getSelectedId() : null
    const selectionChanged = selectedId !== previousSelectedId

    const rows = buildTableRows(
      data,
      cacheMode,
      rowCache,
      selectionChanged,
      selectedId,
      previousSelectedId,
      options.onSelect
    )

    if (rowCache) {
      pruneRowCache(rowCache, data)
    }

    previousSelectedId = selectedId

    const bodies: DOMNode[] = []
    for (let index = 0; index < rows.length; index += options.groupSize) {
      const sectionRows = rows.slice(index, index + options.groupSize)
      bodies.push(h('tbody', { key: `section-${index / options.groupSize}` }, ...sectionRows))
    }

    return h(
      'table',
      { className: 'table table-hover table-striped test-data', key: 'table-root' },
      ...bodies
    )
  })

  return {
    TableComponent,
    resetCache: () => {
      if (rowCache) {
        rowCache.clear()
      }
      previousSelectedId = null
    },
  }
}

function createUnkeyedListComponent(options: {
  getData: () => RowData[]
  getSelectedId?: () => number | null
  onSelect?: (id: number) => void
}) {
  const ListComponent = createComponent(() => {
    const data = options.getData()
    const selectedId = options.getSelectedId ? options.getSelectedId() : null

    const items = data.map(item => {
      const isSelected = selectedId === item.id
      const props: Record<string, any> = {
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

  return { ListComponent }
}

function ensureRowNode(
  item: RowData,
  cache: Map<number, CachedRow>,
  selectionContext: SelectionContext
): DOMNode {
  let cached = cache.get(item.id)

  if (!cached) {
    const rowNode = createRowNode(item, selectionContext)
    const idText = rowNode.children?.[0]?.children?.[0]
    const labelText = rowNode.children?.[1]?.children?.[0]?.children?.[0]

    cached = {
      node: rowNode,
      idText,
      labelText,
      idString: item.id.toString(),
      currentLabel: item.label,
      selected: selectionContext.selectedId === item.id,
    }
    cache.set(item.id, cached)
  } else if (cached.node.props?.['data-id'] !== item.id) {
    cached.node.props = {
      ...cached.node.props,
      'data-id': item.id,
    }
  }

  if (cached.idText) {
    const idText = item.id.toString()
    if (cached.idString !== idText) {
      cached.idString = idText
      cached.idText.text = idText
      if (cached.idText.element && 'textContent' in cached.idText.element) {
        ;(cached.idText.element as Text).textContent = idText
      }
    }
  }

  if (cached.labelText && cached.currentLabel !== item.label) {
    cached.currentLabel = item.label
    cached.labelText.text = item.label
    if (cached.labelText.element && 'textContent' in cached.labelText.element) {
      ;(cached.labelText.element as Text).textContent = item.label
    }
  }

  const selected = selectionContext.selectedId === item.id
  if (selectionContext.shouldUpdateSelection || cached.selected !== selected) {
    cached.selected = selected
    const className = selected ? 'selected' : ''
    if (!cached.node.props || cached.node.props.className !== className) {
      cached.node.props = {
        ...cached.node.props,
        className,
      }
    }
    if (cached.node.element instanceof HTMLElement) {
      cached.node.element.className = className
    }
  }

  return cached.node
}

async function benchmarkCreate1000Rows(cacheMode: CacheMode, benchmarkName: string) {
  await runWithRendererMetrics(benchmarkName, async () => {
    const data = generateData(1000)
    const container = getBenchmarkContainer()

    const { TableComponent, resetCache } = createTableComponent(
      {
        getData: () => data,
      },
      cacheMode
    )

    const tableInstance = TableComponent({})
    const dispose = renderComponent(tableInstance, container)
    await Promise.resolve()
    dispose()
    resetCache()
  })
}

async function benchmarkReplaceAll1000Rows(cacheMode: CacheMode, benchmarkName: string) {
  await runWithRendererMetrics(benchmarkName, async () => {
    const [data, setData] = createSignal(generateData(1000))
    const container = getBenchmarkContainer()

    const { TableComponent, resetCache } = createTableComponent(
      {
        getData: () => data(),
      },
      cacheMode
    )

    const tableInstance = TableComponent({})
    const dispose = renderComponent(tableInstance, container)

    await Promise.resolve()
    setData(generateData(1000))
    await Promise.resolve()

    dispose()
    resetCache()
  })
}

async function benchmarkPartialUpdate(cacheMode: CacheMode, benchmarkName: string) {
  await runWithRendererMetrics(benchmarkName, async () => {
    const [data, setData] = createSignal(generateData(1000))
    const container = getBenchmarkContainer()

    const { TableComponent, resetCache } = createTableComponent(
      {
        getData: () => data(),
      },
      cacheMode
    )

    const tableInstance = TableComponent({})
    const dispose = renderComponent(tableInstance, container)
    await Promise.resolve()

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

    dispose()
    resetCache()
  })
}

async function benchmarkSelectRow(cacheMode: CacheMode, benchmarkName: string) {
  await runWithRendererMetrics(benchmarkName, async () => {
    const data = generateData(1000)
    const [selectedId, setSelectedId] = createSignal<number | null>(null)
    const container = getBenchmarkContainer()

    const { TableComponent, resetCache } = createTableComponent(
      {
        getData: () => data,
        getSelectedId: () => selectedId(),
        onSelect: setSelectedId,
      },
      cacheMode
    )

    const tableInstance = TableComponent({})
    const dispose = renderComponent(tableInstance, container)
    await Promise.resolve()

    setSelectedId(500)
    await Promise.resolve()

    dispose()
    resetCache()
  })
}

async function benchmarkSwapRows(cacheMode: CacheMode, benchmarkName: string) {
  await runWithRendererMetrics(benchmarkName, async () => {
    const [data, setData] = createSignal(generateData(1000))
    const container = getBenchmarkContainer()

    const { TableComponent, resetCache } = createTableComponent(
      {
        getData: () => data(),
      },
      cacheMode
    )

    const tableInstance = TableComponent({})
    const dispose = renderComponent(tableInstance, container)
    await Promise.resolve()

    const swappedData = [...data()]
    const temp = swappedData[1]
    swappedData[1] = swappedData[997]
    swappedData[997] = temp
    setData(swappedData)
    await Promise.resolve()

    dispose()
    resetCache()
  })
}

async function benchmarkRemoveRows(cacheMode: CacheMode, benchmarkName: string) {
  await runWithRendererMetrics(benchmarkName, async () => {
    const [data, setData] = createSignal(generateData(1000))
    const container = getBenchmarkContainer()

    const { TableComponent, resetCache } = createTableComponent(
      {
        getData: () => data(),
      },
      cacheMode
    )

    const tableInstance = TableComponent({})
    const dispose = renderComponent(tableInstance, container)
    await Promise.resolve()

    const filteredData = data().filter((_, index) => index % 10 !== 0)
    setData(filteredData)
    await Promise.resolve()

    dispose()
    resetCache()
  })
}

async function benchmarkClearRows(cacheMode: CacheMode, benchmarkName: string) {
  await runWithRendererMetrics(benchmarkName, async () => {
    const [data, setData] = createSignal(generateData(1000))
    const container = getBenchmarkContainer()

    const { TableComponent, resetCache } = createTableComponent(
      {
        getData: () => data(),
      },
      cacheMode
    )

    const tableInstance = TableComponent({})
    const dispose = renderComponent(tableInstance, container)
    await Promise.resolve()

    setData([])
    await Promise.resolve()

    dispose()
    resetCache()
  })
}

async function benchmarkSectionedTableCreate(cacheMode: CacheMode, benchmarkName: string) {
  await runWithRendererMetrics(benchmarkName, async () => {
    const data = generateData(1000)
    const container = getBenchmarkContainer()

    const { TableComponent, resetCache } = createSectionedTableComponent(
      {
        getData: () => data,
        groupSize: SECTION_GROUP_SIZE,
      },
      cacheMode
    )

    const tableInstance = TableComponent({})
    const dispose = renderComponent(tableInstance, container)
    await Promise.resolve()
    dispose()
    resetCache()
  })
}

async function benchmarkUnkeyedListPartialUpdate(
  _cacheMode: CacheMode,
  benchmarkName: string
) {
  await runWithRendererMetrics(benchmarkName, async () => {
    const [data, setData] = createSignal(generateData(1000))
    const container = getBenchmarkContainer()

    const { ListComponent } = createUnkeyedListComponent({
      getData: () => data(),
    })

    const listInstance = ListComponent({})
    const dispose = renderComponent(listInstance, container)
    await Promise.resolve()

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

    dispose()
  })
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
    const signals: Array<{ signal: () => number; setSignal: (value: number) => void }> = []

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

async function runBenchmarkWithMode(
  baseName: string,
  type: BenchmarkResult['type'],
  cacheMode: CacheMode,
  benchmark: (cacheMode: CacheMode, benchmarkName: string) => Promise<void>
): Promise<BenchmarkResult> {
  const benchmarkName = `${baseName}${CACHE_MODE_LABEL[cacheMode]}`
  const result = await runner.run(benchmarkName, type, () => benchmark(cacheMode, benchmarkName))
  result.metadata = {
    ...result.metadata,
    cacheMode,
    benchmark: baseName,
  }
  const metrics = rendererMetricsByBenchmark.get(benchmarkName)
  if (metrics) {
    result.rendererMetrics = metrics
  }
  return result
}

async function runStandaloneBenchmark(
  name: string,
  type: BenchmarkResult['type'],
  benchmark: (benchmarkName: string) => Promise<void>
): Promise<BenchmarkResult> {
  const result = await runner.run(name, type, () => benchmark(name))
  const metrics = rendererMetricsByBenchmark.get(name)
  if (metrics) {
    result.rendererMetrics = metrics
  }
  return result
}

/**
 * Run all benchmarks
 */
export async function runTachUIBenchmarks() {
  console.log('🏃‍♂️ Running TachUI Performance Benchmarks...\n')
  console.log(`Cache modes: ${cacheModes.join(', ')}`)
  console.log(
    `Iterations per benchmark: ${iterations} (override via TACHUI_BENCH_ITERATIONS, default adjusts for ${hasMultipleModes ? 'multi-mode' : 'single-mode'} run)`
  )
  console.log(
    `Warmup runs: ${warmupRuns} (override via TACHUI_BENCH_WARMUPS, default adjusts for ${hasMultipleModes ? 'multi-mode' : 'single-mode'} run)`
  )

  rendererMetricsByBenchmark.clear()

  const results: BenchmarkResult[] = []

  for (const cacheMode of cacheModes) {
    results.push(
      await runBenchmarkWithMode('Create 1,000 rows', 'create', cacheMode, benchmarkCreate1000Rows)
    )
    results.push(
      await runBenchmarkWithMode(
        'Replace all 1,000 rows',
        'update',
        cacheMode,
        benchmarkReplaceAll1000Rows
      )
    )
    results.push(
      await runBenchmarkWithMode(
        'Partial update (every 10th row)',
        'update',
        cacheMode,
        benchmarkPartialUpdate
      )
    )
    results.push(
      await runBenchmarkWithMode('Select row', 'select', cacheMode, benchmarkSelectRow)
    )
    results.push(
      await runBenchmarkWithMode('Swap rows', 'swap', cacheMode, benchmarkSwapRows)
    )
    results.push(
      await runBenchmarkWithMode('Remove rows', 'remove', cacheMode, benchmarkRemoveRows)
    )
    results.push(
      await runBenchmarkWithMode('Clear rows', 'clear', cacheMode, benchmarkClearRows)
    )
    results.push(
      await runBenchmarkWithMode(
        'Create 1,000 rows (sectioned table)',
        'create',
        cacheMode,
        benchmarkSectionedTableCreate
      )
    )
    results.push(
      await runBenchmarkWithMode(
        'Unkeyed list partial update',
        'update',
        cacheMode,
        benchmarkUnkeyedListPartialUpdate
      )
    )
  }

  results.push(
    await runStandaloneBenchmark(
      'Component creation (1,000 components)',
      'create',
      benchmarkComponentCreation
    )
  )
  results.push(
    await runStandaloneBenchmark(
      'Reactive updates (100 signals × 10 updates)',
      'update',
      benchmarkReactiveUpdates
    )
  )

  ComponentManager.getInstance().cleanup()

  if (rendererMetricsByBenchmark.size > 0) {
    console.log('\nRenderer operation metrics:')
    rendererMetricsByBenchmark.forEach((metrics, name) => {
      console.log(
        `  ${name}: created=${metrics.created}, adopted=${metrics.adopted}, cacheHits=${metrics.cacheHits}, cacheMisses=${metrics.cacheMisses}, inserted=${metrics.inserted}, moved=${metrics.moved}, removed=${metrics.removed}, attrWrites=${metrics.attributeWrites}, attrRemovals=${metrics.attributeRemovals}, textUpdates=${metrics.textUpdates}, modifierApps=${metrics.modifierApplications}`
      )
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
