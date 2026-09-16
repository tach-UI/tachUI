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

    // `clampCornerRadius` floors the drawn radius at zero; the clip has to
    // floor with it rather than emit a negative CSS length.
    it('floors a negative radius on the clip side too', () => {
      expect(RoundedRectangle(-4).clipPath()).toBe('inset(0 round 0px)')
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
      expect(Capsule().clipPath()).toBe('inset(0 round 20000000px)')
    })

    // The scale-down only happens while the radius overlaps, so a radius
    // under half the short side would clip the literal rounded rect while the
    // path drew a capsule. `clipPath()` takes no rect, so the radius cannot be
    // derived from the box; it has to out-reach every box instead. Browsers
    // cap an element near 33.5 million pixels, so half a short side tops out
    // near 16.8 million.
    it('clips with a radius past half the short side of any renderable frame', () => {
      const radius = Number(/round (\d+)px/.exec(Capsule().clipPath())?.[1])
      // Chromium's layout unit is 32-bit fixed point at 1/64px.
      expect(radius).toBeGreaterThan(2 ** 31 / 64 / 2)
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

describe('border curvature against the frame corner', () => {
  beforeEach(() => {
    installResizeObserverStub()
  })

  afterEach(() => {
    uninstallResizeObserverStub()
  })

  /** The radius of the first arc in the drawn path. */
  function arcRadius(path: SVGPathElement): number {
    return Number(/A (\S+) /.exec(path.getAttribute('d') ?? '')?.[1])
  }

  // Every shape but RoundedRectangle recomputes its curvature from the inset
  // rect, so a strokeBorder's outer edge lands on the frame's own corner.
  it('lands a Capsule border flush with the frame corner', async () => {
    const path = await draw(Capsule().strokeBorder('red', 4), 100, 50)
    expect(arcRadius(path)).toBe(23)
    expect(arcRadius(path) + 4 / 2).toBe(Math.min(100, 50) / 2)
  })

  // A RoundedRectangle keeps the radius it was given, so its border sits
  // proud of a host with the same corner radius by half the line width. This
  // is the inset-does-not-reduce-the-radius behaviour where it actually bites.
  it('leaves a RoundedRectangle border proud by half the line width', async () => {
    const path = await draw(
      RoundedRectangle(12).strokeBorder('red', 4),
      100,
      50
    )
    expect(arcRadius(path)).toBe(12)
    expect(arcRadius(path) + 4 / 2).toBe(14)
  })

  it('lands it flush once half the line width is subtracted', async () => {
    const path = await draw(
      RoundedRectangle(12 - 4 / 2).strokeBorder('red', 4),
      100,
      50
    )
    expect(arcRadius(path) + 4 / 2).toBe(12)
  })

  // An Ellipse's border stays inside the frame. The stroke's outer edge is
  // the drawn ellipse grown by half the line width in every direction, and a
  // Minkowski sum with a disc of radius d has support function h(u) + d, so
  // its extent is exactly (a + d) x (b + d) — the frame, touched at the four
  // axis extremes.
  it('keeps an Ellipse border inside the frame, touching at the axis extremes', async () => {
    const path = await draw(Ellipse().strokeBorder('red', 12), 200, 40)
    const match = /A (\S+) (\S+)/.exec(path.getAttribute('d') ?? '')
    expect(match).not.toBeNull()
    expect(Number(match?.[1]) + 12 / 2).toBe(200 / 2)
    expect(Number(match?.[2]) + 12 / 2).toBe(40 / 2)
  })

  // It is still not flush with an *elliptical* host, because the parallel
  // curve of an ellipse is not an ellipse: between the extremes the outer
  // edge bulges past the ellipse filling the frame. Pinned so the bulge is
  // not mistaken for a bug and "fixed" into a surprise, and so the flush
  // claim in the docs stays narrowed to Capsule and Circle.
  describe('an Ellipse border against an elliptical host', () => {
    /** How far the stroke's outer edge escapes each boundary, sampled. */
    function escape(width: number, height: number, lineWidth: number) {
      const d = lineWidth / 2
      const a = (width - lineWidth) / 2
      const b = (height - lineWidth) / 2
      let pastFrame = 0
      let pastHostEllipse = 0
      for (let i = 0; i <= 2000; i++) {
        const t = (Math.PI / 2) * (i / 2000)
        const gx = Math.cos(t) / a
        const gy = Math.sin(t) / b
        const g = Math.hypot(gx, gy)
        const x = a * Math.cos(t) + (d * gx) / g
        const y = b * Math.sin(t) + (d * gy) / g
        pastFrame = Math.max(pastFrame, x - width / 2, y - height / 2)
        const reach = Math.hypot(x, y)
        const toHost = reach / Math.hypot(x / (width / 2), y / (height / 2))
        pastHostEllipse = Math.max(pastHostEllipse, reach - toHost)
      }
      return { pastFrame, pastHostEllipse }
    }

    it('never crosses the frame, however flat', () => {
      for (const [w, h, lw] of [
        [100, 50, 4],
        [100, 25, 8],
        [200, 40, 12],
      ] as const) {
        expect(escape(w, h, lw).pastFrame).toBeCloseTo(0, 9)
      }
    })

    it('bulges past the host ellipse, the more the flatter the frame', () => {
      expect(escape(100, 50, 4).pastHostEllipse).toBeCloseTo(0.15, 2)
      expect(escape(200, 40, 12).pastHostEllipse).toBeCloseTo(3.91, 2)
    })

    // A circle is the case where the parallel curve *is* the same family, so
    // Circle's border is flush and Ellipse agrees with it in a square frame.
    it('is flush in a square frame, where the ellipse is a circle', () => {
      expect(escape(100, 100, 20).pastHostEllipse).toBeCloseTo(0, 9)
    })
  })
})
