/**
 * README quick-start verification (#236)
 *
 * The README's "Your First Component" sample told users to import components
 * from @tachui/core, which stopped exporting them in the 0.8 modular split —
 * so the first code a new user ran did not compile. This file holds that
 * sample verbatim. If the public API moves again, this fails instead of the
 * user's first five minutes.
 *
 * Keep the code inside `quickStartExample` byte-identical to the README block.
 */

import { JSDOM } from 'jsdom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

// --- README sample: imports -------------------------------------------------
import { createSignal, mount } from '../../src'
import { flushSync } from '../../src/reactive'
import { Button, Text, VStack } from '@tachui/primitives'
// ---------------------------------------------------------------------------

import '@tachui/modifiers/preload/basic'

let dom: JSDOM

beforeEach(() => {
  dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
    url: 'http://localhost',
  })
  globalThis.document = dom.window.document as any
  globalThis.window = dom.window as any
  globalThis.Element = dom.window.Element as any
  globalThis.HTMLElement = dom.window.HTMLElement as any
  globalThis.DocumentFragment = dom.window.DocumentFragment as any
  globalThis.Node = dom.window.Node as any
})

afterEach(() => {
  dom.window.close()
})

// --- README sample: body ----------------------------------------------------
function CounterApp() {
  const [count, setCount] = createSignal(0)

  return VStack({
    children: [
      Text(() => `Count: ${count()}`)
        .fontSize(24)
        .fontWeight('bold')
        .foregroundColor('#007AFF'),

      Button('Increment', () => setCount(count() + 1))
        .backgroundColor('#007AFF')
        .foregroundColor('white')
        .padding({ horizontal: 24, vertical: 12 })
        .cornerRadius(8),
    ],
    spacing: 16,
    alignment: 'center',
  })
}
// ---------------------------------------------------------------------------

describe('README quick start (#236)', () => {
  it('compiles and renders with the documented import shape', () => {
    const dispose = mount(() => CounterApp())

    const container = document.getElementById('app')!
    expect(container.textContent).toContain('Count: 0')

    dispose()
  })

  it('is interactive: the button updates the rendered count', () => {
    const dispose = mount(() => CounterApp())
    const container = document.getElementById('app')!

    const button = container.querySelector('button')
    expect(button).not.toBeNull()

    button!.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }))
    flushSync()

    expect(container.textContent).toContain('Count: 1')
    dispose()
  })
})
