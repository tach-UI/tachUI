import type { ComponentInstance, DOMNode } from '@tachui/core'
import {
  Assets,
  createComponent as createRuntimeComponent,
  createColorAsset,
  createRoot,
  createGoogleFont,
  createImageAsset,
  getCurrentComponentContext,
  createSignal,
  h,
  registerAsset,
  text,
} from '@tachui/core'
import { AnimationModifier } from '@tachui/core/modifiers'
import { animation, transform } from '@tachui/modifiers/animation'
import { blendMode } from '@tachui/modifiers/appearance/blend-mode'
import { zIndex } from '@tachui/modifiers/layout/z-index'
import { describe, expect, it, vi } from 'vitest'
import { HoverModifier } from '../../modifiers/src/effects/effects/index'
import { ResponsiveModifier } from '../../responsive/src/modifiers/responsive/responsive-modifier'
import { createSSRContext, renderToString } from '../src/render-to-string'
import type { ModifierBuilderLike } from '../src/types'

function createComponent(render: () => DOMNode): ComponentInstance {
  return {
    type: 'component',
    id: 'ssr-test-component',
    props: {},
    render,
  } as ComponentInstance
}

describe('renderToString', () => {
  it('renders a component tree to HTML', () => {
    const app = createComponent(() =>
      h(
        'main',
        { className: ['page', { ready: true }] },
        h('h1', null, text('Hello SSR'))
      )
    )

    const html = renderToString(app)

    expect(html).toBe('<main class="page ready"><h1>Hello SSR</h1></main>')
  })

  it('resolves signal values as snapshot text and attributes', () => {
    const [count, setCount] = createSignal(1)
    const app = createComponent(() =>
      h('span', { 'data-count': count }, text(() => `Count: ${count()}`))
    )

    expect(renderToString(app)).toBe('<span data-count="1">Count: 1</span>')
    setCount(2)
    expect(renderToString(app)).toBe('<span data-count="2">Count: 2</span>')
  })

  it('omits event handlers and serializes style/class props', () => {
    const html = renderToString(
      h(
        'button',
        {
          className: ['cta', { active: true }],
          style: {
            backgroundColor: 'tomato',
            '--button-radius': '8px',
          },
          disabled: true,
          onClick: () => {},
        },
        text('Join')
      )
    )

    expect(html).toContain('class="cta active"')
    expect(html).toContain('style="background-color:tomato;--button-radius:8px"')
    expect(html).toContain('disabled')
    expect(html).not.toContain('onClick')
  })

  it('escapes text and attribute content', () => {
    const html = renderToString(
      h('p', { title: '5 > 3 "quoted"' }, text('A&B < C'))
    )

    expect(html).toBe('<p title="5 &gt; 3 &quot;quoted&quot;">A&amp;B &lt; C</p>')
  })

  it('supports doctype option', () => {
    const html = renderToString(h('div', null, text('ok')), {
      includeDoctype: true,
    })

    expect(html).toBe('<!doctype html><div>ok</div>')
  })

  it('does not close void elements', () => {
    expect(renderToString(h('br'))).toBe('<br>')
    expect(renderToString(h('img', { src: '/logo.png', alt: 'Logo' }))).toBe(
      '<img src="/logo.png" alt="Logo">'
    )
  })

  it('returns empty string for nullish and boolean primitive inputs', () => {
    expect(renderToString(null)).toBe('')
    expect(renderToString(undefined)).toBe('')
    expect(renderToString(false)).toBe('')
    expect(renderToString(true)).toBe('')
  })

  it('serializes number and array inputs', () => {
    expect(renderToString(42)).toBe('42')
    expect(
      renderToString([h('span', null, text('a')), h('span', null, text('b'))])
    ).toBe('<span>a</span><span>b</span>')
  })

  it('serializes nested component trees', () => {
    const child = createComponent(() => h('em', null, text('child')))
    const parent = createComponent(() => h('div', null, child.render()))

    expect(renderToString(parent)).toBe('<div><em>child</em></div>')
  })

  it('serializes when render() returns another component instance', () => {
    const leaf = createComponent(() => h('strong', null, text('leaf')))
    const middle = createComponent(() => leaf as unknown as DOMNode)
    const parent = createComponent(() => middle as unknown as DOMNode)

    expect(renderToString(parent)).toBe('<strong>leaf</strong>')
  })

  it('serializes ModifierBuilder-like inputs via build()', () => {
    const builder: ModifierBuilderLike = {
      build: () => h('article', null, text('Built')),
    }

    expect(renderToString(builder)).toBe('<article>Built</article>')
  })

  it('prefers component render() when input also has build()', () => {
    const componentWithBuild = {
      type: 'component',
      id: 'dual-shape-component',
      props: {},
      render: () => h('section', null, text('Rendered path')),
      build: () => h('article', null, text('Builder path')),
    } as unknown as ComponentInstance & ModifierBuilderLike

    expect(renderToString(componentWithBuild)).toBe(
      '<section>Rendered path</section>'
    )
  })

  it('throws clear error when builder build() returns itself', () => {
    const loopingBuilder: ModifierBuilderLike = {
      build() {
        return this as unknown as DOMNode
      },
    }

    expect(() => renderToString(loopingBuilder)).toThrow(
      'Modifier build() returned itself'
    )
  })

  it('throws clear error for cyclic builder chains', () => {
    const builderA: ModifierBuilderLike = {
      build: () => builderB as unknown as DOMNode,
    }

    const builderB: ModifierBuilderLike = {
      build: () => builderA as unknown as DOMNode,
    }

    expect(() => renderToString(builderA)).toThrow(
      'Detected cyclic builder input'
    )
  })

  it('emits aria attributes with explicit true string values', () => {
    const html = renderToString(h('div', { 'aria-hidden': true }))
    expect(html).toBe('<div aria-hidden="true"></div>')
  })

  it('converts common camelCase prop names to HTML attribute names', () => {
    const html = renderToString(
      h('label', {
        htmlFor: 'name',
        tabIndex: 0,
        readOnly: true,
      })
    )

    expect(html).toBe('<label for="name" tabindex="0" readonly></label>')
  })

  it('resolves signal values inside className objects and style objects', () => {
    const [isActive, setIsActive] = createSignal(true)
    const [size, setSize] = createSignal('14px')

    const node = h('div', {
      className: { active: isActive, quiet: false },
      style: {
        fontSize: size,
      },
    })

    expect(renderToString(node)).toBe(
      '<div class="active" style="font-size:14px"></div>'
    )

    setIsActive(false)
    setSize('16px')

    expect(renderToString(node)).toBe('<div style="font-size:16px"></div>')
  })

  it('serializes reactive text nodes', () => {
    const [value, setValue] = createSignal('first')
    const node = h('p', null, text(() => value()))

    expect(renderToString(node)).toBe('<p>first</p>')
    setValue('second')
    expect(renderToString(node)).toBe('<p>second</p>')
  })

  it('serializes comment nodes and sanitizes closing markers', () => {
    const commentNode: DOMNode = { type: 'comment', text: '5 > 3 --> ok' }
    expect(renderToString(commentNode)).toBe('<!--5 > 3 --\\u003E ok-->')
  })

  it('emits data-component-id from node metadata', () => {
    const node = h('section') as DOMNode & { componentId: string }
    node.componentId = 'cmp-1'

    expect(renderToString(node)).toBe('<section data-component-id="cmp-1"></section>')
  })

  it('wraps marked nodes in <tachui-fragment> when fragment serialization is interactive', () => {
    const context = createSSRContext() as any
    const fragments: Array<{ componentId: string; componentName: string }> = []
    context.fragmentSerialization = {
      onFragment: (fragment: { componentId: string; componentName: string }) => {
        fragments.push(fragment)
      },
    }

    const node = h('section', null, text('Count')) as DOMNode
    node.__tachui_fragment = {
      componentId: 'cmp-1',
      componentName: 'Counter',
      snapshotData: { count: 1 },
    }

    expect(renderToString(node, { context })).toBe(
      '<tachui-fragment data-component="Counter" data-component-id="cmp-1" data-state="{&quot;count&quot;:1}"><section>Count</section></tachui-fragment>'
    )
    expect(fragments).toEqual([
      {
        componentId: 'cmp-1',
        componentName: 'Counter',
        snapshotData: { count: 1 },
      },
    ])
  })

  it('wraps marked nodes in <tachui-fragment> by default without fragment context hooks', () => {
    const node = h('section', null, text('Count')) as DOMNode
    node.__tachui_fragment = {
      componentId: 'cmp-default',
      componentName: 'Counter',
    }

    expect(renderToString(node)).toBe(
      '<tachui-fragment data-component="Counter" data-component-id="cmp-default"><section>Count</section></tachui-fragment>'
    )
  })

  it('collects marked nodes without wrapper when fragment serialization is non-interactive', () => {
    const context = createSSRContext() as any
    const fragments: Array<{ componentId: string; componentName: string }> = []
    context.fragmentSerialization = {
      onFragment: (fragment: { componentId: string; componentName: string }) => {
        fragments.push(fragment)
      },
    }

    const node = h('section', null, text('Count')) as DOMNode
    node.__tachui_fragment = {
      componentId: 'cmp-2',
      componentName: 'Counter',
    }

    expect(renderToString(node, { context, interactive: false })).toBe(
      '<section>Count</section>'
    )
    expect(fragments).toEqual([{ componentId: 'cmp-2', componentName: 'Counter' }])
  })

  it('suppresses wrappers without fragment context when interactive is false', () => {
    const node = h('section', null, text('Count')) as DOMNode
    node.__tachui_fragment = {
      componentId: 'cmp-plain-static',
      componentName: 'Counter',
    }

    expect(renderToString(node, { interactive: false })).toBe(
      '<section>Count</section>'
    )
  })

  it('wraps marked void elements in interactive mode', () => {
    const node = h('img', { src: '/hero.png', alt: 'Hero' }) as DOMNode
    node.__tachui_fragment = {
      componentId: 'cmp-img-1',
      componentName: 'HeroImage',
    }

    expect(renderToString(node)).toBe(
      '<tachui-fragment data-component="HeroImage" data-component-id="cmp-img-1"><img src="/hero.png" alt="Hero"></tachui-fragment>'
    )
  })

  it('suppresses nested fragment wrappers and nested collection callbacks', () => {
    const context = createSSRContext() as any
    const fragments: Array<{ componentId: string; componentName: string }> = []
    context.fragmentSerialization = {
      onFragment: (fragment: { componentId: string; componentName: string }) => {
        fragments.push(fragment)
      },
    }

    const child = h('span', null, text('Inner')) as DOMNode
    child.__tachui_fragment = {
      componentId: 'cmp-inner',
      componentName: 'Inner',
    }

    const parent = h('section', null, child) as DOMNode
    parent.__tachui_fragment = {
      componentId: 'cmp-outer',
      componentName: 'Outer',
    }

    expect(renderToString(parent, { context })).toBe(
      '<tachui-fragment data-component="Outer" data-component-id="cmp-outer"><section><span>Inner</span></section></tachui-fragment>'
    )
    expect(fragments).toEqual([
      { componentId: 'cmp-outer', componentName: 'Outer' },
    ])
  })

  it('omits data-state when snapshotData is empty', () => {
    const node = h('section', null, text('Count')) as DOMNode
    node.__tachui_fragment = {
      componentId: 'cmp-empty-state',
      componentName: 'Counter',
      snapshotData: {},
    }

    expect(renderToString(node)).toBe(
      '<tachui-fragment data-component="Counter" data-component-id="cmp-empty-state"><section>Count</section></tachui-fragment>'
    )
  })

  it('serializes array-like snapshotData payloads when provided', () => {
    const node = h('section', null, text('Count')) as DOMNode
    node.__tachui_fragment = {
      componentId: 'cmp-array-state',
      componentName: 'Counter',
      snapshotData: [1, 2, 3] as unknown as Record<string, unknown>,
    }

    expect(renderToString(node)).toBe(
      '<tachui-fragment data-component="Counter" data-component-id="cmp-array-state" data-state="[1,2,3]"><section>Count</section></tachui-fragment>'
    )
  })

  it('omits data-state and warns when snapshotData is not serializable', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const node = h('section', null, text('Count')) as DOMNode
    const circular: Record<string, unknown> = {}
    circular.self = circular
    node.__tachui_fragment = {
      componentId: 'cmp-bad-state',
      componentName: 'Counter',
      snapshotData: circular,
    }

    try {
      expect(renderToString(node)).toBe(
        '<tachui-fragment data-component="Counter" data-component-id="cmp-bad-state"><section>Count</section></tachui-fragment>'
      )
      expect(warnSpy).toHaveBeenCalledWith(
        '[tachUI/ssr] Fragment snapshotData could not be serialized; data-state omitted.'
      )
    } finally {
      warnSpy.mockRestore()
    }
  })

  it('does not emit __tachui_fragment metadata as an HTML attribute', () => {
    const node = h('section') as DOMNode
    node.__tachui_fragment = {
      componentId: 'cmp-1',
      componentName: 'Stories',
      snapshotData: { mode: 'preview' },
    }

    const html = renderToString(node, { interactive: false })
    expect(html).toBe('<section></section>')
    expect(html).not.toContain('__tachui_fragment')
    expect(html).not.toContain('tachui_fragment')
  })

  it('emits stable deterministic data-component-id across component renders', () => {
    const Counter = createRuntimeComponent(
      () => {
        const node = h('div', null, text('Counter')) as DOMNode & {
          componentId?: string
        }
        node.componentId = getCurrentComponentContext().id
        return node
      },
      { displayName: 'Counter' }
    )

    let htmlFirst = ''
    let htmlSecond = ''
    createRoot((dispose) => {
      htmlFirst = renderToString(Counter({}))
      htmlSecond = renderToString(Counter({}))
      dispose()
    })

    expect(htmlFirst).toBe(
      '<div data-component-id="app:counter:0">Counter</div>'
    )
    expect(htmlSecond).toBe(htmlFirst)
  })

  it('omits key and ref props from serialized attributes', () => {
    const html = renderToString(
      h('div', {
        key: 'node-key',
        ref: { current: null },
        id: 'visible',
      })
    )
    expect(html).toBe('<div id="visible"></div>')
  })

  it('omits internal renderer metadata props from serialized attributes', () => {
    const html = renderToString(
      h('span', {
        componentMetadata: { originalType: 'Text' },
        debugLabel: 'StoryTitle',
        title: 'Stories',
      })
    )

    expect(html).toBe('<span title="Stories"></span>')
    expect(html).not.toContain('componentmetadata=')
    expect(html).not.toContain('debuglabel=')
  })

  it('escapes script-like text content to prevent HTML injection', () => {
    const html = renderToString(
      h('p', null, text('<script>alert("xss")</script>'))
    )
    expect(html).toBe(
      '<p>&lt;script&gt;alert("xss")&lt;/script&gt;</p>'
    )
  })

  it('supports style as plain string and keeps boolean html attributes bare', () => {
    const html = renderToString(
      h('input', {
        style: 'display:block;color:red',
        disabled: true,
      })
    )
    expect(html).toBe('<input style="display:block;color:red" disabled>')
  })

  it('applies node modifiers before serializing styles', () => {
    const node = h('div', {
      style: {
        display: 'flex',
      },
    }) as DOMNode & { modifiers: unknown[] }

    node.modifiers = [blendMode('multiply')]

    const html = renderToString(node)

    expect(html).toContain('display:flex')
    expect(html).toContain('mix-blend-mode:multiply')
  })

  it('applies SSR-safe layout and animation modifiers without DOM globals', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    try {
      const node = h('div', {
        style: {
          display: 'block',
        },
      }) as DOMNode & { modifiers: unknown[] }

      node.modifiers = [
        zIndex(20),
        transform('translateX(8px)'),
        new AnimationModifier({
          transition: {
            property: 'opacity',
            duration: 240,
            easing: 'ease-in-out',
            delay: 0,
          },
        }),
        animation({
          keyframes: {
            from: { opacity: '0' },
            to: { opacity: '1' },
          },
          duration: 180,
        } as never),
      ]

      const html = renderToString(node)

      expect(errorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Failed to apply modifier')
      )
      expect(html).toContain('display:block')
      expect(html).toContain('z-index:20')
      expect(html).toContain('transform:translateX(8px)')
      expect(html).toContain('transition:opacity 240ms ease-in-out 0ms')
    } finally {
      errorSpy.mockRestore()
    }
  })

  it('collects SSR head entries from assets via context', () => {
    registerAsset(
      'ssr-context-font',
      createGoogleFont('Inter', [400], 'ssr-context-font')
    )
    registerAsset(
      'ssr-context-color',
      createColorAsset('#111111', '#efefef', 'ssr-context-color')
    )
    registerAsset(
      'ssr-context-image',
      createImageAsset('/hero-light.png', '/hero-light.png', '/hero-dark.png', 'ssr-context-image')
    )

    const context = createSSRContext()
    const html = renderToString(
      h('img', {
        src: (Assets as any)['ssr-context-image'],
        style: {
          fontFamily: (Assets as any)['ssr-context-font'],
          color: (Assets as any)['ssr-context-color'],
        },
      }),
      { context }
    )

    expect(html).toContain('src="/hero-light.png"')
    expect(context.links.some(link => link.includes('fonts.googleapis.com'))).toBe(true)
    expect(context.links.some(link => link.includes('as="image"'))).toBe(true)
    expect(context.styles.some(style => style.includes('--tachui-color-ssr-context-color'))).toBe(true)
  })

  it('prefers SSR context collection over DOM font injection when context is present', () => {
    registerAsset(
      'ssr-no-dom-font',
      createGoogleFont('Rokkitt', [400], 'ssr-no-dom-font')
    )

    const originalDocument = (globalThis as any).document
    const originalWindow = (globalThis as any).window
    const createElementSpy = vi.fn(() => ({
      set rel(_value: string) {},
      set href(_value: string) {},
    }))

    ;(globalThis as any).document = {
      createElement: createElementSpy,
      head: { appendChild: vi.fn() },
      querySelector: vi.fn(() => null),
      fonts: { ready: Promise.resolve(), check: vi.fn(() => true) },
    }
    ;(globalThis as any).window = {}

    try {
      const context = createSSRContext()
      renderToString(
        h('div', {
          style: {
            fontFamily: (Assets as any)['ssr-no-dom-font'],
          },
        }),
        { context }
      )

      expect(createElementSpy).not.toHaveBeenCalled()
      expect(context.links.some(link => link.includes('fonts.googleapis.com'))).toBe(true)
    } finally {
      ;(globalThis as any).document = originalDocument
      ;(globalThis as any).window = originalWindow
    }
  })

  it('collects static CSS rules from modifiers implementing getStaticCSS', () => {
    const node = h('div', {
      style: {
        display: 'block',
      },
    }) as DOMNode & { modifiers: unknown[]; componentId: string }

    node.componentId = 'cmp-static-css'
    node.modifiers = [
      new AnimationModifier({
        animation: {
          keyframes: {
            from: { opacity: '0' },
            to: { opacity: '1' },
          },
          duration: 180,
        },
      }),
      new HoverModifier({
        hoverStyles: { backgroundColor: '#f3f3f3' },
      }),
    ]

    const context = createSSRContext()
    renderToString(node, { context })

    const collected = context.styles.join('\n')
    expect(collected).toContain('@keyframes')
    expect(collected).toContain('[data-component-id="cmp-static-css"]')
    expect(collected).toContain(':hover')
    expect(collected).not.toContain('!important')
  })

  it('collects static @media rules from responsive modifiers during SSR', () => {
    const node = h('div') as DOMNode & { modifiers: unknown[]; componentId: string }
    node.componentId = 'cmp-responsive-css'
    node.modifiers = [
      new ResponsiveModifier({
        fontSize: {
          sm: '14px',
          md: '18px',
        },
      }),
    ]

    const context = createSSRContext()
    renderToString(node, { context })

    const collected = context.styles.join('\n')
    expect(collected).toContain('@media')
    expect(collected).toContain('[data-component-id="cmp-responsive-css"]')
    expect(collected).toContain('font-size')
  })

  describe('padding/margin object serialization', () => {
    it('serializes padding object with horizontal/vertical to CSS properties', () => {
      const html = renderToString(
        h('div', {
          style: {
            padding: { horizontal: 12, vertical: 8 },
          },
        })
      )

      expect(html).toContain('padding-left:12px')
      expect(html).toContain('padding-right:12px')
      expect(html).toContain('padding-top:8px')
      expect(html).toContain('padding-bottom:8px')
      expect(html).not.toContain('[object Object]')
    })

    it('serializes padding object with individual sides', () => {
      const html = renderToString(
        h('div', {
          style: {
            padding: { top: 10, right: 20, bottom: 30, left: 40 },
          },
        })
      )

      expect(html).toContain('padding-top:10px')
      expect(html).toContain('padding-right:20px')
      expect(html).toContain('padding-bottom:30px')
      expect(html).toContain('padding-left:40px')
    })

    it('serializes padding object with all property', () => {
      const html = renderToString(
        h('div', {
          style: {
            padding: { all: 16 },
          },
        })
      )

      expect(html).toContain('padding:16px')
    })

    it('serializes margin object with horizontal/vertical', () => {
      const html = renderToString(
        h('div', {
          style: {
            margin: { horizontal: '2rem', vertical: '1rem' },
          },
        })
      )

      expect(html).toContain('margin-left:2rem')
      expect(html).toContain('margin-right:2rem')
      expect(html).toContain('margin-top:1rem')
      expect(html).toContain('margin-bottom:1rem')
    })

    it('individual sides override horizontal/vertical in padding object', () => {
      const html = renderToString(
        h('div', {
          style: {
            padding: { horizontal: 12, left: 20 },
          },
        })
      )

      expect(html).toContain('padding-left:20px')
      expect(html).toContain('padding-right:12px')
    })
  })
})
