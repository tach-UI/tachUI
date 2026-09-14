/**
 * The examples package READMEs open with, executed.
 *
 * `tools/check-readme-imports.mjs` proves every README import resolves, which
 * is what `@tachui/cli@0.11.0` failed — but resolving is not running. The
 * starter template that shipped broken would have passed an import check on
 * `@tachui/primitives`; it threw because `VStack([...])` and `Layout.VStack`
 * do not do what they look like. So the openings that build UI get mounted.
 */

import { describe, expect, it } from 'vitest'
import { createSignal, flushSync, mount } from '@tachui/core'
import { Button, HStack, Text, VStack } from '@tachui/primitives'
import { Grid } from '@tachui/grid'
import { List } from '@tachui/data'
import { Show } from '@tachui/flow-control'
import { Symbol } from '@tachui/symbols'
import '@tachui/modifiers/preload/basic'

let hosts = 0
const render = (build: () => any): HTMLElement => {
  const host = document.createElement('div')
  host.id = `readme-host-${hosts++}`
  document.body.appendChild(host)
  mount(build, `#${host.id}`)
  return host
}

describe('README opening examples', () => {
  it('core: the counter mounts and increments', () => {
    const [count, setCount] = createSignal(0)
    const host = render(() =>
      VStack({
        children: [
          Text(() => `Count: ${count()}`)
            .fontSize(24)
            .fontWeight('bold')
            .foregroundColor('#007AFF'),
          Button('Increment', () => setCount(count() + 1))
            .backgroundColor('#007AFF')
            .foregroundColor('white')
            .padding({ vertical: 12, horizontal: 24 })
            .cornerRadius(8),
        ],
        spacing: 16,
        alignment: 'center',
      }).build()
    )

    expect(host.textContent).toContain('Count: 0')
    host.querySelector('button')!.click()
    flushSync()
    expect(host.textContent).toContain('Count: 1')
  })

  it('primitives: the stack renders its children in order', () => {
    const host = render(() =>
      VStack({
        spacing: 16,
        alignment: 'leading',
        children: [Text('First Item'), Text('Second Item'), Text('Third Item')],
      })
    )
    expect(host.textContent).toBe('First ItemSecond ItemThird Item')
  })

  it('grid: the grid renders its children', () => {
    const host = render(() =>
      Grid({
        columns: 3,
        spacing: 16,
        children: [Text('Item 1'), Text('Item 2'), Text('Item 3')],
      })
    )
    expect(host.textContent).toContain('Item 1')
    expect(host.textContent).toContain('Item 3')
  })

  it('grid: template areas take effect from styling, not the top level', () => {
    // `ComponentProps` carries `[key: string]: any`, so a misplaced prop is not
    // a type error anywhere in the framework — it is silently dropped. The grid
    // README documented `templateAreas` at the top level, which renders nothing
    // at all, and no compiler would have said so.
    const areas = ['header header', 'stats chart']

    const styled = render(() =>
      Grid({ styling: { templateAreas: areas }, children: [Text('x')] })
    )
    expect(
      (styled.querySelector('*') as HTMLElement).style.gridTemplateAreas
    ).toBe('"header header" "stats chart"')

    const topLevel = render(() =>
      Grid({ templateAreas: areas, children: [Text('x')] } as any)
    )
    expect(
      (topLevel.querySelector('*') as HTMLElement).style.gridTemplateAreas
    ).toBe('')
  })

  it('data: the list renders a row per item', () => {
    const items = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
    ]
    const host = render(() =>
      VStack({
        children: [List({ data: items, renderItem: (item: any) => Text(item.name) })],
      })
    )
    expect(host.textContent).toContain('Item 1')
    expect(host.textContent).toContain('Item 2')
  })

  it('flow-control: Show gates on its condition', () => {
    const [isVisible, setVisible] = createSignal(false)
    const host = render(() =>
      VStack({
        children: [
          Show({
            when: () => isVisible(),
            children: Text('This content is conditionally shown'),
          }),
        ],
      })
    )

    expect(host.textContent).not.toContain('conditionally shown')
    setVisible(true)
    flushSync()
    expect(host.textContent).toContain('conditionally shown')
  })

  it('symbols: a symbol renders with chained modifiers', () => {
    const host = render(() =>
      HStack({
        children: [Symbol('heart').padding(16).foregroundColor('#ff0000')],
      })
    )
    expect(host.querySelector('*')).not.toBeNull()
  })
})
