/**
 * Test suite for Phase 1B: Keyed Child Reconciliation
 * Validates that keyed children are properly reused, moved, and updated
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

console.log('\n=== Phase 1B: Keyed Child Reconciliation Tests ===\n')

// Test 1: Reordering keyed children only moves nodes (no create/remove)
console.log('Test 1: Reordering keyed children only moves nodes')
resetRendererMetrics()

const TestReorder = () => {
  const [items, setItems] = createSignal([
    { id: 1, label: 'Item 1' },
    { id: 2, label: 'Item 2' },
    { id: 3, label: 'Item 3' },
    { id: 4, label: 'Item 4' },
    { id: 5, label: 'Item 5' },
  ])

  return {
    render: () => {
      return h('ul', null,
        ...items().map(item =>
          h('li', { key: item.id, 'data-id': item.id },
            h('span', null, item.label)
          )
        )
      )
    },
    setItems,
    getItems: items,
  }
}

const container1 = document.createElement('div')
const instance1 = TestReorder()
const cleanup1 = renderComponent(instance1, container1)

let metrics1 = getRendererMetrics()
console.log(`  Initial render:`)
console.log(`    Created: ${metrics1.created}`)
console.log(`    Adopted: ${metrics1.adopted}`)

// Capture initial DOM node references
const initialNodes = Array.from(container1.querySelectorAll('li')).map(li => ({
  element: li,
  id: li.getAttribute('data-id')
}))

// Reverse the order
resetRendererMetrics()
instance1.setItems([
  { id: 5, label: 'Item 5' },
  { id: 4, label: 'Item 4' },
  { id: 3, label: 'Item 3' },
  { id: 2, label: 'Item 2' },
  { id: 1, label: 'Item 1' },
])

await new Promise(resolve => setTimeout(resolve, 100))

metrics1 = getRendererMetrics()
console.log(`  After reordering:`)
console.log(`    Created: ${metrics1.created}`)
console.log(`    Removed: ${metrics1.removed}`)
console.log(`    Moved: ${metrics1.moved}`)
console.log(`    Adopted: ${metrics1.adopted}`)

// Verify DOM nodes are the same instances (reused)
const reorderedNodes = Array.from(container1.querySelectorAll('li'))
let nodesReused = true
for (let i = 0; i < initialNodes.length; i++) {
  const originalNode = initialNodes.find(n => n.id === reorderedNodes[i].getAttribute('data-id'))
  if (originalNode.element !== reorderedNodes[i]) {
    nodesReused = false
    break
  }
}

// Verify order
const actualOrder = reorderedNodes.map(li => li.getAttribute('data-id'))
const expectedOrder = ['5', '4', '3', '2', '1']
const orderCorrect = JSON.stringify(actualOrder) === JSON.stringify(expectedOrder)

if (metrics1.created === 0) {
  console.log(`  ✅ No nodes created during reorder`)
} else {
  console.log(`  ❌ FAILED: ${metrics1.created} nodes created (expected 0)`)
}

if (metrics1.removed === 0) {
  console.log(`  ✅ No nodes removed during reorder`)
} else {
  console.log(`  ❌ FAILED: ${metrics1.removed} nodes removed (expected 0)`)
}

if (nodesReused) {
  console.log(`  ✅ All DOM nodes reused (same instances)`)
} else {
  console.log(`  ❌ FAILED: DOM nodes were recreated`)
}

if (orderCorrect) {
  console.log(`  ✅ Order correct: [${actualOrder.join(', ')}]`)
} else {
  console.log(`  ❌ FAILED: Order incorrect. Expected [${expectedOrder.join(', ')}], got [${actualOrder.join(', ')}]`)
}

cleanup1()

// Test 2: Adding to middle inserts once
console.log('\nTest 2: Adding item to middle inserts once')
resetRendererMetrics()

const TestInsert = () => {
  const [items, setItems] = createSignal([
    { id: 1, label: 'Item 1' },
    { id: 2, label: 'Item 2' },
    { id: 4, label: 'Item 4' },
  ])

  return {
    render: () => {
      return h('ul', null,
        ...items().map(item =>
          h('li', { key: item.id, 'data-id': item.id },
            h('span', null, item.label)
          )
        )
      )
    },
    setItems,
  }
}

const container2 = document.createElement('div')
const instance2 = TestInsert()
const cleanup2 = renderComponent(instance2, container2)

let metrics2 = getRendererMetrics()
console.log(`  Initial render (3 items):`)
console.log(`    Created: ${metrics2.created}`)

// Insert item 3 in the middle
resetRendererMetrics()
instance2.setItems([
  { id: 1, label: 'Item 1' },
  { id: 2, label: 'Item 2' },
  { id: 3, label: 'Item 3' },  // New item
  { id: 4, label: 'Item 4' },
])

await new Promise(resolve => setTimeout(resolve, 100))

metrics2 = getRendererMetrics()
console.log(`  After inserting item 3:`)
console.log(`    Created: ${metrics2.created}`)
console.log(`    Adopted: ${metrics2.adopted}`)
console.log(`    Inserted: ${metrics2.inserted}`)
console.log(`    Moved: ${metrics2.moved}`)

const items2 = container2.querySelectorAll('li')
const order2 = Array.from(items2).map(li => li.getAttribute('data-id'))
const expectedOrder2 = ['1', '2', '3', '4']
const orderCorrect2 = JSON.stringify(order2) === JSON.stringify(expectedOrder2)

// We expect to create nodes for the new item (li + span + text = 3 nodes)
// But existing items should be adopted
if (metrics2.created >= 3 && metrics2.created <= 5) {
  console.log(`  ✅ New item nodes created: ${metrics2.created}`)
} else {
  console.log(`  ⚠️  Created nodes: ${metrics2.created} (expected ~3-5 for new item)`)
}

if (metrics2.adopted >= 3) {
  console.log(`  ✅ Existing items adopted: ${metrics2.adopted}`)
} else {
  console.log(`  ❌ FAILED: Only ${metrics2.adopted} adopted (expected ≥3)`)
}

if (orderCorrect2) {
  console.log(`  ✅ Order correct: [${order2.join(', ')}]`)
} else {
  console.log(`  ❌ FAILED: Order incorrect. Expected [${expectedOrder2.join(', ')}], got [${order2.join(', ')}]`)
}

cleanup2()

// Test 3: Removing from middle removes once
console.log('\nTest 3: Removing item from middle removes once')
resetRendererMetrics()

const TestRemove = () => {
  const [items, setItems] = createSignal([
    { id: 1, label: 'Item 1' },
    { id: 2, label: 'Item 2' },
    { id: 3, label: 'Item 3' },
    { id: 4, label: 'Item 4' },
  ])

  return {
    render: () => {
      return h('ul', null,
        ...items().map(item =>
          h('li', { key: item.id, 'data-id': item.id },
            h('span', null, item.label)
          )
        )
      )
    },
    setItems,
  }
}

const container3 = document.createElement('div')
const instance3 = TestRemove()
const cleanup3 = renderComponent(instance3, container3)

let metrics3 = getRendererMetrics()
console.log(`  Initial render (4 items):`)
console.log(`    Created: ${metrics3.created}`)

// Remove item 2 from the middle
resetRendererMetrics()
instance3.setItems([
  { id: 1, label: 'Item 1' },
  { id: 3, label: 'Item 3' },
  { id: 4, label: 'Item 4' },
])

await new Promise(resolve => setTimeout(resolve, 100))

metrics3 = getRendererMetrics()
console.log(`  After removing item 2:`)
console.log(`    Created: ${metrics3.created}`)
console.log(`    Removed: ${metrics3.removed}`)
console.log(`    Adopted: ${metrics3.adopted}`)
console.log(`    Moved: ${metrics3.moved}`)

const items3 = container3.querySelectorAll('li')
const order3 = Array.from(items3).map(li => li.getAttribute('data-id'))
const expectedOrder3 = ['1', '3', '4']
const orderCorrect3 = JSON.stringify(order3) === JSON.stringify(expectedOrder3)

if (metrics3.created === 0) {
  console.log(`  ✅ No nodes created during removal`)
} else {
  console.log(`  ❌ FAILED: ${metrics3.created} nodes created (expected 0)`)
}

// Should remove 3 nodes (li + span + text)
if (metrics3.removed >= 3 && metrics3.removed <= 5) {
  console.log(`  ✅ Removed item nodes: ${metrics3.removed}`)
} else {
  console.log(`  ⚠️  Removed nodes: ${metrics3.removed} (expected ~3 for one item)`)
}

if (metrics3.adopted >= 3) {
  console.log(`  ✅ Remaining items adopted: ${metrics3.adopted}`)
} else {
  console.log(`  ❌ FAILED: Only ${metrics3.adopted} adopted (expected ≥3)`)
}

if (orderCorrect3) {
  console.log(`  ✅ Order correct: [${order3.join(', ')}]`)
} else {
  console.log(`  ❌ FAILED: Order incorrect. Expected [${expectedOrder3.join(', ')}], got [${order3.join(', ')}]`)
}

cleanup3()

// Test 4: Swap operations use minimal DOM changes
console.log('\nTest 4: Swap operations use minimal DOM changes')
resetRendererMetrics()

const TestSwap = () => {
  const [items, setItems] = createSignal([
    { id: 1, label: 'Item 1' },
    { id: 2, label: 'Item 2' },
    { id: 3, label: 'Item 3' },
    { id: 4, label: 'Item 4' },
    { id: 5, label: 'Item 5' },
  ])

  return {
    render: () => {
      return h('ul', null,
        ...items().map(item =>
          h('li', { key: item.id, 'data-id': item.id },
            h('span', null, item.label)
          )
        )
      )
    },
    setItems,
  }
}

const container4 = document.createElement('div')
const instance4 = TestSwap()
const cleanup4 = renderComponent(instance4, container4)

let metrics4 = getRendererMetrics()
console.log(`  Initial render (5 items):`)
console.log(`    Created: ${metrics4.created}`)

// Swap items 2 and 4
resetRendererMetrics()
instance4.setItems([
  { id: 1, label: 'Item 1' },
  { id: 4, label: 'Item 4' },  // Swapped
  { id: 3, label: 'Item 3' },
  { id: 2, label: 'Item 2' },  // Swapped
  { id: 5, label: 'Item 5' },
])

await new Promise(resolve => setTimeout(resolve, 100))

metrics4 = getRendererMetrics()
console.log(`  After swapping items 2 and 4:`)
console.log(`    Created: ${metrics4.created}`)
console.log(`    Removed: ${metrics4.removed}`)
console.log(`    Moved: ${metrics4.moved}`)
console.log(`    Adopted: ${metrics4.adopted}`)

const items4 = container4.querySelectorAll('li')
const order4 = Array.from(items4).map(li => li.getAttribute('data-id'))
const expectedOrder4 = ['1', '4', '3', '2', '5']
const orderCorrect4 = JSON.stringify(order4) === JSON.stringify(expectedOrder4)

if (metrics4.created === 0) {
  console.log(`  ✅ No nodes created during swap`)
} else {
  console.log(`  ❌ FAILED: ${metrics4.created} nodes created (expected 0)`)
}

if (metrics4.removed === 0) {
  console.log(`  ✅ No nodes removed during swap`)
} else {
  console.log(`  ❌ FAILED: ${metrics4.removed} nodes removed (expected 0)`)
}

// Should adopt all existing nodes
if (metrics4.adopted >= 5) {
  console.log(`  ✅ All items adopted: ${metrics4.adopted}`)
} else {
  console.log(`  ❌ FAILED: Only ${metrics4.adopted} adopted (expected ≥5)`)
}

// Should have DOM moves (efficient reordering)
if (metrics4.moved > 0) {
  console.log(`  ✅ DOM moves performed: ${metrics4.moved}`)
} else {
  console.log(`  ⚠️  No DOM moves detected (expected >0)`)
}

if (orderCorrect4) {
  console.log(`  ✅ Order correct: [${order4.join(', ')}]`)
} else {
  console.log(`  ❌ FAILED: Order incorrect. Expected [${expectedOrder4.join(', ')}], got [${order4.join(', ')}]`)
}

cleanup4()

console.log('\n=== Test Suite Complete ===\n')
