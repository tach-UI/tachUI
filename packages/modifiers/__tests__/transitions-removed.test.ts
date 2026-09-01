/**
 * `.transitions()` removal (#297)
 *
 * It was chainable, registered in the modifier registry, and silently
 * discarded: `AnimationModifier.apply` never read `props.transitions`, so the
 * call produced no CSS and no error. Registry lookup succeeded, which is why
 * it did not look like a stub.
 *
 * `.transition()` — singular — is the working API and is asserted here so the
 * removal cannot be mistaken for a loss of capability.
 */

import { JSDOM } from 'jsdom'
import { beforeEach, describe, expect, it } from 'vitest'
import { Text } from '@tachui/primitives'
import { renderComponent } from '@tachui/core'
import '../src/preload/basic'

let dom: JSDOM

beforeEach(() => {
  dom = new JSDOM('<!doctype html><html><body></body></html>', {
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
  document.body.appendChild(host)
  renderComponent(component as any, host)
  return host
}

describe('.transitions() removal (#297)', () => {
  it('is no longer chainable', () => {
    const component = Text('x') as any

    expect(component.transitions).toBeUndefined()
  })

  it('is no longer registered as a modifier', async () => {
    const { globalModifierRegistry } = await import('@tachui/registry')

    expect(globalModifierRegistry.has('transitions')).toBe(false)
  })

  it('still registers the singular transition modifier', async () => {
    const { globalModifierRegistry } = await import('@tachui/registry')

    expect(globalModifierRegistry.has('transition')).toBe(true)
  })

  it('.transition() applies real CSS — the capability is intact', () => {
    const host = render((Text('y') as any).transition('opacity', 500, 'ease-in'))

    expect(host.querySelector('span')!.style.transition).toBe(
      'opacity 500ms ease-in 0ms'
    )
  })
})
