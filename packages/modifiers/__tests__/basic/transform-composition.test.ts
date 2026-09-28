/**
 * AnimationModifier and LayoutModifier exports compose transforms
 *
 * `AnimationModifier` and `LayoutModifier` are public three times over: in
 * `@tachui/core/modifiers`, in this package's root entry (`basic/base`), and
 * in its `@tachui/modifiers/base` subpath. All three are one class each,
 * re-exported from core. Constructed directly with `transform`, `offset`,
 * `scaleEffect` or `rotationEffect`, each writes through core's
 * `setTransformPart`, so none erases another's part on one element — the
 * factories' included.
 */

import { JSDOM } from 'jsdom'
import { beforeEach, describe, expect, it } from 'vitest'
import type { ModifierContext } from '@tachui/types/modifiers'
import {
  AnimationModifier as CoreAnimationModifier,
  LayoutModifier as CoreLayoutModifier,
} from '@tachui/core/modifiers'
import {
  AnimationModifier as BasicAnimationModifier,
  LayoutModifier as BasicLayoutModifier,
} from '../../src/basic/base'
import {
  AnimationModifier as FullAnimationModifier,
  LayoutModifier as FullLayoutModifier,
} from '../../src/base'
import { offset } from '../../src/layout/offset'
import { rotationEffect } from '../../src/basic/animation'

beforeEach(() => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost',
  })
  for (const k of [
    'document', 'window', 'Element', 'HTMLElement', 'DocumentFragment', 'Node',
  ]) {
    ;(globalThis as any)[k] =
      k === 'document' ? dom.window.document
      : k === 'window' ? dom.window
      : (dom.window as any)[k]
  }
})

function makeContext(): ModifierContext & { element: HTMLElement } {
  const element = document.createElement('div')
  document.body.appendChild(element)
  return { componentId: 'test', element, phase: 'creation' } as any
}

const apply = (modifier: { apply: Function }, context: ModifierContext) =>
  modifier.apply({ element: context.element } as any, context)

describe('transform composition', () => {
  it('has one AnimationModifier and one LayoutModifier behind every entry', () => {
    expect(BasicAnimationModifier).toBe(CoreAnimationModifier)
    expect(FullAnimationModifier).toBe(CoreAnimationModifier)
    expect(BasicLayoutModifier).toBe(CoreLayoutModifier)
    expect(FullLayoutModifier).toBe(CoreLayoutModifier)
  })

  it('keeps offset, scale and rotation when a raw transform follows', () => {
    const context = makeContext()

    apply(new CoreLayoutModifier({ offset: { x: 4, y: 5 } } as any), context)
    apply(
      new CoreLayoutModifier({
        scaleEffect: { x: 2, anchor: 'topLeading' },
      } as any),
      context
    )
    apply(
      new CoreAnimationModifier({
        rotationEffect: { angle: 90, anchor: 'bottomTrailing' },
      } as any),
      context
    )
    apply(new CoreAnimationModifier({ transform: 'skewX(3deg)' } as any), context)

    expect(context.element.style.transform).toBe(
      'translate(4px, 5px) ' +
        'translate(50%, 50%) rotate(90deg) translate(-50%, -50%) ' +
        'translate(-50%, -50%) scale(2, 2) translate(50%, 50%) ' +
        'skewX(3deg)'
    )
    expect(context.element.style.transformOrigin).toBe('')
  })

  // The composer lives in core, so a part core's own class writes and one a
  // factory from this package writes land in the same record.
  it('shares one record between core and this package', () => {
    const context = makeContext()

    apply(offset(4, 5), context)
    apply(
      new CoreAnimationModifier({ rotationEffect: { angle: 90 } } as any),
      context
    )
    apply(rotationEffect(45), context)
    apply(new CoreAnimationModifier({ transform: 'skewX(3deg)' }), context)

    expect(context.element.style.transform).toBe(
      'translate(4px, 5px) rotate(45deg) skewX(3deg)'
    )
  })
})
