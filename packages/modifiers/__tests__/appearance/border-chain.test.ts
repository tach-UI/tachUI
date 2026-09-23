/**
 * `.border()` at every chain position
 *
 * A chain on a component resolves `.border` through the registry, and a chain
 * on `.modifier` through the builder's own method. The builder's method took
 * two arguments and dropped a third, so `.border(1, 'blue', 'dashed')` drew a
 * solid border there while the same call on a component drew a dashed one.
 */

import { JSDOM } from 'jsdom'
import { beforeEach, describe, expect, it } from 'vitest'
import { Text, VStack } from '@tachui/primitives'
import { createSignal, flushSync, renderComponent } from '@tachui/core'
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

async function flushReactiveUpdates(): Promise<void> {
  flushSync()
  await new Promise<void>(resolve => queueMicrotask(resolve))
}

function render(component: unknown): HTMLElement {
  const host = document.createElement('div')
  renderComponent(component as any, host)
  return host.firstElementChild as HTMLElement
}

function stack() {
  return VStack({ children: [], spacing: 0 })
}

function expectBorder(
  element: HTMLElement,
  width: string,
  color: string,
  style: string
) {
  expect(element.style.borderWidth).toBe(width)
  expect(element.style.borderColor).toBe(color)
  expect(element.style.borderStyle).toBe(style)
}

describe('.border(width, color, style)', () => {
  it('applies the style on a component chain', () => {
    expectBorder(
      render(stack().border(1, 'blue', 'dashed')),
      '1px',
      'blue',
      'dashed'
    )
  })

  it('applies the style directly on .modifier', () => {
    expectBorder(
      render(stack().modifier.border(1, 'blue', 'dashed').build()),
      '1px',
      'blue',
      'dashed'
    )
  })

  it('applies the style after .backgroundColor()', () => {
    const element = render(
      stack()
        .modifier.backgroundColor('red')
        .border(1, 'blue', 'dashed')
        .build()
    )

    expect(element.style.backgroundColor).toBe('red')
    expectBorder(element, '1px', 'blue', 'dashed')
  })

  it('applies the style after .css(), .padding() and .cornerRadius()', () => {
    const afterCss = stack()
      .modifier.css({})
      .backgroundColor('red')
      .border(1, 'blue', 'dashed')
      .build()
    const afterPadding = stack()
      .modifier.padding(4)
      .border(1, 'blue', 'dashed')
      .build()
    const afterCornerRadius = stack()
      .modifier.cornerRadius(4)
      .border(1, 'blue', 'dashed')
      .build()

    for (const component of [afterCss, afterPadding, afterCornerRadius]) {
      expectBorder(render(component), '1px', 'blue', 'dashed')
    }
  })

  it('applies a reactive width with a style', async () => {
    const [width, setWidth] = createSignal(1)
    const element = render(
      stack().modifier.border(width, 'blue', 'dotted').build()
    )

    expectBorder(element, '1px', 'blue', 'dotted')

    setWidth(3)
    await flushReactiveUpdates()

    expectBorder(element, '3px', 'blue', 'dotted')
  })
})

describe('.border() two-argument and options forms', () => {
  it('defaults the two-argument form to solid', () => {
    expectBorder(
      render(stack().modifier.backgroundColor('red').border(1, 'blue').build()),
      '1px',
      'blue',
      'solid'
    )
    expectBorder(
      render(stack().border(1, 'blue')),
      '1px',
      'blue',
      'solid'
    )
  })

  it('takes the style from the options form, with a signal color', async () => {
    const [color, setColor] = createSignal('blue')
    const element = render(
      stack()
        .modifier.backgroundColor('red')
        .border({ width: 1.5, color, style: 'dashed' })
        .build()
    )

    expectBorder(element, '1.5px', 'blue', 'dashed')

    setColor('green')
    await flushReactiveUpdates()

    expect(element.style.borderColor).toBe('green')
    expect(element.style.borderStyle).toBe('dashed')
  })
})
