/**
 * TachUI Framework Benchmarks
 *
 * Industry-aligned performance benchmarks covering the key operations
 * measured by js-framework-benchmark and similar tools.
 */

import { ComponentManager, createComponent, createSignal, h, renderComponent } from '../src'
import type { DOMNode } from '../src/runtime/types'
import {
  getRendererMetrics,
  resetRendererMetrics,
  type RendererMetricsSnapshot,
} from '../src/runtime/renderer'
import {
  type BenchmarkConfig,
  BenchmarkRunner,
  generateData,
  getBenchmarkContainer,
  setupMockDOM,
} from './setup'

// Setup DOM environment for benchmarks
setupMockDOM()

const iterations =
  typeof process !== 'undefined' && process.env?.TACHUI_BENCH_ITERATIONS
    ? Number(process.env.TACHUI_BENCH_ITERATIONS)
    : 20
const warmupRuns =
  typeof process !== 'undefined' && process.env?.TACHUI_BENCH_WARMUPS
    ? Number(process.env.TACHUI_BENCH_WARMUPS)
    : 2

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

function createTableComponentWithCache(options: TableOptions) {
  const rowCache = new Map<number, CachedRow>()
  let previousSelectedId: number | null = null

  const TableComponent = createComponent(() => {
    const data = options.getData()
    const selectedId = options.getSelectedId ? options.getSelectedId() : null
    const selectionChanged = selectedId !== previousSelectedId
    const rows = data.map(item => {
      const shouldUpdateSelection =
        selectionChanged &&
        (item.id === selectedId || item.id === previousSelectedId)
      return ensureRowNode(item, rowCache, {
        selectedId,
        shouldUpdateSelection,
        onSelect: options.onSelect,
      })
    })

    if (rowCache.size > data.length) {
      const active = new Set(data.map(item => item.id))
      rowCache.forEach((_value, id) => {
        if (!active.has(id)) {
          rowCache.delete(id)
        }
      })
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
      rowCache.clear()
      previousSelectedId = null
    },
  }
}

function ensureRowNode(
  item: RowData,
  cache: Map<number, CachedRow>,
  selectionContext: SelectionContext
): DOMNode {
  let cached = cache.get(item.id)

  if (!cached) {
    const className = selectionContext.selectedId === item.id ? 'selected' : ''

    const rowNode = h(
      'tr',
      {
        className,
        'data-id': item.id,
        key: item.id,
        ...(selectionContext.onSelect
          ? { onClick: () => selectionContext.onSelect!(item.id) }
          : {}),
      },
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

    const idText = rowNode.children?.[0]?.children?.[0]
    const labelText = rowNode.children?.[1]?.children?.[0]?.children?.[0]

    cached = {
      node: rowNode,
      idText,
      labelText,
      idString: item.id.toString(),
      currentLabel: item.label,
      selected: className === 'selected',
    }
    cache.set(item.id, cached)
  } else {
    if (cached.node.props?.['data-id'] !== item.id) {
      cached.node.props = {
        ...cached.node.props,
        'data-id': item.id,
      }
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

  if (cached.labelText) {
    if (cached.currentLabel !== item.label) {
      cached.currentLabel = item.label
      cached.labelText.text = item.label
      if (cached.labelText.element && 'textContent' in cached.labelText.element) {
        ;(cached.labelText.element as Text).textContent = item.label
      }
    }
  }

  const selected = selectionContext.selectedId === item.id
  if (
    selectionContext.shouldUpdateSelection ||
    cached.selected !== selected
  ) {
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

/**
 * Benchmark 1: Create 1,000 rows
 * Standard benchmark: Create a large table with 1,000 rows
 */
async function benchmarkCreate1000Rows() {
  await runWithRendererMetrics('Create 1,000 rows', async () => {
    const data = generateData(1000)
    const container = getBenchmarkContainer()

  const { TableComponent } = createTableComponentWithCache({
    getData: () => data,
  })

    const tableInstance = TableComponent({})
    const dispose = renderComponent(tableInstance, container)
    await Promise.resolve()
    dispose()
  })
}

/**
 * Benchmark 2: Replace all 1,000 rows
 * Standard benchmark: Replace all data in table
 */
async function benchmarkReplaceAll1000Rows() {
  await runWithRendererMetrics('Replace all 1,000 rows', async () => {
    const [data, setData] = createSignal(generateData(1000))
    const container = getBenchmarkContainer()

    const { TableComponent } = createTableComponentWithCache({
      getData: () => data(),
    })

    const tableInstance = TableComponent({})
    const dispose = renderComponent(tableInstance, container)

    await Promise.resolve()
    setData(generateData(1000))
    await Promise.resolve()

    dispose()
  })
}

/**
 * Benchmark 3: Partial update (update every 10th row)
 * Standard benchmark: Update every 10th row
 */
async function benchmarkPartialUpdate() {
  await runWithRendererMetrics('Partial update', async () => {
    const [data, setData] = createSignal(generateData(1000))
    const container = getBenchmarkContainer()

    const { TableComponent } = createTableComponentWithCache({
      getData: () => data(),
    })

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
  })
}

/**
 * Benchmark 4: Select row
 * Standard benchmark: Select a single row
 */
async function benchmarkSelectRow() {
  await runWithRendererMetrics('Select row', async () => {
    const data = generateData(1000)
    const [selectedId, setSelectedId] = createSignal<number | null>(null)
    const container = getBenchmarkContainer()

    const { TableComponent } = createTableComponentWithCache({
      getData: () => data,
      getSelectedId: () => selectedId(),
      onSelect: setSelectedId,
    })

    const tableInstance = TableComponent({})
    const dispose = renderComponent(tableInstance, container)
    await Promise.resolve()

    setSelectedId(500)
    await Promise.resolve()

    dispose()
  })
}

/**
 * Benchmark 5: Swap rows
 * Standard benchmark: Swap two rows
 */
async function benchmarkSwapRows() {
  await runWithRendererMetrics('Swap rows', async () => {
    const [data, setData] = createSignal(generateData(1000))
    const container = getBenchmarkContainer()

    const { TableComponent } = createTableComponentWithCache({
      getData: () => data(),
    })

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
  })
}

/**
 * Benchmark 6: Remove row
 * Standard benchmark: Remove every 10th row
 */
async function benchmarkRemoveRows() {
  await runWithRendererMetrics('Remove rows', async () => {
    const [data, setData] = createSignal(generateData(1000))
    const container = getBenchmarkContainer()

    const { TableComponent } = createTableComponentWithCache({
      getData: () => data(),
    })

    const tableInstance = TableComponent({})
    const dispose = renderComponent(tableInstance, container)
    await Promise.resolve()

    const filteredData = data().filter((_, index) => index % 10 !== 0)
    setData(filteredData)
    await Promise.resolve()

    dispose()
  })
}

/**
 * Benchmark 7: Clear all rows
 * Standard benchmark: Clear table
 */
async function benchmarkClearRows() {
  await runWithRendererMetrics('Clear rows', async () => {
    const [data, setData] = createSignal(generateData(1000))
    const container = getBenchmarkContainer()

    const { TableComponent } = createTableComponentWithCache({
      getData: () => data(),
    })

    const tableInstance = TableComponent({})
    const dispose = renderComponent(tableInstance, container)
    await Promise.resolve()

    setData([])
    await Promise.resolve()

    dispose()
  })
}

/**
 * Benchmark 8: Component Creation Performance
 * Test raw component creation speed
 */
async function benchmarkComponentCreation() {
  await runWithRendererMetrics('Component creation', async () => {
    const SimpleComponent = createComponent<{ text: string }>((props) => {
      return h('div', null, props.text)
    })

    for (let i = 0; i < 1000; i++) {
      SimpleComponent({ text: `Component ${i}` })
    }
  })
}

/**
 * Benchmark 9: Reactive Updates Performance
 * Test reactive system performance with many signals
 */
async function benchmarkReactiveUpdates() {
  await runWithRendererMetrics('Reactive updates', async () => {
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

/**
 * Run all benchmarks
 */
export async function runTachUIBenchmarks() {
  console.log('🏃‍♂️ Running TachUI Performance Benchmarks...\n')

  const results = []

  // Standard js-framework-benchmark tests
  results.push(await runner.run('Create 1,000 rows', 'create', benchmarkCreate1000Rows))
  results.push(await runner.run('Replace all 1,000 rows', 'update', benchmarkReplaceAll1000Rows))
  results.push(
    await runner.run('Partial update (every 10th row)', 'update', benchmarkPartialUpdate)
  )
  results.push(await runner.run('Select row', 'select', benchmarkSelectRow))
  results.push(await runner.run('Swap rows', 'swap', benchmarkSwapRows))
  results.push(await runner.run('Remove rows', 'remove', benchmarkRemoveRows))
  results.push(await runner.run('Clear rows', 'clear', benchmarkClearRows))

  // TachUI-specific performance tests
  results.push(
    await runner.run('Component creation (1,000 components)', 'create', benchmarkComponentCreation)
  )
  results.push(
    await runner.run(
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
        `  ${name}: created=${metrics.created}, adopted=${metrics.adopted}, inserted=${metrics.inserted}, moved=${metrics.moved}, removed=${metrics.removed}`
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
  benchmarkComponentCreation,
  benchmarkReactiveUpdates,
}
