/**
 * The single LayoutModifier / AppearanceModifier
 *
 * `@tachui/modifiers` used to carry two further copies of these classes, and
 * the copies disagreed with core. Each test here pins the behavior the merged
 * class settled on:
 *
 * - `offset`, `aspectRatio`, `scaleEffect` and `zIndex` are not core's: the
 *   standalone modifiers in `@tachui/modifiers` apply them.
 * - `position` is absolute and follows signal coordinates.
 * - `layoutPriority` writes `--layout-priority` onto the element itself.
 * - Either `context.element` or `node.element` is enough to apply.
 * - Font `size` and `weight` follow signals, and an explicit `0` is kept.
 * - `role` and the navigation props are applied, not dropped.
 * - A numeric `flex` is unitless.
 * - Shadow and clip are not core's: `@tachui/modifiers` adds them.
 */

import { describe, expect, it } from 'vitest'
import { createRoot, createSignal, flushSync } from '../../src/reactive'
import type { ModifierContext } from '../../src/modifiers/types'
import {
  AppearanceModifier,
  BaseModifier,
  LayoutModifier,
} from '../../src/modifiers/base'
import {
  clipPathFor,
  clipPathForName,
  isShapeInstance,
} from '../../src/modifiers'

function makeContext(): ModifierContext & { element: HTMLElement } {
  const element = document.createElement('div')
  return { componentId: 'test', element, phase: 'creation' }
}

function applyLayout(props: object, context: ModifierContext): void {
  createRoot(() => {
    new LayoutModifier(props as any).apply(
      { element: context.element } as any,
      context
    )
  })
}

function applyAppearance(props: object, context: ModifierContext): void {
  createRoot(() => {
    new AppearanceModifier(props as any).apply(
      { element: context.element } as any,
      context
    )
  })
}

describe('LayoutModifier transform and stacking props', () => {
  // `.offset()`, `.aspectRatio()`, `.scaleEffect()` and `.zIndex()` are the
  // standalone modifiers in @tachui/modifiers; core's class writes none of them.
  it('ignores offset, aspectRatio, scaleEffect and zIndex', () => {
    const context = makeContext()
    applyLayout(
      {
        offset: { x: 4, y: 5 },
        aspectRatio: { ratio: 2, contentMode: 'fill' },
        scaleEffect: { x: 2 },
        zIndex: 3,
      },
      context
    )

    expect(context.element.style.transform).toBe('')
    expect(context.element.style.aspectRatio).toBe('')
    expect(context.element.style.objectFit).toBe('')
    expect(context.element.style.zIndex).toBe('')
  })
})

describe('LayoutModifier absolute position', () => {
  it('positions absolutely at static coordinates', () => {
    const context = makeContext()

    applyLayout({ position: { x: 10, y: '2rem' } }, context)

    expect(context.element.style.position).toBe('absolute')
    expect(context.element.style.left).toBe('10px')
    expect(context.element.style.top).toBe('2rem')
  })

  it('defaults a missing coordinate to zero', () => {
    const context = makeContext()

    applyLayout({ position: { x: 10 } }, context)

    expect(context.element.style.top).toBe('0px')
  })

  it('updates left and top from signals', () => {
    const context = makeContext()
    const [x, setX] = createSignal(1)
    const [y, setY] = createSignal(2)

    applyLayout({ position: { x, y } }, context)
    expect(context.element.style.position).toBe('absolute')
    expect(context.element.style.left).toBe('1px')
    expect(context.element.style.top).toBe('2px')

    setX(30)
    setY(40)
    flushSync()
    expect(context.element.style.left).toBe('30px')
    expect(context.element.style.top).toBe('40px')
  })
})

describe('LayoutModifier layoutPriority', () => {
  it('writes --layout-priority and the flex and z-index mapping onto the element', () => {
    const context = makeContext()

    applyLayout({ layoutPriority: 20 }, context)

    const { style } = context.element
    expect(style.getPropertyValue('--layout-priority')).toBe('20')
    expect(style.flexShrink).toBe('0')
    expect(style.flexGrow).toBe('2')
    expect(style.zIndex).toBe('20')
  })

  it('maps a zero priority to normal flex', () => {
    const context = makeContext()

    applyLayout({ layoutPriority: 0 }, context)

    const { style } = context.element
    expect(style.getPropertyValue('--layout-priority')).toBe('0')
    expect(style.flexShrink).toBe('1')
    expect(style.flexGrow).toBe('1')
  })

  it('maps a negative priority to shrink first', () => {
    const context = makeContext()

    applyLayout({ layoutPriority: -3 }, context)

    const { style } = context.element
    expect(style.getPropertyValue('--layout-priority')).toBe('-3')
    expect(style.flexShrink).toBe('3')
    expect(style.flexGrow).toBe('0')
    expect(style.zIndex).toBe('-3')
  })
})

