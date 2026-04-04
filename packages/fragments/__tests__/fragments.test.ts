import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { h, text } from '@tachui/core'
import type { DOMNode } from '@tachui/core/runtime/types'
import { interactive, snapshot } from '../src/modifiers'
import { prerender } from '../src/prerender'

function createFragmentNode(componentId: string): DOMNode {
  const node = h('div', null, text('Counter')) as DOMNode & {
    componentId?: string
    modifiers?: unknown[]
  }
  node.componentId = componentId
  node.modifiers = [
    interactive(),
    snapshot({
      get: () => ({ count: 0 }),
      restore: () => {},
    }),
  ]
  return node
}

describe('@tachui/fragments', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('interactive and snapshot modifiers stamp fragment marker metadata', () => {
    const node = h('section') as DOMNode

    const marked = interactive().apply(node, {
      componentId: 'app:counter:0',
      phase: 'creation',
      componentInstance: undefined,
    })

    const withSnapshot = snapshot({
      get: () => ({ count: 2 }),
      restore: () => {},
    }).apply(marked, {
      componentId: 'app:counter:0',
      phase: 'creation',
      componentInstance: undefined,
    })

    expect((withSnapshot as any).__tachui_fragment).toEqual({
      componentId: 'app:counter:0',
      componentName: 'Fragment',
      snapshotData: { count: 2 },
    })
  })

  it('prerender emits fragment wrapper, manifest script, and runtime script when interactive', async () => {
    const outDir = await mkdtemp(path.join(tmpdir(), 'tachui-fragments-'))

    const result = await prerender(
      [
        {
          path: '/',
          render: () => createFragmentNode('app:counter:0'),
        },
      ],
      { outDir }
    )

    const html = await readFile(path.join(outDir, 'index.html'), 'utf8')

    expect(result[0].fragmentManifest).toEqual({
      'app:counter:0': 'Fragment',
    })
    expect(html).toContain('<tachui-fragment data-component="Fragment" data-component-id="app:counter:0"')
    expect(html).toContain('data-state="{&quot;count&quot;:0}"')
    expect(html).toContain('id="tachui-fragment-manifest"')
    expect(html).toContain('src="/tachui-fragments-runtime.js"')
  })

  it('prerender strips wrapper/runtime script when interactive is false', async () => {
    const outDir = await mkdtemp(path.join(tmpdir(), 'tachui-fragments-static-'))

    const result = await prerender(
      [
        {
          path: '/',
          render: () => createFragmentNode('app:counter:1'),
        },
      ],
      { outDir, interactive: false }
    )

    const html = await readFile(path.join(outDir, 'index.html'), 'utf8')

    expect(result[0].fragmentManifest).toEqual({
      'app:counter:1': 'Fragment',
    })
    expect(html).not.toContain('<tachui-fragment')
    expect(html).not.toContain('tachui-fragment-manifest')
    expect(html).not.toContain('/tachui-fragments-runtime.js')
  })

  it('hydrateFragments restores snapshot and preserves static fallback on hydration errors', async () => {
    vi.resetModules()
    const { registerFragment, hydrateFragments } = await import('../src/runtime')

    const restoreSpy = vi.fn()

    const instance = {
      type: 'component',
      id: 'counter-component',
      props: {},
      modifiers: [
        snapshot({
          get: () => ({ count: 0 }),
          restore: restoreSpy,
        }),
      ],
      render: () => h('div', null, text('hydrated')),
    }

    document.body.innerHTML = [
      '<script id="tachui-fragment-manifest" type="application/json">{"cmp-1":"Counter"}</script>',
      '<tachui-fragment data-component-id="cmp-1" data-state="{&quot;count&quot;:1}"><div>static</div></tachui-fragment>',
      '<tachui-fragment data-component="Broken" data-component-id="cmp-2"><div>kept</div></tachui-fragment>',
    ].join('')

    registerFragment('Counter', () => instance as any)
    registerFragment('Broken', () => {
      throw new Error('boom')
    })

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    hydrateFragments()

    const fragments = document.querySelectorAll('tachui-fragment')
    expect(fragments[0].innerHTML).toContain('hydrated')
    expect(restoreSpy).toHaveBeenCalledWith({ count: 1 })
    expect(fragments[1].innerHTML).toContain('kept')
    expect(errorSpy).toHaveBeenCalled()
  })
})
