/**
 * TachUI Framework Benchmarks
 *
 * Industry-aligned performance benchmarks covering the key operations
 * measured by js-framework-benchmark and similar tools.
 */

import { ComponentManager, createComponent, createSignal, DOMRenderer, h, text } from '../src'
import {
  type BenchmarkConfig,
  BenchmarkRunner,
  generateData,
  getBenchmarkContainer,
  setupMockDOM,
} from './setup'

// Setup DOM environment for benchmarks
setupMockDOM()

const config: BenchmarkConfig = {
  iterations: 100,
  warmupRuns: 5,
  measureMemory: true,
  framework: 'TachUI',
}

const runner = new BenchmarkRunner(config)

/**
 * Benchmark 1: Create 1,000 rows
 * Standard benchmark: Create a large table with 1,000 rows
 */
async function benchmarkCreate1000Rows() {
  const data = generateData(1000)
  const container = getBenchmarkContainer()
  const renderer = new DOMRenderer()

  const RowComponent = createComponent<{ item: { id: number; label: string }; selected?: boolean }>(
    (props) => {
      return h(
        'tr',
        {
          className: props.selected ? 'selected' : '',
          'data-id': props.item.id,
        },
        h('td', { className: 'col-md-1' }, props.item.id.toString()),
        h('td', { className: 'col-md-4' }, h('a', null, props.item.label)),
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
  )

  const TableComponent = createComponent(() => {
    return h(
      'table',
      { className: 'table table-hover table-striped test-data' },
      h(
        'tbody',
        null,
        ...data.map((item) => {
          const instance = RowComponent({ item })
          return instance.render()
        })
      )
    )
  })

  const tableInstance = TableComponent({})
  renderer.render(tableInstance.render(), container)
}

/**
 * Benchmark 2: Replace all 1,000 rows
 * Standard benchmark: Replace all data in table
 */
async function benchmarkReplaceAll1000Rows() {
  const [data, setData] = createSignal(generateData(1000))
  const container = getBenchmarkContainer()
  const renderer = new DOMRenderer()

  const TableComponent = createComponent(() => {
    return h(
      'table',
      { className: 'table table-hover table-striped test-data' },
      h(
        'tbody',
        null,
        text(() => {
          return data().map((item) =>
            h(
              'tr',
              { 'data-id': item.id },
              h('td', { className: 'col-md-1' }, item.id.toString()),
              h('td', { className: 'col-md-4' }, h('a', null, item.label)),
              h(
                'td',
                { className: 'col-md-1' },
                h('button', { className: 'btn btn-sm btn-danger' }, 'x')
              ),
              h('td', { className: 'col-md-6' })
            )
          )
        })
      )
    )
  })

  const tableInstance = TableComponent({})
  renderer.render(tableInstance.render(), container)

  // Now replace the data
  setData(generateData(1000))
}

/**
 * Benchmark 3: Partial update (update every 10th row)
 * Standard benchmark: Update every 10th row
 */
async function benchmarkPartialUpdate() {
  const initialData = generateData(1000)
  const [data, setData] = createSignal(initialData)
  const container = getBenchmarkContainer()
  const renderer = new DOMRenderer()

  const TableComponent = createComponent(() => {
    return h(
      'table',
      { className: 'table table-hover table-striped test-data' },
      h(
        'tbody',
        null,
        text(() => {
          return data().map((item) =>
            h(
              'tr',
              { 'data-id': item.id },
              h('td', { className: 'col-md-1' }, item.id.toString()),
              h('td', { className: 'col-md-4' }, h('a', null, item.label)),
              h(
                'td',
                { className: 'col-md-1' },
                h('button', { className: 'btn btn-sm btn-danger' }, 'x')
              ),
              h('td', { className: 'col-md-6' })
            )
          )
        })
      )
    )
  })

  const tableInstance = TableComponent({})
  renderer.render(tableInstance.render(), container)

  // Update every 10th row
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
}

/**
 * Benchmark 4: Select row
 * Standard benchmark: Select a single row
 */
async function benchmarkSelectRow() {
  const data = generateData(1000)
  const [selectedId, setSelectedId] = createSignal<number | null>(null)
  const container = getBenchmarkContainer()
  const renderer = new DOMRenderer()

  const RowComponent = createComponent<{ item: { id: number; label: string } }>((props) => {
    return h(
      'tr',
      {
        className: () => (selectedId() === props.item.id ? 'selected' : ''),
        'data-id': props.item.id,
        onClick: () => setSelectedId(props.item.id),
      },
      h('td', { className: 'col-md-1' }, props.item.id.toString()),
      h('td', { className: 'col-md-4' }, h('a', null, props.item.label)),
      h('td', { className: 'col-md-1' }, h('button', { className: 'btn btn-sm btn-danger' }, 'x')),
      h('td', { className: 'col-md-6' })
    )
  })

  const TableComponent = createComponent(() => {
    return h(
      'table',
      { className: 'table table-hover table-striped test-data' },
      h(
        'tbody',
        null,
        ...data.map((item) => {
          const instance = RowComponent({ item })
          return instance.render()
        })
      )
    )
  })

  const tableInstance = TableComponent({})
  renderer.render(tableInstance.render(), container)

  // Select row 500
  setSelectedId(500)
}

/**
 * Benchmark 5: Swap rows
 * Standard benchmark: Swap two rows
 */
async function benchmarkSwapRows() {
  const initialData = generateData(1000)
  const [data, setData] = createSignal(initialData)
  const container = getBenchmarkContainer()
  const renderer = new DOMRenderer()

  const TableComponent = createComponent(() => {
    return h(
      'table',
      { className: 'table table-hover table-striped test-data' },
      h(
        'tbody',
        null,
        text(() => {
          return data().map((item) =>
            h(
              'tr',
              { 'data-id': item.id },
              h('td', { className: 'col-md-1' }, item.id.toString()),
              h('td', { className: 'col-md-4' }, h('a', null, item.label)),
              h(
                'td',
                { className: 'col-md-1' },
                h('button', { className: 'btn btn-sm btn-danger' }, 'x')
              ),
              h('td', { className: 'col-md-6' })
            )
          )
        })
      )
    )
  })

  const tableInstance = TableComponent({})
  renderer.render(tableInstance.render(), container)

  // Swap rows 2 and 998
  const swappedData = [...data()]
  const temp = swappedData[1]
  swappedData[1] = swappedData[997]
  swappedData[997] = temp
  setData(swappedData)
}

/**
 * Benchmark 6: Remove row
 * Standard benchmark: Remove every 10th row
 */
async function benchmarkRemoveRows() {
  const initialData = generateData(1000)
  const [data, setData] = createSignal(initialData)
  const container = getBenchmarkContainer()
  const renderer = new DOMRenderer()

  const TableComponent = createComponent(() => {
    return h(
      'table',
      { className: 'table table-hover table-striped test-data' },
      h(
        'tbody',
        null,
        text(() => {
          return data().map((item) =>
            h(
              'tr',
              { 'data-id': item.id },
              h('td', { className: 'col-md-1' }, item.id.toString()),
              h('td', { className: 'col-md-4' }, h('a', null, item.label)),
              h(
                'td',
                { className: 'col-md-1' },
                h(
                  'button',
                  {
                    className: 'btn btn-sm btn-danger',
                    onClick: () => {
                      setData((current) => current.filter((i) => i.id !== item.id))
                    },
                  },
                  'x'
                )
              ),
              h('td', { className: 'col-md-6' })
            )
          )
        })
      )
    )
  })

  const tableInstance = TableComponent({})
  renderer.render(tableInstance.render(), container)

  // Remove every 10th row
  const filteredData = data().filter((_, index) => index % 10 !== 0)
  setData(filteredData)
}

/**
 * Benchmark 7: Clear all rows
 * Standard benchmark: Clear table
 */
async function benchmarkClearRows() {
  const initialData = generateData(1000)
  const [data, setData] = createSignal(initialData)
  const container = getBenchmarkContainer()
  const renderer = new DOMRenderer()

  const TableComponent = createComponent(() => {
    return h(
      'table',
      { className: 'table table-hover table-striped test-data' },
      h(
        'tbody',
        null,
        text(() => {
          return data().map((item) =>
            h(
              'tr',
              { 'data-id': item.id },
              h('td', { className: 'col-md-1' }, item.id.toString()),
              h('td', { className: 'col-md-4' }, h('a', null, item.label)),
              h(
                'td',
                { className: 'col-md-1' },
                h('button', { className: 'btn btn-sm btn-danger' }, 'x')
              ),
              h('td', { className: 'col-md-6' })
            )
          )
        })
      )
    )
  })

  const tableInstance = TableComponent({})
  renderer.render(tableInstance.render(), container)

  // Clear all data
  setData([])
}

/**
 * Benchmark 8: Component Creation Performance
 * Test raw component creation speed
 */
async function benchmarkComponentCreation() {
  const SimpleComponent = createComponent<{ text: string }>((props) => {
    return h('div', null, props.text)
  })

  // Create 1000 component instances
  for (let i = 0; i < 1000; i++) {
    SimpleComponent({ text: `Component ${i}` })
  }
}

/**
 * Benchmark 9: Reactive Updates Performance
 * Test reactive system performance with many signals
 */
async function benchmarkReactiveUpdates() {
  const signals = []

  // Create 100 signals
  for (let i = 0; i < 100; i++) {
    const [signal, setSignal] = createSignal(i)
    signals.push({ signal, setSignal })
  }

  // Update all signals 10 times
  for (let update = 0; update < 10; update++) {
    signals.forEach(({ setSignal }, index) => {
      setSignal(index + update * 100)
    })
  }
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

  // Cleanup
  ComponentManager.getInstance().cleanup()

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
