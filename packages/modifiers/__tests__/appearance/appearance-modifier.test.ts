/**
 * Shadow and clip on `AppearanceModifier`
 *
 * Core's `AppearanceModifier` carries no shadow or clip branches; this
 * package's subclass adds them, and both base entries export that subclass.
 * These pin its output, and that the `clip-path` serializer this package has
 * always exported is core's.
 */

import { describe, expect, it } from 'vitest'
import * as core from '@tachui/core/modifiers'
import type { ModifierContext } from '@tachui/types/modifiers'
import { AppearanceModifier } from '../../src/appearance-modifier'
import { AppearanceModifier as SubpathAppearanceModifier } from '../../src/base'
import {
  clipPathFor,
  clipPathForName,
  isShapeInstance,
} from '../../src/appearance/clip-path'
import { clipShape } from '../../src/appearance/clip-shape'

function apply(props: object): HTMLElement {
  const element = document.createElement('div')
  const context: ModifierContext = {
    componentId: 'test',
    element,
    phase: 'creation',
  } as ModifierContext
  new AppearanceModifier(props as any).apply({ element } as any, context)
  return element
}

/**
 * Every style `Modifier` writes, by CSS name. jsdom's CSS parser drops
 * `box-shadow` set through `setProperty`, so a recording style target stands
 * in for the element.
 */
function recordedStyles(
  Modifier: typeof core.AppearanceModifier,
  props: object
): Record<string, string> {
  const written: Record<string, string> = {}
  const element = {
    style: {
      setProperty: (name: string, value: string) => {
        written[name] = value
      },
    },
    setAttribute: () => {},
  } as unknown as HTMLElement
  new Modifier(props as any).apply({ element } as any, {
    componentId: 'test',
    element,
    phase: 'creation',
  } as ModifierContext)
  return written
}

describe('AppearanceModifier subclass', () => {
  it('extends core AppearanceModifier', () => {
    expect(SubpathAppearanceModifier).toBe(AppearanceModifier)
    expect(Object.getPrototypeOf(AppearanceModifier)).toBe(
      core.AppearanceModifier
    )
  })

  it('keeps core branches', () => {
    const element = apply({ opacity: 0.5, role: 'note' })

    expect(element.style.opacity).toBe('0.5')
    expect(element.getAttribute('role')).toBe('note')
  })
})

describe('shadow', () => {
  it.each([
    [{ x: 1, y: 2, blur: 3, color: 'red' }, '1px 2px 3px red'],
    [{ x: 1, y: 2, radius: 4, color: 'red' }, '1px 2px 4px red'],
    [{ x: 1, y: 2, blur: 3, radius: 9, color: 'red' }, '1px 2px 3px red'],
    [{ x: 1, y: 2, blur: 3, spread: 5, color: 'red' }, '1px 2px 3px 5px red'],
    [{ radius: 6 }, '0px 0px 6px rgba(0,0,0,0.25)'],
  ])('writes %o as box-shadow', (shadow, expected) => {
    expect(recordedStyles(AppearanceModifier, { shadow })['box-shadow']).toBe(
      expected
    )
  })

  it('is not written by core', () => {
    expect(
      recordedStyles(core.AppearanceModifier, { shadow: { radius: 6 } })
    ).not.toHaveProperty('box-shadow')
  })
})

describe('clipped', () => {
  it('hides overflow', () => {
    expect(apply({ clipped: true }).style.overflow).toBe('hidden')
  })

  it('leaves overflow alone when false', () => {
    expect(apply({ clipped: false }).style.overflow).toBe('')
  })
})

describe('clip-path import path', () => {
  it('re-exports core serializer', () => {
    expect(clipPathFor).toBe(core.clipPathFor)
    expect(clipPathForName).toBe(core.clipPathForName)
    expect(isShapeInstance).toBe(core.isShapeInstance)
  })

  it('still backs the clipShape modifier', () => {
    const style: Record<string, string> = {}
    clipShape('ellipse', { radiusX: '30%', radiusY: '40%' }).apply(
      {} as any,
      {
        componentId: 'test',
        element: { style } as any,
        phase: 'creation',
      } as ModifierContext
    )

    expect(style.clipPath).toBe('ellipse(30% 40% at center)')
  })
})
