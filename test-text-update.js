/**
 * Test script for Phase 1C: Text Node Updates
 * Verifies that text nodes are updated in place instead of being recreated.
 */

import { JSDOM } from 'jsdom'
import { h, createSignal, resetRendererMetrics, getRendererMetrics, renderComponent } from './packages/core/dist/index.js'

// Setup DOM environment
const dom = new JSDOM('<!DOCTYPE html><body></body>')
global.window = dom.window
global.document = dom.window.document
global.Node = dom.window.Node
global.Element = dom.window.Element
global.Text = dom.window.Text
global.HTMLElement = dom.window.HTMLElement

console.log('\n=== Phase 1C: Text Node Update Test ===\n')

// Test 1: Static text update
console.log('Test 1: Update static text content')
resetRendererMetrics()

const TestComponent1 = () => {
  const [data, setData] = createSignal([
    { id: 1, label: 'First' },
    { id: 2, label: 'Second' },
    { id: 3, label: 'Third' },
  ])

  return {
    render: () => {
      return h(
        'div',
        null,
        ...data().map(item =>
          h('div', { key: item.id },
            h('span', null, item.label)
          )
        )
      )
    },
    setData,
    getData: data,
  }
}

const container1 = document.createElement('div')
const instance1 = TestComponent1()
const cleanup1 = renderComponent(instance1, container1)

let metrics1 = getRendererMetrics()
console.log(`  Initial render:`)
console.log(`    Created: ${metrics1.created}`)
console.log(`    Text updates: ${metrics1.textUpdates}`)

// Change text content
resetRendererMetrics()
instance1.setData([
  { id: 1, label: 'First Updated' },
  { id: 2, label: 'Second Updated' },
  { id: 3, label: 'Third Updated' },
])

await new Promise(resolve => setTimeout(resolve, 100))

metrics1 = getRendererMetrics()
console.log(`  After text update:`)
console.log(`    Created: ${metrics1.created}`)
console.log(`    Text updates: ${metrics1.textUpdates}`)

// Validate that no new nodes were created (text updated in place)
if (metrics1.created === 0) {
  console.log(`  ✅ Text nodes updated in place (0 nodes created)`)
} else {
  console.log(`  ❌ FAILED: ${metrics1.created} nodes created instead of updating in place`)
}

// Validate text content
const spans1 = container1.querySelectorAll('span')
const actualLabels1 = Array.from(spans1).map(span => span.textContent)
const expectedLabels1 = ['First Updated', 'Second Updated', 'Third Updated']
const labelsMatch1 = JSON.stringify(actualLabels1) === JSON.stringify(expectedLabels1)

if (labelsMatch1) {
  console.log(`  ✅ Text content correct: ${JSON.stringify(actualLabels1)}`)
} else {
  console.log(`  ❌ FAILED: Expected ${JSON.stringify(expectedLabels1)}, got ${JSON.stringify(actualLabels1)}`)
}

cleanup1()

// Test 2: Reactive text update
console.log('\nTest 2: Update reactive text content')
resetRendererMetrics()

const TestComponent2 = () => {
  const [count, setCount] = createSignal(0)

  return {
    render: () => {
      return h('div', null,
        h('p', null, `Count: ${count()}`)
      )
    },
    setCount,
    getCount: count,
  }
}

const container2 = document.createElement('div')
const instance2 = TestComponent2()
const cleanup2 = renderComponent(instance2, container2)

let metrics2 = getRendererMetrics()
console.log(`  Initial render:`)
console.log(`    Created: ${metrics2.created}`)
console.log(`    Text updates: ${metrics2.textUpdates}`)

// Update reactive value
resetRendererMetrics()
instance2.setCount(5)

await new Promise(resolve => setTimeout(resolve, 100))

metrics2 = getRendererMetrics()
console.log(`  After reactive update:`)
console.log(`    Created: ${metrics2.created}`)
console.log(`    Text updates: ${metrics2.textUpdates}`)

// Validate that no new nodes were created
if (metrics2.created === 0) {
  console.log(`  ✅ Reactive text updated in place (0 nodes created)`)
} else {
  console.log(`  ❌ FAILED: ${metrics2.created} nodes created instead of updating in place`)
}

// Validate text content
const p = container2.querySelector('p')
const actualText = p.textContent
const expectedText = 'Count: 5'

if (actualText === expectedText) {
  console.log(`  ✅ Reactive text content correct: "${actualText}"`)
} else {
  console.log(`  ❌ FAILED: Expected "${expectedText}", got "${actualText}"`)
}

cleanup2()

// Test 3: Text node in list reordering
console.log('\nTest 3: Text nodes preserved during list reordering')
resetRendererMetrics()

const TestComponent3 = () => {
  const [items, setItems] = createSignal([
    { id: 1, text: 'Apple' },
    { id: 2, text: 'Banana' },
    { id: 3, text: 'Cherry' },
  ])

  return {
    render: () => {
      return h('ul', null,
        ...items().map(item =>
          h('li', { key: item.id }, item.text)
        )
      )
    },
    setItems,
    getItems: items,
  }
}

const container3 = document.createElement('div')
const instance3 = TestComponent3()
const cleanup3 = renderComponent(instance3, container3)

let metrics3 = getRendererMetrics()
console.log(`  Initial render:`)
console.log(`    Created: ${metrics3.created}`)
console.log(`    Adopted: ${metrics3.adopted}`)

// Swap first and last items
resetRendererMetrics()
instance3.setItems([
  { id: 3, text: 'Cherry' },
  { id: 2, text: 'Banana' },
  { id: 1, text: 'Apple' },
])

await new Promise(resolve => setTimeout(resolve, 100))

metrics3 = getRendererMetrics()
console.log(`  After reordering:`)
console.log(`    Created: ${metrics3.created}`)
console.log(`    Adopted: ${metrics3.adopted}`)
console.log(`    Moved: ${metrics3.moved}`)

// Validate that nodes were adopted (reused) not created
if (metrics3.created === 0 && metrics3.adopted > 0) {
  console.log(`  ✅ Nodes reused during reordering (${metrics3.adopted} adopted, 0 created)`)
} else {
  console.log(`  ❌ FAILED: ${metrics3.created} nodes created, ${metrics3.adopted} adopted`)
}

// Validate order
const listItems = container3.querySelectorAll('li')
const actualOrder = Array.from(listItems).map(li => li.textContent)
const expectedOrder = ['Cherry', 'Banana', 'Apple']
const orderMatch = JSON.stringify(actualOrder) === JSON.stringify(expectedOrder)

if (orderMatch) {
  console.log(`  ✅ Order correct: ${JSON.stringify(actualOrder)}`)
} else {
  console.log(`  ❌ FAILED: Expected ${JSON.stringify(expectedOrder)}, got ${JSON.stringify(actualOrder)}`)
}

cleanup3()

console.log('\n=== Test Complete ===\n')
