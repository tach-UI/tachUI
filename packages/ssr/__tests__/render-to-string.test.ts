import type { ComponentInstance, DOMNode } from '@tachui/core'
import { createSignal, h, text } from '@tachui/core'
import { describe, expect, it } from 'vitest'
import { renderToString } from '../src/render-to-string'
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

  it('serializes ModifierBuilder-like inputs via build()', () => {
    const builder: ModifierBuilderLike = {
      build: () => h('article', null, text('Built')),
    }

    expect(renderToString(builder)).toBe('<article>Built</article>')
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
})
