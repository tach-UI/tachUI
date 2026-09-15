/**
 * Circle and the shape engine behind it.
 *
 * These run the real path: the real component, the real modifier proxy, and
 * the real renderer. The only thing stubbed is ResizeObserver, since jsdom
 * does no layout; the stub reports a size the way the browser would.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createSignal, flushSync } from '@tachui/core'
import { renderComponent } from '@tachui/core/runtime'
import { Circle, ShapeComponent, circleShape } from '../../src/shapes'
import {
  ResizeObserverStub,
  installResizeObserverStub,
  resizeAll,
  uninstallResizeObserverStub,
} from './resize-observer-stub'

const CIRCLE_40 = 'M 40 20 A 20 20 0 1 1 0 20 A 20 20 0 1 1 40 20 Z'

async function flushReactiveUpdates(): Promise<void> {
  flushSync()
  await new Promise<void>(resolve => queueMicrotask(resolve))
}

function mount(component: unknown): {
  container: HTMLElement
  wrapper: HTMLElement
  svg: SVGSVGElement
  path: SVGPathElement
  dispose: () => void
} {
  const container = document.createElement('div')
  const dispose = renderComponent(component as any, container)
  const wrapper = container.querySelector('.tachui-shape') as HTMLElement
  expect(wrapper).not.toBeNull()
  const svg = wrapper.querySelector('svg') as SVGSVGElement
  expect(svg).not.toBeNull()
  const path = svg.querySelector('path') as SVGPathElement
  expect(path).not.toBeNull()
  return { container, wrapper, svg, path, dispose }
}

describe('Circle', () => {
  beforeEach(() => {
    installResizeObserverStub()
  })

  afterEach(() => {
    uninstallResizeObserverStub()
  })

  describe('structure', () => {
    it('renders a wrapper that fills its frame around an owned svg with one path', () => {
      const { wrapper, svg, path } = mount(Circle())

      expect(wrapper.classList.contains('tachui-shape')).toBe(true)
      expect(wrapper.classList.contains('tachui-shape-circle')).toBe(true)
      expect(wrapper.style.width).toBe('100%')
      expect(wrapper.style.height).toBe('100%')

      expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg')
      expect(svg.getAttribute('width')).toBe('100%')
      expect(svg.getAttribute('height')).toBe('100%')
      expect(svg.children).toHaveLength(1)
      expect(path.namespaceURI).toBe('http://www.w3.org/2000/svg')
    })

    it('is decorative by default', () => {
      const { svg } = mount(Circle())
      expect(svg.getAttribute('aria-hidden')).toBe('true')
      expect(svg.getAttribute('focusable')).toBe('false')
    })

    // An svg clips to its viewport, so a centered stroke on a box-filling
    // path would lose its outer half. SwiftUI draws that half outside the
    // frame.
    it('lets a centered stroke draw outside the frame', () => {
      const { svg } = mount(Circle().stroke('red', 2))
      expect(svg.style.overflow).toBe('visible')
    })

    it('draws nothing until the frame has been measured', () => {
      const { path } = mount(Circle())
      expect(path.getAttribute('d')).toBe('')
    })
  })

  describe('geometry from the measured frame', () => {
    it('fills a square frame', async () => {
      const { path } = mount(Circle())

      resizeAll(40, 40)
      await flushReactiveUpdates()

      expect(path.getAttribute('d')).toBe(CIRCLE_40)
    })

    it('inscribes in the short side of a wide frame, centered', async () => {
      const { path } = mount(Circle())

      resizeAll(100, 50)
      await flushReactiveUpdates()

      expect(path.getAttribute('d')).toBe(
        'M 75 25 A 25 25 0 1 1 25 25 A 25 25 0 1 1 75 25 Z'
      )
    })

    it('inscribes in the short side of a tall frame, centered', async () => {
      const { path } = mount(Circle())

      resizeAll(50, 100)
      await flushReactiveUpdates()

      expect(path.getAttribute('d')).toBe(
        'M 50 50 A 25 25 0 1 1 0 50 A 25 25 0 1 1 50 50 Z'
      )
    })

    it('follows a resize', async () => {
      const { path } = mount(Circle())

      resizeAll(40, 40)
      await flushReactiveUpdates()
      resizeAll(20, 20)
      await flushReactiveUpdates()

      expect(path.getAttribute('d')).toBe(
        'M 20 10 A 10 10 0 1 1 0 10 A 10 10 0 1 1 20 10 Z'
      )
    })

    it('observes the svg itself', () => {
      const { svg } = mount(Circle())

      expect(ResizeObserverStub.instances).toHaveLength(1)
      expect(ResizeObserverStub.instances[0].targets.has(svg)).toBe(true)
    })
  })

  describe('fill and stroke', () => {
    it('fills with currentColor when nothing is specified', () => {
      const { path } = mount(Circle())
      expect(path.getAttribute('fill')).toBe('currentColor')
      expect(path.hasAttribute('stroke')).toBe(false)
      expect(path.hasAttribute('stroke-width')).toBe(false)
    })

    it('fills with the given color', () => {
      const { path } = mount(Circle().fill('rebeccapurple'))
      expect(path.getAttribute('fill')).toBe('rebeccapurple')
    })

    it('strokes with an empty interior', () => {
      const { path } = mount(Circle().stroke('red', 2))
      expect(path.getAttribute('stroke')).toBe('red')
      expect(path.getAttribute('stroke-width')).toBe('2')
      expect(path.getAttribute('fill')).toBe('none')
    })

    it('defaults the line width to 1', () => {
      const { path } = mount(Circle().stroke('red'))
      expect(path.getAttribute('stroke-width')).toBe('1')
    })

    it('can fill and stroke together', () => {
      const { path } = mount(Circle().fill('blue').stroke('red', 3))
      expect(path.getAttribute('fill')).toBe('blue')
      expect(path.getAttribute('stroke')).toBe('red')
      expect(path.getAttribute('stroke-width')).toBe('3')
    })

    it('resolves a color asset', () => {
      const asset = { resolve: () => '#abcdef' }
      const { path } = mount(Circle().fill(asset as any))
      expect(path.getAttribute('fill')).toBe('#abcdef')
    })
  })

  describe('inset', () => {
    it('shrinks the shape on every side', async () => {
      const { path } = mount(Circle().inset(1))

      resizeAll(40, 40)
      await flushReactiveUpdates()

      expect(path.getAttribute('d')).toBe(
        'M 39 20 A 19 19 0 1 1 1 20 A 19 19 0 1 1 39 20 Z'
      )
    })

    it('accumulates across calls', async () => {
      const { path } = mount(Circle().inset(1).inset(2))

      resizeAll(40, 40)
      await flushReactiveUpdates()

      expect(path.getAttribute('d')).toBe(
        'M 37 20 A 17 17 0 1 1 3 20 A 17 17 0 1 1 37 20 Z'
      )
    })

    it('is the #302 verification ring when combined with a stroke', async () => {
      const { path } = mount(Circle().inset(1).stroke('tint', 2))

      resizeAll(40, 40)
      await flushReactiveUpdates()

      // 1px in from the edge, 2px wide, centered on the path: the stroke
      // spans radius 18 to 20 and nothing lies outside the frame.
      expect(path.getAttribute('d')).toBe(
        'M 39 20 A 19 19 0 1 1 1 20 A 19 19 0 1 1 39 20 Z'
      )
      expect(path.getAttribute('stroke')).toBe('tint')
      expect(path.getAttribute('stroke-width')).toBe('2')
    })
  })

  describe('strokeBorder', () => {
    it('insets by half the line width so the stroke stays inside the frame', async () => {
      const { path } = mount(Circle().strokeBorder('red', 4))

      resizeAll(40, 40)
      await flushReactiveUpdates()

      expect(path.getAttribute('d')).toBe(
        'M 38 20 A 18 18 0 1 1 2 20 A 18 18 0 1 1 38 20 Z'
      )
      expect(path.getAttribute('stroke-width')).toBe('4')
      expect(path.getAttribute('fill')).toBe('none')
    })

    it('adds to an explicit inset', async () => {
      const { path } = mount(Circle().inset(1).strokeBorder('red', 2))

      resizeAll(40, 40)
      await flushReactiveUpdates()

      expect(path.getAttribute('d')).toBe(
        'M 38 20 A 18 18 0 1 1 2 20 A 18 18 0 1 1 38 20 Z'
      )
    })
  })

  describe('reactivity on a stable element', () => {
    // The renderer's owned-node swap path (what Symbol uses) would replace
    // the element on every change and restart any CSS transition running on
    // it. A shape updates attributes on the element it already has.
    it('updates a signal-driven stroke color without replacing the element', async () => {
      const [color, setColor] = createSignal('red')
      const { wrapper, svg, path } = mount(Circle().stroke(color, 2))

      expect(path.getAttribute('stroke')).toBe('red')

      setColor('green')
      await flushReactiveUpdates()

      expect(path.getAttribute('stroke')).toBe('green')
      expect(wrapper.querySelector('svg')).toBe(svg)
      expect(svg.querySelector('path')).toBe(path)
    })

    it('updates a signal-driven line width', async () => {
      const [lineWidth, setLineWidth] = createSignal(2)
      const { path } = mount(Circle().stroke('red', lineWidth))

      setLineWidth(5)
      await flushReactiveUpdates()

      expect(path.getAttribute('stroke-width')).toBe('5')
    })

    it('updates a signal-driven inset', async () => {
      const [inset, setInset] = createSignal(0)
      const { path } = mount(Circle().inset(inset))

      resizeAll(40, 40)
      await flushReactiveUpdates()
      expect(path.getAttribute('d')).toBe(CIRCLE_40)

      setInset(5)
      await flushReactiveUpdates()

      expect(path.getAttribute('d')).toBe(
        'M 35 20 A 15 15 0 1 1 5 20 A 15 15 0 1 1 35 20 Z'
      )
    })

    it('updates a signal-driven fill', async () => {
      const [fill, setFill] = createSignal('red')
      const { path } = mount(Circle().fill(fill))

      setFill('blue')
      await flushReactiveUpdates()

      expect(path.getAttribute('fill')).toBe('blue')
    })
  })

  describe('disposal', () => {
    it('disconnects the observer and stops repainting when unmounted', async () => {
      const [color, setColor] = createSignal('red')
      const { container, path, dispose } = mount(Circle().stroke(color, 2))
      const observer = ResizeObserverStub.instances[0]

      dispose()

      expect(observer.disconnected).toBe(true)
      expect(container.querySelector('.tachui-shape')).toBeNull()

      setColor('green')
      await flushReactiveUpdates()

      expect(path.getAttribute('stroke')).toBe('red')
    })
  })

  describe('chaining with modifiers', () => {
    // Shape methods live on the instance; modifiers come from the component
    // proxy. Both orders have to dispatch, since the proxy hands back itself
    // after a modifier and the instance method hands back the instance.
    it('accepts shape methods after a modifier', () => {
      const { wrapper, path } = mount(
        Circle().frame({ width: 40, height: 40 }).stroke('red', 2)
      )

      expect(wrapper.style.width).toBe('40px')
      expect(wrapper.style.height).toBe('40px')
      expect(path.getAttribute('stroke')).toBe('red')
    })

    it('accepts modifiers after shape methods', () => {
      const { wrapper, path } = mount(
        Circle().stroke('red', 2).frame({ width: 40, height: 40 })
      )

      expect(wrapper.style.width).toBe('40px')
      expect(path.getAttribute('stroke')).toBe('red')
    })

    // General modifiers land on the wrapper, never on the owned svg, so they
    // behave exactly as on a div.
    it('applies opacity to the wrapper', () => {
      const { wrapper } = mount(Circle().opacity(0.5))
      expect(wrapper.style.opacity).toBe('0.5')
    })

    it('applies padding to the wrapper', () => {
      const { wrapper } = mount(Circle().padding(4))
      expect(wrapper.style.padding).toBe('4px')
    })
  })

  describe('Shape contract', () => {
    it('exposes the clip-path for the inscribed circle', () => {
      expect(circleShape.clipPath()).toBe('circle()')
      expect(Circle().clipPath()).toBe('circle()')
    })

    it('exposes path data with insets applied', () => {
      expect(Circle().inset(1).path({ x: 0, y: 0, width: 40, height: 40 })).toBe(
        'M 39 20 A 19 19 0 1 1 1 20 A 19 19 0 1 1 39 20 Z'
      )
    })
  })

  describe('cloning', () => {
    it('carries the styling and builds its own element', async () => {
      const original = Circle().inset(1).stroke('red', 2)
      const copy = original.clone()

      const first = mount(original)
      const second = mount(copy)

      expect(second.svg).not.toBe(first.svg)
      expect(second.path.getAttribute('stroke')).toBe('red')
      expect(second.path.getAttribute('stroke-width')).toBe('2')

      resizeAll(40, 40)
      await flushReactiveUpdates()

      expect(second.path.getAttribute('d')).toBe(
        'M 39 20 A 19 19 0 1 1 1 20 A 19 19 0 1 1 39 20 Z'
      )
    })
  })

  describe('without a DOM', () => {
    it('renders the wrapper alone so the svg is drawn on hydration', () => {
      const component = new ShapeComponent(circleShape, 'circle')
      const originalDocument = globalThis.document
      Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: undefined,
      })
      try {
        const node = component.render()
        expect(node.tag).toBe('div')
        expect(node.children).toEqual([])
      } finally {
        Object.defineProperty(globalThis, 'document', {
          configurable: true,
          value: originalDocument,
        })
      }
    })
  })

  describe('without a ResizeObserver', () => {
    it('still mounts, with nothing drawn', () => {
      uninstallResizeObserverStub()
      const originalObserver = globalThis.ResizeObserver
      Object.defineProperty(globalThis, 'ResizeObserver', {
        configurable: true,
        value: undefined,
      })
      try {
        const { path } = mount(Circle().fill('red'))
        expect(path.getAttribute('d')).toBe('')
        expect(path.getAttribute('fill')).toBe('red')
      } finally {
        Object.defineProperty(globalThis, 'ResizeObserver', {
          configurable: true,
          value: originalObserver,
        })
      }
    })
  })
})
