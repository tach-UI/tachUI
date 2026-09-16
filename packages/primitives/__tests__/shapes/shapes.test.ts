/**
 * Rectangle, RoundedRectangle, Ellipse and Capsule on the shape engine.
 *
 * The engine itself — measurement, painting, reactivity, disposal — is covered
 * by `Circle.test.ts`. What is checked here is each shape's geometry, the
 * engine methods applied to it, and its `clip-path`.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createSignal, flushSync } from '@tachui/core'
import { renderComponent } from '@tachui/core/runtime'
import {
  Capsule,
  Circle,
  Ellipse,
  Rectangle,
  RoundedRectangle,
} from '../../src'
import {
  installResizeObserverStub,
  resizeAll,
  uninstallResizeObserverStub,
} from './resize-observer-stub'

async function flushReactiveUpdates(): Promise<void> {
  flushSync()
  await new Promise<void>(resolve => queueMicrotask(resolve))
}

/** Mount a shape, report `width` x `height`, and hand back its `<path>`. */
async function draw(
  component: unknown,
  width: number,
  height: number
): Promise<SVGPathElement> {
  const container = document.createElement('div')
  renderComponent(component as any, container)
  const path = container.querySelector('path') as SVGPathElement
  expect(path).not.toBeNull()
  resizeAll(width, height)
  await flushReactiveUpdates()
  return path
}

