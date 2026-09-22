/**
 * `trim()` and `strokeStyle()`.
 *
 * Trim is the reason the engine draws an SVG `<path>` rather than CSS: with
 * `pathLength="1"` the browser rescales the path's own length to 1, so a
 * fraction of it can be drawn with two attributes and animated by changing
 * one of them — on the element the shape already has, so a transition on it
 * survives.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSignal, flushSync } from '@tachui/core'
import { renderComponent } from '@tachui/core/runtime'
import {
  Capsule,
  Circle,
  Ellipse,
  Rectangle,
  RoundedRectangle,
} from '../../src/shapes'
import {
  installResizeObserverStub,
  resizeAll,
  uninstallResizeObserverStub,
} from './resize-observer-stub'

async function flushReactiveUpdates(): Promise<void> {
  flushSync()
  await new Promise<void>(resolve => queueMicrotask(resolve))
}

function mount(component: unknown): {
  svg: SVGSVGElement
  path: SVGPathElement
} {
  const container = document.createElement('div')
  renderComponent(component as any, container)
  const svg = container.querySelector('svg') as SVGSVGElement
  const path = svg.querySelector('path') as SVGPathElement
  expect(path).not.toBeNull()
  return { svg, path }
}

async function draw(component: unknown): Promise<SVGPathElement> {
  const { path } = mount(component)
  resizeAll(40, 40)
  await flushReactiveUpdates()
  return path
}

const dashes = (path: SVGPathElement) => ({
  pathLength: path.getAttribute('pathLength'),
  dasharray: path.getAttribute('stroke-dasharray'),
  dashoffset: path.getAttribute('stroke-dashoffset'),
})

describe('trim', () => {
  beforeEach(() => {
    installResizeObserverStub()
  })

  afterEach(() => {
    uninstallResizeObserverStub()
  })

  // Three quarters of the path, starting where the path starts — the trailing
  // edge for a circle, as in SwiftUI.
  it('draws a fraction of the path from its start', async () => {
    const path = await draw(Circle().trim(0, 0.75).stroke('red', 4))

    expect(dashes(path)).toEqual({
      pathLength: '1',
      dasharray: '0.75 0.25',
      dashoffset: '0',
    })
  })

  it('slides the drawn run to start at from', async () => {
    const path = await draw(Circle().trim(0.25, 0.75).stroke('red', 4))

    expect(dashes(path)).toEqual({
      pathLength: '1',
      dasharray: '0.5 0.5',
      dashoffset: '-0.25',
    })
  })

  // An untrimmed shape should carry none of this, so nothing has to be
  // reasoned about when reading the markup.
  it('emits no dash attributes for the whole path', async () => {
    const path = await draw(Circle().trim(0, 1).stroke('red', 4))

    expect(dashes(path)).toEqual({
      pathLength: null,
      dasharray: null,
      dashoffset: null,
    })
  })

  it('draws nothing when the range is empty', async () => {
    const path = await draw(Circle().trim(0.5, 0.5).stroke('red', 4))
    expect(path.getAttribute('stroke-dasharray')).toBe('0 1')
  })

  // Out of order draws nothing rather than wrapping: a progress value that
  // arrives backwards should show an empty ring, not a full one.
  it('draws nothing when to is below from', async () => {
    const path = await draw(Circle().trim(0.75, 0.25).stroke('red', 4))
    expect(path.getAttribute('stroke-dasharray')).toBe('0 1')
  })

  it('clamps fractions outside 0...1', async () => {
    const path = await draw(Circle().trim(-1, 2).stroke('red', 4))
    expect(dashes(path)).toEqual({
      pathLength: null,
      dasharray: null,
      dashoffset: null,
    })
  })

  // `pathLength` normalizes every path to the same length, so the same
  // fractions give the same attributes on any shape — which is what makes a
  // progress ring portable across them.
  it('gives the same dashes on every built-in shape', async () => {
    const shapes = [
      Circle(),
      Rectangle(),
      RoundedRectangle(8),
      Ellipse(),
      Capsule(),
    ]

    for (const shape of shapes) {
      const path = await draw((shape as any).trim(0, 0.6).stroke('red', 2))
      expect(dashes(path)).toEqual({
        pathLength: '1',
        dasharray: '0.6 0.4',
        dashoffset: '0',
      })
    }
  })

  describe('driven by a signal', () => {
    it('follows a changing to without replacing the element', async () => {
      const [progress, setProgress] = createSignal(0.25)
      const { svg, path } = mount(Circle().trim(0, progress).stroke('red', 4))
      resizeAll(40, 40)
      await flushReactiveUpdates()

      expect(path.getAttribute('stroke-dasharray')).toBe('0.25 0.75')

      setProgress(0.8)
      await flushReactiveUpdates()

      expect(path.getAttribute('stroke-dasharray')).toBe('0.8 0.2')
      // The same element, restyled — a CSS transition on it survives.
      expect(svg.querySelector('path')).toBe(path)
    })

    // The point of the stable element: a transition set on it keeps running
    // across a trim update, rather than being restarted by a fresh element.
    it('keeps a CSS transition running across an update', async () => {
      const [progress, setProgress] = createSignal(0.2)
      const { svg, path } = mount(Circle().trim(0, progress).stroke('red', 4))
      resizeAll(40, 40)
      await flushReactiveUpdates()

      path.style.transition = 'stroke-dasharray 300ms ease-out'

      setProgress(0.9)
      await flushReactiveUpdates()

      expect(svg.querySelector('path')).toBe(path)
      expect(path.style.transition).toBe('stroke-dasharray 300ms ease-out')
      expect(path.getAttribute('stroke-dasharray')).toBe('0.9 0.1')
    })

    it('follows a changing from through the offset', async () => {
      const [from, setFrom] = createSignal(0)
      const path = await draw(Circle().trim(from, 1).stroke('red', 4))

      // `trim(0, 1)` is the whole path, so it carries no dash attributes at
      // all; they appear when the range becomes partial.
      expect(path.hasAttribute('stroke-dashoffset')).toBe(false)

      setFrom(0.3)
      await flushReactiveUpdates()

      expect(path.getAttribute('stroke-dashoffset')).toBe('-0.3')
      expect(path.getAttribute('stroke-dasharray')).toBe('0.7 0.3')

      // And back again — the attributes are removed, not left stale.
      setFrom(0)
      await flushReactiveUpdates()

      expect(path.hasAttribute('stroke-dasharray')).toBe(false)
      expect(path.hasAttribute('pathLength')).toBe(false)
    })
  })
})

// The documented chain, end to end, so a copy-pasteable example cannot crash
// without a test noticing. Either turn, `.rotationEffect(-90)` or
// `.transform('rotate(-90deg)')`, lands on the wrapper.
describe('the documented progress ring', () => {
  beforeEach(() => {
    installResizeObserverStub()
  })

  afterEach(() => {
    uninstallResizeObserverStub()
  })

  it('builds and draws end to end', async () => {
    const [progress] = createSignal(0.4)

    const path = await draw(
      Circle()
        .trim(0, progress)
        .strokeStyle({ lineWidth: 4, lineCap: 'round' })
        .stroke('#007AFF')
        .transform('rotate(-90deg)')
    )

    expect(path.getAttribute('stroke-dasharray')).toBe('0.4 0.6')
    expect(path.getAttribute('stroke-width')).toBe('4')
    expect(path.getAttribute('stroke-linecap')).toBe('round')
    expect(path.getAttribute('stroke')).toBe('#007AFF')
  })

  it('puts the quarter turn on the wrapper', async () => {
    const container = document.createElement('div')
    renderComponent(
      Circle().trim(0, 0.4).stroke('red', 4).transform('rotate(-90deg)') as any,
      container
    )
    const wrapper = container.querySelector('.tachui-shape') as HTMLElement

    expect(wrapper.style.transform).toContain('rotate(-90deg)')
  })

  it('takes the quarter turn from rotationEffect too', () => {
    const container = document.createElement('div')
    renderComponent(
      (Circle().trim(0, 0.4).stroke('red', 4) as any).rotationEffect(-90),
      container
    )
    const wrapper = container.querySelector('.tachui-shape') as HTMLElement

    expect(wrapper.style.transform).toBe('rotate(-90deg)')
    expect(wrapper.style.transformOrigin).toBe('50% 50%')
  })
})

describe('strokeStyle', () => {
  beforeEach(() => {
    installResizeObserverStub()
  })

  afterEach(() => {
    uninstallResizeObserverStub()
  })

  it('sets cap and join', async () => {
    const path = await draw(
      Circle().strokeStyle({ lineCap: 'round', lineJoin: 'bevel' }).stroke('red')
    )

    expect(path.getAttribute('stroke-linecap')).toBe('round')
    expect(path.getAttribute('stroke-linejoin')).toBe('bevel')
  })

  it('emits nothing for the properties it was not given', async () => {
    const path = await draw(Circle().strokeStyle({ lineCap: 'round' }).stroke('red'))

    expect(path.hasAttribute('stroke-linejoin')).toBe(false)
    expect(path.hasAttribute('stroke-dasharray')).toBe(false)
  })

  it('dashes the stroke in pixels, with no pathLength to rescale them', async () => {
    const path = await draw(
      Circle().strokeStyle({ dash: [6, 3], dashPhase: 2 }).stroke('red', 2)
    )

    expect(path.getAttribute('stroke-dasharray')).toBe('6 3')
    expect(path.getAttribute('stroke-dashoffset')).toBe('2')
    expect(path.hasAttribute('pathLength')).toBe(false)
  })

  // The width belongs to the style as much as to `stroke()`, so the two forms
  // combine in either order rather than the later one winning blindly.
  it('carries a line width that a bare stroke does not reset', async () => {
    const path = await draw(
      Circle().strokeStyle({ lineWidth: 4, lineCap: 'round' }).stroke('tint')
    )

    expect(path.getAttribute('stroke-width')).toBe('4')
    expect(path.getAttribute('stroke-linecap')).toBe('round')
  })

  it('still takes an explicit width from stroke', async () => {
    const path = await draw(
      Circle().strokeStyle({ lineWidth: 4 }).stroke('tint', 9)
    )
    expect(path.getAttribute('stroke-width')).toBe('9')
  })

  it('accumulates across calls', async () => {
    const path = await draw(
      Circle()
        .strokeStyle({ lineCap: 'round' })
        .strokeStyle({ lineJoin: 'round' })
        .stroke('red')
    )

    expect(path.getAttribute('stroke-linecap')).toBe('round')
    expect(path.getAttribute('stroke-linejoin')).toBe('round')
  })

  it('follows a signal cap', async () => {
    const [cap, setCap] = createSignal<'butt' | 'round'>('butt')
    const path = await draw(Circle().strokeStyle({ lineCap: cap }).stroke('red'))

    expect(path.getAttribute('stroke-linecap')).toBe('butt')

    setCap('round')
    await flushReactiveUpdates()

    expect(path.getAttribute('stroke-linecap')).toBe('round')
  })

  // The warning has to agree with what the paint actually does with a dash:
  // an empty array contributes no pattern, so there is nothing for a trim to
  // conflict with and nothing to say.
  it('says nothing about an empty dash array under a trim', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const path = await draw(
        Circle().trim(0, 0.5).strokeStyle({ dash: [] }).stroke('red', 2)
      )

      expect(path.getAttribute('stroke-dasharray')).toBe('0.5 0.5')
      expect(warn).not.toHaveBeenCalled()
    } finally {
      warn.mockRestore()
    }
  })

  // The trim owns `stroke-dashoffset` as much as `stroke-dasharray`, so a
  // phase is dropped under one — which should be said, not done quietly.
  it('warns about a dashPhase the trim will drop', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const path = await draw(
        Circle().trim(0, 0.5).strokeStyle({ dashPhase: 3 }).stroke('red', 2)
      )

      expect(path.getAttribute('stroke-dashoffset')).toBe('0')
      expect(warn).toHaveBeenCalledTimes(1)
    } finally {
      warn.mockRestore()
    }
  })

  it('applies a dashPhase when nothing is trimmed', async () => {
    const path = await draw(
      Circle().strokeStyle({ dashPhase: 3 }).stroke('red', 2)
    )
    expect(path.getAttribute('stroke-dashoffset')).toBe('3')
  })

  it('emits nothing for an empty dash array', async () => {
    const path = await draw(Circle().strokeStyle({ dash: [] }).stroke('red', 2))
    expect(path.hasAttribute('stroke-dasharray')).toBe(false)
  })

  // A full-range trim draws the whole path and sets no `pathLength`, so there
  // is nothing for a dash to collide with — it applies, and no warning fires.
  it('lets a dash through a full-range trim', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const path = await draw(
        Circle().trim(0, 1).strokeStyle({ dash: [4, 2] }).stroke('red', 2)
      )

      expect(path.getAttribute('stroke-dasharray')).toBe('4 2')
      expect(path.hasAttribute('pathLength')).toBe(false)
      expect(warn).not.toHaveBeenCalled()
    } finally {
      warn.mockRestore()
    }
  })

  // `build()` renders a clone, so a flag that did not carry across would let
  // the shape actually on screen warn a second time.
  it('warns once across the clone that build() renders', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const shape: any = Circle()
        .trim(0, 0.5)
        .strokeStyle({ dash: [4, 2] })
        .stroke('red', 2)

      await draw(shape)
      await draw(shape.build ? shape.build() : shape)

      expect(warn).toHaveBeenCalledTimes(1)
    } finally {
      warn.mockRestore()
    }
  })

  // Both want `stroke-dasharray`, and `pathLength` would rescale the dash
  // units besides. Trim wins, and says so once.
  it('lets trim win over a dash pattern, with a warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const path = await draw(
        Circle().trim(0, 0.5).strokeStyle({ dash: [4, 2] }).stroke('red', 2)
      )

      expect(path.getAttribute('stroke-dasharray')).toBe('0.5 0.5')
      expect(path.getAttribute('pathLength')).toBe('1')
      expect(warn).toHaveBeenCalledTimes(1)
    } finally {
      warn.mockRestore()
    }
  })
})
