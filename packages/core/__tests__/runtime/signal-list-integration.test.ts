import { describe, it, expect } from 'vitest'
import {
  createSignalList,
  flushSync,
  type SignalListControls,
} from '../../src/reactive'
import { createComponent } from '../../src/runtime/component'
import {
  h,
  renderComponent,
  resetRendererMetrics,
  getRendererMetrics,
  text,
} from '../../src/runtime/renderer'

type Row = { id: number; label: string }

const makeRows = (count = 5): Row[] =>
  Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    label: `Row ${index + 1}`,
  }))

function createTable(list: SignalListControls<Row, number>) {
  let renderCount = 0
  const Table = createComponent(() => {
    renderCount++
    const ids = list.ids()
    return h(
      'table',
      { className: 'test-table', key: 'table' },
      h(
        'tbody',
        { key: 'tbody' },
        ...ids.map(id => {
          const getRow = list.get(id)
          return h(
            'tr',
            { key: id, 'data-id': id },
            h('td', null, text(() => getRow().label))
          )
        })
      )
    )
  })

  return { Table, getRenderCount: () => renderCount }
}

describe('createSignalList integration', () => {
  it('avoids full component re-renders for data-only updates', () => {
    const initialRows = makeRows(3)
    const [, list] = createSignalList(initialRows, row => row.id)
    const { Table, getRenderCount } = createTable(list)

    const container = document.createElement('div')
    document.body.appendChild(container)
    const dispose = renderComponent(Table({}), container)
    flushSync()

    expect(getRenderCount()).toBe(1)
    expect(
      container.querySelector('[data-id="1"] td')?.textContent
    ).toBe('Row 1')

    list.update(1, { id: 1, label: 'Row 1 (edited)' })
    flushSync()

    expect(getRenderCount()).toBe(1)
    expect(
      container.querySelector('[data-id="1"] td')?.textContent
    ).toBe('Row 1 (edited)')

    const next = list.getAll().map(row => ({ ...row }))
    next.push({ id: 4, label: 'Row 4' })
    list.set(next)
    flushSync()

    expect(getRenderCount()).toBe(2)
    expect(container.querySelectorAll('tr').length).toBe(4)

    dispose()
    container.remove()
  })

  it('keeps DOM churn minimal for swaps', () => {
    const [, list] = createSignalList(makeRows(8), row => row.id)
    const { Table } = createTable(list)

    const container = document.createElement('div')
    document.body.appendChild(container)
    resetRendererMetrics()
    const dispose = renderComponent(Table({}), container)
    flushSync()

    resetRendererMetrics()
    const swapped = list.getAll().map(row => ({ ...row }))
    const secondIndex = 1
    const penultimateIndex = swapped.length - 2
    ;[swapped[secondIndex], swapped[penultimateIndex]] = [
      swapped[penultimateIndex],
      swapped[secondIndex],
    ]
    list.set(swapped)
    flushSync()

    const metrics = getRendererMetrics()
    // Churn is whether nodes were thrown away and rebuilt. Every one of the 26
    // is reused, so a swap costs no construction and no teardown.
    expect(metrics.created).toBe(0)
    expect(metrics.removed).toBe(0)
    expect(metrics.adopted).toBeGreaterThan(0)

    // And the swap actually reaches the DOM, which is the part that went
    // unasserted: `set` used to treat the same keys in a new order as no
    // change, so this test measured a structural update that never happened.
    expect(
      Array.from(container.querySelectorAll('tr')).map(row =>
        row.getAttribute('data-id')
      )
    ).toEqual(['1', '7', '3', '4', '5', '6', '2', '8'])

    // Deliberately no budget on `inserted`/`moved`. They count re-attachment
    // while the re-rendered tree is applied, not churn: this component reads
    // `ids()`, so any structural change re-renders the whole table, and
    // appending a single row to it costs more insertions than this swap does.

    dispose()
    container.remove()
  })
})
