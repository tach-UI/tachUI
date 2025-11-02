import { describe, expect, it } from 'vitest'

import { createSignal } from '../../src/reactive'
import { createComponent } from '../../src/runtime/component'
import { h, renderComponent } from '../../src/runtime/renderer'

describe('DOM renderer keyed child reconciliation', () => {
  const createTableComponent = (rowsSignal: () => Array<{ id: number; label: string }>) =>
    createComponent(() =>
      h(
        'table',
        { key: 'table-root' },
        h(
          'tbody',
          { key: 'table-body' },
          ...rowsSignal().map(row =>
            h(
              'tr',
              { key: row.id, 'data-id': row.id },
              h('td', null, row.label)
            )
          )
        )
      )
    )

  it('reuses keyed rows when labels update', async () => {
    const [rows, setRows] = createSignal([
      { id: 1, label: 'Row 1' },
      { id: 2, label: 'Row 2' },
      { id: 3, label: 'Row 3' },
    ])

    const Table = createTableComponent(rows)

    const container = document.createElement('div')
    const dispose = renderComponent(Table({}), container)
    await Promise.resolve()

    const initialRows = Array.from(container.querySelectorAll('tr'))
    const rowById = new Map<number, HTMLTableRowElement>()
    initialRows.forEach(rowEl => {
      rowById.set(Number(rowEl.getAttribute('data-id')), rowEl)
    })

    setRows([
      { id: 1, label: 'Row 1 updated' },
      { id: 2, label: 'Row 2 updated' },
      { id: 3, label: 'Row 3 updated' },
    ])
    await Promise.resolve()

    const updatedRows = Array.from(container.querySelectorAll('tr'))
    updatedRows.forEach(rowEl => {
      const id = Number(rowEl.getAttribute('data-id'))
      expect(rowEl).toBe(rowById.get(id))
    })

    dispose()
  })

  it('preserves row identity on keyed swaps and reorders', async () => {
    const [rows, setRows] = createSignal([
      { id: 1, label: 'Row 1' },
      { id: 2, label: 'Row 2' },
      { id: 3, label: 'Row 3' },
      { id: 4, label: 'Row 4' },
    ])

    const Table = createTableComponent(rows)

    const container = document.createElement('div')
    const dispose = renderComponent(Table({}), container)
    await Promise.resolve()

    const originalNodes = new Map<number, HTMLTableRowElement>()
    container.querySelectorAll('tr').forEach(row => {
      originalNodes.set(Number(row.getAttribute('data-id')), row)
    })

    setRows([
      { id: 4, label: 'Row 4' },
      { id: 2, label: 'Row 2' },
      { id: 3, label: 'Row 3' },
      { id: 1, label: 'Row 1' },
    ])
    await Promise.resolve()

    const reordered = Array.from(container.querySelectorAll('tr'))
    const reorderedIds = reordered.map(row => Number(row.getAttribute('data-id')))
    expect(reorderedIds).toEqual([4, 2, 3, 1])
    reordered.forEach(row => {
      const id = Number(row.getAttribute('data-id'))
      expect(row).toBe(originalNodes.get(id))
    })

    dispose()
  })

  it('reuses existing keyed rows when inserting or removing neighbors', async () => {
    const [rows, setRows] = createSignal([
      { id: 1, label: 'Row 1' },
      { id: 2, label: 'Row 2' },
      { id: 3, label: 'Row 3' },
    ])

    const Table = createTableComponent(rows)

    const container = document.createElement('div')
    const dispose = renderComponent(Table({}), container)
    await Promise.resolve()

    const originalNodes = new Map<number, HTMLTableRowElement>()
    container.querySelectorAll('tr').forEach(row => {
      originalNodes.set(Number(row.getAttribute('data-id')), row)
    })

    setRows([
      { id: 0, label: 'Row 0' },
      { id: 1, label: 'Row 1' },
      { id: 3, label: 'Row 3' },
    ])
    await Promise.resolve()

    const rowsAfterInsert = Array.from(container.querySelectorAll('tr'))
    expect(rowsAfterInsert.map(row => Number(row.getAttribute('data-id')))).toEqual([0, 1, 3])
    expect(rowsAfterInsert[1]).toBe(originalNodes.get(1))
    expect(rowsAfterInsert[2]).toBe(originalNodes.get(3))

    dispose()
  })
})
