/**
 * `clipShape` with a real shape instance.
 *
 * `@tachui/modifiers` cannot import a shape — the dependency runs the other
 * way — so its own tests use structural stubs of the `Shape` contract. This is
 * where the two halves meet: the built-in shapes clipping a real component
 * through the real modifier.
 */

import { describe, expect, it } from 'vitest'
import { createSignal, flushSync } from '@tachui/core'
import { renderComponent } from '@tachui/core/runtime'
import { Text } from '../../src'
import {
  Capsule,
  Circle,
  Ellipse,
  Rectangle,
  RoundedRectangle,
} from '../../src/shapes'

/** Clip a host with `shape` and hand back the resulting `clip-path`. */
function clipPathOf(shape: unknown): string {
  const container = document.createElement('div')
  renderComponent(
    Text('host')
      .frame({ width: 100, height: 50 })
      .clipShape(shape as any) as any,
    container
  )
  const host = container.querySelector('.tachui-text') as HTMLElement
  expect(host).not.toBeNull()
  return host.style.clipPath
}

describe('clipShape with a shape instance', () => {
  it('clips to each built-in shape', () => {
    expect(clipPathOf(Circle())).toBe('circle()')
    expect(clipPathOf(Rectangle())).toBe('inset(0)')
    expect(clipPathOf(Ellipse())).toBe('ellipse()')
    expect(clipPathOf(RoundedRectangle(12))).toBe('inset(0 round 12px)')
    expect(clipPathOf(RoundedRectangle({ cornerRadius: 8 }))).toBe(
      'inset(0 round 8px)'
    )
    expect(clipPathOf(Capsule())).toBe('inset(0 round 20000000px)')
  })

  // The whole reason the string form changed: both spellings of "a circle"
  // now mean the inscribed one.
  it('agrees with the string form for a circle', () => {
    expect(clipPathOf(Circle())).toBe(clipPathOf('circle'))
  })

  // Insets apply to the drawn path, not to the clip — CSS basic shapes have
  // no inset form, which `Shape.clipPath` records. Pinned so the asymmetry is
  // deliberate rather than discovered.
  it('clips as though uninset', () => {
    expect(clipPathOf(Circle().inset(4))).toBe(clipPathOf(Circle()))
    expect(clipPathOf(RoundedRectangle(12).inset(4))).toBe(
      'inset(0 round 12px)'
    )
  })

  // The clip follows a signal radius, because the modifier is applied inside
  // a tracked scope and `clipPath()` reads the signal there. One host and one
  // shape throughout: rebuilding either per assertion would pass whether the
  // clip were live or a snapshot, which is the distinction being drawn.
  it('follows a signal radius on the host it already clipped', () => {
    const [radius, setRadius] = createSignal(6)
    const container = document.createElement('div')
    renderComponent(
      Text('host')
        .frame({ width: 100, height: 50 })
        .clipShape(RoundedRectangle(radius) as any) as any,
      container
    )
    const host = container.querySelector('.tachui-text') as HTMLElement
    expect(host.style.clipPath).toBe('inset(0 round 6px)')

    setRadius(10)
    flushSync()

    expect(host.style.clipPath).toBe('inset(0 round 10px)')
    // The same element, restyled — not a re-render that happened to look right.
    expect(container.querySelector('.tachui-text')).toBe(host)
  })
})
