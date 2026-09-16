/**
 * `clipShape` with a real shape instance.
 *
 * `@tachui/modifiers` cannot import a shape — the dependency runs the other
 * way — so its own tests use structural stubs of the `Shape` contract. This is
 * where the two halves meet: the built-in shapes clipping a real component
 * through the real modifier.
 */

import { describe, expect, it } from 'vitest'
import { createSignal } from '@tachui/core'
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

  // A shape reads its radius when asked, so a signal is a snapshot here while
  // the drawn path stays live. `roundedRectangleShape` documents it.
  it('takes a signal radius at the value it has when the clip is built', () => {
    const [radius, setRadius] = createSignal(6)
    expect(clipPathOf(RoundedRectangle(radius))).toBe('inset(0 round 6px)')

    setRadius(10)
    expect(clipPathOf(RoundedRectangle(radius))).toBe('inset(0 round 10px)')
  })
})
