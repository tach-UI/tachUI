/**
 * The examples package READMEs open with, executed.
 *
 * `tools/check-readme-imports.mjs` proves every README import resolves, which
 * is what `@tachui/cli@0.11.0` failed — but resolving is not running. The
 * starter template that shipped broken would have passed an import check on
 * `@tachui/primitives`; it threw because `VStack([...])` and `Layout.VStack`
 * do not do what they look like. So the openings that build UI get mounted.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

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

/**
 * The tests above and in `readme-examples.test-d.ts` are hand-copies of README
 * fences, and a copy that drifts proves something nobody ships — the same rot
 * `check-template-apps` exists to stop for the starter templates.
 *
 * A byte-for-byte check is not available here: fences are not modules and the
 * type-test bodies are reformatted. So this pins the part that actually went
 * wrong — the shape of each documented call. Every contract these tests assert
 * has to still be the contract the README teaches.
 *
 * What it does not catch, stated plainly: a token appearing in several places
 * loses only one of them. `buttons: [` occurs three times in the mobile README,
 * so rewriting one back to `actions: [` still passes. It catches a contract
 * changing, which is what happened, rather than every edit that could be made.
 */
describe('README examples have not drifted from the tests pinning them', () => {
  const repoFile = (path: string) =>
    readFileSync(resolve(__dirname, '../../../..', path), 'utf8')

  // Both sides of the copy. Reading only the README leaves the other direction
  // open: weaken a test and it stays green while the README is still right.
  //
  // Everything from this describe onwards is cut out first. The tokens are
  // written in the table below, so searching the whole file finds them in the
  // table and passes whatever the tests above it actually do — a check that
  // satisfies itself.
  const DRIFT_BLOCK = "describe('README examples have not drifted"
  const ownSource = repoFile(
    'packages/primitives/__tests__/readme/readme-intros.test.ts'
  )
  const testSources = [
    ownSource.slice(0, ownSource.indexOf(DRIFT_BLOCK)),
    repoFile('packages/primitives/__tests__/readme/readme-examples.test-d.ts'),
  ].join('\n')

  const cases: Array<[string, string, string[]]> = [
    [
      'mobile ActionSheet/Alert',
      'packages/mobile/README.md',
      ['buttons: [', "label: 'Share'", 'onPress: () =>', 'action: () =>'],
    ],
    [
      'devtools inspector',
      'packages/devtools/README.md',
      ['globalDevTools.configure({', 'trackAllComponents: true', 'getComponentTreeSignal()'],
    ],
    [
      'grid template areas',
      'packages/grid/README.md',
      ['styling: {', 'templateAreas: [', "gridArea('header')"],
    ],
    [
      'responsive breakpoints',
      'packages/responsive/README.md',
      ['DEFAULT_BREAKPOINTS', 'getCurrentBreakpoint()', "isBreakpointAbove(current, 'md')"],
    ],
    [
      'core counter',
      'packages/core/README.md',
      // Not `mountRoot(counterApp)`: the harness here mounts into a scoped
      // host, so no test pins that call. The starter templates' own `mountRoot`
      // line is held by `check-template-apps` instead — matched, not executed.
      ['.build()', "from '@tachui/primitives'", 'createSignal(0)'],
    ],
    [
      'primitives stack',
      'packages/primitives/README.md',
      ["alignment: 'leading'", 'children: [Text('],
    ],
    [
      'data list',
      'packages/data/README.md',
      ['renderItem:', 'Text(item.name)'],
    ],
    [
      'flow-control Show',
      'packages/flow-control/README.md',
      ['when: () =>', 'children: Text('],
    ],
    [
      'symbols',
      'packages/symbols/README.md',
      ["Symbol('heart')", '.foregroundColor('],
    ],
  ]

  it.each(cases)('%s', (_name, path, tokens) => {
    const source = repoFile(path)
    for (const token of tokens) {
      expect(source, `${path} no longer contains ${JSON.stringify(token)}`).toContain(token)
      expect(
        testSources,
        `no test pins ${JSON.stringify(token)} any more, so ${path} is unguarded`
      ).toContain(token)
    }
  })
})
