import { describe, expect, it } from 'vitest'

import { createSignal } from '../../src/reactive'
import { createComponent } from '../../src/runtime/component'
import { h, renderComponent } from '../../src/runtime/renderer'

describe('DOM renderer parent reuse', () => {
  const initialData = [
    { id: 1, label: 'Row 1' },
    { id: 2, label: 'Row 2' },
    { id: 3, label: 'Row 3' },
  ]

  const updatedData = [
    { id: 1, label: 'Row 1 updated' },
    { id: 2, label: 'Row 2 updated' },
    { id: 3, label: 'Row 3 updated' },
  ]

  it('reuses table and tbody elements across renders', async () => {
    const [rows, setRows] = createSignal(initialData)

    const Table = createComponent(() => {
      const currentRows = rows()
      return h(
        'table',
        { className: 'table', key: 'table-root' },
        h(
          'tbody',
          { key: 'table-body' },
          ...currentRows.map(row =>
            h('tr', { key: row.id }, h('td', { className: 'label' }, row.label))
          )
        )
      )
    })

    const container = document.createElement('div')
    const dispose = renderComponent(Table({}), container)
    await Promise.resolve()

    const firstTable = container.querySelector('table')
    const firstTBody = container.querySelector('tbody')
    const firstRow = container.querySelector('tr')
    expect(firstTable).not.toBeNull()
    expect(firstTBody).not.toBeNull()
    expect(firstRow).not.toBeNull()

    setRows(updatedData)
    await Promise.resolve()

    const secondTable = container.querySelector('table')
    const secondTBody = container.querySelector('tbody')
    const secondRow = container.querySelector('tr')

    expect(secondTable).toBe(firstTable)
    expect(secondTBody).toBe(firstTBody)
    expect(secondRow).toBe(firstRow)

    dispose()
  })
})
