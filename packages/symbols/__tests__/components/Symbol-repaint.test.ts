/**
 * A symbol repaints when its icon resolves, without disturbing anything around
 * it (#303).
 *
 * `Symbol()` loads asynchronously and had nowhere correct to repaint from.
 * Reading its state in `render()` subscribed the *enclosing* component, so
 * every resolved icon re-rendered the whole surrounding subtree. Owning a scope
 * and patching the mounted element instead broke four other ways, each
 * reproduced here: a disposed and re-rendered symbol never repainted again, a
 * layout that hands the renderer a copy of the node never painted at all,
 * modifier styles and classes were wiped by the load, and a fresh instance on a
 * parent re-render left both the spinner and the icon mounted.
 *
 * `render()` now describes and the renderer subscribes: classes and styles go
 * over as memos, the icon as a `reactiveElement` accessor.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import { createSignal, flushSync, renderComponent, DOMRenderer, h } from '@tachui/core'
import type { DOMNode } from '@tachui/core'
import { Layout } from '@tachui/core/components'
import { Symbol } from '../../src/components/Symbol.js'
import { IconLoader } from '../../src/utils/icon-loader.js'
import { IconSetRegistry } from '../../src/icon-sets/registry.js'
import { LucideIconSet } from '../../src/icon-sets/lucide.js'

vi.mock('lucide/dist/esm/icons/heart.js', () => ({
  default: {
    body: '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>',
  },
}))

/** The load path always awaits, so even a warm cache resolves a tick later. */
const settle = () => new Promise(resolve => setTimeout(resolve, 30))

/**
 * Flush a synchronous signal change all the way to the DOM.
 *
 * The wrapper's classes and styles reach the renderer as memos, and a computed
 * notifies its observers on a microtask, so the renderer's binding runs one
 * turn after `flushSync`.
 */
async function flushToDom(): Promise<void> {
  flushSync()
  await Promise.resolve()
}

function nodesOf(component: any): DOMNode[] {
  const rendered = component.render()
  return Array.isArray(rendered) ? rendered : [rendered]
}

