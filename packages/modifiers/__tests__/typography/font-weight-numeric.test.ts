/**
 * Numeric font weights outside the hundreds
 *
 * CSS `font-weight` takes any number from 1 to 1000, and variable fonts and
 * platform conventions use values such as 590. The chain passes the number
 * through to the style unchanged.
 */

import { JSDOM } from 'jsdom'
import { beforeEach, describe, expect, it } from 'vitest'
import { Text } from '@tachui/primitives'
import { renderComponent } from '@tachui/core'
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

function render(component: unknown): HTMLElement {
  const host = document.createElement('div')
  renderComponent(component as any, host)
  return host.firstElementChild as HTMLElement
}

describe('numeric font weights', () => {
  it('renders a non-hundred weight from .fontWeight()', () => {
    const element = render(Text('x').fontWeight(590))

    expect(element.style.fontWeight).toBe('590')
  })

  it('renders a non-hundred weight from .font({ weight })', () => {
    const element = render(Text('x').font({ weight: 590 }))

    expect(element.style.fontWeight).toBe('590')
  })

  it('still renders named and hundred weights', () => {
    expect(render(Text('a').fontWeight('bold')).style.fontWeight).toBe('bold')
    expect(render(Text('b').fontWeight(600)).style.fontWeight).toBe('600')
  })
})
