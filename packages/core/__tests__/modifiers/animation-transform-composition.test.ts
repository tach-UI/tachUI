/**
 * Core `AnimationModifier` transforms compose
 *
 * `AnimationModifier` is public in `@tachui/core/modifiers`, so a caller can
 * construct it with `transform`, `scaleEffect` or `rotationEffect` directly.
 * Each writes its own part through `setTransformPart`, the same composer the
 * `@tachui/modifiers` factories use, so none erases another — including
 * across the two packages on one element.
 */

import { describe, expect, it } from 'vitest'
import { createSignal, flushSync } from '../../src/reactive'
import type { ModifierContext } from '../../src/modifiers/types'
import { AnimationModifier } from '../../src/modifiers/base'
import { setTransformPart } from '../../src/modifiers/transform-composition'

function makeContext(): ModifierContext & { element: HTMLElement } {
  const element = document.createElement('div')
  return { componentId: 'test', element, phase: 'creation' }
}

function apply(props: object, context: ModifierContext): void {
  new AnimationModifier(props as any).apply({} as any, context)
}

describe('core AnimationModifier transform composition', () => {
  it('rotates around the anchor it is given', () => {
    const context = makeContext()

    apply({ rotationEffect: { angle: 45, anchor: 'topLeading' } }, context)

    expect(context.element.style.transform).toBe(
      'translate(-50%, -50%) rotate(45deg) translate(50%, 50%)'
    )
  })

  it('follows a signal angle', () => {
    const context = makeContext()
    const [angle, setAngle] = createSignal(10)

    apply({ rotationEffect: { angle } }, context)
    setAngle(20)
    flushSync()

    expect(context.element.style.transform).toBe('rotate(20deg)')
  })

  it('keeps a scale and a rotation when a raw transform follows them', () => {
    const context = makeContext()

    apply({ scaleEffect: { x: 2, anchor: 'topLeading' } }, context)
    apply({ rotationEffect: { angle: 90, anchor: 'bottomTrailing' } }, context)
    apply({ transform: 'skewX(3deg)' }, context)

    expect(context.element.style.transform).toBe(
      'translate(50%, 50%) rotate(90deg) translate(-50%, -50%) ' +
        'translate(-50%, -50%) scale(2, 2) translate(50%, 50%) skewX(3deg)'
    )
    expect(context.element.style.transformOrigin).toBe('')
  })

  it('keeps the other parts while a signal-driven raw transform updates', () => {
    const context = makeContext()
    const [raw, setRaw] = createSignal('skewX(3deg)')

    apply({ rotationEffect: { angle: 90 } }, context)
    apply({ transform: raw }, context)
    setRaw('skewY(4deg)')
    flushSync()

    expect(context.element.style.transform).toBe('rotate(90deg) skewY(4deg)')
  })

  // The modifiers package writes through this same composer, so a part it
  // sets — an offset here — and one core's class sets land in one record.
  it('shares one record per element with other writers', () => {
    const context = makeContext()

    setTransformPart(context.element, 'offset', 'translate(1px, 2px)')
    apply({ rotationEffect: { angle: 90 } }, context)

    expect(context.element.style.transform).toBe(
      'translate(1px, 2px) rotate(90deg)'
    )
  })
})