describe('element guard', () => {
  it.each([
    ['LayoutModifier', () => new LayoutModifier({ padding: 4 } as any), 'padding', '4px'],
    ['AppearanceModifier', () => new AppearanceModifier({ opacity: 0.5 } as any), 'opacity', '0.5'],
  ] as const)('%s applies with only context.element', (_name, make, property, value) => {
    const element = document.createElement('div')

    make().apply({} as any, { componentId: 'test', element, phase: 'creation' })

    expect(element.style.getPropertyValue(property)).toBe(value)
  })

  it.each([
    ['LayoutModifier', () => new LayoutModifier({ padding: 4 } as any), 'padding', '4px'],
    ['AppearanceModifier', () => new AppearanceModifier({ opacity: 0.5 } as any), 'opacity', '0.5'],
  ] as const)('%s applies with only node.element', (_name, make, property, value) => {
    const element = document.createElement('div')

    make().apply({ element } as any, { componentId: 'test', phase: 'creation' })

    expect(element.style.getPropertyValue(property)).toBe(value)
  })

  it('does nothing with neither', () => {
    expect(
      new LayoutModifier({ padding: 4 } as any).apply({} as any, {
        componentId: 'test',
        phase: 'creation',
      })
    ).toBeUndefined()
  })
})

describe('AppearanceModifier font', () => {
  it('follows signal size and weight', () => {
    const context = makeContext()
    const [size, setSize] = createSignal(12)
    const [weight, setWeight] = createSignal<number | string>(400)

    applyAppearance({ font: { size, weight } }, context)
    expect(context.element.style.fontSize).toBe('12px')
    expect(context.element.style.fontWeight).toBe('400')

    setSize(18)
    setWeight('bold')
    flushSync()
    expect(context.element.style.fontSize).toBe('18px')
    expect(context.element.style.fontWeight).toBe('bold')
  })

  it('keeps an explicit zero size', () => {
    const context = makeContext()

    applyAppearance({ font: { size: 0 } }, context)

    expect(context.element.style.fontSize).toBe('0px')
  })

  it('keeps an explicit zero weight', () => {
    // jsdom rejects `font-weight: 0`, so a style target that records every
    // write stands in for the element.
    const written: Record<string, string> = {}
    const element = {
      style: {
        setProperty: (name: string, value: string) => {
          written[name] = value
        },
      },
      setAttribute: () => {},
    }

    new AppearanceModifier({ font: { weight: 0 } } as any).apply({} as any, {
      componentId: 'test',
      element: element as any,
      phase: 'creation',
    })

    expect(written['font-weight']).toBe('0')
  })
})

describe('AppearanceModifier attributes', () => {
  it('applies role and the navigation props', () => {
    const context = makeContext()
    const items = [{ title: 'Edit' }]

    applyAppearance(
      {
        role: 'navigation',
        navigationTitle: 'Inbox',
        navigationBarHidden: true,
        navigationBarItems: items,
      },
      context
    )

    const { element } = context
    expect(element.getAttribute('role')).toBe('navigation')
    expect(element.getAttribute('data-navigation-title')).toBe('Inbox')
    expect(element.getAttribute('data-navigation-bar-hidden')).toBe('true')
    expect(element.getAttribute('aria-hidden')).toBe('true')
    expect(element.getAttribute('data-navigation-bar-items')).toBe(
      JSON.stringify(items)
    )
  })

  it('leaves aria-hidden alone for a shown navigation bar', () => {
    const context = makeContext()

    applyAppearance({ navigationBarHidden: false }, context)

    expect(context.element.getAttribute('data-navigation-bar-hidden')).toBe('false')
    expect(context.element.hasAttribute('aria-hidden')).toBe(false)
  })
})

describe('numeric flex', () => {
  class StyleModifier extends BaseModifier<Record<string, unknown>> {
    readonly type = 'style-under-test'
    readonly priority = 0

    apply(_node: any, context: ModifierContext) {
      if (context.element) this.applyStyles(context.element, this.properties as any)
      return undefined
    }
  }

  it('serializes flex, flex-grow and flex-shrink without px', () => {
    const context = makeContext()

    new StyleModifier({ flex: 2, flexGrow: 3, flexShrink: 0 }).apply(
      {} as any,
      context
    )

    const { style } = context.element
    expect(style.getPropertyValue('flex-grow')).toBe('3')
    expect(style.getPropertyValue('flex-shrink')).toBe('0')
    expect(style.getPropertyValue('flex')).not.toContain('px')
    expect(style.getPropertyValue('flex')).toMatch(/^2\b/)
  })
})

describe('shadow and clip stay out of core', () => {
  it('ignores shadow, clipped and clipShape props', () => {
    const context = makeContext()

    applyAppearance(
      {
        shadow: { x: 1, y: 2, radius: 3, color: 'red' },
        clipped: true,
        clipShape: { shape: 'circle' },
      },
      context
    )

    expect(context.element.style.boxShadow).toBe('')
    expect(context.element.style.overflow).toBe('')
    expect(context.element.style.getPropertyValue('clip-path')).toBe('')
  })
})

describe('clipPathFor in core', () => {
  it('serializes the shape names', () => {
    expect(clipPathFor('circle')).toBe('circle()')
    expect(clipPathFor('ellipse', { radiusX: '30%', radiusY: '40%' })).toBe(
      'ellipse(30% 40% at center)'
    )
    expect(clipPathFor('rect', { inset: 8 })).toBe('inset(8px)')
    expect(clipPathFor('polygon', { points: '0% 0%, 100% 0%' })).toBe(
      'polygon(0% 0%, 100% 0%)'
    )
    expect(clipPathForName('polygon')).toBe('')
  })

  it('takes a shape instance through its own clipPath', () => {
    const shape = { path: () => '', clipPath: () => 'inset(0 round 4px)' }

    expect(isShapeInstance(shape)).toBe(true)
    expect(isShapeInstance('circle')).toBe(false)
    expect(clipPathFor(shape)).toBe('inset(0 round 4px)')
  })
})
