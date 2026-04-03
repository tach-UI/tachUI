import type { ComponentInstance, DOMNode } from '@tachui/core'
import {
  Assets,
  createColorAsset,
  createGoogleFont,
  createImageAsset,
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
})
