/**
 * `DOMNode.owned` — the renderer mounts an element the caller built, and leaves
 * its contents alone.
 *
 * This exists for content the renderer cannot express as nodes: an SVG subtree
 * built with `createElementNS` (there is no namespace support in the renderer),
 * or a third-party widget that owns its own DOM. Before it, components in that
 * position patched the DOM behind the renderer's back and were overwritten by
 * the next reconciliation (#303), or grew duplicate content (#302, #318).
 *
 * The guarantees asserted here are a contract, not an implementation detail.
 * Some of them held incidentally before `owned` existed — an empty child list
 * happens to reconcile to a no-op — and would have broken silently the next
 * time `updateChildren` changed.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { createSignal, flushSync } from '../../src/reactive'
import { h, renderComponent } from '../../src/runtime/renderer'
import type { DOMNode } from '../../src/runtime/types'

const SVG_NS = 'http://www.w3.org/2000/svg'

function buildSvg(marker: string): SVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  const path = document.createElementNS(SVG_NS, 'path')
  path.setAttribute('d', marker)
  svg.appendChild(path)
  return svg
}

function ownedNode(element: Element): DOMNode {
  return { type: 'element', tag: element.tagName.toLowerCase(), props: {}, children: [], element, owned: true }
}

/** A component whose wrapper re-renders, holding one owned child. */
function mount(buildChild: () => Element, wrapperClass: () => string) {
  const host = document.createElement('div')
  const component: any = {
    type: 'component',
    id: 'owner',
    props: {},
    render: () => {
      const wrapper = h('span', { class: wrapperClass() }) as any
      wrapper.children = [ownedNode(buildChild())]
      return wrapper
    },
  }
  renderComponent(component, host)
  return host
}

describe('DOMNode.owned', () => {
  it('mounts the element the caller supplied', () => {
    const host = mount(() => buildSvg('A'), () => 'w')

    const svg = host.querySelector('svg')
    expect(svg).not.toBeNull()
    // A real namespaced element, not the HTMLUnknownElement `createElement`
    // would produce — the renderer never creates this itself.
    expect(svg).toBeInstanceOf(SVGElement)
    expect(svg!.querySelector('path')?.getAttribute('d')).toBe('A')
  })

  it('leaves the owned subtree untouched when the parent re-renders', () => {
    const [bump, setBump] = createSignal(0)
    const svg = buildSvg('A')
    const host = mount(() => svg, () => `w${bump()}`)

    const before = host.querySelector('svg')

    setBump(1)
    flushSync()
    setBump(2)
    flushSync()

    // Same element object, same contents, and the wrapper still updated.
    expect(host.querySelector('svg')).toBe(before)
    expect(host.querySelector('path')?.getAttribute('d')).toBe('A')
    expect(host.querySelector('span')?.className).toBe('w2')
    expect(host.querySelectorAll('svg')).toHaveLength(1)
  })

  it('replaces the mounted element when the caller supplies a different one', () => {
    const [marker, setMarker] = createSignal('A')
    // A fresh element per render, the way a component rebuilding its content
    // behaves — an icon whose name changed, say.
    const host = mount(() => buildSvg(marker()), () => 'w')

    expect(host.querySelector('path')?.getAttribute('d')).toBe('A')

    setMarker('B')
    flushSync()

    expect(host.querySelector('path')?.getAttribute('d')).toBe('B')
    expect(host.querySelectorAll('svg')).toHaveLength(1)

    setMarker('C')
    flushSync()

    expect(host.querySelector('path')?.getAttribute('d')).toBe('C')
    expect(host.querySelectorAll('svg')).toHaveLength(1)
  })

  it('does not reconcile an owned node\'s children away', () => {
    // The owner put content inside; the node declares no children. A renderer
    // that reconciled them would empty the element.
    const svg = buildSvg('A')
    const [bump, setBump] = createSignal(0)
    const host = mount(() => svg, () => `w${bump()}`)

    setBump(1)
    flushSync()

    expect(svg.childElementCount).toBe(1)
    expect(host.querySelector('path')).not.toBeNull()
  })

  it('still reconciles ordinary sibling nodes normally', () => {
    const [label, setLabel] = createSignal('one')
    const host = document.createElement('div')
    const svg = buildSvg('A')

    const component: any = {
      type: 'component',
      id: 'mixed',
      props: {},
      render: () => {
        const wrapper = h('span', null) as any
        wrapper.children = [
          ownedNode(svg),
          h('em', null, { type: 'text', text: label() } as DOMNode),
        ]
        return wrapper
      },
    }
    renderComponent(component, host)

    expect(host.querySelector('em')?.textContent).toBe('one')

    setLabel('two')
    flushSync()

    expect(host.querySelector('em')?.textContent).toBe('two')
    expect(host.querySelector('path')?.getAttribute('d')).toBe('A')
    expect(host.querySelectorAll('svg')).toHaveLength(1)
  })

  /**
   * The swap discards a real element. Anything registered against it — a
   * third-party widget's listeners and timers — has to be torn down at that
   * point, and the replacement's own teardown has to survive the swap.
   */
  describe('when the owner supplies a replacement element', () => {
    function mountDisposable(build: () => Element, key: () => string) {
      const host = document.createElement('div')
      const component: any = {
        type: 'component',
        id: 'disposable',
        props: {},
        render: () => {
          const wrapper = h('span', null) as any
          const node = ownedNode(build()) as any
          node.dispose = disposals.register(node.element)
          wrapper.children = [node]
          return wrapper
        },
      }
      renderComponent(component, host)
      return host
    }

    const disposals = {
      log: [] as string[],
      register(element: Element) {
        const marker = element.getAttribute('data-marker') ?? '?'
        return () => disposals.log.push(marker)
      },
    }

    beforeEach(() => {
      disposals.log = []
    })

    it('disposes the replaced element and not the one that replaced it', () => {
      const [gen, setGen] = createSignal('A')
      const host = mountDisposable(() => {
        const svg = buildSvg(gen())
        svg.setAttribute('data-marker', gen())
        return svg
      }, () => gen())

      expect(disposals.log).toEqual([])

      setGen('B')
      flushSync()

      // The discarded element tore down; the mounted one did not.
      expect(disposals.log).toEqual(['A'])
      expect(host.querySelector('path')?.getAttribute('d')).toBe('B')

      setGen('C')
      flushSync()

      // B's own dispose survived the swap that mounted it, rather than being
      // overwritten by A's.
      expect(disposals.log).toEqual(['A', 'B'])
      expect(host.querySelector('path')?.getAttribute('d')).toBe('C')
    })
  })
})
