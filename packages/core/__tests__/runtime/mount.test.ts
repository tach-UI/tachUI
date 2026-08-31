/**
 * Application mounting tests (#237)
 *
 * `mount`, `unmount` and `updateProps` shipped as exported no-op placeholders
 * while the only working bootstrap, `mountRoot`, was undocumented and hardcoded
 * to `#app`. These pin the real contract: mount renders, returns a working
 * dispose function, resolves a configurable target, and fails loudly when the
 * target is missing rather than doing nothing.
 */

import { JSDOM } from 'jsdom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, mountRoot, unmount } from '../../src/runtime/dom-bridge'
import { getCurrentComponentContextOrNull } from '../../src/runtime/component-context'
import { createComponent } from '../../src/runtime/component'
import { createEffect, createSignal, flushSync } from '../../src/reactive'
import { h } from '../../src/runtime/renderer'
import type { ComponentInstance } from '../../src/runtime/types'

let dom: JSDOM

function App(label = 'Hello'): ComponentInstance {
  return createComponent(() => h('span', { id: 'greeting' }, label))({})
}

beforeEach(() => {
  dom = new JSDOM(
    '<!doctype html><html><body><div id="app"></div><div id="root"></div></body></html>',
    { url: 'http://localhost' }
  )
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

describe('mount (#237)', () => {
  it('renders the root component into the default #app container', () => {
    mount(() => App('Hello'))

    const container = document.getElementById('app')!
    expect(container.textContent).toContain('Hello')
  })

  it('mounts into a CSS selector target other than #app', () => {
    mount(() => App('Elsewhere'), '#root')

    expect(document.getElementById('root')!.textContent).toContain('Elsewhere')
    expect(document.getElementById('app')!.textContent).toBe('')
  })

  it('accepts an element as the target', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    mount(() => App('Direct'), container)

    expect(container.textContent).toContain('Direct')
  })

  it('returns a dispose function that removes the rendered output', () => {
    const dispose = mount(() => App('Transient'))
    const container = document.getElementById('app')!
    expect(container.textContent).toContain('Transient')

    dispose()

    expect(container.textContent).not.toContain('Transient')
  })

  it('is safe to dispose more than once', () => {
    const dispose = mount(() => App())

    dispose()
    expect(() => dispose()).not.toThrow()
  })

  // The old placeholder returned undefined and did nothing, so a missing
  // container produced a blank page with no error anywhere.
  it('throws a message naming the missing selector', () => {
    expect(() => mount(() => App(), '#nope')).toThrow(/no element matches "#nope"/)
  })
})

// Lifecycle correctness — all three were review findings on the first cut of
// mount(), and all three are silent: nothing throws, the DOM looks right, and
// the leak only shows up later.
describe('mount lifecycle', () => {
  it('clears the ambient component context on dispose', () => {
    const dispose = mount(() => App())
    dispose()

    // The first implementation returned a context-reset closure out of the
    // createRoot callback. createRoot hands that value to its *caller*, which
    // mount discarded — so the reset never ran and State() outside a render
    // could still bind to the disposed root.
    expect(getCurrentComponentContextOrNull()).toBeNull()
  })

  // A leaked root is invisible in the DOM — the giveaway is that effects it
  // owns keep running. Both of these assert on that rather than on markup.
  it('disposes the reactive root when the root function throws', () => {
    const [tick, setTick] = createSignal(0)
    let runs = 0

    expect(() =>
      mount(() => {
        createEffect(() => {
          tick()
          runs++
        })
        throw new Error('root exploded')
      })
    ).toThrow('root exploded')

    const runsAtThrow = runs
    setTick(1)
    flushSync()

    // Still live means the root outlived a mount that never completed.
    expect(runs).toBe(runsAtThrow)
    expect(unmount()).toBe(false)
    expect(getCurrentComponentContextOrNull()).toBeNull()
  })

  it('disposes the previous reactive root when mounting over the same container', () => {
    const [tick, setTick] = createSignal(0)
    let runs = 0

    mount(() => {
      createEffect(() => {
        tick()
        runs++
      })
      return App('First')
    })

    const runsBeforeReplace = runs
    mount(() => App('Second'))

    const container = document.getElementById('app')!
    expect(container.textContent).toContain('Second')
    expect(container.textContent).not.toContain('First')

    setTick(1)
    flushSync()
    expect(runs).toBe(runsBeforeReplace)
  })

  it('a stale disposer does not evict a newer app at the same container', () => {
    const disposeFirst = mount(() => App('First'))
    mount(() => App('Second'))

    // The first handle is already spent — mounting over it disposed it.
    disposeFirst()

    // The second app must still be registered and unmountable.
    expect(unmount()).toBe(true)
    expect(document.getElementById('app')!.textContent).not.toContain('Second')
  })

  it('a stale disposer does not tear down the newer app\'s DOM', () => {
    const disposeFirst = mount(() => App('First'))
    mount(() => App('Second'))
    const container = document.getElementById('app')!

    disposeFirst()

    expect(container.textContent).toContain('Second')
  })
})

describe('unmount (#237)', () => {
  it('unmounts the app mounted at a target', () => {
    mount(() => App('Bye'))
    const container = document.getElementById('app')!
    expect(container.textContent).toContain('Bye')

    expect(unmount()).toBe(true)
    expect(container.textContent).not.toContain('Bye')
  })

  it('reports false when nothing is mounted there', () => {
    expect(unmount('#root')).toBe(false)
  })

  it('reports false rather than throwing for a missing target', () => {
    expect(unmount('#nope')).toBe(false)
  })
})

describe('mountRoot (#237)', () => {
  it('still mounts into #app', () => {
    mountRoot(() => App('Legacy'))

    expect(document.getElementById('app')!.textContent).toContain('Legacy')
  })

  it('is unmountable through unmount(), since it delegates to mount()', () => {
    mountRoot(() => App('Legacy'))

    expect(unmount()).toBe(true)
    expect(document.getElementById('app')!.textContent).not.toContain('Legacy')
  })
})
