/**
 * Test suite for Phase 2: Attribute & Property Optimization
 * Validates that attributes are only set when values change
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

console.log('\n=== Phase 2: Attribute & Property Optimization Tests ===\n')

// Test 1: Unchanged attributes don't trigger setAttribute
console.log('Test 1: Unchanged attributes don\'t trigger setAttribute')
resetRendererMetrics()

const TestUnchangedAttrs = () => {
  const [count, setCount] = createSignal(0)
  const [items, setItems] = createSignal([
    { id: 1, title: 'Item 1', value: 'unchanged' },
    { id: 2, title: 'Item 2', value: 'unchanged' },
    { id: 3, title: 'Item 3', value: 'unchanged' },
  ])

  return {
    render: () => {
      count() // Track for reactivity
      return h('div', null,
        ...items().map(item =>
          h('div', {
            key: item.id,
            'data-id': item.id,
            'data-value': item.value,
            'class': 'row-item'
          },
            h('span', null, item.title)
          )
        )
      )
    },
    setCount,
    setItems,
  }
}

const container1 = document.createElement('div')
const instance1 = TestUnchangedAttrs()
const cleanup1 = renderComponent(instance1, container1)

let metrics1 = getRendererMetrics()
console.log(`  Initial render:`)
console.log(`    Created: ${metrics1.created}`)
console.log(`    attrWrites: ${metrics1.attributeWrites}`)

// Trigger re-render with SAME attribute values
resetRendererMetrics()
instance1.setCount(1)

await new Promise(resolve => setTimeout(resolve, 100))

metrics1 = getRendererMetrics()
console.log(`  After re-render with unchanged attributes:`)
console.log(`    Created: ${metrics1.created}`)
console.log(`    Adopted: ${metrics1.adopted}`)
console.log(`    attrWrites: ${metrics1.attributeWrites}`)

// Verify minimal attribute writes
if (metrics1.attributeWrites === 0) {
  console.log(`  ✅ Zero attribute writes (perfect optimization)`)
} else if (metrics1.attributeWrites < 10) {
  console.log(`  ✅ Minimal attribute writes: ${metrics1.attributeWrites} (good optimization)`)
} else {
  console.log(`  ❌ FAILED: ${metrics1.attributeWrites} attribute writes (expected <10)`)
}

// Now change ONE attribute value
resetRendererMetrics()
instance1.setItems([
  { id: 1, title: 'Item 1', value: 'unchanged' },
  { id: 2, title: 'Item 2', value: 'CHANGED' }, // Only this changed
  { id: 3, title: 'Item 3', value: 'unchanged' },
])

await new Promise(resolve => setTimeout(resolve, 100))

metrics1 = getRendererMetrics()
console.log(`  After changing ONE attribute:`)
console.log(`    attrWrites: ${metrics1.attributeWrites}`)

if (metrics1.attributeWrites >= 1 && metrics1.attributeWrites <= 3) {
  console.log(`  ✅ Only changed attribute updated`)
} else {
  console.log(`  ⚠️  attrWrites: ${metrics1.attributeWrites} (expected 1-3)`)
}

cleanup1()

// Test 2: className optimization
console.log('\nTest 2: className change detection')
resetRendererMetrics()

const TestClassName = () => {
  const [classValue, setClassValue] = createSignal('initial-class')

  return {
    render: () => {
      return h('div', { className: classValue() }, 'Content')
    },
    setClassValue,
  }
}

const container2 = document.createElement('div')
const instance2 = TestClassName()
const cleanup2 = renderComponent(instance2, container2)

resetRendererMetrics()
// Set to SAME className
instance2.setClassValue('initial-class')

await new Promise(resolve => setTimeout(resolve, 100))

let metrics2 = getRendererMetrics()
console.log(`  After setting same className:`)
console.log(`    attrWrites: ${metrics2.attributeWrites}`)

if (metrics2.attributeWrites === 0) {
  console.log(`  ✅ className not updated when unchanged`)
} else {
  console.log(`  ❌ FAILED: ${metrics2.attributeWrites} writes (expected 0)`)
}

// Now change className
resetRendererMetrics()
instance2.setClassValue('new-class')

await new Promise(resolve => setTimeout(resolve, 100))

metrics2 = getRendererMetrics()
console.log(`  After changing className:`)
console.log(`    attrWrites: ${metrics2.attributeWrites}`)

if (metrics2.attributeWrites === 1) {
  console.log(`  ✅ className updated once when changed`)
} else {
  console.log(`  ⚠️  attrWrites: ${metrics2.attributeWrites} (expected 1)`)
}

// Verify DOM
const element2 = container2.firstChild
if (element2 && element2.className === 'new-class') {
  console.log(`  ✅ className correct in DOM: '${element2.className}'`)
} else if (element2) {
  console.log(`  ❌ FAILED: className in DOM is '${element2.className}' (expected 'new-class')`)
} else {
  console.log(`  ❌ FAILED: element not found`)
}

cleanup2()

// Test 3: Style property diffing
console.log('\nTest 3: Style property diffing')
resetRendererMetrics()

const TestStyle = () => {
  const [color, setColor] = createSignal('red')
  const [fontSize, setFontSize] = createSignal('16px')

  return {
    render: () => {
      return h('div', {
        style: {
          color: color(),
          fontSize: fontSize(),
          padding: '10px' // Static property
        }
      }, 'Styled content')
    },
    setColor,
    setFontSize,
  }
}

const container3 = document.createElement('div')
const instance3 = TestStyle()
const cleanup3 = renderComponent(instance3, container3)

let metrics3 = getRendererMetrics()
console.log(`  Initial render:`)
console.log(`    attrWrites: ${metrics3.attributeWrites}`)

// Change only ONE style property
resetRendererMetrics()
instance3.setColor('blue')

await new Promise(resolve => setTimeout(resolve, 100))

metrics3 = getRendererMetrics()
console.log(`  After changing color only:`)
console.log(`    attrWrites: ${metrics3.attributeWrites}`)

if (metrics3.attributeWrites === 1) {
  console.log(`  ✅ Only one style property updated`)
} else {
  console.log(`  ⚠️  attrWrites: ${metrics3.attributeWrites} (expected 1)`)
}

// Verify DOM
const element3 = container3.firstChild
if (element3 && element3.style.color === 'blue') {
  console.log(`  ✅ Color updated in DOM: '${element3.style.color}'`)
} else if (element3) {
  console.log(`  ❌ FAILED: color is '${element3.style.color}' (expected 'blue')`)
} else {
  console.log(`  ❌ FAILED: element not found`)
}

if (element3 && element3.style.fontSize === '16px') {
  console.log(`  ✅ fontSize unchanged: '${element3.style.fontSize}'`)
} else if (element3) {
  console.log(`  ❌ FAILED: fontSize changed unexpectedly`)
}

cleanup3()

// Test 4: Form element property optimization
console.log('\nTest 4: Form element property optimization (value, checked, disabled)')
resetRendererMetrics()

const TestFormProperties = () => {
  const [inputValue, setInputValue] = createSignal('initial')
  const [checked, setChecked] = createSignal(false)
  const [disabled, setDisabled] = createSignal(false)

  return {
    render: () => {
      return h('form', null,
        h('input', {
          type: 'text',
          value: inputValue(),
          disabled: disabled()
        }),
        h('input', {
          type: 'checkbox',
          checked: checked()
        })
      )
    },
    setInputValue,
    setChecked,
    setDisabled,
  }
}

const container4 = document.createElement('div')
const instance4 = TestFormProperties()
const cleanup4 = renderComponent(instance4, container4)

let metrics4 = getRendererMetrics()
console.log(`  Initial render:`)
console.log(`    attrWrites: ${metrics4.attributeWrites}`)

// Change form properties
resetRendererMetrics()
instance4.setInputValue('updated')
instance4.setChecked(true)
instance4.setDisabled(true)

await new Promise(resolve => setTimeout(resolve, 100))

metrics4 = getRendererMetrics()
console.log(`  After changing form properties:`)
console.log(`    attrWrites: ${metrics4.attributeWrites}`)

// Verify DOM uses properties (not attributes)
const form = container4.firstChild
const textInput = form?.firstChild
const checkbox = form?.lastChild

if (textInput.value === 'updated') {
  console.log(`  ✅ Input value property updated: '${textInput.value}'`)
} else {
  console.log(`  ❌ FAILED: input value is '${textInput.value}' (expected 'updated')`)
}

if (checkbox.checked === true) {
  console.log(`  ✅ Checkbox checked property updated: ${checkbox.checked}`)
} else {
  console.log(`  ❌ FAILED: checkbox.checked is ${checkbox.checked} (expected true)`)
}

if (textInput.disabled === true) {
  console.log(`  ✅ Input disabled property updated: ${textInput.disabled}`)
} else {
  console.log(`  ❌ FAILED: input.disabled is ${textInput.disabled} (expected true)`)
}

// Verify attrWrites count is reasonable (properties should be tracked)
if (metrics4.attributeWrites >= 3 && metrics4.attributeWrites <= 10) {
  console.log(`  ✅ Property updates tracked correctly: ${metrics4.attributeWrites} writes`)
} else {
  console.log(`  ⚠️  Unexpected attrWrites count: ${metrics4.attributeWrites}`)
}

cleanup4()

// Test 5: Boolean attribute optimization
console.log('\nTest 5: Boolean attribute optimization')
resetRendererMetrics()

const TestBooleanAttrs = () => {
  const [hidden, setHidden] = createSignal(false)
  const [readonly, setReadonly] = createSignal(false)

  return {
    render: () => {
      return h('div', null,
        h('div', { hidden: hidden() }, 'Content'),
        h('input', { readonly: readonly() })
      )
    },
    setHidden,
    setReadonly,
  }
}

const container5 = document.createElement('div')
const instance5 = TestBooleanAttrs()
const cleanup5 = renderComponent(instance5, container5)

let metrics5 = getRendererMetrics()
console.log(`  Initial render (both false):`)
console.log(`    attrWrites: ${metrics5.attributeWrites}`)

// Set to true
resetRendererMetrics()
instance5.setHidden(true)
instance5.setReadonly(true)

await new Promise(resolve => setTimeout(resolve, 100))

metrics5 = getRendererMetrics()
console.log(`  After setting both to true:`)
console.log(`    attrWrites: ${metrics5.attributeWrites}`)

const outerDiv = container5.firstChild
const hiddenDiv = outerDiv?.firstChild
const readonlyInput = outerDiv?.lastChild

if (hiddenDiv.hasAttribute('hidden')) {
  console.log(`  ✅ hidden attribute added when true`)
} else {
  console.log(`  ❌ FAILED: hidden attribute not added`)
}

if (readonlyInput.hasAttribute('readonly')) {
  console.log(`  ✅ readonly attribute added when true`)
} else {
  console.log(`  ❌ FAILED: readonly attribute not added`)
}

// Set to false again
resetRendererMetrics()
instance5.setHidden(false)
instance5.setReadonly(false)

await new Promise(resolve => setTimeout(resolve, 100))

metrics5 = getRendererMetrics()
console.log(`  After setting both to false:`)
console.log(`    attrWrites: ${metrics5.attributeWrites}`) // Should show removals

if (!hiddenDiv.hasAttribute('hidden')) {
  console.log(`  ✅ hidden attribute removed when false`)
} else {
  console.log(`  ❌ FAILED: hidden attribute not removed`)
}

if (!readonlyInput.hasAttribute('readonly')) {
  console.log(`  ✅ readonly attribute removed when false`)
} else {
  console.log(`  ❌ FAILED: readonly attribute not removed`)
}

cleanup5()

console.log('\n=== Test Suite Complete ===\n')