describe('Symbol repaint', () => {
  beforeEach(() => {
    IconSetRegistry.clear()
    IconSetRegistry.register(new LucideIconSet())
    IconLoader.clearCache()
  })

  test('paints the icon once the load resolves', async () => {
    const host = document.createElement('div')
    renderComponent(Symbol('heart') as any, host)

    expect(host.querySelector('.tachui-symbol__spinner')).not.toBeNull()

    await settle()

    expect(host.querySelector('svg')).not.toBeNull()
    expect(host.querySelector('.tachui-symbol__spinner')).toBeNull()
    expect(host.querySelectorAll('.tachui-symbol > *')).toHaveLength(1)
  })

  /**
   * C2: `ZStack` hands the renderer `{ ...node, props: {...} }`, so the node
   * object the component built never receives an `element`. A repaint that
   * reached the DOM through that object stayed on the spinner forever.
   */
  test('paints inside a layout that copies the node', async () => {
    const host = document.createElement('div')
    renderComponent(
      Layout.ZStack({ children: [Symbol('heart') as any] }) as any,
      host
    )

    await settle()

    expect(host.querySelector('svg')).not.toBeNull()
    expect(host.querySelector('.tachui-symbol__spinner')).toBeNull()
  })

  test('paints inside a VStack too', async () => {
    const host = document.createElement('div')
    renderComponent(
      Layout.VStack({ children: [Symbol('heart') as any] }) as any,
      host
    )

    await settle()

    expect(host.querySelector('svg')).not.toBeNull()
  })

  /**
   * C1: `Show` disposes a branch on hide and calls `render()` on the same
   * instance on show. A repaint scoped to the component instance was dead after
   * the first dispose — the icon froze at whatever it had last painted.
   */
  describe('after a dispose and re-render', () => {
    test('still paints an icon that had not resolved yet', async () => {
      const renderer = new DOMRenderer()
      const host = document.createElement('div')
      const symbol = Symbol('heart') as any

      // Shown, then hidden before the load resolves.
      const first = nodesOf(symbol.build ? symbol.build() : symbol)
      host.appendChild(renderer.render(first[0]) as Element)
      renderer.disposeNode(first[0])
      host.replaceChildren()

      // Shown again.
      const second = nodesOf(symbol.build ? symbol.build() : symbol)
      host.appendChild(renderer.render(second[0]) as Element)

      await settle()

      expect(host.querySelector('svg')).not.toBeNull()
      expect(host.querySelector('.tachui-symbol__spinner')).toBeNull()
    })

    test('still updates the class when the scale changes', async () => {
      const renderer = new DOMRenderer()
      const host = document.createElement('div')
      const [scale, setScale] = createSignal<'medium' | 'large'>('medium')
      const symbol = Symbol('heart', { scale }) as any

      const first = nodesOf(symbol)
      host.appendChild(renderer.render(first[0]) as Element)
      await settle()

      renderer.disposeNode(first[0])
      host.replaceChildren()

      const second = nodesOf(symbol)
      host.appendChild(renderer.render(second[0]) as Element)

      setScale('large')
      await flushToDom()

      const wrapper = host.querySelector('.tachui-symbol')!
      expect(wrapper.classList.contains('tachui-symbol--large')).toBe(true)
      expect(wrapper.classList.contains('tachui-symbol--medium')).toBe(false)
    })
  })

  /**
   * C3: modifiers write inline styles and classes onto the same wrapper span
   * right after the renderer creates it. A repaint that reasserted the whole
   * style attribute wiped them the moment the icon resolved.
   */
  describe('alongside modifiers', () => {
    test('keeps padding and an explicit frame width across the load', async () => {
      const host = document.createElement('div')
      renderComponent(
        (Symbol('heart') as any).padding(8).frame({ width: 40 }),
        host
      )

      const wrapper = host.querySelector('.tachui-symbol') as HTMLElement
      expect(wrapper.style.getPropertyValue('width')).toBe('40px')

      await settle()

      expect(host.querySelector('svg')).not.toBeNull()
      expect(wrapper.style.getPropertyValue('padding')).toBe('8px')
      expect(wrapper.style.getPropertyValue('width')).toBe('40px')
    })

    test('keeps the frame width across a later scale change', async () => {
      const host = document.createElement('div')
      const [scale, setScale] = createSignal<'medium' | 'large'>('medium')
      renderComponent(
        (Symbol('heart', { scale }) as any).frame({ width: 40 }),
        host
      )

      await settle()

      setScale('large')
      await flushToDom()

      const wrapper = host.querySelector('.tachui-symbol') as HTMLElement
      expect(wrapper.style.getPropertyValue('width')).toBe('40px')
      expect(wrapper.classList.contains('tachui-symbol--large')).toBe(true)
    })

    test('keeps a foreground colour across the load', async () => {
      const host = document.createElement('div')
      renderComponent((Symbol('heart') as any).foregroundColor('red'), host)

      await settle()

      const wrapper = host.querySelector('.tachui-symbol') as HTMLElement
      expect(wrapper.style.getPropertyValue('color')).toBe('red')
    })
  })

  /**
   * C4: a parent re-render builds a *fresh* `Symbol()`, which starts loading
   * again and so hands over a new spinner. Patching the DOM outside the
   * renderer left `nodeMap` pointing at the detached spinner, and the reorder
   * loop mounted the new one next to the icon: `[svg, div.spinner]`, forever.
   */
  test('a parent re-render with a fresh instance leaves one child', async () => {
    const [bump, setBump] = createSignal(0)
    const host = document.createElement('div')

    const parent: any = {
      type: 'component',
      id: 'parent',
      props: {},
      children: [],
      cleanup: [],
      render: () => {
        const node = h('div', { class: `p${bump()}` }) as any
        node.children = nodesOf(Symbol('heart') as any)
        return node
      },
    }

    renderComponent(parent, host)
    await settle()

    expect(host.querySelectorAll('.tachui-symbol > *')).toHaveLength(1)

    setBump(1)
    flushSync()
    await settle()

    expect(host.querySelectorAll('.tachui-symbol > *')).toHaveLength(1)
    expect(host.querySelector('svg')).not.toBeNull()
    expect(host.querySelector('.tachui-symbol__spinner')).toBeNull()
  })
})
