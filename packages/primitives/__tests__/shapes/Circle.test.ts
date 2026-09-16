/**
 * Circle and the shape engine behind it.
 *
 * These run the real path: the real component, the real modifier proxy, and
 * the real renderer. The only thing stubbed is ResizeObserver, since jsdom
 * does no layout; the stub reports a size the way the browser would.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSignal, flushSync } from '@tachui/core'
import { configureCore } from '@tachui/core/config'
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

function pathIn(container: HTMLElement): SVGPathElement {
  const path = container.querySelector('path') as SVGPathElement
  expect(path).not.toBeNull()
  return path
}

/**
 * Give the fallback measurement a box to read. jsdom does no layout and
 * reports zeros, which the engine treats as "not measured" rather than as a
 * measurement of zero.
 */
function reportBox(
  container: HTMLElement,
  width: number,
  height: number
): void {
  const svg = container.querySelector('svg') as SVGSVGElement
  svg.getBoundingClientRect = () => ({ width, height }) as DOMRect
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

    it('draws the verification ring when combined with a stroke', async () => {
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
    /** Render as the server does, with no `document` to build into. */
    function renderWithoutDOM(component: ShapeComponent) {
      const originalDocument = globalThis.document
      Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: undefined,
      })
      try {
        return component.render()
      } finally {
        Object.defineProperty(globalThis, 'document', {
          configurable: true,
          value: originalDocument,
        })
      }
    }

    // The shell gives the shape its layout box in the first paint rather than
    // leaving a hole until scripts run. Only `d` needs a measurement.
    it('describes the svg shell inside the wrapper', () => {
      const node = renderWithoutDOM(new ShapeComponent(circleShape, 'circle'))

      expect(node.tag).toBe('div')
      expect(node.children).toHaveLength(1)

      const svg = node.children![0]
      expect(svg.tag).toBe('svg')
      expect(svg.props).toMatchObject({
        class: 'tachui-shape__svg',
        width: '100%',
        height: '100%',
        'aria-hidden': 'true',
        focusable: 'false',
      })
      expect(svg.props.style).toMatchObject({
        display: 'block',
        overflow: 'visible',
      })
    })

    it('leaves the path bare, since d needs a measurement', () => {
      const node = renderWithoutDOM(new ShapeComponent(circleShape, 'circle'))
      const path = node.children![0].children![0]

      expect(path.tag).toBe('path')
      expect(path.props).toEqual({})
      expect(path.children).toEqual([])
    })

    // An owned node's element *is* its markup, so it needs a DOM to
    // serialize. The shell is describable without one, which is the whole
    // reason it can be emitted server-side at all.
    it('describes the shell as an ordinary node, not an owned one', () => {
      const svg = renderWithoutDOM(
        new ShapeComponent(circleShape, 'circle')
      ).children![0]

      expect(svg.owned).toBeUndefined()
      expect(svg.reactiveElement).toBeUndefined()
    })

    // The client builds the same element with createElementNS; if the two
    // drifted, the box the server reserved would not be the box the client
    // renders into.
    it('matches the element the client builds', () => {
      const shell = renderWithoutDOM(
        new ShapeComponent(circleShape, 'circle')
      ).children![0]
      const { svg } = mount(Circle())

      for (const [name, value] of Object.entries(shell.props)) {
        if (name === 'style') continue
        expect(svg.getAttribute(name)).toBe(value)
      }
      expect(svg.style.display).toBe(shell.props.style.display)
      expect(svg.style.overflow).toBe(shell.props.style.overflow)
    })
  })

  describe('review fixes', () => {
    // `paint()` used to add strokeBorder's half-line inset itself while
    // `path()` did not, so a shape reported geometry it did not draw. That
    // matters because `Shape` exists for `clipShape` to consume.
    it('reports the geometry it actually draws', async () => {
      const shape: any = Circle().strokeBorder('red', 4)
      const { path } = mount(shape)

      resizeAll(40, 40)
      await flushReactiveUpdates()

      expect(shape.path({ x: 0, y: 0, width: 40, height: 40 })).toBe(
        path.getAttribute('d')
      )
    })

    // `.stroke()` promises a line centered on the edge, so it has to clear
    // an inset a previous `.strokeBorder()` asked for.
    it('clears strokeBorder inset when a plain stroke replaces it', async () => {
      const { path } = mount(Circle().strokeBorder('red', 4).stroke('blue', 4))

      resizeAll(40, 40)
      await flushReactiveUpdates()

      expect(path.getAttribute('stroke')).toBe('blue')
      expect(path.getAttribute('d')).toBe(CIRCLE_40)
    })

    it('keeps the inset when strokeBorder follows a plain stroke', async () => {
      const { path } = mount(Circle().stroke('blue', 4).strokeBorder('red', 4))

      resizeAll(40, 40)
      await flushReactiveUpdates()

      expect(path.getAttribute('d')).toBe(
        'M 38 20 A 18 18 0 1 1 2 20 A 18 18 0 1 1 38 20 Z'
      )
    })

    // `ModifierBuilder.build()` clones the component and renders the clone,
    // so the styling has to survive a clone or the chain would render bare.
    // This is also why the methods are chain-time only: the instance a caller
    // holds is never the one on screen.
    it('carries styling across the clone that build() renders', async () => {
      const original: any = Circle().inset(1).stroke('tint', 2)
      const built = original.build()

      expect(built).not.toBe(original)

      const { path } = mount(built)
      resizeAll(40, 40)
      await flushReactiveUpdates()

      expect(path.getAttribute('stroke')).toBe('tint')
      expect(path.getAttribute('stroke-width')).toBe('2')
      expect(path.getAttribute('d')).toBe(
        'M 39 20 A 19 19 0 1 1 1 20 A 19 19 0 1 1 39 20 Z'
      )
    })

    it('formats a computed line width without float noise', () => {
      const { path } = mount(Circle().stroke('red', 0.1 + 0.2))
      expect(path.getAttribute('stroke-width')).toBe('0.3')
    })

    // A NaN length used to reach `Math.max(0, NaN)` and put NaN in the path
    // data, which renders as nothing with no error to follow.
    it('treats a non-finite inset as zero rather than drawing nothing', async () => {
      const { path } = mount(Circle().inset(Number.NaN))

      resizeAll(40, 40)
      await flushReactiveUpdates()

      expect(path.getAttribute('d')).toBe(CIRCLE_40)
    })

    it('treats a non-finite line width as zero', () => {
      const { path } = mount(Circle().stroke('red', Number.NaN))
      expect(path.getAttribute('stroke-width')).toBe('0')
    })

    // SVG ignores a negative stroke-width, so writing one through would be
    // dropped by the renderer with nothing to show for it.
    it('floors a negative line width', () => {
      const { path } = mount(Circle().stroke('red', -4))
      expect(path.getAttribute('stroke-width')).toBe('0')
    })

    // `strokeBorder`'s inset comes from that same floored width. A raw
    // negative one would *outset* the path — the fill spilling outside the
    // frame `strokeBorder` promises to stay inside, with no stroke drawn to
    // hint at why.
    it('keeps a negative strokeBorder inside the frame', async () => {
      const { path } = mount(Circle().fill('red').strokeBorder('blue', -4))

      resizeAll(40, 40)
      await flushReactiveUpdates()

      expect(path.getAttribute('d')).toBe(CIRCLE_40)
      expect(path.getAttribute('stroke-width')).toBe('0')
    })

    it('keeps a negative signal-driven strokeBorder inside the frame', async () => {
      const [lineWidth, setLineWidth] = createSignal(4)
      const { path } = mount(Circle().fill('red').strokeBorder('blue', lineWidth))

      resizeAll(40, 40)
      await flushReactiveUpdates()
      expect(path.getAttribute('d')).toBe(
        'M 38 20 A 18 18 0 1 1 2 20 A 18 18 0 1 1 38 20 Z'
      )

      setLineWidth(-4)
      await flushReactiveUpdates()

      expect(path.getAttribute('d')).toBe(CIRCLE_40)
    })

    // `path()` honours insets; `clipPath()` cannot, since CSS basic shapes
    // have no inset form. Pinned so a future `clipShape` designs around it
    // knowingly.
    it('clips to the uninset shape while drawing inset', () => {
      const shape: any = Circle().inset(4)
      expect(shape.clipPath()).toBe('circle()')
      expect(shape.path({ x: 0, y: 0, width: 40, height: 40 })).toBe(
        'M 36 20 A 16 16 0 1 1 4 20 A 16 16 0 1 1 36 20 Z'
      )
    })

    it('warns and draws nothing for a style that is not a color', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      try {
        const { path } = mount(Circle().fill({ nonsense: true } as any))
        expect(path.getAttribute('fill')).toBe('none')
        expect(warn).toHaveBeenCalled()
      } finally {
        warn.mockRestore()
      }
    })

    // `fill` and `stroke` are not modifiers, so with the proxy disabled they
    // exist nowhere else and the shape API would be unusable.
    it('keeps shape methods with the modifier proxy disabled', async () => {
      configureCore({ proxyModifiers: false })
      try {
        const shape: any = Circle()
        expect(typeof shape.fill).toBe('function')
        expect(typeof shape.stroke).toBe('function')
        expect(typeof shape.strokeBorder).toBe('function')
        expect(typeof shape.inset).toBe('function')
        expect(shape.clipPath()).toBe('circle()')

        // Chainable, and the chain still renders.
        const chained = shape.inset(1).stroke('red', 2)
        const { path } = mount(chained)

        resizeAll(40, 40)
        await flushReactiveUpdates()

        expect(path.getAttribute('stroke')).toBe('red')
        expect(path.getAttribute('d')).toBe(
          'M 39 20 A 19 19 0 1 1 1 20 A 19 19 0 1 1 39 20 Z'
        )
      } finally {
        configureCore({ proxyModifiers: true })
      }
    })
  })

  describe('without a ResizeObserver', () => {
    // A `getBoundingClientRect` fallback runs on a microtask after mount, so
    // this is not the dead end it would otherwise be. jsdom does no layout
    // and reports a zero box, which the engine treats as "no measurement"
    // rather than a measurement of zero, so nothing is drawn here.
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

    it('measures from the box once the element is in the document', async () => {
      uninstallResizeObserverStub()
      const originalObserver = globalThis.ResizeObserver
      Object.defineProperty(globalThis, 'ResizeObserver', {
        configurable: true,
        value: undefined,
      })
      try {
        const container = document.createElement('div')
        renderComponent(Circle() as any, container)
        reportBox(container, 40, 40)

        await flushReactiveUpdates()

        expect(pathIn(container).getAttribute('d')).toBe(CIRCLE_40)
      } finally {
        Object.defineProperty(globalThis, 'ResizeObserver', {
          configurable: true,
          value: originalObserver,
        })
      }
    })

    // A shape unmounted and remounted — through a toggled `Show`, say —
    // lands in a host that may be a different size. The frame it kept from
    // the last mount is not a measurement of that host, and here there is no
    // observer to correct it, so the fallback has to run a second time.
    it('re-measures a remounted shape', async () => {
      uninstallResizeObserverStub()
      const originalObserver = globalThis.ResizeObserver
      Object.defineProperty(globalThis, 'ResizeObserver', {
        configurable: true,
        value: undefined,
      })
      try {
        const component = new ShapeComponent(circleShape, 'circle')

        const first = document.createElement('div')
        const dispose = renderComponent(component as any, first)
        reportBox(first, 40, 40)
        await flushReactiveUpdates()
        expect(pathIn(first).getAttribute('d')).toBe(CIRCLE_40)

        dispose()

        const second = document.createElement('div')
        renderComponent(component as any, second)
        reportBox(second, 20, 20)
        await flushReactiveUpdates()

        expect(pathIn(second).getAttribute('d')).toBe(
          'M 20 10 A 10 10 0 1 1 0 10 A 10 10 0 1 1 20 10 Z'
        )
      } finally {
        Object.defineProperty(globalThis, 'ResizeObserver', {
          configurable: true,
          value: originalObserver,
        })
      }
    })
  })
})
