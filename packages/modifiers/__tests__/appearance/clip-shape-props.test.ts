/**
 * The props-based `clipShape`.
 *
 * `AppearanceModifier` carries a `clipShape` prop alongside the standalone
 * `clipShape()` modifier, and until now held a private copy of the switch.
 * Both go through one serializer, so these pin that the two forms agree —
 * including the shape-instance form and the closest-side circle.
 *
 * jsdom's CSS parser drops `clip-path`, so a mock style object stands in, as
 * it does in `clip-shape.test.ts`. The two forms also *write* the property
 * differently — the props path through `setProperty('clip-path', …)`, the
 * modifier through a direct `style.clipPath =` — which a real DOM makes
 * equivalent and the mock records separately.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { AppearanceModifier } from '../../src/basic/base'
import { clipShape } from '../../src/appearance/clip-shape'
import type { ModifierContext } from '@tachui/types/modifiers'
import type { DOMNode } from '@tachui/types/runtime'
import type { Shape } from '@tachui/types/shapes'

const stub = (clip: string): Shape => ({ path: () => '', clipPath: () => clip })

/** An element whose style records both spellings of a property. */
function mockElement(): HTMLElement {
  const store: Record<string, string> = {}
  const style = new Proxy(store as any, {
    get: (target, prop) => {
      if (prop === 'setProperty') {
        return (name: string, value: string) => {
          target[name] = value
        }
      }
      if (prop === 'getPropertyValue') {
        return (name: string) => target[name] ?? ''
      }
      return target[prop as string] ?? ''
    },
    set: (target, prop, value) => {
      target[prop as string] = value
      return true
    },
  })
  return { style } as unknown as HTMLElement
}

/** Whichever spelling the path under test used. */
function clipOf(element: HTMLElement): string {
  return element.style.clipPath || element.style.getPropertyValue('clip-path')
}

describe('clipShape as an appearance prop', () => {
  let element: HTMLElement
  let context: ModifierContext

  beforeEach(() => {
    element = mockElement()
    context = {
      componentId: 'test',
      element,
      phase: 'creation',
    } as unknown as ModifierContext
  })

  function viaProps(shape: unknown, parameters?: Record<string, any>): string {
    new AppearanceModifier({ clipShape: { shape, parameters } } as any).apply(
      { element } as unknown as DOMNode,
      context
    )
    return clipOf(element)
  }

  function viaModifier(
    shape: unknown,
    parameters?: Record<string, any>
  ): string {
    const target = mockElement()
    clipShape(shape as any, parameters).apply({} as DOMNode, {
      ...context,
      element: target,
    } as ModifierContext)
    return clipOf(target)
  }

  it.each([
    ['circle', undefined],
    ['ellipse', undefined],
    ['ellipse', { radiusX: '30%', radiusY: '40%' }],
    ['rect', undefined],
    ['rect', { inset: 8 }],
    ['polygon', { points: '0% 0%, 100% 100%, 0% 100%' }],
  ] as const)('agrees with the modifier form for %s', (shape, parameters) => {
    const fromProps = viaProps(shape, parameters)
    expect(fromProps).not.toBe('')
    expect(fromProps).toBe(viaModifier(shape, parameters))
  })

  it('clips to the inscribed circle, as the modifier form does', () => {
    expect(viaProps('circle')).toBe('circle()')
  })

  it('takes a shape instance', () => {
    expect(viaProps(stub('inset(0 round 12px)'))).toBe('inset(0 round 12px)')
  })

  // The one place the two forms differ, and always have: a polygon with no
  // points falls back to the whole box here rather than setting nothing.
  it('keeps the full-box fallback for a polygon with no points', () => {
    expect(viaProps('polygon')).toBe(
      'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
    )
    expect(viaModifier('polygon')).toBe('')
  })
})
