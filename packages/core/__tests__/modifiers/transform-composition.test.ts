/**
 * Transform composition
 *
 * The parts `offset`, `rotationEffect`, `scaleEffect` and a raw `transform`
 * each own, composed into one CSS `transform` so no writer erases another.
 */

import { describe, expect, it } from 'vitest'
import {
  anchorTransform,
  setTransformPart,
} from '../../src/modifiers/transform-composition'

function element(transform = '') {
  return { style: { transform } }
}

describe('anchorTransform', () => {
  it('leaves a centered function unwrapped', () => {
    expect(anchorTransform('rotate(10deg)')).toBe('rotate(10deg)')
    expect(anchorTransform('rotate(10deg)', 'center')).toBe('rotate(10deg)')
  })

  it('wraps a function to turn around its anchor', () => {
    expect(anchorTransform('rotate(10deg)', 'topLeading')).toBe(
      'translate(-50%, -50%) rotate(10deg) translate(50%, 50%)'
    )
    expect(anchorTransform('scale(2, 2)', 'trailing')).toBe(
      'translate(50%, 0%) scale(2, 2) translate(-50%, 0%)'
    )
  })
})

describe('setTransformPart', () => {
  it('composes parts outermost first, whatever order they are set in', () => {
    const target = element()

    setTransformPart(target, 'raw', 'skewX(5deg)')
    setTransformPart(target, 'scale', 'scale(2, 2)')
    setTransformPart(target, 'rotation', 'rotate(90deg)')
    setTransformPart(target, 'offset', 'translate(1px, 2px)')

    expect(target.style.transform).toBe(
      'translate(1px, 2px) rotate(90deg) scale(2, 2) skewX(5deg)'
    )
  })

  it('replaces a part in place', () => {
    const target = element()

    setTransformPart(target, 'rotation', 'rotate(10deg)')
    setTransformPart(target, 'scale', 'scale(2, 2)')
    setTransformPart(target, 'rotation', 'rotate(20deg)')

    expect(target.style.transform).toBe('rotate(20deg) scale(2, 2)')
  })

  it('clears a part on null, an empty string or none', () => {
    const target = element()
    setTransformPart(target, 'rotation', 'rotate(10deg)')

    for (const cleared of [null, '', 'none']) {
      setTransformPart(target, 'raw', 'skewX(5deg)')
      setTransformPart(target, 'raw', cleared)
      expect(target.style.transform).toBe('rotate(10deg)')
    }
  })

  it('keeps a transform that was there first, ahead of the parts', () => {
    const target = element('perspective(100px)')

    setTransformPart(target, 'rotation', 'rotate(10deg)')

    expect(target.style.transform).toBe('perspective(100px) rotate(10deg)')
  })

  it('replaces functions of its own kind that were there first', () => {
    const target = element('translateX(5px) scale(3) rotate(1deg)')

    setTransformPart(target, 'offset', 'translate(1px, 2px)')

    expect(target.style.transform).toBe('scale(3) rotate(1deg) translate(1px, 2px)')
  })

  // `none` is the identity, not a function to keep: carried along it would
  // make `none rotate(90deg)`, an invalid list the browser drops entirely.
  it('treats an existing none as no transform', () => {
    const setting = element('none')
    setTransformPart(setting, 'rotation', 'rotate(90deg)')
    expect(setting.style.transform).toBe('rotate(90deg)')

    const clearing = element('none')
    setTransformPart(clearing, 'raw', null)
    setTransformPart(clearing, 'raw', 'skewX(3deg)')
    expect(clearing.style.transform).toBe('skewX(3deg)')
  })

  it('stacks a raw function with an effect of the same kind', () => {
    const target = element()

    setTransformPart(target, 'raw', 'scale(2)')
    setTransformPart(target, 'scale', 'scale(3, 3)')

    expect(target.style.transform).toBe('scale(3, 3) scale(2)')
  })

  it('keeps the translateZ(0) compositing hint when an offset is set', () => {
    const target = element('translateZ(0)')

    setTransformPart(target, 'offset', 'translate(1px, 2px)')

    expect(target.style.transform).toBe('translateZ(0) translate(1px, 2px)')
  })

  it('keeps what another writer set between two of its writes', () => {
    const target = element()

    setTransformPart(target, 'rotation', 'rotate(10deg)')
    // Someone outside the composition appends to the value.
    target.style.transform = `${target.style.transform} perspective(50px)`
    setTransformPart(target, 'rotation', 'rotate(20deg)')

    expect(target.style.transform).toBe('perspective(50px) rotate(20deg)')
  })

  it('keeps a calc() argument inside its function', () => {
    const target = element('translate(calc(10% + 2px), 0px) skewY(3deg)')

    setTransformPart(target, 'rotation', 'rotate(10deg)')
    target.style.transform = `${target.style.transform} perspective(50px)`
    setTransformPart(target, 'rotation', 'rotate(20deg)')

    expect(target.style.transform).toBe(
      'translate(calc(10% + 2px), 0px) skewY(3deg) perspective(50px) rotate(20deg)'
    )
  })

  // One level of nesting was all a regex could hold; `calc()` around `max()`
  // around `var()` split the outer function apart and left an invalid list.
  it('keeps a function whose arguments nest to any depth', () => {
    const nested = 'translate(calc(100% - max(1px, var(--x))), 0px)'
    const target = element(`${nested} skewX(2deg)`)

    setTransformPart(target, 'rotation', 'rotate(90deg)')
    target.style.transform = `${target.style.transform} perspective(50px)`
    setTransformPart(target, 'rotation', 'rotate(20deg)')

    expect(target.style.transform).toBe(
      `${nested} skewX(2deg) perspective(50px) rotate(20deg)`
    )
  })

  it('drops an unclosed function rather than guessing where it ends', () => {
    const target = element('skewX(2deg) translate(calc(1px, 0px)')

    setTransformPart(target, 'rotation', 'rotate(90deg)')

    expect(target.style.transform).toBe('skewX(2deg) rotate(90deg)')
  })

  it('keeps separate state per element', () => {
    const first = element()
    const second = element()

    setTransformPart(first, 'rotation', 'rotate(10deg)')
    setTransformPart(second, 'scale', 'scale(2, 2)')

    expect(first.style.transform).toBe('rotate(10deg)')
    expect(second.style.transform).toBe('scale(2, 2)')
  })
})
