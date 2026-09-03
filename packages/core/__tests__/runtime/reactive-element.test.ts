/**
 * `DOMNode.reactiveElement` — the renderer subscribes to an accessor and keeps
 * the mounted owned element in step with it.
 *
 * The protocol exists so an owner can repaint without reading signals in
 * `render()`. A child's `render()` runs inline inside the enclosing component's
 * render effect, so reading there subscribes the parent and the whole
 * surrounding subtree re-renders (#303).
 *
 * Almost every defect this replaced paints correctly *once* and then goes
 * silently dead, so the assertions here are deliberately about the second
 * repaint, not the first.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { createSignal, flushSync } from '../../src/reactive'
import { DOMRenderer, h, renderComponent } from '../../src/runtime/renderer'
import type { DOMNode } from '../../src/runtime/types'

const SVG_NS = 'http://www.w3.org/2000/svg'

function buildSvg(marker: string): SVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('data-marker', marker)
  const path = document.createElementNS(SVG_NS, 'path')
  path.setAttribute('d', marker)
  svg.appendChild(path)
  return svg
}

function boundNode(accessor: () => Element): DOMNode {
  return {
    type: 'element',
    // The slot's name, not the current element's — see DOMNode.reactiveElement.
    tag: 'svg',
    props: {},
    children: [],
    reactiveElement: accessor,
  }
}

/**
 * An accessor with the shape a real owner has: it rebuilds only when the state
 * it depends on changes, so an unrelated re-render gets the same element back.
 */
function cachingAccessor(state: () => string): () => Element {
  let cached: { key: string; element: Element } | undefined
  return () => {
    const key = state()
    if (cached?.key === key) return cached.element
    cached = { key, element: buildSvg(key) }
    return cached.element
  }
}

function markers(host: Element): (string | null)[] {
  return Array.from(host.querySelectorAll('[data-marker]')).map(el =>
    el.getAttribute('data-marker')
  )
}

