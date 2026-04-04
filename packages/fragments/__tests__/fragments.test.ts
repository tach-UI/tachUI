import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { h, text } from '@tachui/core'
import type { DOMNode } from '@tachui/core/runtime/types'
import { __resetFragmentConfigForTests, configureFragments } from '../src/config'
import { Interactive } from '../src/interactive-component'
import { interactive, snapshot } from '../src/modifiers'
import { prerender } from '../src/prerender'
import {
  __resetFragmentsRuntimeForTests,
  hydrateFragments,
  registerFragment,
} from '../src/runtime'

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
    __resetFragmentsRuntimeForTests()
    __resetFragmentConfigForTests()
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

  it('Interactive marks single and multi-child content, including componentName overrides', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const single = h('button', null, text('Click')) as DOMNode
    const markedSingle = Interactive({
      children: single,
      componentName: 'ButtonFrag',
    })
    expect((markedSingle as any).__tachui_fragment?.componentName).toBe('ButtonFrag')

    const multi = Interactive({
      children: [h('span', null, text('A')), h('span', null, text('B'))],
      componentName: 'WrapperFrag',
    })
    expect(multi.type).toBe('element')
    expect((multi as any).__tachui_fragment?.componentName).toBe('WrapperFrag')
    expect(warnSpy).toHaveBeenCalled()
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
    expect(html).toContain(
      '<tachui-fragment data-component="Fragment" data-component-id="app:counter:0"'
    )
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

  it('prerender validates routes/outDir and blocks output path traversal', async () => {
    const outDir = await mkdtemp(path.join(tmpdir(), 'tachui-fragments-validate-'))

    await expect(prerender([], { outDir })).rejects.toThrow(
      'prerender requires at least one route definition.'
    )
    await expect(
      prerender([{ path: '/', render: () => h('div') }], { outDir: '' })
    ).rejects.toThrow('prerender requires a non-empty outDir.')
    await expect(
      prerender(
        [{ path: '../../outside', render: () => h('div') }],
        { outDir }
      )
    ).rejects.toThrow('resolves outside outDir')
  })

  it('prerender supports multiple routes, escaped runtimeScriptSrc, and custom document', async () => {
    const outDir = await mkdtemp(path.join(tmpdir(), 'tachui-fragments-doc-'))
    const customDocument = vi.fn(
      (
        html: string,
        route: { path: string },
        _context: unknown,
        manifest: Record<string, string>,
        runtimeTags: string[]
      ) => `<!doctype html><html><head>${runtimeTags.join('')}</head><body data-route="${route.path}" data-manifest="${Object.keys(manifest).length}">${html}</body></html>`
    )

    await prerender(
      [
        { path: '/', render: () => createFragmentNode('cmp-1') },
        { path: '/about', render: () => createFragmentNode('cmp-2') },
      ],
      {
        outDir,
        runtimeScriptSrc: '/x" onerror="alert(1)".js',
        document: customDocument,
      }
    )

    const rootHtml = await readFile(path.join(outDir, 'index.html'), 'utf8')
    const aboutHtml = await readFile(path.join(outDir, 'about/index.html'), 'utf8')

    expect(customDocument).toHaveBeenCalledTimes(2)
    expect(rootHtml).toContain('src="/x&quot; onerror=&quot;alert(1)&quot;.js"')
    expect(aboutHtml).toContain('data-route="/about"')
  })

  it('configureFragments routes hydration errors to custom handler', () => {
    const handler = vi.fn()
    configureFragments({ onHydrationError: handler })

    document.body.innerHTML =
      '<tachui-fragment data-component="Missing" data-component-id="cmp-err"><div>kept</div></tachui-fragment>'

    hydrateFragments()

    expect(handler).toHaveBeenCalledTimes(1)
    expect(document.querySelector('tachui-fragment')?.innerHTML).toContain('kept')
  })

  it('hydrateFragments restores snapshot and supports builder outputs', () => {
    const restoreSpy = vi.fn()

    registerFragment('Counter', () => ({
      build: () => ({
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
      }),
    } as any))

    document.body.innerHTML =
      '<tachui-fragment data-component="Counter" data-component-id="cmp-1" data-state="{&quot;count&quot;:1}"><div>static</div></tachui-fragment>'

    hydrateFragments()

    const fragment = document.querySelector('tachui-fragment')
    expect(fragment?.innerHTML).toContain('hydrated')
    expect(restoreSpy).toHaveBeenCalledWith({ count: 1 })
  })

  it('reports malformed snapshot JSON and continues hydration with static fallback semantics', () => {
    const handler = vi.fn()
    const restoreSpy = vi.fn()
    configureFragments({ onHydrationError: handler })

    registerFragment('Counter', () => ({
      type: 'component',
      id: 'counter',
      props: {},
      modifiers: [
        snapshot({
          get: () => ({ count: 0 }),
          restore: restoreSpy,
        }),
      ],
      render: () => h('div', null, text('hydrated')),
    } as any))

    document.body.innerHTML =
      '<tachui-fragment data-component="Counter" data-component-id="cmp-bad-json" data-state="{not-json"><div>static</div></tachui-fragment>'

    hydrateFragments()

    const fragment = document.querySelector('tachui-fragment')
    expect(fragment?.innerHTML).toContain('hydrated')
    expect(restoreSpy).not.toHaveBeenCalled()
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler.mock.calls[0][1]).toMatchObject({
      phase: 'restore',
      componentId: 'cmp-bad-json',
      componentName: 'Counter',
    })
  })

  it('defers hydration until DOMContentLoaded when document is still loading', () => {
    registerFragment('Deferred', () => ({
      type: 'component',
      id: 'deferred',
      props: {},
      render: () => h('div', null, text('hydrated-late')),
    } as any))

    document.body.innerHTML =
      '<tachui-fragment data-component="Deferred" data-component-id="cmp-late"><div>static</div></tachui-fragment>'

    const readyStateDescriptor = Object.getOwnPropertyDescriptor(document, 'readyState')
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    })

    let domContentLoadedHandler: (() => void) | undefined
    const addEventListenerSpy = vi
      .spyOn(document, 'addEventListener')
      .mockImplementation(
        (
          type: string,
          handler: EventListenerOrEventListenerObject
        ) => {
          if (type === 'DOMContentLoaded' && typeof handler === 'function') {
            domContentLoadedHandler = handler
          }
        }
      )

    try {
      hydrateFragments()
      expect(document.querySelector('tachui-fragment')?.innerHTML).toContain('static')
      expect(domContentLoadedHandler).toBeTypeOf('function')

      domContentLoadedHandler?.()
      expect(document.querySelector('tachui-fragment')?.innerHTML).toContain('hydrated-late')
    } finally {
      addEventListenerSpy.mockRestore()
      if (readyStateDescriptor) {
        Object.defineProperty(document, 'readyState', readyStateDescriptor)
      } else {
        Reflect.deleteProperty(document, 'readyState')
      }
    }
  })

  it('registerFragment overwrite keeps latest registration', () => {
    registerFragment('Swap', () => ({
      type: 'component',
      id: 'first',
      props: {},
      render: () => h('div', null, text('first')),
    } as any))

    registerFragment('Swap', () => ({
      type: 'component',
      id: 'second',
      props: {},
      render: () => h('div', null, text('second')),
    } as any))

    document.body.innerHTML =
      '<tachui-fragment data-component="Swap" data-component-id="cmp-swap"><div>static</div></tachui-fragment>'

    hydrateFragments()

    expect(document.querySelector('tachui-fragment')?.innerHTML).toContain('second')
  })
})
