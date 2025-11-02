/**
 * Simple test script to verify Phase 1B swap rows fix
 * Uses built dist files to avoid registry import issues
 */

import {
  ComponentManager,
  createComponent,
  createSignal,
  h,
  renderComponent,
} from './packages/core/dist/index.js'
import { getRendererMetrics, resetRendererMetrics } from './packages/core/dist/runtime/renderer.js'
import { JSDOM } from 'jsdom'

// Setup mock DOM
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>')
global.document = dom.window.document
global.window = dom.window
global.Node = dom.window.Node
global.Element = dom.window.Element
global.HTMLElement = dom.window.HTMLElement
global.Text = dom.window.Text
global.Comment = dom.window.Comment
global.DocumentFragment = dom.window.DocumentFragment

function generateData(count) {
  const data = []
  for (let i = 0; i < count; i++) {
    data.push({
      id: i + 1,
      label: `Item ${i + 1}`,
    })
  }
  return data
}

function createRowNode(item) {
  return h(
    'tr',
    {
      className: '',
      'data-id': item.id,
      key: item.id,
    },
    h('td', { className: 'col-md-1' }, item.id.toString()),
    h('td', { className: 'col-md-4' }, h('a', null, item.label)),
    h('td', { className: 'col-md-6' })
  )
}

function createTableComponent(options) {
  const TableComponent = createComponent(() => {
    const data = options.getData()
    const rows = data.map(item => createRowNode(item))

    return h(
      'table',
      { className: 'table test-data', key: 'table-root' },
      h('tbody', { key: 'table-body' }, ...rows)
    )
  })

  return { TableComponent }
}

async function testSwapRows() {
  console.log('🧪 Testing Phase 1B: Swap Rows Fix\n')

  const [data, setData] = createSignal(generateData(10))
  const container = document.getElementById('root')

  const { TableComponent } = createTableComponent({
    getData: () => data(),
  })

  resetRendererMetrics()
  const tableInstance = TableComponent({})
  const dispose = renderComponent(tableInstance, container)

  // Get initial metrics
  const initialMetrics = getRendererMetrics()
  console.log('Initial render metrics:')
  console.log(`  created: ${initialMetrics.created}`)
  console.log(`  adopted: ${initialMetrics.adopted}`)
  console.log(`  inserted: ${initialMetrics.inserted}`)
  console.log(`  moved: ${initialMetrics.moved}\n`)

  // Get initial DOM state
  const tbody = container.querySelector('tbody')
  const initialRows = Array.from(tbody.querySelectorAll('tr'))
  const initialOrder = initialRows.map(row => row.getAttribute('data-id'))
  console.log(`Initial row order: [${initialOrder.join(', ')}]\n`)

  // Reset metrics before swap
  resetRendererMetrics()

  // Swap rows 1 and 9 (indices 1 and 8, ids 2 and 9)
  console.log('Swapping rows with IDs 2 and 9...')
  const swappedData = [...data()]
  console.log(`  Before swap: data[1].id=${swappedData[1].id}, data[8].id=${swappedData[8].id}`)
  const temp = swappedData[1]
  swappedData[1] = swappedData[8]
  swappedData[8] = temp
  console.log(`  After swap:  data[1].id=${swappedData[1].id}, data[8].id=${swappedData[8].id}`)
  setData(swappedData)
  console.log(`  Signal updated to: ${data().map(d => d.id).join(', ')}\n`)

  // Wait for reactive updates to complete
  await new Promise(resolve => setTimeout(resolve, 100))

  // Get metrics after swap
  const swapMetrics = getRendererMetrics()
  console.log('Swap operation metrics:')
  console.log(`  created: ${swapMetrics.created}`)
  console.log(`  adopted: ${swapMetrics.adopted}`)
  console.log(`  inserted: ${swapMetrics.inserted}`)
  console.log(`  moved: ${swapMetrics.moved}\n`)

  // Get final DOM state
  const finalRows = Array.from(tbody.querySelectorAll('tr'))
  const finalOrder = finalRows.map(row => row.getAttribute('data-id'))
  console.log(`Final row order:   [${finalOrder.join(', ')}]\n`)

  // Verify the fix
  const expectedOrder = [
    '1',
    '9', // swapped from position 9
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '2', // swapped from position 2
    '10',
  ]
  const isCorrect = finalOrder.every((id, i) => id === expectedOrder[i])

  console.log('✅ Phase 1B Verification:')
  console.log(`  Expected order: [${expectedOrder.join(', ')}]`)
  console.log(`  Actual order:   [${finalOrder.join(', ')}]`)
  console.log(`  Order correct:  ${isCorrect ? '✅ YES' : '❌ NO'}\n`)

  console.log('📊 Performance Analysis:')
  console.log(`  Nodes created: ${swapMetrics.created} (should be 0 - reusing existing)`)
  console.log(`  Nodes moved:   ${swapMetrics.moved} (should be ~2-10 for efficient swap)`)
  console.log(`  Efficient:     ${swapMetrics.created === 0 ? '✅ YES' : '❌ NO'}\n`)

  dispose()
  ComponentManager.getInstance().cleanup()

  if (!isCorrect) {
    console.error('❌ TEST FAILED: Rows not in correct order after swap')
    process.exit(1)
  }

  console.log('✅ TEST PASSED: Phase 1B fix working correctly!')
  process.exit(0)
}

testSwapRows().catch(error => {
  console.error('❌ Test failed with error:', error)
  process.exit(1)
})