describe('DOMNode.reactiveElement', () => {
  it('mounts the element the accessor yields', () => {
    const renderer = new DOMRenderer()
    const node = boundNode(cachingAccessor(() => 'A'))

    const host = document.createElement('div')
    const element = renderer.render(node, host)

    expect(element).toBeInstanceOf(SVGElement)
    expect(renderer.getRenderedNode(node)).toBe(element)
    expect(host.querySelector('path')?.getAttribute('d')).toBe('A')
  })

  it('swaps the mounted element when the accessor yields a different one', () => {
    const renderer = new DOMRenderer()
    const [marker, setMarker] = createSignal('A')
    const node = boundNode(cachingAccessor(marker))

    const host = document.createElement('div')
    const first = renderer.render(node, host)

    setMarker('B')
    flushSync()

    expect(markers(host)).toEqual(['B'])
    expect(host.childElementCount).toBe(1)
    expect(renderer.getRenderedNode(node)).not.toBe(first)
    expect(renderer.getRenderedNode(node)).toBe(host.firstElementChild)
    expect(node.element).toBe(host.firstElementChild)
  })

  /**
   * The regression that motivates the whole two-disposer split. A binding whose
   * disposer is registered against its own mounted element ends itself during
   * the first swap, from inside the effect body, and a disposed computation is
   * terminal.
   */
  it('keeps repainting after the first swap', () => {
    const renderer = new DOMRenderer()
    const [marker, setMarker] = createSignal('A')
    const node = boundNode(cachingAccessor(marker))

    const host = document.createElement('div')
    renderer.render(node, host)

    setMarker('B')
    flushSync()
    setMarker('C')
    flushSync()

    expect(markers(host)).toEqual(['C'])
    expect(host.childElementCount).toBe(1)
  })

  it('does not re-run for a change the accessor does not depend on', () => {
    const renderer = new DOMRenderer()
    const [marker] = createSignal('A')
    const [unrelated, setUnrelated] = createSignal(0)
    const node = boundNode(cachingAccessor(marker))

    const host = document.createElement('div')
    const first = renderer.render(node, host)

    setUnrelated(unrelated() + 1)
    flushSync()

    expect(renderer.getRenderedNode(node)).toBe(first)
  })

  it('runs the replaced element\'s cleanups and not the replacement\'s', () => {
    const renderer = new DOMRenderer()
    const [marker, setMarker] = createSignal('A')
    const disposed: string[] = []

    const accessor = cachingAccessor(marker)
    const node = boundNode(accessor)
    node.dispose = () => disposed.push(node.element!.textContent || '?')

    const host = document.createElement('div')
    const first = renderer.render(node, host) as Element
    first.textContent = 'A'

    setMarker('B')
    flushSync()

    // The owner's disposer belongs to the element, so it ran for the discarded
    // one — and was re-registered against the replacement rather than lost.
    expect(disposed).toEqual(['A'])

    const second = renderer.getRenderedNode(node) as Element
    second.textContent = 'B'
    renderer.removeNode(node)

    expect(disposed).toEqual(['A', 'B'])
  })

  /**
   * C2: `ZStack` and the tab views hand the renderer `{ ...node }`, so the node
   * object the owner built never gets an `element`. The binding closes over
   * whichever object the renderer received, so the copy works either way.
   */
  it('binds and swaps through a spread copy of the node', () => {
    const renderer = new DOMRenderer()
    const [marker, setMarker] = createSignal('A')
    const original = boundNode(cachingAccessor(marker))
    const copy: DOMNode = { ...original }

    const host = document.createElement('div')
    renderer.render(copy, host)

    setMarker('B')
    flushSync()

    expect(markers(host)).toEqual(['B'])
    expect(original.element).toBeUndefined()
    expect(renderer.getRenderedNode(copy)).toBe(host.firstElementChild)
  })

  /**
   * C1: `Show` disposes a branch on hide and calls `render()` on the same
   * instance on show. The binding is per mount, so re-rendering rebinds.
   */
  it('rebinds after dispose and repaints again', () => {
    const renderer = new DOMRenderer()
    const [marker, setMarker] = createSignal('A')
    const accessor = cachingAccessor(marker)

    const host = document.createElement('div')
    renderer.render(boundNode(accessor), host)

    // A hide: dispose without touching the DOM, as `Show` does.
    const mounted = boundNode(accessor)
    renderer.render(mounted, host)
    renderer.disposeNode(mounted)
    host.replaceChildren()

    // A show: a fresh node from the same owner.
    const reshown = boundNode(accessor)
    renderer.render(reshown, host)

    setMarker('B')
    flushSync()

    expect(markers(host)).toEqual(['B'])
    expect(renderer.getRenderedNode(reshown)).toBe(host.firstElementChild)
  })

  it('stops repainting once the node is disposed', () => {
    const renderer = new DOMRenderer()
    const [marker, setMarker] = createSignal('A')
    const node = boundNode(cachingAccessor(marker))

    const host = document.createElement('div')
    const first = renderer.render(node, host)

    renderer.disposeNode(node)
    setMarker('B')
    flushSync()

    expect(host.firstElementChild).toBe(first)
  })

  describe('adoption', () => {
    /**
     * C4: a parent re-render with a *fresh* owner. The new accessor starts in
     * its initial state, so it yields a different element from the one mounted;
     * the renderer swaps it and `nodeMap` follows. Patching the DOM outside the
     * renderer left both elements mounted.
     */
    it('swaps once and leaves a single child when a fresh node is adopted', () => {
      const renderer = new DOMRenderer()
      const host = document.createElement('div')

      const oldNode = boundNode(cachingAccessor(() => 'A'))
      renderer.render(oldNode, host)

      const [marker, setMarker] = createSignal('B')
      const newNode = boundNode(cachingAccessor(marker))
      renderer.adoptNode(oldNode, newNode)
      renderer.render(newNode, host)

      expect(markers(host)).toEqual(['B'])
      expect(host.childElementCount).toBe(1)

      // And the adopted node's binding is the live one.
      setMarker('C')
      flushSync()

      expect(markers(host)).toEqual(['C'])
      expect(host.childElementCount).toBe(1)
    })

    it('leaves the mounted element alone when the accessor still yields it', () => {
      const renderer = new DOMRenderer()
      const host = document.createElement('div')
      const accessor = cachingAccessor(() => 'A')

      const oldNode = boundNode(accessor)
      const first = renderer.render(oldNode, host)

      const newNode = boundNode(accessor)
      renderer.adoptNode(oldNode, newNode)
      renderer.render(newNode, host)

      expect(host.firstElementChild).toBe(first)
      expect(host.childElementCount).toBe(1)
    })

    it('retires the old binding', () => {
      const renderer = new DOMRenderer()
      const host = document.createElement('div')

      // Rendered outside any effect, so nothing else would dispose the old
      // binding — two live bindings would then fight over the one slot.
      const [stale, setStale] = createSignal('A')
      const oldNode = boundNode(cachingAccessor(stale))
      renderer.render(oldNode, host)

      const newNode = boundNode(cachingAccessor(() => 'B'))
      renderer.adoptNode(oldNode, newNode)
      renderer.render(newNode, host)

      setStale('Z')
      flushSync()

      expect(markers(host)).toEqual(['B'])
      expect(host.childElementCount).toBe(1)
    })

    /**
     * Keyless child matching is positional with no tag check, so a regular node
     * carrying children can be paired against an owned node. The swap runs
     * cleanups for the replaced *element*; without walking the old node's
     * children, everything they registered — reactive effects, delegated
     * listeners, modifier cleanups — kept running on detached DOM.
     */
    it('tears down the replaced node\'s subtree, not just its element', () => {
      const renderer = new DOMRenderer()
      const host = document.createElement('div')
      const disposed: string[] = []

      const grandchild: DOMNode = {
        type: 'element',
        tag: 'em',
        props: {},
        children: [],
        dispose: () => disposed.push('grandchild'),
      }
      const oldNode: DOMNode = {
        type: 'element',
        tag: 'div',
        props: {},
        children: [grandchild],
        dispose: () => disposed.push('child'),
      }
      renderer.render(oldNode, host)

      expect(renderer.hasNode(grandchild)).toBe(true)

      const newNode = boundNode(cachingAccessor(() => 'A'))
      renderer.adoptNode(oldNode, newNode)
      renderer.render(newNode, host)

      expect(disposed).toContain('grandchild')
      expect(renderer.hasNode(grandchild)).toBe(false)
      expect(grandchild.element).toBeUndefined()
    })

    /**
     * The binding never survives adoption, whatever replaces the node — not
     * only another bound node. Left live it stays subscribed to its accessor,
     * and the next change swaps against the element its *successor* is now
     * mounted on: the successor is detached, its `nodeMap` entry strands, and
     * the accessor's element takes its place.
     *
     * Reachable in ordinary reconciliation, since keyless child matching is
     * positional with no tag check.
     */
    describe('when the slot stops being reactive', () => {
      function adoptAway(makeSuccessor: () => DOMNode) {
        const renderer = new DOMRenderer()
        const host = document.createElement('div')
        const [marker, setMarker] = createSignal('A')

        const oldNode = boundNode(cachingAccessor(marker))
        renderer.render(oldNode, host)

        const newNode = makeSuccessor()
        renderer.adoptNode(oldNode, newNode)
        renderer.render(newNode, host)

        const mounted = renderer.getRenderedNode(newNode)

        setMarker('B')
        flushSync()

        return { renderer, host, newNode, mounted }
      }

      it('a plain node keeps its element', () => {
        const { renderer, host, newNode, mounted } = adoptAway(() => ({
          type: 'element',
          tag: 'i',
          props: { id: 'plain' },
          children: [],
        }))

        expect(host.childElementCount).toBe(1)
        expect(host.firstElementChild).toBe(mounted)
        expect(host.firstElementChild?.getAttribute('id')).toBe('plain')
        expect(renderer.getRenderedNode(newNode)).toBe(host.firstElementChild)
      })

      it('a static owned node keeps its element', () => {
        const supplied = buildSvg('owned')
        const { renderer, host, newNode } = adoptAway(() => ({
          type: 'element',
          tag: 'svg',
          props: {},
          children: [],
          element: supplied,
          owned: true,
        }))

        expect(host.childElementCount).toBe(1)
        expect(host.firstElementChild).toBe(supplied)
        expect(renderer.getRenderedNode(newNode)).toBe(supplied)
      })

      it('does not hand the successor the retired binding\'s composite disposer', () => {
        const renderer = new DOMRenderer()
        const host = document.createElement('div')
        const [marker, setMarker] = createSignal('A')
        const disposed: string[] = []

        const oldNode = boundNode(cachingAccessor(marker))
        oldNode.dispose = () => disposed.push('owner')
        renderer.render(oldNode, host)

        const newNode: DOMNode = {
          type: 'element',
          tag: 'i',
          props: {},
          children: [],
        }
        renderer.adoptNode(oldNode, newNode)

        // `oldNode.dispose` is the composite the binding installed. Handing it
        // over would give the successor a retired binding's disposer, and the
        // owner half is already registered against the mounted element.
        expect(newNode.dispose).toBeUndefined()

        renderer.render(newNode, host)
        setMarker('B')
        flushSync()

        expect(disposed).toEqual([])
        renderer.removeNode(newNode)
        expect(disposed).toEqual(['owner'])
      })
    })

    it('does not carry the old node\'s dispose onto the new one', () => {
      const renderer = new DOMRenderer()
      const host = document.createElement('div')

      const oldNode = boundNode(cachingAccessor(() => 'A'))
      const oldDisposals: string[] = []
      oldNode.dispose = () => oldDisposals.push('old')
      renderer.render(oldNode, host)

      const newNode = boundNode(cachingAccessor(() => 'B'))
      renderer.adoptNode(oldNode, newNode)
      renderer.render(newNode, host)

      // The old owner's disposer was registered against the element it was
      // mounted on, and ran when that element was swapped out — exactly once,
      // and not carried onto the live node.
      expect(oldDisposals).toEqual(['old'])
      renderer.removeNode(newNode)
      expect(oldDisposals).toEqual(['old'])
    })
  })

  describe('inside a re-rendering parent', () => {
    function mount(accessor: () => Element, wrapperClass: () => string) {
      const host = document.createElement('div')
      const component: any = {
        type: 'component',
        id: 'owner',
        props: {},
        render: () => {
          const wrapper = h('span', { class: wrapperClass() }) as any
          wrapper.children = [boundNode(accessor)]
          return wrapper
        },
      }
      renderComponent(component, host)
      return host
    }

    it('repaints without re-rendering the parent', () => {
      const [marker, setMarker] = createSignal('A')
      const accessor = cachingAccessor(marker)
      let renders = 0

      const host = mount(accessor, () => {
        renders++
        return 'w'
      })

      expect(renders).toBe(1)

      setMarker('B')
      flushSync()

      expect(markers(host)).toEqual(['B'])
      // The accessor's reads belong to the binding, not to the parent's pass.
      expect(renders).toBe(1)
    })

    /**
     * The binding is parented to the render pass that created it, so a parent
     * re-render disposes it. A caller that returns a *fresh* node each pass gets
     * a fresh binding with it — but one that reuses the same node object
     * outlives its own binding, and the reconciler's identity fast path routes
     * that node to `updateExistingNode`, which leaves an owned element alone.
     * Nothing would otherwise notice the slot had stopped being maintained.
     */
    it('rebinds a node object reused across parent re-renders', () => {
      const [marker, setMarker] = createSignal('A')
      const [bump, setBump] = createSignal(0)
      const accessor = cachingAccessor(marker)

      // One node object, handed back on every pass.
      const child = boundNode(accessor)

      const host = document.createElement('div')
      const component: any = {
        type: 'component',
        id: 'stable-child',
        props: {},
        render: () => {
          const wrapper = h('span', { class: `w${bump()}` }) as any
          wrapper.children = [child]
          return wrapper
        },
      }
      renderComponent(component, host)

      expect(markers(host)).toEqual(['A'])

      setBump(1)
      flushSync()

      setMarker('B')
      flushSync()

      expect(markers(host)).toEqual(['B'])
      expect(host.querySelector('span')?.childElementCount).toBe(1)

      // And the rebind is durable, not a one-shot.
      setBump(2)
      flushSync()
      setMarker('C')
      flushSync()

      expect(markers(host)).toEqual(['C'])
      expect(host.querySelector('span')?.childElementCount).toBe(1)
    })

    it('does not leak the previous binding across a parent re-render', () => {
      const [marker, setMarker] = createSignal('A')
      const [bump, setBump] = createSignal(0)
      const accessor = cachingAccessor(marker)

      const host = mount(accessor, () => `w${bump()}`)

      setBump(1)
      flushSync()
      setBump(2)
      flushSync()

      setMarker('B')
      flushSync()

      // One binding survives a re-render, not three: each pass's binding dies
      // with the pass, so the swap happens once.
      expect(markers(host)).toEqual(['B'])
      expect(host.querySelector('span')?.childElementCount).toBe(1)
    })
  })
})

