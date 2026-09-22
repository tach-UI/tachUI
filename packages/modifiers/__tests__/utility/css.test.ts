/**
 * `.css()`
 *
 * The escape hatch for properties without a typed modifier. It takes a
 * `Signal` for any value, as `CSSStyleProperties` declares, and updates that
 * property in place. It used to read each signal once in its constructor, so
 * a reactive value froze at its first value.
 */

import { JSDOM } from 'jsdom'
import { beforeEach, describe, expect, it } from 'vitest'
import { Text } from '@tachui/primitives'
import {
  createMemo,
  createSignal,
  flushSync,
  renderComponent,
} from '@tachui/core'
import '../../src/preload/basic'

beforeEach(() => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost',
  })
  for (const k of [
    'document', 'window', 'Element', 'HTMLElement', 'DocumentFragment', 'Node',
  ]) {
    ;(globalThis as any)[k] =
      k === 'document' ? dom.window.document
      : k === 'window' ? dom.window
      : (dom.window as any)[k]
  }
})

// A memo-driven update lands a microtask after the flush, as it does for the
// typed modifiers.
async function flushReactiveUpdates(): Promise<void> {
  flushSync()
  await new Promise<void>(resolve => queueMicrotask(resolve))
}

function render(component: unknown): HTMLElement {
  const host = document.createElement('div')
  renderComponent(component as any, host)
  return host.firstElementChild as HTMLElement
}

describe('.css()', () => {
  it('applies static values, camelCase or kebab-case', () => {
    const element = render(
      (Text('x') as any).css({
        backgroundColor: 'red',
        'text-decoration': 'underline',
      })
    )

    expect(element.style.backgroundColor).toBe('red')
    expect(element.style.textDecoration).toBe('underline')
  })

  // A layered background has no typed modifier: gradients are not valid
  // `background-color`. It is the case the escape hatch exists for.
  it('updates a memo value in place', async () => {
    const [dark, setDark] = createSignal(false)
    const background = createMemo(() =>
      dark()
        ? 'linear-gradient(black, gray)'
        : 'linear-gradient(white, silver)'
    )
    const element = render((Text('x') as any).css({ background }))

    expect(element.style.background).toBe('linear-gradient(white, silver)')

    setDark(true)
    await flushReactiveUpdates()

    expect(element.style.background).toBe('linear-gradient(black, gray)')
  })

  it('mixes signal and static values in one object', () => {
    const [outline, setOutline] = createSignal('1px solid red')
    const element = render(
      (Text('x') as any).css({ outline, cursor: 'pointer' })
    )

    setOutline('2px dashed blue')
    flushSync()

    expect(element.style.outline).toBe('2px dashed blue')
    expect(element.style.cursor).toBe('pointer')
  })

  it('gives a number px, and leaves a unitless property unitless', () => {
    const [opacity, setOpacity] = createSignal(0.5)
    const element = render(
      (Text('x') as any).css({ opacity, marginTop: 4, zIndex: 3 })
    )

    expect(element.style.opacity).toBe('0.5')
    expect(element.style.marginTop).toBe('4px')
    expect(element.style.zIndex).toBe('3')

    setOpacity(0.25)
    flushSync()

    expect(element.style.opacity).toBe('0.25')
  })

  it('takes a signal through cssProperty and cssVariable', () => {
    const [decoration, setDecoration] = createSignal('underline')
    const [accent, setAccent] = createSignal('red')
    const element = render(
      (Text('x') as any)
        .cssProperty('textDecoration', decoration)
        .cssVariable('accent', accent)
    )

    setDecoration('line-through')
    setAccent('blue')
    flushSync()

    expect(element.style.textDecoration).toBe('line-through')
    expect(element.style.getPropertyValue('--accent')).toBe('blue')
  })
})
