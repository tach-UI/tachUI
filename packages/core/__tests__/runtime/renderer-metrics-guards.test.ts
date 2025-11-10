import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'

import { createSignal } from '../../src/reactive'
import { createComponent } from '../../src/runtime/component'
import { h, renderComponent, resetRendererMetrics, getRendererMetrics } from '../../src/runtime/renderer'

type Row = { id: number; label: string }

function createRows(count: number): Row[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    label: `Row ${index + 1}`,
  }))
}

function createTableComponent(rows: () => Row[]) {
  return createComponent(() =>
    h(
      'table',
      { key: 'table-root' },
      h(
        'tbody',
        { key: 'table-body' },
        ...rows().map(row =>
          h(
            'tr',
            { key: row.id, 'data-id': row.id },
            h('td', null, row.label)
          )
        )
      )
    )
  )
}

async function flushMicrotasks() {
  await Promise.resolve()
}

describe('Renderer metrics regression guards', () => {
  const globalAny = globalThis as any
  const originalGlobals = {
    window: globalAny.window,
    document: globalAny.document,
    HTMLElement: globalAny.HTMLElement,
    Element: globalAny.Element,
    Node: globalAny.Node,
    Text: globalAny.Text,
    Comment: globalAny.Comment,
    DocumentFragment: globalAny.DocumentFragment,
  }

  beforeAll(() => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
    globalAny.window = dom.window
    globalAny.document = dom.window.document
    globalAny.HTMLElement = dom.window.HTMLElement
    globalAny.Element = dom.window.Element
    globalAny.Node = dom.window.Node
    globalAny.Text = dom.window.Text
    globalAny.Comment = dom.window.Comment
    globalAny.DocumentFragment = dom.window.DocumentFragment
  })

  afterAll(() => {
    globalAny.window = originalGlobals.window
    globalAny.document = originalGlobals.document
    globalAny.HTMLElement = originalGlobals.HTMLElement
    globalAny.Element = originalGlobals.Element
    globalAny.Node = originalGlobals.Node
    globalAny.Text = originalGlobals.Text
    globalAny.Comment = originalGlobals.Comment
    globalAny.DocumentFragment = originalGlobals.DocumentFragment
  })

  it('keeps DOM churn low for keyed partial updates', async () => {
    const [rows, setRows] = createSignal(createRows(20))
    const Table = createTableComponent(rows)

    const container = document.createElement('div')
    document.body.appendChild(container)

    resetRendererMetrics()
    const dispose = renderComponent(Table({}), container)
    await flushMicrotasks()

    resetRendererMetrics()
    setRows(current =>
      current.map((row, index) =>
        index % 5 === 0 ? { ...row, label: `${row.label}!` } : row
      )
    )
    await flushMicrotasks()

    const metrics = getRendererMetrics()
    expect(metrics.created).toBeLessThanOrEqual(2)
    expect(metrics.removed).toBeLessThanOrEqual(2)
    expect(metrics.moved).toBe(0)

    dispose()
    container.remove()
  })

  it('records DOM moves for keyed swaps instead of creating new nodes', async () => {
    const [rows, setRows] = createSignal(createRows(10))
    const Table = createTableComponent(rows)

    const container = document.createElement('div')
    document.body.appendChild(container)

    resetRendererMetrics()
    const dispose = renderComponent(Table({}), container)
    await flushMicrotasks()

    resetRendererMetrics()
    setRows(current => {
      const next = [...current]
      const temp = next[1]
      next[1] = next[next.length - 2]
      next[next.length - 2] = temp
      return next
    })
    await flushMicrotasks()

    const metrics = getRendererMetrics()
    expect(metrics.created).toBe(0)
    expect(metrics.removed).toBe(0)
    expect(metrics.inserted).toBeLessThanOrEqual(100)
    expect(metrics.adopted).toBeGreaterThan(0)

    dispose()
    container.remove()
  })
})
