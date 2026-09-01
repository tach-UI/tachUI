/**
 * Button call-form tests (#266)
 *
 * Button was the only primitive taking props third — `Image(src, props)`,
 * `Toggle(isOn, props)` and `Text(content, props)` all take props second.
 * A caller writing `Button(title, props)` landed the whole object in the
 * `action` slot, so every prop on it was dropped at runtime with no signal.
 * Both forms are supported now; these pin both.
 */

import { JSDOM } from 'jsdom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Button, ButtonStyles } from '../../src/controls/Button'
import { renderComponent } from '@tachui/core'
import '@tachui/modifiers/preload/basic'

let dom: JSDOM

beforeEach(() => {
  dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost',
  })
  for (const k of [
    'document', 'window', 'Element', 'HTMLElement',
    'DocumentFragment', 'Node', 'HTMLButtonElement', 'MouseEvent',
  ]) {
    ;(globalThis as any)[k] =
      k === 'document' ? dom.window.document
      : k === 'window' ? dom.window
      : (dom.window as any)[k]
  }
})

function render(component: unknown): HTMLElement {
  const host = document.createElement('div')
  document.body.appendChild(host)
  renderComponent(component as any, host)
  return host
}

describe('Button call forms (#266)', () => {
  it('merges css when props are passed third, after action', () => {
    const host = render(Button('Go', () => {}, { css: 'my-class' }))

    expect(host.querySelector('button')!.className).toContain('my-class')
  })

  // The reported failure: props-second dropped everything silently.
  it('merges css when props are passed second, with action inside them', () => {
    const host = render(Button('Go', { css: 'my-class', action: () => {} }))

    expect(host.querySelector('button')!.className).toContain('my-class')
  })

  it('keeps the base class in both forms', () => {
    const third = render(Button('a', () => {}, { css: 'x' }))
    const second = render(Button('b', { css: 'x' }))

    expect(third.querySelector('button')!.className).toContain('tachui-button')
    expect(second.querySelector('button')!.className).toContain('tachui-button')
  })

  it('wires the action in the props-second form', () => {
    const action = vi.fn()
    const host = render(Button('Go', { action }))

    host.querySelector('button')!.dispatchEvent(
      new dom.window.MouseEvent('click', { bubbles: true })
    )

    expect(action).toHaveBeenCalledTimes(1)
  })

  it('still wires the action in the action-second form', () => {
    const action = vi.fn()
    const host = render(Button('Go', action))

    host.querySelector('button')!.dispatchEvent(
      new dom.window.MouseEvent('click', { bubbles: true })
    )

    expect(action).toHaveBeenCalledTimes(1)
  })

  // Regression: an explicit undefined in the action slot must still read props
  // from the third argument. The first cut of this fix treated it as the
  // props-second form and silently discarded the third argument.
  it('reads props from the third argument when action is explicitly undefined', () => {
    const host = render(Button('Go', undefined, { css: 'my-class' }))

    expect(host.querySelector('button')!.className).toContain('my-class')
  })

  it('handles an explicit undefined on the variants too', () => {
    const host = render(
      ButtonStyles.Filled('Go', undefined, { css: 'v-undef' })
    )

    expect(host.querySelector('button')!.className).toContain('v-undef')
  })

  it('accepts a bare title with no second argument', () => {
    const host = render(Button('Go'))

    expect(host.querySelector('button')!.textContent).toContain('Go')
  })

  it('supports both forms on the ButtonStyles variants', () => {
    const third = render(ButtonStyles.Filled('a', () => {}, { css: 'v-third' }))
    const second = render(ButtonStyles.Filled('b', { css: 'v-second' }))

    expect(third.querySelector('button')!.className).toContain('v-third')
    expect(second.querySelector('button')!.className).toContain('v-second')
  })

  it('does not let the variant preset be overridden away by props-second', () => {
    const host = render(ButtonStyles.Destructive('Delete', { css: 'danger' }))
    const cls = host.querySelector('button')!.className

    expect(cls).toContain('danger')
    expect(cls).toContain('tachui-button')
  })
})