describe('built-in shapes', () => {
  beforeEach(() => {
    installResizeObserverStub()
  })

  afterEach(() => {
    uninstallResizeObserverStub()
  })

  describe('Rectangle', () => {
    it('fills a wide frame', async () => {
      const path = await draw(Rectangle(), 100, 50)
      expect(path.getAttribute('d')).toBe('M 0 0 L 100 0 L 100 50 L 0 50 Z')
    })

    it('fills a tall frame', async () => {
      const path = await draw(Rectangle(), 50, 100)
      expect(path.getAttribute('d')).toBe('M 0 0 L 50 0 L 50 100 L 0 100 Z')
    })

    it('clips to its box', () => {
      expect(Rectangle().clipPath()).toBe('inset(0)')
    })
  })

  describe('RoundedRectangle', () => {
    it('fills a wide frame', async () => {
      const path = await draw(RoundedRectangle(12), 100, 50)
      expect(path.getAttribute('d')).toBe(
        'M 12 0 L 88 0 A 12 12 0 0 1 100 12 L 100 38 A 12 12 0 0 1 88 50 ' +
          'L 12 50 A 12 12 0 0 1 0 38 L 0 12 A 12 12 0 0 1 12 0 Z'
      )
    })

    it('fills a tall frame', async () => {
      const path = await draw(RoundedRectangle(12), 50, 100)
      expect(path.getAttribute('d')).toBe(
        'M 12 0 L 38 0 A 12 12 0 0 1 50 12 L 50 88 A 12 12 0 0 1 38 100 ' +
          'L 12 100 A 12 12 0 0 1 0 88 L 0 12 A 12 12 0 0 1 12 0 Z'
      )
    })

    it('accepts the options form', async () => {
      const positional = await draw(RoundedRectangle(12), 100, 50)
      const options = await draw(
        RoundedRectangle({ cornerRadius: 12 }),
        100,
        50
      )
      expect(options.getAttribute('d')).toBe(positional.getAttribute('d'))
    })

    // A radius past half the short side becomes a capsule rather than the
    // elliptical corners an SVG `<rect rx ry>` would draw.
    it('clamps a radius larger than half the short side', async () => {
      const clamped = await draw(RoundedRectangle(40), 100, 50)
      const capsule = await draw(Capsule(), 100, 50)
      expect(clamped.getAttribute('d')).toBe(capsule.getAttribute('d'))
    })

    it('takes a signal radius and follows it', async () => {
      const [radius, setRadius] = createSignal(12)
      const path = await draw(RoundedRectangle(radius), 100, 50)
      expect(path.getAttribute('d')).toContain('A 12 12')

      setRadius(4)
      await flushReactiveUpdates()

      expect(path.getAttribute('d')).toContain('A 4 4')
    })

    it('clips with the same radius it draws', () => {
      expect(RoundedRectangle(12).clipPath()).toBe('inset(0 round 12px)')
      expect(RoundedRectangle({ cornerRadius: 8 }).clipPath()).toBe(
        'inset(0 round 8px)'
      )
    })
  })

  describe('Ellipse', () => {
    it('fills a wide frame rather than inscribing in the short side', async () => {
      const path = await draw(Ellipse(), 100, 50)
      expect(path.getAttribute('d')).toBe(
        'M 100 25 A 50 25 0 1 1 0 25 A 50 25 0 1 1 100 25 Z'
      )
    })

    it('fills a tall frame', async () => {
      const path = await draw(Ellipse(), 50, 100)
      expect(path.getAttribute('d')).toBe(
        'M 50 50 A 25 50 0 1 1 0 50 A 25 50 0 1 1 50 50 Z'
      )
    })

    it('agrees with Circle in a square frame', async () => {
      const ellipse = await draw(Ellipse(), 40, 40)
      const circle = await draw(Circle(), 40, 40)
      expect(ellipse.getAttribute('d')).toBe(circle.getAttribute('d'))
    })

    it('clips to the ellipse filling its box', () => {
      expect(Ellipse().clipPath()).toBe('ellipse()')
    })
  })

  describe('Capsule', () => {
    it('caps the short axis of a wide frame', async () => {
      const path = await draw(Capsule(), 100, 50)
      expect(path.getAttribute('d')).toBe(
        'M 25 0 L 75 0 A 25 25 0 0 1 100 25 L 100 25 A 25 25 0 0 1 75 50 ' +
          'L 25 50 A 25 25 0 0 1 0 25 L 0 25 A 25 25 0 0 1 25 0 Z'
      )
    })

    it('caps the short axis of a tall frame', async () => {
      const path = await draw(Capsule(), 50, 100)
      expect(path.getAttribute('d')).toBe(
        'M 25 0 L 25 0 A 25 25 0 0 1 50 25 L 50 75 A 25 25 0 0 1 25 100 ' +
          'L 25 100 A 25 25 0 0 1 0 75 L 0 25 A 25 25 0 0 1 25 0 Z'
      )
    })

    // `inset(0 round 50%)` would resolve per axis and give a 50x25 ellipse in
    // a wide box. An over-large radius makes CSS scale all four corners by one
    // factor, landing on `min(w, h) / 2` — the capsule the path draws.
    it('clips with a radius CSS scales down to the capsule', () => {
      expect(Capsule().clipPath()).toBe('inset(0 round 9999px)')
    })
  })

  describe('engine methods on every shape', () => {
    const shapes = [
      ['Rectangle', () => Rectangle(), 'M 4 4 L 36 4 L 36 36 L 4 36 Z'],
      [
        'RoundedRectangle',
        () => RoundedRectangle(8),
        'M 12 4 L 28 4 A 8 8 0 0 1 36 12 L 36 28 A 8 8 0 0 1 28 36 ' +
          'L 12 36 A 8 8 0 0 1 4 28 L 4 12 A 8 8 0 0 1 12 4 Z',
      ],
      [
        'Ellipse',
        () => Ellipse(),
        'M 36 20 A 16 16 0 1 1 4 20 A 16 16 0 1 1 36 20 Z',
      ],
      [
        'Capsule',
        () => Capsule(),
        'M 20 4 L 20 4 A 16 16 0 0 1 36 20 L 36 20 A 16 16 0 0 1 20 36 ' +
          'L 20 36 A 16 16 0 0 1 4 20 L 4 20 A 16 16 0 0 1 20 4 Z',
      ],
    ] as const

    it.each(shapes)('%s shrinks symmetrically under inset', async (
      _name,
      make,
      expected
    ) => {
      const path = await draw((make() as any).inset(4), 40, 40)
      expect(path.getAttribute('d')).toBe(expected)
    })

    // strokeBorder insets by half the line width, so a 4px stroke centered on
    // the inset path spans 0..4 from the frame edge and nothing lies outside.
    it.each(shapes)('%s keeps a strokeBorder inside the frame', async (
      _name,
      make
    ) => {
      const bordered = await draw(
        (make() as any).strokeBorder('red', 4),
        40,
        40
      )
      const inset = await draw((make() as any).inset(2), 40, 40)

      expect(bordered.getAttribute('d')).toBe(inset.getAttribute('d'))
      expect(bordered.getAttribute('stroke-width')).toBe('4')
      expect(bordered.getAttribute('fill')).toBe('none')
    })

    it.each(shapes)('%s fills and strokes', async (_name, make) => {
      const path = await draw((make() as any).fill('blue').stroke('red', 2), 40, 40)
      expect(path.getAttribute('fill')).toBe('blue')
      expect(path.getAttribute('stroke')).toBe('red')
    })
  })
})
