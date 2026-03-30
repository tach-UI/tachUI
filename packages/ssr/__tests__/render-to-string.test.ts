import type { ComponentInstance, DOMNode } from '@tachui/core'
import { createSignal, h, text } from '@tachui/core'
import { describe, expect, it } from 'vitest'
import { renderToString } from '../src/render-to-string'

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
})