describe('reactive props yield to external writes', () => {
  let renderer: DOMRenderer
  let host: Element

  beforeEach(() => {
    renderer = new DOMRenderer()
    host = document.createElement('div')
  })

  /**
   * A modifier writes inline styles onto the same element right after the
   * renderer creates it. Re-asserting every property on a later run wiped
   * `frame({ width: 40 })` the moment an unrelated signal changed.
   */
  it('keeps a width a modifier overwrote, across an unrelated update', () => {
    const [styles, setStyles] = createSignal<Record<string, string>>({
      width: '24px',
      color: 'black',
    })
    const node: DOMNode = {
      type: 'element',
      tag: 'span',
      props: { style: styles },
      children: [],
    }

    const element = renderer.render(node, host) as HTMLElement
    expect(element.style.getPropertyValue('width')).toBe('24px')

    // A modifier takes over `width`.
    element.style.setProperty('width', '40px')

    setStyles({ width: '24px', color: 'red' })
    flushSync()

    expect(element.style.getPropertyValue('width')).toBe('40px')
    expect(element.style.getPropertyValue('color')).toBe('red')
  })

  /**
   * The record is what the renderer last *wrote*, and a run it skipped must not
   * adopt the value it yielded to: with record and live back in agreement, the
   * next run would quietly take the property back.
   */
  it('keeps the modifier\'s value across repeated changes to the prop', () => {
    const [styles, setStyles] = createSignal<Record<string, string>>({ width: '24px' })
    const node: DOMNode = {
      type: 'element',
      tag: 'span',
      props: { style: styles },
      children: [],
    }

    const element = renderer.render(node, host) as HTMLElement
    element.style.setProperty('width', '40px')

    setStyles({ width: '32px' })
    flushSync()
    expect(element.style.getPropertyValue('width')).toBe('40px')

    setStyles({ width: '48px' })
    flushSync()
    expect(element.style.getPropertyValue('width')).toBe('40px')

    setStyles({ width: '56px' })
    flushSync()
    expect(element.style.getPropertyValue('width')).toBe('40px')
  })

  it('resumes control once the external value is removed', () => {
    const [styles, setStyles] = createSignal<Record<string, string>>({ width: '24px' })
    const node: DOMNode = {
      type: 'element',
      tag: 'span',
      props: { style: styles },
      children: [],
    }

    const element = renderer.render(node, host) as HTMLElement
    element.style.setProperty('width', '40px')

    setStyles({ width: '32px' })
    flushSync()
    expect(element.style.getPropertyValue('width')).toBe('40px')

    element.style.removeProperty('width')
    setStyles({ width: '48px' })
    flushSync()

    expect(element.style.getPropertyValue('width')).toBe('48px')
  })

  /**
   * The record is what the renderer read *back* off the element, so a colour
   * the browser normalised is not mistaken for someone else's write.
   */
  it('does not mistake its own normalised colour for an external write', () => {
    const [styles, setStyles] = createSignal<Record<string, string>>({ color: 'red' })
    const node: DOMNode = {
      type: 'element',
      tag: 'span',
      props: { style: styles },
      children: [],
    }

    const element = renderer.render(node, host) as HTMLElement

    setStyles({ color: 'blue' })
    flushSync()

    expect(element.style.getPropertyValue('color')).toBe('blue')
  })

  it('keeps a colour a modifier applied', () => {
    const [styles, setStyles] = createSignal<Record<string, string>>({ color: 'black' })
    const node: DOMNode = {
      type: 'element',
      tag: 'span',
      props: { style: styles },
      children: [],
    }

    const element = renderer.render(node, host) as HTMLElement
    element.style.setProperty('color', 'red')

    setStyles({ color: 'green' })
    flushSync()

    expect(element.style.getPropertyValue('color')).toBe('red')
  })

  /**
   * C3's other half: class-adding modifiers were wiped by an assignment to
   * `className`, so the class list is diffed instead.
   */
  it('keeps a class a modifier added across a reactive className update', () => {
    const [classes, setClasses] = createSignal('tachui-symbol tachui-symbol--medium')
    const node: DOMNode = {
      type: 'element',
      tag: 'span',
      props: { className: classes },
      children: [],
    }

    const element = renderer.render(node, host) as HTMLElement
    element.classList.add('from-modifier')

    setClasses('tachui-symbol tachui-symbol--large')
    flushSync()

    expect(element.classList.contains('from-modifier')).toBe(true)
    expect(element.classList.contains('tachui-symbol--large')).toBe(true)
    expect(element.classList.contains('tachui-symbol--medium')).toBe(false)
  })
})
